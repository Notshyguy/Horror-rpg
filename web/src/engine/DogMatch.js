// DogMatch — a full grid match-3 mechanic.
//
// The board is a rows×cols grid. Each cell holds a DOG breed (0..breeds-1) or a
// TREAT (wild + bomb). A move drags a dog to swap with an orthogonally adjacent
// cell; the swap is only legal if it creates at least one match. After a swap,
// the board resolves: matched runs of 3+ clear, survivors fall, new dogs fill in
// from the top, and the process cascades until stable.
//
// Treats:
//   - WILD: a treat substitutes for any breed to complete a line. A run of 3+
//     cells that are all (breed B or treat), with at least one real breed-B dog,
//     is a match — so a treat can sit in the middle or the ends.
//   - BOMB: when a treat is part of a cleared match, every dog in its 8-cell
//     neighborhood also leaves (gets cleared).
//
// Win: clear `target` dogs ("send them home") before the move limit runs out.
//
// State (plain JSON):
//   { mechanic, rows, cols, breeds, treatChance, target, cleared, seed, grid }
//     grid[y][x] = breed id | TREAT | EMPTY (EMPTY is only transient)
//
// Refills are driven by a seeded RNG stored in `seed`, so a level always plays
// out identically for identical moves — which makes it testable and lets the
// level tool prove winnability.

import { PuzzleMechanic } from "./PuzzleMechanic.js";

export const TREAT = 9; // sentinel jewel id; breeds must be < TREAT
const EMPTY = -1;
const MIN_RUN = 3;
const NEIGHBORS8 = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0], [1, 0],
  [-1, 1], [0, 1], [1, 1],
];

