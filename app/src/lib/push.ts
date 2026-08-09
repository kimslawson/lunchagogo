import { PUBLIC_VAPID_PUBLIC_KEY } from '$env/static/public';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/database.types';

function urlBase64ToUint8Array(base64: string): Uint8Array {
	const padding = '='.repeat((4 - (base64.length % 4)) % 4);
	const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
	const raw = atob(b64);
	const out = new Uint8Array(raw.length);
	for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
	return out;
}

export function pushSupported(): boolean {
	return (
		typeof window !== 'undefined' &&
		'serviceWorker' in navigator &&
		'PushManager' in window &&
		'Notification' in window
	);
}

export async function enablePush(
	supabase: SupabaseClient<Database>,
	userId: string
): Promise<{ ok: boolean; error?: string }> {
	if (!pushSupported()) return { ok: false, error: 'Push isn’t supported on this device/browser.' };
	if (!PUBLIC_VAPID_PUBLIC_KEY || PUBLIC_VAPID_PUBLIC_KEY.startsWith('placeholder')) {
		return { ok: false, error: 'Push isn’t configured yet (missing VAPID key).' };
	}

	const permission = await Notification.requestPermission();
	if (permission !== 'granted') return { ok: false, error: 'Notifications are blocked.' };

	const reg = await navigator.serviceWorker.ready;
	const sub = await reg.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_PUBLIC_KEY) as BufferSource
	});

	const json = sub.toJSON();
	const keys = json.keys ?? { p256dh: '', auth: '' };

	const { error } = await supabase
		.from('push_subscriptions')
		.upsert(
			{ user_id: userId, endpoint: sub.endpoint, p256dh: keys.p256dh, auth: keys.auth },
			{ onConflict: 'endpoint', ignoreDuplicates: true }
		);
	if (error) return { ok: false, error: error.message };

	await supabase.from('profiles').update({ push_opt_in: true }).eq('id', userId);
	return { ok: true };
}
