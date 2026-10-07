'use strict';
/* ═══════════════════════════════════════════════════════
   Ad library. One additive file, loaded after app.js, iphonesla-link.js and
   account.js; the video maker (/motion) and the master library load it too,
   without app.js.

   Owner, 2026-10-05: "when we save the ads on the site we can make a public
   library for iphones LA to access and auto post the we buy ads and auto
   repost them too". 2026-10-06: "make sure every ad has an option to add to
   library", "video ads photo ads all need a star button which will send to
   library", "allow account creation so I can download content, upload to
   library properly".

   An ad is saved to the account's ad library (netlify/lib/adlibrary.mjs):
   the picture as it downloads, as a JPEG, with the words on it and the
   category, for the poster to write the listing from; a video ad brings its
   clip beside the photo. The library has one public link; whoever holds it
   (iPhones LA) reads the ads and which of them are due to post, and posts
   them again on the schedule set here. Nothing on this side posts anywhere.

   Three ways in, all the same save:
   - the ★ on every ad: the landing's gallery, Easy Mode's strip, the
     picker, the designer's Templates panel, the master library's finished
     designs, the video maker's looks. A design card is drawn as it would
     download, with the brand kit's number and website, through the same
     gate, size and watermark, and counted as a download.
   - ⭐ Save to library and ⭐🎬 Save as video under the Easy Mode preview
     and in the designer's export: the ad as made, its words and photo.
   - after a download (a picture or a video): the "save it" card, or every
     download once "Save every download here" is ticked.
   - ⬆ Upload in the Library dialog: a photo or a video ad from this device
     (made anywhere), as it is. A video's photo is its best frame, read out
     of the file (VideoStill.frames); on a page without the frame reader,
     the photo goes first and Add video puts the clip onto it.

   Rules this file keeps:
   - Nothing in app.js is edited for the library. The hooks are wraps around
     the functions every download ends in (addHistory, deliverVideo) and the
     functions that build a card (scCard, buildEzStrip and the rest): the
     original runs first and nothing here throws into it.
   - What is saved is what would download: the gated picture (size,
     watermark), never a fresh ungated render.
   - A picture that shows a website, a QR code, a street address or a social
     handle, or carries the watermark, is saved but held from auto-post: the
     iPhones LA link's own check (iplaLink.refusal), so the two cannot differ.
   - This source is public. It holds no secret; the library link it shows is
     the account's, read from the server after sign-in.
   - The link reaches iPhones LA by itself: when this browser is connected to
     the shop (opened once from its Auto-post page), the link is sent over
     that connection (iplaLink.shareLibrary), again after a reset or a new
     connection. Nobody has to copy it across.
   ═══════════════════════════════════════════════════════ */
