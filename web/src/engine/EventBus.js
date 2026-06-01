// EventBus — tiny pub/sub so UI and game logic stay decoupled. Mirrors the
// EventBus autoload from the Godot plan. Signal names use verb_noun form.

export class EventBus {
  constructor() {
    this._handlers = new Map();
  }

  on(event, handler) {
    if (!this._handlers.has(event)) this._handlers.set(event, new Set());
    this._handlers.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    this._handlers.get(event)?.delete(handler);
  }

  emit(event, payload) {
    this._handlers.get(event)?.forEach((h) => h(payload));
  }
}

// Known signals (documented so handlers and emitters agree):
//   move_made        { movesUsed, movesLeft, state }
//   board_solved     { movesUsed, optimal, stars }
//   board_failed     { movesUsed, limit }
//   level_loaded     { level }
//   level_completed  { id, stars, bestMoves }
export const bus = new EventBus();
