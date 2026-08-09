// Location helpers. We deliberately fuzz foodie coordinates before storing —
// carried over from the splash page's privacy instinct (2 decimals ≈ ~1km,
// enough to place a neighborhood, not a doorstep).

export function fuzz(coord: number, digits = 2): number {
	return Number(coord.toFixed(digits));
}

export function getPosition(opts?: PositionOptions): Promise<GeolocationPosition> {
	return new Promise((resolve, reject) => {
		if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
			reject(new Error('Geolocation is not available on this device.'));
			return;
		}
		navigator.geolocation.getCurrentPosition(resolve, reject, {
			timeout: 10000,
			maximumAge: 15000,
			enableHighAccuracy: true,
			...opts
		});
	});
}

export function formatDistance(meters: number): string {
	const mi = meters / 1609.344;
	if (mi < 0.1) return 'right here';
	if (mi < 10) return `${mi.toFixed(1)} mi away`;
	return `${Math.round(mi)} mi away`;
}

// Haversine, for client-side "is this followed truck near me?" checks.
export function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
	const R = 6371000;
	const toRad = (d: number) => (d * Math.PI) / 180;
	const dLat = toRad(bLat - aLat);
	const dLng = toRad(bLng - aLng);
	const s =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(s));
}
