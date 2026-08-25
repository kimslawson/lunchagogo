# Setup & Deploy — Lunch a Go-Go (Option B: static SPA on CloudCannon)

This is the **static** build — plain files, no server. One CloudCannon site serves your
splash at the root (`lunchagogo.app`) and the app under `/app` (`lunchagogo.app/app`),
with already-signed-in visitors bounced to the app. You still need a **Supabase** account
(the backend that runs itself). Budget: **~20 minutes, $0**.

> Same backend and features as Option A; only the hosting differs. If you want the
> more-hardened server-side-session version, use branch `claude/lunchagogo-webapp-bilao2`.

---

## Part 1 — Supabase (the backend)

### 1a. Make the project
1. **supabase.com** → **Start your project** → sign in with GitHub.
2. **New project.** Name it `lunchagogo`, set a database password (save it), pick the
   nearest region, **Create**. Wait ~2 minutes.

### 1b. Create the tables
1. Left sidebar → **SQL Editor** → **New query**.
2. Copy all of `app/supabase/migrations/0001_init.sql`, paste, **Run** (expect "Success").
3. New query → do the same with `app/supabase/migrations/0002_storage.sql` → **Run**.
4. New query → do the same with `app/supabase/migrations/0003_security_hardening.sql` → **Run**
   (DB-enforced identity, location fuzzing, one-truck-per-owner, query limits).

### 1c. Grab your keys (Supabase moved these recently)
- **Project URL:** click the green **Connect** button (top bar), or **Project
  Settings → Data API**. It's just your **Project ID** (Settings → General) as
  `https://<project-id>.supabase.co`.
- **API key:** **Project Settings → API Keys** → the **Publishable and secret**
  tab → copy the **Publishable key** (`sb_publishable_…`). Browser-safe; RLS guards
  your data. *(The older **anon** key under the **Legacy** tab also works — same
  role, older format.)*
  - Do **not** use the **Secret** key (`sb_secret_…`) / service_role in the app —
    those bypass RLS and are only for the push Edge Function (Part 6).

### 1d. Auth settings (free, recommended)
- **Authentication → Providers → Email**: **Confirm email** ON.
- **Authentication → Policies/Settings**: enable **leaked-password protection**.
- **Authentication → URL Configuration**: you'll set your live URL in Part 4.

---

## Part 2 — Web Push keys (optional, free)
```sh
npx web-push generate-vapid-keys
```
Keep the **public** and **private** keys for Part 3 and Part 6.

---

## Part 3 — Run it locally first
```sh
git clone https://github.com/kimslawson/lunchagogo.git
cd lunchagogo/app
git checkout claude/lunchagogo-webapp-static
cp .env.example .env
```
Edit `.env`:
```
PUBLIC_SUPABASE_URL="https://<project-id>.supabase.co"
PUBLIC_SUPABASE_ANON_KEY="sb_publishable_...  (or the legacy anon key)"
PUBLIC_VAPID_PUBLIC_KEY="...VAPID public key (or leave placeholder)..."
```
Then:
```sh
npm install
npm run dev
```
Open the printed URL, make a truck account and a foodie account, click around.

### Make the combined site
```sh
npm run build
```
This builds the app (under a `/app` base path) and assembles **`app/_site/`** — your
splash at the root **plus** the app under `/app`:
```
app/_site/            your splash (index.html, css/, js/, img/, …) → the root domain
app/_site/app/        the SvelteKit app       → lunchagogo.app/app
app/_site/_redirects  SPA routing for /app/*
app/_site/_headers    security headers
```
`app/_site` is the whole thing to publish. **Your splash now lives on this branch** —
edit it at the repo root and it ships with the next build.

---

## Part 4 — Deploy to CloudCannon (splash at /, app at /app — ONE site)

A single site serves both. Point your existing `lunchagogo.app` CloudCannon site at this
branch (or make a new site and move the domain to it).

