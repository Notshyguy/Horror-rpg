// GameState — owns one in-progress puzzle: the live board, move accounting,
// win/lose detection, hints, and star scoring. Mechanic-agnostic: it only talks
// to the puzzle through the PuzzleMechanic interface.

import { getMechanic } from "./mechanics.js";

// Star rating (from the plan):
//   3 stars: movesUsed <= optimal + 1
//   2 stars: movesUsed <= limit * 0.75
//   1 star:  completed at all
export function calculateStars(movesUsed, optimal, limit) {
  if (movesUsed <= optimal + 1) return 3;
  if (movesUsed <= Math.floor(limit * 0.75)) return 2;
  return 1;
}

export class GameState {
  /**
   * @param {Object} level  A level object (see levels schema).
   * @param {EventBus} [bus]
   */
  constructor(level, bus = null) {
    this.level = level;
    this.bus = bus;
    this.mechanic = getMechanic(level.mechanic);
    this.state = {
      mechanic: level.mechanic,
      size: level.size,
      states: level.states ?? 2,
      grid: this.mechanic.cloneState({ grid: level.grid }).grid,
    };
    this.movesUsed = 0;
    this.limit = level.moves;
    this.finished = false;
    this.won = false;
    this.bus?.emit("level_loaded", { level });
  }

  get movesLeft() {
    return this.limit - this.movesUsed;
  }

  /**
   * Play a move. Returns { changed, solved, failed } describing the outcome.
   */
  play(move) {
    if (this.finished) return { changed: false, solved: false, failed: false };

    this.state = this.mechanic.applyMove(this.state, move);
    this.movesUsed++;

    const solved = this.mechanic.isSolved(this.state);
    this.bus?.emit("move_made", {
      movesUsed: this.movesUsed,
      movesLeft: this.movesLeft,
      state: this.state,
    });

    if (solved) {
      this.finished = true;
      this.won = true;
      const stars = calculateStars(this.movesUsed, this.level.optimal, this.limit);
      this.bus?.emit("board_solved", { movesUsed: this.movesUsed, optimal: this.level.optimal, stars });
      return { changed: true, solved: true, failed: false };
    }

    if (this.movesUsed >= this.limit) {
      this.finished = true;
      this.won = false;
      this.bus?.emit("board_failed", { movesUsed: this.movesUsed, limit: this.limit });
      return { changed: true, solved: false, failed: true };
    }

    return { changed: true, solved: false, failed: false };
  }

  /** Grant extra moves (e.g. a rewarded-ad hook later). */
  grantExtraMoves(n) {
    this.limit += n;
    if (this.finished && !this.won) {
      this.finished = false; // back in play
    }
  }

  /**
   * Next best move toward a solution, or null if already solved/unsolvable.
   * Used by the hint button.
   */
  hint() {
    if (this.mechanic.isSolved(this.state)) return null;
    const solution = this.mechanic.solve(this.state);
    return solution && solution.length ? solution[0] : null;
  }
}
