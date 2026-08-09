import { supabase } from '$lib/supabaseClient';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const [{ data: feed }, { count }] = await Promise.all([
		supabase.rpc('get_following_feed', { p_limit: 30 }),
		supabase.from('follows').select('*', { count: 'exact', head: true })
	]);
	return { feed: feed ?? [], followCount: count ?? 0 };
};
