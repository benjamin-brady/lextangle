<script lang="ts">
	import { loadSolvedGameTimestamps } from '$lib/game-storage';
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

	let solvedAt = $state<Map<string, number>>(new Map());

	const dateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

	function practiceStorageId(id: number): string {
		return `practice-${id}`;
	}

	function hardPracticeStorageId(id: number): string {
		return `practice-hard-${id}`;
	}

	function isSolved(storageId: string): boolean {
		return solvedAt.has(storageId);
	}

	function solvedDate(storageId: string): string | null {
		const ts = solvedAt.get(storageId);
		return ts ? dateFormatter.format(new Date(ts)) : null;
	}

	onMount(async () => {
		const storageIds = [
			...practicePuzzles.map(({ id }) => practiceStorageId(id)),
			...hardPuzzles.map(({ id }) => hardPracticeStorageId(id))
		];

		try {
			solvedAt = await loadSolvedGameTimestamps(storageIds);
		} catch {
			solvedAt = new Map();
		}
	});
</script>

<div class="flex flex-col gap-6">
	<section>
		<div class="flex items-baseline justify-between border-b border-(--border) pb-2">
			<h2 class="text-lg font-bold">Standard</h2>
			<p class="text-[11px] font-bold uppercase tracking-[0.18em] text-(--text-muted)">
				{practicePuzzles.filter(({ id }) => isSolved(practiceStorageId(id))).length}/{practicePuzzles.length}
			</p>
		</div>
		<div class="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
			{#each practicePuzzles as { id, puzzle } (id)}
				{@const storageId = practiceStorageId(id)}
				{@const solved = isSolved(storageId)}
				{@const solvedOn = solvedDate(storageId)}
				<a
					href={`/practice/${id}`}
					class="puzzle-tile group relative flex aspect-square flex-col rounded-lg border bg-(--surface) p-1.5 transition-all hover:border-(--accent) hover:-translate-y-0.5"
					class:solved
					aria-label={solved ? `Puzzle ${id}, ${puzzle.title}, completed${solvedOn ? ` on ${solvedOn}` : ''}` : `Puzzle ${id}, ${puzzle.title}`}
				>
					<span class="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-(--text-muted)">
						<span>#{id}</span>
						{#if solved}
							<span aria-hidden="true" class="text-(--green) text-[12px] leading-none">✓</span>
						{/if}
					</span>
					<div class="grid flex-1 grid-cols-3 grid-rows-3 place-items-center gap-px">
						{#each puzzle.solution as word, i (i)}
							<span class="text-[clamp(0.7rem,3vw,1rem)] leading-none" aria-hidden="true">{word.emoji ?? ''}</span>
						{/each}
					</div>
					{#if solvedOn}
						<span class="mt-0.5 text-center text-[9px] font-bold uppercase tracking-[0.12em] text-(--green)">{solvedOn}</span>
					{/if}
				</a>
			{/each}
		</div>
	</section>

	<section>
		<div class="flex items-baseline justify-between border-b border-(--border) pb-2">
			<h2 class="text-lg font-bold">Hard</h2>
			<p class="text-[11px] font-bold uppercase tracking-[0.18em] text-(--text-muted)">
				{hardPuzzles.filter(({ id }) => isSolved(hardPracticeStorageId(id))).length}/{hardPuzzles.length}
			</p>
		</div>
		<div class="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
			{#each hardPuzzles as { id, puzzle } (id)}
				{@const storageId = hardPracticeStorageId(id)}
				{@const solved = isSolved(storageId)}
				{@const solvedOn = solvedDate(storageId)}
				<a
					href={`/practice/hard/${id}`}
					class="puzzle-tile group relative flex aspect-square flex-col rounded-lg border bg-(--surface) p-1.5 transition-all hover:border-(--accent) hover:-translate-y-0.5"
					class:solved
					aria-label={solved ? `Hard puzzle ${id}, ${puzzle.title}, completed${solvedOn ? ` on ${solvedOn}` : ''}` : `Hard puzzle ${id}, ${puzzle.title}`}
				>
					<span class="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-(--text-muted)">
						<span>#{id}</span>
						{#if solved}
							<span aria-hidden="true" class="text-(--green) text-[12px] leading-none">✓</span>
						{/if}
					</span>
					<div class="grid flex-1 grid-cols-3 grid-rows-3 place-items-center gap-px">
						{#each puzzle.solution as word, i (i)}
							<span class="text-[clamp(0.7rem,3vw,1rem)] leading-none" aria-hidden="true">{word.emoji ?? ''}</span>
						{/each}
					</div>
					{#if solvedOn}
						<span class="mt-0.5 text-center text-[9px] font-bold uppercase tracking-[0.12em] text-(--green)">{solvedOn}</span>
					{/if}
				</a>
			{/each}
		</div>
	</section>
</div>

<style>
	.puzzle-tile {
		border-color: var(--border);
	}
	.puzzle-tile.solved {
		border-color: var(--green);
		background: color-mix(in oklab, var(--green) 14%, var(--surface));
	}
</style>