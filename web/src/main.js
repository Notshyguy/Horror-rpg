// main.js — wires the prototype together and supports multiple GAME MODES that
// share the same plumbing (GameState, SaveManager, EventBus). Each mode supplies
// its levels and a renderer; everything else is mode-agnostic.

import { generateLevelSet } from "./engine/levelGenerator.js";
import { GameState } from "./engine/GameState.js";
import { SaveManager } from "./engine/SaveManager.js";
import { bus } from "./engine/EventBus.js";
import { BoardRenderer } from "./ui/BoardRenderer.js";
import { ShelfRenderer } from "./ui/ShelfRenderer.js";
import { GridRenderer } from "./ui/GridRenderer.js";
import { getMechanic } from "./engine/mechanics.js";

const els = {
  board: document.getElementById("board"),
  level: document.getElementById("level-num"),
  difficulty: document.getElementById("difficulty"),
  moves: document.getElementById("moves"),
  optimal: document.getElementById("optimal"),
  stars: document.getElementById("stars"),
  status: document.getElementById("status"),
  mechanic: document.getElementById("mechanic-name"),
  totalStars: document.getElementById("total-stars"),
  reset: document.getElementById("btn-reset"),
  hint: document.getElementById("btn-hint"),
  prev: document.getElementById("btn-prev"),
  next: document.getElementById("btn-next"),
  modeButtons: Array.from(document.querySelectorAll("[data-mode]")),
};

const save = new SaveManager();

// ── Mode definitions ─────────────────────────────────────────────────────────
// Each mode owns: a mechanic id, its levels, how to build a renderer, the goal
// text, and how a player input maps to a GameState move. Save keys are
// namespaced per mode so progress never collides.

function makeBoardRenderer(onInput) {
  return new BoardRenderer(els.board, onInput);
}

function makeShelfRenderer(onInput) {
  return new ShelfRenderer(els.board, onInput);
}

function makeGridRenderer(onInput) {
  return new GridRenderer(els.board, onInput);
}

// `info(level, game)` returns the right-hand HUD chip text; `progress(game)`
// returns optional mid-play progress (e.g. dogs sent home). Both optional.
const MODES = {
  lights_out: {
    label: "Lights Out",
    saveKey: (id) => `lo:${id}`,
    levels: () => generateLevelSet({ seed: 20260601, mechanicId: "lights_out" }),
    goal: "Turn every tile off.",
    makeRenderer: makeBoardRenderer,
    buildRenderer: (renderer, state) => renderer.build(state.size),
    info: (level) => `optimal ${level.optimal}`,
  },
  jewel_shelves: {
    label: "Jewel Match",
    saveKey: (id) => `jm:${id}`,
    levels: () => JEWEL_LEVELS,
    goal: "Drag jewels to match 3+ and clear every shelf.",
    makeRenderer: makeShelfRenderer,
    buildRenderer: (renderer, state) => renderer.build(state),
    info: (level) => `optimal ${level.optimal}`,
  },
  dog_match: {
    label: "Dog Match",
    saveKey: (id) => `dm:${id}`,
    levels: () => DOG_LEVELS,
    goal: "Drag dogs to match 3+. Treats 🦴 are wild and blast neighbors!",
    makeRenderer: makeGridRenderer,
    buildRenderer: (renderer, state) => renderer.build(state),
    info: (level) => `send ${level.target} home`,
    progress: (game) => `${game.state.cleared} / ${game.level.target} dogs`,
  },
};

// Match levels are loaded from committed JSON (with tiny inline fallbacks so the
// modes still work if the fetch fails, e.g. on file://).
let JEWEL_LEVELS = [];
let DOG_LEVELS = [];

// ── Live session state ───────────────────────────────────────────────────────
let modeId = "lights_out";
let mode = MODES[modeId];
let levels = [];
let currentIndex = 0;
let game = null;
let renderer = null;

function starString(n) {
  return "★".repeat(n) + "☆".repeat(3 - n);
}

function onInput(move) {
  if (!game || game.finished) return;
  const res = game.play(move);
  renderer.render(game.state);
  if (res.solved) renderer.pulseSolved();
}

function setMode(id) {
  if (!MODES[id]) return;
  modeId = id;
  mode = MODES[id];
  levels = mode.levels();
  // Reset board element styling left over from a previous mode's renderer.
  els.board.className = "board";
  els.board.removeAttribute("style");
  renderer = mode.makeRenderer(onInput);
  els.mechanic.textContent = mode.label;
  els.modeButtons.forEach((b) => b.classList.toggle("active", b.dataset.mode === id));
  refreshTotalStars();
  loadLevel(0);
}

