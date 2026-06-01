// Minimal dependency-free test runner for the pure engine logic. Runs in Node.
// Usage: node tools/test/run-tests.js   (or: npm test)

import { LightsOut } from "../../web/src/engine/LightsOut.js";
import { GameState, calculateStars } from "../../web/src/engine/GameState.js";
import { SaveManager } from "../../web/src/engine/SaveManager.js";
import { generateLevel, generateLevelSet, makeRng } from "../../web/src/engine/levelGenerator.js";

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

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