### Option 1 — Let CloudCannon build it (auto-deploys on every push) ✅ recommended
1. **Site → Connect** the `lunchagogo` repo; **Branch:** `claude/lunchagogo-webapp-static`.
2. **Site Settings → Builds → Configuration:**
   - **Static site generator: `Custom`.** ⚠️ Not "SvelteKit" (that preset runs
     `@cloudcannon/reader` and expects a root-level SvelteKit app; we ship a finished
     static build instead).
   - **Build command:** `cd app && npm install && npm run build`
   - **Output path:** `app/_site`   ← the combined splash + app
   - **Environment variables** (Advanced options): `PUBLIC_SUPABASE_URL`,
     `PUBLIC_SUPABASE_ANON_KEY`, `PUBLIC_VAPID_PUBLIC_KEY`. ⚠️ Build fails without them.
   - **Node version** (if shown): 20 or 22.
3. **Save** → build. Every push rebuilds. `app/_site` already contains your splash,
   `_redirects`, and `_headers`.

> *(If the build ends with `ls: cannot access '<x>'`, the Output path is wrong — it must
> be `app/_site`.)*

### Option 2 — Build locally, upload the folder
`npm run build`, then publish the **contents of `app/_site/`** (drag onto Netlify's manual
deploy, or upload to CloudCannon). Re-build and re-upload on each change.

### Tell Supabase your live URL
Supabase → **Authentication → URL Configuration:**
- **Site URL:** `https://lunchagogo.app`
- **Redirect URLs:** add `https://lunchagogo.app/app/auth/callback`  ← note the **/app**.

---

## Part 5 — How the split works

- **`lunchagogo.app/`** → your splash. A tiny script in its `index.html` checks the
  browser for a saved Supabase session and, if you're already signed in, sends you to
  `/app`. First-time visitors just see the splash.
- **`lunchagogo.app/app`** → the app (built with a `/app` base path).
- Deep links like `/app/trucks/taco-truck` work because `_redirects` serves the app shell
  for any `/app/*` path. (Existing files — assets, images — are served directly first.)

> Want the splash's own buttons to open the app? Point them at `/app/signup` or `/app`.
> Logging out of the app drops you back at the splash root.

---

## Part 6 — Push notifications (optional, free)
Needs the [Supabase CLI](https://supabase.com/docs/guides/cli). **Run these from the
`app/` folder** — it holds `supabase/config.toml`, which tells the CLI this is the
project root (otherwise it searches up your filesystem and can't find the function):
```sh
cd app                       # the folder with supabase/config.toml — run CLI commands here
supabase login               # one-time per machine: opens a browser to authorize the CLI
supabase link --project-ref YOUR-PROJECT-REF
supabase functions deploy notify
supabase secrets set \
  VAPID_PUBLIC_KEY="...public..." \
  VAPID_PRIVATE_KEY="...private..." \
  VAPID_SUBJECT="mailto:getlunchagogo@gmail.com"
```
The app calls this function from the browser when a truck goes live. Without it,
everything else still works.

> **`supabase login` first.** `link`/`deploy` need the CLI authorized on your machine;
> being signed into supabase.com in your browser isn't the same thing. Log in once and
> the token is saved locally.
>
> **"Entrypoint path does not exist" / "no such file" on deploy?** You're not in the
> `app/` folder (the one with `supabase/config.toml`), or the CLI found a different
> `supabase/` project higher up. `cd` into `app` and re-run. Docker does **not** need to
> be running — the "Docker is not running" warning is harmless for `deploy`.

---

## Custom domain (e.g. `app.lunchagogo.app`)
Point a subdomain at your app's CloudCannon site (CloudCannon → Domains), keeping the
splash at `lunchagogo.app`. Then add that subdomain to Supabase's **Redirect URLs**.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Blank page / build fails on missing `PUBLIC_SUPABASE_URL` | Set the three env vars (CloudCannon build settings, or `.env` locally). |
| Refreshing a deep link 404s | Host isn't doing SPA fallback — see Part 5. |
| Login works, refresh logs me out | Supabase **Site URL / Redirect URLs** don't match your live URL. |
| Photos won't upload | Re-run `0002_storage.sql`; confirm a **media** bucket exists. |
| No push notifications | Part 6 not done, or user didn't tap "Turn on notifications" in **Me**. iOS needs the app added to the home screen first. |
| Map blank | Allow **location** when asked; try a bigger radius. |

Architecture & the A-vs-B security tradeoff: [`README.md`](./README.md).
