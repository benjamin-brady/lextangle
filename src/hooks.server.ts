import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Force HTTPS — Cloudflare terminates SSL so check CF-Visitor or X-Forwarded-Proto
	const proto =
		event.request.headers.get('x-forwarded-proto') ||
		event.url.protocol.replace(':', '');
	if (proto === 'http' && event.url.hostname !== 'localhost') {
		const httpsUrl = event.url.href.replace('http:', 'https:');
		redirect(301, httpsUrl);
	}

	return resolve(event);
};
