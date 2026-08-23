import { redirect } from '@sveltejs/kit';
import { u } from '$lib/paths';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { user, profile } = await parent();
	if (user) redirect(307, profile?.role === 'truck' ? u('/truck') : u('/map'));
	return {};
};
