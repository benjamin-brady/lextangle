import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

type Tier = 'A' | 'B' | 'C';
type Relation = { type: string; tier: Tier; source: string };

type Candidate = {
  id: string;
  solution: Array<{ word: string }>;
  edges: Array<{ from: number; to: number; type?: string; tier?: Tier }>;
};

const banned = new Set([
  'guest',
  'book',
  'club',
  'gate',
  'keeper',
  'shop',
  'house',
  'pet',
  'food',
  'tea',
  'tree',
  'party',
  'line',
  'power',
  'plant',
  'board',
  'room',
  'box',
  'key',
  'bell',
  'chain'
]);

const excluded = new Set([
  'ball', 'bone', 'brush', 'bottle', 'bus', 'cab', 'coach', 'delivery', 'driver', 'flower',
  'garden', 'head', 'holder', 'hose', 'pin', 'pot', 'rack', 'rail', 'route', 'seat', 'spin',
  'stand', 'station', 'stop', 'stone', 'tail', 'taxi', 'team', 'track', 'train', 'truck', 'water', 'work'
]);

const gridAdj: [number, number][] = [
  [0, 1], [1, 2],
  [3, 4], [4, 5],
  [6, 7], [7, 8],
  [0, 3], [3, 6],
  [1, 4], [4, 7],
  [2, 5], [5, 8]
];

const nonAdj: [number, number][] = [];
for (let left = 0; left < 9; left++) {
  for (let right = left + 1; right < 9; right++) {
    if (!gridAdj.some(([a, b]) => (a === left && b === right) || (a === right && b === left))) {
      nonAdj.push([left, right]);
    }
  }
}

const rank: Record<Tier, number> = { A: 3, B: 2, C: 1 };
const relations = new Map<string, Map<string, Relation>>();

function addRelation(leftRaw: string, rightRaw: string, type: string, tier: Tier, source: string) {
  const left = leftRaw.trim().toLowerCase();
  const right = rightRaw.trim().toLowerCase();

  if (!left || !right || left === right || banned.has(left) || banned.has(right) || excluded.has(left) || excluded.has(right)) {
    return;
  }

  if (!relations.has(left)) relations.set(left, new Map());
  if (!relations.has(right)) relations.set(right, new Map());

  const current = relations.get(left)!.get(right);
  if (!current || rank[tier] > rank[current.tier]) {
    const relation = { type, tier, source };
    relations.get(left)!.set(right, relation);
    relations.get(right)!.set(left, relation);
  }
}

function loadDiagnosticPairs() {
  const path = '/tmp/puzzle-diag.ts';
  if (!existsSync(path)) return;
  const text = readFileSync(path, 'utf8');
  for (const match of text.matchAll(/\["([^"]+)","([^"]+)","([^"]+)","([ABC])"\]/g)) {
    const type = match[3]
      .replace(/^compound$/, 'compound-phrase')
      .replace(/^material$/, 'material-made-of')
      .replace(/^sequence$/, 'sequence-state-change')
      .replace(/^location$/, 'location-habitat');
    addRelation(match[1], match[2], type, match[4] as Tier, 'diag');
  }
}

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (entry.isFile() && entry.name.endsWith('.json') && entry.name.startsWith('candidate')) {
      files.push(full);
    }
  }
  return files;
}

function loadCandidatePairs() {
  const root = '/Users/benbrady/Documents/simicle/.agent-workspace/puzzles';
  for (const file of walk(root)) {
    try {
      const candidate = JSON.parse(readFileSync(file, 'utf8')) as Candidate;
      if (!candidate.solution || !candidate.edges) continue;
      for (const edge of candidate.edges) {
        if (!edge.type || !edge.tier) continue;
        const left = candidate.solution[edge.from]?.word;
        const right = candidate.solution[edge.to]?.word;
        if (!left || !right) continue;
        addRelation(left, right, edge.type, edge.tier, file);
      }
    } catch {
      // ignore malformed scratch files
    }
  }
}

loadDiagnosticPairs();
loadCandidatePairs();

const words = [...relations.keys()];
const degree = new Map(words.map((word) => [word, relations.get(word)!.size]));
const posOrder = [4, 1, 3, 5, 7, 0, 2, 6, 8];

