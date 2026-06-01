// ShelfRenderer — draws jewel shelves and handles drag-to-move via Pointer
// Events (works for mouse and touch alike). Purely presentational: it renders
// the state it's given and calls back with a { from, to } move request; the
// GameState decides whether the move is legal and what results.
//
// Interaction: press the rightmost jewel of a shelf and drag it onto another
// shelf. Only the outermost (rightmost) jewel of a shelf is draggable, matching
// the mechanic (a shelf behaves like a stack).

const JEWELS = [
  { name: "Ruby", glyph: "◆", color: "#e74c3c" },
  { name: "Sapphire", glyph: "◆", color: "#3498db" },
  { name: "Emerald", glyph: "◆", color: "#2ecc71" },
  { name: "Amber", glyph: "◆", color: "#f39c12" },
  { name: "Amethyst", glyph: "◆", color: "#9b59b6" },
];

export class ShelfRenderer {
  /**
   * @param {HTMLElement} container
   * @param {(move: {from:number,to:number}) => void} onMove
   */
  constructor(container, onMove) {
    this.container = container;
    this.onMove = onMove;
    this.shelfEls = [];
    this.state = null;
    this._drag = null;

    // Bound handlers so we can add/remove them cleanly.
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
  }

  build(state) {
    this.container.classList.add("shelves");
    this.container.innerHTML = "";
    this.shelfEls = [];
    for (let i = 0; i < state.shelves.length; i++) {
      const shelf = document.createElement("div");
      shelf.className = "shelf";
      shelf.dataset.index = String(i);
      const slots = document.createElement("div");
      slots.className = "shelf-slots";
      shelf.appendChild(slots);
      const plank = document.createElement("div");
      plank.className = "shelf-plank";
      shelf.appendChild(plank);
      this.container.appendChild(shelf);
      this.shelfEls.push({ shelf, slots });
    }
    this.render(state);
  }

  render(state) {
    this.state = state;
    if (this.shelfEls.length !== state.shelves.length) {
      this.build(state);
      return;
    }
    for (let i = 0; i < state.shelves.length; i++) {
      const { slots } = this.shelfEls[i];
      slots.innerHTML = "";
      const jewels = state.shelves[i];
      for (let k = 0; k < jewels.length; k++) {
        const id = jewels[k];
        const def = JEWELS[id % JEWELS.length];
        const el = document.createElement("div");
        el.className = "jewel";
        el.style.setProperty("--jewel-color", def.color);
        el.textContent = def.glyph;
        el.title = def.name;
        const isRightmost = k === jewels.length - 1;
        if (isRightmost) {
          el.classList.add("draggable");
          el.addEventListener("pointerdown", (ev) => this._onPointerDown(ev, i));
        }
        slots.appendChild(el);
      }
    }
  }

  _onPointerDown(ev, fromShelf) {
    if (this._drag) return;
    ev.preventDefault();
    const jewelEl = ev.currentTarget;
    const rect = jewelEl.getBoundingClientRect();

    // A floating clone follows the pointer.
    const ghost = jewelEl.cloneNode(true);
    ghost.classList.add("jewel-ghost");
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    document.body.appendChild(ghost);

    jewelEl.classList.add("lifted");

    this._drag = {
      fromShelf,
      ghost,
      jewelEl,
      offsetX: rect.width / 2,
      offsetY: rect.height / 2,
    };
    this._moveGhost(ev.clientX, ev.clientY);

    window.addEventListener("pointermove", this._onPointerMove, { passive: false });
    window.addEventListener("pointerup", this._onPointerUp);
    window.addEventListener("pointercancel", this._onPointerUp);
  }

  _moveGhost(x, y) {
    const { ghost, offsetX, offsetY } = this._drag;
    ghost.style.left = `${x - offsetX}px`;
    ghost.style.top = `${y - offsetY}px`;
  }

  _shelfAt(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el) return -1;
    const shelf = el.closest(".shelf");
    if (!shelf || !this.container.contains(shelf)) return -1;
    return Number(shelf.dataset.index);
  }

  _onPointerMove(ev) {
    if (!this._drag) return;
    ev.preventDefault();
    this._moveGhost(ev.clientX, ev.clientY);

    const over = this._shelfAt(ev.clientX, ev.clientY);
    for (let i = 0; i < this.shelfEls.length; i++) {
      this.shelfEls[i].shelf.classList.toggle(
        "drop-target",
        i === over && i !== this._drag.fromShelf
      );
    }
  }

  _onPointerUp(ev) {
    if (!this._drag) return;
    const { fromShelf, ghost, jewelEl } = this._drag;
    const toShelf = this._shelfAt(ev.clientX, ev.clientY);

    ghost.remove();
    jewelEl.classList.remove("lifted");
    this.shelfEls.forEach((s) => s.shelf.classList.remove("drop-target"));

    window.removeEventListener("pointermove", this._onPointerMove);
    window.removeEventListener("pointerup", this._onPointerUp);
    window.removeEventListener("pointercancel", this._onPointerUp);

    const drag = this._drag;
    this._drag = null;

    if (toShelf >= 0 && toShelf !== fromShelf) {
      this.onMove({ from: fromShelf, to: toShelf });
    }
    void drag;
  }

  // Briefly highlight a suggested move (hint).
  flashHint(move) {
    const f = this.shelfEls[move.from]?.shelf;
    const t = this.shelfEls[move.to]?.shelf;
    for (const el of [f, t]) {
      if (!el) continue;
      el.classList.remove("hint");
      void el.offsetWidth;
      el.classList.add("hint");
    }
  }

  pulseSolved() {
    this.container.classList.remove("solved");
    void this.container.offsetWidth;
    this.container.classList.add("solved");
  }

  static jewelName(id) {
    return JEWELS[id % JEWELS.length].name;
  }
}
