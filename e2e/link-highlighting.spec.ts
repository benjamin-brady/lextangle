import { expect, test } from '@playwright/test';

const GREEN = 'rgb(34, 204, 85)';
const RED = 'rgb(239, 68, 68)';

const solvedWords = ['Tea', 'Party', 'Floor', 'Tree', 'Line', 'Dance', 'Top', 'Up', 'Step'];

function seedBoard(words: string[], checks = 1) {
	return JSON.stringify({
		grid: words,
		inventory: [],
		checks,
		cellChecked: Array(words.length).fill(true),
		checkedSnapshot: words
	});
}

test('solved hard puzzle highlights every rendered link green', async ({ page }) => {
	await page.addInitScript((seed) => {
		window.localStorage.setItem('simicle-game-practice-hard-1', seed);
	}, seedBoard(solvedWords, 13));

	await page.goto('/practice/hard/1');

	expect(await page.getByText('Solved!').isVisible()).toBe(true);
	await expect(page.getByText('12/12').last()).toBeVisible();

	const strokes = await page.locator('svg line').evaluateAll((lines) =>
		lines.map((line) => window.getComputedStyle(line).stroke)
	);

	expect(strokes).toHaveLength(12);
	expect(strokes).toEqual(Array(12).fill(GREEN));
});

test('swapped corner words still show valid off-position links in green', async ({ page }) => {
	const swappedWords = ['Top', 'Party', 'Floor', 'Tree', 'Line', 'Dance', 'Tea', 'Up', 'Step'];

	await page.addInitScript((seed) => {
		window.localStorage.setItem('simicle-game-practice-hard-1', seed);
	}, seedBoard(swappedWords));

	await page.goto('/practice/hard/1');
	await page.locator('svg line').first().waitFor({ state: 'attached' });

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
		GREEN, // 0-3: Tree-Top is still a valid link
		GREEN, // 1-4: both correct
		GREEN, // 2-5: both correct
		GREEN, // 3-6: Tea-Tree is still a valid link
		GREEN, // 4-7: both correct
		GREEN, // 5-8: both correct
	];

	const strokes = await page.locator('svg line').evaluateAll((lines) =>
		lines.map((line) => window.getComputedStyle(line).stroke)
	);

	expect(strokes).toHaveLength(12);
	expect(strokes).toEqual(expectedColors);

	// The links counter must agree with the visual count
	await expect(page.getByText('10/12').last()).toBeVisible();
});