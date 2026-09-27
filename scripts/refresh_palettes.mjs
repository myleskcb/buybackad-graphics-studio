/* THE 2026-09-22 PALETTES, and the one rule that lets a finished, audited card
 * change colour without changing how readable it is.
 *
 * WHY: the library ran on 51 palettes that were generated rather than chosen,
 * named out of one small word pot ("Blue Ticket", "Blue Deal", "Blue Market",
 * "Indigo Cash"), and the biggest of them broke the owner's own brief —
 * "Gold Offer", 79 cards, was brown ink and a dark orange accent, the exact
 * "dark orange or brown" theme_specs.mjs says to avoid. Most cards sat a
 * greyscale photograph under a 56% (median) flat pastel veil, which is what a
 * thumbnail wall of dusty teal and dusty pink is made of.
 *
 * THE RULE — LUMINANCE LOCK. Every colour in a record is re-hued and
 * re-saturated from its new palette role, and then its lightness is SOLVED so
 * its WCAG relative luminance equals the colour it replaces, to 0.1%. Every
 * contrast ratio between two flat colours on the card is therefore exactly
 * what it was when the card passed its audits; only hue and chroma move.
 * (DESIGN-LAW 31: contrast fixes preserve hue; this is its mirror — a hue
 * change preserves contrast.) Near-neutral colours (C < 0.03: shadows,
 * whites, near-black ink) are left alone, which keeps rule 2's neutral
 * shadow neutral.
 *
 * Colour maths in OKLCH (rule 40). Accents are split-complementary or triadic
 * to the ground, never an exact complement (rule 41). Any dark colour that
 * would land in the orange-amber band (the "brown" band) takes the palette's
 * DEEP hue instead.
 */

/* ---------- colour ---------- */
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const toLin = c => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const toGam = c => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
export function parse(s){
  s = String(s).trim();
  let m = /^#([0-9a-f]{3})$/i.exec(s);
  if (m){ const h = m[1]; return { r:parseInt(h[0] + h[0], 16), g:parseInt(h[1] + h[1], 16), b:parseInt(h[2] + h[2], 16), a:1, fmt:'hex' }; }
  m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(s);
  if (m){ const n = parseInt(m[1], 16); return { r:n >> 16 & 255, g:n >> 8 & 255, b:n & 255, a:m[2] ? parseInt(m[2], 16) / 255 : 1, fmt:m[2] ? 'hex8' : 'hex' }; }
  m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(s);
  if (m) return { r:+m[1], g:+m[2], b:+m[3], a:m[4] === undefined ? 1 : +m[4], fmt:m[4] === undefined ? 'rgb' : 'rgba' };
  return null;
}
export function fmt(c, like){
  const r = Math.round(clamp(c.r, 0, 255)), g = Math.round(clamp(c.g, 0, 255)), b = Math.round(clamp(c.b, 0, 255));
  const hx = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  if (like.fmt === 'hex') return hx;
  if (like.fmt === 'hex8') return hx + Math.round(like.a * 255).toString(16).padStart(2, '0');
  if (like.fmt === 'rgb') return `rgb(${r},${g},${b})`;
  return `rgba(${r},${g},${b},${like.a})`;
}
export const lumOf = c => 0.2126 * toLin(c.r / 255) + 0.7152 * toLin(c.g / 255) + 0.0722 * toLin(c.b / 255);
export function toOklch(c){
  const r = toLin(c.r / 255), g = toLin(c.g / 255), b = toLin(c.b / 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
  return { L, C:Math.hypot(A, B), H:((Math.atan2(B, A) * 180 / Math.PI) + 360) % 360, A, B };
}
function oklchToRgbLin(L, C, H){
  const a = C * Math.cos(H * Math.PI / 180), b = C * Math.sin(H * Math.PI / 180);
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3);
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
          -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
          -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
}
const inGamut = v => v.every(x => x >= -1e-4 && x <= 1 + 1e-4);
/* the colour of hue H and (at most) chroma C whose luminance is exactly Y */
export function atLuminance(H, C, Y){
  for (let cc = C; cc >= 0; cc -= 0.004){
    let lo = 0, hi = 1, best = null;
    for (let i = 0; i < 40; i++){
      const L = (lo + hi) / 2, v = oklchToRgbLin(L, cc, H);
      const y = 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
      if (y < Y) lo = L; else hi = L;
      best = v;
    }
    if (inGamut(best)) return { r:toGam(clamp(best[0], 0, 1)) * 255, g:toGam(clamp(best[1], 0, 1)) * 255, b:toGam(clamp(best[2], 0, 1)) * 255 };
  }
  const g = toGam(Y) * 255; return { r:g, g, b:g };
}
const hueGap = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

