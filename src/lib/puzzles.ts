import type { Puzzle } from './types';

/**
 * King 🤴 — Crown 👑 — Tooth 🦷
 *   |          |          |
 * Fairy 🧚 — Tale 📖 — Tail 🐒
 *   |          |          |
 * Coat 🧥 — Pocket 👖 — Watch ⌚
 *
 * Tower 🗼, Guard 💂, Palace 🏰 used in alternate puzzle
 */

export const PUZZLES: Puzzle[] = [
	{
		solution: [
			{ word: 'King', emoji: '🤴' },
			{ word: 'Crown', emoji: '👑' },
			{ word: 'Tooth', emoji: '🦷' },
			{ word: 'Fairy', emoji: '🧚' },
			{ word: 'Tale', emoji: '📖' },
			{ word: 'Tail', emoji: '🐒' },
			{ word: 'Coat', emoji: '🧥' },
			{ word: 'Pocket', emoji: '👖' },
			{ word: 'Watch', emoji: '⌚' },
		],
		edges: [
			// Row 0
			{ from: 0, to: 1, clue: 'Kings wear crowns' },
			{ from: 1, to: 2, clue: 'A crown goes on a tooth' },
			// Row 1
			{ from: 3, to: 4, clue: 'Fairies show up in fairy tales' },
			{ from: 4, to: 5, clue: 'Tale becomes tail if it wags' },
			// Row 2
			{ from: 6, to: 7, clue: 'Coats are where pockets happen' },
			{ from: 7, to: 8, clue: 'A pocket watch' },
			// Col 0
			{ from: 0, to: 3, clue: 'The tooth fairy' },
			{ from: 3, to: 6, clue: 'A fairy-tale coat (fur coat)' },
			// Col 1
			{ from: 1, to: 4, clue: 'Crown tale (a tall tale)' },
			{ from: 4, to: 7, clue: 'A tall tale has pockets of truth' },
			// Col 2
			{ from: 2, to: 5, clue: 'Tooth and tail end of something' },
			{ from: 5, to: 8, clue: 'A cat watches its tail' },
		],
	},
	{
		solution: [
			{ word: 'Car', emoji: '🚗' },
			{ word: 'Trunk', emoji: '🧳' },
			{ word: 'Elephant', emoji: '🐘' },
			{ word: 'Race', emoji: '🏁' },
			{ word: 'Suit', emoji: '🤵' },
			{ word: 'Memory', emoji: '🧠' },
			{ word: 'Track', emoji: '🛤️' },
			{ word: 'Case', emoji: '💼' },
			{ word: 'Card', emoji: '🃏' },
		],
		edges: [
			// Row 0
			{ from: 0, to: 1, clue: 'Cars have trunks' },
			{ from: 1, to: 2, clue: 'Elephants are famous for their trunks' },
			// Row 1
			{ from: 3, to: 4, clue: 'A race suit' },
			{ from: 4, to: 5, clue: 'A suit from memory (card games)' },
			// Row 2
			{ from: 6, to: 7, clue: 'Tracking a case' },
			{ from: 7, to: 8, clue: 'A card case' },
			// Col 0
			{ from: 0, to: 3, clue: 'Car race' },
			{ from: 3, to: 6, clue: 'Race track' },
			// Col 1
			{ from: 1, to: 4, clue: 'A trunk suit(case)' },
			{ from: 4, to: 7, clue: 'A suit case' },
			// Col 2
			{ from: 2, to: 5, clue: 'An elephant never forgets' },
			{ from: 5, to: 8, clue: 'A memory card' },
		],
	},
	{
		solution: [
			{ word: 'Tower', emoji: '🗼' },
			{ word: 'Guard', emoji: '💂' },
			{ word: 'Dog', emoji: '🐕' },
			{ word: 'Clock', emoji: '🕐' },
			{ word: 'Night', emoji: '🌙' },
			{ word: 'Watch', emoji: '⌚' },
			{ word: 'Hand', emoji: '✋' },
			{ word: 'Owl', emoji: '🦉' },
			{ word: 'Band', emoji: '🎸' },
		],
		edges: [
			{ from: 0, to: 1, clue: 'A tower guard' },
			{ from: 1, to: 2, clue: 'A guard dog' },
			{ from: 3, to: 4, clue: 'A clock strikes at night' },
			{ from: 4, to: 5, clue: 'The night watch' },
			{ from: 6, to: 7, clue: 'To hand-raise an owl' },
			{ from: 7, to: 8, clue: 'An owl band (leg band)' },
			{ from: 0, to: 3, clue: 'A clock tower' },
			{ from: 3, to: 6, clue: 'A clock hand' },
			{ from: 1, to: 4, clue: 'A night guard' },
			{ from: 4, to: 7, clue: 'A night owl' },
			{ from: 2, to: 5, clue: 'A watch dog' },
			{ from: 5, to: 8, clue: 'A watch band' },
		],
	},
];

/** Get today's puzzle (cycles through available puzzles by day) */
export function getTodaysPuzzle(): Puzzle {
	const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
	return PUZZLES[daysSinceEpoch % PUZZLES.length];
}

export function getTodaysPuzzleInfo(): { puzzle: Puzzle; puzzleNumber: number; cycleIndex: number } {
	const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
	return {
		puzzle: PUZZLES[daysSinceEpoch % PUZZLES.length],
		puzzleNumber: daysSinceEpoch + 1,
		cycleIndex: daysSinceEpoch % PUZZLES.length
	};
}
