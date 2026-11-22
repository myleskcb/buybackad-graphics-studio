/* WHERE A SAMPLE AD IS FROM (2026-11-21; the owner, of the library: "all the same selling points and location";
   asked where the samples should be, "US metros nationwide"; and of their number, "Match the area, 555-01xx").

   Every sample printed LONG BEACH • LOS ANGELES • ANAHEIM on (562) 999-4994. A sample (the library's stills,
   its other looks, the hero wall, the full-size renders, the makers' strips of layouts) now takes its area
   from one of these metros by its own key, so the gallery reads like ads from buyers across the country. A
   visitor's own ad is never a sample: their area is theirs.

   zip: a downtown zip the studio's own area lookup (app.js resolveArea, assets/geo/us-zips.json) turns into
   the metro's towns. number: the metro's own area code on 555-0100 to 555-0199, the numbers set aside for
   fiction, so no real person's line is printed. The city photograph a sample stands on follows its towns
   (fullad.js placeHere, rule 154). */
export const SAMPLE_AREAS = [
  { metro: "Los Angeles", zip: "90012", code: "213" },
  { metro: "Long Beach", zip: "90802", code: "562" },
  { metro: "Orange County", zip: "92805", code: "714" },
  { metro: "San Diego", zip: "92101", code: "619" },
  { metro: "Inland Empire", zip: "92501", code: "951" },
  { metro: "Bay Area", zip: "94612", code: "510" },
  { metro: "Sacramento", zip: "95814", code: "916" },
  { metro: "Phoenix", zip: "85004", code: "602" },
  { metro: "Las Vegas", zip: "89101", code: "702" },
  { metro: "Seattle", zip: "98101", code: "206" },
  { metro: "Portland", zip: "97204", code: "503" },
  { metro: "Denver", zip: "80202", code: "303" },
  { metro: "Salt Lake City", zip: "84101", code: "801" },
  { metro: "Dallas", zip: "75201", code: "214" },
  { metro: "Houston", zip: "77002", code: "713" },
  { metro: "Austin", zip: "78701", code: "512" },
  { metro: "San Antonio", zip: "78205", code: "210" },
  { metro: "Chicago", zip: "60601", code: "312" },
  { metro: "Detroit", zip: "48226", code: "313" },
  { metro: "Minneapolis", zip: "55401", code: "612" },
  { metro: "Atlanta", zip: "30303", code: "404" },
  { metro: "Miami", zip: "33130", code: "305" },
  { metro: "Orlando", zip: "32801", code: "407" },
  { metro: "Tampa", zip: "33602", code: "813" },
  { metro: "Charlotte", zip: "28202", code: "704" },
  { metro: "Nashville", zip: "37203", code: "615" },
  { metro: "New York", zip: "10001", code: "212" },
  { metro: "Philadelphia", zip: "19103", code: "215" },
  { metro: "Boston", zip: "02108", code: "617" },
  { metro: "Washington", zip: "20001", code: "202" },
];
const hash = s => { let h = 2166136261 >>> 0; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; };
/* the sample at place i of its line in the recipes' order: the metros walked seven at a time from the line's
   own start, so each metro takes its share (the landing keeps neighbours apart: app.js scNeighboursDiffer) */
export function sampleAreaAt(line, i) {
  const a = SAMPLE_AREAS[(hash(line) + i * 7) % SAMPLE_AREAS.length];
  return { ...a, number: `(${a.code}) 555-01${String((hash(line + "#" + i) >>> 8) % 100).padStart(2, "0")}` };
}
/* a sample's area by its key (a recipe's id, a look's file): the metro, its zip and its sample number */
export function sampleArea(key) {
  const h = hash(key), a = SAMPLE_AREAS[h % SAMPLE_AREAS.length];
  return { ...a, number: `(${a.code}) 555-01${String((h >>> 8) % 100).padStart(2, "0")}` };
}
