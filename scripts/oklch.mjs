/* OKLCH → sRGB, with gamut mapping.
 *
 * DESIGN-LAW rule 40: colour is computed in OKLCH, never sRGB. The reason is
 * the whole point of this exercise — in HSL, "lightness 0.6" is a different
 * apparent brightness for yellow than for blue, so a palette built by moving
 * HSL numbers around comes out uneven and muddy in places. In OKLCH, L is
 * perceptual: two colours at the same L genuinely look equally bright, which is
 * what lets a family of ten themes feel like a family.
 *
 * Rule 41: accents are split-complementary (±150-165°), never exact
 * complements — a true 180° pair vibrates and reads as a clash.
 */
const clamp01 = v => Math.max(0, Math.min(1, v));
const toSrgb = c => c <= 0.0031308 ? c*12.92 : 1.055*Math.pow(c, 1/2.4) - 0.055;
const toLin  = c => c <= 0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4);

function oklabToLinear(L, a, b){
  const l_ = L + 0.3963377774*a + 0.2158037573*b;
  const m_ = L - 0.1055613458*a - 0.0638541728*b;
  const s_ = L - 0.0894841775*a - 1.2914855480*b;
  const l = l_*l_*l_, m = m_*m_*m_, s = s_*s_*s_;
  return [
    +4.0767416621*l - 3.3077115913*m + 0.2309699292*s,
    -1.2684380046*l + 2.6097574011*m - 0.3413193965*s,
    -0.0041960863*l - 0.7034186147*m + 1.7076147010*s,
  ];
}
const inGamut = rgb => rgb.every(v => v >= -0.0005 && v <= 1.0005);

/* Reduce chroma until the colour fits sRGB. Clipping channels instead shifts
   the hue, which is how a "coral" palette quietly becomes a red one. */
export function oklch(L, C, H){
  const h = H * Math.PI / 180;
  let c = C;
  let rgb = oklabToLinear(L, c*Math.cos(h), c*Math.sin(h));
  for (let i = 0; i < 48 && !inGamut(rgb); i++){
    c *= 0.94;
    rgb = oklabToLinear(L, c*Math.cos(h), c*Math.sin(h));
  }
  return '#' + rgb.map(v => Math.round(clamp01(toSrgb(clamp01(v)))*255).toString(16).padStart(2,'0')).join('');
}
export const lum = hex => {
  const n = parseInt(String(hex).replace('#',''),16);
  const [r,g,b] = [(n>>16)&255,(n>>8)&255,n&255].map(v => toLin(v/255));
  return 0.2126*r + 0.7152*g + 0.0722*b;
};
export const cr = (a,b) => { const A=lum(a), B=lum(b), hi=Math.max(A,B), lo=Math.min(A,B);
  return +((hi+0.05)/(lo+0.05)).toFixed(2); };
/* near-black or near-white, whichever wins on this colour — the same rule
   onAccent() and the measured contrast table use */
export const inkOn = (hex, dark='#141110', light='#fbfaf8') =>
  cr(light, hex) >= cr(dark, hex) ? light : dark;
