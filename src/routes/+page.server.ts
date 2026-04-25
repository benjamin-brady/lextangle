import { getDailyPuzzleInfo } from '$lib/server/daily-puzzles';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const { puzzle, puzzleNumber } = getDailyPuzzleInfo();

	return {
		puzzle,
		puzzleNumber,
		shareLabel: `Daily #${puzzleNumber}`,
		storageId: `daily-${puzzleNumber}`,
	};
};
