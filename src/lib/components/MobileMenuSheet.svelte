<script lang="ts">
	import { Sun, Moon, SunMoon, X, Share2, Info, ExternalLink } from 'lucide-svelte';
	import { fade, fly } from 'svelte/transition';
	import { theme, type ThemeChoice } from '$lib/theme.svelte';
	import { shareAction, howToPlayAction } from '$lib/share-action.svelte';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	const themeIcons: Record<ThemeChoice, typeof Sun> = {
		light: Sun,
		dark: Moon,
		system: SunMoon
	};
	const themeLabels: Record<ThemeChoice, string> = {
		light: 'light',
		dark: 'dark',
		system: 'system'
	};
	const ThemeIcon = $derived(themeIcons[theme.choice]);

	function close() {
		open = false;
	}

	function runAndClose(fn: (() => void) | null) {
		if (!fn) return;
		fn();
		close();
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50">
		<button
			type="button"
			class="absolute inset-0 cursor-pointer"
			style="background: rgba(42, 42, 46, 0.55);"
			aria-label="Close menu"
			onclick={close}
			transition:fade={{ duration: 150 }}
		></button>
		<aside
			role="dialog"
			aria-modal="true"
			aria-label="Menu"
			class="absolute right-0 top-0 h-full w-72 max-w-[85vw] flex flex-col"
			style="background: var(--bg-raised); border-left: 3px solid var(--ink-dark); box-shadow: -4px 0 0 rgba(0,0,0,0.18);"
			transition:fly={{ x: 320, duration: 200 }}
		>
			<div class="flex items-center justify-between px-4 py-3 border-b" style="border-color: var(--border);">
				<span class="font-display font-bold" style="font-size: 1.4rem; color: var(--ink);">menu</span>
				<button
					type="button"
					class="flex h-9 w-9 items-center justify-center rounded text-(--ink) hover:text-(--crayon-red)"
					style="background: transparent;"
					aria-label="Close menu"
					onclick={close}
				>
					<X size={20} aria-hidden="true" />
				</button>
			</div>

			<div class="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
				<button
					type="button"
					class="sheet-row"
					onclick={() => theme.cycle()}
				>
					<ThemeIcon size={20} aria-hidden="true" />
					<span class="flex-1 text-left">theme</span>
					<span class="font-display" style="color: var(--text-muted); font-size: 0.95rem;">{themeLabels[theme.choice]}</span>
				</button>

				{#if howToPlayAction.handler}
					<button
						type="button"
						class="sheet-row"
						onclick={() => runAndClose(howToPlayAction.handler)}
					>
						<Info size={20} aria-hidden="true" />
						<span class="flex-1 text-left">how to play</span>
					</button>
				{/if}

				{#if shareAction.handler}
					<button
						type="button"
						class="sheet-row"
						onclick={() => runAndClose(shareAction.handler)}
					>
						<Share2 size={20} aria-hidden="true" />
						<span class="flex-1 text-left">share</span>
					</button>
				{/if}

				<div class="my-2 border-t" style="border-color: var(--border);"></div>

				<a class="sheet-row" href="/" onclick={close}>
					<span class="flex-1">daily</span>
				</a>
				<a class="sheet-row" href="/practice" onclick={close}>
					<span class="flex-1">practice</span>
				</a>
				<a class="sheet-row" href="/faq" onclick={close}>
					<span class="flex-1">faq</span>
				</a>
				<a class="sheet-row" href="https://discord.gg/AWfvmFWBcA" target="_blank" rel="noopener noreferrer" onclick={close}>
					<span class="flex-1">discord</span>
					<ExternalLink size={14} aria-hidden="true" style="color: var(--text-muted);" />
				</a>
				<a class="sheet-row" href="https://ko-fi.com/benbob" target="_blank" rel="noopener noreferrer" onclick={close}>
					<span class="flex-1">buy me a coffee ☕</span>
					<ExternalLink size={14} aria-hidden="true" style="color: var(--text-muted);" />
				</a>

				<div class="my-2 border-t" style="border-color: var(--border);"></div>

				<a class="sheet-row sheet-row-sm" href="/terms" onclick={close}>
					<span class="flex-1">terms</span>
				</a>
				<a class="sheet-row sheet-row-sm" href="/privacy" onclick={close}>
					<span class="flex-1">privacy</span>
				</a>
			</div>
		</aside>
	</div>
{/if}

<style>
	.sheet-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 0.75rem;
		border-radius: 4px;
		font-family: var(--font-display);
		font-size: 1.1rem;
		color: var(--ink);
		background: transparent;
		text-decoration: none;
		transition: background 0.12s ease, color 0.12s ease;
		text-align: left;
		width: 100%;
		border: none;
		cursor: pointer;
	}
	.sheet-row:hover,
	.sheet-row:focus-visible {
		background: var(--surface);
		color: var(--crayon-red);
		outline: none;
	}
	.sheet-row-sm {
		font-size: 0.95rem;
		color: var(--text-muted);
	}
</style>
