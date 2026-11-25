/* ═══════════════════════════════════════════════════════════════════════════
   NAME IDEAS (DESIGN-LAW 180). The owner, 2026-11-24: "does it have name suggestions?", "a keyword
   search", "tries to mix words into a working name?".

   The customer types a few words (their own name, their street, a word they like); the ideas mix them
   with what the shop buys, its town and the trade's own words, by patterns a namer uses: the town and the
   goods, a compound, a blend where two words share letters, "The ... Vault", initials, a person's own
   shop. No model, no cost: the same words give the same ideas, and More gives others. Never another
   firm's name or mark, and never a claim the ads may not make (motion/banned-words.js's kind).
   ═══════════════════════════════════════════════════════════════════════════ */

/* what each line's shop is about, as words a name can carry (generic: no brand, no model) */
const GOODS = {
  phones: ["Phone", "Cell", "Mobile", "Device", "Signal", "Screen"], gaming: ["Game", "Level", "Console", "Arcade", "Player", "Joystick"],
  gold: ["Gold", "Karat", "Bullion", "Nugget", "Jewel", "Gem"], coins: ["Coin", "Mint", "Stack", "Bullion", "Eagle", "Penny"],
  pokemon: ["Card", "Slab", "Pack", "Vault", "Holo", "Deck"], silver: ["Silver", "Sterling", "Bullion", "Mint", "Stack", "Bar"],
  cars: ["Auto", "Motor", "Car", "Wheel", "Drive", "Garage"], sports: ["Card", "Slab", "Rookie", "Pack", "Vault", "Dugout"],
  computers: ["Tech", "Byte", "Chip", "Circuit", "Laptop", "Logic"], audio: ["Audio", "Sound", "Beat", "Bass", "Tone", "Wave"],
  wearables: ["Watch", "Time", "Dial", "Wrist", "Tick", "Crown"], cameras: ["Lens", "Shutter", "Camera", "Focus", "Frame", "Drone"],
  strips: ["Strip", "Health", "Care", "Supply", "Test", "Meter"], wholesale: ["Bulk", "Lot", "Pallet", "Stock", "Load", "Freight"],
  devices: ["Device", "Tech", "Gadget", "Mobile", "Screen", "Cell"], resale: ["Swap", "Trade", "Resale", "Deal", "Flip", "Market"],
};
/* what the shop is: the trade's own words, the line's first */
const TRADE = ["Buyers", "Exchange", "Trade", "Depot", "Hub", "Co.", "Outlet", "Market", "Supply", "House", "Spot", "Bros", "Collective", "Room", "Club", "Traders", "Shop", "Works"];
const TRADE_FOR = {
  cars: ["Auto Buyers", "Motors", "Exchange", "Garage", "Auto Co."], gold: ["Exchange", "Buyers", "Gold Co.", "Jewelers", "Bullion Co."],
  coins: ["Exchange", "Coin Co.", "Numismatics", "Collectibles", "Mint"], pokemon: ["Collectibles", "Card Co.", "Vault", "Breaks", "Exchange"],
  sports: ["Collectibles", "Card Co.", "Vault", "Exchange", "Sportscards"], wholesale: ["Wholesale", "Liquidators", "Distributors", "Traders", "Supply"],
  devices: ["Wireless", "Electronics", "Mobile", "Tech", "Device Co."], resale: ["Resale", "Exchange", "Trading Post", "Market", "Swap Shop"],
  phones: ["Wireless", "Buyers", "Exchange", "Mobile", "Cell Co."], gaming: ["Games", "Gaming", "Exchange", "Arcade", "Trade"],
  computers: ["Tech", "Computers", "Exchange", "Systems", "Labs"],
};
/* words with a feel, for a name that is not just what it sells */
const VIBE = ["Honest", "Fair", "True", "Prime", "Golden", "Royal", "Metro", "Coastal", "Urban", "North", "West", "East", "Summit", "Atlas", "Rocket",
  "Blue", "Iron", "Lucky", "Liberty", "Harbor", "Sunset", "Pacific", "Corner", "Main Street", "Crown", "Anchor", "Keystone", "Copper", "Canyon", "Village"];
const ROOMS = ["Vault", "Room", "Spot", "House", "Shop", "Den", "Lab", "Corner", "Counter", "Stop"];

