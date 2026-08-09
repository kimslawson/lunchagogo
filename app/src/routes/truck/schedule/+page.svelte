<script lang="ts">
	import { enhance } from '$app/forms';
	import { dayLabel, timeLabel } from '$lib/time';
	let { data, form } = $props();
</script>

<svelte:head><title>Schedule · Lunch a Go-Go</title></svelte:head>

<h1>Upcoming stops</h1>
<p class="data muted">Post where you’ll be, ahead of time. Foodies see these on your page.</p>

{#if form?.error}<div class="flash err">{form.error}</div>{/if}
{#if form?.added}<div class="flash ok">Added to your schedule!</div>{/if}

<div class="card">
	<div class="card-head"><h3 class="mb0">Add a stop</h3></div>
	<form method="POST" action="?/add" use:enhance>
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
				<form method="POST" action="?/remove" use:enhance>
					<input type="hidden" name="id" value={u.id} />
					<button class="btn btn-sm btn-danger">✕</button>
				</form>
			</div>
		{/each}
	</div>
{/if}
