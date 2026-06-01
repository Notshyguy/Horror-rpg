Run the engine test suite and report results.

1. Run: `npm test` (which runs `node tools/test/run-tests.js`).
2. If anything fails, read the failing assertion, open the relevant file in
   `web/src/engine/`, fix the logic (not the test, unless the test is wrong),
   and re-run until green.
3. Report the final pass/fail count.
