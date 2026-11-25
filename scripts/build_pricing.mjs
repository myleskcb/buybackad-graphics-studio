#!/usr/bin/env node
/* THE PRICES AND THE FEATURE BREAKDOWN, WRITTEN FROM THE ONE TABLE (netlify/lib/plans.mjs).

   Owner, 2026-11-18: "rebuild the checkout, pricing tiers.. and feature breakdown", "so the
   highest package gets video credits", "videos are limited on the 2nd but fully allowed on 3rd".

   The function enforces plans.mjs. Until today the browser's copy (app.js PLANS:BEGIN..END) and the
   landing's four cards were typed by hand and scripts/plan_economics.mjs held them to the table.
   Now both are written from it, so a number is typed once:

     app.js      between PLANS:BEGIN and PLANS:END: PLANS, PACKS, and PLAN_ROWS (the breakdown),
                 PLAN_BULLETS (each card's list), PLAN_FOR (each plan's line), read by the plans
                 page and the checkout dialog
     index.html  between PRICING:BEGIN and PRICING:END in #pricing: the four cards and the table
                 that compares them, as static HTML (the page is read before app.js runs)

   usage:  node scripts/build_pricing.mjs            # rewrite both
           node scripts/build_pricing.mjs --check    # exit 1 if either is stale (plan_economics runs it) */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const P = await import(pathToFileURL(join(ROOT, 'netlify/lib/plans.mjs')).href);
const CHECK = process.argv.includes('--check');
const usd = (cents) => '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 });
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ids = Object.keys(P.PLANS), paid = ids.filter((id) => id !== 'free');
const HOT = 'pro';   // "Most popular" on the cards; Business wears "Unlimited video"
const rows = P.featureRows(), bullets = Object.fromEntries(ids.map((id) => [id, P.planBullets(id)]));

/* ---------- app.js: the browser's copy ---------- */
const lit = (v) => JSON.stringify(v);
const appBlock = `/* PLANS:BEGIN. The browser's copy of netlify/lib/plans.mjs, display only
   (the function enforces its own), WRITTEN by scripts/build_pricing.mjs: change
   plans.mjs and run it (scripts/plan_economics.mjs fails while this is stale).
   Prices in cents; weekly/monthly are photo downloads (null and null:
   unlimited); videos are video downloads a month, counted apart (0: none,
   null: unlimited); credits are AI credits a month; library is ads kept.
   PLAN_ROWS is the feature breakdown, PLAN_BULLETS each card's list, PLAN_FOR
   each plan's line. Owner, 2026-10-09: $25 / $60 / $100, Free beside them;
   2026-11-18: Pro's videos limited, Business's unlimited. */
const PLANS = {
${ids.map((id) => `  ${id}: ${lit(Object.assign({}, P.PLANS[id], id === HOT ? { hot: true } : {}))},`).join('\n')}
};
const PACKS = {
${Object.entries(P.PACKS).map(([id, k]) => `  ${id}: ${lit(k)},`).join('\n')}
};
/* the brand kits (logo/), and what one costs added to a Starter plan's checkout */
const KITS = ${lit(P.KITS)};
const KIT_ADDON_OFF = ${P.KIT_ADDON_OFF};
const PLAN_ROWS = ${lit(rows)};
const PLAN_BULLETS = ${lit(bullets)};
const PLAN_FOR = ${lit(P.PLAN_FOR)};
/* PLANS:END */`;

