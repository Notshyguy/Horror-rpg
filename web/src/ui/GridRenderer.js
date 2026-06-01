// GridRenderer — draws the Dog Match grid and handles drag-to-swap via Pointer
// Events (mouse + touch). Presentational only: it renders the state it's given
// and reports a { from:{x,y}, to:{x,y} } swap request; GameState decides legality.
//
// Interaction: press a dog and drag toward an adjacent cell (up/down/left/right).
// On release, the renderer picks the neighbour in the dominant drag direction and
// emits the swap. Treats are draggable too (they're wild pieces on the board).

import { TREAT } from "../engine/DogMatch.js";

// Dog breeds: emoji + a backing tint so breeds stay distinguishable even where
// emoji render flat. Index = breed id.
const BREEDS = [
  { name: "Shiba", glyph: "🐕", tint: "#e8a04e" },
  { name: "Poodle", glyph: "🐩", tint: "#d98ad1" },
  { name: "Husky", glyph: "🐺", tint: "#7fb6e8" },
  { name: "Dalmatian", glyph: "🐶", tint: "#cfd6df" },
  { name: "Hound", glyph: "🦮", tint: "#c9a06a" },
  { name: "Boxer", glyph: "🐕‍🦺", tint: "#b98a5e" },
];
const TREAT_DEF = { name: "Treat (wild + bomb)", glyph: "🦴", tint: "#f4e1b0" };

export class GridRenderer {
  /**
   * @param {HTMLElement} container
   * @param {(move: {from:{x,y}, to:{x,y}}) => void} onMove
   */
  constructor(container, onMove) {
    this.container = container;
    this.onMove = onMove;
    this.cols = 0;
    this.rows = 0;
    this.cells = []; // flat, index y*cols + x
    this._drag = null;

    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
  }

  build(state) {
    this.rows = state.rows;
    this.cols = state.cols;
    this.cells = [];
    this.container.classList.add("dog-grid");
    this.container.classList.remove("shelves");
    this.container.innerHTML = "";
    this.container.style.setProperty("--grid-cols", String(state.cols));
    this.container.style.setProperty("--grid-rows", String(state.rows));

    for (let y = 0; y < state.rows; y++) {
      for (let x = 0; x < state.cols; x++) {
        const cell = document.createElement("div");
        cell.className = "dog-cell";
        cell.dataset.x = String(x);
        cell.dataset.y = String(y);
        cell.addEventListener("pointerdown", (ev) => this._onPointerDown(ev, x, y));
        this.container.appendChild(cell);
        this.cells.push(cell);
      }
    }
    this.render(state);
  }

  render(state) {
    if (state.rows !== this.rows || state.cols !== this.cols) {
      this.build(state);
      return;
    }
    for (let y = 0; y < state.rows; y++) {
      for (let x = 0; x < state.cols; x++) {
        const cell = this.cells[y * state.cols + x];
        const v = state.grid[y][x];
        const def = v === TREAT ? TREAT_DEF : BREEDS[v % BREEDS.length];
        cell.textContent = def.glyph;
        cell.title = def.name;
        cell.style.setProperty("--tint", def.tint);
        cell.classList.toggle("treat", v === TREAT);
      }
    }
  }

  _cellEl(x, y) {
    return this.cells[y * this.cols + x];
  }

  _onPointerDown(ev, x, y) {
    if (this._drag) return;
    ev.preventDefault();
    this._drag = { x, y, startX: ev.clientX, startY: ev.clientY };
    this._cellEl(x, y).classList.add("picked");
    window.addEventListener("pointermove", this._onPointerMove, { passive: false });
    window.addEventListener("pointerup", this._onPointerUp);
    window.addEventListener("pointercancel", this._onPointerUp);
  }

  _onPointerMove(ev) {
    if (!this._drag) return;
    ev.preventDefault();
    const target = this._dirTarget(ev.clientX, ev.clientY);
    // Preview which neighbour would be swapped.
    this.cells.forEach((c) => c.classList.remove("swap-target"));
    if (target) this._cellEl(target.x, target.y).classList.add("swap-target");
  }

  // Resolve the adjacent cell in the dominant drag direction, if past a small
  // threshold and in-bounds.
  _dirTarget(clientX, clientY) {
    const dx = clientX - this._drag.startX;
    const dy = clientY - this._drag.startY;
    const THRESH = 12;
    if (Math.abs(dx) < THRESH && Math.abs(dy) < THRESH) return null;

    let tx = this._drag.x;
    let ty = this._drag.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      tx += dx > 0 ? 1 : -1;
    } else {
      ty += dy > 0 ? 1 : -1;
    }
    if (tx < 0 || ty < 0 || tx >= this.cols || ty >= this.rows) return null;
    return { x: tx, y: ty };
  }

  _onPointerUp(ev) {
    if (!this._drag) return;
    const target = this._dirTarget(ev.clientX, ev.clientY);
    const from = { x: this._drag.x, y: this._drag.y };

    this.cells.forEach((c) => c.classList.remove("picked", "swap-target"));
    window.removeEventListener("pointermove", this._onPointerMove);
    window.removeEventListener("pointerup", this._onPointerUp);
    window.removeEventListener("pointercancel", this._onPointerUp);
    this._drag = null;

    if (target) this.onMove({ from, to: { x: target.x, y: target.y } });
  }

  // Hint: briefly highlight the two cells of a suggested swap.
  flashHint(move) {
    for (const p of [move.from, move.to]) {
      const cell = this._cellEl(p.x, p.y);
      if (!cell) continue;
      cell.classList.remove("hint");
      void cell.offsetWidth;
      cell.classList.add("hint");
    }
  }

  pulseSolved() {
    this.container.classList.remove("solved");
    void this.container.offsetWidth;
    this.container.classList.add("solved");
  }

  static breedName(id) {
    return id === TREAT ? TREAT_DEF.name : BREEDS[id % BREEDS.length].name;
  }
}
