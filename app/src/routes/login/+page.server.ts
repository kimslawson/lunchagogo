import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

function safeNext(n: string | null | undefined): string {
	return n && n.startsWith('/') && !n.startsWith('//') ? n : '/';
}

export const load: PageServerLoad = async ({ url }) => ({ next: safeNext(url.searchParams.get('next')) });

export const actions: Actions = {
	default: async ({ request, url, locals: { supabase } }) => {
		const fd = await request.formData();
		const email = String(fd.get('email') ?? '').trim();
		const password = String(fd.get('password') ?? '');
		const next = safeNext(String(fd.get('next') ?? url.searchParams.get('next') ?? '/'));

		if (!email || !password) return fail(400, { error: 'Enter your email and password.', email });

		const { error } = await supabase.auth.signInWithPassword({ email, password });
		if (error) return fail(400, { error: 'That email and password don’t match.', email });

		redirect(303, next);
	}
};
