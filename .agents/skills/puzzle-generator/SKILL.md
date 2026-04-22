---
name: puzzle-generator
description: Generate Lextangle emoji puzzles and 3x3 word-link grids. Use when asked to create, draft, expand, review, or add standard or hard puzzles with word relationships such as common phrases, compounds, containment, rhyme, homophone, slang, secondary meanings, category links, or other explainable word associations.
---

# Puzzle Generator

Use this skill when working on Lextangle puzzle generation for this repository.

The goal is to produce a 3x3 puzzle with:

- 9 words
- 12 valid horizontal and vertical links
- 1 short explanation per link
- 1 clear emoji per word
- Every edge classified by relation type
- No junk edges

## Repo Model

This repo stores puzzles in [../../../src/lib/puzzles.ts](../../../src/lib/puzzles.ts).

The data model is defined in [../../../src/lib/types.ts](../../../src/lib/types.ts):

- `solution`: 9 `WordItem`s in row-major grid order
- `edges`: 12 adjacent links with `from`, `to`, and `clue`
- `WordItem` can include `emoji`

Emoji are normally applied centrally via the `WORD_EMOJIS` map in [../../../src/lib/puzzles.ts](../../../src/lib/puzzles.ts). Inline `emoji` on a `WordItem` is only required when the word is not in that map, or when you want to override the map for one board. The file uses 2-space indentation — match it when inserting puzzles.

Grid adjacency is fixed:

```text
0 - 1 - 2
|   |   |
3 - 4 - 5
|   |   |
6 - 7 - 8
```

Every puzzle must define all 12 horizontal and vertical links.

---

## Relation Taxonomy

Classify each edge with a primary relation type from this taxonomy. You may note a secondary type when two cleanly apply; the primary type is the official classification. If no type fits, the edge is junk — reject it.

### Precedence When Types Overlap

- Compound/Phrase beats everything. If `x y` or `y x` is a real compound, that is the primary type even when the pair is also Object-Role or Part-Whole.
- Material/Made-Of beats Sequence/State-Change for the same pair (ice/water, grape/wine).
- Part-Whole beats Object-Role when the part is literally a component, not just associated.
- Cultural Pair beats Category Siblings when a fixed duo exists (salt + pepper is cultural, not just "both seasonings").
- Homophone beats Rhyme when the sounds are identical.

### A-Tier: Strongest Relations

These are immediately obvious to players. Prefer these. Every board needs at least 6 A-tier edges.

#### 1. Compound / Phrase
`x y` or `y x` is a recognized compound word or common phrase.

- `tea` + `party` → tea party
- `watch` + `dog` → watchdog
- `ice` + `cream` → ice cream
- `green` + `house` → greenhouse
- `sun` + `flower` → sunflower

**Test:** Would a dictionary or common usage list this compound? If you have to argue for it, it fails.

#### 2. Object–Role / Goes-With
`x` naturally belongs to, is worn by, is part of, or is used with `y`.

- `king` → `crown` (kings wear crowns)
- `car` → `trunk` (cars have trunks)
- `watch` → `band` (watches have bands)
- `pen` → `ink` (pens use ink)

**Test:** If you showed someone X, would they immediately think of Y as something X has/uses/wears?

#### 3. Part–Whole
`x` is a component or section of `y`, or `y` contains `x` as a part.

- `wheel` → `car`
- `petal` → `flower`
- `chapter` → `book`
- `brick` → `wall`

**Test:** "A Y has an X" or "X is part of a Y" sounds natural.

#### 4. Material / Made-Of
`x` is made from `y`, or `y` is composed of `x`.

- `bird` → `feathers` (birds are made of feathers)
- `ice` → `water` (ice is frozen water)
- `bread` → `flour` (bread is made from flour)
- `glass` → `sand` (glass is made from sand)
- `wine` → `grape` (wine is made from grapes)

**Test:** "X is made of/from Y" is a true, commonly known fact.

