#!/usr/bin/env node
/* THE WORDS OF THE STILLS ALREADY MADE, CHANGED IN PLACE (2026-11-18).

   The census of every offered ad (scripts/ad_census.mjs, DESIGN-LAW 143) read iPhones LA's 51
   stills with the one list of banned and old words (spec/banned-words.json): TOP DOLLAR on 31
   (docs/COMPETITOR-RESEARCH-2026-11-12.md §5.2: the most generic phrase in the category, its
   verdict "replace with identity or place"), the models line iPHONE 15 – 18 PRO MAX with an en
   dash on 21 (rule 55 bars the dash in customer copy; §5.2 offers "iPHONE 15 AND NEWER"), ANY
   CONDITION with no limit on 6 (§5.2: it reads as no questions asked); and 7 stills that today's
   FeedAd no longer passes. The owner, 2026-11-18: "FIX IT".

   Each still keeps the look the owner approved: it is drawn again from its report's own record
   (every setting, the seed, the phones), with only its words changed. A word is swapped for one
   from the house's own list that shares no promise with the rest of the ad (a word's stem, as
   generate.mjs tests it; the goods' own names, iPHONE and iPAD, are not a promise). A still that
   today's gate refuses is moved the least it takes to pass, one step at a time: a smaller
   headline, another ground, another arrangement, another colourway, never two stills of a batch
   on the same colourway and ground.

   usage:  python3 -m http.server 8931 --bind 127.0.0.1   (repo root), then
           node tools/feed-stills/reword.mjs [--base http://127.0.0.1:8931] [--ids a,b] [--dry]
   --dry prints the words it would change and draws nothing.
   Rewrites tools/feed-stills/cards.json, out/ (the 2026-11-03 set), batches/2026-11-07/
   (cards.json, <id>.jpg, report.json, sheet.jpg) and ledger.json. A still whose words stay and
   which still passes keeps its picture. */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const ROOT = new URL('../../', import.meta.url).pathname, HERE = ROOT + 'tools/feed-stills/';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://127.0.0.1:8931'), ONLY = new Set((arg('--ids', '') || '').split(',').filter(Boolean)), DRY = process.argv.includes('--dry');
const ON = '2026-11-18';
// each batch moves only among its own colourways (render.mjs's eight for the first set, generate.mjs's
// sixteen after), each still's share of them as even as when it was made
const EIGHT = ['graphite', 'ink_blue', 'black_gold', 'money_green', 'oxblood', 'klein', 'midnight_glass', 'cream_black'];
const SIXTEEN = [...EIGHT, 'sapphire', 'emerald', 'ruby', 'carbon', 'midnight_teal', 'royal', 'noir', 'midnight'];
const BATCHES = [
  { name: '2026-11-03', dir: HERE + 'out/', cards: HERE + 'cards.json', colourways: EIGHT },
  { name: '2026-11-07', dir: HERE + 'batches/2026-11-07/', cards: HERE + 'batches/2026-11-07/cards.json', colourways: SIXTEEN },
];

/* ---------- the one list ---------- */
const BANNED = JSON.parse(readFileSync(ROOT + 'spec/banned-words.json', 'utf8')).phrases;
const bannedIn = t => BANNED.filter(p => (!p.only || p.only.includes('phones')) && new RegExp(p.pattern, 'i').test(String(t || ''))
  && !(p.unless && new RegExp(p.unless, 'i').test(String(t || '')))).map(p => p.id);

/* ---------- one promise, once (generate.mjs's test) ---------- */
const GOODS = new Set(['IPHON', 'IPAD']);
const stems = s => new Set(String(s || '').toUpperCase().split(/[^A-Z0-9]+/).filter(w => w.length >= 4).map(w => w.slice(0, 5)).filter(w => !GOODS.has(w)));
const shares = (a, b) => { const B = stems(b); return [...stems(a)].some(w => B.has(w)); };

