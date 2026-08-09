import { error } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, parent }) => {
	const { user } = await parent();

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
