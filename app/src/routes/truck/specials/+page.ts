import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { truck } = await parent();
	if (!truck) redirect(307, '/truck/setup');
	const { data: specials } = await supabase
		.from('specials')
		.select('*')
		.eq('truck_id', truck.id)
		.order('created_at', { ascending: false })
		.limit(30);
	return { specials: specials ?? [] };
};
