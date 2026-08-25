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

// The app is served from a different origin (lunchagogo.app) than the function
// (…supabase.co), so the browser sends a CORS preflight OPTIONS request first and
// blocks the real POST unless we answer it with these headers.
const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
	'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const json = (status: number, data: unknown) =>
	new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json', ...corsHeaders }
	});

Deno.serve(async (req) => {
	// Answer the CORS preflight so the browser will then send the actual POST.
	if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
	if (req.method !== 'POST') return json(405, { error: 'method not allowed' });

	const { truck_id, title, body, url } = await req.json().catch(() => ({}));
	console.log('notify: request received', { truck_id, hasTitle: !!title });
	if (!truck_id) return json(400, { error: 'truck_id required' });

	// Fail loudly if the push secrets aren't set — otherwise setVapidDetails throws
	// mid-run and you get an opaque 500 with no idea why.
	const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY');
	const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY');
	if (!vapidPublic || !vapidPrivate) {
		console.error('notify: VAPID secrets missing', {
			hasPublic: !!vapidPublic,
			hasPrivate: !!vapidPrivate
		});
		return json(500, { error: 'server missing VAPID secrets — run `supabase secrets set`' });
	}

	const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
	const admin = createClient(
		Deno.env.get('SUPABASE_URL')!,
		Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
	);

	// Authorize: the caller must own this truck.
	const { data: userData, error: authErr } = await admin.auth.getUser(jwt);
	const uid = userData.user?.id;
	console.log('notify: caller', { uid: uid ?? null, authError: authErr?.message ?? null });
	if (!uid) return json(401, { error: 'unauthenticated' });

	const { data: truck } = await admin
		.from('trucks')
		.select('id')
		.eq('id', truck_id)
		.eq('owner_id', uid)
		.maybeSingle();
	console.log('notify: ownership check', { truck_id, owns: !!truck });
	if (!truck) return json(403, { error: 'not the truck owner' });

	// Followers who opted into alerts.
	const { data: followers } = await admin
		.from('follows')
		.select('foodie_id')
		.eq('truck_id', truck_id)
		.eq('notify', true);
	const ids = (followers ?? []).map((f) => f.foodie_id);
	console.log('notify: followers with alerts on', { count: ids.length });
	if (ids.length === 0) return json(200, { sent: 0, reason: 'no followers with notify=true' });

	const { data: subs } = await admin
		.from('push_subscriptions')
		.select('endpoint, p256dh, auth')
		.in('user_id', ids);
	console.log('notify: push subscriptions found', { count: (subs ?? []).length });

	webpush.setVapidDetails(
		Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@example.com',
		vapidPublic,
		vapidPrivate
	);

	const payload = JSON.stringify({ title, body, url });
	let sent = 0;
	let failed = 0;

	await Promise.all(
		(subs ?? []).map(async (s) => {
			try {
				await webpush.sendNotification(
					{ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
					payload
				);
				sent++;
			} catch (err) {
				failed++;
				const code = (err as { statusCode?: number }).statusCode;
				console.error('notify: send failed', {
					statusCode: code ?? null,
					message: (err as Error).message
				});
				// Prune expired/gone subscriptions so the table stays clean.
				if (code === 404 || code === 410) {
					await admin.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
				}
			}
		})
	);

	console.log('notify: done', { sent, failed });
	return json(200, { sent, failed });
});
