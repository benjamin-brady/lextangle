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
	<section
		class="cross-promo px-3 py-4 mt-2"
		style="background: rgba(255,253,246,0.7); filter: drop-shadow(2px 3px 0 rgba(0,0,0,0.1)); border-radius: 3px;"
	>
		<h2
			class="font-display font-bold mb-2"
			style="font-size: 1.7rem; color: var(--ink-dark); transform: rotate(-1deg); display: inline-block;"
		>
			try another game
		</h2>
		<a
			href={game.url}
			target="_blank"
			rel="noopener noreferrer"
			class="cross-promo-card flex items-center gap-3 p-3"
			style="background: var(--tile-surface); border: 3px solid var(--border-strong); border-radius: 6px; text-decoration: none; color: inherit; transition: transform 0.15s ease;"
		>
			<span aria-hidden="true" style="font-size: 2.25rem; line-height: 1;">{game.emoji}</span>
			<span class="flex-1 min-w-0">
				<span
					class="font-display font-bold block leading-tight"
					style="font-size: 1.4rem; color: var(--ink-dark);"
				>
					{game.name}
				</span>
				<span
					class="block leading-snug"
					style="font-size: 1rem; color: var(--text-muted);"
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
	.cross-promo-card:hover {
		transform: translate(-1px, -1px);
	}
</style>
