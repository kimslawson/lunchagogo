import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { user } = await safeGetSession();
	if (user) {
		const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
		redirect(303, data?.role === 'truck' ? '/truck' : '/map');
	}
	return {};
};
