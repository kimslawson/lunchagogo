<script lang="ts">
	import type { FeedItem } from '$lib/types';
	import { relTime } from '$lib/time';
	let { item }: { item: FeedItem } = $props();
</script>

<article class="card feed-item">
	{#if item.photo_url}
		<img class="photo" src={item.photo_url} alt="" loading="lazy" />
	{/if}
	<div class="body">
		<div class="feed-meta">
			<a href={`/trucks/${item.truck_slug}`} class="row" style="gap:.5rem; color:inherit;">
				{#if item.truck_logo}<img class="avatar sm" src={item.truck_logo} alt="" />{/if}
				<strong>{item.truck_name}</strong>
			</a>
			<span class="grow"></span>
			{#if item.item_type === 'special'}<span class="badge new">Special</span>{/if}
		</div>

		{#if item.item_type === 'special'}
			<h3 class="mb0">{item.title}</h3>
			{#if item.price != null}<div class="price">${Number(item.price).toFixed(2)}</div>{/if}
			{#if item.body}<p class="data mb0">{item.body}</p>{/if}
		{:else}
			<p class="data mb0"><strong>{item.actor_name}</strong> grabbed some grub 😋</p>
			{#if item.body}<p class="data mb0">“{item.body}”</p>{/if}
		{/if}

		<div class="tiny muted" style="margin-top:.4rem">{relTime(item.created_at)}</div>
	</div>
</article>
