# Lunch a Go-Go — web app

The real food-truck tracking app: **two modes (foodie + food truck)**, chronological
feeds, two-way GPS, and free push notifications. Built to start at **$0/mo** and scale.

This lives in `app/`, separate from the marketing splash page at the repo root, so
the splash stays deployable on its own.

---

## Stack (and why)

| Layer          | Choice                                   | Why it fits a tight budget + "real" auth |
| -------------- | ---------------------------------------- | ---------------------------------------- |
| Frontend       | **SvelteKit** (Svelte 5) + PWA           | Tiny bundles, serverless deploy, service worker for push |
| Hosting        | **Cloudflare Pages** (`adapter-cloudflare`) | Free static + serverless functions, scales |
| Auth           | **Supabase Auth (GoTrue)**               | Battle-tested, audited. Not hand-rolled. bcrypt hashing, JWT sessions, PKCE |
| Database       | **Supabase Postgres + PostGIS**          | Real geo ("nearby trucks"), SQL, generous free tier |
| Authorization  | **Row-Level Security** on every table    | Rules enforced *in the DB* — a bug in app code can't leak data |
| Images         | **Supabase Storage** (public `media` bucket) | Bundled, simplest; swap to Cloudflare R2 later (see below) |
| Maps           | **Leaflet + OpenStreetMap**              | Free, no API key, no billing account |
| Notifications  | **Web Push (VAPID)** via a Supabase Edge Function | $0 forever; no SMS bills |

### Cost: $0 to start

- **Supabase Free**: 500 MB database, 1 GB file storage, 50k monthly active users, Edge Functions included.
- **Cloudflare Pages Free**: unlimited static requests, 100k serverless requests/day.
- **Web Push / Leaflet / OpenStreetMap**: free.
- First real bill is **Supabase Pro at $25/mo**, only once you outgrow the free tier — i.e. after you have real traction.

---

## Options you asked about

**Image + data hosting — start simple, swap when it grows:**
- *Now:* **Supabase Storage** — one integrated bill, RLS-scoped, 1 GB free. Already wired.
- *At scale:* **Cloudflare R2** — **zero egress fees** (huge once foodies are loading lots of photos), 10 GB free. To switch, upload to R2 from the same server actions and store the public URL; the rest of the app doesn't change because we only ever store a URL string.

**Notifications — Web Push now, SMS later if you want it:**
- *Now:* **Web Push** (implemented) — free, works on Android + installed iOS PWAs (16.4+). Covers "a truck you follow just went live / is near."
- *Optional upgrade:* **Twilio SMS** (~$0.008/text + ~$1.15/mo per number) or **Amazon SNS**. The notification layer is isolated in one Edge Function (`supabase/functions/notify`), so adding an SMS channel is additive — you don't touch the app.

**Frontend framework:** SvelteKit was chosen for small bundles + easy serverless. The whole thing ports to Next.js/React if you ever want the bigger ecosystem, but you'd trade bundle size and boilerplate.

---

## What's built

**Foodie**
- Sign up / log in (secure), pick role at signup
- **Nearby map** of live trucks (PostGIS radius search) + list with distances
- **Follow / unfollow** trucks
- **Chronological feed** of specials + check-ins from trucks you follow (no algorithm)
- **"Grab some grub"** check-in: photo + caption posted to the truck's feed, location fuzzed to ~1 km for privacy
- Free **push notifications** opt-in
- No comments; no foodie-to-foodie following (by design)

**Food truck**
- Dashboard with live status + follower / check-in / special counts
- **Go live** with GPS (precise — trucks *want* to be found), one live spot at a time
- **Menu** (permanent, sections, sold-out toggle)
- **Specials** (photo, price, optional expiry) → hits followers' feeds
- **Hours** (weekly)
- **Schedule** (future stops via date/time picker)
- **Patrons** — who grabs your grub, ranked by check-ins, with "follows" flag (the "who's a good investment" view). Two-way GPS: they find you, you learn your regulars.

---

## Setup

> **New to serverless hosting? Follow [`SETUP.md`](./SETUP.md) — the same steps, click by click.**

