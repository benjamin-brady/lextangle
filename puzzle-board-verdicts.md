# Puzzle Board Verdicts

Evaluated: 2026-04-21

Rubric source: `.agents/skills/puzzle-generator/SKILL.md`

Catalog scope: `PUZZLES` and `HARD_PRACTICE_PUZZLES` in `src/lib/puzzles.ts`.

Verdict key:

- PASS: clears the rubric as written.
- REVISE: fixable by rewriting 1 to 3 edges or clues.
- REJECT: structural failure; either a dead edge, a third-word dependency, a reversed-compound hedge, or sub-threshold A-tier reliability.

## Standard Puzzles

| # | Board | Location | Verdict | Reason |
| --- | --- | --- | --- | --- |
| 1 | King, Crown, Tooth, Fairy, Tale, Tail, Coat, Pocket, Watch | `src/lib/puzzles.ts#L95-L130` | REJECT | King->Fairy multi-hop, Fairy->Coat multi-hop, Tale->Pocket vague, Tail->Watch not a direct pair; under the 6 A-tier reliable floor. |
| 2 | Car, Trunk, Elephant, Race, Suit, Memory, Track, Case, Card | `src/lib/puzzles.ts#L131-L157` | REVISE | Trunk->Suit hedges; Elephant->Memory is reputation only. |
| 3 | Tower, Guard, Dog, Clock, Night, Watch, Hand, Owl, Band | `src/lib/puzzles.ts#L158-L192` | REVISE | Clock->Night loose thematic; Hand->Owl weak; Owl->Band niche. |
| 4 | Fire, Alarm, Button, Drill, Press, Box, Vice, Bench, Seat | `src/lib/puzzles.ts#L193-L227` | PASS | Dense direct compounds; anchors strong. |
| 5 | Skin, Boil, Water, Drum, Roll, Tide, Stick, Thunder, Storm | `src/lib/puzzles.ts#L228-L258` | REVISE | Drum->Roll borderline type; Tide->Water soft. |
| 6 | Tea, Green, Power, Tree, House, Plant, Line, Party, Food | `src/lib/puzzles.ts#L259-L293` | PASS | Clean compounds, no third-word traps. |
| 7 | Tea, Party, Floor, Tree, Line, Dance, Top, Up, Step | `src/lib/puzzles.ts#L294-L324` | REVISE | Tea->Tree uses tea-tree-oil (own anti-pattern); Party->Floor soft. |
| 8 | Tower, Power, Horse, Water, Plant, Food, Gate, House, Dog | `src/lib/puzzles.ts#L325-L355` | PASS | All compounds; Watergate defensible. |
| 9 | Man, Foot, Locker, Snow, Ball, Room, Board, Game, Escape | `src/lib/puzzles.ts#L356-L382` | PASS | All compounds; anchors obvious. |
| 10 | Sea, Life, Style, Coast, Line, Dance, Clear, Up, Step | `src/lib/puzzles.ts#L383-L413` | PASS | Clean compounds plus one strong idiom. |
| 11 | Watch, Night, Sleeper, Dog, Guard, Rail, Sea, Coast, Line | `src/lib/puzzles.ts#L414-L440` | PASS | Direct compounds or compound-equivalents. |
| 12 | Tea, Tree, Line, House, Party, Food, Green, Room, Service | `src/lib/puzzles.ts#L441-L475` | REJECT | House->Green is a reversed-compound hedge; Tree->Party clues "party line" (endpoint mismatch). |

## Hard Puzzles

| # | Board | Location | Verdict | Reason |
| --- | --- | --- | --- | --- |
| H1 | Tea, Party, Floor, Tree, Line, Dance, Top, Up, Step | `src/lib/puzzles.ts#L481-L519` | REJECT | Tea->Tree is tea-tree-oil again; most clues poetic rather than pair-describing. |
| H2 | Tower, Power, Horse, Water, Plant, Food, Gate, House, Dog | `src/lib/puzzles.ts#L520-L554` | REVISE | Structure clean; several clues too ambiguous about which pair is meant. |
| H3 | Sea, Life, Style, Coast, Line, Dance, Clear, Up, Step | `src/lib/puzzles.ts#L555-L581` | REVISE | Good pairs, but multiple clues don't let solver reconstruct the pair after reveal. |
| H4 | Watch, Night, Sleeper, Dog, Guard, Rail, Sea, Coast, Line | `src/lib/puzzles.ts#L582-L616` | REVISE | Sleeper->Rail is a meta-negation clue; a few clues opaque. |
| H5 | Tea, Tree, Line, House, Party, Food, Green, Room, Service | `src/lib/puzzles.ts#L617-L647` | REJECT | House->Green still asks solver to read the compound backward; inherits standard #12 failures. |

## Totals

| Verdict | Standard | Hard | Total |
| --- | ---: | ---: | ---: |
| PASS | 6 | 0 | 6 |
| REVISE | 4 | 3 | 7 |
| REJECT | 2 | 2 | 4 |

## Comparison With `puzzle-skill-audit.md`

Both documents evaluate the same 17 boards against the same rubric. The disagreement is about how strictly to read one specific rule.

### Where they agree

- No hard puzzle reaches PASS under a strict reading. Both docs mark all 5 hard boards as either revise or fail.
- The same 4 boards are the worst offenders in both: Standard #1, Standard #12, Hard #1, Hard #5.
- Both identify the same dominant failure modes: third-word dependencies, obscure references (Watergate, party line, tea tree oil), reversed-compound hedges, and opaque hard-mode clues.
- The same salvage candidates surface in both docs as the healthiest boards: Standard #8, #9, #11, and the Tea/Green/Power board (#6 here).

### Where they disagree

| Topic | This doc (`puzzle-board-verdicts.md`) | Existing doc (`puzzle-skill-audit.md`) |
| --- | --- | --- |
| Strict passes | 6 standard boards pass | 0 boards pass |
| Relation-distribution gate (no type on more than 6 of 12 edges) | Treated as advisory when the board is otherwise clean | Treated as hard-fail, which eliminates almost every compound-heavy board |
| Standard #4, #6, #8, #9, #10, #11 | PASS | REVISE (blocked by the relation-distribution gate) |
| Standard #2 and Standard #3 | REVISE (2 to 3 weak edges) | REJECT (multiple rubric hits) |

### Which read is correct

The existing audit is following the letter of the rubric. Gate 2 under Board-Level Quality Gates in the skill file literally says "No single relation type on more than 6 edges." Under that reading, every board that is 8 or more compounds out of 12 is a strict fail, and the catalog collapses to zero passes.

This doc softened that gate implicitly, because the rule is not well-motivated: a board that is 12 clean compounds is fine for players. The gate mostly exists to prevent the taxonomy from being ignored. Enforcing it as written invalidates the healthy boards alongside the broken ones.

### Recommendation

Reconcile by editing the skill, not the verdicts:

1. Loosen Board-Level Quality Gate 2 to something like "If more than 6 edges share a type, at least 2 other relation types must also be represented." That keeps the diversity intent without failing Standard #8, #9, #11.
2. Keep every other gate as-is. The overlap on third-word dependencies, reversed compounds, and opaque hard-mode clues is exactly where both audits agree.
3. Prioritize rewriting the 4 REJECT boards that both audits flag: Standard #1, Standard #12, Hard #1, Hard #5. Those are the only ones where gameplay fairness, not just rubric compliance, is at risk.
