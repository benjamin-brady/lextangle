<script lang="ts">
  import { randomPair, randomTriple } from '$lib/words';
  import { goto } from '$app/navigation';

  function start() {
    const [a, b] = randomPair();
    goto(`/p/${encodeURIComponent(a)}/${encodeURIComponent(b)}`);
  }

  function startFib() {
    const [a, b, t] = randomTriple();
    goto(`/fib/${encodeURIComponent(a)}/${encodeURIComponent(b)}/${encodeURIComponent(t)}`);
  }
</script>

<svelte:head>
  <title>Lextension · Frayed Rope</title>
</svelte:head>

<div class="grid gap-6">
  <section class="grid gap-2 text-center">
    <h1 class="font-display text-3xl font-black tracking-tight">Frayed Rope</h1>
    <p class="text-sm text-(--text-muted)">
      Bridge from one word to another by hanging link-words along a rope. Each word adds tension.
      <strong>Use all 10</strong> and the rope snaps.
    </p>
  </section>

  <div class="grid gap-2">
    <button
      onclick={start}
      class="px-5 py-4 border-2 border-(--ink) bg-(--accent) text-white font-bold text-base uppercase tracking-wider shadow-[3px_3px_0_0_var(--ink)] hover:-translate-y-0.5 active:translate-y-[1px] active:shadow-[1px_1px_0_0_var(--ink)] transition-all"
    >
      🪢 New Rope
    </button>
    <button
      onclick={startFib}
      class="px-5 py-4 border-2 border-(--ink) bg-amber-400 dark:bg-amber-500 text-stone-900 font-bold text-base uppercase tracking-wider shadow-[3px_3px_0_0_var(--ink)] hover:-translate-y-0.5 active:translate-y-[1px] active:shadow-[1px_1px_0_0_var(--ink)] transition-all"
    >
      🎀 Plait (Fibonacci)
    </button>
    <p class="text-[11px] text-(--text-muted) text-center">
      Plait: each word links to the <em>two</em> above it, weaving left/right.
    </p>
  </div>

  <details class="text-xs text-(--text-muted)">
    <summary class="cursor-pointer font-bold uppercase tracking-wider hover:text-(--text)">How it works</summary>
    <div class="mt-2 space-y-1 pl-2">
      <p>Each word you hang must have a valid link to the one before it (compound, rhyme, opposite, etc).</p>
      <p>Undo lets you pull a tile back without costing tension.</p>
      <p>Finish early to win with rope to spare.</p>
    </div>
  </details>
</div>