### 1. Create a Supabase project
Grab the **Project URL** and **anon key** from Project Settings → API.

### 2. Run the migrations
In the Supabase **SQL editor**, run in order:
1. `supabase/migrations/0001_init.sql` — tables, RLS, PostGIS, RPC functions
2. `supabase/migrations/0002_storage.sql` — the public `media` bucket + storage policies
3. `supabase/migrations/0003_security_hardening.sql` — DB-enforced identity/location on
   check-ins, one-truck-per-owner, clamped `nearby_trucks`, live+upcoming location reads

(Or with the Supabase CLI: `supabase db push`.)

### 3. Environment
```sh
cp .env.example .env
```
Fill in `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, and (for push) `PUBLIC_VAPID_PUBLIC_KEY`.

Generate a VAPID keypair once:
```sh
npx web-push generate-vapid-keys
```

### 4. Run
```sh
npm install
npm run dev
```

### 5. Deploy the push sender (optional but recommended — it's free)
```sh
supabase functions deploy notify
supabase secrets set \
  VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com
```
Without it, everything works except notifications (the app degrades gracefully).

### 6. Deploy the app (Netlify / Cloudflare Pages / Vercel)
Connect the repo, set the **base directory** to `app`, build command `npm run build`, and
add the `PUBLIC_*` env vars in the host dashboard. Set the Supabase Auth redirect URL to
`https://your-domain/auth/callback`. The app uses `adapter-auto`, so all three hosts work
with no code change. Full click-by-click walkthrough: [`SETUP.md`](./SETUP.md).

---

## Security notes (the "no vibecoded auth" part)

- **Auth is Supabase GoTrue**, not custom. Passwords are hashed server-side (bcrypt); we never see or store them.
- **Sessions are re-validated** on every request in `hooks.server.ts` via `getUser()` (calls the Auth server), not just by trusting the cookie.
- **Row-Level Security is on for every table**, deny-by-default. Writes are gated to the owner; foodies are private from each other; trucks can read their own patrons. Cross-user data access is blocked at the database, so an app bug can't leak it.
- **DB-enforced invariants** (migration `0003`) so a hostile client that skips the UI can't cheat: a `BEFORE INSERT` trigger sets a check-in's identity from `auth.uid()` and fuzzes its coordinates (no impersonation / precise-location leak); one truck per owner; `nearby_trucks` clamps radius/limit; public location reads are limited to live + upcoming. Note `role` is a UI mode, not a privilege boundary — access is gated by *ownership*, not role.
- **Storage** writes are scoped to `<uid>/…` paths; reads are public (feed photos). 5 MB cap, images only.
- **CSP** is managed by SvelteKit (`vite.config.ts`), plus `X-Frame-Options`, `nosniff`, `Referrer-Policy`, and a locked-down `Permissions-Policy` in `hooks.server.ts`.
- Server secrets (VAPID private key, service-role key) are **never** shipped to the browser and never used by the SvelteKit app — only by the Edge Function.

**Turn these on in the Supabase dashboard** (free, one click each):
- **Confirm email** (Authentication → Providers → Email) — code already handles the "check your email" flow.
- **Leaked-password protection** (Authentication → Policies) — rejects passwords found in breaches.
- Consider a **Cloudflare Turnstile** on signup if you see bot abuse (free).

---

## Data model

`profiles` (role: foodie|truck, private PII) · `trucks` (public) · `truck_locations`
(live + scheduled, PostGIS `geog`) · `menu_items` · `specials` · `truck_hours` ·
`follows` (foodie→truck; trucks may read their followers) · `checkins` (public feed,
name/avatar snapshotted, fuzzed coords) · `push_subscriptions` (private).

RPC: `nearby_trucks()`, `get_following_feed()` (chronological), `get_truck_patrons()` (owner-guarded).

### Scaling notes
- Nearby search uses a **GiST index** on `geog` — fine well beyond MVP.
- Proximity pings currently fire when a truck **goes live**. For continuous "truck moved near me" alerts at scale, add a scheduled job (Supabase `pg_cron` + the same `notify` function) that diffs follower locations against live trucks — additive, no schema change.
