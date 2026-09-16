const fs = require('fs');
const puppeteer = require('/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core');
const dir = '/Users/admin/Downloads/gfxv23/.scratch-wd/';

function page(svg, w, h, bg) {
  const sized = svg.replace(/^<svg /, `<svg width="${w}" height="${h}" `).replace(/width="\d+" height="\d+" viewBox/, m => m);
  return `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:${bg||'#7a7a7a'}}svg{display:block}</style>${sized}`;
}
(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox'], headless: true
  });
  const jobs = [
    ['card.svg', 'card_400.png', 400, 864],
    ['card.svg', 'card_100.png', 100, 216],
    ['grid.svg', 'grid.png', 1070, 906],
    ['bleed.svg', 'bleed.png', 400, 864],
  ];
  for (const [src, out, w, h] of jobs) {
    let svg = fs.readFileSync(dir + src, 'utf8');
    svg = svg.replace(/width="[\d.]+" height="[\d.]+"/, `width="${w}" height="${h}"`);
    const html = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:#7a7a7a}svg{display:block}</style>${svg}`;
    fs.writeFileSync(dir + src + '.html', html);
    const p = await browser.newPage();
    await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await p.goto('file://' + dir + src + '.html', { waitUntil: 'load' });
    await p.screenshot({ path: dir + out });
    if (src === 'bleed.svg') {
      const r = await p.evaluate(() => new Promise(res => {
        const s = new XMLSerializer().serializeToString(document.querySelector('svg'));
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas'); c.width=400; c.height=864;
          const g = c.getContext('2d'); g.drawImage(img,0,0,400,864);
          const d = g.getImageData(0,0,400,864).data;
          const BX=60,BY=120,BW=280,BH=620;
          let outsideNonGreen=0, inside=0, insideGreen=0, firstBad=null;
          for (let y=0;y<864;y++) for (let x=0;x<400;x++){
            const i=(y*400+x)*4;
            const green = d[i]<40 && d[i+1]>200 && d[i+2]<40;
            const inBox = x>=BX && x<BX+BW && y>=BY && y<BY+BH;
            if (inBox){ inside++; if(green) insideGreen++; }
            else if (!green){ outsideNonGreen++; if(!firstBad) firstBad=[x,y,d[i],d[i+1],d[i+2]]; }
          }
          res({outsideNonGreen, inside, insideGreen, firstBad});
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(s)));
      }));
      console.log('BLEED:', JSON.stringify(r));
    }
    await p.close();
  }
  await browser.close();
  console.log('shots done');
})().catch(e => { console.error('ERR', e); process.exit(1); });