/* ---------- what each old phrase becomes, first choice first ---------- */
const SWAP = {
  headline: { 'TOP DOLLAR FOR iPHONES': ['GET PAID FOR iPHONES', 'WE PAY FOR iPHONES', 'FAIR CASH FOR iPHONES'] },
  line: { 'iPHONE 15 – 18 PRO MAX': ['iPHONE 15 AND NEWER'] },
  claim: {
    'TOP DOLLAR • MAX OFFER': ['LOCAL BUYER • MAX OFFER', 'LOCAL & HONEST', 'LOCAL BUYER', 'ALWAYS BUYING', 'MAX OFFER • FAIR DEAL'],
    'TOP DOLLAR PAID': ['LOCAL BUYER', 'LOCAL & HONEST', 'ALWAYS BUYING', 'FAIR OFFERS'],
    'HONEST BUYER • TOP DOLLAR': ['HONEST BUYER • FAIR OFFER', 'HONEST LOCAL BUYER', 'LOCAL & HONEST', 'ALWAYS BUYING', 'LOCAL BUYER'],
    'TOP DOLLAR • NO LOWBALLS': ['LOCAL BUYER • NO LOWBALLS', 'FAIR OFFER • NO LOWBALLS'],
  },
  chip: {
    'TOP DOLLAR': ['CASH TODAY', 'PAID TODAY', 'CASH SAME DAY', 'PAID SAME DAY', 'CASH OR ZELLE', 'FAIR OFFER', 'MAX OFFER'],
    'ANY CONDITION': ['CRACKED OK', 'NO FEES', 'WE MEET YOU', 'NO OBLIGATION', 'NO LOWBALLS', 'MAIL-IN OK', 'LOCAL MEETUP'],
  },
};
// words that are never drawn on a still but ride in its record (the ticker, the voice-over a video
// once spoke): rule 136 asks a phone seller for the IMEI, never a picture
const quiet = s => String(s).replace(/\bTEXT US A PIC\b/gi, m => m === m.toUpperCase() ? 'TEXT US YOUR IMEI' : 'Text us your IMEI').replace(/\bTEXT A PIC\b/g, 'TEXT US NOW');

/** A card's words with every old phrase swapped: { words, changes: {field: [was, now]} }. */
function reword(w, heads) {
  const out = { ...w }, changes = {};
  const fields = () => {
    const f = { headline: out.headline, claim: out.claim, line: out.line, cta: out.cta, where: out.where };
    (out.points || '').split(', ').forEach((c, i) => { f['chip' + i] = c; });
    return f;
  };
  const choose = (key, list) => {
    const others = Object.entries(fields()).filter(([k, v]) => k !== key && v && !bannedIn(v).length).map(([, v]) => v);
    const clear = c => !others.some(o => shares(c, o));
    return list.find(c => clear(c) && (key !== 'headline' || !heads.has(c))) || list.find(clear) || list[0];
  };
  for (const key of ['headline', 'line', 'claim']) {
    const list = SWAP[key][out[key]];
    if (!list) continue;
    const v = choose(key, list); changes[key] = [out[key], v]; out[key] = v;
    if (key === 'headline') heads.add(v);
  }
  if (out.points) {
    const chips = out.points.split(', ');
    for (let i = 0; i < chips.length; i++) {
      const list = SWAP.chip[chips[i]];
      if (!list) continue;
      const v = choose('chip' + i, list);
      changes['points'] = changes['points'] || [out.points];
      chips[i] = v; out.points = chips.join(', ');
      changes['points'][1] = out.points;
    }
  }
  return { words: out, changes };
}

