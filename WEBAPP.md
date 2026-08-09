# Lunch a Go-Go — repo layout

This repo holds two things:

- **`/` (root)** — the marketing **splash page** (static HTML/CSS/JS, deployed via CloudCannon to lunchagogo.app). Untouched.
- **`/app`** — the **actual web app**: the food-truck tracking product with foodie + food-truck modes, built on SvelteKit + Supabase + free Web Push.

👉 See **[`app/README.md`](app/README.md)** for the architecture, cost breakdown, hosting/notification options, setup, and security notes.

Quick start:
```sh
cd app
cp .env.example .env      # add your Supabase + VAPID keys
npm install
npm run dev
```
