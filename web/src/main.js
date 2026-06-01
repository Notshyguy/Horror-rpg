// main.js — wires the prototype together: generate a level set, render the
// board, handle taps through GameState, and react to game events via the bus.

import { generateLevelSet } from "./engine/levelGenerator.js";
import { GameState } from "./engine/GameState.js";
import { SaveManager } from "./engine/SaveManager.js";
import { bus } from "./engine/EventBus.js";
import { BoardRenderer } from "./ui/BoardRenderer.js";
import { getMechanic, DEFAULT_MECHANIC_ID } from "./engine/mechanics.js";

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
};

const save = new SaveManager();
const levels = generateLevelSet({ seed: 20260601, mechanicId: DEFAULT_MECHANIC_ID });
let currentIndex = 0;
let game = null;
let renderer = new BoardRenderer(els.board, onCell);

els.mechanic.textContent = getMechanic(DEFAULT_MECHANIC_ID).name;

function onCell(move) {
  if (!game || game.finished) return;
  const res = game.play(move);
  renderer.render(game.state);
  if (res.solved) renderer.pulseSolved();
}

function starString(n) {
  return "★".repeat(n) + "☆".repeat(3 - n);
}

function loadLevel(index) {
  currentIndex = Math.max(0, Math.min(levels.length - 1, index));
  const level = levels[currentIndex];
  game = new GameState(level, bus);
  renderer.build(level.size);
  renderer.render(game.state);

  els.level.textContent = `Level ${level.id}`;
  els.difficulty.textContent = level.difficulty;
  els.optimal.textContent = `optimal ${level.optimal}`;
  els.moves.textContent = `${game.movesLeft} / ${level.moves}`;
  els.stars.textContent = starString(save.getStars(level.id));
  els.status.textContent = "Turn every tile off.";
  els.status.className = "status";
  els.board.classList.remove("locked");
  els.prev.disabled = currentIndex === 0;
  els.next.disabled = currentIndex === levels.length - 1;
}

// ── Event wiring ─────────────────────────────────────────────────────────────
bus.on("move_made", ({ movesLeft }) => {
  const level = levels[currentIndex];
  els.moves.textContent = `${movesLeft} / ${level.moves}`;
  els.moves.classList.toggle("low", movesLeft <= 3);
});

bus.on("board_solved", ({ movesUsed, stars }) => {
  const level = levels[currentIndex];
  const rec = save.completeLevel(level.id, stars, movesUsed);
  els.status.textContent = `Solved in ${movesUsed}! ${starString(stars)}`;
  els.status.className = "status win";
  els.stars.textContent = starString(rec.stars);
  els.totalStars.textContent = `★ ${save.totalStars()}`;
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
  if (move) renderer.flashHint(move.x, move.y);
});

els.totalStars.textContent = `★ ${save.totalStars()}`;
loadLevel(0);
