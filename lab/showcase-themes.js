/* Swipe grading for themes and baked sheets.
 *
 * Replaces the grid grader (kept as showcase-themes.grid.html) because a grid
 * invites skimming: you see thirty at once, compare them to each other, and
 * grade relative to the page instead of to a standard. One card at a time
 * forces a judgement per design, which is the only kind worth training on.
 *
 * A grade carries a REASON. "Bad" teaches nothing that can be acted on; "bad,
 * colour + spacing" is a rule waiting to be written. The reason chips are the
 * point of this tool, not the swipe.
 *
 * Grades share the localStorage key and value vocabulary of the old grid
 * (up / star / down), so anything already graded carries straight over and the
 * two views stay interchangeable.
 */
import { drawShowcase, THEMES, themeOpts } from '../engine/showcase.mjs';

const PALETTES = {
  jewel:  { dark:'#12121a', body:'#8b8fa3', paper:'#f4f5fa', ground:'#241f3d', ground2:'#6f5bd6', accent:'#e8b23c', hot:'#e0475f', ink:'#0a0912' },
  candy:  { dark:'#1a1020', body:'#a08fae', paper:'#fff5fb', ground:'#2b1436', ground2:'#ff6fb1', accent:'#ffd166', hot:'#4ecdc4', ink:'#0d0710' },
  olive:  { dark:'#141710', body:'#9aa08a', paper:'#f6f7f1', ground:'#22301c', ground2:'#8dc06a', accent:'#d9a12c', hot:'#c25434', ink:'#0a0c08' },
  ember:  { dark:'#1b1310', body:'#a2938b', paper:'#faf5f1', ground:'#2b1710', ground2:'#e8a074', accent:'#e8c65a', hot:'#d1402c', ink:'#0f0906' },
  arctic: { dark:'#0d141a', body:'#8fa2b0', paper:'#f2f8fc', ground:'#122233', ground2:'#5ec8e8', accent:'#f2c14e', hot:'#ef5d60', ink:'#070d12' },
  night:  { dark:'#0a0a0f', body:'#7c8194', paper:'#eef0f6', ground:'#12131c', ground2:'#7b5cff', accent:'#31e1a0', hot:'#ff4d7d', ink:'#050508' },
};

/* Baked sheets already in the repo. Graded as images because they are the
   record of what a build actually produced — a live re-render would grade
   today's code against yesterday's judgement. */
const SHEETS = {
  review:  { dir:'review',  label:'review sheet' },
  set8:    { dir:'set8',    label:'set 8' },
  set9:    { dir:'set9',    label:'set 9' },
  themeimg:{ dir:'themeimg',label:'theme images' },
};

const $ = s => document.querySelector(s);
const KEY = 'gfx.themeGrades.v1';
const grades = JSON.parse(localStorage.getItem(KEY) || '{}');
const save = () => localStorage.setItem(KEY, JSON.stringify(grades));
const history = [];

Object.keys(PALETTES).forEach(k => $('#pal').append(new Option(k, k)));
$('#src').append(new Option('themes (live from engine)', 'live'));
Object.entries(SHEETS).forEach(([k, v]) => $('#src').append(new Option(v.label, k)));

