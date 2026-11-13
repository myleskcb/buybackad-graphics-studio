#!/usr/bin/env node
/* The Type Lab review page: every candidate in assets/font-lab.json set as the
   claim, the price and the number, by design language, with a pick on each and
   one button that copies the picks as text. The 2026-09 font gallery kept its
   verdicts in one browser's localStorage and they were lost (OPEN-ITEMS, the
   lab clean-up): here the copied list is the record, and what comes back goes
   into font-lab.json's `verdicts`.

   One self-contained HTML file for publishing as an artifact, which may load
   stylesheets from Google Fonts only, so the faces come from there (the same
   OFL files that are vendored in assets/fonts/lab). Not part of the site.

     node scripts/build_type_lab_page.mjs <out.html>
*/
import { readFileSync, writeFileSync } from 'node:fs';
const lab = JSON.parse(readFileSync(new URL('../assets/font-lab.json', import.meta.url), 'utf8'));
const out = process.argv[2];
if (!out) { console.error('usage: node scripts/build_type_lab_page.mjs <out.html>'); process.exit(1); }

/* the Google Fonts request for a face, from what was vendored */
const spec = f => {
  const fam = f.family.replace(/ /g, '+');
  if (f.variable) {
    const w = f.axes.wght.join('..');
    return f.hasWdth ? `${fam}:wdth,wght@${f.axes.wdth.join('..')},${w}` : `${fam}:wght@${w}`;
  }
  const ws = [...new Set(f.files.map(x => x.weight))].sort((a, b) => a - b);
  return f.files.some(x => x.italic)
    ? `${fam}:ital,wght@${ws.map(w => '0,' + w).concat(ws.map(w => '1,' + w)).join(';')}`
    : `${fam}:wght@${ws.join(';')}`;
};
const css = readFileSync(new URL('../assets/fonts/lab/lab.css', import.meta.url), 'utf8');
const faces = lab.faces.map(f => {
  const hasWdth = new RegExp(`font-family:'${f.name}';[^}]*font-stretch`).test(css);
  const top = f.files[0].weight, weight = Array.isArray(top) ? Math.min(top[1], 900) : Math.max(...f.files.map(x => x.weight));
  return { n: f.name, g: f.family, l: f.language, k: f.like, d: f.designer, w: weight, i: f.files.some(x => x.italic) ? 1 : 0,
           x: hasWdth ? f.axes.wdth : null, q: spec({ ...f, hasWdth }) };
});
const links = [];
for (let i = 0; i < faces.length; i += 10)
  links.push(`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${faces.slice(i, i + 10).map(f => 'family=' + f.q).join('&amp;')}&amp;display=swap">`);
faces.forEach(f => delete f.q);

