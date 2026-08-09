import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { uploadImage } from '$lib/server/upload';

type FollowRow = {
	truck_id: string;
	notify: boolean;
	trucks: { name: string; slug: string; logo_url: string | null; cuisine: string | null } | null;
};

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { user } = await safeGetSession();
	const [{ data: profile }, follows] = await Promise.all([
		supabase.from('profiles').select('*').eq('id', user!.id).single(),
		supabase
			.from('follows')
			.select('truck_id, notify, trucks(name, slug, logo_url, cuisine)')
			.eq('foodie_id', user!.id)
			.order('created_at', { ascending: false })
			.returns<FollowRow[]>()
	]);

	return { profile, follows: follows.data ?? [] };
};

export const actions: Actions = {
	updateProfile: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) redirect(303, '/login');

		const fd = await request.formData();
		const display_name = String(fd.get('display_name') ?? '').trim().slice(0, 60);
		const home_zip = String(fd.get('home_zip') ?? '').trim().slice(0, 12);
		const avatar = fd.get('avatar');

		const up = await uploadImage(supabase, user.id, 'avatars', avatar instanceof File ? avatar : null);
		if (up.error) return fail(400, { error: up.error });

		const patch = {
			display_name: display_name || 'Foodie',
			home_zip: home_zip || null,
			...(up.url ? { avatar_url: up.url } : {})
		};

		const { error } = await supabase.from('profiles').update(patch).eq('id', user.id);
		if (error) return fail(400, { error: error.message });
		return { saved: true };
	},

	toggleNotify: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) redirect(303, '/login');
		const fd = await request.formData();
		const truck_id = String(fd.get('truck_id') ?? '');
		const notify = String(fd.get('notify') ?? '') === 'true';
		await supabase.from('follows').update({ notify }).eq('foodie_id', user.id).eq('truck_id', truck_id);
		return { saved: true };
	},

	logout: async ({ locals: { supabase } }) => {
		await supabase.auth.signOut();
		redirect(303, '/');
	}
};
