// PuzzleMechanic — the contract every puzzle type must satisfy.
//
// The rest of the game (rendering, scoring, saving, menus) only ever talks to a
// mechanic through this interface. Swapping "Lights Out" for "flood-fill" or any
// other rule means writing one new class that implements these methods — nothing
// else in the app needs to change.
//
// State is treated as plain, serializable data (so it can be saved to JSON and
// sent across a network later). Mechanics must NOT mutate the state passed in;
// applyMove returns a new state.

/**
 * @typedef {Object} PuzzleConfig
 * @property {number} size   Grid dimension (size x size).
 * @property {number} [states] Number of distinct cell states (default 2: on/off).
 * @property {Object} [extra] Mechanic-specific tuning.
 */

export class PuzzleMechanic {
  /** Stable identifier used in level data and save files. */
  get id() {
    throw new Error("PuzzleMechanic.id not implemented");
  }

  /** Human-readable name for menus. */
  get name() {
    return this.id;
  }

  /**
   * Build a fresh, already-solved state for the given config. Generators start
   * here and scramble it so every produced level is guaranteed solvable.
   * @param {PuzzleConfig} config
   * @returns {any} serializable state
   */
  createSolvedState(config) {
    throw new Error("createSolvedState not implemented");
  }

  /**
   * Build the live starting state for a level definition. Each mechanic owns the
   * shape of its level data (grids, shelves, ...), so GameState stays agnostic.
   * Override per mechanic. The default assumes a `grid` field.
   * @param {Object} level
   * @returns {any} serializable state
   */
  stateFromLevel(level) {
    return {
      mechanic: this.id,
      size: level.size,
      states: level.states ?? 2,
      grid: this.cloneState({ grid: level.grid }).grid,
    };
  }

  /**
   * Apply a move, returning a NEW state. Must not mutate the input.
   * @param {any} state
   * @param {any} move  Mechanic-defined move (e.g. {x, y} for Lights Out).
   * @returns {any} new state
   */
  applyMove(state, move) {
    throw new Error("applyMove not implemented");
  }

  /**
   * @param {any} state
   * @returns {boolean} true when the board is in a winning configuration.
   */
  isSolved(state) {
    throw new Error("isSolved not implemented");
  }

  /**
   * Enumerate every legal move for a state (used by generators/solvers/UI).
   * @param {any} state
   * @returns {any[]}
   */
  legalMoves(state) {
    throw new Error("legalMoves not implemented");
  }

  /**
   * Find a sequence of moves that solves the state. Should aim for the minimum
   * number of moves so it can drive the "optimal" star rating and hints.
   * Returns null if unsolvable.
   * @param {any} state
   * @returns {any[]|null}
   */
  solve(state) {
    throw new Error("solve not implemented");
  }

  /**
   * Deep-clone a state. Default works for JSON-serializable states.
   * @param {any} state
   */
  cloneState(state) {
    return JSON.parse(JSON.stringify(state));
  }
}
