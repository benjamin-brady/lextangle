<script lang="ts">
	import { trackEvent } from '$lib/analytics';
	import FeedbackDialog from './FeedbackDialog.svelte';
	import FlipHorizontal2 from 'lucide-svelte/icons/flip-horizontal-2';
	import FlipVertical2 from 'lucide-svelte/icons/flip-vertical-2';
	import ThumbsUp from 'lucide-svelte/icons/thumbs-up';
	import ThumbsDown from 'lucide-svelte/icons/thumbs-down';
	import Share2 from 'lucide-svelte/icons/share-2';
	import RotateCcw from 'lucide-svelte/icons/rotate-ccw';
	import Undo2 from 'lucide-svelte/icons/undo-2';
	import type { GameState } from '../game.svelte';
	import type { Puzzle, WordItem } from '../types';
	import { ADJACENCIES } from '../types';

	let { game, shareLabel, puzzle, storageId }: { game: GameState; shareLabel: string; puzzle: Puzzle; storageId: string } = $props();

	function wordEmoji(word: WordItem): string {
		return word.emoji ?? '✨';
	}

	type DragItem = {
		word: WordItem;
		source: 'inventory' | 'grid';
		gridIndex?: number;
	};

	const DRAG_MIME = 'application/x-lexlink-word';
	const NODE_STATUS_EMOJI = {
		correct: '🟩',
		wrong: '🟥',
		empty: '⬜',
		unchecked: '⬜'
	} as const;

	let draggedItem = $state<DragItem | null>(null);
	let dragOverIndex = $state<number | null>(null);
	// Tap-to-swap selection. When set, all other valid targets show the drop-target
	// style and the selected tile wiggles. Tapping the same tile again clears it.
	type Selection =
		| { source: 'grid'; gridIndex: number }
		| { source: 'inventory'; word: string };
	let selected = $state<Selection | null>(null);
	let feedbackOpen = $state(false);
	let feedbackSentiment = $state<'up' | 'down'>('down');
	let shareFeedback = $state('');
	let shareButtonLabel = $state('Share');
	let shareFeedbackTimer: ReturnType<typeof setTimeout> | null = null;
	let hasObservedSolvedState = false;
	let previousSolved = false;
	let solvedLinks = $derived(
		puzzle.edges.map((edge) => ({
			from: puzzle.solution[edge.from],
			to: puzzle.solution[edge.to],
			clue: edge.clue
		}))
	);

	function baseEventParams(): Record<string, string | number | boolean> {
		return {
			puzzle_id: storageId,
			puzzle_label: shareLabel,
			correct_words: game.correctCount,
			correct_links: game.correctEdgeCount,
			checks: game.checks,
			solved: game.solved
		};
	}

	function onDragStartInventory(e: DragEvent, word: WordItem) {
		startDrag(e, { word, source: 'inventory' });
	}

	function onDragStartGrid(e: DragEvent, index: number) {
		const cell = game.grid[index];
		if (!cell) return;
		startDrag(e, { word: cell, source: 'grid', gridIndex: index });
	}

	function startDrag(e: DragEvent, item: DragItem) {
		draggedItem = item;
		selected = null;
		if (!e.dataTransfer) {
			return;
		}

		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', item.word.word);
		e.dataTransfer.setData(
			DRAG_MIME,
			JSON.stringify({
				word: item.word.word,
				source: item.source,
				gridIndex: item.gridIndex
			})
		);
	}

	function resolveDraggedItem(e?: DragEvent): DragItem | null {
		if (draggedItem) {
			return draggedItem;
		}

		const raw = e?.dataTransfer?.getData(DRAG_MIME);
		if (!raw) {
			return null;
		}

		try {
			const parsed = JSON.parse(raw) as {
				word: string;
				source: 'inventory' | 'grid';
				gridIndex?: number;
			};
			const word = findWord(parsed.word);
			if (!word) {
				return null;
			}

			return {
				word,
				source: parsed.source,
				gridIndex: parsed.gridIndex
			};
		} catch {
			return null;
		}
	}

	function findWord(wordName: string): WordItem | null {
		const inventoryWord = game.inventory.find((item) => item.word === wordName);
		if (inventoryWord) {
			return inventoryWord;
		}

		const gridWord = game.grid.find((item) => item?.word === wordName);
		return gridWord ?? null;
	}

	function onDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'move';
		}
		dragOverIndex = index;
	}

	function onDragEnter(e: DragEvent, index: number) {
		e.preventDefault();
		dragOverIndex = index;
	}

	function onDragLeave() {
		dragOverIndex = null;
	}

	function onDropGrid(e: DragEvent, index: number) {
		e.preventDefault();
		dragOverIndex = null;
		const item = resolveDraggedItem(e);
		if (!item) return;

		if (item.source === 'grid' && item.gridIndex !== undefined) {
			game.moveGridWord(item.gridIndex, index);
		} else {
			game.placeWord(index, item.word);
		}
		draggedItem = null;
	}

	function onDropInventory(e: DragEvent) {
		e.preventDefault();
		dragOverIndex = null;
		const item = resolveDraggedItem(e);
		if (!item) return;
		if (item.source === 'grid' && item.gridIndex !== undefined) {
			game.removeFromGrid(item.gridIndex);
		}
		draggedItem = null;
	}

	function onDragEnd() {
		draggedItem = null;
		dragOverIndex = null;
	}

	// ---- Tap-to-swap -------------------------------------------------------

	function onTapGrid(index: number) {
		const cell = game.grid[index];
		if (!selected) {
			// Can only start a selection from an occupied tile.
			if (!cell) return;
			selected = { source: 'grid', gridIndex: index };
			return;
		}
		if (selected.source === 'grid' && selected.gridIndex === index) {
			selected = null;
			return;
		}
		if (selected.source === 'grid') {
			game.moveGridWord(selected.gridIndex, index);
		} else {
			const targetWord = selected.word;
			const word = game.inventory.find((w) => w.word === targetWord);
			if (word) game.placeWord(index, word);
		}
		selected = null;
	}

	function onTapInventory(word: WordItem) {
		if (!selected) {
			selected = { source: 'inventory', word: word.word };
			return;
		}
		if (selected.source === 'inventory' && selected.word === word.word) {
			selected = null;
			return;
		}
		if (selected.source === 'grid') {
			// Tap a grid tile then an inventory word: send that grid word back.
			game.removeFromGrid(selected.gridIndex);
			selected = null;
			return;
		}
		// Switching between inventory words.
		selected = { source: 'inventory', word: word.word };
	}

	function onTapInventoryZone() {
		if (selected?.source === 'grid') {
			game.removeFromGrid(selected.gridIndex);
			selected = null;
		}
	}

	function isSelectedGrid(i: number): boolean {
		return selected?.source === 'grid' && selected.gridIndex === i;
	}

	function isSelectedInventory(word: string): boolean {
		return selected?.source === 'inventory' && selected.word === word;
	}

	function isTapTarget(i: number): boolean {
		// Any tile other than the selected one becomes a valid target.
		if (!selected) return false;
		if (selected.source === 'grid' && selected.gridIndex === i) return false;
		return true;
	}

	function shareRows(): string {
		const statusForShare = (index: number) => {
			const cell = game.grid[index];
			if (!cell) return NODE_STATUS_EMOJI.empty;
			if (!game.isCellChecked(index)) return NODE_STATUS_EMOJI.unchecked;
			return NODE_STATUS_EMOJI[game.getNodeStatus(index)];
		};
		return Array.from({ length: 3 }, (_, rowIndex) => {
			return Array.from({ length: 3 }, (_, colIndex) => {
				return statusForShare(rowIndex * 3 + colIndex);
			}).join('');
		}).join('\n');
	}

	function buildShareText() {
		const statusLine = game.solved
			? `Solved in ${game.checks} checks`
			: `${game.correctCount}/9 words, ${game.correctEdgeCount}/${ADJACENCIES.length} links, ${game.checks} checks`;

		const lines = [
			`LexLink ${shareLabel}`,
			statusLine,
			shareRows()
		];

		if (typeof window !== 'undefined') {
			lines.push(window.location.href);
		}

		return lines.join('\n');
	}

	function setShareFeedback(message: string) {
		shareFeedback = message;
		shareButtonLabel = message === 'copied!' ? 'copied!' : 'Share';
		if (shareFeedbackTimer) {
			clearTimeout(shareFeedbackTimer);
		}
		shareFeedbackTimer = setTimeout(() => {
			shareFeedback = '';
			shareButtonLabel = 'Share';
		}, 2000);
	}

	function canUseNativeShare(): boolean {
		if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
			return false;
		}

		const mobileFlag = (
			navigator as Navigator & { userAgentData?: { mobile?: boolean } }
		).userAgentData?.mobile;
		if (typeof mobileFlag === 'boolean') {
			return mobileFlag;
		}

		return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
			|| (navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent));
	}

	function handleCheck() {
		game.check();
		trackEvent('puzzle_check', baseEventParams());
	}

	async function shareResult() {
		const text = buildShareText();
		const url = typeof window !== 'undefined' ? window.location.href : undefined;

		try {
			if (canUseNativeShare()) {
				await navigator.share({
					title: `LexLink ${shareLabel}`,
					text,
					url
				});
				trackEvent('puzzle_share', {
					...baseEventParams(),
					method: 'web_share'
				});
				setShareFeedback('Shared');
				return;
			}
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') {
				return;
			}
		}

		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			await navigator.clipboard.writeText(text);
			trackEvent('puzzle_share', {
				...baseEventParams(),
				method: 'clipboard'
			});
			setShareFeedback('copied!');
			return;
		}

		trackEvent('puzzle_share_unavailable', baseEventParams());
		setShareFeedback('Share unavailable');
	}

	$effect(() => {
		const solved = game.solved;
		if (hasObservedSolvedState && solved && !previousSolved) {
			trackEvent('puzzle_solved', baseEventParams());
		}

		previousSolved = solved;
		hasObservedSolvedState = true;
	});

	// Touch drag support
	let touchDragItem = $state<{ word: WordItem; source: 'inventory' | 'grid'; gridIndex?: number } | null>(null);
	let touchGhost = $state<{ x: number; y: number } | null>(null);

	function onTouchStartInventory(e: TouchEvent, word: WordItem) {
		e.preventDefault();
		touchDragItem = { word, source: 'inventory' };
		const touch = e.touches[0];
		touchGhost = { x: touch.clientX, y: touch.clientY };
	}

	function onTouchStartGrid(e: TouchEvent, index: number) {
		const cell = game.grid[index];
		if (!cell) return;
		e.preventDefault();
		touchDragItem = { word: cell, source: 'grid', gridIndex: index };
		const touch = e.touches[0];
		touchGhost = { x: touch.clientX, y: touch.clientY };
	}

	function onTouchMove(e: TouchEvent) {
		if (!touchDragItem) return;
		e.preventDefault();
		const touch = e.touches[0];
		touchGhost = { x: touch.clientX, y: touch.clientY };
	}

	function onTouchEnd(e: TouchEvent) {
		if (!touchDragItem || !touchGhost) {
			touchDragItem = null;
			touchGhost = null;
			return;
		}

		// Find which grid cell or inventory we're over
		const el = document.elementFromPoint(touchGhost.x, touchGhost.y);
		if (el) {
			const gridCell = el.closest('[data-grid-index]');
			const invZone = el.closest('[data-inventory]');

			if (gridCell) {
				const index = Number.parseInt(gridCell.getAttribute('data-grid-index') ?? '', 10);
				if (Number.isNaN(index)) {
					touchDragItem = null;
					touchGhost = null;
					return;
				}

				if (touchDragItem.source === 'grid' && touchDragItem.gridIndex !== undefined) {
					game.moveGridWord(touchDragItem.gridIndex, index);
				} else {
					game.placeWord(index, touchDragItem.word);
				}
			} else if (invZone && touchDragItem.source === 'grid' && touchDragItem.gridIndex !== undefined) {
				game.removeFromGrid(touchDragItem.gridIndex);
			}
		}

		touchDragItem = null;
		touchGhost = null;
	}

	function edgeColor(fromIdx: number, toIdx: number): string {
		const status = game.getEdgeStatus(fromIdx, toIdx);
		switch (status) {
			case 'correct': return 'var(--green)';
			case 'wrong': return 'var(--red)';
			default: return 'var(--border)';
		}
	}

	function nodeOutline(index: number): string {
		const status = game.getNodeStatus(index);
		switch (status) {
			case 'correct': return 'var(--green)';
			case 'wrong': return 'var(--red)';
			case 'unchecked': return 'var(--border)';
			default: return 'var(--border)';
		}
	}

	// Grid positioning helpers — grid fills the column width.
	const GAP = 14;
	let boardWidth = $state(304);
	const SLOT_SIZE = $derived(Math.max(60, (boardWidth - GAP * 2) / 3));
	const NODE_SIZE = $derived(SLOT_SIZE * (72 / 92));
	const NODE_FONT = $derived(Math.max(12, NODE_SIZE * 0.19));
	const EMOJI_FONT = $derived(Math.max(12, NODE_SIZE * 0.22));
	const GRID_W = $derived(boardWidth);
	const GRID_H = $derived(boardWidth);

	function cellPos(index: number): { x: number; y: number } {
		const row = Math.floor(index / 3);
		const col = index % 3;
		return {
			x: col * (SLOT_SIZE + GAP),
			y: row * (SLOT_SIZE + GAP),
		};
	}

	// Scrapbook helpers
	const TILT_ANGLES = [-2, 1.5, -1, 2, -2.5, 1, -1.5, 2.5, -1];
	const INVENTORY_TILTS = [-3, 2, -1.5, 3, -2, 1, -2.5, 2, -1, 1.5];

	function wavyPath(x1: number, y1: number, x2: number, y2: number): string {
		// Build a wobbly path from (x1,y1) to (x2,y2) using short cubic-bezier segments.
		const dx = x2 - x1;
		const dy = y2 - y1;
		const len = Math.hypot(dx, dy);
		const nx = -dy / len; // perpendicular unit
		const ny = dx / len;
		const segs = Math.max(4, Math.round(len / 20));
		let d = `M ${x1.toFixed(2)} ${y1.toFixed(2)}`;
		let px = x1;
		let py = y1;
		for (let i = 1; i <= segs; i++) {
			const t = i / segs;
			const tx = x1 + dx * t;
			const ty = y1 + dy * t;
			// Deterministic wobble based on i
			const amp = 2.5 * Math.sin(i * 1.7) * (1 - Math.abs(0.5 - t) * 1.5);
			const cx1 = px + (tx - px) * 0.33 + nx * amp;
			const cy1 = py + (ty - py) * 0.33 + ny * amp;
			const cx2 = px + (tx - px) * 0.66 - nx * amp;
			const cy2 = py + (ty - py) * 0.66 - ny * amp;
			d += ` C ${cx1.toFixed(2)} ${cy1.toFixed(2)}, ${cx2.toFixed(2)} ${cy2.toFixed(2)}, ${tx.toFixed(2)} ${ty.toFixed(2)}`;
			px = tx;
			py = ty;
		}
		return d;
	}
