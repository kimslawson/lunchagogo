<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();
	const t = $derived(data.truck);
	const v = $derived(form?.values);
	const isNew = $derived(!t);
</script>

<svelte:head><title>Truck profile · Lunch a Go-Go</title></svelte:head>

<h1>{isNew ? 'Set up your truck' : 'Truck profile'}</h1>
{#if isNew}<p class="data muted">This is what foodies see. You can change it anytime.</p>{/if}

{#if form?.saved}<div class="flash ok">Saved!</div>{/if}
{#if form?.error}<div class="flash err">{form.error}</div>{/if}

<div class="card">
	<form method="POST" enctype="multipart/form-data" use:enhance>
		<div class="field">
			<label for="name">Truck name <span class="req">*</span></label>
			<input id="name" name="name" required maxlength="80" value={v?.name ?? t?.name ?? ''} placeholder="Taylor's Tasty Treats Truck" />
		</div>
		<div class="field">
			<label for="cuisine">Cuisine / vibe</label>
			<input id="cuisine" name="cuisine" maxlength="60" value={v?.cuisine ?? t?.cuisine ?? ''} placeholder="Tacos · Vegan · BBQ" />
		</div>
		<div class="field">
			<label for="logo">Logo</label>
			{#if t?.logo_url}<img class="avatar lg" src={t.logo_url} alt="" style="margin-bottom:.4rem" />{/if}
			<input id="logo" name="logo" type="file" accept="image/*" />
		</div>
		<div class="field">
			<label for="bio">About</label>
			<textarea id="bio" name="bio" maxlength="500" placeholder="The tastiest treats on four wheels.">{v?.bio ?? t?.bio ?? ''}</textarea>
		</div>
		<div class="field-row">
			<div class="field">
				<label for="phone">Phone</label>
				<input id="phone" name="phone" type="tel" maxlength="30" value={v?.phone ?? t?.phone ?? ''} />
			</div>
			<div class="field">
				<label for="instagram">Instagram</label>
				<input id="instagram" name="instagram" maxlength="60" value={v?.instagram ?? t?.instagram ?? ''} placeholder="lunchagogo" />
			</div>
		</div>
		<div class="field">
			<label for="website">Website</label>
			<input id="website" name="website" type="url" maxlength="200" value={v?.website ?? t?.website ?? ''} placeholder="https://…" />
		</div>
		<button class="btn btn-primary btn-lg" type="submit">{isNew ? 'Create my truck 🚚' : 'Save'}</button>
	</form>
</div>
