import { describe, expect, test } from 'bun:test';

import { HARD_PRACTICE_PUZZLES, PRACTICE_PUZZLES } from './puzzles';
import type { Puzzle } from './types';

function words(puzzle: Puzzle): string {
	return puzzle.solution.map(({ word }) => word).join(',');
}

describe('puzzle generation metadata', () => {
	test('ships the current review batch with Copilot generation details', () => {
		const latestStandard = PRACTICE_PUZZLES.slice(-8);
		const latestHard = HARD_PRACTICE_PUZZLES.slice(-2);

		expect(latestStandard.map(words)).toContain(
			'Spoon,Soup,Crouton,Whisk,Egg,Toast,Flour,Roll,Jam'
		);
		expect(latestHard.map(words)).toContain(
			'Check,Rain,Slicker,Mark,Down,Vest,Quill,Feather,Leather'
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