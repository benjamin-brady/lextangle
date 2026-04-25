import { describe, expect, test } from 'bun:test';

import { createDailyStreakSummary, dailyStorageId } from './streaks';

describe('daily streak summaries', () => {
	test('counts the current streak through today when today is solved', () => {
		const summary = createDailyStreakSummary({
			currentPuzzleNumber: 8,
			solvedPuzzleNumbers: new Set([2, 5, 6, 7, 8]),
		});

		expect(summary.currentStreak).toBe(4);
		expect(summary.bestStreak).toBe(4);
		expect(summary.solvedToday).toBe(true);
	});

	test('keeps yesterday streak active before today is solved', () => {
		const summary = createDailyStreakSummary({
			currentPuzzleNumber: 8,
			solvedPuzzleNumbers: new Set([3, 4, 6, 7]),
		});

		expect(summary.currentStreak).toBe(2);
		expect(summary.bestStreak).toBe(2);
		expect(summary.solvedToday).toBe(false);
	});

	test('reports the best historical streak when current streak is broken', () => {
		const summary = createDailyStreakSummary({
			currentPuzzleNumber: 9,
			solvedPuzzleNumbers: new Set([1, 2, 3, 6]),
		});

		expect(summary.currentStreak).toBe(0);
		expect(summary.bestStreak).toBe(3);
		expect(summary.solvedToday).toBe(false);
	});

	test('formats daily storage ids consistently', () => {
		expect(dailyStorageId(12)).toBe('daily-12');
	});
});
