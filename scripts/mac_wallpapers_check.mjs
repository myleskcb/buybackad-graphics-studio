#!/usr/bin/env node
/* MAC WALLPAPERS: DO THE WALLPAPERS DRAW, AND DOES A LIT SCREEN STAY WHERE IT BELONGS?
 *
 * mac-wallpapers.js (OPEN-ITEMS §AW) adds ten drawn wallpapers to the ground
 * picker and lights a laptop picture's screen from Easy Mode's "On the laptop
 * screen" row. This checks, on the real studio:
 *
 *   draw      every wallpaper paints a picture (not one flat colour) as a
 *             1080 background and in a screen's shape; every photograph
 *             (Lake Tahoe, the Golden Gate) loads, with its thumbnail and its
 *             credit in assets/bg-web/ATTRIBUTION.json;
 *   lit       on every offered card whose picture has a screen we know (the
 *             offer cards and the library cards with mac-pro-open-front or
 *             macbook-open-angle), each wallpaper, each photograph and the
 *             visitor's own picture light it, and the gate (pgCheck) fails
 *             nothing it did not fail with the screen OFF; AUTO lights a
 *             studio card with its own wallpaper and leaves a library card
 *             as photographed;
 *   designed  whatever the visitor chose, a build outside Easy Mode's render
 *             (the template strip, the designer opening a template, the
 *             audits) draws the card as designed: a studio card with its own
 *             wallpaper, the same one every time, a library card unlit
 *             (its thumbnail and library render are baked);
 *   designer  the hand-off keeps the lit screen, saves it as its recipe (the
 *             cut-out's address, no picture data) and lights it again when
 *             the canvas is loaded from what it saved.
 *
 * usage:  python3 -m http.server 8899   then
 *         CHROME=/path/to/chrome [FABRIC_JS=/path/to/fabric.min.js] node scripts/mac_wallpapers_check.mjs
 * Exits 1 on any failure. */
import { openStudio } from './_showcase_harness.mjs';

