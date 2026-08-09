import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { ownedTruck } from '$lib/server/truck';

export const load: PageServerLoad = async ({ parent, locals: { supabase } }) => {
	const { truck } = await parent();
	if (!truck) redirect(303, '/truck/setup');
	const { data: hours } = await supabase
		.from('truck_hours')
		.select('*')
		.eq('truck_id', truck.id)
		.order('day_of_week');
	return { hours: hours ?? [] };
};

export const actions: Actions = {
	save: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) redirect(303, '/login?next=/truck/hours');
		const truck = await ownedTruck(supabase, user.id);
		if (!truck) return fail(400, { error: 'Set up your truck first.' });

		const fd = await request.formData();
		const rows = Array.from({ length: 7 }, (_, d) => {
			const closed = fd.get(`closed_${d}`) === 'on';
			const open = String(fd.get(`open_${d}`) ?? '');
			const close = String(fd.get(`close_${d}`) ?? '');
			return {
				truck_id: truck.id,
				day_of_week: d,
				is_closed: closed,
				open_time: closed || !open ? null : open,
				close_time: closed || !close ? null : close
			};
		});

		const { error } = await supabase
			.from('truck_hours')
			.upsert(rows, { onConflict: 'truck_id,day_of_week' });
		if (error) return fail(400, { error: error.message });
		return { saved: true };
	}
};
