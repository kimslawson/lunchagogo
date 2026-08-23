<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { supabase } from '$lib/supabaseClient';

	let role = $state<'foodie' | 'truck'>(
		untrack(() => (page.url.searchParams.get('role') === 'truck' ? 'truck' : 'foodie'))
	);
	let display_name = $state('');
	let email = $state('');
	let password = $state('');
	let home_zip = $state('');
	let error = $state('');
	let submitting = $state(false);
	let needsConfirm = $state(false);

	async function handleSignup(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		if (display_name.trim().length < 1) return (error = 'Tell us your name.');
		if (password.length < 8) return (error = 'Use at least 8 characters.');
		submitting = true;
		const { data, error: err } = await supabase.auth.signUp({
			email: email.trim(),
			password,
			options: {
				data: { role, display_name: display_name.trim(), home_zip: home_zip.trim() || null },
				emailRedirectTo: `${location.origin}/auth/callback`
			}
		});
		submitting = false;
		if (err) return (error = err.message);
		if (!data.session) return (needsConfirm = true);
		goto(role === 'truck' ? '/truck' : '/map');
	}
</script>

<svelte:head><title>Sign up · Lunch a Go-Go</title></svelte:head>

<div class="centered">
	<div class="brand-lockup"><img src="/img/logo.jpg" alt="Lunch a Go-Go" /></div>

	<div class="card auth-card stack">
		{#if needsConfirm}
			<div class="notice">
				<span class="emoji">📬</span>
				<h3>Check your email!</h3>
				<p class="data">We sent a confirmation link to <strong>{email}</strong>. Tap it to finish signing up.</p>
			</div>
			<a class="btn btn-ghost" href="/login">Back to log in</a>
		{:else}
			<h2 class="mb0">Follow the food!</h2>
			<p class="muted data" style="margin-top:0">Make your account. Takes ten seconds.</p>

			{#if error}<div class="flash err">{error}</div>{/if}

			<form onsubmit={handleSignup}>
				<div class="segmented" style="margin-bottom:1rem;">
					<label class:on={role === 'foodie'}>
						<input type="radio" name="role" value="foodie" bind:group={role} /> 😋 Foodie
					</label>
					<label class:on={role === 'truck'}>
						<input type="radio" name="role" value="truck" bind:group={role} /> 🚚 Food truck
					</label>
				</div>

				<div class="field">
					<label for="display_name">{role === 'truck' ? 'Your name' : 'Name'} <span class="req">*</span></label>
					<input id="display_name" required maxlength="60" bind:value={display_name}
						placeholder={role === 'truck' ? 'Taylor Thomas' : 'Alex'} />
				</div>
				<div class="field">
					<label for="email">Email <span class="req">*</span></label>
					<input id="email" type="email" autocomplete="email" required bind:value={email} placeholder="you@example.com" />
				</div>
				<div class="field">
					<label for="password">Password <span class="req">*</span></label>
					<input id="password" type="password" autocomplete="new-password" required minlength="8" bind:value={password} />
					<div class="hint">At least 8 characters.</div>
				</div>
				{#if role === 'foodie'}
					<div class="field">
						<label for="home_zip">ZIP code</label>
						<input id="home_zip" inputmode="numeric" maxlength="12" bind:value={home_zip} placeholder="Optional — helps us know where foodies are" />
					</div>
				{/if}

				<button class="btn btn-primary btn-lg" type="submit" disabled={submitting}>
					{submitting ? 'Signing you up…' : 'Sign up!'}
				</button>
			</form>

			<p class="center muted data" style="margin-bottom:0">
				Already have an account? <a href="/login">Log in</a>
			</p>
		{/if}
	</div>
</div>
