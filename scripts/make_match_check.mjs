#!/usr/bin/env node
/* AN AD SHOWS WHAT ITS WORDS NAME (DESIGN-LAW 155; the owner, 2026-11-19, through the roadmap session,
   of the library's Cars & Trucks: a "WE BUY CARS" ad whose models line read "3 SERIES • 5 SERIES • X3 •
   X5" stood on a Toyota Tacoma; two whose line read "RX • ES • IS • GX • NX" on a Toyota; "MOTORCYCLES
   BUYER" on a Honda Civic. "Check every recipe whose headline or models line names a make or model ...
   not just cars: the same goes for phones, consoles and computers.")

   For every recipe (motion/recipes.json, every look of it: a look is the same recipe on another seed, so
   it draws from the same pictures) and every line's own full ad (motion/subjects.json, its models line and
   headlines against its pool), the makes its words name (a make's name, or its models: BMW's 3 Series,
   Lexus's RX ES IS, a Galaxy, a PS5) against the makes of the pictures it can draw (its own pictures, or
   its line's pool when it has none; the make read off the cut-out's file name). An ad fails when it can
   draw a picture of a make its words do not name. Words that leave the list open ("... and more", "and
   cargo vans", "every make") let the line's pool stand. A kind fails the same way: a motorcycle named
   over a car. An ad that stands on its words alone draws nothing, and passes.

   usage:  node scripts/make_match_check.mjs [--json]   exits 1 on any failure */
import { readFileSync } from 'node:fs';
const ROOT = new URL('../', import.meta.url).pathname;
const recipes = JSON.parse(readFileSync(ROOT + 'motion/recipes.json', 'utf8')).recipes;
const lines = Object.fromEntries(JSON.parse(readFileSync(ROOT + 'motion/subjects.json', 'utf8')).subjects.map(s => [s.key, s]));

/* what words name: a make, or one of its models (a run of Lexus's two-letter models, not one "IS") */
export const NAMED = {
  toyota: /\bTOYOTAS?\b|\bTACOMAS?\b|\bCAMRYS?\b|\bCOROLLAS?\b|\bTUNDRAS?\b|\bRAV4S?\b|\b4RUNNERS?\b|\bPRIUS\b|\bSUPRAS?\b|\bHIGHLANDERS?\b|\bGR ?86\b/,
  honda: /\bHONDAS?\b|\bCIVICS?\b|\bACCORDS?\b|\bCR-?VS?\b|\bPILOTS?\b|\bODYSSEYS?\b|\bTYPE R\b|\bS2000\b|\bNSX\b/,
  bmw: /\bBMWS?\b|\b[2-8] SERIES\b|\bX[1-7]\b|\bM[2-8]\b/,
  lexus: /\bLEXUS(ES)?\b|(\b(RX|ES|IS|GX|NX|LX|LS|UX|RC)\b\s*[•,/]\s*){2,}\b(RX|ES|IS|GX|NX|LX|LS|UX|RC)\b/,
  mercedes: /\bMERCEDES\b|\bBENZ\b|\bAMG\b|\b[CEGS]-?CLASS\b|\bG-?WAGONS?\b|\bSPRINTERS?\b/,
  ford: /\bFORDS?\b|\bF-?150S?\b|\bF-?250S?\b|\bRAPTORS?\b|\bMUSTANGS?\b|\bBRONCOS?\b|\bTRANSITS?\b|\bEXPLORERS?\b/,
  chevy: /\bCHEV(Y|YS|IES|ROLETS?)\b|\bSILVERADOS?\b|\bCAMAROS?\b|\bCORVETTES?\b|\bTAHOES?\b|\bEXPRESS VANS?\b/,
  ram: /\bRAMS?\b|\bPROMASTERS?\b/, tesla: /\bTESLAS?\b|\bMODEL [3SXY]\b|\bCYBERTRUCKS?\b/,
  nissan: /\bNISSANS?\b|\bGT-?R\b|\bSKYLINES?\b|\b3[57]0Z\b|\bTITANS?\b/, mazda: /\bMAZDAS?\b|\bMIATAS?\b|\bRX-?7\b/, subaru: /\bSUBARUS?\b|\bWRX\b|\bSTI\b/,
  jeep: /\bJEEPS?\b|\bWRANGLERS?\b|\bGLADIATORS?\b/, dodge: /\bDODGES?\b|\bCHARGERS?\b|\bCHALLENGERS?\b/, gmc: /\bGMCS?\b|\bSIERRAS?\b/,
  kenworth: /\bKENWORTHS?\b/, peterbilt: /\bPETERBILTS?\b/, freightliner: /\bFREIGHTLINERS?\b/, volvo: /\bVOLVOS?\b/,
  apple: /\bI(PHONE|PAD)S?\b|\bMACBOOKS?\b|\bIMACS?\b|\bMAC (MINI|STUDIO|PRO)\b|\bAPPLE\b|\bAIRPODS?\b|\bBEATS\b/,
  samsung: /\bSAMSUNGS?\b|\bGALAXY\b|\bGALAXIES\b/, google: /\bPIXELS?\b|\bGOOGLE\b/,
  sony: /\bPS[45]\b|\bPLAYSTATIONS?\b|\bSONY\b|\bDUALSENSE\b/, microsoft: /\bXBOX(ES)?\b|\bSURFACES?\b/, nintendo: /\bNINTENDO\b|\bSWITCH(ES)?\b/,
  valve: /\bSTEAM ?DECKS?\b/, meta: /\bQUESTS?\b|\bMETA\b/, canon: /\bCANONS?\b/, nikon: /\bNIKONS?\b/, fujifilm: /\bFUJI(FILM)?\b/, dji: /\bDJI\b|\bMAVIC\b/,
};
/* a picture's make, off its file name (assets/cutouts/<file>.webp) */
const FILE = {
  toyota: /toyota/, honda: /honda/, bmw: /bmw/, lexus: /lexus/, mercedes: /mercedes|benz|amg|sprinter/, ford: /(^|-)ford-|f150|raptor/, chevy: /chevy|chevrolet|silverado/,
  ram: /(^|-)ram-|promaster/, tesla: /tesla|cybertruck/, nissan: /nissan/, mazda: /mazda/, subaru: /subaru/, jeep: /jeep/, dodge: /dodge/, gmc: /gmc/,
  kenworth: /kenworth/, peterbilt: /peterbilt/, freightliner: /freightliner/, volvo: /volvo/,
  apple: /iphone|ipad|macbook|imac|mac-studio|mac-mini|^qs-(watch|imac|macbook|ipad|device-airpods)|airpods|beats|^ip-/,
  samsung: /^sam-|samsung|galaxy/, google: /^pix-|pixel|google/,
  sony: /ps5|playstation|dualsense|camera-sony/, microsoft: /xbox|surface/, nintendo: /switch|nintendo/, valve: /steam-?deck/, meta: /quest|meta-/,
  canon: /canon/, nikon: /nikon/, fujifilm: /fuji/, dji: /dji/,
};
/* kinds named over the kind a picture shows */
const KIND_NAMED = { motorcycle: /\bMOTORCYCLES?\b|\bMOTORBIKES?\b|\bHARLEYS?\b|\bDIRT ?BIKES?\b/ };
const KIND_FILE = { motorcycle: /harley|motorcycle|bike/ };
// a list left open lets the line's pool stand: "... and more", "and cargo vans", "every make"
const OPEN = /\bAND MORE\b|\b& MORE\b|\bAND CARGO VANS\b|\bEVERY MAKE\b|\bALL MAKES\b|\bANY MAKE\b|\bAND OTHERS?\b/;

