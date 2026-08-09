-- =============================================================================
-- Lunch a Go-Go — initial schema
-- Postgres + PostGIS on Supabase. Security is enforced at the database layer
-- with Row-Level Security (RLS): every table denies by default and grants are
-- explicit. App code cannot bypass these rules.
--
-- Run this in the Supabase SQL editor (or `supabase db push`).
-- =============================================================================

create extension if not exists postgis with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('foodie', 'truck');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- profiles — one row per auth user. PII (zip, phone) is readable ONLY by self.
-- Foodies are private from each other: there is no public read on this table.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  role         public.user_role not null default 'foodie',
  display_name text not null default 'Foodie',
  avatar_url   text,
  home_zip     text,
  phone        text,
  push_opt_in  boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.tg_set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles: self read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: self insert"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: self update"
  on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-provision a profile when an auth user is created. Role + name come from
-- the signUp metadata (options.data). SECURITY DEFINER so it can write the row.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, display_name, home_zip)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'foodie'),
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'Foodie'),
    nullif(new.raw_user_meta_data ->> 'home_zip', '')
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- trucks — public discovery objects. Only the owner can write.
-- ---------------------------------------------------------------------------
create table if not exists public.trucks (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles (id) on delete cascade,
  name       text not null,
  slug       text not null unique,
  bio        text,
  cuisine    text,
  logo_url   text,
  phone      text,
  website    text,
  instagram  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists trucks_owner_idx on public.trucks (owner_id);

create trigger set_trucks_updated_at
  before update on public.trucks
  for each row execute function public.tg_set_updated_at();

alter table public.trucks enable row level security;

create policy "trucks: public read"
  on public.trucks for select using (true);

create policy "trucks: owner insert"
  on public.trucks for insert
  with check (owner_id = auth.uid());

create policy "trucks: owner update"
  on public.trucks for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "trucks: owner delete"
  on public.trucks for delete
  using (owner_id = auth.uid());

-- Helper: does the current user own this truck? Used by child-table policies.
-- SECURITY DEFINER + locked search_path so it reads trucks without recursing
-- into RLS on the caller side.
create or replace function public.owns_truck(p_truck_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.trucks
    where id = p_truck_id and owner_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- truck_locations — current live spot + scheduled future stops (calendar).
-- A row is "live now" when is_live = true. Future stops carry starts_at/ends_at.
-- geog is maintained from lat/lng by trigger and GiST-indexed for fast "nearby".
-- ---------------------------------------------------------------------------
create table if not exists public.truck_locations (
  id         uuid primary key default gen_random_uuid(),
  truck_id   uuid not null references public.trucks (id) on delete cascade,
  label      text,
  address    text,
  -- nullable: a scheduled future stop may not have a pin yet; a live spot does.
  lat        double precision,
  lng        double precision,
  geog       extensions.geography(Point, 4326),
  is_live    boolean not null default false,
  starts_at  timestamptz,
  ends_at    timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.tg_set_geog()
returns trigger language plpgsql set search_path = extensions, public as $$
begin
  if new.lat is not null and new.lng is not null then
    new.geog := extensions.st_setsrid(extensions.st_makepoint(new.lng, new.lat), 4326)::extensions.geography;
  else
    new.geog := null;
  end if;
  return new;
end $$;

create trigger set_truck_locations_geog
  before insert or update of lat, lng on public.truck_locations
  for each row execute function public.tg_set_geog();

create index if not exists truck_locations_truck_idx on public.truck_locations (truck_id, created_at desc);
create index if not exists truck_locations_geog_idx on public.truck_locations using gist (geog);
create index if not exists truck_locations_schedule_idx on public.truck_locations (starts_at);

alter table public.truck_locations enable row level security;

create policy "locations: public read"
  on public.truck_locations for select using (true);

create policy "locations: owner insert"
  on public.truck_locations for insert with check (public.owns_truck(truck_id));

create policy "locations: owner update"
  on public.truck_locations for update
  using (public.owns_truck(truck_id)) with check (public.owns_truck(truck_id));

create policy "locations: owner delete"
  on public.truck_locations for delete using (public.owns_truck(truck_id));

-- ---------------------------------------------------------------------------
-- menu_items — permanent menu
-- ---------------------------------------------------------------------------
create table if not exists public.menu_items (
  id           uuid primary key default gen_random_uuid(),
  truck_id     uuid not null references public.trucks (id) on delete cascade,
  section      text not null default 'Menu',
  name         text not null,
  description  text,
  price        numeric(8,2),
  is_available boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists menu_items_truck_idx on public.menu_items (truck_id, sort_order);

alter table public.menu_items enable row level security;

create policy "menu: public read" on public.menu_items for select using (true);
create policy "menu: owner insert" on public.menu_items for insert with check (public.owns_truck(truck_id));
create policy "menu: owner update" on public.menu_items for update using (public.owns_truck(truck_id)) with check (public.owns_truck(truck_id));
create policy "menu: owner delete" on public.menu_items for delete using (public.owns_truck(truck_id));

-- ---------------------------------------------------------------------------
-- specials — time-boxed features that show on the feed
-- ---------------------------------------------------------------------------
create table if not exists public.specials (
  id           uuid primary key default gen_random_uuid(),
  truck_id     uuid not null references public.trucks (id) on delete cascade,
  title        text not null,
  description  text,
  price        numeric(8,2),
  photo_url    text,
  active_until timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists specials_truck_idx on public.specials (truck_id, created_at desc);

alter table public.specials enable row level security;

create policy "specials: public read" on public.specials for select using (true);
create policy "specials: owner insert" on public.specials for insert with check (public.owns_truck(truck_id));
create policy "specials: owner update" on public.specials for update using (public.owns_truck(truck_id)) with check (public.owns_truck(truck_id));
create policy "specials: owner delete" on public.specials for delete using (public.owns_truck(truck_id));

-- ---------------------------------------------------------------------------
-- truck_hours — regular weekly schedule (0 = Sunday .. 6 = Saturday)
-- ---------------------------------------------------------------------------
create table if not exists public.truck_hours (
  id          uuid primary key default gen_random_uuid(),
  truck_id    uuid not null references public.trucks (id) on delete cascade,
  day_of_week int  not null check (day_of_week between 0 and 6),
  open_time   time,
  close_time  time,
  is_closed   boolean not null default false,
  unique (truck_id, day_of_week)
);

alter table public.truck_hours enable row level security;

create policy "hours: public read" on public.truck_hours for select using (true);
create policy "hours: owner insert" on public.truck_hours for insert with check (public.owns_truck(truck_id));
create policy "hours: owner update" on public.truck_hours for update using (public.owns_truck(truck_id)) with check (public.owns_truck(truck_id));
create policy "hours: owner delete" on public.truck_hours for delete using (public.owns_truck(truck_id));

-- ---------------------------------------------------------------------------
-- follows — a foodie subscribes to a truck.
-- Foodies manage their own follows. Trucks may READ their followers
-- (the "know who's a good investment" / two-way GPS value exchange).
-- Foodies cannot see other foodies' follows.
-- ---------------------------------------------------------------------------
create table if not exists public.follows (
  id         uuid primary key default gen_random_uuid(),
  foodie_id  uuid not null references public.profiles (id) on delete cascade,
  truck_id   uuid not null references public.trucks (id) on delete cascade,
  notify     boolean not null default true,
  created_at timestamptz not null default now(),
  unique (foodie_id, truck_id)
);
create index if not exists follows_foodie_idx on public.follows (foodie_id);
create index if not exists follows_truck_idx on public.follows (truck_id);

alter table public.follows enable row level security;

create policy "follows: foodie or truck-owner read"
  on public.follows for select
  using (foodie_id = auth.uid() or public.owns_truck(truck_id));

create policy "follows: foodie insert"
  on public.follows for insert with check (foodie_id = auth.uid());

create policy "follows: foodie update"
  on public.follows for update
  using (foodie_id = auth.uid()) with check (foodie_id = auth.uid());

create policy "follows: foodie delete"
  on public.follows for delete using (foodie_id = auth.uid());

-- ---------------------------------------------------------------------------
-- checkins — "Grab some grub". A foodie posts a photo to a truck's feed.
-- Display name + avatar are SNAPSHOTTED here so the public feed never has to
-- read the private profiles table. No comments table exists, by design.
-- ---------------------------------------------------------------------------
create table if not exists public.checkins (
  id            uuid primary key default gen_random_uuid(),
  foodie_id     uuid not null references public.profiles (id) on delete cascade,
  truck_id      uuid not null references public.trucks (id) on delete cascade,
  actor_name    text not null,
  actor_avatar  text,
  photo_url     text,
  caption       text,
  lat           double precision,  -- fuzzed to ~2 decimals before insert
  lng           double precision,
  created_at    timestamptz not null default now()
);
create index if not exists checkins_truck_idx on public.checkins (truck_id, created_at desc);
create index if not exists checkins_foodie_idx on public.checkins (foodie_id, created_at desc);

alter table public.checkins enable row level security;

-- Check-ins are the public social feed content (name + photo + fuzzed spot).
create policy "checkins: public read" on public.checkins for select using (true);
create policy "checkins: foodie insert" on public.checkins for insert with check (foodie_id = auth.uid());
create policy "checkins: foodie delete" on public.checkins for delete using (foodie_id = auth.uid());

-- ---------------------------------------------------------------------------
-- push_subscriptions — Web Push endpoints. Strictly private to the user.
-- ---------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
create index if not exists push_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "push: self read"   on public.push_subscriptions for select using (user_id = auth.uid());
create policy "push: self insert" on public.push_subscriptions for insert with check (user_id = auth.uid());
create policy "push: self delete" on public.push_subscriptions for delete using (user_id = auth.uid());

-- =============================================================================
-- RPC functions (called from the app via supabase.rpc)
-- =============================================================================

-- Nearby live trucks, ordered by distance. Uses the GiST index on geog.
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
  join public.trucks t on t.id = live.truck_id
  where extensions.st_dwithin(live.geog, here.g, p_radius_m)
  order by distance_m asc
  limit p_limit;
$$;

-- Chronological home feed (NO algorithm) for the trucks the caller follows.
-- Unifies specials + check-ins. Paginate with p_before (created_at cursor).
create or replace function public.get_following_feed(
  p_limit int default 30, p_before timestamptz default now()
)
returns table (
  item_type text, item_id uuid,
  truck_id uuid, truck_name text, truck_slug text, truck_logo text,
  actor_name text, actor_avatar text,
  title text, body text, photo_url text, price numeric,
  created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  with followed as (
    select truck_id from public.follows where foodie_id = auth.uid()
  )
  select 'special' as item_type, s.id as item_id,
         t.id, t.name, t.slug, t.logo_url,
         null::text as actor_name, null::text as actor_avatar,
         s.title, s.description as body, s.photo_url, s.price,
         s.created_at
  from public.specials s
  join public.trucks t on t.id = s.truck_id
  where s.truck_id in (select truck_id from followed) and s.created_at < p_before
  union all
  select 'checkin' as item_type, c.id as item_id,
         t.id, t.name, t.slug, t.logo_url,
         c.actor_name, c.actor_avatar,
         null::text as title, c.caption as body, c.photo_url, null::numeric as price,
         c.created_at
  from public.checkins c
  join public.trucks t on t.id = c.truck_id
  where c.truck_id in (select truck_id from followed) and c.created_at < p_before
  order by created_at desc
  limit p_limit;
$$;

-- Patron analytics for a truck owner. Guarded: only the owner may read.
-- "Know who's a good investment" — most frequent grubbers + whether they follow.
create or replace function public.get_truck_patrons(p_truck_id uuid)
returns table (
  foodie_id uuid, name text, avatar_url text,
  checkins bigint, first_checkin timestamptz, last_checkin timestamptz,
  follows boolean
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.owns_truck(p_truck_id) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return query
    select c.foodie_id,
           max(c.actor_name)   as name,
           max(c.actor_avatar) as avatar_url,
           count(*)            as checkins,
           min(c.created_at)   as first_checkin,
           max(c.created_at)   as last_checkin,
           exists (select 1 from public.follows f
                   where f.truck_id = p_truck_id and f.foodie_id = c.foodie_id) as follows
    from public.checkins c
    where c.truck_id = p_truck_id
    group by c.foodie_id
    order by checkins desc, last_checkin desc;
end $$;

grant execute on function public.nearby_trucks(float8, float8, float8, int) to anon, authenticated;
grant execute on function public.get_following_feed(int, timestamptz) to authenticated;
grant execute on function public.get_truck_patrons(uuid) to authenticated;
