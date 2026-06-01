# Build Plan & Decisions

## Origin

This project started from a detailed **Godot 4.x, Claude-Code-first** plan for a
mobile flood-fill puzzle game ("Shift") with 500+ levels and AdMob monetization.
The full original plan is preserved as [`PLAN.jsx`](./PLAN.jsx) (a React
document) for reference — it covers the Godot architecture, autoloads, level
pipeline, hooks/CI, store submission, and division of labor.

## Decision Log

**2026-06-01 — Start as a playable web prototype, mechanic = Lights Out.**
- This container has no Godot installed, so Godot files can't be run or validated
  here. A web prototype can be built *and verified* immediately (logic runs under
  Node; tests pass).
- The intended mechanic is **Lights Out**, not the flood-fill in the original
  plan. We implemented Lights Out concretely but behind a **swappable
  `PuzzleMechanic` interface**, so the mechanic (or an eventual Godot port) can
  change without rewriting the app.
- The pure engine (`web/src/engine/`) is written DOM-free so it doubles as a
  precise, tested spec for any future port.

## What carried over from the original plan

| Concept | Original (Godot) | Now (web prototype) |
| --- | --- | --- |
| Pure puzzle logic | `PuzzleLogic.gd` | `engine/PuzzleMechanic.js` + `LightsOut.js` |
| Level generator + solver | `LevelGenerator.gd` (BFS) | `engine/levelGenerator.js` + solver in `LightsOut.js` |
| Difficulty tiers | tutorial→expert | `DEFAULT_TIERS` in `levelGenerator.js` |
| Star rating | 3/2/1 thresholds | `GameState.calculateStars` (same thresholds) |
| Save file | `user://save.json` | `SaveManager` → localStorage (same schema shape) |
| Global signals | `EventBus` autoload | `engine/EventBus.js` |
| Slash commands | `.claude/commands/*` | `.claude/commands/*` (gen-levels, test, new-mechanic, commit) |

## Open questions before committing further

1. **Final mechanic** — stay Lights Out, or try flood-fill / another rule? The
   swap is one file thanks to the mechanic interface.
2. **Delivery target** — ship as a web PWA, or port to Godot per the original
   plan for native Android/iOS + AdMob?
3. **Scope of level set** — current generator makes ~150 across 5 tiers; the
   original targeted 500+.

## Suggested next steps (web track)

- Main menu + paginated level select (save already tracks stars/unlocks).
- Win/lose overlays with star-drop animation.
- Settings (sfx/music/haptics) wired to `SaveManager.settings`.
- PWA manifest + service worker for installability.
