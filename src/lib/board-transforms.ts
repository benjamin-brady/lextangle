export interface GridTransformResult<T> {
	grid: T[];
	moved: number[];
}

const CLOCKWISE_ROTATION_CYCLES = [
	[0, 2, 8, 6],
	[1, 5, 7, 3],
] as const;

export function rotateGridClockwise<T>(
	grid: readonly T[],
	isSticky: (index: number) => boolean = () => false
): GridTransformResult<T> {
	const nextGrid = [...grid];
	const moved: number[] = [];

	for (const cycle of CLOCKWISE_ROTATION_CYCLES) {
		const movable = cycle.filter((index) => !isSticky(index));
		if (movable.length < 2) continue;

		const lastValue = nextGrid[movable[movable.length - 1]];
		for (let movableIndex = movable.length - 1; movableIndex > 0; movableIndex--) {
			nextGrid[movable[movableIndex]] = nextGrid[movable[movableIndex - 1]];
		}
		nextGrid[movable[0]] = lastValue;
		moved.push(...movable);
	}

	return {
		grid: nextGrid,
		moved,
	};
}