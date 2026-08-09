import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { truck } = await parent();
	if (!truck) redirect(307, '/truck/setup');

	const [live, followers, checkins, specials] = await Promise.all([
		supabase.from('truck_locations').select('*').eq('truck_id', truck.id).eq('is_live', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
		supabase.from('follows').select('*', { count: 'exact', head: true }).eq('truck_id', truck.id),
		supabase.from('checkins').select('*', { count: 'exact', head: true }).eq('truck_id', truck.id),
		supabase.from('specials').select('*', { count: 'exact', head: true }).eq('truck_id', truck.id)
	]);

	return {
		live: live.data,
		followerCount: followers.count ?? 0,
		checkinCount: checkins.count ?? 0,
		specialCount: specials.count ?? 0
	};
};
