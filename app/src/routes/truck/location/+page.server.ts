import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

async function ownedTruck(supabase: App.Locals['supabase'], userId: string) {
	const { data } = await supabase
		.from('trucks')
		.select('id, name, slug, logo_url')
		.eq('owner_id', userId)
		.order('created_at')
		.limit(1);
	return data?.[0] ?? null;
}

export const load: PageServerLoad = async ({ parent, locals: { supabase } }) => {
	const { truck } = await parent();
	if (!truck) redirect(303, '/truck/setup');
	const { data: live } = await supabase
		.from('truck_locations')
		.select('*')
		.eq('truck_id', truck.id)
		.eq('is_live', true)
		.order('created_at', { ascending: false })
		.limit(1)
		.maybeSingle();
	return { live };
};

export const actions: Actions = {
	goLive: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) redirect(303, '/login?next=/truck/location');
		const truck = await ownedTruck(supabase, user.id);
		if (!truck) return fail(400, { error: 'Set up your truck first.' });

		const fd = await request.formData();
		const lat = Number(fd.get('lat'));
		const lng = Number(fd.get('lng'));
		const address = String(fd.get('address') ?? '').trim().slice(0, 140);
		if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
			return fail(400, { error: 'Couldn’t read your GPS. Turn on location and tap “Use my location”.' });
		}

		// Only one live spot at a time.
		await supabase.from('truck_locations').update({ is_live: false }).eq('truck_id', truck.id).eq('is_live', true);
		const { error } = await supabase.from('truck_locations').insert({
			truck_id: truck.id,
			lat,
			lng,
			address: address || null,
			is_live: true,
			starts_at: new Date().toISOString()
		});
		if (error) return fail(400, { error: error.message });

		// Best-effort push fan-out to followers (needs the `notify` edge function
		// deployed). Never blocks going live if notifications aren't set up.
		try {
			await supabase.functions.invoke('notify', {
				body: {
					truck_id: truck.id,
					title: `${truck.name} is out! 🚚`,
					body: address ? `Now at ${address}` : 'Rolling now — come grab some grub!',
					url: `/trucks/${truck.slug}`
				}
			});
		} catch {
			/* notifications optional */
		}

		return { live: true };
	},

	endLive: async ({ locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) redirect(303, '/login?next=/truck/location');
		const truck = await ownedTruck(supabase, user.id);
		if (!truck) return fail(400, { error: 'No truck.' });
		await supabase.from('truck_locations').update({ is_live: false }).eq('truck_id', truck.id).eq('is_live', true);
		return { live: false };
	}
};
