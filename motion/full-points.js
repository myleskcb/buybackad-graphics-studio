/* THE SELLING POINTS, VARIED (2026-11-22, DESIGN-LAW 164).

   The owner, of a row of card, console and coin ads: "All of these still have the same selling
   points why is that so can we have some that have more than three maybe three is the ideal number
   but some can have two some could have four depending on how heavy hitting or how important they
   are", "we shouldn't have 10 graphics in a row that I'll have the exact same things covered or we
   could always rephrase it or have variations of the same information or use different selling
   points".

   Until now a line's ad carried that line's one fixed list (every card ad FREE QUOTE, PAID TODAY,
   SINGLES OR SETS; every iPhone ad nobody typed points for FREE QUOTE, CASH PAID, ALL MODELS). Now a
   full ad whose points nobody typed draws them by its seed:
     how many   three most often, two or four now and then (POINT_COUNTS); four only short ones
     which      promises any buyer can stand behind (PROMISES) and the line's own (LINE_PROMISES),
                each weighed by how hard it hits; the line's own lead where it has them
     how said   each promise in several phrasings, one drawn per ad
   Never one promise twice, never a word the headline or the line under it already says (sharesWord:
   one promise, once), never a phrase on the one banned list (spec/banned-words.json: no ANY
   CONDITION without a limit, no LOCKED OK, no superlatives). A customer's typed points are drawn as
   typed. */

export const POINT_COUNTS = [[3, .55], [2, .2], [4, .25]];
/** The promises any buyer can stand behind: [weight, phrasings]. */
export const PROMISES = {
  paid:  [1, ["PAID TODAY", "CASH SAME DAY", "PAID ON THE SPOT", "CASH ON THE SPOT", "CASH WHEN WE MEET"]],
  quote: [.85, ["FREE QUOTE", "QUOTE BY TEXT", "PRICE BY TEXT", "OFFER BY TEXT"]],
  fees:  [.6, ["NO FEES", "NO HIDDEN FEES", "ZERO FEES"]],
  meet:  [.45, ["WE MEET YOU", "LOCAL BUYER", "MEET NEARBY"]],
  easy:  [.3, ["NO HASSLE", "NO PRESSURE", "EASY SALE"]],
  fair:  [.3, ["FAIR OFFER", "UPFRONT PRICE"]],
  // a buyer selling (DESIGN-LAW 181): money, said boldly, with nothing to prove (no HIGHEST, BEST or #1)
  top:   [.7, ["TOP DOLLAR PAID", "TOP CASH PAID", "WE PAY TOP DOLLAR", "TOP PRICES PAID"]],
};
/* Dropped 2026-11-23 (the owner: card ads "screaming scalper"; the copy audit against rule 80): FREE OFFER (spam),
   OFFER IN MINUTES (a clock claim), PICKUP OR DROP-OFF and NO APPOINTMENT (services a shop may not offer), HONEST PRICE
   (a reputation nobody gave), PAID IN PERSON and LOCAL MEETUP (they read as a parking-lot deal). */
