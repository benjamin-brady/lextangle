import { expect, test } from '@playwright/test';

test('server-rendered puzzle grid reserves its full width before hydration', async ({ page }) => {
	await page.route('**/_app/immutable/**/*.js', (route) => route.abort());

	await page.goto('/', { waitUntil: 'domcontentloaded' });

	const footprint = await page.locator('[data-grid-index="0"]').evaluate((firstCell) => {
		const board = firstCell.parentElement;
		const lastCell = document.querySelector('[data-grid-index="8"]');

		if (!board || !(lastCell instanceof HTMLElement)) {
			throw new Error('Puzzle grid did not render');
		}

		const boardRect = board.getBoundingClientRect();
		const firstRect = firstCell.getBoundingClientRect();
		const lastRect = lastCell.getBoundingClientRect();

		return {
			leftGap: firstRect.left - boardRect.left,
			rightGap: boardRect.right - lastRect.right,
			width: boardRect.width,
			height: boardRect.height,
		};
	});

	expect(footprint.leftGap).toBeLessThan(1);
	expect(footprint.rightGap).toBeLessThan(1);
	expect(footprint.height).toBeGreaterThanOrEqual(footprint.width);
});