<script lang="ts">
	import { trackEvent } from '$lib/analytics';
	import FeedbackDialog from './FeedbackDialog.svelte';
	import FlipHorizontal2 from 'lucide-svelte/icons/flip-horizontal-2';
	import FlipVertical2 from 'lucide-svelte/icons/flip-vertical-2';
	import ThumbsUp from 'lucide-svelte/icons/thumbs-up';
	import ThumbsDown from 'lucide-svelte/icons/thumbs-down';
	import Share2 from 'lucide-svelte/icons/share-2';
	import RotateCcw from 'lucide-svelte/icons/rotate-ccw';
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
</script>

<svelte:window
	ontouchmove={onTouchMove}
	ontouchend={onTouchEnd}
/>

<div class="flex flex-col items-stretch gap-5 select-none touch-none">
	<!-- Stats strip -->
	<div class="flex items-stretch justify-between rounded-none border-y-2 border-(--ink) bg-(--bg-raised)">
		<div class="flex-1 px-2 py-2 text-center">
			<p class="text-[10px] font-bold uppercase tracking-[0.2em] text-(--text-muted)">Checks</p>
			<p class="font-display text-2xl font-black tabular-nums leading-none mt-0.5">{game.checks}</p>
		</div>
		<div class="w-px bg-(--ink)/30"></div>
		<div class="flex-1 px-2 py-2 text-center">
			<p class="text-[10px] font-bold uppercase tracking-[0.2em] text-(--text-muted)">Words</p>
			<p class="font-display text-2xl font-black tabular-nums leading-none mt-0.5">{game.correctCount}<span class="text-(--text-muted) font-bold">/9</span></p>
		</div>
		<div class="w-px bg-(--ink)/30"></div>
		<div class="flex-1 px-2 py-2 text-center">
			<p class="text-[10px] font-bold uppercase tracking-[0.2em] text-(--text-muted)">Links</p>
			<p class="font-display text-2xl font-black tabular-nums leading-none mt-0.5">{game.correctEdgeCount}<span class="text-(--text-muted) font-bold">/{ADJACENCIES.length}</span></p>
		</div>
	</div>

	<!-- Grid -->
	<div class="relative w-full" style="height: {GRID_H}px;" bind:clientWidth={boardWidth}>
		<!-- Edges (SVG lines) -->
		<svg
			class="absolute inset-0 pointer-events-none"
			width={GRID_W}
			height={GRID_H}
		>
			{#each ADJACENCIES as [a, b] (`${a}-${b}`)}
				{@const pa = cellPos(a)}
				{@const pb = cellPos(b)}
				<line
					x1={pa.x + SLOT_SIZE / 2}
					y1={pa.y + SLOT_SIZE / 2}
					x2={pb.x + SLOT_SIZE / 2}
					y2={pb.y + SLOT_SIZE / 2}
					stroke={edgeColor(a, b)}
					stroke-width="3"
					stroke-linecap="round"
				/>
			{/each}
		</svg>

		<!-- Nodes -->
		{#each Array(9) as _, i (i)}
			{@const pos = cellPos(i)}
			{@const cell = game.grid[i]}
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
			>
				{#if cell}
					<div
						class="flex cursor-grab flex-col items-center justify-center gap-0.5 rounded-lg border-2 bg-(--surface) shadow-[2px_2px_0_0_var(--ink)] transition-all active:cursor-grabbing active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
						style="border-color: {nodeOutline(i)}; width: {NODE_SIZE}px; height: {NODE_SIZE}px;"
						role="button"
						aria-label={`Move ${cell.word}`}
						tabindex="-1"
						draggable="true"
						ondragstart={(e) => onDragStartGrid(e, i)}
						ondragend={onDragEnd}
						ontouchstart={(e) => onTouchStartGrid(e, i)}
					>
						<span aria-hidden="true" class="leading-none" style="font-size: {EMOJI_FONT}px;">{wordEmoji(cell)}</span>
						<span class="font-bold" style="font-size: {NODE_FONT}px;">{cell.word}</span>
					</div>
				{:else if dragOverIndex === i}
					<div
						class="flex items-center justify-center rounded-lg border-2 border-dashed border-(--accent) bg-(--accent-soft)"
						style="width: {NODE_SIZE}px; height: {NODE_SIZE}px;"
					></div>
				{:else}
					<div
						class="rounded-lg border-2 border-dashed bg-(--surface) transition-colors"
						style="border-color: {nodeOutline(i)}; width: {NODE_SIZE}px; height: {NODE_SIZE}px;"
					></div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Status -->
	{#if game.solved}
		<div class="text-center">
			<p class="font-display text-4xl font-black italic tracking-tight text-(--green)">Solved.</p>
			<p class="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-(--text-muted)">in {game.checks} {game.checks === 1 ? 'check' : 'checks'}</p>
			<div class="mt-4 flex flex-wrap items-center justify-center gap-2">
				<button
					type="button"
					class="inline-flex cursor-pointer items-center gap-1.5 rounded-none border-2 border-(--ink) bg-(--accent) px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-[3px_3px_0_0_var(--ink)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_var(--ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
					onclick={shareResult}
					aria-label="Share result"
				>
					<Share2 class="h-4 w-4" aria-hidden="true" />
					<span>{shareButtonLabel}</span>
				</button>
				<button
					type="button"
					class="inline-flex cursor-pointer items-center gap-1.5 rounded-none border-2 border-(--ink) bg-(--surface) px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:bg-(--surface-light)"
					title="I liked this puzzle"
					aria-label="Thumbs up"
					onclick={() => {
						feedbackSentiment = 'up';
						feedbackOpen = true;
					}}
				>
					<ThumbsUp class="h-4 w-4" aria-hidden="true" />
					<span class="sr-only">Like</span>
				</button>
				<button
					type="button"
					class="inline-flex cursor-pointer items-center gap-1.5 rounded-none border-2 border-(--ink) bg-(--surface) px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:bg-(--surface-light)"
					title="Report a problem with this puzzle"
					aria-label="Thumbs down"
					onclick={() => {
						feedbackSentiment = 'down';
						feedbackOpen = true;
					}}
				>
					<ThumbsDown class="h-4 w-4" aria-hidden="true" />
					<span class="sr-only">Dislike</span>
				</button>
			</div>
			{#if shareFeedback && shareFeedback !== 'copied!'}
				<p class="mt-1 text-sm text-(--text-muted)">{shareFeedback}</p>
			{/if}
		</div>

		<section>
			<h2 class="font-display text-xs font-bold uppercase tracking-[0.25em] text-(--text-muted) pb-2 border-b-2 border-(--ink)">
				Why the links work
			</h2>
			<ul class="divide-y divide-(--border)">
				{#each solvedLinks as link (`${link.from.word}-${link.to.word}`)}
					<li class="py-3">
						<p class="font-display text-base font-bold flex items-center gap-1.5 flex-wrap">
							<span aria-hidden="true" class="text-lg leading-none">{wordEmoji(link.from)}</span>
							<span>{link.from.word}</span>
							<span class="text-(--accent)">→</span>
							<span aria-hidden="true" class="text-lg leading-none">{wordEmoji(link.to)}</span>
							<span>{link.to.word}</span>
						</p>
						<p class="mt-1 text-sm text-(--text-muted) leading-relaxed">{link.clue}</p>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<!-- Inventory -->
	<div
		class="flex min-h-14 flex-wrap justify-center gap-2 rounded-none border-2 border-dashed border-(--border-strong) bg-(--bg-raised) p-2"
		data-inventory
		role="list"
		ondragover={(e) => {
			e.preventDefault();
			if (e.dataTransfer) {
				e.dataTransfer.dropEffect = 'move';
			}
		}}
		ondrop={onDropInventory}
	>
		{#if game.inventory.length === 0}
			<p class="self-center text-xs font-bold uppercase tracking-[0.2em] text-(--text-muted)">
				{game.solved ? 'All words placed' : 'Drag words back here'}
			</p>
		{/if}
		{#each game.inventory as word (word.word)}
			<div
				class="flex cursor-grab items-center gap-1.5 rounded-lg border-2 border-(--ink) bg-(--surface) px-3 py-2 shadow-[2px_2px_0_0_var(--ink)] transition-all hover:bg-(--surface-light) active:cursor-grabbing active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_var(--ink)]"
				draggable="true"
				role="listitem"
				ondragstart={(e) => onDragStartInventory(e, word)}
				ondragend={onDragEnd}
				ontouchstart={(e) => onTouchStartInventory(e, word)}
			>
				<span aria-hidden="true" class="text-base leading-none">{wordEmoji(word)}</span>
				<span class="text-sm font-bold">{word.word}</span>
			</div>
		{/each}
	</div>

	<div class="flex flex-col gap-3">
		{#if !game.solved}
			<button
				class="w-full cursor-pointer rounded-none border-2 border-(--ink) bg-(--ink) px-5 py-4 text-base font-black uppercase tracking-[0.25em] text-(--bg) shadow-[4px_4px_0_0_var(--accent)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_0_var(--accent)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:active:translate-x-0 disabled:active:translate-y-0"
				onclick={handleCheck}
				disabled={!game.canCheck}
			>
				Check
			</button>
		{/if}
		<div class="flex flex-wrap items-center gap-2">
			{#if !game.solved}
				<button
					type="button"
					class="inline-flex cursor-pointer items-center gap-1.5 rounded-none border-2 border-(--ink) bg-(--surface) px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:bg-(--surface-light)"
					onclick={shareResult}
					aria-label="Share result"
				>
					<Share2 class="h-4 w-4" aria-hidden="true" />
					<span>{shareButtonLabel}</span>
				</button>
				<button
					type="button"
					class="inline-flex cursor-pointer items-center gap-1.5 rounded-none border-2 border-(--ink) bg-(--surface) px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:bg-(--surface-light)"
					onclick={() => game.flipHorizontal()}
					title="Flip board horizontally"
					aria-label="Flip board horizontally"
				>
					<FlipHorizontal2 class="h-4 w-4" aria-hidden="true" />
					<span>Flip H</span>
				</button>
				<button
					type="button"
					class="inline-flex cursor-pointer items-center gap-1.5 rounded-none border-2 border-(--ink) bg-(--surface) px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:bg-(--surface-light)"
					onclick={() => game.flipVertical()}
					title="Flip board vertically"
					aria-label="Flip board vertically"
				>
					<FlipVertical2 class="h-4 w-4" aria-hidden="true" />
					<span>Flip V</span>
				</button>
			{/if}
			<button
				type="button"
				class="inline-flex cursor-pointer items-center gap-1.5 rounded-none border-2 border-(--ink) bg-(--surface) px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:bg-(--surface-light)"
				onclick={() => game.reset()}
				aria-label="Reset board"
			>
				<RotateCcw class="h-4 w-4" aria-hidden="true" />
				<span>Reset</span>
			</button>
			<button
				type="button"
				class="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-none border-2 border-(--ink) bg-(--surface) px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:bg-(--surface-light)"
				title="I liked this puzzle"
				aria-label="Thumbs up"
				onclick={() => {
					feedbackSentiment = 'up';
					feedbackOpen = true;
				}}
			>
				<ThumbsUp class="h-4 w-4" aria-hidden="true" />
				<span class="sr-only">Like</span>
			</button>
			<button
				type="button"
				class="inline-flex cursor-pointer items-center gap-1.5 rounded-none border-2 border-(--ink) bg-(--surface) px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:bg-(--surface-light)"
				title="Report a problem with this puzzle"
				aria-label="Thumbs down"
				onclick={() => {
					feedbackSentiment = 'down';
					feedbackOpen = true;
				}}
			>
				<ThumbsDown class="h-4 w-4" aria-hidden="true" />
				<span class="sr-only">Dislike</span>
			</button>
		</div>
	</div>

	{#if shareFeedback && shareFeedback !== 'copied!'}
		<p class="text-center text-sm text-(--text-muted)">{shareFeedback}</p>
	{/if}
</div>

<!-- Touch drag ghost -->
{#if touchDragItem && touchGhost}
	<div
		class="fixed z-50 flex items-center gap-1.5 rounded-lg bg-(--accent) px-3 py-2 text-white shadow-lg pointer-events-none"
		style="left: {touchGhost.x - 40}px; top: {touchGhost.y - 30}px;"
	>
		<span aria-hidden="true" class="text-base leading-none">{wordEmoji(touchDragItem.word)}</span>
		<span class="text-sm font-semibold">{touchDragItem.word.word}</span>
	</div>
{/if}

<FeedbackDialog
	bind:open={feedbackOpen}
	sentiment={feedbackSentiment}
	{puzzle}
	{storageId}
/>
