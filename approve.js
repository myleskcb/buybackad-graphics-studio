'use strict';
/* ═══════════════════════════════════════════════════════
   THE APPROVAL PAGE (approve.html).

   Owner, 2026-11-11: "make sure we have an approval page for the commercial
   worthy ads and hero worthy". Every ad the site offers (the live cards of
   assets/showcase/index.json, the predicate app.js calls scIsLive) with three
   marks: Commercial (worth running as an ad), Hero (worth the shop window on
   the landing page) and No. Commercial and Hero are separate marks, a card
   may carry both; No clears them.

   Where the marks live:
     this browser      localStorage, written on every tap
     the server        /api/admin/approvals, for a signed-in operator, so the
                       phone and the Mac show the same marks (newest wins)
     the repository    Export lists writes assets/commercial-picks.json and
                       assets/hero-picks.json; the landing's wall reads the
                       second (app.js scLoadPicks). A first visit starts from
                       those two files.
   ═══════════════════════════════════════════════════════ */
(() => {
  const KEY = 'gfx-approvals-v1';
  const PAGE = 60;
  const $ = id => document.getElementById(id);
  const acct = window.pgfxAccount || null;

  const LAY = { checklistHero:'CHK', reviewProof:'REV', trustSeal:'TRS', stepsFlow:'STP', bubblePop:'BUB',
    voltStack:'VLT', neonNight:'NEO', slabPoster:'SLB', scriptRetro:'SCR', lowerThird:'LOW',
    gradientWave:'GRD', ticketStub:'TKT', hudTech:'HUD', bandKnockout:'BND', arcCrown:'ARC', glassCard:'GLS' };
  const sku = c => { const p = String(c.id).split('-'); return (LAY[c.layout] || String(c.layout).slice(0, 3).toUpperCase()) + '-' + (p[1] || '').toUpperCase() + '-' + (p[2] || '0'); };
  const isLive = c => !!c && !c.defect && c.imagery !== 'none' && !(typeof c.chroma === 'number' && c.chroma < 0.05);
  /* the hero picker's order: colour, the owner's affinity, density, a product */
  const score = c => (c.chroma || 0) * 2.2 + (c.affinity || 0) * 0.25 + (c.density || 0) / 90 + (c.imagery === 'product' ? 0.5 : 0);
  const CAT_NAMES = { phones:'Phones', gold:'Gold', silver:'Silver', cars:'Cars', strips:'Test strips', pokemon:'Pokémon', sports:'Sports cards', coins:'Coins', gaming:'Gaming', computers:'Computers' };

  let cards = [], byId = {}, bySku = {};
  let st = { commercial: [], hero: [], denied: [], ts: 0 };
  const view = { tab: 'todo', cat: 'all', q: '', list: [], shown: 0 };
  let canSync = false, pushTimer = 0;

  /* ---------- the marks ---------- */
  const has = (k, id) => st[k].indexOf(id) !== -1;
  const drop = (k, id) => { const i = st[k].indexOf(id); if (i !== -1) st[k].splice(i, 1); };
  const clean = s => {
    const ok = a => [...new Set((Array.isArray(a) ? a : []).map(k => {
      const c = byId[k] || bySku[String(k).trim().toUpperCase()];   // a SKU from an older list becomes the card's id
      return c ? c.id : null;
    }).filter(Boolean))];
    const out = { commercial: ok(s && s.commercial), hero: ok(s && s.hero), denied: ok(s && s.denied), ts: +(s && s.ts) || 0 };
    out.denied = out.denied.filter(id => out.commercial.indexOf(id) === -1 && out.hero.indexOf(id) === -1);
    return out;
  };
  const readLocal = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e){ return null; } };
  const writeLocal = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e){} };

  function mark(id, k){
    if (k === 'denied'){
      if (has('denied', id)) drop('denied', id);
      else { drop('commercial', id); drop('hero', id); st.denied.push(id); }
    } else {
      if (has(k, id)) drop(k, id);
      else { drop('denied', id); st[k].push(id); }
    }
    st.ts = Date.now();
    writeLocal();
    paintCard(id);
    if (k === 'hero') st.hero.forEach(paintCard);   // the order numbers move
    counts();
    push();
  }

  /* ---------- the server copy ---------- */
  const say = (t, bad) => { const el = $('sync'); el.textContent = t || ''; el.classList.toggle('bad', !!bad); };
  function push(){
    if (!canSync) return;
    clearTimeout(pushTimer);
    say('Saving…');
    pushTimer = setTimeout(async () => {
      try { await acct.api('/admin/approvals', st, { method: 'PUT' }); say('Saved to your account'); }
      catch (e){ say('Not saved to your account (kept on this device): ' + e.message, true); }
    }, 700);
  }
  async function pull(){
    canSync = false;
    $('signin').hidden = true;
    if (!acct || acct.demo){ say('Saved on this device'); return; }
    const me = await acct.me();
    if (!me){ say('Saved on this device'); $('signin').hidden = false; return; }
    if (me.role !== 'admin'){ say('Saved on this device (this account is not an operator)'); return; }
    try {
      const remote = clean((await acct.api('/admin/approvals')).approvals);
      canSync = true;
      if (remote.ts > st.ts){ st = remote; writeLocal(); render(); say('Loaded from your account'); }
      else if (st.ts > remote.ts) push();
      else say('Saved to your account');
    } catch (e){ say('Saved on this device (the server did not answer: ' + e.message + ')', true); }
  }

  /* ---------- drawing ---------- */
  const TABS = [['todo', 'To review'], ['all', 'All'], ['commercial', 'Commercial worthy'], ['hero', 'Hero worthy'], ['denied', 'Denied']];
  const decided = id => has('commercial', id) || has('hero', id) || has('denied', id);
  const inTab = c => view.tab === 'all' ? true : view.tab === 'todo' ? !decided(c.id) : has(view.tab, c.id);

  function counts(){
    $('n-com').textContent = st.commercial.length;
    $('n-hero').textContent = st.hero.length;
    $('n-no').textContent = st.denied.length;
    $('n-todo').textContent = cards.filter(c => !decided(c.id)).length;
  }
  function paintCard(id){
    const el = document.querySelector('.ap-card[data-id="' + id + '"]');
    if (!el) return;
    const com = has('commercial', id), hero = has('hero', id), no = has('denied', id);
    el.classList.toggle('com', com && !hero);
    el.classList.toggle('hero', hero);
    el.classList.toggle('no', no);
    el.querySelector('.m-com').setAttribute('aria-pressed', com);
    el.querySelector('.m-hero').setAttribute('aria-pressed', hero);
    el.querySelector('.m-no').setAttribute('aria-pressed', no);
    const ord = el.querySelector('.ap-ord');
    ord.hidden = !hero;
    ord.textContent = hero ? st.hero.indexOf(id) + 1 : '';
  }
  function cardEl(c){
    const el = document.createElement('article');
    el.className = 'ap-card'; el.dataset.id = c.id; el.tabIndex = 0;
    el.setAttribute('aria-label', c.sku + ', ' + c.name);
    const img = document.createElement('img');
    img.loading = 'lazy'; img.decoding = 'async'; img.width = 448; img.height = 448;
    img.src = c.thumb; img.alt = c.name;
    const s = document.createElement('span'); s.className = 'ap-sku'; s.textContent = c.sku;
    const o = document.createElement('span'); o.className = 'ap-ord'; o.hidden = true; o.title = 'Place in the hero';
    const m = document.createElement('div'); m.className = 'ap-meta';
    const b = document.createElement('b'); b.textContent = c.name;
    const t = document.createElement('span'); t.textContent = (CAT_NAMES[c.cat] || c.cat) + ' · ' + (c.imagery === 'product' ? 'product' : 'photo');
    m.append(b, t);
    const marks = document.createElement('div'); marks.className = 'ap-marks';
    [['m-com', 'commercial', 'Commercial'], ['m-hero', 'hero', 'Hero'], ['m-no', 'denied', 'No']].forEach(([cls, k, label]) => {
      const bt = document.createElement('button');
      bt.type = 'button'; bt.className = cls; bt.dataset.k = k; bt.textContent = label;
      bt.setAttribute('aria-pressed', 'false');
      marks.append(bt);
    });
    el.append(img, s, o, m, marks);
    return el;
  }
  function more(){
    const grid = $('grid');
    const next = view.list.slice(view.shown, view.shown + PAGE);
    next.forEach(c => grid.append(cardEl(c)));
    next.forEach(c => paintCard(c.id));
    view.shown += next.length;
    $('more').hidden = view.shown >= view.list.length;
    $('count').textContent = view.list.length
      ? 'Showing ' + view.shown + ' of ' + view.list.length + (view.list.length === 1 ? ' ad' : ' ads')
      : '';
  }
  /* The list is worked out when the tab, the category or the search changes,
     not on every tap: a card just marked stays where it is under the finger. */
  function render(){
    const q = view.q.trim().toLowerCase();
    view.list = cards.filter(c => inTab(c) && (view.cat === 'all' || c.cat === view.cat) && (!q || c.hay.indexOf(q) !== -1));
    if (view.tab === 'hero') view.list.sort((a, b) => st.hero.indexOf(a.id) - st.hero.indexOf(b.id));
    view.shown = 0;
    const grid = $('grid');
    grid.textContent = '';
    if (!view.list.length){
      const e = document.createElement('p'); e.className = 'ap-empty';
      e.textContent = view.tab === 'todo' && !q && view.cat === 'all' ? 'Every ad has a mark. Nothing left to review.' : 'No ads here.';
      grid.append(e);
    }
    more();
    counts();
    document.querySelectorAll('#tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === view.tab));
    document.querySelectorAll('#chips button').forEach(b => b.classList.toggle('on', b.dataset.cat === view.cat));
  }

  /* ---------- the lists, as the repository keeps them ---------- */
  const today = () => new Date().toISOString().slice(0, 10);
  const files = () => ({
    com: JSON.stringify({
      note: 'Ads the owner marked commercial worthy on the approval page (approve.html): good enough to run as an ad. Card ids from assets/showcase/index.json.',
      updated: today(), picks: st.commercial,
    }, null, 2) + '\n',
    hero: JSON.stringify({
      note: 'Hand-picked hero cards, marked hero worthy on the approval page (approve.html). Entries may be a SKU (CHK-JW07-16) or a card id (checklistHero-jw07-16). Order is the order they appear. An empty list means the wall picks for itself: measured colourfulness, one palette per card, a product in every one.',
      updated: today(), picks: st.hero,
    }, null, 2) + '\n',
  });
  function download(name, text){
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    a.download = name; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  /* ---------- wiring ---------- */
  function wire(){
    const tabs = $('tabs');
    TABS.forEach(([id, label]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.tab = id; b.textContent = label;
      tabs.append(b);
    });
    tabs.addEventListener('click', e => { const b = e.target.closest('button'); if (b){ view.tab = b.dataset.tab; render(); } });

    const chips = $('chips');
    const cats = [...new Set(cards.map(c => c.cat))];
    [['all', 'All categories']].concat(cats.map(c => [c, CAT_NAMES[c] || c])).forEach(([id, label]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.dataset.cat = id; b.textContent = label;
      chips.append(b);
    });
    chips.addEventListener('click', e => { const b = e.target.closest('button'); if (b){ view.cat = b.dataset.cat; render(); } });

    let qt = 0;
    $('q').addEventListener('input', e => { clearTimeout(qt); qt = setTimeout(() => { view.q = e.target.value; render(); }, 150); });

    $('grid').addEventListener('click', e => {
      const b = e.target.closest('.ap-marks button');
      if (b) mark(b.closest('.ap-card').dataset.id, b.dataset.k);
    });
    $('grid').addEventListener('keydown', e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const card = e.target.closest('.ap-card');
      const k = { c: 'commercial', h: 'hero', x: 'denied' }[e.key.toLowerCase()];
      if (card && k){ e.preventDefault(); mark(card.dataset.id, k); }
    });
    $('more').addEventListener('click', more);

    const out = $('out');
    $('export').addEventListener('click', () => {
      const f = files();
      $('txt').value = 'COMMERCIAL WORTHY (' + st.commercial.length + ') — assets/commercial-picks.json\n' + f.com
        + '\nHERO WORTHY (' + st.hero.length + ') — assets/hero-picks.json\n' + f.hero
        + '\nDENIED (' + st.denied.length + ')\n' + st.denied.join(' ') + '\n';
      out.showModal();
    });
    $('close').addEventListener('click', () => out.close());
    $('dl-com').addEventListener('click', () => download('commercial-picks.json', files().com));
    $('dl-hero').addEventListener('click', () => download('hero-picks.json', files().hero));
    $('copy').addEventListener('click', async () => {
      const t = $('txt'); t.select();
      try { await navigator.clipboard.writeText(t.value); $('copy').textContent = 'Copied'; }
      catch (e){ $('copy').textContent = 'Select all, then copy'; }
      setTimeout(() => { $('copy').textContent = 'Copy'; }, 1800);
    });

    $('signin').addEventListener('click', () => acct && acct.openAuth({ mode: 'in', message: 'Sign in as the owner and your marks follow you to every device.' }));
    if (acct) acct.onChange(() => { pull(); });
  }

  async function boot(){
    const get = u => fetch(u, { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).catch(() => null);
    const [idx, heroFile, comFile] = await Promise.all([get('assets/showcase/index.json'), get('assets/hero-picks.json'), get('assets/commercial-picks.json')]);
    if (!Array.isArray(idx)){ $('grid').innerHTML = '<p class="ap-empty">The ads did not load. Refresh the page.</p>'; return; }
    cards = idx.filter(isLive).sort((a, b) => score(b) - score(a)).map(c => {
      const s = sku(c);
      return { id: c.id, sku: s, name: c.name || c.id, cat: c.cat || 'other', layout: c.layout, imagery: c.imagery, thumb: c.thumb || ('assets/showcase/' + c.id + '.webp'),
        hay: [c.id, s, c.name, c.theme, c.family, c.cat, c.subject, c.layout].join(' ').toLowerCase() };
    });
    cards.forEach(c => { byId[c.id] = c; if (!bySku[c.sku]) bySku[c.sku] = c; });
    /* this browser's marks, or on a first visit what the repository holds (ts 0, so a server copy wins) */
    st = clean(readLocal() || { commercial: comFile && comFile.picks, hero: heroFile && heroFile.picks, denied: [], ts: 0 });
    wire();
    render();
    pull();
  }
  boot();
})();
