/* DEVICE WALLS — a wall of the thing we buy, as a background (2026-10-06).

   The lab's Set 9 (the 120 showcase grounds the owner reviewed) was drawn by
   engine/showcase.mjs: devices at one angle across the whole card, every
   screen carrying artwork from the card's own palette. "Drawn, not
   photographed, so the angle holds and the colours are ours." The lab is gone;
   the drawing is here, registered with the shared ground catalogue
   (grounds.js, GROUNDS.register) the way the video maker's scenes are
   (motion/photo-grounds.js), so a card stores a wall like any drawn ground
   ("ground:devIso/<c1>/<c2>/<accent>/<support>/<ink>/<seed>"), the studio
   thumbnails, edits, gates and exports it like any photograph, and it paints
   in the card's own colours: the screens walk the card's accent and support
   round the wheel (showcase.mjs spread()), the bodies take its ground.

   The engine draws SVG; a ground paints synchronously into a canvas. So a wall
   paints its ground colour at once, rasterises the SVG as an Image (the only
   way a browser turns SVG into pixels, and it is asynchronous), paints the
   result into the same canvas when it lands, and says so
   ("device-wall-ready"). app.js listens and refreshes the swatches and the
   preview. The raster is cached by wall, palette and seed, so every later
   paint of the same ground (the editor, the export, the video) is immediate. */
import { drawShowcase, themeOpts, LAYOUTS } from './engine/showcase.mjs';

const W = 1080, H = 1080;

/* One wall per arrangement the engine knows, each with the wallpaper family
   that reads best on it (a theme id is `<layout>-<family>`, showcase.mjs
   THEMES()). Keys are letters only: grounds.js parse() reads [A-Za-z]+. */
export const DEVICE_WALLS = [
  { key: 'devIso',     theme: 'iso-spectrum',     name: 'Isometric wall',  note: 'phones at one angle, running off every edge' },
  { key: 'devFamily',  theme: 'family-editorial', name: 'Family portrait', note: 'laptop centre, tablet left, phone right' },
  { key: 'devWall',    theme: 'wall-geometric',   name: 'Device wall',     note: 'mixed devices at assorted sizes' },
  { key: 'devTrio',    theme: 'trio-soft',        name: 'Three phones',    note: 'front on, the middle one lifted' },
  { key: 'devStack',   theme: 'stack-technical',  name: 'Stack',           note: 'the whole family by size, big at the back' },
  { key: 'devFan',     theme: 'fan-arcs',         name: 'Fan',             note: 'phones fanned like a hand of cards' },
  { key: 'devCascade', theme: 'cascade-flat',     name: 'Cascade',         note: 'a diagonal, each step smaller and lower' },
  { key: 'devOrbit',   theme: 'orbit-optical',    name: 'Orbit',           note: 'a ring of phones round one in the middle' },
  { key: 'devRing',    theme: 'ring-wire',        name: 'Ring',            note: 'mixed devices round an open middle' },
  { key: 'devHalo',    theme: 'halo-assorted',    name: 'Halo',            note: 'two rings turning opposite ways, bled off the edges' },
  { key: 'devColumn',  theme: 'column-spectrum',  name: 'Column',          note: 'one tall strip of screens' },
];

/* ── colour ──────────────────────────────────────────────────────────────── */
const hex = h => { let t = String(h || '').replace('#', ''); if (t.length === 3) t = t.split('').map(c => c + c).join('');
  return /^[0-9a-f]{6}$/i.test(t) ? '#' + t.toLowerCase() : null; };
const rgb = h => [0, 2, 4].map(i => parseInt(hex(h).slice(1 + i, 3 + i), 16));
const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return '#' + [0, 1, 2].map(i => Math.round(A[i] + (B[i] - A[i]) * t).toString(16).padStart(2, '0')).join(''); };
const lum = h => { const [r, g, b] = rgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * r + .7152 * g + .0722 * b; };

/** The engine's palette record (spec/palettes.json's eight roles) from a
    ground palette (grounds.js P: c1, c2, accent, support, ink). The three
    roles a card does not carry are derived the way the records relate them:
    body a quieter ink, paper a near-white tint of the ground, dark its deep
    shade (jw07: ground #054e2f, body #9ab8a9, paper #f4f8f6, dark #032315). */
