<script lang="ts">
	import { onMount } from 'svelte';
	import MapView from '$lib/components/Map.svelte';
	import { getPosition, formatDistance } from '$lib/geo';
	import type { NearbyTruck } from '$lib/types';

	let { data } = $props();

	const RADII = [1, 3, 5, 10, 25];
	function loadRadius(): number {
		try {
			const v = Number(localStorage.getItem('lagg:radius'));
			return RADII.includes(v) ? v : 5;
		} catch {
			return 5;
		}
	}

	let status = $state<'locating' | 'ready' | 'error'>('locating');
	let errorMsg = $state('');
	let me = $state<{ lat: number; lng: number } | null>(null);
	let trucks = $state<NearbyTruck[]>([]);
	let radiusMi = $state(loadRadius());
	let searching = $state(false);

	async function search(m: { lat: number; lng: number }, r: number) {
		searching = true;
		const { data: rows, error } = await data.supabase.rpc('nearby_trucks', {
			p_lat: m.lat,
			p_lng: m.lng,
			p_radius_m: r * 1609.344,
			p_limit: 50
		});
		searching = false;
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
			status = 'ready';
		} catch (e) {
			status = 'error';
			errorMsg = e instanceof Error ? e.message : 'Could not get your location.';
		}
	}

	// Refetch whenever we have a location or the radius changes; remember the radius.
	$effect(() => {
		const r = radiusMi;
		const m = me;
		try {
			localStorage.setItem('lagg:radius', String(r));
		} catch {
			/* private mode — fine */
		}
		if (m) search(m, r);
	});

	onMount(locate);
</script>

<svelte:head><title>Nearby · Lunch a Go-Go</title></svelte:head>

<div class="row between" style="margin-bottom:.6rem">
	<h1 class="mb0">Nearby trucks</h1>
	<select bind:value={radiusMi} aria-label="Search radius" style="width:auto">
		{#each RADII as r (r)}<option value={r}>{r} mi</option>{/each}
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
	{#if me}<MapView {trucks} center={me} {me} radiusMeters={radiusMi * 1609.344} />{/if}

	<div class="stack" style="margin-top:.9rem">
		{#if searching}
			<div class="tiny muted data center">Searching within {radiusMi} mi…</div>
		{:else if trucks.length === 0}
			<div class="notice"><span class="emoji">🌭</span><p class="data mb0">No live trucks within {radiusMi} mi right now. Try a bigger radius — or if you run a truck, tap <a href="/truck/location">Go live</a> and you’ll show up here.</p></div>
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
