import type { LinkVerdict } from './types';

/** Persisted shape for chain games (start → end). */
export interface SavedChainGame {
  chain: string[];
  verdicts: LinkVerdict[];
  isComplete: boolean;
}

/** Persisted shape for fibonacci games (A + B → target). */
export interface SavedFibGame {
  chain: string[];
  verdictPairs: [LinkVerdict, LinkVerdict][];
  isComplete: boolean;
}

function storageKey(mode: 'chain' | 'fib', ...words: string[]): string {
  const slug = words.map((w) => w.toLowerCase()).join(':');
  return `lext:game:${mode}:${slug}`;
}

export function saveChainGame(start: string, end: string, data: SavedChainGame): void {
  try {
    localStorage.setItem(storageKey('chain', start, end), JSON.stringify(data));
  } catch { /* quota / SSR */ }
}

export function loadChainGame(start: string, end: string): SavedChainGame | null {
  try {
    const raw = localStorage.getItem(storageKey('chain', start, end));
    if (!raw) return null;
    const d = JSON.parse(raw) as SavedChainGame;
    if (!Array.isArray(d.chain) || !Array.isArray(d.verdicts)) return null;
    return d;
  } catch {
    return null;
  }
}

export function saveFibGame(a: string, b: string, target: string, data: SavedFibGame): void {
  try {
    localStorage.setItem(storageKey('fib', a, b, target), JSON.stringify(data));
  } catch { /* quota / SSR */ }
}

export function loadFibGame(a: string, b: string, target: string): SavedFibGame | null {
  try {
    const raw = localStorage.getItem(storageKey('fib', a, b, target));
    if (!raw) return null;
    const d = JSON.parse(raw) as SavedFibGame;
    if (!Array.isArray(d.chain) || !Array.isArray(d.verdictPairs)) return null;
    return d;
  } catch {
    return null;
  }
}
