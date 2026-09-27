/* DEVICE SHOWCASE GROUNDS.
 *
 * The owner's reference is the wallpaper-showcase genre: a wall of devices at
 * one consistent angle, each screen carrying a different piece of artwork. It
 * is the right ground for a shop that buys those exact devices — the product
 * IS the pattern — and the engine had nothing like it.
 *
 * Drawn procedurally rather than generated as an image, on purpose. A showcase
 * has to hold the same angle every time, put OUR wallpaper on each screen, and
 * leave the brand mark exactly where the layout says. A diffusion model gives a
 * handsome picture that cannot do any of those three.
 *
 * Two registries and a set of layouts. A frame draws a device and leaves its
 * screen empty; a wallpaper fills a screen; a layout says where the devices go.
 */

/* ── frames and wallpapers ───────────────────────────────────────────────
   The drawing itself lives in showcase-parts.mjs — twelve functions each
   verified on its own before it was allowed in. A frame marks its screen with
   class="screen" as the last element rather than returning it; the adapter
   reads that rect out and hands the geometry to the caller, so the drawing
   functions stay pure SVG with no engine knowledge in them. */
import * as PARTS from './showcase-parts.mjs';

const num = (attrs, k) => { const m = new RegExp(k + '="(-?[\\d.]+)"').exec(attrs); return m ? +m[1] : 0; };
const asFrame = (fn, kind) => (x, y, w, h, P, R, id) => {
  const out = fn(x, y, w, h, P, R, id);
  const m = /<rect class="screen"([^>]*)\/>/.exec(out.body);
  const scr = m ? { x: num(m[1], 'x'), y: num(m[1], 'y'), w: num(m[1], 'width'), h: num(m[1], 'height'), r: num(m[1], 'rx') }
                : { x, y, w, h, r: 0 };
  /* SOFTER CORNERS. Some of the frames draw a screen corner close to square,
     which reads as a monitor from 2009 next to the rounded bodies around it.
     A floor of 6% of the screen's short side keeps them in the same decade. */
  scr.r = Math.max(scr.r, Math.min(scr.w, scr.h) * .06);
  return { defs: out.defs, body: m ? out.body.replace(m[0], '') : out.body, screen: scr, kind };
};

/* THE ISLAND AND THE NOTCH, DRAWN ON TOP.
   The frames do draw a camera cutout — but it goes down before the screen, and
   the wallpaper is then clipped over it, so every device came out with a clean
   blank screen and no island at all. It belongs above the artwork, which is
   exactly where it is on the real thing. */
function cutout(kind, s, P, id) {
  const dark = P.dark || '#000';
  if (kind === 'phone') {
    const w = Math.max(s.w * .30, 6), h = Math.max(w * .30, 2.5);
    const x = s.x + (s.w - w) / 2, y = s.y + s.h * .022;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${(h / 2).toFixed(1)}" fill="${dark}"/>` +
      (w > 18 ? `<circle cx="${(x + w - h * .58).toFixed(1)}" cy="${(y + h / 2).toFixed(1)}" r="${(h * .24).toFixed(1)}" fill="${P.body}" fill-opacity=".28"/>` : '');
  }
  if (kind === 'laptop') {
    const w = Math.max(s.w * .13, 8), h = Math.max(s.h * .035, 2.5);
    const x = s.x + (s.w - w) / 2;
    return `<path d="M${x.toFixed(1)} ${s.y.toFixed(1)} h${w.toFixed(1)} v${(h - 2).toFixed(1)} a2 2 0 0 1 -2 2 h${(-(w - 4)).toFixed(1)} a2 2 0 0 1 -2 -2 Z" fill="${dark}"/>`;
  }
  /* An iMac has NEVER had a notch — it carries a pinhole in the top bezel, and
     it was getting the laptop's tab only because this branch tested for both.
     The frame draws a pinhole of its own, but under the wallpaper, so it is
     invisible; this is the one that shows. */
  if (kind === 'desktop') {
    const r = Math.max(s.w * .006, 1);
    return `<circle cx="${(s.x + s.w / 2).toFixed(1)}" cy="${(s.y + Math.max(s.h * .018, 3)).toFixed(1)}" r="${r.toFixed(1)}" fill="${dark}"/>`;
  }
  const r = Math.max(s.w * .008, 1.2);                       // tablet: a lens dot
  return `<circle cx="${(s.x + s.w / 2).toFixed(1)}" cy="${(s.y + Math.max(s.h * .014, 3)).toFixed(1)}" r="${r.toFixed(1)}" fill="${dark}"/>`;
}

