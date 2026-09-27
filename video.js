'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   VIDEO ADS — the open template becomes a 6, 10 or 15 second clip.

   Spec and evidence: docs/VIDEO-AD-RESEARCH.md §8. What this file enforces,
   and why:

   1. Frame 0 and the last frame ARE the still ad (rule candidate V1). Feed
      content is judged in 0.25–0.4 s and every grid shows a still thumbnail,
      so the clip can never open weaker than today's PNG, and it loops without
      a seam. Frames are drawn through the same fabric path as snapshotPng().
   2. Every frame is a pure function of t (V7). Export never touches rAF, a
      timer or the wall clock, so switching tabs cannot drop or stretch a
      frame. rAF drives the preview only.
   3. The phone number never leaves the screen for long (V2): it is in the
      template, or in the phone bar that holds through every scene.
   4. No text beat is shorter than it takes to read (V3). dwell() measures it
      and the panel warns when copy is too long for the chosen length.
   5. A flash check runs over every encoded frame and blocks the download on
      failure (V4): WCAG 2.3.1, and Meta / Google / TikTok ad policy.

   Loaded after app.js. It reads app.js's globals (canvas, CW, CH, TEMPLATES,
   gateExport, …) and never redefines them, and it adds nothing to the pass
   chain at the end of app.js (landmine: TDZ).
   ═══════════════════════════════════════════════════════════════════════════ */
(function(){
const VIDEO_SRC = (document.currentScript && document.currentScript.src) || location.href;
const MB_URL = new URL('vendor/mediabunny-1.60.0.min.mjs', VIDEO_SRC).href;
let _mb = null;
const loadMB = () => _mb || (_mb = import(MB_URL));

const FPS = 30;
const MAX_SHORT = 1080;   // every platform spec is 1080 on the short side; they re-encode anything larger

// ── easing ─────────────────────────────────────────────────────────────────
const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const lerp = (a, b, p) => a + (b - a) * p;
function bezier(x1, y1, x2, y2){
  const f = (a, b, u) => 3 * a * u * (1 - u) * (1 - u) + 3 * b * u * u * (1 - u) + u * u * u;
  return x => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0, hi = 1, u = x;
    for (let i = 0; i < 22; i++){ u = (lo + hi) / 2; if (f(x1, x2, u) < x) lo = u; else hi = u; }
    return f(y1, y2, u);
  };
}
const ENTER = bezier(0.05, 0.7, 0.1, 1);     // Material 3 emphasized-decelerate: entrances
const EXIT  = bezier(0.3, 0, 0.8, 0.15);     // emphasized-accelerate: exits
const inOut = p => p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const outBack = p => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
const bump = p => (p <= 0 || p >= 1) ? 0 : Math.sin(Math.PI * p);

// ── timeline ───────────────────────────────────────────────────────────────
/* Beat sheet, research §8.2. Scene windows are [start, end) in seconds; the
   template owns everything before the first scene and after the return. */
const CUTS = {
  6:  { dur: 6,  scenes: [['price', 0.5, 3.1]] },
  10: { dur: 10, scenes: [['price', 0.55, 3.55], ['steps', 3.55, 6.85]] },
  15: { dur: 15, scenes: [['price', 0.55, 3.55], ['steps', 3.55, 6.85], ['proof', 6.85, 10.55]] },
};
const WAKE = 0.55;       // product lift at the very start: motion ONSET is what catches the eye
const T_IN = 0.4;        // template → scene ground
const T_RET = 0.45;      // last scene → template
const T_X = 0.3;         // scene → scene text exit
const MORPH_IN = 0.6, MORPH_X = 0.5;
const PRICE_AT = 0.2;    // price block entrance, scene-local
const PROOF_AT = 0.35;
function timeline(len){
  const c = CUTS[len] || CUTS[10];
  const scenes = c.scenes.map(([id, a, b]) => ({ id, a, b }));
  const tIn = scenes[0].a, ret = scenes[scenes.length - 1].b;
  const stamp = ret + T_RET + 0.25;
  return { len: +len, dur: c.dur, scenes, tIn, ret, retEnd: ret + T_RET, stamp, sweep: stamp + 0.22 };
}

// ── colour ─────────────────────────────────────────────────────────────────
function rgbOf(c){
  if (!c || typeof c !== 'string') return null;
  let m = c.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (m){
    let h = m[1];
    if (h.length === 3) h = h.split('').map(v => v + v).join('');
    return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16));
  }
  m = c.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+)(%?))?\s*\)$/i);
  if (m){
    const a = m[4] === undefined ? 1 : parseFloat(m[4]) / (m[5] ? 100 : 1);
    return a < 0.6 ? null : [+m[1], +m[2], +m[3]];
  }
  return null;
}
const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const lumOf = rgb => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
const contrastL = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const hexOf = rgb => '#' + rgb.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
function satOf(rgb){
  const [r, g, b] = rgb.map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  return mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1));
}
const INK_DARK = '#0b0b0f';
const inkOn = accent => {
  const L = lumOf(rgbOf(accent) || [255, 255, 255]);
  return contrastL(L, lumOf(rgbOf(INK_DARK))) >= contrastL(L, 1) ? INK_DARK : '#ffffff';
};

// ── reading the ad off the live canvas ─────────────────────────────────────
const up = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().toUpperCase();
const PRICE_RE = /(\$\s?\d{1,3}(?:,\d{3})+(?:\.\d+)?|\$\s?\d+(?:\.\d+)?\s?[kK]?|\d{1,3}(?:\.\d+)?\s?%)/;
const PHONE_RE = /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
const ITEMS = { phones:'PHONES', gold:'GOLD', silver:'SILVER', coins:'COINS', cars:'CARS',
  strips:'TEST STRIPS', pokemon:'POKÉMON CARDS', sports:'SPORTS CARDS' };
/* Reasons to trust the buyer, per category. Defaults only: the panel says
   "only claims you can stand behind", because a trust line that is not true
   is the exact scam signal the research documents. */
const PROOF = {
  phones:  ['MEET IN A PUBLIC PLACE', 'ID REQUIRED', 'PAID ON THE SPOT'],
  gold:    ['TESTED IN FRONT OF YOU', 'NO-OBLIGATION QUOTE', 'PAID ON THE SPOT'],
  silver:  ['WEIGHED IN FRONT OF YOU', 'NO-OBLIGATION QUOTE', 'PAID ON THE SPOT'],
  coins:   ['HONEST GRADING', 'NO-OBLIGATION QUOTE', 'PAID ON THE SPOT'],
  cars:    ['FREE TOWING', 'NO-OBLIGATION OFFER', 'CASH BEFORE WE TOW'],
  strips:  ['SEALED & UNEXPIRED ONLY', 'NO-OBLIGATION QUOTE', 'DISCREET PICKUP'],
  pokemon: ['OFFERS FROM REAL SOLD COMPS', 'NO-OBLIGATION QUOTE', 'PAID ON THE SPOT'],
  sports:  ['OFFERS FROM REAL SOLD COMPS', 'NO-OBLIGATION QUOTE', 'PAID ON THE SPOT'],
};
const DISPLAY = ['Clash Display', 'Khand', 'Zodiak', 'Melodrama'];   // every one ships a 700 file (rule 20)

