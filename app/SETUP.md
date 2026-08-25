# Setup & Deploy — Lunch a Go-Go (Option A: hardened / serverless)

Plain-English, click-by-click. You need **two free accounts** — Supabase (the
backend) and a frontend host (Netlify recommended). No servers to manage, no FTP.
Budget: **~20 minutes**, **$0**.

Nothing here is hosted by you in the old sense — Supabase is an account that runs
itself, and the host auto-deploys from GitHub every time code is pushed.

---

## Part 1 — Supabase (the backend)

### 1a. Make the project
1. Go to **supabase.com** → **Start your project** → sign in with GitHub.
2. **New project.** Name it `lunchagogo`. Pick a **database password** (save it in your
   password manager — you rarely need it, but don't lose it). Choose the region closest
   to your trucks. Click **Create new project** and wait ~2 minutes.

### 1b. Create the tables (run the SQL)
1. Left sidebar → **SQL Editor** → **New query**.
2. Open `app/supabase/migrations/0001_init.sql` from this repo, copy **all** of it,
   paste into the editor, click **Run**. You should see "Success."
3. New query again. Do the same with `app/supabase/migrations/0002_storage.sql`, **Run**.
4. New query again. Do the same with `app/supabase/migrations/0003_security_hardening.sql`,
   **Run** (DB-enforced identity + location fuzzing, one-truck-per-owner, query limits).

That's your whole database, security rules, and photo storage — done.

### 1c. Grab your keys (Supabase moved these recently)
1. **Project URL:** click the green **Connect** button (top bar), or **Project
   Settings → Data API**. It's just your **Project ID** (Settings → General) as
   `https://<project-id>.supabase.co`.
2. **API key:** **Project Settings → API Keys** → the **Publishable and secret**
   tab → copy the **Publishable key** (`sb_publishable_…`). It's *safe* in the
   browser; your Row-Level Security rules are what actually protect data. *(The
   older **anon** key under the **Legacy** tab also works — same role, older format.)*
   - Don't use the **Secret** key (`sb_secret_…`) / service_role in the app — those
     bypass RLS and are only for the push Edge Function (Part 5).

### 1d. Turn on the good auth settings (all free, one click each)
1. **Authentication → Providers → Email**: make sure **Confirm email** is ON. (The app
   already handles the "check your email" screen.)
2. **Authentication → Policies** (or **Settings**): enable **leaked-password protection**
   so breached passwords are rejected.
3. **Authentication → URL Configuration**: leave this for now — you'll add your live URL
   in Part 4.

---

## Part 2 — Web Push keys (optional, free — skip if you don't want notifications yet)

In a terminal:
```sh
npx web-push generate-vapid-keys
```
It prints a **Public Key** and **Private Key**. Keep them handy for Part 3 and Part 5.

---

## Part 3 — Run it on your own computer first

```sh
git clone https://github.com/kimslawson/lunchagogo.git
cd lunchagogo/app
git checkout claude/lunchagogo-webapp-bilao2
cp .env.example .env
```

Open `.env` in a text editor and fill in:
```
PUBLIC_SUPABASE_URL="https://<project-id>.supabase.co"
PUBLIC_SUPABASE_ANON_KEY="sb_publishable_...  (or the legacy anon key)"
PUBLIC_VAPID_PUBLIC_KEY="...your VAPID public key (or leave the placeholder)..."
```

Then:
```sh
npm install
npm run dev
```
Open the URL it prints (usually `http://localhost:5173`). Make a food-truck account, then
a foodie account in another browser, and click around. If that works, you're ready to
put it online.

---

## Part 4 — Put it online (Netlify)

Your code is already on GitHub, so this is just clicking.

1. Go to **netlify.com** → sign in with GitHub → **Add new site → Import an existing project**.
2. Pick your **lunchagogo** repo.
3. **Branch to deploy:** `claude/lunchagogo-webapp-bilao2`.
4. **Base directory:** `app`  ← important, because the app lives in the `app/` subfolder.
5. **Build command:** `npm run build` (Netlify usually pre-fills this).
6. **Publish directory:** let Netlify auto-detect (`build`). Leave it if it's filled in.
7. **Add environment variables** (before the first deploy, or under *Site configuration →
   Environment variables* after): add the same three from your `.env` —
   `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `PUBLIC_VAPID_PUBLIC_KEY`.
8. Click **Deploy**. In ~2 minutes you get a URL like `https://lunchagogo-xyz.netlify.app`.

### Tell Supabase about your live URL
Back in Supabase → **Authentication → URL Configuration**:
- **Site URL:** your Netlify URL.
- **Redirect URLs:** add `https://YOUR-SITE.netlify.app/auth/callback`.
(Add your custom domain here too once you set one up — see below.)

From now on, **every `git push` to that branch auto-rebuilds and redeploys.** No FTP,
no uploading files.

> **Prefer Cloudflare Pages or Vercel?** Same idea — connect the repo, set the base
> directory to `app`, build command `npm run build`, add the three env vars. The app uses
> `adapter-auto`, so it works on all three with no code change.
>
> **Want the FTP-like option?** Run `npm run build` locally, then drag the resulting
> `app/build` folder onto Netlify's **Deploys → Drag and drop** area. (You'll re-drag on
> each update, so the GitHub connection above is nicer.)

---

## Part 5 — Turn on push notifications (optional, free)

Requires the [Supabase CLI](https://supabase.com/docs/guides/cli):
```sh
cd app
supabase link --project-ref YOUR-PROJECT-REF     # the abcd1234 from your URL
supabase functions deploy notify
supabase secrets set \
  VAPID_PUBLIC_KEY="...public..." \
  VAPID_PRIVATE_KEY="...private..." \
  VAPID_SUBJECT="mailto:getlunchagogo@gmail.com"
```
That's it — when a truck goes live, followers who opted in get a free push. Without this,
everything else still works; the app just skips the notification.

---

## Custom domain (e.g. `app.lunchagogo.app`)

In Netlify → **Domain management → Add a domain** → follow the DNS steps (a CNAME).
Then add that domain to Supabase's **Redirect URLs** (Part 4). Your splash page keeps
living at `lunchagogo.app`; the app lives at a subdomain.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Build fails: "PUBLIC_SUPABASE_URL is not exported" | You forgot the env vars in Netlify (step 7), or `.env` locally. |
| Login works but refresh logs me out | Supabase **Site URL / Redirect URLs** don't match your live URL (Part 4). |
| "Row level security" errors on save | The migrations didn't fully run — re-run `0001_init.sql`. |
| Photos won't upload | Re-run `0002_storage.sql`; confirm a **media** bucket exists under Storage. |
| No push notifications | Part 5 not done, or the user didn't tap "Turn on notifications" in **Me**. iOS needs the app **added to the home screen** first. |
| Map is blank | Allow **location** when the browser asks; try a bigger search radius. |

Questions about any step? The app's architecture and security notes are in
[`README.md`](./README.md).
