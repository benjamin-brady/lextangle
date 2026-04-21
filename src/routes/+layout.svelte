<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { env } from '$env/dynamic/public';
	import HowToPlay from '$lib/components/HowToPlay.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { getTodaysPuzzleInfo } from '$lib/puzzles';
	import { theme, resolveTheme } from '$lib/theme.svelte';
	import { trackPageView } from '../lib/analytics';
	import '../app.css';

	const { puzzleNumber } = getTodaysPuzzleInfo();

	let { children } = $props();

	const gaMeasurementId = env.PUBLIC_GA_MEASUREMENT_ID ?? '';
	const gaBootstrapScript = gaMeasurementId
		? `window.dataLayer = window.dataLayer || [];
function gtag(){window.dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', ${JSON.stringify(gaMeasurementId)}, { send_page_view: false });`
		: '';

	afterNavigate(() => {
		if (!gaMeasurementId || typeof window === 'undefined') {
			return;
		}

		trackPageView(new URL(window.location.href), gaMeasurementId);
	});

	$effect(() => {
		if (typeof document === 'undefined') return;
		const choice = theme.choice;
		const apply = () => {
			const resolved = resolveTheme(choice);
			document.documentElement.classList.toggle('dark', resolved === 'dark');
			document.documentElement.dataset.theme = choice;
		};
		apply();
		if (choice !== 'system') return;
		const mq = window.matchMedia('(prefers-color-scheme: dark)');
		mq.addEventListener('change', apply);
		return () => mq.removeEventListener('change', apply);
	});
</script>

<svelte:head>
	{#if gaMeasurementId}
		<script async src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}></script>
		{@html `<script>${gaBootstrapScript}<\/script>`}
	{/if}
</svelte:head>

<div class="relative z-10 min-h-dvh flex flex-col items-center text-(--text)">
	<header class="w-full border-b-2 border-(--ink) bg-(--bg-raised)">
		<div class="flex items-end justify-between w-full max-w-md mx-auto px-4 pt-4 pb-3">
			<a href="/" class="flex items-baseline gap-2 group">
				<span class="font-display text-3xl font-black tracking-tight leading-none">
					<span>Lex</span><span class="italic text-(--accent)">Link</span>
				</span>
				<span class="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-(--text-muted)">№{puzzleNumber}</span>
			</a>
			<div class="flex items-center gap-2">
				<ThemeToggle />
				<HowToPlay />
			</div>
		</div>
		<nav class="flex items-center justify-center gap-4 pb-2 text-[11px] font-bold uppercase tracking-[0.22em]">
			<a class="px-2 py-1 border-b-2 border-transparent text-(--text) transition-colors hover:border-(--accent)" href="/">Daily</a>
			<a class="px-2 py-1 border-b-2 border-transparent text-(--text) transition-colors hover:border-(--accent)" href="/practice">Practice</a>
		</nav>
	</header>
	<main class="flex-1 w-full max-w-md mx-auto px-4 py-6">
		{@render children()}
	</main>
	<footer class="w-full border-t-2 border-(--ink) bg-(--bg-raised) mt-6">
		<div class="w-full max-w-md mx-auto px-4 py-4 flex flex-col items-center gap-3">
			<a
				href="https://ko-fi.com/benbob"
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-2 border-2 border-(--ink) bg-(--accent) px-4 py-2 font-display text-sm font-black uppercase tracking-[0.15em] text-white shadow-[2px_2px_0_0_var(--ink)] transition-all hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_var(--ink)]"
			>
				<span aria-hidden="true">☕</span>
				<span>Support on Ko-fi</span>
			</a>
			<nav class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-bold uppercase tracking-[0.18em] text-(--text-muted)">
				<a class="hover:text-(--accent)" href="https://discord.gg/AWfvmFWBcA" target="_blank" rel="noopener noreferrer">Discord</a>
				<span aria-hidden="true">·</span>
				<a class="hover:text-(--accent)" href="/terms">Terms</a>
				<span aria-hidden="true">·</span>
				<a class="hover:text-(--accent)" href="/privacy">Privacy</a>
			</nav>
			<p class="text-[10px] text-(--text-muted)">Made with ☕ by Ben Brady</p>
		</div>
	</footer>
</div>

<Toaster richColors position="bottom-center" />