/* never in a name: another firm's name or mark, a model, or a claim (rule 176's free-licence rule; banned-words.js) */
const NEVER = /\b(apple|iphone|ipad|macbook|samsung|galaxy|pixel|google|pok[eé]mon|nintendo|playstation|xbox|rolex|tesla|gamestop|ebay|amazon|craigslist|offerup|facebook|beats|bose|gopro|canon|nikon|sony|topps|panini|upper deck|psa|beckett|ecoatm|gazelle|best|top|#1|number one|guaranteed?|highest|cheapest|lowest|fastest|unbeatable)\b/i;

const cap = w => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w;
/* words that are never counted: Maria's Bullion, not Bullions */
const UNCOUNTED = new Set(["bullion", "gold", "silver", "sterling", "audio", "health", "care", "freight", "tech", "resale", "swap", "trade", "bulk", "stock", "supply", "mobile", "sound", "bass", "logic", "focus"]);
const plural = w => UNCOUNTED.has(w.toLowerCase()) || /(s|x|ch|sh)$/i.test(w) ? w : /[^aeiou]y$/i.test(w) ? w.slice(0, -1) + "ies" : w + "s";
function rng(seed) { let a = (seed >>> 0) || 1; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

/** Two words that share letters, run together: Cash + Shop is Cashop, Karat + Atlas is Karatlas. Null when they share none. */
export function blend(a, b) {
  const A = a.toLowerCase(), B = b.toLowerCase();
  for (let k = Math.min(A.length, B.length) - 1; k >= 2; k--) if (A.endsWith(B.slice(0, k))) return cap(a) + B.slice(k);
  return null;
}

/** what the customer typed, sorted: their own initials, a person's name, a word the line knows, any other word */
export function readKeywords(raw) {
  const words = String(raw || "").split(/[,;/\n]+|\s{2,}/).flatMap(p => p.trim().split(/\s+/)).map(w => w.replace(/[^A-Za-z0-9'&-]/g, "")).filter(w => w && w.length <= 18);
  const out = { initials: [], person: [], words: [] }, all = new Set([...Object.values(GOODS).flat(), ...VIBE].map(w => w.toLowerCase()));
  for (const w of words) {
    if (/^[A-Z]{2,3}$/.test(w)) out.initials.push(w);
    else if (/^[A-Z][a-z]+'s$/.test(w)) out.person.push(w.slice(0, -2));
    // a word typed with its capital that the banks do not know may be the owner's name: Maria's Gold
    else if (/^[A-Z][a-z]{2,11}$/.test(w) && !all.has(w.toLowerCase())) { out.person.push(w); out.words.push(w); }
    else if (all.has(w.toLowerCase())) out.words.push(cap(w));
    else out.words.push(/^[A-Z]/.test(w) && w.length > 1 ? w : cap(w));
  }
  return out;
}

/** Name ideas for a shop: { name, why }. Deterministic for the words, the line, the town and the seed. */
export function nameIdeas({ keywords = "", cat = "phones", town = "" } = {}, { seed = 1, n = 18 } = {}) {
  const K = readKeywords(keywords), goods = GOODS[cat] || GOODS.phones, trades = [...(TRADE_FOR[cat] || []), ...TRADE];
  const t = String(town || "").replace(/[^A-Za-z .'-]/g, "").trim(), townWords = t.split(/\s+/).filter(Boolean).map(cap), townInit = townWords.length >= 2 ? townWords.map(w => w[0]).join("") : "";
  const R = rng(hash([keywords, cat, t].join("|").toLowerCase()) ^ (seed * 2654435761)), pick = a => a[Math.floor(R() * a.length)];
  const mine = [...K.words, ...townWords.slice(-1)], feel = [...mine, ...mine, ...VIBE];
  const G = () => pick(goods), V = () => pick(feel);
  // a trade word that repeats what the name already says is dropped: no "Golden Cell Mobile"
  const Tr = (name = "") => { const n = name.toLowerCase(); for (let i = 0; i < 6; i++) { const x = pick(trades); if (!(goods.some(g => x.toLowerCase().includes(g.toLowerCase())) && goods.some(g => n.includes(g.toLowerCase())))) return x; } return "Exchange"; };
  const P = [
    ["town", () => { if (!t) return null; const a = `${townWords.join(" ")} ${G()}`; return `${a} ${Tr(a)}`; }, "Your town and what you buy: easy to find, easy to trust"],
    ["vibe", () => { const a = `${V()} ${G()}`; return `${a} ${Tr(a)}`; }, "A word with a feel, then what you buy"],
    ["compound", () => `${V().replace(/\s+/g, "")}${G()}`, "Two words made one: short, and it reads as a brand"],
    ["blend", () => { for (let i = 0; i < 8; i++) { const b = R() < .5 ? blend(V().replace(/\s+/g, ""), G()) : blend(G(), pick([...ROOMS, ...mine, "Atlas", "Exchange", "Nest", "Stack"])); if (b && b.length <= 12) return b; } return null; }, "Two words that share letters, run together"],
    ["room", () => `The ${G()} ${pick(ROOMS)}`, "A place people go: the vault, the room, the spot"],
    ["own", () => K.person.length ? `${pick(K.person)}'s ${plural(G())}` : K.initials.length ? `${pick(K.initials)} ${pick(trades)}` : null, "Your own name on the door"],
    ["pair", () => { const a = G(), b = pick(goods.filter(x => x !== a)); return `${a} & ${b} ${pick(TRADE.slice(0, 9))}`; }, "Two of the things you buy, so people know at once"],
    ["kw", () => mine.length ? `${pick(mine)} ${Tr()}` : null, "Your word, then what you are"],
    ["short", () => townInit && `${townInit} ${plural(G())}`, "Your town's initials: short on a sign"],
    ["plain", () => `${V()} ${plural(G())}`, "Plain and clear"],
  ];
  const seen = new Set(), out = [], byPat = P.map(() => 0);
  for (let i = 0; out.length < n && i < n * 30; i++) {
    const j = i % P.length, [key, make, why] = P[j];
    if (byPat[j] >= Math.ceil(n / 4)) continue;
    let name = make();
    if (!name) continue;
    name = name.replace(/\s+/g, " ").trim();
    const k = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (seen.has(k) || NEVER.test(name) || name.length > 28 || name.split(" ").length > 4) continue;
    seen.add(k); byPat[j]++;
    out.push({ name, why, kind: key });
  }
  return out;
}
