import { supabase } from '$lib/supabaseClient';
import type { LayoutLoad } from './$types';

// Static SPA: render only in the browser, prerender nothing.
export const ssr = false;
export const prerender = false;

export const load: LayoutLoad = async ({ depends }) => {
	depends('supabase:auth');

	const {
		data: { session }
	} = await supabase.auth.getSession();

	let profile = null;
	if (session?.user) {
		const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
		profile = data;
	}

	return { supabase, session, user: session?.user ?? null, profile };
};
