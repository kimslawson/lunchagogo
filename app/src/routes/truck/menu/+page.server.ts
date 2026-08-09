import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { ownedTruck, toNum } from '$lib/server/truck';

export const load: PageServerLoad = async ({ parent, locals: { supabase } }) => {
	const { truck } = await parent();
	if (!truck) redirect(303, '/truck/setup');
	const { data: menu } = await supabase
		.from('menu_items')
		.select('*')
		.eq('truck_id', truck.id)
		.order('section')
		.order('sort_order');
	return { menu: menu ?? [] };
};

export const actions: Actions = {
	add: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) redirect(303, '/login?next=/truck/menu');
		const truck = await ownedTruck(supabase, user.id);
		if (!truck) return fail(400, { error: 'Set up your truck first.' });

		const fd = await request.formData();
		const name = String(fd.get('name') ?? '').trim().slice(0, 80);
		if (!name) return fail(400, { error: 'Give the item a name.' });

		const { error } = await supabase.from('menu_items').insert({
			truck_id: truck.id,
			name,
			section: String(fd.get('section') ?? '').trim().slice(0, 40) || 'Menu',
			description: String(fd.get('description') ?? '').trim().slice(0, 200) || null,
			price: toNum(fd.get('price')),
			sort_order: Math.floor(Date.now() / 1000)
		});
		if (error) return fail(400, { error: error.message });
		return { added: true };
	},

	toggle: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) redirect(303, '/login');
		const fd = await request.formData();
		await supabase
			.from('menu_items')
			.update({ is_available: String(fd.get('to')) === 'true' })
			.eq('id', String(fd.get('id')));
		return { toggled: true };
	},

	remove: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) redirect(303, '/login');
		const fd = await request.formData();
		await supabase.from('menu_items').delete().eq('id', String(fd.get('id') ?? ''));
		return { removed: true };
	}
};
