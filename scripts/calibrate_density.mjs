#!/usr/bin/env node
/* Measure the owner's labelled references and our own output with ONE
   instrument. The 25.8-34% "good band" came from design_metrics.py; the lab
   measures with its own edge routine. Comparing a number from one instrument
   against a band from another is how this repo has produced four over-reported
   audits, so: same code, same scale, all three folders plus our cards. */
import puppeteer from 'puppeteer-core';
import { readFileSync, readdirSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const REF = '/Users/admin/Desktop/designs examples/';
const OURS = new URL('../.render/retheme/', import.meta.url).pathname;
const enc = f => 'data:image/' + (/\.png$/i.test(f) ? 'png' : /\.webp$/i.test(f) ? 'webp' : 'jpeg')
  + ';base64,' + readFileSync(f).toString('base64');
const grab = (dir, n) => readdirSync(dir).filter(f => /\.(jpe?g|png|webp)$/i.test(f)).slice(0, n)
  .map(f => enc(dir + (dir.endsWith('/') ? '' : '/') + f));
const sets = {
  good: grab(REF + 'good design', 40),
  mid:  grab(REF + 'mid design', 40),
  bad:  grab(REF + 'bad design', 40),
  ours: grab(OURS, 100),
};
const b = await puppeteer.launch({ executablePath: CHROME, headless:'new', args:['--no-sandbox'], protocolTimeout: 0 });
const p = await b.newPage();
await p.goto('about:blank');
const res = await p.evaluate(async sets => {
  const density = src => new Promise(res2 => {
    const im = new Image();
    im.onload = () => {
      const c = document.createElement('canvas'); c.width = 256; c.height = 256;
      const x = c.getContext('2d'); x.drawImage(im, 0, 0, 256, 256);
      const d = x.getImageData(0,0,256,256).data;
      let e = 0, t = 0;
      for (let y=1;y<256;y++) for (let xx=1;xx<256;xx++){
        const a=(y*256+xx)*4, l=(y*256+xx-1)*4, u=((y-1)*256+xx)*4;
        const d1=Math.abs(d[a]-d[l])+Math.abs(d[a+1]-d[l+1])+Math.abs(d[a+2]-d[l+2]);
        const d2=Math.abs(d[a]-d[u])+Math.abs(d[a+1]-d[u+1])+Math.abs(d[a+2]-d[u+2]);
        if (Math.max(d1,d2) > 24) e++;
        t++;
      }
      res2(e/t*100);
    };
    im.onerror = () => res2(null);
    im.src = src;
  });
  const out = {};
  for (const [k, list] of Object.entries(sets)){
    const vals = [];
    for (const s of list){ const v = await density(s); if (v !== null) vals.push(v); }
    vals.sort((a,b) => a-b);
    out[k] = { n:vals.length, p10:+vals[~~(vals.length*0.1)].toFixed(1),
               median:+vals[~~(vals.length/2)].toFixed(1), p90:+vals[~~(vals.length*0.9)].toFixed(1) };
  }
  return out;
}, sets);
await b.close();
console.log('edge density, one instrument, 256px:\n');
console.log('  set    n    p10   median   p90');
Object.entries(res).forEach(([k,v]) =>
  console.log('  ' + k.padEnd(6) + String(v.n).padStart(3) + '  ' +
    String(v.p10).padStart(5) + '  ' + String(v.median).padStart(6) + '  ' + String(v.p90).padStart(5)));
