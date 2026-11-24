// THE AREA FROM A ZIP CODE OR A CITY (owner, 2026-11-18: "and we should put zip code", "you can quick
// pick the cities surrounding if mentioned or you can take the suggested nearby locations / cities
// commonly associated"). The studio's own data and scoring (app.js geoLoad, geoNearest, geoMatch,
// geoArea: assets/geo/us-zips.json, 41,488 ZIP codes, and us-places.json, 16,261 places with their
// populations), read here for the video maker, loaded only when someone types in the area field.
const GEO = { zips: null, places: null, p: null };

export function geoLoad(base = "../assets/geo/") {
  if (GEO.zips && GEO.places) return Promise.resolve(GEO);
  return GEO.p ||= Promise.all([
    fetch(base + "us-zips.json").then(r => r.ok ? r.json() : {}),
    fetch(base + "us-places.json").then(r => r.ok ? r.json() : { places: [] }),
  ]).then(([z, p]) => { GEO.zips = z || {}; GEO.places = (p && p.places) || []; return GEO; })
    .catch(() => { GEO.zips = GEO.zips || {}; GEO.places = GEO.places || []; GEO.p = null; return GEO; });
}

const miles = (a, b, c, d) => {
  const R = 3958.8, toR = x => x * Math.PI / 180, dLat = toR(c - a), dLon = toR(d - b);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a)) * Math.cos(toR(c)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
};
/** The town a point is in: the nearest place within 60 miles, a real town before a hamlet next door. */
function nearest(lat, lon) {
  let best = null, bd = 1e9;
  for (const p of GEO.places) { const d = miles(lat, lon, p[2], p[3]); if (d > 60) continue; const adj = d - Math.log10(p[4]) * 1.2; if (adj < bd) { bd = adj; best = p; } }
  return best;
}
/** The place a name means ("Long Beach", "long beach, ca"): the largest that starts with it. */
function match(q) {
  q = String(q || "").trim().toLowerCase(); if (!q) return null;
  let st = null; const m = q.match(/^(.*?)[,\s]+([a-z]{2})$/);
  if (m && m[1]) { q = m[1].trim(); st = m[2].toUpperCase(); }
  let best = null;
  for (const p of GEO.places) {
    if (st && p[1] !== st) continue;
    const nm = p[0].toLowerCase(), pre = nm.startsWith(q), hit = pre || (q.length >= 4 && nm.includes(q));
    if (!hit) continue;
    const score = (nm === q ? 2 : pre ? 1 : 0) * 1e9 + p[4];
    if (!best || score > best.s) best = { p, s: score };
  }
  return best && best.p;
}
/** The towns a buyer at (lat, lon) is known by, best first: the studio's scoring (a metro's suburbs within
 *  about 22 miles, a rural place's towns within 95), the buyer's own town first, nothing named twice. */
function towns(lat, lon, home) {
  const rows = GEO.places.map(p => ({ p, d: miles(lat, lon, p[2], p[3]) }));
  const within30 = rows.reduce((s, r) => s + (r.d <= 30 ? r.p[4] : 0), 0);
  const tier = within30 >= 2500000 ? "metro" : within30 >= 600000 ? "city" : within30 >= 150000 ? "town" : "rural";
  const R = { metro: 22, city: 35, town: 55, rural: 95 }[tier], k = { metro: .14, city: .08, town: .05, rural: .028 }[tier], minPop = { metro: 8000, city: 4000, town: 1500, rural: 1000 }[tier];
  const isHome = p => home && p[0] === home[0] && p[1] === home[1], odd = /-|\/|\bUniversity\b|\bCollege\b|\bAFB\b|\bBase\b|\bStation\b/;
  // the neighbours first, the big cities after (the studio's own rule: "reviewers live in the suburbs and the
  // smaller towns, not only downtown"): a Long Beach buyer's line is LONG BEACH, LAKEWOOD, CARSON, not LOS ANGELES
  const bigCap = { metro: 250000, city: 150000, town: 80000, rural: 1e9 }[tier];
  const seen = new Set(home ? [home[0]] : []), out = home ? [home[0]] : [];
  const cand = rows.filter(r => r.d <= R && r.p[4] >= minPop && !isHome(r.p) && !odd.test(r.p[0]))
    .map(r => ({ p: r.p, s: Math.log(r.p[4]) - r.d * k })).sort((a, b) => b.s - a.s);
  for (const pass of [r => r.p[4] <= bigCap, r => r.p[4] > bigCap])
    cand.filter(pass).forEach(r => { if (out.length < 9 && !seen.has(r.p[0]) && !out.some(n => r.p[0].indexOf(n + " ") === 0)) { seen.add(r.p[0]); out.push(r.p[0]); } });
  return out;
}

/** A ZIP code or a city, placed: { zip, city, st, towns (the buyer's own first, up to nine), suggested
 *  (the town and its two best neighbours) }, or null where it cannot be placed. */
export async function areaFrom(text) {
  await geoLoad();
  text = String(text || "").trim(); if (!text) return null;
  let lat, lon, home, zip = null;
  const z = text.match(/^\d{5}$/);
  if (z) { if (!GEO.zips[z[0]]) return null; zip = z[0]; [lat, lon] = GEO.zips[zip]; home = nearest(lat, lon); }
  else { home = match(text); if (!home) return null; lat = home[2]; lon = home[3]; }
  if (!home) return null;
  const t = towns(lat, lon, home);
  return { zip, city: home[0], st: home[1], towns: t, suggested: t.slice(0, 3) };
}