export const FRAMES = {
  phone:   asFrame(PARTS.frame_phone,   'phone'),
  tablet:  asFrame(PARTS.frame_tablet,  'tablet'),
  laptop:  asFrame(PARTS.frame_laptop,  'laptop'),
  desktop: asFrame(PARTS.frame_desktop, 'desktop'),
};

export const WALLS = {
  bands:     PARTS.wall_bands,
  diagonal:  PARTS.wall_diagonal,
  mesh:      PARTS.wall_mesh,
  poly:      PARTS.wall_poly,
  arcs:      PARTS.wall_arcs,
  hills:     PARTS.wall_hills,
  schematic: PARTS.wall_schematic,
  field:     PARTS.wall_field,
};

/* ── layouts ─────────────────────────────────────────────────────────────
   Each returns a list of placements in the given box. Angle is one number for
   the whole layout — that consistency is what makes a showcase read as a
   showcase rather than a pile. */
export const LAYOUTS = {};

/* an isometric wall of phones, offset row to row and running off every edge */
LAYOUTS.iso = (box, R) => {
  const out = [], cw = box.w / 3.1, ch = cw * 2.16;
  const dx = cw * 1.34, dy = ch * .58;
  for (let row = -1; row * dy < box.h + ch; row++)
    for (let col = -1; col * dx < box.w + cw; col++) {
      const ox = (row % 2 ? dx * .5 : 0);
      out.push({ kind: 'phone', x: box.x + col * dx + ox - cw * .2, y: box.y + row * dy - ch * .3, w: cw, h: ch, rot: -28 });
    }
  return out;
};

/* the family portrait: laptop centre, tablet left, phone right */
LAYOUTS.family = (box) => {
  const lw = box.w * .74, lh = lw / 1.55;
  const cx = box.x + box.w * .5, cy = box.y + box.h * .5;
  return [
    { kind: 'laptop',  x: cx - lw / 2,            y: cy - lh * .48, w: lw,        h: lh,        rot: 0 },
    { kind: 'tablet',  x: cx - lw * .78,          y: cy - lh * .18, w: lw * .30,  h: lh * .86,  rot: 0 },
    { kind: 'phone',   x: cx + lw * .46,          y: cy - lh * .10, w: lw * .155, h: lh * .78,  rot: 0 },
  ];
};

/* a flat wall of mixed devices at assorted sizes — the contact-sheet look */
LAYOUTS.wall = (box, R) => {
  const u = box.w / 12, k = (kind, cx, cy, cw, chh) =>
    ({ kind, x: box.x + cx * u, y: box.y + cy * u, w: cw * u, h: chh * u, rot: 0 });
  return [
    k('tablet', 0.3, 0.4, 3.2, 4.4), k('tablet', 3.9, 0.6, 2.2, 3.0), k('laptop', 6.6, 0.5, 5.1, 3.3),
    k('phone', 0.4, 5.4, 1.7, 3.7),  k('tablet', 2.4, 5.6, 2.6, 1.9), k('tablet', 5.4, 5.0, 3.6, 2.6),
    k('phone', 9.6, 4.6, 1.7, 3.7),  k('desktop', 5.6, 8.2, 6.2, 5.0), k('laptop', 0.3, 9.6, 4.9, 3.2),
  ];
};

/* three phones, front on, the middle one lifted */
LAYOUTS.trio = (box) => {
  const pw = box.w * .27, ph = pw * 2.16, cy = box.y + box.h * .5;
  return [0, 1, 2].map(i => ({ kind: 'phone', x: box.x + box.w * (.08 + i * .29),
    y: cy - ph * (i === 1 ? .54 : .5), w: pw, h: ph * (i === 1 ? 1.06 : 1), rot: 0 }));
};

/* ── further arrangements ────────────────────────────────────────────────
   Not versions of the references — other ways to stand a set of devices up. */

/* the whole family clustered by size, big at the back */
LAYOUTS.stack = (box) => {
  const u = box.w / 12, k = (kind, cx, cy, cw, ch) =>
    ({ kind, x: box.x + cx * u, y: box.y + cy * u, w: cw * u, h: ch * u, rot: 0 });
  return [
    k('desktop', 1.4, 1.0, 8.0, 6.0), k('laptop', 3.6, 5.4, 6.4, 4.2),
    k('tablet', 0.6, 6.4, 3.1, 4.2),  k('phone', 8.9, 6.9, 1.9, 4.1),
    k('phone', 2.2, 8.4, 1.7, 3.7),
  ];
};

