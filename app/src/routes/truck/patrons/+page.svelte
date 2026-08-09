<script lang="ts">
	import { relTime } from '$lib/time';
	let { data } = $props();
</script>

<svelte:head><title>Patrons · Lunch a Go-Go</title></svelte:head>

<h1>Your patrons</h1>
<p class="data muted">Who’s grabbing your grub — ranked by check-ins. GPS goes both ways: they find you, you learn who your regulars are.</p>

{#if data.patrons.length === 0}
	<div class="notice"><span class="emoji">👥</span><p class="data mb0">No check-ins yet. Once foodies grab some grub, your regulars show up here.</p></div>
{:else}
	<div class="stack">
		{#each data.patrons as p, i (p.foodie_id)}
			<div class="card row" style="gap:.7rem; align-items:center">
				<div style="font-family:var(--font-display); font-size:1.3rem; width:2ch; text-align:center">{i + 1}</div>
				<img class="avatar" src={p.avatar_url ?? '/img/logo.jpg'} alt="" />
				<div class="grow">
					<div class="row" style="gap:.4rem">
						<strong>{p.name}</strong>
						{#if p.follows}<span class="badge live">follows</span>{/if}
					</div>
					<div class="tiny muted data">{p.checkins} check-in{p.checkins === 1 ? '' : 's'} · last {relTime(p.last_checkin)}</div>
				</div>
			</div>
		{/each}
	</div>
{/if}
