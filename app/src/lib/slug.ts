export function slugify(input: string): string {
	const s = input
		.toLowerCase()
		.trim()
		.replace(/['’]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 56);
	return s || 'truck';
}

// Append a short random suffix to dodge slug collisions on first save.
export function uniqueSlug(input: string): string {
	return `${slugify(input)}-${Math.random().toString(36).slice(2, 6)}`;
}
