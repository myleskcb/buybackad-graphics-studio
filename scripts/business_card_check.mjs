#!/usr/bin/env node
/* THE BUSINESS CARD MAKER, AS A CUSTOMER USES IT (cards/; owner, 2026-11-19 and 2026-11-22: "business
   card designer..? ... and suggest quick same day print locations near you?", "needs to be super pay
   walled").

   Opens cards/ in Chromium, filled from the studio's own words (localStorage pgfx_brand), and holds it to:
     - the sheet: every layout, front and back, is 1125 × 675 (3.5 × 2 in at 300 dpi with the 1/8 in
       bleed), and every word and the QR sit inside the safe area 1/8 in inside the trim, in many colour
       pairs and type pairs, and with a long business name;
     - no two words on a side overlap;
     - the card says what the customer typed: the name, the number, the towns, the website;
     - the print PDF: %PDF, two pages, each with a TrimBox of 3.5 × 2 in and a BleedBox 1/8 in wider,
       and an xref whose every offset lands on its object;
     - "Print it today": Google Maps searches near the customer's ZIP, opened by them;
     - the paywall, with the function stood in for: signed out, Download opens the account dialog;
       a plan without cards (403) gets the upsell and no file, and its preview carries the mark; a plan
       with cards gets the PDF, counted once as kind "card", with no mark on the preview.
   The function's own rule (Pro and Business only, counted as a photo) is scripts/billing_check.mjs's.

   usage:  python3 -m http.server 8899   (in the repo), then
           [GFX_BASE=http://127.0.0.1:8899/] [SHEET=dir] node scripts/business_card_check.mjs   exits 1 on any failure */
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8899/').replace(/\/?$/, '/');
const SHEET_DIR = process.env.SHEET || '';
const require = createRequire(import.meta.url), { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
let fails = 0, passes = 0;
const ok = (c, m) => { if (c) passes++; else { fails++; console.log('  FAIL ' + m); } return !!c; };
const BRAND = { phone: '(562) 999-4994', website: 'longbeachphonebuyers.com', name: 'Long Beach Phone Buyers', area: { home: 'Long Beach, CA', zip: '90802', cover: ['Lakewood, CA', 'Downey, CA'] } };

const browser = await chromium.launch();
async function open({ demo = true, token = null, route = null, scheme = 'dark', width = 1300 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: scheme, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(([brand, demo, token]) => {
    localStorage.setItem('pgfx_brand', JSON.stringify(brand));
    if (demo) localStorage.setItem('pgfx_local_demo', '1'); else localStorage.removeItem('pgfx_local_demo');
    if (token) localStorage.setItem('pgfx_token', JSON.stringify(token)); else localStorage.removeItem('pgfx_token');
    localStorage.removeItem('pgfx_card');
  }, [BRAND, demo, token]);
  if (route) await page.route('**/api/**', route);
  await page.goto(BASE + 'cards/?c=' + Date.now(), { waitUntil: 'load' });
  await page.waitForFunction(() => window.CardMaker && document.getElementById('cd-stage').dataset.drawn, null, { timeout: 30000 });
  return { page, ctx, errors };
}

/* ---------- the sheet, the safe area, the words ---------- */
{
  const { page, ctx, errors } = await open();
  const geo = await page.evaluate(() => ({ SHEET: CardMaker.SHEET, SAFE: CardMaker.SAFE, TRIM: CardMaker.TRIM, BLEED: CardMaker.BLEED }));
  ok(geo.SHEET.w === 1125 && geo.SHEET.h === 675 && geo.TRIM.w === 1050 && geo.TRIM.h === 600 && geo.BLEED === 37.5, 'the sheet is 3.5 × 2 in at 300 dpi with an 1/8 in bleed (' + JSON.stringify(geo) + ')');
  const res = await page.evaluate(async () => {
    const S = CardMaker.SAFE, pairs = CardMaker.pairs(), voices = CardMaker.voices(), out = [];
    const names = ['Long Beach Phone Buyers', 'LA Gold & Silver Exchange International Buyers Co', 'Jo'];
    let n = 0;
    for (const layout of CardMaker.LAYOUTS) for (let i = 0; i < 6; i++) {
      Object.assign(CardMaker.state, { layout, pair: pairs[(n * 7) % pairs.length], voice: voices[(n * 5) % voices.length], name: names[n % names.length], qr: n % 2 === 0 });
      n++;
      for (const side of ['front', 'back']) {
        const r = await CardMaker.render(side);
        const T = { x: CardMaker.BLEED, y: CardMaker.BLEED, w: CardMaker.TRIM.w, h: CardMaker.TRIM.h };
        const outside = r.boxes.filter((b) => b.role !== 'product' && (b.x < S.x - .5 || b.y < S.y - .5 || b.x + b.w > S.x + S.w + .5 || b.y + b.h > S.y + S.h + .5))
          .concat(r.boxes.filter((b) => b.role === 'product' && (b.x < T.x - .5 || b.y < T.y - .5 || b.x + b.w > T.x + T.w + .5 || b.y + b.h > T.y + T.h + .5)));
        const words = r.boxes.filter((b) => b.text);
        /* the product never sits on a word (the burst is drawn over it on purpose) */
        const pic = r.boxes.find((b) => b.role === 'product');
        const onPic = pic ? words.filter((b) => b.role !== 'burst' && Math.min(b.x + b.w, pic.x + pic.w) - Math.max(b.x, pic.x) > 4 && Math.min(b.y + b.h, pic.y + pic.h) - Math.max(b.y, pic.y) > 4).map((b) => b.text) : [];
        const overlap = [];
        for (let a = 0; a < words.length; a++) for (let c = a + 1; c < words.length; c++) {
          const A = words[a], B = words[c], dx = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x), dy = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y);
          if (dx > 2 && dy > 2) overlap.push(A.text + ' / ' + B.text);
        }
        /* nothing is ever drawn over the QR: a word on it, or the product, and a phone cannot read it */
        const qr = r.boxes.find((b) => b.role === 'qr');
        const onQr = qr ? r.boxes.filter((b) => b !== qr && (b.text || b.role === 'product') && Math.min(b.x + b.w, qr.x + qr.w) - Math.max(b.x, qr.x) > 1 && Math.min(b.y + b.h, qr.y + qr.h) - Math.max(b.y, qr.y) > 1).map((b) => b.role + ':' + b.text) : [];
        const small = words.filter((b) => b.size < 29).map((b) => b.role + ':' + b.text + '@' + Math.round(b.size));
        const big = Math.max(0, ...r.boxes.filter((b) => b.role === 'contact').map((b) => b.size));
        const sig = [qr, r.boxes.find((b) => b.role === 'point'), r.boxes.find((b) => b.role === 'contact'), pic].map((b) => b ? Math.round(b.x / 20) + ',' + Math.round(b.y / 20) : '-').join(' ');
        out.push({ layout, side, pair: CardMaker.state.pair, voice: CardMaker.state.voice, name: CardMaker.state.name, w: r.canvas.width, h: r.canvas.height,
          outside: outside.map((b) => b.role + ':' + (b.text || '') + '@' + [b.x, b.y, b.w, b.h].map(Math.round).join(',')), overlap: overlap.concat(onPic.map((x) => 'the product / ' + x)), pic: !!pic,
          roles: [...new Set(r.boxes.map((b) => b.role))], texts: words.map((b) => b.text).join(' | '), qrW: qr ? qr.w : 0, onQr, small, big, sig });
      }
    }
    return out;
  });
  const sizeBad = res.filter((r) => r.w !== 1125 || r.h !== 675);
  ok(!sizeBad.length, 'every side of every layout is 1125 × 675 (' + sizeBad.length + ' not)');
  const out = res.filter((r) => r.outside.length);
  ok(!out.length, 'every word and QR inside the safe area, ' + res.length + ' sides in ' + new Set(res.map((r) => r.pair)).size + ' colour pairs and ' + new Set(res.map((r) => r.voice)).size + ' type pairs'
    + (out.length ? ': ' + out.slice(0, 4).map((r) => r.layout + '/' + r.side + ' ' + r.voice + ' "' + r.name + '" ' + r.outside.join('; ')).join(' || ') : ''));
  const ov = res.filter((r) => r.overlap.length);
  ok(!ov.length, 'no two words on a side overlap' + (ov.length ? ': ' + ov.slice(0, 4).map((r) => r.layout + '/' + r.side + ' ' + r.voice + ': ' + r.overlap.join(', ')).join(' || ') : ''));
  const fronts = res.filter((r) => r.side === 'front');
  ok(fronts.every((r) => r.roles.includes('phone') && r.roles.includes('name') && r.roles.includes('buy')), 'every front carries the name, what is bought and the number');
  const backs = res.filter((r) => r.side === 'back');
  ok(backs.every((r) => r.roles.includes('point') && r.roles.includes('contact')), 'every back carries the selling points and the number');
  ok(backs.some((r) => r.roles.includes('qr')) && backs.some((r) => !r.roles.includes('qr')), 'the QR comes and goes with its box');
  ok(fronts.filter((r) => r.layout !== 'center').every((r) => r.pic), 'every front but Centred shows the product the line buys (' + fronts.filter((r) => r.layout !== 'center' && !r.pic).map((r) => r.layout).join(', ') + ')');
  ok(backs.filter((r) => !r.roles.includes('qr') && r.layout !== 'center').every((r) => r.pic), 'a back without a QR shows the product in its place (Centred is set in type alone, front and back)');
  const sm = res.filter((r) => r.small.length);
  ok(!sm.length, 'every word on every side is 7 pt (29 px at 300 dpi) or more' + (sm.length ? ': ' + sm.slice(0, 4).map((r) => r.layout + '/' + r.side + ' ' + r.voice + ' ' + r.small.join(', ')).join(' || ') : ''));
  const qrs = backs.filter((r) => r.qrW);
  ok(qrs.every((r) => r.qrW >= 225), 'every QR is at least 3/4 in across (' + Math.round(Math.min(...qrs.map((r) => r.qrW))) + ' px the smallest)');
  const onq = backs.filter((r) => r.onQr.length);
  ok(!onq.length, 'nothing is drawn over a QR' + (onq.length ? ': ' + onq.slice(0, 3).map((r) => r.layout + ' ' + r.onQr.join(', ')).join(' || ') : ''));
  const noQr = backs.filter((r) => !r.qrW);
  ok(noQr.every((r) => r.big >= 60), 'with no QR the back sets the number large (' + noQr.map((r) => r.layout + ' ' + Math.round(r.big)).join(', ') + ')');
  const said = res.find((r) => r.side === 'front' && r.name === 'Long Beach Phone Buyers');
  ok(said && /LONG BEACH PHONE BUYERS/.test(said.texts.replace(/ \| /g, ' ')) && /\(562\) 999-4994/.test(said.texts) && /WE BUY iPHONES/.test(said.texts), 'the card says what the studio was told: ' + (said && said.texts));
  ok(res.some((r) => /LONG BEACH • LAKEWOOD • DOWNEY/.test(r.texts)) && res.some((r) => /longbeachphonebuyers\.com/.test(r.texts)), 'the towns and the website from the studio are on the card');

  /* ---------- each layout has its own back; Pop's shadow; the colour note ---------- */
  const looks = await page.evaluate(async () => {
    const sig = async () => { const r = await CardMaker.render('back'); return r.boxes.filter((b) => ['qr', 'point', 'contact', 'buy', 'product'].includes(b.role)).map((b) => b.role + Math.round(b.x / 20) + ',' + Math.round(b.y / 20)).join(' '); };
    const o = { qr: [], none: [] };
    for (const layout of CardMaker.LAYOUTS) for (const qr of [true, false]) {
      Object.assign(CardMaker.state, { layout, qr, pair: CardMaker.pairs()[3], voice: 'bold', name: 'Long Beach Phone Buyers' });
      o[qr ? 'qr' : 'none'].push(await sig());
    }
    // the shadow goes with the face the name is set in: a pixel name set in its pair's reading face has one
    o.shadowWrong = [];
    for (const voice of CardMaker.voices()) {
      Object.assign(CardMaker.state, { layout: 'pop', voice });
      const r = await CardMaker.render('front');
      r.boxes.filter((b) => b.role === 'name').forEach((b) => { if (b.shadow !== !['serif', 'script', 'mono'].includes(CardMaker.kindOf(b.font))) o.shadowWrong.push(voice + ':' + b.font); });
      if (voice === 'luxe') o.luxeShadow = r.boxes.some((b) => b.role === 'name' && b.shadow);
    }
    const pairs = CardMaker.pairs(), vivid = pairs.find((k) => CardMaker.vividPair(k)), calm = pairs.find((k) => !CardMaker.vividPair(k));
    const note = async (k) => { CardMaker.state.pair = k; await CardMaker.draw(); return !document.getElementById('cd-ink').hidden; };
    o.vivid = vivid; o.calm = calm; o.noteVivid = await note(vivid); o.noteCalm = await note(calm);
    o.lime = CardMaker.vividPair('black_on_lime'); o.cyan = CardMaker.vividPair('black_cyan');
    return o;
  });
  ok(new Set(looks.qr).size === 5 && new Set(looks.none).size === 5, 'the five layouts have five different backs, with a QR and without (' + new Set(looks.qr).size + ', ' + new Set(looks.none).size + ')');
  ok(!looks.shadowWrong.length && looks.luxeShadow === false, "Pop's offset shadow under a heavy face, none under a hairline serif, a script or a pixel face, in every type pair" + (looks.shadowWrong.length ? ': ' + looks.shadowWrong.join(', ') : ''));
  ok(looks.noteVivid && !looks.noteCalm && looks.lime && looks.cyan, 'a bright green, cyan, blue or pink pair says it prints softer; a calm one does not (' + looks.vivid + ' / ' + looks.calm + ')');

  /* ---------- the fills: no word loses contrast to a pattern or a gradient ----------
     Each side drawn twice without its words, on a fill and on the flat ground; under every word, the
     darkest-to-lightest pixels it stands on (the 5th percentile of its contrast) must keep 4.5:1, or what
     the flat ground gave where that was less. */
  const fills = await page.evaluate(async () => {
    const L = (r, g, b) => [r, g, b].map((v) => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
    const hex = (h) => { h = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
    const worst = (canvas, box) => {
      const x0 = Math.max(0, Math.floor(box.x)), y0 = Math.max(0, Math.floor(box.y)), w = Math.max(1, Math.ceil(box.w)), h = Math.max(1, Math.ceil(box.h));
      const d = canvas.getContext('2d').getImageData(x0, y0, w, h).data, lc = L(...hex(box.color)), cs = [];
      for (let i = 0; i < d.length; i += 4 * 3) { const lp = L(d[i], d[i + 1], d[i + 2]); cs.push((Math.max(lc, lp) + .05) / (Math.min(lc, lp) + .05)); }
      cs.sort((a, b) => a - b); return cs[Math.floor(cs.length * .05)];
    };
    const pairs = CardMaker.pairs(), voices = CardMaker.voices(), bad = [], kinds = CardMaker.FILLS.filter((k) => k !== 'flat');
    let n = 0, sides = 0, worstSeen = 99;
    for (const layout of CardMaker.LAYOUTS) for (let j = 0; j < 3; j++) {
      const base = { layout, pair: pairs[(n * 11 + j * 17) % pairs.length], voice: voices[(n * 5) % voices.length], name: ['Long Beach Phone Buyers', 'JJ Coins', 'Westside Watch & Phone Buyers'][j], qr: j !== 1 };
      n++;
      for (const side of ['front', 'back']) {
        Object.assign(CardMaker.state, base, { fill: 'flat' });
        const flat = await CardMaker.render(side, { bare: true });
        for (const kind of kinds) {
          Object.assign(CardMaker.state, { fill: kind });
          const r = await CardMaker.render(side, { bare: true }); sides++;
          r.boxes.filter((b) => b.text && b.color && /^#/.test(b.color)).forEach((b, i) => {
            const fb = flat.boxes.filter((x) => x.text && x.color && /^#/.test(x.color))[i];
            const was = worst(flat.canvas, fb), now = worst(r.canvas, b);
            worstSeen = Math.min(worstSeen, now / Math.min(4.5, was));
            if (now < Math.min(4.5, was) - .15) bad.push(layout + '/' + side + ' ' + kind + ' ' + base.pair + ' ' + b.role + ':' + b.text.slice(0, 20) + ' ' + was.toFixed(2) + '→' + now.toFixed(2));
          });
        }
      }
    }
    return { bad, sides, worstSeen };
  });
  ok(!fills.bad.length, 'no word loses contrast to a fill: ' + fills.sides + ' sides, every fill, light, vivid and dark pairs' + (fills.bad.length ? ': ' + fills.bad.slice(0, 5).join(' || ') + ' (' + fills.bad.length + ')' : ''));

  /* ---------- the print PDF: the file the download saves ---------- */
  const pdf = await page.evaluate(async () => Array.from(await CardMaker.printFile(false)));
  const buf = Buffer.from(pdf), txt = buf.toString('latin1');
  ok(txt.startsWith('%PDF-1.4') && /%%EOF\s*$/.test(txt), 'the PDF starts and ends as a PDF');
  const ims = [...txt.matchAll(/\/Width (\d+) \/Height (\d+)/g)].map((m) => m[1] + '×' + m[2]);
  ok(ims.length === 2 && ims.every((d) => d === '2250×1350'), 'both sides are drawn at 600 dpi for the press (' + ims.join(', ') + ')');
  ok((txt.match(/\/Type \/Page /g) || []).length === 2 && /\/Count 2/.test(txt), 'the PDF has two pages, front and back');
  const trim = txt.match(/\/TrimBox \[([\d. ]+)\]/), bleed = txt.match(/\/BleedBox \[([\d. ]+)\]/);
  const tb = trim && trim[1].split(' ').map(Number), bb = bleed && bleed[1].split(' ').map(Number);
  ok(tb && Math.abs(tb[2] - tb[0] - 252) < .05 && Math.abs(tb[3] - tb[1] - 144) < .05, 'each page is trimmed to 3.5 × 2 in (252 × 144 pt): ' + (trim && trim[1]));
  ok(bb && Math.abs(bb[2] - bb[0] - 270) < .05 && Math.abs((tb[0] - bb[0]) - 9) < .05, 'the bleed is 1/8 in (9 pt) past the trim: ' + (bleed && bleed[1]));
  ok((txt.match(/ m [\d.]+ [\d.]+ l S/g) || []).length === 16, 'eight crop marks on each page');
  const xr = txt.lastIndexOf('\nxref\n') + 1, entries = txt.slice(xr).split('\n').slice(2).filter((l) => / 00000 n $/.test(l)).map((l) => parseInt(l, 10));
  ok(entries.length === 8 && entries.every((o, i) => txt.slice(o).startsWith((i + 1) + ' 0 obj')), 'every xref offset lands on its object (' + entries.length + ')');
  if (SHEET_DIR) { mkdirSync(SHEET_DIR, { recursive: true }); writeFileSync(join(SHEET_DIR, 'card.pdf'), buf); }

  /* ---------- print it today ---------- */
  const links = await page.evaluate(() => CardMaker.printLinks('90802'));
  ok(links.length >= 5 && links.every((l) => l.url.startsWith('https://www.google.com/maps/search/?api=1&query=') && /90802/.test(decodeURIComponent(l.url))), 'print it today: Google Maps searches near the ZIP (' + links.map((l) => l.name).join(', ') + ')');
  ok(links.some((l) => /FedEx Office/.test(l.name)) && links.some((l) => /Staples/.test(l.name)) && links.some((l) => /same-day/i.test(l.name)), 'the same-day search and the big chains');
  ok(errors.length === 0, 'no page error (' + errors.slice(0, 2).join(' | ') + ')');
  await ctx.close();
}

/* ---------- the paywall: the function stood in for ---------- */
const stand = (plan) => async (route) => {
  const u = new URL(route.request().url()), p = u.pathname.replace(/^.*\/api/, '');
  const body = (() => { try { return JSON.parse(route.request().postData() || '{}'); } catch (e) { return {}; } })();
  stand.calls.push(p + ':' + (body.kind || ''));
  const json = (status, j) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(j) });
  if (p === '/me') return json(200, { user: { email: 'c@x.example', plan, role: 'user' } });
  if (p === '/export/check' || p === '/export') {
    if (body.kind === 'card' && !['pro', 'business'].includes(plan)) return json(403, { error: 'Print-ready business cards come with Pro and Business', needs: 'cards' });
    return json(200, { maxPx: 2160, watermark: false, remaining: 499 });
  }
  return json(404, { error: 'not here' });
};
stand.calls = [];
{
  const { page, ctx } = await open({ demo: false, route: stand('free') });
  ok(await page.evaluate(() => document.getElementById('cd-stage').dataset.marked === 'true'), 'signed out: the preview carries the WeBuy.AD mark');
  await page.click('#cd-pdf');
  await page.waitForTimeout(400);
  ok(await page.evaluate(() => !!document.querySelector('.acct-overlay.show')), 'signed out: Download opens the account dialog');
  await ctx.close();
}
{
  stand.calls = [];
  const { page, ctx } = await open({ demo: false, token: 'tok-free', route: stand('basic') });
  ok(await page.evaluate(() => document.getElementById('cd-stage').dataset.marked === 'true'), 'Starter: the preview carries the mark (cards are not on the plan)');
  let got = null; page.on('download', (d) => { got = d; });
  await page.click('#cd-pdf');
  await page.waitForTimeout(800);
  const up = await page.evaluate(() => { const v = document.querySelector('.vh'); return v ? v.textContent : ''; });
  ok(/Pro and Business/.test(up) && !got, 'Starter: Download shows what comes with Pro and Business, and no file (' + up.slice(0, 80) + ')');
  ok(!stand.calls.includes('/export:card'), 'Starter: nothing is counted');
  if (SHEET_DIR) await page.screenshot({ path: join(SHEET_DIR, 'upsell.png') });
  await ctx.close();
}
for (const scheme of ['dark', 'light']) {
  stand.calls = [];
  const { page, ctx, errors } = await open({ demo: false, token: 'tok-pro', route: stand('pro'), scheme });
  ok(await page.evaluate(() => document.getElementById('cd-stage').dataset.marked === 'false'), 'Pro (' + scheme + '): the preview is clean');
  const dl = page.waitForEvent('download', { timeout: 20000 });
  await page.click('#cd-pdf');
  const d = await dl.catch(() => null);
  ok(d && /long-beach-phone-buyers-card\.pdf$/.test(d.suggestedFilename()), 'Pro: Download gives the print PDF (' + (d && d.suggestedFilename()) + ')');
  ok(stand.calls.filter((c) => c === '/export:card').length === 1 && stand.calls.includes('/export/check:card'), 'Pro: checked and counted once, as a card (' + stand.calls.join(', ') + ')');
  await page.waitForSelector('#print:not([hidden])', { timeout: 5000 }).catch(() => {});
  const pr = await page.evaluate(() => ({ shown: !document.getElementById('print').hidden, near: document.getElementById('pt-where').value, links: [...document.querySelectorAll('#pt-links a')].map((a) => a.href) }));
  ok(pr.shown && pr.near === '90802' && pr.links.length >= 5 && pr.links.every((h) => /90802/.test(decodeURIComponent(h))), 'after the download, Print it today opens near the studio\'s ZIP (' + JSON.stringify({ shown: pr.shown, near: pr.near, n: pr.links.length }) + ')');
  ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, 'no sideways scroll (' + scheme + ')');
  ok(errors.length === 0, 'no page error (' + errors.slice(0, 2).join(' | ') + ')');
  if (SHEET_DIR) { await page.evaluate(() => scrollTo(0, 0)); await page.screenshot({ path: join(SHEET_DIR, 'maker-' + scheme + '.png') }); await page.locator('#print').screenshot({ path: join(SHEET_DIR, 'print-' + scheme + '.png') }); }
  await ctx.close();
}
{
  const { page, ctx } = await open({ width: 390 });
  ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, 'a phone\'s width: no sideways scroll');
  if (SHEET_DIR) await page.screenshot({ path: join(SHEET_DIR, 'maker-390.png'), fullPage: false });
  await ctx.close();
}
await browser.close();
console.log((fails ? 'BUSINESS CARDS: ' + fails + ' failure(s), ' : 'business_card_check: ') + passes + ' passed');
process.exit(fails ? 1 : 0);