function textOf(o){
  if (!o) return '';
  if (typeof o.text === 'string') return o.text;
  if (o.pgCurved && o.pgCurved.text) return o.pgCurved.text;
  return '';
}
function objArea(o){ return o.getScaledWidth() * o.getScaledHeight(); }
function isGround(o){
  if (o.pgBgRect || o.pgScrim) return true;
  if (textOf(o).trim()) return false;
  const r = o.getBoundingRect(true, true);
  return r.width * r.height >= CW * CH * 0.9;
}
function srcOf(o){ try { return (o.getSrc && o.getSrc()) || ''; } catch (e){ return ''; } }
function pickProduct(objs){
  return objs.filter(o => o.type === 'image' && (o.opacity == null || o.opacity > 0.3) && !isGround(o)
      && objArea(o) < CW * CH * 0.6 && (/\/cutouts\//.test(srcOf(o)) || /^(image|product)$/i.test(o.name || '')))
    .sort((a, b) => objArea(b) - objArea(a))[0] || null;
}
function pickPhoneObj(objs){
  return objs.filter(o => o.pgRole === 'phone' && PHONE_RE.test(textOf(o)))
    .sort((a, b) => (b.fontSize || 0) - (a.fontSize || 0))[0] || null;
}
function pickAccent(objs){
  const ground = 0.012;   // the scene ground is darkened to about this (measured again in ready())
  const c = [];
  objs.forEach(o => {
    if (!textOf(o).trim()) return;
    const cols = [];
    if (typeof o.fill === 'string') cols.push(o.fill);
    if (o.pgFillGrad) cols.push(o.pgFillGrad.c1, o.pgFillGrad.c2);
    cols.forEach(col => {
      const rgb = rgbOf(col);
      if (!rgb) return;
      const s = satOf(rgb);
      if (s < 0.35 || contrastL(lumOf(rgb), ground) < 4.5) return;
      const w = (o.pgRole === 'headline' || o.pgRole === 'cta') ? 1.5 : 1;
      c.push({ rgb, score: s * Math.sqrt(o.fontSize || 40) * w });
    });
  });
  c.sort((a, b) => b.score - a.score);
  return c.length ? hexOf(c[0].rgb) : '#ffffff';
}
function ctaLabelFrom(cta){
  if (/\bdm\b/i.test(cta)) return 'DM OR CALL';
  if (/text/i.test(cta) && /call/i.test(cta)) return 'CALL OR TEXT';
  if (/text/i.test(cta)) return 'TEXT US';
  if (/call/i.test(cta)) return 'CALL NOW';
  return 'CALL OR TEXT';
}
function readAd(){
  const objs = canvas.getObjects().filter(o => o.visible !== false);
  const tpl = currentTplId ? TEMPLATES.find(t => t.id === currentTplId) : null;
  const cat = (tpl && tpl.cat) || currentCat || 'phones';
  const brand = getBrand() || {};
  const all = objs.map(textOf).join('\n');

  let phone = '';
  const po = pickPhoneObj(objs);
  if (po) phone = textOf(po).match(PHONE_RE)[0].trim();
  if (!phone){ const m = all.match(PHONE_RE); if (m) phone = m[0].trim(); }
  if (!phone && brand.phone) phone = formatPhone(brand.phone);

  const ctaObj = objs.find(o => o.pgRole === 'cta');
  const cta = up(ctaObj ? textOf(ctaObj) : '');

  // the price: a named price layer first, then by role, first line with a figure wins
  const named = objs.filter(o => /price/i.test(o.name || '') && textOf(o).trim());
  const ordered = named.concat(['headline', 'info', 'sub', 'cta', 'badges', ''].flatMap(r => objs.filter(o => (o.pgRole || '') === r)));
  // reading order, for copy that runs from one layer into the next
  const flow = objs.filter(o => textOf(o).trim()).sort((a, b) => a.getBoundingRect(true, true).top - b.getBoundingRect(true, true).top);
  let lead = '', price = '', qualifier = '';
  outer: for (const o of ordered){
    const lines = textOf(o).split('\n');
    for (let li = 0; li < lines.length; li++){
      const line = lines[li], m = line.match(PRICE_RE);
      if (!m) continue;
      price = m[0].replace(/\s+/g, '').toUpperCase();
      lead = up(line.slice(0, m.index));
      qualifier = up(line.slice(m.index + m[0].length));
      /* "PAYING UP TO 95% OF" + "TODAYS GOLD PRICE" is one sentence split across
         two layers. A qualifier that ends on a dangling word continues into the
         next line, then the next layer down, for up to four words. */
      if (qualifier && /(^|\s)(OF|FOR|TO|AT|ON|IN|THE|A|AN|PER)$/.test(qualifier)){
        const next = lines.slice(li + 1).join(' ') + ' ' + (flow[flow.indexOf(o) + 1] ? textOf(flow[flow.indexOf(o) + 1]) : '');
        const more = up(next).split(/[•·|!.]/)[0].trim().split(' ').filter(Boolean).slice(0, 4).join(' ');
        if (more) qualifier = qualifier + ' ' + more;
      }
      break outer;
    }
  }
  if (!price && named[0]) price = up(textOf(named[0]).split('\n')[0]);
  if (!price){
    // no figure anywhere: the offer scene carries the ad's own headline instead
    const heads = flow.filter(o => o.pgRole === 'headline').map(o => up(textOf(o)));
    // joined only while it can still be read in the 6 s cut's price window
    price = heads.join(' ').length <= 24 ? heads.join(' ') : (heads[0] || '');
    const bd = objs.find(o => o.pgRole === 'badges');
    if (bd) qualifier = textOf(bd).split(/[✓✔•·|]+|\s{2,}/).map(up).filter(Boolean).slice(0, 3).join(' · ');
  }
  if (price && PRICE_RE.test(price) && !lead) lead = 'WE PAY';

  const s1 = /\bdm\b/i.test(cta) ? 'DM US A PHOTO' : /text|photo|pic/i.test(cta) ? 'TEXT A PHOTO'
           : /call/i.test(cta) ? 'CALL OR TEXT US' : 'SEND A PHOTO';
  const s3 = /same[- ]day/i.test(all) ? 'GET PAID SAME DAY'
           : /on the spot|in front of you|cash in hand/i.test(all) ? 'GET PAID ON THE SPOT' : 'GET PAID';

  const h = objs.filter(o => o.pgRole === 'headline' && o.fontFamily).sort((a, b) => (b.fontSize || 0) - (a.fontSize || 0))[0];
  return {
    cat, phone, lead, price, qualifier,
    kicker: 'WE BUY ' + (ITEMS[cat] || 'IT'),
    name: up(brand.name || ''),
    ctaLabel: phone ? ctaLabelFrom(cta) : (cta.replace(/[!.]+$/, '') || 'MESSAGE US'),
    steps: [s1, 'GET A FREE OFFER', s3],
    proof: (PROOF[cat] || PROOF.phones).slice(),
    proofTitle: brand.name ? 'WHY ' + up(brand.name) : 'WHY SELL TO US',
    font: (h && DISPLAY.includes(h.fontFamily)) ? h.fontFamily : 'Clash Display',
    accent: pickAccent(objs),
  };
}

// ── canvas + text helpers ──────────────────────────────────────────────────
function mk(w, h){ const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
const HAS_TRACK = 'letterSpacing' in CanvasRenderingContext2D.prototype;
function setFont(x, weight, size, fam, trk){
  x.font = weight + ' ' + Math.max(1, size).toFixed(1) + 'px "' + fam + '", "Satoshi", sans-serif';
  if (HAS_TRACK) x.letterSpacing = (trk ? size * trk : 0).toFixed(2) + 'px';
}
function fitSize(x, s, weight, size, fam, maxW, trk){
  setFont(x, weight, size, fam, trk);
  const w = x.measureText(s).width;
  return w > maxW ? size * maxW / w : size;
}
/* Self-audit recorder. While REC is an array, every text line and shape the
   renderer draws is also recorded with its box in frame pixels (through the
   current transform), so layout and contrast are checked on exactly what is
   drawn, not on a model of it. NO_TEXT suppresses text so the backdrop under
   each line can be measured on the real frame (rule 22). */
let REC = null, NO_TEXT = false;
function boxOf(x, x0, y0, x1, y1){
  const m = x.getTransform(), pts = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([a, b]) => [m.a * a + m.c * b + m.e, m.b * a + m.d * b + m.f]);
  return { x0: Math.min(...pts.map(q => q[0])), y0: Math.min(...pts.map(q => q[1])), x1: Math.max(...pts.map(q => q[0])), y1: Math.max(...pts.map(q => q[1])) };
}
function recText(x, s, ax, base, size, color, alpha){
  if (!REC) return;
  const mt = x.measureText(s);
  const b = boxOf(x, ax - mt.actualBoundingBoxLeft, base - mt.actualBoundingBoxAscent, ax + mt.actualBoundingBoxRight, base + mt.actualBoundingBoxDescent);
  REC.push(Object.assign(b, { kind: 'text', s, size, color, alpha: x.globalAlpha * (alpha == null ? 1 : alpha) }));
}
function recShape(x, kind, x0, y0, x1, y1){ if (REC) REC.push(Object.assign(boxOf(x, x0, y0, x1, y1), { kind })); }
function text(x, s, cx, base, o){
  if (!s || o.alpha <= 0) return;
  x.save();
  x.globalAlpha *= o.alpha == null ? 1 : o.alpha;
  setFont(x, o.weight, o.size, o.fam, o.trk);
  x.textAlign = o.align || 'center';
  x.textBaseline = 'alphabetic';
  x.fillStyle = o.color;
  // trailing tracking shifts centred text left by half a space; put it back
  const nudge = (HAS_TRACK && o.trk && x.textAlign === 'center') ? o.size * o.trk / 2 : 0;
  recText(x, s, cx + nudge, base, o.size, o.color, 1);
  if (!NO_TEXT) x.fillText(s, cx + nudge, base);
  x.restore();
}
function rrect(x, X, Y, W, H, r){
  r = Math.min(r, W / 2, H / 2);
  x.beginPath();
  x.moveTo(X + r, Y); x.lineTo(X + W - r, Y); x.quadraticCurveTo(X + W, Y, X + W, Y + r);
  x.lineTo(X + W, Y + H - r); x.quadraticCurveTo(X + W, Y + H, X + W - r, Y + H);
  x.lineTo(X + r, Y + H); x.quadraticCurveTo(X, Y + H, X, Y + H - r);
  x.lineTo(X, Y + r); x.quadraticCurveTo(X, Y, X + r, Y);
  x.closePath();
}
function containIn(ew, eh, box){
  const bw = box.x1 - box.x0, bh = box.y1 - box.y0, s = Math.min(bw / ew, bh / eh);
  return { x: (box.x0 + box.x1) / 2, y: (box.y0 + box.y1) / 2, w: ew * s, h: eh * s };
}
function wrap2(x, s, maxW){
  if (x.measureText(s).width <= maxW) return [s];
  const words = s.split(' ');
  if (words.length < 2) return [s];
  let best = [s], bw = Infinity;
  for (let i = 1; i < words.length; i++){
    const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
    const w = Math.max(x.measureText(a).width, x.measureText(b).width);
    if (w < bw){ bw = w; best = [a, b]; }
  }
  return best;
}
/* The same four corner marks applyWatermark() puts on a free still, so a free
   clip's frame 0 still equals the free still. */
function drawWatermark(x, w, h){
  const base = Math.min(w, h), fs = Math.round(base * 0.032), pad = Math.round(base * 0.06);
  x.save();
  x.font = '800 ' + fs + 'px "DM Sans", sans-serif';
  if (HAS_TRACK) x.letterSpacing = '0px';
  x.globalAlpha = 0.5;
  x.shadowColor = 'rgba(0,0,0,0.55)'; x.shadowBlur = fs * 0.35;
  x.fillStyle = '#ffffff';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  [[pad, pad, 45], [w - pad, pad, -45], [pad, h - pad, -45], [w - pad, h - pad, 45]].forEach(([cx, cy, deg]) => {
    x.save(); x.translate(cx, cy); x.rotate(deg * Math.PI / 180); x.fillText('BUYBACK.AD', 0, 0); x.restore();
  });
  x.restore();
}

// ── renderer ───────────────────────────────────────────────────────────────
class VideoRenderer {
  constructor(W, H, ad, len, opts){
    this.W = W; this.H = H; this.opts = opts || {};
    this.cv = mk(W, H);
    this.x = this.cv.getContext('2d', { willReadFrequently: !!this.opts.readback });
    this.mult = W / canvas.width;              // same multiplier snapshotPng() passes to toDataURL
    this.k = W / CW;                           // document units → output pixels
    this.U = Math.min(W, H) / 1080;
    const vis = canvas.getObjects().filter(o => o.visible !== false);
    this.bgi = canvas.backgroundImage || null;
    this.product = pickProduct(vis);
    this.phoneObj = pickPhoneObj(vis);
    this.base = new Map();
    [this.bgi, this.product, this.phoneObj].forEach(o => {
      if (!o || this.base.has(o)) return;
      this.base.set(o, { left:o.left, top:o.top, scaleX:o.scaleX, scaleY:o.scaleY, angle:o.angle,
        opacity:o.opacity, visible:o.visible, c:o.getCenterPoint() });
    });
    this.ground = null;
    this.ad = ad; this.tl = timeline(len);
  }

  async ready(){
    const fam = this.ad.font;
    await Promise.all(['700 100px "' + fam + '"', '900 100px "Satoshi"', '700 100px "Satoshi"']
      .map(f => document.fonts.load(f).catch(() => null)));
    if (!this.ground) this.buildGround(0.012);
    this.setAd(this.ad, this.tl.len);
    this.harden();
    return this;
  }
  /* Fix what can be fixed automatically, on measured contrast: a line that is
     hard to read gets a darker backdrop (down to a floor), an accent that
     cannot hold 3:1 becomes white. Whatever still fails is left for
     selfAudit() to report, and the export is refused. */
  harden(){
    for (let pass = 0; pass < 4; pass++){
      const bad = this.measure().filter(p => p.rule === 'contrast');
      if (!bad.length) return;
      if (bad.some(p => p.accent) && this.accent !== '#ffffff'){ this.ad = Object.assign({}, this.ad, { accent: '#ffffff' }); this.setAd(this.ad, this.tl.len); continue; }
      if (this.groundTarget > 0.002){ this.buildGround(this.groundTarget / 2.5); this.setAd(this.ad, this.tl.len); continue; }
      return;
    }
  }

  setAd(ad, len){
    this.ad = ad;
    this.tl = timeline(len);
    this.priceStr = up(ad.price);
    this.priceNum = PRICE_RE.test(this.priceStr) && this.priceStr.replace(PRICE_RE, '') === '';
    // the accent must hold 3:1 as large text on the ground actually measured
    let acc = ad.accent || '#ffffff';
    const a = rgbOf(acc);
    if (!a || contrastL(lumOf(a), this.groundLum || 0.012) < 3) acc = '#ffffff';
    this.accent = acc; this.ink = inkOn(acc);
    this.lay = this.layout();
    this.kf = this.keyframes();
    this._sweep = null;
  }

  /* Release the frame-sized canvases now instead of whenever GC gets to them:
     a 1080×1920 renderer holds five or six of them, and a panel rebuilt on
     every keystroke otherwise piles them up (measured: the library audit's
     renderer crashed out of memory after 28 templates). */
  dispose(){
    ['cv', 'ground', '_blur', '_still', '_mask', '_sweep'].forEach(k => { const c = this[k]; if (c){ c.width = 0; c.height = 0; } this[k] = null; });
  }

  // ── fabric: render the live objects exactly as toCanvasElement() does ──
  fabricInto(ctx, objects, noBackground){
    const c = canvas, vp = c.viewportTransform, m = this.mult, z = c.getZoom() * m;
    const keep = { w:c.width, h:c.height, vp, retina:c.enableRetinaScaling, inter:c.interactive,
      top:c.contextTop, skip:c.skipOffscreen, bgc:c.backgroundColor, bgi:c.backgroundImage };
    c.contextTop = null; c.enableRetinaScaling = false; c.interactive = false; c.skipOffscreen = false;
    if (noBackground){ c.backgroundColor = ''; c.backgroundImage = null; }
    c.viewportTransform = [z, 0, 0, z, vp[4] * m, vp[5] * m];
    c.width = this.W; c.height = this.H;
    c.calcViewportBoundaries();
    try { c.renderCanvas(ctx, objects || c._objects); }
    finally {
      c.viewportTransform = keep.vp; c.width = keep.w; c.height = keep.h;
      c.enableRetinaScaling = keep.retina; c.interactive = keep.inter; c.contextTop = keep.top;
      c.skipOffscreen = keep.skip; c.backgroundColor = keep.bgc; c.backgroundImage = keep.bgi;
      c.calcViewportBoundaries();
    }
  }
  xf(o, s, dx, dy){
    // an identity move is skipped outright: a round trip through
    // setPositionByOrigin can shift left/top by a rounding error, and frame 0
    // must be bit-identical to the still
    if (s === 1 && !dx && !dy) return;
    const b = this.base.get(o);
    o.set({ scaleX: b.scaleX * s, scaleY: b.scaleY * s });
    o.setPositionByOrigin(new fabric.Point(b.c.x + dx, b.c.y + dy), 'center', 'center');
  }
  restoreAll(){
    this.base.forEach((b, o) => o.set({ left:b.left, top:b.top, scaleX:b.scaleX, scaleY:b.scaleY,
      angle:b.angle, opacity:b.opacity, visible:b.visible }));
  }

  /* The scene ground: the template's own backdrop (photo, gradient, scrim),
     blurred and darkened until its mean luminance is measured at or below the
     target. Measured, not assumed: a pale STREET backdrop needs far more
     darkening than a night photo to carry white type. */
  buildGround(target){
    const { W, H, U } = this;
    this.groundTarget = target;
    // the blurred backdrop is made once; hardening only re-darkens it
    if (!this._blur){
      const g = mk(W, H), gx = g.getContext('2d');
      const hid = [];
      canvas.getObjects().forEach(o => { if (o.visible !== false && !isGround(o)){ hid.push(o); o.visible = false; } });
      try { this.fabricInto(gx); } finally { hid.forEach(o => { o.visible = true; }); }
      const bl = mk(W, H), lx = bl.getContext('2d');
      const over = 60 * U;
      lx.fillStyle = '#101014'; lx.fillRect(0, 0, W, H);
      if ('filter' in lx){
        lx.filter = 'blur(' + Math.round(34 * U) + 'px) saturate(1.15)';
        lx.drawImage(g, -over, -over, W + 2 * over, H + 2 * over);
        lx.filter = 'none';
      } else {
        const sm = mk(W / 24, H / 24);
        sm.getContext('2d').drawImage(g, 0, 0, sm.width, sm.height);
        lx.imageSmoothingQuality = 'high';
        lx.drawImage(sm, -over, -over, W + 2 * over, H + 2 * over);
      }
      this._blur = bl;
    }
    const probe = mk(36, Math.max(8, Math.round(36 * H / W))), px = probe.getContext('2d', { willReadFrequently: true });
    const meanLum = a => {
      px.drawImage(this._blur, 0, 0, probe.width, probe.height);
      px.fillStyle = 'rgba(8,8,11,' + a + ')'; px.fillRect(0, 0, probe.width, probe.height);
      const d = px.getImageData(0, 0, probe.width, probe.height).data;
      let s = 0;
      for (let i = 0; i < d.length; i += 4) s += lumOf([d[i], d[i + 1], d[i + 2]]);
      return s / (d.length / 4);
    };
    // darken until the MEASURED mean luminance is at or under the target
    let a = 0.5, L = meanLum(a);
    while (L > target && a < 0.96){ a = Math.min(0.96, a + 0.04); L = meanLum(a); }
    const b = this.ground || mk(W, H), bx = b.getContext('2d');
    bx.globalCompositeOperation = 'copy'; bx.drawImage(this._blur, 0, 0); bx.globalCompositeOperation = 'source-over';
    bx.fillStyle = 'rgba(8,8,11,' + a + ')'; bx.fillRect(0, 0, W, H);
    const v = bx.createLinearGradient(0, 0, 0, H);
    v.addColorStop(0, 'rgba(0,0,0,0.28)'); v.addColorStop(0.35, 'rgba(0,0,0,0)');
    v.addColorStop(0.7, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.38)');
    bx.fillStyle = v; bx.fillRect(0, 0, W, H);
    this.ground = b; this.groundLum = L; this.groundAlpha = a;
  }

  // ── layout, in output pixels ──
  layout(){
    const { W, H, U } = this;
    const story = H / W >= 1.7, wide = W / H > 1.3;
    /* 9:16 uses the combined safe box from research §7.3 — Reels top 14%,
       bottom 35%, left 6%; TikTok right 140 px — so no platform UI covers the
       price or the number. Other formats keep a 7% margin. */
    const box = story ? { x0: W * 65 / 1080, x1: W * 940 / 1080, y0: H * 269 / 1920, y1: H * 1248 / 1920 }
      : (m => ({ x0: m, x1: W - m, y0: m, y1: H - m }))(Math.min(W, H) * 0.07);
    const barH = 128 * U;
    const bw = wide ? Math.min(box.x1 - box.x0, 860 * U) : box.x1 - box.x0;
    const bar = { x: (box.x0 + box.x1) / 2 - bw / 2, y: box.y1 - barH, w: bw, h: barH, r: 24 * U };
    const area = { x0: box.x0, x1: box.x1, y0: box.y0, y1: bar.y - 30 * U };
    const aw = area.x1 - area.x0;
    const cols = wide ? {
      prod: { x0: area.x0, x1: area.x0 + aw * 0.42, y0: area.y0, y1: area.y1 },
      text: { x0: area.x0 + aw * 0.47, x1: area.x1, y0: area.y0, y1: area.y1 },
    } : null;
    return { story, wide, box, bar, area, cols,
      price: this.layPrice(area, cols), steps: this.laySteps(area, cols), proof: this.layProof(area, cols) };
  }
  layPrice(area, cols){
    const { U, x, ad } = this, F = ad.font;
    const col = cols ? cols.text : area;
    const cw = col.x1 - col.x0, ch = col.y1 - col.y0, cx = (col.x0 + col.x1) / 2;
    const hasProd = !!this.product && !cols;
    // stacked on MEASURED glyph bounds: a "$" rises above cap height and a
    // comma drops below the baseline, and ratios of the font size miss both
    const M = (s, w, size, fam, trk) => { setFont(x, w, size, fam, trk); const m = x.measureText(s); return { a: m.actualBoundingBoxAscent, d: m.actualBoundingBoxDescent }; };
    const build = k => {
      const L = { g: 24 * U * k, items: [] };
      const add = (key, s, w, size, fam, trk, gapAfter) => {
        if (!s || !size) return;
        const m = M(s, w, size, fam, trk);
        L.items.push({ key, size, a: m.a, d: m.d, gap: gapAfter });
      };
      if (ad.name) add('name', ad.name, 700, fitSize(x, ad.name, 700, 30 * U * k, 'Satoshi', cw, 0.14), 'Satoshi', 0.14, L.g * 0.5);
      add('kicker', up(ad.kicker), 900, fitSize(x, up(ad.kicker), 900, 56 * U * k, 'Satoshi', cw, 0.08), 'Satoshi', 0.08, L.g);
      L.prodAt = L.items.length;
      if (ad.lead) add('lead', up(ad.lead), 900, fitSize(x, up(ad.lead), 900, 36 * U * k, 'Satoshi', cw, 0.16), 'Satoshi', 0.16, L.g * 0.6);
      const base = (this.priceNum ? 250 : 140) * U * k;
      setFont(x, 700, base, F, 0);
      L.lines = this.priceStr ? (this.priceNum ? [this.priceStr] : wrap2(x, this.priceStr, cw * 0.94)) : [];
      if (L.lines.length){
        const ps = L.lines.reduce((m, l) => Math.min(m, fitSize(x, l, 700, base, F, cw * 0.94, 0)), Infinity);
        const ms = L.lines.map(l => M(l, 700, ps, F, 0));
        L.items.push({ key: 'price', size: ps, a: ms[0].a, d: ms[ms.length - 1].d + (L.lines.length - 1) * ps * 1.02, gap: L.g * 0.7, step: ps * 1.02 });
      }
      if (ad.qualifier) add('qual', up(ad.qualifier), 700, fitSize(x, up(ad.qualifier), 700, 42 * U * k, 'Satoshi', cw, 0.04), 'Satoshi', 0.04, 0);
      L.h = L.items.reduce((h, it, i) => h + it.a + it.d + (i < L.items.length - 1 ? it.gap : 0), 0);
      return L;
    };
    let L = build(1);
    const prodMin = hasProd ? ch * 0.24 : 0;
    if (L.h + prodMin + (hasProd ? L.g : 0) > ch) L = build(Math.max(0.45, (ch - prodMin - L.g) / L.h));
    const prodH = hasProd ? Math.max(prodMin, Math.min(ch * 0.46, ch - L.h - L.g)) : 0;
    const total = L.h + (prodH ? prodH + L.g : 0);
    let y = col.y0 + Math.max(0, (ch - total) / 2);
    const o = { cx, cw };
    L.items.forEach((it, i) => {
      if (i === L.prodAt && prodH){ o.prod = { x0: cx - cw * 0.42, x1: cx + cw * 0.42, y0: y, y1: y + prodH }; y += prodH + L.g; }
      if (it.key === 'price') o.price = { lines: L.lines, size: it.size, base: y + it.a, step: it.step };
      else o[it.key] = { base: y + it.a, size: it.size };
      y += it.a + it.d + it.gap;
    });
    if (prodH && !o.prod) o.prod = { x0: cx - cw * 0.42, x1: cx + cw * 0.42, y0: y, y1: y + prodH };
    if (cols && this.product){ const p = cols.prod, i = (p.x1 - p.x0) * 0.06; o.prod = { x0: p.x0 + i, x1: p.x1 - i, y0: p.y0 + i, y1: p.y1 - i }; }
    return o;
  }
  laySteps(area, cols){
    const { U, x, ad } = this, F = ad.font;
    const col = cols ? cols.text : area;
    const cw = col.x1 - col.x0, ch = col.y1 - col.y0, cx = (col.x0 + col.x1) / 2;
    const labels = ad.steps.map(up).filter(Boolean).slice(0, 3);
    const hasProd = !!this.product && !cols;
    const build = s => {
      const L = { g: 26 * U * s, disc: 92 * U * s, gap: 30 * U * s, rowGap: 30 * U * s };
      L.titleS = 34 * U * s;
      L.labelS = labels.reduce((m, l) => Math.min(m, fitSize(x, l, 700, 62 * U * s, F, cw - L.disc - L.gap, 0.01)), 62 * U * s);
      L.rowH = Math.max(L.disc, L.labelS * 1.1);
      L.h = L.titleS * 1.2 + L.g + labels.length * L.rowH + Math.max(0, labels.length - 1) * L.rowGap;
      return L;
    };
    let L = build(1);
    const prodMin = hasProd ? ch * 0.2 : 0;
    if (L.h + prodMin + (hasProd ? L.g : 0) > ch) L = build(Math.max(0.45, (ch - prodMin - L.g) / L.h));
    const prodH = hasProd ? Math.max(prodMin, Math.min(ch * 0.28, ch - L.h - L.g)) : 0;
    const total = L.h + (prodH ? prodH + L.g : 0);
    let y = col.y0 + Math.max(0, (ch - total) / 2);
    const o = { cx };
    if (prodH){ o.prod = { x0: cx - cw * 0.32, x1: cx + cw * 0.32, y0: y, y1: y + prodH }; y += prodH + L.g; }
    o.title = { base: y + L.titleS * 0.85, size: L.titleS }; y += L.titleS * 1.2 + L.g;
    setFont(x, 700, L.labelS, F, 0.01);
    const lw = labels.reduce((m, l) => Math.max(m, x.measureText(l).width), 0);
    const gx = cx - (L.disc + L.gap + lw) / 2;
    o.rows = labels.map((t, i) => ({ text: t, cy: y + L.rowH / 2 + i * (L.rowH + L.rowGap),
      dx: gx, disc: L.disc, lx: gx + L.disc + L.gap, size: L.labelS }));
    if (cols && this.product){ const p = cols.prod, i = (p.x1 - p.x0) * 0.06; o.prod = { x0: p.x0 + i, x1: p.x1 - i, y0: p.y0 + i, y1: p.y1 - i }; }
    return o;
  }
  layProof(area, cols){
    const { U, x, ad } = this;
    const col = cols ? cols.text : area;
    const cw = col.x1 - col.x0, ch = col.y1 - col.y0, cx = (col.x0 + col.x1) / 2;
    const lines = (ad.proof || []).map(up).filter(Boolean).slice(0, 3);
    const photo = this.opts.photo || null;
    const hasPhoto = !!photo && !cols, hasProd = !photo && !!this.product && !cols;
    const build = s => {
      const L = { g: 26 * U * s, check: 64 * U * s, gap: 26 * U * s, rowGap: 24 * U * s };
      L.titleS = fitSize(x, up(ad.proofTitle), 900, 34 * U * s, 'Satoshi', cw, 0.18);
      L.labelS = lines.reduce((m, l) => Math.min(m, fitSize(x, l, 900, 46 * U * s, 'Satoshi', cw - L.check - L.gap, 0.03)), 46 * U * s);
      L.rowH = Math.max(L.check, L.labelS * 1.15);
      L.h = L.titleS * 1.2 + L.g + lines.length * L.rowH + Math.max(0, lines.length - 1) * L.rowGap;
      return L;
    };
    let L = build(1);
    const topMin = hasPhoto ? ch * 0.34 : hasProd ? ch * 0.2 : 0;
    if (L.h + topMin + (topMin ? L.g : 0) > ch) L = build(Math.max(0.45, (ch - topMin - L.g) / L.h));
    const topH = topMin ? Math.max(topMin, Math.min(hasPhoto ? ch * 0.46 : ch * 0.28, ch - L.h - L.g)) : 0;
    const total = L.h + (topH ? topH + L.g : 0);
    let y = col.y0 + Math.max(0, (ch - total) / 2);
    const o = { cx };
    if (topH){
      const w = hasPhoto ? Math.min(cw, topH * 1.25) : cw * 0.64;
      const r = { x0: cx - w / 2, x1: cx + w / 2, y0: y, y1: y + topH };
      if (hasPhoto) o.photo = r; else o.prod = r;
      y += topH + L.g;
    }
    o.title = { base: y + L.titleS * 0.85, size: L.titleS }; y += L.titleS * 1.2 + L.g;
    setFont(x, 900, L.labelS, 'Satoshi', 0.03);
    const lw = lines.reduce((m, l) => Math.max(m, x.measureText(l).width), 0);
    const gx = cx - (L.check + L.gap + lw) / 2;
    o.rows = lines.map((t, i) => ({ text: t, cy: y + L.rowH / 2 + i * (L.rowH + L.rowGap),
      dx: gx, check: L.check, lx: gx + L.check + L.gap, size: L.labelS }));
    if (cols){
      const p = cols.prod, i = (p.x1 - p.x0) * 0.06, r = { x0: p.x0 + i, x1: p.x1 - i, y0: p.y0 + i, y1: p.y1 - i };
      if (photo) o.photo = r; else if (this.product) o.prod = r;
    }
    return o;
  }

  // ── the product's path through the clip ──
  basePose(){
    const o = this.product, b = this.base.get(o), k = this.k, vp = canvas.viewportTransform, m = this.mult;
    const sh = o.shadow ? {
      color: o.shadow.color, blur: (o.shadow.blur || 0) * (Math.abs(b.scaleX) + Math.abs(b.scaleY)) / 2 * k,
      ox: (o.shadow.offsetX || 0) * Math.abs(b.scaleX) * k, oy: (o.shadow.offsetY || 0) * Math.abs(b.scaleY) * k } : null;
    return { x: b.c.x * k + vp[4] * m, y: b.c.y * k + vp[5] * m,
      w: o.width * Math.abs(b.scaleX) * k, h: o.height * Math.abs(b.scaleY) * k,
      r: (b.angle || 0) * Math.PI / 180, a: b.opacity == null ? 1 : b.opacity, s: 0, tsh: sh };
  }
  keyframes(){
    if (!this.product) return null;
    const B = this.basePose(), tl = this.tl, el = this.product.getElement();
    const ew = el.naturalWidth || el.width, eh = el.naturalHeight || el.height;
    const L = Object.assign({}, B, { w: B.w * 1.045, h: B.h * 1.045, y: B.y - 0.012 * this.H });
    const at = box => box ? Object.assign(containIn(ew, eh, box), { r: 0, a: 1, s: 1 }) : null;
    const lay = this.lay;
    const poses = { price: at(lay.price.prod), steps: at(lay.steps.prod), proof: at(lay.proof.prod) };
    let prev = L;
    const kf = [{ t: tl.tIn, p: L }];
    tl.scenes.forEach((sc, i) => {
      let p = poses[sc.id];
      if (!p) p = Object.assign({}, prev, { a: 0 });    // a scene with no room for it: fade out in place
      kf.push({ t: sc.a, p: prev }, { t: sc.a + (i ? MORPH_X : MORPH_IN), p });
      prev = p;
    });
    kf.push({ t: tl.ret, p: prev }, { t: tl.retEnd, p: B });
    return kf;
  }
  poseAt(t){
    const kf = this.kf;
    if (!kf) return null;
    if (t <= kf[0].t) return kf[0].p;
    for (let i = 0; i < kf.length - 1; i++){
      const a = kf[i], b = kf[i + 1];
      if (t < b.t){
        if (a.p === b.p || b.t <= a.t) return a.p;
        const p = inOut(seg(t, a.t, b.t));
        return { x: lerp(a.p.x, b.p.x, p), y: lerp(a.p.y, b.p.y, p), w: lerp(a.p.w, b.p.w, p), h: lerp(a.p.h, b.p.h, p),
          r: lerp(a.p.r, b.p.r, p), a: lerp(a.p.a, b.p.a, p), s: lerp(a.p.s, b.p.s, p), tsh: a.p.tsh || b.p.tsh };
      }
    }
    return kf[kf.length - 1].p;
  }

  bgScale(t){
    const tl = this.tl;
    return t < tl.ret ? 1 + 0.04 * (0.5 - 0.5 * Math.cos(Math.PI * seg(t, 0, tl.ret)))
                      : 1 + 0.04 * (1 - inOut(seg(t, tl.ret, tl.retEnd)));
  }
  groundMix(t){
    const tl = this.tl;
    return ENTER(seg(t, tl.tIn, tl.tIn + T_IN)) * (1 - inOut(seg(t, tl.ret, tl.retEnd)));
  }
  barMix(t){
    const tl = this.tl;
    return ENTER(seg(t, tl.tIn + 0.1, tl.tIn + 0.45)) * (1 - EXIT(seg(t, tl.ret, tl.ret + 0.3)));
  }

  // ── one frame ──
  renderAt(t){
    const { x, W, H, tl } = this;
    t = Math.max(0, Math.min(t, tl.dur));
    const inTemplate = t < tl.tIn || t >= tl.retEnd;
    const s = this.bgScale(t);
    x.save();
    // once the end card has settled every remaining frame is identical: draw it once
    const still = inTemplate && t >= tl.sweep + 0.6;
    this.unchanged = still && this._key === 'still' && !!this._still;
    this._key = still ? 'still' : t;
    if (still && this._still){
      x.clearRect(0, 0, W, H);
      x.drawImage(this._still, 0, 0);
    } else if (inTemplate){
      if (this.bgi) this.xf(this.bgi, s, 0, 0);
      if (this.product && t < tl.tIn){
        const e = ENTER(seg(t, 0, Math.min(WAKE, tl.tIn)));
        this.xf(this.product, 1 + 0.045 * e, 0, -0.012 * CH * e);
      }
      if (this.phoneObj && t >= tl.stamp){
        const k = 1 + 0.07 * bump(seg(t, tl.stamp, tl.stamp + 0.4));
        if (k !== 1) this.xf(this.phoneObj, k, 0, 0);
      }
      try {
        this.fabricInto(x);
        this.phoneSweep(t);
      } finally { this.restoreAll(); }
      if (still){ this._still = mk(W, H); this._still.getContext('2d').drawImage(this.cv, 0, 0); }
    } else {
      const ga = this.groundMix(t);
      if (ga < 0.999){
        if (this.bgi) this.xf(this.bgi, s, 0, 0);
        if (this.product) this.product.visible = false;
        try { this.fabricInto(x); } finally { this.restoreAll(); }
      } else {
        x.clearRect(0, 0, W, H);
      }
      if (ga > 0){
        const w = W * s, h = H * s;
        x.globalAlpha = ga;
        x.drawImage(this.ground, (W - w) / 2, (H - h) / 2, w, h);
        x.globalAlpha = 1;
      }
      this.drawProduct(t);
      tl.scenes.forEach((sc, i) => {
        const end = sc.b, last = i === tl.scenes.length - 1;
        if (t < sc.a || t > end + T_X) return;
        const o = EXIT(seg(t, end, end + (last ? 0.3 : T_X)));
        const alpha = 1 - o;
        if (alpha <= 0) return;
        const u = t - sc.a, dy = -24 * this.U * o;
        if (sc.id === 'price') this.scenePrice(u, alpha, dy, sc);
        else if (sc.id === 'steps') this.sceneSteps(u, alpha, dy, sc);
        else if (sc.id === 'proof') this.sceneProof(u, alpha, dy, sc);
      });
      this.drawBar(t);
    }
    x.restore();
    if (this.opts.watermark) drawWatermark(x, W, H);
  }

  drawProduct(t){
    const p = this.poseAt(t);
    if (!p || p.a <= 0.001) return;
    const { x, U } = this, o = this.product, el = o.getElement();
    /* A soft pool of the template's accent behind the hero, like a studio
       backdrop light. Behind the PRODUCT, never behind type (rule 3), and it
       rises with the move into the scene so frame 0 is untouched. */
    const lk = p.s * p.a;
    if (lk > 0.01){
      const c = rgbOf(this.accent) || [255, 255, 255], R = Math.max(p.w, p.h) * 0.72;
      const g = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, R);
      const rgba = a => 'rgba(' + c.join(',') + ',' + (a * lk).toFixed(3) + ')';
      g.addColorStop(0, rgba(0.26)); g.addColorStop(0.5, rgba(0.1)); g.addColorStop(1, rgba(0));
      x.save(); x.fillStyle = g; x.fillRect(p.x - R, p.y - R, 2 * R, 2 * R); x.restore();
    }
    x.save();
    x.globalAlpha = p.a;
    // shadow travels from the template's own (or none) to the scene's soft drop shadow
    const ts = p.tsh, s = p.s;
    const blur = lerp(ts ? ts.blur : 0, 46 * U, s), oy = lerp(ts ? ts.oy : 0, 22 * U, s), ox = lerp(ts ? ts.ox : 0, 0, s);
    x.shadowColor = (ts && s < 0.5) ? ts.color : 'rgba(0,0,0,' + (0.5 * (ts ? 1 : s)).toFixed(3) + ')';
    x.shadowBlur = blur; x.shadowOffsetX = ox; x.shadowOffsetY = oy;
    x.translate(p.x, p.y);
    x.rotate(p.r);
    if (o.flipX) x.scale(-1, 1);
    x.drawImage(el, -p.w / 2, -p.h / 2, p.w, p.h);
    recShape(x, 'product', -p.w / 2, -p.h / 2, p.w / 2, p.h / 2);
    x.restore();
    // one light sweep across the product once it has settled as the hero
    const tl = this.tl;
    const sp = seg(t, tl.tIn + MORPH_IN + 0.05, tl.tIn + MORPH_IN + 0.7);
    if (sp > 0 && sp < 1 && p.s >= 0.999) this.sweep(el, p, sp);
  }
  sweep(el, p, sp){
    const w = Math.ceil(p.w), h = Math.ceil(p.h);
    if (!this._sweep) this._sweep = mk(w, h);
    const c = this._sweep;
    if (c.width !== w || c.height !== h){ c.width = w; c.height = h; }
    const cx = c.getContext('2d');
    cx.globalCompositeOperation = 'source-over';
    cx.clearRect(0, 0, w, h);
    cx.drawImage(el, 0, 0, w, h);
    cx.globalCompositeOperation = 'source-in';
    const band = Math.max(w, h) * 0.22, pos = lerp(-band * 2, w + band * 2, ENTER(sp));
    const g = cx.createLinearGradient(pos - band, 0, pos + band, h * 0.35);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    cx.fillStyle = g; cx.fillRect(0, 0, w, h);
    const x = this.x;
    x.save();
    x.globalCompositeOperation = 'screen';
    x.globalAlpha = p.a;
    x.translate(p.x, p.y); x.rotate(p.r);
    if (this.product.flipX) x.scale(-1, 1);
    x.drawImage(c, -p.w / 2, -p.h / 2, p.w, p.h);
    x.restore();
  }
  /* End card: the phone number gets one stamp and one light pass, masked to
     its own glyphs, so the last thing that moves is the number to call. */
  phoneSweep(t){
    const tl = this.tl, o = this.phoneObj;
    const sp = seg(t, tl.sweep, tl.sweep + 0.6);
    if (!o || sp <= 0 || sp >= 1) return;
    const { W, H } = this;
    if (!this._mask) this._mask = mk(W, H);
    const m = this._mask, mx = m.getContext('2d');
    mx.globalCompositeOperation = 'source-over';
    this.fabricInto(mx, [o], true);
    const r = o.getBoundingRect(true, true), k = this.k;
    const x0 = r.left * k, x1 = (r.left + r.width) * k, band = (x1 - x0) * 0.2;
    const pos = lerp(x0 - band * 2, x1 + band * 2, ENTER(sp));
    mx.globalCompositeOperation = 'source-in';
    const g = mx.createLinearGradient(pos - band, 0, pos + band, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    mx.fillStyle = g; mx.fillRect(0, 0, W, H);
    this.x.save();
    this.x.globalCompositeOperation = 'screen';
    this.x.drawImage(m, 0, 0);
    this.x.restore();
  }

  // ── scenes ──
  sceneText(s, cx, base, o){
    const x = this.x;
    x.save();
    x.shadowColor = 'rgba(0,0,0,0.45)'; x.shadowBlur = 12 * this.U; x.shadowOffsetY = 2 * this.U;
    text(x, s, cx, base, o);
    x.restore();
  }
  scenePrice(u, A, dy){
    const L = this.lay.price, ad = this.ad, U = this.U, x = this.x, F = ad.font;
    const eK = ENTER(seg(u, 0.1, 0.5));
    if (L.name) this.sceneText(ad.name, L.cx, L.name.base + dy + (1 - eK) * 16 * U,
      { weight: 700, size: L.name.size, fam: 'Satoshi', trk: 0.14, color: '#ffffff', alpha: A * eK * 0.72 });
    this.sceneText(up(ad.kicker), L.cx, L.kicker.base + dy + (1 - eK) * 18 * U,
      { weight: 900, size: L.kicker.size, fam: 'Satoshi', trk: 0.08, color: '#ffffff', alpha: A * eK });
    // the qualifier arrives WITH the figure, never after it (OFT / ASA precedent)
    const eP = ENTER(seg(u, PRICE_AT, PRICE_AT + 0.4));
    if (L.lead) this.sceneText(up(ad.lead), L.cx, L.lead.base + dy + (1 - eP) * 14 * U,
      { weight: 900, size: L.lead.size, fam: 'Satoshi', trk: 0.16, color: '#ffffff', alpha: A * eP * 0.82 });
    if (L.qual) this.sceneText(up(ad.qualifier), L.cx, L.qual.base + dy + (1 - eP) * 14 * U,
      { weight: 700, size: L.qual.size, fam: 'Satoshi', trk: 0.04, color: '#ffffff', alpha: A * eP * 0.92 });
    if (!L.price) return;
    /* The figure cascades in, one character at a time, each rising from behind
       its own baseline, then lands with a single stamp. Each glyph region
       changes state once. A number that COUNTS UP swaps glyphs in place many
       times a second, which is what the flash check exists to catch. */
    const P = L.price, land = this.priceLand();
    const st = 1 + 0.06 * bump(seg(u, land, land + 0.3));
    x.save();
    x.globalAlpha = A;
    x.translate(L.cx, P.base - P.size * 0.36 + dy);
    x.scale(st, st);
    x.translate(-L.cx, -(P.base - P.size * 0.36));
    x.shadowColor = 'rgba(0,0,0,0.45)'; x.shadowBlur = 14 * U; x.shadowOffsetY = 3 * U;
    x.fillStyle = this.accent;
    x.textAlign = 'left'; x.textBaseline = 'alphabetic';
    setFont(x, 700, P.size, F, 0);
    const units = this.priceNum ? [...P.lines[0]] : null;
    P.lines.forEach((line, li) => {
      const base = P.base + li * P.step, w = x.measureText(line).width, x0 = L.cx - w / 2;
      recText(x, line, x0, base, P.size, this.accent, 1);
      if (NO_TEXT) return;
      x.save();
      // the clip's floor sits just under the line's own measured descent, so the
      // settled glyphs are whole and a rising glyph starts fully hidden
      const mt = x.measureText(line), asc = mt.actualBoundingBoxAscent, desc = mt.actualBoundingBoxDescent;
      const rise = asc + desc + 4 * this.U;
      x.beginPath(); x.rect(x0 - P.size, base - asc - P.size * 0.3, w + P.size * 2, asc + desc + P.size * 0.3 + 2 * this.U); x.clip();
      if (units){
        const n = units.length, stg = n > 1 ? Math.min(0.06, 0.42 / (n - 1)) : 0;
        units.forEach((ch, i) => {
          const e = ENTER(seg(u, PRICE_AT + 0.1 + i * stg, PRICE_AT + 0.1 + i * stg + 0.38));
          if (e <= 0) return;
          x.fillText(ch, x0 + x.measureText(line.slice(0, i)).width, base + (1 - e) * rise);
        });
      } else {
        const e = ENTER(seg(u, PRICE_AT + 0.1 + li * 0.12, PRICE_AT + 0.5 + li * 0.12));
        if (e > 0) x.fillText(line, x0, base + (1 - e) * rise);
      }
      x.restore();
    });
    x.restore();
  }
  priceLand(){
    if (this.priceNum){
      const n = [...this.priceStr].length, stg = n > 1 ? Math.min(0.06, 0.42 / (n - 1)) : 0;
      return PRICE_AT + 0.1 + (n - 1) * stg + 0.38;
    }
    return PRICE_AT + 0.5 + 0.12 * Math.max(0, ((this.lay && this.lay.price.price && this.lay.price.price.lines.length) || 1) - 1);
  }
  sceneSteps(u, A, dy){
    const L = this.lay.steps, U = this.U, x = this.x, F = this.ad.font;
    const eT = ENTER(seg(u, 0.05, 0.4));
    this.sceneText('HOW IT WORKS', L.cx, L.title.base + dy + (1 - eT) * 14 * U,
      { weight: 900, size: L.title.size, fam: 'Satoshi', trk: 0.18, color: '#ffffff', alpha: A * eT * 0.75 });
    L.rows.forEach((r, i) => {
      const o = 0.25 + 0.55 * i;
      const eD = seg(u, o, o + 0.35);
      if (eD > 0){
        const sc = 0.55 + 0.45 * outBack(eD), rad = r.disc / 2 * sc;
        x.save();
        x.globalAlpha = A * seg(u, o, o + 0.12);
        x.shadowColor = 'rgba(0,0,0,0.4)'; x.shadowBlur = 16 * U; x.shadowOffsetY = 4 * U;
        x.beginPath(); x.arc(r.dx + r.disc / 2, r.cy + dy, rad, 0, Math.PI * 2);
        x.fillStyle = this.accent; x.fill();
        recShape(x, 'disc', r.dx + r.disc / 2 - rad, r.cy + dy - rad, r.dx + r.disc / 2 + rad, r.cy + dy + rad);
        x.restore();
        text(x, String(i + 1), r.dx + r.disc / 2, r.cy + dy + r.disc * 0.19 * sc,
          { weight: 700, size: r.disc * 0.52 * sc, fam: F, color: this.ink, alpha: A * seg(u, o, o + 0.12) });
      }
      const eL = ENTER(seg(u, o + 0.08, o + 0.45));
      this.sceneText(r.text, r.lx + (1 - eL) * 28 * U, r.cy + dy + r.size * 0.36,
        { weight: 700, size: r.size, fam: F, trk: 0.01, color: '#ffffff', alpha: A * eL, align: 'left' });
    });
  }
  sceneProof(u, A, dy, sc){
    const L = this.lay.proof, U = this.U, x = this.x;
    const eT = ENTER(seg(u, 0.05, 0.4));
    if (L.photo && this.opts.photo){
      const r = L.photo, ph = this.opts.photo, e = ENTER(seg(u, 0.05, 0.5));
      const kb = 1 + 0.06 * seg(u, 0, sc.b - sc.a);        // slow push on the real photo
      const bw = r.x1 - r.x0, bh = r.y1 - r.y0, pw = ph.width, pH = ph.height;
      const s = Math.max(bw / pw, bh / pH) * kb;
      x.save();
      x.globalAlpha = A * e;
      x.translate(0, dy + (1 - e) * 20 * U);
      x.shadowColor = 'rgba(0,0,0,0.5)'; x.shadowBlur = 30 * U; x.shadowOffsetY = 12 * U;
      rrect(x, r.x0, r.y0, bw, bh, 26 * U); x.fillStyle = '#16161b'; x.fill();
      recShape(x, 'photo', r.x0, r.y0, r.x1, r.y1);
      x.shadowColor = 'transparent';
      rrect(x, r.x0, r.y0, bw, bh, 26 * U); x.clip();
      x.drawImage(ph, (r.x0 + r.x1) / 2 - pw * s / 2, (r.y0 + r.y1) / 2 - pH * s / 2, pw * s, pH * s);
      x.restore();
    }
    this.sceneText(up(this.ad.proofTitle), L.cx, L.title.base + dy + (1 - eT) * 14 * U,
      { weight: 900, size: L.title.size, fam: 'Satoshi', trk: 0.18, color: '#ffffff', alpha: A * eT * 0.75 });
    L.rows.forEach((r, i) => {
      const o = PROOF_AT + 0.5 * i;
      const eD = seg(u, o, o + 0.3), cxp = r.dx + r.check / 2, cyp = r.cy + dy;
      if (eD > 0){
        const rad = r.check / 2 * (0.6 + 0.4 * outBack(eD));
        x.save();
        x.globalAlpha = A * seg(u, o, o + 0.1);
        x.beginPath(); x.arc(cxp, cyp, rad, 0, Math.PI * 2);
        x.fillStyle = this.accent; x.fill();
        recShape(x, 'disc', cxp - rad, cyp - rad, cxp + rad, cyp + rad);
        // the tick draws itself on
        const p = seg(u, o + 0.08, o + 0.4), R = r.check / 2;
        const pts = [[-0.34 * R, 0.02 * R], [-0.08 * R, 0.28 * R], [0.38 * R, -0.26 * R]];
        const l1 = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]), l2 = Math.hypot(pts[2][0] - pts[1][0], pts[2][1] - pts[1][1]);
        let d = p * (l1 + l2);
        x.beginPath(); x.moveTo(cxp + pts[0][0], cyp + pts[0][1]);
        const q1 = Math.min(1, d / l1);
        x.lineTo(cxp + lerp(pts[0][0], pts[1][0], q1), cyp + lerp(pts[0][1], pts[1][1], q1));
        if (d > l1){ const q2 = Math.min(1, (d - l1) / l2); x.lineTo(cxp + lerp(pts[1][0], pts[2][0], q2), cyp + lerp(pts[1][1], pts[2][1], q2)); }
        x.lineWidth = R * 0.2; x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = this.ink;
        if (p > 0) x.stroke();
        x.restore();
      }
      const eL = ENTER(seg(u, o + 0.06, o + 0.42));
      this.sceneText(r.text, r.lx + (1 - eL) * 26 * U, r.cy + dy + r.size * 0.36,
        { weight: 900, size: r.size, fam: 'Satoshi', trk: 0.03, color: '#ffffff', alpha: A * eL, align: 'left' });
    });
  }
  drawBar(t){
    const a = this.barMix(t);
    if (a <= 0) return;
    const { x, U, ad } = this, b = this.lay.bar;
    const eIn = ENTER(seg(t, this.tl.tIn + 0.1, this.tl.tIn + 0.45));
    const dy = (1 - eIn) * 36 * U + EXIT(seg(t, this.tl.ret, this.tl.ret + 0.3)) * 20 * U;
    x.save();
    x.globalAlpha = a;
    x.translate(0, dy);
    x.shadowColor = 'rgba(0,0,0,0.45)'; x.shadowBlur = 24 * U; x.shadowOffsetY = 8 * U;
    rrect(x, b.x, b.y, b.w, b.h, b.r); x.fillStyle = this.accent; x.fill();
    recShape(x, 'bar', b.x, b.y, b.x + b.w, b.y + b.h);
    x.shadowColor = 'transparent';
    const cx = b.x + b.w / 2;
    if (ad.phone){
      const ls = fitSize(x, ad.ctaLabel, 900, 24 * U, 'Satoshi', b.w - 60 * U, 0.2);
      text(x, ad.ctaLabel, cx, b.y + 38 * U, { weight: 900, size: ls, fam: 'Satoshi', trk: 0.2, color: this.ink, alpha: 0.78 });
      const ps = fitSize(x, ad.phone, 700, 66 * U, ad.font, b.w - 60 * U, 0.02);
      text(x, ad.phone, cx, b.y + b.h - 26 * U, { weight: 700, size: ps, fam: ad.font, trk: 0.02, color: this.ink, alpha: 1 });
    } else {
      const ls = fitSize(x, ad.ctaLabel, 900, 52 * U, 'Satoshi', b.w - 60 * U, 0.08);
      text(x, ad.ctaLabel, cx, b.y + b.h / 2 + ls * 0.36, { weight: 900, size: ls, fam: 'Satoshi', trk: 0.08, color: this.ink, alpha: 1 });
    }
    x.restore();
  }

  // ── self-audit ──
  label(e){
    if (e.kind !== 'text') return { product: 'The product photo', photo: 'Your photo', bar: 'The phone bar', disc: 'A step marker' }[e.kind] || 'A shape';
    const ad = this.ad, s = e.s;
    const named = [[up(ad.kicker), 'What you buy'], [up(ad.lead), 'Lead'], [up(ad.qualifier), 'For what'], [ad.name, 'Business name'],
      [up(ad.proofTitle), 'The proof title'], ['HOW IT WORKS', 'The steps title'], [ad.phone, 'The phone number'], [ad.ctaLabel, 'The phone bar label']]
      .concat(ad.steps.map((v, i) => [up(v), 'Step ' + (i + 1)]), ad.proof.map((v, i) => [up(v), 'Reason ' + (i + 1)]));
    const hit = named.find(([v]) => v && v === s);
    if (hit) return hit[1];
    if (this.lay.price.price && this.lay.price.price.lines.includes(s)) return 'The price';
    return '“' + s + '”';
  }
  /* Measure every scene at a settled moment: record what is drawn, then draw
     the same frame without its text and read the backdrop under each line.
     Contrast: 4.5:1, or 3:1 for large type (≥ 52 px at 1080, about 18.7 CSS px
     bold on a 390 px-wide phone). Layout: inside the safe box, no two lines
     overlapping (measured against the smaller box, rule 35), nothing on the
     product or photo. Size: nothing under 22 px at 1080. */
  measure(){
    const { W, H, U, tl } = this, box = this.lay.box, out = [];
    const lumAt = (d, i) => 0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]);
    tl.scenes.forEach(sc => {
      const t = sc.b - 0.35;
      REC = [];
      let rec;
      try { this.renderAt(t); } finally { rec = REC; REC = null; }
      NO_TEXT = true;
      try { this.renderAt(t); } finally { NO_TEXT = false; }
      const d = this.x.getImageData(0, 0, W, H).data;
      const tol = 1.5 * U + 0.5;
      rec.forEach(e => {
        if (e.x0 < box.x0 - tol || e.y0 < box.y0 - tol || e.x1 > box.x1 + tol || e.y1 > box.y1 + tol)
          out.push({ rule: 'layout', msg: this.label(e) + ' runs outside the safe area. Shorten it.' });
      });
      const texts = rec.filter(e => e.kind === 'text' && e.x1 > e.x0 && e.y1 > e.y0);
      const area = b => Math.max(0, b.x1 - b.x0) * Math.max(0, b.y1 - b.y0);
      const inter = (a, b) => area({ x0: Math.max(a.x0, b.x0), y0: Math.max(a.y0, b.y0), x1: Math.min(a.x1, b.x1), y1: Math.min(a.y1, b.y1) });
      for (let i = 0; i < texts.length; i++){
        for (let j = i + 1; j < texts.length; j++){
          if (inter(texts[i], texts[j]) / Math.min(area(texts[i]), area(texts[j])) > 0.02)
            out.push({ rule: 'layout', msg: this.label(texts[i]) + ' and ' + this.label(texts[j]).toLowerCase() + ' overlap. Shorten one of them.' });
        }
        rec.filter(e => e.kind === 'product' || e.kind === 'photo').forEach(p => {
          if (inter(texts[i], p) / area(texts[i]) > 0.02) out.push({ rule: 'layout', msg: this.label(texts[i]) + ' runs into ' + this.label(p).toLowerCase() + '.' });
        });
        if (texts[i].size < 22 * U - 0.01) out.push({ rule: 'size', msg: this.label(texts[i]) + ' has to shrink too far to fit. Shorten it.' });
      }
      // contrast on the measured backdrop
      texts.forEach(e => {
        const x0 = Math.max(0, Math.floor(e.x0)), x1 = Math.min(W, Math.ceil(e.x1)), y0 = Math.max(0, Math.floor(e.y0)), y1 = Math.min(H, Math.ceil(e.y1));
        const step = Math.max(1, Math.round(2 * U));
        const L = [];
        for (let y = y0; y < y1; y += step) for (let x = x0; x < x1; x += step){ const i = (y * W + x) * 4; L.push([lumAt(d, i), i]); }
        if (!L.length) return;
        L.sort((a, b) => a[0] - b[0]);
        const ink = rgbOf(e.color) || [255, 255, 255], a = Math.min(1, e.alpha);
        const need = e.size >= 52 * U ? 3 : 4.5;
        let worst = Infinity;
        [L[Math.floor(L.length * 0.05)], L[Math.min(L.length - 1, Math.floor(L.length * 0.95))]].forEach(([, i]) => {
          const g = [d[i], d[i + 1], d[i + 2]], c = ink.map((v, k) => a * v + (1 - a) * g[k]);
          worst = Math.min(worst, contrastL(lumOf(c), lumOf(g)));
        });
        if (worst < need) out.push({ rule: 'contrast', accent: e.color === this.accent || e.color === this.ink, ratio: worst, need,
          msg: this.label(e) + ' is hard to read here (' + worst.toFixed(1) + ':1, needs ' + need + ':1).' });
      });
    });
    return out;
  }
  selfAudit(){
    const probs = [], ad = this.ad;
    // no number at all is the seller's call (some trade by DM): the bar then
    // carries their call to action, and the panel says so without refusing
    if (ad.phone){
      const share = this.phoneShare();
      if (share < 0.7) probs.push({ rule: 'V2', msg: 'Your number is only on screen ' + Math.round(share * 100) + '% of the time.' });
    }
    this.dwell().filter(d => !d.ok).forEach(d => probs.push({ rule: 'V3',
      msg: d.label + ' is too long to read in a ' + this.tl.len + ' s clip. Cut it to about ' + d.maxChars + ' characters, or pick a longer clip.' }));
    this.measure().forEach(p => probs.push(p));
    const seen = new Set();
    const problems = probs.filter(p => !seen.has(p.msg) && seen.add(p.msg));
    return { ok: !problems.length, problems };
  }
  /* Rule candidate V1 at export time: frame 0, rendered by this engine, against
     the PNG the Export button makes. Any differing byte refuses the export. */
  async frameZeroMatches(){
    const { W, H } = this, wm = this.opts.watermark;
    this.opts.watermark = false;
    try {
      this.renderAt(0);
      const a = this.x.getImageData(0, 0, W, H).data;
      const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = snapshotPng(W, 'png'); });
      if (im.width !== W || im.height !== H) return { ok: false, n: -1 };
      const c = mk(W, H), cx = c.getContext('2d', { willReadFrequently: true });
      cx.drawImage(im, 0, 0);
      const b = cx.getImageData(0, 0, W, H).data;
      let n = 0;
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++;
      return { ok: n === 0, n };
    } finally { this.opts.watermark = wm; }
  }

  // ── measurements the panel and the audit read ──
  /* Rule candidate V3: every text beat stays up long enough to read.
     need = max(1.2 s, characters ÷ 15 + 0.5 s) — BBC subtitle pace with
     headroom, because a scroller is not primed to read. */
  dwell(){
    const tl = this.tl, ad = this.ad, out = [];
    const sc = id => tl.scenes.find(s => s.id === id);
    const p = sc('price');
    out.push({ field: 'kicker', label: 'What you buy', text: ad.kicker, onset: p.a + 0.1, end: p.b });
    if (ad.qualifier) out.push({ field: 'qual', label: 'For what', text: ad.qualifier, onset: p.a + PRICE_AT, end: p.b });
    if (ad.price) out.push({ field: 'price', label: 'Price', text: (ad.lead ? ad.lead + ' ' : '') + ad.price, onset: p.a + PRICE_AT, end: p.b });
    const st = sc('steps');
    if (st) ad.steps.forEach((s, i) => s && out.push({ field: 'step' + (i + 1), label: 'Step ' + (i + 1), text: s, onset: st.a + 0.25 + 0.55 * i, end: st.b }));
    const pr = sc('proof');
    if (pr) ad.proof.forEach((s, i) => s && out.push({ field: 'proof' + (i + 1), label: 'Reason ' + (i + 1), text: s, onset: pr.a + PROOF_AT + 0.5 * i, end: pr.b }));
    return out.map(d => {
      const n = [...up(d.text)].length, need = Math.max(1.2, n / 15 + 0.5), have = d.end - d.onset;
      return Object.assign(d, { need, have, ok: have + 1e-6 >= need, maxChars: Math.max(0, Math.floor((have - 0.5) * 15)) });
    });
  }
  /* Rule candidate V2: share of frames where the number is on screen. */
  phoneShare(){
    if (!this.ad.phone) return 0;
    const tl = this.tl, n = Math.round(tl.dur * FPS);
    let on = 0;
    for (let i = 0; i < n; i++){
      const t = i / FPS;
      const inTemplate = t < tl.tIn || t >= tl.retEnd;
      if ((inTemplate || this.groundMix(t) < 0.5) ? !!this.phoneObj : this.barMix(t) >= 0.5) on++;
    }
    return on / n;
  }
  cues(){
    const tl = this.tl, c = [{ t: tl.tIn, k: 'whoosh' }];
    tl.scenes.forEach((sc, i) => {
      if (i) c.push({ t: sc.a, k: 'whoosh' });
      if (sc.id === 'price' && this.priceStr){
        if (this.priceNum){
          const n = [...this.priceStr].length, stg = n > 1 ? Math.min(0.06, 0.42 / (n - 1)) : 0;
          for (let j = 0; j < n; j++) c.push({ t: sc.a + PRICE_AT + 0.1 + j * stg + 0.16, k: 'tick' });
        }
        c.push({ t: sc.a + this.priceLand(), k: 'stamp' });
      }
      if (sc.id === 'steps') this.lay.steps.rows.forEach((r, j) => c.push({ t: sc.a + 0.25 + 0.55 * j, k: 'pluck', n: j }));
      if (sc.id === 'proof') this.lay.proof.rows.forEach((r, j) => c.push({ t: sc.a + PROOF_AT + 0.5 * j, k: 'pluck', n: j + 1 }));
    });
    c.push({ t: tl.ret, k: 'whoosh' }, { t: tl.stamp, k: 'stamp' });
    return c;
  }
}

