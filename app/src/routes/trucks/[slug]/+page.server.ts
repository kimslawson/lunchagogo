import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { fuzz } from '$lib/geo';
import { uploadImage } from '$lib/server/upload';

export const load: PageServerLoad = async ({ params, locals: { supabase, safeGetSession } }) => {
	const { user } = await safeGetSession();

	const { data: truck } = await supabase.from('trucks').select('*').eq('slug', params.slug).single();
	if (!truck) error(404, 'That truck isn’t on the map… yet.');

	const nowIso = new Date().toISOString();
	const [menu, specialsRes, hours, live, upcoming, checkins, follow] = await Promise.all([
		supabase.from('menu_items').select('*').eq('truck_id', truck.id).order('sort_order'),
		supabase.from('specials').select('*').eq('truck_id', truck.id).order('created_at', { ascending: false }).limit(20),
		supabase.from('truck_hours').select('*').eq('truck_id', truck.id).order('day_of_week'),
		supabase.from('truck_locations').select('*').eq('truck_id', truck.id).eq('is_live', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
		supabase.from('truck_locations').select('*').eq('truck_id', truck.id).gt('starts_at', nowIso).order('starts_at').limit(10),
		supabase.from('checkins').select('*').eq('truck_id', truck.id).order('created_at', { ascending: false }).limit(24),
		user
			? supabase.from('follows').select('id, notify').eq('truck_id', truck.id).eq('foodie_id', user.id).maybeSingle()
			: Promise.resolve({ data: null })
	]);

	const specials = (specialsRes.data ?? []).filter(
		(s) => !s.active_until || new Date(s.active_until) > new Date()
	);

	return {
		truck,
		menu: menu.data ?? [],
		specials,
		hours: hours.data ?? [],
		live: live.data ?? null,
		upcoming: upcoming.data ?? [],
		checkins: checkins.data ?? [],
		following: !!follow.data,
		isOwner: user?.id === truck.owner_id,
		loggedIn: !!user
	};
};

async function requireUser(safeGetSession: App.Locals['safeGetSession'], slug: string) {
	const { user } = await safeGetSession();
	if (!user) redirect(303, `/login?next=/trucks/${slug}`);
	return user;
}

export const actions: Actions = {
	follow: async ({ params, locals: { supabase, safeGetSession } }) => {
		const user = await requireUser(safeGetSession, params.slug);
		const { data: truck } = await supabase.from('trucks').select('id').eq('slug', params.slug).single();
		if (!truck) return fail(404, { error: 'Truck not found.' });
		const { error: e } = await supabase.from('follows').insert({ foodie_id: user.id, truck_id: truck.id });
		if (e && e.code !== '23505') return fail(400, { error: e.message });
		return { followed: true };
	},

	unfollow: async ({ params, locals: { supabase, safeGetSession } }) => {
		const user = await requireUser(safeGetSession, params.slug);
		const { data: truck } = await supabase.from('trucks').select('id').eq('slug', params.slug).single();
		if (!truck) return fail(404, { error: 'Truck not found.' });
		await supabase.from('follows').delete().eq('foodie_id', user.id).eq('truck_id', truck.id);
		return { followed: false };
	},

	checkin: async ({ params, request, locals: { supabase, safeGetSession } }) => {
		const user = await requireUser(safeGetSession, params.slug);
		const { data: truck } = await supabase.from('trucks').select('id').eq('slug', params.slug).single();
		if (!truck) return fail(404, { error: 'Truck not found.' });

		const fd = await request.formData();
		const caption = String(fd.get('caption') ?? '').trim().slice(0, 280);
		const latRaw = Number(fd.get('lat'));
		const lngRaw = Number(fd.get('lng'));
		const photo = fd.get('photo');

		const { data: profile } = await supabase
			.from('profiles')
			.select('display_name, avatar_url')
			.eq('id', user.id)
			.single();

		const up = await uploadImage(supabase, user.id, 'checkins', photo instanceof File ? photo : null);
		if (up.error) return fail(400, { error: up.error });

		const { error: e } = await supabase.from('checkins').insert({
			foodie_id: user.id,
			truck_id: truck.id,
			actor_name: profile?.display_name ?? 'Foodie',
			actor_avatar: profile?.avatar_url ?? null,
			photo_url: up.url ?? null,
			caption: caption || null,
			lat: Number.isFinite(latRaw) ? fuzz(latRaw) : null,
			lng: Number.isFinite(lngRaw) ? fuzz(lngRaw) : null
		});
		if (e) return fail(400, { error: e.message });
		return { checkedIn: true };
	}
};
