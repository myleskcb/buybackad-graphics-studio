/* ONE HUNDRED COMPLETE THEMES.
 *
 * A theme here is the whole ad, not a swatch: ground, ink, secondary ink,
 * accent, a supporting colour, the plate treatment the phone line sits on, and
 * a three-role type pairing. Every asset in the render comes from this record,
 * so nothing is left on the previous theme's colour.
 *
 * Built in OKLCH (see oklch.mjs) so lightness is perceptual and a family of ten
 * reads as a family. Accent relationships are split-complementary, triadic or
 * analogous — never exact complements, which vibrate (DESIGN-LAW rule 41).
 *
 * THE BRIEF, from the owner: lighter, pastel and vibrant prioritised; nothing
 * that lands as dark orange or brown; three or four colours, not a colour-
 * theory exercise; simple enough for a non-designer to pick from. So eight of
 * the ten families sit on light grounds, and the two that go deep (Jewel,
 * Duotone) stay high-chroma and clean rather than muddy — depth without mud.
 *
 * Legibility is enforced HERE, not audited afterwards: build() darkens or
 * lightens ink until it clears 4.5:1 on its own ground and pushes the accent to
 * 3:1, so no theme in this set can be unreadable by construction.
 */
import { oklch, cr, inkOn, lum } from './oklch.mjs';

/* Face pools ranked by the shortlist. Manrope was kept 8 times, Jost 4, Space
   Grotesk 4 — geometric and humanist sans with open, even numerals, which is
   the company iOS glass keeps. Display faces are the ones that survived on a
   kept card; nothing here was passed over ten times. */
const DISPLAY = ['Clash Display','Syne','Unbounded','Oswald','Anton',
                 'Bebas Neue','Big Shoulders Display','Khand','Instrument Serif','Melodrama'];
const SUPPORT = ['Manrope','Jost','Sora','Satoshi','Chivo'];
const NUMER   = ['Manrope','Jost','Space Grotesk','Sora','Chivo',
                 'IBM Plex Mono','Space Mono','Oswald','Khand','Bebas Neue'];
export const FACES = [...new Set([...DISPLAY, ...SUPPORT, ...NUMER,
  'Clash Display','Satoshi','Khand','Melodrama','Zodiak'])];

/* ink that clears 4.5:1 on its ground, walking L in OKLCH so the hue survives */
function inkFor(groundHex, H, C, startL, wantDark){
  for (let i = 0; i < 40; i++){
    const L = wantDark ? Math.max(0.10, startL - i*0.02) : Math.min(0.99, startL + i*0.02);
    const hex = oklch(L, C, H);
    if (cr(hex, groundHex) >= 4.6) return hex;
  }
  return wantDark ? '#141110' : '#fbfaf8';
}
function accentFor(groundHex, H, C, startL, wantDark){
  for (let i = 0; i < 40; i++){
    const L = wantDark ? Math.max(0.16, startL - i*0.02) : Math.min(0.98, startL + i*0.02);
    const hex = oklch(L, C, H);
    if (cr(hex, groundHex) >= 3.1) return hex;
  }
  return wantDark ? '#1a1614' : '#fbfaf8';
}

/* one theme from explicit parameters — every number here is a decision */
/* Owner, 2026-09-02, looking at the Set 5 cards: "these are good colors, but
   slightly muted" — accent and support run 10% more chroma; the ground gets
   a whisper (4%) so a pastel stays a pastel. */
/* LAB_VIB overrides the chroma multiplier for one render. Owner, 2026-09-04,
   looking at the library: "a bit too muted in a lot of themes" — measured
   colourfulness across 702 cards was 0.29. The default stays; a set rendered
   with LAB_VIB=1.45 is how the brighter end gets tried without moving the
   baseline under every earlier set. */
const VIB = +(process.env.LAB_VIB || 1.10), VIB_GROUND = +(process.env.LAB_VIB_GROUND || 1.04);
const clampL = v => Math.max(0.12, Math.min(0.96, v));

