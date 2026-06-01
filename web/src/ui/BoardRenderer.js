// BoardRenderer — draws a grid state into a container element and reports clicks.
// Purely presentational: it never decides game rules, it just renders the state
// the GameState hands it and forwards cell taps.

export class BoardRenderer {
  /**
   * @param {HTMLElement} container
   * @param {(move: {x:number,y:number}) => void} onCell
   */
  constructor(container, onCell) {
    this.container = container;
    this.onCell = onCell;
    this.size = 0;
    this.cells = []; // flat array of cell elements, indexed y*size + x
  }

  build(size) {
    this.size = size;
    this.cells = [];
    this.container.innerHTML = "";
    this.container.style.setProperty("--grid-size", String(size));
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const cell = document.createElement("button");
        cell.className = "cell";
        cell.type = "button";
        cell.dataset.x = String(x);
        cell.dataset.y = String(y);
        cell.addEventListener("click", () => this.onCell({ x, y }));
        this.container.appendChild(cell);
        this.cells.push(cell);
      }
    }
  }

  render(state) {
    if (state.size !== this.size) this.build(state.size);
    for (let y = 0; y < state.size; y++) {
      for (let x = 0; x < state.size; x++) {
        const cell = this.cells[y * state.size + x];
        const v = state.grid[y][x];
        cell.classList.toggle("on", v !== 0);
        cell.dataset.state = String(v);
      }
    }
  }

  // Briefly highlight a cell (used by the hint button).
  flashHint(x, y) {
    const cell = this.cells[y * this.size + x];
    if (!cell) return;
    cell.classList.remove("hint");
    // force reflow so the animation restarts
    void cell.offsetWidth;
    cell.classList.add("hint");
  }

  pulseSolved() {
    this.container.classList.remove("solved");
    void this.container.offsetWidth;
    this.container.classList.add("solved");
  }
}
