/* ══════════════════════════════════════════════════════════════════════════
   THE CONSOLE
   The engine above is the real engine/engine.mjs, injected at build time by
   scripts/build_console.mjs. Nothing here re-implements it — the previous
   console carried a hand-copied duplicate and had silently drifted a whole
   release behind (it was still drawing twelve rules against an engine that had
   grown to sixteen). Everything below only drives it.
   ══════════════════════════════════════════════════════════════════════════ */

const $ = s => document.querySelector(s);
const el = (t, a, h) => { const n = document.createElement(t);
  if (a) for (const k in a) k === 'class' ? n.className = a[k] : n.setAttribute(k, a[k]);
  if (h !== undefined) n.innerHTML = h; return n; };

const FMT = [['45', '4:5'], ['11', '1:1'], ['916', '9:16']];
const VERT = Object.keys(CONTENT);
const STORE = 'gfx-console-v2';

const S = {
  arch: 'nightLot', vertical: VERT[0], size: '45',
  seed: 4242, cfg: DEFAULT_CFG(),
  palette: null, pair: null,          // null = follow the seed
  tab: 'audit', impact: {}, log: [], lastKey: null, grades: {}, prev: null,
  brand: null,                        // null = the deck's own; else {name,kicker,initials,addr,phone,frame}
};
try { Object.assign(S, JSON.parse(localStorage.getItem(STORE) || '{}')); } catch {}
S.cfg = { ...DEFAULT_CFG(), ...(S.cfg || {}) };
const save = () => { try { localStorage.setItem(STORE, JSON.stringify(
  { arch: S.arch, vertical: S.vertical, size: S.size, seed: S.seed, cfg: S.cfg,
    palette: S.palette, pair: S.pair, tab: S.tab, grades: S.grades, brand: S.brand })); } catch {} };

/* live config, including the direct palette/type choices the old console lacked */
const conf = () => ({ ...S.cfg, palette: S.palette, pair: S.pair, brand: S.brand,
  embedFonts: false, assetBase: '../' });

/* ── chrome ─────────────────────────────────────────────────────────────── */
function segment(host, items, get, set) {
  host.innerHTML = '';
  items.forEach(([v, label]) => {
    const b = el('button', { 'aria-pressed': String(get() === v) }, label);
    b.onclick = () => { set(v); paint(); };
    host.append(b);
  });
}
const TABS = [['audit', 'Audit'], ['look', 'Look'], ['prompt', 'Prompt'], ['log', 'Log']];
function renderTabs() {
  const host = $('#tabs'); host.innerHTML = '';
  TABS.forEach(([k, label]) => {
    const b = el('button', { 'aria-selected': String(S.tab === k) }, label);
    b.onclick = () => { S.tab = k; save(); renderTabs(); showPane(); };
    host.append(b);
  });
}
const showPane = () => TABS.forEach(([k]) => $('#pane-' + k).hidden = S.tab !== k);

function renderArch() {
  const host = $('#archRow'); host.innerHTML = '';
  ARCHS.forEach(([k, name], i) => {
    const b = el('button', { 'aria-pressed': String(S.arch === k), title: `${name} — press ${i + 1}` }, name);
    b.onclick = () => { S.arch = k; paint(); };
    host.append(b);
  });
}

/* WHICH SWITCHES ARE EVEN LIVE HERE.
   Twenty-eight switches, and on any given layout a third of them draw nothing —
   Price Board has no arc crown, Poster Bleed has no price rows. Showing all of
   them at equal weight is what makes the rail read as a settings page: you flip
   something, nothing happens, and you learn to distrust the panel. So each one
   is tested against the current layout by flipping it and seeing whether the
   artwork actually changes, and the dead ones fold away. */
let LIVE = null, liveKey = '';
function liveSwitches() {
  const key = S.arch + '|' + S.vertical + '|' + S.size + '|' + S.seed;
  if (LIVE && liveKey === key) return LIVE;
  const base = render(S.arch, S.seed, S.vertical, S.size, conf()).svg;
  LIVE = {};
  ALLKEYS.forEach(k => {
    const flip = { ...conf(), [k]: S.cfg[k] === false };
    LIVE[k] = render(S.arch, S.seed, S.vertical, S.size, flip).svg !== base;
  });
  liveKey = key;
  return LIVE;
}

