<script lang="ts">
	import { enhance } from '$app/forms';
	import MapView from '$lib/components/Map.svelte';
	import { getPosition, fuzz } from '$lib/geo';
	import { clock, relTime, dayLabel, timeLabel } from '$lib/time';
	import { DAYS, type MenuItem, type NearbyTruck } from '$lib/types';

	let { data, form } = $props();

	let showCheckin = $state(false);
	let pos = $state<{ lat: number; lng: number } | null>(null);
	let locating = $state(false);

	async function openCheckin() {
		showCheckin = true;
		locating = true;
		try {
			const p = await getPosition();
			pos = { lat: fuzz(p.coords.latitude), lng: fuzz(p.coords.longitude) };
		} catch {
			pos = null;
		}
		locating = false;
	}

	const liveAsTruck = $derived<NearbyTruck[]>(
		data.live
			? [
					{
						truck_id: data.truck.id,
						name: data.truck.name,
						slug: data.truck.slug,
						logo_url: data.truck.logo_url,
						cuisine: data.truck.cuisine,
						lat: data.live.lat ?? 0,
						lng: data.live.lng ?? 0,
						address: data.live.address,
						distance_m: 0,
						last_seen: data.live.created_at
					}
				]
			: []
	);

	const menuSections = $derived.by(() => {
		const groups: Record<string, MenuItem[]> = {};
		for (const m of data.menu) (groups[m.section || 'Menu'] ??= []).push(m);
		return Object.entries(groups);
	});

	const hoursByDay = $derived.by(() => {
		const byDay = new Map(data.hours.map((h) => [h.day_of_week, h]));
		return DAYS.map((label, i) => ({ label, h: byDay.get(i) }));
	});
</script>

<svelte:head><title>{data.truck.name} · Lunch a Go-Go</title></svelte:head>

