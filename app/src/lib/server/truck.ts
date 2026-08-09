import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/database.types';

// Resolve the current owner's truck (MVP: one truck per owner).
export async function ownedTruck(supabase: SupabaseClient<Database>, userId: string) {
	const { data } = await supabase
		.from('trucks')
		.select('id, name, slug, logo_url')
		.eq('owner_id', userId)
		.order('created_at')
		.limit(1);
	return data?.[0] ?? null;
}

export function toNum(v: FormDataEntryValue | null): number | null {
	const n = parseFloat(String(v ?? ''));
	return Number.isFinite(n) ? n : null;
}