/* ── the switch rail ────────────────────────────────────────────────────── */
function renderQueue() {
  const host = $('#groups'); host.innerHTML = '';
  const live = liveSwitches();
  let dead = 0;
  QUEUE.forEach(([group, rows]) => {
    const shown = rows.filter(r => live[r[0]]);
    dead += rows.length - shown.length;
    if (!shown.length) return;
    const g = el('div', { class: 'grp' }, `<h3>${group}</h3>`);
    shown.forEach(([key, name, fx, purpose]) => {
      const on = S.cfg[key] !== false, imp = S.impact[key];
      const row = el('div', {
        class: 'sw', role: 'switch', tabindex: '0',
        'aria-checked': String(on), 'data-k': key,
        'data-last': String(S.lastKey === key),
        title: purpose || '',
      }, `<span class="dot"></span><span><b>${name}</b><i>${fx}</i></span>` +
         `<span class="imp ${imp > .01 ? 'pos' : imp < -.01 ? 'neg' : ''}">` +
         `${imp === undefined ? '' : (imp > 0 ? '+' : '') + (imp * 100).toFixed(0)}</span>`);
      const flip = () => { S.cfg[key] = !on; S.lastKey = key; note(`${on ? 'off' : 'on'} · ${name}`); paint(); };
      row.onclick = flip;
      row.onkeydown = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } };
      g.append(row);
    });
    host.append(g);
  });
  if (dead) {
    const names = ALLKEYS.filter(k => !live[k]).map(k => KEYMETA[k].name);
    const d = el('div', { class: 'grp' },
      `<h3>Draws nothing on this layout</h3><div class="dead">${names.join(' · ')}</div>`);
    host.append(d);
  }
  $('#onCount').textContent = ALLKEYS.filter(k => S.cfg[k] !== false).length + '/' + ALLKEYS.length;
}

/* ── readouts ───────────────────────────────────────────────────────────── */
const band = (v, good, mid) => v >= good ? 'ok' : v >= mid ? 'mid' : 'no';
function renderReadout(a) {
  $('#readout').innerHTML = [
    ['coverage', (a.coverage * 100).toFixed(0) + '%', band(a.coverage, .62, .5)],
    ['largest gap', (a.dead * 100).toFixed(0) + '%', a.dead <= .18 ? 'ok' : a.dead <= .26 ? 'mid' : 'no'],
    ['hot colour', (a.hotArea * 100).toFixed(0) + '%', a.hotArea <= .14 ? 'ok' : 'no'],
    ['elements', String(a.elements), ''],
    ['rules', `${a.pass}/${a.total}`, a.pass === a.total ? 'ok' : 'no'],
    ['pixels', '…', ''],
  ].map(([k, v, c]) => `<div class="gauge"><span>${k}</span><b class="${c}"${k === 'pixels' ? ' id="gPixels"' : ''}>${v}</b></div>`).join('');
}

/* The engine narrates its own failures — spill:, buried:, collide:, tight:,
   figures:, seal still costs. The old console threw all of that away and showed
   a grid of R-numbers, so a failing card told you THAT it failed and never why. */
/* THE ENGINE ALREADY EXPLAINS ITSELF — say it in English.
   card.notes carries lines like "buried: headline0 under badge 21%". The old
   console showed a grid of R-numbers and none of this, so a failing card told
   you THAT it failed and never why. Each note becomes a sentence naming the
   part, and "show me" outlines that part on the artwork. */