function refreshTotalStars() {
  els.totalStars.textContent = `★ ${save.totalStars()}`;
}

function loadLevel(index) {
  currentIndex = Math.max(0, Math.min(levels.length - 1, index));
  const level = { ...levels[currentIndex] };
  // Namespace the save id so the two modes don't share level records.
  const saveId = mode.saveKey(level.id);

  game = new GameState({ ...level, id: saveId }, bus);
  mode.buildRenderer(renderer, game.state);
  renderer.render(game.state);

  els.level.textContent = `Level ${level.id}`;
  els.difficulty.textContent = level.difficulty;
  els.optimal.textContent = mode.info ? mode.info(level, game) : "";
  els.moves.textContent = `${game.movesLeft} / ${level.moves}`;
  els.moves.classList.remove("low");
  els.stars.textContent = starString(save.getStars(saveId));
  els.status.textContent = mode.progress ? `${mode.progress(game)} — ${mode.goal}` : mode.goal;
  els.status.className = "status";
  els.board.classList.remove("locked");
  els.prev.disabled = currentIndex === 0;
  els.next.disabled = currentIndex === levels.length - 1;
}

// ── Event wiring (mode-agnostic) ─────────────────────────────────────────────
bus.on("move_made", ({ movesLeft }) => {
  const level = levels[currentIndex];
  els.moves.textContent = `${movesLeft} / ${level.moves}`;
  els.moves.classList.toggle("low", movesLeft <= 3);
  // Live progress for modes that track it (e.g. dogs sent home).
  if (mode.progress && game && !game.finished) {
    els.status.textContent = `${mode.progress(game)} — ${mode.goal}`;
  }
});

bus.on("board_solved", ({ movesUsed, stars }) => {
  const level = levels[currentIndex];
  const rec = save.completeLevel(mode.saveKey(level.id), stars, movesUsed);
  els.status.textContent = `Solved in ${movesUsed}! ${starString(stars)}`;
  els.status.className = "status win";
  els.stars.textContent = starString(rec.stars);
  refreshTotalStars();
  els.board.classList.add("locked");
});

bus.on("board_failed", ({ limit }) => {
  els.status.textContent = `Out of moves (${limit}). Reset to retry.`;
  els.status.className = "status lose";
  els.board.classList.add("locked");
});

// ── Controls ─────────────────────────────────────────────────────────────────
els.reset.addEventListener("click", () => loadLevel(currentIndex));
els.prev.addEventListener("click", () => loadLevel(currentIndex - 1));
els.next.addEventListener("click", () => loadLevel(currentIndex + 1));
els.hint.addEventListener("click", () => {
  if (!game || game.finished) return;
  const move = game.hint();
  if (move) renderer.flashHint(move);
});
els.modeButtons.forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));

// ── Boot ─────────────────────────────────────────────────────────────────────
async function loadJson(relUrl) {
  try {
    const res = await fetch(new URL(relUrl, import.meta.url));
    if (res.ok) return await res.json();
  } catch {
    /* ignore — caller supplies a fallback */
  }
  return null;
}

async function boot() {
  JEWEL_LEVELS = (await loadJson("../levels/jewels.json")) ?? [];
  DOG_LEVELS = (await loadJson("../levels/dogs.json")) ?? [];

  if (!JEWEL_LEVELS.length) {
    JEWEL_LEVELS = [
      { mechanic: "jewel_shelves", id: 1, difficulty: "tutorial", colors: 5, capacity: 6, optimal: 1, moves: 3, shelves: [[0, 0], [0], []] },
    ];
  }
  if (!DOG_LEVELS.length) {
    DOG_LEVELS = [
      { mechanic: "dog_match", id: 1, difficulty: "tutorial", rows: 6, cols: 6, breeds: 4, treatChance: 0.05, target: 18, moves: 8, seed: 101 },
    ];
  }
  setMode("lights_out");
}

boot();

// Register the service worker for offline / installable PWA support. Resolved
// relative to this module so it works under a GitHub Pages subpath. Ignored on
// file:// (no service worker support there) — the game still runs fine.
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(new URL("../sw.js", import.meta.url)).catch(() => {
      /* offline support is a progressive enhancement; ignore failures */
    });
  });
}
