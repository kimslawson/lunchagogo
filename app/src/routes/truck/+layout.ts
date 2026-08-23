import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import { u } from '$lib/paths';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent }) => {
	const { user, profile } = await parent();
	if (!user) redirect(307, `${u('/login')}?next=${encodeURIComponent(u('/truck'))}`);
	if (profile?.role !== 'truck') redirect(307, u('/map'));

	const { data: trucks } = await supabase
		.from('trucks')
		.select('*')
		.eq('owner_id', user.id)
		.order('created_at')
		.limit(1);

	return { truck: trucks?.[0] ?? null };
};
