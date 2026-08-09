// Supabase Edge Function (Deno) — sends free Web Push to a truck's followers.
//
// Deploy:  supabase functions deploy notify
// Secrets: supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com
//          (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are provided by the platform)
//
// Invoked from the app's "go live" / "post special" actions via
// supabase.functions.invoke('notify', { body: {...} }). The caller's JWT is
// verified and must own the truck before anything is sent.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3';

const json = (status: number, data: unknown) =>
	new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
	if (req.method !== 'POST') return json(405, { error: 'method not allowed' });

	const { truck_id, title, body, url } = await req.json().catch(() => ({}));
	if (!truck_id) return json(400, { error: 'truck_id required' });

	const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
	const admin = createClient(
		Deno.env.get('SUPABASE_URL')!,
		Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
	);

	// Authorize: the caller must own this truck.
	const { data: userData } = await admin.auth.getUser(jwt);
	const uid = userData.user?.id;
	if (!uid) return json(401, { error: 'unauthenticated' });

	const { data: truck } = await admin
		.from('trucks')
		.select('id')
		.eq('id', truck_id)
		.eq('owner_id', uid)
		.maybeSingle();
	if (!truck) return json(403, { error: 'not the truck owner' });

	// Followers who opted into alerts.
	const { data: followers } = await admin
		.from('follows')
		.select('foodie_id')
		.eq('truck_id', truck_id)
		.eq('notify', true);
	const ids = (followers ?? []).map((f) => f.foodie_id);
	if (ids.length === 0) return json(200, { sent: 0 });

	const { data: subs } = await admin
		.from('push_subscriptions')
		.select('endpoint, p256dh, auth')
		.in('user_id', ids);

	webpush.setVapidDetails(
		Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@example.com',
		Deno.env.get('VAPID_PUBLIC_KEY')!,
		Deno.env.get('VAPID_PRIVATE_KEY')!
	);

	const payload = JSON.stringify({ title, body, url });
	let sent = 0;

	await Promise.all(
		(subs ?? []).map(async (s) => {
			try {
				await webpush.sendNotification(
					{ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
					payload
				);
				sent++;
			} catch (err) {
				// Prune expired/gone subscriptions so the table stays clean.
				const code = (err as { statusCode?: number }).statusCode;
				if (code === 404 || code === 410) {
					await admin.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
				}
			}
		})
	);

	return json(200, { sent });
});
