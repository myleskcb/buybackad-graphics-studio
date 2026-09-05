#!/usr/bin/env node
/* Dump the engine's data blocks as JSON — the shared contract another tool,
   another agent, or your generator can read without parsing the console. */
import * as E from '../../engine/engine.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
const OUT = process.argv[2] || '../spec';
mkdirSync(OUT, { recursive: true });
const w = (f, o) => { writeFileSync(`${OUT}/${f}`, JSON.stringify(o, null, 2)); console.log('wrote', f); };

w('palettes.json', E.PALETTES.map(p => ({
  ...p,
  contrast: {
    inkOnGround: +E.contrast(p.ink, p.ground).toFixed(2),
    accentOnGround: +E.contrast(p.accent, p.ground).toFixed(2),
    onHot: E.onColor(p.hot, p), onAccent: E.onColor(p.accent, p), onPaper: E.onColor(p.paper, p)
  }
})));
w('type-pairs.json', E.PAIRS);
w('formats.json', E.SIZES);
w('content.json', E.CONTENT);
w('devices.json', E.QUEUE.map(([group, items]) => ({
  group, devices: items.map(([key, name, effect, purpose]) => ({ key, name, effect, purpose }))
})));
w('rules.json', E.RULES.map(([id, rule, threshold, catches]) => ({ id, rule, threshold, catches })));
w('negative-prompt.json', E.PERMANENT_NEG);
w('archetypes.json', E.ARCHS.map(([key, name, note]) => ({ key, name, note })));
