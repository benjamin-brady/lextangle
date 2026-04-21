import type { LinkVerdict } from './types';

export interface GameState {
  start: string;
  end: string;
  chain: string[];
  verdicts: LinkVerdict[];
  isComplete: boolean;
  isValidating: boolean;
  error: string | null;
}

export function createInitialState(start: string, end: string): GameState {
  return {
    start,
    end,
    chain: [start],
    verdicts: [],
    isComplete: false,
    isValidating: false,
    error: null,
  };
}

export function getScore(chain: string[]): { hops: number; score: number; rating: string } {
  const hops = chain.length - 2; // words between start and end
  if (hops <= 0) return { hops: 0, score: 0, rating: '' };

  const score = Math.floor(1000 / hops);
  let rating: string;
  if (hops === 1) rating = 'Genius';
  else if (hops === 2) rating = 'Brilliant';
  else if (hops <= 4) rating = 'Solid';
  else if (hops <= 7) rating = 'Got There';
  else rating = 'Scenic Route';

  return { hops, score, rating };
}

export async function validateLink(a: string, b: string): Promise<LinkVerdict> {
  const res = await fetch('/api/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ a, b }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Validation failed' }));
    throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<LinkVerdict>;
}
