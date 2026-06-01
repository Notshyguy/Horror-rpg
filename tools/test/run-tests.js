// Minimal dependency-free test runner for the pure engine logic. Runs in Node.
// Usage: node tools/test/run-tests.js   (or: npm test)

import { LightsOut } from "../../web/src/engine/LightsOut.js";
import { JewelShelves } from "../../web/src/engine/JewelShelves.js";
import { DogMatch, TREAT } from "../../web/src/engine/DogMatch.js";
import { GameState, calculateStars } from "../../web/src/engine/GameState.js";
import { SaveManager } from "../../web/src/engine/SaveManager.js";
import { generateLevel, generateLevelSet, makeRng } from "../../web/src/engine/levelGenerator.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`      ${err.message}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

function eq(a, b, msg) {
  if (a !== b) throw new Error(`${msg || "expected equality"}: ${a} !== ${b}`);
}

const lo = new LightsOut();

console.log("\nLightsOut mechanic");

test("createSolvedState is solved and all-zero", () => {
  const s = lo.createSolvedState({ size: 5 });
  assert(lo.isSolved(s), "fresh board should be solved");
  eq(s.size, 5, "size");
  eq(s.states, 2, "default states");
});

test("applyMove toggles cell + orthogonal neighbours (not diagonals)", () => {
  let s = lo.createSolvedState({ size: 3 });
  s = lo.applyMove(s, { x: 1, y: 1 });
  // center + up/down/left/right on, corners off
  eq(s.grid[1][1], 1, "center");
  eq(s.grid[0][1], 1, "up");
  eq(s.grid[2][1], 1, "down");
  eq(s.grid[1][0], 1, "left");
  eq(s.grid[1][2], 1, "right");
  eq(s.grid[0][0], 0, "corner stays off");
});

test("applyMove does not mutate the input state", () => {
  const s = lo.createSolvedState({ size: 3 });
  const before = JSON.stringify(s);
  lo.applyMove(s, { x: 0, y: 0 });
  eq(JSON.stringify(s), before, "input must be unchanged");
});

test("pressing the same cell twice returns to start (mod 2)", () => {
  let s = lo.createSolvedState({ size: 4 });
  s = lo.applyMove(s, { x: 2, y: 1 });
  s = lo.applyMove(s, { x: 2, y: 1 });
  assert(lo.isSolved(s), "double press should be a no-op");
});

test("solver returns a valid solution that turns everything off", () => {
  // scramble deterministically
  const rng = makeRng(42);
  let s = lo.createSolvedState({ size: 5 });
  const moves = lo.legalMoves(s);
  for (let i = 0; i < 12; i++) s = lo.applyMove(s, moves[Math.floor(rng() * moves.length)]);

  const sol = lo.solve(s);
  assert(sol !== null, "should find a solution");
  let check = s;
  for (const mv of sol) check = lo.applyMove(check, mv);
  assert(lo.isSolved(check), "applying the solution must solve the board");
});

test("solver is minimal on a single known press", () => {
  // One press from solved => optimal solution is exactly that one press.
  let s = lo.createSolvedState({ size: 5 });
  s = lo.applyMove(s, { x: 2, y: 2 });
  const sol = lo.solve(s);
  eq(sol.length, 1, "single press should solve in 1 move");
  eq(sol[0].x, 2, "x");
  eq(sol[0].y, 2, "y");
});

test("solver finds minimum across the null space (5x5 quiet patterns)", () => {
  // The 5x5 grid has a 2-dimensional null space; the naive particular solution
  // is often not minimal. Verify solver never returns more presses than a
  // brute-forced minimum for a small scramble.
  const rng = makeRng(7);
  let s = lo.createSolvedState({ size: 5 });
  const moves = lo.legalMoves(s);
  for (let i = 0; i < 3; i++) s = lo.applyMove(s, moves[Math.floor(rng() * moves.length)]);
  const sol = lo.solve(s);
  assert(sol.length <= 3, `expected <= 3 presses, got ${sol.length}`);
});

console.log("\nGameState");

