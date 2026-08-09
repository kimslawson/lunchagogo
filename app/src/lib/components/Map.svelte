<script lang="ts">
	import 'leaflet/dist/leaflet.css';
	import { onMount, onDestroy } from 'svelte';
	import type { NearbyTruck } from '$lib/types';

	let {
		trucks = [],
		center,
		me = null
	}: {
		trucks?: NearbyTruck[];
		center: { lat: number; lng: number };
		me?: { lat: number; lng: number } | null;
	} = $props();

	let el: HTMLDivElement;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let L: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let map: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let markerLayer: any;
	let ready = $state(false);

	function esc(s: string): string {
		return s.replace(
			/[&<>"']/g,
			(c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
		);
	}

	function draw() {
		if (!ready || !markerLayer) return;
		markerLayer.clearLayers();
		if (me) {
			L.marker([me.lat, me.lng], {
				icon: L.divIcon({ html: '📍', className: 'me-pin', iconSize: [24, 24], iconAnchor: [12, 24] })
			}).addTo(markerLayer);
		}
		for (const t of trucks) {
			const marker = L.marker([t.lat, t.lng], {
				icon: L.divIcon({ html: '🚚', className: 'truck-pin', iconSize: [32, 32], iconAnchor: [16, 16] })
			}).addTo(markerLayer);
			marker.bindPopup(
				`<strong>${esc(t.name)}</strong><br>${t.cuisine ? esc(t.cuisine) + '<br>' : ''}<a href="/trucks/${esc(t.slug)}">See truck →</a>`
			);
		}
	}

	onMount(async () => {
		L = (await import('leaflet')).default;
		map = L.map(el).setView([center.lat, center.lng], 13);
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			attribution: '&copy; OpenStreetMap contributors'
		}).addTo(map);
		markerLayer = L.layerGroup().addTo(map);
		ready = true;
		draw();
	});

	onDestroy(() => map?.remove());

	// redraw whenever the data changes
	$effect(() => {
		void trucks;
		void me;
		if (ready) draw();
	});
</script>

<div class="map" bind:this={el}></div>

<style>
	:global(.truck-pin) {
		font-size: 26px;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
		text-align: center;
	}
	:global(.me-pin) {
		font-size: 20px;
		text-align: center;
	}
	:global(.leaflet-popup-content) {
		font-family: var(--font-data);
	}
	:global(.leaflet-popup-content a) {
		color: var(--blue-deep);
		font-weight: bold;
	}
</style>