/** What each kind of goods' sellers ask about: { kind: { promise: [weight, phrasings] } }. */
const KINDS = {
  phone: {
    cracked: [.9, ["CRACKED OK", "CRACKED SCREENS OK", "BROKEN SCREEN OK"]],
    carrier: [.6, ["ANY CARRIER", "ALL CARRIERS", "UNLOCKED OR NOT"]],
    models:  [.6, ["ALL MODELS", "OLDER MODELS TOO", "NEW OR USED"]],
    trade:   [.35, ["UPGRADING? SELL IT", "OLD PHONE? SELL IT"]],
  },
  computer: {
    cracked: [.7, ["CRACKED OK", "SCREEN DAMAGE OK"]],
    models:  [.7, ["OLDER MODELS TOO", "ALL MODELS", "NEW OR USED"]],
    extras:  [.4, ["CHARGER OR NOT", "BOX OR NO BOX"]],
  },
  wearable: {
    models:  [.7, ["ALL MODELS", "OLDER MODELS TOO", "NEW OR USED"]],
    extras:  [.5, ["BOX OR NO BOX", "ANY BAND"]],
  },
  audio: {
    models:  [.7, ["ALL MODELS", "NEW OR USED", "OLDER MODELS TOO"]],
    extras:  [.5, ["BOX OR NO BOX", "CASE OR NO CASE"]],
  },
  gaming: {
    extras:  [.8, ["CONTROLLERS TOO", "GAMES TOO", "ACCESSORIES TOO"]],
    models:  [.6, ["ALL MODELS", "OLDER CONSOLES TOO", "NEW OR USED"]],
    box:     [.4, ["BOX OR NO BOX"]],
  },
  camera: {
    lenses:  [.8, ["BODIES & LENSES", "LENSES TOO", "KITS TOO"]],
    brands:  [.5, ["ALL BRANDS", "NEW OR USED"]],
  },
  // goods the line sells sealed, a computer with no screen, a drone, silver (sense audit 2026-11-23: CRACKED OK on an SSD
  // and a mini PC, CRACKED OK under SEALED CHROMEBOOKS, LENSES TOO on a drone, ANY KARAT and SCRAP GOLD on silver)
  sealed: {
    lots:    [.8, ["ONE OR MANY", "BULK TOO"]],
    brands:  [.6, ["ANY BRAND", "ALL BRANDS"]],
  },
  box: {
    models:  [.7, ["ALL MODELS", "NEW OR USED"]],
    extras:  [.5, ["CHARGER OR NOT", "BOX OR NO BOX"]],
  },
  drone: {
    extras:  [.8, ["BATTERIES TOO", "CONTROLLER TOO", "KITS TOO"]],
    models:  [.5, ["ALL MODELS", "NEW OR USED"]],
  },
  silver: {
    tested:  [.9, ["TESTED FREE", "FREE TESTING", "TESTED ON SITE"]],
    scale:   [.6, ["WEIGHED IN VIEW", "SCALE YOU CAN SEE"]],
    broken:  [.6, ["BROKEN JEWELRY OK", "SCRAP SILVER OK"]],
    kinds:   [.5, ["STERLING OR .999", "FLATWARE TOO"]],
  },
  /* a card seller is a collector, or a collector's family, who knows what the cards fetch: plain words, the whole
     collection looked at with them, their call (2026-11-23). No sealed boxes, packs or bulk (a flipper buys those),
     no hobby words in a row, no speed. */
  cards: {
    singles: [.9, ["ONE CARD OR A LOT", "SINGLES OR BINDERS", "BIG OR SMALL LOTS"]],
    lots:    [.85, ["WHOLE COLLECTIONS", "SHOEBOXES TOO", "BINDERS WELCOME", "INHERITED ONES TOO"]],
    graded:  [.8, ["GRADED OR RAW", "SLABBED OR RAW"]],
    look:    [.75, ["CARD BY CARD", "REVIEWED WITH YOU"]],
    decide:  [.6, ["YOU DECIDE", "TAKE YOUR TIME", "NO OBLIGATION"]],
    price:   [.5, ["ASK HOW WE PRICE"]],
    era:     [.4, ["VINTAGE TO MODERN", "ANY ERA"]],
  },
  metal: {
    tested:  [.95, ["TESTED FREE", "FREE TESTING", "TESTED ON SITE"]],
    scale:   [.6, ["WEIGHED IN VIEW", "SCALE YOU CAN SEE"]],
    broken:  [.7, ["BROKEN JEWELRY OK", "SCRAP GOLD OK", "SINGLE EARRINGS OK"]],
    kinds:   [.5, ["RINGS & CHAINS", "ANY KARAT", "WHITE OR YELLOW"]],
  },
  coins: {
    graded:  [.8, ["GRADED OR RAW", "SLABBED COINS TOO"]],
    lots:    [.8, ["WHOLE COLLECTIONS", "COIN ROLLS TOO", "INHERITED COINS"]],
    kinds:   [.6, ["SILVER DOLLARS TOO", "PROOF SETS TOO", "GOLD & SILVER TOO"]],
  },
  car: {
    come:    [.95, ["WE COME TO YOU", "FROM YOUR DRIVEWAY"]],
    running: [.85, ["RUNNING OR NOT", "DRIVES OR DOESN'T", "NON-RUNNERS TOO"]],
    miles:   [.5, ["HIGH MILES OK", "OLDER CARS TOO", "DAMAGED CARS TOO"]],
  },
  strips: {
    sealed:  [.95, ["SEALED BOXES", "SEALED & UNEXPIRED"]],
    brands:  [.6, ["ALL MAJOR BRANDS", "MOST BRANDS"]],
    lots:    [.4, ["ONE BOX OR MANY", "BULK BOXES TOO"]],
  },
};
/** The shared promises said a kind of goods' own way: { kind: { promise: [weight, phrasings] | null } }. A card
 *  seller hears "cash today" as "cheap, for speed" and "no fees" as a margin hidden elsewhere. */
