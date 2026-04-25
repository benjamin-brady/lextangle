import { PUZZLES } from '../puzzles';
import type { Puzzle } from '../types';

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DAILY_PUZZLE_EPOCH_MS = Date.UTC(2026, 3, 8);
const DAILY_ORDER_SEED = 'lextangle-daily-order-2026-04-25';

const dailyOrderCache = new Map<number, number[]>();

function getDailyPuzzleIndex(timestamp = Date.now()): number {
	const daysSincePuzzleEpoch =
		Math.floor(timestamp / MS_PER_DAY) - Math.floor(DAILY_PUZZLE_EPOCH_MS / MS_PER_DAY);
	return Math.max(0, daysSincePuzzleEpoch);
}

function hashStringToUint32(input: string): number {
	let hash = 0x811c9dc5;

	for (let index = 0; index < input.length; index += 1) {
		hash ^= input.charCodeAt(index);
		hash = Math.imul(hash, 0x01000193);
	}

	return hash >>> 0;
}

function createMulberry32(seed: number): () => number {
	let state = seed >>> 0;

	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let value = state;
		value = Math.imul(value ^ (value >>> 15), value | 1);
		value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	};
}

function buildDailyOrder(cycleNumber: number): number[] {
	const cachedOrder = dailyOrderCache.get(cycleNumber);
	if (cachedOrder) return cachedOrder;

	const order = Array.from({ length: PUZZLES.length }, (_, index) => index);
	const random = createMulberry32(
		hashStringToUint32(`${DAILY_ORDER_SEED}:${cycleNumber}:${PUZZLES.length}`)
	);

	for (let index = order.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(random() * (index + 1));
		[order[index], order[swapIndex]] = [order[swapIndex], order[index]];
	}

	dailyOrderCache.set(cycleNumber, order);
	return order;
}

export function getDailyPuzzleNumber(timestamp = Date.now()): number {
	return getDailyPuzzleIndex(timestamp) + 1;
}

export function getDailyPuzzleByNumber(puzzleNumber: number): Puzzle {
	if (!Number.isInteger(puzzleNumber) || puzzleNumber < 1) {
		throw new RangeError('Daily puzzle number must be a positive integer');
	}

	const zeroBasedNumber = puzzleNumber - 1;
	const cycleNumber = Math.floor(zeroBasedNumber / PUZZLES.length);
	const cycleIndex = zeroBasedNumber % PUZZLES.length;
	const puzzleIndex = buildDailyOrder(cycleNumber)[cycleIndex];

	return PUZZLES[puzzleIndex];
}

export function getDailyPuzzleInfo(timestamp = Date.now()): {
	puzzle: Puzzle;
	puzzleNumber: number;
	cycleIndex: number;
} {
	const dailyPuzzleIndex = getDailyPuzzleIndex(timestamp);
	const puzzleNumber = dailyPuzzleIndex + 1;

	return {
		puzzle: getDailyPuzzleByNumber(puzzleNumber),
		puzzleNumber,
		cycleIndex: dailyPuzzleIndex % PUZZLES.length,
	};
}