// ── Seeded RNG (mulberry32), threaded through state.seed ─────────────────────
function nextRand(state) {
  let a = (state.seed + 0x6d2b79f5) | 0;
  state.seed = a;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function randInt(state, n) {
  return Math.floor(nextRand(state) * n);
}

export class DogMatch extends PuzzleMechanic {
  get id() {
    return "dog_match";
  }
  get name() {
    return "Dog Match";
  }

  createSolvedState(config) {
    // "Solved" isn't a board shape here (the win is a target count), but the
    // interface wants something sensible.
    return {
      mechanic: this.id,
      rows: config.rows ?? 7,
      cols: config.cols ?? 7,
      breeds: config.breeds ?? 5,
      treatChance: config.treatChance ?? 0.05,
      target: 0,
      cleared: 0,
      seed: (config.seed ?? 1) >>> 0,
      grid: [],
    };
  }

  stateFromLevel(level) {
    const state = {
      mechanic: this.id,
      rows: level.rows,
      cols: level.cols,
      breeds: level.breeds,
      treatChance: level.treatChance ?? 0.05,
      target: level.target,
      cleared: 0,
      seed: (level.seed ?? 1) >>> 0,
      grid: null,
    };
    state.grid = this._buildInitialGrid(state);
    this._ensurePlayable(state, state.grid);
    return state;
  }

  isSolved(state) {
    return state.cleared >= state.target;
  }

  // A move is { from:{x,y}, to:{x,y} } for orthogonally adjacent cells. Returns
  // a NEW state, or the SAME state reference if the swap is illegal (no match) —
  // GameState treats an unchanged reference as "no move spent".
  applyMove(state, move) {
    const { from, to } = move;
    if (!from || !to || !this._isAdjacent(from, to)) return state;

    const next = this.cloneState(state);
    const g = next.grid;
    const tmp = g[from.y][from.x];
    g[from.y][from.x] = g[to.y][to.x];
    g[to.y][to.x] = tmp;

    if (this._findMatches(g, state.rows, state.cols).size === 0) {
      return state; // illegal swap — revert by returning the original reference
    }

    const cleared = this._resolve(next);
    next.cleared = state.cleared + cleared;
    return next;
  }

  // Every adjacent swap that would create a match.
  legalMoves(state) {
    return this._legalMovesOnGrid(state, state.grid);
  }

  // Hint / greedy: the single legal move that clears the most dogs (wrapped in an
  // array). Not a full "solution" — refills are random, so there's no fixed plan.
  solve(state) {
    if (this.isSolved(state)) return [];
    const best = this._bestMove(state);
    return best ? [best] : null;
  }

  // Efficiency-based star rating (no "optimal" exists for a refilling board).
  starsForWin(movesUsed, level) {
    const m = level.moves;
    if (movesUsed <= Math.ceil(m * 0.6)) return 3;
    if (movesUsed <= Math.ceil(m * 0.85)) return 2;
    return 1;
  }

  // ── Internals ──────────────────────────────────────────────────────────────

  _isAdjacent(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
  }

  _randPiece(state) {
    if (nextRand(state) < state.treatChance) return TREAT;
    return randInt(state, state.breeds);
  }

  _buildInitialGrid(state) {
    const { rows, cols, breeds } = state;
    const grid = Array.from({ length: rows }, () => new Array(cols).fill(EMPTY));
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let pick;
        let guard = 0;
        do {
          pick = randInt(state, breeds);
          guard++;
        } while (
          guard < 60 &&
          ((x >= 2 && grid[y][x - 1] === pick && grid[y][x - 2] === pick) ||
            (y >= 2 && grid[y - 1][x] === pick && grid[y - 2][x] === pick))
        );
        grid[y][x] = pick;
      }
    }
    return grid;
  }

  // Find all matched cells (wild treats included). Anchors only on real dogs, so
  // a run of pure treats never matches.
  _findMatches(grid, rows, cols) {
    const matched = new Set();
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const b = grid[y][x];
        if (b === TREAT || b === EMPTY) continue;
        const compat = (v) => v === b || v === TREAT;

        let l = x;
        while (l - 1 >= 0 && compat(grid[y][l - 1])) l--;
        let r = x;
        while (r + 1 < cols && compat(grid[y][r + 1])) r++;
        if (r - l + 1 >= MIN_RUN) for (let i = l; i <= r; i++) matched.add(y * cols + i);

        let t = y;
        while (t - 1 >= 0 && compat(grid[t - 1][x])) t--;
        let d = y;
        while (d + 1 < rows && compat(grid[d + 1][x])) d++;
        if (d - t + 1 >= MIN_RUN) for (let i = t; i <= d; i++) matched.add(i * cols + x);
      }
    }
    return matched;
  }

  // Resolve a board after a valid swap: clear matches (treats detonate their
  // neighbourhood), apply gravity, refill from the top, cascade until stable.
  // Mutates next.grid / next.seed in place. Returns dogs cleared this move.
  _resolve(next) {
    const { rows, cols } = next;
    const grid = next.grid;
    let clearedDogs = 0;

    let iter = 0;
    while (iter++ < 100) {
      const matched = this._findMatches(grid, rows, cols);
      if (matched.size === 0) break;

      // Expand bombs: any matched treat clears its 8 neighbours too.
      const toClear = new Set(matched);
      for (const idx of matched) {
        const x = idx % cols;
        const y = (idx - x) / cols;
        if (grid[y][x] === TREAT) {
          for (const [dx, dy] of NEIGHBORS8) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && ny >= 0 && nx < cols && ny < rows) toClear.add(ny * cols + nx);
          }
        }
      }

      // Clear and count dogs sent home (treats don't count as dogs).
      for (const idx of toClear) {
        const x = idx % cols;
        const y = (idx - x) / cols;
        const v = grid[y][x];
        if (v !== EMPTY && v !== TREAT) clearedDogs++;
        grid[y][x] = EMPTY;
      }

      // Gravity + refill, per column.
      for (let x = 0; x < cols; x++) {
        let write = rows - 1;
        for (let y = rows - 1; y >= 0; y--) {
          if (grid[y][x] !== EMPTY) {
            const v = grid[y][x];
            grid[y][x] = EMPTY;
            grid[write][x] = v;
            write--;
          }
        }
        for (let y = write; y >= 0; y--) grid[y][x] = this._randPiece(next);
      }
    }

    this._ensurePlayable(next, grid);
    return clearedDogs;
  }

  _legalMovesOnGrid(state, grid) {
    const { rows, cols } = state;
    const moves = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        // Only test right + down neighbours to avoid duplicate pairs.
        if (x + 1 < cols && this._swapMakesMatch(grid, rows, cols, x, y, x + 1, y)) {
          moves.push({ from: { x, y }, to: { x: x + 1, y } });
        }
        if (y + 1 < rows && this._swapMakesMatch(grid, rows, cols, x, y, x, y + 1)) {
          moves.push({ from: { x, y }, to: { x, y: y + 1 } });
        }
      }
    }
    return moves;
  }

  _swapMakesMatch(grid, rows, cols, x1, y1, x2, y2) {
    const a = grid[y1][x1];
    const b = grid[y2][x2];
    if (a === b) return false; // swapping identical pieces changes nothing
    grid[y1][x1] = b;
    grid[y2][x2] = a;
    const has = this._findMatches(grid, rows, cols).size > 0;
    grid[y1][x1] = a;
    grid[y2][x2] = b;
    return has;
  }

  // The legal move that clears the most dogs (used for hints + level tuning).
  _bestMove(state) {
    const moves = this.legalMoves(state);
    let best = null;
    let bestGain = -1;
    for (const mv of moves) {
      const after = this.applyMove(state, mv);
      if (after === state) continue;
      const gain = after.cleared - state.cleared;
      if (gain > bestGain) {
        bestGain = gain;
        best = mv;
      }
    }
    return best;
  }

  // Keep the board playable: if it has no legal moves (or, after a reshuffle,
  // accidental matches), reshuffle the existing pieces deterministically.
  _ensurePlayable(state, grid) {
    const { rows, cols } = state;
    let tries = 0;
    while (
      tries++ < 60 &&
      (this._findMatches(grid, rows, cols).size > 0 ||
        this._legalMovesOnGrid(state, grid).length === 0)
    ) {
      const flat = [];
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) flat.push(grid[y][x]);
      for (let i = flat.length - 1; i > 0; i--) {
        const j = randInt(state, i + 1);
        const tmp = flat[i];
        flat[i] = flat[j];
        flat[j] = tmp;
      }
      let k = 0;
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) grid[y][x] = flat[k++];
    }
  }
}
