/* Real screens of the studio for the explainer videos: each is cut out of the
   running product, never drawn. Run against a deploy or a local copy:
     node tools/explainers/shots.mjs https://<site>            (PLAYWRIGHT_MODULE=… if playwright is elsewhere)
   Writes tools/explainers/shots/*.jpg at 2x. */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BASE = (process.argv[2] || 'http://localhost:8899').replace(/\/$/, '');
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'shots');
const NUMBER = '310 555 0142';   // a 555-01xx number: reserved for fiction, nobody's line

const proxy = process.env.HTTPS_PROXY && !/localhost|127\.0\.0\.1/.test(BASE) ? { server: process.env.HTTPS_PROXY } : undefined;
const b = await chromium.launch({ proxy });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const wait = ms => p.waitForTimeout(ms);
const jpg = (name, clip) => p.screenshot({ path: path.join(OUT, name + '.jpg'), type: 'jpeg', quality: 90, clip });
const box = async (sels, pad = 14) => {
  const r = await p.evaluate(ss => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    ss.forEach(s => document.querySelectorAll(s).forEach(el => { const b = el.getBoundingClientRect(); if (!b.width) return;
      x0 = Math.min(x0, b.left); y0 = Math.min(y0, b.top); x1 = Math.max(x1, b.right); y1 = Math.max(y1, b.bottom); }));
    return [x0, y0, x1, y1]; }, sels);
  const x = Math.max(0, r[0] - pad), y = Math.max(0, r[1] - pad);
  return { x, y, width: Math.min(1280 - x, r[2] - r[0] + pad * 2), height: Math.min(900 - y, r[3] - r[1] + pad * 2) };
};

await p.goto(BASE + '/', { waitUntil: 'load', timeout: 90000 }); await wait(3500);
await p.locator('.hero').getByText('Make my ad', { exact: true }).first().click();
await p.waitForSelector('#ez-strip', { state: 'visible', timeout: 30000 }); await wait(4500);
await p.getByText('Not now', { exact: true }).click({ timeout: 4000 }).catch(() => {});
await wait(800);
await p.evaluate(() => window.scrollTo(0, 0)); await wait(300);
await jpg('step1-strip', await box(['#ez-strip'], 10));
// a free card with a photograph behind it, so the preview is what downloads
const cards = p.locator('#ez-strip > *');
await cards.nth(5).click().catch(() => {}); await wait(2500);
await p.locator('#ez-form-card').scrollIntoViewIfNeeded(); await wait(400);
await jpg('step2-empty', await box(['#ez-phone'], 46));
await p.fill('#ez-phone', NUMBER); await wait(2500);
await jpg('step2-typed', await box(['#ez-phone'], 46));
await p.locator('#ez-preview').scrollIntoViewIfNeeded(); await wait(600);
await p.locator('#ez-preview').screenshot({ path: path.join(OUT, 'ad-1.jpg'), type: 'jpeg', quality: 92 });
// one tap restyles the whole ad: three colour sets on the same card
const chips = p.locator('#ez-themes button, #ez-themes .chip, #ez-themes [role="button"]');
const n = await chips.count();
let k = 0;
for (const i of [3, 9, 15, 21]) {
  if (i >= n) break;
  await chips.nth(i).scrollIntoViewIfNeeded().catch(() => {});
  await chips.nth(i).click({ timeout: 4000 }).catch(() => {}); await wait(2600);
  await p.locator('#ez-preview').scrollIntoViewIfNeeded(); await wait(300);
  await p.locator('#ez-preview').screenshot({ path: path.join(OUT, 'ad-theme-' + (++k) + '.jpg'), type: 'jpeg', quality: 92 });
}
await p.locator('#ez-themes').scrollIntoViewIfNeeded(); await wait(400);
await jpg('themes', await box(['#ez-themes'], 10));
// six sizes
await p.locator('#ez-sizes').scrollIntoViewIfNeeded(); await wait(300);
await jpg('step3-buttons', await box(['#ez-sizes', '#ez-download', '#ez-video'], 12));
await p.getByText('Story 9:16', { exact: true }).first().click().catch(() => {}); await wait(3000);
await p.locator('#ez-preview').scrollIntoViewIfNeeded(); await wait(300);
await p.locator('#ez-preview').screenshot({ path: path.join(OUT, 'ad-story.jpg'), type: 'jpeg', quality: 92 });
await p.getByText('Square 1:1', { exact: true }).first().click().catch(() => {}); await wait(2500);
// the video pop-up
await p.locator('#ez-video').scrollIntoViewIfNeeded(); await p.locator('#ez-video').click();
for (let i = 0; i < 60; i++) { await wait(1500); if (await p.evaluate(() => { const v = document.querySelector('video'); return !!(v && v.getBoundingClientRect().width > 0); })) break; }
await wait(1500);
await p.evaluate(() => { const v = document.querySelector('video'); if (v) { v.pause(); v.currentTime = 7.5; } }); await wait(1200);
const vb = await p.evaluate(() => { const v = document.querySelector('video'); let el = v; while (el && el.parentElement && el.getBoundingClientRect().width < 560) el = el.parentElement; const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; });
await jpg('video-popup', vb);
console.log('theme chips:', n, 'shots written to', OUT);
await b.close();
