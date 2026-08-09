# Lunch a Go-Go — repo layout

This repo holds two things:

- **`/` (root)** — the marketing **splash page** (static HTML/CSS/JS, deployed via
  CloudCannon to lunchagogo.app). Untouched by the app work.
- **`/app`** — the **actual web app**: food-truck tracking with foodie + food-truck
  modes, on SvelteKit + Supabase + free Web Push.

## Two flavors of the app, on two branches

Same features, same Supabase backend, same database. They differ only in **where
login/session handling runs** — which decides how you host it.

| Branch | Flavor | Host it on | Auth |
| --- | --- | --- | --- |
| `claude/lunchagogo-webapp-bilao2` | **A — hardened / serverless** | Netlify · Cloudflare Pages · Vercel (free, auto-deploy) | server-side session (more hardened) |
| `claude/lunchagogo-webapp-static` | **B — static SPA** | **CloudCannon** · any static host | in-browser session (simpler hosting) |

Your **data** is protected the same way in both — by database Row-Level Security, not
by where the app runs. B's only tradeoff: the session token lives in the browser, so an
XSS bug could hijack that one user's session. Pick B for the simplest CloudCannon-style
hosting; pick A if you want the stronger auth posture.

👉 Each branch's **`app/SETUP.md`** has a click-by-click deploy guide, and
**`app/README.md`** has the architecture + the full A-vs-B security explanation.

Quick start (either branch):
```sh
cd app
cp .env.example .env      # add your Supabase + VAPID keys
npm install
npm run dev
```
