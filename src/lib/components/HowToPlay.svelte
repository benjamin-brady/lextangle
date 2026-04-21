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
	class="crayon-btn crayon-btn-cream flex h-10 w-10 items-center justify-center"
	style="padding: 0; transform: rotate(-3deg); font-size: 1rem;"
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
			class="absolute inset-0 cursor-pointer"
			style="background: rgba(42, 42, 46, 0.55);"
			onclick={closeModal}
			aria-label="Close how to play"
			transition:fade={{ duration: 120 }}
		></button>

		<div
			id="how-to-play-dialog"
			role="dialog"
			aria-modal="true"
			aria-labelledby="how-to-play-title"
			class="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto"
			style="background: #fffdf6; filter: drop-shadow(4px 5px 0 rgba(0,0,0,0.2)); transform: rotate(-0.5deg); border-radius: 4px; background-image: repeating-linear-gradient(0deg, transparent 0 28px, rgba(52,152,219,0.1) 28px 29px);"
			transition:fade={{ duration: 160 }}
		>
			<!-- tape strip at top -->
			<div aria-hidden="true" style="position: absolute; top: -10px; left: 40%; width: 80px; height: 20px; background: var(--tape-yellow); transform: rotate(-3deg); box-shadow: 0 2px 4px rgba(0,0,0,0.15); pointer-events: none;"></div>
			<div class="flex items-center justify-between gap-4 px-5 pt-6 pb-2">
				<h2 id="how-to-play-title" class="font-display font-bold leading-none" style="font-size: 2.75rem; color: var(--ink-dark); transform: rotate(-1deg); display: inline-block;">
					how to play ✏️
				</h2>
				<button
					type="button"
					class="crayon-btn crayon-btn-red flex h-8 w-8 items-center justify-center shrink-0"
					style="padding: 0; font-size: 1rem;"
					onclick={closeModal}
					aria-label="Close how to play"
				>
					<X size={16} strokeWidth={2.5} aria-hidden="true" />
				</button>
			</div>

			<div class="px-5 py-4" style="font-size: 1.15rem; color: var(--ink-dark); line-height: 1.5;">
				<p>
					nine words. put them on a 3×3 grid so every touching pair forms a <strong style="color: var(--crayon-red);">link</strong> — a phrase, compound, category, or bit of wordplay. 🧩
				</p>

				<ol class="space-y-3 mt-4">
					<li class="flex gap-3 items-start">
						<span class="flex h-8 w-8 shrink-0 items-center justify-center font-display font-bold" style="background: var(--crayon-yellow); color: var(--ink-dark); border-radius: 50%; filter: drop-shadow(1.5px 2px 0 rgba(0,0,0,0.2)); font-size: 1.3rem; transform: rotate(-6deg);">1</span>
						<p><strong>drag</strong> a word from the tray onto any square.</p>
					</li>
					<li class="flex gap-3 items-start">
						<span class="flex h-8 w-8 shrink-0 items-center justify-center font-display font-bold" style="background: var(--crayon-blue); color: #fff; border-radius: 50%; filter: drop-shadow(1.5px 2px 0 rgba(0,0,0,0.2)); font-size: 1.3rem; transform: rotate(4deg);">2</span>
						<p>every neighbour should form a link. shuffle until it fits.</p>
					</li>
					<li class="flex gap-3 items-start">
						<span class="flex h-8 w-8 shrink-0 items-center justify-center font-display font-bold" style="background: var(--crayon-green); color: #fff; border-radius: 50%; filter: drop-shadow(1.5px 2px 0 rgba(0,0,0,0.2)); font-size: 1.3rem; transform: rotate(-3deg);">3</span>
						<p>hit <strong>check</strong>. green = right, red = wrong. try again!</p>
					</li>
				</ol>

				<div class="mt-6 pt-4" style="border-top: 2px dashed var(--border-strong);">
					<p class="font-display font-bold mb-3" style="font-size: 1.4rem; color: var(--crayon-purple); transform: rotate(-1deg); display: inline-block;">
						try it · two corners are swapped 👇
					</p>

					<div class="flex justify-center">
						<div
							class="relative"
							style="width: {TUTORIAL_GRID_W}px; height: {TUTORIAL_GRID_H + 14}px;"
							role="group"
							aria-label="Interactive tutorial board"
						>
							<svg
								class="absolute inset-0 pointer-events-none"
								width={TUTORIAL_GRID_W}
								height={TUTORIAL_GRID_H}
								style="overflow: visible;"
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
										stroke-width="5"
										stroke-linecap="round"
										filter="url(#wobble)"
									/>
								{/each}
							</svg>

							{#each tutorialGrid as word, i (i)}
								{@const pos = tutorialCellPos(i)}
								{@const tilts = [-2, 1.5, -1, 2, -2.5, 1, -1.5, 2.5, -1]}
								<div
									class="absolute flex items-center justify-center"
									style="left: {pos.x}px; top: {pos.y}px; width: {TUTORIAL_SLOT_SIZE}px; height: {TUTORIAL_SLOT_SIZE}px;"
								>
									<button
										type="button"
										class="polaroid cursor-pointer flex flex-col items-center justify-center"
										style="width: {TUTORIAL_NODE_SIZE}px; height: {TUTORIAL_NODE_SIZE + 14}px; transform: rotate({tilts[i]}deg); outline: 3px solid {tutorialTileBorder(i)}; outline-offset: -3px; background: {tutorialSelectedIndex === i ? 'rgba(231,76,60,0.18)' : 'var(--tile-surface)'};"
										onclick={() => handleTutorialTileClick(i)}
										aria-pressed={tutorialSelectedIndex === i}
										aria-label={tutorialTileLabel(i)}
									>
										<span aria-hidden="true" style="font-size: 1rem; line-height: 1; margin-top: 4px;">{TUTORIAL_EMOJI[word]}</span>
										<span class="font-display" style="font-size: 0.95rem; line-height: 1; margin-top: 4px; color: var(--ink-dark);">{word}</span>
									</button>
								</div>
							{/each}
						</div>
					</div>

					<div class="mt-4 flex items-center justify-center gap-4" style="font-size: 1.05rem;">
						<span class="font-display tabular-nums">words <span style="font-size: 1.4rem; color: var(--crayon-blue);">{tutorialCorrectWords}/9</span></span>
						<span style="color: var(--border-strong);">·</span>
						<span class="font-display tabular-nums">links <span style="font-size: 1.4rem; color: var(--crayon-green);">{tutorialCorrectLinks}/{ADJACENCIES.length}</span></span>
						<button
							type="button"
							class="crayon-btn crayon-btn-cream ml-auto flex h-8 w-8 items-center justify-center"
							style="padding: 0; font-size: 1rem; transform: rotate(-4deg);"
							onclick={resetTutorial}
							aria-label="Reset tutorial example"
							title="Reset"
						>
							<RotateCcw size={14} strokeWidth={2.5} aria-hidden="true" />
						</button>
					</div>

					<p class="mt-3" style="font-size: 1rem; color: var(--text-muted); line-height: 1.45;" aria-live="polite">
						{tutorialMessage()}
					</p>
				</div>

				<div class="mt-6 pt-4" style="border-top: 2px dashed var(--border-strong);">
					<p class="font-display font-bold mb-3" style="font-size: 1.4rem; color: var(--crayon-red); transform: rotate(1deg); display: inline-block;">
						links come in flavours 🎨
					</p>
					<ul class="space-y-2">
						<li class="flex items-baseline gap-2">
							<span class="font-display shrink-0" style="font-size: 1.1rem; color: var(--crayon-blue); width: 100px;">compound</span>
							<span>🌙 moon + 💡 light → <em>moonlight</em></span>
						</li>
						<li class="flex items-baseline gap-2">
							<span class="font-display shrink-0" style="font-size: 1.1rem; color: var(--crayon-green); width: 100px;">phrase</span>
							<span>🧂 salt + 🌶️ pepper → <em>salt and pepper</em></span>
						</li>
						<li class="flex items-baseline gap-2">
							<span class="font-display shrink-0" style="font-size: 1.1rem; color: var(--crayon-purple); width: 100px;">category</span>
							<span>🎹 piano + 🎸 guitar → <em>both instruments</em></span>
						</li>
						<li class="flex items-baseline gap-2">
							<span class="font-display shrink-0" style="font-size: 1.1rem; color: var(--crayon-yellow); width: 100px; text-shadow: 1px 1px 0 rgba(0,0,0,0.15);">rhyme</span>
							<span>🐱 cat + 🎩 hat → <em>sound-alike</em></span>
						</li>
						<li class="flex items-baseline gap-2">
							<span class="font-display shrink-0" style="font-size: 1.1rem; color: var(--crayon-red); width: 100px;">opposite</span>
							<span>🔥 hot + ❄️ cold → <em>antonyms</em></span>
						</li>
					</ul>
				</div>

				<div class="mt-6 pt-4 space-y-2" style="border-top: 2px dashed var(--border-strong); font-size: 1rem; color: var(--text-muted); line-height: 1.5;">
					<p><strong style="color: var(--ink-dark);">words</strong> counts tiles in the correct spot.</p>
					<p><strong style="color: var(--ink-dark);">links</strong> counts valid neighbouring pairs — can run ahead of words.</p>
					<p>when you solve it, every link gets an explanation ✨</p>
				</div>

				<div class="mt-6 pt-4" style="border-top: 2px dashed var(--border-strong);">
					<p class="font-display font-bold mb-2" style="font-size: 1.4rem; color: var(--crayon-blue); transform: rotate(-1deg); display: inline-block;">
						who made it 🖍️
					</p>
					<p style="font-size: 1rem; color: var(--text-muted); line-height: 1.5;">
						lexlink is a solo project by ben brady. come say hi on
						<a class="font-display font-bold" style="color: var(--crayon-red); text-decoration: underline wavy;" href="https://discord.gg/AWfvmFWBcA" target="_blank" rel="noopener noreferrer">discord</a>.
					</p>
					<p class="mt-2" style="font-size: 1rem; color: var(--text-muted); line-height: 1.5;">
						no ads, no tracking beyond basics. support on
						<a class="font-display font-bold" style="color: var(--crayon-green); text-decoration: underline wavy;" href="https://ko-fi.com/benbob" target="_blank" rel="noopener noreferrer">ko-fi</a> if you like it ☕
					</p>
				</div>
			</div>
		</div>
	</div>
{/if}