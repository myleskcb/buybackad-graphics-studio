#!/usr/bin/env node
/* RE-GROUND — real photographs of the goods under the library's cards.
 *
 * Owner, 2026-10-04, of the fanned trading-card photographs: "These are our
 * classic background images, which I just wasn't really a fan of go ahead and
 * remove", then "replace everything and please use images of real things.
 * People buy. This is like so classic AI slop" and "We need to look like
 * graphic designers made this … It's a placeholder at very best."
 * DESIGN-LAW rule 117.
 *
 * Every live card standing on a generated photograph (assets/bg) or a drawn
 * ground (dg_cast) is given a real photograph of what it buys (POOLS: the
 * curated Commons set in assets/bg-web, credits in its ATTRIBUTION.json, and
 * the Apple product scenes), chosen by the words on the card, sharp, in its
 * own colour, its shade solved for it (__sc.naturalGround: bands first, every
 * line 4.5:1 on the core of its strokes, supporting copy 3.5:1), and kept
 * only when the writers' gate accepts it. The least-used photographs of the
 * pool are tried first (--try, 5), so the set is shared out. A card with no
 * real photograph that passes is reported.
 *
 * usage: node scripts/reground_showcase.mjs [--ids a,b] [--skip-cats sports] [--try 5] [--pin dry.json] [--write] [--json f] [--out dir]
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { openStudio, gateRecords, live } from './_showcase_harness.mjs';
const ROOT = new URL('../', import.meta.url).pathname, DIR = ROOT + 'assets/showcase/';
const argv = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const WRITE = process.argv.includes('--write');
/* what is retired: every photograph the studio generated (assets/bg, the
   Designer Library's made-up scenes) and every drawn ground (assets/showcase/bg
   dg_cast: a flat colour and a grey slab icon). What stands in: a real
   photograph of the goods, from the curated Commons set (assets/bg-web, with
   ATTRIBUTION.json), or the Apple product scenes, matched to what the card
   says it buys. */
export const retired = src => /^assets\/bg\//.test(src) || /^assets\/showcase\/bg\/dg_cast_/.test(src);
/* a single coin's face filling the frame (on black, or a gold disc) reads as
   a flat field or as words over its lettering once the copy is on it: out */
const NOT_A_GROUND = /^coins-american-gold-eagle-coin-[12]\.|^coins-coin-hoard-2\./;   // and the slabbed Morgan, which shades to black
const WEB = readdirSync(ROOT + 'assets/bg-web').filter(f => /\.jpe?g$/i.test(f) && !NOT_A_GROUND.test(f)).map(f => 'assets/bg-web/' + f);
const web = re => WEB.filter(f => re.test(f.split('/').pop()));
const SILVER_COINS = web(/^coins-(morgan|half-dollar|coin-hoard)/);
const GOLD_COINS = web(/^coins-american-gold-eagle/);
/* [words on the card, the photographs for them], first match wins; the last row is the category's default */
export const POOLS = {
  phones: [[/MACBOOK|\bMAC\b|IMAC/, web(/^macbook-/)], [/IPAD/, ['assets/scenes/scene-flat-ipads.jpg', 'assets/scenes/scene-studio-amber-ipad.jpg']],
    [/WATCH/, ['assets/scenes/scene-studio-teal-watch.jpg']], [/./, web(/^phones-/)]],
  cars: [[/TRUCK|TACOMA|F-?150|SILVERADO|PICKUP|\bRAM\b|TUNDRA/, web(/^trucks-/)], [/\bVANS?\b|SPRINTER|TRANSIT|PROMASTER/, web(/^vans-/)],
    [/MOTORCYCLE|HARLEY|BIKE/, web(/^bikes-/)], [/./, web(/^cars-/)]],
  gold: [[/WATCH|ROLEX/, web(/^gold-(gold-watch|rolex)/)], [/\bCOINS?\b|BULLION|\bBARS?\b|EAGLE/, GOLD_COINS],
    [/./, web(/^gold-/).filter(f => !/watch|rolex/.test(f))]],
  silver: [[/\bCOINS?\b|DOLLAR|EAGLE|BULLION|\bBARS?\b/, SILVER_COINS], [/SILVERWARE|FLATWARE|STERLING|CUTLERY|\bTEA\b/, web(/^silver-silver(ware|-cutlery|-tea)/)],
    [/JEWEL|RING|CHAIN|NECKLACE|BRACELET/, web(/^silver-silver-(jewelry|necklace)/)], [/./, web(/^silver-/)]],
  coins: [[/GOLD/, GOLD_COINS], [/./, web(/^coins-/)]],
  strips: [[/./, web(/^strips-/)]],
  pokemon: [[/./, web(/^pokemon-/)]],
};
const photoOf = src => String(src || '').split('|').pop();
const idx = JSON.parse(readFileSync(DIR + 'index.json', 'utf8'));
const recOf = id => JSON.parse(readFileSync(DIR + 'tpl/' + id + '.json', 'utf8'));
const words = rec => (rec.tpl.layers || []).map(l => l.text || '').join(' ').toUpperCase();
const poolFor = (cat, rec) => { const rows = POOLS[cat]; if (!rows) return []; const w = words(rec);
  const hit = rows.find(([re, fs]) => re.test(w) && fs.length); return hit ? hit[1] : []; };
