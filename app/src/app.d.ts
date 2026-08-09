// See https://svelte.dev/docs/kit/types#app.d.ts
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '$lib/types';

declare global {
	namespace App {
		interface PageData {
			session: Session | null;
			user: User | null;
			profile?: Profile | null;
		}
		// interface Error {}
		// interface PageState {}
	}
}

export {};
