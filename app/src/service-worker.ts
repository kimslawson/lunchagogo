/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />
import { base } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener('install', () => sw.skipWaiting());
sw.addEventListener('activate', (event) => event.waitUntil(sw.clients.claim()));

// --- Web Push -------------------------------------------------------------
sw.addEventListener('push', (event) => {
	let payload: { title?: string; body?: string; url?: string; icon?: string } = {};
	try {
		payload = event.data?.json() ?? {};
	} catch {
		payload = { body: event.data?.text() };
	}
	const title = payload.title ?? 'Lunch a Go-Go';
	event.waitUntil(
		sw.registration.showNotification(title, {
			body: payload.body ?? 'A truck you follow is on the move!',
			icon: payload.icon ?? `${base}/img/icon-192.png`,
			badge: `${base}/img/icon-192.png`,
			data: { url: payload.url ?? `${base}/feed` }
		})
	);
});

sw.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const target = (event.notification.data?.url as string) ?? `${base}/feed`;
	event.waitUntil(
		sw.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
			for (const client of clients) {
				if ('focus' in client) {
					client.navigate(target);
					return client.focus();
				}
			}
			return sw.clients.openWindow(target);
		})
	);
});