(() => {
  const AUTO_KEY = 'pgfx_adlib_auto';          // localStorage: save every download
  const ASK_MS = 12000;                        // how long the "save it" card stays
  const MAX_SIDE = 2160;                       // what Pro downloads at most
  const MAX_CHARS = 5500000;                   // a base64 JPEG under the server's 4.2 MB
  const REPOST_LABEL = { 0: 'Once', 1: 'Every day', 2: 'Every 2 days', 3: 'Every 3 days', 5: 'Every 5 days', 7: 'Every week', 14: 'Every 2 weeks', 30: 'Every 30 days' };
  const $ = id => document.getElementById(id);

  // ---------- the studio and the account, read carefully: app.js may not be on this page ----------
  const acct = () => window.pgfxAccount || null;
  const state = { lib: null, loading: false, error: '', last: null, queue: [], busy: false, askTimer: null, saved: {}, me: null, capture: null, painting: false };
  const app = {
    here(){ try { return typeof showEasy === 'function' && typeof TEMPLATES !== 'undefined'; } catch (e){ return false; } },
    demo(){ try { return DEMO; } catch (e){ return acct() ? acct().demo : true; } },
    account(){ try { return account; } catch (e){ return state.me; } },
    // the studio loads the account when Easy Mode first opens: a dialog
    // opened before that would say "sign in" to someone who is signed in
    async ensure(){
      try { if (typeof loadAccount === 'function'){ if (!account && getToken()) await loadAccount(); return account; } } catch (e){}
      try { if (acct()) state.me = await acct().me(); } catch (e){}
      return state.me;
    },
    async call(path, body, opts){ if (acct()) return acct().api(path, body, opts); return api(path, body); },
    toast(msg, kind){
      try { if (typeof toast === 'function') return toast(msg, kind); } catch (e){}
      try { if (window.VideoHelp && VideoHelp.toast) return VideoHelp.toast(msg); } catch (e){}
      console.log('ad library: ' + msg);
    },
    auth(msg, mode, next){
      if (acct()) return acct().openAuth({ message: msg, mode, next });
      try { openAuth(msg, next); if (mode) setAuthMode(mode); } catch (e){}
    },
    admin(){ try { return typeof isAdmin === 'function' && isAdmin(); } catch (e){ return false; } },
    async history(){ try { return await histList(); } catch (e){ return []; } },
    template(id){ try { return TEMPLATES.find(t => t && t.id === id) || null; } catch (e){ return null; } },
  };
  const box = (() => { try { const s = window.localStorage, k = '__adlib_t'; s.setItem(k, '1'); s.removeItem(k); return s; } catch (e){ return null; } })();
  const autoOn = () => { try { return box && box.getItem(AUTO_KEY) === '1'; } catch (e){ return false; } };
  const setAuto = v => { try { if (box) v ? box.setItem(AUTO_KEY, '1') : box.removeItem(AUTO_KEY); } catch (e){} };

  // ---------- what a download is ----------
  function hold(proj){
    try {
      const why = window.iplaLink && typeof window.iplaLink.refusal === 'function' ? window.iplaLink.refusal(proj) : '';
      if (!why) return '';
      if (/watermark/i.test(why)) return 'the watermark';
      const m = /shows (a [a-z ]+?)\./i.exec(why);
      if (m) return m[1];
      return 'unchecked';
    } catch (e){ return ''; }
  }
  function describe(name, proj){
    let g = null;
    try { g = window.iplaLink && window.iplaLink.graphicFor ? window.iplaLink.graphicFor(proj) : null; } catch (e){}
    const tplId = proj && (proj.tplId || (proj.st && proj.st.tpl)) || '';
    const tpl = app.template(tplId);
    const texts = (g && g.texts) || [];
    const head = texts.find(t => t.role === 'headline') || texts[0];
    const title = String((head && head.text) || (tpl && tpl.name) || (proj && proj.name) || name || 'Ad').slice(0, 80);
    return {
      title,
      category: (g && g.category) || (tpl && tpl.cat) || '',
      template: String(tplId || '').slice(0, 120),
      texts, products: (g && g.products) || [],
      hold: hold(proj),
      source: 'studio',
    };
  }
  function jpeg(dataUrl){
    return new Promise(res => {
      const im = new Image();
      im.onload = () => {
        const draw = (side, q) => {
          const s = Math.min(1, side / Math.max(im.naturalWidth, im.naturalHeight));
          const cv = document.createElement('canvas');
          cv.width = Math.round(im.naturalWidth * s); cv.height = Math.round(im.naturalHeight * s);
          const cx = cv.getContext('2d');
          cx.fillStyle = '#ffffff'; cx.fillRect(0, 0, cv.width, cv.height);   // a transparent corner goes white, not black
          cx.drawImage(im, 0, 0, cv.width, cv.height);
          return cv.toDataURL('image/jpeg', q);
        };
        let out = draw(MAX_SIDE, 0.9);
        if (out.length > MAX_CHARS) out = draw(MAX_SIDE, 0.8);
        if (out.length > MAX_CHARS) out = draw(1600, 0.85);
        res(out.length > MAX_CHARS ? null : out);
      };
      im.onerror = () => res(null);
      im.src = dataUrl;
    });
  }
  const blobToDataUrl = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(new Error('the picture could not be read')); r.readAsDataURL(blob); });
  const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  async function retry(fn, tries, delay){
    let last;
    for (let i = 0; i < (tries || 3); i++){
      try { return await fn(i); } catch (e){ last = e; if (e && (e.status === 401 || e.status === 404 || e.status === 400 || e.status === 409 || e.status === 413)) throw e; }
      await new Promise(r => setTimeout(r, (delay || 900) * (i + 1)));
    }
    throw last;
  }
  /* a video's frame size, read off the file itself (the site's CSP keeps a
     <video> from playing a blob): an MP4's tkhd box (16.16 fixed point, the
     first track with a width is the picture), a WebM's PixelWidth and
     PixelHeight (B0, BA) in its first kilobytes */
  function videoDims(buf){
    const b = new Uint8Array(buf);
    const u32 = i => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
    try {
      if (b.length > 12 && b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70){
        for (let i = 0; i + 100 < b.length; i++){
          if (b[i] !== 0x74 || b[i + 1] !== 0x6b || b[i + 2] !== 0x68 || b[i + 3] !== 0x64) continue;   // 'tkhd'
          const at = i + 4, v1 = b[at] === 1;
          const w = u32(at + (v1 ? 88 : 76)) >>> 16, h = u32(at + (v1 ? 92 : 80)) >>> 16;
          if (w && h) return { w, h };
        }
      } else if (b.length > 4 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3){
        const vint = i => b[i] === 0x81 ? [1, b[i + 1]] : b[i] === 0x82 ? [2, (b[i + 1] << 8) | b[i + 2]] : null;
        const end = Math.min(b.length - 4, 65536);
        for (let i = 0; i < end; i++){
          if (b[i] !== 0xb0) continue;
          const w = vint(i + 1); if (!w || !w[1]) continue;
          for (let j = i + 2 + w[0]; j < Math.min(end, i + 24); j++){
            if (b[j] !== 0xba) continue;
            const h = vint(j + 1); if (h && h[1]) return { w: w[1], h: h[1] };
          }
        }
      }
    } catch (e){}
    return null;
  }

  const heldLine = h => h === 'unchecked'
    ? 'Not auto-posted: it could not be checked for a website.'
    : 'Not auto-posted: it shows ' + h + '.';

  // ---------- the server ----------
  function ready(){
    if (app.demo()) return 'The ad library keeps your ads on the server, so it works on the hosted site, not in demo mode.';
    if (!app.account()) return 'signin';
    return '';
  }
  /* signed in, or the account dialog (Create account first on a device that
     never signed in) and then `next`. false when nothing can be saved now. */
  async function signedIn(next, msg){
    await app.ensure();
    const why = ready();
    if (why === 'signin'){ app.auth(msg || 'Create a free account to save ads to your library, or sign in.', undefined, next); return false; }
    if (why){ app.toast(why, 'error'); return false; }
    return true;
  }
  /* the library is read at start (for the stars) and again when the dialog
     opens: a dialog that already shows it keeps its cards while the fresh
     copy comes, and is drawn again only when something changed */
  async function load(){
    await app.ensure();
    if (ready()) { state.lib = null; draw(); paint(); return null; }
    const had = !!state.lib;
    state.loading = true; state.error = '';
    if (!had) draw();
    let fresh = null;
    try { fresh = await app.call('/ads/mine'); }
    catch (e){ state.error = e.message || 'The library did not load'; }
    state.loading = false;
    /* what the dialog shows of a library: the version strings the server
       stamps are not compared (a save added here leaves them behind) */
    const key = l => l && JSON.stringify([l.name, l.repost_days, l.links, l.limit, l.count, l.items.map(i => [i.id, i.updated, i.autopost, i.repost_days, i.hold, i.image && i.image.url, i.video && i.video.url])]);
    const changed = !!fresh && key(fresh) !== key(state.lib);
    if (fresh) state.lib = fresh;
    if (!had || changed || state.error) draw();
    paint();
    if (state.lib) share(state.lib).then(redraw);
    return state.lib;
  }

  // ---------- the link, to iPhones LA by itself ----------
  // Sent once per link and connection; a shop that cannot take it yet (no such
  // route) is asked again a day later, a failed request on the next occasion.
  const SHARED_KEY = 'pgfx_adlib_shared';     // localStorage: {page, conn, at, verdict}
  const DAY_MS = 86400000;
  const link = () => { try { return window.iplaLink && window.iplaLink.state(); } catch (e){ return null; } };
  const connKey = () => { const l = link(); return l && l.connected ? String(l.connectedAt || 'yes') : ''; };
  const shared = () => { try { return JSON.parse((box && box.getItem(SHARED_KEY)) || 'null'); } catch (e){ return null; } };
  function sharedFor(page){
    const s = shared(), c = connKey();
    return s && c && s.page === page && s.conn === c ? s : null;
  }
  let sharing = null;
  /* resolves true when the dialog's share line changed (a verdict landed),
     so a redraw follows only then: a dialog drawn twice in a row swaps its
     pictures out under the reader */
  function share(lib){
    const page = lib && lib.links && lib.links.page;
    if (!page || !connKey() || !window.iplaLink || typeof window.iplaLink.shareLibrary !== 'function') return Promise.resolve(false);
    const s = sharedFor(page);
    if (s && (s.verdict === 'sent' || Date.now() - s.at < DAY_MS)) return Promise.resolve(false);
    if (sharing) return sharing;
    const conn = connKey();
    sharing = window.iplaLink.shareLibrary(page).then(v => {
      let changed = false;
      if (v === 'sent' || v === 'unsupported' || v === 'refused'){
        try { if (box) box.setItem(SHARED_KEY, JSON.stringify({ page, conn, at: Date.now(), verdict: v })); changed = true; } catch (e){}
      }
      if (v === 'sent') app.toast('Your library link went to iPhones LA. Its auto-post reads it from now on.', 'success');
      return changed;
    }, () => false).then(r => { sharing = null; return r; });
    return sharing;
  }
  const redraw = changed => { if (changed) draw(); };
  function shareLine(lib){
    if (!connKey()) return 'To send this link to iPhones LA by itself, open the studio once from iPhones LA → Auto-post. Or copy it across.';
    const s = sharedFor(lib.links.page);
    if (!s) return 'Sending this link to iPhones LA…';
    if (s.verdict === 'sent') return '✓ iPhones LA has this link: its auto-post reads it. A reset sends the new one by itself.';
    if (s.verdict === 'unsupported') return 'iPhones LA cannot take the link yet. It is sent by itself once it can (asked again each day), or copy it across.';
    return 'iPhones LA did not take the link. Copy it across instead.';
  }
  // once the studio has its account: a browser connected to the shop sends the
  // link even if nobody opens the Library
  (function watch(tries){
    if (tries === 60 && connKey()) app.ensure();       // the account, without waiting for Easy Mode
    if (!ready() && connKey()){
      const s = shared();
      if (!(s && s.conn === connKey() && s.verdict === 'sent')) load();
      return;
    }
    if (tries > 0) setTimeout(() => watch(tries - 1), 3000);
  })(60);
  /* an item the server just answered with, into the list this page holds */
  function took(item, duplicate){
    if (!state.lib) return;
    const at = state.lib.items.findIndex(x => x.id === item.id);
    if (at >= 0) state.lib.items[at] = item;
    else if (!duplicate){ state.lib.items.unshift(item); state.lib.count = state.lib.items.length; }
    draw(); paint();
  }
  /* rec: { name, data (a data URL), proj?, meta?: { title, category, template, texts, products, hold, source }, id? } */
  async function save(rec, quiet){
    if (!await signedIn(() => save(rec, quiet), 'Create a free account to save ads to your library, or sign in.')) return null;
    const image = await jpeg(rec.data);
    if (!image){ app.toast('This picture could not be saved: it is too large or could not be read', 'error'); return null; }
    const d = Object.assign(describe(rec.name, rec.proj), rec.meta || {});
    try {
      const repost = state.lib ? state.lib.repost_days : undefined;
      const r = await app.call('/ads/save', Object.assign({ image, repost_days: repost }, d));
      if (rec.id) state.saved[rec.id] = r.item.id;
      if (!state.lib) await load();                          // the first save makes the library: load() sends its link
      else { took(r.item, !!r.duplicate); if (connKey()) share(state.lib).then(redraw); }
      if (!quiet || r.duplicate || d.hold){
        app.toast(r.duplicate ? 'Already in your ad library'
          : d.hold ? 'Saved to your ad library. ' + heldLine(d.hold)
          : 'Saved to your ad library ⭐', r.duplicate ? '' : 'success');
      }
      return r.item;
    } catch (e){
      app.toast('Not saved to your ad library: ' + (e.message || 'try again'), 'error');
      return null;
    }
  }
  /* the clip onto a saved ad, in parts the server sizes; onProgress(0..1) */
  async function saveVideo(itemId, blob, meta, onProgress){
    const buf = await blob.arrayBuffer();
    const sha256 = hex(await crypto.subtle.digest('SHA-256', buf));
    const format = /webm/i.test(blob.type) ? 'webm' : 'mp4';
    const read = (!meta || !meta.w || !meta.h) ? videoDims(buf) : null;
    const w = (meta && meta.w) || (read && read.w) || (meta && meta.fallbackW) || 0, h = (meta && meta.h) || (read && read.h) || (meta && meta.fallbackH) || 0;
    const seconds = (meta && meta.seconds) || undefined;
    const b = await app.call('/ads/video/begin', { id: itemId, format, bytes: buf.byteLength, w, h, seconds, sha256 });
    for (let i = 0; i < b.count; i++){
      const part = buf.slice(i * b.part_bytes, Math.min(buf.byteLength, (i + 1) * b.part_bytes));
      await retry(() => app.call('/ads/video/part?id=' + encodeURIComponent(itemId) + '&n=' + i, undefined, { raw: part }), 3, 1200);
      if (onProgress) onProgress((i + 1) / (b.count + 1));
    }
    const r = await app.call('/ads/video/done', { id: itemId });
    if (onProgress) onProgress(1);
    took(r.item, false);
    return r.item;
  }
  /* a video ad: its photo is the ad saved, the clip rides on it.
     rec: { blob, name, photo: { blob, name }, proj?, meta?, video?: { w, h, seconds }, onProgress? } */
  async function saveVideoAd(rec, quiet){
    if (!rec || !rec.blob) return null;
    if (!rec.photo || !rec.photo.blob){ app.toast('This video has no photo to go with it, so it was not saved to the library', 'error'); return null; }
    if (!await signedIn(() => saveVideoAd(rec, quiet))) return null;
    let data;
    try { data = await blobToDataUrl(rec.photo.blob); } catch (e){ app.toast(e.message, 'error'); return null; }
    const item = await save({ name: rec.photo.name || rec.name, data, proj: rec.proj || null, meta: rec.meta || null }, true);
    if (!item) return null;
    try {
      const v = await saveVideo(item.id, rec.blob, rec.video || null, rec.onProgress);
      if (!quiet || (item.hold)) app.toast(item.hold ? 'Video ad saved to your library. ' + heldLine(item.hold) : 'Video ad saved to your library 🎬 ⭐', 'success');
      return v;
    } catch (e){
      app.toast('The photo was saved to your library, but the video was not: ' + (e.message || 'try again'), 'error');
      return item;
    }
  }
  /* a photo or a video ad from this device, as it is: no gate, no count (it
     was not made here), auto-post as every save; the owner sees the card
     and can untick it. A video needs its photo: the best frame, read out
     of the file where the frame reader is on the page. */
  const titleOf = name => String(name || 'Ad').replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').trim().slice(0, 80) || 'Ad';
  async function uploadFile(file, say){
    say = say || (() => {});
    const isVideo = /^video\//i.test(file.type) || /\.(mp4|webm|mov|m4v)$/i.test(file.name);
    if (!isVideo){
      if (!/^image\//i.test(file.type)) throw new Error(file.name + ' is not a picture or a video');
      say('Reading ' + file.name + '…');
      const data = await blobToDataUrl(file);
      return save({ name: file.name, data, meta: { title: titleOf(file.name), category: '', template: '', texts: [], products: [], source: 'upload', hold: '' } });
    }
    const VS = window.VideoStill;
    if (!VS || !VS.frames) throw new Error('This page cannot read a video\'s frames. Upload the photo first, then press Add video on it.');
    say('Choosing the photo for ' + file.name + '…');
    const fs = await VS.frames(file, { max: 1, onProgress: p => say('Choosing the photo for ' + file.name + '… ' + Math.round(p * 100) + '%') });
    if (!fs.length) throw new Error('No frame of ' + file.name + ' could be read');
    const data = await blobToDataUrl(fs[0].blob);
    const item = await save({ name: file.name, data, meta: { title: titleOf(file.name), category: '', template: '', texts: [], products: [], source: 'upload', hold: '' } }, true);
    if (!item) return null;
    say('Sending ' + file.name + '…');
    const v = await saveVideo(item.id, file, { w: fs[0].w, h: fs[0].h }, p => say('Sending ' + file.name + '… ' + Math.round(p * 100) + '%'));
    app.toast('Video ad uploaded to your library 🎬 ⭐', 'success');
    return v;
  }
  async function uploadFiles(files, say){
    if (!await signedIn(() => uploadFiles(files, say), 'Create a free account to keep your ads in a library, or sign in.')) return;
    let n = 0;
    for (const f of files){
      try { if (await uploadFile(f, say)) n++; }
      catch (e){ console.warn('ad library: upload', e); app.toast(f.name + ': ' + (e.message || 'not uploaded'), 'error'); }
    }
    if (say) say('');
    return n;
  }
  /* a file picker that calls back with the files chosen */
  function picker(accept, multiple, onFiles){
    const inp = el('input'); inp.type = 'file'; inp.accept = accept; inp.multiple = !!multiple; inp.style.display = 'none';
    inp.onchange = () => { const fs = [...inp.files]; inp.value = ''; if (fs.length) onFiles(fs); };
    return inp;
  }
  function enqueue(rec){
    state.queue.push(rec);
    if (state.queue.length > 5) state.queue.splice(0, state.queue.length - 5);
    pump();
  }
  async function pump(){
    if (state.busy || !state.queue.length) return;
    state.busy = true;
    const rec = state.queue.shift();
    try { await (rec.blob ? saveVideoAd(rec, true) : save(rec, true)); } catch (e){}
    state.busy = false;
    pump();
  }
  async function update(id, patch){
    try {
      await app.call('/ads/update', Object.assign({ id }, patch));
      await load();
    } catch (e){ app.toast(e.message || 'Not changed', 'error'); await load(); }
  }

  // ---------- a design card, drawn as it would download ----------
  /* The card's own template, with the brand kit's number and website on it
     (the website line goes when there is none on file, as Easy Mode drops
     it), at TPL_W x TPL_H as renderThumb draws it: the same scene the
     library's full-size renders came from. */
  function sceneFor(tpl, brand){
    const sc = new fabric.StaticCanvas(null, { width: TPL_W, height: TPL_H, renderOnAddRemove: false, enableRetinaScaling: false });
    const bgi = tpl.bg && tpl.bg.type === 'image' ? freshBgImage(tpl.bg.src, tpl.bg.blur, tpl.bg.grade) : null;
    if (bgi){
      sc.setBackgroundImage(coverImage(bgi, TPL_W, TPL_H), () => {});
      if (tpl.bg.scrim) sc.add(scrimRect(tpl.bg.scrim, TPL_W, TPL_H, tpl.bg.scrimColor, tpl.bg.scrimMode));
    } else {
      sc.add(bgRectFor(tpl.bg && tpl.bg.type === 'image' ? (tpl.bg.fallback || { type: 'solid', c: '#101014' }) : (tpl.bg || { type: 'solid', c: '#101014' }), TPL_W, TPL_H));
    }
    const phone = brand && brand.phone ? formatPhone(String(brand.phone)) : '';
    const site = brand && brand.website ? cleanText(String(brand.website), 'none', 'website') : '';
    (tpl.layers || []).forEach(l => {
      if (!l) return;
      if (l.role === 'website' && !site) return;
      let layer = l, retyped = false;
      if (l.role === 'phone' && phone && typeof l.text === 'string'){ layer = Object.assign({}, l, { text: phone }); retyped = true; }
      else if (l.role === 'website' && typeof l.text === 'string'){ layer = Object.assign({}, l, { text: site }); retyped = true; }
      const o = buildLayer(layer, tpl.id);
      if (retyped && l.kind !== 'textbox' && o && o.text !== undefined && (o.type === 'i-text' || o.type === 'text')){
        try { fitToDoc(o, l.props || {}, TPL_W); if (l.pgOptical !== false && typeof opticalLeftShift === 'function') o.set('left', o.left - opticalLeftShift(o)); } catch (e){}
      }
      sc.add(o);
    });
    alignPass(sc, TPL_W, TPL_H);
    return sc;
  }
  async function saveDesign(ref, opts){
    opts = opts || {};
    let tplId = ref;
    if (/^sc-/.test(ref) && !app.template(ref)){
      if (typeof scRegister !== 'function') throw new Error('the design could not be loaded');
      tplId = await scRegister(ref.slice(3));
      if (!tplId) throw new Error('the design could not be loaded');
    }
    const tpl = app.template(tplId);
    if (!tpl) throw new Error('that design is not here');
    if (typeof tplLocked === 'function' && tplLocked(tpl)){ openPlans('“' + tpl.name + '” is a Pro design. Unlock every design with Pro.'); return null; }
    if (typeof ensureTplAssets === 'function') await ensureTplAssets(tpl);    // its photograph, product and faces
    const want = typeof ezExportPx === 'function' ? ezExportPx() : 1440;
    const gate = await gateExport(want);
    if (!gate) return null;
    const brand = (typeof getBrand === 'function' && getBrand()) || {};
    if (typeof pgGate === 'function' && !await pgGate('ez', () => sceneFor(tpl, brand))) return null;
    const sc = sceneFor(tpl, brand);
    if (typeof applyCardLook === 'function') applyCardLook(sc, tpl, TPL_W, TPL_H, gate.px / TPL_W);
    let url = sc.toDataURL({ format: 'jpeg', quality: 0.9, multiplier: gate.px / TPL_W });
    try { sc.dispose(); } catch (e){}
    if (gate.watermark) url = await applyWatermark(url, gate.px, gate.px);
    try { await recordExport(); }
    catch (e){ app.toast('The save could not be counted as a download: ' + (e.message || e), 'error'); return null; }
    const site = brand.website ? String(brand.website).trim() : '';
    const web = (tpl.layers || []).find(l => l && l.role === 'website');
    const st = { tpl: tpl.id, vals: {}, chips: null, hidden: {} };
    if (web){ if (site) st.vals[tpl.id] = { [web.name]: site }; else st.hidden[tpl.id] = [web.name]; }
    const proj = { kind: 'ez', st };
    const h0 = hold(proj);
    const held = gate.watermark ? 'the watermark' : (web && site) ? 'a website' : (h0 === 'a website' ? '' : h0);
    const name = String(tpl.name || tplId).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-ad-' + gate.px + '.jpg';
    const item = await save({ name, data: url, proj, meta: { hold: held, source: 'studio' } }, true);
    if (item && !opts.quiet) app.toast(item.hold ? 'Saved to your library. ' + heldLine(item.hold) : 'Saved to your library ⭐' + (app.admin() ? '' : ' (1 download used)'), 'success');
    return item;
  }

  // ---------- the ad as made: Easy Mode and the designer ----------
  function ezProject(){
    return { kind: 'ez', st: { tpl: ez.tpl, vals: ez.vals, chips: ez.chips, styles: ez.styles, fx: ez.fx, hidden: ez.hidden,
      tag: Object.assign({}, ez.tag), bgPicked: ez.bgPicked === true,
      bg: (ez.bg && (ez.bg.type !== 'image' || (typeof isDrawnSrc === 'function' && isDrawnSrc(ez.bg.src)))) ? ez.bg : null,
      shade: ez.shade || 0, shadeTone: ez.shadeTone || null, theme: ez.theme ? ez.theme.name : null, voice: ez.voice || null },
      bgData: (ez.bg && ez.bg.type === 'image' && ez.bgData) ? ez.bgData : null };
  }
  function edProject(){
    return { kind: 'adv', json: canvas.toJSON(EXTRA_PROPS), tplId: currentTplId, name: currentTplName, bg: bgState, fmt: docFormat };
  }
  function projectNow(kind){
    try { return kind === 'adv' ? edProject() : ezProject(); } catch (e){ return null; }
  }
  /* the Easy Mode ad, as Download my ad makes it, saved instead of downloaded */
  async function saveEasy(){
    const phone = $('ez-phone').value.trim();
    if (!phone){
      app.toast('Type your phone number first, buyers need to reach you', 'error');
      $('ez-phone').focus(); $('ez-phone').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return null;
    }
    if (!await signedIn(() => saveEasy())) return null;
    const mode = (!ez.bg && !ez.bgPicked) ? 'export' : undefined;
    const gate = await gateExport(ezExportPx());
    if (!gate) return null;
    if (!await pgGate('ez', () => renderEzCanvas(1080, 'png', undefined, mode, undefined, true))) return null;
    let url = renderEzCanvas(gate.px, 'png', undefined, mode);
    const EF = FORMATS[ez.format || 'square'] || FORMATS.square, ek = gate.px / Math.min(EF.w, EF.h), ew = Math.round(EF.w * ek), eh = Math.round(EF.h * ek);
    if (gate.watermark) url = await applyWatermark(url, ew, eh);
    try { await recordExport(); }
    catch (e){ app.toast('The save could not be counted as a download: ' + e.message, 'error'); return null; }
    const name = ezTpl().name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-ad-' + (ez.format && ez.format !== 'square' ? ez.format + '-' : '') + gate.px + '.png';
    const item = await save({ name, data: url, proj: ezProject() }, true);
    if (item) app.toast(item.hold ? 'Saved to your library. ' + heldLine(item.hold) : 'Saved to your library ⭐' + (app.admin() ? '' : ' (1 download used)'), 'success');
    return item;
  }
  /* the designer's canvas, as Export PNG makes it */
  async function saveEditor(){
    if (!canvas) return null;
    if (!await signedIn(() => saveEditor())) return null;
    const gate = await gateExport(exportSize);
    if (!gate) return null;
    if (!await pgGate('adv', () => canvas, { live: true })) return null;
    const d = exportDims(gate.px);
    let url = snapshotPng(d.w, 'png');
    if (gate.watermark) url = await applyWatermark(url, d.w, d.h);
    try { await recordExport(); }
    catch (e){ app.toast('The save could not be counted as a download: ' + e.message, 'error'); return null; }
    const name = (currentTplName || 'phonegfx-ad').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + d.w + 'x' + d.h + '.png';
    const item = await save({ name, data: url, proj: edProject() }, true);
    if (item){ app.toast(item.hold ? 'Saved to your library. ' + heldLine(item.hold) : 'Saved to your library ⭐' + (app.admin() ? '' : ' (1 download used)'), 'success'); try { $('export-overlay').classList.remove('show'); } catch (e){} }
    return item;
  }
  /* the video, made by the studio's own video button and caught on its way
     to the download: counted as that download is, then saved with its photo */
  async function saveVideoNow(kind){
    if (!await signedIn(() => saveVideoNow(kind))) return;
    const id = kind === 'adv' ? 'ex-video' : 'ez-video';
    const btn = $(id);
    if (!btn || btn.disabled) return;
    state.capture = { kind, btn };
    try {
      if (kind === 'adv') await guardVideo(editorDownloadVideo, id);
      else await guardVideo(ezDownloadVideo, id);
    } finally { if (state.capture && state.capture.btn === btn) state.capture = null; }
  }
  function studioVideoMeta(photo){
    let seconds; try { seconds = MOTION.dur; } catch (e){}
    return { seconds, fallbackW: photo && photo.w, fallbackH: photo && photo.h };
  }
  async function captureVideo(blob, name, photo, c){
    const VH = window.VideoHelp;
    const btn = c.btn, set = t => { if (btn) btn.innerHTML = t; };
    try { await (VH ? VH.retry(recordExport, { tries: 3, delay: 1200 }) : recordExport()); }
    catch (e){ app.toast('The video was made, but the download could not be counted: ' + (e.message || e), 'error'); return false; }
    set('Saving to library…');
    await saveVideoAd({ blob, name, photo, proj: projectNow(c.kind), meta: { source: 'studio' }, video: studioVideoMeta(photo),
      onProgress: p => set('Saving to library… ' + Math.round(p * 100) + '%') });
    return false;                     // runVideoExport says nothing more: the toast above is the word
  }

  // ---------- the ★ on every ad ----------
  const CSS = `
.adl-ask{position:fixed;right:16px;bottom:16px;z-index:460;max-width:min(330px,calc(100vw - 32px));padding:14px 16px;border-radius:18px;border:.5px solid var(--glass-edge,rgba(255,255,255,.12));background:var(--surface-solid,#171a21);color:var(--text,#f2f4f8);box-shadow:var(--glass-shadow-lift,0 24px 60px -14px rgba(0,0,0,.75));font-size:14px;line-height:1.4}
.adl-ask b{display:block;margin-bottom:4px}
.adl-ask p{margin:0;color:var(--text-2,#c5cbd8)}
.adl-ask .adl-row{margin-top:10px}
.adl-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.adl-modal{max-width:880px!important;max-height:calc(100vh - 48px);overflow:auto}
.adl-modal h4{font-size:12px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--text-dim);margin:22px 0 8px}
.adl-link{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:12px;border-radius:14px;background:var(--surface-sunk,rgba(255,255,255,.05));border:1px solid var(--hairline,rgba(255,255,255,.08))}
.adl-link input{flex:1 1 260px;min-width:0;font:13px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace!important;padding:9px 11px!important}
.adl-set{display:flex;gap:10px 18px;flex-wrap:wrap;align-items:center;margin-top:10px;font-size:14px;color:var(--text-2)}
.adl-set select,.adl-card select{background:var(--surface-raise);color:var(--text);border:1px solid var(--hairline-strong,rgba(255,255,255,.16));border-radius:10px;padding:7px 9px;font:inherit;font-size:13.5px}
.adl-set input[type=text]{width:220px!important}
.adl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px}
.adl-card{display:flex;flex-direction:column;gap:7px;padding:9px;border-radius:14px;background:var(--surface-sunk,rgba(255,255,255,.05));border:1px solid var(--hairline,rgba(255,255,255,.08));font-size:13px;color:var(--text-2);min-width:0;position:relative}
.adl-card img{width:100%;aspect-ratio:1;object-fit:contain;border-radius:9px;background:#0003;display:block}
.adl-card video{width:100%;aspect-ratio:1;object-fit:contain;border-radius:9px;background:#000;display:block}
.adl-card b{color:var(--text);font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.adl-card .adl-meta{font-size:12px;color:var(--text-dim)}
.adl-card .adl-hold{font-size:12px;color:var(--text);border-left:2px solid #ff6259;padding-left:7px}
.adl-card label.adl-tog{display:flex;gap:7px;align-items:center;margin:0;font-size:13px;font-weight:600;text-transform:none;letter-spacing:0;color:var(--text)}
.adl-card button.adl-x,.adl-card a.adl-x{background:none;border:none;color:var(--text-dim);font:inherit;font-size:12.5px;cursor:pointer;padding:0;text-align:left;text-decoration:none}
.adl-card button.adl-x:hover,.adl-card a.adl-x:hover{color:var(--text)}
.adl-kind{position:absolute;top:14px;left:14px;font:700 10.5px/1 var(--ui,system-ui);letter-spacing:.06em;padding:5px 8px;border-radius:999px;background:rgba(0,0,0,.65);color:#fff}
.adl-empty{padding:18px;border-radius:14px;border:1px dashed var(--hairline-strong,rgba(255,255,255,.16));color:var(--text-dim);font-size:14px}
.adl-note{font-size:13px;color:var(--text-dim);margin-top:8px;line-height:1.5}
.adl-star{position:absolute;top:10px;left:10px;z-index:4;width:30px;height:30px;border-radius:999px;border:.5px solid rgba(255,255,255,.35);background:rgba(0,0,0,.62);color:#fff;font:700 15px/30px var(--ui,system-ui);text-align:center;cursor:pointer;padding:0;opacity:.88;transition:transform .15s,opacity .15s,background .15s;box-sizing:border-box;user-select:none;-webkit-user-select:none}
.adl-star:hover,.adl-star:focus-visible{opacity:1;transform:scale(1.1);outline:none;box-shadow:0 0 0 2px rgba(255,255,255,.5)}
.adl-star.on{background:#ffd200;color:#111;border-color:#ffd200;opacity:1}
.adl-star.busy{cursor:progress;animation:adl-spin 1s linear infinite}
@keyframes adl-spin{to{transform:rotate(360deg)}}
.tpl-card.adl-has .tpl-lockpill{left:48px}
.tpl-card .adl-star{top:12px;left:12px}
.ez-tpl .adl-star{top:6px;right:6px;left:auto;width:26px;height:26px;line-height:26px;font-size:13px}
.ez-tpl .tpl-lock{left:6px}
.mini-tpl .adl-star{top:5px;left:5px;width:22px;height:22px;line-height:22px;font-size:11px;opacity:0}
.mini-tpl:hover .adl-star,.mini-tpl .adl-star.on,.mini-tpl .adl-star:focus-visible,.mini-tpl .adl-star.busy{opacity:1}
.adl-starrow{display:flex;gap:8px;margin-top:10px}
.adl-starrow .ez-open-adv{margin-top:0;flex:1}
.adl-starrow .ez-open-adv.on{border-style:solid;border-color:#ffd200;color:var(--text)}
.hist-row .adl-hist{background:var(--surface-sunk);border:.5px solid var(--hairline);color:var(--text);border-radius:999px;font:600 11.5px/1 var(--ui);padding:9px 11px;cursor:pointer;flex:none;margin-right:8px}
.hist-row .adl-hist:hover{border-color:#ffd200;color:#ffd200}
`;
  const BARE_CSS = `
.adl-bare #adlib-overlay{position:fixed;inset:0;z-index:460;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(10,10,14,.6);backdrop-filter:blur(6px)}
.adl-bare #adlib-overlay.show{display:flex}
.adl-bare #adlib-overlay .modal{--text-dim:var(--muted,#66615a);--surface-sunk:rgba(20,20,20,.05);--surface-raise:var(--panel,#fff);--hairline:rgba(20,20,20,.14);--hairline-strong:rgba(20,20,20,.25);--ui:Satoshi,system-ui,sans-serif;width:min(880px,100%);box-sizing:border-box;background:var(--panel,#fffdf8);color:var(--text,#141414);border:1px solid var(--line,rgba(20,20,20,.18));border-radius:18px;padding:22px;box-shadow:0 24px 60px -14px rgba(0,0,0,.5);font:15px/1.4 Satoshi,system-ui,sans-serif}
.adl-bare #adlib-overlay h3{margin:0 0 4px;font-size:20px}
.adl-bare #adlib-overlay .modal-sub{color:var(--text-2,#3b3833);font-size:14px;margin-bottom:12px}
.adl-bare #adlib-overlay .modal-actions{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:18px}
.adl-bare #adlib-overlay .btn{display:inline-block;font:700 14px Satoshi,system-ui,sans-serif;border-radius:999px;padding:10px 16px;cursor:pointer;border:1.5px solid var(--line,rgba(20,20,20,.18));background:transparent;color:var(--text,#141414)!important;text-decoration:none;min-height:40px;box-sizing:border-box}
.adl-bare #adlib-overlay .btn-primary{background:var(--btn,#2b56f5);color:var(--accent-ink,#fff)!important;border-color:transparent}
.adl-bare #adlib-overlay input[type=text]{font:500 14px Satoshi,system-ui,sans-serif;padding:9px 11px;border-radius:10px;border:1.5px solid var(--line,rgba(20,20,20,.18));background:var(--bg,#f2eee4);color:var(--text,#141414);box-sizing:border-box}
.adl-bare .adl-ask{background:var(--panel,#fffdf8);color:var(--text,#141414);border-color:var(--line,rgba(20,20,20,.18))}
.adl-bare .adl-ask p{color:var(--text-2,#3b3833)}
.adl-bare .adl-ask .btn{font:700 13.5px Satoshi,system-ui,sans-serif;border-radius:999px;padding:9px 14px;cursor:pointer;border:1.5px solid var(--line,rgba(20,20,20,.18));background:transparent;color:var(--text,#141414)}
.adl-bare .adl-ask .btn-primary{background:var(--btn,#2b56f5);color:var(--accent-ink,#fff);border-color:transparent}
`;
  let styled = false, overlay = null, ask = null;
  function el(tag, cls, txt){
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  function btn(label, cls, fn){
    const b = el('button', 'btn ' + (cls || 'btn-outline'), label);
    b.type = 'button';
    b.onclick = e => { e.stopPropagation(); fn(b); };
    return b;
  }
  function style(){
    if (styled) return;
    const st = el('style'); st.textContent = CSS + (app.here() ? '' : BARE_CSS);
    (document.head || document.body).appendChild(st);
    if (!app.here()) document.documentElement.classList.add('adl-bare');
    styled = true;
  }
  const isSaved = ref => !!(ref && state.lib && state.lib.items.some(it => it.template === ref));
  function paintOne(b){
    const on = isSaved(b.dataset.ref);
    b.classList.toggle('on', on);
    b.title = on ? 'In your library (tap to save it again)' : 'Save to library';
  }
  function paint(){
    document.querySelectorAll('.adl-star[data-ref]').forEach(paintOne);
    ['ez-star', 'ex-star'].forEach(id => { const b = $(id); if (b && app.here()){ try { b.classList.toggle('on', isSaved(id === 'ez-star' ? ez.tpl : currentTplId)); } catch (e){} } });
  }
  /* the star itself: a span, not a button, because the cards it sits on
     are often buttons themselves */
  function starFor(ref, opts){
    opts = opts || {};
    style();
    const b = el('span', 'adl-star', '★');
    b.dataset.ref = ref;
    b.setAttribute('role', 'button'); b.tabIndex = 0;
    b.setAttribute('aria-label', 'Save ' + (opts.name || 'this ad') + ' to your library');
    const go = e => { e.stopPropagation(); e.preventDefault(); star(ref, b, opts); };
    b.addEventListener('click', go);
    b.addEventListener('pointerdown', e => e.stopPropagation());
    b.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter' || e.key === ' ') go(e); });
    paintOne(b);
    return b;
  }
  function decorate(card, ref, opts){
    if (!card || !ref || card.querySelector(':scope > .adl-star')) return;
    style();
    card.classList.add('adl-has');
    card.appendChild(starFor(ref, opts));
  }
  function zip(selector, list, refOf, nameOf){
    const cards = document.querySelectorAll(selector);
    cards.forEach((card, i) => { const x = list[i]; if (x) decorate(card, refOf(x), { name: nameOf ? nameOf(x) : undefined }); });
  }
  async function star(ref, b, opts){
    if (b && b.classList.contains('busy')) return;
    if (b) b.classList.add('busy');
    try {
      if (opts && typeof opts.save === 'function') await opts.save();
      else await saveDesign(ref);
    } catch (e){
      console.warn('ad library: star', e);
      app.toast('Not saved: ' + (e.message || e), 'error');
    } finally { if (b){ b.classList.remove('busy'); paintOne(b); } }
  }
  /* the cards app.js builds: each builder is wrapped once, the original runs
     first, and a star lands on what it made */
  function wrap(name, after){
    const orig = window[name];
    if (typeof orig !== 'function' || orig.__adlibStar) return;
    const w = function(){
      const r = orig.apply(this, arguments);
      try {
        if (r && typeof r.then === 'function') r.then(v => { try { after(v, arguments); } catch (e){ console.warn('ad library:', name, e); } });
        else after(r, arguments);
      } catch (e){ console.warn('ad library:', name, e); }
      return r;
    };
    w.__adlibStar = true;
    Object.keys(orig).forEach(k => { try { w[k] = orig[k]; } catch (e){} });
    window[name] = w;
  }
  function stars(){
    if (!app.here()) return;
    style();
    wrap('scCard', (card, a) => { const c = a[0]; if (card && c) decorate(card, 'sc-' + c.id, { name: c.name }); });
    wrap('scClassicCard', (card, a) => { const t = a[0]; if (card && t) decorate(card, t.id, { name: t.name }); });
    wrap('buildEzStrip', () => document.querySelectorAll('#ez-strip .ez-tpl[data-tpl]').forEach(b => decorate(b, b.dataset.tpl, { name: (b.querySelector('span:last-child') || {}).textContent })));
    wrap('buildPickerGrid', (r, a) => {
      let f = a[0]; try { if (f === undefined) f = currentFilter; } catch (e){}
      if (f === 'mine') return;
      const list = TEMPLATES.filter(t => f === 'all' ? t.cat === currentCat : t.cat === f);
      zip('#picker-grid .tpl-card:not(.tpl-saved-card)', list, t => t.id, t => t.name);
    });
    wrap('refreshMyTemplates', () => zip('#builtin-tpl-grid .mini-tpl', catTemplates(), t => t.id, t => t.name));
    wrap('edBuildLibrary', () => { if (!SHOWCASE.cards) return; zip('#ed-lib-grid .mini-tpl', SHOWCASE.cards.filter(c => c.cat === currentCat).slice(0, 80), c => 'sc-' + c.id, c => c.name); });
    wrap('openHistory', () => { app.history().then(recs => {
      document.querySelectorAll('#hist-list .hist-row').forEach((row, i) => {
        const r = recs[i]; if (!r || row.querySelector('.adl-hist')) return;
        const b = el('button', 'adl-hist', state.saved[r.id] ? '⭐ In library' : '⭐ Library');
        b.type = 'button'; b.title = 'Save this download to your library (no download used)';
        b.onclick = async e => { e.stopPropagation(); b.disabled = true; b.textContent = 'Saving…'; const it = await save({ id: r.id, name: r.name, data: r.data, proj: r.proj }); b.textContent = it ? '⭐ In library' : '⭐ Library'; b.disabled = false; };
        const dl = row.querySelector('.hist-dl');
        row.insertBefore(b, dl || null);
      }); }); });
    /* what was built before this file loaded (the landing's gallery draws
       as soon as its index is in) */
    try { document.querySelectorAll('#ez-strip .ez-tpl[data-tpl]').forEach(b => decorate(b, b.dataset.tpl)); } catch (e){}
    try {
      const grid = $('lp-tpl-grid');
      if (grid && grid.children.length && SHOWCASE && SHOWCASE.list){
        [...grid.querySelectorAll('.tpl-card')].forEach((card, i) => { const x = SHOWCASE.list[i]; if (x) decorate(card, x.classic ? x.classic.id : 'sc-' + x.id, { name: x.classic ? x.classic.name : x.name }); });
      }
    } catch (e){}
    /* the ad as made */
    const ezS = $('ez-star'), ezV = $('ez-star-video'), exS = $('ex-star'), exV = $('ex-star-video');
    if (ezS) ezS.onclick = () => saveEasy();
    if (ezV) ezV.onclick = () => saveVideoNow('ez');
    if (exS) exS.onclick = () => saveEditor();
    if (exV) exV.onclick = () => saveVideoNow('adv');
    paint();
  }

  // ---------- the dialog ----------
  async function copy(textv, what){
    try { await navigator.clipboard.writeText(textv); app.toast(what + ' copied', 'success'); }
    catch (e){ window.prompt('Copy the ' + what.toLowerCase(), textv); }
  }
  const when = isoStr => {
    if (!isoStr) return '';
    const ms = Date.parse(isoStr) - Date.now(), d = Math.round(Math.abs(ms) / 86400000), h = Math.round(Math.abs(ms) / 3600000);
    const span = d >= 1 ? d + (d === 1 ? ' day' : ' days') : h >= 1 ? h + (h === 1 ? ' hour' : ' hours') : 'a moment';
    return ms >= 0 ? 'in ' + span : span + ' ago';
  };
  const slug = s => String(s || 'ad').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ad';

  function open(){
    style();
    if (!overlay){
      overlay = el('div', 'modal-overlay');
      overlay.id = 'adlib-overlay';
      overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
      document.body.appendChild(overlay);
    }
    overlay.classList.add('show');
    draw();
    app.ensure().then(load);
  }
  function close(){ if (overlay) overlay.classList.remove('show'); }

  function draw(){
    if (!overlay || !overlay.classList.contains('show')) return;
    const m = el('div', 'modal adl-modal');
    m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', 'Ad library');
    m.appendChild(el('h3', '', 'Ad library'));
    m.appendChild(el('div', 'modal-sub', 'Ads you save here get one public link. Give it to iPhones LA and it posts your WE BUY ads, then posts them again on the schedule you pick. The ★ on any ad saves it here; a video ad brings its clip.'));
    const why = ready();
    if (why){
      m.appendChild(el('div', 'adl-empty', why === 'signin' ? 'Create a free account, or sign in, to keep a library of your ads and share it. No card needed.' : why));
      const row = el('div', 'modal-actions');
      if (why === 'signin'){
        row.appendChild(btn('Create free account', 'btn-primary', () => { close(); app.auth('Create a free account to save ads to your library.', 'up', open); }));
        row.appendChild(btn('Sign in', 'btn-outline', () => { close(); app.auth('Sign in to save ads to your library.', 'in', open); }));
      }
      row.appendChild(btn('Close', 'btn-ghost', close));
      m.appendChild(row);
      return swap(m);
    }
    const lib = state.lib;
    if (!lib){
      m.appendChild(el('div', 'adl-empty', state.error ? 'The library did not load: ' + state.error : 'Loading your library…'));
      const row = el('div', 'modal-actions');
      if (state.error) row.appendChild(btn('Try again', 'btn-outline', load));
      row.appendChild(btn('Close', 'btn-ghost', close));
      m.appendChild(row);
      return swap(m);
    }

    // the public link
    m.appendChild(el('h4', '', 'Your public link'));
    const link = el('div', 'adl-link');
    const inp = el('input'); inp.type = 'text'; inp.readOnly = true; inp.value = lib.links.page; inp.setAttribute('aria-label', 'Your public library link');
    inp.onclick = () => inp.select();
    link.appendChild(inp);
    link.appendChild(btn('Copy link', 'btn-primary', () => copy(lib.links.page, 'Link')));
    const op = el('a', 'btn btn-outline', 'Open'); op.href = lib.links.page; op.target = '_blank'; op.rel = 'noopener';
    link.appendChild(op);
    m.appendChild(link);
    const feeds = el('div', 'adl-row'); feeds.style.marginTop = '8px';
    feeds.appendChild(btn('Copy the feed for auto-post (JSON)', 'btn-ghost', () => copy(lib.links.json, 'Feed link')));
    feeds.appendChild(btn('Copy RSS', 'btn-ghost', () => copy(lib.links.rss, 'RSS link')));
    feeds.appendChild(btn('Reset link', 'btn-ghost', async () => {
      if (!window.confirm('Make a new link? The old one stops working, so anyone using it (iPhones LA) needs the new one.')) return;
      try { await app.call('/ads/link/reset', {}); await load(); app.toast('New link made. Give it to iPhones LA.', 'success'); }
      catch (e){ app.toast(e.message || 'Not reset', 'error'); }
    }));
    m.appendChild(feeds);
    m.appendChild(el('div', 'adl-note adl-share', shareLine(lib)));
    m.appendChild(el('div', 'adl-note', 'Anyone with the link can see these ads, and only these. Ads set to auto-post are listed when they are due, and again every time they come due.'));

    // settings
    const set = el('div', 'adl-set');
    const nm = el('input'); nm.type = 'text'; nm.value = lib.name || ''; nm.maxLength = 60; nm.setAttribute('aria-label', 'Library name');
    nm.onchange = async () => { try { await app.call('/ads/settings', { name: nm.value }); await load(); } catch (e){ app.toast(e.message, 'error'); } };
    const nmL = el('span', '', 'Name '); nmL.appendChild(nm); set.appendChild(nmL);
    const rp = el('select'); rp.setAttribute('aria-label', 'New ads post again');
    (lib.repost_choices || [0, 7]).forEach(n => { const o = el('option', '', REPOST_LABEL[n] || ('Every ' + n + ' days')); o.value = String(n); o.selected = n === lib.repost_days; rp.appendChild(o); });
    rp.onchange = async () => { try { await app.call('/ads/settings', { repost_days: Number(rp.value) }); await load(); } catch (e){ app.toast(e.message, 'error'); } };
    const rpL = el('span', '', 'New ads post '); rpL.appendChild(rp); set.appendChild(rpL);
    const au = el('label', 'adl-tog'); au.style.cssText = 'display:flex;gap:7px;align-items:center;margin:0;text-transform:none;letter-spacing:0;font-size:14px;font-weight:600;color:var(--text)';
    const auC = el('input'); auC.type = 'checkbox'; auC.checked = autoOn();
    auC.onchange = () => { setAuto(auC.checked); app.toast(auC.checked ? 'Every download is saved here now, videos too' : 'Downloads are no longer saved here by themselves'); };
    au.appendChild(auC); au.appendChild(document.createTextNode('Save every download here'));
    set.appendChild(au);
    m.appendChild(set);

    // upload: an ad made anywhere, from this device
    const up = el('div', 'adl-row'); up.style.marginTop = '12px';
    const upIn = picker('image/*,video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov', true, async files => {
      upBtn.disabled = true;
      await uploadFiles(files, t => { upBtn.textContent = t || '⬆ Upload a photo or video'; });
      upBtn.disabled = false; upBtn.textContent = '⬆ Upload a photo or video';
    });
    upIn.id = 'adl-upload';
    const upBtn = btn('⬆ Upload a photo or video', 'btn-outline', () => upIn.click());
    upBtn.id = 'adl-upload-btn';
    up.appendChild(upBtn); up.appendChild(upIn);
    up.appendChild(el('span', 'adl-note', 'An ad made anywhere: a JPG or PNG, or an MP4 or WebM video (its photo is read out of the file).'));
    m.appendChild(up);

    // the ads
    const videos = lib.items.filter(x => x.video).length;
    m.appendChild(el('h4', '', 'Saved ads (' + lib.count + ' of ' + lib.limit + (videos ? ', ' + videos + ' with video' : '') + ')'));
    if (!lib.items.length) m.appendChild(el('div', 'adl-empty', 'Nothing saved yet. Press the ★ on any ad, ⭐ Save to library under your preview, ⬆ Upload a photo or video, or save one of your recent downloads below.'));
    else {
      const grid = el('div', 'adl-grid');
      lib.items.forEach(it => grid.appendChild(card(it, lib)));
      m.appendChild(grid);
    }

    // recent downloads
    const recent = el('div');
    m.appendChild(el('h4', '', 'Recent downloads'));
    m.appendChild(recent);
    app.history().then(recs => {
      if (!recs.length){ recent.appendChild(el('div', 'adl-empty', 'Your downloads on this device show here.')); return; }
      const grid = el('div', 'adl-grid');
      recs.forEach(r => {
        const c = el('div', 'adl-card');
        const im = el('img'); im.src = r.thumb || r.data; im.alt = r.name || 'Download'; im.loading = 'lazy';
        c.appendChild(im);
        c.appendChild(el('b', '', r.name || 'Download'));
        c.appendChild(el('span', 'adl-meta', (r.w || r.px) + ' × ' + (r.h || r.px) + ' · ' + new Date(r.ts).toLocaleDateString()));
        c.appendChild(state.saved[r.id] ? el('span', 'adl-meta', 'Saved ✓')
          : btn('Save to library', 'btn-outline', async b => { b.disabled = true; b.textContent = 'Saving…'; const it = await save({ id: r.id, name: r.name, data: r.data, proj: r.proj }); b.textContent = it ? 'Saved ✓' : 'Save to library'; b.disabled = !!it; }));
        grid.appendChild(c);
      });
      recent.appendChild(grid);
    });

    const row = el('div', 'modal-actions');
    const page = el('a', 'btn btn-ghost', 'Master library'); page.href = (app.here() ? '' : '../') + 'master-library.html'; page.target = '_blank'; page.rel = 'noopener';
    if (!app.here() && /\/master-library\.html$/.test(location.pathname)) page.href = 'master-library.html';
    row.appendChild(page);
    row.appendChild(btn('Close', 'btn-ghost', close));
    m.appendChild(row);
    swap(m);
  }
  function card(it, lib){
    const c = el('div', 'adl-card');
    const im = el('img'); im.src = it.image.url; im.alt = it.title; im.loading = 'lazy';
    c.appendChild(im);
    if (it.video) c.appendChild(el('span', 'adl-kind', '🎬 VIDEO'));
    c.appendChild(el('b', '', it.title));
    c.appendChild(el('span', 'adl-meta', [it.category, it.image.width + ' × ' + it.image.height, it.video ? (it.video.seconds ? it.video.seconds + ' s ' : '') + it.video.format.toUpperCase() : '', 'saved ' + when(it.created)].filter(Boolean).join(' · ')));
    if (it.hold){
      c.appendChild(el('span', 'adl-hold', heldLine(it.hold)));
    } else {
      const tog = el('label', 'adl-tog');
      const cb = el('input'); cb.type = 'checkbox'; cb.checked = it.autopost;
      cb.onchange = () => update(it.id, { autopost: cb.checked });
      tog.appendChild(cb); tog.appendChild(document.createTextNode('Auto-post'));
      c.appendChild(tog);
      const sel = el('select'); sel.setAttribute('aria-label', 'Post again');
      (lib.repost_choices || [0, 7]).forEach(n => { const o = el('option', '', REPOST_LABEL[n] || ('Every ' + n + ' days')); o.value = String(n); o.selected = n === it.repost_days; sel.appendChild(o); });
      sel.disabled = !it.autopost;
      sel.onchange = () => update(it.id, { repost_days: Number(sel.value) });
      c.appendChild(sel);
      if (it.post) c.appendChild(el('span', 'adl-meta', it.post.next_at ? 'Due now, then again ' + when(it.post.next_at) : 'Due now, once'));
    }
    const row = el('div', 'adl-row');
    const dl = el('a', 'adl-x', it.video ? 'Photo' : 'Download'); dl.href = it.image.url; dl.download = slug(it.title) + '.jpg';
    row.appendChild(dl);
    if (it.video){
      const dv = el('a', 'adl-x', 'Video'); dv.href = it.video.url; dv.download = slug(it.title) + '.' + it.video.format;
      row.appendChild(dv);
      const rv = el('button', 'adl-x', 'Remove video'); rv.type = 'button'; rv.title = 'The clip goes, the photo stays';
      rv.onclick = async () => {
        if (!window.confirm('Remove the video from "' + it.title + '"? Its photo stays.')) return;
        try { const r = await app.call('/ads/video/remove', { id: it.id }); took(r.item, false); }
        catch (e){ app.toast(e.message || 'Not removed', 'error'); }
      };
      row.appendChild(rv);
    } else {
      /* a clip from this device onto this photo: the video ad made elsewhere */
      const addIn = picker('video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov', false, async files => {
        add.disabled = true; add.textContent = 'Sending…';
        try { await saveVideo(it.id, files[0], {}, p => { add.textContent = 'Sending… ' + Math.round(p * 100) + '%'; }); app.toast('Video added to "' + it.title + '" 🎬', 'success'); }
        catch (e){ app.toast('Not added: ' + (e.message || 'try again'), 'error'); add.disabled = false; add.textContent = 'Add video'; }
      });
      addIn.className = 'adl-addvideo';
      const add = el('button', 'adl-x', 'Add video'); add.type = 'button'; add.title = 'Put a video (MP4 or WebM) from this device onto this ad';
      add.onclick = () => addIn.click();
      row.appendChild(add); row.appendChild(addIn);
    }
    const rm = el('button', 'adl-x', 'Remove'); rm.type = 'button';
    rm.onclick = async () => {
      if (!window.confirm('Remove "' + it.title + '" from your library? It stops being posted.')) return;
      try { await app.call('/ads/remove', { id: it.id }); Object.keys(state.saved).forEach(k => { if (state.saved[k] === it.id) delete state.saved[k]; }); await load(); }
      catch (e){ app.toast(e.message || 'Not removed', 'error'); }
    };
    row.appendChild(rm);
    c.appendChild(row);
    return c;
  }
  function swap(m){
    overlay.textContent = '';
    overlay.appendChild(m);
  }

  // ---------- after a download ----------
  function offer(rec, tries){
    style();
    /* the video helper's pop-up ("Video saved, with a catch") sits over the
       page: the card waits until it is closed, up to two minutes */
    if (document.querySelector('.vh-back')){ if ((tries || 0) < 240) setTimeout(() => offer(rec, (tries || 0) + 1), 500); return; }
    if (ask && ask.parentNode) ask.parentNode.removeChild(ask);
    clearTimeout(state.askTimer);
    ask = el('div', 'adl-ask');
    ask.setAttribute('role', 'status');
    ask.appendChild(el('b', '', rec.blob ? 'Save this video ad to your library?' : 'Save this ad to your library?'));
    ask.appendChild(el('p', '', rec.blob ? 'Its photo goes with it. Saved ads are on your public link, ready for iPhones LA to post.' : 'Saved ads are on your public link, ready for iPhones LA to post.'));
    const row = el('div', 'adl-row');
    row.appendChild(btn('Save to library', 'btn-primary', async b => { b.disabled = true; b.textContent = 'Saving…'; await (rec.blob ? saveVideoAd(rec) : save(rec)); dismiss(); }));
    row.appendChild(btn('Always save', 'btn-ghost', () => { setAuto(true); enqueue(rec); dismiss(); }));
    row.appendChild(btn('Not now', 'btn-ghost', dismiss));
    ask.appendChild(row);
    document.body.appendChild(ask);
    state.askTimer = setTimeout(dismiss, rec.blob ? ASK_MS * 2 : ASK_MS);
    ask.addEventListener('pointerenter', () => clearTimeout(state.askTimer));
  }
  function dismiss(){
    clearTimeout(state.askTimer);
    if (ask && ask.parentNode) ask.parentNode.removeChild(ask);
    ask = null;
  }
  function downloaded(name, dataUrl, proj){
    if (typeof dataUrl !== 'string' || dataUrl.slice(0, 11) !== 'data:image/') return;
    const rec = { name, data: dataUrl, proj: proj || null };
    state.last = rec;
    // the history record addHistory just wrote, so "Recent downloads" can show it saved
    app.history().then(rs => { const r = rs.find(x => x.name === name && x.data === dataUrl); if (r) rec.id = r.id; });
    if (ready()) return;                  // signed out or demo: say nothing after every download
    if (autoOn()) enqueue(rec);
    else offer(rec);
  }
  function videoDownloaded(blob, name, photo){
    if (!blob || ready()) return;
    const kind = (() => { try { return $('page-editor').classList.contains('active') ? 'adv' : 'ez'; } catch (e){ return 'ez'; } })();
    const rec = { blob, name, photo, proj: projectNow(kind), meta: { source: 'studio' }, video: studioVideoMeta(photo) };
    state.last = rec;
    if (autoOn()) enqueue(rec);
    else offer(rec);
  }

  // ---------- the hooks: where every download ends ----------
  function hook(){
    const original = window.addHistory;
    if (typeof original === 'function' && !original.__adlib){
      const wrapped = function(name, px, dataUrl, w, h, proj){
        let result, failed = false, error;
        try { result = original.apply(this, arguments); }
        catch (e){ failed = true; error = e; }
        try { setTimeout(() => downloaded(name, dataUrl, proj), 0); } catch (e){}
        if (failed) throw error;
        return result;
      };
      wrapped.__adlib = true;
      // keep the marks of a wrap already there (iphonesla-link.js checks its own)
      Object.keys(original).forEach(k => { try { wrapped[k] = original[k]; } catch (e){} });
      window.addHistory = wrapped;
    }
    /* a video: counted and downloaded by deliverVideo; caught here for the
       library, or taken over when ⭐🎬 asked for it instead of a download */
    const dv = window.deliverVideo;
    if (typeof dv === 'function' && !dv.__adlib){
      const w2 = async function(blob, name, photo){
        if (state.capture){
          const c = state.capture; state.capture = null;
          try { return await captureVideo(blob, name, photo, c); }
          catch (e){ console.warn('ad library: video', e); app.toast('Not saved to your library: ' + (e.message || e), 'error'); return false; }
        }
        const ok = await dv.apply(this, arguments);
        if (ok) try { setTimeout(() => videoDownloaded(blob, name, photo), 0); } catch (e){}
        return ok;
      };
      w2.__adlib = true;
      Object.keys(dv).forEach(k => { try { w2[k] = dv[k]; } catch (e){} });
      window.deliverVideo = w2;
    }
  }

  function bind(){
    ['nav-adlib', 'tb-adlib', 'am-adlib', 'mo-adlib', 'ml-adlib'].forEach(id => {
      const b = document.getElementById(id);
      if (!b) return;
      b.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        document.querySelectorAll('.view-drop.open').forEach(x => x.classList.remove('open'));
        open();
      });
    });
  }

  hook();
  bind();
  stars();
  /* what is saved already, so the stars show it; again after a sign-in */
  setTimeout(() => { app.ensure().then(() => { if (!ready()) load(); else paint(); }); }, app.here() ? 1500 : 200);
  if (acct()) acct().onChange(() => { state.lib = null; app.ensure().then(() => { if (!ready()) load(); else { draw(); paint(); } }); });

  window.adLibrary = {
    open, close, load, paint, isSaved,
    save: rec => save(rec), saveVideo, saveVideoAd, saveDesign, saveEasy, saveEditor, saveVideoNow, upload: files => uploadFiles(files),
    signedIn: (next, msg) => signedIn(next, msg), ready,
    star: starFor, decorate,
    state: () => ({ lib: state.lib, error: state.error, auto: autoOn(), queued: state.queue.length, last: !!state.last, capture: !!state.capture }),
  };
})();
