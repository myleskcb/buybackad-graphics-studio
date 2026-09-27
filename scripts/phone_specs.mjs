/* ONE HUNDRED PHONE-LINE TREATMENTS, WRITTEN DOWN.
 *
 * The library ships two: a solid accent plate and a white/grey block, in two
 * faces, and the thumbnails show it — every ad ends in the same rectangle.
 *
 * These are explicit records, not hash(id)%n. OPEN-ITEMS.md section D says the
 * fix for "feels configured at random" is a stored spec per design rather than
 * the output of a pass chain; this file is that, for one element. Ten families,
 * ten considered variants each. Every variant differs from its siblings on
 * purpose and the difference is readable here rather than inferred from a
 * render.
 *
 * FIELDS
 *   shape     rect | pill | stub | tag | ribbon | none
 *   fill      solid | grad | glass | showthrough | none
 *   blur      backdrop blur radius behind the plate (0 = no blur)
 *   tint      plate colour over the blur; alpha carries the opacity
 *   rim       1px light edge, the thing that sells glass
 *   sheen     highlight strip along the top inside edge
 *   ink       'auto' = measured near-black/near-white, else an explicit hex
 *   face      numerals face
 *   track     letter-spacing on the number
 *   kicker    small line above, null for none
 *   rule      underline weight, 0 for none
 *   bracket   corner ticks
 *   icon      glyph in a leading block
 */

// Free-for-commercial faces only: the five self-hosted house faces (Fontshare)
// plus OFL families from Google Fonts. Nothing redrawn from a commercial face.
export const HOUSE = ['Clash Display', 'Satoshi', 'Khand', 'Melodrama', 'Zodiak'];
export const GOOGLE = [
  'Space Grotesk', 'Archivo Black', 'Anton', 'Bebas Neue', 'Oswald',
  'Space Mono', 'IBM Plex Mono', 'Jost', 'Manrope', 'Syne',
  'Unbounded', 'Big Shoulders Display', 'Chivo', 'Instrument Serif', 'Sora',
];
export const FACES = [...HOUSE, ...GOOGLE];

const GLASS_DARK  = 'rgba(13,16,24,0.52)';   // DESIGN-LAW rule 10's tint
const GLASS_DEEP  = 'rgba(10,12,18,0.66)';
const GLASS_SOFT  = 'rgba(18,22,30,0.38)';
const GLASS_WARM  = 'rgba(34,24,16,0.50)';
const GLASS_LIGHT = 'rgba(244,242,238,0.62)';  // safe now: ink is chosen by measurement
const GLASS_MILK  = 'rgba(250,250,252,0.80)';

/* Rule 10 says frosted panels are dark-tinted, never white — because a 10%
   white wash gave WHITE TEXT no ground. That reasoning was about the ink, and
   the ink is no longer fixed: onAccent() and the measured table pick near-black
   on a light plate. So light glass is back on the table, at a real opacity
   rather than 10%, and the audit will say whether it holds. */

const F = (family, label, base, variants) => variants.map((v, i) => ({
  id: family + String(i + 1).padStart(2, '0'),
  family: label,
  ...base, ...v,
}));

