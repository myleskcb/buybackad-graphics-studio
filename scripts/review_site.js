/* ONE PAGE, EVERYTHING, TWO BUTTONS.
   The owner asked to stop being sent from viewer to viewer: every image this
   engine has produced for them, in one bulk grid, each one approvable or
   deniable, with the verdicts kept and exportable. State lives in
   localStorage so a phone can put the page down and come back to it. */
const ITEMS = /*__ITEMS__*/[];
const GROUPS = /*__GROUPS__*/[];
const KEY = 'buyback-review-v1';

let votes = {};
try { votes = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { votes = {}; }
const undo = [];
let group = 'all', status = 'all', tile = 230, lbIndex = -1;
try { tile = +(localStorage.getItem(KEY + '-tile') || 230); } catch (e) {}

const $ = s => document.querySelector(s);
const shown = () => ITEMS.filter(it =>
  (group === 'all' || it.g === group) &&
  (status === 'all' || (status === 'undecided' ? !votes[it.id] : votes[it.id] === status)));

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(votes)); } catch (e) {}
  $('#saved').textContent = 'saved';
  clearTimeout(save.t); save.t = setTimeout(() => { $('#saved').textContent = ''; }, 1100);
}

function counts() {
  const y = ITEMS.filter(i => votes[i.id] === 'yes').length;
  const n = ITEMS.filter(i => votes[i.id] === 'no').length;
  $('#cy').textContent = y; $('#cn').textContent = n; $('#cu').textContent = ITEMS.length - y - n;
  $('#by').style.width = (y / ITEMS.length * 100) + '%';
  $('#bn').style.width = (n / ITEMS.length * 100) + '%';
  $('#sub').textContent = ITEMS.length + ' images · ' + GROUPS.length + ' sets';
}

function card(it, i) {
  const v = votes[it.id] || '';
  const sw = (it.sw || []).map(c => `<i style="background:${c}"></i>`).join('');
  return `<div class="card ${v}" data-id="${it.id}" data-i="${i}">
    ${v ? `<span class="tag ${v === 'yes' ? 'y' : 'n'}">${v === 'yes' ? 'KEPT' : 'OUT'}</span>` : ''}
    <img class="im" loading="lazy" decoding="async" src="${it.f}" alt="${it.n}" data-i="${i}">
    <div class="meta"><div class="nm">${it.n}</div><div class="sb">${it.s || it.id}</div>
      <div class="sw">${sw}</div></div>
    <div class="vote">
      <button class="n ${v === 'no' ? 'on' : ''}" data-v="no">&#10005;</button>
      <button class="y ${v === 'yes' ? 'on' : ''}" data-v="yes">&#10003;</button>
    </div></div>`;
}

function render() {
  const list = shown();
  const out = $('#out');
  if (!list.length) { out.innerHTML = '<div class="empty">Nothing matches that filter.</div>'; counts(); return; }
  let html = '';
  for (const g of GROUPS) {
    const part = list.filter(it => it.g === g.k);
    if (!part.length) continue;
    html += `<div class="gh">${g.n} &middot; ${part.length}</div><div class="grid">`;
    html += part.map(it => card(it, ITEMS.indexOf(it))).join('');
    html += '</div>';
  }
  out.innerHTML = html;
  counts();
}

function vote(id, v) {
  undo.push([id, votes[id]]);
  if (votes[id] === v) delete votes[id]; else votes[id] = v;
  save();
  const el = document.querySelector(`.card[data-id="${id}"]`);
  if (el && status === 'all') {
    const cur = votes[id] || '';
    el.className = 'card ' + cur;
    el.querySelectorAll('.vote button').forEach(b => b.classList.toggle('on', b.dataset.v === cur));
    const t = el.querySelector('.tag'); if (t) t.remove();
    if (cur) el.insertAdjacentHTML('afterbegin',
      `<span class="tag ${cur === 'yes' ? 'y' : 'n'}">${cur === 'yes' ? 'KEPT' : 'OUT'}</span>`);
    counts();
  } else render();
}

document.addEventListener('click', e => {
  const im = e.target.closest('.im');
  if (im) { openLb(+im.dataset.i); return; }
  const vb = e.target.closest('.vote button');
  if (vb) { vote(vb.closest('.card').dataset.id, vb.dataset.v); return; }
});

