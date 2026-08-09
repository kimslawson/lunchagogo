<script lang="ts">
	import { onMount } from 'svelte';
	import MapView from '$lib/components/Map.svelte';
	import { getPosition, formatDistance } from '$lib/geo';
	import type { NearbyTruck } from '$lib/types';

	let { data } = $props();

	let status = $state<'locating' | 'ready' | 'error'>('locating');
	let errorMsg = $state('');
	let me = $state<{ lat: number; lng: number } | null>(null);
	let trucks = $state<NearbyTruck[]>([]);
	let radiusMi = $state(5);

	async function search() {
		if (!me) return;
		const { data: rows, error } = await data.supabase.rpc('nearby_trucks', {
			p_lat: me.lat,
			p_lng: me.lng,
			p_radius_m: radiusMi * 1609.344,
			p_limit: 50
		});
		if (error) {
			errorMsg = error.message;
			return;
		}
		trucks = rows ?? [];
	}

	async function locate() {
		status = 'locating';
		errorMsg = '';
		try {
			const pos = await getPosition();
			me = { lat: pos.coords.latitude, lng: pos.coords.longitude };
			await search();
			status = 'ready';
		} catch (e) {
			status = 'error';
			errorMsg = e instanceof Error ? e.message : 'Could not get your location.';
		}
	}

	onMount(locate);
</script>

<svelte:head><title>Nearby · Lunch a Go-Go</title></svelte:head>

<div class="row between" style="margin-bottom:.6rem">
	<h1 class="mb0">Nearby trucks</h1>
	<select bind:value={radiusMi} onchange={search} aria-label="Search radius" style="width:auto">
		<option value={1}>1 mi</option>
		<option value={3}>3 mi</option>
		<option value={5}>5 mi</option>
		<option value={10}>10 mi</option>
		<option value={25}>25 mi</option>
	</select>
</div>

{#if status === 'error'}
	<div class="notice">
		<span class="emoji">🧭</span>
		<h3>We need your location</h3>
		<p class="data">{errorMsg} Turn on location for Lunch a Go-Go to see trucks around you.</p>
		<button class="btn btn-primary" onclick={locate}>Try again</button>
	</div>
{:else if status === 'locating'}
	<div class="notice"><span class="emoji">🛰️</span><p class="data mb0">Finding trucks around you…</p></div>
{:else}
	{#if me}<MapView {trucks} center={me} {me} />{/if}

	<div class="stack" style="margin-top:.9rem">
		{#if trucks.length === 0}
			<div class="notice"><span class="emoji">🌭</span><p class="data mb0">No live trucks within {radiusMi} mi right now. Try a bigger radius!</p></div>
		{:else}
			{#each trucks as t (t.truck_id)}
				<a class="card tight row" href={`/trucks/${t.slug}`} style="gap:.7rem; color:inherit">
					<img class="avatar" src={t.logo_url ?? '/img/logo.jpg'} alt="" />
					<div class="grow">
						<div class="row" style="gap:.4rem"><strong>{t.name}</strong> <span class="badge live dot">LIVE</span></div>
						<div class="tiny muted data">{t.cuisine ?? 'Food truck'} · {formatDistance(t.distance_m)}</div>
						{#if t.address}<div class="tiny muted data">📍 {t.address}</div>{/if}
					</div>
					<span aria-hidden="true">›</span>
				</a>
			{/each}
		{/if}
	</div>
{/if}