/* ---------- the palettes ----------
   g/a/s = ground, action accent, support hue (OKLCH degrees); deep = the hue a
   DARK colour takes if its own would read brown. Chroma is per role and per
   side of the lightness scale: a pastel ground is quiet (0.045), a deep ground
   carries colour (0.11), the accent is the loudest thing on the card. The
   `neutral` palettes keep a near-neutral ground on purpose — the trust end. */
export const PALETTES = [
  { name:'Cobalt & Tangerine', g:262, a:52,  s:195, deep:266 },
  { name:'Pistachio & Plum',   g:128, a:336, s:232, deep:322 },
  { name:'Tomato & Cream',     g:24,  a:256, s:172, deep:356 },
  { name:'Racing Green',       g:156, a:95,  s:22,  deep:160 },
  { name:'Ultraviolet & Lime', g:292, a:126, s:196, deep:292 },
  { name:'Lagoon & Coral',     g:206, a:28,  s:292, deep:236 },
  { name:'Blush & Cobalt',     g:356, a:262, s:162, deep:266 },
  { name:'Butter & Navy',      g:96,  a:266, s:342, deep:266 },
  { name:'Petrol & Peach',     g:224, a:48,  s:332, deep:226 },
  { name:'Cherry & Aqua',      g:14,  a:196, s:96,  deep:6 },
  { name:'Mint & Magenta',     g:166, a:342, s:256, deep:250 },
  { name:'Lilac & Citrus',     g:306, a:112, s:178, deep:290 },
  { name:'Glacier & Flame',    g:238, a:34,  s:122, deep:252 },
  { name:'Aubergine & Brass',  g:322, a:92,  s:176, deep:318 },
  { name:'Sea Glass & Grape',  g:184, a:300, s:56,  deep:212 },
  { name:'Poppy & Ink',        g:28,  a:268, s:182, deep:268 },
  { name:'Grape Soda',         g:284, a:178, s:62,  deep:286 },
  { name:'Sage & Rosé',        g:142, a:358, s:252, deep:152 },
  { name:'Reef',               g:40,  a:200, s:294, deep:352 },
  { name:'Midnight & Cyan',    g:266, a:202, s:336, deep:266 },
  { name:'Kiwi & Violet',      g:124, a:296, s:26,  deep:290 },
  { name:'Denim & Butter',     g:256, a:96,  s:18,  deep:260 },
  { name:'Jade & Tangerine',   g:174, a:52,  s:294, deep:176 },
  { name:'Bubblegum & Pine',   g:352, a:154, s:242, deep:156 },
  { name:'Orchid & Lime',      g:320, a:130, s:222, deep:302 },
  { name:'Emerald & Blush',    g:160, a:12,  s:92,  deep:164 },
  { name:'Marine & Rhubarb',   g:246, a:352, s:152, deep:250 },
  { name:'Graphite & Volt',    g:252, a:122, s:202, deep:260, neutral:true },
  { name:'Porcelain & Cobalt', g:84,  a:262, s:24,  deep:262, neutral:true },
];
/* role chroma (light side / dark side) */
const CH = { ground:[0.048, 0.112], accent:[0.17, 0.18], support:[0.12, 0.13], ink:[0.03, 0.035] };

/* which palettes suit a category — soft preference, never a wall. Gold wants
   a warm-yellow accent or support somewhere in it; silver and strips want a
   cool or neutral ground (metal, medical trust); pokemon never gets a
   neutral palette. Everything else takes anything. */
const warmY = p => [p.a, p.s].some(h => h >= 70 && h <= 112);
const coolG = p => p.neutral || (p.g >= 175 && p.g <= 275);
export const AFFINITY = {
  gold:p => warmY(p), silver:p => coolG(p), strips:p => coolG(p) || (p.g >= 120 && p.g <= 180),
  pokemon:p => !p.neutral, coins:() => true, cars:() => true, sports:() => true, phones:() => true,
};