export const SPECS = [
  // ── 1. iOS 7 FLAT GLASS (2013) — the flat era: hairline rims, saturated
  //       translucent tint, generous radius, ultralight numerals, no shadow and
  //       no sheen. Sells translucency with COLOUR, not with blur, which is the
  //       only way it survives a backdrop that was shot defocused already.
  ...F('i7', 'iOS 7 flat glass', {
    shape:'rect', rx:28, fill:'glass', blur:0, tint:'rgba(255,255,255,0.16)',
    rim:'hair', sheen:false, ink:'#ffffff', face:'Jost', size:66, weight:'300',
    track:3, kicker:null, rule:0, bracket:false, icon:null, w:700, h:112, flat:true,
  }, [
    {},
    { tint:'rgba(0,0,0,0.30)', face:'Manrope', weight:'300', size:64 },
    { tint:'rgba(64,156,255,0.30)', face:'Sora', weight:'300', size:62 },
    { tint:'rgba(255,255,255,0.24)', ink:'auto', face:'Jost', weight:'400', size:64 },
    { shape:'pill', tint:'rgba(255,45,85,0.30)', face:'Manrope', weight:'300', size:60 },
    { shape:'pill', tint:'rgba(52,199,89,0.30)', face:'Space Grotesk', weight:'300', size:60 },
    { tint:'rgba(255,149,0,0.32)', face:'Sora', weight:'400', size:60, rx:14 },
    { tint:'rgba(0,0,0,0.22)', face:'Jost', weight:'300', size:72, track:6, rx:40 },
    { kicker:'CALL OR TEXT', tint:'rgba(255,255,255,0.18)', face:'Manrope', weight:'300', size:58, h:128 },
    { tint:'rgba(90,200,250,0.30)', face:'Space Grotesk', weight:'400', size:58, shape:'pill' },
  ]),

  // ── 2. LIQUID GLASS (modern iOS) — a floating capsule with a bright specular
  //       top edge, a second inset sheet for depth, a light-catching rim and a
  //       soft drop. Concentric radii, no hard corners. This is the one that
  //       reads as "professional graphics" at thumbnail size.
  ...F('lg', 'Liquid glass', {
    shape:'pill', fill:'glass', blur:0, tint:'rgba(255,255,255,0.20)',
    rim:'spec', sheen:true, spec:true, inner:true, drop:true,
    ink:'#ffffff', face:'Manrope', size:60, weight:'700', track:1,
    kicker:null, rule:0, bracket:false, icon:null, w:620, h:124,
  }, [
    {},
    { tint:'rgba(16,20,30,0.46)', face:'Sora', size:60 },
    { tint:'rgba(255,255,255,0.30)', ink:'auto', face:'Jost', size:60 },
    { shape:'rect', rx:38, tint:'rgba(255,255,255,0.22)', face:'Space Grotesk', size:60 },
    { tint:'rgba(255,196,71,0.30)', face:'Manrope', size:58, icon:'✆' },
    { shape:'rect', rx:44, tint:'rgba(20,24,36,0.52)', face:'Satoshi', size:62 },
    { tint:'rgba(255,255,255,0.26)', ink:'auto', face:'Archivo Black', size:52, track:0 },
    { kicker:'TEXT PHOTOS FOR AN OFFER', tint:'rgba(255,255,255,0.20)', face:'Manrope', size:56, h:142 },
    { tint:'rgba(90,200,250,0.26)', face:'Sora', size:58, w:660 },
    { shape:'rect', rx:34, tint:'rgba(255,255,255,0.34)', ink:'auto', face:'Jost', size:62, w:680 },
  ]),

  // ── 3. SOLID — the current default, done properly: tight padding, tabular
  //       figures, measured ink, and a gradient that is not a beige slab.
  ...F('so', 'Solid plate', {
    shape:'rect', rx:22, fill:'solid', blur:0, tint:null, rim:false, sheen:false,
    ink:'auto', face:'Satoshi', size:64, track:0, kicker:null, rule:0,
    bracket:false, icon:null, w:660, h:116, accent:1,
  }, [
    {},
    { fill:'grad', face:'Clash Display', size:66 },
    { shape:'pill', face:'Bebas Neue', size:80, track:5 },
    { rx:6, face:'Anton', size:70 },
    { fill:'grad', shape:'pill', face:'Oswald', size:72, kicker:'TEXT FOR AN OFFER' },
    { face:'Space Grotesk', size:62, track:3, rx:34 },
    { accent:2, face:'Manrope', size:62 },
    { fill:'grad', accent:2, face:'Khand', size:78 },
    { face:'Archivo Black', size:58, rx:2, w:720 },
    { shape:'pill', accent:2, face:'Jost', size:64, icon:'✆' },
  ]),

  // ── 4. TICKET STUB — notched ends and a perforation. The library already has
  //       a ticketStub layout; the phone line never borrowed from it.
  ...F('ts', 'Ticket stub', {
    shape:'stub', rx:16, fill:'solid', blur:0, tint:null, rim:false, sheen:false,
    ink:'auto', face:'Space Mono', size:56, track:2, kicker:null, rule:0,
    bracket:false, icon:null, w:680, h:124, accent:1,
  }, [
    {},
    { face:'IBM Plex Mono', size:54, kicker:'ADMIT ONE OFFER' },
    { fill:'glass', blur:0, tint:GLASS_DEEP, face:'Space Mono', size:54 },
    { fill:'grad', face:'Oswald', size:66, track:4 },
    { fill:'glass', blur:0, tint:GLASS_MILK, face:'Chivo', size:58 },
    { face:'Khand', size:72, accent:2 },
    { fill:'grad', accent:2, face:'Anton', size:62 },
    { face:'Instrument Serif', size:68, track:1 },
    { fill:'glass', blur:0, tint:GLASS_WARM, face:'Zodiak', size:60 },
    { face:'Bebas Neue', size:76, track:5, h:112 },
  ]),

  // ── 5. TAG — one angled end and a punch hole. Reads as a price tag, which is
  //       what a cash offer is.
  ...F('tg', 'Price tag', {
    shape:'tag', rx:14, fill:'solid', blur:0, tint:null, rim:false, sheen:false,
    ink:'auto', face:'Khand', size:70, track:1, kicker:null, rule:0,
    bracket:false, icon:null, w:640, h:118, accent:1,
  }, [
    {},
    { fill:'grad', face:'Anton', size:64 },
    { fill:'glass', blur:0, tint:GLASS_DARK, face:'Satoshi', size:60 },
    { face:'Oswald', size:72, kicker:'PAID TODAY' },
    { fill:'glass', blur:0, tint:GLASS_LIGHT, face:'Space Grotesk', size:58 },
    { accent:2, face:'Big Shoulders Display', size:82 },
    { fill:'grad', face:'Clash Display', size:62 },
    { face:'Chivo', size:60, track:3 },
    { fill:'glass', blur:0, tint:GLASS_MILK, face:'Manrope', size:58 },
    { accent:2, face:'Bebas Neue', size:80, track:4 },
  ]),

  // ── 6. RULE — no plate at all. The number carries itself on a halo and a
  //       heavy underline. The lightest possible treatment, and the one the
  //       library never tries.
  ...F('ru', 'Underline', {
    shape:'none', fill:'none', blur:0, tint:null, rim:false, sheen:false,
    ink:'#ffffff', face:'Clash Display', size:80, track:1, kicker:null,
    rule:8, bracket:false, icon:null, w:640, h:120,
  }, [
    {},
    { face:'Anton', size:86, rule:6 },
    { face:'Instrument Serif', size:92, rule:4, track:2 },
    { face:'Bebas Neue', size:96, rule:10, track:6 },
    { kicker:'CALL OR TEXT', face:'Satoshi', size:70, rule:5 },
    { face:'Syne', size:74, rule:7 },
    { face:'Melodrama', size:88, rule:3 },
    { face:'Oswald', size:84, rule:12, track:2 },
    { face:'Space Grotesk', size:72, rule:6, track:4 },
    { face:'Unbounded', size:64, rule:8 },
  ]),

  // ── 7. BRACKETS — corner ticks instead of a box. Frames the number without
  //       putting a slab across the ad.
  ...F('br', 'Corner ticks', {
    shape:'none', fill:'none', blur:0, tint:null, rim:false, sheen:false,
    ink:'#ffffff', face:'Space Mono', size:64, track:4, kicker:null, rule:0,
    bracket:true, icon:null, w:680, h:128,
  }, [
    {},
    { face:'IBM Plex Mono', size:60, track:6 },
    { fill:'glass', blur:0, tint:GLASS_SOFT, face:'Space Grotesk', size:64 },
    { face:'Jost', size:70, track:2 },
    { kicker:'TEXT PHOTOS', face:'Chivo', size:62 },
    { fill:'glass', blur:0, tint:GLASS_DEEP, face:'Manrope', size:62 },
    { face:'Khand', size:80, track:3 },
    { face:'Archivo Black', size:58 },
    { fill:'glass', blur:0, tint:GLASS_LIGHT, ink:'auto', face:'Sora', size:60 },
    { face:'Big Shoulders Display', size:86, track:4 },
  ]),

  // ── 8. SPLIT — a leading block for the verb and a second for the number, so
  //       the CTA and the digits stop competing inside one rectangle.
  ...F('sp', 'Split chip', {
    shape:'rect', rx:20, fill:'solid', blur:0, tint:null, rim:false, sheen:false,
    ink:'auto', face:'Satoshi', size:58, track:0, kicker:null, rule:0,
    bracket:false, icon:'✆', split:true, w:720, h:114, accent:1,
  }, [
    {},
    { shape:'pill', face:'Manrope', size:56 },
    { fill:'glass', blur:0, tint:GLASS_DARK, face:'Space Grotesk', size:58 },
    { icon:'✉', face:'Jost', size:56, fill:'grad' },
    { fill:'glass', blur:0, tint:GLASS_MILK, face:'Chivo', size:56 },
    { shape:'pill', accent:2, face:'Bebas Neue', size:74, track:4 },
    { icon:'→', face:'Oswald', size:64, fill:'grad' },
    { fill:'glass', blur:0, tint:GLASS_LIGHT, face:'Archivo Black', size:52 },
    { icon:'✆', face:'Khand', size:72, accent:2 },
    { shape:'pill', fill:'glass', blur:0, tint:GLASS_SOFT, face:'Syne', size:54 },
  ]),

  // ── 9. RIBBON — an angled band with folded tails. The library uses a ribbon
  //       for kickers and never for the number.
  ...F('rb', 'Ribbon', {
    shape:'ribbon', rx:0, fill:'solid', blur:0, tint:null, rim:false, sheen:false,
    ink:'auto', face:'Anton', size:64, track:1, kicker:null, rule:0,
    bracket:false, icon:null, angle:-3, w:700, h:112, accent:1,
  }, [
    {},
    { angle:-5, face:'Bebas Neue', size:76, track:5 },
    { fill:'grad', face:'Clash Display', size:62 },
    { angle:2, face:'Oswald', size:70 },
    { fill:'glass', blur:0, tint:GLASS_DEEP, face:'Satoshi', size:60 },
    { angle:-6, accent:2, face:'Khand', size:78 },
    { fill:'grad', angle:3, face:'Archivo Black', size:56 },
    { fill:'glass', blur:0, tint:GLASS_MILK, face:'Chivo', size:58, angle:-2 },
    { angle:-4, face:'Big Shoulders Display', size:84, accent:2 },
    { fill:'grad', angle:-3, face:'Unbounded', size:52 },
  ]),

  // ── 10. HAIRLINE — a stroke and almost nothing else. Depends entirely on the
  //        blur behind it, which is the point of trying it.
  ...F('hl', 'Hairline', {
    shape:'rect', rx:30, fill:'glass', blur:0, tint:'rgba(255,255,255,0.06)',
    rim:true, sheen:false, ink:'#ffffff', face:'Jost', size:64, track:3,
    kicker:null, rule:0, bracket:false, icon:null, w:660, h:116, hairline:true,
  }, [
    {},
    { face:'Space Grotesk', size:62, rx:10 },
    { tint:'rgba(255,255,255,0.10)', blur:0, face:'Manrope', size:60 },
    { shape:'pill', face:'Bebas Neue', size:78, track:6 },
    { tint:'rgba(0,0,0,0.22)', face:'Sora', size:60 },
    { tint:'rgba(255,255,255,0.14)', ink:'auto', face:'Archivo Black', size:54 },
    { rx:4, face:'Oswald', size:72, blur:0 },
    { shape:'pill', tint:'rgba(0,0,0,0.30)', face:'Syne', size:58 },
    { kicker:'TEXT FOR AN OFFER', face:'Satoshi', size:58, h:132 },
    { tint:'rgba(255,255,255,0.08)', face:'Instrument Serif', size:74, track:2 },
  ]),
];
