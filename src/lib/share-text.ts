import type { NodeStatus, Puzzle } from './types';

const STATUS_EMOJI: Record<NodeStatus, string> = {
	correct: '🟩',
	wrong: '🟥',
	empty: '⬜',
	unchecked: '⬜'
};

export interface ShareCheckSummary {
	rows: string[];
	correctLinks: number;
}

export interface CreateShareCheckSummaryOptions {
	nodeStatuses: NodeStatus[];
	correctLinks: number;
}

export interface BuildShareTextOptions {
	puzzle: Puzzle;
	shareLabel: string;
	checks: number;
	correctWords: number;
	correctLinks: number;
	solved: boolean;
	checkHistory: ShareCheckSummary[];
	random?: () => number;
	url?: string;
}

export function createShareCheckSummary({
	nodeStatuses,
	correctLinks
}: CreateShareCheckSummaryOptions): ShareCheckSummary {
	return {
		rows: Array.from({ length: 3 }, (_, rowIndex) =>
			nodeStatuses
				.slice(rowIndex * 3, rowIndex * 3 + 3)
				.map((status) => STATUS_EMOJI[status])
				.join('')
		),
		correctLinks
	};
}

export function buildShareText({
	puzzle,
	shareLabel,
	checks,
	correctWords,
	correctLinks,
	solved,
	checkHistory,
	random = Math.random,
	url
}: BuildShareTextOptions): string {
	const emojiLine = shuffleEmojis(puzzle.solution.map(({ emoji }) => emoji ?? '✨'), random).join('');
	const statusLine = solved
		? `Solved in ${checks} checks`
		: `${correctWords}/9 words, ${correctLinks}/${puzzle.edges.length} links, ${checks} checks`;
	const roundLines = checkHistory.map(formatCheckSummary);
	const lines = [`Lextangle ${shareLabel}: ${emojiLine}`, statusLine, ...roundLines];

	if (url) {
		lines.push(url);
	}

	return lines.join('\n');
}

function formatCheckSummary(summary: ShareCheckSummary): string {
	return `${summary.rows.join(' / ')} ${numberEmoji(summary.correctLinks)}`;
}

function numberEmoji(value: number): string {
	return String(value)
		.split('')
		.map((digit) => `${digit}\uFE0F\u20E3`)
		.join('');
}

function shuffleEmojis(emojis: string[], random: () => number): string[] {
	const shuffled = [...emojis];

	for (let index = shuffled.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(random() * (index + 1));
		[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
	}

	return shuffled;
}
