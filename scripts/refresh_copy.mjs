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
