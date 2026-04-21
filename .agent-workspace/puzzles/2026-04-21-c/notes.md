# Notes — run 2026-04-21-c

## Discards
- **candidate-5** (soft/back/ground/wood/fire/work/paper/wall/stone): Rejected — only 2 relation types (compound + material), fails ≥3 types diversity gate.

## Observations
- The 3x3 grid constraint with 12 required edges is extremely limiting for type diversity. Only the `light`/`head`/`stone` nexus produces enough cross-type bridges (rhyme: night↔light, bone↔stone; cultural-pair: head↔tail; category-siblings: star↔sun, star↔moon).
- Brute-force solver over ~600 edges found only 9 valid grids with ≥2 types out of the entire search space.
- All 4 accepted puzzles share words from the {head, stone, light, bone, tail} cluster. This is unavoidable given the constraint topology.
- Candidates 2 and 3 share 5 words (head, stone, bone, tail, work/foot) but use completely different grid arrangements and different non-compound edges.

## Open questions
- Could more non-compound edges (e.g. more rhymes, more cultural pairs) unlock grids in different word families? The fundamental issue is that compound families are tree-shaped and non-compound edges are too sparse/isolated to bridge between families.