/* phones fanned from a point below the frame, like a hand of cards */
LAYOUTS.fan = (box, R) => {
  const n = 5, pw = box.w * .215, ph = pw * 2.16;
  const cx = box.x + box.w * .5, cy = box.y + box.h * 1.22, rad = box.h * .78;
  return Array.from({ length: n }, (_, i) => {
    const a = (-58 + i * 29) * Math.PI / 180;
    return { kind: 'phone', x: cx + Math.sin(a) * rad - pw / 2,
      y: cy - Math.cos(a) * rad - ph / 2, w: pw, h: ph, rot: -58 + i * 29 };
  });
};

/* a diagonal cascade, each step smaller and lower */
LAYOUTS.cascade = (box) => {
  const out = [], n = 5;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), w = box.w * (.40 - t * .16);
    out.push({ kind: i === 0 ? 'tablet' : 'phone',
      x: box.x + box.w * (-.04 + t * .70), y: box.y + box.h * (.02 + t * .62),
      w, h: w * (i === 0 ? 1.4 : 2.16), rot: -14 });
  }
  return out;
};

/* a ring of phones around one held in the middle */
LAYOUTS.orbit = (box) => {
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  const pw = box.w * .17, ph = pw * 2.16, rad = Math.min(box.w, box.h) * .36;
  const ring = Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 - 90) * Math.PI / 180;
    return { kind: 'phone', x: cx + Math.cos(a) * rad - pw / 2, y: cy + Math.sin(a) * rad - ph / 2,
      w: pw, h: ph, rot: (i * 60) };
  });
  return [...ring, { kind: 'phone', x: cx - pw * .82, y: cy - ph * .82, w: pw * 1.64, h: ph * 1.64, rot: 0 }];
};

/* A RING WITH THE MIDDLE LEFT EMPTY — devices stood evenly around the rim and
   leaned tangentially, like numbers on a clock face, so the hole in the centre
   is where the headline and the phone number go. `orbit` above is a different
   idea: it fills the middle with a hero phone, so the copy has to sit over it.
   Mixed kinds, because a shop that buys four categories should show four.

   The ring is an ELLIPSE, not a circle, and that is what makes it survive every
   aspect ratio: on a 32:9 banner a true circle either leaves two thirds of the
   card empty or pushes the top and bottom devices off it. Radii are taken from
   each axis independently and then pulled in by the device's own half-size, so
   nothing crosses an edge whatever the box shape. */
LAYOUTS.ring = (box, R) => {
  const n = box.w / box.h > 2.2 ? 10 : 8;                 /* a wide card holds more */
  const kinds = ['phone', 'tablet', 'phone', 'phone', 'tablet', 'phone', 'phone', 'tablet', 'phone', 'phone'];
  const pw = Math.min(box.w, box.h) * (n > 8 ? .13 : .16);
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  return Array.from({ length: n }, (_, i) => {
    const kind = kinds[i % kinds.length];
    const w = kind === 'tablet' ? pw * 1.35 : pw;
    const h = w * (kind === 'tablet' ? 1.4 : 2.16);
    const a = (i * (360 / n) - 90) * Math.PI / 180;
    const rx = Math.max(0, box.w / 2 - w * .62), ry = Math.max(0, box.h / 2 - h * .52);
    return { kind, x: cx + Math.cos(a) * rx - w / 2, y: cy + Math.sin(a) * ry - h / 2,
      w, h, rot: (i * (360 / n)) % 360 };
  });
};

/* The same circle, crowded and bled off every edge: two rings turning opposite
   ways, the outer one cropped by the frame. Reads as a pile of stock rather
   than an arrangement, which is the note the diagonal wall hits — this is that
   genre in the round. */