function edgeRelation(assign: string[], left: number, right: number) {
  return relations.get(assign[left])?.get(assign[right]);
}

function offGrid(assign: string[]) {
  const offA: Array<[string, string, Relation]> = [];
  const offB: Array<[string, string, Relation]> = [];

  for (const [left, right] of nonAdj) {
    const a = assign[left];
    const b = assign[right];
    const relation = relations.get(a)?.get(b);
    if (!relation) continue;
    if (relation.tier === 'A') offA.push([a, b, relation]);
    if (relation.tier === 'B') offB.push([a, b, relation]);
  }

  return { offA, offB };
}

function partialValid(assign: Array<string | null>) {
  for (const [left, right] of gridAdj) {
    const a = assign[left];
    const b = assign[right];
    if (a && b && !relations.get(a)?.get(b)) return false;
  }

  const filled = assign.map((word) => word ?? '');
  const { offA, offB } = offGrid(filled as string[]);
  return offA.length === 0 && offB.length <= 2;
}

function chooseCandidates(position: number, assign: Array<string | null>, used: Set<string>) {
  const neighborPositions = gridAdj
    .filter(([left, right]) => left === position || right === position)
    .map(([left, right]) => (left === position ? right : left));
  const required = neighborPositions
    .map((neighbor) => assign[neighbor])
    .filter((word): word is string => Boolean(word));

  let pool = words;
  if (required.length > 0) {
    pool = [...relations.get(required[0])!.keys()];
    for (let index = 1; index < required.length; index++) {
      const next = new Set(relations.get(required[index])!.keys());
      pool = pool.filter((word) => next.has(word));
    }
  }

  return pool
    .filter((word) => !used.has(word))
    .sort((left, right) => (degree.get(left)! - degree.get(right)!) || left.localeCompare(right));
}

function stats(assign: string[]) {
  let A = 0;
  let B = 0;
  let C = 0;
  const types = new Set<string>();
  const perWordA = new Map(assign.map((word) => [word, 0]));

  for (const [left, right] of gridAdj) {
    const relation = edgeRelation(assign, left, right)!;
    types.add(relation.type);
    if (relation.tier === 'A') {
      A++;
      perWordA.set(assign[left], perWordA.get(assign[left])! + 1);
      perWordA.set(assign[right], perWordA.get(assign[right])! + 1);
    } else if (relation.tier === 'B') {
      B++;
    } else {
      C++;
    }
  }

  const { offA, offB } = offGrid(assign);
  return { A, B, C, types: [...types], offA, offB, perWordA };
}

const results: Array<{
  words: string[];
  A: number;
  B: number;
  C: number;
  types: string[];
  offB: Array<[string, string, Relation]>;
}> = [];

function search(index: number, assign: Array<string | null>, used: Set<string>) {
  if (results.length >= 200) return;

  if (index === posOrder.length) {
    const board = [...(assign as string[])];
    const summary = stats(board);
    if (summary.A < 6 || summary.C > 2 || summary.types.length < 3) return;
    if ([...summary.perWordA.values()].some((count) => count === 0)) return;
    if (summary.offA.length !== 0 || summary.offB.length > 2) return;
    if (board.some((word) => degree.get(word)! >= 15)) return;
    results.push({ words: board, A: summary.A, B: summary.B, C: summary.C, types: summary.types, offB: summary.offB });
    return;
  }

  const position = posOrder[index];
  const candidates = chooseCandidates(position, assign, used);

  for (const word of candidates) {
    assign[position] = word;
    used.add(word);
    if (partialValid(assign)) {
      search(index + 1, assign, used);
    }
    used.delete(word);
    assign[position] = null;
  }
}

search(0, Array(9).fill(null), new Set());

results.sort((left, right) => {
  if (left.offB.length !== right.offB.length) return left.offB.length - right.offB.length;
  if (right.A !== left.A) return right.A - left.A;
  if (right.types.length !== left.types.length) return right.types.length - left.types.length;
  return left.words.join(',').localeCompare(right.words.join(','));
});

for (const result of results.slice(0, 40)) {
  console.log(JSON.stringify(result));
}
console.log(`FOUND ${results.length}`);
