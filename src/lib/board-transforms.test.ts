import { describe, expect, test } from 'bun:test';

import { rotateGridClockwise } from './board-transforms';

describe('rotateGridClockwise', () => {
	test('rotates a 3x3 grid clockwise around the center', () => {
		const result = rotateGridClockwise(['0', '1', '2', '3', '4', '5', '6', '7', '8']);

		expect(result.grid).toEqual(['6', '3', '0', '7', '4', '1', '8', '5', '2']);
		expect(result.moved).toEqual([0, 2, 8, 6, 1, 5, 7, 3]);
	});

	test('keeps sticky cells fixed and rotates the remaining cells in each ring', () => {
		const result = rotateGridClockwise(
			['0', '1', '2', '3', '4', '5', '6', '7', '8'],
			(index) => index === 0 || index === 5
		);

		expect(result.grid).toEqual(['0', '3', '6', '7', '4', '5', '8', '1', '2']);
		expect(result.moved).toEqual([2, 8, 6, 1, 7, 3]);
	});
});