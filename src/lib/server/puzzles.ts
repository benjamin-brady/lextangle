import type { Puzzle } from '$lib/types';
import {
	PUZZLES,
	PRACTICE_PUZZLES,
	HARD_PRACTICE_PUZZLES,
	getTodaysPuzzle
} from '$lib/puzzles';

export type ResolvedPuzzle = {
	puzzle: Puzzle;
	kind: 'daily' | 'practice' | 'hard';
	canonicalId: string;
};

/**
 * Resolve a storageId (e.g. 'daily-42', 'practice-7', 'practice-hard-3')
 * to the authoritative puzzle for server-side snapshotting.
 */
export function resolvePuzzle(storageId: string): ResolvedPuzzle | null {
	const dailyMatch = storageId.match(/^daily-(\d+)$/);
	if (dailyMatch) {
		const n = Number(dailyMatch[1]);
		if (!Number.isInteger(n) || n < 1) return null;
		const puzzle = PUZZLES[(n - 1) % PUZZLES.length] ?? getTodaysPuzzle();
		return { puzzle, kind: 'daily', canonicalId: storageId };
	}

	const hardMatch = storageId.match(/^practice-hard-(\d+)$/);
	if (hardMatch) {
		const n = Number(hardMatch[1]);
		const puzzle = HARD_PRACTICE_PUZZLES[n - 1];
		if (!puzzle) return null;
		return { puzzle, kind: 'hard', canonicalId: storageId };
	}

	const practiceMatch = storageId.match(/^practice-(\d+)$/);
	if (practiceMatch) {
		const n = Number(practiceMatch[1]);
		const puzzle = PRACTICE_PUZZLES[n - 1];
		if (!puzzle) return null;
		return { puzzle, kind: 'practice', canonicalId: storageId };
	}

	return null;
}