// ── flash check (rule candidate V4) ────────────────────────────────────────
/* WCAG 2.3.1 "Three Flashes or Below Threshold", as an export gate.
   General flash: a pair of opposing relative-luminance changes of ≥ 0.10
   where the darker state is < 0.80. Red flash: opposing transitions of
   saturated red (R / (R+G+B) ≥ 0.8), measured as (R − G − B) × 320 changing
   by ≥ 20 — the Trace Center / PEAT formulation. A cell is hot when it makes
   more than six transitions (more than three flashes) inside any one second.
   The clip fails when hot cells cover more than 25% of any region one third
   of the frame wide and tall — W3C's 341×256 box on a 1024×768 screen, scaled
   to the frame. Luminance is averaged in LINEAR light per cell. */
class FlashCheck {
  constructor(W, H, fps){
    this.fps = fps || FPS;
    this.W = W; this.H = H;
    /* Cells of 1/36 of the short side, averaged in LINEAR light at full
       resolution. Measured: letting drawImage downscale first averages in
       gamma space and misread cell luminance by up to 0.29 — three times the
       0.10 flash threshold — on type edges. Full resolution is exact. */
    const cell = Math.max(1, Math.round(Math.min(W, H) / 36));
    this.cell = cell; this.gw = Math.ceil(W / cell); this.gh = Math.ceil(H / cell);
    const n = this.gw * this.gh;
    this.col = new Uint16Array(W).map((_, x) => Math.floor(x / cell));
    const state = () => ({ init: new Uint8Array(n), ext: new Float32Array(n), dir: new Int8Array(n), tr: Array.from({ length: n }, () => []) });
    this.g = state(); this.r = state();
    this.frame = 0;
    this.sumY = new Float64Array(n); this.sumR = new Float64Array(n); this.cnt = new Uint32Array(n);
    this.LUT = new Float32Array(256).map((_, i) => lin(i));
  }
  // unchanged: the caller knows this frame is identical to the last one, so it
  // cannot contain a transition; only the clock advances
  add(src, unchanged){
    if (unchanged && this.frame > 0){ this.frame++; return; }
    const { W, H, gw, cell, col, sumY, sumR, cnt, LUT } = this;
    const d = src.getContext('2d').getImageData(0, 0, W, H).data;
    sumY.fill(0); sumR.fill(0); cnt.fill(0);
    for (let y = 0, i = 0; y < H; y++){
      const row = Math.floor(y / cell) * gw;
      for (let x = 0; x < W; x++, i += 4){
        const R = LUT[d[i]], G = LUT[d[i + 1]], B = LUT[d[i + 2]], k = row + col[x];
        sumY[k] += 0.2126 * R + 0.7152 * G + 0.0722 * B;
        const t = R + G + B;
        if (t > 0 && R >= 0.8 * t) sumR[k] += (R - G - B) * 320;
        cnt[k]++;
      }
    }
    for (let k = 0; k < cnt.length; k++){
      if (!cnt[k]) continue;
      this.step(this.g, k, sumY[k] / cnt[k], 0.1, true);
      this.step(this.r, k, sumR[k] / cnt[k], 20, false);
    }
    this.frame++;
  }
  step(st, k, v, th, general){
    if (!st.init[k]){ st.init[k] = 1; st.ext[k] = v; return; }
    const e = st.ext[k], d = st.dir[k];
    const rec = () => { if (!general || Math.min(e, v) < 0.8) st.tr[k].push(this.frame); };
    if (d === 0){
      if (v - e >= th){ rec(); st.dir[k] = 1; st.ext[k] = v; }
      else if (e - v >= th){ rec(); st.dir[k] = -1; st.ext[k] = v; }
    } else if (d === 1){
      if (v > e) st.ext[k] = v;
      else if (e - v >= th){ rec(); st.dir[k] = -1; st.ext[k] = v; }
    } else {
      if (v < e) st.ext[k] = v;
      else if (v - e >= th){ rec(); st.dir[k] = 1; st.ext[k] = v; }
    }
  }
  judge(st){
    const { gw, gh } = this, win = this.fps, hot = new Uint8Array(gw * gh);
    let maxTr = 0;
    st.tr.forEach((ts, k) => {
      let m = 0;
      for (let j = 0, s = 0; j < ts.length; j++){ while (ts[j] - ts[s] >= win) s++; m = Math.max(m, j - s + 1); }
      maxTr = Math.max(maxTr, m);
      if (m >= 7) hot[k] = 1;
    });
    const rw = Math.max(1, Math.ceil(gw / 3)), rh = Math.max(1, Math.ceil(gh / 3));
    const P = new Uint32Array((gw + 1) * (gh + 1));
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++)
      P[(y + 1) * (gw + 1) + x + 1] = hot[y * gw + x] + P[y * (gw + 1) + x + 1] + P[(y + 1) * (gw + 1) + x] - P[y * (gw + 1) + x];
    let worst = 0;
    for (let y = 0; y + rh <= gh; y++) for (let x = 0; x + rw <= gw; x++){
      const s = P[(y + rh) * (gw + 1) + x + rw] - P[y * (gw + 1) + x + rw] - P[(y + rh) * (gw + 1) + x] + P[y * (gw + 1) + x];
      worst = Math.max(worst, s / (rw * rh));
    }
    return { maxFlashesPerSec: Math.floor(maxTr / 2), worstArea: worst };
  }
  result(){
    const g = this.judge(this.g), r = this.judge(this.r);
    return { pass: g.worstArea <= 0.25 && r.worstArea <= 0.25, general: g, red: r, frames: this.frame };
  }
}