/* ── rendering ──────────────────────────────────────────────────────────── */
function shim(P, R, tag) {
  let n = 0; const D = [], B = [];
  return { P, R, F:{ body:'ui-sans-serif' },
    id: p => `${p || 'x'}${tag}_${n++}`,
    def: d => D.push(d), add: b => B.push(b),
    out: () => ({ defs:D.join(''), body:B.join('') }) };
}
function mkR(seed) {
  let s = (seed >>> 0) || 1;
  const r = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  return { f:(a,b)=>a+(b-a)*r(), pick:a=>a[Math.floor(r()*a.length)%a.length],
           chance:p=>r()<p, i:(a,b)=>Math.floor(a+(b-a+1)*r()) };
}
function themeArt(theme, P, seed) {
  const W = 560, H = 560;
  const c = shim(P, mkR(seed), theme.id.replace(/\W/g, ''));
  drawShowcase(c, { x:0, y:0, w:W, h:H }, { ...themeOpts(theme.id, P), fade:1 });
  const o = c.out();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="art"
    preserveAspectRatio="xMidYMid slice"><defs>${o.defs}</defs>
    <rect width="${W}" height="${H}" fill="${P.ground}"/>${o.body}</svg>`;
}

/* ── the deck ───────────────────────────────────────────────────────────── */
let deck = [];
async function buildDeck() {
  const src = $('#src').value;
  if (src === 'live') {
    deck = THEMES().map((t, i) => ({ id:t.id, note:t.note || '', kind:'theme', seed:101 + i*37 }));
  } else {
    /* The directory listing the lab server already serves — no manifest to
       keep in sync, and a file added by a render run shows up on reload. */
    const dir = SHEETS[src].dir;
    const html = await (await fetch(`./${dir}/`)).text();
    const files = [...html.matchAll(/href="([^"]+\.(?:webp|png|jpg))"/gi)]
      .map(m => decodeURIComponent(m[1])).filter(f => !f.startsWith('/'));
    deck = files.map(f => ({ id:`${dir}/${f}`, note:f.replace(/\.\w+$/, ''), kind:'image',
                             src:`./${dir}/${f}` }));
  }
  applyFilter();
}
let queue = [];
function applyFilter() {
  const want = $('#filter').value;
  queue = deck.filter(d => {
    const v = grades[d.id]?.v;
    return want === 'all' ? true : want === 'ungraded' ? !v : v === want;
  });
  paint();
}

/* ── painting the stack ─────────────────────────────────────────────────── */
function paint() {
  const stage = $('#stage');
  [...stage.querySelectorAll('.card')].forEach(c => c.remove());
  const P = PALETTES[$('#pal').value] || PALETTES.jewel;

  const graded = Object.values(grades).filter(g => g.v).length;
  $('#count').textContent =
    `${queue.length} in queue · ${deck.length} in source · ${graded} graded ` +
    `(${Object.values(grades).filter(g=>g.v==='star').length}★ ` +
    `${Object.values(grades).filter(g=>g.v==='up').length}✓ ` +
    `${Object.values(grades).filter(g=>g.v==='down').length}✗)`;
  $('#bar>i').style.width = deck.length ? (100 * (deck.length - queue.length) / deck.length) + '%' : '0';
  $('#done').style.display = queue.length ? 'none' : 'grid';
  if (!queue.length) return;

  /* Back to front, so the top card is appended last and needs no z-index.
     No loading="lazy" on the art: only four cards exist at a time, so lazy buys
     nothing and costs correctness — the card you are about to judge is exactly
     the one that must already be decoded, and a lazy image inside a transformed
     stack can sit at naturalWidth 0 indefinitely. */
  queue.slice(0, 4).reverse().forEach((item, idx, arr) => {
    const depth = arr.length - 1 - idx;
    const el = document.createElement('div');
    el.className = 'card';
    el.dataset.depth = depth;
    const art = item.kind === 'theme'
      ? themeArt(item, P, item.seed)
      : `<img class="art" decoding="async" src="${item.src}" alt="">`;
    el.innerHTML = `${art}
      <div class="stamp keep">KEEP</div><div class="stamp kill">KILL</div>
      <div class="bar"><span class="id">${item.id}</span><span class="note">${item.note}</span></div>`;
    $('#stage').append(el);
    if (depth === 0) wire(el, item);
  });
  syncChips();
}

/* ── grading ────────────────────────────────────────────────────────────── */
let pendingWhy = new Set();
function syncChips() {
  const top = queue[0];
  const g = top ? (grades[top.id] || {}) : {};
  pendingWhy = new Set(g.why || []);
  document.querySelectorAll('.chip').forEach(c =>
    c.classList.toggle('on', pendingWhy.has(c.dataset.w)));
}
document.querySelectorAll('.chip').forEach(c => c.onclick = () => {
  const w = c.dataset.w;
  pendingWhy.has(w) ? pendingWhy.delete(w) : pendingWhy.add(w);
  c.classList.toggle('on', pendingWhy.has(w));
  const top = queue[0];
  if (top) { grades[top.id] = { ...(grades[top.id]||{}), why:[...pendingWhy] }; save(); }
});

function grade(v, score) {
  const item = queue[0]; if (!item) return;
  history.push({ id:item.id, prev:grades[item.id] ? {...grades[item.id]} : null });
  if (v === null) { queue.shift(); paint(); return; }          // skip: no verdict recorded
  grades[item.id] = { v, score: score ?? grades[item.id]?.score ?? null,
                      why:[...pendingWhy], at: Date.now() };
  save();
  const card = $('#stage .card[data-depth="0"]');
  if (card) {
    const dir = v === 'down' ? -1 : 1;
    card.style.transition = 'transform .32s ease-in, opacity .32s ease-in';
    card.style.transform = `translateX(${dir * 620}px) rotate(${dir * 18}deg)`;
    card.style.opacity = '0';
  }
  setTimeout(() => { queue.shift(); paint(); }, v ? 170 : 0);
}

/* drag: the stamp tracks the gesture so the verdict is visible before release */
function wire(card, item) {
  let x0 = 0, y0 = 0, dx = 0, dy = 0, down = false;
  const keep = card.querySelector('.stamp.keep'), kill = card.querySelector('.stamp.kill');
  const start = e => {
    down = true; card.style.transition = 'none';
    const p = e.touches ? e.touches[0] : e;
    x0 = p.clientX; y0 = p.clientY;
  };
  const move = e => {
    if (!down) return;
    const p = e.touches ? e.touches[0] : e;
    dx = p.clientX - x0; dy = p.clientY - y0;
    card.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx * 0.045}deg)`;
    keep.style.opacity = Math.max(0, Math.min(1, dx / 130));
    kill.style.opacity = Math.max(0, Math.min(1, -dx / 130));
    if (e.cancelable) e.preventDefault();
  };
  const end = () => {
    if (!down) return; down = false;
    card.style.transition = 'transform .25s ease-out';
    if (Math.abs(dx) > 110) return grade(dx > 0 ? 'up' : 'down');
    if (dy < -110) return grade('star');
    card.style.transform = '';
    keep.style.opacity = kill.style.opacity = 0;
    dx = dy = 0;
  };
  card.addEventListener('mousedown', start);
  addEventListener('mousemove', move);
  addEventListener('mouseup', end);
  card.addEventListener('touchstart', start, { passive:true });
  card.addEventListener('touchmove', move, { passive:false });
  card.addEventListener('touchend', end);
}

