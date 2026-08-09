import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Database } from '$lib/database.types';

// Single browser client. The session lives in the browser (localStorage) and is
// protected on the wire by TLS; the database's Row-Level Security is what actually
// guards data. PKCE flow makes email-confirmation / magic links work client-side.
export const supabase = createClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
	auth: {
		flowType: 'pkce',
		persistSession: true,
		autoRefreshToken: true,
		detectSessionInUrl: true
	}
});