// ── sound: soft ticks, stamps and whooshes, synthesised (no audio assets) ──
async function synth(cues, dur){
  const sr = 48000, ac = new OfflineAudioContext(2, Math.ceil(dur * sr), sr);
  const master = ac.createGain(); master.gain.value = 0.42;
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -18; comp.ratio.value = 4;
  master.connect(comp); comp.connect(ac.destination);
  const nb = ac.createBuffer(1, sr, sr), nd = nb.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  const noise = (t, len) => { const s = ac.createBufferSource(); s.buffer = nb; s.start(t, Math.random() * 0.5, len); return s; };
  const env = (g, t, peak, a, d) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
  const NOTES = [523.25, 659.25, 783.99, 1046.5];
  cues.forEach(c => {
    const t = Math.max(0, Math.min(dur - 0.5, c.t));
    if (c.k === 'tick'){
      const s = noise(t, 0.05), f = ac.createBiquadFilter(), g = ac.createGain();
      f.type = 'bandpass'; f.frequency.value = 3400; f.Q.value = 5;
      env(g, t, 0.35, 0.002, 0.03); s.connect(f); f.connect(g); g.connect(master);
    } else if (c.k === 'stamp'){
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.22);
      env(g, t, 0.9, 0.004, 0.3); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.4);
      const s = noise(t, 0.04), f = ac.createBiquadFilter(), g2 = ac.createGain();
      f.type = 'highpass'; f.frequency.value = 1800;
      env(g2, t, 0.18, 0.001, 0.025); s.connect(f); f.connect(g2); g2.connect(master);
    } else if (c.k === 'whoosh'){
      const s = noise(t, 0.45), f = ac.createBiquadFilter(), g = ac.createGain();
      f.type = 'bandpass'; f.Q.value = 0.9;
      f.frequency.setValueAtTime(320, t); f.frequency.exponentialRampToValueAtTime(2600, t + 0.36);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.14, t + 0.18); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
      s.connect(f); f.connect(g); g.connect(master);
    } else if (c.k === 'pluck'){
      const f0 = NOTES[(c.n || 0) % NOTES.length];
      [[f0, 'triangle', 0.22], [f0 * 2, 'sine', 0.06]].forEach(([fr, type, pk]) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = type; o.frequency.value = fr;
        env(g, t, pk, 0.005, 0.38); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.5);
      });
    }
  });
  return ac.startRendering();
}