/* ---------- the words, card by card ---------- */
const plans = [];
for (const B of BATCHES) {
  const cardsDoc = JSON.parse(readFileSync(B.cards, 'utf8'));
  const report = JSON.parse(readFileSync(B.dir + 'report.json', 'utf8'));
  const heads = new Set(cardsDoc.cards.map(c => c.headline).filter(h => !SWAP.headline[h]));
  for (const card of cardsDoc.cards) {
    const { words, changes } = reword({ headline: card.headline, claim: card.claim, line: card.line, points: card.points, cta: card.cta, where: card.where }, heads);
    Object.assign(card, words);
    const row = report.cards.find(r => r.id === card.id);
    plans.push({ batch: B, card, row, changes });
    const left = Object.entries(words).filter(([, v]) => bannedIn(v).length);
    if (Object.keys(changes).length || left.length)
      console.log(`${card.id.padEnd(22)} ${Object.entries(changes).map(([k, [a, b]]) => `${k}: ${a} → ${b}`).join(' | ')}${left.length ? '  STILL BANNED: ' + left.map(([k, v]) => k + ' ' + v).join(', ') : ''}`);
  }
  B.cardsDoc = cardsDoc; B.report = report;
}
if (DRY) process.exit(0);

/* ---------- drawn again ---------- */
const { chromium } = process.env.PLAYWRIGHT_MODULE ? await import(process.env.PLAYWRIGHT_MODULE) : createRequire(import.meta.url)('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', e => console.error('page:', e.message));
await page.goto(BASE + '/tools/feed-stills/index.html');
await page.waitForFunction(() => window.FS && window.VideoStill, null, { timeout: 60000 });
await page.evaluate(() => FS.ready());

const GROUNDS = ['radial', 'spotlight', 'studio_sweep', 'tonal', 'spot_floor', 'linear'];
const ARRANGEMENTS = ['lineup', 'fan', 'showcase', 'podium', 'wings'];
const SCALES = [.85, .78, .75, .72, .68, .64, .6];
// a chip over generate.mjs's fourteen letters, for one of the house's own that says the same
const SHORTER = { 'CASH OR TRANSFER': ['CASH OR ZELLE', 'CASH SAME DAY', 'PAID TODAY'] };


/** The still drawn from its record as it is (FS.redraw: no seed draws anything, so a held type
 *  pair cannot swap the face; the census reads a still the same way). */
const draw = style => page.evaluate(([style]) => FS.redraw(style), [style]);