export function enginePalette(P) {
  const ground = hex(P.c1) || '#14161c', ground2 = hex(P.c2) || ground;
  const ink = hex(P.ink) || (lum(ground) < .4 ? '#f4f6f8' : '#14161c');
  const accent = hex(P.accent) || ink, hot = hex(P.support) || accent;
  return { ground, ground2, ink, accent, hot,
    body: mix(ink, ground, .3),
    paper: mix(ground, '#ffffff', .93),
    dark: mix(ground, '#000000', lum(ground) < .3 ? .55 : .78) };
}

/* ── the engine's random and card context, the parts the showcase reads ──── */
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function RNG(seed) { const r = mulberry32(seed); return {
  f: (a = 0, b = 1) => a + (b - a) * r(), i: (a, b) => Math.floor(a + (b - a + 1) * r()),
  pick: a => a[Math.floor(r() * a.length)], chance: p => r() < p,
  shuffle: a => { const c = a.slice(); for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; } return c; } }; }
function card(P, seed) {
  const c = { W, H, P, R: RNG(seed), F: { body: 'sans-serif' }, key: 'dw', uid: 0, seq: 0, defs: [], layers: [], nodes: [] };
  c.id = p => p + (c.uid++) + c.key;
  c.def = d => { c.defs.push(d); };
  c.add = (m, n, z) => { c.layers.push({ m, z: z === undefined ? 0 : z, i: c.seq++ }); };
  return c;
}

/** The wall as a complete SVG document, 1080 square, at full strength (the
    studio's own gate shades a line where it needs it, as on a photograph). */
export function deviceWallSvg(key, P, seed = 3) {
  const spec = DEVICE_WALLS.find(s => s.key === key);
  if (!spec) return null;
  const EP = enginePalette(P), c = card(EP, seed);
  drawShowcase(c, { x: 0, y: 0, w: W, h: H }, { ...themeOpts(spec.theme, EP), fade: 1 });
  const body = c.layers.sort((a, b) => a.z - b.z || a.i - b.i).map(l => l.m).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
    `<defs>${c.defs.join('')}</defs><rect width="${W}" height="${H}" fill="${EP.ground}"/>${body}</svg>`;
}

/* ── painting into a ground canvas ───────────────────────────────────────── */
const CACHE = new Map();        // key -> { img, ready, waiting: [canvas] }
const keyOf = (spec, P, seed) => spec.key + '|' + [P.c1, P.c2, P.accent, P.support, P.ink].map(h => hex(h) || '-').join('') + '|' + seed;
function paintInto(cv, img) {
  try { const g = cv.getContext('2d'); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(img, 0, 0, cv.width, cv.height); g.restore(); }
  catch (e) { /* a canvas that is gone */ }
}
function painter(spec) {
  return (g, w, h, P, r) => {
    const seed = Math.floor(r() * 1e6) + 1, key = keyOf(spec, P, seed);
    g.fillStyle = hex(P.c1) || '#14161c'; g.fillRect(0, 0, w, h);          // the ground, at once
    let rec = CACHE.get(key);
    if (rec && rec.ready) { g.drawImage(rec.img, 0, 0, w, h); return; }    // seen before: the wall, at once
    const cv = g.canvas || null;                                           // grounds.js hands the real canvas through its proxy
    if (rec) { if (cv) rec.waiting.push(cv); return; }
    let svg = null;
    try { svg = deviceWallSvg(spec.key, P, seed); } catch (e) { console.warn('device wall failed:', spec.key, e); }
    if (!svg) return;
    rec = { img: new Image(), ready: false, waiting: cv ? [cv] : [] };
    CACHE.set(key, rec);
    rec.img.onload = () => {
      rec.ready = true;
      rec.waiting.forEach(c => paintInto(c, rec.img)); rec.waiting = [];
      try { window.dispatchEvent(new CustomEvent('device-wall-ready', { detail: { kind: spec.key, seed } })); } catch (e) { /* none */ }
    };
    rec.img.onerror = () => { CACHE.delete(key); };
    rec.img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  };
}

export function registerDeviceWalls(G = typeof window !== 'undefined' ? window.GROUNDS : null) {
  if (!G || typeof G.register !== 'function') return 0;
  let n = 0;
  for (const s of DEVICE_WALLS)
    if (LAYOUTS[s.theme.split('-')[0]] && G.register(s.key, { name: s.name, note: s.note, group: 'devices', draw: painter(s) })) n++;
  return n;
}

if (typeof window !== 'undefined') {
  registerDeviceWalls();
  window.DEVICE_WALLS = DEVICE_WALLS.map(s => s.key);
  window.dispatchEvent(new Event('device-walls-registered'));
}
