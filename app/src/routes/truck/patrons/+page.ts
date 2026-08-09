import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { truck } = await parent();
	if (!truck) redirect(307, '/truck/setup');
	const { data: patrons } = await supabase.rpc('get_truck_patrons', { p_truck_id: truck.id });
	return { patrons: patrons ?? [] };
};
