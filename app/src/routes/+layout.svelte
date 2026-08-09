<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { page } from '$app/state';

	let { data, children } = $props();
	let supabase = $derived(data.supabase);

	const seg = $derived(page.url.pathname.split('/')[1] ?? '');
	const isAuthPage = $derived(seg === 'login' || seg === 'signup' || seg === 'auth');
	const showChrome = $derived(!!data.user && !isAuthPage);
	const role = $derived(data.profile?.role ?? 'foodie');

	type NavItem = { href: string; ico: string; label: string; exact?: boolean };
	const nav = $derived<NavItem[]>(
		role === 'truck'
			? [
					{ href: '/truck', ico: '🚚', label: 'My Truck', exact: true },
					{ href: '/truck/location', ico: '📍', label: 'Location' },
					{ href: '/truck/menu', ico: '🍔', label: 'Menu' },
					{ href: '/truck/patrons', ico: '👥', label: 'Patrons' }
				]
			: [
					{ href: '/map', ico: '🗺️', label: 'Nearby' },
					{ href: '/feed', ico: '📣', label: 'Feed' },
					{ href: '/me', ico: '😋', label: 'Me' }
				]
	);

	function isActive(item: NavItem): boolean {
		const p = page.url.pathname;
		if (item.exact) return p === item.href;
		return p === item.href || p.startsWith(item.href + '/');
	}

	onMount(() => {
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, newSession) => {
			if (newSession?.expires_at !== data.session?.expires_at) {
				invalidate('supabase:auth');
			}
		});
		return () => subscription.unsubscribe();
	});
</script>

{#if showChrome}
	<div class="app-shell">
		<header class="topbar">
			<a href={role === 'truck' ? '/truck' : '/feed'} class="brand">
				<img src="/img/logo.jpg" alt="" />
				<span>Lunch a Go-Go</span>
			</a>
			<span class="spacer"></span>
			<a href="/me" class="btn btn-sm btn-ghost" aria-label="Account">
				{data.profile?.display_name ?? 'Account'}
			</a>
		</header>

		<main class="content">
			{@render children()}
		</main>

		<nav class="tabnav" aria-label="Primary">
			{#each nav as item (item.href)}
				<a href={item.href} aria-current={isActive(item) ? 'page' : undefined}>
					<span class="ico" aria-hidden="true">{item.ico}</span>
					<span>{item.label}</span>
				</a>
			{/each}
		</nav>
	</div>
{:else}
	{@render children()}
{/if}
