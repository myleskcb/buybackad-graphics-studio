/* COPY RULES the showcase breaks, and the rewrite. 2026-09-22.
 *
 * 1. NAMED COMPETITORS. 120 cards led with "WE TOP GAZELLE'S TRADE-IN VALUE",
 *    "WE BEAT TCGPLAYER'S BUYLIST PRICE" and so on: a comparative claim about
 *    a real company that the seller cannot check and the reseller cannot
 *    prove. iPhones LA's own ad reader docks exactly this ("we pay better",
 *    "top cash") and its reading pages refuse a number beside a competitor's
 *    name. The ad keeps its promise and loses the name.
 * 2. LICENSING CLAIMS. 297 cards carried LICENSED / INSURED / BONDED badges
 *    (and, found in the second pass, VERIFIED / TOP RATED / "TOP $$$").
 *    Most resellers are none of those, and a template that asserts it on their
 *    behalf is a false claim in their name. Replaced with things any honest
 *    buyer can say.
 * 3. OTHER DECK'S WORDS. A card whose words sell another deck's goods (a
 *    TRUCK offer on a gold card) is stamped `copy` by
 *    audit_showcase_content.mjs. Measured against the index's categories the
 *    library had none on 2026-09-22; the check exists so a future set cannot
 *    ship one.
 */
export const COMPANY = /\b(TCG ?PLAYER|CASH ?4 ?GOLD|PSA VAULT|GAZELLE|BEST BUY|AUTO ?NATION|GAME ?STOP|ECO ?ATM|BACK ?MARKET|VERIZON|EZ ?PAWN|COMC|VROOM|CAR ?MAX|KBB|KELLEY BLUE BOOK|CARD KINGDOM|T-MOBILE|CARVANA|APPLE TRADE[ -]?IN|SWAPPA|DECLUTTR|APMEX|KITCO|JM BULLION|ITSWORTHMORE|SELLCELL)\b/i;
export const LICENSE = /\b(LICENSED|INSURED|BONDED|VERIFIED|TOP RATED)\b/i;
/* ratings and "top dollar" stickers are the same kind of claim: a template
   cannot know the reseller is top rated or pays the most (iPhones LA's own ad
   reader docks "top cash"), so they become plain facts too */
const EXACT = { 'TOP $$$':'CASH NOW', 'TOP $':'CASH NOW', 'TOP BOX PRICES PAID':'SEALED BOXES BOUGHT',
  'MORE THAN THE OTHER BUYERS, PAID SAME DAY':'A FAIR OFFER, PAID SAME DAY', 'GOT THE OTHER BUYERS QUOTE?':'GOT ANOTHER QUOTE?' };
/* words that belong to one deck only */
export const CAT_WORDS = {
  cars:/\b(TRUCKS?|CARS?|VANS?|BIKES?|MOTORCYCLES?|TOW|TITLE)\b/i,
  gold:/\b(GOLD|KARAT|14K|18K|JEWELRY)\b/i,
  pokemon:/\b(POK[EÉ]MON|TCG|CHARIZARD)\b/i,
  phones:/\b(IPHONES?|IPADS?|MACBOOKS?|CARRIER)\b/i,
  strips:/\b(TEST STRIPS?|CGMS?|DEXCOM|ONETOUCH)\b/i,
};
/* which decks a card's headline may borrow from without it being a mismatch */
const MAY = { gold:['gold'], silver:['gold'], coins:['gold'], cars:['cars'], phones:['phones'], pokemon:['pokemon'], sports:[], strips:['strips'] };
export function foreignWords(cat, text){
  const hits = [];
  for (const k in CAT_WORDS){ if (k === cat || (MAY[cat] || []).includes(k)) continue; if (CAT_WORDS[k].test(text)) hits.push(k); }
  return hits;
}

