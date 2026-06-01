// Pre-generate a level set to web/levels/levels.json. The web prototype
// generates levels at runtime, but committing a set gives a stable, inspectable
// dataset and mirrors the /gen-levels pipeline from the plan.
//
// Usage: node tools/gen-levels.js [seed]

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { generateLevelSet, DEFAULT_TIERS } from "../web/src/engine/levelGenerator.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const seed = Number(process.argv[2] ?? 20260601);

const levels = generateLevelSet({ seed });

const outPath = resolve(__dirname, "../web/levels/levels.json");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(levels, null, 2));

// Summary by tier.
const byTier = {};
for (const lvl of levels) {
  const t = (byTier[lvl.difficulty] ??= { count: 0, sumOpt: 0, min: Infinity, max: 0 });
  t.count++;
  t.sumOpt += lvl.optimal;
  t.min = Math.min(t.min, lvl.optimal);
  t.max = Math.max(t.max, lvl.optimal);
}

console.log(`Generated ${levels.length} levels (seed ${seed}) -> ${outPath}\n`);
console.log("tier        count   optimal (min/avg/max)");
console.log("---------------------------------------------");
for (const tier of DEFAULT_TIERS) {
  const t = byTier[tier.label];
  if (!t) continue;
  const avg = (t.sumOpt / t.count).toFixed(1);
  console.log(
    `${tier.label.padEnd(11)} ${String(t.count).padStart(4)}    ${t.min} / ${avg} / ${t.max}`
  );
}
