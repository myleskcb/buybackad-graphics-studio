/* Grading console for the showcase themes.
 *
 * Renders every generated theme LIVE from engine/showcase.mjs — not from baked
 * assets — so a change to a wallpaper, a frame or the spectrum shows up on a
 * reload. That is the whole point: this is the surface you change the design
 * from, and a baked sheet would always be one build behind the code it is
 * meant to be judging.
 *
 * Grades live in localStorage and export as JSON, so a session of grading
 * survives a reload and can be handed back as a list of theme ids.
 */
import { drawShowcase, THEMES, themeOpts } from '../engine/showcase.mjs';

/* ── the palettes to grade against ──────────────────────────────────────── */
const PALETTES = {
  jewel:  { dark:'#12121a', body:'#8b8fa3', paper:'#f4f5fa', ground:'#241f3d', ground2:'#6f5bd6', accent:'#e8b23c', hot:'#e0475f', ink:'#0a0912' },
  candy:  { dark:'#1a1020', body:'#a08fae', paper:'#fff5fb', ground:'#2b1436', ground2:'#ff6fb1', accent:'#ffd166', hot:'#4ecdc4', ink:'#0d0710' },
  olive:  { dark:'#141710', body:'#9aa08a', paper:'#f6f7f1', ground:'#22301c', ground2:'#8dc06a', accent:'#d9a12c', hot:'#c25434', ink:'#0a0c08' },
  ember:  { dark:'#1b1310', body:'#a2938b', paper:'#faf5f1', ground:'#2b1710', ground2:'#e8a074', accent:'#e8c65a', hot:'#d1402c', ink:'#0f0906' },
  arctic: { dark:'#0d141a', body:'#8fa2b0', paper:'#f2f8fc', ground:'#122233', ground2:'#5ec8e8', accent:'#f2c14e', hot:'#ef5d60', ink:'#070d12' },
  night:  { dark:'#0a0a0f', body:'#7c8194', paper:'#eef0f6', ground:'#12131c', ground2:'#7b5cff', accent:'#31e1a0', hot:'#ff4d7d', ink:'#050508' },
};

/* ── the smallest canvas drawShowcase needs ─────────────────────────────── */
function shim(P, R, tag) {
  let n = 0; const D = [], B = [];
  return { P, R, F: { body: 'ui-sans-serif' },
    id: p => `${p || 'x'}${tag}_${n++}`,
    def: d => D.push(d), add: b => B.push(b),
    out: () => ({ defs: D.join(''), body: B.join('') }) };
}
/* xorshift: same seed, same card, every reload — so a grade means something */
function mkR(seed) {
  let s = (seed >>> 0) || 1;
  const r = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  return { f: (a, b) => a + (b - a) * r(), pick: a => a[Math.floor(r() * a.length) % a.length],
    chance: p => r() < p, i: (a, b) => Math.floor(a + (b - a + 1) * r()) };
}

const $ = s => document.querySelector(s);
const KEY = 'gfx.themeGrades.v1';
const grades = JSON.parse(localStorage.getItem(KEY) || '{}');
const save = () => localStorage.setItem(KEY, JSON.stringify(grades));
let salt = 0;

const palSel = $('#pal');
Object.keys(PALETTES).forEach(k => palSel.append(new Option(k, k)));

function svgFor(theme, P, ratio, seed) {
  const W = 520, H = Math.round(W / ratio);
  const c = shim(P, mkR(seed), theme.id.replace(/\W/g, ''));
  drawShowcase(c, { x: 0, y: 0, w: W, h: H }, { ...themeOpts(theme.id, P), fade: 1 });
  const o = c.out();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="art" preserveAspectRatio="xMidYMid slice">
    <defs>${o.defs}</defs><rect width="${W}" height="${H}" fill="${P.ground}"/>${o.body}</svg>`;
}

function render() {
  const P = PALETTES[palSel.value] || PALETTES.jewel;
  const ratio = parseFloat($('#ratio').value) || 1;
  const want = $('#filter').value;
  const all = THEMES();
  const shown = all.filter(t => {
    const g = grades[t.id]?.v;
    return want === 'all' ? true : want === 'ungraded' ? !g : g === want;
  });
  $('#count').textContent =
    `${shown.length} shown · ${all.length} themes · ${Object.values(grades).filter(g => g.v === 'up').length} kept · ` +
    `${Object.values(grades).filter(g => g.v === 'star').length} starred · ${Object.values(grades).filter(g => g.v === 'down').length} killed`;

  const grid = $('#grid');
  grid.textContent = '';
  shown.forEach((t, i) => {
    const g = grades[t.id] || {};
    const card = document.createElement('div');
    card.className = 'card' + (g.v ? ' ' + g.v : '');
    card.innerHTML = svgFor(t, P, ratio, 101 + i * 37 + salt * 9973) + `
      <div class="meta">
        <div class="id">${t.id}</div>
        <div class="note">${t.note}</div>
        <div class="row">
          <button data-v="up">Keep</button>
          <button data-v="star">★</button>
          <button data-v="down">Kill</button>
        </div>
        <textarea placeholder="notes">${(g.note || '').replace(/</g, '&lt;')}</textarea>
      </div>`;
    card.querySelectorAll('button').forEach(b => b.onclick = () => {
      const v = b.dataset.v;
      grades[t.id] = { ...(grades[t.id] || {}), v: grades[t.id]?.v === v ? null : v };
      save(); render();
    });
    card.querySelector('textarea').onchange = e => {
      grades[t.id] = { ...(grades[t.id] || {}), note: e.target.value }; save();
    };
    grid.append(card);
  });
}

$('#reroll').onclick = () => { salt++; render(); };
$('#clear').onclick = () => { if (confirm('Clear every grade?')) { Object.keys(grades).forEach(k => delete grades[k]); save(); render(); } };
$('#export').onclick = () => {
  const blob = new Blob([JSON.stringify(grades, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'theme-grades.json'; a.click();
};
['#pal', '#ratio', '#filter'].forEach(s => $(s).onchange = render);
render();
