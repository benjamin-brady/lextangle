import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { scoreValidationFeedback } from '$lib/langfuse';

export const POST: RequestHandler = async ({ request, platform }) => {
	const body = (await request.json()) as { a?: string; b?: string; comment?: string };

	const a = (body.a ?? '').trim();
	const b = (body.b ?? '').trim();
	const comment = (body.comment ?? '').trim().slice(0, 500);

	if (!a || !b) {
		return json({ error: 'Both words "a" and "b" are required' }, { status: 400 });
	}

	const env = platform?.env;
	if (!env) {
		return json({ error: 'Platform not available' }, { status: 503 });
	}

	await scoreValidationFeedback(env, {
		wordA: a,
		wordB: b,
		comment,
		value: -1,
	});

	return json({ ok: true });
};
