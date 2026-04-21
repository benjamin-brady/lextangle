<script lang="ts">
	import { Info, RotateCcw, X } from 'lucide-svelte';
	import { fade } from 'svelte/transition';
	import { ADJACENCIES } from '../types';

	let isOpen = $state(false);

	const TUTORIAL_SOLUTION = ['MOON', 'LIGHT', 'HOUSE', 'ROCK', 'STAR', 'DOG', 'PET', 'FISH', 'CAT'] as const;
	const TUTORIAL_START = ['CAT', 'LIGHT', 'HOUSE', 'ROCK', 'STAR', 'DOG', 'PET', 'FISH', 'MOON'] as const;
	const TUTORIAL_EMOJI: Record<string, string> = {
		MOON: '🌙',
		LIGHT: '💡',
		HOUSE: '🏠',
		ROCK: '🪨',
		STAR: '⭐',
		DOG: '🐶',
		PET: '🐾',
		FISH: '🐟',
		CAT: '🐱'
	};
	const TUTORIAL_SLOT_SIZE = 72;
	const TUTORIAL_NODE_SIZE = 60;
	const TUTORIAL_GAP = 10;
	const TUTORIAL_GRID_W = TUTORIAL_SLOT_SIZE * 3 + TUTORIAL_GAP * 2;
	const TUTORIAL_GRID_H = TUTORIAL_SLOT_SIZE * 3 + TUTORIAL_GAP * 2;
	const tutorialValidPairs = new Set(
		ADJACENCIES.map(([from, to]) => edgeKey(TUTORIAL_SOLUTION[from], TUTORIAL_SOLUTION[to]))
	);

	let tutorialGrid = $state<string[]>([...TUTORIAL_START]);
	let tutorialSelectedIndex = $state<number | null>(null);

	let tutorialCorrectWords = $derived(
		tutorialGrid.reduce((count, word, index) => count + Number(word === TUTORIAL_SOLUTION[index]), 0)
	);
	let tutorialCorrectLinks = $derived(
		ADJACENCIES.reduce(
			(count, [from, to]) => count + Number(tutorialValidPairs.has(edgeKey(tutorialGrid[from], tutorialGrid[to]))),
			0
		)
	);
	let tutorialSolved = $derived(tutorialCorrectWords === TUTORIAL_SOLUTION.length);

	function openModal() {
		resetTutorial();
		isOpen = true;
	}

	function closeModal() {
		isOpen = false;
	}

	function resetTutorial() {
		tutorialGrid = [...TUTORIAL_START];
		tutorialSelectedIndex = null;
	}

	function handleTutorialTileClick(index: number) {
		if (tutorialSelectedIndex === index) {
			tutorialSelectedIndex = null;
			return;
		}

		if (tutorialSelectedIndex === null) {
			tutorialSelectedIndex = index;
			return;
		}

		const nextGrid = [...tutorialGrid];
		[nextGrid[tutorialSelectedIndex], nextGrid[index]] = [nextGrid[index], nextGrid[tutorialSelectedIndex]];
		tutorialGrid = nextGrid;
		tutorialSelectedIndex = null;
	}

	function tutorialMessage() {
		if (tutorialSelectedIndex !== null) {
			return `Selected ${tutorialGrid[tutorialSelectedIndex]}. Tap another tile to swap it.`;
		}

		if (tutorialSolved) {
			return 'Now every word is home, so all 12 neighboring pairs count as links too.';
		}

		if (tutorialCorrectWords === 7 && tutorialCorrectLinks === 8) {
			return 'Only CAT and MOON are misplaced. Because they are corners, they break just four links, which is why the counts do not fall together.';
		}

		return 'Words count exact homes. Links count green neighboring pairs, even before the whole board is solved.';
	}

	function tutorialCellPos(index: number): { x: number; y: number } {
		const row = Math.floor(index / 3);
		const col = index % 3;
		return {
			x: col * (TUTORIAL_SLOT_SIZE + TUTORIAL_GAP),
			y: row * (TUTORIAL_SLOT_SIZE + TUTORIAL_GAP)
		};
	}

	function tutorialTileBorder(index: number): string {
		if (tutorialSelectedIndex === index) {
			return 'var(--accent)';
		}

		return tutorialGrid[index] === TUTORIAL_SOLUTION[index] ? 'var(--green)' : 'var(--red)';
	}

	function tutorialTileLabel(index: number): string {
		const placement = tutorialGrid[index] === TUTORIAL_SOLUTION[index] ? 'correct spot' : 'wrong spot';
		const selected = tutorialSelectedIndex === index ? ', selected' : '';
		return `${tutorialGrid[index]}, ${placement}${selected}`;
	}

	function tutorialEdgeColor(from: number, to: number): string {
		return tutorialValidPairs.has(edgeKey(tutorialGrid[from], tutorialGrid[to]))
			? 'var(--green)'
			: 'var(--red)';
	}

	function handleDocumentKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && isOpen) {
			closeModal();
		}
	}

	function edgeKey(firstWord: string, secondWord: string): string {
		return [firstWord, secondWord].sort().join('::');
	}

	$effect(() => {
		if (!isOpen) {
			return;
		}

		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		return () => {
			document.body.style.overflow = originalOverflow;
		};
	});
