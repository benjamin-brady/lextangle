<script lang="ts">
  import { onDestroy, tick } from 'svelte';
  import { validateLink, getScore } from '$lib/game';
  import type { LinkVerdict } from '$lib/types';
  import { collapseChain, type TileSpec } from '$lib/physics';

  let { start, end }: { start: string; end: string } = $props();

  const MAX_GUESSES = 10;

  let chain = $state<string[]>([start]);
  let verdicts = $state<LinkVerdict[]>([]);
  let inputValue = $state('');
  let validating = $state(false);
  let error = $state<string | null>(null);
  let phase = $state<'play' | 'presnap' | 'snapped' | 'won'>('play');

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

  const lastWord = $derived(chain[chain.length - 1]);
  const guessesUsed = $derived(chain.length - 1);
  const guessesLeft = $derived(MAX_GUESSES - guessesUsed);
  const scoreInfo = $derived(phase === 'won' ? getScore(chain) : null);

  // Layout
  const CLIFF_H = 44;
  const ANCHOR_Y = CLIFF_H;
  const THREAD_LEN = 56;
  const LEDGE_H = 44;
  const TOP_PAD = CLIFF_H + THREAD_LEN;
  const ANCHOR_DX = 30; // horizontal offset of each anchor from center

  const tileW = $derived(Math.min(180, Math.max(120, boardWidth - 100)));
  const tileH = $derived(Math.max(22, Math.round(40 - chain.length * 1.4)));
  const rungGap = $derived(Math.max(8, 20 - Math.round(chain.length * 0.8)));
  const tileStep = $derived(tileH + rungGap);

  // Two threads — left thinner (snaps first), right thicker
  const leftThreadW = $derived(Math.max(0.25, 3.4 - guessesUsed * 0.38));
  const rightThreadW = $derived(Math.max(0.6, 4.6 - guessesUsed * 0.36));
  const threadStrain = $derived(Math.min(1, guessesUsed / MAX_GUESSES));

  const centerX = $derived(boardWidth / 2);
  const anchorLX = $derived(centerX - ANCHOR_DX);
  const anchorRX = $derived(centerX + ANCHOR_DX);

  function tileCenter(i: number): { x: number; y: number } {
    return {
      x: centerX,
      y: TOP_PAD + tileH / 2 + i * tileStep
    };
  }

  const endY = $derived(H - LEDGE_H / 2 - 4);

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
    if (guessesLeft <= 0) return;

    validating = true;
    error = null;
    try {
      const v = await validateLink(lastWord, word);
      if (v.valid) {
        chain = [...chain, word];
        verdicts = [...verdicts, v];
        inputValue = '';
        if (word.toLowerCase() === end.toLowerCase()) {
          phase = 'won';
          return;
        }
        if (chain.length - 1 >= MAX_GUESSES) {
          await snap();
        }
      } else {
        error = v.reason ?? 'No link';
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
      const v = await validateLink(lastWord, end);
      if (v.valid) {
        chain = [...chain, end];
        verdicts = [...verdicts, v];
        phase = 'won';
      } else {
        error = v.reason ?? 'No link to end';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Validation failed';
    } finally {
      validating = false;
    }
  }

  function undo() {
    if (chain.length <= 1 || phase !== 'play') return;
    chain = chain.slice(0, -1);
    verdicts = verdicts.slice(0, -1);
    error = null;
  }

  function reset() {
    if (disposeSim) disposeSim();
    disposeSim = null;
    chain = [start];
    verdicts = [];
    inputValue = '';
    error = null;
    phase = 'play';
    tileEls = {};
  }

  const DEBUG_WORDS = ['ALPHA', 'BETA', 'GAMMA', 'DELTA', 'EPSILON', 'ZETA', 'ETA', 'THETA', 'IOTA', 'KAPPA', 'LAMBDA', 'MU'];
  async function addFake() {
    if (phase !== 'play' || validating || guessesLeft <= 0) return;
    const used = new Set(chain.map((w) => w.toLowerCase()));
    const pick = DEBUG_WORDS.find((w) => !used.has(w.toLowerCase())) ?? `DEBUG${chain.length}`;
    chain = [...chain, pick];
    verdicts = [...verdicts, { a: lastWord, b: pick, valid: true, type: 'compound', reason: 'debug: auto-inserted' }];
    error = null;
    if (chain.length - 1 >= MAX_GUESSES) await snap();
  }

  async function snap() {
    // Stage 1: left thread breaks. Chain tilts/swings right around remaining anchor.
    phase = 'presnap';
    await tick();
    await new Promise((r) => setTimeout(r, 260));

    // Stage 2: right thread snaps too, full collapse.
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
      const { x, y } = tileCenter(i);
      // Small per-tile jitter only; the chain constraints do the real work.
      specs.push({
        el,
        x,
        y,
        w,
        h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: 0,
        angularVelocity: (Math.random() - 0.5) * 0.02
      });
    }
    // Apply a rightward impulse at the top (inherited momentum from the
    // left-thread pre-snap swing) and a tilt. The chain falls as a coherent
    // flexible ladder, sweeping right as it goes.
    disposeSim = collapseChain(boardEl, specs, {
      railOffset: 18,
      topImpulseX: 5.5,
      topAngularImpulse: 0.12,
      duration: 9000
    });
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
</script>

<div class="flex flex-col gap-3">
  <div class="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
    <span class="text-(--text-muted)">Thread Strain</span>
    <span class={guessesLeft <= 3 ? 'text-(--red)' : 'text-(--text-muted)'}>
      {guessesLeft} / {MAX_GUESSES} left
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
    <svg class="absolute inset-x-0 top-0 w-full pointer-events-none" height={CLIFF_H + 8} viewBox="0 0 {boardWidth} {CLIFF_H + 8}" preserveAspectRatio="none">
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

    <!-- Threads, rope links, ledge -->
    <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 {boardWidth} {H}" preserveAspectRatio="none">
      <!-- LEFT thread: anchor → top-left of first tile -->
      {#if phase === 'play'}
        <line
          x1={anchorLX}
          y1={ANCHOR_Y + 4}
          x2={centerX - 18}
          y2={TOP_PAD}
          stroke={threadStrain > 0.65 ? 'var(--red)' : '#57534e'}
          stroke-width={leftThreadW}
          stroke-linecap="round"
        />
      {:else if phase === 'presnap'}
        <!-- Recoil fragments for the snapped left thread -->
        <line x1={anchorLX} y1={ANCHOR_Y + 4} x2={anchorLX - 3} y2={ANCHOR_Y + 14} stroke="var(--red)" stroke-width="1.2" />
        <line x1={centerX - 18} y1={TOP_PAD} x2={centerX - 24} y2={TOP_PAD - 10} stroke="var(--red)" stroke-width="1.2" />
      {/if}

      <!-- RIGHT thread -->
      {#if phase !== 'snapped'}
        <line
          x1={anchorRX}
          y1={ANCHOR_Y + 4}
          x2={centerX + 18}
          y2={TOP_PAD}
          stroke={phase === 'presnap' ? 'var(--red)' : threadStrain > 0.7 ? 'var(--red)' : '#57534e'}
          stroke-width={phase === 'presnap' ? Math.max(0.3, rightThreadW - 2) : rightThreadW}
          stroke-linecap="round"
        />
      {/if}

      <!-- Fray specks along both threads -->
      {#if phase === 'play'}
        {#each Array(Math.min(guessesUsed * 2, 14)) as _, i}
          {@const seed = (i * 9301 + 49297) % 233280}
          {@const r1 = seed / 233280}
          {@const r2 = (((i * 7 + 13) * 9301 + 49297) % 233280) / 233280}
          {@const onLeft = i % 2 === 0}
          {@const ax = onLeft ? anchorLX : anchorRX}
          {@const tx = onLeft ? centerX - 18 : centerX + 18}
          {@const fy = ANCHOR_Y + 6 + r1 * (THREAD_LEN - 12)}
          {@const bx = ax + (tx - ax) * r1}
          {@const dx = (r2 - 0.5) * 9}
          <line
            x1={bx}
            y1={fy}
            x2={bx + dx}
            y2={fy + 3 + r2 * 4}
            stroke="#a8a29e"
            stroke-width="0.8"
            opacity="0.8"
          />
        {/each}
      {/if}

      <!-- Rope links between tiles (ladder-style, two parallel ropes) -->
      {#if phase !== 'snapped'}
        {#each chain as _, i}
          {#if i < chain.length - 1}
            {@const top = tileCenter(i)}
            {@const bot = tileCenter(i + 1)}
            <line x1={centerX - 18} y1={top.y + tileH / 2} x2={centerX - 18} y2={bot.y - tileH / 2} stroke="#8b4513" stroke-width="2.4" stroke-linecap="round" />
            <line x1={centerX + 18} y1={top.y + tileH / 2} x2={centerX + 18} y2={bot.y - tileH / 2} stroke="#8b4513" stroke-width="2.4" stroke-linecap="round" />
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
    <div
      class="absolute flex items-center justify-center gap-1 px-2 border-2 border-(--ink) bg-(--green) text-white font-bold text-xs shadow-[2px_2px_0_0_var(--ink)]"
      style="left: {centerX - 58}px; top: {endY - 16}px; width: 116px; height: 32px;"
    >
      <span class="text-[10px] uppercase tracking-wider opacity-80">🏁</span>
      <span class="truncate">{end}</span>
    </div>

    <!-- Hanging tiles -->
    {#each chain as word, i (word)}
      {@const c = tileCenter(i)}
      {@const isStart = i === 0}
      {@const presnapTilt = phase === 'presnap' ? ((i + 1) / chain.length) * 9 : 0}
      {@const presnapShift = phase === 'presnap' ? ((i + 1) / chain.length) * 10 : 0}
      <div
        bind:this={tileEls[word]}
        class="absolute flex items-center justify-center gap-1 px-2 border-2 border-(--ink) font-bold text-xs shadow-[2px_2px_0_0_var(--ink)] will-change-transform {isStart ? 'bg-(--accent) text-white' : 'bg-(--bg-raised)'}"
        style={phase === 'snapped'
          ? `left: 0px; top: 0px; width: ${tileW}px; height: ${tileH}px;`
          : `left: ${c.x - tileW / 2 + presnapShift}px; top: ${c.y - tileH / 2}px; width: ${tileW}px; height: ${tileH}px; transform: rotate(${presnapTilt}deg); transition: transform 220ms ease-in, left 220ms ease-in;`}
      >
        {#if isStart}
          <span class="text-[9px] uppercase tracking-wider opacity-80">🧗</span>
        {:else}
          <span class="text-[10px]">{typeEmoji(verdicts[i - 1]?.type)}</span>
        {/if}
        <span class="truncate">{word}</span>
      </div>
    {/each}

    {#if phase === 'snapped'}
      <div class="absolute inset-x-0 top-14 flex justify-center pointer-events-none">
        <div class="px-3 py-1 border-2 border-(--red) bg-(--surface) font-display text-sm font-black uppercase tracking-wider text-(--red)">
          💥 Both threads gave way!
        </div>
      </div>
    {/if}
    {#if phase === 'presnap'}
      <div class="absolute inset-x-0 top-14 flex justify-center pointer-events-none">
        <div class="px-3 py-1 border-2 border-(--red) bg-(--surface) font-display text-sm font-black uppercase tracking-wider text-(--red) animate-pulse">
          ⚠️ Left thread snapped!
        </div>
      </div>
    {/if}
  </div>

  {#if phase === 'play'}
    <div class="flex gap-2">
      <input
        bind:value={inputValue}
        onkeydown={handleKeydown}
        disabled={validating}
        placeholder={`Next word after ${lastWord}…`}
        class="flex-1 px-3 py-2 border-2 border-(--ink) bg-(--surface) font-bold text-sm placeholder:text-(--text-muted) placeholder:font-normal focus:outline-none focus:border-(--accent) disabled:opacity-50"
      />
      <button
        onclick={addWord}
        disabled={!inputValue.trim() || validating}
        class="px-3 py-2 border-2 border-(--ink) bg-(--accent) text-white font-bold text-sm uppercase tracking-wider shadow-[2px_2px_0_0_var(--ink)] hover:-translate-y-0.5 active:translate-y-[1px] active:shadow-[1px_1px_0_0_var(--ink)] disabled:opacity-40 disabled:transform-none disabled:shadow-none transition-all"
      >
        {validating ? '…' : 'Drop'}
      </button>
    </div>
    <div class="flex gap-2">
      <button
        onclick={tryFinish}
        disabled={chain.length < 2 || validating}
        class="flex-1 px-3 py-2 border-2 border-(--green) text-(--green) font-bold text-sm uppercase tracking-wider hover:bg-(--green) hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-(--green)"
      >
        Finish → {end}
      </button>
      <button
        onclick={undo}
        disabled={chain.length <= 1 || validating}
        class="px-3 py-2 border-2 border-(--ink) text-(--text-muted) font-bold text-sm uppercase tracking-wider hover:bg-(--surface) transition-colors disabled:opacity-30"
      >
        Undo
      </button>
      <button
        onclick={addFake}
        disabled={validating || guessesLeft <= 0}
        class="px-3 py-2 border-2 border-(--red) text-(--red) font-bold text-sm uppercase tracking-wider hover:bg-(--red) hover:text-white transition-colors disabled:opacity-30"
        title="Debug: add a fake pre-validated word (spam to snap the threads)"
      >
        +🤖 Debug
      </button>
    </div>
    {#if error}
      <div class="px-3 py-2 border-2 border-(--red) bg-red-50 dark:bg-red-950 text-(--red) text-sm font-medium">
        {error}
      </div>
    {/if}
  {/if}

  {#if phase === 'won' && scoreInfo}
    <div class="flex flex-col items-center gap-2 p-4 border-2 border-(--green) bg-green-50 dark:bg-green-950">
      <div class="font-display text-2xl font-black text-(--green)">{scoreInfo.rating}!</div>
      <div class="text-sm text-(--text-muted)">
        <span class="font-bold">{scoreInfo.hops}</span> hops • <span class="font-bold">{guessesLeft}</span> slack left
      </div>
      <button onclick={reset} class="px-4 py-2 border-2 border-(--ink) bg-(--surface) font-bold text-sm uppercase tracking-wider hover:bg-(--bg-raised)">
        Climb again
      </button>
    </div>
  {/if}

  {#if phase === 'snapped'}
    <div class="flex flex-col items-center gap-2 p-4 border-2 border-(--red) bg-red-50 dark:bg-red-950">
      <div class="font-display text-2xl font-black text-(--red)">Threads snapped!</div>
      <div class="text-sm text-(--text-muted)">Too much weight. {chain.length} climbers fell.</div>
      <button onclick={reset} class="px-4 py-2 border-2 border-(--ink) bg-(--surface) font-bold text-sm uppercase tracking-wider hover:bg-(--bg-raised)">
        New threads
      </button>
    </div>
  {/if}
</div>
