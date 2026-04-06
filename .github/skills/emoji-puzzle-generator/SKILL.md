---
name: emoji-puzzle-generator
description: Generate LexLink emoji puzzles and 3x3 word-link grids. Use when asked to create, draft, expand, review, or add puzzles with word relationships such as common phrases, compounds, containment, rhyme, homophone, derivation, slang, category links, or other explainable word associations.
---

# Emoji Puzzle Generator

Use this skill when working on LexLink puzzle generation for this repository.

The goal is to produce a 3x3 puzzle with:

- 9 words
- 12 valid horizontal and vertical links
- 1 short explanation per link
- 1 clear emoji per word

## Repo Model

This repo stores puzzles in [src/lib/puzzles.ts](src/lib/puzzles.ts).

The data model is defined in [src/lib/types.ts](src/lib/types.ts):

- `solution`: 9 `WordItem`s in row-major grid order
- `edges`: 12 adjacent links with `from`, `to`, and `clue`
- `WordItem` can include `emoji`

Grid adjacency is fixed:

```text
0 - 1 - 2
|   |   |
3 - 4 - 5
|   |   |
6 - 7 - 8
```

Every puzzle must define all 12 horizontal and vertical links.

## Relation Taxonomy

Before generating a puzzle, classify each candidate edge by the kind of relation it uses. Strong puzzles mix a few relation types, but each individual edge should have one dominant explanation.

### Strongest relation families

These are usually easiest for players to validate after the reveal.

1. `x y` is a common phrase or compound

- `tea` + `party` -> `tea party`
- `tree` + `house` -> `tree house`
- `memory` + `card` -> `memory card`
- `dog` + `house` -> `doghouse`

2. `x` is used for `y`, belongs to `y`, or naturally goes with `y`

- `king` -> `crown`
- `car` -> `trunk`
- `watch` -> `band`
- `bench` -> `seat`

3. `x` is a type of `y`, member of `y`, or category example of `y`

- `owl` -> `bird`
- `emerald` -> `gem`
- `poodle` -> `dog`
- `tea` -> `drink`

4. `x` causes, produces, uses, or affects `y`

- `storm` -> `thunder`
- `plant` -> `food`
- `fire` -> `alarm`
- `drill` -> `hole`

### Good secondary relation families

These are useful, but should be supported by clear clues and not dominate the whole board.

5. `x` contains `y`, starts with `y`, ends with `y`, or hides `y`

- `greenhouse` contains `green`
- `fireman` contains `fire`
- `toothbrush` starts with `tooth`
- `seahorse` ends with `horse`

6. `x` is made from `y`, derived from `y`, or is a converted form of `y`

- `wooden` from `wood`
- `singer` from `sing`
- `runner` from `run`
- `childhood` from `child`

7. `x` and `y` are sound-linked

- rhyme: `clock` / `sock`
- homophone: `tail` / `tale`
- near-homophone: only if the clue can justify it cleanly

8. `x` is slang, nickname, abbreviation, or informal label for `y`

- `wheels` -> `car`
- `threads` -> `clothes`
- `phone` -> `cell`
- `math` -> `mathematics`

9. `x` is the opposite, counterpart, or paired role of `y`

- `question` / `answer`
- `lock` / `key`
- `buyer` / `seller`
- `night` / `day`

10. `x` and `y` are linked by a common title, proverb, idiom, or cultural phrase

- `beauty` / `beast`
- `salt` / `pepper`
- `thunder` / `lightning`
- `trial` / `error`

### Riskier relation families

Use these sparingly. They can work, but they become flimsy quickly.

11. Loose thematic association

- `beach` / `summer`
- `school` / `pencil`

12. Multi-step trivia or knowledge chains

- `Mercury` -> `messenger` -> `wings`

13. Private slang, niche fandom references, or region-specific shorthand

- only use if the target audience would reliably know it

## Quality Bar For Relations

Each edge should pass these checks:

- The relation can be explained in one sentence.
- A reasonable player would accept the explanation immediately after reveal.
- The clue identifies one main relationship, not two or three stacked together.
- The edge does not depend on obscure trivia unless the whole puzzle intentionally does.
- The edge would still make sense if shown on its own outside the grid.

Prefer this order of confidence:

1. Common phrase or compound
2. Natural object-role or use relationship
3. Category-member or type-of link
4. Clear derivation, containment, or sound relation
5. Slang or cultural expression
6. Loose thematic association

