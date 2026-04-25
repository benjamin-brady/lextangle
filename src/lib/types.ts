export interface WordItem {
	word: string;
	emoji?: string;
}

export interface Edge {
	from: number; // grid index
	to: number; // grid index
	clue: string;
}

export interface PuzzleGenerationDetails {
	author: string;
	model: string;
	provider?: string;
	generatedAt: string;
	sourceCommit?: string;
}

export interface PuzzleDraft {
	/** Witty short title derived from the 9-word grid */
	title?: string;
	generation?: PuzzleGenerationDetails;
	/** 9 words in their correct grid positions (index 0–8, row-major) */
	solution: WordItem[];
	/** Edges describing relationships between adjacent cells */
	edges: Edge[];
}

export interface Puzzle extends PuzzleDraft {
	/** Witty short title derived from the 9-word grid */
	title: string;
}

/**
 * Grid layout (indices):
 *  0 — 1 — 2
 *  |   |   |
 *  3 — 4 — 5
 *  |   |   |
 *  6 — 7 — 8
 *
 * All horizontal and vertical adjacencies:
 */
export const ADJACENCIES: [number, number][] = [
	[0, 1], [1, 2],
	[3, 4], [4, 5],
	[6, 7], [7, 8],
	[0, 3], [1, 4], [2, 5],
	[3, 6], [4, 7], [5, 8],
];

export type EdgeStatus = 'correct' | 'wrong' | 'empty';
export type NodeStatus = 'correct' | 'wrong' | 'empty' | 'unchecked';
