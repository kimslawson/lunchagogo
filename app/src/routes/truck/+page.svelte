<script lang="ts">
	import { relTime } from '$lib/time';
	let { data } = $props();
	const truck = $derived(data.truck!);
</script>

<svelte:head><title>My Truck · Lunch a Go-Go</title></svelte:head>

<div class="row between" style="margin-bottom:.6rem">
	<h1 class="mb0">{truck.name}</h1>
	<a class="btn btn-sm btn-ghost" href={`/trucks/${truck.slug}`}>View public page →</a>
</div>

<!-- Live status -->
<div class="card">
	{#if data.live}
		<div class="row between">
			<div>
				<span class="badge live dot">LIVE NOW</span>
				<div class="data" style="margin-top:.3rem">📍 {data.live.address ?? 'Location set'}</div>
				<div class="tiny muted">since {relTime(data.live.created_at)}</div>
			</div>
			<a class="btn btn-primary" href="/truck/location">Update</a>
		</div>
	{:else}
		<div class="row between">
			<div><strong class="data">You’re offline</strong><div class="tiny muted">Foodies can’t see you on the map.</div></div>
			<a class="btn btn-primary" href="/truck/location">📍 Go live</a>
		</div>
	{/if}
</div>

<!-- Stats -->
<div class="row" style="gap:.6rem; margin-bottom:.9rem">
	<div class="card tight center grow mb0"><div style="font-family:var(--font-display); font-size:1.8rem">{data.followerCount}</div><div class="tiny muted">followers</div></div>
	<div class="card tight center grow mb0"><div style="font-family:var(--font-display); font-size:1.8rem">{data.checkinCount}</div><div class="tiny muted">check-ins</div></div>
	<div class="card tight center grow mb0"><div style="font-family:var(--font-display); font-size:1.8rem">{data.specialCount}</div><div class="tiny muted">specials</div></div>
</div>

<!-- Quick actions -->
<div class="stack">
	<a class="card row between" href="/truck/location" style="color:inherit"><span>📍 <strong>Location</strong> — go live &amp; scheduled stops</span><span>›</span></a>
	<a class="card row between" href="/truck/menu" style="color:inherit"><span>🍔 <strong>Menu</strong> — your permanent lineup</span><span>›</span></a>
	<a class="card row between" href="/truck/specials" style="color:inherit"><span>🔥 <strong>Specials</strong> — post today’s features</span><span>›</span></a>
	<a class="card row between" href="/truck/hours" style="color:inherit"><span>🕒 <strong>Hours</strong> — weekly schedule</span><span>›</span></a>
	<a class="card row between" href="/truck/schedule" style="color:inherit"><span>🗓️ <strong>Schedule</strong> — future locations</span><span>›</span></a>
	<a class="card row between" href="/truck/patrons" style="color:inherit"><span>👥 <strong>Patrons</strong> — who’s grabbing your grub</span><span>›</span></a>
	<a class="card row between" href="/truck/setup" style="color:inherit"><span>⚙️ <strong>Truck profile</strong> — name, logo, bio</span><span>›</span></a>
</div>
