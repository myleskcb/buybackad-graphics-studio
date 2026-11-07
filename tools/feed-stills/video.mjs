#!/usr/bin/env node
/* The feed stills as videos: each still in tools/feed-stills/out/report.json drawn again
   as the engine's own MP4 (motion/export.js), with every setting the still had, so the
   photo is a frame of the video. The owner, 2026-11-03: "can any photo become a video?",
   "animate all or have animated elements".

   usage:  python3 -m http.server 8931 --bind 127.0.0.1   (repo root), then
           node tools/feed-stills/video.mjs [--ids a,b]
   Writes tools/feed-stills/out/video/<id>.mp4 (kept out of git: several MB each). */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const ROOT = new URL('../../', import.meta.url).pathname;
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const at = p => p.startsWith('/') ? p : ROOT + p;
const DIR = at(arg('--out', 'tools/feed-stills/out/')).replace(/\/?$/, '/'), OUT = DIR + 'video/';   // --out: the batch's folder
const BASE = arg('--base', 'http://127.0.0.1:8931'), only = arg('--ids', '');
mkdirSync(OUT, { recursive: true });
const { chromium } = process.env.PLAYWRIGHT_MODULE ? await import(process.env.PLAYWRIGHT_MODULE) : createRequire(import.meta.url)('playwright');
const rows = JSON.parse(readFileSync(DIR + 'report.json', 'utf8')).cards.filter(c => c.ok && c.style && (!only || only.split(',').includes(c.id)));

const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', e => console.error('page:', e.message));
await page.goto(BASE + '/tools/feed-stills/index.html');
await page.waitForFunction(() => window.FS && window.VideoStill && window.Mp4Muxer, null, { timeout: 60000 });
for (const row of rows) {
  const r = await page.evaluate(style => FS.video(style), row.style);
  writeFileSync(OUT + row.id + '.mp4', Buffer.from(r.url.split(',')[1], 'base64'));
  console.log(row.id, Math.round(r.bytes / 1024) + ' KB', r.seconds + ' s', r.audio ? 'with music' : 'silent');
}
await browser.close();
