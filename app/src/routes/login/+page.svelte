<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();
	let submitting = $state(false);
</script>

<svelte:head><title>Log in · Lunch a Go-Go</title></svelte:head>

<div class="centered">
	<div class="brand-lockup"><img src="/img/logo.jpg" alt="Lunch a Go-Go" /></div>

	<div class="card auth-card stack">
		<h2 class="mb0">Welcome back!</h2>
		{#if form?.error}<div class="flash err">{form.error}</div>{/if}

		<form method="POST" use:enhance={() => { submitting = true; return async ({ update }) => { await update(); submitting = false; }; }}>
			<input type="hidden" name="next" value={data.next} />
			<div class="field">
				<label for="email">Email</label>
				<input id="email" name="email" type="email" autocomplete="email" required value={form?.email ?? ''} />
			</div>
			<div class="field">
				<label for="password">Password</label>
				<input id="password" name="password" type="password" autocomplete="current-password" required />
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
