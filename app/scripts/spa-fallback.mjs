// Copies the SPA shell to 404.html so static hosts that route unknown paths to
// a 404 page (GitHub Pages, some CDNs, CloudCannon) still boot the app there.
import { copyFileSync, existsSync } from 'node:fs';

if (existsSync('build/index.html')) {
	copyFileSync('build/index.html', 'build/404.html');
	console.log('✔ wrote build/404.html (SPA fallback)');
} else {
	console.warn('build/index.html not found — skipped 404.html fallback');
}
