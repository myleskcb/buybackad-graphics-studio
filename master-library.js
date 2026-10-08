'use strict';
/* ═══════════════════════════════════════════════════════
   The master library page (master-library.html).

   Owner, 2026-10-05: "make sure we finish all our design prompts and graphic
   changes ... so we have the latest final versions.. allow us to see in the
   library / master library", and "when we save the ads on the site we can
   make a public library for iphones LA to access".

   Two sections:
   - Saved ads. With ?feed=<link id> it is that library's public page (what
     iPhones LA is given): its ads, which are set to auto-post, and the feed
     addresses a poster reads. Without one it is the signed-in account's own
     library (/api/ads/mine, the session token the studio keeps).
   - Finished designs: every card the studio offers, read from this deploy
     (assets/showcase/index.json and the full-size renders in
     assets/library-ads/), by the site's own test for an offered card
     (scIsLive in app.js, the same as netlify/lib/library.mjs). Whatever the
     latest build re-drew is what shows: nothing here is a copy. Each carries
     a ★ (owner, 2026-10-06: "every ad has an option to add to library"):
     the full-size render, as shown, goes to the account's library through
     ad-library.js; signed out, the account dialog comes first.
   A saved video ad plays here, with its clip to download beside its photo.
   ═══════════════════════════════════════════════════════ */
