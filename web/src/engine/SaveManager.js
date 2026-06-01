// SaveManager — persists progress to localStorage (the web analogue of the
// Godot plan's user://save.json). Same schema shape so a future port can reuse
// the logic. Falls back to an in-memory store when localStorage is unavailable
// (e.g. running under Node for tests).

const STORAGE_KEY = "shift.save.v1";

function defaultSave() {
  return {
    version: 1,
    last_played_level: 1,
    levels: {}, // id -> { stars, best_moves }
    settings: { sfx_volume: 1.0, music_volume: 0.6, haptics: true },
  };
}

export class SaveManager {
  constructor(storage = globalThis.localStorage) {
    this._storage = storage ?? new MemoryStorage();
    this.data = this._load();
  }

  _load() {
    try {
      const raw = this._storage.getItem(STORAGE_KEY);
      if (!raw) return defaultSave();
      const parsed = JSON.parse(raw);
      return { ...defaultSave(), ...parsed };
    } catch {
      return defaultSave();
    }
  }

  save() {
    try {
      this._storage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      /* ignore quota / unavailable storage */
    }
  }

  getLevelRecord(id) {
    return this.data.levels[String(id)] ?? null;
  }

  getStars(id) {
    return this.getLevelRecord(id)?.stars ?? 0;
  }

  isUnlocked(id) {
    if (id <= 1) return true;
    return this.getStars(id - 1) > 0; // previous level cleared
  }

  completeLevel(id, stars, movesUsed) {
    const key = String(id);
    const prev = this.data.levels[key];
    const best = prev ? Math.min(prev.best_moves, movesUsed) : movesUsed;
    const bestStars = prev ? Math.max(prev.stars, stars) : stars;
    this.data.levels[key] = { stars: bestStars, best_moves: best };
    this.data.last_played_level = id;
    this.save();
    return this.data.levels[key];
  }

  totalStars() {
    return Object.values(this.data.levels).reduce((s, r) => s + r.stars, 0);
  }

  levelsCompleted() {
    return Object.keys(this.data.levels).length;
  }

  getSetting(key) {
    return this.data.settings[key];
  }

  setSetting(key, value) {
    this.data.settings[key] = value;
    this.save();
  }
}

class MemoryStorage {
  constructor() {
    this._m = new Map();
  }
  getItem(k) {
    return this._m.has(k) ? this._m.get(k) : null;
  }
  setItem(k, v) {
    this._m.set(k, v);
  }
  removeItem(k) {
    this._m.delete(k);
  }
}
