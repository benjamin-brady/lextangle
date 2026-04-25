<script lang="ts">
	import { loadSolvedGameIds } from '$lib/game-storage';
	import {
		getHardPracticePuzzle,
		getHardPracticePuzzleCount,
		getPracticePuzzle,
		getPracticePuzzleCount,
	} from '$lib/puzzles';
	import type { Puzzle } from '$lib/types';
	import { onMount } from 'svelte';

	type PracticeListItem = { id: number; puzzle: Puzzle };

	const practicePuzzles = Array.from({ length: getPracticePuzzleCount() }, (_, index) => {
		const id = index + 1;
		return { id, puzzle: getPracticePuzzle(id) };
	}).filter((item): item is PracticeListItem => item.puzzle !== undefined);
	const hardPuzzles = Array.from({ length: getHardPracticePuzzleCount() }, (_, index) => {
		const id = index + 1;
		return { id, puzzle: getHardPracticePuzzle(id) };
	}).filter((item): item is PracticeListItem => item.puzzle !== undefined);

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
			...practicePuzzles.map(({ id }) => practiceStorageId(id)),
			...hardPuzzles.map(({ id }) => hardPracticeStorageId(id))
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
			<p class="text-[11px] font-bold uppercase tracking-[0.18em] text-(--text-muted)">{practicePuzzles.length} puzzles</p>
		</div>
		<div class="mt-3 grid gap-2 sm:grid-cols-2">
			{#each practicePuzzles as { id, puzzle } (id)}
				{@const storageId = practiceStorageId(id)}
				<a
					href={`/practice/${id}`}
					class="grid gap-0.5 rounded-lg border px-3 py-2 text-sm transition-colors hover:border-(--accent)"
					class:border-(--border)={!isSolved(storageId)}
					class:bg-(--surface)={!isSolved(storageId)}
					class:border-(--green)={isSolved(storageId)}
					class:bg-[color-mix(in_oklab,var(--green)_18%,transparent)]={isSolved(storageId)}
					aria-label={isSolved(storageId) ? `Puzzle ${id}, ${puzzle.title}, completed` : `Puzzle ${id}, ${puzzle.title}`}
				>
					<span class="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-(--text-muted)">
						{#if isSolved(storageId)}
							<span aria-hidden="true" class="text-(--green)">✓</span>
						{/if}
						#{id}
					</span>
					<span class="font-black leading-tight text-(--text)">{puzzle.title}</span>
				</a>
			{/each}
		</div>
	</section>

	<section>
		<div class="flex items-baseline justify-between border-b border-(--border) pb-2">
			<h2 class="text-lg font-black tracking-tight">Hard</h2>
			<p class="text-[11px] font-bold uppercase tracking-[0.18em] text-(--text-muted)">{hardPuzzles.length} puzzles</p>
		</div>
		<div class="mt-3 grid gap-2 sm:grid-cols-2">
			{#each hardPuzzles as { id, puzzle } (id)}
				{@const storageId = hardPracticeStorageId(id)}
				<a
					href={`/practice/hard/${id}`}
					class="grid gap-0.5 rounded-lg border px-3 py-2 text-sm transition-colors hover:border-(--accent)"
					class:border-(--border)={!isSolved(storageId)}
					class:bg-(--surface)={!isSolved(storageId)}
					class:border-(--green)={isSolved(storageId)}
					class:bg-[color-mix(in_oklab,var(--green)_18%,transparent)]={isSolved(storageId)}
					aria-label={isSolved(storageId) ? `Hard puzzle ${id}, ${puzzle.title}, completed` : `Hard puzzle ${id}, ${puzzle.title}`}
				>
					<span class="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-(--text-muted)">
						{#if isSolved(storageId)}
							<span aria-hidden="true" class="text-(--green)">✓</span>
						{/if}
						#{id}
					</span>
					<span class="font-black leading-tight text-(--text)">{puzzle.title}</span>
				</a>
			{/each}
		</div>
	</section>
</div>