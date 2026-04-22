/**
 * Puzzle seeding helpers.
 *
 * Lextangle boards only work when the starting words already share a thick web
 * of A-tier relationships (compounds, cultural pairs, part-whole, tool-action).
 * Picking random words and hoping for 12 clean edges is how we end up with
 * dead pairs like `wheel` + `storm`.
 *
 * This module encodes a small curated lexicon of "hub" words and their known
 * A/B-tier partners, and exposes primitives that enforce connectivity before
 * a 9-word set is finalised:
 *
 *  1. `sharedNeighbors(a, b)` — cheap filter. Reject any seed pair that does
 *     not share at least 3 plausible partners.
 *  2. `growSeed(anchor, size)` — anchor-growth seeding. Every added word must
 *     form at least one A-tier edge with a word already in the set.
 *  3. `auditWordSet(words)` — blind audit: enumerates lexicon-backed pairs in
 *     the final set so a human can sanity-check edge count and diversity.
 *
 * The lexicon is intentionally small and hand-curated. Add entries as new
 * words get used in shipped puzzles. The goal is quality, not coverage.
 */

export type RelationTier = 'A' | 'B';

export interface Partner {
	word: string;
	/** Primary relation type, matching the puzzle-generator skill taxonomy. */
	relation:
		| 'compound'
		| 'object-role'
		| 'part-whole'
		| 'material'
		| 'tool-action'
		| 'cause-effect'
		| 'cultural-pair'
		| 'category'
		| 'symbol';
	tier: RelationTier;
	/** Short human-readable justification, shown in audits. */
	note: string;
}

/**
 * Hub lexicon. Each key is a canonical lowercase word; its value is the list
 * of partners that reliably form an A or B-tier edge with it.
 *
 * Partners are one-directional in this table for brevity — `lookupPartners`
 * symmetrises on read. Only add a partner once (on whichever side reads more
 * naturally).
 */