// ── encoding ───────────────────────────────────────────────────────────────
/* WebCodecs through Mediabunny first: frames go in with explicit timestamps,
   so the clip is exact however long each frame takes to draw and whether or
   not the tab is visible. H.264 MP4 is the only format every surface accepts
   (Facebook does not list WebM). VP9/WebM only where the browser cannot
   encode H.264, and labelled. MediaRecorder is the last resort: it records in
   wall-clock time, so it pauses whenever the tab is hidden. */
async function pickPlan(W, H){
  const force = api.force;
  if (typeof VideoEncoder === 'function'){
    const MB = await loadMB();
    const opts = { width: W, height: H, frameRate: FPS };
    const tries = force ? [force] : [{ codec: 'avc', fmt: 'mp4', audio: 'aac' }, { codec: 'vp9', fmt: 'webm', audio: 'opus' }, { codec: 'vp8', fmt: 'webm', audio: 'opus' }];
    for (const p of tries){
      if (await MB.canEncodeVideo(p.codec, opts)){
        const audio = (p.audio && typeof AudioEncoder === 'function' && await MB.canEncodeAudio(p.audio, { numberOfChannels: 2, sampleRate: 48000 })) ? p.audio : null;
        return { kind: 'mb', codec: p.codec, fmt: p.fmt, audio };
      }
    }
  }
  if (typeof MediaRecorder === 'function' && HTMLCanvasElement.prototype.captureStream){
    const mime = ['video/mp4;codecs=avc1', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m));
    if (mime) return { kind: 'mr', mime, fmt: /mp4/.test(mime) ? 'mp4' : 'webm', codec: mime.split('codecs=')[1] || '', audio: null };
  }
  return null;
}
async function encode(r, plan, onProgress, cancelled){
  const fc = new FlashCheck(r.W, r.H, FPS);
  const n = Math.round(r.tl.dur * FPS);
  if (plan.kind === 'mb'){
    const MB = await loadMB();
    const format = plan.fmt === 'mp4' ? new MB.Mp4OutputFormat({ fastStart: 'in-memory' }) : new MB.WebMOutputFormat();
    const out = new MB.Output({ format, target: new MB.BufferTarget() });
    const vs = new MB.CanvasSource(r.cv, { codec: plan.codec, quality: MB.QUALITY_HIGH, keyFrameInterval: 1 });
    out.addVideoTrack(vs, { frameRate: FPS });
    let as = null;
    if (plan.audio && r.opts.sound){
      as = new MB.AudioBufferSource({ codec: plan.audio, quality: MB.QUALITY_HIGH });
      out.addAudioTrack(as);
    }
    await out.start();
    if (as) await as.add(await synth(r.cues(), r.tl.dur));
    for (let i = 0; i < n; i++){
      if (cancelled()){ await out.cancel(); return null; }
      r.renderAt(i / FPS);
      fc.add(r.cv, r.unchanged);
      await vs.add(i / FPS, 1 / FPS);
      onProgress(i + 1, n);
    }
    await out.finalize();
    return { blob: new Blob([out.target.buffer], { type: format.mimeType }), fmt: plan.fmt, codec: plan.codec,
      audio: !!as, flash: fc.result(), frames: n };
  }
  // MediaRecorder: real time, paused while hidden
  const stream = r.cv.captureStream(0), track = stream.getVideoTracks()[0];
  const rec = new MediaRecorder(stream, { mimeType: plan.mime, videoBitsPerSecond: 10e6 });
  const chunks = [];
  rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
  const stopped = new Promise(res => { rec.onstop = res; });
  rec.start();
  const sleep = ms => new Promise(res => setTimeout(res, ms));
  const visible = () => new Promise(res => { const f = () => { if (!document.hidden){ document.removeEventListener('visibilitychange', f); res(); } }; document.addEventListener('visibilitychange', f); f(); });
  let clock = performance.now();
  for (let i = 0; i < n; i++){
    if (cancelled()){ rec.stop(); await stopped; track.stop(); return null; }
    if (document.hidden){ rec.pause(); await visible(); rec.resume(); clock = performance.now() - i * 1000 / FPS; }
    r.renderAt(i / FPS);
    fc.add(r.cv, r.unchanged);
    track.requestFrame();
    onProgress(i + 1, n);
    const wait = clock + (i + 1) * 1000 / FPS - performance.now();
    if (wait > 0) await sleep(wait);
  }
  rec.stop(); await stopped; track.stop();
  return { blob: new Blob(chunks, { type: plan.mime.split(';')[0] }), fmt: plan.fmt, codec: plan.codec, audio: false, flash: fc.result(), frames: n };
}