const FAULT = [
  [/^spill: (\S+) off (\S+)/, (m) => `“${m[1]}” runs off the ${m[2]} it was set on.`, m => m[1]],
  [/^buried: (\S+) under (\S+) (\d+)%/, (m) => `“${m[1]}” is ${m[3]}% covered by the ${m[2]} painted over it.`, m => m[1]],
  [/^collide: (\S+) x (\S+)/, (m) => `“${m[1]}” and “${m[2]}” overlap.`, m => m[1]],
  [/^tight: (.+) needs (\d+)%/, (m) => `${m[1]} needs ${m[2]}% of its box to stay legible — the copy is too long for the space.`, () => null],
  [/^figures: (\S+) "(.+?)" in (\S+)/, (m) => `${m[2]} is set in ${m[3]}, which draws a slashed zero.`, m => m[1]],
  [/^seal still costs (\d+)%/, (m) => `The seal had nowhere clean to sit; it still covers ${m[1]}% of a line.`, () => 'badge'],
];
function faultCard(note, r) {
  for (const [re, say, target] of FAULT) {
    const m = note.match(re);
    if (m) return { text: say(m), id: target(m) };
  }
  return { text: note, id: null };
}
function showMe(id) {
  const n = last.card.nodes.find(x => x.id === id);
  const svg = $('#frame').firstElementChild;
  if (!n || !svg) return;
  svg.querySelectorAll('[data-showme]').forEach(e => e.remove());
  const box = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  box.setAttribute('data-showme', '1');
  box.setAttribute('x', n.box.x); box.setAttribute('y', n.box.y);
  box.setAttribute('width', Math.max(2, n.box.w)); box.setAttribute('height', Math.max(2, n.box.h));
  box.setAttribute('fill', 'none'); box.setAttribute('stroke', '#4cc9f0');
  box.setAttribute('stroke-width', '5'); box.setAttribute('stroke-dasharray', '14 8');
  svg.append(box);
  $('#frame').classList.add('flash');
  setTimeout(() => { box.remove(); $('#frame').classList.remove('flash'); }, 2600);
}

function renderAudit(r) {
  const notes = r.card.notes.filter(n => /^(spill|buried|collide|tight|figures|seal)/.test(n));
  const rows = RULES.map(([id, name, test, sin]) => {
    const pass = (r.audit.rules.find(x => x[0] === id) || [, true])[1];
    return `<div class="rule ${pass ? '' : 'fail'}"><code>${id}</code>` +
           `<span><b>${name}</b><i>${pass ? test : sin}</i></span></div>`;
  }).join('');
  $('#pane-audit').innerHTML =
    `<h4>${r.audit.pass} of ${r.audit.total} rules</h4><div class="rules">${rows}</div>` +
    (notes.length
      ? `<h4>Faults</h4>` + notes.map((n, i) => { const f = faultCard(n, r);
          return `<div class="note">${esc(f.text)}` +
            (f.id ? ` <button class="showme" data-id="${f.id}">show me</button>` : '') + `</div>`; }).join('')
      : `<h4>Faults</h4><div class="empty">Nothing to report on this card.</div>`) +
    `<div id="pixelFaults"></div>` +
    `<h4>Grade</h4><div class="grade">
       <button class="keep" id="gKeep">Keep</button>
       <button class="cut" id="gCut">Cut</button></div>
     <div class="empty" id="gradeState"></div>`;
  const id = cardId();
  const g = S.grades[id];
  $('#gradeState').textContent = g ? `Graded "${g}" · ${Object.keys(S.grades).length} graded in total`
                                   : `${Object.keys(S.grades).length} graded in total`;
  $('#pane-audit').querySelectorAll('.showme').forEach(b => b.onclick = () => showMe(b.dataset.id));
  $('#gKeep').onclick = () => grade('keep');
  $('#gCut').onclick = () => grade('cut');
}

/* Palette and type pairing are chosen HERE rather than being whatever the seed
   handed you — the single biggest thing the old console could not do. */