const HUB_LEXICON: Record<string, Partner[]> = {
	tea: [
		{ word: 'pot', relation: 'compound', tier: 'A', note: 'teapot' },
		{ word: 'cup', relation: 'compound', tier: 'A', note: 'teacup' },
		{ word: 'bag', relation: 'compound', tier: 'A', note: 'teabag' },
		{ word: 'party', relation: 'compound', tier: 'A', note: 'tea party' },
		{ word: 'spoon', relation: 'compound', tier: 'A', note: 'teaspoon' },
		{ word: 'leaf', relation: 'part-whole', tier: 'A', note: 'tea leaf' },
	],
	fire: [
		{ word: 'smoke', relation: 'cause-effect', tier: 'A', note: 'fire produces smoke' },
		{ word: 'wood', relation: 'material', tier: 'A', note: 'firewood' },
		{ word: 'works', relation: 'compound', tier: 'A', note: 'fireworks' },
		{ word: 'place', relation: 'compound', tier: 'A', note: 'fireplace' },
		{ word: 'man', relation: 'compound', tier: 'A', note: 'fireman' },
		{ word: 'storm', relation: 'compound', tier: 'A', note: 'firestorm' },
		{ word: 'ball', relation: 'compound', tier: 'A', note: 'fireball' },
	],
	wheel: [
		{ word: 'car', relation: 'part-whole', tier: 'A', note: 'wheel is part of a car' },
		{ word: 'chair', relation: 'compound', tier: 'A', note: 'wheelchair' },
		{ word: 'barrow', relation: 'compound', tier: 'A', note: 'wheelbarrow' },
		{ word: 'spoke', relation: 'part-whole', tier: 'A', note: 'spokes are part of a wheel' },
		{ word: 'bike', relation: 'part-whole', tier: 'A', note: 'wheel is part of a bike' },
	],
	storm: [
		{ word: 'cloud', relation: 'object-role', tier: 'A', note: 'storm clouds' },
		{ word: 'thunder', relation: 'compound', tier: 'A', note: 'thunderstorm' },
		{ word: 'rain', relation: 'cause-effect', tier: 'A', note: 'storms bring rain' },
		{ word: 'wind', relation: 'compound', tier: 'A', note: 'windstorm' },
		{ word: 'sand', relation: 'compound', tier: 'A', note: 'sandstorm' },
		{ word: 'snow', relation: 'compound', tier: 'A', note: 'snowstorm' },
	],
	ice: [
		{ word: 'cream', relation: 'compound', tier: 'A', note: 'ice cream' },
		{ word: 'water', relation: 'material', tier: 'A', note: 'ice is frozen water' },
		{ word: 'berg', relation: 'compound', tier: 'A', note: 'iceberg' },
		{ word: 'cube', relation: 'compound', tier: 'A', note: 'ice cube' },
		{ word: 'skate', relation: 'tool-action', tier: 'A', note: 'ice skating' },
	],
	sun: [
		{ word: 'flower', relation: 'compound', tier: 'A', note: 'sunflower' },
		{ word: 'light', relation: 'compound', tier: 'A', note: 'sunlight' },
		{ word: 'set', relation: 'compound', tier: 'A', note: 'sunset' },
		{ word: 'rise', relation: 'compound', tier: 'A', note: 'sunrise' },
		{ word: 'burn', relation: 'compound', tier: 'A', note: 'sunburn' },
		{ word: 'moon', relation: 'cultural-pair', tier: 'A', note: 'sun and moon' },
	],
	king: [
		{ word: 'crown', relation: 'object-role', tier: 'A', note: 'kings wear crowns' },
		{ word: 'queen', relation: 'cultural-pair', tier: 'A', note: 'king and queen' },
		{ word: 'dom', relation: 'compound', tier: 'A', note: 'kingdom' },
		{ word: 'throne', relation: 'object-role', tier: 'A', note: 'kings sit on thrones' },
	],
	bread: [
		{ word: 'flour', relation: 'material', tier: 'A', note: 'bread is made from flour' },
		{ word: 'butter', relation: 'cultural-pair', tier: 'A', note: 'bread and butter' },
		{ word: 'crumb', relation: 'part-whole', tier: 'A', note: 'breadcrumb' },
		{ word: 'loaf', relation: 'part-whole', tier: 'A', note: 'loaf of bread' },
	],
	wind: [
		{ word: 'mill', relation: 'compound', tier: 'A', note: 'windmill' },
		{ word: 'storm', relation: 'compound', tier: 'A', note: 'windstorm' },
		{ word: 'sail', relation: 'tool-action', tier: 'A', note: 'wind drives sails' },
	],
	rain: [
		{ word: 'bow', relation: 'compound', tier: 'A', note: 'rainbow' },
		{ word: 'coat', relation: 'compound', tier: 'A', note: 'raincoat' },
		{ word: 'drop', relation: 'compound', tier: 'A', note: 'raindrop' },
		{ word: 'cloud', relation: 'cause-effect', tier: 'A', note: 'clouds bring rain' },
		{ word: 'flood', relation: 'cause-effect', tier: 'A', note: 'rain causes floods' },
	],
};

// ---------------------------------------------------------------------------
// Internal index: symmetric adjacency map built once from HUB_LEXICON.
// ---------------------------------------------------------------------------

type PartnerIndex = Map<string, Map<string, Partner>>;

let indexCache: PartnerIndex | null = null;