LAYOUTS.halo = (box, R) => {
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  const u = Math.min(box.w, box.h);
  const out = [];
  /* Radii are a fraction of the BOX, so they must stay under .5 or the ring
     leaves the card entirely instead of being cropped by it. .30/.44 crops the
     outer ring against the edges — which is the look — while keeping every
     device at least partly on the card. */
  /* A wide card needs MORE devices, not bigger ones: the ellipse stretches
     horizontally, so the same count leaves gaps a 1:1 card never shows. */
  const wide = box.w / box.h;
  const extra = wide > 2.2 ? 6 : wide > 1.5 ? 3 : 0;
  [[6 + extra, .22, .13, 1], [9 + extra, .40, .105, -1]].forEach(([n, rk, sk, dir]) => {
    for (let i = 0; i < n; i++) {
      const kind = (i % 3 === 1 && rk < .4) ? 'tablet' : 'phone';
      const w = u * sk * (kind === 'tablet' ? 1.3 : 1);
      const h = w * (kind === 'tablet' ? 1.4 : 2.16);
      const a = (i * (360 / n) + (dir < 0 ? 180 / n : 0) - 90) * Math.PI / 180;
      out.push({ kind, x: cx + Math.cos(a) * box.w * rk - w / 2,
        y: cy + Math.sin(a) * box.h * rk - h / 2, w, h,
        rot: (i * (360 / n) * dir + (dir < 0 ? 24 : -12)) % 360 });
    }
  });
  return out;
};

/* one tall column, cropped top and bottom — a strip of screens */
LAYOUTS.column = (box) => {
  const pw = box.w * .40, ph = pw * 2.16;
  return Array.from({ length: 3 }, (_, i) => ({ kind: 'phone',
    x: box.x + box.w * (i % 2 ? .52 : .06), y: box.y + box.h * (-.16 + i * .42),
    w: pw, h: ph, rot: i % 2 ? 7 : -7 }));
};

export const WALL_KEYS = () => Object.keys(WALLS);

/* ── the drawing ─────────────────────────────────────────────────────────
   Devices are laid out, framed, and their screens filled with wallpapers
   drawn from this card's own palette — so a showcase is never Apple's colours,
   it is whichever of the thirty-three palettes the card is wearing.

   A scrim goes over the whole thing afterwards. Every text rule in the engine
   measures a line against its DECLARED backing, and the declared backing here
   is P.ground; without the wash that claim stops being true the moment a
   headline crosses a bright screen. The wash keeps the ground colour dominant,
   which is both what makes the type readable and what makes the audit honest. */
/* THE WASH GOES BEHIND THE WORDS, NOT OVER THE PICTURE.
   Every text rule in the engine measures a line against its DECLARED backing,
   and on a showcase ground that claim is false the moment a headline crosses a
   bright screen — which is exactly what a flat wash was invented to hide, at
   the cost of hiding the devices too. Instead the card is allowed to build, and
   then every line still sitting on bare ground gets a soft panel of the ground
   colour placed UNDER it: the type is legible, the rule is honest again, and
   the devices keep their colour everywhere the copy is not. */
export function scrimBehindText(c, box, strength = .88) {
  const { P } = c;
  const runs = c.nodes.filter(n => n.type === 'text' && n.backing === P.ground && n.box.w > 0);
  if (!runs.length) return;
  const pad = Math.min(c.W, c.H) * .022;
  /* merge lines that sit near each other into one band — a panel per line reads
     as a stack of labels, a panel per band reads as a designed area */
  const bands = [];
  for (const t of runs.slice().sort((a, b) => a.box.y - b.box.y)) {
    const b = { x: t.box.x - pad, y: t.box.y - pad, w: t.box.w + pad * 2, h: t.box.h + pad * 2 };
    const near = bands.find(z => b.y < z.y + z.h + pad * 1.4 && b.y + b.h > z.y - pad * 1.4);
    if (near) {
      const x1 = Math.max(near.x + near.w, b.x + b.w), y1 = Math.max(near.y + near.h, b.y + b.h);
      near.x = Math.min(near.x, b.x); near.y = Math.min(near.y, b.y);
      near.w = x1 - near.x; near.h = y1 - near.y;
    } else bands.push(b);
  }
  const id = c.id('tsc');
  c.def(`<filter id="${id}" x="-12%" y="-25%" width="124%" height="150%">` +
        `<feGaussianBlur stdDeviation="${(pad * .55).toFixed(1)}"/></filter>`);
  const m = bands.map(b =>
    `<rect x="${b.x.toFixed(1)}" y="${b.y.toFixed(1)}" width="${b.w.toFixed(1)}" height="${b.h.toFixed(1)}" ` +
    `rx="${(pad * 1.1).toFixed(1)}" fill="${P.ground}" fill-opacity="${strength}"/>`).join('');
  c.add(`<g filter="url(#${id})">${m}</g>`, null, -20);
}

