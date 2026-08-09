<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { supabase } from '$lib/supabaseClient';
	import { dayLabel, timeLabel } from '$lib/time';

	let { data } = $props();
	let error = $state('');
	let added = $state(false);

	async function addStop(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		added = false;
		const form = e.target as HTMLFormElement;
		const fd = new FormData(form);
		const starts = String(fd.get('starts_at') ?? '').trim();
		const ends = String(fd.get('ends_at') ?? '').trim();
		const address = String(fd.get('address') ?? '').trim().slice(0, 140);
		if (!starts) return (error = 'Pick a start date & time.');
		if (!address) return (error = 'Where will you be?');

		const { error: err } = await supabase.from('truck_locations').insert({
			truck_id: data.truck!.id,
			is_live: false,
			address,
			label: String(fd.get('label') ?? '').trim().slice(0, 80) || null,
			starts_at: new Date(starts).toISOString(),
			ends_at: ends ? new Date(ends).toISOString() : null
		});
		if (err) return (error = err.message);
		form.reset();
		added = true;
		await invalidateAll();
	}

	async function remove(id: string) {
		await supabase.from('truck_locations').delete().eq('id', id);
		await invalidateAll();
	}
</script>

<svelte:head><title>Schedule · Lunch a Go-Go</title></svelte:head>

<h1>Upcoming stops</h1>
<p class="data muted">Post where you’ll be, ahead of time. Foodies see these on your page.</p>

{#if error}<div class="flash err">{error}</div>{/if}
{#if added}<div class="flash ok">Added to your schedule!</div>{/if}

<div class="card">
	<div class="card-head"><h3 class="mb0">Add a stop</h3></div>
	<form onsubmit={addStop}>
		<div class="field"><label for="address">Where <span class="req">*</span></label><input id="address" name="address" required maxlength="140" placeholder="Riverside Farmers Market" /></div>
		<div class="field-row">
			<div class="field"><label for="starts_at">Starts <span class="req">*</span></label><input id="starts_at" name="starts_at" type="datetime-local" required /></div>
			<div class="field"><label for="ends_at">Ends</label><input id="ends_at" name="ends_at" type="datetime-local" /></div>
		</div>
		<button class="btn btn-primary" type="submit">＋ Add stop</button>
	</form>
</div>

{#if data.upcoming.length === 0}
	<div class="notice"><span class="emoji">🗓️</span><p class="data mb0">No upcoming stops scheduled.</p></div>
{:else}
	<div class="stack">
		{#each data.upcoming as u (u.id)}
			<div class="card row between" style="gap:.6rem">
				<div class="data">
					<strong>{dayLabel(u.starts_at!)}</strong> · {timeLabel(u.starts_at!)}{#if u.ends_at}–{timeLabel(u.ends_at)}{/if}
					<div class="tiny muted">📍 {u.address ?? u.label}</div>
				</div>
				<button class="btn btn-sm btn-danger" onclick={() => remove(u.id)}>✕</button>
			</div>
		{/each}
	</div>
{/if}
