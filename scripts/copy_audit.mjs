#!/usr/bin/env node
/* COPY AUDIT — read every word the customer actually sees, and score it.
 *
 * The owner's note: customers often do not know what they have or what the
 * jargon means. They are looking for a quick, obvious option. Copy that reads
 * as trade vocabulary ("PRE-1965", ".925 STERLING", "BOWMAN 1ST", "NUMBERED")
 * asks the reader to already be a collector. That is a filter on the top of the
 * funnel, and this business wants the opposite.
 *
 * Prints, per category, every distinct string in the library plus flags:
 *   JARGON   term only an existing collector/dealer would know
 *   STALE    a device/product name that dates the ad
 *   LONG     a line long enough to be skimmed past at feed size
 */
import puppeteer from 'puppeteer-core';
import { writeFileSync, mkdirSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.GFX_BASE || 'http://localhost:8899/';
const OUT = new URL('../.render/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless:'new', args:['--no-sandbox'] });
const page = await browser.newPage();
await page.goto(BASE, { waitUntil:'networkidle2', timeout:60000 });
await page.evaluate(() => document.fonts.ready);
// Wait for the measured contrast table (assets/contrast-fix.json) to load and
// apply. It is fetched asynchronously, so a harness that starts measuring too
// early records the PRE-repair colours and reports failures that are already
// fixed on screen.
await page.waitForFunction(() => typeof CONTRAST_FIX !== 'undefined' && CONTRAST_FIX !== null, { timeout: 20000 }).catch(()=>{});
await new Promise(r => setTimeout(r, 5000));

const rows = await page.evaluate(() => {
  const out = [];
  TEMPLATES.forEach(t => {
    (t.layers||[]).forEach(l => {
      if (typeof l.text !== 'string' || !l.text.trim()) return;
      out.push({ id:t.id, cat:t.cat, name:l.name, role:l.role,
                 text:l.text, fs:(l.props&&l.props.fontSize)||0 });
    });
  });
  return out;
});
await browser.close();

// Terms that presume the reader is already in the hobby/trade.
const JARGON = [
  'pre-1965','junk silver','.925','sterling flatware','bullion','over spot','assayed','assay',
  'numbered','rookie auto','bowman 1st','prizm','psa','bgs','sgc','cgc','slab','shadowless',
  '1st edition','wotc','base set','key date','toned','carson city','greysheet',
  'walking liberty','peace dollar','morgan','dental gold','melt','ndc','lancets','cgm',
];
/* Terms that read as PAWN SHOP rather than as a licensed business.
   This is the opposite failure from jargon and just as expensive. The owner's
   note, 2026-08-29: copy like "YOU DO NOT NEED TO KNOW WHAT IT IS" does not
   merely fail to help, it actively hurts, because the clientele it attracts is
   the clientele the business does not want. A seller with a real collection is
   choosing between buyers and picks the one that looks like a business — so
   desperate copy filters FOR hagglers and low-value lots at the same ad spend.

   Legibility and professionalism are independent axes. Fixing one by breaking
   the other is not progress, and this list exists so the audit can catch a
   swing in either direction. */
const UNPROFESSIONAL = [
  'you do not need to know','you don\'t need to know','shoebox','worth real money',
  'any amount','big or small','no collection too','gold teeth','junk','desperate',
  'quick cash','fast cash','easy money','we come to you today','cash today',
  'text us now!','dm your','bring it in today','hit us up','no questions asked',
];
// Product names that date the creative.
const STALE = [
  'iphone 15','iphone 14','iphone 13','iphone 12','galaxy s24','galaxy s23','galaxy s22',
  'pixel 8','pixel 7','pixel 6','airpods pro 2','apple watch series 9','se 2022',
];

const byCat = {};
rows.forEach(r => { (byCat[r.cat] ||= []).push(r); });

const seen = new Set();
const findings = { jargon:{}, stale:{}, unprofessional:{}, long:[] };

console.log('COPY THE CUSTOMER ACTUALLY READS\n');
Object.keys(byCat).sort().forEach(cat => {
  const texts = [...new Set(byCat[cat].map(r => r.text))];
  console.log(`\n=== ${cat.toUpperCase()} (${texts.length} distinct strings) ===`);
  texts.forEach(txt => {
    const low = txt.toLowerCase();
    const j = JARGON.filter(w => low.includes(w));
    const s = STALE.filter(w => low.includes(w));
    const u = UNPROFESSIONAL.filter(w => low.includes(w));
    const flags = [];
    if (j.length) { flags.push('JARGON:' + j.slice(0,3).join('/')); j.forEach(w => (findings.jargon[w] ||= 0, findings.jargon[w]++)); }
    if (s.length) { flags.push('STALE:' + s.join('/')); s.forEach(w => (findings.stale[w] ||= 0, findings.stale[w]++)); }
    if (u.length) { flags.push('UNPROFESSIONAL:' + u.slice(0,3).join('/')); u.forEach(w => (findings.unprofessional[w] ||= 0, findings.unprofessional[w]++)); }
    const longest = txt.split('\n').reduce((m,l)=>Math.max(m,l.length),0);
    if (longest > 46) { flags.push('LONG:' + longest); findings.long.push(txt); }
    if (flags.length){
      console.log(`  [${flags.join('  ')}]`);
      console.log(`     ${txt.replace(/\n/g,' / ').slice(0,110)}`);
    }
  });
});

console.log('\n\n================ SUMMARY ================');
console.log('\nSTALE PRODUCT NAMES (date the creative):');
Object.entries(findings.stale).sort((a,b)=>b[1]-a[1]).forEach(([w,c]) => console.log(`  ${String(c).padStart(4)}x  ${w}`));
console.log('\nUNPROFESSIONAL (attracts the wrong clientele — costs money directly):');
const upEntries = Object.entries(findings.unprofessional).sort((a,b)=>b[1]-a[1]);
if (!upEntries.length) console.log('  none');
upEntries.forEach(([w,c]) => console.log(`  ${String(c).padStart(4)}x  ${w}`));
console.log('\nJARGON TERMS (presume an existing collector/dealer):');
const jEntries = Object.entries(findings.jargon).sort((a,b)=>b[1]-a[1]);
if (!jEntries.length) console.log('  none');
jEntries.slice(0,30).forEach(([w,c]) => console.log(`  ${String(c).padStart(4)}x  ${w}`));
console.log(`\nlines longer than 46 chars: ${findings.long.length}`);

writeFileSync(OUT+'copy-audit.json', JSON.stringify({rows, findings}, null, 1));
console.log('\nwrote ' + OUT + 'copy-audit.json');
// Stale product names and unprofessional register are both hard failures:
// one dates the business, the other selects the wrong customer.
process.exit((Object.keys(findings.stale).length || upEntries.length) ? 1 : 0);