## Puzzle Composition Rules

When generating a candidate puzzle:

1. Start from a seed set of 9 concrete, emoji-friendly words.
2. Ensure every word participates in at least 2 strong links.
3. Ensure the whole 3x3 grid covers all 12 adjacencies with valid clues.
4. Mix relation types so the board is varied, but do not make the logic feel random.
5. Prefer everyday vocabulary over obscure terms.
6. Avoid duplicate words, near-duplicates, or trivial inflections unless they are the point.
7. Avoid a board where too many edges are just “both are in the same general topic.”
8. Avoid clues that are riddles. Clues are post-solve explanations.

## Emoji Rules

LexLink displays an emoji for each word. Generate one emoji per word with these rules:

- Prefer a direct, obvious emoji for the intended sense of the word.
- Keep emojis distinct within the same board where possible.
- If a word has multiple senses, choose the emoji that supports the intended clue network.
- Prefer concrete nouns and concepts that have recognizable emoji support.
- If no single emoji exists, you may use a two-emoji combination for compound or complex concepts.
- Keep two-emoji combinations literal and easy to parse, not cryptic.
- Do not use more than two emojis for one word unless the user explicitly asks for looser emoji interpretation.
- If no good single emoji or two-emoji combination exists, use the clearest approximate symbol rather than something clever but confusing.

Examples:

- `Tea` -> `🍵`
- `King` -> `🤴`
- `Watch` -> `⌚`
- `Plant` -> `🪴`
- `Storm` -> `⛈️`
- `Seahorse` -> `🌊🐴`

## Workflow

When the user asks for a new puzzle, follow this process:

1. Propose a short concept or seed cluster.
2. List the intended relation type for each edge candidate.
3. Reject weak edges before locking the grid.
4. Arrange the 9 words into a 3x3 so each of the 12 adjacencies is valid.
5. Write short, natural-language clues for all 12 edges.
6. Assign emojis to all 9 words.
7. Check whether the puzzle feels fair, varied, and non-redundant.
8. If asked to add it to the app, format it for `src/lib/puzzles.ts`.

## Output Format

When returning a puzzle candidate for this repo, prefer this shape:

```ts
{
	solution: [
		{ word: 'Tea', emoji: '🍵' },
		{ word: 'Party', emoji: '🎉' },
		{ word: 'Floor', emoji: '🪩' },
		{ word: 'Tree', emoji: '🌳' },
		{ word: 'Line', emoji: '➖' },
		{ word: 'Dance', emoji: '💃' },
		{ word: 'Top', emoji: '🔝' },
		{ word: 'Up', emoji: '⬆️' },
		{ word: 'Step', emoji: '👣' }
	],
	edges: [
		{ from: 0, to: 1, clue: 'A tea party can be genteel or chaotic.' },
		{ from: 1, to: 2, clue: 'The party floor is where the crowd collects.' },
		{ from: 3, to: 4, clue: 'A tree line marks the last timber standing.' },
		{ from: 4, to: 5, clue: 'A line dance keeps everyone facing the same way.' },
		{ from: 6, to: 7, clue: 'Top up the balance and carry on.' },
		{ from: 7, to: 8, clue: 'Step up when it matters.' },
		{ from: 0, to: 3, clue: 'Tea tree oil is the scented answer.' },
		{ from: 3, to: 6, clue: 'A treetop is where the wind gets first say.' },
		{ from: 1, to: 4, clue: 'A party line can be a script or a wire.' },
		{ from: 4, to: 7, clue: 'Line up and wait your turn.' },
		{ from: 2, to: 5, clue: 'A dance floor fills before the song finishes.' },
		{ from: 5, to: 8, clue: 'A dance step is learned one beat at a time.' }
	]
}
```

## Review Checklist

Before presenting or committing a puzzle, verify:

- All 12 edges are present.
- Every clue matches the exact words in its two endpoints.
- No clue accidentally depends on a third word elsewhere in the board.
- The board uses at least 2 relation families.
- The board has a few easy anchors and a few satisfying reveals.
- Each word has a suitable emoji.
- The final result feels like a LexLink puzzle, not a random word web.

## If Editing The Repo

If the user asks to add the puzzle directly:

- Edit [src/lib/puzzles.ts](src/lib/puzzles.ts).
- Preserve the existing puzzle object style.
- Include inline `emoji` values on new words when that is the clearest option.
- Run `bun run check` after editing.