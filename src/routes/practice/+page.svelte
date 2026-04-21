<script lang="ts">
	import { loadSolvedGameIds } from '$lib/game-storage';
	import {
		getHardPracticePuzzleCount,
		getPracticePuzzleCount,
	} from '$lib/puzzles';
	import { onMount } from 'svelte';

	const practiceIds = Array.from({ length: getPracticePuzzleCount() }, (_, index) => index + 1);
	const hardIds = Array.from({ length: getHardPracticePuzzleCount() }, (_, index) => index + 1);

	let solvedStorageIds = $state<Set<string>>(new Set());

	function practiceStorageId(id: number): string {
		return `practice-${id}`;
	}

	function hardPracticeStorageId(id: number): string {
		return `practice-hard-${id}`;
	}

	function isSolved(storageId: string): boolean {
		return solvedStorageIds.has(storageId);
	}

	onMount(async () => {
		const storageIds = [
			...practiceIds.map(practiceStorageId),
			...hardIds.map(hardPracticeStorageId)
		];

		try {
			solvedStorageIds = await loadSolvedGameIds(storageIds);
		} catch {
			solvedStorageIds = new Set();
		}
	});
</script>

<div class="flex flex-col gap-6">
	<section>
		<div class="flex items-baseline justify-between border-b border-(--border) pb-2">
			<h2 class="text-lg font-black tracking-tight">Standard</h2>
			<p class="text-[11px] font-bold uppercase tracking-[0.18em] text-(--text-muted)">{practiceIds.length} puzzles</p>
		</div>
		<div class="mt-3 flex flex-wrap gap-2">
			{#each practiceIds as id (id)}
				{@const storageId = practiceStorageId(id)}
				<a
					href={`/practice/${id}`}
					class="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-bold transition-colors hover:border-(--accent)"
					class:border-(--border)={!isSolved(storageId)}
					class:bg-(--surface)={!isSolved(storageId)}
					class:border-(--green)={isSolved(storageId)}
					class:bg-[color-mix(in_oklab,var(--green)_18%,transparent)]={isSolved(storageId)}
					aria-label={isSolved(storageId) ? `Puzzle ${id}, completed` : `Puzzle ${id}`}
				>
					{#if isSolved(storageId)}
						<span aria-hidden="true" class="text-(--green)">✓</span>
					{/if}
					#{id}
				</a>
			{/each}
		</div>
	</section>

	<section>
		<div class="flex items-baseline justify-between border-b border-(--border) pb-2">
			<h2 class="text-lg font-black tracking-tight">Hard</h2>
			<p class="text-[11px] font-bold uppercase tracking-[0.18em] text-(--text-muted)">{hardIds.length} puzzles</p>
		</div>
		<div class="mt-3 flex flex-wrap gap-2">
			{#each hardIds as id (id)}
				{@const storageId = hardPracticeStorageId(id)}
				<a
					href={`/practice/hard/${id}`}
					class="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-bold transition-colors hover:border-(--accent)"
					class:border-(--border)={!isSolved(storageId)}
					class:bg-(--surface)={!isSolved(storageId)}
					class:border-(--green)={isSolved(storageId)}
					class:bg-[color-mix(in_oklab,var(--green)_18%,transparent)]={isSolved(storageId)}
					aria-label={isSolved(storageId) ? `Hard puzzle ${id}, completed` : `Hard puzzle ${id}`}
				>
					{#if isSolved(storageId)}
						<span aria-hidden="true" class="text-(--green)">✓</span>
					{/if}
					#{id}
				</a>
			{/each}
		</div>
	</section>
</div>