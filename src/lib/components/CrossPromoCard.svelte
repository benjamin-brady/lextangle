<script lang="ts">
	import { onMount } from 'svelte';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import { loadCrossPromoGames, pickWeightedGame, type CrossPromoGame } from '$lib/cross-promo';

	let game = $state<CrossPromoGame | null>(null);

	onMount(async () => {
		const games = await loadCrossPromoGames();
		game = pickWeightedGame(games);
	});
</script>

{#if game}
	<section class="cross-promo mt-2">
		<h2
			class="cross-promo-title font-display font-bold mb-2 px-1"
			style="font-size: 1.5rem; transform: rotate(-1deg); display: inline-block;"
		>
			try another game
		</h2>
		<a
			href={game.url}
			target="_blank"
			rel="noopener noreferrer"
			class="cross-promo-card flex items-center gap-3 p-3"
		>
			<span aria-hidden="true" style="font-size: 2.25rem; line-height: 1;">{game.emoji}</span>
			<span class="flex-1 min-w-0">
				<span
					class="cross-promo-name font-display font-bold block leading-tight"
					style="font-size: 1.4rem;"
				>
					{game.name}
				</span>
				<span
					class="cross-promo-tagline block leading-snug"
					style="font-size: 1rem;"
				>
					{game.tagline}
				</span>
			</span>
			<span
				class="crayon-btn crayon-btn-blue inline-flex items-center gap-1.5 shrink-0"
				style="font-size: 1.05rem; padding: 6px 10px; --tilt: -1.5deg;"
			>
				<span>play</span>
				<ExternalLink class="h-3.5 w-3.5" aria-hidden="true" />
			</span>
		</a>
	</section>
{/if}

<style>
	.cross-promo-title { color: var(--ink-dark); }
	.cross-promo-card {
		background: var(--tile-surface);
		color: var(--ink-dark);
		border: 3px solid var(--border-strong);
		border-radius: 6px;
		text-decoration: none;
		filter: drop-shadow(2px 3px 0 rgba(0, 0, 0, 0.12));
		transition: transform 0.15s ease;
	}
	.cross-promo-name { color: var(--ink-dark); }
	.cross-promo-tagline { color: var(--text-muted); }
	.cross-promo-card:hover {
		transform: translate(-1px, -1px);
	}

	:global(.dark) .cross-promo-title,
	:global(.dark) .cross-promo-card,
	:global(.dark) .cross-promo-name {
		color: var(--text);
	}
	:global(.dark) .cross-promo-card {
		background: var(--surface-light);
	}
	:global(.dark) .cross-promo-tagline {
		color: var(--text-muted);
	}
</style>