const PRODUCT = (cat, hint) => {
  hint = String(hint || '').toUpperCase();
  if (cat === 'phones') return /IPAD/.test(hint) ? 'IPADS' : /WATCH/.test(hint) ? 'WATCHES' : /MAC/.test(hint) ? 'MACBOOKS' : 'IPHONES';
  if (cat === 'cars') return /TRUCK/.test(hint) ? 'TRUCKS' : /BIKE/.test(hint) ? 'BIKES' : /VAN/.test(hint) ? 'WORK VANS' : 'CARS';
  return { gold:'GOLD', silver:'SILVER', coins:'COINS', pokemon:'POKÉMON', sports:'CARDS', strips:'TEST STRIPS' }[cat] || 'IT';
};
const THIRD = { phones:'PAID SAME DAY', cars:'CASH ON THE SPOT', gold:'PAID BY WEIGHT', silver:'PAID BY WEIGHT',
  coins:'FAIR, WRITTEN OFFER', pokemon:'CARDS & SLABS', sports:'CARDS & SLABS', strips:'SEALED BOXES ONLY' };
const LINE = [
  [/^(.*) OFFERED YOU WHAT\?$/i, () => 'GOT A LOWBALL OFFER?'],
  [/^GOT AN? .+ QUOTE\?$/i, () => 'GOT ANOTHER QUOTE?'],
  [/^BRING YOUR .+ QUOTE.*$/i, () => 'FREE QUOTE, NO OBLIGATION'],
  [/^MORE THAN .+, PAID SAME DAY$/i, () => 'A FAIR OFFER, PAID SAME DAY'],
  [/^THE .+ NUMBER, PAID TODAY, NO FEES$/i, () => 'A REAL NUMBER, PAID TODAY, NO FEES'],
  [/^SHOW US THE .+ NUMBER\..*$/i, () => 'SEND A PHOTO. GET A NUMBER.'],
];
const BADGE_SWAP = ['NO FEES', 'DISCREET', 'SAME DAY', 'FAIR PRICE', 'CASH PAID', 'NO PRESSURE', 'LOCAL BUYER', 'FREE QUOTE'];

/* returns { changed: [...] } and rewrites tpl.layers in place */
export function rewriteCopy(tpl, cat){
  const changed = [];
  const L = tpl.layers || [];
  const up = s => String(s);
  const heads = L.filter(l => l.role === 'headline' && typeof l.text === 'string');
  const namesCompany = heads.some(l => COMPANY.test(l.text));
  const foreign = heads.some(l => foreignWords(cat, l.text).length);
  if (namesCompany || (foreign && heads.length >= 2 && /^(WE (TOP|BEAT|MATCH|OUTBID))$/i.test(heads[0].text.trim()))){
    const hint = heads.map(l => l.text).join(' ');
    const lines = heads.length >= 3 ? ['WE BUY', PRODUCT(cat, hint), THIRD[cat] || 'PAID SAME DAY'] : ['WE BUY', PRODUCT(cat, hint)];
    heads.forEach((l, k) => {
      const nt = k < lines.length ? lines[k] : null;
      if (nt && nt !== l.text){ changed.push(l.text + ' -> ' + nt); l.text = l.casing === 'none' || l.casing === 'title' ? nt.replace(/\B\w+/g, w => w.toLowerCase()) : nt; }
    });
  }
  /* every line already on the card, so a swapped badge never repeats one —
     a badge row is often three separate layers, and three LICENSED badges
     must not all become NO FEES */
  const have = new Set();
  L.forEach(l => { if (typeof l.text === 'string') l.text.toUpperCase().split(/\n|·|•/).forEach(s => have.add(s.replace(/[✓\s]+/g, ' ').trim())); });
  /* "WE BEAT" over a line of payment methods reads "we beat cash, Zelle,
     Venmo": a slot filled from the wrong list. It becomes "GET PAID". */
  if (heads.length >= 2 && /^WE (TOP|BEAT|MATCH|OUTBID)$/i.test(heads[0].text.trim()) && /ZELLE|VENMO|CASH ?APP/i.test(heads[1].text)){
    changed.push(heads[0].text + ' -> GET PAID'); heads[0].text = 'GET PAID';
  }
  /* a stitched line that doubles a word: "SHOW US THE THE MAIL-IN SITES NUMBER" */
  L.forEach(l => { if (typeof l.text === 'string' && l.role !== 'headline' && /\b(\w+) \1\b/i.test(l.text)){
    const nt = l.text.replace(/\b(\w+) \1\b/gi, '$1'); changed.push(l.text + ' -> ' + nt); l.text = nt; } });
  /* a stitched line with a stray article: "BRING YOUR THE PAWN SHOP QUOTE" */
  L.forEach(l => { if (typeof l.text === 'string' && /\bYOUR THE\b/i.test(l.text) && l.role !== 'headline'){
    changed.push(l.text + ' -> FREE QUOTE, NO OBLIGATION'); l.text = 'FREE QUOTE, NO OBLIGATION'; } });
  L.forEach(l => { if (typeof l.text === 'string' && EXACT[l.text.trim().toUpperCase()]){
    const nt = EXACT[l.text.trim().toUpperCase()]; changed.push(l.text + ' -> ' + nt); l.text = nt; } });
  L.forEach(l => {
    if (typeof l.text !== 'string') return;
    if (l.role !== 'headline'){
      const lines = l.text.split('\n').map(ln => {
        let out = ln;
        if (COMPANY.test(ln)){ for (const [re, f] of LINE) if (re.test(ln.trim())){ out = f(ln); break; } }
        if (COMPANY.test(out)) out = out.replace(COMPANY, 'OTHER BUYERS');
        return out;
      });
      const nt = lines.join('\n');
      if (nt !== l.text){ changed.push(l.text + ' -> ' + nt); l.text = nt; }
    }
    if (LICENSE.test(l.text)){
      const nt = l.text.replace(/\b(LICENSED|INSURED|BONDED|VERIFIED|TOP RATED)\b/gi, m => {
        const pick = BADGE_SWAP.find(w => !have.has(w)); have.add(pick);
        return m === m.toUpperCase() ? pick : pick.charAt(0) + pick.slice(1).toLowerCase();
      });
      changed.push(l.text.replace(/\n/g, '/') + ' -> ' + nt.replace(/\n/g, '/')); l.text = nt;
    }
  });
  return changed.concat(honestCopy(tpl, cat, have));
}

