// Assembles the combined deploy: the hand-made splash at the site root, and the
// SvelteKit app (built with base path /app) under /app. Output: app/_site.
//
//   _site/                        <- splash (index.html, css/, js/, img/, …) at the root domain
//   _site/app/                    <- the SvelteKit SPA (assets reference /app/...)
//   _site/_cloudcannon/routing.json <- CloudCannon SPA rewrite for /app/* (output override)
//
// Runs from the app/ directory (after `npm run build`).
import { cpSync, rmSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const appDir = process.cwd(); // .../app
const repoRoot = resolve(appDir, '..');
const out = join(appDir, '_site');
const appBuild = join(appDir, 'build');

if (!existsSync(appBuild)) {
	console.error('app/build not found — run `npm run build` first.');
	process.exit(1);
}

// Everything at the repo root is splash content EXCEPT these.
const SKIP = new Set(['app', 'WEBAPP.md', 'README.md', '_site', 'node_modules']);

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// 1) Splash (root domain).
for (const entry of readdirSync(repoRoot)) {
	if (SKIP.has(entry) || entry.startsWith('.')) continue;
	cpSync(join(repoRoot, entry), join(out, entry), { recursive: true });
}

// 2) The app, under /app.
cpSync(appBuild, join(out, 'app'), { recursive: true });

// 3) CloudCannon routing. For build sites, CloudCannon reads
//    _cloudcannon/routing.json (underscore) from the OUTPUT and it overrides the
//    source .cloudcannon/routing.json. Copy ours in so /app/* serves the SPA
//    shell (status 200) without touching real files.
const routingSrc = join(repoRoot, '.cloudcannon', 'routing.json');
if (existsSync(routingSrc)) {
	mkdirSync(join(out, '_cloudcannon'), { recursive: true });
	cpSync(routingSrc, join(out, '_cloudcannon', 'routing.json'));
}

console.log('✔ assembled app/_site  (splash at /, app at /app)');