const KIND_SAYS = {
  cards: {
    quote: [.85, ["SEND PHOTOS FIRST", "OFFER BY TEXT", "FREE QUOTE", "PHOTOS FOR A PRICE"]],
    paid:  [.7, ["PAID ON THE SPOT", "CASH WHEN WE MEET", "PAID WHEN WE AGREE"]],
    meet:  [.45, ["LOCAL BUYER", "MEET NEARBY"]],
    easy:  [.4, ["NO PRESSURE", "NO HASSLE"]],
    fair:  [.35, ["FAIR OFFER", "UPFRONT PRICE"]],
    fees:  null,
    top:   null,   // a collector hears TOP DOLLAR as a flipper's sign (rule 171)
  },
};
/* EN ESPAÑOL (2026-11-23). A Spanish ad drew the catalogue's one Spanish list until now (COTIZACIÓN GRATIS, PAGO EN
   EFECTIVO, TODOS LOS MODELOS on a gold ad as on a phone's): the same promises as above, by the same keys and weights,
   said the way a Spanish-speaking seller asks, 18 letters at most, no comma. A promise with no Spanish phrasing is not drawn. */
const PROMISES_ES = {
  paid:  ["PAGO HOY", "EFECTIVO HOY", "PAGO AL MOMENTO", "PAGO EN EL ACTO", "EFECTIVO EN MANO"],
  quote: ["COTIZACIÓN GRATIS", "COTIZA POR MENSAJE", "TE DAMOS PRECIO", "PRECIO POR MENSAJE"],
  fees:  ["SIN COMISIONES", "SIN CARGOS", "CERO COMISIONES"],
  meet:  ["CERCA DE TI", "COMPRADOR LOCAL"],
  easy:  ["SIN COMPLICACIONES", "SIN PRESIÓN", "VENTA FÁCIL"],
  fair:  ["OFERTA JUSTA", "PRECIO CLARO"],
  top:   ["PAGAMOS BIEN", "BUEN PAGO", "BUEN PRECIO"],
};
const MODELS_ES = ["TODOS LOS MODELOS", "MODELOS ANTERIORES", "NUEVOS O USADOS"];
const KINDS_ES = {
  phone:    { cracked: ["PANTALLA ROTA OK", "ROTOS TAMBIÉN", "ESTRELLADOS OK"], carrier: ["CUALQUIER COMPAÑÍA", "LIBERADO O NO"],
              models: MODELS_ES, trade: ["¿YA TIENES OTRO?", "¿TE SOBRA UNO?"] },
  computer: { cracked: ["PANTALLA ROTA OK", "CON DAÑOS TAMBIÉN"], models: MODELS_ES, extras: ["CON O SIN CARGADOR", "CON O SIN CAJA"] },
  wearable: { models: MODELS_ES, extras: ["CON O SIN CAJA", "CUALQUIER CORREA"] },
  audio:    { models: MODELS_ES, extras: ["CON O SIN CAJA", "CON O SIN ESTUCHE"] },
  gaming:   { extras: ["CONTROLES TAMBIÉN", "JUEGOS TAMBIÉN", "ACCESORIOS TAMBIÉN"], models: ["TODOS LOS MODELOS", "CONSOLAS VIEJAS OK", "NUEVAS O USADAS"], box: ["CON O SIN CAJA"] },
  camera:   { lenses: ["CÁMARAS Y LENTES", "LENTES TAMBIÉN", "KITS TAMBIÉN"], brands: ["TODAS LAS MARCAS", "NUEVAS O USADAS"] },
  sealed:   { lots: ["UNA O MUCHAS", "AL MAYOREO TAMBIÉN"], brands: ["CUALQUIER MARCA", "TODAS LAS MARCAS"] },
  box:      { models: MODELS_ES, extras: ["CON O SIN CARGADOR", "CON O SIN CAJA"] },
  drone:    { extras: ["BATERÍAS TAMBIÉN", "CONTROL TAMBIÉN", "KITS TAMBIÉN"], models: ["TODOS LOS MODELOS", "NUEVOS O USADOS"] },
  silver:   { tested: ["REVISIÓN GRATIS", "LO VERIFICAMOS"], scale: ["PESO A LA VISTA", "BÁSCULA A LA VISTA"],
              broken: ["JOYAS ROTAS OK", "PLATA QUEBRADA OK"], kinds: ["STERLING O .999", "CUBIERTOS TAMBIÉN"] },
  cards:    { singles: ["SUELTAS O LOTES", "UNA SOLA O CIENTOS"], lots: ["COLECCIÓN ENTERA", "CARPETAS TAMBIÉN", "HEREDADAS TAMBIÉN"],
              graded: ["CERTIFICADAS O NO"], look: ["LO VEMOS JUNTOS", "REVISADAS CONTIGO"], decide: ["TÚ DECIDES", "SIN COMPROMISO", "SIN PRISA"],
              price: ["TE LO EXPLICAMOS"], era: ["VINTAGE O MODERNAS", "DE ANTES Y DE HOY"] },
  metal:    { tested: ["REVISIÓN GRATIS", "LO VERIFICAMOS", "PRUEBA EN EL ACTO"], scale: ["PESO A LA VISTA", "BÁSCULA A LA VISTA"],
              broken: ["JOYAS ROTAS OK", "ORO QUEBRADO OK", "ARETES SIN PAR"], kinds: ["ANILLOS Y CADENAS", "CUALQUIER KILATE", "BLANCO O AMARILLO"] },
  coins:    { graded: ["CERTIFICADAS O NO", "MONEDAS EN SLAB"], lots: ["COLECCIÓN ENTERA", "ROLLOS TAMBIÉN", "MONEDAS HEREDADAS"], kinds: ["DÓLARES DE PLATA", "ORO Y PLATA"] },
  car:      { come: ["VAMOS A DONDE ESTÉ", "VAMOS A TU CASA"], running: ["FUNCIONE O NO", "ANDE O NO ANDE", "AUNQUE NO ARRANQUE"],
              miles: ["MILLAJE ALTO OK", "CARROS VIEJOS OK", "CHOCADOS TAMBIÉN"] },
  strips:   { sealed: ["CAJAS SELLADAS", "SIN VENCER"], brands: ["TODAS LAS MARCAS", "MARCAS PRINCIPALES"], lots: ["UNA CAJA O MUCHAS", "CAJAS AL MAYOREO"] },
};
const KIND_SAYS_ES = {
  cards: { quote: ["MANDA FOTOS", "OFERTA POR MENSAJE", "COTIZACIÓN GRATIS"], paid: ["PAGO AL MOMENTO", "EFECTIVO EN MANO"],
           meet: ["COMPRADOR LOCAL", "CERCA DE TI"], easy: ["SIN PRESIÓN"], fair: ["OFERTA JUSTA", "PRECIO CLARO"], fees: null },
};
const KIND_OF = {
  iphone: "phone", android: "phone", pixel: "phone", galaxy: "phone", foldable: "phone",
  ipad: "computer", mac: "computer", macdesk: "computer", laptop: "computer", monitor: "computer", gamingpc: "computer",
  ssd: "sealed", chromebook: "sealed", minipc: "box",
  watch: "wearable", smartwatch: "wearable", metaglasses: "wearable",
  headphones: "audio", earbuds: "audio", headset: "audio", speaker: "audio",
  console: "gaming", pchandheld: "gaming",
  camera: "camera", drone: "drone",
  pokemon: "cards", sports: "cards",
  gold: "metal", silver: "silver", coins: "coins",
  car: "car", classic: "car", jdm: "car", trucks: "car", toyota: "car", honda: "car", bmw: "car", mercedes: "car", vans: "car", semis: "car",
  strips: "strips",
};
/** The promises a line's ad can draw: the line's own first (by the order the owner's buyers ask), then any buyer's;
 *  in Spanish ("es") each keeps its weight and takes its Spanish phrasings. */
