import { ADJACENCIES, type EdgeStatus, type NodeStatus, type Puzzle, type WordItem } from './types';

export type Guess = WordItem | string | null | undefined;

export interface PuzzleEvaluation {
	guesses: (string | null)[];
	checkedCells: boolean[];
	nodeStatuses: NodeStatus[];
	edgeStatuses: Record<string, EdgeStatus>;
	correctWords: number;
	correctLinks: number;
	solved: boolean;
}

export function normalizeGuess(guess: Guess): string | null {
	if (guess == null) {
		return null;
	}

	return typeof guess === 'string' ? guess : guess.word;
}

export function edgeWordKey(firstWord: string, secondWord: string): string {
	return [firstWord, secondWord].sort().join('::');
}

export function adjacencyKey(fromIdx: number, toIdx: number): string {
	return fromIdx < toIdx ? `${fromIdx}-${toIdx}` : `${toIdx}-${fromIdx}`;
}

export function buildValidLinkSet(puzzle: Puzzle): Set<string> {
	return new Set(
		puzzle.edges.map(({ from, to }) => edgeWordKey(puzzle.solution[from].word, puzzle.solution[to].word))
	);
}

export function evaluatePuzzleState(
	puzzle: Puzzle,
	guesses: Guess[],
	checkedCells?: boolean[]
): PuzzleEvaluation {
	const normalizedGuesses = Array.from({ length: puzzle.solution.length }, (_, index) =>
		normalizeGuess(guesses[index])
	);
	const normalizedCheckedCells = Array.from(
		{ length: puzzle.solution.length },
		(_, index) => (checkedCells ? Boolean(checkedCells[index]) : true)
	);
	const validLinks = buildValidLinkSet(puzzle);

	const nodeStatuses = normalizedGuesses.map((guess, index) => {
		if (!guess) {
			return 'empty';
		}

		if (!normalizedCheckedCells[index]) {
			return 'unchecked';
		}

		return guess === puzzle.solution[index].word ? 'correct' : 'wrong';
	});

	const edgeStatuses = Object.fromEntries(
		ADJACENCIES.map(([from, to]) => {
			const fromGuess = normalizedGuesses[from];
			const toGuess = normalizedGuesses[to];

			if (!fromGuess || !toGuess) {
				return [adjacencyKey(from, to), 'empty' satisfies EdgeStatus];
			}

			if (!normalizedCheckedCells[from] || !normalizedCheckedCells[to]) {
				return [adjacencyKey(from, to), 'empty' satisfies EdgeStatus];
			}

			return [
				adjacencyKey(from, to),
				validLinks.has(edgeWordKey(fromGuess, toGuess)) ? 'correct' : 'wrong'
			] satisfies [string, EdgeStatus];
		})
	) as Record<string, EdgeStatus>;

	const correctWords = nodeStatuses.reduce((count, status) => count + Number(status === 'correct'), 0);
	const correctLinks = Object.values(edgeStatuses).reduce(
		(count, status) => count + Number(status === 'correct'),
		0
	);
	const solved =
		normalizedCheckedCells.every(Boolean) && nodeStatuses.every((status) => status === 'correct');

	return {
		guesses: normalizedGuesses,
		checkedCells: normalizedCheckedCells,
		nodeStatuses,
		edgeStatuses,
		correctWords,
		correctLinks,
		solved
	};
}

export function getEdgeStatus(
	evaluation: Pick<PuzzleEvaluation, 'edgeStatuses'>,
	fromIdx: number,
	toIdx: number
): EdgeStatus {
	return evaluation.edgeStatuses[adjacencyKey(fromIdx, toIdx)] ?? 'empty';
}