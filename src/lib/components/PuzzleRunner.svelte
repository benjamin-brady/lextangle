<script lang="ts">
	import { createGameState, type GameState } from '$lib/game.svelte';
	import type { Puzzle } from '$lib/types';
	import GameBoard from './GameBoard.svelte';
	import { untrack } from 'svelte';

	let { puzzle, shareLabel, storageId }: { puzzle: Puzzle; shareLabel: string; storageId: string } = $props();

	let game = $state.raw<GameState | null>(null);

	$effect(() => {
		// Read props to track them as dependencies (re-create game when puzzle changes).
		const p = puzzle;
		const s = storageId;
		// Untrack createGameState so internal PersistedState reactive reads don't
		// cause this effect to re-run on every game-state mutation.
		game = untrack(() => createGameState(p, s));
	});
</script>

{#if game}
	<div class="grid gap-2">
		<GameBoard {game} {puzzle} {shareLabel} {storageId} />
	</div>
{/if}