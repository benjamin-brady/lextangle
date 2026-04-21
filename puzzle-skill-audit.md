# Puzzle Skill Audit

Evaluated: 2026-04-21

Rubric source: `.agents/skills/puzzle-generator/SKILL.md`

Catalog scope: the live daily, practice, and hard-practice puzzles currently served from `src/lib/puzzles.ts` via `src/lib/server/puzzles.ts`.

## Executive Summary

No live puzzle strictly passes the current skill rubric.

The biggest blocker is the board-level gate that says no single relation type may appear on more than 6 of the 12 edges. Most of the current boards are built as compound or phrase chains, so they fail the rubric even when the boards are otherwise playable.

After that, the most common secondary failures are:

- clues that depend on a third word or hidden compound
- obscure or aging references such as `Watergate`, `party line`, and `tea tree oil`
- generic connector words such as `Line`, `Party`, and `House`
- vague or poetic hard-mode clues that make boards feel opaque rather than fair

## Totals

| Catalog | Puzzles | Strict pass | Closest revise | Clear fail | Soft score |
| --- | ---: | ---: | ---: | ---: | ---: |
| Standard | 12 | 0 | 8 | 4 | 67/100 |
| Hard | 5 | 0 | 3 | 2 | 52/100 |
| Total | 17 | 0 | 11 | 6 | 63/100 |

`Strict pass` means the board appears to satisfy the literal skill gates.

`Closest revise` means the board has a workable spine but still fails one or more rubric gates.

`Clear fail` means the board has multiple hard-reject edges or misses major board-level gates.

## Standard Puzzles

| # | Words | Strict pass? | Closest call | Main blockers |
| --- | --- | --- | --- | --- |
| 1 | King, Crown, Tooth, Fairy, Tale, Tail, Coat, Pocket, Watch | No | Clear fail | Multiple hard rejects; multi-hop clues; fewer than 6 convincing A-tier edges. |
| 2 | Car, Trunk, Elephant, Race, Suit, Memory, Track, Case, Card | No | Clear fail | Suit, memory, track, and case links are too weak; falls short on clean A-tier count. |
| 3 | Tower, Guard, Dog, Clock, Night, Watch, Hand, Owl, Band | No | Clear fail | Obscure owl edges; third-word dependence; several edges fail the 80 percent familiarity test. |
| 4 | Fire, Alarm, Button, Drill, Press, Box, Vice, Bench, Seat | No | Closest revise | Good workshop spine, but compound count is too concentrated and `press box`, `button box`, and `box seat` are weak or niche. |
| 5 | Skin, Boil, Water, Drum, Roll, Tide, Stick, Thunder, Storm | No | Closest revise | Best clue diversity in the standard set, but `thunderstick` is too obscure and a few links are looser than the rubric allows. |
| 6 | Tea, Green, Power, Tree, House, Plant, Line, Party, Food | No | Closest revise | Too many compound links; `green power` is thematic rather than exact; `party line` leans on dated telecom knowledge. |
| 7 | Tea, Party, Floor, Tree, Line, Dance, Top, Up, Step | No | Closest revise | Strong surface grid, but over-indexed on phrase edges; `tea tree oil` and `party line` violate the no-third-word or obscurity intent. |
| 8 | Tower, Power, Horse, Water, Plant, Food, Gate, House, Dog | No | Closest revise | One of the strongest boards, but still fails the relation-distribution gate and leans on `Watergate` knowledge. |
| 9 | Man, Foot, Locker, Snow, Ball, Room, Board, Game, Escape | No | Closest revise | Extremely coherent, but almost the entire board is compound-only, so it fails the max-6-per-type gate. |
| 10 | Sea, Life, Style, Coast, Line, Dance, Clear, Up, Step | No | Closest revise | Compound-heavy; `clear up` is more phrasal verb than clean relation; `coast is clear` depends on a missing third word. |
| 11 | Watch, Night, Sleeper, Dog, Guard, Rail, Sea, Coast, Line | No | Closest revise | Very strong board, but still compound-heavy and `sea dog` is niche enough to be a weak point under the rubric. |
| 12 | Tea, Tree, Line, House, Party, Food, Green, Room, Service | No | Clear fail | Misaligned `Tree -> Party` clue, meta `Greenhouse` clue, and heavy compound concentration. |

## Hard Puzzles

| # | Words | Strict pass? | Closest call | Main blockers |
| --- | --- | --- | --- | --- |
| 1 | Tea, Party, Floor, Tree, Line, Dance, Top, Up, Step | No | Closest revise | Difficulty comes from opaque clue wording; still too phrase-heavy; `tea tree` and `party line` remain soft spots. |
| 2 | Tower, Power, Horse, Water, Plant, Food, Gate, House, Dog | No | Closest revise | Closest hard board to usable, but it still fails the relation-distribution gate and leans on `Watergate`. |
| 3 | Sea, Life, Style, Coast, Line, Dance, Clear, Up, Step | No | Clear fail | `Only proceed once this idiom is true` depends on a third word; several clues are too abstract to classify cleanly. |
| 4 | Watch, Night, Sleeper, Dog, Guard, Rail, Sea, Coast, Line | No | Closest revise | Strong structure, but clue opacity is doing too much work and the board still leans too hard on compound phrases. |
| 5 | Tea, Tree, Line, House, Party, Food, Green, Room, Service | No | Clear fail | Meta backward clue, weak `Tree -> Party` logic, and multiple obscure or indirect clue dependencies. |

## Repeated Rubric Failures

| Failure pattern | Where it shows up most |
| --- | --- |
| More than 6 edges of the same relation type | Most boards, especially 6 through 12 in the standard set and all 5 hard boards |
| Clue depends on a third word or hidden phrase | Standard 7, 10, 12; Hard 1, 3, 5 |
| Obscure or aging reference | Standard 3, 5, 6, 8, 11; Hard 2, 4, 5 |
| Generic connector word | Boards built around `Line`, `Party`, or `House` |
| Hard mode uses opacity instead of fair layered reasoning | Hard 1, 3, 4, 5 |

## Practical Read

If the skill is applied literally, the current live catalog needs a broad rewrite rather than spot fixes.

If the aim is only to improve play quality without enforcing every gate, the closest boards to salvage first are:

1. Standard 8: Tower, Power, Horse, Water, Plant, Food, Gate, House, Dog
2. Standard 11: Watch, Night, Sleeper, Dog, Guard, Rail, Sea, Coast, Line
3. Standard 9: Man, Foot, Locker, Snow, Ball, Room, Board, Game, Escape
4. Hard 2: Tower, Power, Horse, Water, Plant, Food, Gate, House, Dog
5. Hard 4: Watch, Night, Sleeper, Dog, Guard, Rail, Sea, Coast, Line