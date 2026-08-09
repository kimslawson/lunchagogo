<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { supabase } from '$lib/supabaseClient';
	import { toNum } from '$lib/upload';
	import type { MenuItem } from '$lib/types';

	let { data } = $props();
	let error = $state('');

	const sections = $derived.by(() => {
		const groups: Record<string, MenuItem[]> = {};
		for (const m of data.menu) (groups[m.section || 'Menu'] ??= []).push(m);
		return Object.entries(groups);
	});

	async function addItem(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		const form = e.target as HTMLFormElement;
		const fd = new FormData(form);
		const name = String(fd.get('name') ?? '').trim().slice(0, 80);
		if (!name) return (error = 'Give the item a name.');

		const { error: err } = await supabase.from('menu_items').insert({
			truck_id: data.truck!.id,
			name,
			section: String(fd.get('section') ?? '').trim().slice(0, 40) || 'Menu',
			description: String(fd.get('description') ?? '').trim().slice(0, 200) || null,
			price: toNum(fd.get('price')),
			sort_order: Math.floor(Date.now() / 1000)
		});
		if (err) return (error = err.message);
		form.reset();
		await invalidateAll();
	}

	async function toggle(id: string, to: boolean) {
		await supabase.from('menu_items').update({ is_available: to }).eq('id', id);
		await invalidateAll();
	}

	async function remove(id: string) {
		await supabase.from('menu_items').delete().eq('id', id);
		await invalidateAll();
	}
</script>

<svelte:head><title>Menu · Lunch a Go-Go</title></svelte:head>

<h1>Your menu</h1>
<p class="data muted">Your permanent lineup. Sold out? Toggle an item off without deleting it.</p>

{#if error}<div class="flash err">{error}</div>{/if}

<div class="card">
	<div class="card-head"><h3 class="mb0">Add an item</h3></div>
	<form onsubmit={addItem}>
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
						<button class="btn btn-sm" title="Toggle available" onclick={() => toggle(m.id, !m.is_available)}>{m.is_available ? '✅' : '🚫'}</button>
						<button class="btn btn-sm btn-danger" title="Delete" onclick={() => remove(m.id)}>✕</button>
					</div>
				{/each}
			</div>
		</div>
	{/each}
{/if}
