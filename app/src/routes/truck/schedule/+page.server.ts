import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { ownedTruck, toNum } from '$lib/server/truck';

export const load: PageServerLoad = async ({ parent, locals: { supabase } }) => {
	const { truck } = await parent();
	if (!truck) redirect(303, '/truck/setup');
	const { data: upcoming } = await supabase
		.from('truck_locations')
		.select('*')
		.eq('truck_id', truck.id)
		.gt('starts_at', new Date().toISOString())
		.order('starts_at')
		.limit(30);
	return { upcoming: upcoming ?? [] };
};

export const actions: Actions = {
	add: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) redirect(303, '/login?next=/truck/schedule');
		const truck = await ownedTruck(supabase, user.id);
		if (!truck) return fail(400, { error: 'Set up your truck first.' });

		const fd = await request.formData();
		const starts = String(fd.get('starts_at') ?? '').trim();
		const ends = String(fd.get('ends_at') ?? '').trim();
		const address = String(fd.get('address') ?? '').trim().slice(0, 140);
		if (!starts) return fail(400, { error: 'Pick a start date & time.' });
		if (!address) return fail(400, { error: 'Where will you be?' });

		const { error } = await supabase.from('truck_locations').insert({
			truck_id: truck.id,
			is_live: false,
			address,
			label: String(fd.get('label') ?? '').trim().slice(0, 80) || null,
			starts_at: new Date(starts).toISOString(),
			ends_at: ends ? new Date(ends).toISOString() : null,
			lat: toNum(fd.get('lat')),
			lng: toNum(fd.get('lng'))
		});
		if (error) return fail(400, { error: error.message });
		return { added: true };
	},

	remove: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) redirect(303, '/login');
		const fd = await request.formData();
		await supabase.from('truck_locations').delete().eq('id', String(fd.get('id') ?? ''));
		return { removed: true };
	}
};
