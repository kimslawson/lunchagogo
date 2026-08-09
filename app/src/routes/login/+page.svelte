<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { supabase } from '$lib/supabaseClient';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let submitting = $state(false);

	function safeNext(): string {
		const n = page.url.searchParams.get('next');
		return n && n.startsWith('/') && !n.startsWith('//') ? n : '/';
	}

	async function handleLogin(e: SubmitEvent) {
		e.preventDefault();
		submitting = true;
		error = '';
		const { error: err } = await supabase.auth.signInWithPassword({ email, password });
		submitting = false;
		if (err) {
			error = 'That email and password don’t match.';
			return;
		}
		goto(safeNext());
	}
</script>

<svelte:head><title>Log in · Lunch a Go-Go</title></svelte:head>

<div class="centered">
	<div class="brand-lockup"><img src="/img/logo.jpg" alt="Lunch a Go-Go" /></div>

	<div class="card auth-card stack">
		<h2 class="mb0">Welcome back!</h2>
		{#if error}<div class="flash err">{error}</div>{/if}

		<form onsubmit={handleLogin}>
			<div class="field">
				<label for="email">Email</label>
				<input id="email" type="email" autocomplete="email" required bind:value={email} />
			</div>
			<div class="field">
				<label for="password">Password</label>
				<input id="password" type="password" autocomplete="current-password" required bind:value={password} />
			</div>
			<button class="btn btn-primary btn-lg" type="submit" disabled={submitting}>
				{submitting ? 'Logging in…' : 'Log in'}
			</button>
		</form>

		<p class="center muted data" style="margin-bottom:0">
			New here? <a href="/signup">Make an account</a>
		</p>
	</div>
</div>
