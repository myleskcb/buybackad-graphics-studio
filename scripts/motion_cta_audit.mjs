/* The video maker's call to action and stickers, measured on real looks
   (owner, 2026-11-10, over a gallery of Theatre marquee looks: "audit these
   cta all touch the box"; and over a yellow look with ¡EFECTIVO! in the bottom
   corner: "why is it in the corner versus above the phones in the right empty
   middle space").

   For each look it builds the Ad the page builds and reads its layout:
     - gap: the air between the call-to-action line ("CALL OR TEXT") and the
       number box under it, in units of the number's type size. Under GAP_MIN
       is a touch.
     - board: the call-to-action line or the number inside a sign board's
       frame (the marquee, the store sign) when the board is not theirs.
     - burst: the ¡EFECTIVO!/CASH! starburst on any line, the number, the label
       or a phone, and whether it sat in a corner while open room was free
       nearer the middle.

   usage:  python3 -m http.server 8931   (in the repo), then
           [GFX_BASE=http://127.0.0.1:8931/] [N=300] [VIBE=marquee] node scripts/motion_cta_audit.mjs
   Exits non-zero when a look fails. */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8931/').replace(/\/?$/, '/');
const N = +(process.env.N || 300);
const GAP_MIN = .14;            // the line's air above the box, as a share of the number's size

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
const errors = []; page.on('pageerror', e => errors.push(String(e)));
await page.goto(BASE + 'motion/', { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(() => document.getElementById('loading').hidden, null, { timeout: 120000 });

const out = await page.evaluate(async ({ N, GAP_MIN, only }) => {
  const E = await import('/motion/engine.js'), C = await import('/motion/catalog.js'), A = await import('/motion/accents.js');
  const { phones, index } = await E.loadPhones('/motion/phones/');
  const assets = { phones, accents: await A.loadAccents('/assets/cutouts/') };
  const ids = index.map(m => m.id);
  const vibes = only ? [only] : Object.keys(C.VIBES);
  const res = { looks: 0, labels: 0, touch: [], onBoard: [], bursts: 0, burstHits: [], burstCorner: [], gaps: [] };
  const inter = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
  for (let k = 0; k < N; k++) {
    const seed = 1000 + k * 7919, vibe = vibes[k % vibes.length];
    const base = { ...C.DEFAULT_STYLE, ...C.CLASSIC, vibe, phones: ids.slice(0, 5), number: '(562) 999-4994', aspect: ['4:5', '1:1', '9:16'][k % 3] };
    let st = E.randomize(base, seed, new Set(['vibe', 'phones', 'number', 'aspect']), ids, true);
    st = E.harmonise({ ...st }, new Set(['vibe']), E.PHONE_META);
    let ad;
    // the gallery's thumbnails (320 on the long side) and the export, half size for speed
    const thumb = k % 2 === 1;
    try { const [W, H] = E.ASPECTS[st.aspect], kk = thumb ? 320 / Math.max(W, H) : .5; ad = new E.Ad(st, assets, Math.round(W * kk), Math.round(H * kk)); }
    catch (e) { continue; }
    res.looks++;
    const s = ad.st, size = ad.size, pos = ad.pos, num = ad.num, tag = `${vibe} ${s.aspect}${thumb ? ' thumbnail' : ''} seed ${seed} ${s.number_pos}${s.board && s.board !== 'none' ? ' board ' + s.board : ''}`;
    const nbox = [pos.num[0], pos.num[1], pos.num[0] + num.c.width, pos.num[1] + num.c.height];
    let lbox = null;
    if (num.label && pos.label) {
      res.labels++;
      lbox = [pos.label[0], pos.label[1], pos.label[0] + num.label.width, pos.label[1] + num.label.height];
      const gap = (nbox[1] - lbox[3]) / size;
      res.gaps.push(gap);
      if (gap < GAP_MIN) res.touch.push(`${tag}: ${gap.toFixed(3)} of the number's size`);
      if (pos.board && s.number_pos !== 'under-headline' && inter(lbox, pos.board) > 0) res.onBoard.push(`${tag}: the line is on the sign`);
      if (pos.board && inter(lbox, pos.board) > 0 && s.number_pos === 'under-headline') res.onBoard.push(`${tag}: the line is on the sign (under it)`);
    }
    // inside a sign: every line and the tag stay off the sign's frame (its inner panel,
    // where the board draws one: the marquee's bulb border is .42 of the type size)
    const INNER = { marquee: .42, store_sign: .13 };
    if (pos.board && INNER[s.board] !== undefined) {
      const f = INNER[s.board] * size, inner = [pos.board[0] + f, pos.board[1] + f, pos.board[2] - f, pos.board[3] - f];
      const tb = ad.tag && pos.tag ? [pos.tag[0], pos.tag[1], pos.tag[0] + ad.tag.width, pos.tag[1] + ad.tag.height] : null;
      const parts = [...ad.lines.map((L, i) => [pos.xs[i], pos.y0 + i * ad.lineH, pos.xs[i] + L.inkW, pos.y0 + i * ad.lineH + L.asc]), ...(tb ? [tb] : [])];
      const out = parts.filter(x => x[0] < inner[0] - .5 || x[1] < inner[1] - .5 || x[2] > inner[2] + .5 || x[3] > inner[3] + .5);
      if (out.length) res.onBoard.push(`${tag}: ${out.length} line(s) on the sign's frame, the lowest ${((out[out.length - 1][3] - inner[3]) / size).toFixed(2)} of the type size into it`);
    }
    if (ad.burst) {
      res.bursts++;
      const b = ad.burst, R = b.R, bb = [b.x - R * .9, b.y - R * .9, b.x + R * .9, b.y + R * .9];
      const lines = ad.lines.map((L, i) => [pos.xs[i], pos.y0 + i * ad.lineH, pos.xs[i] + L.inkW, pos.y0 + (i + 1) * ad.lineH]);
      const hits = [...lines.map(x => ['a line', x]), ['the number', nbox], ...(lbox ? [['the call to action', lbox]] : []), ...(ad.tag && pos.tag ? [['the tag', [pos.tag[0], pos.tag[1], pos.tag[0] + ad.tag.width, pos.tag[1] + ad.tag.height]]] : [])]
        .filter(([, x]) => inter(bb, x) > R * R * .02).map(([n]) => n);
      if (hits.length) res.burstHits.push(`${tag}: on ${hits.join(', ')}`);
      const W = ad.W, H = ad.H, m = Math.min(W, H) * .04;
      const corner = (b.x - R < m * 1.6 || b.x + R > W - m * 1.6) && (b.y - R < m * 1.6 || b.y + R > H - m * 1.6);
      if (corner) res.burstCorner.push(tag);
    }
  }
  return res;
}, { N, GAP_MIN, only: process.env.VIBE || '' });

const g = out.gaps.slice().sort((a, b) => a - b), q = p => g.length ? g[Math.floor((g.length - 1) * p)].toFixed(3) : '-';
console.log(`${out.looks} looks, ${out.labels} with a call-to-action line, ${out.bursts} with a starburst`);
console.log(`gap above the number (share of its size): min ${q(0)}, median ${q(.5)}, max ${q(1)}`);
const show = (title, list) => { console.log(`${title}: ${list.length}`); for (const s of list.slice(0, 8)) console.log('    ' + s); };
show(`call-to-action line touching the number box (under ${GAP_MIN})`, out.touch);
show('call-to-action line on a sign board', out.onBoard);
show('starburst on the copy', out.burstHits);
show('starburst in a corner', out.burstCorner);
if (errors.length) console.log('page errors:', errors.slice(0, 3).join(' | '));
await browser.close();
const bad = out.touch.length + out.onBoard.length + out.burstHits.length + errors.length;
console.log(bad ? `${bad} failing` : 'all clear');
process.exit(bad ? 1 : 0);