</script>

<svelte:window
	ontouchmove={onTouchMove}
	ontouchend={onTouchEnd}
/>

<div class="flex flex-col items-stretch gap-6 select-none touch-none">
	<!-- Stats: sticky notes -->
	<div class="flex items-start justify-center gap-3 px-2">
		<div class="sticky-note flex-1 text-center" style="background: var(--crayon-yellow); transform: rotate(-2deg);">
			<p class="font-display leading-none" style="font-size: 1rem; color: rgba(42,42,46,0.75);">checks</p>
			<p class="font-display font-bold tabular-nums leading-none mt-1" style="font-size: 2.2rem; color: var(--ink-dark);">{game.checks}</p>
		</div>
		<div class="sticky-note flex-1 text-center" style="background: var(--crayon-blue); transform: rotate(1.5deg);">
			<p class="font-display leading-none" style="font-size: 1rem; color: rgba(255,255,255,0.9);">words</p>
			<p class="font-display font-bold tabular-nums leading-none mt-1" style="font-size: 2.2rem; color: #fff;">{game.correctCount}<span style="opacity: 0.7;">/9</span></p>
		</div>
		<div class="sticky-note flex-1 text-center" style="background: var(--crayon-green); transform: rotate(-1deg);">
			<p class="font-display leading-none" style="font-size: 1rem; color: rgba(255,255,255,0.9);">links</p>
			<p class="font-display font-bold tabular-nums leading-none mt-1" style="font-size: 2.2rem; color: #fff;">{game.correctEdgeCount}<span style="opacity: 0.7;">/{ADJACENCIES.length}</span></p>
		</div>
	</div>

	<!-- Grid -->
	<div class="relative w-full" style="height: {GRID_H + 18}px;" bind:clientWidth={boardWidth}>
		<!-- Crayon-squiggle edges -->
		<svg
			class="absolute inset-0 pointer-events-none"
			width={GRID_W}
			height={GRID_H}
			style="overflow: visible;"
		>
			{#each ADJACENCIES as [a, b] (`${a}-${b}`)}
				{@const pa = cellPos(a)}
				{@const pb = cellPos(b)}
				{@const x1 = pa.x + SLOT_SIZE / 2}
				{@const y1 = pa.y + SLOT_SIZE / 2}
				{@const x2 = pb.x + SLOT_SIZE / 2}
				{@const y2 = pb.y + SLOT_SIZE / 2}
				<path
					d={wavyPath(x1, y1, x2, y2)}
					fill="none"
					stroke={edgeColor(a, b)}
					stroke-width="10"
					stroke-linecap="round"
					stroke-linejoin="round"
					filter="url(#wobble)"
				/>
			{/each}
		</svg>

		<!-- Polaroid tiles -->
		{#each Array(9) as _, i (i)}
			{@const pos = cellPos(i)}
			{@const cell = game.grid[i]}
			{@const tilt = TILT_ANGLES[i]}
			{@const isDragSource =
				draggedItem?.source === 'grid' && draggedItem.gridIndex === i}
			{@const isSelected = isSelectedGrid(i)}
			{@const isSwapSource = isDragSource || isSelected}
			{@const isTapHint = isTapTarget(i) && !isDragSource}
			{@const isDropTarget = (dragOverIndex === i && !isDragSource) || isTapHint}
			<div
				class="absolute flex items-center justify-center"
				style="
					left: {pos.x}px;
					top: {pos.y}px;
					width: {SLOT_SIZE}px;
					height: {SLOT_SIZE}px;
				"
				data-grid-index={i}
				role="button"
				tabindex="0"
				ondragenter={(e) => onDragEnter(e, i)}
				ondragover={(e) => onDragOver(e, i)}
				ondragleave={onDragLeave}
				ondrop={(e) => onDropGrid(e, i)}
				onclick={() => onTapGrid(i)}
				onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTapGrid(i); } }}
			>
				{#if cell}
					<div
						class="polaroid cursor-grab flex flex-col items-center justify-center active:cursor-grabbing relative {isSelected ? 'tile-wiggle' : ''}"
						style="
							width: {NODE_SIZE}px;
							height: {NODE_SIZE + 14}px;
							transform: rotate({tilt}deg);
							background: {isDropTarget
								? '#fce6e1'
								: game.isCellChecked(i)
								? (game.getNodeStatus(i) === 'correct'
									? 'var(--tile-surface-correct)'
									: game.getNodeStatus(i) === 'wrong'
										? 'var(--tile-surface-wrong)'
										: 'var(--tile-surface)')
								: 'var(--tile-surface)'};
							outline: 3px {isDropTarget ? 'dashed var(--crayon-red)' : `solid ${nodeOutline(i)}`};
							opacity: {isDropTarget ? '0.85' : '1'};
							outline-offset: -3px;
						"
						role="button"
						aria-label={`Move ${cell.word}`}
						aria-pressed={isSelected}
						tabindex="-1"
						draggable="true"
						ondragstart={(e) => onDragStartGrid(e, i)}
						ondragend={onDragEnd}
						ontouchstart={(e) => onTouchStartGrid(e, i)}
					>
						<span aria-hidden="true" class="leading-none mt-1" style="font-size: {EMOJI_FONT * 1.15}px;">{wordEmoji(cell)}</span>
						<span class="font-display leading-none mt-1" style="font-size: {NODE_FONT * 1.45}px; color: var(--ink-dark);">{cell.word}</span>
						{#if isSwapSource}
							<span class="absolute font-display font-bold leading-none pointer-events-none" style="font-size: {NODE_FONT * 0.95}px; color: var(--crayon-red); bottom: 4px; right: 6px; transform: rotate(-4deg);">swap</span>
						{/if}
					</div>
				{:else if isDropTarget}
					<div
						class="polaroid"
						style="width: {NODE_SIZE}px; height: {NODE_SIZE + 14}px; transform: rotate({tilt}deg); background: #fce6e1; outline: 3px dashed var(--crayon-red); outline-offset: -3px;"
					></div>
				{:else}
					<div
						class="polaroid"
						style="width: {NODE_SIZE}px; height: {NODE_SIZE + 14}px; transform: rotate({tilt}deg); background: var(--tile-surface); outline: 3px dashed {nodeOutline(i)}; outline-offset: -3px;"
					></div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Solve state with stickers -->
	{#if game.solved}
		<div class="relative text-center py-4">
			<span aria-hidden="true" class="absolute" style="top: -4px; left: 18%; font-size: 2rem; transform: rotate(-18deg); display: inline-block;">⭐</span>
			<span aria-hidden="true" class="absolute" style="top: 40px; right: 14%; font-size: 1.6rem; transform: rotate(22deg); display: inline-block;">🌟</span>
			<span aria-hidden="true" class="absolute" style="bottom: 8px; left: 32%; font-size: 1.5rem; transform: rotate(-8deg); display: inline-block;">⭐</span>
			<span aria-hidden="true" class="absolute" style="top: 8px; right: 8%; font-size: 2.2rem;">☀️</span>
			<p class="font-display font-bold leading-none" style="font-size: 6rem; color: var(--crayon-green); transform: rotate(-3deg); display: inline-block;">nice!</p>
			<p class="font-display mt-2" style="font-size: 1.25rem; color: var(--text-muted);">solved in {game.checks} {game.checks === 1 ? 'check' : 'checks'}</p>
			<div class="mt-5 flex flex-wrap items-center justify-center gap-3">
				<button
					type="button"
					class="crayon-btn crayon-btn-yellow inline-flex items-center gap-2"
					style="transform: rotate(-2deg);"
					onclick={shareResult}
					aria-label="Share result"
				>
					<Share2 class="h-4 w-4" aria-hidden="true" />
					<span>{shareButtonLabel}</span>
				</button>
				<button
					type="button"
					class="crayon-btn crayon-btn-cream"
					style="transform: rotate(1.5deg);"
					title="I liked this puzzle"
					aria-label="Thumbs up"
					onclick={() => { feedbackSentiment = 'up'; feedbackOpen = true; }}
				>
					<ThumbsUp class="h-5 w-5" aria-hidden="true" />
				</button>
				<button
					type="button"
					class="crayon-btn crayon-btn-cream"
					style="transform: rotate(-1deg);"
					title="Report a problem with this puzzle"
					aria-label="Thumbs down"
					onclick={() => { feedbackSentiment = 'down'; feedbackOpen = true; }}
				>
					<ThumbsDown class="h-5 w-5" aria-hidden="true" />
				</button>
			</div>
			{#if shareFeedback && shareFeedback !== 'copied!'}
				<p class="mt-2 font-display" style="font-size: 1.15rem; color: var(--text-muted);">{shareFeedback}</p>
			{/if}
		</div>

		<section class="px-2 py-3" style="background: rgba(255,253,246,0.7); filter: drop-shadow(2px 3px 0 rgba(0,0,0,0.1)); border-radius: 3px;">
			<h2 class="font-display font-bold mb-1" style="font-size: 2rem; color: var(--ink-dark); transform: rotate(-1deg); display: inline-block;">
				why the links work
			</h2>
			<ul class="mt-2" style="background-image: repeating-linear-gradient(0deg, transparent 0 26px, rgba(52,152,219,0.18) 26px 27px);">
				{#each solvedLinks as link (`${link.from.word}-${link.to.word}`)}
					<li class="py-2 px-1" style="min-height: 52px;">
						<p class="font-display font-bold flex items-center gap-1.5 flex-wrap leading-tight" style="font-size: 1.35rem; color: var(--ink-dark);">
							<span aria-hidden="true" style="font-size: 1.3rem;">{wordEmoji(link.from)}</span>
							<span>{link.from.word}</span>
							<span style="color: var(--crayon-red);">→</span>
							<span aria-hidden="true" style="font-size: 1.3rem;">{wordEmoji(link.to)}</span>
							<span>{link.to.word}</span>
						</p>
						<p class="mt-0.5" style="font-size: 1rem; color: var(--text-muted); line-height: 1.4;">{link.clue}</p>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<!-- Inventory: scattered stickers -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="flex min-h-16 flex-wrap justify-center gap-2 p-3"
		data-inventory
		role="list"
		style="background: rgba(255,253,246,0.5); outline: 3px dashed {selected?.source === 'grid' ? 'var(--crayon-red)' : 'var(--border-strong)'}; outline-offset: -6px; border-radius: 6px; cursor: {selected?.source === 'grid' ? 'pointer' : 'default'};"
		ondragover={(e) => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'; }}
		ondrop={onDropInventory}
		onclick={onTapInventoryZone}
		onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTapInventoryZone(); } }}
	>
		{#if game.inventory.length === 0}
			<p class="self-center font-display" style="font-size: 1.2rem; color: var(--text-muted);">
				{game.solved ? 'all words placed ✨' : 'drag words back here'}
			</p>
		{/if}
		{#each game.inventory as word, idx (word.word)}
			{@const invSelected = isSelectedInventory(word.word)}
			{@const invDragSource = draggedItem?.source === 'inventory' && draggedItem.word.word === word.word}
			{@const invSwapSource = invSelected || invDragSource}
			<div
				class="sticker-chip relative {invSelected ? 'tile-wiggle' : ''}"
				style="transform: rotate({INVENTORY_TILTS[idx % INVENTORY_TILTS.length]}deg);"
				draggable="true"
				role="button"
				tabindex="0"
				aria-pressed={invSelected}
				ondragstart={(e) => onDragStartInventory(e, word)}
				ondragend={onDragEnd}
				ontouchstart={(e) => onTouchStartInventory(e, word)}
				onclick={(e) => { e.stopPropagation(); onTapInventory(word); }}
				onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onTapInventory(word); } }}
			>
				<span aria-hidden="true" style="font-size: 1.15rem; line-height: 1;">{wordEmoji(word)}</span>
				<span class="font-display" style="font-size: 1.3rem; line-height: 1; color: var(--ink-dark);">{word.word}</span>
				{#if invSwapSource}
					<span class="absolute font-display font-bold leading-none pointer-events-none" style="font-size: 0.8rem; color: var(--crayon-red); bottom: -8px; right: -6px; transform: rotate(-4deg);">swap</span>
				{/if}
			</div>
		{/each}
	</div>

	<div class="flex flex-col gap-4">
		{#if !game.solved}
			<button
				class="crayon-btn crayon-btn-blue w-full"
				style="padding: 16px; font-size: 1.8rem; transform: rotate(-0.5deg);"
				onclick={handleCheck}
				disabled={!game.canCheck}
			>
				check it!
			</button>
		{/if}
		<div class="flex flex-wrap items-center justify-center gap-2">
			{#if !game.solved}
				<button
					type="button"
					class="crayon-btn crayon-btn-yellow inline-flex items-center gap-1.5"
					style="font-size: 1.1rem; padding: 8px 12px; transform: rotate(-1.5deg);"
					onclick={shareResult}
					aria-label="Share result"
				>
					<Share2 class="h-4 w-4" aria-hidden="true" />
					<span>{shareButtonLabel}</span>
				</button>
				<button
					type="button"
					class="crayon-btn crayon-btn-green inline-flex items-center gap-1.5"
					style="font-size: 1.1rem; padding: 8px 12px; transform: rotate(1.5deg);"
					onclick={() => game.flipHorizontal()}
					title="Flip board horizontally"
					aria-label="Flip board horizontally"
				>
					<FlipHorizontal2 class="h-4 w-4" aria-hidden="true" />
					<span>flip h</span>
				</button>
				<button
					type="button"
					class="crayon-btn crayon-btn-purple inline-flex items-center gap-1.5"
					style="font-size: 1.1rem; padding: 8px 12px; transform: rotate(-1deg);"
					onclick={() => game.flipVertical()}
					title="Flip board vertically"
					aria-label="Flip board vertically"
				>
					<FlipVertical2 class="h-4 w-4" aria-hidden="true" />
					<span>flip v</span>
				</button>
			{/if}
			<button
				type="button"
				class="crayon-btn crayon-btn-yellow inline-flex items-center gap-1.5"
				style="font-size: 1.1rem; padding: 8px 12px; transform: rotate(2deg);"
				onclick={() => game.undo()}
				disabled={!game.canUndo}
				aria-label="Undo last move"
				title="Undo last move"
			>
				<Undo2 class="h-4 w-4" aria-hidden="true" />
				<span>undo</span>
			</button>
			<button
				type="button"
				class="crayon-btn crayon-btn-red inline-flex items-center gap-1.5"
				style="font-size: 1.1rem; padding: 8px 12px; transform: rotate(-1.5deg);"
				onclick={() => game.reset()}
				aria-label="Reset board"
			>
				<RotateCcw class="h-4 w-4" aria-hidden="true" />
				<span>reset</span>
			</button>
			<button
				type="button"
				class="crayon-btn crayon-btn-cream inline-flex items-center gap-1.5 ml-auto"
				style="font-size: 1.1rem; padding: 8px 10px; transform: rotate(1.5deg);"
				title="I liked this puzzle"
				aria-label="Thumbs up"
				onclick={() => { feedbackSentiment = 'up'; feedbackOpen = true; }}
			>
				<ThumbsUp class="h-4 w-4" aria-hidden="true" />
			</button>
			<button
				type="button"
				class="crayon-btn crayon-btn-cream inline-flex items-center gap-1.5"
				style="font-size: 1.1rem; padding: 8px 10px; transform: rotate(-1.5deg);"
				title="Report a problem with this puzzle"
				aria-label="Thumbs down"
				onclick={() => { feedbackSentiment = 'down'; feedbackOpen = true; }}
			>
				<ThumbsDown class="h-4 w-4" aria-hidden="true" />
			</button>
		</div>
	</div>

	{#if shareFeedback && shareFeedback !== 'copied!'}
		<p class="text-center font-display" style="font-size: 1.15rem; color: var(--text-muted);">{shareFeedback}</p>
	{/if}
</div>

<!-- Touch drag ghost -->
{#if touchDragItem && touchGhost}
	<div
		class="fixed z-50 sticker-chip pointer-events-none"
		style="left: {touchGhost.x - 40}px; top: {touchGhost.y - 30}px; background: var(--crayon-yellow);"
	>
		<span aria-hidden="true" style="font-size: 1.15rem; line-height: 1;">{wordEmoji(touchDragItem.word)}</span>
		<span class="font-display" style="font-size: 1.3rem; line-height: 1;">{touchDragItem.word.word}</span>
	</div>
{/if}

<FeedbackDialog
	bind:open={feedbackOpen}
	sentiment={feedbackSentiment}
	{puzzle}
	{storageId}
/>

<style>
	@keyframes tile-wiggle {
		0%, 100% { transform: rotate(-2.5deg); }
		25%      { transform: rotate(0deg); }
		50%      { transform: rotate(2.5deg); }
		75%      { transform: rotate(0deg); }
	}
	:global(.tile-wiggle) {
		animation: tile-wiggle 0.45s ease-in-out infinite;
	}
</style>