</script>

<svelte:document onkeydown={handleDocumentKeydown} />

<button
	type="button"
	class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-none border-2 border-(--ink) bg-(--surface) text-(--ink) shadow-[2px_2px_0_0_var(--ink)] transition-all hover:bg-(--surface-light) active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_var(--ink)]"
	onclick={openModal}
	aria-controls="how-to-play-dialog"
	aria-expanded={isOpen}
	aria-haspopup="dialog"
	aria-label="How to play"
	title="How to play"
>
	<Info size={18} strokeWidth={2.25} aria-hidden="true" />
</button>

{#if isOpen}
	<div class="fixed inset-0 z-50 grid place-items-center p-4 sm:p-6">
		<button
			type="button"
			class="absolute inset-0 cursor-pointer bg-[rgba(26,26,46,0.55)]"
			onclick={closeModal}
			aria-label="Close how to play"
			transition:fade={{ duration: 120 }}
		></button>

		<div
			id="how-to-play-dialog"
			role="dialog"
			aria-modal="true"
			aria-labelledby="how-to-play-title"
			class="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto border-2 border-(--ink) bg-(--bg-raised) shadow-[6px_6px_0_0_var(--ink)]"
			transition:fade={{ duration: 160 }}
		>
			<div class="flex items-center justify-between gap-4 border-b-2 border-(--ink) px-5 py-3">
				<h2 id="how-to-play-title" class="font-display text-xl font-black italic tracking-tight">
					How to play
				</h2>
				<button
					type="button"
					class="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-none border-2 border-(--ink) bg-(--surface) transition-colors hover:bg-(--surface-light)"
					onclick={closeModal}
					aria-label="Close how to play"
				>
					<X size={16} strokeWidth={2.5} aria-hidden="true" />
				</button>
			</div>

			<div class="px-5 py-5 space-y-5 text-sm leading-relaxed">
				<p class="text-(--text)">
					Nine words. Arrange them on a 3×3 grid so every horizontal and vertical neighbour forms a <strong>link</strong> — a phrase, compound, category, or wordplay.
				</p>

				<ol class="space-y-3">
					<li class="flex gap-3">
						<span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-(--ink) bg-(--accent) font-display text-xs font-black text-white">1</span>
						<p><strong>Drag</strong> a word from the tray into any grid square.</p>
					</li>
					<li class="flex gap-3">
						<span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-(--ink) bg-(--accent) font-display text-xs font-black text-white">2</span>
						<p>Every touching pair should form a link. Move words around until it all fits.</p>
					</li>
					<li class="flex gap-3">
						<span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-(--ink) bg-(--accent) font-display text-xs font-black text-white">3</span>
						<p>Hit <strong>Check</strong>. Green = right. Red = wrong. Keep going.</p>
					</li>
				</ol>

				<div class="border-t-2 border-(--ink) pt-4">
					<p class="font-display text-xs font-bold uppercase tracking-[0.2em] text-(--text-muted) mb-3">
						Try it · two corners are swapped
					</p>

					<div class="flex justify-center">
						<div
							class="relative"
							style="width: {TUTORIAL_GRID_W}px; height: {TUTORIAL_GRID_H}px;"
							role="group"
							aria-label="Interactive tutorial board"
						>
							<svg
								class="absolute inset-0 pointer-events-none"
								width={TUTORIAL_GRID_W}
								height={TUTORIAL_GRID_H}
							>
								{#each ADJACENCIES as [from, to] (`${from}-${to}`)}
									{@const fromPos = tutorialCellPos(from)}
									{@const toPos = tutorialCellPos(to)}
									<line
										x1={fromPos.x + TUTORIAL_SLOT_SIZE / 2}
										y1={fromPos.y + TUTORIAL_SLOT_SIZE / 2}
										x2={toPos.x + TUTORIAL_SLOT_SIZE / 2}
										y2={toPos.y + TUTORIAL_SLOT_SIZE / 2}
										stroke={tutorialEdgeColor(from, to)}
										stroke-width="3"
										stroke-linecap="round"
									/>
								{/each}
							</svg>

							{#each tutorialGrid as word, i (i)}
								{@const pos = tutorialCellPos(i)}
								<div
									class="absolute flex items-center justify-center"
									style="left: {pos.x}px; top: {pos.y}px; width: {TUTORIAL_SLOT_SIZE}px; height: {TUTORIAL_SLOT_SIZE}px;"
								>
									<button
										type="button"
										class="flex cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border-2 bg-(--surface) text-[10px] font-bold tracking-wide text-(--text) shadow-[2px_2px_0_0_var(--ink)] transition-all hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_var(--ink)]"
										style="width: {TUTORIAL_NODE_SIZE}px; height: {TUTORIAL_NODE_SIZE}px; border-color: {tutorialTileBorder(i)}; {tutorialSelectedIndex === i ? 'outline: 3px solid var(--accent); outline-offset: 2px;' : ''}"
										onclick={() => handleTutorialTileClick(i)}
										aria-pressed={tutorialSelectedIndex === i}
										aria-label={tutorialTileLabel(i)}
									>
										<span aria-hidden="true" class="text-base leading-none">{TUTORIAL_EMOJI[word]}</span>
										<span>{word}</span>
									</button>
								</div>
							{/each}
						</div>
					</div>

					<div class="mt-4 flex items-center justify-center gap-4 text-xs">
						<span class="font-bold tabular-nums">Words <span class="ml-1 font-display text-base">{tutorialCorrectWords}/9</span></span>
						<span class="text-(--border-strong)">·</span>
						<span class="font-bold tabular-nums">Links <span class="ml-1 font-display text-base">{tutorialCorrectLinks}/{ADJACENCIES.length}</span></span>
						<button
							type="button"
							class="ml-auto flex h-7 w-7 cursor-pointer items-center justify-center rounded-none border-2 border-(--ink) bg-(--surface) transition-colors hover:bg-(--surface-light)"
							onclick={resetTutorial}
							aria-label="Reset tutorial example"
							title="Reset"
						>
							<RotateCcw size={12} strokeWidth={2.5} aria-hidden="true" />
						</button>
					</div>

					<p class="mt-3 text-xs leading-relaxed text-(--text-muted)" aria-live="polite">
						{tutorialMessage()}
					</p>
				</div>

				<div class="border-t-2 border-(--ink) pt-4">
					<p class="font-display text-xs font-bold uppercase tracking-[0.2em] text-(--text-muted) mb-3">
						Links come in many flavours
					</p>
					<ul class="space-y-2 text-xs leading-relaxed">
						<li class="flex items-baseline gap-2">
							<span class="font-bold uppercase tracking-wider text-(--accent-ink) text-[10px] w-20 shrink-0">Compound</span>
							<span>🌙 Moon + 💡 Light → <em>moonlight</em></span>
						</li>
						<li class="flex items-baseline gap-2">
							<span class="font-bold uppercase tracking-wider text-(--accent-ink) text-[10px] w-20 shrink-0">Phrase</span>
							<span>🧂 Salt + 🌶️ Pepper → <em>salt and pepper</em></span>
						</li>
						<li class="flex items-baseline gap-2">
							<span class="font-bold uppercase tracking-wider text-(--accent-ink) text-[10px] w-20 shrink-0">Category</span>
							<span>🎹 Piano + 🎸 Guitar → <em>both instruments</em></span>
						</li>
						<li class="flex items-baseline gap-2">
							<span class="font-bold uppercase tracking-wider text-(--accent-ink) text-[10px] w-20 shrink-0">Rhyme</span>
							<span>🐱 Cat + 🎩 Hat → <em>sound-alike</em></span>
						</li>
						<li class="flex items-baseline gap-2">
							<span class="font-bold uppercase tracking-wider text-(--accent-ink) text-[10px] w-20 shrink-0">Opposite</span>
							<span>🔥 Hot + ❄️ Cold → <em>antonyms</em></span>
						</li>
					</ul>
				</div>

				<div class="border-t-2 border-(--ink) pt-4 space-y-2 text-xs text-(--text-muted) leading-relaxed">
					<p><strong class="text-(--text)">Words</strong> counts tiles in their final correct spot.</p>
					<p><strong class="text-(--text)">Links</strong> counts valid neighbouring pairs — it can be ahead of Words while you're still arranging.</p>
					<p>When you solve it, every link gets an explanation so you can see the chain.</p>
				</div>

				<div class="border-t-2 border-(--ink) pt-4 space-y-3 text-xs leading-relaxed text-(--text-muted)">
					<p class="font-display text-xs font-bold uppercase tracking-[0.2em] text-(--text-muted)">
						Who made it
					</p>
					<p>
						LexLink is a solo project by Ben Brady. If you get stuck, spot a dodgy clue, or just want to chat about puzzles, come say hi on
						<a
							class="font-bold text-(--accent) underline underline-offset-2 hover:text-(--accent-ink)"
							href="https://discord.gg/AWfvmFWBcA"
							target="_blank"
							rel="noopener noreferrer">Discord</a
						>.
					</p>
					<p>
						LexLink has no ads and no tracking beyond basic analytics. If you'd like to keep it that way, you can support development on
						<a
							class="font-bold text-(--accent) underline underline-offset-2 hover:text-(--accent-ink)"
							href="https://ko-fi.com/benbob"
							target="_blank"
							rel="noopener noreferrer">Ko-fi</a
						>.
					</p>
				</div>
			</div>
		</div>
	</div>
{/if}