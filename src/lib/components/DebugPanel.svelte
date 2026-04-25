<script lang="ts">
	import type { Puzzle } from '$lib/types';
	import { Button } from '$lib/components/ui/button';

	let { puzzle, storageId }: { puzzle: Puzzle; storageId: string } = $props();

	let open = $state(false);
	let revealed = $state(false);

	const gen = $derived(puzzle.generation);
</script>

<div class="fixed right-3 bottom-3 z-50 flex flex-col items-end gap-2">
	{#if open}
		<div
			class="bg-background/95 text-foreground border-border max-w-[min(22rem,calc(100vw-1.5rem))] rounded-md border p-3 text-xs shadow-lg backdrop-blur"
		>
			<div class="mb-2 flex items-center justify-between gap-2">
				<span class="font-semibold">Debug</span>
				<button
					type="button"
					class="text-muted-foreground hover:text-foreground"
					onclick={() => (revealed = !revealed)}
				>
					{revealed ? 'Hide answer' : 'Reveal answer'}
				</button>
			</div>

			<div class="mb-2">
				<div class="text-muted-foreground mb-1">Solution</div>
				<div
					class="grid grid-cols-3 gap-1 rounded p-1 transition-all select-none {revealed
						? ''
						: 'bg-foreground/80 text-transparent blur-sm'}"
				>
					{#each puzzle.solution as item, i (i)}
						<div class="bg-muted rounded px-1.5 py-1 text-center font-mono text-[11px]">
							{item.emoji ? `${item.emoji} ` : ''}{item.word}
						</div>
					{/each}
				</div>
			</div>

			{#if gen}
				<div class="grid gap-0.5 font-mono text-[11px] leading-tight break-all">
					<div><span class="text-muted-foreground">author:</span> {gen.author}</div>
					<div><span class="text-muted-foreground">model:</span> {gen.model}</div>
					{#if gen.provider}
						<div><span class="text-muted-foreground">provider:</span> {gen.provider}</div>
					{/if}
					<div><span class="text-muted-foreground">at:</span> {gen.generatedAt}</div>
					{#if gen.sourceCommit}
						<div><span class="text-muted-foreground">commit:</span> {gen.sourceCommit}</div>
					{/if}
				</div>
			{:else}
				<div class="text-muted-foreground italic">No generation metadata.</div>
			{/if}

			<div class="text-muted-foreground mt-2 font-mono text-[10px] break-all">
				id: {storageId}
			</div>
		</div>
	{/if}

	<Button
		type="button"
		variant="secondary"
		size="sm"
		onclick={() => (open = !open)}
		aria-expanded={open}
	>
		{open ? 'Hide debug' : 'Debug'}
	</Button>
</div>