const only = argv('--ids') ? new Set(argv('--ids').split(',')) : null;
const skipCats = new Set((argv('--skip-cats') || '').split(',').filter(Boolean));
const work = idx.filter(c => only ? only.has(c.id) : (live(c) && !skipCats.has(c.cat) && retired(photoOf((recOf(c.id).tpl.bg || {}).src))))
  .map(c => c.id);
console.log('cards on a retired ground: ' + work.length);
/* how many live cards stand on each real photograph already */
const uses = {};
idx.filter(live).forEach(c => { const s = photoOf((recOf(c.id).tpl.bg || {}).src); uses[s] = (uses[s] || 0) + 1; });
const MAXTRY = +(argv('--try') || 5);
const PIN = argv('--pin') ? JSON.parse(readFileSync(argv('--pin'), 'utf8')) : null;
const { browser, page } = await openStudio();
const out = {};
for (const id of work){
  const rec = recOf(id), src = rec.tpl.bg.src || '', pre = src.includes('|') ? src.slice(0, src.lastIndexOf('|') + 1) : '';
  const cat = (idx.find(c => c.id === id) || {}).cat;
  /* the least-used photographs of the card's pool first, a few at most */
  /* --pin f.json ({ id: { to } }, a dry run's --json): exactly the photograph looked at */
  const pin = PIN && PIN[id] && PIN[id].to;
  const pool = pin ? [pin] : poolFor(cat, rec).slice().sort((a, b) => (uses[a] || 0) - (uses[b] || 0) || a.localeCompare(b)).slice(0, MAXTRY);
  if (!pool.length){ out[id] = { from: photoOf(src), to: null, tried: [], why: 'no real photograph for ' + cat }; console.log(id.padEnd(26) + 'NONE  no real photograph for ' + cat); continue; }
  const cands = [];
  for (const s of pool){
    const c = JSON.parse(JSON.stringify(rec));
    /* a photograph of the goods, sharp: the shade carries the words (a drawn ground's own fields go) */
    c.tpl.bg = { type: 'image', src: pre + s, blur: 0, scrim: c.tpl.bg.scrim || 0, scrimColor: c.tpl.bg.scrimColor || '#0b0b0d', fallback: c.tpl.bg.fallback || { type: 'grad', c1: '#2a2c30', c2: '#16171a', a: 135 } };
    const r = await page.evaluate(async ([c, id, s]) => {
      try {
        const t = await __sc.prep(c, id + '__g' + s.length + Math.random().toString(36).slice(2, 6));
        const g = __sc.naturalGround(t, { grade: { treat: 'natural' }, dark: '#0b0b0d', light: '#f6f6f4', modes: ['bands', 'gradient', 'normal'],
          core: true, strict: true, want: 4.5, wantMinor: 3.5, flip: { dark: '#0b0b0d', light: '#f6f6f4' } });
        return g.bg ? { bg: g.bg, flipped: g.flipped || null } : { skip: g.skip || 'no shade' };
      } catch (e){ return { err: String(e).slice(0, 120) }; }
    }, [c, id, s]);
    if (!r.bg) { cands.push({ s, why: r.skip || r.err }); continue; }
    c.tpl.bg = r.bg;
    (r.flipped || []).forEach(f => { const l = c.tpl.layers.find(x => x.name === f.name); if (!l || !l.props) return;
      l.props.fill = f.fill; delete l.props.grad; delete l.props.stroke; delete l.props.strokeWidth;
      if (typeof l.props.opacity === 'number' && l.props.opacity < 1) l.props.opacity = 1; });
    cands.push({ s, rec: c });
  }
  const tried = cands.filter(x => x.rec);
  /* gateRecords keys by id, so each candidate is judged on its own */
  const pass = [];
  for (const x of tried){ const g = await gateRecords(page, [{ id, rec: x.rec }]); if (g[id] && g[id].ok) pass.push(x); else x.why = 'gate: ' + JSON.stringify((g[id] && (g[id].fresh || g[id].err || g[id].lost)) || '').slice(0, 120); }
  pass.sort((a, b) => (uses[a.s] || 0) - (uses[b.s] || 0) || pool.indexOf(a.s) - pool.indexOf(b.s));
  const pick = pass[0] || null;
  if (pick) uses[pick.s] = (uses[pick.s] || 0) + 1;
  out[id] = { from: photoOf(src), to: pick && pick.s, rec: pick && pick.rec, tried: cands.map(x => ({ s: x.s.split('/').pop(), ok: pass.includes(x), why: x.why || '' })), cat };
  console.log(id.padEnd(26) + (pick ? 'KEPT  ' + pick.s.split('/').pop() : 'NONE  ' + cands.map(x => x.s.split('/').pop() + ': ' + (x.why || '')).join(' | ')).slice(0, 220));
}
const kept = Object.entries(out).filter(([, r]) => r.rec);
console.log(`re-grounded ${kept.length} of ${work.length}`);
if (argv('--out')){
  mkdirSync(argv('--out'), { recursive: true });
  for (const [id, r] of kept){
    const shots = await page.evaluate(async ([id, rec]) => {
      const jpg = async t => { const d = renderThumb(t, 1080); const img = await new Promise(res => { const el = new Image(); el.onload = () => res(el); el.onerror = () => res(null); el.src = d; });
        const cv = document.createElement('canvas'); cv.width = cv.height = 448; cv.getContext('2d').drawImage(img, 0, 0, 448, 448); return cv.toDataURL('image/jpeg', 0.8); };
      return { before: await jpg(await __sc.load(id)), after: await jpg(await __sc.prep(rec, id + '__shot')) };
    }, [id, r.rec]);
    writeFileSync(argv('--out') + '/' + id + '-before.jpg', Buffer.from(shots.before.split(',')[1], 'base64'));
    writeFileSync(argv('--out') + '/' + id + '-after.jpg', Buffer.from(shots.after.split(',')[1], 'base64'));
  }
}
if (WRITE){ kept.forEach(([id, r]) => writeFileSync(DIR + 'tpl/' + id + '.json', JSON.stringify(r.rec))); console.log('wrote ' + kept.length + ' records'); }
if (argv('--json')) writeFileSync(argv('--json'), JSON.stringify(Object.fromEntries(Object.entries(out).map(([id, r]) => [id, { cat: r.cat, from: r.from, to: r.to, tried: r.tried, why: r.why }])), null, 1));
await browser.close();
