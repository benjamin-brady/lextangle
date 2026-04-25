import { describe, expect, test } from 'bun:test';

import { PUZZLES } from '../puzzles';
import type { Puzzle } from '../types';
import { getDailyPuzzleByNumber, getDailyPuzzleInfo } from './daily-puzzles';
import { resolvePuzzle } from './puzzles';

function words(puzzle: Puzzle): string {
	return puzzle.solution.map(({ word }) => word).join(',');
}

describe('daily puzzle selection', () => {
	test('uses a deterministic shuffled order instead of the puzzle array order', () => {
		const dailyWords = Array.from({ length: 12 }, (_, index) =>
			words(getDailyPuzzleByNumber(index + 1))
		);
		const sequentialWords = PUZZLES.slice(0, 12).map(words);

		expect(dailyWords).not.toEqual(sequentialWords);
		expect(new Set(dailyWords).size).toBe(dailyWords.length);
	});

	test('resolves a date to the shuffled daily puzzle number', () => {
		const dailyOne = getDailyPuzzleInfo(Date.UTC(2026, 3, 8));
		const dailyTwo = getDailyPuzzleInfo(Date.UTC(2026, 3, 9));

		expect(dailyOne.puzzleNumber).toBe(1);
		expect(dailyTwo.puzzleNumber).toBe(2);
		expect(words(dailyOne.puzzle)).toBe(words(getDailyPuzzleByNumber(1)));
		expect(words(dailyTwo.puzzle)).toBe(words(getDailyPuzzleByNumber(2)));
		expect(words(dailyTwo.puzzle)).not.toBe(words(PUZZLES[1]));
	});

	test('server storage resolution uses the same shuffled daily order', () => {
		const resolved = resolvePuzzle('daily-7');

		expect(resolved?.kind).toBe('daily');
		expect(resolved?.canonicalId).toBe('daily-7');
		expect(resolved?.puzzle).toEqual(getDailyPuzzleByNumber(7));
	});
});
