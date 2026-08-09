import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { ownedTruck, toNum } from '$lib/server/truck';
import { uploadImage } from '$lib/server/upload';

export const load: PageServerLoad = async ({ parent, locals: { supabase } }) => {
	const { truck } = await parent();
	if (!truck) redirect(303, '/truck/setup');
	const { data: specials } = await supabase
		.from('specials')
		.select('*')
		.eq('truck_id', truck.id)
		.order('created_at', { ascending: false })
		.limit(30);
	return { specials: specials ?? [] };
};

export const actions: Actions = {
	add: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) redirect(303, '/login?next=/truck/specials');
		const truck = await ownedTruck(supabase, user.id);
		if (!truck) return fail(400, { error: 'Set up your truck first.' });

		const fd = await request.formData();
		const title = String(fd.get('title') ?? '').trim().slice(0, 100);
		if (!title) return fail(400, { error: 'Give your special a title.' });

		const until = String(fd.get('active_until') ?? '').trim();
		const photo = fd.get('photo');
		const up = await uploadImage(supabase, user.id, 'specials', photo instanceof File ? photo : null);
		if (up.error) return fail(400, { error: up.error });

		const { error } = await supabase.from('specials').insert({
			truck_id: truck.id,
			title,
			description: String(fd.get('description') ?? '').trim().slice(0, 300) || null,
			price: toNum(fd.get('price')),
			photo_url: up.url ?? null,
			active_until: until ? new Date(until).toISOString() : null
		});
		if (error) return fail(400, { error: error.message });
		return { added: true };
	},

	remove: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) redirect(303, '/login');
		const fd = await request.formData();
		await supabase.from('specials').delete().eq('id', String(fd.get('id') ?? ''));
		return { removed: true };
	}
};