test("playing the solver's moves wins and scores 3 stars", () => {
  const rng = makeRng(99);
  let s = lo.createSolvedState({ size: 4 });
  const moves = lo.legalMoves(s);
  for (let i = 0; i < 8; i++) s = lo.applyMove(s, moves[Math.floor(rng() * moves.length)]);
  const optimal = lo.solve(s).length;

  const level = {
    id: 1,
    mechanic: "lights_out",
    size: 4,
    states: 2,
    grid: s.grid,
    optimal,
    moves: optimal + 5,
  };
  const game = new GameState(level);
  const sol = game.mechanic.solve(game.state);
  let result;
  for (const mv of sol) result = game.play(mv);
  assert(result.solved, "should be solved");
  assert(game.won, "won flag");
  eq(game.movesUsed, optimal, "used optimal moves");
});

test("running out of moves triggers failure", () => {
  let s = lo.createSolvedState({ size: 3 });
  s = lo.applyMove(s, { x: 0, y: 0 });
  s = lo.applyMove(s, { x: 2, y: 2 });
  const level = { id: 1, mechanic: "lights_out", size: 3, states: 2, grid: s.grid, optimal: 2, moves: 1 };
  const game = new GameState(level);
  // play a wrong/insufficient move to exhaust the single-move limit
  const res = game.play({ x: 1, y: 1 });
  assert(game.finished, "should be finished");
  assert(!game.won, "should not be won");
  assert(res.failed, "failed result");
});

test("calculateStars thresholds", () => {
  eq(calculateStars(5, 4, 10), 3, "optimal+1 => 3 stars");
  eq(calculateStars(7, 4, 10), 2, "<=75% limit => 2 stars");
  eq(calculateStars(9, 4, 10), 1, "completed => 1 star");
});

console.log("\nSaveManager");

test("completeLevel keeps the best stars and fewest moves", () => {
  const save = new SaveManager(null); // in-memory
  save.completeLevel(3, 1, 12);
  save.completeLevel(3, 3, 8);
  save.completeLevel(3, 2, 15);
  const rec = save.getLevelRecord(3);
  eq(rec.stars, 3, "best stars retained");
  eq(rec.best_moves, 8, "fewest moves retained");
  eq(save.totalStars(), 3, "total stars");
});

test("unlock gating follows previous level", () => {
  const save = new SaveManager(null);
  assert(save.isUnlocked(1), "level 1 always unlocked");
  assert(!save.isUnlocked(2), "level 2 locked until 1 cleared");
  save.completeLevel(1, 1, 5);
  assert(save.isUnlocked(2), "level 2 unlocked after 1");
});

console.log("\nLevel generator");

test("generateLevel always produces a solvable board", () => {
  const rng = makeRng(123);
  for (let i = 0; i < 20; i++) {
    const lvl = generateLevel({ mechanicId: "lights_out", size: 5, scramble: 10, rng });
    assert(lvl, "should generate a level");
    assert(lvl.optimal >= 1, "optimal >= 1");
    // confirm the recorded optimal actually solves it
    const sol = lo.solve({ mechanic: "lights_out", size: lvl.size, states: lvl.states, grid: lvl.grid });
    eq(sol.length, lvl.optimal, "recorded optimal matches solver");
  }
});

test("generateLevelSet produces sequential ids and fair move limits", () => {
  const set = generateLevelSet({ seed: 5 });
  assert(set.length > 100, `expected a full set, got ${set.length}`);
  for (let i = 0; i < set.length; i++) {
    eq(set[i].id, i + 1, "sequential id");
    assert(set[i].moves > set[i].optimal, "limit must exceed optimal");
  }
});

console.log("\nJewelShelves mechanic");

const js = new JewelShelves();

test("three adjacent identical jewels clear on landing", () => {
  // [0,0] + dragging a 0 onto it makes [0,0,0] -> clears to empty
  const state = js.stateFromLevel({ colors: 5, capacity: 6, shelves: [[0, 0], [0], []] });
  const after = js.applyMove(state, { from: 1, to: 0 });
  eq(after.shelves[0].length, 0, "run of 3 should clear shelf 0");
  assert(js.isSolved(after), "board should be solved");
});

test("applyMove moves the rightmost jewel and does not mutate input", () => {
  const state = js.stateFromLevel({ colors: 5, capacity: 6, shelves: [[1, 2], [3], []] });
  const before = JSON.stringify(state);
  const after = js.applyMove(state, { from: 0, to: 2 });
  eq(JSON.stringify(state), before, "input unchanged");
  eq(after.shelves[2][0], 2, "rightmost jewel (2) moved to shelf 2");
  eq(after.shelves[0].length, 1, "source lost one jewel");
});