#### 5. Tool–Action / Performer–Output
`x` is the tool or performer, `y` is what it does or produces (or vice versa).

- `hammer` → `nail`
- `brush` → `paint`
- `baker` → `bread`
- `painter` → `painting`
- `camera` → `photo`

**Test:** "X is used for Y" or "X makes Y" is immediately clear.

#### 6. Cause–Effect
`x` causes, produces, or leads to `y`.

- `rain` → `flood`
- `spark` → `fire`
- `storm` → `thunder`
- `fire` → `smoke`

**Test:** "X causes Y" or "X leads to Y" is a known, direct relationship.

#### 7. Cultural Pair / Idiom
`x` and `y` are an iconic pair, proverb duo, or fixed idiom.

- `salt` + `pepper`
- `thunder` + `lightning`
- `Romeo` + `Juliet`
- `trial` + `error`
- `lock` + `key`
- `needle` + `haystack`

**Test:** Saying X almost automatically makes someone think of Y.

### B-Tier: Good Secondary Relations

Useful for variety. No more than 4 B-tier edges per board.

#### 8. Category Siblings
Both `x` and `y` belong to the same well-defined category.

- `running` + `swimming` (both sports)
- `oak` + `elm` (both trees)
- `Mars` + `Venus` (both planets)
- `piano` + `guitar` (both instruments)

**Test:** You can name the shared category in one word. "Both are ___." If the category is vague ("both are things", "both are nouns"), it fails.

#### 9. Rhyme
`x` and `y` rhyme clearly.

- `clock` / `sock`
- `cat` / `hat`
- `moon` / `spoon`
- `cake` / `lake`

**Test:** They rhyme. Obviously. Near-rhymes only if very close (e.g. `love` / `dove`).

#### 10. Homophone
`x` and `y` sound the same but are spelled differently.

- `tail` / `tale`
- `night` / `knight`
- `flour` / `flower`
- `bare` / `bear`

**Test:** Pronounced identically or near-identically.

#### 11. Anagram
The letters of `x` rearrange to spell `y`.

- `listen` ↔ `silent`
- `race` ↔ `care`
- `earth` ↔ `heart`
- `dusty` ↔ `study`

**Test:** Same letters, different order. Must be exact.

#### 12. Opposite / Antonym
`x` is the clear opposite or counterpart of `y`.

- `hot` / `cold`
- `night` / `day`
- `question` / `answer`
- `buyer` / `seller`

**Test:** A thesaurus would list them as antonyms.

#### 13. Sequence / Progression / State Change
`x` becomes `y` through a natural process, or they are adjacent steps.

- `egg` → `chicken`
- `seed` → `tree`
- `water` → `ice` (freezing)
- `grape` → `wine` (fermentation)
- `caterpillar` → `butterfly`

**Test:** There is a known, nameable process that turns X into Y.

#### 14. Containment / Hidden Word
`x` is literally inside the spelling of `y`, or a compound of `x` + another word contains `y`.

- `greenhouse` contains `green`
- `fireman` contains `fire`
- `seahorse` contains `horse`
- `carpet` contains `car` and `pet`

**Test:** You can point to the letters.

#### 15. Location / Habitat
`x` lives in, is found at, or is associated with place `y`.

- `fish` → `ocean`
- `bear` → `forest`
- `camel` → `desert`
- `penguin` → `ice`

**Test:** "Where do you find X?" → "Y" is immediate.

#### 16. Collective Noun / Group
`x` is the collective noun for a group of `y`.

- `pride` → `lions`
- `murder` → `crows`
- `flock` → `birds`
- `pack` → `wolves`

**Test:** "A X of Y" is the standard collective form.

### C-Tier: Use Sparingly

Maximum 2 C-tier edges per board. These must be supported by very clear clues.

#### 17. Double Meaning / Polysemy
`x` has a secondary meaning that links to `y` in a non-obvious way.

- `bank` (river) / `bank` (money)
- `bat` (animal) / `bat` (cricket)
- `watch` → `guard` (verb sense overlap)
- `shade` → `insult`

