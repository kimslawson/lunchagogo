<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { supabase } from '$lib/supabaseClient';
	import { uploadImage } from '$lib/upload';
	import { uniqueSlug } from '$lib/slug';

	let { data } = $props();
	const t = $derived(data.truck);
	const isNew = $derived(!t);
	let error = $state('');
	let saved = $state('');
	let submitting = $state(false);

	async function save(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		saved = '';
		const fd = new FormData(e.target as HTMLFormElement);
		const name = String(fd.get('name') ?? '').trim();
		if (name.length < 2) return (error = 'Give your truck a name.');

		submitting = true;
		const logo = fd.get('logo');
		const up = await uploadImage(data.user!.id, 'trucks', logo instanceof File ? logo : null);
		if (up.error) {
			submitting = false;
			return (error = up.error);
		}
		const fields = {
			name,
			cuisine: String(fd.get('cuisine') ?? '').trim() || null,
			bio: String(fd.get('bio') ?? '').trim() || null,
			phone: String(fd.get('phone') ?? '').trim() || null,
			website: String(fd.get('website') ?? '').trim() || null,
			instagram: String(fd.get('instagram') ?? '').trim().replace(/^@/, '') || null,
			...(up.url ? { logo_url: up.url } : {})
		};

		if (t) {
			const { error: err } = await supabase.from('trucks').update(fields).eq('id', t.id);
			submitting = false;
			if (err) return (error = err.message);
			saved = 'Saved!';
			await invalidateAll();
		} else {
			const { error: err } = await supabase
				.from('trucks')
				.insert({ owner_id: data.user!.id, slug: uniqueSlug(name), ...fields });
			submitting = false;
			if (err) return (error = err.message);
			await invalidateAll();
			goto('/truck');
		}
	}
</script>

<svelte:head><title>Truck profile · Lunch a Go-Go</title></svelte:head>

<h1>{isNew ? 'Set up your truck' : 'Truck profile'}</h1>
{#if isNew}<p class="data muted">This is what foodies see. You can change it anytime.</p>{/if}

{#if saved}<div class="flash ok">{saved}</div>{/if}
{#if error}<div class="flash err">{error}</div>{/if}

<div class="card">
	<form onsubmit={save}>
		<div class="field">
			<label for="name">Truck name <span class="req">*</span></label>
			<input id="name" name="name" required maxlength="80" value={t?.name ?? ''} placeholder="Taylor's Tasty Treats Truck" />
		</div>
		<div class="field">
			<label for="cuisine">Cuisine / vibe</label>
			<input id="cuisine" name="cuisine" maxlength="60" value={t?.cuisine ?? ''} placeholder="Tacos · Vegan · BBQ" />
		</div>
		<div class="field">
			<label for="logo">Logo</label>
			{#if t?.logo_url}<img class="avatar lg" src={t.logo_url} alt="" style="margin-bottom:.4rem" />{/if}
			<input id="logo" name="logo" type="file" accept="image/*" />
		</div>
		<div class="field">
			<label for="bio">About</label>
			<textarea id="bio" name="bio" maxlength="500" placeholder="The tastiest treats on four wheels.">{t?.bio ?? ''}</textarea>
		</div>
		<div class="field-row">
			<div class="field">
				<label for="phone">Phone</label>
				<input id="phone" name="phone" type="tel" maxlength="30" value={t?.phone ?? ''} />
			</div>
			<div class="field">
				<label for="instagram">Instagram</label>
				<input id="instagram" name="instagram" maxlength="60" value={t?.instagram ?? ''} placeholder="lunchagogo" />
			</div>
		</div>
		<div class="field">
			<label for="website">Website</label>
			<input id="website" name="website" type="url" maxlength="200" value={t?.website ?? ''} placeholder="https://…" />
		</div>
		<button class="btn btn-primary btn-lg" type="submit" disabled={submitting}>
			{isNew ? 'Create my truck 🚚' : 'Save'}
		</button>
	</form>
</div>
