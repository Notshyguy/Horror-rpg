# CLAUDE.md — Shift: Puzzle Game

> Repo is named `Horror-rpg` for historical reasons; the active project is the
> **Shift** puzzle game. Rename later if desired.

## Current Status

Phase: **playable web prototype**. The mechanic is **Lights Out**, implemented
behind a swappable interface so it can be replaced (or a port to Godot 4.x can
reuse the same logic shape). There is **no Godot project yet** — see
`docs/PLAN.md` for the eventual Godot-first build plan this grew out of.

## What's Built

```
web/
  index.html              # prototype shell (mobile-sized, portrait)
  src/
    main.js               # wires generator + GameState + renderer + events
    styles.css            # dark flat theme
    engine/               # PURE, dependency-free, runs in browser AND Node
      PuzzleMechanic.js   # interface every mechanic implements
      LightsOut.js        # Lights Out rule + minimum-move solver (Z_m Gauss)
      mechanics.js        # registry + DEFAULT_MECHANIC_ID (the swap point)
      levelGenerator.js   # scramble-a-solved-board generator + difficulty tiers
      GameState.js        # one live puzzle: moves, win/lose, stars, hints
      SaveManager.js      # localStorage progress (Godot save.json schema shape)
      EventBus.js         # pub/sub: move_made, board_solved, board_failed, ...
    ui/
      BoardRenderer.js    # renders a grid state, forwards cell taps
  levels/levels.json      # committed generated set (also generated at runtime)
tools/
  gen-levels.js           # node tools/gen-levels.js [seed] -> web/levels.json
  test/run-tests.js       # node tools/test/run-tests.js  (npm test)
docs/PLAN.md              # the original Godot-first plan (reference)
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
