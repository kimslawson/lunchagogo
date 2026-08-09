import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/database.types';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

// Uploads to the public `media` bucket under `<uid>/<folder>/<uuid>.<ext>`.
// Returns {} when no file was provided. Storage RLS also enforces the uid path.
export async function uploadImage(
	supabase: SupabaseClient<Database>,
	userId: string,
	folder: string,
	file: File | null
): Promise<{ url?: string; error?: string }> {
	if (!file || file.size === 0) return {};
	if (!ALLOWED.includes(file.type)) return { error: 'Please use a JPG, PNG, or WebP image.' };
	if (file.size > MAX_BYTES) return { error: 'That image is over 5 MB — pick a smaller one.' };

	const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
	const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;

	const { error } = await supabase.storage
		.from('media')
		.upload(path, file, { contentType: file.type, upsert: false });
	if (error) return { error: error.message };

	const { data } = supabase.storage.from('media').getPublicUrl(path);
	return { url: data.publicUrl };
}