// ── the panel ──────────────────────────────────────────────────────────────
const V = { len: 10, ad: null, prev: null, raf: 0, t0: 0, paused: false, busy: false, cancel: false, photo: null, token: 0, cover: null };
const FIELDS = { kicker: 'vid-kicker', lead: 'vid-lead', price: 'vid-price', qualifier: 'vid-qual' };

function previewSize(){
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const wide = CW > CH;
  const w = Math.round((wide ? 420 : 300) * dpr);
  return { w, h: Math.round(w * CH / CW) };
}
function fillForm(){
  const ad = V.ad;
  Object.keys(FIELDS).forEach(k => { $(FIELDS[k]).value = ad[k] || ''; });
  [1, 2, 3].forEach(i => { $('vid-step' + i).value = ad.steps[i - 1] || ''; $('vid-proof' + i).value = ad.proof[i - 1] || ''; });
  document.querySelectorAll('#vid-len-seg button').forEach(b => b.classList.toggle('active', +b.dataset.len === V.len));
  $('vid-proof-sec').hidden = V.len !== 15;
}
function readForm(){
  const ad = V.ad;
  Object.keys(FIELDS).forEach(k => { ad[k] = $(FIELDS[k]).value; });
  ad.steps = [1, 2, 3].map(i => $('vid-step' + i).value);
  ad.proof = [1, 2, 3].map(i => $('vid-proof' + i).value);
}
function warnings(r){
  const ad = V.ad, w = [];
  // what the export will refuse, measured on the preview's own frames
  const audit = r.selfAudit();
  if (!audit.ok) w.push('<b>Fix before downloading:</b> ' + audit.problems.map(p => escHtml(p.msg)).join(' '));
  if (/\bup\s*to\b/i.test([ad.lead, ad.price, ad.qualifier].join(' ')))
    w.push('“Up to” gets read as the price most sellers get: in an FTC study about half of people read it that way. If you can, quote a real price for a specific model, like “$640 · iPhone 15 Pro · unlocked”.');
  if (!ad.phone) w.push('No phone number found in your ad, so the bar shows “' + escHtml(ad.ctaLabel) + '” instead. Most buyers call or text: add your number in the editor if you take calls.');
  if (/diabetic\s*\?|need cash|short on cash|behind on|\bbills\b|in debt/i.test(JSON.stringify(ad)))
    w.push('Meta turns down boosted ads that point at someone’s health or money trouble (“Diabetic?”, “Behind on bills?”). Talk about the item instead.');
  $('vid-warn').innerHTML = w.map(s => '<p>' + s + '</p>').join('');
}
async function rebuildPreview(){
  const tok = ++V.token;
  const { w, h } = previewSize();
  const c = $('vid-preview');
  c.width = w; c.height = h;
  const r = new VideoRenderer(w, h, V.ad, V.len, { photo: V.photo, readback: true });
  await r.ready();
  if (tok !== V.token){ r.dispose(); return; }
  if (V.prev) V.prev.dispose();
  V.prev = r;
  warnings(r);
}
function tick(now){
  V.raf = requestAnimationFrame(tick);
  const r = V.prev;
  if (!r || V.busy) return;
  if (V.paused){ V.t0 = now - V.pt * 1000; return; }
  const t = ((now - V.t0) / 1000) % r.tl.dur;
  V.pt = t;
  r.renderAt(t);
  $('vid-preview').getContext('2d').drawImage(r.cv, 0, 0);
  $('vid-scrub-bar').style.width = (t / r.tl.dur * 100).toFixed(2) + '%';
}
function startPreview(){ cancelAnimationFrame(V.raf); V.t0 = performance.now(); V.pt = 0; V.raf = requestAnimationFrame(tick); }
function stopPreview(){ cancelAnimationFrame(V.raf); V.raf = 0; }

