// Cross-promo manifest fetcher for Ben Brady's games network.
// Public contract: https://benjamin-brady.github.io/games.json

export type CrossPromoGame = {
	slug: string;
	name: string;
	url: string;
	tagline: string;
	description: string;
	emoji: string;
	tags: string[];
	status: 'live' | 'beta' | 'alpha';
	weight: number;
	images: {
		screenshot: string | null;
		og: string | null;
		logo: string | null;
	};
};

type Manifest = {
	version: number;
	updated: string;
	site: string;
	games: CrossPromoGame[];
};

const MANIFEST_URL = 'https://benjamin-brady.github.io/games.json';
const CACHE_KEY = 'lextangle:cross-promo:v1';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1h
const SELF_SLUG = 'lextangle';

type CacheEntry = { fetchedAt: number; games: CrossPromoGame[] };

function readCache(): CacheEntry | null {
	if (typeof localStorage === 'undefined') return null;
	try {
		const raw = localStorage.getItem(CACHE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as CacheEntry;
		if (!parsed || typeof parsed.fetchedAt !== 'number' || !Array.isArray(parsed.games)) return null;
		return parsed;
	} catch {
		return null;
	}
}

function writeCache(games: CrossPromoGame[]): void {
	if (typeof localStorage === 'undefined') return;
	try {
		const entry: CacheEntry = { fetchedAt: Date.now(), games };
		localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
	} catch {
		// Quota or privacy mode; ignore.
	}
}

export async function loadCrossPromoGames(): Promise<CrossPromoGame[]> {
	const cached = readCache();
	if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
		return cached.games;
	}
	try {
		const res = await fetch(MANIFEST_URL, { cache: 'no-store' });
		if (!res.ok) throw new Error(`status ${res.status}`);
		const data = (await res.json()) as Manifest;
		const games = (data?.games ?? []).filter((g) => g && g.slug !== SELF_SLUG && g.url);
		writeCache(games);
		return games;
	} catch {
		// Fail silently. If we have any stale cache, use it.
		return cached?.games ?? [];
	}
}

export function pickWeightedGame(
	games: CrossPromoGame[],
	rand: () => number = Math.random
): CrossPromoGame | null {
	if (!games.length) return null;
	const total = games.reduce((sum, g) => sum + Math.max(0, g.weight ?? 0), 0);
	if (total <= 0) return games[Math.floor(rand() * games.length)] ?? null;
	let r = rand() * total;
	for (const g of games) {
		r -= Math.max(0, g.weight ?? 0);
		if (r <= 0) return g;
	}
	return games[games.length - 1] ?? null;
}
