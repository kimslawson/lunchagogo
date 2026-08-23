import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// STATIC-SPA build (Option B): no server. Everything is prebuilt files that any
// static host — CloudCannon, Netlify, GitHub Pages — can serve. Auth and data
// calls happen in the browser via supabase-js. Routing is client-side, so we
// emit a single fallback shell that the host serves for every path.
export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: 'index.html', // SPA shell for client-side routing
				precompress: false,
				strict: false
			}),

			// The app is served under lunchagogo.app/app (the splash owns the root).
			// base makes all SvelteKit asset URLs absolute under /app; relative:false
			// keeps them depth-independent so the SPA fallback works at any route.
			paths: { base: '/app', relative: false },

			// CSP is emitted as a <meta> tag in the static shell. (Header-only
			// directives like frame-ancestors also ship in static/_headers, which
			// CloudCannon and Netlify honor.)
			csp: {
				mode: 'auto',
				directives: {
					'default-src': ['self'],
					'script-src': ['self'],
					'style-src': ['self', 'unsafe-inline'],
					'img-src': ['self', 'data:', 'blob:', 'https:'],
					'font-src': ['self', 'data:'],
					'connect-src': ['self', 'https:', 'wss:'],
					'worker-src': ['self'],
					'manifest-src': ['self'],
					'base-uri': ['self'],
					'form-action': ['self']
				}
			}
		})
	]
});
