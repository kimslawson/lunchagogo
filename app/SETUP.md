# Setup & Deploy — Lunch a Go-Go (Option B: static SPA on CloudCannon)

This is the **static** build — plain files, no server — so it hosts on CloudCannon
right next to your splash page. You still need a **Supabase** account (the backend
that runs itself). Budget: **~20 minutes, $0**.

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

### Make the static files
```sh
npm run build
```
This produces **`app/build/`** — a complete static website (`index.html`, `404.html`,
`_app/`, fonts, images, `_headers`, `_redirects`). That folder is the whole app.

---

## Part 4 — Deploy to CloudCannon (alongside your splash)

Your splash is one CloudCannon **site**; the app becomes a **second site** on the same
repo, different branch. Two ways — pick whichever feels comfortable.

### Option 1 — Let CloudCannon build it (auto-deploys on every push) ✅ recommended
1. **Create Site → Connect** your `lunchagogo` repo; **Branch:** `claude/lunchagogo-webapp-static`.
2. **Site Settings → Builds → Configuration:**
   - **Static site generator: SvelteKit.** (CloudCannon's SvelteKit support is built
     around `adapter-static`, which this app uses — so it's the right pick, not
     "Static" or "Custom.")
   - **Output path:** `app/build` — where the built site lands.
   - **The subfolder:** the app lives in `app/` (your splash is at the repo root) and
     CloudCannon builds from the root. So EITHER set the site's **source / base path**
     to `app`, OR set the build command to `cd app && npm install && npm run build`.
   - **Environment variables** (Advanced options): add the three `PUBLIC_…` vars —
     `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `PUBLIC_VAPID_PUBLIC_KEY`.
     ⚠️ **The build fails without these** (`PUBLIC_SUPABASE_URL is not exported`).
   - **Node version** (Advanced options, if shown): 20 or 22.
3. **Save**, then trigger a build. Every push to this branch rebuilds.

> **Custom fallback** — if the SvelteKit preset fights the subfolder, set the SSG to
> **Custom** and spell it out:
> Install `cd app && npm install` · Build `cd app && npm run build` · Output `app/build`.
>
> *(CloudCannon's exact field labels move around; if the Node build fights you at all,
> Option 2 below always works.)*

### Option 2 — Build locally, upload the folder (the FTP-feeling way)
1. `npm run build` (Part 3).
2. Put the **contents of `app/build/`** wherever you host static files:
   - **CloudCannon:** create a site from a folder / upload the `build` contents, or
   - **Netlify:** drag the `app/build` folder onto **netlify.com → Add new site →
     Deploy manually**. Instant URL, no account fuss.
3. Re-build and re-upload whenever you change the app.

### Tell Supabase your live URL
Supabase → **Authentication → URL Configuration**:
- **Site URL:** your app's URL.
- **Redirect URLs:** add `https://YOUR-APP-URL/auth/callback`.

---

## Part 5 — SPA routing note (important for static hosts)

Because this is a single-page app, the host must serve the app shell for *any* path
(so refreshing on `/trucks/taco-truck` works). This repo already handles it two ways:
- **`static/_redirects`** (`/* /index.html 200`) — CloudCannon & Netlify honor this.
- **`build/404.html`** — a copy of the shell, for hosts that fall back to 404.

If deep links 404 on refresh, make sure your host is serving `index.html` (or `404.html`)
for unknown routes — that's the one static-host gotcha.

---

## Part 6 — Push notifications (optional, free)
Needs the [Supabase CLI](https://supabase.com/docs/guides/cli):
```sh
cd app
supabase link --project-ref YOUR-PROJECT-REF
supabase functions deploy notify
supabase secrets set \
  VAPID_PUBLIC_KEY="...public..." \
  VAPID_PRIVATE_KEY="...private..." \
  VAPID_SUBJECT="mailto:getlunchagogo@gmail.com"
```
The app calls this function from the browser when a truck goes live. Without it,
everything else still works.

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
