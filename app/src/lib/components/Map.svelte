<script lang="ts">
	import 'leaflet/dist/leaflet.css';
	import { onMount, onDestroy } from 'svelte';
	import type { NearbyTruck } from '$lib/types';

	let {
		trucks = [],
		center,
		me = null,
		radiusMeters = null
	}: {
		trucks?: NearbyTruck[];
		center: { lat: number; lng: number };
		me?: { lat: number; lng: number } | null;
		radiusMeters?: number | null;
	} = $props();

	let el: HTMLDivElement;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let L: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let map: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let markerLayer: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let radiusCircle: any;
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

	// Draw the search-radius circle around "me" and zoom the map to fit it, so
	// changing the radius visibly zooms in/out.
	function drawRadius() {
		if (!ready || !map) return;
		if (!me || !radiusMeters) {
			if (radiusCircle) {
				radiusCircle.remove();
				radiusCircle = null;
			}
			return;
		}
		const latlng = L.latLng(me.lat, me.lng);
		if (radiusCircle) {
			radiusCircle.setLatLng(latlng).setRadius(radiusMeters);
		} else {
			radiusCircle = L.circle(latlng, {
				radius: radiusMeters,
				color: '#2d7bca',
				weight: 2,
				fillColor: '#2d7bca',
				fillOpacity: 0.08
			}).addTo(map);
		}
		map.fitBounds(radiusCircle.getBounds(), { padding: [18, 18] });
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
		drawRadius();
	});

	onDestroy(() => map?.remove());

	// Markers react to data; the circle + zoom react to the radius.
	$effect(() => {
		void trucks;
		void me;
		if (ready) draw();
	});
	$effect(() => {
		void radiusMeters;
		void me;
		if (ready) drawRadius();
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
