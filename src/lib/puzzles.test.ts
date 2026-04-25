import { describe, expect, test } from 'bun:test';

import { HARD_PRACTICE_PUZZLES, PRACTICE_PUZZLES, PUZZLES } from './puzzles';
import type { Puzzle } from './types';

function words(puzzle: Puzzle): string {
	return puzzle.solution.map(({ word }) => word).join(',');
}

describe('puzzle generation metadata', () => {
	test('gives every playable puzzle a short title', () => {
		const playablePuzzles = [...PUZZLES, ...PRACTICE_PUZZLES, ...HARD_PRACTICE_PUZZLES];

		expect(playablePuzzles).not.toHaveLength(0);

		for (const puzzle of playablePuzzles) {
			expect(puzzle.title).toBeDefined();
			expect(puzzle.title?.trim()).toBe(puzzle.title);
			expect(puzzle.title?.length).toBeGreaterThan(0);
			expect(puzzle.title?.length).toBeLessThanOrEqual(32);
		}
	});

	test('backfills witty titles for known shipped grids', () => {
		const posturePuzzle = PUZZLES.find(
			(puzzle) => words(puzzle) === 'Stand,Up,Hill,Sit,Down,Town,Lie,Low,Land'
		);
		const reviewHard = HARD_PRACTICE_PUZZLES.find(
			(puzzle) => words(puzzle) === 'Check,Rain,Slicker,Mark,Down,Vest,Quill,Feather,Leather'
		);

		expect(posturePuzzle?.title).toBe('Posture Check');
		expect(reviewHard?.title).toBe('Marked Downpour');
	});

	test('ships the April 25 generated batches in live puzzle arrays', () => {
		expect(PUZZLES.length).toBe(79);
		expect(PRACTICE_PUZZLES.length).toBe(77);
		expect(HARD_PRACTICE_PUZZLES.length).toBe(22);

		const latestStandard = PUZZLES.slice(-50);
		const latestHard = HARD_PRACTICE_PUZZLES.slice(-15);

		expect(latestStandard[0] ? words(latestStandard[0]) : '').toBe(
			'Caterpillar,Leaf,Vein,Butterfly,Flower,Petal,Bee,Nectar,Pollen'
		);
		expect(latestStandard.at(-1) ? words(latestStandard.at(-1)!) : '').toBe(
			'Voice,Mail,Box,Text,Message,Board,Note,Pad,Paper'
		);
		expect(latestHard[0] ? words(latestHard[0]) : '').toBe(
			'Cab,Taxi,Stand,Truck,Driver,Bus,Delivery,Route,Stop'
		);
		expect(latestHard.at(-1) ? words(latestHard.at(-1)!) : '').toBe(
			'Paper,Chain,Dog,Clip,Mail,Tag,Board,Room,Service'
		);

		for (const puzzle of [...latestStandard, ...latestHard]) {
			expect(puzzle.generation).toMatchObject({
				author: 'GitHub Copilot',
				model: 'openai/gpt-5.5-high',
				provider: 'github-copilot',
				generatedAt: '2026-04-25',
			});
		}
	});

	test('ships the current review batch with Copilot generation details', () => {
		const reviewStandardWords = 'Spoon,Soup,Crouton,Whisk,Egg,Toast,Flour,Roll,Jam';
		const reviewHardWords = 'Check,Rain,Slicker,Mark,Down,Vest,Quill,Feather,Leather';
		const reviewStandard = PUZZLES.find((puzzle) => words(puzzle) === reviewStandardWords);
		const practiceReviewStandard = PRACTICE_PUZZLES.find(
			(puzzle) => words(puzzle) === reviewStandardWords
		);
		const reviewHard = HARD_PRACTICE_PUZZLES.find((puzzle) => words(puzzle) === reviewHardWords);

		expect(reviewStandard).toBeDefined();
		expect(practiceReviewStandard).toBeDefined();
		expect(reviewHard).toBeDefined();

		const reviewPuzzles = [reviewStandard, practiceReviewStandard, reviewHard].filter(
			(puzzle): puzzle is Puzzle => puzzle !== undefined
		);
		expect(reviewPuzzles).toHaveLength(3);

		for (const puzzle of reviewPuzzles) {
			expect(puzzle.generation).toMatchObject({
				author: 'GitHub Copilot',
				model: 'openai/gpt-5.5-high',
				provider: 'github-copilot',
				generatedAt: '2026-04-25',
			});
		}
	});

	test('backfills model trailer metadata for the April practice puzzle commit', () => {
		const taxiPuzzle = PRACTICE_PUZZLES.find(
			(puzzle) => words(puzzle) === 'Cab,Taxi,Stand,Truck,Driver,Bus,Delivery,Route,Stop'
		);

		expect(taxiPuzzle?.generation).toMatchObject({
			author: 'GitHub Copilot',
			model: 'openai/gpt-5.4-high',
			provider: 'github-copilot',
			generatedAt: '2026-04-21',
			sourceCommit: 'f3d0bd2',
		});
	});
});