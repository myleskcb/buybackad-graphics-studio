#!/usr/bin/env node
/* Render the real Easy Studio theme picker and exercise the GFX Grammar
   records through the product UI. This is a visual/interaction companion to
   audit_theme_grammar.mjs; it proves the palettes are reachable, selectable,
   and applied by the existing editor rather than only existing as data. */
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.GFX_BASE || 'http://localhost:8899/';
const OUT = new URL('../.render/theme-grammar.png', import.meta.url).pathname;

mkdirSync(new URL('../.render/', import.meta.url).pathname, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--force-color-profile=srgb'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1100, deviceScaleFactor: 1 });

const errors = [];
page.on('pageerror', error => errors.push(String(error)));
page.on('console', message => {
  if (message.type() === 'error' && !/404|Failed to load resource/i.test(message.text())) errors.push(message.text());
});

await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 });
await page.evaluate(() => showEasy('sell_iphone'));
await page.waitForSelector('#ez-themes .ez-theme', { timeout: 20000 });

const report = [];
const grammarButtons = await page.$$('#ez-themes .ez-theme[aria-label*="GFX Grammar"]');
for (const button of grammarButtons) {
  const label = await button.evaluate(node => node.getAttribute('aria-label'));
  // Invoke the control itself rather than synthesising a pointer click: the
  // success toast from the previous theme can temporarily sit over the row.
  await button.evaluate(node => node.click());
  await new Promise(resolve => setTimeout(resolve, 250));
  const state = await button.evaluate(node => ({
    active: node.classList.contains('active'),
    pressed: node.getAttribute('aria-pressed'),
  }));
  report.push({ label, ...state });
}

const counts = await page.evaluate(() => ({
  all: document.querySelectorAll('#ez-themes .ez-theme').length,
  grammar: document.querySelectorAll('#ez-themes .ez-theme[aria-label*="GFX Grammar"]').length,
  active: document.querySelectorAll('#ez-themes .ez-theme.active').length,
}));
await page.evaluate(() => document.querySelector('#ez-themes').scrollIntoView({ block:'center' }));
await page.screenshot({ path: OUT, fullPage: false });
await browser.close();

console.log(JSON.stringify({ counts, report, screenshot: OUT }, null, 2));
if (counts.grammar !== 4 || counts.active !== 1 || report.some(item => !item.active || item.pressed !== 'true') || errors.length) {
  if (errors.length) console.error(errors.join('\n'));
  process.exit(1);
}