/* ---------- mapping one card ---------- */
export function mapper(pal, oldRoles){
  const roles = ['ground', 'ink', 'accent', 'support'];
  const src = { ground:oldRoles.c1, ink:oldRoles.ink, accent:oldRoles.accent, support:oldRoles.support };
  const O = {}; roles.forEach(r => { const p = parse(src[r]); O[r] = p ? toOklch(p) : null; });
  const hueFor = { ground:pal.g, ink:pal.g, accent:pal.a, support:pal.s };
  const cache = new Map();
  return function map(str){
    if (cache.has(str)) return cache.get(str);
    const c = parse(str); if (!c){ cache.set(str, str); return str; }
    const k = toOklch(c), Y = lumOf(c);
    let out = str;
    if (k.C >= 0.03){
      /* nearest old role in OKLab: that is the job this colour was doing */
      let role = 'accent', best = 9;
      roles.forEach(r => { const o = O[r]; if (!o || (r === 'ink' && o.C < 0.03)) return;
        const d = Math.hypot(k.L - o.L, k.A - o.A, k.B - o.B); if (d < best){ best = d; role = r; } });
      const o = O[role] || k;
      const side = Y > 0.3 ? 0 : 1;
      let C = CH[role][side] * clamp(o.C > 0.01 ? k.C / o.C : 1, 0.55, 1.35);
      if (pal.neutral && (role === 'ground' || role === 'ink')) C = Math.min(C, role === 'ground' ? 0.018 : 0.02);
      /* keep the colour's own small offset from its role hue, so a two-stop
         gradient stays two stops */
      const off = clamp(((k.H - o.H + 540) % 360) - 180, -14, 14);
      let H = (hueFor[role] + off + 360) % 360;
      if (Y < 0.2 && H >= 32 && H <= 108) H = pal.deep;      // no brown
      out = fmt(atLuminance(H, C, Y), c);
    }
    cache.set(str, out);
    return out;
  };
}
export function walkColours(o, map){
  if (Array.isArray(o)) return o.map(v => walkColours(v, map));
  if (o && typeof o === 'object'){ const r = {}; for (const k in o) r[k] = (k === 'text' || k === 'src' || k === 'fontFamily') ? o[k] : walkColours(o[k], map); return r; }
  if (typeof o === 'string' && /^\s*(#[0-9a-f]{3,8}|rgba?\([^)]*\))\s*$/i.test(o)) return map(o);
  return o;
}

/* ---------- the photograph: grey under a veil becomes a true duotone ----------
   The lab's 'tone' treatment is grey(photo) then a flat veil of colour s at
   opacity a:  out = a*s + (1-a)*g  per channel. A duotone multiply-then-screen
   is  out = lo + g*hi*(1-lo). Solving for the same two ENDPOINTS (g=0 and
   g=1) keeps the card's tonal range, and so its measured legibility, while the
   shadows take the palette's ground hue and the highlights its support hue —
   instead of one dusty tint on grey. The endpoints are luminance-locked too. */
export function duoFor(pal, scrimColor, a){
  const s = parse(scrimColor) || { r:128, g:128, b:128 };
  const S0 = { r:a * s.r, g:a * s.g, b:a * s.b };
  const S1 = { r:a * s.r + (1 - a) * 255, g:a * s.g + (1 - a) * 255, b:a * s.b + (1 - a) * 255 };
  const y0 = lumOf(S0), y1 = lumOf(S1);
  const lo = atLuminance(y0 < 0.2 ? pal.deep : pal.g, pal.neutral ? 0.02 : (y0 < 0.3 ? 0.10 : 0.06), y0);
  const top = atLuminance(pal.s, pal.neutral ? 0.025 : 0.07, y1);
  const hi = {};
  ['r', 'g', 'b'].forEach(ch => { const L0 = lo[ch] / 255, T = top[ch] / 255; hi[ch] = clamp(L0 >= 0.999 ? 1 : (T - L0) / (1 - L0), 0, 1) * 255; });
  return { lo:fmt(lo, { fmt:'hex' }), hi:fmt(hi, { fmt:'hex' }) };
}

/* ---------- assignment: balanced, by rule ----------
   Each card takes the least-used palette that (1) moves its ground at least
   60° round the wheel from where it was, so the refresh is visible, (2) suits
   its category, and (3) is not already on another card with the same layout
   in the same category. Ties go to palette order. Nothing is decided by
   hashing an id. */
export function assign(cards){
  const use = new Map(PALETTES.map(p => [p.name, 0]));
  const taken = new Set();
  const out = {};
  const sorted = cards.slice().sort((x, y) => (x.cat + x.layout + x.id).localeCompare(y.cat + y.layout + y.id));
  for (const c of sorted){
    const o = parse(c.c1); const oh = o ? toOklch(o).H : 0; const oc = o ? toOklch(o).C : 0;
    const ok = (p, strict) => (!strict || oc < 0.03 || hueGap(p.g, oh) >= 60) && (AFFINITY[c.cat] || (() => true))(p) && (!strict || !taken.has(c.cat + '|' + c.layout + '|' + p.name));
    let pool = PALETTES.filter(p => ok(p, true));
    if (!pool.length) pool = PALETTES.filter(p => ok(p, false));
    pool.sort((p, q) => use.get(p.name) - use.get(q.name));
    const p = pool[0];
    use.set(p.name, use.get(p.name) + 1); taken.add(c.cat + '|' + c.layout + '|' + p.name);
    out[c.id] = p;
  }
  return out;
}

/* ---------- type ----------
   Seven faces, all OFL, all vendored (scripts/fetch_fonts.mjs). Mapped from
   the face a card had, so a card keeps its VOICE (condensed stays condensed,
   serif stays serif) while losing the Canva shelf: Special Elite alone was on
   129 cards, and the typewriter, blackletter, horror, marker and pixel faces
   read as novelty on an ad asking a stranger to hand over a phone for cash
   (DESIGN-LAW 9). */
export const DISPLAY_MAP = {
  'Unbounded':['Russo One', 'Audiowide', 'Wallpoet', 'Press Start 2P', 'Bungee', 'Bungee Shade', 'Rubik Iso', 'Faster One', 'Orbitron'],
  'Sofia Sans Extra Condensed':['Squada One', 'Saira Condensed', 'Oswald', 'Barlow Condensed', 'Teko', 'Khand', 'Amatic SC', 'Bebas Neue', 'Anton'],
  'Big Shoulders Display':['Big Shoulders Stencil Display', 'Big Shoulders Display'],
  'Bricolage Grotesque':['Libre Franklin', 'Satoshi', 'Sora', 'Chivo', 'Manrope', 'Clash Display', 'Instrument Sans', 'Nunito', 'Jost', 'Syne'],
  'Gloock':['Pirata One', 'Rye', 'Cormorant Garamond', 'Instrument Serif', 'Melodrama', 'Zodiak'],
  'Young Serif':['Roboto Slab', 'Zilla Slab'],
  'Tilt Warp':['Knewave', 'Kaushan Script', 'Sedgwick Ave', 'Sedgwick Ave Display', 'Permanent Marker', 'Shrikhand', 'Gloria Hallelujah',
    'Cabin Sketch', 'Sniglet', 'Fascinate', 'Rubik Doodle Shadow', 'Rubik Dirt', 'Rubik Marker Hatch', 'Rubik Wet Paint', 'Creepster',
    'Nosifer', 'Bangers', 'Luckiest Guy', 'Freckle Face', 'Patrick Hand', 'Kalam', 'Architects Daughter', 'Shadows Into Light', 'Nanum Pen Script'],
};
const D = {}; for (const k in DISPLAY_MAP) DISPLAY_MAP[k].forEach(f => { D[f] = k; });
export function displayFace(old, cat){
  if (old === 'Special Elite') return /^(gold|silver|coins)$/.test(cat) ? 'Gloock' : 'Young Serif';
  return D[old] || 'Bricolage Grotesque';
}
export const SUPPORT_FACE = 'Schibsted Grotesk';
export function numFace(old, display, oldDisplay){
  if (/Mono/.test(old || '')) return 'JetBrains Mono';
  if (old && old === oldDisplay) return display;
  if (D[old] && /Condensed|Oswald|Teko|Khand|Squada|Barlow|Saira/.test(old)) return 'Sofia Sans Extra Condensed';
  return SUPPORT_FACE;
}
/* weights each face actually ships (rule 20: never set a weight with no file) */
export const WEIGHTS = {
  'Unbounded':[500, 900], 'Bricolage Grotesque':[500, 800], 'Sofia Sans Extra Condensed':[500, 900], 'Schibsted Grotesk':[400, 900],
  'Gloock':[400, 400], 'Young Serif':[400, 400], 'Tilt Warp':[400, 400], 'JetBrains Mono':[400, 700], 'Big Shoulders Display':[600, 700],
};
export function snapWeight(face, w){
  const r = WEIGHTS[face]; if (!r) return w;
  let n = w === 'bold' ? 700 : w === 'normal' || w === undefined ? 400 : +w || 400;
  n = clamp(n, r[0], r[1]);
  if (face === 'JetBrains Mono' || face === 'Big Shoulders Display') n = n >= 650 ? r[1] : r[0];
  return n;
}