**Test:** The secondary meaning is in common dictionaries, not slang dictionaries.

#### 18. Slang / Informal
`x` is slang, nickname, or informal shorthand for `y`.

- `wheels` → `car`
- `threads` → `clothes`
- `digits` → `phone number`
- `tea` → `gossip`

**Test:** Most English speakers would recognize the slang usage without explanation.

#### 19. Symbol / Represents
`x` symbolically represents `y` in widespread culture.

- `dove` → `peace`
- `crown` → `royalty`
- `skull` → `danger`
- `heart` → `love`

**Test:** The symbolism is globally recognized, not niche.

### REJECTED: Not Valid Relation Types

These are NOT acceptable as edge justifications:

- **Loose thematic association:** "beach" / "summer" — too vague
- **Multi-step trivia chains:** "Mercury → messenger → wings" — requires hops
- **"Both are nouns" / "Both can be adjectives":** — not a relationship
- **Private slang / niche fandom:** — audience won't know it
- **Vibes-based connections:** "they feel related" — not a relation
- **Reputation/metaphor-only:** "elephants have good memory", "dogs are loyal" — not a typed relation unless it is also a cultural pair or compound.

---

## Hard Reject Rules

An edge is **junk** and must be discarded if ANY of these are true:

1. **Can't classify it.** If it doesn't fit cleanly into one taxonomy type, it's out.
2. **Multi-sentence explanation.** If justifying the link takes more than one sentence, it's too weak.
3. **Hedging language.** If the clue needs "could be seen as", "in a way", "loosely", "sort of" — it's out.
4. **Multi-hop reasoning.** If you need A→B→C to explain why A links to C — it's out.
5. **Requires obscure knowledge.** If < 80% of English speakers would get it — it's out.
6. **Generic connector.** If either word could link to 5+ other words on the same board equally well — the word is too generic.
7. **Reverse test failure.** Show someone the two words and the clue. Could they distinguish this pair from a random pairing? If no — it's out.
8. **Third-word dependency.** Two forms, both rejected:
   - Clue text: the clue names or implies a third word from the board (e.g. clueing `Tree` + `Party` via "party line" uses `Line`).
   - Underlying phrase: the compound or idiom requires a word not in the pair (e.g. `Tea` + `Tree` via "tea tree oil" needs `oil`).
9. **Endpoint mismatch.** The clue must describe `x` plus `y`, not `x` plus `z` where `z` is a different word on the board. Before finalizing, restate the two endpoint words and re-read the clue.
10. **Reverse-compound hedge.** A clue that asks the solver to rotate, reverse, or mentally manipulate the compound is out. Own the direction or replace the edge.
11. **Clue opacity (including hard mode).** The clue must let a reasonable solver reconstruct the pair after reveal without external guessing. Poetic imagery that replaces both endpoints is out.

---

## Board-Level Quality Gates

A complete puzzle must pass ALL of these before it's accepted:

1. **Minimum 3 distinct relation types** across the 12 edges.
2. **Diversity floor, not a ceiling.** A board may be heavy in one relation type (e.g. 10+ Compound/Phrase edges) as long as at least 2 other relation types also appear. A pure single-type board is a reject.
3. **At least 6 A-tier edges.**
4. **No more than 2 C-tier edges.**
5. **Every word participates in at least 1 A-tier edge.**
6. **No word connects plausibly to more than 4 other words** in the set (intended + unintended).
7. **No plausible alternate solution** — swapping 2-3 words should not produce an equally convincing board.
8. **The board has anchors** — at least 2 A-tier edges that a casual solver can identify in under 10 seconds. Compound/Phrase and Cultural Pair are the typical anchors; Part-Whole (wheel/car) and Object-Role (king/crown) also qualify when the pair is iconic.
9. **Blind pair audit passes** — if you ignore the intended grid and inspect only the 9 words, there are no off-grid A-tier pairs and at most 2 off-grid B-tier pairs.

