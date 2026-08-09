import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { supabase, safeGetSession }, cookies }) => {
	const { session, user } = await safeGetSession();

	let profile = null;
	if (user) {
		const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
		profile = data;
	}

	return {
		session,
		user,
		profile,
		cookies: cookies.getAll()
	};
};
