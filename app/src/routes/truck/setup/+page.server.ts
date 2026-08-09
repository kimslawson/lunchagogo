import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { uniqueSlug } from '$lib/slug';
import { uploadImage } from '$lib/server/upload';

const schema = z.object({
	name: z.string().trim().min(2, 'Give your truck a name').max(80),
	cuisine: z.string().trim().max(60).optional(),
	bio: z.string().trim().max(500).optional(),
	phone: z.string().trim().max(30).optional(),
	website: z.string().trim().max(200).optional(),
	instagram: z.string().trim().max(60).optional()
});

export const load: PageServerLoad = async ({ parent }) => {
	const { truck } = await parent();
	return { truck };
};

export const actions: Actions = {
	default: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) redirect(303, '/login?next=/truck/setup');

		const fd = await request.formData();
		const raw = {
			name: String(fd.get('name') ?? ''),
			cuisine: String(fd.get('cuisine') ?? ''),
			bio: String(fd.get('bio') ?? ''),
			phone: String(fd.get('phone') ?? ''),
			website: String(fd.get('website') ?? ''),
			instagram: String(fd.get('instagram') ?? '')
		};

		const parsed = schema.safeParse(raw);
		if (!parsed.success) return fail(400, { error: parsed.error.issues[0].message, values: raw });

		const logo = fd.get('logo');
		const up = await uploadImage(supabase, user.id, 'trucks', logo instanceof File ? logo : null);
		if (up.error) return fail(400, { error: up.error, values: raw });

		const fields = {
			name: parsed.data.name,
			cuisine: parsed.data.cuisine || null,
			bio: parsed.data.bio || null,
			phone: parsed.data.phone || null,
			website: parsed.data.website || null,
			instagram: (parsed.data.instagram || '').replace(/^@/, '') || null,
			...(up.url ? { logo_url: up.url } : {})
		};

		const { data: existing } = await supabase
			.from('trucks')
			.select('id')
			.eq('owner_id', user.id)
			.order('created_at')
			.limit(1);

		if (existing?.[0]) {
			const { error } = await supabase.from('trucks').update(fields).eq('id', existing[0].id);
			if (error) return fail(400, { error: error.message, values: raw });
			return { saved: true };
		}

		const { error } = await supabase
			.from('trucks')
			.insert({ owner_id: user.id, slug: uniqueSlug(parsed.data.name), ...fields });
		if (error) return fail(400, { error: error.message, values: raw });
		redirect(303, '/truck');
	}
};