Note: 6 A-tier + 4 B-tier + 2 C-tier = 12 exactly. The math is tight. If a puzzle has 6 A, 5 B, 1 C, that's still valid (at most 6 of one type, at most 2 C-tier). Aim for 7-8 A-tier if possible — it leaves room to drop a weak edge during review.

---

## Hard Puzzle Guidance

Hard puzzles may lean more on B and C-tier relations, but they still need to feel fair after the reveal.

Hard puzzle allowances:

- Up to 4 C-tier edges (instead of 2)
- Minimum 4 A-tier edges (instead of 6)
- May use common double meanings, figurative senses, idioms, and slang
- Words can link through different parts of speech

Hard puzzle constraints:

- Prefer common alternate meanings, not dictionary archaeology.
- Prefer sayings and idioms that are widely recognizable, not regional.
- A player should be able to say "that is fair" once the clue is shown.
- Do not stack obscurity with ambiguity.
- Hard should come from layered reasoning, not from vague words that fit everywhere.

Hard-mode clue rules (tighter than tier allowances):

- A clue may withhold the compound, but it must still describe at least one of the two endpoint words plausibly.
- A clue may not replace both endpoints with pure imagery.
- A clue may not rely on a different word from the board (the third-word rule applies in hard mode too).
- Meta-clues that say what the pair does *not* mean are fragile and should be avoided.

---

## Anti-Patterns: Examples of Slop

These are real examples of bad edges. Learn to recognize the patterns.

| Words | Why it's junk |
|-------|---------------|
| `storm` + `night` | Loose thematic. Storms happen at any time. |
| `board` + `case` | "Both can be containers"? Barely. Two-hop reasoning. |
| `press` + `suit` | Only works via the niche phrase "press a suit." Most people won't get it. |
| `man` + `power` | Too generic. Man + anything forms a compound. |
| `fire` + `dance` | "Fire dance" exists but is not a common compound. |
| `line` + `life` | "Lifeline" is a compound, but the clue leans on grid position rather than the word pair itself. |
| `board` + `game` vs `board` + `room` vs `board` + `meeting` | `board` connecting three ways on one grid = generic connector. Pick one. |
| `tea` + `tree` via "tea tree oil" | Requires a third word (`oil`) to make the phrase — violates the third-word rule. |
| `Tree` + `Party` clued as "party line can be political or telephone-based" | Endpoint mismatch: the clue is really about `Party` + `Line`, which is a different pair on the board. |
| `House` + `Green` clued as "read the compound backward if needed" | Reversed-compound hedge. Either own the reversal (use "greenhouse" directly) or replace the edge. |

---

## Emoji Rules

One emoji per word. Rules:

- Prefer a direct, obvious emoji for the intended sense.
- For abstract concepts (colors, directions, numbers), prefer neutral symbols: `Green` → `🟩`, not `🌿`.
- Keep emojis distinct within the same board.
- If a word has multiple senses, choose the emoji that supports the intended clue network.
- Two-emoji combinations are allowed for compound concepts: `Seahorse` → `🌊🐴`.
- Do not use more than two emojis per word.
- Do not smuggle extra meaning through the emoji.
- Before inlining, check `WORD_EMOJIS` in [../../../src/lib/puzzles.ts](../../../src/lib/puzzles.ts). If the word is already mapped, omit `emoji` on the `WordItem`. If the emoji needs to change for all boards, update the map.

---

## Workflow: Subagent Generate-Review Loop

When the user asks for puzzles, use a **generate → review → fix** loop with subagents. This produces better puzzles than single-pass generation.

Use the `runSubagent` tool for each step. Run generators in parallel when producing multiple puzzles; run the reviewer as a separate subagent call so it starts with no memory of the generator's reasoning — this is the key to harsh, independent review.

### Pre-flight: Word-Set Viability Check

