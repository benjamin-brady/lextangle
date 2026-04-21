const text = await Bun.file('/tmp/puzzle-diag.ts').text();

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

const gridAdj: [number, number][] = [
  [0, 1], [1, 2],
  [3, 4], [4, 5],
  [6, 7], [7, 8],
  [0, 3], [3, 6],
  [1, 4], [4, 7],
  [2, 5], [5, 8]
];

type Tier = 'A' | 'B' | 'C';
type Relation = { type: string; tier: Tier };

const nonAdj: [number, number][] = [];
for (let i = 0; i < 9; i++) {
  for (let j = i + 1; j < 9; j++) {
    if (!gridAdj.some(([a, b]) => (a === i && b === j) || (a === j && b === i))) {
      nonAdj.push([i, j]);
    }
  }
}

const relations = new Map<string, Map<string, Relation>>();

function addRelation(left: string, right: string, type: string, tier: Tier) {
  if (banned.has(left) || banned.has(right)) {
    return;
  }

  if (!relations.has(left)) {
    relations.set(left, new Map());
  }
  if (!relations.has(right)) {
    relations.set(right, new Map());
  }

  const current = relations.get(left)!.get(right);
  const rank = { A: 3, B: 2, C: 1 };

  if (!current || rank[tier] > rank[current.tier]) {
    relations.get(left)!.set(right, { type, tier });
    relations.get(right)!.set(left, { type, tier });
  }
}

for (const match of text.matchAll(/\["([^"]+)","([^"]+)","([^"]+)","([ABC])"\]/g)) {
  addRelation(match[1].toLowerCase(), match[2].toLowerCase(), match[3], match[4] as Tier);
}

const words = [...relations.keys()];
const degrees = new Map(words.map((word) => [word, relations.get(word)!.size]));
const positions = [4, 1, 3, 5, 7, 0, 2, 6, 8];

function countOffGrid(assign: (string | null)[]) {
  let offA = 0;
  let offB = 0;

  for (const [left, right] of nonAdj) {
    const first = assign[left];
    const second = assign[right];

    if (!first || !second) {
      continue;
    }

    const relation = relations.get(first)?.get(second);
    if (!relation) {
      continue;
    }

    if (relation.tier === 'A') {
      offA++;
    } else if (relation.tier === 'B') {
      offB++;
    }
  }

  return { offA, offB };
}

function partialValid(assign: (string | null)[]) {
  for (const [left, right] of gridAdj) {
    const first = assign[left];
    const second = assign[right];

    if (first && second && !relations.get(first)?.get(second)) {
      return false;
    }
  }

  const { offA, offB } = countOffGrid(assign);
  return offA <= 1 && offB <= 4;
}

function finalStats(assign: string[]) {
  let A = 0;
  let B = 0;
  let C = 0;
  const types = new Set<string>();

  for (const [left, right] of gridAdj) {
    const relation = relations.get(assign[left])!.get(assign[right])!;
    if (relation.tier === 'A') {
      A++;
    } else if (relation.tier === 'B') {
      B++;
    } else {
      C++;
    }
    types.add(relation.type);
  }

  const { offA, offB } = countOffGrid(assign);
  return { A, B, C, offA, offB, types: [...types] };
}

function chooseCandidates(position: number, assign: (string | null)[], used: Set<string>) {
  const neighbors = gridAdj
    .filter(([left, right]) => left === position || right === position)
    .map(([left, right]) => (left === position ? right : left));
  const required = neighbors
    .filter((neighbor) => assign[neighbor])
    .map((neighbor) => assign[neighbor]!) as string[];

  let pool = words;
  if (required.length > 0) {
    pool = [...relations.get(required[0])!.keys()];
    for (let i = 1; i < required.length; i++) {
      const next = new Set(relations.get(required[i])!.keys());
      pool = pool.filter((word) => next.has(word));
    }
  }

  return pool.filter((word) => !used.has(word));
}

const found: Array<{
  assign: string[];
  A: number;
  B: number;
  C: number;
  offA: number;
  offB: number;
  types: string[];
}> = [];

function search(index: number, assign: (string | null)[], used: Set<string>) {
  if (found.length >= 100) {
    return;
  }

  if (index === positions.length) {
    const filled = assign as string[];
    const stats = finalStats(filled);

    if (stats.A < 6 || stats.C > 2 || stats.types.length < 3) {
      return;
    }

    for (let i = 0; i < 9; i++) {
      let hasA = false;
      for (const [left, right] of gridAdj) {
        if ((left === i || right === i) && relations.get(filled[left])!.get(filled[right])!.tier === 'A') {
          hasA = true;
        }
      }
      if (!hasA) {
        return;
      }
    }

    found.push({ assign: filled, ...stats });
    return;
  }

  const position = positions[index];
  const candidates = chooseCandidates(position, assign, used)
    .filter((word) => degrees.get(word)! <= 20)
    .sort((left, right) => degrees.get(left)! - degrees.get(right)!);

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

found.sort((left, right) => {
  if (left.offA !== right.offA) {
    return left.offA - right.offA;
  }
  if (left.offB !== right.offB) {
    return left.offB - right.offB;
  }
  return right.A - left.A;
});

for (const board of found.slice(0, 50)) {
  console.log(JSON.stringify(board));
}

console.log(`FOUND ${found.length}`);