// LightsOut — classic toggle puzzle.
//
// Rule: pressing a cell advances that cell AND its orthogonal neighbours by one
// state (mod `states`). With the default of 2 states this is the familiar
// on/off Lights Out. The board is solved when every cell is 0 ("all off").
//
// The solver uses Gaussian elimination over Z_m (m = states, must be prime, and
// 2 is the normal case). It returns a *minimum-move* solution by searching the
// null space, which gives an honest "optimal" count for the star rating.

import { PuzzleMechanic } from "./PuzzleMechanic.js";

export class LightsOut extends PuzzleMechanic {
  get id() {
    return "lights_out";
  }

  get name() {
    return "Lights Out";
  }

  createSolvedState(config) {
    const size = config.size;
    const states = config.states ?? 2;
    const grid = Array.from({ length: size }, () => new Array(size).fill(0));
    return { mechanic: this.id, size, states, grid };
  }

  applyMove(state, move) {
    const { x, y } = move;
    const size = state.size;
    if (x < 0 || y < 0 || x >= size || y >= size) {
      throw new Error(`move out of bounds: (${x}, ${y})`);
    }
    const next = this.cloneState(state);
    const m = next.states;
    for (const [dx, dy] of [
      [0, 0],
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < size && ny < size) {
        next.grid[ny][nx] = (next.grid[ny][nx] + 1) % m;
      }
    }
    return next;
  }

  isSolved(state) {
    for (const row of state.grid) {
      for (const v of row) {
        if (v !== 0) return false;
      }
    }
    return true;
  }

  legalMoves(state) {
    const moves = [];
    for (let y = 0; y < state.size; y++) {
      for (let x = 0; x < state.size; x++) {
        moves.push({ x, y });
      }
    }
    return moves;
  }

  solve(state) {
    const n = state.size;
    const m = state.states;
    const cells = n * n;

    // Build the toggle matrix A (cells x cells). Column j = the effect of
    // pressing button j on every cell.
    const A = Array.from({ length: cells }, () => new Array(cells).fill(0));
    for (let by = 0; by < n; by++) {
      for (let bx = 0; bx < n; bx++) {
        const j = by * n + bx;
        for (const [dx, dy] of [
          [0, 0],
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const cx = bx + dx;
          const cy = by + dy;
          if (cx >= 0 && cy >= 0 && cx < n && cy < n) {
            A[cy * n + cx][j] = 1;
          }
        }
      }
    }

    // Target toggle for each cell so it lands on 0: b_i = (-current) mod m.
    const b = new Array(cells);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        b[y * n + x] = (m - (state.grid[y][x] % m)) % m;
      }
    }

    const result = solveModular(A, b, m);
    if (!result) return null;

    // result.x[j] = number of times button j is pressed. Expand to a move list.
    const moves = [];
    for (let j = 0; j < cells; j++) {
      const presses = result.x[j];
      for (let k = 0; k < presses; k++) {
        moves.push({ x: j % n, y: Math.floor(j / n) });
      }
    }
    return moves;
  }
}

// ── Modular linear algebra over Z_m (m prime) ────────────────────────────────

function modInverse(a, m) {
  a = ((a % m) + m) % m;
  for (let x = 1; x < m; x++) {
    if ((a * x) % m === 1) return x;
  }
  throw new Error(`no modular inverse for ${a} mod ${m}`);
}

// Solve A x = b (mod m) and return a minimum-weight x (minimising sum of x[j]),
// searching across the solution space. Returns null if inconsistent.
function solveModular(A, b, m) {
  const rows = A.length;
  const cols = A[0].length;

  // Augmented matrix.
  const M = A.map((row, i) => [...row.map((v) => ((v % m) + m) % m), ((b[i] % m) + m) % m]);

  const pivotCol = new Array(rows).fill(-1);
  const where = new Array(cols).fill(-1); // column -> pivot row
  let row = 0;

  for (let col = 0; col < cols && row < rows; col++) {
    // Find a pivot in this column at or below `row`.
    let sel = -1;
    for (let r = row; r < rows; r++) {
      if (M[r][col] !== 0) {
        sel = r;
        break;
      }
    }
    if (sel === -1) continue;

    [M[row], M[sel]] = [M[sel], M[row]];

    const inv = modInverse(M[row][col], m);
    for (let c = col; c <= cols; c++) {
      M[row][c] = (M[row][c] * inv) % m;
    }
    for (let r = 0; r < rows; r++) {
      if (r !== row && M[r][col] !== 0) {
        const factor = M[r][col];
        for (let c = col; c <= cols; c++) {
          M[r][c] = (((M[r][c] - factor * M[row][c]) % m) + m) % m;
        }
      }
    }
    pivotCol[row] = col;
    where[col] = row;
    row++;
  }

  // Consistency check: any all-zero coefficient row with nonzero RHS = no solution.
  for (let r = 0; r < rows; r++) {
    let allZero = true;
    for (let c = 0; c < cols; c++) {
      if (M[r][c] !== 0) {
        allZero = false;
        break;
      }
    }
    if (allZero && M[r][cols] !== 0) return null;
  }

  // Particular solution: free variables = 0.
  const particular = new Array(cols).fill(0);
  for (let c = 0; c < cols; c++) {
    if (where[c] !== -1) {
      particular[c] = M[where[c]][cols];
    }
  }

  const freeCols = [];
  for (let c = 0; c < cols; c++) {
    if (where[c] === -1) freeCols.push(c);
  }

  // Null-space basis: for each free column, build the solution to A x = 0 with
  // that free var = 1 and other free vars = 0.
  const nullBasis = freeCols.map((fc) => {
    const vec = new Array(cols).fill(0);
    vec[fc] = 1;
    for (let c = 0; c < cols; c++) {
      if (where[c] !== -1) {
        // pivot row for column c has equation: x_c + sum(coeff * free) = rhs.
        // Homogeneous => x_c = -coeff_at_fc.
        const pr = where[c];
        vec[c] = ((-M[pr][fc] % m) + m) % m;
      }
    }
    return vec;
  });

  const k = nullBasis.length;
  const weight = (vec) => vec.reduce((s, v) => s + v, 0);

  // If the solution space is small, brute-force the minimum-weight combination.
  // Otherwise just return the particular solution (still valid, maybe not optimal).
  const SEARCH_LIMIT = 4096;
  if (k === 0 || Math.pow(m, k) > SEARCH_LIMIT) {
    return { x: particular, optimal: k === 0 };
  }

  let best = particular.slice();
  let bestWeight = weight(particular);
  const coeffs = new Array(k).fill(0);

  const total = Math.pow(m, k);
  for (let combo = 0; combo < total; combo++) {
    let t = combo;
    for (let i = 0; i < k; i++) {
      coeffs[i] = t % m;
      t = Math.floor(t / m);
    }
    const cand = particular.slice();
    for (let i = 0; i < k; i++) {
      if (coeffs[i] === 0) continue;
      const basis = nullBasis[i];
      for (let c = 0; c < cols; c++) {
        cand[c] = (cand[c] + coeffs[i] * basis[c]) % m;
      }
    }
    const w = weight(cand);
    if (w < bestWeight) {
      bestWeight = w;
      best = cand;
    }
  }

  return { x: best, optimal: true };
}
