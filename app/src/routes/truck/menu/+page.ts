import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { truck } = await parent();
	if (!truck) redirect(307, '/truck/setup');
	const { data: menu } = await supabase
		.from('menu_items')
		.select('*')
		.eq('truck_id', truck.id)
		.order('section')
		.order('sort_order');
	return { menu: menu ?? [] };
};