<!-- Header -->
<div class="card">
	<div class="row" style="gap:.8rem; align-items:flex-start">
		<img class="avatar lg" src={data.truck.logo_url ?? '/img/logo.jpg'} alt="" />
		<div class="grow">
			<div class="row" style="gap:.4rem; flex-wrap:wrap">
				<h1 class="mb0">{data.truck.name}</h1>
				{#if data.live}<span class="badge live dot">LIVE</span>{/if}
			</div>
			{#if data.truck.cuisine}<div class="muted data">{data.truck.cuisine}</div>{/if}
		</div>
	</div>
	{#if data.truck.bio}<p class="data" style="margin-bottom:.5rem">{data.truck.bio}</p>{/if}

	<div class="row wrap" style="gap:.5rem">
		{#if data.isOwner}
			<a class="btn btn-sm btn-blue" href="/truck">Edit my truck →</a>
		{:else if data.following}
			<form method="POST" action="?/unfollow" use:enhance>
				<button class="btn btn-sm">✓ Following</button>
			</form>
		{:else}
			<form method="POST" action="?/follow" use:enhance>
				<button class="btn btn-sm btn-primary">＋ Follow</button>
			</form>
		{/if}
		{#if data.truck.instagram}<a class="chip" href={`https://instagram.com/${data.truck.instagram}`}>📸 @{data.truck.instagram}</a>{/if}
		{#if data.truck.phone}<a class="chip" href={`tel:${data.truck.phone}`}>📞 Call</a>{/if}
	</div>
</div>

{#if form?.error}<div class="flash err">{form.error}</div>{/if}
{#if form?.checkedIn}<div class="flash ok">Grub grabbed! Your check-in is on {data.truck.name}’s feed. 😋</div>{/if}

<!-- Live location -->
{#if data.live}
	<div class="card">
		<div class="card-head"><h3 class="mb0">📍 Out right now</h3></div>
		{#if data.live.address}<p class="data" style="margin:.2rem 0 .6rem">{data.live.address}</p>{/if}
		{#if data.live.lat != null && data.live.lng != null}
			<MapView trucks={liveAsTruck} center={{ lat: data.live.lat, lng: data.live.lng }} />
			<a class="btn btn-sm btn-ghost" style="margin-top:.6rem"
				href={`https://www.google.com/maps?q=${data.live.lat},${data.live.lng}`} target="_blank" rel="noopener">Open in Maps →</a>
		{/if}
	</div>
{:else}
	<div class="notice"><span class="emoji">😴</span><p class="data mb0">Not out on the streets right now. Follow to know when they roll out!</p></div>
{/if}

<!-- Grab some grub -->
{#if !data.isOwner}
	{#if !showCheckin}
		<button class="btn btn-grub" onclick={openCheckin}>📸 Grab some grub</button>
	{:else}
		<div class="card">
			<div class="card-head"><h3 class="mb0">Grab some grub</h3></div>
			<form method="POST" action="?/checkin" enctype="multipart/form-data"
				use:enhance={() => async ({ update }) => { await update(); showCheckin = false; pos = null; }}>
				<input type="hidden" name="lat" value={pos?.lat ?? ''} />
				<input type="hidden" name="lng" value={pos?.lng ?? ''} />
				<div class="field">
					<label for="photo">Snap your plate</label>
					<input id="photo" name="photo" type="file" accept="image/*" capture="environment" />
				</div>
				<div class="field">
					<label for="caption">Say something</label>
					<textarea id="caption" name="caption" maxlength="280" placeholder="Best tacos in town 🌮"></textarea>
				</div>
				<div class="tiny muted data" style="margin-bottom:.6rem">
					{#if locating}Grabbing your rough location…{:else if pos}📍 We’ll tag your neighborhood (fuzzed for privacy).{:else}Location off — that’s fine, we’ll skip it.{/if}
				</div>
				<div class="row">
					<button class="btn btn-primary grow" type="submit">Post check-in</button>
					<button class="btn btn-ghost" type="button" onclick={() => (showCheckin = false)}>Cancel</button>
				</div>
			</form>
		</div>
	{/if}
{/if}

<!-- Specials -->
{#if data.specials.length}
	<div class="card">
		<div class="card-head"><h3 class="mb0">🔥 Today’s specials</h3></div>
		<div class="stack">
			{#each data.specials as s (s.id)}
				<div class="row" style="gap:.7rem; align-items:flex-start">
					{#if s.photo_url}<img class="avatar" src={s.photo_url} alt="" />{/if}
					<div class="grow">
						<strong>{s.title}</strong>
						{#if s.price != null}<span class="price"> ${Number(s.price).toFixed(2)}</span>{/if}
						{#if s.description}<div class="data muted">{s.description}</div>{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

<!-- Menu -->
{#if data.menu.length}
	<div class="card">
		<div class="card-head"><h3 class="mb0">🍔 Menu</h3></div>
		{#each menuSections as [section, items] (section)}
			<h4 class="data" style="margin:.6rem 0 .3rem; color:var(--orange-deep)">{section}</h4>
			<div class="stack">
				{#each items as m (m.id)}
					<div class="row between" style="gap:.6rem; opacity:{m.is_available ? 1 : 0.5}">
						<div>
							<strong class="data">{m.name}</strong>{#if !m.is_available}<span class="tiny muted"> — sold out</span>{/if}
							{#if m.description}<div class="tiny muted data">{m.description}</div>{/if}
						</div>
						{#if m.price != null}<span class="price">${Number(m.price).toFixed(2)}</span>{/if}
					</div>
				{/each}
			</div>
		{/each}
	</div>
{/if}

<!-- Hours -->
{#if data.hours.length}
	<div class="card">
		<div class="card-head"><h3 class="mb0">🕒 Regular hours</h3></div>
		<div class="stack">
			{#each hoursByDay as row (row.label)}
				<div class="row between data">
					<strong>{row.label}</strong>
					<span class="muted">
						{#if !row.h || row.h.is_closed || !row.h.open_time}Closed{:else}{clock(row.h.open_time)} – {clock(row.h.close_time)}{/if}
					</span>
				</div>
			{/each}
		</div>
	</div>
{/if}

<!-- Upcoming -->
{#if data.upcoming.length}
	<div class="card">
		<div class="card-head"><h3 class="mb0">🗓️ Upcoming stops</h3></div>
		<div class="stack">
			{#each data.upcoming as u (u.id)}
				<div class="data">
					<strong>{dayLabel(u.starts_at!)}</strong> · {timeLabel(u.starts_at!)}{#if u.ends_at}–{timeLabel(u.ends_at)}{/if}
					<div class="tiny muted">📍 {u.address ?? u.label ?? 'Location TBA'}</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

<!-- The truck's feed -->
<div class="card">
	<div class="card-head"><h3 class="mb0">😋 Grub feed</h3></div>
	{#if data.checkins.length === 0}
		<p class="data muted mb0">No check-ins yet — be the first to grab some grub!</p>
	{:else}
		<div class="stack">
			{#each data.checkins as c (c.id)}
				<div class="row" style="gap:.6rem; align-items:flex-start">
					{#if c.actor_avatar}<img class="avatar sm" src={c.actor_avatar} alt="" />{/if}
					<div class="grow">
						<div class="data"><strong>{c.actor_name}</strong> <span class="muted tiny">{relTime(c.created_at)}</span></div>
						{#if c.caption}<div class="data">“{c.caption}”</div>{/if}
						{#if c.photo_url}<img src={c.photo_url} alt="" loading="lazy" style="width:100%; border-radius:10px; border:2px solid var(--ink); margin-top:.3rem" />{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
