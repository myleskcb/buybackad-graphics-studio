#!/usr/bin/env node
/* RELIGHT A CUT-OUT: the same photograph, as it would read in daylight.

   The owner, 2026-11-25, of the white 2025 Camry on a cyan ad: "why does this one look so dark /
   shaded?", then "I like the car and model is good popular", "Yes, brighten it". The ad does not shade
   a product; the photograph was taken on an overcast, wet day (assets/bg-web/angles-toyota-camry-side-
   view-2.jpg): its white paint measured blue at 1.8 times its red, in linear light, and its middle sat
   half a stop low. A white car on a bright ground then reads grey.

   Each entry in RELIGHT (assets/cutouts/RELIGHT.json) is corrected as one light, never retouched:
     - white balance: the paint (opaque pixels brighter than PAINT_L, linear) is brought toward a
       neutral white, `warm` a touch over (daylight), at `strength` of the way;
     - exposure: then the paint's mean is lifted to `white` (linear) by one gain on every pixel, with
       a soft shoulder from `knee` so no highlight clips;
     - the alpha is untouched: the edge stays exactly as scripts/cut_vehicle_photos.py cut it.
   Nothing is painted, cloned or removed: the rain on the paint stays, only lighter.

   It works on the cut-out as the cutter wrote it. RELIGHT.json keeps the SHA-256 of the file it was
   applied to and of what it wrote, so a second run does nothing, and a fresh cut is corrected again.

     node scripts/relight_cutout.mjs            # every entry
     node scripts/relight_cutout.mjs --check    # fails if an entry's file is not its relit one
   Needs Playwright (PLAYWRIGHT_MODULE=…, as the checks) and cwebp (Homebrew webp). */
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TABLE = join(ROOT, 'assets/cutouts/RELIGHT.json');
const PAINT_L = .35;
const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');
const table = JSON.parse(readFileSync(TABLE, 'utf8'));
const check = process.argv.includes('--check');

if (check) {
  let bad = 0;
  for (const [id, e] of Object.entries(table.cutouts)) {
    const f = join(ROOT, 'assets/cutouts', id + '.webp');
    const ok = existsSync(f) && sha(f) === e.to;
    if (!ok) bad++;
    console.log((ok ? 'ok   ' : 'FAIL ') + id + (ok ? '' : ': not the relit file (run node scripts/relight_cutout.mjs)'));
  }
  process.exit(bad ? 1 : 0);
}

const pw = process.env.PLAYWRIGHT_MODULE;
const { chromium } = await import(pw ? pathToFileURL(join(pw, 'index.mjs')).href : 'playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
const tmp = mkdtempSync(join(tmpdir(), 'relight-'));
try {
  for (const [id, e] of Object.entries(table.cutouts)) {
    const f = join(ROOT, 'assets/cutouts', id + '.webp');
    const now = sha(f);
    if (now === e.to) { console.log('done ' + id); continue; }
    const src = 'data:image/webp;base64,' + readFileSync(f).toString('base64');
    const r = await page.evaluate(async ({ src, o, PAINT_L }) => {
      const im = new Image(); im.src = src; await im.decode();
      const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0);
      const D = x.getImageData(0, 0, c.width, c.height), d = D.data;
      const toL = (v) => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
      const toS = (v) => { v = Math.max(0, Math.min(1, v)); return Math.round(255 * (v <= .0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - .055)); };
      const LUT = new Float64Array(256); for (let i = 0; i < 256; i++) LUT[i] = toL(i);
      // the paint: what the light did to white
      let R = 0, G = 0, B = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 250) continue;
        const r = LUT[d[i]], g = LUT[d[i + 1]], b = LUT[d[i + 2]];
        if (.2126 * r + .7152 * g + .0722 * b > PAINT_L) { R += r; G += g; B += b; n++; }
      }
      R /= n; G /= n; B /= n;
      // gains that make it neutral (a touch warm), taken `strength` of the way
      const full = [G / R * o.warm, 1, G / B / o.warm], wb = full.map((k) => 1 + (k - 1) * o.strength);
      const paintL = .2126 * R * wb[0] + .7152 * G * wb[1] + .0722 * B * wb[2];
      const ex = o.white / paintL;
      const shoulder = (v) => v <= o.knee ? v : o.knee + (1 - o.knee) * (1 - Math.exp(-(v - o.knee) / (1 - o.knee)));
      for (let i = 0; i < d.length; i += 4) {
        if (!d[i + 3]) continue;
        d[i] = toS(shoulder(LUT[d[i]] * wb[0] * ex));
        d[i + 1] = toS(shoulder(LUT[d[i + 1]] * wb[1] * ex));
        d[i + 2] = toS(shoulder(LUT[d[i + 2]] * wb[2] * ex));
      }
      x.putImageData(D, 0, 0);
      return { png: c.toDataURL('image/png'), paint: [R, G, B].map((v) => +v.toFixed(3)), wb: wb.map((v) => +v.toFixed(3)), exposure: +ex.toFixed(3), stops: +Math.log2(ex).toFixed(2) };
    }, { src, o: e.settings, PAINT_L });
    const png = join(tmp, id + '.png');
    writeFileSync(png, Buffer.from(r.png.split(',')[1], 'base64'));
    execFileSync('cwebp', ['-quiet', '-q', String(e.settings.quality || 90), '-m', '6', '-alpha_q', '100', '-exact', png, '-o', f]);
    table.cutouts[id] = { ...e, from: now, to: sha(f), measured: { paint_linear_rgb: r.paint, wb_gains: r.wb, exposure: r.exposure, stops: r.stops } };
    console.log(`relit ${id}: paint ${r.paint.join('/')} (linear RGB), gains ${r.wb.join('/')}, ${r.stops >= 0 ? '+' : ''}${r.stops} stops`);
  }
  writeFileSync(TABLE, JSON.stringify(table, null, 1) + '\n');
} finally {
  await browser.close();
  rmSync(tmp, { recursive: true, force: true });
}
