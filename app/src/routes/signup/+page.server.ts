import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

const schema = z.object({
	role: z.enum(['foodie', 'truck']),
	display_name: z.string().trim().min(1, 'Tell us your name').max(60),
	email: z
		.string()
		.trim()
		.regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address'),
	password: z.string().min(8, 'Use at least 8 characters').max(72),
	home_zip: z.string().trim().max(12).optional()
});

export const load: PageServerLoad = async ({ url }) => {
	return { role: url.searchParams.get('role') === 'truck' ? 'truck' : 'foodie' };
};

export const actions: Actions = {
	default: async ({ request, locals: { supabase } }) => {
		const fd = await request.formData();
		const raw = {
			role: String(fd.get('role') ?? 'foodie'),
			display_name: String(fd.get('display_name') ?? ''),
			email: String(fd.get('email') ?? ''),
			password: String(fd.get('password') ?? ''),
			home_zip: String(fd.get('home_zip') ?? '')
		};

		const parsed = schema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues[0].message, values: { ...raw, password: '' } });
		}

		const { role, display_name, email, password, home_zip } = parsed.data;
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: { data: { role, display_name, home_zip: home_zip || null } }
		});

		if (error) return fail(400, { error: error.message, values: { ...raw, password: '' } });
		// Email confirmation is ON in the project: no session yet.
		if (!data.session) return { needsConfirm: true, email };

		redirect(303, role === 'truck' ? '/truck' : '/map');
	}
};
