import { describe, expect, test } from 'bun:test';

import { buildShareText, createShareCheckSummary } from './share-text';
import type { Puzzle } from './types';

const puzzle: Puzzle = {
	title: 'Test Grid',
	solution: [
		{ word: 'One', emoji: '1️⃣' },
		{ word: 'Two', emoji: '2️⃣' },
		{ word: 'Three', emoji: '3️⃣' },
		{ word: 'Four', emoji: '4️⃣' },
		{ word: 'Five', emoji: '5️⃣' },
		{ word: 'Six', emoji: '6️⃣' },
		{ word: 'Seven', emoji: '7️⃣' },
		{ word: 'Eight', emoji: '8️⃣' },
		{ word: 'Nine', emoji: '9️⃣' }
	],
	edges: [
		{ from: 0, to: 1, clue: 'one two' },
		{ from: 1, to: 2, clue: 'two three' },
		{ from: 3, to: 4, clue: 'four five' },
		{ from: 4, to: 5, clue: 'five six' },
		{ from: 6, to: 7, clue: 'seven eight' },
		{ from: 7, to: 8, clue: 'eight nine' },
		{ from: 0, to: 3, clue: 'one four' },
		{ from: 1, to: 4, clue: 'two five' },
		{ from: 2, to: 5, clue: 'three six' },
		{ from: 3, to: 6, clue: 'four seven' },
		{ from: 4, to: 7, clue: 'five eight' },
		{ from: 5, to: 8, clue: 'six nine' }
	]
};

describe('share text', () => {
	test('includes all nine puzzle emoji in shuffled headline order', () => {
		const text = buildShareText({
			puzzle,
			shareLabel: 'Daily #18',
			checks: 1,
			correctWords: 9,
			correctLinks: 12,
			solved: true,
			checkHistory: [],
			random: () => 0,
			url: 'https://example.com'
		});

		expect(text.split('\n')[0]).toBe('Lextangle Daily #18: 2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣8️⃣9️⃣1️⃣');
	});

	test('shows each checked round as rows and correct link count', () => {
		const firstCheck = createShareCheckSummary({
			nodeStatuses: ['correct', 'correct', 'correct', 'wrong', 'wrong', 'correct', 'correct', 'correct', 'correct'],
			correctLinks: 9
		});
		const secondCheck = createShareCheckSummary({
			nodeStatuses: ['correct', 'correct', 'correct', 'correct', 'correct', 'correct', 'correct', 'correct', 'correct'],
			correctLinks: 12
		});

		const text = buildShareText({
			puzzle,
			shareLabel: 'Daily #18',
			checks: 2,
			correctWords: 9,
			correctLinks: 12,
			solved: true,
			checkHistory: [firstCheck, secondCheck],
			random: () => 0.99,
			url: 'https://example.com'
		});

		expect(text).toContain('Solved in 2 checks');
		expect(text).toContain('🟩🟩🟩 / 🟥🟥🟩 / 🟩🟩🟩 9️⃣');
		expect(text).toContain('🟩🟩🟩 / 🟩🟩🟩 / 🟩🟩🟩 1️⃣2️⃣');
	});
});
