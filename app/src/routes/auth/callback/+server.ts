import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Handles email-confirmation and magic-link redirects (?code=...).
export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const nextParam = url.searchParams.get('next') ?? '/';
	const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/';

	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) redirect(303, next);
	}
	redirect(303, '/login?error=link');
};