addEventListener('keydown', e => {
  if (/input|textarea|select/i.test(e.target.tagName)) return;
  const k = e.key;
  if (k === 'ArrowRight') { grade('up');   e.preventDefault(); }
  else if (k === 'ArrowLeft')  { grade('down'); e.preventDefault(); }
  else if (k === 'ArrowUp')    { grade('star'); e.preventDefault(); }
  else if (k === 'ArrowDown')  { grade(null);   e.preventDefault(); }   // skip
  else if (k >= '1' && k <= '5') {
    /* A score without a verdict is still a judgement: 4-5 keeps, 1-2 kills,
       3 is a shrug that should not silently become a keep. */
    const n = +k;
    grade(n >= 4 ? 'up' : n <= 2 ? 'down' : 'up', n);
  }
  else if (k.toLowerCase() === 'u') undo();
});

function undo() {
  const last = history.pop(); if (!last) return;
  if (last.prev) grades[last.id] = last.prev; else delete grades[last.id];
  save();
  const back = deck.find(d => d.id === last.id);
  if (back && !queue.some(q => q.id === back.id)) queue.unshift(back);
  paint();
}
$('#undo').onclick = undo;
$('#grid').onclick = () => location.href = './showcase-themes.grid.html';
$('#export').onclick = () => {
  /* Exported grouped and with the reasons attached, because the useful artefact
     is "these twelve were killed for colour", not a flat map of verdicts. */
  const rows = Object.entries(grades).filter(([, g]) => g.v)
    .map(([id, g]) => ({ id, verdict:g.v, score:g.score ?? null, why:g.why || [] }));
  const byWhy = {};
  rows.forEach(r => r.why.forEach(w => {
    (byWhy[w] = byWhy[w] || { up:[], down:[], star:[] })[r.verdict].push(r.id);
  }));
  const out = { exported:new Date().toISOString(), total:rows.length,
                kept:rows.filter(r=>r.verdict==='up').length,
                starred:rows.filter(r=>r.verdict==='star').length,
                killed:rows.filter(r=>r.verdict==='down').length,
                byReason:byWhy, grades:rows };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type:'application/json' }));
  a.download = 'theme-grades.json'; a.click();
};
['#pal', '#filter'].forEach(s => $(s).onchange = applyFilter);
$('#src').onchange = buildDeck;
buildDeck();