export function promisesFor(subject, lang = "en") {
  const kind = KIND_OF[subject || "iphone"], all = { ...(KINDS[kind] || {}), ...PROMISES, ...(KIND_SAYS[kind] || {}) };
  for (const k of Object.keys(all)) if (!all[k]) delete all[k];
  if (lang !== "es") return all;
  const es = { ...((KINDS_ES[kind]) || {}), ...PROMISES_ES, ...(KIND_SAYS_ES[kind] || {}) };
  return Object.fromEntries(Object.entries(all).filter(([k]) => es[k]).map(([k, [w]]) => [k, [w, es[k]]]));
}
/** The kind of goods a line sells (phone, cards, metal, car...), for words said a kind's own way. */
export const kindOf = subject => KIND_OF[subject || "iphone"] || "phone";
/** Each line's fixed list until 2026-11-22 (motion/subjects.json points): a style carrying one of
 *  them was given its line's default, not typed by a customer, so it draws as one nobody typed. */
export const OLD_DEFAULTS = new Set(["FREE QUOTE, CASH SAME DAY, NO FEES", "TESTED FREE, PAID TODAY, NO FEES", "FREE QUOTE, PAID TODAY, NO FEES",
  "FREE QUOTE, PAID ON THE SPOT, WE COME TO YOU", "SEALED BOXES, PAID TODAY, NO FEES", "FREE QUOTE, PAID TODAY, SINGLES OR SETS"]);