export const namedIn = t => Object.keys(NAMED).filter(k => NAMED[k].test(t));
export const makeOf = f => Object.keys(FILE).filter(k => FILE[k].test(String(f).toLowerCase()));
const kindsIn = t => Object.keys(KIND_NAMED).filter(k => KIND_NAMED[k].test(t));
const kindOf = f => Object.keys(KIND_FILE).filter(k => KIND_FILE[k].test(String(f).toLowerCase()));
const poolOf = key => [...new Set(((lines[key] && lines[key].pool) || []).flatMap(e => e.set.map(x => x.file)))];

/* one ad: its words, the pictures it can draw, and what disagrees */
export function judge({ id, text, own, line, wordsOnly }) {
  if (wordsOnly) return null;
  const T = String(text || '').toUpperCase(), named = namedIn(T), kinds = kindsIn(T);
  const files = own && own.length ? own : poolOf(line), why = [];
  if (named.length && !(OPEN.test(T) && !(own && own.length))) {
    const off = files.filter(f => { const m = makeOf(f); return m.length && !m.some(x => named.includes(x)); });
    if (off.length) why.push(`names ${named.join(' and ')} but can draw ${off.length} of ${files.length} of another make (${off.slice(0, 3).join(', ')})`);
  }
  for (const k of kinds) {
    const off = files.filter(f => !kindOf(f).includes(k));
    if (off.length) why.push(`names ${k}s but can draw ${off.length} of ${files.length} that are not (${off.slice(0, 3).join(', ')})`);
  }
  return why.length ? { id, line, why } : null;
}

const bad = [];
for (const r of recipes) {
  const w = r.words || {};
  const j = judge({ id: r.id, text: [w.headline, w.tag, w.claim, w.points, w.label, w.sticker].filter(Boolean).join(' • '),
    own: (r.pictures || []).map(p => p.file), line: r.subject, wordsOnly: r.words_only });
  if (j) bad.push(j);
}
for (const s of Object.values(lines)) {
  const j = judge({ id: 'line ' + s.key, text: [s.models, ...(s.heads || [])].filter(Boolean).join(' • '), own: [], line: s.key });
  if (j) bad.push(j);
}
if (process.argv.includes('--json')) console.log(JSON.stringify(bad, null, 1));
else for (const b of bad) console.log(`  ${b.id} (${b.line}): ${b.why.join('; ')}`);
console.log(bad.length ? `make match: ${bad.length} ads show something their words do not name` : `make match: every ad of ${recipes.length} recipes and ${Object.keys(lines).length} lines shows what its words name`);
process.exit(bad.length ? 1 : 0);
