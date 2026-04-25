import { expect, test } from '@playwright/test';

test('post-grid puzzle areas allow vertical touch scrolling', async ({ page }) => {
	await page.goto('/practice/1');

	const touchActions = await page.locator('[data-grid-index="0"]').evaluate((firstCell) => {
		const boardRoot = firstCell.parentElement?.parentElement?.parentElement;
		if (!(boardRoot instanceof HTMLElement)) {
			throw new Error('Game board root did not render');
		}

		return {
			boardRoot: getComputedStyle(boardRoot).touchAction,
		};
	});

	expect(touchActions.boardRoot).not.toBe('none');
});

test('touching a draggable word does not block scroll before dragging starts', async ({ page }) => {
	await page.goto('/practice/1');

	const defaultPrevented = await page.locator('[data-inventory] [draggable="true"]').first().evaluate((wordChip) => {
		const bounds = wordChip.getBoundingClientRect();
		const touch = new Touch({
			identifier: 1,
			target: wordChip,
			clientX: bounds.left + bounds.width / 2,
			clientY: bounds.top + bounds.height / 2,
		});
		const event = new TouchEvent('touchstart', {
			bubbles: true,
			cancelable: true,
			touches: [touch],
			targetTouches: [touch],
			changedTouches: [touch],
		});

		wordChip.dispatchEvent(event);

		return event.defaultPrevented;
	});

	expect(defaultPrevented).toBe(false);
});
