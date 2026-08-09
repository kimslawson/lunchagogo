import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { truck } = await parent();
	if (!truck) redirect(307, '/truck/setup');
	const { data: live } = await supabase
		.from('truck_locations')
		.select('*')
		.eq('truck_id', truck.id)
		.eq('is_live', true)
		.order('created_at', { ascending: false })
		.limit(1)
		.maybeSingle();
	return { live };
};