/* 5. THE STUDY SESSION'S COPY RULES (2026-09-24..26, "Teaching the Engine
 *    Design", and the video ad maker built alongside it). The showcase cards
 *    carry the owner's own number and site, so a line on them is a line
 *    iPhones.LA publishes. Counted on 2026-09-26 across the 971 records:
 *      invented proof   "4.9★", "★★★★★", "200+ LOCAL REVIEWS", "4.9 · 200+ local
 *                       sellers", "SINCE 2015", "500+ DEALS CLOSED", and 43 cards
 *                       of quoted testimonials signed "Priya R. · Bellflower, CA"
 *      a price figure   "UP TO $10,000 PER CARD" on 83 cards: prices move and a
 *                       picture does not; the post's price field holds the number
 *      invented facts   "OPEN 7 DAYS · 9AM-8PM · WALK-INS WELCOME" on 46 cards,
 *                       for a buyer who meets people and takes mail-ins
 *      a dash           "CASH · ZELLE · VENMO · WIRE — YOUR CHOICE" on 61 cards;
 *                       no em or en dash in anything a customer reads
 *      an absolute      "SAME-DAY PAYMENT, EVERY TIME"
 *    Each becomes a plain fact about how the offer works (text a photo, get a
 *    price, get paid), the video engine's honest vocabulary. Urgency stays
 *    true or goes: no deadline, countdown or "today only", and no claim that a
 *    person answers every text (BANNED below guards future sets).
 */
export const BANNED = /REAL PERSON|NOT A BOT|\bHUMAN\b|TODAY ONLY|LIMITED TIME|\bENDS\b|LAST CHANCE|HURRY|GOING UP|PRICES? (GO|GOES) UP|DEADLINE|EXPIRES|COUNTDOWN|ANSWER(S)? EVERY/i;
/* a star ROW or a number with a star is a rating; one star either side of a
   word ("\u2605 WANTED \u2605") is an ornament and reads as one (2026-09-27) */