const html = `<title>Type Lab</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap">
${links.join('\n')}
<style>
/* layout: a sticky tool bar over a wall of specimens; the chrome stays quiet so the faces are the only loud thing */
:root{
  --bg:#f3f4f7; --panel:#ffffff; --fg:#14171f; --muted:#5b6272; --line:#d9dce4; --accent:#0b7a55; --accent-ink:#ffffff; --maybe:#a45a00;
  --ui:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;
}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){ --bg:#0e1016; --panel:#171a23; --fg:#eef0f5; --muted:#9aa1b2; --line:#2a2f3d; --accent:#49d6a2; --accent-ink:#06261b; --maybe:#ffb347; color-scheme:dark } }
:root[data-theme="dark"]{ --bg:#0e1016; --panel:#171a23; --fg:#eef0f5; --muted:#9aa1b2; --line:#2a2f3d; --accent:#49d6a2; --accent-ink:#06261b; --maybe:#ffb347; color-scheme:dark }
body{background:var(--bg);color:var(--fg);font-family:var(--ui);font-size:15px;line-height:1.5}
.wrap{max-width:1500px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
header .wrap{padding-block:28px 14px}
h1{font-size:28px;line-height:1.15;margin:0 0 8px;font-weight:700;letter-spacing:-.01em}
.lede{max-width:68ch;color:var(--muted);margin:0}
.lede b{color:var(--fg);font-weight:600}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:10;background:var(--bg)}
.bar{position:sticky;top:env(safe-area-inset-top,0px);z-index:5;background:var(--bg);border-bottom:1px solid var(--line)}
.bar .wrap{padding-block:10px;display:flex;flex-direction:column;gap:10px}
.row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
input[type=text]{flex:1 1 220px;min-width:0;font:500 15px var(--ui);padding:9px 12px;border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--fg)}
button{font:600 13px var(--ui);cursor:pointer;border-radius:999px;border:1px solid var(--line);background:var(--panel);color:var(--fg);padding:7px 12px}
button:focus-visible,input:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
button[aria-pressed="true"]{background:var(--fg);color:var(--bg);border-color:var(--fg)}
.chips{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px;scrollbar-width:thin}
.chips button{white-space:nowrap;flex:none}
.chips .ct{opacity:.6;font-weight:500;margin-left:4px}
.sw{width:30px;height:30px;padding:0;border-radius:8px;border:2px solid var(--line)}
.sw[aria-pressed="true"]{border-color:var(--accent);background:revert}
.copy{background:var(--accent);color:var(--accent-ink);border-color:var(--accent);margin-left:auto}
.tally{color:var(--muted);font-size:13px;font-variant-numeric:tabular-nums}
main .wrap{padding-block:18px 60px}
h2{font-size:13px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);margin:26px 0 10px;font-weight:600}
h2:first-child{margin-top:0}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,340px),1fr));gap:12px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;content-visibility:auto;contain-intrinsic-size:auto 300px}
.card.yes{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent)}
.card.maybe{border-color:var(--maybe);box-shadow:0 0 0 2px var(--maybe)}
.spec{padding:18px 16px 16px;overflow:hidden;display:flex;flex-direction:column;gap:6px;min-height:170px;justify-content:center}
.spec .h{font-size:44px;line-height:1.02;overflow-wrap:anywhere}
.spec .p{font-size:27px;line-height:1.1}
.spec .t{font-size:17px;line-height:1.25}
/* the ad grounds are the specimen's own colours, the same in either theme */
.g-night .spec{background:#12151c;color:#f6f3ec}.g-night .p{color:#5ad1a5}.g-night .t{color:#b9c0cf}
.g-signal .spec{background:#ffd60a;color:#111111}.g-signal .p{color:#b3001b}.g-signal .t{color:#2b2b2b}
.g-white .spec{background:#ffffff;color:#0e1320}.g-white .p{color:#0a52d6}.g-white .t{color:#3e4657}
.g-hot .spec{background:#e4002b;color:#ffffff}.g-hot .p{color:#ffe14a}.g-hot .t{color:#ffe4e8}
.meta{padding:10px 12px 12px;display:flex;gap:8px;align-items:flex-start;justify-content:space-between;border-top:1px solid var(--line)}
.meta .who{min-width:0}
.meta .nm{font-weight:600;font-size:14px}
.meta .sub{font-size:12px;color:var(--muted);overflow-wrap:anywhere}
.pick{display:flex;gap:6px;flex:none}
.pick button{padding:6px 11px}
.pick .y[aria-pressed="true"]{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}
.pick .m[aria-pressed="true"]{background:var(--maybe);color:var(--bg);border-color:var(--maybe)}
#out{width:100%;min-height:120px;font:13px ui-monospace,Menlo,monospace;margin-top:10px;padding:10px;border-radius:8px;border:1px solid var(--line);background:var(--panel);color:var(--fg);box-sizing:border-box}
.note{font-size:13px;color:var(--muted)}
@media (max-width:520px){ .spec .h{font-size:36px} h1{font-size:23px} }
</style>
<header><div class="wrap">
  <h1>Type Lab: ${faces.length} new faces for the ads</h1>
  <p class="lede">None of these were in the last review and none are in the studio yet. Every one is open-licence (SIL OFL), so it can be used in paid ads, self-hosted and even redrawn. <b>Tap Yes or Maybe</b> on the ones you want, then <b>Copy my picks</b> and send the list back: that list is the record.</p>
</div></header>
<div class="bar"><div class="wrap">
  <div class="row">
    <input type="text" id="words" value="Sell Your iPhone" aria-label="Headline to preview" maxlength="60">
    <button class="sw" data-g="night" style="background:#12151c" aria-label="Dark ground" aria-pressed="true"></button>
    <button class="sw" data-g="signal" style="background:#ffd60a" aria-label="Yellow ground" aria-pressed="false"></button>
    <button class="sw" data-g="white" style="background:#ffffff" aria-label="White ground" aria-pressed="false"></button>
    <button class="sw" data-g="hot" style="background:#e4002b" aria-label="Red ground" aria-pressed="false"></button>
    <button id="caps" aria-pressed="false">ALL CAPS</button>
    <span class="tally" id="tally"></span>
    <button class="copy" id="copy">Copy my picks</button>
  </div>
  <div class="chips" id="chips" role="group" aria-label="Design language"></div>
</div></div>
<main><div class="wrap g-night" id="wall"></div>
<div class="wrap" style="padding-bottom:60px">
  <h2>Your picks, as text</h2>
  <p class="note">If the copy button does nothing in your app, select this text and copy it by hand.</p>
  <textarea id="out" readonly aria-label="Your picks"></textarea>
</div></main>
<script>
const LANG = ${JSON.stringify(lab.languages)};
const FACES = ${JSON.stringify(faces)};
const KEY = 'type-lab-verdicts-v1';
let verdict = {}; try { verdict = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(verdict)); } catch (e) {} };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const wall = document.getElementById('wall'), chips = document.getElementById('chips'), words = document.getElementById('words');
let filter = 'all', caps = false;
const tx = s => caps ? s.toUpperCase() : s;
function render(){
  const langs = Object.keys(LANG).filter(l => filter === 'all' || filter === 'picked' || l === filter);
  let h = '';
  for (const l of langs){
    const fs = FACES.filter(f => f.l === l && (filter !== 'picked' || verdict[f.n]));
    if (!fs.length) continue;
    h += '<h2>' + esc(LANG[l]) + ' · ' + fs.length + '</h2><div class="grid">' + fs.map(f => {
      const st = "font-family:'" + f.g + "',var(--ui);font-weight:" + f.w + (f.i && l === 'italic' ? ';font-style:italic' : '') + (f.x && l === 'wide' ? ';font-stretch:' + f.x[1] + '%' : '') + (f.x && l === 'compressed' ? ';font-stretch:' + f.x[0] + '%' : '');
      const v = verdict[f.n] || '';
      return '<article class="card ' + v + '" data-n="' + esc(f.n) + '"><div class="spec" style="' + st + '"><div class="h">' + esc(tx(words.value || 'Sell Your iPhone')) + '</div><div class="p">$1,250 CASH TODAY</div><div class="t">' + esc(tx('(562) 999-4994 · Same-day cash')) + '</div></div>' +
        '<div class="meta"><div class="who"><div class="nm">' + esc(f.n) + '</div><div class="sub">' + (f.k ? 'In the style of ' + esc(f.k) + ' · ' : '') + esc(f.d) + '</div></div>' +
        '<div class="pick"><button class="y" aria-pressed="' + (v === 'yes') + '">Yes</button><button class="m" aria-pressed="' + (v === 'maybe') + '">Maybe</button></div></div></article>';
    }).join('') + '</div>';
  }
  wall.innerHTML = h || '<p class="note">Nothing picked yet. Tap Yes or Maybe on a face.</p>';
}
function list(){
  const by = v => FACES.filter(f => verdict[f.n] === v);
  const sec = (title, fs) => fs.length ? title + ' (' + fs.length + ')\\n' + Object.keys(LANG).map(l => { const x = fs.filter(f => f.l === l); return x.length ? '  ' + LANG[l] + ': ' + x.map(f => f.n).join(', ') : ''; }).filter(Boolean).join('\\n') + '\\n' : '';
  return (sec('YES', by('yes')) + sec('MAYBE', by('maybe'))) || 'No picks yet.';
}
function tally(){
  const y = FACES.filter(f => verdict[f.n] === 'yes').length, m = FACES.filter(f => verdict[f.n] === 'maybe').length;
  document.getElementById('tally').textContent = y + ' yes · ' + m + ' maybe';
  document.getElementById('out').value = list();
}
function buildChips(){
  const opts = [['all', 'All', FACES.length], ['picked', 'My picks', null]].concat(Object.keys(LANG).map(l => [l, LANG[l], FACES.filter(f => f.l === l).length]));
  chips.innerHTML = opts.map(([k, t, c]) => '<button data-f="' + k + '" aria-pressed="' + (k === filter) + '">' + esc(t) + (c ? '<span class="ct">' + c + '</span>' : '') + '</button>').join('');
}
chips.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; filter = b.dataset.f; buildChips(); render(); window.scrollTo({ top: document.querySelector('.bar').offsetTop }); });
wall.addEventListener('click', e => {
  const b = e.target.closest('.pick button'); if (!b) return;
  const card = b.closest('.card'), n = card.dataset.n, v = b.classList.contains('y') ? 'yes' : 'maybe';
  if (verdict[n] === v) delete verdict[n]; else verdict[n] = v;
  save(); card.className = 'card ' + (verdict[n] || '');
  card.querySelector('.y').setAttribute('aria-pressed', verdict[n] === 'yes'); card.querySelector('.m').setAttribute('aria-pressed', verdict[n] === 'maybe');
  tally();
});
let t; words.addEventListener('input', () => { clearTimeout(t); t = setTimeout(render, 150); });
document.querySelectorAll('.sw').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.sw').forEach(x => x.setAttribute('aria-pressed', x === b));
  wall.className = 'wrap g-' + b.dataset.g;
}));
document.getElementById('caps').addEventListener('click', e => { caps = !caps; e.currentTarget.setAttribute('aria-pressed', caps); render(); });
document.getElementById('copy').addEventListener('click', e => {
  const b = e.currentTarget, o = document.getElementById('out'), done = ok => { b.textContent = ok ? 'Copied' : 'Select the text below'; setTimeout(() => b.textContent = 'Copy my picks', 2200); if (!ok) { o.scrollIntoView({ block: 'center' }); o.focus(); o.select(); } };
  try { navigator.clipboard.writeText(list()).then(() => done(true), () => done(false)); } catch (err) { done(false); }
});
buildChips(); render(); tally();
</script>
`;
writeFileSync(out, html);
console.log(faces.length + ' faces, ' + (html.length / 1024).toFixed(0) + ' KB -> ' + out);
