#!/usr/bin/env node
/* HERO PICKER — a review page for choosing what goes in the shop window.
 *
 * The hero wall picks itself today: measured colourfulness, one palette per
 * card, a product in every one. That is a decent machine answer and it is not
 * taste. This page puts the eligible cards in front of the owner with a SKU on
 * each, so a human can say which eighteen belong there.
 *
 * The SKU is derived, not sequential: LAYOUT-PALETTE-VARIANT (CHK-JW07-16), so
 * the same card carries the same code next week and a pick can be quoted out
 * loud. Selection is kept on the device and copied out as a list.
 *
 * usage: node scripts/build_hero_picker.mjs
 * output: lab/hero.html + lab/hero.js  (CSP: no inline script)
 */
import { readFileSync, writeFileSync } from 'node:fs';
const ROOT = new URL('../', import.meta.url).pathname;
const idx = JSON.parse(readFileSync(ROOT + 'assets/showcase/index.json', 'utf8'));

const LAY = { checklistHero:'CHK', reviewProof:'REV', trustSeal:'TRS', stepsFlow:'STP', bubblePop:'BUB',
  voltStack:'VLT', neonNight:'NEO', slabPoster:'SLB', scriptRetro:'SCR', lowerThird:'LOW',
  gradientWave:'GRD', ticketStub:'TKT', hudTech:'HUD', bandKnockout:'BND', arcCrown:'ARC', glassCard:'GLS' };
const sku = c => {
  const p = c.id.split('-');                       // layout-palette-variant
  return (LAY[c.layout] || c.layout.slice(0,3).toUpperCase()) + '-' + (p[1] || '??').toUpperCase() + '-' + (p[2] || '0');
};

/* the same bar the wall applies, so the page shows what is actually eligible */
const live = idx.filter(c => !c.defect && c.imagery !== 'none' && (c.chroma === undefined || c.chroma >= 0.05));
const eligible = live.filter(c => c.imagery === 'product' && !(c.blur >= 15) && (c.chroma || 0) >= 0.12);
const strong  = live.filter(c => c.imagery === 'photo' && !(c.blur >= 15) && (c.chroma || 0) >= 0.22 && (c.density || 0) >= 26);

const score = c => (c.chroma || 0) * 2.2 + (c.affinity || 0) * 0.25 + (c.density || 0) / 90 + (c.imagery === 'product' ? 0.5 : 0);
const rank = list => list.slice().sort((a, b) => score(b) - score(a));
const cards = rank(eligible).concat(rank(strong)).map(c => ({
  id: c.id, sku: sku(c), name: c.name, theme: c.theme, family: c.family, layout: c.layout, cat: c.cat,
  chroma: +(c.chroma || 0).toFixed(2), hue: c.hue || 0, density: c.density || 0, aff: c.affinity || 0,
  imagery: c.imagery, c1: c.c1, ink: c.ink, accent: c.accent, support: c.support,
}));
const dup = {}; cards.forEach(c => { dup[c.sku] = (dup[c.sku] || 0) + 1; });
const clashes = Object.entries(dup).filter(([, n]) => n > 1);
if (clashes.length) console.log('WARNING: repeated SKUs: ' + clashes.slice(0,5).map(([k,n]) => k+'×'+n).join(', '));