function status(msg, kind, pct){
  const s = $('vid-status');
  s.classList.add('show');
  s.dataset.kind = kind || '';
  $('vid-status-txt').innerHTML = msg;
  $('vid-bar-fill').style.width = (pct == null ? 0 : pct) + '%';
  s.querySelector('.vid-bar').hidden = pct == null;
}
function openVideo(){
  if (!canvas) return;
  canvas.discardActiveObject(); canvas.renderAll();
  $('export-overlay').classList.remove('show');
  V.ad = readAd(); V.photo = null; V.cover = null;
  $('vid-photo').value = '';
  fillForm();
  $('vid-status').classList.remove('show');
  $('vid-cover').hidden = true;
  $('video-overlay').classList.add('show');
  rebuildPreview().then(startPreview);
}
function closeVideo(){
  if (V.busy){ V.cancel = true; return; }
  stopPreview();
  if (V.prev) V.prev.dispose();
  V.prev = null;
  $('video-overlay').classList.remove('show');
  canvas.requestRenderAll();
}
async function exportVideo(){
  if (V.busy) return;
  readForm();
  const gate = await gateExport(MAX_SHORT);
  if (!gate) return;
  const d = exportDims(Math.min(gate.px, MAX_SHORT));
  const W = d.w - (d.w % 2), H = d.h - (d.h % 2);      // H.264 wants even dimensions
  V.busy = true; V.cancel = false;
  $('vid-export').disabled = true; $('vid-cancel').textContent = 'Stop';
  $('vid-cover').hidden = true;
  status('Preparing…', '', 0);
  let res = null, r = null, plan = null;
  try {
    plan = await pickPlan(W, H);
    if (!plan) throw new Error('This browser cannot make video files. Use a current Chrome, Edge or Safari.');
    r = new VideoRenderer(W, H, V.ad, V.len, { watermark: gate.watermark, sound: $('vid-sound').checked, photo: V.photo, readback: true });
    status('Checking the clip…', '', 0);
    await r.ready();
    // self-audit BEFORE any encoding: a clip that fails is never made
    const audit = r.selfAudit(), z = await r.frameZeroMatches();
    if (!z.ok) audit.problems.push({ rule: 'V1', msg: 'The first frame did not match your ad exactly, so the clip would open on something else.' });
    if (audit.problems.length){
      status('Not downloaded, and no export was used. ' + audit.problems.map(p => escHtml(p.msg)).join(' '), 'error');
      plan = null;
      return;
    }
    V.lastAudit = { phoneShare: r.phoneShare() };
    const hiddenNote = plan.kind === 'mr' ? ' · keep this tab open' : '';
    res = await encode(r, plan, (i, n) => status('Rendering frame ' + i + ' of ' + n + hiddenNote, '', i / n * 100), () => V.cancel);
    if (res){ r.renderAt(0); V.cover = r.cv.toDataURL('image/png'); }
  } catch (e){
    console.error('video export failed', e);
    status('Could not make the video: ' + escHtml(e.message || String(e)), 'error');
    res = null; plan = null;
  } finally {
    if (r) r.dispose();
    V.busy = false;
    $('vid-export').disabled = false; $('vid-cancel').textContent = 'Close';
    canvas.requestRenderAll();
  }
  if (!res){ if (plan) status('Stopped. Nothing was downloaded and no export was used.', ''); return; }
  const f = res.flash;
  if (!f.pass){
    status('Blocked: this clip flashes (up to ' + Math.max(f.general.maxFlashesPerSec, f.red.maxFlashesPerSec)
      + ' times a second across ' + Math.round(Math.max(f.general.worstArea, f.red.worstArea) * 100)
      + '% of an area). Flashing breaks WCAG 2.3.1 and Meta, Google and TikTok ad rules. Nothing was downloaded.', 'error');
    return;
  }
  try { await recordExport(); }
  catch (e){ status('The export could not be recorded: ' + escHtml(e.message), 'error'); return; }
  const base = (currentTplName || 'buyback-ad').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const name = base + '-' + W + 'x' + H + '-' + V.len + 's.' + res.fmt;
  const url = URL.createObjectURL(res.blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  const cover = $('vid-cover');
  cover.href = V.cover; cover.download = base + '-' + W + 'x' + H + '-cover.png'; cover.hidden = false;
  const kb = Math.round(res.blob.size / 1024);
  const webm = res.fmt === 'webm' ? ' This browser cannot encode MP4, so it is WebM: TikTok takes it, Facebook and Instagram need it converted first.' : '';
  status('Downloaded ' + escHtml(name) + ' (' + (kb > 1024 ? (kb / 1024).toFixed(1) + ' MB' : kb + ' KB') + ')'
    + (res.audio ? ' with sound' : '') + '. Self-check passed: opens and ends on your ad, number on screen '
    + Math.round(V.lastAudit.phoneShare * 100) + '% of the time, every line on long enough to read, contrast and layout measured, no flashing.' + webm, 'ok');
  startPreview();
}
function bindVideoUI(){
  const btn = $('ex-video');
  if (!btn) return;
  btn.onclick = openVideo;
  $('vid-cancel').onclick = closeVideo;
  $('vid-export').onclick = exportVideo;
  $('video-overlay').addEventListener('click', e => { if (e.target.id === 'video-overlay') closeVideo(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('video-overlay').classList.contains('show')) closeVideo(); });
  document.querySelectorAll('#vid-len-seg button').forEach(b => b.onclick = () => {
    if (V.busy) return;
    V.len = +b.dataset.len; readForm(); fillForm(); rebuildPreview().then(startPreview);
  });
  let deb = 0;
  document.querySelectorAll('#video-overlay .vid-form input[type=text]').forEach(inp => inp.addEventListener('input', () => {
    clearTimeout(deb);
    deb = setTimeout(() => { if (V.busy) return; readForm(); rebuildPreview(); }, 180);
  }));
  $('vid-photo').onchange = async e => {
    const f = e.target.files && e.target.files[0];
    V.photo = null;
    if (f){ try { V.photo = await createImageBitmap(f); } catch (err){ toast('That photo could not be read', 'error'); } }
    rebuildPreview();
  };
  $('vid-stage').onclick = () => { V.paused = !V.paused; $('vid-stage').classList.toggle('paused', V.paused); };
}

const api = { Renderer: VideoRenderer, FlashCheck, readAd, timeline, encode, pickPlan, synth, open: openVideo, FPS, force: null };
window.PGFXVideo = api;
bindVideoUI();
})();
