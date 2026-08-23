// Assembles the combined deploy: the hand-made splash at the site root, and the
// SvelteKit app (built with base path /app) under /app. Output: app/_site.
//
//   _site/            <- splash index.html + css/ js/ img/ vendors/ ...  (root domain)
//   _site/app/        <- the SvelteKit SPA (assets reference /app/...)
//   _site/_redirects  <- SPA routing for /app/*  (CloudCannon/Netlify read this)
//   _site/_headers    <- security headers
//
// Runs from the app/ directory (after `npm run build`).
import { cpSync, rmSync, mkdirSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
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

// 3) Site-root routing + headers (read by CloudCannon/Netlify at the published root).
writeFileSync(join(out, '_redirects'), '/app/*    /app/index.html    200\n');
writeFileSync(
	join(out, '_headers'),
	[
		'/*',
		'  X-Content-Type-Options: nosniff',
		'  Referrer-Policy: strict-origin-when-cross-origin',
		'/app/*',
		'  X-Frame-Options: DENY',
		'  Permissions-Policy: geolocation=(self), camera=(self), microphone=()',
		''
	].join('\n')
);

console.log('✔ assembled app/_site  (splash at /, app at /app)');
