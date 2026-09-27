#!/usr/bin/env node
/* THE CARD AUDIT. Two things the owner has had to say more than once:
     "people don't know what you're buying"  -> every card must SHOW the goods
     "the layering issue ... going on too long" -> nothing may sit on top of anything
   This reads the real drawn geometry from audit-layers.json, not the recipe,
   and reports per rule. LAB_OUT=<dir> node scripts/audit_cards.mjs [--json] */
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
const ROOT = new URL('../', import.meta.url).pathname;
const DIR = ROOT + (process.env.LAB_OUT || '.render/retheme').replace(/\/?$/, '/');
const layersFile = DIR + 'audit-layers.json';
if (!existsSync(layersFile)){ console.error('no audit-layers.json in ' + DIR + ' — render with LAB_DEBUG=ALL'); process.exit(2); }
const rows = JSON.parse(readFileSync(layersFile, 'utf8'));
const man = existsSync(DIR + 'manifest.json') ? JSON.parse(readFileSync(DIR + 'manifest.json', 'utf8')) : [];
const byId = Object.fromEntries(man.map(m => [m.id, m]));

const F = l => l.split(' | ');
const box = s => { const p = String(s || '').split(',').map(Number); return p.length === 4 && p.every(n => !isNaN(n)) ? { x:p[0], y:p[1], w:p[2], h:p[3] } : null; };
const area = b => Math.max(0, b.w) * Math.max(0, b.h);
const inter = (a, b) => {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
};
/* a ground that depicts the goods counts as imagery; a drawn sheet or a colour does not */
const SHOWS = /^(tile|cast|slab)$/;
const groundKind = g => /^bg-web/.test(g) ? 'photo' : /^scenes/.test(g) ? 'scene' : /^paper:/.test(g) ? 'paper' : g;

const hits = [];
const stat = { cards: rows.length, noImagery: 0, productOnText: 0, productOnProduct: 0, textOnText: 0, markOnMark: 0, markOnText: 0, textUnderPlate: 0, outsidePlate: 0, offPage: 0 };

