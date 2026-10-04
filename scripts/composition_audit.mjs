#!/usr/bin/env node
/* COMPOSITION AUDIT — is the card laid out on purpose?
 *
 * Owner, 2026-10-02, of a Pokémon card: "it looks incomplete. It looks like
 * you threw everything down and then abandoned it"; of a checklist's selling
 * points: "lock these centered … auto center everything". DESIGN-LAW rule 109.
 *
 * Every earlier audit asked whether a line reads (the gate), whether there is
 * a photograph (rule 105), whether the colour holds. None asked whether the
 * parts of a card share a line. This one paints each offered card as the
 * library does (__sc.paint) and splits it into the parts that read as one
 * thing, as the designer's Centre all does (app.js ccParts: a plate and its
 * lines, a ring and its icon, an icon and its words, a list of such rows).
 * Then, per part:
 *
 *   loose     not on the card's middle (within 8 px of 1080) and sharing no
 *             left or right edge with another part, and not a small piece in
 *             a corner (ccCorner): it lines up with nothing.
 *   nearMiss  a loose part 20 to 90 px off the middle: it was meant to be
 *             centred and is not (the scriptRetro phone plate, 67 px off).
 *   onWords   a picture (no text) over more than 15% of a headline's box.
 *
 * A card fails with a nearMiss, two loose parts (or one loose headline,
 * number or call to action), or a picture on its words. The measure is
 * __sc.comp in scripts/_showcase_harness.mjs, shared with centre_showcase.mjs.
 *
 * usage:  python3 -m http.server 8899   then
 *         CHROME=… [FABRIC_JS=…] node scripts/composition_audit.mjs [--ids a,b] [--json out.json]
 * Exits 1 when an offered card fails. */
import { readFileSync, writeFileSync } from 'node:fs';
import { openStudio, live } from './_showcase_harness.mjs';
const ROOT = new URL('../', import.meta.url).pathname, DIR = ROOT + 'assets/showcase/';
const argv = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const idx = JSON.parse(readFileSync(DIR + 'index.json', 'utf8'));
const holds = (() => { try { return JSON.parse(readFileSync(ROOT + 'assets/choice-holds.json', 'utf8')).cards || {}; } catch (e){ return {}; } })();
const only = argv('--ids') ? new Set(argv('--ids').split(',')) : null;
const work = idx.filter(c => only ? only.has(c.id) : (live(c) && !holds[c.id])).map(c => c.id);
console.log('cards: ' + work.length);

const { browser, page } = await openStudio();
const rows = [];
for (let i = 0; i < work.length; i += 6){
  const batch = work.slice(i, i + 6);
  rows.push(...await page.evaluate(async ids => {
    const out = [];
    for (const id of ids){
      try { const r = __sc.comp(await __sc.load(id)); r.sc.dispose(); out.push({ id, fail: r.fail, loose: r.loose, near: r.near, onWords: r.onWords, axis: r.axis, parts: r.parts }); }
      catch (e){ out.push({ id, err: String(e).slice(0, 160) }); }
    }
    return out;
  }, batch));
  process.stdout.write('\r' + Math.min(i + 6, work.length) + '/' + work.length);
}
console.log('');
const bad = rows.filter(r => r.err || (r.fail && r.fail.length));
const count = k => rows.filter(r => r.fail && r.fail.includes(k)).length;
console.log(`fail ${bad.length} of ${rows.length}: nearMiss ${count('nearMiss')} · loose ${count('loose')} · onWords ${count('onWords')} · errors ${rows.filter(r => r.err).length}`);
bad.forEach(r => console.log(r.id.padEnd(24) + (r.err || r.fail.join('+') + '  ' + JSON.stringify({ near: r.near, loose: r.loose, onWords: r.onWords }))));
if (argv('--json')) writeFileSync(argv('--json'), JSON.stringify(rows, null, 1));
await browser.close();
process.exit(bad.length ? 1 : 0);