test("non-matching move just relocates (no clear)", () => {
  const state = js.stateFromLevel({ colors: 5, capacity: 6, shelves: [[0, 1], [2], []] });
  const after = js.applyMove(state, { from: 1, to: 2 });
  eq(after.shelves[2].length, 1, "jewel relocated");
  assert(!js.isSolved(after), "not solved");
});

test("clearing cascades when survivors form a new run", () => {
  // shelf: [1,1,0] ; drop 0 -> [1,1,0,0] no clear yet; drop another 0 ->
  // [1,1,0,0,0] clears the three 0s -> [1,1]; then drop 1 -> [1,1,1] clears.
  let state = js.stateFromLevel({ colors: 5, capacity: 8, shelves: [[1, 1, 0], [0], [0], [1]] });
  state = js.applyMove(state, { from: 1, to: 0 }); // [1,1,0,0]
  state = js.applyMove(state, { from: 2, to: 0 }); // [1,1,0,0,0] -> [1,1]
  eq(state.shelves[0].join(","), "1,1", "zeros cleared, ones remain");
  state = js.applyMove(state, { from: 3, to: 0 }); // [1,1,1] -> clears
  eq(state.shelves[0].length, 0, "ones cleared after cascade");
});

test("solver solves the tutorial layout in one move", () => {
  const state = js.stateFromLevel({ colors: 5, capacity: 6, shelves: [[0, 0], [0], []] });
  const sol = js.solve(state);
  assert(sol, "should find a solution");
  eq(sol.length, 1, "tutorial is one move");
});

test("solver result actually solves the board", () => {
  const state = js.stateFromLevel({ colors: 5, capacity: 7, shelves: [[0, 1, 0], [1, 0, 1], []] });
  const sol = js.solve(state);
  assert(sol, "should find a solution");
  let s = state;
  for (const mv of sol) s = js.applyMove(s, mv);
  assert(js.isSolved(s), "applying the solution clears all shelves");
});

test("GameState drives a JewelShelves win and scores stars", () => {
  const level = {
    mechanic: "jewel_shelves",
    id: 1,
    colors: 5,
    capacity: 6,
    optimal: 1,
    moves: 3,
    shelves: [[0, 0], [0], []],
  };
  const game = new GameState(level);
  const res = game.play({ from: 1, to: 0 });
  assert(res.solved, "should solve");
  assert(game.won, "won flag");
  eq(game.movesUsed, 1, "one move used");
});

console.log("\nJewel level data");

test("all committed jewel levels are solvable with the recorded optimal", () => {
  const path = fileURLToPath(new URL("../../web/levels/jewels.json", import.meta.url));
  const levels = JSON.parse(readFileSync(path, "utf8"));
  eq(levels.length, 5, "exactly 5 jewel levels");
  for (const lvl of levels) {
    const state = js.stateFromLevel(lvl);
    const sol = js.solve(state);
    assert(sol, `level ${lvl.id} must be solvable`);
    eq(sol.length, lvl.optimal, `level ${lvl.id} optimal matches solver`);
    assert(lvl.moves >= lvl.optimal, `level ${lvl.id} limit >= optimal`);
  }
});

console.log("\nDogMatch mechanic");

const dm = new DogMatch();

// Helper: build a raw state with an explicit grid (bypassing seeded init) so we
// can test rules deterministically. breeds/rows/cols inferred from the grid.
function dogState(grid, { target = 999, treatChance = 0 } = {}) {
  const rows = grid.length;
  const cols = grid[0].length;
  let breeds = 0;
  for (const row of grid) for (const v of row) if (v !== TREAT && v + 1 > breeds) breeds = v + 1;
  return {
    mechanic: "dog_match",
    rows,
    cols,
    breeds: Math.max(breeds, 3),
    treatChance,
    target,
    cleared: 0,
    seed: 12345,
    grid: grid.map((r) => [...r]),
  };
}

test("a swap that creates a 3-in-a-row is legal and clears dogs", () => {
  // Top row is [1,1,0]; swapping (x=2,y=0)=0 with (x=2,y=1)=1 makes the top row
  // 1,1,1 -> a horizontal match.
  const board = dogState([
    [1, 1, 0],
    [2, 0, 1],
    [0, 2, 2],
  ]);
  const after = dm.applyMove(board, { from: { x: 2, y: 0 }, to: { x: 2, y: 1 } });
  assert(after !== board, "swap should be legal (creates a match)");
  assert(after.cleared >= 3, "should clear at least the 3 matched dogs");
});

