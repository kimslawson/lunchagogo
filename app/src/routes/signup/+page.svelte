<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	let { data, form } = $props();

	let role = $state<'foodie' | 'truck'>(
		untrack(() => (form?.values?.role as 'foodie' | 'truck') ?? (data.role as 'foodie' | 'truck'))
	);
	let submitting = $state(false);
</script>

<svelte:head><title>Sign up · Lunch a Go-Go</title></svelte:head>

<div class="centered">
	<div class="brand-lockup"><img src="/img/logo.jpg" alt="Lunch a Go-Go" /></div>

	<div class="card auth-card stack">
		{#if form?.needsConfirm}
			<div class="notice">
				<span class="emoji">📬</span>
				<h3>Check your email!</h3>
				<p class="data">We sent a confirmation link to <strong>{form.email}</strong>. Tap it to finish signing up.</p>
			</div>
			<a class="btn btn-ghost" href="/login">Back to log in</a>
		{:else}
			<h2 class="mb0">Follow the food!</h2>
			<p class="muted data" style="margin-top:0">Make your account. Takes ten seconds.</p>

			{#if form?.error}<div class="flash err">{form.error}</div>{/if}

			<form method="POST" use:enhance={() => { submitting = true; return async ({ update }) => { await update(); submitting = false; }; }}>
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
					<input id="display_name" name="display_name" required maxlength="60"
						value={form?.values?.display_name ?? ''} placeholder={role === 'truck' ? 'Taylor Thomas' : 'Alex'} />
				</div>

				<div class="field">
					<label for="email">Email <span class="req">*</span></label>
					<input id="email" name="email" type="email" autocomplete="email" required
						value={form?.values?.email ?? ''} placeholder="you@example.com" />
				</div>

				<div class="field">
					<label for="password">Password <span class="req">*</span></label>
					<input id="password" name="password" type="password" autocomplete="new-password" required minlength="8" />
					<div class="hint">At least 8 characters.</div>
				</div>

				{#if role === 'foodie'}
					<div class="field">
						<label for="home_zip">ZIP code</label>
						<input id="home_zip" name="home_zip" inputmode="numeric" maxlength="12"
							value={form?.values?.home_zip ?? ''} placeholder="Optional — helps us know where foodies are" />
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