/* ── the enlarged view: the owner asked to see these bigger than a tile ── */
function openLb(i) {
  lbIndex = i; const it = ITEMS[i]; if (!it) return;
  $('#lbi').src = it.f;
  $('#lbm').innerHTML = `<b>${it.n}</b>${it.s || it.id} &middot; ${(GROUPS.find(g => g.k === it.g) || {}).n || ''}`;
  $('#lby').classList.toggle('on', votes[it.id] === 'yes');
  $('#lb').classList.add('open');
}
function closeLb() { $('#lb').classList.remove('open'); lbIndex = -1; }
function step(d) {
  const list = shown(); if (!list.length) return;
  let k = list.indexOf(ITEMS[lbIndex]);
  k = k < 0 ? 0 : (k + d + list.length) % list.length;
  openLb(ITEMS.indexOf(list[k]));
}
$('#lb').addEventListener('click', e => { if (e.target.id === 'lb') closeLb(); });
$('#lby').onclick = () => { vote(ITEMS[lbIndex].id, 'yes'); step(1); };
$('#lbn').onclick = () => { vote(ITEMS[lbIndex].id, 'no'); step(1); };
$('#lbu').onclick = () => { doUndo(); };

function doUndo() {
  const u = undo.pop(); if (!u) return;
  if (u[1]) votes[u[0]] = u[1]; else delete votes[u[0]];
  save(); render();
}

document.addEventListener('keydown', e => {
  if (e.target.tagName === 'TEXTAREA') return;
  const k = e.key.toLowerCase();
  if (e.key === 'Escape') return closeLb();
  if (lbIndex >= 0) {
    if (e.key === 'ArrowRight') { e.preventDefault(); return step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); return step(-1); }
    if (k === 'a') { vote(ITEMS[lbIndex].id, 'yes'); return step(1); }
    if (k === 'd') { vote(ITEMS[lbIndex].id, 'no'); return step(1); }
  }
  if (k === 'u') doUndo();
  if (k === '+' || k === '=') zoom(1);
  if (k === '-') zoom(-1);
});

/* ── filters ── */
const gwrap = $('#groups');
gwrap.innerHTML = [{ k: 'all', n: 'All', c: ITEMS.length }]
  .concat(GROUPS.map(g => ({ k: g.k, n: g.n, c: ITEMS.filter(i => i.g === g.k).length })))
  .map(g => `<button class="chip${g.k === 'all' ? ' on' : ''}" data-g="${g.k}">${g.n}<small>${g.c}</small></button>`).join('');
gwrap.addEventListener('click', e => {
  const b = e.target.closest('[data-g]'); if (!b) return;
  group = b.dataset.g;
  gwrap.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
  render();
});
document.querySelectorAll('[data-st]').forEach(b => b.onclick = () => {
  status = b.dataset.st;
  document.querySelectorAll('[data-st]').forEach(x => x.classList.toggle('on', x === b));
  render();
});

/* ── bulk actions: the whole point of a bulk view ── */
$('#ay').onclick = () => { shown().forEach(it => { undo.push([it.id, votes[it.id]]); votes[it.id] = 'yes'; }); save(); render(); };
$('#an').onclick = () => { shown().forEach(it => { undo.push([it.id, votes[it.id]]); votes[it.id] = 'no'; }); save(); render(); };
$('#reset').onclick = () => { if (confirm('Clear every decision?')) { votes = {}; save(); render(); } };

function zoom(d) {
  const S = [150, 180, 230, 300, 390, 500, 660];
  let i = S.indexOf(tile); if (i < 0) i = 2;
  i = Math.max(0, Math.min(S.length - 1, i + d));
  tile = S[i]; $('#zl').textContent = tile;
  document.documentElement.style.setProperty('--tile', tile + 'px');
  try { localStorage.setItem(KEY + '-tile', tile); } catch (e) {}
}
$('#zi').onclick = () => zoom(1); $('#zo').onclick = () => zoom(-1);

$('#exp').onclick = () => {
  const y = ITEMS.filter(i => votes[i.id] === 'yes'), n = ITEMS.filter(i => votes[i.id] === 'no');
  const line = i => `${i.id}  ${i.n}  [${(GROUPS.find(g => g.k === i.g) || {}).n || i.g}]`;
  $('#txt').value =
    `APPROVED (${y.length})\n${y.map(line).join('\n') || '(none)'}\n\n` +
    `DENIED (${n.length})\n${n.map(line).join('\n') || '(none)'}\n\n` +
    `--- json ---\n${JSON.stringify({ approved: y.map(i => i.id), denied: n.map(i => i.id) }, null, 1)}`;
  $('#dlg').showModal();
};
$('#copy').onclick = () => { $('#txt').select(); document.execCommand('copy'); $('#copy').textContent = 'Copied'; };
$('#close').onclick = () => $('#dlg').close();

document.documentElement.style.setProperty('--tile', tile + 'px');
$('#zl').textContent = tile;
render();
