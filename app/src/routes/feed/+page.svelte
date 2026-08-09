<script lang="ts">
	import FeedCard from '$lib/components/FeedCard.svelte';
	let { data } = $props();
</script>

<svelte:head><title>Feed · Lunch a Go-Go</title></svelte:head>

<div class="row between" style="margin-bottom:.6rem">
	<h1 class="mb0">The Feed</h1>
	<a class="btn btn-sm btn-blue" href="/map">🗺️ Find trucks</a>
</div>

{#if data.feed.length === 0}
	<div class="notice">
		<span class="emoji">🍔</span>
		{#if data.followCount === 0}
			<h3>Follow some trucks!</h3>
			<p class="data">Your feed shows specials and check-ins from the trucks you follow — chronological, no algorithm. Find trucks near you to get started.</p>
		{:else}
			<h3>All quiet… for now</h3>
			<p class="data">The trucks you follow haven’t posted yet. Check back at lunchtime!</p>
		{/if}
		<a class="btn btn-primary" href="/map">Find trucks near me</a>
	</div>
{:else}
	<div class="stack">
		{#each data.feed as item (item.item_type + item.item_id)}
			<FeedCard {item} />
		{/each}
	</div>
{/if}
