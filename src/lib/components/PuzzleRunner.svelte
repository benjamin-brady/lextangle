<script lang="ts">
	import { page } from '$app/state';
	import { createGameState, type GameState } from '$lib/game.svelte';
	import type { DailyStreakSummary } from '$lib/streaks';
	import type { Puzzle } from '$lib/types';
	import DebugPanel from './DebugPanel.svelte';
	import GameBoard from './GameBoard.svelte';

	let {
		puzzle,
		shareLabel,
		storageId,
		streakSummary,
		onProgressChange,
	}: {
		puzzle: Puzzle;
		shareLabel: string;
		storageId: string;
		streakSummary?: DailyStreakSummary;
		onProgressChange?: () => void;
	} = $props();

	// Parent routes already key this component by storageId, so game state only
	// needs to be created once per mount instead of inside a reactive effect.
	const game: GameState = (() => createGameState(puzzle, storageId))();

	const debugEnabled = $derived(page.url.searchParams.has('debug'));
</script>

<div class="grid gap-4">
	<header class="grid gap-1 text-center sm:text-left">
		<p class="text-xs font-bold text-(--text-muted)">{shareLabel}</p>
		<h1 class="text-2xl font-bold leading-tight text-balance text-(--text)">{puzzle.title}</h1>
		{#if streakSummary}
			<div class="mt-2 grid grid-cols-2 gap-2 text-left" aria-label="Daily streaks">
				<div class="rounded border border-border bg-(--surface) px-3 py-2">
					<p class="text-[10px] font-bold uppercase tracking-[0.16em] text-(--text-muted)">current</p>
					<p class="font-display leading-none text-(--crayon-red)" style="font-size: 2rem;">{streakSummary.currentStreak}</p>
				</div>
				<div class="rounded border border-border bg-(--surface) px-3 py-2">
					<p class="text-[10px] font-bold uppercase tracking-[0.16em] text-(--text-muted)">best</p>
					<p class="font-display leading-none text-(--crayon-blue)" style="font-size: 2rem;">{streakSummary.bestStreak}</p>
				</div>
			</div>
		{/if}
	</header>
	<GameBoard {game} {puzzle} {shareLabel} {storageId} {onProgressChange} />
</div>

{#if debugEnabled}
	<DebugPanel {puzzle} {storageId} />
{/if}