#!/usr/bin/env node
/* THE METROS THE PLACE PHOTOGRAPHS ARE FOR: motion/metros.js (2026-11-21).

   The owner: "location based backgrounds like photos of cities, aerial view or city signs other city
   landmarks", "start with metropolitans"; approved: the top 20 US metros. The full ad (motion/fullad.js
   groundFor) adds a metro's own photographs (spec/full-grounds.json places) to the pool when the ad's area
   (st.area: a ZIP code or towns) is in it. The area is read as the ad is drawn, before the maker's geo data
   (motion/geo.js) may have loaded, so this writes a small table of its own from the studio's geo data:
   each metro's centre and reach, the first three digits of every ZIP code whose ZIP codes mostly lie within
   a metro's reach, and each place of 10,000 people or more within one, by name and state.

   usage:  node scripts/build_metros.mjs            # rewrite motion/metros.js
           node scripts/build_metros.mjs --check    # exit 1 if it is stale */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url).pathname, OUT = ROOT + 'motion/metros.js';
// the 20 largest US metropolitan areas (Census estimates), each centre between its main cities, reach in miles
const METROS = [
  ['new-york', 'New York', 40.75, -73.98, 40], ['los-angeles', 'Los Angeles', 33.95, -118.15, 38], ['chicago', 'Chicago', 41.88, -87.68, 40],
  ['dallas', 'Dallas–Fort Worth', 32.82, -97.05, 42], ['houston', 'Houston', 29.76, -95.4, 40], ['atlanta', 'Atlanta', 33.76, -84.39, 38],
  ['washington', 'Washington', 38.9, -77.05, 32], ['philadelphia', 'Philadelphia', 39.98, -75.16, 30], ['miami', 'Miami', 26.15, -80.2, 48],
  ['phoenix', 'Phoenix', 33.45, -112.0, 38], ['boston', 'Boston', 42.36, -71.08, 32], ['inland-empire', 'Inland Empire', 34.02, -117.3, 34],
  ['san-francisco', 'San Francisco Bay', 37.75, -122.3, 28], ['detroit', 'Detroit', 42.43, -83.15, 32], ['seattle', 'Seattle', 47.55, -122.3, 34],
  ['minneapolis', 'Minneapolis–St. Paul', 44.96, -93.2, 30], ['tampa', 'Tampa Bay', 27.93, -82.6, 32], ['san-diego', 'San Diego', 32.8, -117.1, 30],
  ['denver', 'Denver', 39.72, -104.95, 28], ['orlando', 'Orlando', 28.53, -81.38, 28],
];
const miles = (a, b, c, d) => {
  const R = 3958.8, t = x => x * Math.PI / 180, dLat = t(c - a), dLon = t(d - b);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(t(a)) * Math.cos(t(c)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
};
/** The metro a point is in: the nearest whose reach takes it in (Palm Springs reaches the Inland Empire's). */
const metroAt = (lat, lon) => {
  let best = null, bd = 1e9;
  for (const [key, , y, x, r] of METROS) { const d = miles(lat, lon, y, x); const reach = key === 'inland-empire' ? r * 1.6 : r; if (d <= reach && d / r < bd) { bd = d / r; best = key; } }
  return best;
};
const zips = JSON.parse(readFileSync(ROOT + 'assets/geo/us-zips.json', 'utf8'));
const places = JSON.parse(readFileSync(ROOT + 'assets/geo/us-places.json', 'utf8')).places;
const by3 = {};
for (const [z, [lat, lon]] of Object.entries(zips)) { const k = z.slice(0, 3), m = metroAt(lat, lon) || '-'; (by3[k] ||= {})[m] = (by3[k][m] || 0) + 1; }
const zip3 = {};
for (const [k, counts] of Object.entries(by3).sort()) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0), [top, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (top !== '-' && n / total >= .5) zip3[k] = top;
}
/* a place by its name: every place of that name, in a metro or not, with its state and people, so a name with
   no state goes to the metro its namesakes' people mostly live in (Pasadena: Texas's and California's) */
const city = {}, inMetro = new Set();
for (const [name, st, lat, lon, pop] of places) { if (pop >= 10000 && metroAt(lat, lon)) inMetro.add(name.toLowerCase()); }
for (const [name, st, lat, lon, pop] of places) { const n = name.toLowerCase(); if (pop < 10000 || !inMetro.has(n)) continue; (city[n] ||= []).push([st, metroAt(lat, lon) || '', pop]); }
const text = `/* MADE FROM THE STUDIO'S GEO DATA BY scripts/build_metros.mjs. Never type into it: change the script, then run it.
   The metros the place photographs are for (spec/full-grounds.json places), and the area that is in each:
   the first three digits of a ZIP code, or a place of 10,000 people or more by name and state. */
export const METROS = ${JSON.stringify(METROS.map(([key, name, lat, lon, r]) => ({ key, name, lat, lon, r })))};
const ZIP3 = ${JSON.stringify(zip3)};
const CITY = ${JSON.stringify(city)};
/** The metro an ad's area is in ("90802", "Long Beach, Carson", "long beach, ca"), or "" outside them all:
 *  a ZIP code by its first three digits; towns by the metro their namesakes' people most live in, each town
 *  one vote (Pasadena, Glendale, Burbank is Los Angeles). */
export function metroOf(area) {
  const s = String(area || "").toLowerCase(); if (!s.trim()) return "";
  const z = s.match(/\\b(\\d{5})\\b/); if (z) return ZIP3[z[1].slice(0, 3)] || "";
  const vote = {};
  for (const part of s.split(/[,;\\/·•|]+| and | & /)) {
    let t = part.trim().replace(/\\s+/g, " "), st = ""; if (!t) continue;
    const m = t.match(/^(.*?)\\s+([a-z]{2})$/); if (m && CITY[m[1]]) { t = m[1]; st = m[2].toUpperCase(); }
    const rows = (CITY[t] || []).filter(r => !st || r[0] === st), all = rows.reduce((a, r) => a + r[2], 0);
    for (const [, k, pop] of rows) vote[k] = (vote[k] || 0) + pop / all;
  }
  const best = Object.entries(vote).sort((a, b) => b[1] - a[1])[0];
  return best && best[0] ? best[0] : "";
}
`;
if (process.argv.includes('--check')) {
  const now = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (now !== text) { console.error('motion/metros.js is stale: run node scripts/build_metros.mjs'); process.exit(1); }
  console.log(`motion/metros.js is current: ${METROS.length} metros, ${Object.keys(zip3).length} ZIP prefixes, ${Object.keys(city).length} places`);
} else {
  writeFileSync(OUT, text);
  console.log(`wrote motion/metros.js: ${METROS.length} metros, ${Object.keys(zip3).length} ZIP prefixes, ${Object.keys(city).length} places, ${(text.length / 1024).toFixed(0)} KB`);
}
