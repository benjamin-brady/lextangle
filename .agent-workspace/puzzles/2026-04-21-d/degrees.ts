import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

type Tier = 'A' | 'B' | 'C';
const banned = new Set([
  'guest','book','club','gate','keeper','shop','house','pet','food','tea','tree','party','line','power','plant','board','room','box','key','bell','chain'
]);
const rank: Record<Tier, number> = { A: 3, B: 2, C: 1 };
const relations = new Map<string, Map<string, { type: string; tier: Tier }>>();

function addRelation(leftRaw: string, rightRaw: string, type: string, tier: Tier) {
  const left = leftRaw.trim().toLowerCase();
  const right = rightRaw.trim().toLowerCase();
  if (!left || !right || left === right || banned.has(left) || banned.has(right)) return;
  if (!relations.has(left)) relations.set(left, new Map());
  if (!relations.has(right)) relations.set(right, new Map());
  const current = relations.get(left)!.get(right);
  if (!current || rank[tier] > rank[current.tier]) {
    relations.get(left)!.set(right, { type, tier });
    relations.get(right)!.set(left, { type, tier });
  }
}

if (existsSync('/tmp/puzzle-diag.ts')) {
  const text = readFileSync('/tmp/puzzle-diag.ts', 'utf8');
  for (const match of text.matchAll(/\["([^"]+)","([^"]+)","([^"]+)","([ABC])"\]/g)) {
    addRelation(match[1], match[2], match[3], match[4] as Tier);
  }
}

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.isFile() && entry.name.startsWith('candidate') && entry.name.endsWith('.json')) files.push(full);
  }
  return files;
}

for (const file of walk('/Users/benbrady/Documents/simicle/.agent-workspace/puzzles')) {
  try {
    const candidate = JSON.parse(readFileSync(file, 'utf8'));
    if (!candidate.solution || !candidate.edges) continue;
    for (const edge of candidate.edges) {
      if (!edge.type || !edge.tier) continue;
      const left = candidate.solution[edge.from]?.word;
      const right = candidate.solution[edge.to]?.word;
      if (!left || !right) continue;
      addRelation(left, right, edge.type, edge.tier);
    }
  } catch {}
}

const entries = [...relations.entries()]
  .map(([word, map]) => ({ word, degree: map.size, edges: [...map.entries()].map(([other, rel]) => `${other}:${rel.type}/${rel.tier}`).sort() }))
  .filter((entry) => entry.degree >= 2 && entry.degree <= 6)
  .sort((a, b) => a.degree - b.degree || a.word.localeCompare(b.word));

for (const entry of entries) {
  console.log(`${entry.word} (${entry.degree}) => ${entry.edges.join(', ')}`);
}
