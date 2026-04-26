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
	<GameBoard {game} {puzzle} {shareLabel} {storageId} {onProgressChange} />
</div>

{#if debugEnabled}
	<DebugPanel {puzzle} {storageId} />
{/if}