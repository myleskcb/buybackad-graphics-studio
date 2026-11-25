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
   3. The copies agree with the table that is enforced: app.js's PLANS:BEGIN
      block and the landing's PRICING:BEGIN block are the ones
      scripts/build_pricing.mjs writes from it today (--check), PLANS and PACKS
      in app.js match it key by key, and the about page, the terms and the
      landing's FAQ print its numbers. Pro's videos are a monthly allowance and
      Business's unlimited (owner, 2026-11-18).

   usage:  node scripts/plan_economics.mjs        exits non-zero on any failure */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
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
try { execFileSync(process.execPath, [join(ROOT, 'scripts/build_pricing.mjs'), '--check'], { stdio: 'pipe' }); ok(true, 'build_pricing is current'); }
catch (e) { ok(false, String(e.stderr || e.stdout || e).trim().split('\n')[0]); }
const appjs = readFileSync(join(ROOT, 'app.js'), 'utf8');
const block = (appjs.match(/\/\* PLANS:BEGIN[\s\S]*?\*\/([\s\S]*?)\/\* PLANS:END \*\//) || [])[1];
if (ok(block, 'app.js: no PLANS:BEGIN ... PLANS:END block')) {
  const { PLANS, PACKS } = new Function(block + '; return { PLANS, PACKS };')();
  const KEYS = ['label', 'price', 'weekly', 'monthly', 'maxPx', 'watermark', 'video', 'videos', 'qr', 'credits', 'library'];
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
    `${free.weekly} photo downloads a week`, `${st.monthly} photo downloads a month`, `${pro.monthly} photo downloads a month`, `${pro.videos} video ads a month`, 'Unlimited photo downloads', 'Unlimited video ads',
    `Pro is ${usd(pro.price.month)} a month: ${pro.monthly} photo downloads and ${pro.videos} video ads a month`, `Pro has ${pro.monthly} photos and ${pro.videos} videos a month`, `Video ads: ${pro.videos} a month on Pro, unlimited on Business`,
    `${usd(st.price.month)}<small>/mo</small>`, `${usd(pro.price.month)}<small>/mo</small>`, `${usd(biz.price.month)}<small>/mo</small>`,
    `or ${usd(st.price.year)} a year`, `or ${usd(pro.price.year)} a year`, `or $${n(biz.price.year / 100)} a year`,
    `${free.credits} AI credits a month`, `${st.credits} AI credits a month`, `${pro.credits} AI credits a month`, `${biz.credits} AI credits a month`,
    `Keep ${st.library} ads in your library`, `Keep ${n(pro.library)} ads in your library`, `Keep ${n(biz.library)} ads in your library`,
    `${c100.credits} credits are ${usd(c100.price)}`,
  ],
  'about.html': [`Starter, ${usd(st.price.month)} a month`, `Pro, ${usd(pro.price.month)} a month`, `Business, ${usd(biz.price.month)} a month`, `<td>${pro.monthly} a month</td>`, `<td>Download ${pro.videos} a month, no watermark</td>`, `downloading videos comes with Pro, ${pro.videos} a month, and Business, unlimited`,
    `<td>${free.credits}</td><td>${st.credits}</td><td>${pro.credits}</td><td>${biz.credits}</td>`, `<td>${free.library}</td><td>${st.library}</td><td>${n(pro.library)}</td><td>${n(biz.library)}</td>`],
  'terms.html': [`(${usd(st.price.month)}/month or ${usd(st.price.year)}/year)`, `(${usd(pro.price.month)}/month or ${usd(pro.price.year)}/year)`, `(${usd(biz.price.month)}/month or $${n(biz.price.year / 100)}/year)`,
    `${st.monthly} photo downloads per month`, `${pro.monthly} photo downloads per month and ${pro.videos} video ad downloads per month`, 'unlimited photo and video downloads', `${biz.credits} AI credits per month`,
    `Essentials (${P.KITS.essentials.files} files, ${usd(P.KITS.essentials.price)})`, `Complete (${P.KITS.complete.files} files, ${usd(P.KITS.complete.price)})`, `costs ${usd(P.KIT_ADDON_OFF)} less`, `to Complete for ${usd(P.KIT_UPGRADE.price)}`],
};
// the video plans are the ones the pages say download video
ok(!free.video && !st.video && pro.video && biz.video, 'plans.mjs: video should be Pro and Business only, as the pages say');
ok(free.videos === 0 && st.videos === 0 && Number.isInteger(pro.videos) && pro.videos > 0 && biz.videos === null, 'plans.mjs: videos are none on Free and Starter, a monthly number on Pro, unlimited (null) on Business');
for (const [f, wants] of Object.entries(pages)) {
  const html = readFileSync(join(ROOT, f), 'utf8');
  for (const w of wants) ok(html.includes(w), `${f} does not say "${w}"`);
}

console.log('\nplan_economics: ' + (bad.length ? bad.length + ' failure(s)' : 'every plan and pack clears its bar; the copies agree'));
for (const b of bad) console.log('  FAIL ' + b);
process.exit(bad.length ? 1 : 0);
