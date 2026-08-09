<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabaseClient';

	onMount(async () => {
		// detectSessionInUrl usually handles this automatically; exchange explicitly
		// as a fallback for the PKCE ?code=... flow.
		const code = new URL(window.location.href).searchParams.get('code');
		if (code) {
			try {
				await supabase.auth.exchangeCodeForSession(code);
			} catch {
				/* already exchanged by detectSessionInUrl */
			}
		}
		goto('/');
	});
</script>

<svelte:head><title>Signing in… · Lunch a Go-Go</title></svelte:head>

<div class="centered">
	<div class="brand-lockup"><img src="/img/logo.jpg" alt="Lunch a Go-Go" /></div>
	<div class="card auth-card center"><p class="data mb0">Finishing sign-in… 🍔</p></div>
</div>