**Step 0: Seed-pair shared-neighbor filter.** Before expanding to a full 9-word set, pick two anchor words and list at least **3 shared neighbors** — words that form an A-tier edge with BOTH anchors. If you can't list 3, the anchors are incompatible; replace one before going further. This is the cheapest filter and kills dead pairs like `wheel` + `storm` (no overlapping A-tier partners) before any layout work.

Example pass: `fire` + `wheel` share `car`, `works`, `ball`, `engine` → proceed.
Example fail: `wheel` + `storm` share nothing A-tier → pick a new anchor.

**Step 1: Candidate edge list.** Once the anchors pass, grow the set to 9 words. List the candidate pairings you intend to use plus 3–4 alternates, and confirm:

- **Standard boards:** at least 12 A/B-tier candidate edges, no single word appearing in 5+ plausible pairs.
- **Hard boards:** at least 10 A/B-tier candidate edges plus up to 4 C-tier candidates, same generic-connector ceiling.

**Step 2: Blind word-set audit.** Ignore your intended layout, scan the 9 words as an unordered set, and enumerate every plausible A-tier pair plus the strongest B-tier extras. If you find an off-grid A-tier pair, or more than 2 off-grid B-tier pairs, reject the set before grid placement.

You do not need to enumerate all 36 pairs — just enough to judge the generic-connector rule. If the word set can't support the bar, pick new words before grid placement.

> Optional tooling: `src/lib/puzzle-seeding.ts` exposes `sharedNeighbors(a, b)`, `growSeed(anchor)`, and `auditWordSet(words)` against a small curated hub lexicon. Useful for seeding candidates, not a replacement for human review.

### Generating a single puzzle

#### Step 1: Generate (Subagent)

Launch a subagent via `runSubagent` with the prompt:

> Generate a Lextangle puzzle candidate. You are writing a 3x3 word-link grid with 9 words and 12 edges.
>
> GRID LAYOUT:
> ```
> 0 - 1 - 2
> |   |   |
> 3 - 4 - 5
> |   |   |
> 6 - 7 - 8
> ```
>
> RULES:
> 1. Pick 9 concrete, emoji-friendly English words.
> 2. Seed from two anchor words that share at least 3 A-tier neighbors (words that link strongly to both anchors). If you can't name 3 shared neighbors, pick different anchors.
> 3. Before placing: list the pairings you'd actually use plus a few alternates. Confirm no word is a generic connector (appears in 5+ plausible pairs).
> 4. Do a blind word-set audit before locking the grid: enumerate every plausible A-tier pair plus the strongest B-tier extras among the 9 words. If an off-grid A-tier pair appears, or more than 2 off-grid B-tier pairs appear, reject the set.
> 5. Arrange them in the 3x3 grid so every horizontal and vertical adjacency has a strong relationship.
> 6. For EACH of the 12 edges, state:
>    - The two words
>    - The primary relation type from the taxonomy in the skill file (and a secondary if two cleanly apply)
>    - The tier (A, B, or C)
>    - A one-sentence clue that describes the two endpoint words directly — no reference to a third word on the board, no reversed-compound hedges
> 6. After drafting the clues, re-read each one and restate the two endpoint words. If the clue is really about a different pair on the board, rewrite it.
> 7. Before finalizing, hide your own adjacency list and re-solve the word set from scratch. If any non-edge pair is cleaner than the weakest intended edge, reject and rebuild.
> 8. Minimum 6 A-tier edges, max 2 C-tier, at least 3 distinct relation types (minimum 4 A-tier and up to 4 C-tier for hard boards).
> 9. At least 2 anchor edges a casual solver can identify in under 10 seconds.
> 10. Assign one emoji per word.
>
> {Insert any user-specified theme, difficulty, or constraints here.}
>
> Return the puzzle in this exact TypeScript format:
> ```ts
> {
>   solution: [
>     { word: 'Word', emoji: '🎯' },
>     // ... 9 total
>   ],
>   edges: [
>     { from: 0, to: 1, clue: 'Clue text.' },
>     // ... 12 total
>   ]
> }
> ```
>
> Also return a classification table:
> | Edge | Words | Type | Tier | Clue |
> |------|-------|------|------|------|
> | 0→1  | X + Y | compound | A | ... |
> | ...  | ...   | ...  | ... | ... |

