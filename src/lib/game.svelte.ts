import { PersistedState } from 'runed';

import { createShareCheckSummary, type ShareCheckSummary } from './share-text';
import type { EdgeStatus, NodeStatus, Puzzle, WordItem } from './types';

interface SavedState {
	grid: (string | null)[];
	inventory: string[];
	checks: number;
	cellChecked: boolean[];
	checkedSnapshot: (string | null)[];
	checkHistory: ShareCheckSummary[];
	solvedAt?: number;
}

// Bump this when the saved-state schema changes or we want to invalidate all
// existing browser saves (alpha, so we can freely discard).
const STORAGE_VERSION = 'v3';

function storageKey(storageId: string): string {
	return `simicle-game-${STORAGE_VERSION}-${storageId}`;
}

export interface SolvedSummary {
	solved: boolean;
	solvedAt: number | null;
}

/**
 * Inspect the persisted savedState for a puzzle without instantiating the
 * full reactive game. Returns whether the puzzle is fully solved and (if
 * available) the timestamp it was first solved.
 */
export function readSolvedSummary(puzzle: Puzzle, storageId: string): SolvedSummary {
	if (typeof localStorage === 'undefined') return { solved: false, solvedAt: null };
	const raw = localStorage.getItem(storageKey(storageId));
	if (!raw) return { solved: false, solvedAt: null };
	try {
		const parsed = JSON.parse(raw) as Partial<SavedState> | null;
		if (!parsed || !Array.isArray(parsed.cellChecked) || !Array.isArray(parsed.grid)) {
			return { solved: false, solvedAt: null };
		}
		const allChecked =
			parsed.cellChecked.length === puzzle.solution.length &&
			parsed.cellChecked.every(Boolean);
		const matchesSolution =
			parsed.grid.length === puzzle.solution.length &&
			parsed.grid.every((w, i) => w === puzzle.solution[i].word);
		const solved = allChecked && matchesSolution;
		const solvedAt =
			solved && typeof parsed.solvedAt === 'number' && Number.isFinite(parsed.solvedAt)
				? parsed.solvedAt
				: null;
		return { solved, solvedAt };
	} catch {
		return { solved: false, solvedAt: null };
	}
}

function freshState(puzzle: Puzzle): SavedState {
	return {
		grid: Array(9).fill(null),
		inventory: shuffleArray(puzzle.solution.map((w) => w.word)),
		checks: 0,
		cellChecked: Array(9).fill(false),
		checkedSnapshot: Array(9).fill(null),
		checkHistory: [],
	};
}

function isValidSavedState(
	state: unknown,
	wordLookup: Record<string, WordItem>,
	expectedWordCount: number
): state is SavedState {
	if (typeof state !== 'object' || state === null) return false;

	const candidate = state as Partial<SavedState>;
	if (
		!Array.isArray(candidate.grid) ||
		!Array.isArray(candidate.inventory) ||
		!Array.isArray(candidate.cellChecked) ||
		!Array.isArray(candidate.checkedSnapshot)
	) {
		return false;
	}

	if (
		candidate.grid.length !== expectedWordCount ||
		candidate.cellChecked.length !== expectedWordCount ||
		candidate.checkedSnapshot.length !== expectedWordCount
	) {
		return false;
	}

	if (!Number.isInteger(candidate.checks) || (candidate.checks ?? 0) < 0) {
		return false;
	}

	const isKnownWord = (word: string) => word in wordLookup;
	if (!candidate.grid.every((word) => word === null || (typeof word === 'string' && isKnownWord(word)))) {
		return false;
	}

	if (!candidate.inventory.every((word) => typeof word === 'string' && isKnownWord(word))) {
		return false;
	}

	if (
		!candidate.checkedSnapshot.every(
			(word) => word === null || (typeof word === 'string' && isKnownWord(word))
		)
	) {
		return false;
	}

	if (!candidate.cellChecked.every((value) => typeof value === 'boolean')) {
		return false;
	}

	if (candidate.checkHistory !== undefined && !isValidCheckHistory(candidate.checkHistory)) {
		return false;
	}

	const presentWords = [
		...candidate.grid.filter((word): word is string => typeof word === 'string'),
		...candidate.inventory,
	];

	return presentWords.length === expectedWordCount && new Set(presentWords).size === expectedWordCount;
}

function isValidCheckHistory(history: unknown): history is ShareCheckSummary[] {
	return Array.isArray(history) && history.every((entry) => {
		if (typeof entry !== 'object' || entry === null) return false;
		const candidate = entry as Partial<ShareCheckSummary>;
		return Array.isArray(candidate.rows) &&
			candidate.rows.length === 3 &&
			candidate.rows.every((row) => typeof row === 'string') &&
			Number.isInteger(candidate.correctLinks) &&
			(candidate.correctLinks ?? -1) >= 0;
	});
}

/**
 * Reactive game state backed by `runed`'s `PersistedState`. Saves to
 * localStorage and syncs across browser tabs automatically.
 */