function renderLook(r) {
  const swatch = p => `<span class="sw2" style="background:${p.accent}"></span>`;
  const pal = PALETTES.map(p =>
    `<button class="chip" data-pal="${p.id}" aria-pressed="${String(r.palette.id === p.id)}"
       title="${p.mood}">${swatch(p)}${p.name}</button>`).join('');
  const pairs = PAIRS.map(p =>
    `<button class="chip" data-pair="${p.id}" aria-pressed="${String(r.pair.id === p.id)}"
       title="${p.note}">${p.display} + ${p.body}</button>`).join('');
  const s = sentiment(r, conf());
  /* THE MONOGRAM. The mark is the owner's, or the next shop's — initials on an
     app-shaped plate, in a disc, floating, or no mark at all. Saved with the
     rest of the console's state, so it follows every card and every export. */
  const B = S.brand || {};
  const deck = CONTENT[S.vertical];
  const FRAMES = [['app', 'app shape'], ['circle', 'disc'], ['float', 'floating'], ['name', 'name only'], ['mark', 'mark only']];
  const brandUI =
    `<h4>Brand ${S.brand ? '· yours' : '· the deck\'s own'}</h4>
     <div class="brandgrid">
       <label>Name<input id="bName" value="${esc(B.name ?? deck.brand)}" maxlength="24"></label>
       <label>Initials<input id="bInit" value="${esc(B.initials ?? deck.mark)}" maxlength="3"></label>
       <label>Kicker<input id="bKick" value="${esc(B.kicker ?? deck.kicker)}" maxlength="22"></label>
       <label>Footer<input id="bAddr" value="${esc(B.addr ?? deck.addr)}" maxlength="30"></label>
     </div>
     <div class="chips">${FRAMES.map(([k, l]) => `<button class="chip" data-frame="${k}" aria-pressed="${String((B.frame || 'app') === k)}">${l}</button>`).join('')}</div>
     <button class="btn" id="brandReset" style="width:100%">use the deck's own brand</button>`;
  $('#pane-look').innerHTML = brandUI +
    `<h4>Palette ${S.palette ? '· pinned' : '· following the seed'}</h4><div class="chips">${pal}</div>` +
    `<h4>Type ${S.pair ? '· pinned' : '· following the seed'}</h4><div class="chips">${pairs}</div>` +
    `<button class="btn" id="unpin" style="width:100%">unpin both · back to the seed</button>` +
    `<h4>What this card is going for</h4><pre>${esc(s.words)}\n\n${esc(s.verdict)}</pre>` +
    s.meters.map(([k, v]) => `<div class="meter"><span><em>${k}</em><em>${(v * 100).toFixed(0)}%</em></span>` +
      `<div><b style="width:${Math.min(100, v * 100).toFixed(0)}%"></b></div></div>`).join('');
  $('#pane-look').querySelectorAll('[data-pal]').forEach(b => b.onclick = () => {
    S.palette = S.palette === b.dataset.pal ? null : b.dataset.pal;
    note('palette · ' + (S.palette || 'seed')); paint();
  });
  $('#pane-look').querySelectorAll('[data-pair]').forEach(b => b.onclick = () => {
    S.pair = S.pair === b.dataset.pair ? null : b.dataset.pair;
    note('type · ' + (S.pair || 'seed')); paint();
  });
  $('#unpin').onclick = () => { S.palette = S.pair = null; note('palette + type follow the seed'); paint(); };
  const setBrand = patch => { S.brand = { ...(S.brand || {}), ...patch }; save(); note('brand · ' + Object.keys(patch)[0]); paint(); };
  const bind = (id, key) => { const i = $(id); i.onchange = () => setBrand({ [key]: i.value.trim() });
    i.onkeydown = e => { if (e.key === 'Enter') i.blur(); }; };
  bind('#bName', 'name'); bind('#bInit', 'initials'); bind('#bKick', 'kicker'); bind('#bAddr', 'addr');
  $('#pane-look').querySelectorAll('[data-frame]').forEach(b => b.onclick = () => setBrand({ frame: b.dataset.frame }));
  $('#brandReset').onclick = () => { S.brand = null; save(); note('brand · deck'); paint(); };
}

function renderPrompt(r) {
  const p = buildPrompt(S.arch, r, conf());
  $('#pane-prompt').innerHTML =
    `<h4>Generated prompt</h4><pre>${esc(p.pos)}</pre>` +
    `<h4>Negative — everything switched off, plus the permanent exclusions</h4>` +
    `<pre class="neg">${esc(p.neg)}</pre>`;
}

