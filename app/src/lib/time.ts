export function relTime(iso: string): string {
	const then = new Date(iso).getTime();
	const s = Math.round((Date.now() - then) / 1000);
	if (s < 45) return 'just now';
	const m = Math.round(s / 60);
	if (m < 60) return `${m}m ago`;
	const h = Math.round(m / 60);
	if (h < 24) return `${h}h ago`;
	const d = Math.round(h / 24);
	if (d < 7) return `${d}d ago`;
	return new Date(iso).toLocaleDateString();
}

// "14:30:00" (Postgres time) -> "2:30 PM"
export function clock(t: string | null | undefined): string {
	if (!t) return '';
	const [hh, mm] = t.split(':');
	let h = Number(hh);
	const ap = h >= 12 ? 'PM' : 'AM';
	h = h % 12 || 12;
	return `${h}:${mm} ${ap}`;
}

export function dayLabel(iso: string): string {
	return new Date(iso).toLocaleDateString(undefined, {
		weekday: 'short',
		month: 'short',
		day: 'numeric'
	});
}

export function timeLabel(iso: string): string {
	return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