/* ---------- index.html: the four cards and the table ---------- */
const yearSaving = (p) => (p.price.year ? p.price.month * 12 - p.price.year : 0);
const card = (id) => {
  const p = P.PLANS[id], hot = id === HOT, free = id === 'free';
  const tag = hot ? '\n      <div class="lp-price-tag">Most popular</div>' : id === 'business' ? '\n      <div class="lp-price-tag lp-price-tag-video">Unlimited video</div>' : '';
  const price = free ? '$0<small> forever</small>' : usd(p.price.month) + '<small>/mo</small>';
  const alt = free ? 'No card needed' : `or ${usd(p.price.year)} a year: <b>you save ${usd(yearSaving(p))}</b> (${yearSaving(p) / p.price.month} months free)`;
  const btn = free ? '<button class="btn btn-outline" data-goto="easy">Start free</button>'
    : hot ? `<button class="btn btn-primary" data-goto="plans" data-plan="${id}">Go ${esc(p.label)}</button>` : `<button class="btn btn-outline" data-goto="plans" data-plan="${id}">Choose ${esc(p.label)}</button>`;
  return `    <div class="lp-price-card${free ? ' lp-price-free' : ''}${hot ? ' hot' : ''}">${tag}
      <h3>${esc(p.label)}</h3>
      <p class="lp-price-for">${esc(P.PLAN_FOR[id])}</p>
      <div class="lp-price">${price}</div>
      <div class="lp-price-alt">${alt}</div>
      <ul>${bullets[id].map((b) => '<li>' + esc(b) + '</li>').join('')}</ul>
      ${btn}
    </div>`;
};
const cell = (v) => `<td class="${v === 'Yes' ? 'yes' : v === 'No' ? 'no' : ''}">${esc(v)}</td>`.replace(' class=""', '');
const priceCell = (id) => { const p = P.PLANS[id]; return id === 'free' ? '<td>$0</td>' : `<td>${usd(p.price.month)} a month<small>or ${usd(p.price.year)} a year</small></td>`; };
const table = `  <div class="lp-compare-wrap" role="region" aria-label="Every plan compared" tabindex="0">
    <table class="lp-compare">
      <caption>Every plan, side by side</caption>
      <thead><tr><th scope="col">What you get</th>${ids.map((id) => `<th scope="col"${id === HOT ? ' class="hot"' : ''}>${esc(P.PLANS[id].label)}</th>`).join('')}</tr></thead>
      <tbody>
        <tr><th scope="row">Price</th>${ids.map(priceCell).join('')}</tr>
${rows.map((r) => `        <tr><th scope="row">${esc(r.label)}</th>${ids.map((id) => cell(r.cells[id])).join('')}</tr>`).join('\n')}
      </tbody>
    </table>
  </div>
  <p class="lp-compare-notes">${rows.filter((r) => r.note).map((r) => esc(r.note)).join(' ')}</p>`;
const pack = Object.values(P.PACKS)[0];
const htmlBlock = `<!-- PRICING:BEGIN. Written by scripts/build_pricing.mjs from netlify/lib/plans.mjs: change the table, then run it. -->
  <div class="lp-price-grid">
${ids.map(card).join('\n')}
  </div>
${table}
  <p class="lp-price-foot">AI credits pay for AI backgrounds: one background is one credit. Need more? ${pack.credits} credits are ${usd(pack.price)} and never expire.</p>
  <!-- PRICING:END -->`;

/* ---------- write or check ---------- */
const swap = (file, re, block, what) => {
  const src = readFileSync(join(ROOT, file), 'utf8');
  if (!re.test(src)) { console.error(`${file}: no ${what} block to write`); process.exit(2); }
  const next = src.replace(re, () => block);
  return { src, next, stale: src !== next };
};
const app = swap('app.js', /\/\* PLANS:BEGIN[\s\S]*?\/\* PLANS:END \*\//, appBlock, 'PLANS:BEGIN ... PLANS:END');
const idx = swap('index.html', /<!-- PRICING:BEGIN[\s\S]*?<!-- PRICING:END -->/, htmlBlock, 'PRICING:BEGIN ... PRICING:END');
if (CHECK) {
  const stale = [app.stale && 'app.js PLANS:BEGIN..END', idx.stale && 'index.html PRICING:BEGIN..END'].filter(Boolean);
  if (stale.length) { console.error('stale: ' + stale.join(', ') + ': run node scripts/build_pricing.mjs'); process.exit(1); }
  console.log('build_pricing: app.js and index.html are in step with plans.mjs');
} else {
  if (app.stale) writeFileSync(join(ROOT, 'app.js'), app.next);
  if (idx.stale) writeFileSync(join(ROOT, 'index.html'), idx.next);
  console.log(`build_pricing: wrote ${[app.stale && 'app.js', idx.stale && 'index.html'].filter(Boolean).join(' and ') || 'nothing (both current)'}; ${paid.length} paid plans, ${rows.length} rows`);
}
