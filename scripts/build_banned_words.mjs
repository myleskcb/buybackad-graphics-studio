#!/usr/bin/env node
/* ONE LIST OF BANNED WORDS, ON THE SITE TOO: motion/banned-words.js.

   DESIGN-LAW rule 143: the words no ad of ours says are one list, spec/banned-words.json, read by
   the census (scripts/ad_census.mjs). The site cannot read spec/ (netlify.toml 404s it at the edge,
   as it does docs/ and scripts/), so the pre-flights the customer meets (the full ad's fullWords,
   the video maker's look pre-flight) read this module instead: the same phrases, written from the
   one list, never typed. Rule 143's lesson is that a fix made in one list and not the other comes
   back; this keeps the two from being two.

   usage:  node scripts/build_banned_words.mjs            # rewrite motion/banned-words.js
           node scripts/build_banned_words.mjs --check    # exit 1 if it is stale */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url).pathname, SRC = ROOT + 'spec/banned-words.json', OUT = ROOT + 'motion/banned-words.js';
const spec = JSON.parse(readFileSync(SRC, 'utf8'));
const phrases = spec.phrases.map(({ id, label, pattern, unless, only, say }) => ({ id, label, pattern, ...(unless ? { unless } : {}), ...(only ? { only } : {}), ...(say ? { say } : {}) }));
for (const p of phrases) { new RegExp(p.pattern, 'iu'); if (p.unless) new RegExp(p.unless, 'iu'); }   // a bad pattern stops the build, not a customer's download

const text = `/* MADE FROM spec/banned-words.json BY scripts/build_banned_words.mjs (version ${spec.version}).
   Never type into it: change the list, then run the script. DESIGN-LAW rule 143. */
export const BANNED_VERSION = ${JSON.stringify(spec.version)};
export const BANNED = ${JSON.stringify(phrases, null, 1).replace(/\n\s*/g, ' ')};
const RX = BANNED.map(e => ({ ...e, re: new RegExp(e.pattern, "iu"), unlessRe: e.unless ? new RegExp(e.unless, "iu") : null }));
/** The banned phrases in one piece of an ad's words. cat: the ad's category ("phones", "gold" ...);
 *  a phrase listed for some categories only is passed over on the others. [{ id, label, match, say }] */
export function bannedIn(text, cat) {
  const t = String(text || "").toUpperCase(), out = [];
  for (const e of RX) {
    if (e.only && !e.only.includes(cat)) continue;
    const m = e.re.exec(t); if (!m) continue;
    if (e.unlessRe && e.unlessRe.test(t)) continue;
    out.push({ id: e.id, label: e.label, match: m[0].trim(), say: e.say || "" });
  }
  return out;
}
`;
if (process.argv.includes('--check')) {
  const now = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (now !== text) { console.error('motion/banned-words.js is stale: run node scripts/build_banned_words.mjs'); process.exit(1); }
  console.log(`motion/banned-words.js is current (${phrases.length} phrases, version ${spec.version})`);
} else {
  writeFileSync(OUT, text);
  console.log(`wrote motion/banned-words.js: ${phrases.length} phrases, version ${spec.version}`);
}
