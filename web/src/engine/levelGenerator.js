// Level generation — mechanic-agnostic.
//
// Strategy: every mechanic can produce an already-solved state and apply moves,
// so we scramble a solved board with random legal moves. The result is ALWAYS
// solvable by construction. We then ask the mechanic's solver for the true
// minimum-move count ("optimal") and reject boards that scrambled back to a
// trivial/degenerate state.

import { getMechanic } from "./mechanics.js";

// Small seedable RNG (mulberry32) so generated level sets are reproducible.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickRandom(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Generate a single solvable level.
 * @param {Object} opts
 * @param {string} opts.mechanicId
 * @param {number} opts.size
 * @param {number} [opts.states]
 * @param {number} opts.scramble  How many random presses to scramble with.
 * @param {number} [opts.minOptimal] Reject if optimal below this (too easy).
 * @param {() => number} [opts.rng]
 * @param {number} [opts.attempts]
 */
export function generateLevel(opts) {
  const mechanic = getMechanic(opts.mechanicId);
  const rng = opts.rng ?? Math.random;
  const minOptimal = opts.minOptimal ?? 1;
  const attempts = opts.attempts ?? 200;

  for (let attempt = 0; attempt < attempts; attempt++) {
    let state = mechanic.createSolvedState({ size: opts.size, states: opts.states });
    const moves = mechanic.legalMoves(state);
    for (let i = 0; i < opts.scramble; i++) {
      state = mechanic.applyMove(state, pickRandom(moves, rng));
    }

    if (mechanic.isSolved(state)) continue; // scrambled back to solved

    const solution = mechanic.solve(state);
    if (!solution) continue;
    const optimal = solution.length;
    if (optimal < minOptimal) continue;

    return {
      mechanic: mechanic.id,
      size: state.size,
      states: state.states,
      optimal,
      grid: state.grid,
    };
  }
  return null;
}

// Difficulty tiers for the Lights Out prototype. `moves` (the player's limit) is
// derived from optimal per level so it stays fair. Mirrors the tier idea from
// the Godot plan, retuned for a toggle puzzle.
export const DEFAULT_TIERS = [
  { label: "tutorial", count: 10, size: 3, scramble: 3, limitMult: 2.5 },
  { label: "easy", count: 40, size: 4, scramble: 6, limitMult: 2.0 },
  { label: "medium", count: 40, size: 5, scramble: 10, limitMult: 1.6 },
  { label: "hard", count: 40, size: 6, scramble: 16, limitMult: 1.4 },
  { label: "expert", count: 20, size: 7, scramble: 24, limitMult: 1.25 },
];

/**
 * Generate a full ordered level set across tiers.
 * @param {Object} [opts]
 * @param {Array} [opts.tiers]
 * @param {string} [opts.mechanicId]
 * @param {number} [opts.seed]
 */
export function generateLevelSet(opts = {}) {
  const tiers = opts.tiers ?? DEFAULT_TIERS;
  const mechanicId = opts.mechanicId;
  const rng = makeRng(opts.seed ?? 1);

  const levels = [];
  let id = 1;
  for (const tier of tiers) {
    let made = 0;
    let guard = 0;
    const seen = new Set();
    while (made < tier.count && guard < tier.count * 50) {
      guard++;
      const lvl = generateLevel({
        mechanicId,
        size: tier.size,
        scramble: tier.scramble,
        minOptimal: Math.max(1, Math.floor(tier.scramble / 2)),
        rng,
      });
      if (!lvl) continue;

      // Dedupe identical boards within a tier.
      const key = JSON.stringify(lvl.grid);
      if (seen.has(key)) continue;
      seen.add(key);

      lvl.id = id++;
      lvl.difficulty = tier.label;
      lvl.moves = Math.max(lvl.optimal + 1, Math.round(lvl.optimal * tier.limitMult));
      levels.push(lvl);
      made++;
    }
  }
  return levels;
}