const { browser, page, errors } = await openStudio();
await new Promise(r => setTimeout(r, 3000));
const res = await page.evaluate(async () => {
  const out = { fails: [], cards: [] };
  const fail = (what, why) => out.fails.push(what + ': ' + why);
  if (!window.MAC_WALLPAPERS || !MAC_WALLPAPERS.screen){ fail('load', 'mac-wallpapers.js did not load'); return out; }
  account = { email: 'audit@local', role: 'admin', plan: 'pro' }; loadAccount = async () => account;
  document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
  const MW = MAC_WALLPAPERS, keys = MW.list.map(w => w.key);

  /* draw: a picture, not one colour (the spread of its luminance) */
  const spread = c => { const s = document.createElement('canvas'); s.width = s.height = 48; const g = s.getContext('2d'); g.drawImage(c, 0, 0, 48, 48);
    const d = g.getImageData(0, 0, 48, 48).data, L = []; for (let k = 0; k < d.length; k += 4) L.push(0.2126 * d[k] + 0.7152 * d[k + 1] + 0.0722 * d[k + 2]);
    L.sort((a, b) => a - b); return L[Math.floor(L.length * 0.95)] - L[Math.floor(L.length * 0.05)]; };
  keys.forEach(k => {
    const sq = GROUNDS.canvasFor(GROUNDS.src(k, { c1: '#101014', c2: '#101014', accent: '#ff7a1a', support: '#ff7a1a', ink: '#ffffff' }, 3), null, 1080);
    if (!sq || spread(sq) < 40) fail('draw ' + k, 'the 1080 background is ' + (sq ? 'flat (' + spread(sq).toFixed(0) + ')' : 'missing'));
    const sc = MW.paint(k, 1266, 831); if (spread(sc) < 40) fail('draw ' + k, 'the screen picture is flat');
  });
  if (!EZ_GROUND_STYLES.some(s => s.key === 'wallpapers')) fail('picker', 'no Wallpapers group');
  const credits = await fetch('assets/bg-web/ATTRIBUTION.json').then(r => r.json()).catch(() => []);
  for (const ph of MW.photos){
    const el = await MW.loadPhoto(ph); if (!el) fail('photo ' + ph.key, 'does not load');
    else if (Math.max(el.naturalWidth, el.naturalHeight) > 2048) fail('photo ' + ph.key, 'over 2048px on its long side (renders black on a card)');
    const th = await fetch(ph.thumb, { method: 'HEAD' }).catch(() => null); if (!th || !th.ok) fail('photo ' + ph.key, 'no thumbnail');
    const c = credits.find(a => 'assets/bg-web/' + a.file === ph.src);
    if (!c || !c.license || /NC|ND/.test(c.license)) fail('photo ' + ph.key, c ? 'licence ' + c.license : 'no credit in ATTRIBUTION.json');
  }
  const specs = ezGroundSpecs(EZ_GROUND_STYLES.find(s => s.key === 'wallpapers'));
  if (MW.photos.some(ph => !specs.some(x => x.bg.src === ph.src))) fail('picker', 'a photograph is missing from the Wallpapers group');

  /* the visitor's own picture: a test card with words on it */
  const own = document.createElement('canvas'); own.width = 1200; own.height = 800;
  { const g = own.getContext('2d'); g.fillStyle = '#2a7'; g.fillRect(0, 0, 1200, 800); g.fillStyle = '#fff'; g.font = 'bold 160px sans-serif'; g.fillText('OWN', 380, 460); }
  const ownUrl = own.toDataURL('image/png');
  await new Promise(r => { const im = new Image(); im.onload = () => { MW.screen.own = im; MW.screen.ownVer++; r(); }; im.src = ownUrl; });

  /* the cards: offer templates and library cards whose picture has a screen */
  const hasScreen = layers => (layers || []).some(l => l.kind === 'cutout' && l.props && MW.screenOf(l.props.src));
  const ids = TEMPLATES.filter(t => !t.showcase && hasScreen(t.layers)).map(t => ({ open: () => showEasy(t.id), id: t.id }));
  try { await scLoadIndex(); } catch (e){}
  for (const c of Object.values(SHOWCASE.byId || {})){
    if (typeof scIsLive === 'function' && !scIsLive(c)) continue;
    const rec = await fetch('assets/showcase/tpl/' + c.id + '.json').then(r => r.ok ? r.json() : null).catch(() => null);
    if (rec && rec.tpl && hasScreen(rec.tpl.layers)) ids.push({ open: () => openShowcase(c.id), id: 'sc-' + c.id });
  }
  const litOf = sc => sc.getObjects().filter(o => o.type === 'image' && o.pgScreen);
  for (const card of ids){
    await card.open();
    if (ez.tpl !== card.id){ out.cards.push({ id: card.id, skip: 'opened ' + ez.tpl }); continue; }
    await ensureTplAssets(ezTpl()); await document.fonts.ready;
    $('ez-phone').value = '(562) 999-4994';
    const render = key => { MW.screen.key = key; const sc = renderEzCanvas(1080, 'png', undefined, undefined, 'square', true);
      const r = pgCheck(sc), lit = litOf(sc).length; sc.dispose(); return { fails: r.fails.map(f => f.code + ':' + f.line), lit }; };
    const off = render('off'), row = { id: card.id, off: off.fails.length, checked: 0 };
    if (off.lit) fail(card.id, 'lit with the screen off');
    const library = /^sc-/.test(card.id), auto = render(null);
    if (library ? auto.lit : !auto.lit) fail(card.id, library ? 'a library card lit on AUTO' : 'a studio card not lit on AUTO');
    for (const key of keys.concat(MW.photos.map(ph => ph.key), 'own')){
      const on = render(key); row.checked++;
      if (!on.lit) fail(card.id + ' ' + key, 'the screen did not light');
      const fresh = on.fails.filter(f => !off.fails.includes(f));
      if (fresh.length) fail(card.id + ' ' + key, 'the gate fails ' + fresh.join(', '));
    }
    /* designed: the same card built outside Easy Mode's render, twice, with
       the visitor's choice set to something else each time */
    const asDesigned = () => { const sc = new fabric.StaticCanvas(null, { width: TPL_W, height: TPL_H, enableRetinaScaling: false });
      ezTpl().layers.forEach(l => sc.add(buildLayer(l, ezTpl().id))); const k = litOf(sc).map(o => o.pgScreen).join(); sc.dispose(); return k; };
    MW.screen.key = 'off'; const d1 = asDesigned(); MW.screen.key = keys[3]; const d2 = asDesigned();
    if (d1 !== d2) fail(card.id, 'the card as designed follows the visitor\'s choice (' + d1 + ' / ' + d2 + ')');
    if (library ? d1 : !d1) fail(card.id, library ? 'a library card lit as designed (its baked thumbnail would not match)' : 'a studio card not lit as designed');
    out.cards.push(row);
  }

  /* the designer: the hand-off, its recipe, a reload */
  const first = ids.find(c => out.cards.some(r => r.id === c.id && !r.skip));
  if (first){
    await first.open(); await ensureTplAssets(ezTpl());
    MW.screen.key = keys[5];
    openAdvancedFromEz(); await new Promise(r => setTimeout(r, 1200));
    const lit = litOf(canvas);
    if (!lit.length) fail('designer', 'the hand-off lost the lit screen');
    const json = canvas.toJSON(EXTRA_PROPS), saved = (json.objects || []).filter(o => o.pgScreen);
    if (!saved.length) fail('designer', 'pgScreen is not saved');
    saved.forEach(o => { if (!/\/cutouts\/[^/]+\.(webp|png)(\?|$)/.test(o.src || '') || o.src.length > 300) fail('designer', 'saved as picture data, not the cut-out address'); });
    await new Promise(r => canvas.loadFromJSON(json, r)); await new Promise(r => setTimeout(r, 600));
    if (!litOf(canvas).length) fail('designer', 'not lit again after a load');
    MW.screen.key = null;
  }
  return out;
});
res.cards.forEach(c => console.log(c.id.padEnd(34), c.skip ? 'skipped: ' + c.skip : 'screen choices ' + c.checked + ', gate fails with the screen off ' + c.off));
const errs = errors.filter(e => !/alphabetical|willReadFrequently/.test(e));
if (errs.length) res.fails.push(...errs.map(e => 'page error: ' + e));
console.log(res.fails.length ? '\nFAIL\n' + res.fails.join('\n') : '\nok: ' + res.cards.filter(c => !c.skip).length + ' cards, every wallpaper draws, studio cards lit as designed, library cards as photographed, the designer keeps its recipe');
await browser.close();
process.exit(res.fails.length ? 1 : 0);
