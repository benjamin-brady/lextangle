<script lang="ts">
	import { getDailyPuzzleByNumber } from '$lib/daily-puzzles';
	import PuzzleRunner from '$lib/components/PuzzleRunner.svelte';
	import { readSolvedSummary } from '$lib/game.svelte';
	import { createDailyStreakSummary, dailyStorageId, type DailyStreakSummary } from '$lib/streaks';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let streakSummary = $state<DailyStreakSummary>({
		currentStreak: 0,
		bestStreak: 0,
		solvedToday: false,
	});

	function readSolvedDailyPuzzleNumbers(): Set<number> {
		const solved = new Set<number>();

		for (let puzzleNumber = 1; puzzleNumber <= data.puzzleNumber; puzzleNumber += 1) {
			const puzzle = getDailyPuzzleByNumber(puzzleNumber);
			const summary = readSolvedSummary(puzzle, dailyStorageId(puzzleNumber));
			if (summary.solved) solved.add(puzzleNumber);
		}

		return solved;
	}

	function refreshStreakSummary() {
		streakSummary = createDailyStreakSummary({
			currentPuzzleNumber: data.puzzleNumber,
			solvedPuzzleNumbers: readSolvedDailyPuzzleNumbers(),
		});
	}

	onMount(refreshStreakSummary);
</script>

<div class="grid gap-4">
	{#key data.storageId}
		<PuzzleRunner
			puzzle={data.puzzle}
			storageId={data.storageId}
			shareLabel={data.shareLabel}
			{streakSummary}
			onProgressChange={refreshStreakSummary}
		/>
	{/key}
</div>