#### Step 2: Review (Subagent)

Launch a SEPARATE subagent with the generated puzzle and this prompt:

> You are a puzzle quality reviewer. Your job is to find weak edges and reject junk. Be harsh. Be specific. Do not approve slop.
>
> Review this Lextangle puzzle candidate:
> {paste the puzzle + classification table from Step 1}
>
> Before you trust the intended adjacency list, look only at the 9 words and enumerate the strongest plausible A-tier pairs plus the strongest B-tier extras. If you find an off-grid A-tier pair, or more than 2 off-grid B-tier pairs, the board fails the blind audit.
>
> For EACH of the 12 edges, answer:
> 1. **Restate the two endpoint words** before reading the clue. Then read the clue. Is it really about a different pair on the board? If yes, REJECT.
> 2. Is the stated relation type correct under the taxonomy's precedence rules? If not, what is it really?
> 3. **Structure verdict** (PASS / WEAK / REJECT) against hard reject rules 1–10:
>    - Classifiable into one primary type?
>    - Explained in one sentence without hedging?
>    - Direct (no multi-hop)?
>    - 80%+ of English speakers would get it?
>    - Neither word is a generic connector on this board?
>    - Passes the reverse test?
>    - No third-word dependency (clue text or underlying phrase)?
>    - No reversed-compound hedge?
> 4. **Clue verdict** (PASS / WEAK / REJECT): does the clue describe the two endpoint words correctly and read as fair after reveal? Flag any clue that asks the solver to rotate, reverse, or mentally manipulate a compound.
>
> Then check board-level gates:
> - At least 3 distinct relation types?
> - At least 6 A-tier edges?
> - No more than 2 C-tier?
> - Every word in at least 1 A-tier edge?
> - Any word a generic connector (links to 5+ others plausibly)?
> - Any plausible alternate solution from swapping 2-3 words?
> - Blind pair audit result: any off-grid A-tier pairs? More than 2 off-grid B-tier pairs?
> - At least 2 obvious anchor edges?
>
> Return:
> - A verdict for each edge (PASS / WEAK / REJECT)
> - A list of specific fixes needed
> - An overall verdict: ACCEPT, REVISE (fixable), or REJECT (start over)

#### Step 3: Fix or Regenerate

Based on the review:

- **ACCEPT**: Use the puzzle as-is.
- **CLUE_FIX**: Structure PASSes but one or more clues are flagged. Rewrite only the clue text — do not regenerate the board.
- **REVISE**: Fix the specific edges flagged as WEAK or REJECT. You can do this yourself or launch another subagent to regenerate just the problem areas. Then send back through Step 2.
- **REJECT**: Go back to Step 1 with adjusted constraints.

**Maximum 3 loops.** If a puzzle hasn't converged after 3 generate-review cycles, discard it and start fresh with a different word seed.

### Generating multiple puzzles

When asked for N puzzles, launch N generator subagents in parallel (Step 1). Then review each result (Step 2 — can also be parallelized). Fix individually. This is much faster than sequential generation. Do not skip the blind word-set audit for batch speed; that is exactly how alternate-solution boards slip through.

### Generating hard puzzles

Use the same loop, but adjust the generator prompt constraints:

> Hard puzzle: minimum 4 A-tier edges (instead of 6), up to 4 C-tier edges (instead of 2). Prefer double meanings, idioms, figurative senses, and less obvious compounds. Every edge must still feel fair after reveal.

---

## Output Format

When returning a puzzle candidate for this repo, match the 2-space indentation used in [../../../src/lib/puzzles.ts](../../../src/lib/puzzles.ts). Omit inline `emoji` when the word is already in `WORD_EMOJIS`.

