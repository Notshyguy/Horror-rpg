// Generate + validate the Dog Match levels and write web/levels/dogs.json.
//
// For each level spec we:
//   1. Build the seeded board.
//   2. Simulate a GREEDY player (always take the highest-clearing legal swap)
//      under the move limit to measure how many dogs a decent player clears.
//   3. Set `target` to a fraction of that greedy yield, so the level is provably
//      winnable with sensible play (and we record the greedy proof).
//   4. Reject any level the greedy player can't make progress on (loud, non-zero
//      exit), matching the jewel tool's "reject unsolvable loudly" contract.
//
// Determinism: refills use the level seed, so a level always plays identically.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DogMatch } from "../web/src/engine/DogMatch.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dog = new DogMatch();

// 10 levels, ramping board size / breeds / target. `target` = dogs to send home;
// the tool verifies a greedy player reaches it within `moves`. treatChance rises
// a little with difficulty so bombs show up more on harder boards.
const SPECS = [
  { id: 1, difficulty: "tutorial", rows: 6, cols: 6, breeds: 4, treatChance: 0.05, moves: 8, target: 18, seed: 101 },
  { id: 2, difficulty: "easy", rows: 6, cols: 6, breeds: 4, treatChance: 0.05, moves: 9, target: 26, seed: 202 },
  { id: 3, difficulty: "easy", rows: 7, cols: 7, breeds: 4, treatChance: 0.06, moves: 10, target: 34, seed: 303 },
  { id: 4, difficulty: "easy", rows: 7, cols: 7, breeds: 5, treatChance: 0.06, moves: 11, target: 42, seed: 404 },
  { id: 5, difficulty: "medium", rows: 7, cols: 7, breeds: 5, treatChance: 0.06, moves: 12, target: 52, seed: 505 },
  { id: 6, difficulty: "medium", rows: 8, cols: 7, breeds: 5, treatChance: 0.07, moves: 13, target: 62, seed: 606 },
  { id: 7, difficulty: "medium", rows: 8, cols: 8, breeds: 5, treatChance: 0.07, moves: 14, target: 74, seed: 707 },
  { id: 8, difficulty: "hard", rows: 8, cols: 8, breeds: 6, treatChance: 0.07, moves: 15, target: 86, seed: 808 },
  { id: 9, difficulty: "hard", rows: 9, cols: 8, breeds: 6, treatChance: 0.08, moves: 16, target: 100, seed: 909 },
  { id: 10, difficulty: "expert", rows: 9, cols: 8, breeds: 6, treatChance: 0.08, moves: 18, target: 120, seed: 1010 },
];

// Record the greedy player's cumulative dogs-cleared after each successful move.
// The board refills, so a strong player can clear a lot per move; we use this to
// PROVE each fixed target is reachable (a winnability lower bound) and to report
// how much headroom a real, imperfect player has.
function greedyTrajectory(level) {
  let state = dog.stateFromLevel(level);
  const cumulative = [0];
  let stalls = 0;
  for (let m = 0; m < level.moves; m++) {
    const best = dog._bestMove(state);
    if (!best) break;
    const after = dog.applyMove(state, best);
    if (after === state) {
      if (++stalls > 2) break;
      continue;
    }
    state = after;
    stalls = 0;
    cumulative.push(state.cleared);
  }
  return cumulative; // cumulative[k] = dogs cleared after k successful moves
}

const out = [];
let allOk = true;

for (const spec of SPECS) {
  const traj = greedyTrajectory(spec);
  const greedyTotal = traj[traj.length - 1];
  const winsBy = traj.findIndex((c) => c >= spec.target);

  if (winsBy < 0) {
    allOk = false;
    console.error(
      `✗ Level ${spec.id}: target ${spec.target} NOT reachable — greedy cleared only ${greedyTotal} in ${spec.moves} moves. Lower target or raise moves.`
    );
    continue;
  }

  out.push({
    mechanic: "dog_match",
    id: spec.id,
    difficulty: spec.difficulty,
    rows: spec.rows,
    cols: spec.cols,
    breeds: spec.breeds,
    treatChance: spec.treatChance,
    target: spec.target,
    moves: spec.moves,
    seed: spec.seed,
  });

  console.log(
    `✓ Level ${spec.id} (${spec.difficulty}): ${spec.rows}x${spec.cols}, ${spec.breeds} breeds, ` +
      `target ${spec.target} / ${spec.moves} moves (greedy hits target by move ${winsBy}, can clear ~${greedyTotal} total)`
  );
}

if (!allOk) {
  console.error("\nSome levels failed validation. Not writing output.");
  process.exit(1);
}

const outPath = resolve(__dirname, "../web/levels/dogs.json");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
console.log(`\nWrote ${out.length} levels -> ${outPath}`);