/* ── THE THEME GENERATOR ──────────────────────────────────────────────────
   A showcase's character is not one setting, it is three: the ARRANGEMENT
   (which layout), the VOCABULARY (which wallpapers its screens may draw from)
   and the PALETTE ROTATION (how the accent walks the spectrum from screen to
   screen). Until now only the first was named — a template asked for a layout
   and took whatever the other two happened to be, so two cards on the same
   layout could look identical or unrelated with nothing to say which.

   Naming the pairs makes the set countable, reproducible and gradeable: every
   theme has a stable id, so "ring-technical looks wrong" is a bug report
   somebody can act on rather than a description of a mood.

   FAMILIES are wallpaper vocabularies, and the restriction is the point. All
   eight wallpapers on one card averages out to "assorted"; two that share a
   drawing logic read as a decision. Each family is a pairing that holds
   together — hard-edged with hard-edged, tonal with tonal — rather than every
   combination, most of which are noise.

   The cross-product is 11 layouts x 10 families = 110 themes, which is the
   range asked for. Adding a layout adds ten themes and adding a family adds
   eleven, so the set grows without anybody hand-writing entries. */
export const WALL_FAMILIES = {
  flat:      { walls: ['bands', 'field'],                 note: 'flat colour blocks, no texture' },
  geometric: { walls: ['poly', 'diagonal'],               note: 'hard angles and facets' },
  soft:      { walls: ['hills', 'field'],                 note: 'tonal landscape, no hard edge' },
  technical: { walls: ['schematic', 'mesh'],              note: 'circuitry and grids' },
  arcs:      { walls: ['arcs', 'bands'],                  note: 'concentric arcs over stripes' },
  optical:   { walls: ['diagonal', 'mesh'],               note: 'moire and interference' },
  editorial: { walls: ['bands', 'hills', 'field'],        note: 'magazine: stripe, ridge, wash' },
  wire:      { walls: ['schematic', 'poly'],              note: 'drawn hardware, exploded' },
  spectrum:  { walls: ['field', 'arcs'],                  note: 'one hue per screen, pooled light' },
  assorted:  { walls: Object.keys(WALLS),                 note: 'every wallpaper, dealt round-robin' },
};

/* The palette rotation. Each screen is handed the spectrum offset by its index
   (see drawShowcase), so the ORDER here decides whether a wall reads as a
   gradient walking round the card or as a scatter. */
/* ── THE SPECTRUM, WIDENED ────────────────────────────────────────────────
   A palette record carries three saturated roles — accent, hot, ground2 — and
   the reference showcases run five to eight hues across their screens. Three
   rotated round a wall of nine devices is three hues repeated three times,
   which is why a card could look tidy and still look flat.

   So the hues are GENERATED from the palette's own seeds rather than invented:
   the saturated roles are read as hue angles, sorted round the wheel, and the
   gaps between neighbours are filled by walking the shorter arc. Saturation
   and lightness are carried from the seeds, so a muted palette produces muted
   hues and a jewel palette produces jewel ones — the card never stops being
   the palette it is wearing. Nothing is picked from outside the record. */
const _h2 = c => { let t = String(c || '').replace('#', ''); if (t.length === 3) t = t[0]+t[0]+t[1]+t[1]+t[2]+t[2];
  return /^[0-9a-fA-F]{6}$/.test(t) ? [0,2,4].map(i => parseInt(t.substr(i,2),16)) : null; };
function _rgb2hsl(c){ const v=_h2(c); if(!v) return null; const [r,g,b]=v.map(x=>x/255);
  const mx=Math.max(r,g,b), mn=Math.min(r,g,b), l=(mx+mn)/2, d=mx-mn;
  if(!d) return {h:0,s:0,l};
  const s=l>.5?d/(2-mx-mn):d/(mx+mn);
  let h = mx===r ? (g-b)/d+(g<b?6:0) : mx===g ? (b-r)/d+2 : (r-g)/d+4;
  return {h:h*60,s,l}; }
function _hsl2rgb({h,s,l}){ h=((h%360)+360)%360/360;
  const q=l<.5?l*(1+s):l+s-l*s, p2=2*l-q;
  const f=t=>{ t=(t+1)%1; return t<1/6?p2+(q-p2)*6*t : t<1/2?q : t<2/3?p2+(q-p2)*(2/3-t)*6 : p2; };
  return '#'+[f(h+1/3),f(h),f(h-1/3)].map(v=>{const n=Math.round(v*255);return (n<16?'0':'')+n.toString(16);}).join(''); }