function renderLog() {
  $('#pane-log').innerHTML = S.log.length
    ? S.log.slice(0, 60).map(l => `<div class="logline">${esc(l.what)}` +
        (l.delta === undefined ? '' : ` <em>${l.delta > 0 ? '+' : ''}${(l.delta * 100).toFixed(0)} pts</em>`) +
        `</div>`).join('')
    : '<div class="empty">No edits yet. Flip a switch and the change is measured here.</div>';
}

/* CSS cannot letterbox an inline SVG reliably — it carries a viewBox and no
   intrinsic size, so it either collapses to nothing or grows past its pane. The
   three formats differ by a factor of nearly two in aspect, so this is not a
   detail: measure the space and size the card to it. */
function fit() {
  const svg = $('#frame').firstElementChild;
  if (!svg) return;
  const vb = (svg.getAttribute('viewBox') || '0 0 1 1').split(/\s+/).map(Number);
  const aspect = vb[2] / vb[3];
  const pane = $('.canvas').getBoundingClientRect();
  const pad = 32;
  const w = Math.max(80, pane.width - pad), h = Math.max(80, pane.height - pad);
  const scale = Math.min(w / aspect > h ? h * aspect : w, w);
  const width = Math.min(w, h * aspect);
  svg.style.width = width + 'px';
  svg.style.height = (width / aspect) + 'px';
}
addEventListener('resize', fit);

/* THE CONSOLE CHECKS ITS OWN PIXELS.
   Same pixelFaults() the release gate runs in headless Chrome, applied to the
   card on screen after the fonts and photographs have settled. The engine's
   geometry is one opinion; this is the browser's. Both must be clean before
   a card is called clean here, and nothing that is not clean can be exported. */
let pixels = { ok: true, faults: [] };
async function checkPixels() {
  const svg = $('#frame').firstElementChild;
  if (!svg || openAxis) return;
  await document.fonts.ready;
  /* an SVG <image> has no .complete, so probe the file it points at instead of
     waiting a fixed 1.2s for pictures the browser already has */
  await Promise.all([...svg.querySelectorAll('image')].map(i => new Promise(r => {
    const probe = new Image(); probe.onload = probe.onerror = r; probe.src = i.getAttribute('href');
    setTimeout(r, 1500); })));
  const vb = (svg.getAttribute('viewBox') || '0 0 1 1').split(/\s+/).map(Number);
  const host = svg.getBoundingClientRect(), sx = vb[2] / host.width, sy = vb[3] / host.height;
  const boxes = [...svg.querySelectorAll('text')].map(t => { const b = t.getBoundingClientRect();
    return { s: (t.textContent || '').slice(0, 26), x: (b.left - host.left) * sx, y: (b.top - host.top) * sy,
             w: b.width * sx, h: b.height * sy, op: +(getComputedStyle(t).opacity || 1) }; });
  const faults = pixelFaults(boxes, vb[2], vb[3]);
  pixels = { ok: !faults.length, faults };
  renderVerdict();
}
const isClean = () => !!last && last.audit.pass === last.audit.total && pixels.ok;
function renderVerdict() {
  const g = $('#gPixels');
  if (g) { g.textContent = pixels.ok ? 'clean' : pixels.faults.length + ' fault' + (pixels.faults.length > 1 ? 's' : '');
           g.className = pixels.ok ? 'ok' : 'no'; }
  const ban = $('#frame').querySelector('.reject');
  if (ban) ban.remove();
  if (last && !isClean() && !openAxis) {
    const why = [...last.audit.rules.filter(x => !x[1]).map(x => x[0]), ...pixels.faults.slice(0, 2)];
    $('#frame').append(el('div', { class: 'reject' },
      `<b>NOT CLEAN — will not export</b><span>${esc(why.join(' · '))}</span>`));
  }
  const pf = $('#pixelFaults');
  if (pf) pf.innerHTML = pixels.faults.length
    ? pixels.faults.map(f => `<div class="note">${esc(f)}</div>`).join('') : '';
}

