# Lunch a Go-Go — web app (Option B: static SPA)

> **This branch is the static-SPA build**, meant to be hosted on **CloudCannon**
> (or any static host) right alongside your splash page — no serverless functions.
> The hardened, server-side-session version lives on branch
> **`claude/lunchagogo-webapp-bilao2`** (Option A). Same features, same backend;
> they differ only in where auth/session handling runs. See "Which one?" below.

The food-truck tracking app: **two modes (foodie + food truck)**, chronological
feeds, two-way GPS, free push notifications. Starts at **$0/mo**.

Lives in `app/`, separate from the marketing splash at the repo root.

---

## Which one? (A vs B)

| | **A — `…-bilao2`** | **B — this branch** |
| --- | --- | --- |
| Build | SvelteKit + tiny serverless functions | **100% static files** |
| Hosts on | Netlify / Cloudflare Pages / Vercel | **CloudCannon**, Netlify, GitHub Pages… |
| Auth/session | handled server-side (a server boundary to harden) | handled in the browser |
| Session token | in cookies, server-set | in the browser (localStorage) |
| Your **data** | protected by database RLS | **protected by database RLS** (same) |
| Best when | you want max hardening | you want dead-simple static hosting |

Both are genuinely usable. B's tradeoff: if the app ever had an XSS bug, the
session token is reachable by page JS — so an attacker could hijack *that one
user's* session. Your data stays protected either way, because Postgres Row-Level
Security enforces access no matter where the request comes from.

---

## Stack

| Layer | Choice |
| --- | --- |
| Frontend | **SvelteKit → static** (`adapter-static`, SPA) + PWA |
| Hosting | **CloudCannon** / any static host (just serves files) |
| Auth | **Supabase Auth** (GoTrue), PKCE flow, in the browser |
| Database | **Supabase Postgres + PostGIS** |
| Authorization | **Row-Level Security** on every table (this is what protects data) |
| Images | **Supabase Storage** (public `media` bucket) |
| Maps | **Leaflet + OpenStreetMap** (free) |
| Notifications | **Web Push** via a Supabase Edge Function (free) |

**Cost: $0 to start** — Supabase free tier + free static hosting + free push.

---

## What's built

Everything Option A has — foodie map/feed/follow/check-in/push, and truck
go-live/menu/specials/hours/schedule/patrons — just with the data and auth calls
running in the browser via `supabase-js`. UI, database, and the push Edge Function
are identical.

---

## Setup

> **Follow [`SETUP.md`](./SETUP.md) for the click-by-click CloudCannon walkthrough.**

Short version:
1. Create a Supabase project; run `supabase/migrations/0001_init.sql` then `0002_storage.sql`.
2. `cp .env.example .env` and fill `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`,
   `PUBLIC_VAPID_PUBLIC_KEY`.
3. `npm install && npm run dev` to try locally.
4. `npm run build` → the `build/` folder is a complete static site. Host it (CloudCannon,
   Netlify drag-drop, anywhere).
5. (Optional, free) deploy the `notify` Edge Function for push — see `SETUP.md`.

---

## Security notes

- **Auth is Supabase GoTrue**, not hand-rolled. Passwords hashed server-side (bcrypt).
- **Row-Level Security on every table**, deny-by-default — the real guard on your data,
  and identical to Option A.
- **Storage** writes scoped to `<uid>/…`; images only, 5 MB cap.
- **Security headers** ship in `static/_headers` (CloudCannon/Netlify honor it); CSP is
  emitted as a `<meta>` tag.
- The session token lives in the browser here (that's the A-vs-B difference above). If
  that matters for your threat model, deploy Option A instead — same repo, other branch.

**Turn on in Supabase (free):** Confirm email, and leaked-password protection.

---

## Data model & scaling

Same as Option A — see the schema in `supabase/migrations/0001_init.sql`
(`profiles`, `trucks`, `truck_locations` with PostGIS, `menu_items`, `specials`,
`truck_hours`, `follows`, `checkins`, `push_subscriptions`) and the RPCs
`nearby_trucks`, `get_following_feed`, `get_truck_patrons`.
