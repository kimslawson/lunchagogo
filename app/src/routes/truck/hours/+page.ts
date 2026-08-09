import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { truck } = await parent();
	if (!truck) redirect(307, '/truck/setup');
	const { data: hours } = await supabase
		.from('truck_hours')
		.select('*')
		.eq('truck_id', truck.id)
		.order('day_of_week');
	return { hours: hours ?? [] };
};
