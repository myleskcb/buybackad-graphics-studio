/* STEP STYLES — the looks a Steps Flow card's three plates can wear.
 *
 * The owner, 2026-11-11 and 12, of stepsFlow-cd10-20: "what about outlines?
 * varying colored outlines? glows? pattern fill behind? ideas", then "party
 * colors", "the pattern fill", "color accents", "all good", and of the card as
 * built, "The more styles the better but definitely night and day improvement".
 *
 * One pure function, so the record a script writes and the picture a prototype
 * paints come from the same code. It takes a showcase record and its index
 * card and restyles the three step plates in place. Self-contained on purpose
 * (it is also handed to the page as text), so no imports and no outer names.
 *
 *   party     the third plate is the one that pays: money green, a quiet $
 *             lattice and party-colour confetti (app.js, partyPlate); an
 *             outline on each plate, red, yellow, green
 *   pattern   the third plate green with the $ lattice, no confetti
 *   accents   the card's own plates, each with an outline: red, yellow, green
 *   outline   the card's own plates, one outline in the card's accent
 *   glow      the card's own plates; the third glows in the card's accent
 *   solid     all three plates the colour of the number's plate ("all solid
 *             matching colors"), the numerals in ink with no boxes
 *
 * Whatever the style, the stack is made consistent first ("we need
 * consistency"): the sheen bars go, the plates take one width, the numerals
 * one size, the labels one size, the number boxes one style.
 *
 * fabric measures an object WITH its stroke, from its top-left, so a plate
 * given a wider outline is given a smaller path: it stands in exactly the box
 * it had, and nothing drawn on it moves (audit_card r72).
 */
export const STEP_STYLES = ['party', 'pattern', 'accents', 'outline', 'glow', 'solid'];

