Regenerate the committed level set.

1. Run: `node tools/gen-levels.js` (optionally pass a seed, e.g. `node tools/gen-levels.js 12345`).
2. This writes `web/levels/levels.json` and prints a per-tier summary
   (count + min/avg/max optimal moves).
3. Sanity-check the summary: optimal counts should increase across tiers and no
   tier should be empty.
4. Run `npm test` to confirm the engine still passes.
5. Commit: `git add web/levels/levels.json && git commit -m "chore(levels): regenerate level set"`.
