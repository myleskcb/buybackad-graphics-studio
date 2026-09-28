/* ═══════════════════════════════════════════════════════════════════════════
   GRAPHICS STUDIO — design flags

   One registry for every design decision the engine makes for you, so each
   one can be switched off, forced, or compared, without editing app.js.

   Loaded by index.html BEFORE app.js (the passes read the flags as they run)
   and by console.html (which edits them). Both pages are same-origin, so a
   flag set in the console is what the studio boots with on its next load.

   Storage: localStorage key `pgfx_flags`, a JSON object of ONLY the flags
   that differ from their default. Nothing stored = the shipped product.
   A `?flags=id:0,id:1,styleForce:wash` query string overrides storage for
   that one load, which is how a share-link reproduces a configuration.

   Why this file and not a block in app.js: app.js is 8k lines whose passes
   run in a fixed order at the END of the file, and its own docs warn that
   splicing it has already deleted a pass once (DESIGN-LAW rule 42). The
   registry lives here; app.js only asks `pgfxFlag(id)` at each call site.
   If this file fails to load, pgfxFlag is undefined and app.js falls back to
   "everything on", which is the shipped behaviour.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var STORE_KEY = 'pgfx_flags';

  /* Every entry: id (what app.js asks for), group, label, what it does, the
     DESIGN-LAW rule it enforces (so the console can say why it exists), and
     its default. `type:'choice'` entries carry `options`; everything else is
     a boolean. Order here is the order the console shows, which for the
     template chain is also the order the passes run in. */
  var REGISTRY = [
    /* ── Build-time, inside the designer library closure ─────────────── */
    { id:'tameAccents', group:'build', label:'Deepen neon accents',
      desc:'Any palette accent that is both very saturated and very light is deepened before a single template is built. Off = the original lime / cyan / mint.',
      rule:'8', def:true },
    { id:'houseType', group:'build', label:'House type law',
      desc:'Strips coloured glows, hard sticker shadows and hue-jumping gradient type from the clean family, and gives every hero one neutral separating shadow. Street-family templates skip this either way.',
      rule:'1–5, 13', def:true },
    { id:'applyColourFix', group:'build', label:'Money-word colour fix',
      desc:'Recolours the four money words the hue-gap audit flagged as discordant, from the reference hue vocabulary.',
      rule:'14', def:true },

    /* ── The template pass chain, in run order ───────────────────────── */
    { id:'completeTemplate', group:'chain', label:'Complete template',
      desc:'Fills in a backdrop photo from the category pool, the phone layer and anything else a layout left implicit. Off = many templates lose their photograph. Turn off only to see the authored skeleton.',
      rule:'24, 38', def:true },
    { id:'applyCategoryMarks', group:'chain', label:'Category marks',
      desc:'Adds the category icon from the shared icon set.',
      rule:'17', def:true },
    { id:'applyBrandVocab', group:'chain', label:'Brand vocabulary',
      desc:'Rewrites generic copy to the buyback vocabulary and puts the product name on the ad.',
      rule:'24', def:true },
    { id:'enforceTypeWeight', group:'chain', label:'Type weight floor',
      desc:'Never sets a weight that has no font file; lifts thin display type to a weight that exists.',
      rule:'20', def:true },
    { id:'enforcePlateSolidity', group:'chain', label:'Opaque plates',
      desc:'A plate carrying dark ink is made opaque.',
      rule:'21', def:true },
    { id:'enforceInkOnPlate', group:'chain', label:'Ink follows plate',
      desc:'Chooses light or dark ink from the plate’s rendered luminance, not from the palette.',
      rule:'21, 31', def:true },
    { id:'stackBulletRuns', group:'chain', label:'Stack selling points',
      desc:'Selling points stack vertically instead of running across a line.',
      rule:'15', def:true },
    { id:'addProductCutout', group:'chain', label:'Product cutouts',
      desc:'Places a product cutout (phones, gold, cash…) on templates that have room. Which cutout is chosen by hashing the template id.',
      rule:'24', def:true },
    { id:'assignStyle', group:'chain', label:'Assign style family',
      desc:'Splits the library into photo / duotone / wash by hashing the template id, then grades the photograph. Use the "Force style" choice below to override the split.',
      rule:'48', def:true },
    { id:'styleForce', group:'chain', label:'Force style', type:'choice',
      options:[['mix','Hashed mix (shipped)'],['photo','All photo'],['duotone','All duotone'],['wash','All wash']],
      desc:'Instead of the hashed split, give every template the same style family. Only applies while "Assign style family" is on.',
      rule:'48', def:'mix' },
    { id:'colourTheory', group:'chain', label:'Colour theory',
      desc:'Money word takes the category hue (OKLCH), one small element takes its split-complement.',
      rule:'32, 40, 41', def:true },
    { id:'displayFaceFix', group:'chain', label:'Display faces only',
      desc:'Headlines may only use display faces; Satoshi is banned from headlines.',
      rule:'9', def:true },
    { id:'enrichFills', group:'chain', label:'Enrich fills',
      desc:'Gradient washes on flat fills, within one hue.',
      rule:'5', def:true },
    { id:'opticalTracking', group:'chain', label:'Optical tracking',
      desc:'Tightens huge type, opens small type.',
      rule:'30', def:true },
    { id:'normaliseBackdrop', group:'chain', label:'Normalise backdrop',
      desc:'Scrim compensates per palette for backdrop brightness.',
      rule:'11', def:true },
    { id:'inkVsWash', group:'chain', label:'Ink vs wash',
      desc:'Contrast repair that preserves hue: moves ink toward white or black only until it clears the target.',
      rule:'23, 31', def:true },
    { id:'highlightBudget', group:'chain', label:'Highlight budget',
      desc:'Makes the phone number readable: brightens the plate behind it or darkens the ink, judged glyph-masked against the real ground.',
      rule:'45, 46', def:true },
    { id:'bodyPanel', group:'chain', label:'Body panel',
      desc:'Dark-tinted frosted panel behind body copy that sits on a photograph.',
      rule:'10, 47', def:true },
    { id:'warmTheWhites', group:'chain', label:'Warm the whites',
      desc:'Last word on colour: pure-white type on a photograph is tinted to the category off-white.',
      rule:'12', def:true },

    /* ── Studio UI ───────────────────────────────────────────────────── */
    { id:'easyColorThemes', group:'ui', label:'Easy Mode colour themes',
      desc:'The row of ten "suggested colour themes" in Easy Mode. They are exact complements with neon accents, which rules 8 and 41 forbid for the library itself; see OPEN-QUESTIONS.md.',
      rule:'—', def:true },
    { id:'cssFallback', group:'ui', label:'CSS fallback injection',
      desc:'If the stylesheet did not apply, re-inject the embedded copy of styles.css from app.js. Off = trust the <link> alone.',
      rule:'49', def:true },
  ];

  var byId = {};
  REGISTRY.forEach(function (f) { byId[f.id] = f; });

  function readStore() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      var o = raw ? JSON.parse(raw) : {};
      return (o && typeof o === 'object') ? o : {};
    } catch (e) { return {}; }
  }
  function writeStore(o) {
    try {
      var keys = Object.keys(o);
      if (!keys.length) localStorage.removeItem(STORE_KEY);
      else localStorage.setItem(STORE_KEY, JSON.stringify(o));
    } catch (e) {}
  }
  function coerce(f, v) {
    if (f.type === 'choice') {
      var ok = f.options.some(function (o) { return o[0] === String(v); });
      return ok ? String(v) : f.def;
    }
    if (v === true || v === 1 || v === '1' || v === 'true' || v === 'on') return true;
    if (v === false || v === 0 || v === '0' || v === 'false' || v === 'off') return false;
    return f.def;
  }
  /* ?flags=a:0,b:1,styleForce:wash — one-load override, never written. */
  function readQuery() {
    var out = {};
    try {
      var q = new URLSearchParams(location.search).get('flags');
      if (!q) return out;
      q.split(',').forEach(function (pair) {
        var i = pair.indexOf(':');
        if (i < 0) return;
        var id = pair.slice(0, i).trim(), v = pair.slice(i + 1).trim();
        if (byId[id]) out[id] = coerce(byId[id], v);
      });
    } catch (e) {}
    return out;
  }

  var stored = readStore();
  var query = readQuery();

  function get(id) {
    var f = byId[id];
    if (!f) return true;                      // unknown flag: never gate anything
    if (id in query) return query[id];
    if (id in stored) return coerce(f, stored[id]);
    return f.def;
  }
  function set(id, v) {
    var f = byId[id]; if (!f) return;
    var o = readStore();
    var cv = coerce(f, v);
    if (cv === f.def) delete o[id]; else o[id] = cv;
    writeStore(o);
    stored = o;
  }
  function reset() { writeStore({}); stored = {}; }
  function all() {
    var o = {};
    REGISTRY.forEach(function (f) { o[f.id] = get(f.id); });
    return o;
  }
  function overrides() {
    var o = {};
    REGISTRY.forEach(function (f) { var v = get(f.id); if (v !== f.def) o[f.id] = v; });
    return o;
  }
  /* The share-link form of the current overrides, for ?flags= */
  function toQuery() {
    var o = overrides();
    return Object.keys(o).map(function (k) {
      var v = o[k]; return k + ':' + (v === true ? 1 : v === false ? 0 : v);
    }).join(',');
  }

  /* Run log. app.js pushes {id, ran, ms, touched} per pass so the console can
     show what actually executed on the last boot, not what was configured. */
  var LOG = [];

  window.PGFX_FLAGS = {
    registry: REGISTRY, get: get, set: set, reset: reset, all: all,
    overrides: overrides, toQuery: toQuery, log: LOG, storeKey: STORE_KEY,
    fromQuery: Object.keys(query).length > 0,
  };
  window.pgfxFlag = get;
})();
