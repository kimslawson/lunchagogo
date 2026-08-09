import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent }) => {
	const { user, profile } = await parent();
	if (!user) redirect(307, '/login?next=/truck');
	if (profile?.role !== 'truck') redirect(307, '/map');

	const { data: trucks } = await supabase
		.from('trucks')
		.select('*')
		.eq('owner_id', user.id)
		.order('created_at')
		.limit(1);

	return { truck: trucks?.[0] ?? null };
};
