<script lang="ts">
	import { untrack } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { supabase } from '$lib/supabaseClient';
	import { uploadImage } from '$lib/upload';
	import { enablePush, pushSupported } from '$lib/push';

	let { data } = $props();

	let pushOn = $state(untrack(() => !!data.profile?.push_opt_in));
	let pushMsg = $state('');
	let working = $state(false);
	let flash = $state('');
	let error = $state('');

	async function saveProfile(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		flash = '';
		const form = e.target as HTMLFormElement;
		const fd = new FormData(form);
		const file = fd.get('avatar');
		const up = await uploadImage(data.user!.id, 'avatars', file instanceof File ? file : null);
		if (up.error) return (error = up.error);

		const patch = {
			display_name: String(fd.get('display_name') ?? '').trim().slice(0, 60) || 'Foodie',
			home_zip: String(fd.get('home_zip') ?? '').trim().slice(0, 12) || null,
			...(up.url ? { avatar_url: up.url } : {})
		};
		const { error: err } = await supabase.from('profiles').update(patch).eq('id', data.user!.id);
		if (err) return (error = err.message);
		flash = 'Saved!';
		await invalidateAll();
	}

	async function toggleNotify(truckId: string, notify: boolean) {
		await supabase.from('follows').update({ notify }).eq('foodie_id', data.user!.id).eq('truck_id', truckId);
		await invalidateAll();
	}

	async function turnOnPush() {
		working = true;
		pushMsg = '';
		const res = await enablePush(supabase, data.profile!.id);
		working = false;
		if (res.ok) {
			pushOn = true;
			pushMsg = 'Notifications on! We’ll ping you when a truck you follow rolls near. 🔔';
		} else {
			pushMsg = res.error ?? 'Could not enable notifications.';
		}
	}

	async function logout() {
		await supabase.auth.signOut();
		goto('/');
	}
</script>

<svelte:head><title>Account · Lunch a Go-Go</title></svelte:head>

<h1>Hey, {data.profile?.display_name} 👋</h1>

{#if flash}<div class="flash ok">{flash}</div>{/if}
{#if error}<div class="flash err">{error}</div>{/if}

{#if data.profile?.role === 'truck'}
	<a class="btn btn-blue btn-lg" href="/truck" style="margin-bottom:.9rem">🚚 Go to my truck dashboard</a>
{/if}

<div class="card">
	<div class="card-head"><h3 class="mb0">Your profile</h3></div>
	<div class="row" style="gap:.7rem; margin-bottom:.6rem">
		<img class="avatar lg" src={data.profile?.avatar_url ?? '/img/logo.jpg'} alt="" />
		<div class="data muted">This is how you show up when you grab some grub.</div>
	</div>
	<form onsubmit={saveProfile}>
		<div class="field">
			<label for="display_name">Display name</label>
			<input id="display_name" name="display_name" maxlength="60" value={data.profile?.display_name ?? ''} />
		</div>
		<div class="field">
			<label for="avatar">Photo</label>
			<input id="avatar" name="avatar" type="file" accept="image/*" />
		</div>
		<div class="field">
			<label for="home_zip">ZIP code</label>
			<input id="home_zip" name="home_zip" inputmode="numeric" maxlength="12" value={data.profile?.home_zip ?? ''} />
		</div>
		<button class="btn btn-primary" type="submit">Save</button>
	</form>
</div>

<div class="card">
	<div class="card-head"><h3 class="mb0">🔔 Notifications</h3></div>
	{#if pushOn}
		<p class="data mb0">You’re set to get a ping when a truck you follow is near. Free, no texts needed.</p>
	{:else if pushSupported()}
		<p class="data">Get a free push notification when a followed truck rolls into your neighborhood.</p>
		<button class="btn btn-primary" onclick={turnOnPush} disabled={working}>
			{working ? 'Turning on…' : 'Turn on notifications'}
		</button>
	{:else}
		<p class="data muted mb0">Add Lunch a Go-Go to your home screen to enable notifications on this device.</p>
	{/if}
	{#if pushMsg}<div class="tiny data" style="margin-top:.5rem">{pushMsg}</div>{/if}
</div>

{#if data.profile?.role !== 'truck'}
	<div class="card">
		<div class="card-head"><h3 class="mb0">Trucks you follow</h3></div>
		{#if data.follows.length === 0}
			<p class="data muted mb0">You’re not following anyone yet. <a href="/map">Find trucks →</a></p>
		{:else}
			<div class="stack">
				{#each data.follows as f (f.truck_id)}
					<div class="row between" style="gap:.6rem">
						<a class="row grow" href={`/trucks/${f.trucks?.slug}`} style="gap:.6rem; color:inherit">
							<img class="avatar sm" src={f.trucks?.logo_url ?? '/img/logo.jpg'} alt="" />
							<div><strong class="data">{f.trucks?.name}</strong></div>
						</a>
						<button class="btn btn-sm" title="Toggle nearby alerts" onclick={() => toggleNotify(f.truck_id, !f.notify)}>
							{f.notify ? '🔔' : '🔕'}
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<button class="btn btn-danger btn-lg" onclick={logout}>Log out</button>
