#!/usr/bin/env node
/* BUILD THE CONSOLE FROM THE REAL ENGINE.
 *
 * The previous lab/console.html carried a hand-copied duplicate of the whole
 * engine. Nothing kept the two in step, so the console drifted: it was still
 * showing twelve rules after the engine grew to fifteen, still naming fonts
 * that were never embedded, and none of the layout fixes reached it. A
 * configurator that cannot track the thing it configures is worse than no
 * configurator, because it lies with a straight face.
 *
 * So the console is now GENERATED. This reads engine/engine.mjs verbatim,
 * swaps the two seams that need Node (the metrics file and the font loader)
 * for browser equivalents, and injects it into the shell. Re-run it after any
 * engine change and the console is current by construction.
 *
 *   node scripts/build_console.mjs      ->  lab/console.html
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { FONT_FILES } from '../engine/fonts.mjs';

const ROOT = new URL('../', import.meta.url).pathname;
const read = p => readFileSync(ROOT + p, 'utf8');

/* ── 1 · the engine, with its Node seams replaced ───────────────────────── */
let engine = read('engine/engine.mjs');

/* The fonts module reads woff2 off disk and base64s them. In the browser the
   files are served alongside the page, so the faces are declared by URL: the
   HTML stays small and the browser caches them across reloads. */
const fontsShim = `/* ── inlined by scripts/build_console.mjs ── */
const FONT_FILES=${JSON.stringify(FONT_FILES)};
const FONT_BASE='../assets/fonts/';
function nearestWeight(family,weight){
  const have=Object.keys(FONT_FILES[family]||{}).map(Number);
  if(!have.length)return weight;
  return have.reduce((a,b)=>Math.abs(b-weight)<Math.abs(a-weight)?b:a);
}
function faceCSS(used){
  const out=[];
  for(const [family,weights] of Object.entries(used))
    for(const w of [...weights].sort((a,b)=>a-b)){
      const file=(FONT_FILES[family]||{})[w];
      if(!file)continue;
      out.push(\`@font-face{font-family:'\${family}';font-style:normal;font-weight:\${w};\`+
               \`src:url(\${FONT_BASE}\${file}) format('woff2');font-display:block;}\`);
    }
  return out.join('');
}`;

const importLine = `import { faceCSS, nearestWeight, FONT_FILES } from './fonts.mjs';\nimport { readFileSync } from 'node:fs';`;
if (!engine.includes(importLine)) throw new Error('engine imports moved — update build_console.mjs');
engine = engine.replace(importLine, fontsShim);

/* The measured type metrics are a build artefact; inline them as data. */
const metricsLine = engine.match(/^const METRICS=.*$/m);
if (!metricsLine) throw new Error('METRICS loader moved — update build_console.mjs');
if (!existsSync(ROOT + 'spec/metrics.json'))
  throw new Error('spec/metrics.json missing — run: node tools/gfx/measure_fonts.mjs');
engine = engine.replace(metricsLine[0], `const METRICS=${read('spec/metrics.json')};`);

/* `export {...}` is legal in a module script but pointless here — the UI shares
   the module scope, so drop it rather than leave a dead statement. */
engine = engine.replace(/\nexport\{[\s\S]*?\n\};\s*$/, '\n');

if (/node:|readFileSync|import\.meta/.test(engine))
  throw new Error('engine still references Node after transform:\n  ' +
    engine.split('\n').filter(l => /node:|readFileSync|import\.meta/.test(l)).join('\n  '));

/* ── 2 · shell + ui ────────────────────────────────────────────────────── */
const shell = read('scripts/console_shell.html');
const ui = read('scripts/console_ui.js');

const stamp = process.env.BUILD_STAMP || 'dev';
const html = shell
  .replace('/*__ENGINE__*/', () => engine)
  .replace('/*__UI__*/', () => ui)
  .replace(/__STAMP__/g, stamp);

writeFileSync(ROOT + 'lab/console.html', html);
console.log(`lab/console.html  ${(html.length / 1024).toFixed(0)} KB` +
  `  (engine ${(engine.length / 1024).toFixed(0)} KB · ui ${(ui.length / 1024).toFixed(0)} KB)`);
