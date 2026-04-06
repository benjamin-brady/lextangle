import { describe, expect, test } from 'bun:test';

import { evaluatePuzzleState, getEdgeStatus } from './game-logic';
import { PUZZLES } from './puzzles';

const greenhousePuzzle = PUZZLES.find(
	(puzzle) =>
		puzzle.solution.map(({ word }) => word).join(',') ===
		'Tea,Green,Power,Tree,House,Plant,Line,Party,Food'
);

if (!greenhousePuzzle) {
	throw new Error('Expected to find the greenhouse daily puzzle fixture');
}

describe('evaluatePuzzleState', () => {
	test('marks intended links green even when the linked words are off-position', () => {
		const evaluation = evaluatePuzzleState(greenhousePuzzle, [
			'Tea',
			'Power',
			'Line',
			'Plant',
			'House',
			'Party',
			'Tree',
			'Food',
			'Green'
		]);

		expect(evaluation.correctWords).toBe(2);
		expect(evaluation.correctLinks).toBe(3);
		expect(getEdgeStatus(evaluation, 3, 4)).toBe('correct');
		expect(getEdgeStatus(evaluation, 4, 5)).toBe('correct');
		expect(getEdgeStatus(evaluation, 2, 5)).toBe('correct');
		expect(getEdgeStatus(evaluation, 0, 1)).toBe('wrong');
		expect(getEdgeStatus(evaluation, 0, 3)).toBe('wrong');
	});

	test('keeps unchecked cells and their links out of the display state', () => {
		const evaluation = evaluatePuzzleState(
			greenhousePuzzle,
			['Tea', 'Green', 'Power', 'Tree', 'House', 'Plant', 'Line', 'Party', 'Food'],
			[true, true, true, false, true, true, true, true, true]
		);

		expect(evaluation.correctWords).toBe(8);
		expect(evaluation.correctLinks).toBe(9);
		expect(evaluation.nodeStatuses[3]).toBe('unchecked');
		expect(getEdgeStatus(evaluation, 0, 3)).toBe('empty');
		expect(getEdgeStatus(evaluation, 3, 4)).toBe('empty');
		expect(getEdgeStatus(evaluation, 3, 6)).toBe('empty');
	});

	test('reports a solved board only when every checked word is in its home', () => {
		const solvedEvaluation = evaluatePuzzleState(greenhousePuzzle, greenhousePuzzle.solution);
		const unsolvedEvaluation = evaluatePuzzleState(greenhousePuzzle, [
			'Green',
			'Tea',
			'Power',
			'Tree',
			'House',
			'Plant',
			'Line',
			'Party',
			'Food'
		]);

		expect(solvedEvaluation.solved).toBe(true);
		expect(solvedEvaluation.correctWords).toBe(9);
		expect(solvedEvaluation.correctLinks).toBe(12);
		expect(unsolvedEvaluation.solved).toBe(false);
		expect(unsolvedEvaluation.correctWords).toBe(7);
		expect(unsolvedEvaluation.correctLinks).toBe(9);
	});
});