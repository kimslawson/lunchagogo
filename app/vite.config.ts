import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// SvelteKit config is passed inline to the `sveltekit()` plugin in this version:
// top-level keys like `adapter`, `csp`, and `alias` are routed into `kit` config.
export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-auto detects Netlify / Cloudflare Pages / Vercel at deploy time,
			// so the same code ships to any of them with no change. Pin a specific
			// adapter (adapter-netlify / -cloudflare / -vercel / -node) if you prefer.
			adapter: adapter(),

			// Content-Security-Policy, managed by SvelteKit (it adds nonces/hashes for
			// its own inline hydration scripts, so this can't break the app).
			csp: {
				mode: 'auto',
				directives: {
					'default-src': ['self'],
					'script-src': ['self'],
					'style-src': ['self', 'unsafe-inline'],
					'img-src': ['self', 'data:', 'blob:', 'https:'],
					'font-src': ['self', 'data:'],
					// 'self' + https/wss covers Supabase REST, Storage and Realtime.
					'connect-src': ['self', 'https:', 'wss:'],
					'worker-src': ['self'],
					'manifest-src': ['self'],
					'frame-ancestors': ['none'],
					'base-uri': ['self'],
					'form-action': ['self']
				}
			}
		})
	]
});
