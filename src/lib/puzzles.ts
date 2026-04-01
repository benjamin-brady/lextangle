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
			{ word: 'King' },
			{ word: 'Crown' },
			{ word: 'Tooth' },
			{ word: 'Fairy' },
			{ word: 'Tale' },
			{ word: 'Tail' },
			{ word: 'Coat' },
			{ word: 'Pocket' },
			{ word: 'Watch' },
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
			{ word: 'Car' },
			{ word: 'Trunk' },
			{ word: 'Elephant' },
			{ word: 'Race' },
			{ word: 'Suit' },
			{ word: 'Memory' },
			{ word: 'Track' },
			{ word: 'Case' },
			{ word: 'Card' },
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
			{ word: 'Tower' },
			{ word: 'Guard' },
			{ word: 'Dog' },
			{ word: 'Clock' },
			{ word: 'Night' },
			{ word: 'Watch' },
			{ word: 'Hand' },
			{ word: 'Owl' },
			{ word: 'Band' },
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
	{
		solution: [
			{ word: 'Fire' },
			{ word: 'Alarm' },
			{ word: 'Button' },
			{ word: 'Drill' },
			{ word: 'Press' },
			{ word: 'Box' },
			{ word: 'Vice' },
			{ word: 'Bench' },
			{ word: 'Seat' },
		],
		edges: [
			{ from: 0, to: 1, clue: 'A fire alarm' },
			{ from: 1, to: 2, clue: 'You hit the alarm button' },
			{ from: 3, to: 4, clue: 'A drill press' },
			{ from: 4, to: 5, clue: 'A press box at a stadium' },
			{ from: 6, to: 7, clue: 'A bench vice mounts to the workbench' },
			{ from: 7, to: 8, clue: 'A bench seat' },
			{ from: 0, to: 3, clue: 'A fire drill' },
			{ from: 3, to: 6, clue: 'A drill vice keeps the piece steady' },
			{ from: 1, to: 4, clue: 'You press the alarm to trigger it' },
			{ from: 4, to: 7, clue: 'A bench press' },
			{ from: 2, to: 5, clue: 'A button box stores buttons or controls' },
			{ from: 5, to: 8, clue: 'A box seat at the theater' },
		],
	},
	{
		solution: [
			{ word: 'Skin' },
			{ word: 'Boil' },
			{ word: 'Water' },
			{ word: 'Drum' },
			{ word: 'Roll' },
			{ word: 'Tide' },
			{ word: 'Stick' },
			{ word: 'Thunder' },
			{ word: 'Storm' },
		],
		edges: [
			{ from: 0, to: 1, clue: 'A boil is a skin condition' },
			{ from: 1, to: 2, clue: 'You boil water to heat it' },
			{ from: 3, to: 4, clue: 'A drum roll builds suspense' },
			{ from: 4, to: 5, clue: 'Waves roll in with the tide' },
			{ from: 6, to: 7, clue: 'A thunderstick makes noise at games' },
			{ from: 7, to: 8, clue: 'Thunder is the voice of a storm' },
			{ from: 0, to: 3, clue: 'A drum has a skin membrane stretched over it' },
			{ from: 3, to: 6, clue: 'You play a drum with sticks' },
			{ from: 1, to: 4, clue: 'A rolling boil is the most vigorous stage' },
			{ from: 4, to: 7, clue: 'A roll of thunder echoes across the sky' },
			{ from: 2, to: 5, clue: 'Tides pull and push the water' },
			{ from: 5, to: 8, clue: 'A storm surge raises the tide dangerously' },
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
