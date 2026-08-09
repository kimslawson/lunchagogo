<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head><title>{page.status} · Lunch a Go-Go</title></svelte:head>

<div class="centered">
	<div class="brand-lockup"><img src="/img/logo.jpg" alt="Lunch a Go-Go" /></div>
	<div class="card auth-card center">
		<h2 class="mb0">{page.status}</h2>
		<p class="data">{page.error?.message ?? 'Something went sideways.'}</p>
		<a class="btn btn-primary" href="/">Back to the food</a>
	</div>
</div>
