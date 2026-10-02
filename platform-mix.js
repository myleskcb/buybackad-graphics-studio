/* THE PLATFORM'S MIX — what the landing shows, and in what proportion.
 *
 * Owner, 2026-10-02, over a "WE BUY CARDS" card and a "WE BUY HONDAS"
 * motorcycle near the top of the landing: "basketball cards seem like a little
 * niche", "I was thinking more popular themes, especially on the homepage",
 * and then the ruling this file is:
 *
 *   "The platform should be at least 50% Apple devices 30% iPhone 10% Mac 10%
 *    iPad and then the remaining should be split between consoles, VR,
 *    Samsung, Pixel phones, gold, coins, Pokémon cards, bullion, cars, then
 *    other trading cards", "then bikes".
 *
 * So two halves of fifty. Apple: iPhone 30, Mac 10, iPad 10. Everything else:
 * the nine named lines at 5 each, then other trading cards at 3 and bikes at
 * 2, in the owner's order (ties go to the earlier line, so a short list shows
 * consoles before cars). A line the owner did not name (test strips, silver
 * flatware, watches, audio, cameras...) is still in the library and behind
 * its chip; it is never weighted and comes after every weighted card.
 *
 * The order is drawn with SMOOTH WEIGHTED ROUND ROBIN, twice: first which half
 * (Apple or the rest), then which line within it. That keeps the shares true
 * for ANY prefix of the list — the first page of sixteen, the eighteen cards
 * on the wall, the hundred after three "show more"s — not only for the whole
 * library. A line that runs out hands its share to the others IN ITS OWN HALF,
 * so Apple stays at half for as long as there is an Apple card left, which is
 * the "at least" in the ruling.
 *
 * What a card IS comes from `subject`: stamped on each showcase card by
 * scripts/tag_subjects.mjs (read off its headline and picture), and read here
 * off an offer card's buying line and its product picture. Change the table,
 * not the code; scripts/mix_check.mjs holds the shares to it.
 */
(function (root){
  const HALVES = [
    { key:'apple', share:50, lines:[
      { key:'iphone',  label:'iPhone',              share:30 },
      { key:'mac',     label:'Mac',                 share:10 },
      { key:'ipad',    label:'iPad',                share:10 },
    ] },
    { key:'rest', share:50, lines:[
      { key:'console', label:'Consoles',            share:5 },
      { key:'vr',      label:'VR headsets',         share:5 },
      { key:'samsung', label:'Samsung',             share:5 },
      { key:'pixel',   label:'Google Pixel',        share:5 },
      { key:'gold',    label:'Gold',                share:5 },
      { key:'coins',   label:'Coins',               share:5 },
      { key:'pokemon', label:'Pokémon cards',       share:5 },
      { key:'bullion', label:'Bullion',             share:5 },
      { key:'cars',    label:'Cars',                share:5 },
      { key:'cards',   label:'Other trading cards', share:3 },
      { key:'bikes',   label:'Bikes',               share:2 },
    ] },
  ];
  const LINE_OF = {};
  HALVES.forEach(h => h.lines.forEach(l => { LINE_OF[l.key] = { half:h.key, share:l.share, label:l.label }; }));

  /* offer-library.js buying line -> subject. Foldables, Android tablets,
     controllers, gaming PCs and the rest are real lines the owner did not
     name, so they stay unweighted. */
  const OFFER_LINE = { iphone:'iphone', mac:'mac', ipad:'ipad', console:'console', switch:'console', vr:'vr',
    galaxy:'samsung', pixel:'pixel', gold:'gold', coins:'coins', pokemon:'pokemon', car:'cars', sports:'cards' };
  function templateSubject(t){
    if (!t) return null;
    const pics = (t.layers || []).filter(l => l && l.props && l.props.src)
      .map(l => String(l.props.src).split('/').pop().toLowerCase());
    if (t.line === 'silver') return pics.some(p => /silver-(?:bars?|coins?|rounds?)/.test(p)) ? 'bullion' : 'silver';
    if (t.line === 'gold' && pics.some(p => /gold-bars?/.test(p))) return 'bullion';
    return OFFER_LINE[t.line] || t.line || t.cat || null;
  }
  function weighted(subject){ return Object.prototype.hasOwnProperty.call(LINE_OF, subject); }

  /* one step of smooth weighted round robin over the entries that still have
     something to give: every live entry earns its share, the richest is paid
     out and gives back the whole pot. Ties go to the earlier entry. */
  function srr(entries, credit){
    let best = -1, pot = 0;
    entries.forEach((e, i) => {
      if (!e.left()) return;
      credit[i] = (credit[i] || 0) + e.share; pot += e.share;
      if (best < 0 || credit[i] > credit[best]) best = i;
    });
    if (best >= 0) credit[best] -= pot;
    return best;
  }

  /* order(items, subjectOf, limit): items ranked best-first; returns them
     re-ordered to the mix. Within a line the incoming order is kept, so the
     caller's own ranking (unlocked first, strongest first) still decides
     which iPhone card leads. Unweighted items follow, in their own order. */
  function order(items, subjectOf, limit){
    const queues = {}, extra = [];
    items.forEach(it => {
      const s = subjectOf(it);
      if (weighted(s)) (queues[s] = queues[s] || []).push(it); else extra.push(it);
    });
    const halves = HALVES.map(h => ({
      share: h.share,
      lines: h.lines.map(l => ({ key:l.key, share:l.share, left:() => (queues[l.key] || []).length > 0 })),
      credit: [],
    }));
    halves.forEach(h => { h.left = () => h.lines.some(l => l.left()); });
    const hCredit = [], out = [];
    const max = typeof limit === 'number' ? limit : Infinity;
    while (out.length < max){
      const hi = srr(halves, hCredit);
      if (hi < 0) break;
      const h = halves[hi], li = srr(h.lines, h.credit);
      out.push(queues[h.lines[li].key].shift());
    }
    return out.length < max ? out.concat(extra).slice(0, max) : out;
  }

  /* what share each subject actually got in a list, for the checks */
  function shares(list, subjectOf){
    const n = list.length || 1, by = {}, half = {};
    list.forEach(it => {
      const s = subjectOf(it), w = weighted(s);
      by[s] = (by[s] || 0) + 1;
      const hk = w ? LINE_OF[s].half : 'unweighted';
      half[hk] = (half[hk] || 0) + 1;
    });
    Object.keys(by).forEach(k => { by[k] = by[k] / n; });
    Object.keys(half).forEach(k => { half[k] = half[k] / n; });
    return { by, half };
  }

  const api = { HALVES, LINE_OF, OFFER_LINE, templateSubject, weighted, order, shares };
  root.PLATFORM_MIX = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
