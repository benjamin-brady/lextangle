<script lang="ts">
  import { onDestroy, tick } from 'svelte';
  import { validateLink } from '$lib/game';
  import type { LinkVerdict } from '$lib/types';
  import { collapse, type TileSpec } from '$lib/physics';

  let { startA, startB, target }: { startA: string; startB: string; target: string } = $props();

  const MAX_NEW = 10;

  let chain = $state<string[]>([startA, startB]);
  // verdictPairs[i] = [linkToPrev2, linkToPrev1] for chain[i + 2]
  let verdictPairs = $state<[LinkVerdict, LinkVerdict][]>([]);
  let inputValue = $state('');
  let validating = $state(false);
  let error = $state<string | null>(null);
  let phase = $state<'play' | 'snapped' | 'won'>('play');

  let boardEl: HTMLDivElement | null = $state(null);
  let boardWidth = $state(360);
  const H = 680;
  let tileEls: Record<string, HTMLDivElement | null> = $state({});
  let disposeSim: (() => void) | null = null;

  $effect(() => {
    if (!boardEl) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) boardWidth = e.contentRect.width;
    });
    ro.observe(boardEl);
    return () => ro.disconnect();
  });

  const prev1 = $derived(chain[chain.length - 1]);
  const prev2 = $derived(chain[chain.length - 2]);
  const stepsUsed = $derived(chain.length - 2);
  const stepsLeft = $derived(MAX_NEW - stepsUsed);

  // Layout
  const CLIFF_H = 44;
  const ANCHOR_Y = CLIFF_H;
  const THREAD_LEN = 56;
  const LEDGE_H = 44;
  const TOP_PAD = CLIFF_H + THREAD_LEN;

  // Narrower tiles so left+right columns sit side by side
  const tileW = $derived(Math.min(140, Math.max(84, Math.floor(boardWidth * 0.4))));
  const tileH = $derived(Math.max(20, Math.round(36 - chain.length * 1.1)));
  const rungGap = $derived(Math.max(10, 26 - Math.round(chain.length * 0.9)));
  const tileStep = $derived(tileH + rungGap);

  const centerX = $derived(boardWidth / 2);
  const colGap = 8; // small gap between the two columns
  const leftX = $derived(centerX - tileW / 2 - colGap / 2); // center of left column
  const rightX = $derived(centerX + tileW / 2 + colGap / 2); // center of right column

  // Ceiling anchor pegs — one above each column
  const anchorLX = $derived(leftX);
  const anchorRX = $derived(rightX);

  // i even → left column, i odd → right column
  function colX(i: number): number {
    return i % 2 === 0 ? leftX : rightX;
  }

  function tileCenter(i: number): { x: number; y: number } {
    return { x: colX(i), y: TOP_PAD + tileH / 2 + i * tileStep };
  }

  // Rope endpoints — near corner (same-side rope) and far corner (crossing rope)
  function nearTop(i: number): { x: number; y: number } {
    const c = tileCenter(i);
    const nearX = i % 2 === 0 ? c.x - tileW / 2 + 10 : c.x + tileW / 2 - 10;
    return { x: nearX, y: c.y - tileH / 2 };
  }
  function farTop(i: number): { x: number; y: number } {
    const c = tileCenter(i);
    const farX = i % 2 === 0 ? c.x + tileW / 2 - 10 : c.x - tileW / 2 + 10;
    return { x: farX, y: c.y - tileH / 2 };
  }
  function nearBottom(i: number): { x: number; y: number } {
    const c = tileCenter(i);
    const nearX = i % 2 === 0 ? c.x - tileW / 2 + 10 : c.x + tileW / 2 - 10;
    return { x: nearX, y: c.y + tileH / 2 };
  }
  function farBottom(i: number): { x: number; y: number } {
    const c = tileCenter(i);
    const farX = i % 2 === 0 ? c.x + tileW / 2 - 10 : c.x - tileW / 2 + 10;
    return { x: farX, y: c.y + tileH / 2 };
  }

  // Ceiling anchor on tile i's *near* side (same column as tile)
  function ceilingNear(i: number): { x: number; y: number } {
    return { x: i % 2 === 0 ? anchorLX : anchorRX, y: ANCHOR_Y + 4 };
  }
  // Ceiling anchor on tile i's *far* side (opposite column)
  function ceilingFar(i: number): { x: number; y: number } {
    return { x: i % 2 === 0 ? anchorRX : anchorLX, y: ANCHOR_Y + 4 };
  }

  const threadStrain = $derived(Math.min(1, stepsUsed / MAX_NEW));

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addWord();
    }
  }

  async function addWord() {
    const word = inputValue.trim();
    if (!word || validating || phase !== 'play') return;
    if (/\s/.test(word)) { error = 'One word only'; return; }
    if (chain.some((w) => w.toLowerCase() === word.toLowerCase())) {
      error = `"${word}" already placed`;
      return;
    }
    if (stepsLeft <= 0) return;

    validating = true;
    error = null;
    try {
      const [v2, v1] = await Promise.all([validateLink(prev2, word), validateLink(prev1, word)]);
      if (v1.valid && v2.valid) {
        chain = [...chain, word];
        verdictPairs = [...verdictPairs, [v2, v1]];
        inputValue = '';
        if (word.toLowerCase() === target.toLowerCase()) {
          phase = 'won';
          return;
        }
        if (stepsUsed >= MAX_NEW) await snap();
      } else if (!v1.valid && !v2.valid) {
        error = `No link to either.\n${prev2}→${word}: ${v2.reason}\n${prev1}→${word}: ${v1.reason}`;
      } else if (!v1.valid) {
        error = `Links to ${prev2} but not ${prev1}: ${v1.reason}`;
      } else {
        error = `Links to ${prev1} but not ${prev2}: ${v2.reason}`;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Validation failed';
    } finally {
      validating = false;
    }
  }

  async function tryFinish() {
    if (validating || phase !== 'play') return;
    validating = true;
    error = null;
    try {
      const [v2, v1] = await Promise.all([validateLink(prev2, target), validateLink(prev1, target)]);
      if (v1.valid && v2.valid) {
        chain = [...chain, target];
        verdictPairs = [...verdictPairs, [v2, v1]];
        phase = 'won';
      } else if (!v1.valid && !v2.valid) {
        error = `No link to either.\n${prev2}→${target}: ${v2.reason}\n${prev1}→${target}: ${v1.reason}`;
      } else if (!v1.valid) {
        error = `Links to ${prev2} but not ${prev1}: ${v1.reason}`;
      } else {
        error = `Links to ${prev1} but not ${prev2}: ${v2.reason}`;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Validation failed';
    } finally {
      validating = false;
    }
  }

  function undo() {
    if (chain.length <= 2 || phase !== 'play') return;
    chain = chain.slice(0, -1);
    verdictPairs = verdictPairs.slice(0, -1);
    error = null;
  }

  function reset() {
    if (disposeSim) disposeSim();
    disposeSim = null;
    chain = [startA, startB];
    verdictPairs = [];
    inputValue = '';
    error = null;
    phase = 'play';
    tileEls = {};
  }

  const DEBUG_WORDS = ['ALPHA', 'BETA', 'GAMMA', 'DELTA', 'EPSILON', 'ZETA', 'ETA', 'THETA', 'IOTA', 'KAPPA', 'LAMBDA', 'MU'];
  async function addFake() {
    if (phase !== 'play' || validating || stepsLeft <= 0) return;
    const used = new Set(chain.map((w) => w.toLowerCase()));
    const pick = DEBUG_WORDS.find((w) => !used.has(w.toLowerCase())) ?? `DEBUG${chain.length}`;
    const stub = (a: string, b: string): LinkVerdict => ({
      a, b, valid: true, type: 'compound', reason: 'debug: auto-inserted'
    });
    chain = [...chain, pick];
    verdictPairs = [...verdictPairs, [stub(prev2, pick), stub(prev1, pick)]];
    error = null;
    if (stepsUsed >= MAX_NEW) await snap();
  }

  async function snap() {
    phase = 'snapped';
    await tick();
    if (!boardEl) return;
    const specs: TileSpec[] = [];
    const w = tileW;
    const h = tileH;
    for (let i = 0; i < chain.length; i++) {
      const word = chain[i];
      const el = tileEls[word];
      if (!el) continue;
      const c = tileCenter(i);
      // Hang unravels — each row swings opposite to neighbours
      const swing = i % 2 === 0 ? -1 : 1;
      specs.push({
        el,
        x: c.x,
        y: c.y,
        w,
        h,
        vx: swing * (1.2 + i * 0.25),
        vy: -0.4,
        angularVelocity: swing * (0.06 + i * 0.012)
      });
    }
    disposeSim = collapse(boardEl, specs);
  }

  onDestroy(() => { if (disposeSim) disposeSim(); });

  function typeEmoji(t: string | null | undefined): string {
    const m: Record<string, string> = {
      compound: '🧩', synonym: '🔄', rhyme: '🎵', opposite: '⚡',
      'category-sibling': '👥', 'part-whole': '🔧', 'object-role': '🎭',
      material: '🧱', 'verb-object': '💪', collocation: '💬',
      'cause-effect': '💥', 'cultural-pair': '🤝', slang: '🗣️',
      'double-meaning': '🎯', homophone: '👂', containment: '📦', anagram: '🔀'
    };
    return m[t ?? ''] ?? '✅';
  }

  const HATCH_COUNT = 14;
  // Visible target position on the ledge
  const endY = $derived(H - LEDGE_H / 2 - 4);

  function tileBg(i: number, word: string): string {
    if (phase !== 'snapped' && word.toLowerCase() === target.toLowerCase()) return 'bg-(--green) text-white';
    if (i === 0) return 'bg-(--accent) text-white';
    if (i === 1) return 'bg-amber-400 dark:bg-amber-500 text-stone-900';
    return 'bg-(--bg-raised)';
  }
</script>

<div class="flex flex-col gap-3">
  <div class="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
    <span class="text-(--text-muted)">Hang Strain · Fibonacci</span>
    <span class={stepsLeft <= 3 ? 'text-(--red)' : 'text-(--text-muted)'}>
      {stepsLeft} / {MAX_NEW} left
    </span>
  </div>

  <div class="h-2 border-2 border-(--ink) bg-(--surface) overflow-hidden">
    <div
      class="h-full transition-all"
      style="width: {threadStrain * 100}%; background: {threadStrain > 0.7 ? 'var(--red)' : threadStrain > 0.4 ? '#d97706' : 'var(--accent)'};"
    ></div>
  </div>

  <div
    bind:this={boardEl}
    class="relative border-2 border-(--ink) bg-gradient-to-b from-sky-100 via-sky-50 to-amber-50 dark:from-slate-900 dark:via-slate-800 dark:to-stone-900 overflow-hidden"
    style="height: {H}px;"
  >
    <!-- Cliff top with two anchor pegs -->
    <svg
      class="absolute inset-x-0 top-0 w-full pointer-events-none"
      height={CLIFF_H + 8}
      viewBox="0 0 {boardWidth} {CLIFF_H + 8}"
      preserveAspectRatio="none"
    >
      <rect x="0" y="0" width={boardWidth} height={CLIFF_H} fill="#78716c" stroke="var(--ink)" stroke-width="2" />
      {#each Array(HATCH_COUNT) as _, i}
        {@const x = (i / HATCH_COUNT) * boardWidth}
        <line x1={x} y1="0" x2={x + 14} y2={CLIFF_H} stroke="#44403c" stroke-width="1.2" opacity="0.55" />
      {/each}
      <line x1="0" y1={CLIFF_H} x2={boardWidth} y2={CLIFF_H} stroke="var(--ink)" stroke-width="2.5" />
      <!-- Two anchor pegs -->
      <rect x={anchorLX - 5} y={CLIFF_H - 10} width="10" height="14" fill="var(--ink)" />
      <circle cx={anchorLX} cy={CLIFF_H + 3} r="3" fill="var(--ink)" />
      <rect x={anchorRX - 5} y={CLIFF_H - 10} width="10" height="14" fill="var(--ink)" />
      <circle cx={anchorRX} cy={CLIFF_H + 3} r="3" fill="var(--ink)" />
    </svg>

    <!-- Hanging threads — fine fibre style -->
    <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 {boardWidth} {H}" preserveAspectRatio="none">
      {#if phase !== 'snapped'}
        <!-- As more words hang, the main strand thins and more fray appears. -->
        {@const strain = threadStrain}
        {@const mainW = Math.max(0.55, 1.8 - strain * 1.1)}
        {@const wispW = Math.max(0.35, 1.1 - strain * 0.7)}
        {@const mainColour = strain > 0.75 ? 'var(--red)' : strain > 0.45 ? '#6b4423' : '#3f2a1a'}
        {@const wispColour = strain > 0.75 ? '#ef4444' : '#78716c'}

        {#snippet thread(x1: number, y1: number, x2: number, y2: number, seed: number, ceiling: boolean)}
          {@const dx = x2 - x1}
          {@const dy = y2 - y1}
          {@const len = Math.max(1, Math.sqrt(dx * dx + dy * dy))}
          {@const px = -dy / len}
          {@const py = dx / len}
          {@const rnd = (k: number) => (((seed * 9301 + k * 49297) % 233280) / 233280)}
          <!-- Main taut strand -->
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={mainColour} stroke-width={mainW} stroke-linecap="round" opacity="0.95" />
          <!-- Two wispy side fibres with slight bow so the thread looks stranded, not ruled -->
          {@const bow = 0.6 + strain * 1.2}
          {@const cx1 = (x1 + x2) / 2 + px * bow}
          {@const cy1 = (y1 + y2) / 2 + py * bow}
          {@const cx2 = (x1 + x2) / 2 - px * bow}
          {@const cy2 = (y1 + y2) / 2 - py * bow}
          <path d="M{x1} {y1} Q{cx1} {cy1} {x2} {y2}" stroke={wispColour} stroke-width={wispW} fill="none" stroke-linecap="round" opacity="0.75" />
          <path d="M{x1} {y1} Q{cx2} {cy2} {x2} {y2}" stroke={wispColour} stroke-width={wispW} fill="none" stroke-linecap="round" opacity="0.6" />
          <!-- Fray hairs: density grows with strain; ceiling segments fray extra -->
          {@const frayN = Math.min(26, Math.round((ceiling ? 4 : 2) + strain * (ceiling ? 22 : 10)))}
          {#each Array(frayN) as _, k}
            {@const t = (k + 0.5 + rnd(k) * 0.8) / (frayN + 1)}
            {@const fx = x1 + dx * t}
            {@const fy = y1 + dy * t}
            {@const side = rnd(k + 7) < 0.5 ? -1 : 1}
            {@const flen = 1.2 + rnd(k + 13) * (2.5 + strain * 3.5)}
            {@const jx = (rnd(k + 29) - 0.5) * 1.4}
            {@const jy = (rnd(k + 31) - 0.5) * 1.4}
            <line
              x1={fx}
              y1={fy}
              x2={fx + px * flen * side + jx}
              y2={fy + py * flen * side + jy}
              stroke={strain > 0.75 && rnd(k + 41) > 0.55 ? '#b91c1c' : '#a8a29e'}
              stroke-width={0.4 + rnd(k + 53) * 0.4}
              stroke-linecap="round"
              opacity={0.55 + strain * 0.35}
            />
          {/each}
          <!-- A few loose flyaway hairs near the ceiling anchor -->
          {#if ceiling}
            {#each Array(Math.min(6, Math.round(1 + strain * 5))) as _, k}
              {@const t = rnd(k + 61) * 0.25}
              {@const fx = x1 + dx * t}
              {@const fy = y1 + dy * t}
              {@const curlX = fx + (rnd(k + 73) - 0.5) * 8}
              {@const curlY = fy + 4 + rnd(k + 79) * 8}
              <path
                d="M{fx} {fy} Q{fx + (rnd(k + 83) - 0.5) * 4} {fy + 2} {curlX} {curlY}"
                stroke="#a8a29e"
                stroke-width="0.5"
                fill="none"
                opacity="0.7"
                stroke-linecap="round"
              />
            {/each}
          {/if}
        {/snippet}

        <!-- Draw two threads per tile (same-column grandparent + crossing parent). -->
        {#each chain as _, i}
          {@const nt = nearTop(i)}
          {@const ft = farTop(i)}
          {#if i >= 2}
            {@const src = nearBottom(i - 2)}
            {@render thread(src.x, src.y, nt.x, nt.y, i * 11 + 1, false)}
          {:else}
            {@const src = ceilingNear(i)}
            {@render thread(src.x, src.y, nt.x, nt.y, i * 11 + 1, true)}
          {/if}
          {#if i >= 1}
            {@const src = farBottom(i - 1)}
            {@render thread(src.x, src.y, ft.x, ft.y, i * 11 + 7, i === 0)}
          {:else}
            {@const src = ceilingFar(i)}
            {@render thread(src.x, src.y, ft.x, ft.y, i * 11 + 7, true)}
          {/if}
        {/each}
      {/if}

      <!-- Rescue ledge -->
      <rect x="0" y={H - LEDGE_H} width={boardWidth} height={LEDGE_H} fill="#44403c" stroke="var(--ink)" stroke-width="2" />
      {#each Array(10) as _, i}
        {@const x = (i / 10) * boardWidth}
        <line x1={x} y1={H - LEDGE_H} x2={x + 10} y2={H} stroke="#1c1917" stroke-width="1" opacity="0.6" />
      {/each}
    </svg>

    <!-- End target on ledge -->
    {#if phase !== 'snapped'}
      <div
        class="absolute flex items-center justify-center gap-1 px-2 border-2 border-dashed border-(--green) bg-green-50 dark:bg-green-950 text-(--green) font-bold text-xs"
        style="left: {centerX - 58}px; top: {endY - 16}px; width: 116px; height: 32px;"
      >
        <span class="text-[10px] uppercase tracking-wider">🏁</span>
        <span class="truncate">{target}</span>
      </div>
    {/if}

    <!-- Hanging tiles -->
    {#each chain as word, i (word)}
      {@const c = tileCenter(i)}
      <div
        bind:this={tileEls[word]}
        class="absolute flex items-center justify-center gap-1 px-2 border-2 border-(--ink) font-bold text-xs shadow-[2px_2px_0_0_var(--ink)] will-change-transform {tileBg(i, word)}"
        style={phase === 'snapped'
          ? `left: 0px; top: 0px; width: ${tileW}px; height: ${tileH}px;`
          : `left: ${c.x - tileW / 2}px; top: ${c.y - tileH / 2}px; width: ${tileW}px; height: ${tileH}px;`}
        title={i < 2
          ? `Seed ${i === 0 ? 'A' : 'B'}`
          : `${chain[i - 2]} + ${chain[i - 1]} → ${word}`}
      >
        {#if i === 0}
          <span class="text-[9px] uppercase tracking-wider opacity-80">A</span>
        {:else if i === 1}
          <span class="text-[9px] uppercase tracking-wider opacity-80">B</span>
        {:else}
          <span class="text-[10px]">{typeEmoji(verdictPairs[i - 2]?.[1]?.type)}</span>
        {/if}
        <span class="truncate">{word}</span>
      </div>
    {/each}

    {#if phase === 'snapped'}
      <div class="absolute inset-x-0 top-14 flex justify-center pointer-events-none">
        <div class="px-3 py-1 border-2 border-(--red) bg-(--surface) font-display text-sm font-black uppercase tracking-wider text-(--red)">
          💥 The hang unravelled!
        </div>
      </div>
    {/if}
  </div>

  {#if phase === 'play'}
    <div class="text-xs text-(--text-muted) text-center">
      Next word must link to <strong class="text-(--text)">{prev2}</strong> <em>and</em>
      <strong class="text-(--text)">{prev1}</strong>
    </div>
    <div class="flex gap-2">
      <input
        bind:value={inputValue}
        onkeydown={handleKeydown}
        disabled={validating}
        placeholder={`Word linking ${prev2} + ${prev1}…`}
        class="flex-1 px-3 py-2 border-2 border-(--ink) bg-(--surface) font-bold text-sm placeholder:text-(--text-muted) placeholder:font-normal focus:outline-none focus:border-(--accent) disabled:opacity-50"
      />
      <button
        onclick={addWord}
        disabled={!inputValue.trim() || validating}
        class="px-3 py-2 border-2 border-(--ink) bg-(--accent) text-white font-bold text-sm uppercase tracking-wider shadow-[2px_2px_0_0_var(--ink)] hover:-translate-y-0.5 active:translate-y-[1px] active:shadow-[1px_1px_0_0_var(--ink)] disabled:opacity-40 disabled:transform-none disabled:shadow-none transition-all"
      >
        {validating ? '…' : 'Hang'}
      </button>
    </div>
    <div class="flex gap-2">
      <button
        onclick={tryFinish}
        disabled={validating}
        class="flex-1 px-3 py-2 border-2 border-(--green) text-(--green) font-bold text-sm uppercase tracking-wider hover:bg-(--green) hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-(--green)"
      >
        Finish → {target}
      </button>
      <button
        onclick={undo}
        disabled={chain.length <= 2 || validating}
        class="px-3 py-2 border-2 border-(--ink) text-(--text-muted) font-bold text-sm uppercase tracking-wider hover:bg-(--surface) transition-colors disabled:opacity-30"
      >
        Undo
      </button>
      <button
        onclick={addFake}
        disabled={validating || stepsLeft <= 0}
        class="px-3 py-2 border-2 border-(--red) text-(--red) font-bold text-sm uppercase tracking-wider hover:bg-(--red) hover:text-white transition-colors disabled:opacity-30"
        title="Debug: add a fake pre-validated word (spam to unravel the hang)"
      >
        +🤖 Debug
      </button>
    </div>
    {#if error}
      <div class="px-3 py-2 border-2 border-(--red) bg-red-50 dark:bg-red-950 text-(--red) text-sm font-medium whitespace-pre-line">
        {error}
      </div>
    {/if}
  {/if}

  {#if phase === 'won'}
    <div class="flex flex-col items-center gap-2 p-4 border-2 border-(--green) bg-green-50 dark:bg-green-950">
      <div class="font-display text-2xl font-black text-(--green)">Hang reached the ledge!</div>
      <div class="text-sm text-(--text-muted)">
        <span class="font-bold">{stepsUsed}</span> words woven • <span class="font-bold">{stepsLeft}</span> spare
      </div>
      <button onclick={reset} class="px-4 py-2 border-2 border-(--ink) bg-(--surface) font-bold text-sm uppercase tracking-wider hover:bg-(--bg-raised)">
        Weave again
      </button>
    </div>
  {/if}

  {#if phase === 'snapped'}
    <div class="flex flex-col items-center gap-2 p-4 border-2 border-(--red) bg-red-50 dark:bg-red-950">
      <div class="font-display text-2xl font-black text-(--red)">The hang came apart!</div>
      <div class="text-sm text-(--text-muted)">Unravelled at {chain.length} strands.</div>
      <button onclick={reset} class="px-4 py-2 border-2 border-(--ink) bg-(--surface) font-bold text-sm uppercase tracking-wider hover:bg-(--bg-raised)">
        Re-hang
      </button>
    </div>
  {/if}
</div>