/** The points an ad draws: r is the ad's words stream, said the lines already on the ad, shares
 *  (a, b) whether two lines make one promise (fullad.js sharesWord). Returns "A, B, C". */
export function drawPoints(subject, r, said, shares, lang = "en") {
  const roll = r(); let n = 3;
  for (let acc = 0, i = 0; i < POINT_COUNTS.length; i++) { acc += POINT_COUNTS[i][1]; if (roll < acc) { n = POINT_COUNTS[i][0]; break; } }
  /* a promise the lines above already make in other words is not drawn again (sense audit 2026-11-23: UNLOCKED OR NOT
     under ANY CARRIER, ALL MODELS under S21 AND NEWER): sharesWord matches words, these match meanings */
  const sayBefore = said.filter(Boolean).join(" ").toUpperCase();
  const SAID_AS = { carrier: /CARRIER|UNLOCK|COMPAÑ|LIBERAD/, cracked: /CRACK|BROKEN SCREEN|ROT[OA]S?\b|ESTRELLAD/,
    models: /NEWER|AND UP|\bO MÁS\b|ALL MODELS|TODOS LOS MODELOS/, running: /RUNNING|DRIVES|NON-RUNNER|FUNCION|ANDE|ARRANQUE/ };
  const all = Object.entries(promisesFor(subject, lang)).map(([k, [w, says]]) => ({ k, w, says }))
    .filter(p => !(SAID_AS[p.k] && SAID_AS[p.k].test(sayBefore)));
  const out = [], seen = [...said];
  // a promise of the line's own leads (what this seller asks first), then the draw by weight
  const own = new Set(Object.keys(KINDS[KIND_OF[subject || "iphone"]] || {}));
  const pickFrom = list => {
    let total = list.reduce((s, p) => s + p.w, 0), u = r() * total;
    for (const p of list) { if ((u -= p.w) < 0) return p; }
    return list[list.length - 1];
  };
  // and every set carries one of the heavy hitters, the money or the quote (the owner: "depending on how heavy hitting")
  const HEAVY = new Set(["paid", "quote"]), keys = [];
  let pool = all.slice(), tries = 0;
  while (out.length < n && pool.length && tries++ < 40) {
    const leadOwn = out.length === 0 && own.size > 0 && r() < .7, owns = pool.filter(q => own.has(q.k));
    const needHeavy = out.length === n - 1 && !keys.some(k => HEAVY.has(k)), heavy = pool.filter(q => HEAVY.has(q.k));
    const p = pickFrom(needHeavy && heavy.length ? heavy : leadOwn && owns.length ? owns : pool);
    pool = pool.filter(q => q !== p);
    // a phrasing that says nothing already said; with four, a short one
    const start = Math.floor(r() * p.says.length);
    for (let i = 0; i < p.says.length; i++) {
      const s = p.says[(start + i) % p.says.length];
      if (n === 4 && s.length > 15) continue;
      if (seen.some(x => shares(s, x))) continue;
      if (out.some(x => x.split(" ")[0] === s.split(" ")[0])) continue;   // ALL CARRIERS beside ALL MODELS reads as one point twice
      out.push(s); seen.push(s); keys.push(p.k); break;
    }
  }
  /* the money or the quote within the first two: where four do not fit, the layout keeps the first two (fullad.js chipsFor) */
  const h = keys.findIndex(k => HEAVY.has(k));
  if (h >= 2) { const [w] = out.splice(h, 1); out.splice(1, 0, w); }
  return out.join(", ");
}