export const PROOF = /[★☆]\s*[★☆]\s*[★☆]|\b\d(\.\d)?\s*[★☆]|\b[3-5]\.\d\s*(★|·|STARS?\b)|\b\d[\d,]*\+?\s*(LOCAL\s+)?(REVIEWS?|SELLERS|CUSTOMERS|DEALS|SALES|BUYS)\b|\bSINCE\s+(19|20)\d\d\b/i;
export const PRICE = /\$\s?\d|\$\$/;
export const HOURS = /\bOPEN\s+7\s+DAYS\b|\b\d{1,2}\s*(AM|PM)\s*[-–]\s*\d{1,2}\s*(AM|PM)\b|\bWALK-?INS?\b/i;
export const DASH = /[–—]/;
/* INVENTED FACTS (2026-09-27; the owner: "inaccurate info ... or bad copy gets
   removed"). The same kind of claim as PROOF and HOURS in other words, each a
   fact a template cannot know about the reseller who posts it:
     rank        #1, TOP BUYER, BEST PRICE, HIGHEST, WE BEAT, PRICE MATCH
     a clock     "30 SECONDS", "OFFER IN 10 MINUTES", "REPLIES IN MINUTES",
                 INSTANT: an offer takes as long as the reseller takes (an
                 "instant transfer" is a way to pay, and stays)
     a service   MAIL IT IN, PREPAID, FREE SHIPPING, HOUSE CALLS, 7 DAYS, DAILY
     a policy    NO LOWBALLS, COMPS SHOWN WITH EVERY OFFER, IN WRITING, NOT MELT
     reputation  TRUSTED, HONEST: proof nobody gave
     too much    EVERY APPLE DEVICE, EVERY SEALED BOX, ALL THREE: more than the
                 reseller buys, or than the picture shows
   A mail-in SITE named as the competition ("A MAIL-IN SITE OFFERED PENNIES?")
   is a comparison, not a service, and is not matched. */
export const CLAIM = new RegExp([
  String.raw`#\s?1\b`, String.raw`\bNO\.?\s?1\b`, String.raw`\bNUMBER ONE\b`, String.raw`\bTOP BUYER\b`, String.raw`\bBEST (PRICE|OFFER|DEAL|RATE|PAYOUT)S?\b`,
  String.raw`\bHIGHEST\b`, String.raw`\bWE BEAT\b`, String.raw`\bBEAT (ANY|THEIR|YOUR)\b`, String.raw`\bPRICE MATCH`, String.raw`\bMOST CASH\b`, String.raw`\bTOP DOLLAR\b`, String.raw`\bWE FIX IT\b`,
  String.raw`\b\d+\s*-?\s*(MIN|MINS|MINUTE|MINUTES|SECOND|SECONDS|HOUR|HOURS)\b`, String.raw`\bIN MINUTES\b`, String.raw`\bREPL(Y|IES) IN\b`, String.raw`\bINSTANT(LY)?\b(?!\s+TRANSFER)`,
  String.raw`\bMAIL IT IN\b`, String.raw`\bPREPAID\b`, String.raw`\bMAIL[- ]?IN (KITS?|WELCOME)\b`, String.raw`\bFREE SHIPPING\b`, String.raw`\bHOUSE CALLS?\b`, String.raw`\b7 DAYS\b`,
  String.raw`\bEVALUATIONS DAILY\b`, String.raw`\bPRICES DAILY\b`, String.raw`\bEVERY SINGLE DAY\b`, String.raw`\bWALK OUT\b`,
  String.raw`\bNO LOWBALLS?\b`, String.raw`\bNOT MELT\b`, String.raw`\bCOMPS SHOWN\b`, String.raw`\bDOCUMENTED\b`, String.raw`\bIN WRITING\b`,
  String.raw`\bEVERY (APPLE )?DEVICE\b`, String.raw`\bEVERY SEALED BOX\b`, String.raw`\bALL THREE\b`, String.raw`\bTRUSTED\b`, String.raw`\bHONEST\b`,
].join('|'), 'i');
/* ...and what each one says instead: how the offer works, in the same room.
   Each replacement is no wider than the line it replaces unless the line has
   room (a badge stack beside a check circle takes CASH, not FREE QUOTE, which
   ran into the circle). Applied to the showcase records by
   scripts/honest_claims.mjs and, by hand, to the same words in app.js. */