test("a swap that creates no match is rejected (same state reference)", () => {
  const board = dogState([
    [0, 1, 2],
    [1, 2, 0],
    [2, 0, 1],
  ]);
  const after = dm.applyMove(board, { from: { x: 0, y: 0 }, to: { x: 1, y: 0 } });
  eq(after, board, "illegal swap returns the same state reference");
});

test("a treat is wild: completes a match from the middle", () => {
  // Row0: breed1, TREAT, breed1 — the treat fills the middle to make 1,T,1.
  const matches = dm._findMatches(
    [
      [1, TREAT, 1],
      [0, 2, 0],
      [2, 0, 2],
    ],
    3,
    3
  );
  assert(matches.size >= 3, "treat in the middle should complete a 3-run");
});

test("pure treats with no real dog do NOT match", () => {
  // Treat row is isolated: no column places two same-breed dogs under a treat.
  const matches = dm._findMatches(
    [
      [TREAT, TREAT, TREAT],
      [0, 1, 2],
      [1, 2, 0],
    ],
    3,
    3
  );
  eq(matches.size, 0, "a run of only treats is not a match");
});

test("a matched treat detonates its 8 neighbours (bomb)", () => {
  // Make a horizontal 1,T,1 match on the top row; the treat at (1,0) should also
  // clear neighbours at row 1 (0,1),(1,1),(2,1).
  const next = dogState([
    [1, TREAT, 1],
    [3, 3, 3], // distinct breed so we can see them get bombed (also a match itself)
    [0, 2, 0],
  ]);
  // Trigger resolution via a no-op-safe path: call _resolve directly.
  const before = JSON.stringify(next.grid);
  const cleared = dm._resolve(next);
  assert(cleared > 0, "some dogs cleared");
  assert(JSON.stringify(next.grid) !== before, "grid changed after resolve");
  // After resolution the board is refilled and stable (no immediate matches).
  eq(dm._findMatches(next.grid, next.rows, next.cols).size, 0, "board stable after resolve");
});

test("stateFromLevel builds a stable, playable board from a seed", () => {
  const level = { rows: 7, cols: 7, breeds: 5, treatChance: 0.05, target: 30, seed: 42 };
  const state = dm.stateFromLevel(level);
  eq(state.rows, 7, "rows");
  eq(dm._findMatches(state.grid, 7, 7).size, 0, "no pre-made matches on a fresh board");
  assert(dm.legalMoves(state).length > 0, "fresh board has at least one legal move");
});

test("seeded board is deterministic (same seed -> same grid)", () => {
  const level = { rows: 6, cols: 6, breeds: 4, treatChance: 0.05, target: 20, seed: 777 };
  const a = dm.stateFromLevel(level);
  const b = dm.stateFromLevel(level);
  eq(JSON.stringify(a.grid), JSON.stringify(b.grid), "identical seeds produce identical boards");
});

test("isSolved triggers when cleared reaches target; stars by efficiency", () => {
  const state = dogState([[0, 1, 2], [1, 2, 0], [2, 0, 1]], { target: 5 });
  state.cleared = 5;
  assert(dm.isSolved(state), "solved when cleared >= target");
  eq(dm.starsForWin(5, { moves: 10 }), 3, "fast win (<=60%) => 3 stars");
  eq(dm.starsForWin(8, { moves: 10 }), 2, "mid win (<=85%) => 2 stars");
  eq(dm.starsForWin(10, { moves: 10 }), 1, "last-moment win => 1 star");
});

console.log("\nDog level data");

test("all committed dog levels are winnable by the greedy player", () => {
  const path = fileURLToPath(new URL("../../web/levels/dogs.json", import.meta.url));
  const levels = JSON.parse(readFileSync(path, "utf8"));
  eq(levels.length, 10, "exactly 10 dog levels");
  for (const lvl of levels) {
    let state = dm.stateFromLevel(lvl);
    let stalls = 0;
    for (let m = 0; m < lvl.moves && !dm.isSolved(state); m++) {
      const best = dm._bestMove(state);
      if (!best) break;
      const after = dm.applyMove(state, best);
      if (after === state) {
        if (++stalls > 2) break;
        continue;
      }
      state = after;
      stalls = 0;
    }
    assert(dm.isSolved(state), `level ${lvl.id} must be winnable (got ${state.cleared}/${lvl.target})`);
  }
});

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
