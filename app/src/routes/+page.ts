import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { user, profile } = await parent();
	if (user) redirect(307, profile?.role === 'truck' ? '/truck' : '/map');
	return {};
};
