<script lang="ts">
	import { enhance } from '$app/forms';
	import { DAYS, type TruckHours } from '$lib/types';
	let { data, form } = $props();

	const byDay = $derived(new Map<number, TruckHours>(data.hours.map((h) => [h.day_of_week, h])));
</script>

<svelte:head><title>Hours · Lunch a Go-Go</title></svelte:head>

<h1>Regular hours</h1>
<p class="data muted">Your typical week. For one-off spots and times, use <a href="/truck/schedule">Schedule</a>.</p>

{#if form?.error}<div class="flash err">{form.error}</div>{/if}
{#if form?.saved}<div class="flash ok">Hours saved!</div>{/if}

<div class="card">
	<form method="POST" action="?/save" use:enhance>
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
