/* Video help: when a video cannot be made, say so in a pop-up that names what
   this browser is missing and offers the fixes that exist, instead of one line
   of engine error under the button. Shared by the studio (app.js) and the
   video maker (motion/app.js), so it is a plain script that sets
   window.VideoHelp and brings its own styles (the two pages theme differently;
   the page's own tokens are used where they exist).

   VideoHelp.check({ w, h, fps, sound, muxer }) -> Promise<report>
     report.items: [{ id, label, ok, detail, fix }] for each thing an export
     leans on; report.mp4 / report.record / report.sound say which paths work.
   VideoHelp.show({ title, message, error, report, actions, tone })
     opens the pop-up. actions: [{ label, primary, run }]; run() may return a
     promise, and the pop-up closes before it runs. */
(function(){
  const ua = navigator.userAgent || '';
  const IN_APP = /FBAN|FBAV|FB_IAB|Instagram|Line\/|TikTok|musical_ly|Snapchat|Twitter|LinkedInApp|Pinterest|GSA\//i.test(ua);
  const IOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const FIREFOX = /Firefox\//.test(ua);
  const BROWSERS = IOS ? 'Safari 17 or newer' : 'Chrome, Edge or Safari 17+';

  async function h264(w, h, fps){
    if (typeof VideoEncoder !== 'function') return false;
    for (const codec of ['avc1.640034', 'avc1.640028', 'avc1.4d0034', 'avc1.42003e', 'avc1.42001f']){
      try {
        const r = await VideoEncoder.isConfigSupported({ codec, width: w, height: h, framerate: fps, bitrate: Math.round(w * h * fps * .16), avc: { format: 'avc' } });
        if (r.supported) return true;
      } catch (e){ /* next */ }
    }
    return false;
  }
  async function audioEnc(){
    if (typeof AudioEncoder !== 'function') return false;
    for (const codec of ['mp4a.40.2', 'opus']){
      try { if ((await AudioEncoder.isConfigSupported({ codec, sampleRate: 44100, numberOfChannels: 2, bitrate: 160000 })).supported) return true; } catch (e){ /* next */ }
    }
    return false;
  }
  function recorder(){
    if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) return null;
    const ok = m => { try { return MediaRecorder.isTypeSupported(m); } catch (e){ return false; } };
    let playsH264 = false;
    try { playsH264 = !!document.createElement('video').canPlayType('video/mp4; codecs="avc1.42E01E"'); } catch (e){}
    if (['video/mp4;codecs=avc1,mp4a', 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1'].some(ok) || (playsH264 && ok('video/mp4'))) return 'mp4';
    return ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].some(ok) ? 'webm' : 'other';
  }

  async function check(o = {}){
    const w = o.w || 1080, h = o.h || 1080, fps = o.fps || 30, items = [];
    const add = (id, label, ok, detail, fix) => items.push({ id, label, ok, detail, fix });
    const secure = window.isSecureContext !== false;
    add('secure', 'Secure page (https)', secure, secure ? '' : 'Video encoding only runs on https pages.',
      'Open this page at its https:// address.');
    if (IN_APP) add('inapp', 'A full browser', false, 'This page is open inside another app (Instagram, Facebook, TikTok…), whose built-in browser cannot save videos reliably.',
      'Tap ⋯ or the share icon and choose "Open in ' + (IOS ? 'Safari' : 'Chrome') + '", or copy the link below into ' + (IOS ? 'Safari' : 'Chrome') + '.');
    const enc = typeof VideoEncoder === 'function';
    add('webcodecs', 'Frame-by-frame video encoder (WebCodecs)', enc, enc ? '' : 'This browser has no video encoder, so the video has to be recorded in real time instead.',
      'Update your browser, or use ' + BROWSERS + '.');
    const avc = enc && await h264(w, h, fps);
    if (enc) add('h264', 'MP4 (H.264) video at ' + w + '×' + h, avc, avc ? '' : (FIREFOX ? 'Firefox on this system cannot write H.264 video.' : 'This browser cannot write H.264 video at this size.'),
      'Use ' + BROWSERS + (w * h > 1080 * 1080 ? ', or try a smaller size (Square 1:1).' : '.'));
    if (o.muxer !== undefined) add('muxer', 'MP4 packager', !!o.muxer, o.muxer ? '' : 'The MP4 packager did not load, often because of an ad blocker, a content filter or a dropped connection.',
      'Reload the page. If it keeps happening, pause your ad blocker for this site.');
    const aud = await audioEnc();
    if (o.sound !== false) add('audio', 'Sound encoder', aud, aud ? '' : 'This browser cannot encode sound into a frame-by-frame video.',
      'Use ' + BROWSERS + ' for a video with sound, or download it without sound.');
    const webAudio = typeof OfflineAudioContext === 'function' || typeof window.webkitOfflineAudioContext === 'function';
    if (o.sound !== false) add('webaudio', 'Sound mixer (Web Audio)', webAudio, webAudio ? '' : 'This browser cannot mix the soundtrack.', 'Download it without sound, or use ' + BROWSERS + '.');
    const rec = recorder();
    add('recorder', 'Real-time recorder', !!rec, !rec ? 'This browser cannot record a canvas at all.' : rec === 'mp4' ? '' : 'The real-time recorder here saves WebM, not MP4. Instagram and TikTok may refuse WebM.',
      !rec ? 'Use ' + BROWSERS + '.' : 'Use ' + BROWSERS + ' for MP4, or convert the WebM file with a free converter.');
    if (rec && rec !== 'mp4') items[items.length - 1].ok = 'partial';
    const mp4 = secure && enc && avc && (o.muxer === undefined || !!o.muxer);
    // none: no way to make a video at all here; soundless: only the sound is the trouble
    return { items, mp4, record: rec, sound: aud && webAudio, inApp: IN_APP, none: !mp4 && !rec,
      soundless: items.some(i => (i.id === 'audio' || i.id === 'webaudio') && !i.ok) };
  }

  /* ------------------------------------------------------------ the pop-up */
  const CSS = `
.vh-back{position:fixed;inset:0;z-index:2147483000;background:rgba(8,6,14,.62);display:flex;align-items:center;justify-content:center;padding:16px}
.vh{--vh-bg:var(--panel,var(--surface,#17151f));--vh-ink:var(--text,#f1eff8);--vh-mut:var(--muted,#a19cb3);--vh-line:var(--line,#2a2736);--vh-acc:var(--btn,var(--accent,#b48cff));--vh-acc-ink:var(--accent-ink,#140a24);
  background:var(--vh-bg);color:var(--vh-ink);border:1px solid var(--vh-line);border-radius:18px;max-width:520px;width:100%;max-height:calc(100vh - 32px);overflow:auto;
  padding:20px 20px 16px;box-shadow:0 20px 60px rgba(0,0,0,.45);font:15px/1.45 Satoshi,system-ui,-apple-system,sans-serif}
.vh h2{margin:0 0 6px;font-size:19px;display:flex;gap:10px;align-items:center}
.vh h2 i{font-style:normal;flex:none;width:28px;height:28px;border-radius:99px;display:grid;place-items:center;font-size:15px;background:#e5484d;color:#fff}
.vh.info h2 i{background:var(--vh-acc);color:var(--vh-acc-ink)}
.vh p{margin:6px 0}
.vh .vh-err{font:12.5px/1.4 ui-monospace,Menlo,monospace;color:var(--vh-mut);background:rgba(127,127,127,.12);border-radius:8px;padding:7px 9px;margin:8px 0;word-break:break-word}
.vh ul{list-style:none;margin:10px 0;padding:0;border-top:1px solid var(--vh-line)}
.vh li{padding:8px 0;border-bottom:1px solid var(--vh-line);display:grid;grid-template-columns:22px 1fr;gap:2px 8px}
.vh li b{font-weight:700}
.vh li span{grid-column:2;color:var(--vh-mut);font-size:13.5px}
.vh li em{grid-column:2;font-style:normal;font-size:13.5px}
.vh li em::before{content:"Fix: ";font-weight:700}
.vh .ok{color:#30a46c}.vh .no{color:#e5484d}.vh .part{color:#f5a524}
.vh-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;justify-content:flex-end}
.vh-acts button{border:1.5px solid var(--vh-line);background:transparent;color:var(--vh-ink);font:700 14.5px Satoshi,system-ui,sans-serif;padding:9px 15px;border-radius:999px;cursor:pointer;min-height:42px}
.vh-acts button.p{background:var(--vh-acc);color:var(--vh-acc-ink);border-color:transparent}
.vh-acts button:focus-visible{outline:3px solid var(--vh-acc);outline-offset:2px}
@media (max-width:520px){.vh-acts button{flex:1 1 100%}}
.vh-toast{position:fixed;left:16px;right:16px;bottom:18px;margin:0 auto;width:max-content;box-sizing:border-box;transform:translateY(140%);z-index:2147482999;max-width:min(560px,calc(100vw - 32px));display:flex;gap:12px;align-items:center;
  background:#1d1a27;color:#f1eff8;border:1px solid #3a3548;border-radius:14px;padding:11px 14px;font:14px/1.4 Satoshi,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.4);transition:transform .25s;pointer-events:none}
/* centred by its margins, not left:50%: a box that starts halfway across can
   only be half the screen wide, which on a phone squeezed the photo's toast
   into a column with its button hanging off the edge */
.vh-toast.show{transform:translateY(0);pointer-events:auto}
.vh-toast span{min-width:0}
/* the video's photo kept under a row of buttons (the editor's export pop-up), on a line of its own */
.vh-photo.vh-line{display:flex;align-items:center;justify-content:center;width:100%;margin-top:10px}
.vh-toast button{flex:none;border:0;background:#b48cff;color:#140a24;font:700 13.5px Satoshi,system-ui,sans-serif;padding:7px 12px;border-radius:99px;cursor:pointer}
@media (prefers-reduced-motion:reduce){.vh-toast{transition:none}}`;
  let styled = false, open = null;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function close(){ if (open){ open.remove(); document.removeEventListener('keydown', open._key); const f = open._focus; open = null; try { f && f.focus(); } catch (e){} } }

  function show(o = {}){
    if (!styled){ const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); styled = true; }
    close();
    const back = document.createElement('div'); back.className = 'vh-back';
    const box = document.createElement('div'); box.className = 'vh' + (o.tone === 'info' ? ' info' : '');
    box.setAttribute('role', o.tone === 'info' ? 'dialog' : 'alertdialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'vh-title');
    const missing = o.report ? o.report.items.filter(i => i.ok !== true) : [];
    const rows = (o.showAll && o.report ? o.report.items : missing).map(i => {
      const [cls, mark] = i.ok === true ? ['ok', '✓'] : i.ok === 'partial' ? ['part', '!'] : ['no', '✕'];
      return `<li><b class="${cls}" aria-hidden="true">${mark}</b><b>${esc(i.label)}${i.ok === true ? '' : i.ok === 'partial' ? ' (partly)' : ': missing'}</b>` +
        (i.detail ? `<span>${esc(i.detail)}</span>` : '') + (i.ok !== true && i.fix ? `<em>${esc(i.fix)}</em>` : '') + '</li>';
    }).join('');
    box.innerHTML = `<h2 id="vh-title"><i aria-hidden="true">${o.tone === 'info' ? 'i' : '!'}</i>${esc(o.title || 'The video could not be made')}</h2>` +
      (o.message ? `<p>${esc(o.message)}</p>` : '') +
      (o.error ? `<div class="vh-err">${esc(o.error)}</div>` : '') +
      (rows ? `<p><b>${missing.length ? 'What this browser is missing' : 'What this browser can do'}</b></p><ul>${rows}</ul>` : '') +
      '<div class="vh-acts"></div>';
    const acts = box.querySelector('.vh-acts');
    const list = (o.actions || []).slice();
    if (o.report && (o.report.inApp || missing.some(i => ['h264', 'webcodecs', 'recorder', 'inapp', 'secure'].includes(i.id))))
      list.push({ label: 'Copy link to open elsewhere', keepOpen: true, run: async b => {
        try { await navigator.clipboard.writeText(location.href); b.textContent = 'Link copied'; }
        catch (e){ window.prompt('Copy this link and open it in ' + BROWSERS + ':', location.href); }
      } });
    if (!list.some(a => a.primary) && list.length) list[0].primary = true;
    list.push({ label: 'Close', run: () => {} });
    list.forEach(a => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = a.label; if (a.primary) b.className = 'p';
      b.addEventListener('click', () => { if (!a.keepOpen) close(); try { const r = a.run && a.run(b); if (r && r.catch) r.catch(e => console.error(e)); } catch (e){ console.error(e); } });
      acts.appendChild(b);
    });
    back.appendChild(box);
    back.addEventListener('click', e => { if (e.target === back) close(); });
    back._focus = document.activeElement;
    back._key = e => {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab'){ const f = [...box.querySelectorAll('button')], i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0){ e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1){ e.preventDefault(); f[0].focus(); } }
    };
    document.addEventListener('keydown', back._key);
    document.body.appendChild(back); open = back;
    (acts.querySelector('button.p') || acts.querySelector('button')).focus();
    return { close };
  }

  /* ------------------------------------------------------------ pushing on */

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  /** fn(attempt) up to `tries` times, waiting delay, 2×delay… between. An
   *  error retryIf turns down (a refusal, not a hiccup) is thrown at once. */
  async function retry(fn, { tries = 3, delay = 700, onRetry, retryIf } = {}){
    let last;
    for (let i = 0; i < tries; i++){
      try { return await fn(i); }
      catch (e){
        last = e;
        if (retryIf && !retryIf(e)) throw e;
        if (i < tries - 1){ try { onRetry && onRetry(e, i + 1); } catch (x){} await sleep(delay * 2 ** i); }
      }
    }
    throw last;
  }
  /** Resolves when this tab is on screen (at once if it already is). */
  function waitVisible(){
    if (!document.hidden) return Promise.resolve();
    return new Promise(r => { const f = () => { if (!document.hidden){ document.removeEventListener('visibilitychange', f); r(); } }; document.addEventListener('visibilitychange', f); });
  }
  /** Out of memory, by whatever name this browser gives it. */
  const isMemory = e => { const m = String((e && e.message) || e || ''); return (e && (e.name === 'RangeError' || e.name === 'QuotaExceededError')) || /allocation|out of memory|memory/i.test(m); };

  /* A small note at the foot of the screen that does not stop anything. */
  let toastEl = null, toastT = 0;
  function toast(msg, o = {}){
    if (!styled){ const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); styled = true; }
    if (!toastEl){ toastEl = document.createElement('div'); toastEl.className = 'vh-toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite'); document.body.appendChild(toastEl); }
    toastEl.innerHTML = '<span></span>'; toastEl.firstChild.textContent = msg;
    if (o.action){ const b = document.createElement('button'); b.type = 'button'; b.textContent = o.action.label; b.onclick = () => { toastEl.classList.remove('show'); o.action.run(); }; toastEl.appendChild(b); }
    toastEl.classList.add('show'); clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('show'), o.ms || 7000);
  }

  /** Share sheet where there is one for files (a phone: Save Video, AirDrop,
   *  straight to Instagram), else a plain download. Resolves true if shared.
   *  more: [{ blob, name }] to go in the same sheet (the video's photo, for
   *  OfferUp); where the sheet takes one file only, the video goes alone. */
  async function share(blob, name, more){
    const extra = (more || []).filter(m => m && m.blob);
    try {
      const files = [new File([blob], name, { type: blob.type })].concat(extra.map(m => new File([m.blob], m.name, { type: m.blob.type })));
      for (const set of files.length > 1 ? [files, files.slice(0, 1)] : [files])
        if (navigator.canShare && navigator.canShare({ files: set })){ await navigator.share({ files: set }); return true; }
    } catch (e){ if (e && e.name === 'AbortError') return true; }
    save(blob, name); extra.forEach(m => save(m.blob, m.name)); return false;
  }
  function save(blob, name){
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10 * 60000);
  }
  const canShareFiles = () => { try { return !!(navigator.canShare && navigator.canShare({ files: [new File([''], 'x.mp4', { type: 'video/mp4' })] })); } catch (e){ return false; } };

  /* Safety net: an error nothing caught would otherwise just stop whatever the
     person clicked, with nothing on screen. Say so, with what to do. Only our
     own scripts count (an extension's or an ad blocker's errors are not ours),
     and at most one note every 15 s. */
  let netOn = false, lastNote = 0;
  function safetyNet(o = {}){
    if (netOn) return; netOn = true;
    const ours = e => {
      const st = String((e && (e.stack || e.filename)) || '');
      if (/(chrome|moz|safari(-web)?)-extension:/.test(st)) return false;
      return !st || st.includes(location.origin);        // no stack: a DOMException from our own call
    };
    const note = e => {
      const m = String((e && e.message) || e || '');
      if (!m || /ResizeObserver loop|^Script error\.?$|AbortError|The user aborted|cancell?ed/i.test(m)) return;
      if (Date.now() - lastNote < 15000) return; lastNote = Date.now();
      const text = /Failed to fetch|NetworkError|Load failed|network/i.test(m) ? 'The connection dropped for a moment. Check your internet, then try that again.'
        : isMemory(e) ? 'This device ran low on memory. Close other tabs or apps, then try that again.'
        : 'Something went wrong there, and your work is still here. Try that again; if it keeps happening, reload the page.';
      (o.notify || toast)(text, e);
    };
    window.addEventListener('error', ev => { if (ev.error ? ours(ev.error) : (ev.filename || '').startsWith(location.origin)) { console.warn('Caught by the safety net:', ev.error || ev.message); note(ev.error || ev.message); } });
    window.addEventListener('unhandledrejection', ev => { const r = ev.reason; if (ours(r)){ console.warn('Caught by the safety net:', r); note(r); } });
  }

  /* The video's photo, kept. Owner, 2026-10-03, a day after the photo came
     with every video (rule 108): "when I download the video and also then
     download the photo after so I have the option". The photo downloads with
     the video, but a browser can hold a second download back (Chrome asks
     first, a phone can drop it), and the toast's Save photo again is gone in
     twelve seconds. So a button placed right after the video button keeps
     the photo until the next video replaces it: one tap, any time, no
     screenshot and no crop. It wears the video button's look; after a row
     of buttons (the editor's export pop-up, which has no room for a fourth)
     the page passes the class, and it takes a line of its own. */
  let kept = null;
  function keepPhoto(photo, after, label, cls){
    if (kept){ kept.remove(); kept = null; }
    if (!photo || !photo.blob || !after || !after.parentNode) return null;
    if (!styled){ const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); styled = true; }
    const b = document.createElement('button');
    b.type = 'button'; b.className = cls || after.className; b.classList.add('vh-photo'); b.classList.remove('primary', 'download', 'btn-primary');
    if (cls) b.classList.add('vh-line');
    b.textContent = label || "\u{1F4F7}\u00a0 Download the video's photo";
    b.title = 'The photo of your last video, ' + (photo.w && photo.h ? photo.w + '×' + photo.h + ', ' : '') + 'for OfferUp, which takes a video only with a photo (' + photo.name + ')';
    b.addEventListener('click', () => save(photo.blob, photo.name));
    after.insertAdjacentElement('afterend', b);
    return (kept = b);
  }

  window.VideoHelp = { check, show, close, inApp: IN_APP, retry, waitVisible, isMemory, toast, share, save, canShareFiles, safetyNet, keepPhoto };
})();
