#!/usr/bin/env node
/* EVERY PATH, EVERY CHANGED CARD (owner, 2026-10-01: "Make sure it comes out,
 * clean every single time and properly").
 *
 * A card changed in assets/showcase/tpl since <base> is drawn the ways a
 * visitor gets it, and measured by the one gate (pgCheck, rule 87):
 *   gallery   renderThumb's sequence, the card's own look on
 *   square    Easy Mode (openShowcase + renderEzCanvas), the number typed in
 *   three4    the same, 3:4
 *   story     the same, 9:16
 *   video     frame 0 of the square scene is the still, and the CTA shift
 *             passes its own audit (rule 65)
 * and again from its record at <base>. A failure the card already had at
 * <base> is the card's own; one that is new is the change's, and is listed.
 *
 *   node scripts/sweep_changed_cards.mjs <base-commit> [out.json] [--ids=a,b]
 *   (:8899 + Chrome; CHROME=, FABRIC_JS=)  exits 1 when a change added a failure
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { openStudio } from './_showcase_harness.mjs';
const ROOT = new URL('../', import.meta.url).pathname;
const BASE = process.argv[2];
if (!BASE){ console.error('usage: sweep_changed_cards.mjs <base-commit> [out.json] [--ids=a,b]'); process.exit(2); }
const OUT = process.argv.find(a => a.endsWith('.json')) || ROOT + '.render/sweep-changed.json';
const ONLY = (process.argv.find(a => a.startsWith('--ids=')) || '').slice(6);
const changed = ONLY ? ONLY.split(',') : execSync(`git -C ${ROOT} diff --name-only ${BASE} HEAD -- assets/showcase/tpl`).toString().trim().split('\n')
  .filter(Boolean).map(f => f.replace(/^.*\//, '').replace(/\.json$/, ''));
const recNow = id => JSON.parse(readFileSync(ROOT + 'assets/showcase/tpl/' + id + '.json', 'utf8'));
const recThen = id => { try { return JSON.parse(execSync(`git -C ${ROOT} show ${BASE}:assets/showcase/tpl/${id}.json`, { maxBuffer: 1 << 26 }).toString()); } catch (e){ return null; } };

async function measure(page, id, rec){
  return page.evaluate(async (id, rec) => {
    const out = {};
    const codes = r => r.fails.map(f => f.code + ':' + (f.line || ''));
    try {
      /* the gallery */
      const t = await __sc.prep(rec, id);
      const { sc } = __sc.paint(t); out.gallery = codes(pgCheck(sc)); sc.dispose();
      /* Easy Mode, from this record */
      await scLoadIndex();
      account = { email: 'audit@local', role: 'admin', plan: 'pro' };
      const tid = 'sc-' + id, k = TEMPLATES.findIndex(x => x.id === tid);
      if (k >= 0) TEMPLATES.splice(k, 1);
      SHOWCASE.records[id] = rec;
      await openShowcase(id);
      if (ez.tpl !== tid) return { err: 'Easy Mode opened ' + ez.tpl };
      await ensureTplAssets(ezTpl());
      $('ez-phone').value = '(562) 999-4994';
      await document.fonts.ready; try { fabric.util.clearFabricFontCache(); } catch (e){}
      ez.tag = { look: 'solid', gradient: null, angle: 90, outline: 'auto', effect: 'auto' };
      ez.phonePick = null;
      for (const fmt of ['square', 'three4', 'story']){
        if (!FORMATS[fmt]) continue;
        const s2 = renderEzCanvas(1080, 'png', undefined, undefined, fmt, true);
        out[fmt] = codes(pgCheck(s2));
        if (fmt === 'square'){
          const W = s2.width, H = s2.height, bake = motionBake(s2, W, H, W, H);
          const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
          const z0 = motionFrameZero(s2, bake, cv.getContext('2d', { willReadFrequently: true }));
          out.video = [].concat(z0.ok ? [] : ['frame0:' + z0.off]).concat(bake.cta ? [] : ['cta:' + String(bake.ctaOff).slice(0, 60)]);
          out.png = s2.toDataURL({ format: 'jpeg', quality: 0.8 });
        }
        s2.dispose();
      }
    } catch (e){ return { err: String(e).slice(0, 160) }; }
    return out;
  }, id, rec);
}

let { browser, page, errors } = await openStudio('&emoji=off');
const res = {}, PATHS = ['gallery', 'square', 'three4', 'story', 'video'];
const shots = process.env.SHOTS; if (shots) mkdirSync(shots, { recursive: true });
for (let i = 0; i < changed.length; i++){
  if (i && i % 60 === 0){ await browser.close(); ({ browser, page, errors } = await openStudio('&emoji=off')); }
  const id = changed[i], then = recThen(id);
  const now = await measure(page, id, recNow(id));
  const was = then ? await measure(page, id, then) : {};
  const fresh = {};
  if (now.err) fresh.err = [now.err];
  else PATHS.forEach(p => { const w = new Set(was[p] || []); const f = (now[p] || []).filter(c => !w.has(c)); if (f.length) fresh[p] = f; });
  if (shots && now.png) writeFileSync(shots + '/' + id + '.jpg', Buffer.from(now.png.split(',')[1], 'base64'));
  delete now.png; delete was.png;
  res[id] = { fresh, now, was };
  if ((i + 1) % 20 === 0) console.log('…' + (i + 1) + '/' + changed.length);
}
await browser.close();
mkdirSync(OUT.replace(/\/[^/]*$/, ''), { recursive: true });
writeFileSync(OUT, JSON.stringify(res, null, 1));
const bad = Object.entries(res).filter(([, r]) => Object.keys(r.fresh).length);
const own = Object.values(res).filter(r => PATHS.some(p => (r.now[p] || []).length)).length;
console.log('cards ' + changed.length + ' · a failure the change added: ' + bad.length + ' · cards with any failure (their own included): ' + own + ' · page errors ' + errors.length);
bad.forEach(([id, r]) => console.log('  ' + id + '  ' + JSON.stringify(r.fresh)));
process.exit(bad.length ? 1 : 0);
