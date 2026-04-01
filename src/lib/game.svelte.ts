import type { EdgeStatus, NodeStatus, Puzzle, WordItem } from './types';

/**
 * Reactive game state using Svelte 5 runes.
 */
export function createGameState(puzzle: Puzzle) {
	/** Current grid: null means empty slot */
	let grid = $state<(WordItem | null)[]>(Array(9).fill(null));

	/** Inventory: words not yet placed */
	let inventory = $state<WordItem[]>(shuffleArray([...puzzle.solution]));
	let moves = $state(0);

	/** Whether the puzzle is complete and all correct */
	let solved = $derived(grid.every((cell, i) => {
		if (!cell) return false;
		const correct = puzzle.solution[i];
		return cell.word === correct.word;
	}));

	/** Number of correctly placed words */
	let correctCount = $derived(grid.reduce((acc, cell, i) => {
		if (!cell) return acc;
		return acc + (cell.word === puzzle.solution[i].word ? 1 : 0);
	}, 0));

	let correctEdgeCount = $derived(
		puzzle.edges.reduce((acc, edge) => acc + (getEdgeStatus(edge.from, edge.to) === 'correct' ? 1 : 0), 0)
	);

	function recordMove() {
		moves += 1;
	}

	function getNodeStatus(index: number): NodeStatus {
		const cell = grid[index];
		if (!cell) return 'empty';
		return cell.word === puzzle.solution[index].word ? 'correct' : 'wrong';
	}

	function getEdgeStatus(fromIdx: number, toIdx: number): EdgeStatus {
		const fromCell = grid[fromIdx];
		const toCell = grid[toIdx];
		if (!fromCell || !toCell) return 'empty';

		const correctFrom = puzzle.solution[fromIdx];
		const correctTo = puzzle.solution[toIdx];

		// Both in correct positions for this edge
		if (fromCell.word === correctFrom.word && toCell.word === correctTo.word) {
			return 'correct';
		}
		// Swapped: each is in the other's correct position
		if (fromCell.word === correctTo.word && toCell.word === correctFrom.word) {
			return 'swapped';
		}
		return 'wrong';
	}

	function getEdgeClue(fromIdx: number, toIdx: number): string | undefined {
		const edge = puzzle.edges.find(
			(e) => (e.from === fromIdx && e.to === toIdx) || (e.from === toIdx && e.to === fromIdx)
		);
		return edge?.clue;
	}

	function placeWord(gridIndex: number, word: WordItem) {
		if (grid[gridIndex]?.word === word.word) {
			return;
		}

		// If something is already in this slot, put it back in inventory
		const existing = grid[gridIndex];
		if (existing) {
			inventory = [...inventory, existing];
		}
		// Remove from inventory
		inventory = inventory.filter((w) => w.word !== word.word);
		// Place in grid
		grid[gridIndex] = word;
		recordMove();
	}

	function removeFromGrid(gridIndex: number) {
		const cell = grid[gridIndex];
		if (cell) {
			inventory = [...inventory, cell];
			grid[gridIndex] = null;
			recordMove();
		}
	}

	function moveGridWord(fromIdx: number, toIdx: number) {
		if (fromIdx === toIdx) {
			return;
		}

		const source = grid[fromIdx];
		if (!source) {
			return;
		}

		const target = grid[toIdx];
		grid[toIdx] = source;
		grid[fromIdx] = target ?? null;
		recordMove();
	}

	function swapGridCells(fromIdx: number, toIdx: number) {
		const temp = grid[fromIdx];
		grid[fromIdx] = grid[toIdx];
		grid[toIdx] = temp;
	}

	function reset() {
		inventory = shuffleArray([...puzzle.solution]);
		grid = Array(9).fill(null);
		moves = 0;
	}

	return {
		get grid() { return grid; },
		get inventory() { return inventory; },
		get solved() { return solved; },
		get correctCount() { return correctCount; },
		get correctEdgeCount() { return correctEdgeCount; },
		get moves() { return moves; },
		getNodeStatus,
		getEdgeStatus,
		getEdgeClue,
		placeWord,
		removeFromGrid,
		moveGridWord,
		swapGridCells,
		reset,
	};
}

function shuffleArray<T>(arr: T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

export type GameState = ReturnType<typeof createGameState>;