/** n harmonious hues, grown from the palette's saturated roles. */
export function spread(P, n = 6) {
  /* A seed has to be a COLOUR a screen could lead with: saturated, and not so
     dark it reads as off. `ground` is included because on some palettes it is
     the only third hue — but a dark ground is lifted to the working band
     rather than dropped, so its hue still joins the wheel. */
  const seeds = [P.accent, P.hot, P.ground2, P.ground]
    .map(_rgb2hsl).filter(x => x && x.s > .12)
    .map(x => ({ ...x, l: Math.min(.72, Math.max(.42, x.l)), s: Math.max(.38, x.s) }))
    .sort((a, b) => a.h - b.h);
  if (!seeds.length) return [P.accent, P.hot, P.ground2].filter(Boolean);
  if (seeds.length === 1) {
    /* one seed: walk it round the wheel in even steps, keeping its character */
    return Array.from({ length: n }, (_, i) => _hsl2rgb({ ...seeds[0], h: seeds[0].h + i * (360 / n) }));
  }
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = i / n * seeds.length;              /* walk the seed ring */
    const a = seeds[Math.floor(t) % seeds.length];
    const b = seeds[(Math.floor(t) + 1) % seeds.length];
    const k = t - Math.floor(t);
    let d = b.h - a.h; if (d > 180) d -= 360; if (d < -180) d += 360;   /* shorter arc */
    out.push(_hsl2rgb({ h: a.h + d * k, s: a.s + (b.s - a.s) * k, l: a.l + (b.l - a.l) * k }));
  }
  return out;
}

const SPECTRA = {
  /* SATURATED ROLES ONLY. Feeding `paper` and `ink` into the rotation hands
     whole screens near-white and near-black — which is what made a wall read
     as washed out and inverted rather than as a set of lit devices. The
     reference showcases get their life from five to eight SATURATED hues over
     a quiet ground; paper and ink are the ground's job, not a screen's.
     They stay available to the wallpapers as a highlight or a shade, because
     each wallpaper still receives the whole palette — the spectrum only
     decides which hue that screen leads with. */
  walk:    P => spread(P, 6),
  hot:     P => spread(P, 5),
  cool:    P => spread(P, 7),
  wide:    P => spread(P, 8),
};

/** Every theme, in a stable order. Ids are `<layout>-<family>`. */
export function THEMES() {
  const spins = Object.keys(SPECTRA);
  const out = [];
  Object.keys(LAYOUTS).forEach((layout, li) => {
    Object.keys(WALL_FAMILIES).forEach((family, fi) => {
      out.push({
        id: layout + '-' + family,
        layout,
        family,
        only: WALL_FAMILIES[family].walls,
        note: WALL_FAMILIES[family].note,
        /* deterministic, and offset by both axes so neighbouring themes in the
           list do not share a rotation */
        spectrum: spins[(li + fi) % spins.length],
      });
    });
  });
  return out;
}

/** Resolve a theme id into the opts drawShowcase takes. */
export function themeOpts(id, P, extra = {}) {
  const t = THEMES().find(x => x.id === id);
  if (!t) return { ...extra };
  return { layout: t.layout, only: t.only, spectrum: SPECTRA[t.spectrum](P), ...extra };
}

