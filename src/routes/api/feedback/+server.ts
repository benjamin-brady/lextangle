import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { puzzleFeedback, puzzleFeedbackEdges } from '$lib/server/db/schema';
import { resolvePuzzle } from '$lib/server/puzzles';
import { ADJACENCIES } from '$lib/types';

const REASONS = [
	'incorrect_links',
	'too_easy',
	'too_hard',
	'bad_emoji',
	'inappropriate',
	'other'
] as const;

type Reason = (typeof REASONS)[number];

type Payload = {
	storageId?: unknown;
	sentiment?: unknown;
	reason?: unknown;
	comment?: unknown;
	flaggedEdges?: unknown;
	turnstileToken?: unknown;
};

const MAX_COMMENT = 1000;
const ADJ_SET = new Set(ADJACENCIES.map(([a, b]) => `${a}-${b}`));

async function verifyTurnstile(token: string, secret: string, ip: string | null) {
	const body = new URLSearchParams();
	body.set('secret', secret);
	body.set('response', token);
	if (ip) body.set('remoteip', ip);
	const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
		method: 'POST',
		body
	});
	if (!res.ok) return null;
	return (await res.json()) as {
		success: boolean;
		score?: number;
		action?: string;
		'error-codes'?: string[];
	};
}

async function hashUser(ip: string, ua: string, salt: string) {
	const data = new TextEncoder().encode(`${ip}|${ua}|${salt}`);
	const digest = await crypto.subtle.digest('SHA-256', data);
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const POST: RequestHandler = async ({ request, platform, getClientAddress }) => {
	if (!platform?.env?.DB) {
		return json({ error: 'unavailable' }, { status: 503 });
	}

	let body: Payload;
	try {
		body = (await request.json()) as Payload;
	} catch {
		return json({ error: 'invalid_json' }, { status: 400 });
	}

	const storageId = typeof body.storageId === 'string' ? body.storageId : '';
	const sentiment = body.sentiment === 'up' || body.sentiment === 'down' ? body.sentiment : null;
	if (!storageId || !sentiment) {
		return json({ error: 'invalid_request' }, { status: 400 });
	}

	const resolved = resolvePuzzle(storageId);
	if (!resolved) {
		return json({ error: 'unknown_puzzle' }, { status: 400 });
	}

	let reason: Reason | null = null;
	if (sentiment === 'down') {
		if (typeof body.reason !== 'string' || !REASONS.includes(body.reason as Reason)) {
			return json({ error: 'invalid_reason' }, { status: 400 });
		}
		reason = body.reason as Reason;
	}

	const comment =
		typeof body.comment === 'string' && body.comment.trim().length > 0
			? body.comment.trim().slice(0, MAX_COMMENT)
			: null;

	const flaggedEdgesInput = Array.isArray(body.flaggedEdges) ? body.flaggedEdges : [];
	if (reason !== 'incorrect_links' && flaggedEdgesInput.length > 0) {
		return json({ error: 'unexpected_edges' }, { status: 400 });
	}
	if (flaggedEdgesInput.length > 12) {
		return json({ error: 'too_many_edges' }, { status: 400 });
	}

	// Snapshot edges from server-side puzzle (authoritative).
	const edgeRows: Array<{
		edgeFrom: number;
		edgeTo: number;
		wordFrom: string;
		wordTo: string;
		clueSnapshot: string;
	}> = [];
	for (const raw of flaggedEdgesInput) {
		if (typeof raw !== 'object' || raw === null) {
			return json({ error: 'invalid_edge' }, { status: 400 });
		}
		const e = raw as { from?: unknown; to?: unknown };
		const from = Number(e.from);
		const to = Number(e.to);
		const key = `${Math.min(from, to)}-${Math.max(from, to)}`;
		if (!Number.isInteger(from) || !Number.isInteger(to) || !ADJ_SET.has(key)) {
			return json({ error: 'invalid_edge' }, { status: 400 });
		}
		const match = resolved.puzzle.edges.find(
			(edge) =>
				(edge.from === from && edge.to === to) || (edge.from === to && edge.to === from)
		);
		if (!match) {
			return json({ error: 'unknown_edge' }, { status: 400 });
		}
		edgeRows.push({
			edgeFrom: match.from,
			edgeTo: match.to,
			wordFrom: resolved.puzzle.solution[match.from].word,
			wordTo: resolved.puzzle.solution[match.to].word,
			clueSnapshot: match.clue
		});
	}

	// Turnstile verify
	const turnstileToken = typeof body.turnstileToken === 'string' ? body.turnstileToken : '';
	const secret = platform.env.TURNSTILE_SECRET_KEY;
	let tsScore: number | null = null;
	let tsAction: string | null = null;
	if (secret) {
		if (!turnstileToken) {
			return json({ error: 'turnstile_required' }, { status: 400 });
		}
		const verify = await verifyTurnstile(turnstileToken, secret, getClientAddress());
		if (!verify?.success) {
			return json({ error: 'turnstile_failed' }, { status: 400 });
		}
		tsScore = typeof verify.score === 'number' ? verify.score : null;
		tsAction = typeof verify.action === 'string' ? verify.action : null;
	}

	const ip = getClientAddress();
	const ua = request.headers.get('user-agent') ?? '';
	const salt = platform.env.IP_HASH_SALT ?? 'lexlink-default-salt';
	const userHash = await hashUser(ip, ua, salt);
	const country =
		(platform.cf as { country?: string } | undefined)?.country ??
		request.headers.get('cf-ipcountry') ??
		null;

	const db = getDb(platform.env.DB);
	const [inserted] = await db
		.insert(puzzleFeedback)
		.values({
			createdAt: Date.now(),
			puzzleId: resolved.canonicalId,
			puzzleKind: resolved.kind,
			sentiment,
			reason,
			comment,
			userHash,
			country,
			appVersion: null,
			tsScore,
			tsAction
		})
		.returning({ id: puzzleFeedback.id });

	if (edgeRows.length > 0) {
		await db.insert(puzzleFeedbackEdges).values(
			edgeRows.map((e) => ({
				feedbackId: inserted.id,
				...e
			}))
		);
	}

	return new Response(null, { status: 204 });
};
