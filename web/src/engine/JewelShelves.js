// JewelShelves — a drag-to-match puzzle.
//
// The board is a set of horizontal shelves, each holding a left-aligned row of
// jewels (integers 0..colors-1). A move drags the *outermost* jewel from one
// shelf onto the end of another shelf. After every move, any run of 3+ identical
// adjacent jewels on a shelf pops and clears; remaining jewels slide together,
// which can trigger further (cascading) clears. The puzzle is solved when every
// shelf is empty.
//
// State shape (plain JSON):
//   { mechanic, colors, capacity, shelves: number[][] }
//     shelves[i] = array of jewel ids, index 0 = left end.
//
// A move is { from, to } (shelf indices). We always move the rightmost jewel of
// `from` to the right end of `to` — that keeps the interaction simple to drag
// and keeps the move space small enough to solve with BFS.

import { PuzzleMechanic } from "./PuzzleMechanic.js";

const MIN_RUN = 3; // jewels needed in a row to clear

export class JewelShelves extends PuzzleMechanic {
  get id() {
    return "jewel_shelves";
  }

  get name() {
    return "Jewel Shelves";
  }

  // Generators aren't used for this mode (levels are hand-authored), but the
  // interface wants a solved state: every shelf empty.
  createSolvedState(config) {
    const shelfCount = config.shelfCount ?? 4;
    return {
      mechanic: this.id,
      colors: config.colors ?? 5,
      capacity: config.capacity ?? 8,
      shelves: Array.from({ length: shelfCount }, () => []),
    };
  }

  // Build a live state from a level definition's `shelves` array.
  stateFromLevel(level) {
    return {
      mechanic: this.id,
      colors: level.colors,
      capacity: level.capacity,
      shelves: level.shelves.map((s) => [...s]),
    };
  }

  applyMove(state, move) {
    const { from, to } = move;
    const shelves = state.shelves;
    if (from === to) throw new Error("from and to must differ");
    if (from < 0 || to < 0 || from >= shelves.length || to >= shelves.length) {
      throw new Error(`move out of bounds: ${from} -> ${to}`);
    }
    if (shelves[from].length === 0) throw new Error("source shelf is empty");
    if (shelves[to].length >= state.capacity) throw new Error("target shelf is full");

    const next = this.cloneState(state);
    const jewel = next.shelves[from].pop(); // take the rightmost jewel
    next.shelves[to].push(jewel); // place it on the right end of the target
    resolveClears(next.shelves, to);
    return next;
  }

  isSolved(state) {
    return state.shelves.every((s) => s.length === 0);
  }

  legalMoves(state) {
    const moves = [];
    const shelves = state.shelves;
    for (let from = 0; from < shelves.length; from++) {
      if (shelves[from].length === 0) continue;
      for (let to = 0; to < shelves.length; to++) {
        if (to === from) continue;
        if (shelves[to].length >= state.capacity) continue;
        moves.push({ from, to });
      }
    }
    return moves;
  }

  // Bounded breadth-first search for a minimum-move solution. Level shelves are
  // small (a handful of jewels), so the reachable state space stays tractable.
  // Returns the shortest move list, or null if unsolved within the cap.
  solve(state, { maxStates = 200000 } = {}) {
    if (this.isSolved(state)) return [];

    const startKey = encode(state);
    const visited = new Set([startKey]);
    // queue holds { state, moves }
    let frontier = [{ state, moves: [] }];

    let explored = 0;
    while (frontier.length) {
      const nextFrontier = [];
      for (const node of frontier) {
        for (const move of this.legalMoves(node.state)) {
          let child;
          try {
            child = this.applyMove(node.state, move);
          } catch {
            continue;
          }
          const key = encode(child);
          if (visited.has(key)) continue;
          visited.add(key);
          const moves = [...node.moves, move];
          if (this.isSolved(child)) return moves;
          nextFrontier.push({ state: child, moves });

          if (++explored > maxStates) return null; // give up gracefully
        }
      }
      frontier = nextFrontier;
    }
    return null;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// Resolve all clears on a shelf after a jewel landed on it, cascading until no
// run of MIN_RUN+ identical adjacent jewels remains. Mutates `shelves` in place.
function resolveClears(shelves, shelfIndex) {
  let shelf = shelves[shelfIndex];
  let changed = true;
  while (changed) {
    changed = false;
    let runStart = 0;
    for (let i = 1; i <= shelf.length; i++) {
      if (i < shelf.length && shelf[i] === shelf[runStart]) continue;
      const runLen = i - runStart;
      if (runLen >= MIN_RUN) {
        shelf.splice(runStart, runLen); // remove the run; survivors slide together
        changed = true;
        break; // re-scan from the start (a new adjacency may now form)
      }
      runStart = i;
    }
  }
  shelves[shelfIndex] = shelf;
}

// Canonical key for visited-set dedup. Shelf order matters (shelves are
// distinct slots), so we don't sort across shelves.
function encode(state) {
  return state.shelves.map((s) => s.join(",")).join("|");
}

export { resolveClears, MIN_RUN };
