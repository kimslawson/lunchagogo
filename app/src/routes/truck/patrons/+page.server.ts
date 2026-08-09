import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals: { supabase } }) => {
	const { truck } = await parent();
	if (!truck) redirect(303, '/truck/setup');
	// SECURITY DEFINER function, guarded to the truck owner in SQL.
	const { data: patrons } = await supabase.rpc('get_truck_patrons', { p_truck_id: truck.id });
	return { patrons: patrons ?? [] };
};
