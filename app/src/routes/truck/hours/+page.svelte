<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { supabase } from '$lib/supabaseClient';
	import { DAYS, type TruckHours } from '$lib/types';

	let { data } = $props();
	let error = $state('');
	let saved = $state(false);

	const byDay = $derived(new Map<number, TruckHours>(data.hours.map((h) => [h.day_of_week, h])));

	async function save(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		saved = false;
		const fd = new FormData(e.target as HTMLFormElement);
		const rows = Array.from({ length: 7 }, (_, d) => {
			const closed = fd.get(`closed_${d}`) === 'on';
			const open = String(fd.get(`open_${d}`) ?? '');
			const close = String(fd.get(`close_${d}`) ?? '');
			return {
				truck_id: data.truck!.id,
				day_of_week: d,
				is_closed: closed,
				open_time: closed || !open ? null : open,
				close_time: closed || !close ? null : close
			};
		});
		const { error: err } = await supabase
			.from('truck_hours')
			.upsert(rows, { onConflict: 'truck_id,day_of_week' });
		if (err) return (error = err.message);
		saved = true;
		await invalidateAll();
	}
</script>

<svelte:head><title>Hours · Lunch a Go-Go</title></svelte:head>

<h1>Regular hours</h1>
<p class="data muted">Your typical week. For one-off spots and times, use <a href="/truck/schedule">Schedule</a>.</p>

{#if error}<div class="flash err">{error}</div>{/if}
{#if saved}<div class="flash ok">Hours saved!</div>{/if}

<div class="card">
	<form onsubmit={save}>
		<div class="stack">
			{#each DAYS as label, d (d)}
				{@const h = byDay.get(d)}
				<div class="row" style="gap:.5rem; align-items:center">
					<strong class="data" style="width:3ch">{label}</strong>
					<input type="time" name={`open_${d}`} value={h?.open_time ?? ''} aria-label={`${label} open`} style="flex:1" />
					<span>–</span>
					<input type="time" name={`close_${d}`} value={h?.close_time ?? ''} aria-label={`${label} close`} style="flex:1" />
					<label class="chip" style="cursor:pointer">
						<input type="checkbox" name={`closed_${d}`} checked={h?.is_closed} style="width:auto; box-shadow:none" /> closed
					</label>
				</div>
			{/each}
		</div>
		<button class="btn btn-primary btn-lg" type="submit" style="margin-top:.9rem">Save hours</button>
	</form>
</div>
