# CLAUDE.md — Shift: Puzzle Game

> Repo is named `Horror-rpg` for historical reasons; the active project is the
> **Shift** puzzle game. Rename later if desired.

## Current Status

Phase: **playable web prototype** with **two game modes** the player can switch
between: **Lights Out** (tap toggle) and **Jewel Match** (drag jewels between
shelves to clear runs of 3+). Both run on the same swappable `PuzzleMechanic`
interface, so a third mode is the same shape of work. A port to Godot 4.x can
reuse the same logic. There is **no Godot project yet** — see `docs/PLAN.md` for
the eventual Godot-first plan this grew out of.

## What's Built

```
web/
  index.html              # prototype shell (mobile-sized, portrait)
  manifest.webmanifest    # PWA manifest (installable / add to home screen)
  sw.js                   # service worker: offline-first app-shell cache
  icons/                  # icon.svg + generated icon-192.png / icon-512.png
  src/
    main.js               # mode switcher + wires GameState + renderer + events
    styles.css            # dark flat theme
    engine/               # PURE, dependency-free, runs in browser AND Node
      PuzzleMechanic.js   # interface every mechanic implements
      LightsOut.js        # Lights Out rule + minimum-move solver (Z_m Gauss)
      JewelShelves.js     # Jewel Match rule (drag-to-clear) + BFS solver
      mechanics.js        # registry + DEFAULT_MECHANIC_ID (the swap point)
      levelGenerator.js   # scramble-a-solved-board generator + difficulty tiers
      GameState.js        # one live puzzle: moves, win/lose, stars, hints
      SaveManager.js      # localStorage progress (Godot save.json schema shape)
      EventBus.js         # pub/sub: move_made, board_solved, board_failed, ...
    ui/
      BoardRenderer.js    # renders a grid state, forwards cell taps (Lights Out)
      ShelfRenderer.js    # renders jewel shelves, pointer drag-and-drop (Jewel)
  levels/levels.json      # committed Lights Out set (also generated at runtime)
  levels/jewels.json      # committed 5 hand-authored Jewel Match levels
tools/
  gen-levels.js           # node tools/gen-levels.js [seed] -> web/levels.json
  gen-jewel-levels.js     # validate + compute optimal for jewels.json
  gen-icons.js            # node tools/gen-icons.js -> web/icons/*.png (no deps)
  test/run-tests.js       # node tools/test/run-tests.js  (npm test)
docs/PLAN.md              # the original Godot-first plan (reference)
.github/workflows/        # deploy-pages.yml: publishes web/ to GitHub Pages
.claude/                  # commands + settings for Claude Code
```

## How To Run

```bash
npm test          # run the engine test suite (no deps, pure node)
npm run gen-levels  # regenerate web/levels/levels.json + print a tier summary
npm start         # serve the prototype at http://localhost:8000
```

## Key Design Decision: Swappable Mechanic

The whole game talks to puzzles ONLY through `PuzzleMechanic` (createSolvedState,
applyMove, isSolved, legalMoves, solve, cloneState). To change the game type:

1. Implement a new class extending `PuzzleMechanic`.
2. Register it in `web/src/engine/mechanics.js`.
3. Point `DEFAULT_MECHANIC_ID` at it.

Nothing in the generator, GameState, save, or UI needs to change. State is always
plain JSON-serializable data so it can be saved and (later) sent over a network.

Each mechanic owns the shape of its level data via `stateFromLevel(level)`, so
`GameState` stays agnostic (grids vs shelves vs whatever comes next).

## Game Modes

`main.js` defines a small `MODES` table. Each mode = a mechanic id, its level
source, a renderer factory, goal text, and a save-key namespace (`lo:` / `jm:`)
so per-mode progress never collides. The header has a mode switcher. Adding a
mode = implement a mechanic + a renderer + one `MODES` entry.

## Mechanic: Lights Out

Pressing a cell advances it and its 4 orthogonal neighbours by one state (mod
`states`, default 2). Solved = every cell is 0. The solver does Gaussian
elimination over Z_m and searches the null space for a **minimum-move** solution,
which drives the honest `optimal` count used for star ratings and hints.

## Level Data Format (`web/levels/levels.json`)

```jsonc
{
  "id": 1,                 // 1-based, sequential
  "mechanic": "lights_out",
  "size": 5,               // grid is size x size
  "states": 2,             // distinct cell states
  "optimal": 7,            // solver's minimum move count
  "moves": 14,             // player's move limit (derived from optimal)
  "difficulty": "medium",  // tutorial | easy | medium | hard | expert
  "grid": [[0,1,0,...], ...] // size x size, values 0..states-1
}
```

Every generated level is solvable by construction (scramble a solved board),
then validated by re-solving and recording the true optimal.

## Mechanic: Jewel Match (`jewel_shelves`)

Shelves each hold a left-aligned row of jewels (ids 0..colors-1). A move drags
the **rightmost** jewel of one shelf onto the right end of another (so a shelf
behaves like a stack). After each move, any run of **3+ identical adjacent**
jewels pops; survivors slide together, which can **cascade** into more clears.
Solved = every shelf empty. A bounded BFS finds the minimum-move solution for the
honest `optimal` (and hints). Jewel ids map to Ruby/Sapphire/Emerald/Amber/
Amethyst in `ShelfRenderer`.

### Jewel Level Data Format (`web/levels/jewels.json`)

```jsonc
{
  "mechanic": "jewel_shelves",
  "id": 1,                   // 1-based
  "difficulty": "easy",
  "colors": 5,               // palette size
  "capacity": 7,             // max jewels a single shelf can hold
  "optimal": 5,              // BFS minimum move count
  "moves": 8,                // player's move limit
  "shelves": [[0,1,0],[1,0,1],[]]  // each inner array = one shelf, left→right
}
```

Levels are **hand-authored** in `tools/gen-jewel-levels.js`, then the tool
validates each is solvable and computes/writes the true `optimal`. Not every
layout is solvable under the stack rule — the tool **rejects unsolvable levels
loudly** (exit non-zero), so always run it after editing layouts.

## Star Rating (GameState.calculateStars)

- 3 stars: `movesUsed <= optimal + 1`
- 2 stars: `movesUsed <= floor(limit * 0.75)`
- 1 star: completed at all

## Save Schema (localStorage key `shift.save.v1`)

```jsonc
{
  "version": 1,
  "last_played_level": 1,
  "levels": { "42": { "stars": 3, "best_moves": 10 } },
  "settings": { "sfx_volume": 1.0, "music_volume": 0.6, "haptics": true }
}
```

## Conventions

- ES modules, no build step, no runtime dependencies (so it runs from `file://`,
  a static server, or Node for tests).
- `engine/` must stay free of DOM/browser APIs so it runs headless in tests.
- Mechanics must NOT mutate input state; `applyMove` returns a new state.
- Signals/events use verb_noun form (move_made, board_solved).

## Testing

`tools/test/run-tests.js` is a zero-dependency runner. Cover new engine logic
there. It must stay green: `npm test` exits non-zero on any failure.

## Open Questions / Next Steps

- Confirm the final mechanic (Lights Out vs flood-fill vs other).
- Menu/level-select screens (currently prev/next navigation only).
- Decide eventual delivery target: stay web (PWA) or port to Godot per PLAN.md.
- If Godot: re-implement `PuzzleMechanic` shape in GDScript; the JS solver/tiers
  are a reference spec.
