import { supabase } from '$lib/supabaseClient';
import type { PageLoad } from './$types';

type FollowRow = {
	truck_id: string;
	notify: boolean;
	trucks: { name: string; slug: string; logo_url: string | null; cuisine: string | null } | null;
};

export const load: PageLoad = async ({ parent }) => {
	const { user } = await parent();
	const [{ data: profile }, follows] = await Promise.all([
		supabase.from('profiles').select('*').eq('id', user!.id).single(),
		supabase
			.from('follows')
			.select('truck_id, notify, trucks(name, slug, logo_url, cuisine)')
			.eq('foodie_id', user!.id)
			.order('created_at', { ascending: false })
			.returns<FollowRow[]>()
	]);
	return { profile, follows: follows.data ?? [] };
};
