import { getDailyPuzzleNumber } from '$lib/server/daily-puzzles';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = () => {
	return {
		dailyPuzzleNumber: getDailyPuzzleNumber(),
	};
};
