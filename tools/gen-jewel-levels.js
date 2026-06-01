// Validate the hand-authored Jewel Shelves levels and compute each level's true
// minimum-move count via BFS. Writes web/levels/jewels.json with `optimal` and a
// derived `moves` limit filled in. Run: node tools/gen-jewel-levels.js
//
// Authoring rules of thumb:
//   - jewel ids are 0..colors-1
//   - a shelf is a left-to-right row; 3+ identical adjacent jewels clear
//   - keep total jewels modest so BFS stays fast and the puzzle is fair
//   - every color's total count should be a multiple of 3 OR be clearable by
//     stacking (the solver is the source of truth — unsolvable levels are
//     rejected loudly)

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JewelShelves } from "../web/src/engine/JewelShelves.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const jewels = new JewelShelves();

// Jewel palette (kept in sync with styles/renderer):
//   0 Ruby  1 Sapphire  2 Emerald  3 Amber  4 Amethyst

// Hand-authored levels. capacity = max jewels a shelf can hold.
const AUTHORED = [
  {
    id: 1,
    difficulty: "tutorial",
    colors: 5,
    capacity: 6,
    // One drag completes a run of three rubies. Teaches the core action.
    shelves: [
      [0, 0],
      [0],
      [],
    ],
  },
  {
    id: 2,
    difficulty: "easy",
    colors: 5,
    capacity: 6,
    // Two colors, each split across shelves; consolidate to clear.
    shelves: [
      [0, 1, 0],
      [1, 0, 1],
      [],
    ],
  },
  {
    id: 3,
    difficulty: "easy",
    colors: 5,
    capacity: 7,
    // Three colors; an empty buffer shelf makes routing possible.
    shelves: [
      [0, 1, 2, 0],
      [2, 1, 0, 2],
      [1],
      [],
    ],
  },
  {
    id: 4,
    difficulty: "medium",
    colors: 5,
    capacity: 7,
    // Cascade reward: clearing one run lets the survivors form another.
    shelves: [
      [0, 1, 1, 0],
      [2, 0, 2],
      [1, 2],
      [],
    ],
  },
  {
    id: 5,
    difficulty: "medium",
    colors: 5,
    capacity: 7,
    // Capstone: three colors fully interleaved with only one buffer shelf, so
    // routing order matters throughout. Verified solvable; highest optimal.
    shelves: [
      [2, 0, 1, 2],
      [0, 1, 0],
      [1, 2],
      [],
    ],
  },
];

const out = [];
let allOk = true;

for (const level of AUTHORED) {
  const state = jewels.stateFromLevel({ ...level });
  const total = level.shelves.reduce((n, s) => n + s.length, 0);
  const solution = jewels.solve(state);

  if (!solution) {
    allOk = false;
    console.error(`✗ Level ${level.id} (${level.difficulty}): NO SOLUTION FOUND — fix the layout`);
    continue;
  }

  const optimal = solution.length;
  // Move limit: generous on tiny levels, tighter as they grow.
  const moves = Math.max(optimal + 2, Math.round(optimal * 1.6));

  out.push({
    mechanic: "jewel_shelves",
    id: level.id,
    difficulty: level.difficulty,
    colors: level.colors,
    capacity: level.capacity,
    jewels: total,
    optimal,
    moves,
    shelves: level.shelves,
  });

  console.log(
    `✓ Level ${level.id} (${level.difficulty}): ${total} jewels, optimal ${optimal}, limit ${moves}`
  );
}

if (!allOk) {
  console.error("\nSome levels are unsolvable. Not writing output.");
  process.exit(1);
}

const outPath = resolve(__dirname, "../web/levels/jewels.json");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
console.log(`\nWrote ${out.length} levels -> ${outPath}`);
