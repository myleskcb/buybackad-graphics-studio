/* Where each sample sits in its line, in the recipes' order (motion/recipes.json: a design, its other looks,
   then the next design; a line's own full ads after them), and the area that place takes (motion/sample-areas.js
   sampleAreaAt: the metros walked seven at a time, so each takes its share). The landing shows the library in
   an order of its own and keeps neighbours from one metro apart there (app.js scNeighboursDiffer). For the
   stills builders and the renders. */
import { readFileSync } from 'node:fs';
import { sampleAreaAt } from '../motion/sample-areas.js';
const ROOT = new URL('../', import.meta.url).pathname;
const recipes = JSON.parse(readFileSync(ROOT + 'motion/recipes.json', 'utf8')).recipes;
const pos = new Map(), count = {};
for (const r of recipes) { const line = r.subject || 'iphone', n = count[line] || 0; pos.set(r.id, [line, n]); count[line] = n + 3; }
/* a design's sample area: k 0 its own look, 1 and 2 its other looks (~2, ~3) */
export const recipeArea = (id, k = 0) => { const [line, n] = pos.get(id) || ['iphone', 0]; return sampleAreaAt(line, n + k); };
/* a line's own full ad on a seed */
export const fullArea = (line, seed) => sampleAreaAt(line, (count[line] || 0) + seed);
