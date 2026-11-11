/* The five explainer videos, as scenes. Square 1080, made to be read with the
   sound off: every point is a line on screen.

   The owner, 2026-11-11: video ads that "explain all the functions and how to
   make ads on our platform", "what the selling points are", for "people who
   don't even understand the platform", "how you can beat the competition in
   professionalism", "the cost and trial and error using generative AI ...
   versus our generator, which is dialed in and ready", and "make it seem like
   a no-brainer".

   What is said is only what the product does. The plan numbers are FACTS
   below, held to netlify/lib/plans.mjs by check.mjs. The screens are cut out
   of the running studio (shots.mjs), the ads are the library's own renders,
   and the number in them is a 555-01xx one. Nothing here is a customer's
   result, a review, or a rival's product: the "typed over a photo" post and
   the AI tries are drawn as plain shapes, not passed off as anyone's work
   (DESIGN-LAW rule 55, and 16 CFR 465 on invented proof). */
(function () {
  const { Scene, define, C, el, pr, eo, clamp } = window.EX;
  const AD = n => '../../assets/library-ads/' + n + '.jpg';
  const SHOT = n => 'shots/' + n + '.jpg';
  /* FACTS:BEGIN (check.mjs reads this block) */
  const FACTS = {
    designs: '600+',            // 362 ready to post + 243 classics on the landing's own count, 2026-11-11
    colourSets: 31,             // COLOR_THEMES
    categories: 13, sizes: 6, videoSeconds: 10,
    free: { weekly: 3 },
    starter: { month: 25, downloads: 100, each: '25¢' },
    pro: { month: 60, downloads: 500, each: '12¢' },
    business: { month: 100 },
  };
  /* FACTS:END */
  window.EX.FACTS = FACTS;
  /* what the end card prints under the name: the site's address once one
     resolves (stage.html?url=…, render.mjs --url). None is printed by default:
     buyback.ad and studio.scans.ad have no DNS yet (docs/OPERATIONS.md). */
  const URL_LINE = new URLSearchParams(location.search).get('url') || '';

  function endCard(line, dur = 3.6) {
    const s = new Scene(dur, C.paper);
    s.node('logo', '', { x: 465, y: 150, w: 150, h: 150, fx: 'pop', at: .1, dur: .5 });
    s.text('GRAPHICS STUDIO', { x: 90, y: 345, w: 900, size: 66, align: 'center', at: .3 });
    s.text('by BUYBACK.AD', { x: 90, y: 432, w: 900, size: 34, cls: 'clash', align: 'center', at: .45, color: '#3b3833' });
    const two = /\n/.test(line);
    s.text(line, { x: 70, y: two ? 540 : 575, w: 940, size: two ? 70 : 80, align: 'center', at: .7 });
    s.node('cta', 'Make my ad', { x: 350, y: 800, w: 380, fx: 'pop', at: 1.25, dur: .5 }).style.textAlign = 'center';
    if (URL_LINE) s.text(URL_LINE, { x: 90, y: 950, w: 900, size: 38, cls: 'clash', align: 'center', at: 1.5 });
    else s.text('Free to design. No card needed.', { x: 90, y: 950, w: 900, size: 34, cls: 'body', align: 'center', at: 1.5 });
    return s;
  }
  const plainPost = big => `<u></u><p style="top:5%;font-size:${big ? 34 : 15}px">we buy phones!!</p><p style="top:78%;font-size:${big ? 24 : 11}px;color:#fff">cash $$ any condition</p><p style="top:88%;font-size:${big ? 22 : 10}px;color:#fff">call 310-555-0142</p>`;

  /* ── 1. What is this? ─────────────────────────────────────────────────── */
  define('what-it-is', { title: 'What Graphics Studio is, in 20 seconds', music: 'small_note_boogaloo', poster: 14.6 }, () => {
    const a = new Scene(3.1, C.ink);
    a.text('Somebody near you\nhas an [[old iPhone]]\nin a drawer.', { x: 70, y: 330, w: 940, size: 78, at: .15 });
    a.text('You buy phones. They do not know you exist.', { x: 70, y: 720, w: 900, size: 40, cls: 'body', at: 1.3, color: C.paper });

    const b = new Scene(4.4, C.paper);
    b.text('They text\nwhoever\nlooks like\na [[real]]\n[[business.]]', { x: 60, y: 170, w: 500, size: 62, at: .15 });
    const ph = b.node('phone', '<div class="bar">Marketplace · near you</div><div class="feed"></div>', { x: 610, y: 120, w: 410, h: 880, fx: 'right', at: .1, dur: .6 });
    const feed = ph.querySelector('.feed');
    [0, 1, 2, 3, 4, 5, 6, 7].forEach(i => { const d = el('div', i === 3 ? '' : 'plain', i === 3 ? '' : plainPost(false));
      if (i === 3) { const im = el('img'); im.src = AD('glassCard-ca03-35'); d.appendChild(im); }
      if (i % 3 === 1 && i !== 3) d.style.filter = 'hue-rotate(160deg) saturate(.7)';
      if (i % 3 === 2 && i !== 3) d.style.filter = 'hue-rotate(60deg) brightness(1.15)';
      feed.appendChild(d); });
    const hero = feed.children[3];
    b.fn(t => { const p = pr(t, 1.7, .5); hero.style.outline = p > 0 ? `${Math.round(7 * eo(p))}px solid ${C.blue}` : 'none'; hero.style.transform = `scale(${1 + .06 * eo(p)})`; hero.style.zIndex = 3; });
    b.tap(918, 470, 2.3);
    b.text('Facebook Marketplace, OfferUp, Instagram, Craigslist.', { x: 60, y: 800, w: 500, size: 34, cls: 'body', at: 2.6 });

    const c = new Scene(4.3, C.paper);
    c.text('Graphics Studio\n[[makes that ad.]]', { x: 60, y: 140, w: 960, size: 72, at: .1 });
    ['Pick a design', 'Type your number', 'Post it'].forEach((w, i) =>
      c.box(`<div class="row" style="height:100%"><div class="num">${i + 1}</div><b>${w}</b></div>`, { x: 70, y: 420 + i * 190, w: 940, h: 150, fx: 'left', at: .7 + i * .45 }));

    const d = new Scene(4.6, C.blue);
    ['glassCard-ca03-35', 'ticketStub-ca07-20', 'checklistHero-cd04-15', 'bubblePop-ca07-15', 'glassCard-cd10-30', 'neonNight-ck03-20'].forEach((n, i) =>
      d.img(AD(n), { x: 60 + (i % 3) * 330, y: 120 + Math.floor(i / 3) * 330, w: 300, h: 300, rot: [-3, 2, -2, 3, -2, 2][i], fx: 'pop', at: .12 + i * .16, cls: 'lit' }));
    d.text(`{{${FACTS.designs} designs.}} Ready now.`, { x: 60, y: 800, w: 960, size: 64, at: 1.3, color: '#fff' });
    d.text(`Phones, gold, cars, cards and more: ${FACTS.categories} things you buy.`, { x: 60, y: 900, w: 960, size: 36, cls: 'body', at: 1.7, color: '#fff' });
    return [a, b, c, d, endCard('Free to start.')];
  });

  /* ── 2. How to make an ad ─────────────────────────────────────────────── */
  define('how-to-make-an-ad', { title: 'How to make an ad: three steps, about a minute', music: 'sheridan_square', poster: 11.6 }, () => {
    const a = new Scene(2.7, C.gold);
    a.text('Your first ad\ntakes about\n{{a minute.}}', { x: 70, y: 340, w: 940, size: 92, at: .12 });

    const b = new Scene(5, C.paper);
    b.chip('STEP 1', { x: 60, y: 130, bg: C.gold, fx: 'left', at: .1 });
    b.text('Pick a look', { x: 60, y: 215, w: 960, size: 88, at: .2 });
    const strip = b.img(SHOT('step1-strip'), { x: 60, y: 420, w: 1623, h: 300, fx: 'right', at: .45, dur: .6, cls: 'top' });
    b.fn(t => { strip.style.left = (60 - eo(pr(t, 1.1, 3.4)) * 560) + 'px'; });
    b.tap(430, 560, 3.5);
    b.text(`${FACTS.designs} designs, for ${FACTS.categories} things you buy.`, { x: 60, y: 800, w: 960, size: 42, cls: 'body', at: 1.2 });
    b.text('Tap the one that looks like your shop.', { x: 60, y: 870, w: 960, size: 42, cls: 'body', at: 1.6 });

    const c = new Scene(5.6, C.paper);
    c.chip('STEP 2', { x: 60, y: 130, bg: C.gold, fx: 'left', at: .1 });
    c.text('Type your number', { x: 60, y: 215, w: 960, size: 80, at: .2 });
    [c.img(SHOT('step2-empty'), { x: 90, y: 390, w: 900, h: 215, at: .5, out: 2.0 }),
     c.img(SHOT('step2-typed'), { x: 90, y: 390, w: 900, h: 215, fx: 'fade', at: 1.9, dur: .25 })]
      .forEach(n => { n.firstChild.style.cssText = 'width:150%;height:auto;margin-top:-34px'; });
    c.img(SHOT('ad-theme-2'), { x: 90, y: 655, w: 350, h: 350, rot: -2, fx: 'pop', at: 2.7 });
    c.text('It lands on the ad, big enough to read in a feed.', { x: 500, y: 675, w: 500, size: 42, cls: 'body', at: 3.1 });
    c.text('Saved once. Every design fills itself in.', { x: 500, y: 850, w: 500, size: 34, cls: 'body', at: 3.7, color: '#3b3833' });

    const d = new Scene(5, C.ink);
    d.text('One tap changes\n[[every colour.]]', { x: 60, y: 130, w: 960, size: 70, at: .12 });
    const sw = ['ad-theme-2', 'ad-theme-3', 'ad-theme-4'].map((n, i) => d.img(SHOT(n), { x: 270, y: 350, w: 540, h: 540, fx: 'none', at: .5 + i * 1.35 }));
    d.fn(t => sw.forEach((n, i) => { const p = pr(t, .5 + i * 1.35, .22); n.style.transform = `scale(${.94 + .06 * eo(p)})`; }));
    d.chip(`${FACTS.colourSets} colour sets, each one checked`, { x: 250, y: 935, bg: C.gold, fx: 'pop', at: 1.2 });

    const e = new Scene(5.2, C.paper);
    e.chip('STEP 3', { x: 60, y: 130, bg: C.gold, fx: 'left', at: .1 });
    e.text('Download', { x: 60, y: 215, w: 960, size: 88, at: .2 });
    e.img(SHOT('step3-buttons'), { x: 60, y: 400, w: 540, h: 320, at: .5, cls: 'top' });
    e.tap(330, 615, 1.9);
    e.img(SHOT('ad-theme-3'), { x: 650, y: 400, w: 170, h: 170, fx: 'pop', at: 2.3 });
    e.img(SHOT('ad-story'), { x: 840, y: 400, w: 180, h: 320, fx: 'pop', at: 2.7 });
    e.text(`${FACTS.sizes} sizes: square post, story, flyer, wide.`, { x: 60, y: 810, w: 960, size: 42, cls: 'body', at: 3.1 });
    e.text('Straight to your phone or computer.', { x: 60, y: 880, w: 960, size: 42, cls: 'body', at: 3.5 });

    const f = new Scene(5, C.blue);
    f.text('Want it moving?\n{{Create video.}}', { x: 60, y: 130, w: 960, size: 70, at: .12, color: '#fff' });
    f.img(SHOT('video-popup'), { x: 235, y: 350, w: 610, h: 540, fx: 'pop', at: .6, cls: 'lit top' });
    f.chip(`A ${FACTS.videoSeconds}-second video from any design`, { x: 235, y: 935, bg: C.gold, fx: 'pop', at: 1.6 });
    return [a, b, c, d, e, f, endCard('Make yours.')];
  });

  /* ── 3. Look like the real business ───────────────────────────────────── */
  define('look-professional', { title: 'Look like the real business in the feed', music: 'aero_groove', poster: 7.2 }, () => {
    const a = new Scene(3.3, C.ink);
    a.text('In a feed,\nyour ad is\n[[this big.]]', { x: 70, y: 250, w: 700, size: 96, at: .12 });
    a.img(AD('bandKnockout-ck07-35'), { x: 800, y: 590, w: 170, h: 170, rot: 5, fx: 'pop', at: 1.2 });

    const b = new Scene(6.2, C.paper);
    b.text('Same offer.', { x: 60, y: 125, w: 960, size: 76, at: .1 });
    b.node('card plain', plainPost(true), { x: 60, y: 300, w: 450, h: 450, rot: -2, fx: 'left', at: .5 });
    b.img(AD('bandKnockout-ck07-35'), { x: 570, y: 300, w: 450, h: 450, rot: 2, fx: 'right', at: 1.3 });
    b.chip('Typed over a photo', { x: 95, y: 770, fx: 'pop', at: 1.0 });
    b.chip('Made here', { x: 690, y: 770, bg: C.mint, color: '#fff', fx: 'pop', at: 1.8 });
    b.text('Which one gets [[the text?]]', { x: 60, y: 890, w: 960, size: 60, at: 3.0 });

    const c = new Scene(6.6, C.paper);
    c.text('Built to be [[read.]]', { x: 60, y: 125, w: 960, size: 76, at: .1 });
    c.img(AD('glassCard-ca03-35'), { x: 60, y: 290, w: 540, h: 540, rot: -1.5, fx: 'pop', at: .4 });
    ['A number you can read in a tiny preview', 'Every line checked for contrast', 'One clear offer, in real type'].forEach((w, i) =>
      c.box(`<div class="row" style="height:100%;padding:0 26px"><span>${w}</span></div>`, { x: 650, y: 300 + i * 185, w: 370, h: 150, fx: 'right', at: 1.3 + i * .9 }));
    c.text('Checked before you ever see the design.', { x: 60, y: 900, w: 960, size: 40, cls: 'body', at: 4.2 });

    const d = new Scene(4.2, C.gold);
    d.text('Sellers hand\ntheir phone to\nwhoever looks\n{{legit.}}', { x: 70, y: 250, w: 940, size: 92, at: .12 });
    return [a, b, c, d, endCard('Look like\nthe real business.')];
  });

  /* ── 4. AI versus ready-made ──────────────────────────────────────────── */
  define('ai-vs-ready-made', { title: 'Asking an AI for your ad, or picking one that is ready', music: 'sheridan_square', poster: 14.2 }, () => {
    const a = new Scene(3.8, C.ink);
    a.chip('THE AI WAY', { x: 60, y: 130, bg: C.tomato, color: '#fff', fx: 'left', at: .1 });
    const typed = 'we buy iphones ad, my number 310 555 0142';
    const pb = a.box('<div class="t mono" style="font-size:31px;padding:44px 34px;white-space:nowrap"></div>', { x: 60, y: 250, w: 960, h: 140, at: .25 });
    a.fn(t => { const n = Math.floor(clamp((t - .6) / 1.9) * typed.length); pb.firstChild.textContent = typed.slice(0, n) + (Math.floor(t * 3) % 2 ? '▍' : ''); });
    a.text('You could ask an AI\nfor your ad.', { x: 60, y: 520, w: 960, size: 70, at: 1.2 });

    const b = new Scene(6.6, C.ink);
    b.text('Describe it. Wait.\nCheck every digit.\n[[Try again.]]', { x: 60, y: 125, w: 960, size: 64, at: .1 });
    [0, 1, 2, 3].forEach(i => { const n = b.node('shim', `Try ${i + 1}<div class="badge">↻</div>`, { x: 60 + i * 246, y: 480, w: 222, h: 222, fx: 'pop', at: 1.0 + i * .85 });
      const bd = n.querySelector('.badge'); b.fn(t => { const p = pr(t, 1.55 + i * .85, .3); bd.style.transform = `scale(${EX.back(p)}) rotate(${t * 140}deg)`; bd.style.opacity = p > 0 ? 1 : 0; }); });
    b.chip('Paid per try', { x: 60, y: 770, bg: C.tomato, color: '#fff', fx: 'pop', at: 4.3 });
    b.chip('Then resize it for every app', { x: 330, y: 770, fx: 'pop', at: 4.8 });
    b.text('And the number still has to be right.', { x: 60, y: 890, w: 960, size: 40, cls: 'body', at: 5.2, color: C.paper });

    const c = new Scene(4.4, C.paper);
    c.text('Or skip\n[[the guessing.]]', { x: 60, y: 130, w: 960, size: 88, at: .1 });
    ['scriptRetro-ck03-15', 'glassCard-ca03-35', 'bandKnockout-ck07-35'].forEach((n, i) =>
      c.img(AD(n), { x: 80 + i * 310, y: 440 + (i === 1 ? -20 : 0), w: 300, h: 300, rot: [-5, 0, 5][i], fx: 'pop', at: .8 + i * .14 }));
    c.chip(`${FACTS.designs} designs, already made`, { x: 250, y: 830, bg: C.gold, fx: 'pop', at: 1.6 });
    c.text(`${FACTS.colourSets} colour sets. Thousands of looks.`, { x: 60, y: 930, w: 960, size: 40, cls: 'body', align: 'center', at: 2.0 });

    const d = new Scene(5, C.paper);
    d.text('Your number is\n[[typed, not guessed.]]', { x: 60, y: 130, w: 960, size: 70, at: .1 });
    const num = '(310) 555-0142';
    const nb = d.box('<div class="t" style="font-size:84px;line-height:220px;text-align:center"></div>', { x: 70, y: 380, w: 940, h: 220, at: .5 });
    d.fn(t => { nb.firstChild.textContent = num.slice(0, Math.floor(clamp((t - 1.0) / 1.5) * num.length)) || ' '; });
    d.text('Real type. Spelled right in every size, every time.', { x: 70, y: 660, w: 940, size: 40, cls: 'body', at: 2.7 });
    d.chip('Checked before you see it', { x: 70, y: 800, bg: C.mint, color: '#fff', fx: 'pop', at: 3.2 });

    const e = new Scene(4.6, C.blue);
    e.text('We use AI too:\n{{for backgrounds.}}', { x: 60, y: 130, w: 960, size: 70, at: .1, color: '#fff' });
    e.text('It can draw the scene behind your ad. It never writes your words or your number.', { x: 60, y: 400, w: 940, size: 46, cls: 'body', at: 1.0, color: '#fff' });
    e.chip('AI: the background', { x: 60, y: 720, fx: 'pop', at: 2.0 });
    e.chip('You: the words', { x: 440, y: 720, bg: C.gold, fx: 'pop', at: 2.4 });

    const f = new Scene(5, C.paper);
    f.text('Side by side.', { x: 60, y: 125, w: 960, size: 76, at: .1 });
    f.box('<div class="col"><h4>Asking an AI</h4><p>Pay per try</p><p>Check every digit</p><p>Resize for each app</p></div>', { x: 60, y: 290, w: 460, h: 350, fx: 'left', at: .5 });
    f.box(`<div class="col good"><h4>Graphics Studio</h4><p>${FACTS.starter.downloads} ads for $${FACTS.starter.month}</p><p>Number typed once</p><p>${FACTS.sizes} sizes built in</p></div>`, { x: 560, y: 290, w: 460, h: 350, fx: 'right', at: 1.1 });
    f.text('One is trial and error.\nOne is [[ready.]]', { x: 60, y: 730, w: 960, size: 72, at: 2.4 });
    return [a, b, c, d, e, f, endCard('Dialed in.\nReady now.')];
  });

  /* ── 5. The price ─────────────────────────────────────────────────────── */
  define('the-math', { title: 'What it costs, and why it pays for itself', music: 'small_note_boogaloo', poster: 8.4 }, () => {
    const a = new Scene(3.4, C.gold);
    a.text('One phone bought\nfrom one ad can\npay for {{months.}}', { x: 70, y: 330, w: 940, size: 84, at: .12 });

    const b = new Scene(7.4, C.paper);
    b.text('Do the math.', { x: 60, y: 125, w: 960, size: 80, at: .1 });
    [['Free', '$0', `${FACTS.free.weekly} ads a week`, ''],
     ['Starter', `$${FACTS.starter.month}/mo`, `${FACTS.starter.downloads} ads`, `${FACTS.starter.each} an ad`],
     ['Pro', `$${FACTS.pro.month}/mo`, `${FACTS.pro.downloads} ads, video too`, `${FACTS.pro.each} an ad`]].forEach((r, i) =>
      b.box(`<div class="row" style="height:100%"><b style="width:230px">${r[0]}</b><b style="width:250px;color:${C.blue}">${r[1]}</b><span>${r[2]}${r[3] ? `<br><mark>${r[3]}</mark>` : ''}</span></div>`,
        { x: 60, y: 290 + i * 190, w: 960, h: 160, fx: 'left', at: .7 + i * 1.1 }));
    b.text(`Business: $${FACTS.business.month} a month, unlimited.`, { x: 60, y: 880, w: 960, size: 40, cls: 'body', at: 4.4 });
    b.text('Yearly: two months free.', { x: 60, y: 945, w: 960, size: 40, cls: 'body', at: 4.9 });

    const c = new Scene(4.2, C.ink);
    c.text('No contract.\nCancel any time.\nDesign free,\n[[no account.]]', { x: 70, y: 260, w: 940, size: 84, at: .12 });
    return [a, b, c, endCard('It pays for itself.')];
  });
})();
