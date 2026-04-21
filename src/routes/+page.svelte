<script lang="ts">
	import LextensionGame from '$lib/components/LextensionGame.svelte';
	import { getTodaysChallenge } from '$lib/challenges';

	const challenge = getTodaysChallenge();
</script>

<div class="grid gap-4">
	{#key challenge.date}
		<LextensionGame start={challenge.start} end={challenge.end} />
	{/key}
</div>
