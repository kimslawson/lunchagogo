import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { truck } = await parent();
	if (!truck) redirect(307, '/truck/setup');
	const { data: upcoming } = await supabase
		.from('truck_locations')
		.select('*')
		.eq('truck_id', truck.id)
		.gt('starts_at', new Date().toISOString())
		.order('starts_at')
		.limit(30);
	return { upcoming: upcoming ?? [] };
};