function build(o){
  const { id, name, family, H, rel, rel2, gL, gC, aL, aC, sL, sC,
          plate, faces, bg, wash, photo, mono } = o;
  const c1 = oklch(gL, gC * VIB_GROUND, H);
  const c2 = oklch(Math.max(0.06, gL - 0.07), Math.min(0.4, gC * 1.15 * VIB_GROUND), H + 8);
  const groundIsLight = lum(c1) > 0.22;
  const ink    = inkFor(c1, H, groundIsLight ? 0.045 : 0.02, groundIsLight ? 0.34 : 0.90, groundIsLight);
  const sub    = accentFor(c1, H, 0.035, groundIsLight ? 0.50 : 0.78, groundIsLight);
  const accent = accentFor(c1, H + rel, aC * VIB, aL, groundIsLight);
  /* "realistically only use 2 colors. some 1 color with multiple tones."
     Every other theme in a family is ONE-HUE: its support is a second tone of
     the accent hue rather than a third hue, so the card reads as ground +
     one colour in tones. The rest keep their split-complementary support. */
  const supportHue = mono ? H + rel : H + rel2;
  const support = mono
    ? accentFor(c1, H + rel, aC * VIB * 0.72, clampL(groundIsLight ? aL + 0.16 : aL - 0.16), groundIsLight)
    : accentFor(c1, H + rel2, sC * VIB, sL, groundIsLight);
  /* two more tones of the accent hue — one lighter, one deeper — so a card
     can carry the palette in three steps without reaching for a new colour */
  const accent2 = oklch(clampL(aL + 0.17), aC * VIB * 0.78, H + rel);
  const accent3 = oklch(clampL(aL - 0.19), aC * VIB * 0.96, H + rel);
  /* tone ladders: every luminance step of the accent and support hues. The
     composer snaps any colour it cannot map by role onto one of these, so a
     base template's own mint or coral can never survive onto a Blue Market
     card — the leak the owner spotted ("not matching the color palette"). */
  const ladder = hue => Array.from({ length: 17 }, (_, k) => oklch(0.15 + k * 0.05, aC * VIB * 0.9, hue));
  return {
    id, name, family, bg: bg || (photo ? 'photo' : 'grad'), wash: wash || null, photo: !!photo,
    c1, c2, ink, sub, accent, support, accent2, accent3, mono: !!mono,
    onAccent: inkOn(accent), onSupport: inkOn(support), onAccent2: inkOn(accent2), onAccent3: inkOn(accent3),
    ladder: { accent: ladder(H + rel), support: ladder(supportHue) },
    plate, faces,
    hues: { base:H, accent:(H+rel+360)%360, support:(supportHue+360)%360, rel, rel2 },
  };
}

/* PLATE TREATMENTS — the phone line's material, part of the theme, not a
   separate axis. Includes the two iOS languages the owner asked for. */
const PL = {
  /* Weighted by the owner's own shortlist from the phone-line lab: 34 kept of
     100, and 24 of those 34 were tint-over-photo glass. iOS 7 flat took 7 of
     its 10 and Liquid Glass 5 of 10; the SOLID PLATE — the treatment the
     library ships today — took 2 of 10, and Ribbon took 1. So solid slabs are
     out of the rotation and every family below lands on something that was
     actually picked. */
  ios7:    { shape:'rect', fill:'tint',  rx:26, rim:'hair', spec:false, inner:false, drop:false },
  liquid:  { shape:'pill', fill:'tint',  rx:0,  rim:'spec', spec:true,  inner:true,  drop:true  },
  glasscap:{ shape:'rect', fill:'tint',  rx:38, rim:'spec', spec:true,  inner:true,  drop:true  },
  tag:     { shape:'tag',  fill:'tint',  rx:14, rim:'hair', spec:false, inner:false, drop:true  },
  stub:    { shape:'stub', fill:'tint',  rx:16, rim:'hair', spec:false, inner:false, drop:true  },
  split:   { shape:'rect', fill:'tint',  rx:20, rim:'hair', spec:false, inner:false, drop:true, split:true },
  hairline:{ shape:'rect', fill:'tint',  rx:30, rim:'spec', spec:false, inner:false, drop:false, faint:true },
  ticks:   { shape:'none', fill:'none',  rx:0,  rim:false,  spec:false, inner:false, drop:false, bracket:true },
};

const F = (d, s, n) => ({ display:d, support:s, num:n });