function buildIndex(): PartnerIndex {
	if (indexCache) return indexCache;
	const idx: PartnerIndex = new Map();
	const add = (from: string, to: string, partner: Partner) => {
		if (!idx.has(from)) idx.set(from, new Map());
		// First write wins so explicit lexicon entries beat reverse defaults.
		const bucket = idx.get(from)!;
		if (!bucket.has(to)) bucket.set(to, partner);
	};
	for (const [word, partners] of Object.entries(HUB_LEXICON)) {
		for (const p of partners) {
			add(word, p.word, p);
			add(p.word, word, { ...p, word });
		}
	}
	indexCache = idx;
	return idx;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function norm(word: string): string {
	return word.trim().toLowerCase();
}

/** All partners the lexicon knows for `word` (symmetric). */
export function lookupPartners(word: string): Partner[] {
	const bucket = buildIndex().get(norm(word));
	return bucket ? Array.from(bucket.values()) : [];
}

/**
 * Words the lexicon links to BOTH `a` and `b` with an A or B-tier edge.
 * If this returns fewer than 3 entries, the pair is too sparse to seed a
 * puzzle around and should be replaced before grid layout.
 */
export function sharedNeighbors(a: string, b: string): string[] {
	const aSet = new Set(lookupPartners(a).map((p) => p.word));
	const bPartners = lookupPartners(b);
	const shared: string[] = [];
	for (const p of bPartners) {
		if (aSet.has(p.word) && p.word !== norm(a) && p.word !== norm(b)) {
			shared.push(p.word);
		}
	}
	return shared;
}

/** Direct edge between two words, if the lexicon knows one. */
export function directEdge(a: string, b: string): Partner | null {
	const bucket = buildIndex().get(norm(a));
	return bucket?.get(norm(b)) ?? null;
}

export interface SeedGrowthOptions {
	/** Target word count. 9 for a standard Lextangle grid. */
	size?: number;
	/** Words that must not be added to the set. */
	exclude?: Iterable<string>;
	/**
	 * Random picker. Defaults to `Math.random`-based; pass a seeded PRNG
	 * (e.g. from `mulberry32`) for deterministic generation.
	 */
	pickIndex?: (length: number) => number;
}

export interface SeedGrowthResult {
	words: string[];
	/**
	 * For each word added after the anchor, the partner it attached to and
	 * the relation used. Useful for debugging weak seeds.
	 */
	anchors: Array<{ word: string; via: string; relation: Partner['relation']; tier: RelationTier }>;
	/** True when growth produced the requested size. */
	complete: boolean;
}

/**
 * Grow a word set outward from an anchor. Every new word must form at least
 * one A-tier edge with a word already in the set. Falls back to B-tier only
 * when no A-tier option exists.
 *
 * This does NOT guarantee a valid 3x3 board — that still requires grid
 * placement, blind audit, and edge classification — but it guarantees the
 * word set has enough lexicon-backed structure to build one.
 */
export function growSeed(anchor: string, options: SeedGrowthOptions = {}): SeedGrowthResult {
	const size = options.size ?? 9;
	const exclude = new Set(Array.from(options.exclude ?? [], norm));
	const pick = options.pickIndex ?? ((n: number) => Math.floor(Math.random() * n));

	const start = norm(anchor);
	const words: string[] = [start];
	const inSet = new Set<string>([start]);
	const anchors: SeedGrowthResult['anchors'] = [];

	while (words.length < size) {
		// Collect every candidate partner of every word already in the set.
		const candidates: Array<{ word: string; via: string; partner: Partner }> = [];
		for (const existing of words) {
			for (const p of lookupPartners(existing)) {
				if (inSet.has(p.word) || exclude.has(p.word)) continue;
				candidates.push({ word: p.word, via: existing, partner: p });
			}
		}

		if (candidates.length === 0) break;

		// Prefer A-tier; only fall back to B-tier if no A-tier options remain.
		const aTier = candidates.filter((c) => c.partner.tier === 'A');
		const pool = aTier.length > 0 ? aTier : candidates;
		const chosen = pool[pick(pool.length)];

		words.push(chosen.word);
		inSet.add(chosen.word);
		anchors.push({
			word: chosen.word,
			via: chosen.via,
			relation: chosen.partner.relation,
			tier: chosen.partner.tier,
		});
	}

	return { words, anchors, complete: words.length === size };
}

export interface AuditEdge {
	a: string;
	b: string;
	relation: Partner['relation'];
	tier: RelationTier;
	note: string;
}

/**
 * Enumerate every lexicon-backed edge between words in `words`. Use this as
 * a blind audit before committing a word set: a standard board needs at
 * least 12 A/B-tier edges, and no single word should appear in 5+ edges.
 */
export function auditWordSet(words: string[]): {
	edges: AuditEdge[];
	degreeByWord: Record<string, number>;
	aTierCount: number;
} {
	const normed = words.map(norm);
	const edges: AuditEdge[] = [];
	const degree: Record<string, number> = Object.fromEntries(normed.map((w) => [w, 0]));

	for (let i = 0; i < normed.length; i++) {
		for (let j = i + 1; j < normed.length; j++) {
			const edge = directEdge(normed[i], normed[j]);
			if (!edge) continue;
			edges.push({
				a: normed[i],
				b: normed[j],
				relation: edge.relation,
				tier: edge.tier,
				note: edge.note,
			});
			degree[normed[i]]++;
			degree[normed[j]]++;
		}
	}

	return {
		edges,
		degreeByWord: degree,
		aTierCount: edges.filter((e) => e.tier === 'A').length,
	};
}

/** Deterministic PRNG for reproducible seeds. */
export function mulberry32(seed: number): () => number {
	let s = seed >>> 0;
	return () => {
		s = (s + 0x6d2b79f5) >>> 0;
		let t = s;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
