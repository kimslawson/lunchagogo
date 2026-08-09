<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { supabase } from '$lib/supabaseClient';
	import { uploadImage, toNum } from '$lib/upload';
	import { relTime } from '$lib/time';

	let { data } = $props();
	let error = $state('');
	let added = $state(false);
	const now = Date.now();

	async function addSpecial(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		added = false;
		const form = e.target as HTMLFormElement;
		const fd = new FormData(form);
		const title = String(fd.get('title') ?? '').trim().slice(0, 100);
		if (!title) return (error = 'Give your special a title.');

		const photo = fd.get('photo');
		const up = await uploadImage(data.user!.id, 'specials', photo instanceof File ? photo : null);
		if (up.error) return (error = up.error);

		const until = String(fd.get('active_until') ?? '').trim();
		const { error: err } = await supabase.from('specials').insert({
			truck_id: data.truck!.id,
			title,
			description: String(fd.get('description') ?? '').trim().slice(0, 300) || null,
			price: toNum(fd.get('price')),
			photo_url: up.url ?? null,
			active_until: until ? new Date(until).toISOString() : null
		});
		if (err) return (error = err.message);
		form.reset();
		added = true;
		await invalidateAll();
	}

	async function remove(id: string) {
		await supabase.from('specials').delete().eq('id', id);
		await invalidateAll();
	}
</script>

<svelte:head><title>Specials · Lunch a Go-Go</title></svelte:head>

<h1>Specials</h1>
<p class="data muted">Post a special and it hits the feed of everyone who follows you.</p>

{#if error}<div class="flash err">{error}</div>{/if}
{#if added}<div class="flash ok">Posted! It’s on your followers’ feeds now. 🔥</div>{/if}

<div class="card">
	<div class="card-head"><h3 class="mb0">New special</h3></div>
	<form onsubmit={addSpecial}>
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
				<button class="btn btn-sm btn-danger" onclick={() => remove(s.id)}>✕</button>
			</div>
		{/each}
	</div>
{/if}