(() => {
  const API = String(window.PGFX_API || '').replace(/\/$/, '');
  const FEED_RE = /^fd_[A-Za-z0-9_-]{24}$/;
  const PAGE = 60;
  const CAT_NAME = { phones: 'Phones', gold: 'Gold', silver: 'Silver', coins: 'Coins', cars: 'Cars', strips: 'Test strips',
    pokemon: 'Pokémon', sports: 'Sports cards', gaming: 'Gaming', audio: 'Audio', computers: 'Computers', wearables: 'Wearables',
    cameras: 'Cameras', offer: 'Offers', classics: 'Classics' };
  const REPOST = { 0: 'once', 1: 'every day', 7: 'every week', 14: 'every 2 weeks', 30: 'every 30 days' };
  const $ = id => document.getElementById(id);
  const words = s => String(s || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const live = c => !!c && !c.defect && c.imagery !== 'none' && !(typeof c.chroma === 'number' && c.chroma < 0.05);
  const catName = c => CAT_NAME[c] || (c ? c.charAt(0).toUpperCase() + c.slice(1) : 'Other');
  const slug = s => String(s || 'ad').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ad';

  function el(tag, cls, txt){
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  function link(href, label, opts){
    const a = el('a', '', label);
    a.href = href;
    if (opts && opts.download) a.download = opts.download;
    if (opts && opts.blank){ a.target = '_blank'; a.rel = 'noopener'; }
    return a;
  }
  const when = isoStr => {
    const ms = Date.parse(isoStr) - Date.now();
    if (!isFinite(ms)) return '';
    const d = Math.round(Math.abs(ms) / 86400000), h = Math.round(Math.abs(ms) / 3600000);
    const span = d >= 1 ? d + (d === 1 ? ' day' : ' days') : h >= 1 ? h + (h === 1 ? ' hour' : ' hours') : 'a moment';
    return ms >= 0 ? 'in ' + span : span + ' ago';
  };

  /* ---------- a filterable grid ---------- */
  function section(key, items, card, opts){
    const grid = $('grid-' + key), chips = $('chips-' + key), q = $('q-' + key), count = $('count-' + key), more = $('more-' + key);
    let cat = '', shown = PAGE;
    const tally = {};
    items.forEach(x => { const c = x.category || 'other'; tally[c] = (tally[c] || 0) + 1; });
    chips.textContent = '';
    const cats = Object.keys(tally).sort((a, b) => tally[b] - tally[a]);
    if (cats.length > 1){
      const mk = (c, label) => {
        const b = el('button', c === cat ? 'on' : '', label);
        b.type = 'button';
        b.setAttribute('aria-pressed', c === cat ? 'true' : 'false');
        b.onclick = () => { cat = c; shown = PAGE; paint(); };
        return b;
      };
      chips._mk = mk;
    }
    function paint(){
      const t = words(q.value);
      const list = items.filter(x => (!cat || (x.category || 'other') === cat) && t.every(w => x._s.some(s => s.startsWith(w))));
      chips.textContent = '';
      if (chips._mk){
        chips.appendChild(chips._mk('', 'All ' + items.length));
        cats.forEach(c => chips.appendChild(chips._mk(c, catName(c) + ' ' + tally[c])));
      }
      count.textContent = list.length === items.length ? (opts.countLine(items.length)) : list.length + ' of ' + items.length + ' shown';
      grid.textContent = '';
      const lim = opts.paged ? shown : list.length;
      list.slice(0, lim).forEach(x => grid.appendChild(card(x)));
      if (!list.length) grid.appendChild(el('div', 'ml-empty', 'Nothing matches. Clear the search or pick another category.'));
      if (more){
        more.hidden = !(opts.paged && list.length > lim);
        more.onclick = () => { shown += PAGE; paint(); };
      }
    }
    q.oninput = () => { shown = PAGE; paint(); };
    paint();
  }

  /* ---------- saved ads ---------- */
  function savedCard(it){
    const c = el('div', 'ml-card');
    if (it.video){
      /* the clip plays in place, its photo as the poster; nothing loads until it is pressed */
      const box = el('div', 'ml-img');
      const v = el('video'); v.controls = true; v.preload = 'none'; v.playsInline = true; v.poster = it.image.url; v.width = 400; v.height = 400;
      v.setAttribute('aria-label', it.title + ', video');
      const src = el('source'); src.src = it.video.url; src.type = it.video.format === 'webm' ? 'video/webm' : 'video/mp4';
      v.appendChild(src);
      box.appendChild(v);
      box.appendChild(el('span', 'ml-kind', '🎬 VIDEO' + (it.video.seconds ? ' · ' + it.video.seconds + ' s' : '')));
      c.appendChild(box);
    } else {
      const a = link(it.image.url, '', { blank: true });
      a.className = 'ml-img';
      a.setAttribute('aria-label', 'Open ' + it.title + ' at full size');
      const im = el('img'); im.src = it.image.url; im.alt = it.title; im.loading = 'lazy'; im.width = 400; im.height = 400;
      a.appendChild(im);
      c.appendChild(a);
    }
    c.appendChild(el('b', '', it.title));
    c.appendChild(el('span', 'ml-meta', [catName(it.category), it.image.width + ' × ' + it.image.height, it.video ? it.video.format.toUpperCase() + ' ' + it.video.width + ' × ' + it.video.height : '', 'saved ' + when(it.created)].filter(Boolean).join(' · ')));
    if (it.hold) c.appendChild(el('span', 'ml-held', it.hold === 'unchecked' ? 'Not auto-posted: not checked for a website' : 'Not auto-posted: it shows ' + it.hold));
    else if (it.post) c.appendChild(el('span', 'ml-post', 'Auto-post: due ' + when(it.post.due_at) + (it.post.next_at ? ', again ' + when(it.post.next_at) + ' (' + (REPOST[it.repost_days] || 'every ' + it.repost_days + ' days') + ')' : ', once')));
    else c.appendChild(el('span', 'ml-meta', 'Not set to auto-post'));
    const acts = el('div', 'ml-acts');
    acts.appendChild(link(it.image.url, it.video ? 'Photo' : 'Download', { download: slug(it.title) + '.jpg' }));
    if (it.video) acts.appendChild(link(it.video.url, 'Video', { download: slug(it.title) + '.' + it.video.format }));
    c.appendChild(acts);
    return c;
  }
  function feedBox(lib, isOwner){
    const box = $('ml-feed');
    box.hidden = false;
    box.textContent = '';
    box.appendChild(el('b', '', isOwner ? 'Your public link' : 'For auto-post'));
    const p1 = el('p', '', isOwner
      ? 'Give this page to iPhones LA. Anyone with it sees these ads and nothing else. Reset it in the studio (📚 Library) to stop the old one.'
      : 'Ads set to auto-post are listed when they are due, and listed again each time they come due. A poster reads one of these:');
    box.appendChild(p1);
    const rows = isOwner ? [['This page', lib.links.page], ['JSON feed', lib.links.json], ['RSS', lib.links.rss]] : [['JSON feed', lib.links.json], ['RSS', lib.links.rss]];
    rows.forEach(([label, url]) => {
      const p = el('p');
      p.appendChild(el('span', '', label + ': '));
      const code = el('code', '', url);
      p.appendChild(code);
      box.appendChild(p);
    });
  }
  const searchable = it => Object.assign({}, it, { _s: words([it.title, it.category, it.caption, it.video ? 'video' : 'photo', (it.texts || []).map(t => t.text).join(' ')].join(' ')) });
  let feed = '';

  async function loadSaved(feed){
    const grid = $('grid-saved');
    const say = (msg, linkTo) => {
      grid.textContent = '';
      const d = el('div', 'ml-empty', msg + ' ');
      if (linkTo) d.appendChild(link(linkTo[0], linkTo[1]));
      grid.appendChild(d);
    };
    if (!API){ say('Saved ads live on the hosted site; this copy has no server.'); return null; }
    let res, lib;
    try {
      if (feed){
        res = await fetch(API + '/ads/feed/' + feed, { headers: { Accept: 'application/json' } });
      } else {
        let token = null;
        try { token = JSON.parse(localStorage.getItem('pgfx_token') || 'null'); } catch (e){}
        if (!token || String(token).startsWith('demo:')){ say('Sign in to the studio to see the ads you saved.', ['index.html', 'Open the studio']); return null; }
        res = await fetch(API + '/ads/mine', { headers: { Accept: 'application/json', Authorization: 'Bearer ' + token } });
      }
      lib = await res.json().catch(() => ({}));
    } catch (e){ say('The library did not answer. Check the connection and reload.'); return null; }
    if (!res.ok){
      if (res.status === 401) say('Sign in to the studio to see the ads you saved.', ['index.html', 'Open the studio']);
      else if (res.status === 404 && feed) say('This library link was reset or never existed. Ask for the new link.');
      else say((lib && lib.error) || 'The library did not load (' + res.status + ').');
      return null;
    }
    if (feed){
      document.title = (lib.name || 'Ad library') + ' | Graphics Studio by BUYBACK.AD';
      $('ml-title').textContent = lib.name || 'Ad library';
      $('ml-crumb').textContent = lib.name || 'Ad library';
      $('ml-lead').textContent = 'WE BUY ads saved in Graphics Studio, at full size. Each one downloads as a JPEG ready to post.';
    }
    feedBox(lib, !feed);
    if (!lib.items.length){ say(feed ? 'This library has no ads yet.' : 'Nothing saved yet. Download an ad in the studio and press "Save to library".', feed ? null : ['index.html', 'Open the studio']); return lib; }
    section('saved', lib.items.map(searchable), savedCard, {
      countLine: n => n + (n === 1 ? ' ad' : ' ads') + ', ' + lib.items.filter(x => x.post).length + ' set to auto-post',
    });
    return lib;
  }

  /* ---------- finished designs ---------- */
  /* the design's full-size render, as shown, into the account's library; the
     words on it read from its record, a website on it holds it from auto-post
     (the same rule the studio keeps) */
  async function saveFinished(x){
    const lib = window.adLibrary;
    if (!lib) throw new Error('the library did not load; reload the page');
    if (!x.render) throw new Error('this design has no full-size render yet');
    const full = 'assets/library-ads/' + x.id + '.jpg?v=' + x.render.slice(0, 12);
    const r = await fetch(full);
    if (!r.ok) throw new Error('the render could not be fetched (' + r.status + ')');
    const blob = await r.blob();
    const data = await new Promise((res, rej) => { const f = new FileReader(); f.onload = () => res(String(f.result)); f.onerror = () => rej(new Error('the render could not be read')); f.readAsDataURL(blob); });
    const meta = { title: x.title, category: x.category, template: 'sc-' + x.id, texts: [], products: [], source: 'master', hold: '' };
    try {
      const rec = await fetch('assets/showcase/tpl/' + x.id + '.json').then(q => q.ok ? q.json() : null);
      const layers = (rec && rec.tpl && rec.tpl.layers) || [];
      layers.forEach(l => {
        if (!l || !l.text || l.role === 'phone') return;
        if (l.role === 'website' || l.role === 'qr') return;
        if ((l.kind === 'text' || l.kind === 'textbox') && meta.texts.length < 24 && !/\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/.test(l.text)) meta.texts.push({ role: l.role || 'text', text: String(l.text).replace(/\s+/g, ' ').trim().slice(0, 200) });
        if (l.kind === 'cutout' && l.props && l.props.src){ const m = /([a-z0-9][a-z0-9-]{0,79})\.(?:webp|png|jpe?g)/i.exec(String(l.props.src)); if (m && meta.products.length < 24) meta.products.push(m[1].toLowerCase()); }
      });
      if (layers.some(l => l && l.role === 'website' && l.text)) meta.hold = 'a website';
      else if (layers.some(l => l && l.role === 'qr')) meta.hold = 'a QR code';
    } catch (e){ /* the words stay empty: the title carries the ad */ }
    return lib.save({ name: x.id + '.jpg', data, meta });
  }
  function finishedCard(x){
    const c = el('div', 'ml-card');
    const full = x.render ? 'assets/library-ads/' + x.id + '.jpg?v=' + x.render.slice(0, 12) : x.thumb;
    const a = link(full, '', { blank: true });
    a.className = 'ml-img';
    a.setAttribute('aria-label', 'Open ' + x.title + ' at full size');
    const im = el('img'); im.src = x.thumb; im.alt = x.title; im.loading = 'lazy'; im.width = 448; im.height = 448;
    a.appendChild(im);
    if (window.adLibrary && x.render && !feed) a.appendChild(window.adLibrary.star('sc-' + x.id, { name: x.title, save: () => saveFinished(x) }));
    c.appendChild(a);
    c.appendChild(el('b', '', x.title));
    c.appendChild(el('span', 'ml-meta', catName(x.category) + (x.subject ? ' · ' + x.subject : '')));
    const acts = el('div', 'ml-acts');
    acts.appendChild(link('index.html?card=' + encodeURIComponent(x.id), 'Open in studio'));
    if (x.render) acts.appendChild(link(full, 'Download', { download: x.id + '.jpg' }));
    c.appendChild(acts);
    return c;
  }
  let finishedLoaded = false;
  async function loadFinished(){
    if (finishedLoaded) return;
    finishedLoaded = true;
    const grid = $('grid-finished');
    let cards = [], renders = {}, built = '';
    try {
      const [a, b] = await Promise.all([
        fetch('assets/showcase/index.json').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }),
        fetch('assets/library-ads/index.json').then(r => r.ok ? r.json() : null).catch(() => null),
      ]);
      cards = Array.isArray(a) ? a : [];
      renders = (b && b.items) || {};
      built = (b && b.built) || '';
    } catch (e){
      finishedLoaded = false;
      grid.textContent = '';
      grid.appendChild(el('div', 'ml-empty', 'The designs did not load. Reload the page.'));
      return;
    }
    const items = cards.filter(c => live(c) && c.thumb).map(c => ({
      id: c.id, title: c.name || c.id, category: c.cat || 'other', subject: c.subject || '',
      thumb: c.thumb, render: renders[c.id] ? renders[c.id].sha1 : '',
      _s: words([c.id, c.name, c.cat, c.theme, c.layout, c.subject, c.family].join(' ')),
    }));
    const full = items.filter(x => x.render).length;
    section('finished', items, finishedCard, {
      paged: true,
      countLine: n => n + ' designs offered, ' + full + ' at full size' + (built ? ' (drawn ' + new Date(built).toLocaleDateString() + ')' : ''),
    });
  }

  /* ---------- tabs ---------- */
  function show(which){
    ['saved', 'finished'].forEach(k => {
      const on = k === which;
      $('tab-' + k).setAttribute('aria-selected', on ? 'true' : 'false');
      $('sec-' + k).hidden = !on;
    });
    if (which === 'finished') loadFinished();
    try { history.replaceState(null, '', location.pathname + location.search + (which === 'finished' ? '#finished' : '')); } catch (e){}
  }
  $('tab-saved').onclick = () => show('saved');
  $('tab-finished').onclick = () => show('finished');
  document.querySelector('.ml-tabs').addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const next = $('tab-saved').getAttribute('aria-selected') === 'true' ? 'finished' : 'saved';
    show(next); $('tab-' + next).focus();
  });

  try { feed = new URLSearchParams(location.search).get('feed') || ''; } catch (e){}
  let badLink = false;
  if (feed && !FEED_RE.test(feed)){ feed = ''; badLink = true; }
  if (feed || badLink) document.querySelector('.ml-tabs').hidden = true;   // a shared link shows that library, nothing of the owner's
  if (badLink){
    $('ml-title').textContent = 'Ad library';
    $('grid-saved').appendChild(el('div', 'ml-empty', 'This is not a library link. Ask for the link again: it is copied from the studio’s 📚 Library.'));
  } else loadSaved(feed);
  if (!feed && location.hash === '#finished') show('finished');
  window.masterLibrary = { show };
})();
