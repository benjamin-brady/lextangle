<script lang="ts">
	import { createGameState, type GameState } from '$lib/game.svelte';
	import type { Puzzle } from '$lib/types';
	import GameBoard from './GameBoard.svelte';

	let { puzzle, shareLabel, storageId }: { puzzle: Puzzle; shareLabel: string; storageId: string } = $props();

	// Parent routes already key this component by storageId, so game state only
	// needs to be created once per mount instead of inside a reactive effect.
	const game: GameState = (() => createGameState(puzzle, storageId))();
</script>

<div class="grid gap-2">
	<GameBoard {game} {puzzle} {shareLabel} {storageId} />
</div>