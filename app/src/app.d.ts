// See https://svelte.dev/docs/kit/types#app.d.ts
import type { SupabaseClient, Session, User } from '@supabase/supabase-js';
import type { Database } from '$lib/database.types';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient<Database>;
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
			session: Session | null;
			user: User | null;
		}
		interface PageData {
			session: Session | null;
			user: User | null;
			profile?: import('$lib/types').Profile | null;
		}
		// interface Error {}
		// interface PageState {}
		interface Platform {
			env?: {
				VAPID_PUBLIC_KEY?: string;
				VAPID_PRIVATE_KEY?: string;
			};
		}
	}
}

export {};