/* ── paint ──────────────────────────────────────────────────────────────── */
let last = null;
function paint() {
  const r = render(S.arch, S.seed, S.vertical, S.size, conf());
  last = r;
  if (openAxis) { renderAxis(openAxis); renderQueue(); renderArch(); save(); return r; }
  $('#frame').innerHTML = r.svg;
  /* The engine emits a viewBox and no width/height — correct for an exported
     asset, but a browser then has nothing to size the element from and the card
     collapsed to nothing in the middle of the console. Stamp the intrinsic size
     on so max-width/max-height can letterbox it properly. */
  fit();
  $('#seedTag').textContent = `${S.arch} · seed ${S.seed} · ${r.palette.id} · ${r.pair.id}`;
  renderReadout(r.audit);
  renderAudit(r); renderLook(r); renderPrompt(r); renderLog();
  pixels = { ok: true, faults: [] };
  checkPixels();
  renderQueue(); renderArch();
  segment($('#vertSeg'), VERT.map(v => [v, v]), () => S.vertical, v => S.vertical = v);
  segment($('#fmtSeg'), FMT, () => S.size, v => S.size = v);
  save();
  return r;
}

const cardId = () => [S.arch, S.vertical, S.size, S.seed,
  (last && last.palette.id), (last && last.pair.id),
  ALLKEYS.filter(k => S.cfg[k] === false).join('.')].join('|');

function score(r) { return r.audit.pass / r.audit.total * .6 + r.audit.coverage * .3 + (1 - r.audit.dead) * .1; }
function note(what) {
  const before = last ? score(last) : undefined;
  S.log.unshift({ what, before });
  queueMicrotask(() => { if (last && before !== undefined) S.log[0].delta = score(last) - before; });
}
function grade(v) {
  S.grades[cardId()] = v;
  note(`graded ${v}`); save(); renderAudit(last);
}

/* ── measuring every switch ─────────────────────────────────────────────── */
/* One toggle's worth on ONE card is noise; the number that means something is
   its average effect across every layout, which is what this measures. */
function measureAll() {
  const btn = $('#measure'); btn.textContent = 'measuring…'; btn.disabled = true;
  setTimeout(() => {
    const base = {};
    ARCHS.forEach(([k]) => base[k] = score(render(k, S.seed, S.vertical, S.size, conf())));
    ALLKEYS.forEach(key => {
      const flipped = { ...conf(), [key]: S.cfg[key] === false };
      let sum = 0;
      ARCHS.forEach(([k]) => sum += base[k] - score(render(k, S.seed, S.vertical, S.size, flipped)));
      S.impact[key] = (sum / ARCHS.length) * (S.cfg[key] === false ? -1 : 1);
    });
    btn.textContent = 'measure switches'; btn.disabled = false;
    renderQueue();
  }, 20);
}

/* ── export ─────────────────────────────────────────────────────────────── */
/* The SVG, the picture, and a machine-readable record of the whole decision —
   config, palette, type, audit, diagnostics, grade. That last file is the one
   worth keeping: a graded corpus of what the owner accepts is exactly what an
   autonomous model would have to be trained on. */
