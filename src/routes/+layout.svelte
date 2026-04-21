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
	<!-- Hidden SVG defs for wobble filter + reusable paths -->
	<svg width="0" height="0" style="position:absolute" aria-hidden="true">
		<defs>
			<filter id="wobble">
				<feTurbulence type="turbulence" baseFrequency="0.05" numOctaves="2" seed="4" />
				<feDisplacementMap in="SourceGraphic" scale="3" />
			</filter>
			<filter id="wobble-strong">
				<feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="2" seed="9" />
				<feDisplacementMap in="SourceGraphic" scale="5" />
			</filter>
		</defs>
	</svg>

	<header class="w-full bg-(--bg-raised)" style="filter: drop-shadow(0 2px 0 rgba(0,0,0,0.12));">
		<div class="flex items-end justify-between w-full max-w-md mx-auto px-4 pt-5 pb-3">
			<a href="/" class="flex items-baseline gap-2 group">
				<span class="font-display leading-none" style="font-size: 4.5rem; color: var(--ink);">
					<span>Lex</span><span style="color: var(--crayon-red);">tangle</span>
				</span>
				<span class="font-display leading-none" style="font-size: 2rem; color: var(--crayon-blue); transform: rotate(-6deg); display: inline-block;">#{puzzleNumber}</span>
			</a>
			<div class="flex items-center gap-2">
				<ThemeToggle />
				<HowToPlay />
			</div>
		</div>
		<!-- Double-squiggle underline -->
		<svg class="block w-full max-w-md mx-auto px-4" height="18" viewBox="0 0 420 18" preserveAspectRatio="none" aria-hidden="true">
			<path d="M4 8 Q 30 2, 60 8 T 120 8 T 180 8 T 240 8 T 300 8 T 360 8 T 416 8" fill="none" stroke="var(--crayon-blue)" stroke-width="3" stroke-linecap="round" filter="url(#wobble)" />
			<path d="M4 14 Q 30 9, 60 14 T 120 14 T 180 14 T 240 14 T 300 14 T 360 14 T 416 14" fill="none" stroke="var(--crayon-red)" stroke-width="2.5" stroke-linecap="round" filter="url(#wobble)" />
		</svg>
		<nav class="flex items-center justify-center gap-5 py-2 font-display" style="font-size: 1.5rem;">
			<a class="px-2 py-1 hover:text-(--crayon-red) transition-colors" style="color: var(--ink);" href="/">daily</a>
			<a class="px-2 py-1 hover:text-(--crayon-red) transition-colors" style="color: var(--ink);" href="/practice">practice</a>
		</nav>
	</header>
	<main class="flex-1 w-full max-w-md mx-auto px-4 py-6">
		{@render children()}
	</main>
	<footer class="w-full bg-(--bg-raised) mt-10 ripped-top">
		<div class="w-full max-w-md mx-auto px-4 py-5 flex flex-col items-center gap-3">
			<a
				href="https://ko-fi.com/benbob"
				target="_blank"
				rel="noopener noreferrer"
				class="crayon-btn crayon-btn-yellow inline-flex items-center gap-2"
				style="transform: rotate(-1.5deg);"
			>
				<span aria-hidden="true">☕</span>
				<span>buy me a coffee</span>
			</a>
			<nav class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-display" style="font-size: 1.15rem; color: var(--text-muted);">
				<a class="hover:text-(--crayon-red)" href="https://discord.gg/AWfvmFWBcA" target="_blank" rel="noopener noreferrer">discord</a>
				<span aria-hidden="true">·</span>
				<a class="hover:text-(--crayon-red)" href="/terms">terms</a>
				<span aria-hidden="true">·</span>
				<a class="hover:text-(--crayon-red)" href="/privacy">privacy</a>
			</nav>
			<p class="font-display" style="font-size: 1rem; color: var(--text-muted);">made with ☕ by ben brady</p>
		</div>
	</footer>
</div>

<Toaster richColors position="bottom-center" />
