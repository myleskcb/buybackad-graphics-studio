#!/usr/bin/env node
/* THE PLANS PAY FOR THEMSELVES, CHECKED (netlify/lib/plans.mjs).

   1. Every plan, interval and credit pack, at its worst: a customer who
      spends every AI credit, each at the full CREDIT_USD a credit may cost,
      plus the hosting estimate, against what the price nets after Stripe.
      Fails if a paid plan keeps less than TARGETS.planMargin, a pack less
      than TARGETS.packMargin, or a free account can cost more than
      TARGETS.freeCostMax a month.
   2. Every paid model in MODEL_COST_USD: what one call costs in credits and
      what is left of a credit's price on each plan (a model dearer than a
      credit costs more credits, never a loss).
   3. The copies agree with the table that is enforced: PLANS and PACKS in
      app.js (between PLANS:BEGIN and PLANS:END), and the numbers the landing,
      the about page and the terms print.

   usage:  node scripts/plan_economics.mjs        exits non-zero on any failure */
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const P = await import(pathToFileURL(join(ROOT, 'netlify/lib/plans.mjs')).href);
const bad = [];
const ok = (c, what) => { if (!c) bad.push(what); return c; };
const $ = (n) => '$' + n.toFixed(2);
const pct = (n) => (n * 100).toFixed(0) + '%';

/* 1. margins */
console.log('Worst case a month: every credit spent at ' + $(P.CREDIT_USD) + ', plus hosting\n');
console.log('plan/pack       interval  price     nets      worst cost  margin');
for (const r of P.economics()) {
  console.log([r.id.padEnd(15), r.interval.padEnd(9), $(r.priceUsd).padEnd(9), $(r.netUsd).padEnd(9), $(r.worstCostUsd).padEnd(11), r.margin === null ? '-' : pct(r.margin)].join(' '));
  if (r.kind === 'pack') ok(r.margin >= P.TARGETS.packMargin, `${r.id}: keeps ${pct(r.margin)}, under ${pct(P.TARGETS.packMargin)}`);
  else if (r.priceUsd) ok(r.margin >= P.TARGETS.planMargin, `${r.id} ${r.interval}: keeps ${pct(r.margin)}, under ${pct(P.TARGETS.planMargin)}`);
  else ok(r.worstCostUsd <= P.TARGETS.freeCostMax, `free: can cost ${$(r.worstCostUsd)} a month, over ${$(P.TARGETS.freeCostMax)}`);
}

/* 2. each model, in credits */
console.log('\nmodel                         cost a call  credits  our cost per credit charged');
for (const [m, usd] of Object.entries(P.MODEL_COST_USD)) {
  const c = P.creditsFor(m, {});
  console.log(m.padEnd(29), ('$' + usd.toFixed(3)).padEnd(12), String(c).padEnd(8), '$' + (usd / c).toFixed(3));
  ok(usd / c <= P.CREDIT_USD + 1e-9, `${m}: costs more than a credit's ${$(P.CREDIT_USD)} per credit charged`);
}

/* 3. the copies */
const appjs = readFileSync(join(ROOT, 'app.js'), 'utf8');
const block = (appjs.match(/\/\* PLANS:BEGIN[\s\S]*?\*\/([\s\S]*?)\/\* PLANS:END \*\//) || [])[1];
if (ok(block, 'app.js: no PLANS:BEGIN ... PLANS:END block')) {
  const { PLANS, PACKS } = new Function(block + '; return { PLANS, PACKS };')();
  const KEYS = ['label', 'price', 'weekly', 'monthly', 'maxPx', 'watermark', 'video', 'qr', 'credits', 'library'];
  ok(Object.keys(PLANS).join() === Object.keys(P.PLANS).join(), `app.js plans ${Object.keys(PLANS)} are not ${Object.keys(P.PLANS)}`);
  for (const id of Object.keys(P.PLANS)) {
    for (const k of KEYS) ok(JSON.stringify(PLANS[id] && PLANS[id][k]) === JSON.stringify(P.PLANS[id][k]), `app.js ${id}.${k} is ${JSON.stringify(PLANS[id] && PLANS[id][k])}, plans.mjs says ${JSON.stringify(P.PLANS[id][k])}`);
  }
  ok(JSON.stringify(PACKS) === JSON.stringify(P.PACKS), 'app.js PACKS differ from plans.mjs');
}
const usd = (cents) => '$' + (cents % 100 ? (cents / 100).toFixed(2) : String(cents / 100));
const n = (v) => Number(v).toLocaleString('en-US');
const st = P.PLANS.basic, pro = P.PLANS.pro, biz = P.PLANS.business, free = P.PLANS.free, c100 = P.PACKS.credits100;
const pages = {
  'index.html': [
    `${free.weekly} photo downloads a week`, `${st.monthly} photo downloads a month`, `${pro.monthly} downloads a month: photos or videos`, 'Unlimited downloads: photos or videos',
    `${usd(st.price.month)}<small>/mo</small>`, `${usd(pro.price.month)}<small>/mo</small>`, `${usd(biz.price.month)}<small>/mo</small>`,
    `or ${usd(st.price.year)} a year`, `or ${usd(pro.price.year)} a year`, `or $${n(biz.price.year / 100)} a year`,
    `${free.credits} AI credits a month`, `${st.credits} AI credits a month`, `${pro.credits} AI credits a month`, `${biz.credits} AI credits a month`,
    `Keep ${st.library} ads in your library`, `Keep ${n(pro.library)} ads in your library`, `Keep ${n(biz.library)} ads in your library`,
    `${c100.credits} credits are ${usd(c100.price)}`,
  ],
  'about.html': [`Starter, ${usd(st.price.month)} a month`, `Pro, ${usd(pro.price.month)} a month`, `Business, ${usd(biz.price.month)} a month`, `<td>${pro.monthly} a month, photos or videos</td>`,
    `<td>${free.credits}</td><td>${st.credits}</td><td>${pro.credits}</td><td>${biz.credits}</td>`, `<td>${free.library}</td><td>${st.library}</td><td>${n(pro.library)}</td><td>${n(biz.library)}</td>`],
  'terms.html': [`(${usd(st.price.month)}/month or ${usd(st.price.year)}/year)`, `(${usd(pro.price.month)}/month or ${usd(pro.price.year)}/year)`, `(${usd(biz.price.month)}/month or $${n(biz.price.year / 100)}/year)`,
    `${st.monthly} photo downloads per month`, `${pro.monthly} downloads per month`, `${biz.credits} AI credits per month`],
};
// the video plans are the ones the pages say download video
ok(!free.video && !st.video && pro.video && biz.video, 'plans.mjs: video should be Pro and Business only, as the pages say');
for (const [f, wants] of Object.entries(pages)) {
  const html = readFileSync(join(ROOT, f), 'utf8');
  for (const w of wants) ok(html.includes(w), `${f} does not say "${w}"`);
}

console.log('\nplan_economics: ' + (bad.length ? bad.length + ' failure(s)' : 'every plan and pack clears its bar; the copies agree'));
for (const b of bad) console.log('  FAIL ' + b);
process.exit(bad.length ? 1 : 0);