for (const r of rows){
  if (!r.layers) continue;
  const m = byId[r.id] || {};
  const G = groundKind(String(m.ground || ''));
  const L = r.layers.map(F).map(f => ({
    i: +f[0], kind: f[1], role: f[2], name: f[3] || '', text: f[4] || '', fs: +f[5] || 0, b: box(f[6]),
  })).filter(l => l.b && area(l.b) > 0);

  const vis = l => !/Vignette|Grain|Frame|Ground|Wall|Overrun/i.test(l.name) && l.kind !== 'vignette' && l.kind !== 'grain';
  const cutouts = L.filter(l => l.kind === 'cutout' && vis(l));
  /* the star row is content, not decoration: a product touching it is the same
     fault as a product touching a line of copy */
  const texts = L.filter(l => typeof l.text === 'string' && l.text.trim() && l.kind === 'text' && vis(l)
    && (l.role !== 'deco' || /^Stars$/.test(l.name)));
  const marks = L.filter(l => (l.kind === 'path' || (l.role === 'deco' && l.kind === 'text')) && vis(l) && !/Sheen$/.test(l.name)
    && l.b.w < 260 && l.b.h < 260);
  const say = (rule, msg) => hits.push({ id: r.id, look: m.look || '', rule, msg });

  /* 1. THE GOODS ARE ON THE CARD */
  const photoGround = G === 'photo' || G === 'scene';
  const drawnInGround = !!m.onPage;   // the product was demoted into the ground and IS visible
  /* a product drawn into the ground is still a product on the card: it has to
     clear the words exactly like a layer does */
  if (m.onPageBox){
    const pb = { x:m.onPageBox[0], y:m.onPageBox[1], w:m.onPageBox[2], h:m.onPageBox[3] };
    for (const t of texts){
      const ov = inter(pb, t.b);
      if (t.role === 'badges' && ov < area(t.b) * 0.14) continue;
      if ((t.role === 'headline' && ov > 0) || ov > area(t.b) * 0.10 || ov > area(pb) * 0.25){ stat.productOnText++; say('product-on-text', `the ground product on "${t.text.slice(0, 24)}"`); break; }
    }
  }
  if (!cutouts.length && !SHOWS.test(G) && !photoGround && !drawnInGround){ stat.noImagery++; say('no-imagery', `nothing shows the goods: ${cutouts.length} cutouts on a "${G}" ground`); }

  /* 2. NOTHING SITS ON THE WORDS. A product may graze a badge stack (the owner
        allows that) but must clear real copy. */
  for (const c of cutouts) for (const t of texts){
    const ov = inter(c.b, t.b);
    if (!ov) continue;
    if (t.role === 'badges' && ov < area(t.b) * 0.14) continue;         // a graze is allowed
    /* measured BOTH ways: a big product across a line, and a small product
       sitting on a word — the second is what the tiny paper-card products were
       doing while covering too little of the headline box to be caught */
    /* a headline wants real clearance: a graze against the biggest words on the
       card still reads as a mistake */
    const headline = t.role === 'headline';
    if ((headline && ov > 0) || ov > area(t.b) * 0.10 || ov > area(c.b) * 0.25){
      stat.productOnText++;
      say('product-on-text', `${c.name} on "${t.text.slice(0, 24)}" (${Math.round(ov / area(c.b) * 100)}% of the product, ${Math.round(ov / area(t.b) * 100)}% of the line)`);
      break;
    }
  }

  /* 3. TWO PRODUCTS DO NOT STACK — the layering complaint */
  for (let a = 0; a < cutouts.length; a++) for (let b2 = a + 1; b2 < cutouts.length; b2++){
    const ov = inter(cutouts[a].b, cutouts[b2].b);
    const small = Math.min(area(cutouts[a].b), area(cutouts[b2].b));
    if (ov > small * 0.12){ stat.productOnProduct++; say('product-on-product', `${cutouts[a].name} and ${cutouts[b2].name} overlap by ${Math.round(ov / small * 100)}%`); }
  }

  /* 4. WORDS DO NOT STACK */
  for (let a = 0; a < texts.length; a++) for (let b2 = a + 1; b2 < texts.length; b2++){
    const ov = inter(texts[a].b, texts[b2].b);
    const small = Math.min(area(texts[a].b), area(texts[b2].b));
    if (ov > small * 0.30){ stat.textOnText++; say('text-on-text', `"${texts[a].text.slice(0, 18)}" over "${texts[b2].text.slice(0, 18)}"`); }
  }

  /* 5. TWO VECTORS IN ONE PLACE — "we're putting two vectors?? it looks like confused AI" */
  const deco = marks.filter(k => !/^Stars$/.test(k.name));
  for (let a = 0; a < deco.length; a++) for (let b2 = a + 1; b2 < deco.length; b2++){
    const ov = inter(deco[a].b, deco[b2].b);
    const small = Math.min(area(deco[a].b), area(deco[b2].b));
    if (ov > small * 0.15){ stat.markOnMark++; say('mark-on-mark', `${deco[a].name} and ${deco[b2].name} stacked`); }
  }
  for (const k of marks) for (const t of texts){
    if (k.i === t.i) continue;                       // the star row counts as both; do not compare it to itself
    const ov = inter(k.b, t.b);
    if (ov > area(k.b) * 0.35 && ov > area(t.b) * 0.08){ stat.markOnText++; say('mark-on-text', `${k.name} on "${t.text.slice(0, 22)}"`); break; }
  }

  /* 6. A WORD IS NOT BURIED UNDER A PLATE. A solid panel drawn after a line
        hides it — "GET YOUR OFFER" vanished under the phone pill. */
  const solids = L.filter(l => (l.kind === 'rect' || l.kind === 'rrect') && vis(l) && /solid/.test(r.layers[L.indexOf(l)] || '') === false ? false : (l.kind === 'rect' || l.kind === 'rrect') && vis(l));
  for (const t of texts){
    for (const pl of solids){
      if (pl.i <= t.i) continue;                       // drawn before the text: it is a backing, not a cover
      const ov = inter(pl.b, t.b);
      if (ov > area(t.b) * 0.55){ stat.textUnderPlate = (stat.textUnderPlate || 0) + 1; say('text-under-plate', `"${t.text.slice(0, 24)}" is covered by ${pl.name}`); break; }
    }
  }

  /* 7. A LINE SITS ON ITS OWN PLATE, not beside it — the rating pill that held
        neither its stars nor its sentence. */
  const PAIRS = [
    { plate: /^Rate Pill$/, items: /^(Stars|Rating Line)$/ },
    { plate: /^Phone Pill$/, items: /^Phone Number$/ },
    { plate: /^(CTA Bar|CTA Card)$/, items: /^CTA$/ },
  ];
  for (const P of PAIRS){
    const pl = L.find(l => P.plate.test(l.name));
    if (!pl) continue;
    for (const it of L.filter(l => P.items.test(l.name))){
      const ov = inter(pl.b, it.b);
      if (ov < area(it.b) * 0.80){
        stat.outsidePlate = (stat.outsidePlate || 0) + 1;
        say('outside-plate', `${it.name} is only ${Math.round(ov / area(it.b) * 100)}% inside ${pl.name}`);
      }
    }
  }

  /* 8. A HIGHLIGHT STAYS INSIDE WHAT IT LIGHTS */
  for (const sh of L){
    const m2 = /^(.*) Sheen$/.exec(sh.name); if (!m2) continue;
    const owner = L.find(l => l.name === m2[1]);
    if (!owner){ stat.sheenOrphan = (stat.sheenOrphan || 0) + 1; say('sheen-orphan', `${sh.name} lights nothing`); continue; }
    const ov = inter(sh.b, owner.b);
    if (ov < area(sh.b) * 0.98){
      stat.sheenOutside = (stat.sheenOutside || 0) + 1;
      say('sheen-outside', `${sh.name} is ${Math.round((1 - ov / area(sh.b)) * 100)}% outside ${owner.name}`);
    }
  }

  /* 9. NO DEAD ZONES. Owner, 2026-09-04: "don't you think these are a little
        blank of assets and have too much empty space?" Measured on a coarse grid:
        the largest rectangle holding nothing at all — no words, no product, no
        plate — must stay under a fifth of the card. */
  {
    const GS = 24, cols = Math.ceil(1080 / GS), rowsN = Math.ceil(1080 / GS);
    const busy = new Uint8Array(cols * rowsN);
    const content = L.filter(l => vis(l) && !/Sheen$/.test(l.name)
      && (l.kind === 'cutout' || (typeof l.text === 'string' && l.text.trim()) || l.kind === 'rect' || l.kind === 'rrect' || l.kind === 'circle' || l.kind === 'path'));
    for (const l of content){
      const x0 = Math.max(0, Math.floor(l.b.x / GS)), x1 = Math.min(cols - 1, Math.floor((l.b.x + l.b.w) / GS));
      const y0 = Math.max(0, Math.floor(l.b.y / GS)), y1 = Math.min(rowsN - 1, Math.floor((l.b.y + l.b.h) / GS));
      if ((x1 - x0 + 1) * (y1 - y0 + 1) > cols * rowsN * 0.86) continue;      // a full-bleed ground is not content
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) busy[y * cols + x] = 1;
    }
    /* largest all-empty rectangle, histogram method */
    const heights = new Int32Array(cols);
    let best = 0, bestBox = null;
    for (let y = 0; y < rowsN; y++){
      for (let x = 0; x < cols; x++) heights[x] = busy[y * cols + x] ? 0 : heights[x] + 1;
      const stack = [];
      for (let x = 0; x <= cols; x++){
        const h = x === cols ? 0 : heights[x];
        let start = x;
        while (stack.length && stack[stack.length - 1][1] >= h){
          const [si, sh] = stack.pop();
          const areaN = sh * (x - si);
          if (areaN > best){ best = areaN; bestBox = { x: si * GS, y: (y - sh + 1) * GS, w: (x - si) * GS, h: sh * GS }; }
          start = si;
        }
        stack.push([start, h]);
      }
    }
    const frac = best / (cols * rowsN);
    const covFrac = 1 - (busy.filter ? 0 : 0);
    let filledN = 0; for (let i = 0; i < busy.length; i++) filledN += busy[i];
    const coverage = filledN / (cols * rowsN);
    /* A GROUND THAT CARRIES THE PICTURE IS FILL. The first version of this rule
       counted plates as content but not the photograph, so a poster-style card —
       the owner's own house look, where the picture is the whole card and the
       words sit on it with no panels — scored WORSE than a card of empty boxes.
       Coverage is therefore only asked of cards whose ground shows nothing. */
    const groundCarries = SHOWS.test(G) || photoGround || drawnInGround;
    if (!groundCarries && coverage < 0.45){
      stat.sparseCard = (stat.sparseCard || 0) + 1;
      say('sparse-card', `only ${Math.round(coverage * 100)}% of the card holds anything, on a "${G}" ground that shows nothing`);
    }
    if (!groundCarries && frac > 0.20){
      stat.deadSpace = (stat.deadSpace || 0) + 1;
      say('dead-space', `${Math.round(frac * 100)}% of the card is one empty block (${Math.round(bestBox.w)}x${Math.round(bestBox.h)} at ${Math.round(bestBox.x)},${Math.round(bestBox.y)})`);
    }
  }

  /* 10. NOTHING FALLS OFF THE PAGE */
  for (const l of L.concat()){
    if (!vis(l)) continue;
    if (l.b.x < -14 || l.b.y < -14 || l.b.x + l.b.w > 1094 || l.b.y + l.b.h > 1094){
      stat.offPage++; say('off-page', `${l.name} at ${Math.round(l.b.x)},${Math.round(l.b.y)} ${Math.round(l.b.w)}x${Math.round(l.b.h)}`); break;
    }
  }
}

const byRule = {};
hits.forEach(h => (byRule[h.rule] ||= []).push(h));
const cardsWith = new Set(hits.map(h => h.id)).size;
console.log(`audit: ${stat.cards} cards · ${cardsWith} with hits`);
Object.entries(byRule).sort((a, b) => b[1].length - a[1].length).forEach(([rule, list]) => {
  console.log(`\n  ${rule}  ${list.length}`);
  list.slice(0, 6).forEach(h => console.log(`    ${h.id.padEnd(28)}${h.look.padEnd(30)}${h.msg}`));
  if (list.length > 6) console.log(`    … and ${list.length - 6} more`);
});
const looks = {};
hits.forEach(h => { if (h.look) looks[h.look] = (looks[h.look] || 0) + 1; });
const worst = Object.entries(looks).sort((a, b) => b[1] - a[1]).slice(0, 8);
if (worst.length){ console.log('\n  worst themes:'); worst.forEach(([k, n]) => console.log(`    ${k.padEnd(34)}${n}`)); }
if (process.argv.includes('--json')) writeFileSync(DIR + 'card-audit.json', JSON.stringify({ stat, hits }, null, 1));
process.exit(cardsWith ? 1 : 0);