export const CLAIM_FIX = [
  [/^TRUSTED LOCAL$/, 'YOUR LOCAL'],
  [/^#1 TOP BUYER$/, 'CASH BUYER'], [/^TOP BUYER$/, 'CASH BUYER'],
  [/^INSTANT$/, 'GET A'],
  [/\bGET AN INSTANT OFFER\b/, 'GET A CASH OFFER'], [/\bCALL FOR INSTANT OFFER\b/, 'CALL FOR A CASH OFFER'],
  [/\bTEXT NOW FOR INSTANT CASH\b/, 'TEXT NOW FOR A CASH OFFER'], [/\bADMIT: INSTANT CASH\b/, 'ADMIT: CASH OFFER'],
  [/\bTEXT A PHOTO FOR AN INSTANT QUOTE\b/, 'TEXT A PHOTO FOR A QUOTE'], [/\bCERT NUMBERS GET INSTANT QUOTES\b/, 'SEND CERT NUMBERS FOR A QUOTE'],
  [/^Snap photos, text them over\. 30 seconds\.$/, 'Snap photos and text them over.'],
  [/^Firm quote in minutes\. Zero obligation\.$/, 'A firm quote by text. Zero obligation.'],
  [/\bTEXT A PIC, OFFER IN MINUTES\b/, 'TEXT A PIC, GET AN OFFER'], [/\bREPLIES IN MINUTES, NOT DAYS\b/, 'TEXT A PHOTO, GET A PRICE'],
  [/\bVIN \+ MILES = OFFER IN 10 MINUTES\b/, 'VIN + MILES = A CASH OFFER'], [/ 60 MINUTES\.$/, ''],
  [/\b5 MINUTE APPRAISAL, WALK OUT PAID\b/, 'FREE APPRAISAL, PAID ON THE SPOT'],
  [/\bWE MEET YOU LOCALLY OR YOU MAIL IT IN\b/, 'WE MEET YOU LOCALLY'], [/\bLOCAL PICKUP OR PREPAID MAIL-IN\b/, 'WE MEET YOU LOCALLY'],
  [/\bPAID THE SAME DAY WE RECEIVE THEM\b/, 'PAID THE SAME DAY WE MEET'], [/\bMAIL-IN KITS AVAILABLE, FREE SHIPPING\b/, 'TEXT A PHOTO OF THE BOXES'],
  [/\bHOUSE CALLS FOR LARGE ESTATES\b/, 'NO FEES, NO OBLIGATION'], [/\bHOUSE CALLS AVAILABLE\b/, 'FREE APPRAISAL'],
  [/\bHOUSE CALLS FOR BIG FINDS\b/, 'FREE LOOK, NO OBLIGATION'], [/^House calls for estates$/, 'Estates handled discreetly'], [/^HOUSE CALLS$/, 'FULL ESTATES'],
  [/^WE BEAT$/, 'COMPARE'], [/^SHOW US THE .* NUMBER\. WE FIX IT\.$/, 'GOT THEIR NUMBER? ASK FOR OURS.'],
  [/\bPRICED LIVE OFF SPOT, NO LOWBALLS\b/, 'PRICED LIVE OFF SPOT'], [/^No lowball offers$/, 'No pressure to sell'],
  [/\bFREE EVALUATIONS DAILY\b/, 'FREE EVALUATIONS'], [/\bPAYING COLLECTOR PRICES, NOT MELT\b/, 'WE LOOK AT EVERY COIN'],
  [/^7 DAYS • WE COME TO YOU$/, 'WE COME TO YOU'], [/\bBULK QUOTES IN WRITING SAME DAY\b/, 'BULK LOTS QUOTED SAME DAY'],
  [/^EVERY SEALED BOX$/, 'SEALED BOXES'], [/^PRICES DAILY$/, 'PRICES BY TEXT'],
  [/Show rates, every single day\./, 'Text a photo for a price.'],
  [/recent comps shown with every offer\./, 'send photos for a cash offer.'],
  [/and documented fair-market offers\./, 'and an offer before you decide.'],
  [/\bHONEST GRADING\b/, 'FREE APPRAISAL'],
  [/(^|\n|✓ ?)TRUSTED(?=\n|$)/g, '$1CASH'], [/✓TRUSTED\b/, '✓CASH'],
];
export function fixClaims(text){
  let s = String(text);
  for (const [re, to] of CLAIM_FIX) s = s.replace(re, to);
  return s;
}
const PAIRS = [['TEXT A PIC', 'GET A PRICE'], ['FREE QUOTE', 'NO OBLIGATION'], ['NO FEES', 'NOTHING TAKEN OFF'], ['ANY CONDITION', 'OLD, WORN OR CRACKED'], ['LOCAL', 'MEET UP NEARBY']];
const HOW = {
  phones: 'Text us a photo of the phone. We send a price, you decide.',
  gold: 'Send photos first. We weigh it in front of you and pay the same day.',
  silver: 'Send photos first. We weigh it in front of you and pay the same day.',
  coins: 'Send photos of the collection. We tell you what we see and what we pay.',
  cars: 'Send photos of the car. We make an offer, you decide.',
  strips: 'Sealed, unexpired boxes only. Text a photo for a price.',
  pokemon: 'Send photos of the binder or the slabs. We make a cash offer.',
  sports: 'Send photos of the cards. We make a cash offer, you decide.',
};
const STEPS = [['Text a photo', 'Send a picture of what you are selling.'], ['Get a price', 'A cash offer, with no obligation.'], ['Get paid', 'Cash or transfer when we meet.']];
export function honestCopy(tpl, cat, have = new Set()){
  const changed = [];
  const L = tpl.layers || [];
  if (!have.size) L.forEach(l => { if (typeof l.text === 'string') l.text.toUpperCase().split(/\n|·|•/).forEach(s => have.add(s.replace(/[✓\s]+/g, ' ').trim())); });
  const set = (l, nt) => { if (nt === l.text) return; changed.push(String(l.text).replace(/\n/g, '/') + ' -> ' + String(nt).replace(/\n/g, '/')); l.text = nt; };
  const byName = n => L.find(l => l.name === n);
  const freePair = () => { const p = PAIRS.find(([b]) => !have.has(b)) || PAIRS[PAIRS.length - 1]; have.add(p[0]); return p; };
  const swapWord = () => { const w = BADGE_SWAP.concat(['TEXT A PIC', 'ANY CONDITION']).find(x => !have.has(x)) || 'FREE QUOTE'; have.add(w); return w; };
  const cased = (orig, nt) => (orig === orig.toUpperCase() ? nt.toUpperCase() : nt);
  /* tiles: a big word over a small line, rewritten as a pair so they still agree */
  for (let i = 1; i <= 4; i++){
    const big = byName('Tile Big ' + i), small = byName('Tile Small ' + i);
    if (!big || typeof big.text !== 'string') continue;
    const bad = PROOF.test(big.text) || PRICE.test(big.text) || (small && typeof small.text === 'string' && PROOF.test(small.text));
    if (!bad) continue;
    const [b, s] = freePair();
    set(big, cased(big.text, b));
    if (small && typeof small.text === 'string') set(small, cased(small.text, s));
  }
  /* a testimonial card becomes a how-it-works card in the shop's own voice */
  L.forEach(l => {
    if (typeof l.text !== 'string') return;
    if (l.name === 'Quote Mark' && /^["“”]+$/.test(l.text.trim())) set(l, '');
    else if (l.name === 'Quote') set(l, HOW[cat] || HOW.phones);
    else if (l.name === 'Who' && /·/.test(l.text)) set(l, 'How it works');
    else if (/^Review Name (\d)$/.test(l.name || '')) set(l, STEPS[+l.name.slice(-1) - 1][0]);
    else if (/^Review Text (\d)$/.test(l.name || '')) set(l, STEPS[+l.name.slice(-1) - 1][1]);
    else if (l.name === 'Rating Line' && PROOF.test(l.text)) set(l, cased(l.text, 'No fees · no obligation'));
  });
  L.forEach(l => {
    if (typeof l.text !== 'string' || !l.text.trim()) return;
    /* a row of stars is a rating whatever layer holds it */
    if (/^[\s★☆]+$/.test(l.text)){
      if (/\s/.test(l.text.trim())){ set(l, '•  •  •'); return; }
      set(l, 'FREE QUOTE');
      /* words, not glyphs: set in the card's support face (the stars used faces the studio does not ship) */
      /* ten letters are wider than five stars: at 0.72x they take the stars' room, not the next line's */
      l.props = Object.assign({}, l.props, { fontFamily: 'Schibsted Grotesk', fontWeight: 800, fontSize: Math.round((l.props && l.props.fontSize || 30) * 0.72 * 10) / 10 });
      return;
    }
    const lines = l.text.split('\n').map(ln => {
      let out = ln;
      if (HOURS.test(out)) out = cased(out, 'Text a pic · get a price');
      if (PRICE.test(out)){
        const m = /^\s*UP TO \$\s?[\d,.]+\s*K?\s*(.*)$/i.exec(out);
        const rest = m ? m[1].trim().toUpperCase() : '';
        out = !m ? out.replace(/\s*\$\s?[\d,.]+\+?\s*/g, ' ').trim()
          : rest === 'PER CARD' ? 'CASH OFFERS, CARD BY CARD'
          : /PAID TODAY/.test(rest) ? 'CASH PAID TODAY'
          : rest === 'CASH' || !rest ? 'CASH ON THE SPOT' : rest;
        out = cased(ln, out);
      }
      if (PROOF.test(out) && out.trim().split(/\s+/).length <= 4 && l.role !== 'headline') out = cased(out, swapWord());
      if (/,\s*EVERY TIME\s*$/i.test(out)) out = out.replace(/,\s*EVERY TIME\s*$/i, '');
      if (DASH.test(out)) out = /\s[–—]\s*YOUR CHOICE\s*$/i.test(out) ? out.replace(/\s[–—]\s*YOUR CHOICE\s*$/i, '') : out.replace(/\s*[–—]\s*/g, ', ');
      return out;
    });
    const nt = lines.join('\n');
    if (nt !== l.text) set(l, nt);
  });
  return changed;
}

/* 4. WRONG DECK — a guard, not a finding. A first reading of the records
   suggested 70 cards were filed in the wrong category; it was the RECORD's
   own `cat` (inherited from its base layout) disagreeing with index.json,
   and the app reads the index, so no card ever showed under the wrong
   filter. refresh_showcase.mjs now writes the index's category into the
   record. This moves a card only if its HEADLINE sells another deck and not
   its own; on 2026-09-22 it moved none. */
export function deckOfHeadline(tpl, cat){
  const h = (tpl.layers || []).filter(l => l.role === 'headline' && typeof l.text === 'string').map(l => l.text).join(' ');
  const own = CAT_WORDS[cat] ? CAT_WORDS[cat].test(h) : false;
  if (own) return cat;
  const f = foreignWords(cat, h);
  return f.length === 1 ? f[0] : cat;
}
/* a supporting line that lists another deck's goods is replaced by the most
   common line of the same role in the card's own deck (read off the library,
   not written here) */
export function fixForeignLines(tpl, cat, defaults){
  const changed = [];
  (tpl.layers || []).forEach(l => {
    if (typeof l.text !== 'string' || l.role === 'website' || l.role === 'headline') return;
    if (!foreignWords(cat, l.text).length) return;
    const d = defaults[cat + '|' + l.role];
    if (d && d !== l.text){ changed.push(l.text + ' -> ' + d); l.text = d; }
  });
  return changed;
}
