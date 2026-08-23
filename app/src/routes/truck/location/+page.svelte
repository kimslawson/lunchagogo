<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { supabase } from '$lib/supabaseClient';
	import { getPosition } from '$lib/geo';
	import { relTime } from '$lib/time';

	let { data } = $props();

	// Seed local state from the initial load (untrack = "just the first value").
	let lat = $state<number | null>(untrack(() => data.live?.lat ?? null));
	let lng = $state<number | null>(untrack(() => data.live?.lng ?? null));
	let address = $state(untrack(() => data.live?.address ?? ''));
	let locating = $state(false);
	let geoErr = $state('');
	let error = $state('');
	let flash = $state('');

	async function useMyLocation() {
		locating = true;
		geoErr = '';
		try {
			const p = await getPosition();
			lat = Number(p.coords.latitude.toFixed(5));
			lng = Number(p.coords.longitude.toFixed(5));
		} catch (e) {
			geoErr = e instanceof Error ? e.message : 'Could not get GPS.';
		}
		locating = false;
	}

	async function goLive(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		flash = '';
		if (lat == null || lng == null) return (error = 'Tap “Use my location” first.');

		await supabase.from('truck_locations').update({ is_live: false }).eq('truck_id', data.truck!.id).eq('is_live', true);
		const { error: err } = await supabase.from('truck_locations').insert({
			truck_id: data.truck!.id,
			lat,
			lng,
			address: address || null,
			is_live: true,
			starts_at: new Date().toISOString()
		});
		if (err) return (error = err.message);

		try {
			await supabase.functions.invoke('notify', {
				body: {
					truck_id: data.truck!.id,
					title: `${data.truck!.name} is out! 🚚`,
					body: address ? `Now at ${address}` : 'Rolling now — come grab some grub!',
					url: `/trucks/${data.truck!.slug}`
				}
			});
		} catch {
			/* notifications optional */
		}
		flash = 'You’re live! Followers with alerts on just got pinged. 📣';
		await invalidateAll();
	}

	async function endLive() {
		await supabase.from('truck_locations').update({ is_live: false }).eq('truck_id', data.truck!.id).eq('is_live', true);
		flash = 'You’re offline now.';
		await invalidateAll();
	}

	onMount(() => {
		if (!data.live) useMyLocation();
	});
</script>

<svelte:head><title>Location · Lunch a Go-Go</title></svelte:head>

<h1>Where are you?</h1>

{#if error}<div class="flash err">{error}</div>{/if}
{#if flash}<div class="flash ok">{flash}</div>{/if}

{#if data.live}
	<div class="card">
		<span class="badge live dot">LIVE NOW</span>
		<p class="data" style="margin:.4rem 0">📍 {data.live.address ?? `${data.live.lat}, ${data.live.lng}`}</p>
		<div class="tiny muted">Live since {relTime(data.live.created_at)}</div>
		<button class="btn btn-danger" style="margin-top:.6rem" onclick={endLive}>End shift (go offline)</button>
	</div>
	<hr class="rule" />
	<h3>Move to a new spot</h3>
{/if}

<div class="card">
	<form onsubmit={goLive}>
		<button type="button" class="btn btn-blue" onclick={useMyLocation} disabled={locating} style="margin-bottom:.7rem">
			{locating ? 'Locating…' : '📍 Use my location'}
		</button>
		{#if geoErr}<div class="tiny data" style="color:var(--red); margin-bottom:.5rem">{geoErr}</div>{/if}

		{#if lat != null && lng != null}
			<div class="chip data" style="margin-bottom:.7rem">Pinned: {lat}, {lng}</div>
		{/if}

		<div class="field">
			<label for="address">Address / cross-streets</label>
			<input id="address" maxlength="140" bind:value={address} placeholder="5th &amp; Main, by the park" />
			<div class="hint">Shown to foodies. Your exact GPS pin comes from the button above.</div>
		</div>

		<button class="btn btn-primary btn-lg" type="submit" disabled={lat == null}>
			{data.live ? 'Update my spot' : '🚚 Go live'}
		</button>
	</form>
</div>
