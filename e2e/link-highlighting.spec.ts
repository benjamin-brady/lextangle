import { expect, test } from '@playwright/test';

const GREEN = 'rgb(39, 174, 96)';
const RED = 'rgb(231, 76, 60)';

const solvedWords = ['Score', 'Board', 'Room', 'Card', 'Game', 'Night', 'Business', 'Plan', 'Flight'];

function seedBoard(words: string[], checks = 1) {
	return JSON.stringify({
		grid: words,
		inventory: [],
		checks,
		cellChecked: Array(words.length).fill(true),
		checkedSnapshot: words
	});
}

function edgeStrokes(page: import('@playwright/test').Page) {
	return page.getByTestId('board-edge').evaluateAll((edges) =>
		edges.map((edge) => window.getComputedStyle(edge).stroke)
	);
}

test('solved hard puzzle highlights every rendered link green', async ({ page }) => {
	await page.addInitScript((seed) => {
		window.localStorage.setItem('simicle-game-v3-practice-hard-1', seed);
	}, seedBoard(solvedWords, 13));

	await page.goto('/practice/hard/1');

	await expect(page.getByText('nice!')).toBeVisible();
	await expect.poll(() => edgeStrokes(page)).toEqual(Array(12).fill(GREEN));
});

test('swapped corner words still show valid off-position links in green', async ({ page }) => {
	const swappedWords = ['Business', 'Board', 'Room', 'Card', 'Game', 'Night', 'Score', 'Plan', 'Flight'];

	await page.addInitScript((seed) => {
		window.localStorage.setItem('simicle-game-v3-practice-hard-1', seed);
	}, seedBoard(swappedWords));

	await page.goto('/practice/hard/1');
	await page.getByTestId('board-edge').first().waitFor({ state: 'attached' });

	// Adjacencies in SVG render order (matches ADJACENCIES constant):
	// [0,1], [1,2], [3,4], [4,5], [6,7], [7,8],
	// [0,3], [1,4], [2,5], [3,6], [4,7], [5,8]
	//
	// With link evaluation decoupled from exact tile position, the swapped
	// corner words still preserve any neighboring pairs that belong to the
	// puzzle's valid link set.
	const expectedColors = [
		RED,   // 0-1: wrong (pos 0 wrong)
		GREEN, // 1-2: both correct
		GREEN, // 3-4: both correct
		GREEN, // 4-5: both correct
		RED,   // 6-7: wrong (pos 6 wrong)
		GREEN, // 7-8: both correct
		GREEN, // 0-3: Business-Card is still a valid link
		GREEN, // 1-4: both correct
		GREEN, // 2-5: both correct
		GREEN, // 3-6: Card-Score is still a valid link
		GREEN, // 4-7: both correct
		GREEN, // 5-8: both correct
	];

	await expect.poll(() => edgeStrokes(page)).toEqual(expectedColors);
});