function download(name, text, type) {
  const a = el('a'); a.download = name;
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function record(r) {
  return {
    id: cardId(), arch: S.arch, vertical: S.vertical, size: S.size, seed: S.seed,
    palette: r.palette.id, pair: r.pair.id, brand: S.brand,
    off: ALLKEYS.filter(k => S.cfg[k] === false),
    audit: { coverage: +r.audit.coverage.toFixed(4), dead: +r.audit.dead.toFixed(4),
             hot: +r.audit.hotArea.toFixed(4), elements: r.audit.elements,
             pass: r.audit.pass, total: r.audit.total,
             failed: r.audit.rules.filter(x => !x[1]).map(x => x[0]) },
    notes: r.card.notes, pixels: pixels, clean: isClean(), grade: S.grades[cardId()] || null,
    prompt: buildPrompt(S.arch, r, conf()),
  };
}
function exportAll() {
  const r = last || paint();
  /* 100% confidence, no less. A card that fails a rule, or whose pixels the
     browser disagrees with, does not leave. The gate is offered instead: the
     nearest clean card, with what it changed said out loud. */
  if (!isClean()) {
    const g = renderClean(S.arch, S.seed, S.vertical, S.size, conf());
    if (!g) { note('export refused · no clean card near this one'); alert('Refused: this card is not clean and no clean neighbour was found.'); return; }
    const changed = [g.gate.seed !== S.seed ? `seed → ${g.gate.seed}` : null,
      ...g.gate.dropped.map(k => `${KEYMETA[k].name} off`)].filter(Boolean).join(', ');
    if (!confirm(`This card is not clean and will not export.\nExport the nearest clean card instead? (${changed})`)) return;
    S.seed = g.gate.seed; g.gate.dropped.forEach(k => S.cfg[k] = false);
    note('export took the gate · ' + changed); paint();
    setTimeout(exportAll, 400); return;
  }
  const stem = `${S.arch}-${S.vertical}-${S.size}-${S.seed}`;
  /* the exported SVG embeds its own fonts and absolute asset URLs so it opens
     anywhere, unlike the one on screen which leans on this page */
  const solo = render(S.arch, S.seed, S.vertical, S.size,
    { ...conf(), embedFonts: true, assetBase: new URL('../', location.href).href });
  download(stem + '.svg', solo.svg, 'image/svg+xml');
  download(stem + '.json', JSON.stringify(record(r), null, 2), 'application/json');
  const all = Object.entries(S.grades);
  if (all.length) download('graded.jsonl',
    all.map(([id, g]) => JSON.stringify({ id, grade: g })).join('\n'), 'application/x-ndjson');
  note(`exported ${stem}`);
}

/* HOLD TO COMPARE.
   The old A/B panel rendered before-and-after as thumbnails, where grain,
   sheen, a hard shadow and fit-to-plate are all invisible, so the comparison
   never showed what a switch did. This shows the counterfactual — the last
   switch flipped back — at the same size in the same place while a key is
   held, and snaps back on release. It cannot be mistaken for the live card
   because it is only there while your finger is down. */
let holding = false;
function holdStart() {
  if (holding || !S.lastKey) return;
  holding = true;
  const alt = { ...conf(), [S.lastKey]: S.cfg[S.lastKey] === false };
  const r = render(S.arch, S.seed, S.vertical, S.size, alt);
  $('#frame').innerHTML = r.svg; fit();
  $('#frame').classList.add('flash');
  $('#seedTag').textContent = `holding: ${KEYMETA[S.lastKey].name} ${S.cfg[S.lastKey] === false ? 'ON' : 'OFF'}`;
}
function holdEnd() {
  if (!holding) return;
  holding = false;
  $('#frame').classList.remove('flash');
  paint();
}

/* ONE AXIS, OPENED.
   The single card is where grading happens — the judges were right that
   approving from a 132px tile is approving blind. But choosing BETWEEN eight
   palettes or eight layouts one at a time is slow, so any one axis can be
   opened as a row of full cards at the current seed; click one and it becomes
   the live card. Tiles are kept large enough that the devices still read. */
const AXES = {
  arch:    { label: 'layout',  values: () => ARCHS.map(a => [a[0], a[1]]),         apply: v => S.arch = v,    cfg: () => conf() },
  palette: { label: 'palette', values: () => PALETTES.map(p => [p.id, p.name]),   apply: v => S.palette = v, cfg: v => ({ ...conf(), palette: v }) },
  pair:    { label: 'type',    values: () => PAIRS.map(p => [p.id, p.display + ' + ' + p.body]), apply: v => S.pair = v, cfg: v => ({ ...conf(), pair: v }) },
  seed:    { label: 'seed',    values: () => Array.from({ length: 8 }, (_, i) => [String((S.seed + i * 977) % 999983), '#' + i]), apply: v => S.seed = +v, cfg: () => conf() },
};
let openAxis = null;
function renderAxis(name) {
  openAxis = name;
  const ax = AXES[name];
  const host = $('#frame');
  host.innerHTML = '';
  host.className = 'card axis';
  const grid = el('div', { class: 'axisgrid' });
  ax.values().forEach(([v, label]) => {
    const arch = name === 'arch' ? v : S.arch;
    const seed = name === 'seed' ? +v : S.seed;
    const r = render(arch, seed, S.vertical, S.size, ax.cfg(v));
    const t = el('figure', { class: 'tile' + (r.audit.pass === r.audit.total ? '' : ' fail') },
      r.svg + `<figcaption><b>${esc(label)}</b><span>${r.audit.pass}/${r.audit.total} · ${(r.audit.coverage * 100) | 0}%</span></figcaption>`);
    const svg = t.querySelector('svg');
    const vb = svg.getAttribute('viewBox').split(/\s+/);
    svg.setAttribute('width', vb[2]); svg.setAttribute('height', vb[3]);
    t.onclick = () => { ax.apply(v); note(`${ax.label} · ${label}`); closeAxis(); };
    grid.append(t);
  });
  host.append(grid);
  $('#seedTag').textContent = `every ${ax.label} · click one · Esc closes`;
}
function closeAxis() { openAxis = null; $('#frame').className = 'card'; paint(); }

/* ── keyboard ───────────────────────────────────────────────────────────── */
const HINTS = [['1–8', 'layout'], ['[ ]', 'seed'], ['V', 'vertical'], ['F', 'format'],
  ['P', 'palette'], ['T', 'type'], ['hold C', 'compare last switch'], ['A', 'open an axis'],
  ['Space', 'undo last switch'], ['G / X', 'keep / cut'], ['E', 'export']];
$('#hints').innerHTML = HINTS.map(([k, v]) => `<span><span class="kbd">${k}</span> ${v}</span>`).join('');

const cycle = (arr, cur, dir) => arr[(arr.indexOf(cur) + dir + arr.length) % arr.length];
addEventListener('keyup', e => { if (e.key.toLowerCase() === 'c') holdEnd(); });
addEventListener('blur', holdEnd);
addEventListener('keydown', e => {
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  const k = e.key, n = +k;
  if (k === 'Escape' && openAxis) return closeAxis(), e.preventDefault();
  if (k.toLowerCase() === 'c' && !e.repeat) return holdStart(), e.preventDefault();
  if (k.toLowerCase() === 'a') {
    const order = Object.keys(AXES);
    renderAxis(openAxis ? order[(order.indexOf(openAxis) + 1) % order.length] : 'arch');
    return e.preventDefault();
  }
  if (n >= 1 && n <= ARCHS.length) { S.arch = ARCHS[n - 1][0]; return paint(), e.preventDefault(); }
  const go = () => { paint(); e.preventDefault(); };
  switch (k.toLowerCase()) {
    case ']': S.seed = (S.seed + 977) % 999983; return go();
    case '[': S.seed = (S.seed + 999006) % 999983; return go();
    case 'v': S.vertical = cycle(VERT, S.vertical, e.shiftKey ? -1 : 1); return go();
    case 'f': S.size = cycle(FMT.map(f => f[0]), S.size, e.shiftKey ? -1 : 1); return go();
    case 'p': S.palette = cycle(PALETTES.map(p => p.id), S.palette || (last && last.palette.id), e.shiftKey ? -1 : 1); return go();
    case 't': S.pair = cycle(PAIRS.map(p => p.id), S.pair || (last && last.pair.id), e.shiftKey ? -1 : 1); return go();
    case 'g': grade('keep'); return e.preventDefault();
    case 'x': grade('cut'); return e.preventDefault();
    case 'e': exportAll(); return e.preventDefault();
    case ' ':
      if (S.lastKey) { S.cfg[S.lastKey] = S.cfg[S.lastKey] === false; note('undo · ' + KEYMETA[S.lastKey].name); return go(); }
  }
});

$('#axisBtn').onclick = () => openAxis ? closeAxis() : renderAxis('arch');
$('#reroll').onclick = () => { S.seed = (S.seed * 1103515245 + 12345) % 999983; note('new seed'); paint(); };
$('#measure').onclick = measureAll;
$('#exportBtn').onclick = exportAll;

/* the faces this page draws with, declared once for every card on it */
document.head.append(el('style', null, fontCSS()));
renderTabs(); showPane(); paint();