/* Ten families. Each names its ground band, its accent relationship, and why. */
const FAMILIES = [
  { key:'pa', family:'Pastel',   plate:PL.ios7,
    gL:0.945, gC:0.055, aL:0.62, aC:0.18, sL:0.70, sC:0.10, rel:155, rel2:-40,
    hues:[28,60,95,140,175,205,240,275,310,340],
    faces:[F('Clash Display','Satoshi','Space Grotesk'),F('Syne','Manrope','Manrope'),
           F('Unbounded','Jost','Jost'),F('Clash Display','Sora','Space Mono'),
           F('Big Shoulders Display','Satoshi','Chivo'),F('Syne','Chivo','Space Grotesk'),
           F('Clash Display','Manrope','Manrope'),F('Unbounded','Satoshi','Sora'),
           F('Syne','Jost','Space Grotesk'),F('Clash Display','Outfit','Chivo')] },

  { key:'su', family:'Sunlit',   plate:PL.tag,
    gL:0.915, gC:0.085, aL:0.55, aC:0.19, sL:0.66, sC:0.13, rel:158, rel2:32,
    hues:[38,50,62,74,86,44,56,68,80,32],
    faces:[F('Anton','Satoshi','Oswald'),F('Oswald','Manrope','Bebas Neue'),
           F('Archivo Black','Jost','Archivo Black'),F('Bebas Neue','Satoshi','Khand'),
           F('Khand','Chivo','Chivo'),F('Anton','Sora','Space Grotesk'),
           F('Oswald','Satoshi','Oswald'),F('Archivo Black','Manrope','Manrope'),
           F('Big Shoulders Display','Jost','Bebas Neue'),F('Anton','Outfit','Khand')] },

  { key:'ca', family:'Cool Air', plate:PL.liquid,
    gL:0.935, gC:0.06, aL:0.58, aC:0.185, sL:0.68, sC:0.11, rel:-160, rel2:-30,
    hues:[188,200,212,224,236,248,194,206,218,230],
    faces:[F('Clash Display','Manrope','Space Grotesk'),F('Syne','Sora','Sora'),
           F('Jost','Jost','Manrope'),F('Unbounded','Manrope','Space Mono'),
           F('Clash Display','Satoshi','IBM Plex Mono'),F('Sora','Sora','Space Grotesk'),
           F('Syne','Manrope','Manrope'),F('Jost','Satoshi','Sora'),
           F('Clash Display','Jost','Space Grotesk'),F('Unbounded','Sora','Manrope')] },

  { key:'cd', family:'Candy',    plate:PL.split,
    gL:0.845, gC:0.115, aL:0.50, aC:0.21, sL:0.62, sC:0.15, rel:120, rel2:-120,
    hues:[15,45,90,150,190,225,260,295,325,355],
    faces:[F('Unbounded','Satoshi','Archivo Black'),F('Syne','Manrope','Space Grotesk'),
           F('Clash Display','Jost','Manrope'),F('Bebas Neue','Satoshi','Bebas Neue'),
           F('Archivo Black','Chivo','Chivo'),F('Unbounded','Sora','Sora'),
           F('Syne','Satoshi','Space Grotesk'),F('Clash Display','Manrope','Khand'),
           F('Big Shoulders Display','Jost','Oswald'),F('Unbounded','Outfit','Manrope')] },

  { key:'pp', family:'Paper',    plate:PL.hairline,
    gL:0.972, gC:0.012, aL:0.56, aC:0.21, sL:0.64, sC:0.09, rel:0, rel2:150,
    hues:[20,58,96,134,172,210,248,286,324,2],
    faces:[F('Instrument Serif','Satoshi','Space Mono'),F('Melodrama','Manrope','IBM Plex Mono'),
           F('Instrument Serif','Jost','Space Grotesk'),F('Clash Display','Satoshi','Chivo'),
           F('Melodrama','Sora','Space Mono'),F('Instrument Serif','Chivo','IBM Plex Mono'),
           F('Syne','Manrope','Space Grotesk'),F('Melodrama','Satoshi','Chivo'),
           F('Instrument Serif','Jost','Space Mono'),F('Clash Display','Outfit','IBM Plex Mono')] },

  { key:'du', family:'Duotone',  plate:PL.split,
    gL:0.665, gC:0.145, aL:0.94, aC:0.06, sL:0.30, sC:0.11, rel:22, rel2:165,
    hues:[12,40,72,108,150,186,222,258,300,336],
    faces:[F('Archivo Black','Satoshi','Archivo Black'),F('Anton','Manrope','Oswald'),
           F('Bebas Neue','Jost','Bebas Neue'),F('Oswald','Satoshi','Khand'),
           F('Clash Display','Chivo','Chivo'),F('Archivo Black','Sora','Manrope'),
           F('Anton','Satoshi','Oswald'),F('Big Shoulders Display','Manrope','Space Grotesk'),
           F('Bebas Neue','Jost','Khand'),F('Clash Display','Outfit','Sora')] },

  { key:'jw', family:'Jewel',    plate:PL.glasscap,
    gL:0.375, gC:0.105, aL:0.86, aC:0.13, sL:0.74, sC:0.10, rel:150, rel2:-35,
    hues:[262,286,310,334,206,182,158,134,238,354],
    faces:[F('Melodrama','Satoshi','Space Grotesk'),F('Clash Display','Manrope','Manrope'),
           F('Syne','Sora','Sora'),F('Instrument Serif','Satoshi','Space Mono'),
           F('Unbounded','Jost','Manrope'),F('Melodrama','Manrope','Chivo'),
           F('Clash Display','Sora','Space Grotesk'),F('Syne','Satoshi','Manrope'),
           F('Instrument Serif','Jost','IBM Plex Mono'),F('Unbounded','Chivo','Sora')] },

  { key:'io', family:'iOS Flat', plate:PL.ios7,
    gL:0.955, gC:0.028, aL:0.60, aC:0.20, sL:0.70, sC:0.12, rel:0, rel2:145,
    // the iOS system hues: blue, green, indigo, orange, pink, purple, red, teal, yellow, mint
    hues:[240,142,275,52,350,300,25,195,88,168],
    faces:[F('Jost','Jost','Jost'),F('Manrope','Manrope','Manrope'),
           F('Sora','Sora','Sora'),F('Jost','Manrope','Space Grotesk'),
           F('Manrope','Jost','Manrope'),F('Sora','Manrope','Sora'),
           F('Jost','Sora','Manrope'),F('Manrope','Sora','Jost'),
           F('Sora','Jost','Space Grotesk'),F('Jost','Manrope','Manrope')] },

  { key:'gl', family:'Liquid Glass', plate:PL.liquid, photo:true, wash:'light',
    gL:0.90, gC:0.05, aL:0.55, aC:0.20, sL:0.66, sC:0.12, rel:158, rel2:-38,
    hues:[210,30,150,270,90,330,190,60,240,120],
    faces:[F('Clash Display','Manrope','Manrope'),F('Syne','Sora','Sora'),
           F('Jost','Jost','Space Grotesk'),F('Clash Display','Satoshi','Manrope'),
           F('Unbounded','Manrope','Sora'),F('Sora','Sora','Manrope'),
           F('Syne','Jost','Space Grotesk'),F('Clash Display','Manrope','Sora'),
           F('Jost','Satoshi','Manrope'),F('Unbounded','Sora','Space Grotesk')] },

  { key:'ik', family:'Ink Pop',  plate:PL.ticks,
    gL:0.955, gC:0.015, aL:0.54, aC:0.22, sL:0.34, sC:0.09, rel:152, rel2:0,
    hues:[210,246,282,318,354,30,66,102,138,174],
    faces:[F('Archivo Black','Satoshi','Archivo Black'),F('Anton','Manrope','Space Mono'),
           F('Clash Display','Jost','Space Grotesk'),F('Oswald','Satoshi','Oswald'),
           F('Big Shoulders Display','Chivo','Chivo'),F('Archivo Black','Sora','Manrope'),
           F('Bebas Neue','Manrope','Bebas Neue'),F('Anton','Jost','Khand'),
           F('Clash Display','Satoshi','IBM Plex Mono'),F('Syne','Outfit','Space Grotesk')] },

  /* Two more, 2026-09-02, "try some more theme variations next". Night Neon
     goes deeper than Jewel and answers it with high-chroma light accents —
     depth, no mud. Chalk is the opposite: a near-white ground, one strong
     accent, ink for everything else — the poster-on-a-wall look. */
  { key:'nn', family:'Night Neon', plate:PL.glasscap,
    gL:0.26, gC:0.05, aL:0.82, aC:0.22, sL:0.72, sC:0.17, rel:135, rel2:-110,
    hues:[250,290,330,10,170,200,140,50,230,310],
    faces:[F('Unbounded','Manrope','Space Grotesk'),F('Clash Display','Sora','Space Mono'),
           F('Syne','Satoshi','Manrope'),F('Bebas Neue','Manrope','Bebas Neue'),
           F('Archivo Black','Jost','Chivo'),F('Unbounded','Sora','Sora'),
           F('Clash Display','Manrope','IBM Plex Mono'),F('Syne','Jost','Space Grotesk'),
           F('Big Shoulders Display','Satoshi','Oswald'),F('Unbounded','Outfit','Manrope')] },

  /* Two more, 2026-09-03: "a space theme and a lined paper theme". Space is
     the deepest ground of all with bright, cool accents — the photograph is
     NASA's. Lined Paper is cream with pen-coloured accents; the ground is
     drawn, not photographed, and the plates are highlighter and sticky notes. */
  { key:'sp', family:'Space', plate:PL.glasscap,
    gL:0.16, gC:0.045, aL:0.84, aC:0.20, sL:0.74, sC:0.15, rel:140, rel2:-115,
    hues:[250,232,268,205,290,320,185,215,242,258],
    faces:[F('Unbounded','Manrope','Space Mono'),F('Syne','Sora','Space Grotesk'),
           F('Clash Display','Manrope','IBM Plex Mono'),F('Unbounded','Sora','Sora'),
           F('Syne','Satoshi','Space Mono'),F('Clash Display','Jost','Space Grotesk'),
           F('Unbounded','Manrope','Manrope'),F('Syne','Sora','IBM Plex Mono'),
           F('Clash Display','Satoshi','Space Mono'),F('Unbounded','Jost','Space Grotesk')] },
  { key:'lp', family:'Lined Paper', plate:PL.tag,
    gL:0.965, gC:0.014, aL:0.42, aC:0.16, sL:0.90, sC:0.18, rel:0, rel2:-155,
    hues:[250,20,145,285,200,350,30,262,170,8],
    faces:[F('Anton','Satoshi','Oswald'),F('Archivo Black','Manrope','Space Grotesk'),
           F('Oswald','Jost','Oswald'),F('Clash Display','Satoshi','Chivo'),
           F('Bebas Neue','Sora','Bebas Neue'),F('Anton','Manrope','Space Mono'),
           F('Archivo Black','Jost','Manrope'),F('Big Shoulders Display','Satoshi','Khand'),
           F('Oswald','Chivo','Chivo'),F('Clash Display','Outfit','Space Grotesk')] },
  { key:'ck', family:'Chalk', plate:PL.tag,
    gL:0.975, gC:0.006, aL:0.48, aC:0.24, sL:0.28, sC:0.03, rel:0, rel2:180,
    hues:[352,25,205,150,265,42,180,320,235,95],
    faces:[F('Anton','Satoshi','Oswald'),F('Archivo Black','Manrope','Space Grotesk'),
           F('Oswald','Jost','Oswald'),F('Clash Display','Satoshi','Chivo'),
           F('Bebas Neue','Sora','Bebas Neue'),F('Anton','Manrope','Space Mono'),
           F('Archivo Black','Jost','Manrope'),F('Big Shoulders Display','Satoshi','Khand'),
           F('Oswald','Chivo','Chivo'),F('Clash Display','Outfit','Space Grotesk')] },
];

/* Names a non-designer can choose from: the colour, then the job. */
const HUE_WORD = h => {
  const t = [[15,'Red'],[38,'Amber'],[62,'Gold'],[86,'Lime'],[125,'Green'],[160,'Mint'],
             [185,'Teal'],[205,'Sky'],[235,'Blue'],[268,'Indigo'],[300,'Violet'],
             [330,'Orchid'],[350,'Rose'],[361,'Red']];
  return (t.find(([d]) => h < d) || t[t.length-1])[1];
};
const NOUN = ['Cash','Offer','Payday','Counter','Ticket','Deal','Market','Trade','Value','Quote'];

export const THEMES = FAMILIES.flatMap(fam =>
  fam.hues.map((H, i) => build({
    id: fam.key + String(i+1).padStart(2,'0'),
    name: HUE_WORD(H) + ' ' + NOUN[i],
    family: fam.family, H, rel: fam.rel, rel2: fam.rel2,
    gL: fam.gL, gC: fam.gC, aL: fam.aL, aC: fam.aC, sL: fam.sL, sC: fam.sC,
    plate: fam.plate, faces: fam.faces[i], photo: fam.photo, wash: fam.wash,
    mono: i % 2 === 1,
  })));