export function applyStepStyle(rec, card, style){
  const STYLES = ['party', 'pattern', 'accents', 'outline', 'glow', 'solid'];
  if (!STYLES.includes(style)) throw new Error('unknown step style: ' + style);
  const GREEN = '#1f9d55', LATTICE = '#2bb467', WHITE = '#ffffff', INK = '#101014';
  const RYG = ['#ff4d6d', '#ffd60a', '#7be0a4'];
  const rgb = c => {
    const s = String(c || '').trim(); let m;
    if ((m = /^#([0-9a-f]{6})$/i.exec(s))){ const n = parseInt(m[1], 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
    if ((m = /^#([0-9a-f]{3})$/i.exec(s))) return m[1].split('').map(h => parseInt(h + h, 16));
    if ((m = /^rgba?\(([^)]+)\)/i.exec(s))) return m[1].split(',').slice(0, 3).map(v => +v);
    return null;
  };
  const lum = c => { const v = rgb(c); if (!v) return 0.5; const f = x => { x /= 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(v[0]) + 0.7152 * f(v[1]) + 0.0722 * f(v[2]); };
  const inkOn = c => lum(c) > 0.32 ? INK : WHITE;
  const solidOf = c => { const v = rgb(c); return v ? '#' + v.map(x => Math.round(x).toString(16).padStart(2, '0')).join('') : c; };

  const all = rec.tpl.layers, L = n => all.find(l => l.name === n);
  const rows = [1, 2, 3].map(i => ({ i, card: L('Step Card ' + i), box: L('Step Num Box ' + i), num: L('Step Num ' + i), lab: L('Step Lab ' + i), mic: L('Step Micro ' + i) }));
  if (rows.some(r => !r.card || !r.num || !r.lab || !r.card.props || typeof r.card.props.width !== 'number')) throw new Error('not a three-step stack this pass knows');
  const plate = L('Phone Plate');
  const accent = (card && card.accent) || (plate && plate.props && typeof plate.props.fill === 'string' && plate.props.fill) || '#f6c21c';

  /* the stack as it stands, before anything changes: the box each plate
     occupies (path plus stroke), the plates' own tone, the first row's inks */
  const sw0 = r => +r.card.props.strokeWidth || 0;
  const outerW = Math.max(...rows.map(r => r.card.props.width + sw0(r))), outerH = Math.max(...rows.map(r => r.card.props.height + sw0(r)));
  const pill = rows[0].card.props.rx != null && rows[0].card.props.rx >= rows[0].card.props.height / 2 - 1;
  const base = rows[0].card.props.fill, baseStroke = rows[0].card.props.stroke, baseSw = sw0(rows[0]);
  const labInk = typeof base === 'string' ? inkOn(base) : rows[0].lab.props.fill;
  const numSize = Math.min(...rows.map(r => +r.num.props.fontSize || 52)), labSize = Math.min(...rows.map(r => +r.lab.props.fontSize || 34));
  const micSize = Math.min(...rows.filter(r => r.mic).map(r => +r.mic.props.fontSize || 24));
  /* one number style: every box is the FIRST row's box, in the card's own
     colour. Not the number plate's: a tagline look paints every shape of one
     colour as kin, and boxes given the band's gold took the gold card's band
     into the look's gold-to-green gradient with them (stepsFlow-nn01-31). */
  const plateFill = plate && plate.props && typeof plate.props.fill === 'string' ? solidOf(plate.props.fill) : '#223249';
  const boxFill = (rows[0].box && typeof rows[0].box.props.fill === 'string' && rows[0].box.props.fill) || plateFill;
  const boxInk = (rows[0].box && rows[0].num.props.fill) || inkOn(boxFill);

  rec.tpl.layers = all.filter(l => !/^Step Card \d+ Sheen$/.test(l.name || ''));
  const setPlate = (r, fill, stroke, sw) => {
    const p = r.card.props; p.fill = fill;
    if (sw > 0){ p.stroke = stroke; p.strokeWidth = sw; } else { delete p.stroke; delete p.strokeWidth; }
    p.width = outerW - sw; p.height = outerH - sw; if (pill) p.rx = (outerH - sw) / 2;
    delete p.pgUser; delete r.card.party;
  };
  rows.forEach((r, k) => {
    const paid = k === 2;
    let fill = base, stroke = baseStroke, sw = baseSw, ink = labInk, user = false, party = null, glow = null;
    if (style === 'party'){ stroke = RYG[k]; sw = 7; user = true; if (paid){ fill = GREEN; ink = WHITE; party = { base: GREEN, glyph: LATTICE, seed: 5, pieces: 60, from: 0.65 }; } }
    else if (style === 'pattern'){ if (paid){ fill = GREEN; ink = WHITE; party = { base: GREEN, glyph: LATTICE, seed: 5, pieces: 0 }; } }
    else if (style === 'accents'){ stroke = RYG[k]; sw = 7; user = true; }
    else if (style === 'outline'){ stroke = accent; sw = 7; }
    else if (style === 'glow'){ if (paid) glow = accent; }
    else if (style === 'solid'){ fill = plateFill; ink = inkOn(plateFill); stroke = null; sw = 0; }
    setPlate(r, fill, stroke, sw);
    if (user) r.card.props.pgUser = true;
    if (party) r.card.party = party;
    if (glow){ const v = rgb(glow) || [255, 200, 40]; r.card.props.shadow = { color: 'rgba(' + v.map(Math.round).join(',') + ',0.95)', blur: 46, offsetX: 0, offsetY: 0 }; }
    r.lab.props.fill = ink; r.lab.props.fontSize = labSize;
    if (r.mic){ r.mic.props.fill = ink; r.mic.props.fontSize = micSize; }
    r.num.props.fontSize = numSize;
    if (style === 'solid'){
      /* no boxes: the numeral stands on the plate in the plate's ink */
      if (r.box) rec.tpl.layers = rec.tpl.layers.filter(l => l !== r.box);
      r.num.props.fill = ink;
    } else if (r.box){
      r.box.props.fill = boxFill; r.num.props.fill = boxInk;
    }
  });
  return { style, plates: outerW + ' x ' + outerH, numeral: numSize, label: labSize, box: style === 'solid' ? 'none' : boxFill, accent };
}

/* ROOM FOR THE NUMBER. The owner, 2026-11-11, of the gold card's footer band:
 * "This CTA is awkwardly spaced and has poor alignment since there's no margin
 * and it's touching the edge of the bar the yellow bar". Measured on
 * stepsFlow-nn01-31: the number's box began 9px ABOVE the band's top edge.
 *
 * Why: the band runs off the card's foot, and nothing may be set inside the
 * 6% guide (rule 57), so the website line sits on the guide, the number sits
 * on the website line, and a band only 192px deep leaves the number nowhere
 * to go but its top edge. The words cannot go lower; the band has to start
 * higher. So the three rows give up a tenth of their height and move up a
 * little, the band begins one gap under them, and the number has clear band
 * above it. Everything on a row moves with the middle of its row.
 * Applied once: the record is stamped, and a second run leaves it alone. */
export function roomForNumber(rec, opts){
  const o = Object.assign({ shrink: 0.9, lift: 16, gap: 14 }, opts || {});
  if (rec.tpl.__room) return null;
  const all = rec.tpl.layers, L = n => all.find(l => l.name === n);
  const rows = [1, 2, 3].map(i => ({ card: L('Step Card ' + i), kids: ['Step Num Box ', 'Step Num ', 'Step Lab ', 'Step Micro '].map(n => L(n + i)).filter(Boolean) }));
  const plate = L('Phone Plate');
  if (rows.some(r => !r.card) || !plate) throw new Error('no three-step stack over a number plate');
  const sw = r => +r.card.props.strokeWidth || 0;
  const h0 = rows[0].card.props.height + sw(rows[0]), h = Math.round(h0 * o.shrink);
  const pill = rows[0].card.props.rx != null && rows[0].card.props.rx >= rows[0].card.props.height / 2 - 1;
  let y = rows[0].card.props.top - o.lift;
  rows.forEach(r => {
    const d = (y + h / 2) - (r.card.props.top + (r.card.props.height + sw(r)) / 2);
    r.card.props.top = y; r.card.props.height = h - sw(r); if (pill) r.card.props.rx = (h - sw(r)) / 2;
    r.kids.forEach(l => { l.props.top += d; });
    y += h + o.gap;
  });
  const foot = plate.props.top + plate.props.height, was = plate.props.top;
  plate.props.top = y; plate.props.height = foot - y;
  rec.tpl.__room = { rows: h, bandFrom: was, bandTo: y };
  return rec.tpl.__room;
}

