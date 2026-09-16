const puppeteer = require('/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core');
const fs = require('fs'), path = require('path');
const D = '/Users/admin/Downloads/gfxv23/.scratch-frame-desktop';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox'], headless: 'new'
  });
  const page = await browser.newPage();

  // 1. full size with box guide
  await page.setViewport({ width: 460, height: 920, deviceScaleFactor: 2 });
  await page.goto('file://' + path.join(D, 'out.svg'));
  await page.screenshot({ path: path.join(D, 'shot-full.png') });

  // measure real bbox of every drawn element, in user units
  const svg = fs.readFileSync(path.join(D, 'clean.svg'), 'utf8');
  await page.setContent(`<body style="margin:0">${svg}</body>`);
  const meas = await page.evaluate(() => {
    const s = document.querySelector('svg');
    const out = [];
    let minx=1e9,miny=1e9,maxx=-1e9,maxy=-1e9;
    s.querySelectorAll('rect,path,circle,polygon,g').forEach(el => {
      if (el.tagName==='g') return;
      let bb; try { bb = el.getBBox(); } catch(e){ return; }
      // account for stroke width
      const sw = parseFloat(getComputedStyle(el).strokeWidth)||0;
      const st = el.getAttribute('stroke');
      const pad = (st && st!=='none') ? sw/2 : 0;
      const o={tag:el.tagName, x:+(bb.x-pad).toFixed(2), y:+(bb.y-pad).toFixed(2), w:+(bb.width+2*pad).toFixed(2), h:+(bb.height+2*pad).toFixed(2), fill:el.getAttribute('fill')};
      out.push(o);
      minx=Math.min(minx,o.x); miny=Math.min(miny,o.y);
      maxx=Math.max(maxx,o.x+o.w); maxy=Math.max(maxy,o.y+o.h);
    });
    return {out, minx,miny,maxx,maxy};
  });
  console.log(JSON.stringify(meas.out, null, 0).replace(/\},/g,'},\n'));
  console.log('UNION BBOX  x:', meas.minx, 'y:', meas.miny, 'right:', meas.maxx, 'bottom:', meas.maxy);
  console.log('BOX is 0,0 -> 400,864 :',
    meas.minx >= -0.01 && meas.miny >= -0.01 && meas.maxx <= 400.01 && meas.maxy <= 864.01 ? 'INSIDE' : 'OUT OF BOUNDS');

  // 2. small: 100px wide
  await page.setViewport({ width: 120, height: 240, deviceScaleFactor: 4 });
  const small = fs.readFileSync(path.join(D,'clean.svg'),'utf8').replace('width="400" height="864"','width="100" height="216"');
  await page.setContent(`<body style="margin:0;background:#333">${small}</body>`);
  await page.screenshot({ path: path.join(D,'shot-small.png') });

  // 3. variation grid
  await page.setViewport({ width: 1664, height: 864, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(D,'grid.svg'));
  await page.screenshot({ path: path.join(D,'shot-grid.png') });

  await browser.close();
  console.log('screenshots done');
})().catch(e=>{ console.error('ERR', e); process.exit(1); });
