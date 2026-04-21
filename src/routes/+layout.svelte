<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { env } from '$env/dynamic/public';
	import HowToPlay from '$lib/components/HowToPlay.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { getTodaysPuzzleInfo } from '$lib/puzzles';
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
</script>

<svelte:head>
	{#if gaMeasurementId}
		<script async src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}></script>
		{@html `<script>${gaBootstrapScript}<\/script>`}
	{/if}
</svelte:head>

<div class="relative z-10 min-h-dvh flex flex-col items-center text-(--text)">
	<header class="w-full border-b border-(--border) backdrop-blur-sm bg-(--bg)/40">
		<div class="flex items-center justify-between w-full max-w-md mx-auto px-4 py-3">
			<a href="/" class="flex items-baseline gap-1.5 group">
				<span class="text-xl font-black tracking-tight">
					<span class="text-(--text)">Lex</span><span class="text-(--accent)">Link</span>
				</span>
				<span class="text-[0.55rem] font-bold uppercase tracking-[0.2em] text-(--accent) opacity-70">α</span>
				<span class="ml-1 text-sm font-semibold text-(--text-muted)">#{puzzleNumber}</span>
			</a>
			<HowToPlay />
		</div>
		<nav class="flex items-center justify-center gap-1 pb-2 text-xs font-bold uppercase tracking-[0.15em]">
			<a class="rounded-full px-3 py-1 text-(--text-muted) transition-colors hover:text-(--accent)" href="/">Daily</a>
			<span class="text-(--border-strong)">·</span>
			<a class="rounded-full px-3 py-1 text-(--text-muted) transition-colors hover:text-(--accent)" href="/practice">Practice</a>
		</nav>
	</header>
	<main class="flex-1 w-full max-w-md mx-auto px-4 py-5">
		{@render children()}
	</main>
</div>

<Toaster richColors position="bottom-center" />
