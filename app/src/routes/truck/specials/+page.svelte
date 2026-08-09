<script lang="ts">
	import { enhance } from '$app/forms';
	import { relTime } from '$lib/time';
	let { data, form } = $props();
	const now = Date.now();
</script>

<svelte:head><title>Specials · Lunch a Go-Go</title></svelte:head>

<h1>Specials</h1>
<p class="data muted">Post a special and it hits the feed of everyone who follows you.</p>

{#if form?.error}<div class="flash err">{form.error}</div>{/if}
{#if form?.added}<div class="flash ok">Posted! It’s on your followers’ feeds now. 🔥</div>{/if}

<div class="card">
	<div class="card-head"><h3 class="mb0">New special</h3></div>
	<form method="POST" action="?/add" enctype="multipart/form-data" use:enhance>
		<div class="field-row">
			<div class="field" style="flex:2"><label for="title">Title</label><input id="title" name="title" required placeholder="$5 Taco Tuesday" /></div>
			<div class="field"><label for="price">Price</label><input id="price" name="price" inputmode="decimal" placeholder="5.00" /></div>
		</div>
		<div class="field"><label for="description">Details</label><textarea id="description" name="description" maxlength="300" placeholder="All day, dine-in or takeout"></textarea></div>
		<div class="field"><label for="photo">Photo</label><input id="photo" name="photo" type="file" accept="image/*" /></div>
		<div class="field"><label for="active_until">Ends (optional)</label><input id="active_until" name="active_until" type="datetime-local" /></div>
		<button class="btn btn-primary" type="submit">📣 Post special</button>
	</form>
</div>

{#if data.specials.length === 0}
	<div class="notice"><span class="emoji">🔥</span><p class="data mb0">No specials yet.</p></div>
{:else}
	<div class="stack">
		{#each data.specials as s (s.id)}
			{@const expired = s.active_until && new Date(s.active_until).getTime() < now}
			<div class="card row" style="gap:.7rem; align-items:flex-start; opacity:{expired ? 0.55 : 1}">
				{#if s.photo_url}<img class="avatar lg" src={s.photo_url} alt="" />{/if}
				<div class="grow">
					<div class="row" style="gap:.4rem">
						<strong>{s.title}</strong>
						{#if s.price != null}<span class="price">${Number(s.price).toFixed(2)}</span>{/if}
						{#if expired}<span class="badge">ended</span>{:else}<span class="badge new">active</span>{/if}
					</div>
					{#if s.description}<div class="data muted">{s.description}</div>{/if}
					<div class="tiny muted">posted {relTime(s.created_at)}</div>
				</div>
				<form method="POST" action="?/remove" use:enhance>
					<input type="hidden" name="id" value={s.id} />
					<button class="btn btn-sm btn-danger">✕</button>
				</form>
			</div>
		{/each}
	</div>
{/if}
