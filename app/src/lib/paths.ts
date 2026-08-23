import { base } from '$app/paths';

// The app is served under a base path (/app), so every internal link, redirect,
// goto, and static asset URL must be prefixed with it. `u('/map')` -> '/app/map'.
export function u(path: string): string {
	return `${base}${path}`;
}

// Common fallback image, pre-resolved under the base path.
export const LOGO = `${base}/img/logo.jpg`;

export { base };
