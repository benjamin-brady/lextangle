export interface DailyStreakSummary {
	currentStreak: number;
	bestStreak: number;
	solvedToday: boolean;
}

export function dailyStorageId(puzzleNumber: number): string {
	return `daily-${puzzleNumber}`;
}

export function createDailyStreakSummary({
	currentPuzzleNumber,
	solvedPuzzleNumbers,
}: {
	currentPuzzleNumber: number;
	solvedPuzzleNumbers: ReadonlySet<number>;
}): DailyStreakSummary {
	if (!Number.isInteger(currentPuzzleNumber) || currentPuzzleNumber < 1) {
		return { currentStreak: 0, bestStreak: 0, solvedToday: false };
	}

	const solved = new Set(
		[...solvedPuzzleNumbers].filter(
			(puzzleNumber) =>
				Number.isInteger(puzzleNumber) && puzzleNumber >= 1 && puzzleNumber <= currentPuzzleNumber
		)
	);
	const solvedToday = solved.has(currentPuzzleNumber);
	const currentAnchor = solvedToday ? currentPuzzleNumber : currentPuzzleNumber - 1;

	let currentStreak = 0;
	for (let puzzleNumber = currentAnchor; puzzleNumber >= 1; puzzleNumber -= 1) {
		if (!solved.has(puzzleNumber)) break;
		currentStreak += 1;
	}

	let bestStreak = 0;
	let runningStreak = 0;
	for (let puzzleNumber = 1; puzzleNumber <= currentPuzzleNumber; puzzleNumber += 1) {
		if (solved.has(puzzleNumber)) {
			runningStreak += 1;
			bestStreak = Math.max(bestStreak, runningStreak);
		} else {
			runningStreak = 0;
		}
	}

	return { currentStreak, bestStreak, solvedToday };
}