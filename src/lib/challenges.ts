import type { DailyChallenge } from './types';

/**
 * Hand-curated daily challenge pairs.
 * Intentionally far apart / ridiculous combos.
 */
export const DAILY_CHALLENGES: DailyChallenge[] = [
  { start: 'Goat', end: 'Lawyer', date: '2026-04-21' },
  { start: 'Pizza', end: 'Shakespeare', date: '2026-04-22' },
  { start: 'Banana', end: 'Spaceship', date: '2026-04-23' },
  { start: 'Penguin', end: 'Guitar', date: '2026-04-24' },
  { start: 'Umbrella', end: 'Dragon', date: '2026-04-25' },
  { start: 'Sock', end: 'Volcano', date: '2026-04-26' },
  { start: 'Pancake', end: 'Astronaut', date: '2026-04-27' },
];

export function getTodaysChallenge(): DailyChallenge {
  const today = new Date().toISOString().slice(0, 10);
  const match = DAILY_CHALLENGES.find((c) => c.date === today);
  if (match) return match;

  // Fallback: cycle through challenges based on day offset
  const epoch = new Date('2026-04-21').getTime();
  const daysSinceEpoch = Math.floor((Date.now() - epoch) / 86_400_000);
  const idx = ((daysSinceEpoch % DAILY_CHALLENGES.length) + DAILY_CHALLENGES.length) % DAILY_CHALLENGES.length;
  return { ...DAILY_CHALLENGES[idx], date: today };
}
