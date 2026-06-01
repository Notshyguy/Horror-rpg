// main.js — wires the prototype together and supports multiple GAME MODES that
// share the same plumbing (GameState, SaveManager, EventBus). Each mode supplies
// its levels and a renderer; everything else is mode-agnostic.

import { generateLevelSet } from "./engine/levelGenerator.js";
import { GameState } from "./engine/GameState.js";
import { SaveManager } from "./engine/SaveManager.js";
import { bus } from "./engine/EventBus.js";
import { BoardRenderer } from "./ui/BoardRenderer.js";
import { ShelfRenderer } from "./ui/ShelfRenderer.js";
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
  const r = new ShelfRenderer(els.board, onInput);
  return {
    build: (state) => r.build(state),
    render: (state) => r.render(state),
    flashHint: (move) => r.flashHint(move),
    pulseSolved: () => r.pulseSolved(),
  };
}

const MODES = {
  lights_out: {
    label: "Lights Out",
    saveKey: (id) => `lo:${id}`,
    levels: () => generateLevelSet({ seed: 20260601, mechanicId: "lights_out" }),
    goal: "Turn every tile off.",
    makeRenderer: makeBoardRenderer,
    buildRenderer: (renderer, state) => renderer.build(state.size),
  },
  jewel_shelves: {
    label: "Jewel Match",
    saveKey: (id) => `jm:${id}`,
    levels: () => JEWEL_LEVELS,
    goal: "Drag jewels to match 3+ and clear every shelf.",
    makeRenderer: makeShelfRenderer,
    buildRenderer: (renderer, state) => renderer.build(state),
  },
};

// Jewel levels are loaded from the committed JSON (with a tiny inline fallback
// so the mode still works if the fetch fails, e.g. on file://).
let JEWEL_LEVELS = [];

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
  els.optimal.textContent = `optimal ${level.optimal}`;
  els.moves.textContent = `${game.movesLeft} / ${level.moves}`;
  els.moves.classList.remove("low");
  els.stars.textContent = starString(save.getStars(saveId));
  els.status.textContent = mode.goal;
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
async function boot() {
  try {
    const res = await fetch(new URL("../levels/jewels.json", import.meta.url));
    if (res.ok) JEWEL_LEVELS = await res.json();
  } catch {
    /* fall back below */
  }
  if (!JEWEL_LEVELS.length) {
    // Minimal inline fallback (level 1) so the mode is never empty.
    JEWEL_LEVELS = [
      {
        mechanic: "jewel_shelves",
        id: 1,
        difficulty: "tutorial",
        colors: 5,
        capacity: 6,
        optimal: 1,
        moves: 3,
        shelves: [[0, 0], [0], []],
      },
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
