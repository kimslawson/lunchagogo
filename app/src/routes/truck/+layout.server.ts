import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { user } = await safeGetSession();
	if (!user) redirect(303, '/login?next=/truck');

	const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
	if (profile?.role !== 'truck') redirect(303, '/map');

	const { data: trucks } = await supabase
		.from('trucks')
		.select('*')
		.eq('owner_id', user.id)
		.order('created_at')
		.limit(1);

	return { truck: trucks?.[0] ?? null };
};
