-- =============================================================================
-- 0003 — security hardening (post red-team review)
--
-- Principle: the database must enforce every invariant the UI relies on, because
-- a hostile client talks to the Supabase API directly, not through our forms.
-- Run this in the Supabase SQL editor after 0001 and 0002.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- #2 (impersonation) + #1 (location privacy): check-ins.
-- Derive identity from auth.uid() and fuzz coordinates in the DB, ignoring any
-- client-supplied actor_name / actor_avatar / precise lat,lng.
-- ---------------------------------------------------------------------------
create or replace function public.tg_checkin_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare prof record;
begin
  -- Identity is the authenticated user, not whatever the client claimed.
  new.foodie_id := auth.uid();
  select display_name, avatar_url into prof from public.profiles where id = auth.uid();
  new.actor_name := coalesce(prof.display_name, 'Foodie');
  new.actor_avatar := prof.avatar_url;

  -- Fuzz to ~neighborhood (2 decimals ≈ 1.1 km). The precise value is never stored.
  if new.lat is not null then new.lat := round(new.lat::numeric, 2); end if;
  if new.lng is not null then new.lng := round(new.lng::numeric, 2); end if;

  return new;
end $$;

drop trigger if exists checkin_guard on public.checkins;
create trigger checkin_guard
  before insert on public.checkins
  for each row execute function public.tg_checkin_guard();

-- ---------------------------------------------------------------------------
-- #5 (spam): one truck per owner. The app already assumes this (.limit(1)).
-- If this errors with a unique_violation, an owner already has duplicate trucks
-- that must be removed before the constraint can be added.
-- ---------------------------------------------------------------------------
do $$ begin
  alter table public.trucks add constraint trucks_owner_unique unique (owner_id);
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- #3 (over-exposure): don't publicly serve stale/historical locations. The
-- public sees only what is live now or scheduled ahead; the owner still sees
-- their full history (for editing schedules).
-- ---------------------------------------------------------------------------
drop policy if exists "locations: public read" on public.truck_locations;
create policy "locations: public read"
  on public.truck_locations for select
  using (is_live = true or starts_at > now() or public.owns_truck(truck_id));

-- ---------------------------------------------------------------------------
-- #6 (resource exhaustion): clamp nearby_trucks inputs. Same signature and
-- return shape as 0001, so existing grants and app typing are unchanged.
-- ---------------------------------------------------------------------------
create or replace function public.nearby_trucks(
  p_lat float8, p_lng float8, p_radius_m float8 default 8000, p_limit int default 50
)
returns table (
  truck_id uuid, name text, slug text, logo_url text, cuisine text,
  lat float8, lng float8, address text, distance_m float8, last_seen timestamptz
)
language sql stable security definer set search_path = public, extensions as $$
  with here as (
    select extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography as g
  ),
  bounds as (
    select least(greatest(coalesce(p_radius_m, 8000), 100), 50000) as r,
           least(greatest(coalesce(p_limit, 50), 1), 100) as lim
  ),
  live as (
    select distinct on (l.truck_id)
      l.truck_id, l.lat, l.lng, l.address, l.geog, l.created_at
    from public.truck_locations l
    where l.is_live = true
    order by l.truck_id, l.created_at desc
  )
  select t.id, t.name, t.slug, t.logo_url, t.cuisine,
         live.lat, live.lng, live.address,
         extensions.st_distance(live.geog, here.g) as distance_m,
         live.created_at as last_seen
  from live
  cross join here
  cross join bounds
  join public.trucks t on t.id = live.truck_id
  where extensions.st_dwithin(live.geog, here.g, bounds.r)
  order by distance_m asc
  limit (select lim from bounds);
$$;
