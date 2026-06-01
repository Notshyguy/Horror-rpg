Scaffold a new puzzle mechanic behind the swappable interface.

The user will name the mechanic and describe its rule. Then:

1. Create `web/src/engine/{Name}.js` exporting a class that extends
   `PuzzleMechanic` (see `web/src/engine/PuzzleMechanic.js`). Implement:
   - `id`, `name`
   - `createSolvedState(config)` — returns a solved, JSON-serializable state
   - `applyMove(state, move)` — returns a NEW state (never mutate input)
   - `isSolved(state)`
   - `legalMoves(state)`
   - `solve(state)` — aim for minimum moves; powers hints + star ratings
2. Register the instance in `web/src/engine/mechanics.js`.
3. Add tests to `tools/test/run-tests.js` covering the rule, solver validity,
   and that the generator produces solvable boards for it.
4. Run `npm test` and fix until green.
5. Update `CLAUDE.md` (the mechanics list) and commit.

Do NOT change the `PuzzleMechanic` interface itself without flagging it — every
mechanic and the generator/GameState depend on it.