for (const B of BATCHES) {
  const rows = B.report.cards.filter(r => r.ok && r.style);
  const PALETTE_MAX = Math.ceil(B.cardsDoc.cards.length / B.colourways.length);
  for (const p of plans.filter(p => p.batch === B && p.row && p.row.ok && p.row.style)) {
    if (ONLY.size && !ONLY.has(p.card.id)) continue;
    const row = p.row, was = row.style, c = p.card;
    const st = { ...was, headline: c.headline, tag: c.line, feed_line: c.line, feed_claim: c.claim, points: c.points, number_label: c.cta, feed_where: c.where };
    for (const k of ['ticker_items', 'vo_text', 'urgent', 'stamp_text', 'burst_text']) if (st[k] != null) st[k] = Array.isArray(st[k]) ? st[k].map(quiet) : quiet(st[k]);
    // what changed against the record itself (a second run finds the cards already reworded)
    const diffOf = now => {
      const d = {};
      for (const [k, name] of [['headline', 'headline'], ['feed_line', 'line'], ['feed_claim', 'claim'], ['points', 'points'], ['number_label', 'cta'], ['feed_where', 'where']])
        if ((was[k] || '') !== (now[k] || '')) d[name] = [was[k], now[k]];
      return d;
    };
    const quietChanged = ['ticker_items', 'vo_text', 'urgent', 'stamp_text', 'burst_text'].some(k => JSON.stringify(was[k]) !== JSON.stringify(st[k]));
    let r = await draw(st), moved = null;
    if (!r.ok) {
      const first = r.why;
      // the least move that passes, one setting at a time; the batch's other stills hold theirs
      const taken = new Set(rows.filter(x => x !== row).map(x => x.style.palette + '|' + x.style.background));
      const count = k => rows.filter(x => x !== row && x.style.palette === k).length;
      const free = (pal, bg) => !taken.has(pal + '|' + bg) && count(pal) < PALETTE_MAX;
      const card = B.cardsDoc.cards.find(x => x.id === c.id) || {};
      const tries = [];
      // the words first: a chip too long for the room today, for a shorter one of the house's
      const chips = (st.points || '').split(', ');
      chips.forEach((ch, i) => {
        for (const alt of (SHORTER[ch] || [])) {
          const rest = [st.headline, st.feed_claim, st.feed_line, st.number_label, ...chips.filter((_, j) => j !== i)];
          if (rest.some(o => shares(alt, o))) continue;
          const pts = chips.map((x, j) => j === i ? alt : x).join(', ');
          tries.push([{ points: pts }, `chip ${ch} → ${alt}`]);
          break;
        }
      });
      for (const s of SCALES.filter(s => s < st.text_scale - 1e-6).slice(0, 3)) tries.push([{ text_scale: s }, `headline scale ${st.text_scale} → ${s}`]);
      for (const bg of (card.grounds || GROUNDS)) if (bg !== st.background && free(st.palette, bg)) tries.push([{ background: bg }, `ground ${st.background} → ${bg}`]);
      for (const ar of (card.arrangements || ARRANGEMENTS)) if (ar !== st.arrangement) tries.push([{ arrangement: ar }, `arrangement ${st.arrangement} → ${ar}`]);
      for (const s of SCALES.filter(s => s < st.text_scale - 1e-6).slice(0, 2))
        for (const ar of (card.arrangements || ARRANGEMENTS)) if (ar !== st.arrangement) tries.push([{ text_scale: s, arrangement: ar }, `headline scale ${st.text_scale} → ${s}, arrangement ${st.arrangement} → ${ar}`]);
      // one phone fewer (the front one kept), where three leave the words no room; never a set another still shows
      if ((st.phones || []).length === 3) {
        const sets = new Set(rows.filter(x => x !== row).map(x => [...x.phones].sort().join(',')));
        for (const drop of [2, 1]) {
          const two = st.phones.filter((_, j) => j !== drop);
          if (!sets.has([...two].sort().join(','))) tries.push([{ phones: two }, `phones ${st.phones.join(', ')} → ${two.join(', ')}`]);
        }
      }
      for (const pal of (card.colourways || B.colourways)) if (pal !== st.palette)
        for (const bg of [st.background, ...(card.grounds || GROUNDS).filter(g => g !== st.background)]) if (free(pal, bg)) tries.push([{ palette: pal, background: bg }, `colourway ${st.palette}/${st.background} → ${pal}/${bg}`]);
      for (const [delta, said] of tries) {
        const r2 = await draw({ ...st, ...delta });
        if (r2.ok) { r = r2; moved = { from: first, to: said }; break; }
      }
      if (!r.ok) { console.log(`${c.id}: NO PASS after ${tries.length} moves; first refusal: ${first.join('; ')}`); continue; }
    }
    const diff = diffOf(r.style);
    if (!Object.keys(diff).length && !moved) {
      // nothing drawn changes: the picture stays; only words the still never shows are put right in its record
      if (quietChanged) { for (const k of ['ticker_items', 'vo_text', 'urgent', 'stamp_text', 'burst_text']) if (st[k] != null) row.style[k] = st[k]; row.reworded = { on: ON, unseen: 'words a video once spoke or a ticker held, never drawn on this still' }; }
      console.log(`${c.id.padEnd(22)} kept (words clean, passes)${quietChanged ? '; its record\'s unseen words put right' : ''}`);
      continue;
    }
    const s2 = r.style;
    // a word the move changed is the card's word too (cards.json and the ledger say what the still says)
    Object.assign(c, { headline: s2.headline, line: s2.feed_line, claim: s2.feed_claim, points: s2.points, cta: s2.number_label, where: s2.feed_where });
    writeFileSync(B.dir + c.id + '.jpg', Buffer.from(r.url.split(',')[1], 'base64'));
    Object.assign(row, {
      headline: s2.headline, line: s2.feed_line, cta: s2.number_label,
      look: { font: s2.font, number_style: s2.number_style, palette: s2.palette, background: s2.background, arrangement: s2.arrangement, board: s2.board, text_fx: s2.text_fx, case: s2.case },
      phones: s2.phones, subjectFit: r.subjectFit, px: r.px, contrast: r.contrast, phonesDrawn: r.phonesDrawn, style: s2,
      reworded: { on: ON, ...(Object.keys(diff).length ? { words: diff } : {}), ...(moved ? { moved } : {}) },
    });
    console.log(`${c.id.padEnd(22)} drawn${Object.keys(diff).length ? ' with new words' : ''}${moved ? '; moved: ' + moved.to + ' (was refused: ' + moved.from.join('; ') + ')' : ''}`);
  }

  // the report's summary, as render.mjs makes it
  const done = B.report.cards.filter(r => r.ok), had = done.filter(r => r.before);
  const median = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
  B.report.summary = {
    ...B.report.summary,
    after: { headline: median(done.map(r => r.px.headline)), number: median(done.map(r => r.px.number)), smallest: median(done.map(r => r.px.smallest)), minSmallest: Math.min(...done.map(r => r.px.smallest)) },
    distinct: { phoneSets: new Set(done.map(r => [...r.phones].sort().join(','))).size, grounds: new Set(done.map(r => r.look.palette + '|' + r.look.background)).size, faces: new Set(done.map(r => r.look.font)).size },
  };
  B.report.reworded = new Date().toISOString();
  writeFileSync(B.dir + 'report.json', JSON.stringify(B.report, null, 1) + '\n');
  writeFileSync(B.cards, JSON.stringify(B.cardsDoc, null, 2) + '\n');

  // the sheets, drawn in the page as render.mjs draws them
  const url = f => 'data:image/jpeg;base64,' + readFileSync(f).toString('base64');
  const after = done.map((r, i) => [`${i + 1} ${r.id}`, url(B.dir + r.id + '.jpg')]);
  writeFileSync(B.dir + 'sheet.jpg', Buffer.from((await page.evaluate(([items]) => FS.sheet(items, 8, 270), [after])).split(',')[1], 'base64'));
  const pairs = had.filter(r => existsSync(ROOT + `assets/library-ads/${r.id}.jpg`)).flatMap((r, i) => [[`${i + 1} before`, url(ROOT + `assets/library-ads/${r.id}.jpg`)], [`${i + 1} after`, url(B.dir + r.id + '.jpg')]]);
  if (pairs.length && existsSync(B.dir + 'compare.jpg')) writeFileSync(B.dir + 'compare.jpg', Buffer.from((await page.evaluate(([items]) => FS.sheet(items, 8, 270), [pairs])).split(',')[1], 'base64'));
}
await browser.close();

/* ---------- the ledger: what was made, as it now is ---------- */
const LEDGER = HERE + 'ledger.json', ledger = JSON.parse(readFileSync(LEDGER, 'utf8'));
for (const a of ledger.ads) {
  const p = plans.find(x => x.card.id === a.id && x.batch.name === a.batch);
  if (!p) continue;
  Object.assign(a, { headline: p.card.headline, claim: p.card.claim, line: p.card.line, points: p.card.points, cta: p.card.cta, where: p.card.where });
  if (p.row && p.row.style) Object.assign(a, { palette: p.row.style.palette, background: p.row.style.background, arrangement: p.row.style.arrangement, phones: p.row.phones });
}
writeFileSync(LEDGER, JSON.stringify(ledger, null, 1) + '\n');
console.log('done');