const CATS = [...new Set(cards.map(c => c.cat))];
const FAMS = [...new Set(cards.map(c => c.family))];

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#14161c">
<title>Hero Picker</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;800&family=IBM+Plex+Mono:wght@400;600&display=swap">
<style>
:root{--ground:#14161c;--panel:#1b1e26;--panel-2:#212530;--line:#2c313d;--ink:#e9ebf1;--dim:#8f95a5;--faint:#5f6675;--keep:#5ad1a5;--accent:#b48cff;color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--ink);font-family:Archivo,-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}
.wrap{max-width:1700px;margin:0 auto;padding:18px 16px 150px;display:flex;flex-direction:column;gap:14px}
h1{font-size:20px;font-weight:800;letter-spacing:-.01em;margin:0}
.sub{color:var(--dim);font-size:13.5px;margin:0;line-height:1.5;max-width:78ch}
.mono{font-family:"IBM Plex Mono",ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums}
.filters{display:flex;flex-wrap:wrap;gap:6px}
.f{font:inherit;font-size:12.5px;font-weight:600;padding:7px 12px;border-radius:999px;border:1px solid var(--line);background:var(--panel-2);color:var(--dim);cursor:pointer}
.f:hover{color:var(--ink)}
.f.on{background:var(--accent);border-color:var(--accent);color:#160a2b}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px}
.card{background:var(--panel);border:3px solid var(--line);border-radius:14px;overflow:hidden;cursor:pointer;position:relative;transition:border-color .12s,transform .12s}
.card:hover{transform:translateY(-2px)}
.card:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.card img{display:block;width:100%;height:auto;background:#0d0f14}
.card.on{border-color:var(--keep);box-shadow:0 0 0 1px var(--keep),0 14px 36px rgba(90,209,165,.18)}
.tick{position:absolute;top:10px;right:10px;width:30px;height:30px;border-radius:50%;background:var(--keep);color:#0f1a15;display:none;align-items:center;justify-content:center;font-weight:900;font-size:16px}
.card.on .tick{display:flex}
.sku{position:absolute;top:10px;left:10px;font-family:"IBM Plex Mono",monospace;font-size:11.5px;font-weight:600;letter-spacing:.02em;padding:4px 8px;border-radius:7px;background:rgba(10,12,16,.82);color:#fff;border:1px solid rgba(255,255,255,.16)}
.meta{padding:7px 9px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:4px}
.nm{font-size:11.5px;font-weight:700;letter-spacing:-.01em;line-height:1.25}
.row{display:flex;align-items:center;gap:5px;flex-wrap:wrap}
.chip{font-size:9.5px;color:var(--dim);border:1px solid var(--line);border-radius:999px;padding:2px 7px;background:var(--panel-2);text-transform:uppercase;letter-spacing:.05em}
.sw{display:flex;gap:3px;margin-left:auto}
.sw i{width:12px;height:12px;border-radius:3px;display:block;border:1px solid rgba(255,255,255,.18)}
.dock{position:fixed;left:0;right:0;bottom:0;z-index:40;padding:12px 16px calc(12px + env(safe-area-inset-bottom,0px));background:linear-gradient(to top,var(--ground) 64%,rgba(20,22,28,0));display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none}
.dock>*{pointer-events:auto}
.count{font-size:13px;color:var(--dim)}
.count b{color:var(--keep);font-weight:700}
.controls{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
button.act{font:inherit;font-size:14px;font-weight:600;color:var(--ink);background:var(--panel-2);border:1px solid var(--line);border-radius:10px;padding:11px 18px;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.45)}
button.act:hover{border-color:var(--faint)}
button.act.go{background:var(--keep);border-color:var(--keep);color:#0f1a15;min-width:150px}
.out{position:fixed;inset:6% 8%;z-index:60;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:18px;display:none;flex-direction:column;gap:10px}
.out.show{display:flex}
.out textarea{flex:1;width:100%;background:#0d0f14;color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:12px;font-family:"IBM Plex Mono",monospace;font-size:13px;resize:none}
.back{color:var(--dim);font-size:13px;text-decoration:none}
.back:hover{color:var(--ink)}
@media (max-width:640px){.grid{grid-template-columns:repeat(2,1fr);gap:8px}.wrap{padding:14px 10px 160px}}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>Hero Picker</h1>
    <p class="sub">Every card the shop window is allowed to show, strongest first. Tap the ones that belong in the hero, then <b>Copy list</b> and send it back — the wall will show exactly those, in the order you picked them. Each card carries a SKU you can quote: layout, palette, variant. <b>${cards.length}</b> candidates: ${eligible.length} with a product cutout, ${strong.length} strong photographs.</p>
  </header>
  <div class="filters" id="filters"></div>
  <div class="grid" id="grid"></div>
  <a class="back" href="./">&larr; Back to the lab</a>
</div>
<div class="dock">
  <div class="count"><b id="n">0</b> picked</div>
  <div class="controls">
    <button class="act" id="clear">Clear</button>
    <button class="act" id="only">Show picked</button>
    <button class="act go" id="copy">Copy list</button>
  </div>
</div>
<div class="out" id="out">
  <div class="count">Send this back:</div>
  <textarea id="txt" readonly></textarea>
  <div class="controls"><button class="act" id="close">Close</button><button class="act go" id="copy2">Copy to clipboard</button></div>
</div>
<script src="hero.js"></script>
</body>
</html>`;

const js = `/* Hero Picker — selection lives on this device until it is copied out. */
const CARDS = ${JSON.stringify(cards)};
const CATS = ${JSON.stringify(CATS)};
const FAMS = ${JSON.stringify(FAMS)};
const KEY = 'pgfx_hero_picks';
let picked = [];
try { picked = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch(e){ picked = []; }
let filter = { cat:'all', fam:'all', only:false };

const $ = id => document.getElementById(id);
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(picked)); } catch(e){} };
const sync = () => { $('n').textContent = picked.length; };

function build(){
  const f = $('filters');
  f.innerHTML = '';
  const mk = (label, on, fn) => { const b = document.createElement('button'); b.className = 'f' + (on ? ' on' : ''); b.textContent = label; b.onclick = fn; f.appendChild(b); };
  mk('All ' + CARDS.length, filter.cat === 'all' && filter.fam === 'all', () => { filter.cat = 'all'; filter.fam = 'all'; build(); });
  CATS.forEach(c => mk(c + ' ' + CARDS.filter(x => x.cat === c).length, filter.cat === c, () => { filter.cat = filter.cat === c ? 'all' : c; build(); }));
  FAMS.forEach(c => mk(c, filter.fam === c, () => { filter.fam = filter.fam === c ? 'all' : c; build(); }));

  const g = $('grid');
  g.innerHTML = '';
  const list = CARDS.filter(c => (filter.cat === 'all' || c.cat === filter.cat)
    && (filter.fam === 'all' || c.family === filter.fam)
    && (!filter.only || picked.indexOf(c.sku) !== -1));
  list.forEach(c => {
    const d = document.createElement('div');
    d.className = 'card' + (picked.indexOf(c.sku) !== -1 ? ' on' : '');
    d.tabIndex = 0;
    d.innerHTML = '<img src="../assets/showcase/' + c.id + '.webp" alt="" loading="lazy" decoding="async">'
      + '<div class="sku">' + c.sku + '</div><div class="tick">&#10003;</div>'
      + '<div class="meta"><div class="nm">' + c.theme + ' &middot; ' + c.layout + '</div>'
      + '<div class="row"><span class="chip">' + c.cat + '</span><span class="chip">' + c.family + '</span>'
      + (c.imagery === 'product' ? '<span class="chip">product</span>' : '')
      + '<span class="sw"><i style="background:' + c.c1 + '"></i><i style="background:' + c.accent + '"></i><i style="background:' + c.support + '"></i></span></div></div>';
    const tog = () => {
      const i = picked.indexOf(c.sku);
      if (i === -1) picked.push(c.sku); else picked.splice(i, 1);
      d.classList.toggle('on', picked.indexOf(c.sku) !== -1);
      save(); sync();
      if (filter.only) build();
    };
    d.onclick = tog;
    d.onkeydown = e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); tog(); } };
    g.appendChild(d);
  });
  sync();
}

$('clear').onclick = () => { if (!picked.length || confirm('Clear all ' + picked.length + ' picks?')){ picked = []; save(); build(); } };
$('only').onclick = () => { filter.only = !filter.only; $('only').textContent = filter.only ? 'Show all' : 'Show picked'; build(); };
$('copy').onclick = () => {
  const byS = {}; CARDS.forEach(c => byS[c.sku] = c);
  const lines = picked.map((s, i) => (i + 1) + '. ' + s + '  ' + (byS[s] ? byS[s].id : '?'));
  $('txt').value = 'HERO PICKS (' + picked.length + ', in order)\\n' + lines.join('\\n');
  $('out').classList.add('show');
  $('txt').select();
};
$('close').onclick = () => $('out').classList.remove('show');
$('copy2').onclick = () => {
  $('txt').select();
  try { navigator.clipboard.writeText($('txt').value); } catch(e){ try { document.execCommand('copy'); } catch(e2){} }
  $('copy2').textContent = 'Copied';
  setTimeout(() => { $('copy2').textContent = 'Copy to clipboard'; }, 1400);
};
build();
`;

writeFileSync(ROOT + 'lab/hero.html', html);
writeFileSync(ROOT + 'lab/hero.js', js);
console.log('hero picker: ' + cards.length + ' candidates (' + eligible.length + ' product, ' + strong.length + ' photo) · lab/hero.html');