```ts
{
  solution: [
    { word: 'Cab' },
    { word: 'Taxi' },
    { word: 'Stand' },
    { word: 'Truck' },
    { word: 'Driver' },
    { word: 'Bus' },
    { word: 'Delivery' },
    { word: 'Route' },
    { word: 'Stop' }
  ],
  edges: [
    { from: 0, to: 1, clue: 'A taxi cab is the same ride by another name.' },
    { from: 1, to: 2, clue: 'A taxi stand is where cabs queue for fares.' },
    { from: 3, to: 4, clue: 'A truck driver moves freight from depot to depot.' },
    { from: 4, to: 5, clue: 'A bus driver follows the route and the schedule.' },
    { from: 6, to: 7, clue: 'A delivery route strings many stops into one run.' },
    { from: 7, to: 8, clue: 'A route is made up of planned stops.' },
    { from: 0, to: 3, clue: 'The cab is the front section of a truck.' },
    { from: 3, to: 6, clue: 'A delivery truck drops parcels block by block.' },
    { from: 1, to: 4, clue: 'A taxi driver works city streets for hire.' },
    { from: 4, to: 7, clue: 'A driver follows an assigned route through the city.' },
    { from: 2, to: 5, clue: 'A stand gives the bus queue a place to gather.' },
    { from: 5, to: 8, clue: 'A bus stop marks where riders board and exit.' }
  ]
}
```

Example classification table for that puzzle:

| Edge | Words | Type | Tier |
|------|-------|------|------|
| 0→1 | Cab + Taxi | compound/phrase | A |
| 1→2 | Taxi + Stand | compound/phrase | A |
| 3→4 | Truck + Driver | object-role | A |
| 4→5 | Driver + Bus | object-role | A |
| 6→7 | Delivery + Route | compound/phrase | A |
| 7→8 | Route + Stop | part-whole | A |
| 0→3 | Cab + Truck | part-whole | A |
| 3→6 | Truck + Delivery | compound/phrase | A |
| 1→4 | Taxi + Driver | object-role | A |
| 4→7 | Driver + Route | object-role | A |
| 2→5 | Stand + Bus | object-role | A |
| 5→8 | Bus + Stop | compound/phrase | A |

Count: 12 A-tier, 0 B-tier, 0 C-tier. The blind word-set audit should also confirm there are no off-grid A-tier pairs and no overloaded connector words before you copy this structure.

---

## Review Checklist

Before presenting or committing a puzzle, verify:

- [ ] All 12 edges are present.
- [ ] Every edge has been classified with a relation type.
- [ ] No edge was classified as REJECT by the reviewer.
- [ ] Every clue names or directly describes its two endpoint words, not a different pair from the board.
- [ ] No clue depends on a third word from the board (clue text or underlying phrase).
- [ ] No clue asks the solver to rotate, reverse, or mentally manipulate a compound.
- [ ] The board uses at least 3 relation families (diversity floor).
- [ ] At least 6 A-tier edges (4 for hard).
- [ ] No more than 2 C-tier edges (4 for hard).
- [ ] The board has 2+ obvious anchor edges.
- [ ] No word is a catch-all connector with too many plausible partners.
- [ ] No plausible alternate arrangement.
- [ ] Blind word-set audit found no off-grid A-tier pair and at most 2 off-grid B-tier pairs.
- [ ] Each word has a suitable emoji.
- [ ] Hard puzzles feel fair after reveal, not obscure.
- [ ] The final result feels like a Lextangle puzzle, not a random word web.

---

## If Editing The Repo

If the user asks to add the puzzle directly:

- Edit [../../../src/lib/puzzles.ts](../../../src/lib/puzzles.ts).
- Preserve 2-space indentation and the centralized emoji pattern.
- New words should either be added to `WORD_EMOJIS` in that file or carry inline `emoji` on the `WordItem`.
- Do not include inline `emoji` for words already in `WORD_EMOJIS`.
- Run `bun run check` after editing.
