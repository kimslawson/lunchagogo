<script lang="ts">
	import { enhance } from '$app/forms';
	import type { MenuItem } from '$lib/types';
	let { data, form } = $props();

	const sections = $derived.by(() => {
		const groups: Record<string, MenuItem[]> = {};
		for (const m of data.menu) (groups[m.section || 'Menu'] ??= []).push(m);
		return Object.entries(groups);
	});
</script>

<svelte:head><title>Menu · Lunch a Go-Go</title></svelte:head>

<h1>Your menu</h1>
<p class="data muted">Your permanent lineup. Sold out? Toggle an item off without deleting it.</p>

{#if form?.error}<div class="flash err">{form.error}</div>{/if}

<div class="card">
	<div class="card-head"><h3 class="mb0">Add an item</h3></div>
	<form method="POST" action="?/add" use:enhance>
		<div class="field-row">
			<div class="field" style="flex:2"><label for="name">Item</label><input id="name" name="name" required placeholder="Carne Asada Taco" /></div>
			<div class="field"><label for="price">Price</label><input id="price" name="price" inputmode="decimal" placeholder="3.50" /></div>
		</div>
		<div class="field"><label for="section">Section</label><input id="section" name="section" placeholder="Tacos" /></div>
		<div class="field"><label for="description">Description</label><input id="description" name="description" maxlength="200" placeholder="Grilled steak, onion, cilantro" /></div>
		<button class="btn btn-primary" type="submit">＋ Add item</button>
	</form>
</div>

{#if data.menu.length === 0}
	<div class="notice"><span class="emoji">🍔</span><p class="data mb0">No menu items yet. Add your first above!</p></div>
{:else}
	{#each sections as [section, items] (section)}
		<div class="card">
			<div class="card-head"><h3 class="mb0">{section}</h3></div>
			<div class="stack">
				{#each items as m (m.id)}
					<div class="row between" style="gap:.5rem; opacity:{m.is_available ? 1 : 0.5}">
						<div class="grow">
							<strong class="data">{m.name}</strong>
							{#if m.price != null}<span class="price"> ${Number(m.price).toFixed(2)}</span>{/if}
							{#if m.description}<div class="tiny muted data">{m.description}</div>{/if}
						</div>
						<form method="POST" action="?/toggle" use:enhance>
							<input type="hidden" name="id" value={m.id} />
							<input type="hidden" name="to" value={(!m.is_available).toString()} />
							<button class="btn btn-sm" title="Toggle available">{m.is_available ? '✅' : '🚫'}</button>
						</form>
						<form method="POST" action="?/remove" use:enhance>
							<input type="hidden" name="id" value={m.id} />
							<button class="btn btn-sm btn-danger" title="Delete">✕</button>
						</form>
					</div>
				{/each}
			</div>
		</div>
	{/each}
{/if}
