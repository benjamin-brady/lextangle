<script lang="ts">
	import { env } from '$env/dynamic/public';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import type { Puzzle } from '$lib/types';
	import { toast } from 'svelte-sonner';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';

	let {
		open = $bindable(false),
		sentiment,
		puzzle,
		storageId
	}: {
		open: boolean;
		sentiment: 'up' | 'down';
		puzzle: Puzzle;
		storageId: string;
	} = $props();

	const DISCORD_URL =
		env.PUBLIC_DISCORD_INVITE_URL ?? 'https://discord.gg/AWfvmFWBcA';
	const MAX_COMMENT = 1000;

	const REASONS = [
		{ value: 'incorrect_links', label: 'Incorrect word relations' },
		{ value: 'too_easy', label: 'Too easy' },
		{ value: 'too_hard', label: 'Too hard' },
		{ value: 'bad_emoji', label: "Emoji doesn't match the word" },
		{ value: 'inappropriate', label: 'Offensive or inappropriate' },
		{ value: 'other', label: 'Something else' }
	] as const;

	type ReasonValue = (typeof REASONS)[number]['value'];

	let reason = $state<ReasonValue | ''>('');
	let comment = $state('');
	let flaggedEdges = $state<Record<string, boolean>>({});
	let submitting = $state(false);
	let error = $state('');

	const edgeRows = $derived(
		puzzle.edges.map((edge) => ({
			key: `${edge.from}-${edge.to}`,
			from: edge.from,
			to: edge.to,
			wordFrom: puzzle.solution[edge.from],
			wordTo: puzzle.solution[edge.to],
			clue: edge.clue
		}))
	);

	const reasonLabel = $derived(REASONS.find((r) => r.value === reason)?.label ?? '');
	const showEdgeList = $derived(reason === 'incorrect_links');
	const showDiscord = $derived(reason === 'inappropriate' || reason === 'other');

	const canSubmit = $derived.by(() => {
		if (submitting) return false;
		if (sentiment === 'down' && !reason) return false;
		return true;
	});

	function resetState() {
		reason = '';
		comment = '';
		flaggedEdges = {};
		error = '';
		submitting = false;
	}

	$effect(() => {
		if (!open) {
			resetState();
		}
	});

	async function submit() {
		if (!canSubmit) return;
		submitting = true;
		error = '';
		const payload: Record<string, unknown> = {
			storageId,
			sentiment
		};
		if (sentiment === 'down') {
			payload.reason = reason;
			if (comment.trim()) payload.comment = comment.trim().slice(0, MAX_COMMENT);
			if (reason === 'incorrect_links') {
				payload.flaggedEdges = edgeRows
					.filter((row) => flaggedEdges[row.key])
					.map((row) => ({ from: row.from, to: row.to }));
			}
		} else if (comment.trim()) {
			payload.comment = comment.trim().slice(0, MAX_COMMENT);
		}

		try {
			const res = await fetch('/api/feedback', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(payload)
			});
			if (!res.ok) {
				const body = (await res.json().catch(() => ({}))) as { error?: string };
				throw new Error(body.error ?? `HTTP ${res.status}`);
			}
			open = false;
			toast.success('Thanks — feedback sent.', {
				description: 'We check feedback from time to time.'
			});
		} catch (err) {
			error = err instanceof Error ? err.message : 'Something went wrong.';
			submitting = false;
		}
	}

	function copyDiscord() {
		if (typeof navigator === 'undefined' || !navigator.clipboard) return;
		navigator.clipboard.writeText(DISCORD_URL).then(
			() => toast.success('Copied Discord link'),
			() => {
				// ignore clipboard errors
			}
		);
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-h-[90dvh] overflow-y-auto sm:max-w-[520px]">
		<Dialog.Header>
			<Dialog.Title>
				{sentiment === 'up' ? 'Glad you liked it' : 'Report a problem'}
			</Dialog.Title>
			<Dialog.Description>
				{sentiment === 'up'
					? 'Anything you want to add? Totally optional.'
					: "Tell us what's wrong. We check feedback from time to time."}
			</Dialog.Description>
		</Dialog.Header>

		<div class="grid gap-4 py-2">
			{#if sentiment === 'down'}
				<div class="grid gap-2">
					<Label for="feedback-reason">What's wrong?</Label>
					<Select.Root type="single" bind:value={reason as string}>
						<Select.Trigger id="feedback-reason" class="w-full">
							{reasonLabel || 'Select a reason…'}
						</Select.Trigger>
						<Select.Content>
							{#each REASONS as r (r.value)}
								<Select.Item value={r.value}>{r.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			{/if}

			{#if showEdgeList}
				<div class="grid gap-2">
					<Label>Which links are wrong? Tick all that apply.</Label>
					<div class="grid max-h-64 gap-2 overflow-y-auto rounded-md border border-border p-3">
						{#each edgeRows as row (row.key)}
							<label
								class="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-accent/40"
							>
								<Checkbox
									checked={flaggedEdges[row.key] ?? false}
									onCheckedChange={(v) => (flaggedEdges[row.key] = v === true)}
									class="mt-0.5"
								/>
								<span class="grid gap-1 text-sm leading-tight">
									<span class="font-medium">
										{row.wordFrom.emoji ?? ''} {row.wordFrom.word}
										<span class="text-muted-foreground">—</span>
										{row.wordTo.emoji ?? ''} {row.wordTo.word}
									</span>
									<span class="text-xs text-muted-foreground">"{row.clue}"</span>
								</span>
							</label>
						{/each}
					</div>
				</div>
			{/if}

			{#if showDiscord}
				<div class="grid gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm">
					<p class="text-muted-foreground">
						For bugs, ideas, or a longer chat, join us on Discord:
					</p>
					<div class="flex items-center gap-2">
						<code class="flex-1 truncate rounded bg-background px-2 py-1 text-xs">
							{DISCORD_URL}
						</code>
						<Button type="button" variant="outline" size="sm" onclick={copyDiscord}>
							Copy
						</Button>
						<Button
							type="button"
							variant="outline"
							size="sm"
							href={DISCORD_URL}
							target="_blank"
							rel="noopener noreferrer"
						>
							Open <ExternalLinkIcon class="ml-1 size-3" />
						</Button>
					</div>
				</div>
			{/if}

			<div class="grid gap-2">
				<Label for="feedback-comment">
					{sentiment === 'up' ? 'Comment (optional)' : 'Anything to add? (optional)'}
				</Label>
				<Textarea
					id="feedback-comment"
					bind:value={comment}
					maxlength={MAX_COMMENT}
					rows={3}
					placeholder={sentiment === 'up' ? 'What worked?' : 'More detail helps.'}
				/>
				<div class="text-right text-xs text-muted-foreground">
					{comment.length} / {MAX_COMMENT}
				</div>
			</div>

			{#if error}
				<p class="text-sm text-destructive">Couldn't send feedback: {error}</p>
			{/if}
		</div>

		<Dialog.Footer>
			<Button type="button" variant="ghost" onclick={() => (open = false)}>Cancel</Button>
			<Button type="button" onclick={submit} disabled={!canSubmit}>
				{submitting ? 'Sending…' : 'Send feedback'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