export function drawShowcase(c, box, opts = {}) {
  const { P, R } = c;
  const layout = LAYOUTS[opts.layout] ? opts.layout : 'iso';
  const places = LAYOUTS[layout](box, R);
  /* DEAL, DO NOT DRAW. Picking each screen's wallpaper at random meant a
     three-device layout could land on the same one three times, and the whole
     point of the reference is that every screen is different. Shuffle once,
     then deal round-robin. */
  /* a theme may restrict which wallpapers its screens carry — that restriction
     is most of what makes one theme look unlike another */
  const keys = (opts.only && opts.only.filter(k => WALLS[k]).length ? opts.only.filter(k => WALLS[k]) : Object.keys(WALLS));
  const deck = keys.slice();
  for (let i = deck.length - 1; i > 0; i--) { const j = R.i(0, i); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  const brandOn = opts.brand ? R.i(0, Math.max(0, places.length - 1)) : -1;

  let defs = '', body = '';
  places.forEach((p, i) => {
    const frame = FRAMES[p.kind] || FRAMES.phone;
    const id = c.id('sc');
    const f = frame(p.x, p.y, p.w, p.h, P, R, id);
    const s = f.screen;

    /* the wallpaper, clipped to the screen's rounded rectangle.
       A SPECTRUM, NOT A PAIR. The reference showcases are a quiet ground under
       five to eight saturated hues, and a palette record only carries two —
       which is the hue-count gap the reference measurement found (good ads 1.46
       hue entropy, this engine 0.92). Each screen is handed the same palette
       with its accent, hot and second ground rotated to a different place in
       the spectrum, so one wall shows the whole range without any wallpaper
       function needing to know the spectrum exists. */
    const sp = opts.spectrum;
    const Pi = sp && sp.length >= 3 ? { ...P,
      accent:  sp[i % sp.length],
      hot:     sp[(i + 2) % sp.length],
      ground2: sp[(i + 4) % sp.length],
      ink:     sp[(i + 1) % sp.length] } : P;
    const wallKey = (i === brandOn && WALLS.field) ? 'field' : deck[i % deck.length];
    const w = (WALLS[wallKey] || WALLS.field)(s.x, s.y, s.w, s.h, Pi, R, id + 'w');
    const clip = `<clipPath id="${id}s"><rect x="${s.x.toFixed(1)}" y="${s.y.toFixed(1)}" width="${s.w.toFixed(1)}" height="${s.h.toFixed(1)}" rx="${(s.r || 0).toFixed(1)}"/></clipPath>`;

    /* the brand, set on one screen, at the same angle as everything else */
    let mark = '';
    if (i === brandOn && opts.brand) {
      const t = String(opts.brand);
      /* sized off BOTH axes: on a laptop screen the height rule alone made the
         wordmark fill the lid, which reads as a banner rather than a wallpaper */
      const size = Math.min(s.w * .70 / Math.max(4, t.length) * 1.75, s.h * .12);
      /* THIS TEXT IS ARTWORK, NOT COPY, and it is marked as such.
         It is a wallpaper OF the brand, so it deliberately repeats the lockup —
         which is exactly the kind of thing the no-repeat rule exists to stop.
         Left unmarked it was simply invisible to every rule: it could be any
         size, land anywhere, say anything. data-deco makes the exemption a
         decision the auditors can see rather than an oversight. */
      mark = `<text data-deco="1" x="${(s.x + s.w / 2).toFixed(1)}" y="${(s.y + s.h * .54).toFixed(1)}" text-anchor="middle" ` +
        `font-family="${c.F.body}, sans-serif" font-weight="700" font-size="${size.toFixed(1)}" ` +
        `fill="${P.paper}" fill-opacity=".92">${String(opts.brand).replace(/[&<>]/g, '')}</text>`;
    }

    defs += f.defs + w.defs + clip;
    const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
    const turn = p.rot ? ` transform="rotate(${p.rot.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})"` : '';
    body += `<g${turn}>${f.body}<g clip-path="url(#${id}s)">${w.body}${mark}</g>` +
      `${cutout(p.kind, s, P, id)}</g>`;
  });

  /* THE SCRIM IS A GRADIENT, NOT A WASH.
     A flat 46% wash kept the type honest and killed the picture — the devices
     became vague coloured shapes and the whole point was lost. The copy is not
     spread evenly: the lockup and headline sit at the top, the CTA and footer
     at the bottom, and the middle band is where a showcase wants to breathe.
     So the ground is held over the type and let go in the middle. */
  /* THE SHOWCASE IS A TEXTURE, NOT A SECOND PICTURE.
     Two earlier attempts both failed for the same reason: a flat wash over the
     whole card drowned the devices, and washing only behind each line left
     murky rounded panels that overlapped into grey blobs and muddied every
     colour on the card. Both were trying to referee a fight between the
     background and the copy. The fight is the mistake — the devices go quiet
     enough that nothing has to be protected from them, and the card keeps its
     ground colour clean. Full strength is still available for a bare
     background with no copy on it, which is what the theme renders use. */
  const fade = opts.fade === undefined ? .26 : opts.fade;
  c.def(defs);
  c.add(fade >= 1 ? `<g>${body}</g>` : `<g opacity="${fade}">${body}</g>`,
    { type: 'shape', id: 'showcase', box, bleed: true, role: 'field' }, -70);
  return places.length;
}
