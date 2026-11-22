/* THE LINES' OWN TRUE CLAIMS, DRAWN PER AD (2026-11-21; the owner, of the library: "bro the variety is so minimal
   here..? there's no variations at all?", then "all the same selling points and location").

   Every line printed the same three selling points, FREE QUOTE · CASH SAME DAY · NO FEES (motion/subjects.json
   gave all 41 lines one string, and pointsOf took the first three of one list), and every call to action
   read CALL OR TEXT. Each ad now draws its own from its line's claims, by its own seed: a set of two or three,
   or none, so no row repeats one trio; and its call to action from a few.

   A claim is one any buyer of that line can stand behind, as the defaults always were (no "#1", "best",
   "fastest", "any condition"): none of spec/banned-words.json, which scripts/words_check.mjs reads these
   against. A customer's own words are never replaced. */

// the category each line is sold under (motion/subjects.json cat)
export const LINE_CAT = { iphone: "phones", ipad: "phones", mac: "phones", macdesk: "phones", android: "phones", pixel: "phones", galaxy: "phones", foldable: "phones", console: "gaming", gamingpc: "gaming", pchandheld: "gaming", headphones: "audio", earbuds: "audio", headset: "audio", speaker: "audio", monitor: "computers", laptop: "computers", ssd: "computers", minipc: "computers", chromebook: "computers", watch: "wearables", smartwatch: "wearables", metaglasses: "wearables", gold: "gold", silver: "silver", coins: "coins", car: "cars", classic: "cars", jdm: "cars", trucks: "cars", toyota: "cars", honda: "cars", bmw: "cars", mercedes: "cars", vans: "cars", semis: "cars", strips: "strips", pokemon: "pokemon", sports: "sports", camera: "cameras", drone: "cameras" };

const COMMON = ["FREE QUOTE", "CASH SAME DAY", "NO FEES", "PAID TODAY", "QUOTE BY TEXT", "LOCAL BUYER", "FAIR OFFER"];
export const CLAIMS = {
  phones: [...COMMON, "WE MEET YOU"],
  gaming: [...COMMON, "GAMES TOO", "CONTROLLERS TOO"],
  audio: [...COMMON, "WE MEET YOU"],
  computers: [...COMMON, "WE MEET YOU"],
  wearables: [...COMMON, "ALL SIZES"],
  gold: ["TESTED FREE", "PAID BY WEIGHT", "PAID TODAY", "NO FEES", "FREE QUOTE", "BROKEN GOLD TOO", "LOCAL BUYER"],
  silver: ["TESTED FREE", "PAID BY WEIGHT", "PAID TODAY", "NO FEES", "FREE QUOTE", "COINS AND BARS", "LOCAL BUYER"],
  coins: ["FREE QUOTE", "PAID TODAY", "NO FEES", "WHOLE COLLECTIONS", "LOCAL BUYER", "FAIR OFFER", "QUOTE BY TEXT"],
  cars: ["FREE QUOTE", "PAID ON THE SPOT", "WE COME TO YOU", "NO FEES", "CASH TODAY", "LOCAL BUYER", "QUOTE BY TEXT"],
  strips: ["FREE QUOTE", "PAID TODAY", "NO FEES", "SEALED BOXES", "LOCAL BUYER", "QUOTE BY TEXT"],
  pokemon: ["FREE QUOTE", "PAID TODAY", "NO FEES", "SINGLES AND SEALED", "WHOLE COLLECTIONS", "LOCAL BUYER"],
  sports: ["FREE QUOTE", "PAID TODAY", "NO FEES", "WHOLE COLLECTIONS", "GRADED OR RAW", "LOCAL BUYER"],
  cameras: ["FREE QUOTE", "PAID TODAY", "NO FEES", "LENSES TOO", "QUOTE BY TEXT", "LOCAL BUYER"],
};
// a line's own, beside its category's: what is true of that line and not the rest
export const LINE_CLAIMS = { iphone: ["CRACKED OK", "ANY CARRIER"], android: ["CRACKED OK", "ANY CARRIER"], pixel: ["CRACKED OK", "ANY CARRIER"], galaxy: ["CRACKED OK", "ANY CARRIER"], foldable: ["CRACKED OK"], ipad: ["CRACKED OK", "WI-FI OR CELLULAR"] };
const COMMON_ES = ["COTIZACIÓN GRATIS", "PAGO EN EFECTIVO", "SIN CARGOS", "PAGO HOY", "COTIZA POR TEXTO", "COMPRADOR LOCAL", "OFERTA JUSTA"];
export const CLAIMS_ES = {
  default: COMMON_ES,
  gold: ["PRUEBA GRATIS", "PAGO POR PESO", "PAGO HOY", "SIN CARGOS", "COTIZACIÓN GRATIS", "COMPRADOR LOCAL"],
  silver: ["PRUEBA GRATIS", "PAGO POR PESO", "PAGO HOY", "SIN CARGOS", "COTIZACIÓN GRATIS", "COMPRADOR LOCAL"],
  cars: ["COTIZACIÓN GRATIS", "PAGO AL MOMENTO", "VAMOS A TI", "SIN CARGOS", "COMPRADOR LOCAL", "COTIZA POR TEXTO"],
};
/* the call to action, over the number: what to do with it (rule 157's marks point at it) */
export const LABELS = ["CALL OR TEXT", "TEXT US NOW", "GET YOUR OFFER", "MESSAGE US", "TEXT FOR A QUOTE", "CALL US TODAY"];
export const LABELS_ES = ["LLAMA O MANDA TEXTO", "MÁNDANOS UN TEXTO", "PIDE TU OFERTA", "ESCRÍBENOS"];

// one promise once: two lines share a promise when they share a word's stem (four letters up, its first five)
const stems = s => new Set(String(s || "").toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^A-Z0-9$]+/).filter(w => w.length >= 4).map(w => w.slice(0, 5)));
const shares = (a, b) => { const B = stems(b); return [...stems(a)].some(w => B.has(w)); };
// a small seeded stream (mulberry32), so the draw is the seed's own and moves nothing else
const stream = seed => { let t = ((seed >>> 0) ^ 0x6c8e9cf5) >>> 0; return () => { t = (t + 0x6d2b79f5) >>> 0; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; };

export function claimsOf(line, es = false) {
  const cat = LINE_CAT[line] || "phones";
  return es ? (CLAIMS_ES[cat] || CLAIMS_ES.default) : [...(CLAIMS[cat] || CLAIMS.phones), ...(LINE_CLAIMS[line] || [])];
}
/* an ad's selling points: none one time in eight, two three times in eight, three four times, each a claim of
   its line that repeats no promise already said (the headline, the line under it, the call to action) */
export function drawClaims(line, seed, said = [], es = false) {
  const r = stream((seed >>> 0) * 61 + 29), n = [0, 2, 2, 2, 3, 3, 3, 3][Math.floor(r() * 8)];
  if (!n) return [];
  const pool = claimsOf(line, es).filter(c => !said.some(s => shares(c, s)));
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const out = [];
  for (const c of pool) { if (out.length >= n) break; if (!out.some(o => shares(o, c))) out.push(c); }
  return out.length >= 2 ? out : [];
}
/* an ad's call to action, by its seed, repeating no promise of its own words */
export function drawLabel(seed, said = [], es = false) {
  const list = es ? LABELS_ES : LABELS, r = stream((seed >>> 0) * 67 + 31), start = Math.floor(r() * list.length);
  for (let i = 0; i < list.length; i++) { const l = list[(start + i) % list.length]; if (!said.some(s => shares(l, s))) return l; }
  return list[start];
}
