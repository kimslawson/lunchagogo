<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount, untrack } from 'svelte';
	import { getPosition } from '$lib/geo';
	import { relTime } from '$lib/time';

	let { data, form } = $props();

	// Seed local state from the initial load (untrack = "just the first value").
	let lat = $state<number | null>(untrack(() => data.live?.lat ?? null));
	let lng = $state<number | null>(untrack(() => data.live?.lng ?? null));
	let address = $state(untrack(() => data.live?.address ?? ''));
	let locating = $state(false);
	let geoErr = $state('');

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

	onMount(() => {
		if (!data.live) useMyLocation();
	});
</script>

<svelte:head><title>Location · Lunch a Go-Go</title></svelte:head>

<h1>Where are you?</h1>

{#if form?.error}<div class="flash err">{form.error}</div>{/if}
{#if form?.live === true}<div class="flash ok">You’re live! Followers with alerts on just got pinged. 📣</div>{/if}
{#if form?.live === false}<div class="flash ok">You’re offline now.</div>{/if}

{#if data.live}
	<div class="card">
		<span class="badge live dot">LIVE NOW</span>
		<p class="data" style="margin:.4rem 0">📍 {data.live.address ?? `${data.live.lat}, ${data.live.lng}`}</p>
		<div class="tiny muted">Live since {relTime(data.live.created_at)}</div>
		<form method="POST" action="?/endLive" use:enhance style="margin-top:.6rem">
			<button class="btn btn-danger">End shift (go offline)</button>
		</form>
	</div>
	<hr class="rule" />
	<h3>Move to a new spot</h3>
{/if}

<div class="card">
	<form method="POST" action="?/goLive" use:enhance>
		<button type="button" class="btn btn-blue" onclick={useMyLocation} disabled={locating} style="margin-bottom:.7rem">
			{locating ? 'Locating…' : '📍 Use my location'}
		</button>
		{#if geoErr}<div class="tiny data" style="color:var(--red); margin-bottom:.5rem">{geoErr}</div>{/if}

		{#if lat != null && lng != null}
			<div class="chip data" style="margin-bottom:.7rem">Pinned: {lat}, {lng}</div>
		{/if}

		<div class="field">
			<label for="address">Address / cross-streets</label>
			<input id="address" name="address" maxlength="140" bind:value={address} placeholder="5th &amp; Main, by the park" />
			<div class="hint">Shown to foodies. Your exact GPS pin comes from the button above.</div>
		</div>

		<input type="hidden" name="lat" value={lat ?? ''} />
		<input type="hidden" name="lng" value={lng ?? ''} />
		<button class="btn btn-primary btn-lg" type="submit" disabled={lat == null}>
			{data.live ? 'Update my spot' : '🚚 Go live'}
		</button>
	</form>
</div>