export function createGameState(puzzle: Puzzle, storageId: string) {
	const wordLookup = Object.fromEntries(puzzle.solution.map((w) => [w.word, w]));
	const validLinks = new Set(
		puzzle.edges.map(({ from, to }) => {
			const a = puzzle.solution[from].word;
			const b = puzzle.solution[to].word;
			return [a, b].sort().join('::');
		})
	);

	const persisted = new PersistedState<SavedState>(storageKey(storageId), freshState(puzzle));

	// Session-only undo stack. Snapshots are full SavedState copies taken
	// BEFORE each move mutation. History is cleared on check (checks cannot
	// be undone) and on reset. Reactive counter drives `canUndo` so the
	// Undo button state stays in sync.
	const history: SavedState[] = [];
	let historyVersion = $state(0);
	const MAX_HISTORY = 50;

	function pushHistory() {
		// Deep-clone current state so later mutations don't leak into the snapshot.
		const current = persisted.current;
		history.push({
			grid: [...current.grid],
			inventory: [...current.inventory],
			checks: current.checks,
			cellChecked: [...current.cellChecked],
			checkedSnapshot: [...current.checkedSnapshot],
			checkHistory: current.checkHistory ? [...current.checkHistory] : [],
		});
		if (history.length > MAX_HISTORY) history.shift();
		historyVersion++;
	}

	// Discard malformed or stale saves that don't match this puzzle exactly.
	{
		const s = persisted.current;
		if (!isValidSavedState(s, wordLookup, puzzle.solution.length)) {
			persisted.current = freshState(puzzle);
		}
	}

	const grid = $derived(
		persisted.current.grid.map((w) => (w ? wordLookup[w] ?? null : null))
	);
	const inventory = $derived.by(() =>
		persisted.current.inventory
			.map((w) => wordLookup[w])
			.filter((w): w is WordItem => w != null)
	);

	const solved = $derived(
		persisted.current.cellChecked.every(Boolean) &&
			persisted.current.grid.every((w, i) => w !== null && w === puzzle.solution[i].word)
	);

	const correctCount = $derived(
		persisted.current.grid.reduce((acc, w, i) => {
			if (!w || !persisted.current.cellChecked[i]) return acc;
			return acc + (w === puzzle.solution[i].word ? 1 : 0);
		}, 0)
	);

	const correctEdgeCount = $derived(
		puzzle.edges.reduce(
			(acc, edge) => acc + (getEdgeStatus(edge.from, edge.to) === 'correct' ? 1 : 0),
			0
		)
	);

	const canCheck = $derived(
		persisted.current.grid.some((w, i) => w !== persisted.current.checkedSnapshot[i])
	);

	function markCellsDirty(indices: number[]) {
		const s = persisted.current;
		for (const idx of indices) {
			if (s.grid[idx] !== s.checkedSnapshot[idx]) {
				s.cellChecked[idx] = false;
			}
		}
	}

	function check() {
		const s = persisted.current;
		s.checks += 1;
		s.cellChecked = Array(9).fill(true);
		s.checkedSnapshot = [...s.grid];
		s.checkHistory = [
			...(s.checkHistory ?? []),
			createShareCheckSummary({
				nodeStatuses: Array.from({ length: 9 }, (_, index) => getNodeStatus(index)),
				correctLinks: puzzle.edges.reduce(
					(count, edge) => count + Number(getEdgeStatus(edge.from, edge.to) === 'correct'),
					0
				)
			})
		];
		const nowSolved = s.grid.every((w, i) => w !== null && w === puzzle.solution[i].word);
		if (nowSolved && !s.solvedAt) {
			s.solvedAt = Date.now();
		}
		// Checks cannot be undone.
		history.length = 0;
		historyVersion++;
	}

	function undo() {
		const prev = history.pop();
		if (!prev) {
			historyVersion++;
			return;
		}
		// Restore via individual proxy mutations so the proxy's update hooks
		// fire and subscribers re-read storage with the restored state.
		const s = persisted.current;
		s.grid = prev.grid;
		s.inventory = prev.inventory;
		s.cellChecked = prev.cellChecked;
		s.checkedSnapshot = prev.checkedSnapshot;
		s.checks = prev.checks;
		s.checkHistory = prev.checkHistory;
		historyVersion++;
	}

	function isCellChecked(index: number): boolean {
		return persisted.current.cellChecked[index];
	}

	function getNodeStatus(index: number): NodeStatus {
		const w = persisted.current.grid[index];
		if (!w) return 'empty';
		if (!persisted.current.cellChecked[index]) return 'unchecked';
		return w === puzzle.solution[index].word ? 'correct' : 'wrong';
	}

	function getRawEdgeStatus(fromIdx: number, toIdx: number): EdgeStatus {
		const a = persisted.current.grid[fromIdx];
		const b = persisted.current.grid[toIdx];
		if (!a || !b) return 'empty';
		const key = [a, b].sort().join('::');
		return validLinks.has(key) ? 'correct' : 'wrong';
	}

	function getEdgeStatus(fromIdx: number, toIdx: number): EdgeStatus {
		const s = persisted.current;
		if (!s.grid[fromIdx] || !s.grid[toIdx]) return 'empty';
		if (!s.cellChecked[fromIdx] || !s.cellChecked[toIdx]) return 'empty';
		return getRawEdgeStatus(fromIdx, toIdx);
	}

	function getEdgeClue(fromIdx: number, toIdx: number): string | undefined {
		const edge = puzzle.edges.find(
			(e) => (e.from === fromIdx && e.to === toIdx) || (e.from === toIdx && e.to === fromIdx)
		);
		return edge?.clue;
	}

	function placeWord(gridIndex: number, word: WordItem) {
		const s = persisted.current;
		if (s.grid[gridIndex] === word.word) return;

		pushHistory();
		const existing = s.grid[gridIndex];
		s.inventory = s.inventory.filter((w) => w !== word.word);
		if (existing) s.inventory.push(existing);
		s.grid[gridIndex] = word.word;
		markCellsDirty([gridIndex]);
	}

	function removeFromGrid(gridIndex: number) {
		const s = persisted.current;
		const existing = s.grid[gridIndex];
		if (!existing) return;
		pushHistory();
		s.inventory.push(existing);
		s.grid[gridIndex] = null;
		markCellsDirty([gridIndex]);
	}

	function moveGridWord(fromIdx: number, toIdx: number) {
		if (fromIdx === toIdx) return;
		const s = persisted.current;
		const source = s.grid[fromIdx];
		if (!source) return;
		pushHistory();
		const target = s.grid[toIdx];
		s.grid[toIdx] = source;
		s.grid[fromIdx] = target ?? null;
		markCellsDirty([fromIdx, toIdx]);
	}

	function swapGridCells(fromIdx: number, toIdx: number) {
		const s = persisted.current;
		pushHistory();
		const temp = s.grid[fromIdx];
		s.grid[fromIdx] = s.grid[toIdx];
		s.grid[toIdx] = temp;
	}

	function isSticky(index: number): boolean {
		const s = persisted.current;
		return s.cellChecked[index] && s.grid[index] === puzzle.solution[index].word;
	}

	function flipGrid(pairs: [number, number][]) {
		const s = persisted.current;
		// Filter out pairs where either cell is pinned (checked-correct).
		const movable = pairs.filter(([a, b]) => !isSticky(a) && !isSticky(b));
		if (movable.length === 0) return;
		pushHistory();
		const next = [...s.grid];
		for (const [a, b] of movable) {
			[next[a], next[b]] = [next[b], next[a]];
		}
		s.grid = next;
		markCellsDirty(movable.flat());
	}

	function flipHorizontal() {
		flipGrid([
			[0, 2],
			[3, 5],
			[6, 8],
		]);
	}

	function flipVertical() {
		flipGrid([
			[0, 6],
			[1, 7],
			[2, 8],
		]);
	}

	function shiftGrid(cycles: number[][]) {
		const s = persisted.current;
		// For each cycle, remove sticky indices and only rotate the remaining ones.
		const allMoved: number[] = [];
		pushHistory();
		const next = [...s.grid];
		for (const cycle of cycles) {
			const movable = cycle.filter((i) => !isSticky(i));
			if (movable.length < 2) continue;
			const last = next[movable[movable.length - 1]];
			for (let i = movable.length - 1; i > 0; i--) {
				next[movable[i]] = next[movable[i - 1]];
			}
			next[movable[0]] = last;
			allMoved.push(...movable);
		}
		if (allMoved.length === 0) {
			// Nothing moved — pop the history entry we just pushed.
			history.pop();
			historyVersion++;
			return;
		}
		s.grid = next;
		markCellsDirty(allMoved);
	}

	function shiftRight() {
		shiftGrid([
			[0, 1, 2],
			[3, 4, 5],
			[6, 7, 8],
		]);
	}

	function shiftDown() {
		shiftGrid([
			[0, 3, 6],
			[1, 4, 7],
			[2, 5, 8],
		]);
	}

	function reset() {
		persisted.current = freshState(puzzle);
		history.length = 0;
		historyVersion++;
	}

	return {
		get grid() {
			return grid;
		},
		get inventory() {
			return inventory;
		},
		get solved() {
			return solved;
		},
		get correctCount() {
			return correctCount;
		},
		get correctEdgeCount() {
			return correctEdgeCount;
		},
		get checks() {
			return persisted.current.checks;
		},
		get checkHistory() {
			return persisted.current.checkHistory ?? [];
		},
		get cellChecked() {
			return persisted.current.cellChecked;
		},
		get canCheck() {
			return canCheck;
		},
		get canUndo() {
			// Depend on reactive version so the Undo button updates.
			historyVersion;
			return history.length > 0;
		},
		getNodeStatus,
		getEdgeStatus,
		getEdgeClue,
		isCellChecked,
		check,
		undo,
		placeWord,
		removeFromGrid,
		moveGridWord,
		swapGridCells,
		flipHorizontal,
		flipVertical,
		shiftRight,
		shiftDown,
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
