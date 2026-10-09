/**
 * AI backgrounds, the customer generator: the recipe, the entities, the
 * credits. Mounted by netlify/functions/api.mjs.
 *
 * Owner, 2026-10-08: "make sure we can configure this fully and we use our
 * fal.ai site with all of our iPhones as entities so you can configure which
 * devices you want, or you pick a category … it standardizes with our own sub
 * prompt / negative prompt so it doesn't steer off topic, but that is not
 * outwardly displayed. It is internally kept and kept a secret. You just put in
 * what you want, and those keywords will be arranged into our prompt with the
 * entities they selected." Then: "and styles, color schemes … configurable and
 * accurate so what you put in is what comes out, and you can choose an amount
 * of generations, and it'll show your credits at the bottom, live, so you can
 * see a cost per generation", and "tokens or credits".
 *
 *   GET  /api/bggen/config          the choices (styles, colour schemes,
 *                                   formats, text space), the price and the
 *                                   signed-in account's balance. Labels only:
 *                                   no prompt text ever leaves this file.
 *   POST /api/generate-bg           a run. { text, category, entities[],
 *                                   style, palette, colors[], aspect, space,
 *                                   count }. Without `count` (the older
 *                                   callers) one image, inline.
 *   GET  /api/admin/bggen-recipe    operator: the recipe (defaults, override,
 *   POST /api/admin/bggen-recipe    effective) and saving an override. Live in
 *                                   about a minute, no deploy.
 *   POST /api/admin/bggen-preview   operator: the exact prompt a request would
 *                                   send, without generating.
 *   POST /api/admin/bggen-grant     operator: credits for an account, added
 *                                   to its bought credits (they never expire).
 *   GET  /api/bggen/img/<id>        a generated picture, by its unguessable id.
 *
 * Entities are <group>:<id>[@finish] from assets/bggen-entities.json
 * (scripts/bggen_entities.py): the shop's own approved photographs. Picked,
 * each goes to the model as a reference image (fal Seedream edit, or Gemini
 * with the image inline), so the iPhone in the scene is the iPhone in the
 * photo. A named subject with no photograph rides in the prompt by name.
 *
 * The prompt is built here from the recipe and is never returned to a
 * customer. The customer's own words are reduced to keywords and moderated
 * before they join it.
 *
 * Credits are the plans' (netlify/lib/plans.mjs, one table for the whole
 * product): an image costs what its model costs us, in credits, the dearest
 * model in the fallback chain setting the price; the month's plan credits go
 * first, then bought ones. A run of N images is ONE request: it takes N
 * images' credits in one write, generates the N in parallel, and gives back
 * the failures' credits in one more (the ledger is on the account record, so
 * N requests in parallel could overwrite each other). The pictures go to a
 * blob store and come back as links, so four large images never meet the
 * function's 6 MB answer limit. Operators are not charged.
 *
 * Configuration, each layer over the one before:
 *   1. the defaults below
 *   2. env: AI_MAX_PER_RUN (images one Generate may ask for, 1 to 8),
 *      PGFX_BG_PROVIDER (fal | gemini),
 *      PGFX_FAL_TEXT_MODEL, PGFX_FAL_EDIT_MODEL, PGFX_BG_MODEL (Gemini),
 *      PGFX_HOUSE_FRAME and PGFX_CATEGORY_ANCHORS (the older two, still read)
 *   3. the operator's override, saved from the AI Studio (blob recipe/v1)
 */

import { creditState, spendCredits, refundCredits, creditsFor, modelCosts, planId } from './plans.mjs';

export const CATALOGUE_PATH = '/assets/bggen-entities.json';
const MAX_ENTITIES = 4;
const RECIPE_KEY = 'recipe/v1';

// ---------- the recipe (secret: never sent to a customer) ----------
const DEFAULTS = {
  /* {lead}. {subject}{anchor}. {look}. {palette}{composition}. {quality}. Avoid: {negative}
     PGFX_HOUSE_FRAME, when set, replaces the template; it may use any of these */
  template: '{lead}. {subject}{anchor}. {look}. {palette}{composition}. {quality}.',
  quality: 'Sharp focus on the subject, realistic materials, true-to-life colour and reflections, believable professional photograph',
  // every image; a term the customer's own products need (hands, for "hand offering cash") is dropped for that image
  negative: ['text', 'letters', 'words', 'numbers', 'captions', 'watermark', 'signature', 'added logos or brand marks', 'price tags',
    'people', 'faces', 'hands', 'body parts', 'extra or duplicated products', 'warped or melted product edges', 'distorted proportions',
    'cartoon', 'illustration', 'CGI render look', 'plastic look', 'oversaturated colour', 'heavy HDR', 'dark muddy exposure',
    'cluttered composition', 'blurry subject', 'low resolution', 'frame borders', 'collage', 'split screen'],
  refClause: 'Feature exactly the products shown in the reference images, unchanged: {list}. Reproduce every product faithfully from its reference image: identical shape, proportions, camera layout, buttons, materials, colour and finish, at a believable real-world scale, fully in frame. Never redesign, recolour, duplicate or add other products',
  categories: {
    phones:    { anchor: 'a clean, trustworthy setting for selling a phone', scene: 'a premium smartphone on a clean surface', negative: ['phone cases', 'older phone models in the background', 'tangled cables'] },
    gaming:    { anchor: 'a modern gaming setup mood', scene: 'a modern game console and controllers on a clean desk', negative: ['on-screen game footage', 'readable game titles'] },
    gold:      { anchor: 'warm gold jewelry tones', scene: 'gold jewelry on a clean surface', negative: ['costume jewelry look', 'tarnish', 'green patina'] },
    coins:     { anchor: 'antique coin collection tones', scene: 'collectible coins on a clean surface', negative: ['pocket change', 'euro coins', 'invented coin legends'] },
    pokemon:   { anchor: 'holographic card sleeve glints', scene: 'collectible trading cards on a clean surface', negative: ['readable card artwork', 'invented characters'] },
    silver:    { anchor: 'silver and cool metallic tones', scene: 'silver bullion and sterling on a clean surface', negative: ['tarnish', 'invented hallmarks'] },
    cars:      { anchor: 'automotive dusk tones', scene: 'a clean car parked in a premium setting', negative: ['license plate text', 'dealership signage', 'damaged bodywork', 'other vehicles'] },
    sports:    { anchor: 'vintage sports memorabilia tones', scene: 'sports trading cards on a clean surface', negative: ['readable card artwork', 'team logos', 'player likeness'] },
    computers: { anchor: 'a clean modern workspace mood', scene: 'a premium laptop on a clean desk', negative: ['readable screen content', 'tangled cables'] },
    audio:     { anchor: 'a calm premium audio mood', scene: 'premium wireless earbuds and headphones on a clean surface', negative: ['tangled cables'] },
    wearables: { anchor: 'a sleek modern lifestyle mood', scene: 'a premium smartwatch on a clean surface', negative: ['readable watch face text'] },
    cameras:   { anchor: 'a creative photography studio mood', scene: 'a modern camera and lenses on a clean surface', negative: ['invented brand names on the camera'] },
    strips:    { anchor: 'sealed test strip boxes and cash tones', scene: 'sealed diabetic test strip boxes on a clean counter', negative: ['readable medical labels', 'needles', 'blood'] },
  },
  // the words around an entity, by catalogue group: {label} {finish} {colour} {name}
  groups: {
    iphone: 'an Apple {label}{finish}', ipad: 'an Apple {label}{finish}', mac: 'an Apple {label}{finish}', watch: 'an Apple {label}{finish}',
    airpods: 'Apple {label}{finish}', 'apple-home': 'an Apple {label}', 'iphone-sets': '{label}',
    samsung: 'a Samsung {label}', pixel: '{label}', cars: 'a {colour} {name}', trucks: 'a {colour} {name}', bikes: 'a {colour} {name}',
    _default: '{label}',
  },
  styles: {
    auto:      { label: 'House style', emoji: '✦', lead: 'Candid real photo taken on a modern smartphone', look: 'Natural light, bright true-to-life exposure, slight handheld imperfection, subtle grain, background gently out of focus' },
    studio:    { label: 'Studio', emoji: '💡', lead: 'High-end studio product photograph', look: 'Seamless backdrop, large softbox key light with a gentle gradient falloff, crisp controlled reflections, clean shadow under the product' },
    lifestyle: { label: 'Lifestyle', emoji: '🏡', lead: 'Authentic lifestyle photograph in a real, lived-in setting', look: 'Soft natural window light, warm and inviting, shallow depth of field' },
    luxury:    { label: 'Luxury', emoji: '💎', lead: 'Luxury editorial still-life photograph', look: 'Polished stone and brushed metal surfaces, low-key light with rich specular highlights, premium and exclusive mood' },
    street:    { label: 'Street', emoji: '🏙️', lead: 'Urban street photograph', look: 'Concrete, glass and city textures, golden-hour side light, energetic but clean' },
    neon:      { label: 'Neon night', emoji: '🌃', lead: 'Night photograph lit by neon', look: 'Saturated neon glow reflecting on wet surfaces, cinematic contrast, glowing signage with no readable text' },
    minimal:   { label: 'Minimal', emoji: '◻️', lead: 'Minimalist product photograph', look: 'Clean matte surface, soft even light, generous negative space, calm and modern' },
    flatlay:   { label: 'Flat lay', emoji: '📐', lead: 'Top-down flat-lay photograph taken from directly above', look: 'Neatly arranged, soft shadowless light, clean surface' },
    cinematic: { label: 'Cinematic', emoji: '🎬', lead: 'Cinematic film still', look: 'Anamorphic look, dramatic rim light, light atmospheric haze, shallow depth of field' },
    outdoor:   { label: 'Outdoors', emoji: '☀️', lead: 'Bright outdoor daylight photograph', look: 'Clear sky, crisp sunlight, fresh natural colour' },
    holo:      { label: 'Holographic', emoji: '🪩', lead: 'Product photograph on an iridescent holographic backdrop', look: 'Opalescent gradient sheen, soft chrome reflections, Y2K product aesthetic' },
  },
  palettes: {
    auto:     { label: 'Natural', colors: [] },
    brand:    { label: 'House orange', colors: ['#1c1917', '#ff7a1a', '#fafaf9'], say: 'charcoal, vivid orange and warm white' },
    midnight: { label: 'Black & gold', colors: ['#0a0a0a', '#1f2937', '#d4af37'], say: 'deep black, graphite and metallic gold' },
    volt:     { label: 'Electric blue', colors: ['#0b1f4d', '#2563eb', '#7dd3fc'], say: 'deep navy, electric blue and ice blue' },
    gold:     { label: 'Honey gold', colors: ['#3b2a12', '#c8961e', '#f5e6c4'], say: 'deep bronze, warm honey gold and cream' },
    emerald:  { label: 'Emerald', colors: ['#064e3b', '#10b981', '#d1fae5'], say: 'deep emerald, fresh green and pale mint' },
    royal:    { label: 'Royal violet', colors: ['#2e1065', '#7c3aed', '#ddd6fe'], say: 'deep violet, royal purple and soft lavender' },
    crimson:  { label: 'Crimson', colors: ['#450a0a', '#dc2626', '#f5f5f4'], say: 'oxblood, crimson red and clean warm white' },
    ocean:    { label: 'Ocean teal', colors: ['#083344', '#0891b2', '#a5f3fc'], say: 'deep sea teal, ocean cyan and airy sky blue' },
    paper:    { label: 'Warm paper', colors: ['#7c5b3a', '#d6c4a8', '#f7f1e3'], say: 'warm tan, parchment and cream' },
    rose:     { label: 'Blush', colors: ['#831843', '#f472b6', '#fce7f3'], say: 'deep rose, blush pink and soft warm grey' },
    arctic:   { label: 'Arctic white', colors: ['#cbd5e1', '#ffffff', '#93c5fd'], say: 'bright icy white, silver grey and pale blue' },
    mono:     { label: 'Monochrome', colors: ['#111111', '#6b7280', '#f3f4f6'], say: 'black, neutral grey and white only' },
    sunset:   { label: 'Sunset', colors: ['#7c2d12', '#f97316', '#f9a8d4'], say: 'burnt orange, warm peach and dusk magenta' },
    coral:    { label: 'Terracotta', colors: ['#9a3412', '#e07a5f', '#f2cc8f'], say: 'terracotta, coral and warm sand' },
  },
  paletteClause: 'Colour palette strictly limited to {say} ({hex}): these colours dominate the backdrop, surfaces and light, with no other strong hues. ',
  aspects: {
    '1:1':  { label: 'Square', fal: { width: 2048, height: 2048 }, say: 'Square composition' },
    '4:5':  { label: 'Portrait 4:5', fal: { width: 1792, height: 2240 }, gemini: '4:5', say: 'Vertical 4:5 composition' },
    '3:4':  { label: 'Tall 3:4', fal: { width: 1728, height: 2304 }, say: 'Vertical 3:4 composition' },
    '9:16': { label: 'Story 9:16', fal: { width: 1440, height: 2560 }, say: 'Tall vertical 9:16 composition' },
    '4:3':  { label: 'Wide 4:3', fal: { width: 2304, height: 1728 }, say: 'Horizontal 4:3 composition' },
    '16:9': { label: 'Wide 16:9', fal: { width: 2560, height: 1440 }, say: 'Wide horizontal 16:9 composition' },
  },
  spaces: {
    top:    { label: 'Top', say: 'subject in the lower two thirds, the upper third calm and uncluttered for a large headline' },
    left:   { label: 'Left', say: 'subject right of centre, the left half calm and uncluttered for text' },
    right:  { label: 'Right', say: 'subject left of centre, the right half calm and uncluttered for text' },
    bottom: { label: 'Bottom', say: 'subject in the upper two thirds, the lower third calm and uncluttered for text' },
    none:   { label: 'Full frame', say: 'subject fills the frame as the hero' },
  },
  maxPerRun: 4,  // images one Generate may ask for (the price is plans.mjs's)
  models: {
    provider: '',  // '' = fal when FAL_KEY is set, else Gemini
    falText: 'fal-ai/bytedance/seedream/v4/text-to-image',
    falEdit: 'fal-ai/bytedance/seedream/v4/edit',
    negativeField: false,  // true for a fal model that takes negative_prompt; Seedream reads the Avoid clause
    gemini: 'gemini-3.1-flash-lite-image',
  },
};

// ---------- moderation + keywords (the customer's own words) ----------
const STOPWORDS = new Set(('the,and,with,for,from,that,this,have,has,are,was,were,will,would,can,could,you,your,yours,our,ours,their,them,they,his,her,hers,its,a,an,of,in,on,at,to,is,it,as,by,be,or,we,i,me,my,so,do,did,does,not,no,yes,please,make,makes,making,want,wants,need,needs,like,likes,just,get,put,show,give,really,very,some,more,most,image,picture,photo,photos,background,backgrounds,generate,create,style,styled,look,looking,type,kind,cool,nice,good,great,pretty,beautiful,text,words,word,letters,lettering,writing,written,caption,captions,says,saying,font,typography,ignore,instructions,prompt,previous,write,writes,draw,render,spell,spelled,spelling').split(','));
// One regex, whole-input AND per-token. Conservative: a blocked token is
// dropped, the rest of the request continues on the house prompt.
export const BLOCKLIST = /\b(nude|naked|nsfw|sex|sexual|porn|topless|erotic|lingerie|gore|blood|bloody|corpse|behead|kill|killing|murder|shoot|shooting|gun|guns|firearm|weapon|weapons|knife|knives|bomb|explosive|terror|terrorist|nazi|hitler|swastika|kkk|racist|slur|lynch|hate|drug|drugs|cocaine|heroin|meth|fentanyl|child|children|kid|kids|minor|minors|celebrity|kardashian|trump|biden|obama|elon|musk|swift|disney|nike|adidas|gucci|apple logo|nintendo|pokemon company|watermark|copyright|trademark)\b/i;

export function extractKeywords(text, max = 8) {
  const t = String(text || '').slice(0, 280).toLowerCase()
    .replace(/https?:\S+|[\w.+-]+@[\w-]+\.\S+|@\w+|#\w+/g, ' ') // urls, emails, handles, tags
    .replace(/[^a-z\s-]/g, ' ');
  const words = [];
  const seen = new Set();
  for (const raw of t.split(/\s+/)) {
    const w = raw.replace(/^-+|-+$/g, '');
    if (w.length < 3 || w.length > 20) continue;
    if (STOPWORDS.has(w) || seen.has(w) || BLOCKLIST.test(w)) continue;
    seen.add(w);
    words.push(w);
    if (words.length >= max) break;
  }
  return words;
}

// ---------- configuration layers ----------
const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
function merge(a, b) {
  if (!isObj(b)) return b === undefined ? a : b;
  const out = { ...(isObj(a) ? a : {}) };
  for (const [k, v] of Object.entries(b)) {
    if (v === null) delete out[k];  // an override can remove a style, a palette, a category's negative
    else out[k] = isObj(v) && isObj(out[k]) ? merge(out[k], v) : v;
  }
  return out;
}
const num = (v) => (v === undefined || v === '' || !Number.isFinite(Number(v)) ? undefined : Number(v));
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== ''));

/** the defaults with the environment applied: what an empty override gives */
export function baseRecipe(env) {
  let r = merge(DEFAULTS, {
    models: clean({ provider: env.PGFX_BG_PROVIDER, falText: env.PGFX_FAL_TEXT_MODEL, falEdit: env.PGFX_FAL_EDIT_MODEL, gemini: env.PGFX_BG_MODEL }),
  });
  if (env.PGFX_HOUSE_FRAME) r.template = env.PGFX_HOUSE_FRAME;
  if (num(env.AI_MAX_PER_RUN) !== undefined) r.maxPerRun = num(env.AI_MAX_PER_RUN);
  try {
    if (env.PGFX_CATEGORY_ANCHORS) {
      const a = JSON.parse(env.PGFX_CATEGORY_ANCHORS);
      for (const [k, v] of Object.entries(a)) r.categories[k] = { ...(r.categories[k] || {}), anchor: String(v) };
    }
  } catch (e) { /* malformed JSON → defaults */ }
  return r;
}

const RECIPE_KEYS = ['template', 'quality', 'negative', 'refClause', 'categories', 'groups', 'styles', 'palettes', 'paletteClause', 'aspects', 'spaces', 'maxPerRun', 'models'];
/** an operator's override, checked for shape before it can be saved */
export function checkOverride(o) {
  if (o === null || (isObj(o) && !Object.keys(o).length)) return null;
  if (!isObj(o)) throw new Error('The override must be a JSON object');
  if (JSON.stringify(o).length > 64000) throw new Error('The override is over 64 KB');
  for (const k of Object.keys(o)) if (!RECIPE_KEYS.includes(k)) throw new Error('Unknown recipe key: ' + k);
  if (o.negative !== undefined && !(Array.isArray(o.negative) && o.negative.every((x) => typeof x === 'string'))) throw new Error('negative must be a list of words');
  for (const k of ['template', 'quality', 'refClause', 'paletteClause']) if (o[k] !== undefined && typeof o[k] !== 'string') throw new Error(k + ' must be text');
  if (o.models) {
    for (const k of ['falText', 'falEdit']) if (o.models[k] !== undefined && !/^fal-ai\/[\w./-]+$/.test(o.models[k])) throw new Error('models.' + k + ' must be a fal-ai/… model id');
    if (o.models.provider !== undefined && !['', 'fal', 'gemini'].includes(o.models.provider)) throw new Error('models.provider is fal, gemini or empty');
  }
  if (o.maxPerRun !== undefined && !(Number.isInteger(o.maxPerRun) && o.maxPerRun >= 1 && o.maxPerRun <= 8)) throw new Error('maxPerRun is a whole number from 1 to 8');
  return o;
}

let recipeCache = null;  // { at, override }
async function loadOverride(store, fresh) {
  if (!fresh && recipeCache && Date.now() - recipeCache.at < 60000) return recipeCache.override;
  let override = null;
  try { override = JSON.parse((await store.get(RECIPE_KEY)) || 'null'); } catch (e) { override = recipeCache ? recipeCache.override : null; }
  recipeCache = { at: Date.now(), override };
  return override;
}
export async function loadRecipe(env, store, fresh) {
  return merge(baseRecipe(env), (await loadOverride(store, fresh)) || {});
}
export function resetRecipeCache() { recipeCache = null; catalogueCache = null; }

// ---------- the catalogue ----------
let catalogueCache = null;  // { at, origin, data }
async function loadCatalogue(origin, fetchJson) {
  if (catalogueCache && catalogueCache.origin === origin && Date.now() - catalogueCache.at < 600000) return catalogueCache.data;
  const data = await fetchJson(origin + CATALOGUE_PATH);
  catalogueCache = { at: Date.now(), origin, data };
  return data;
}

/** <group>:<id>[@finish] → what the prompt and the model need */
export function resolveEntities(ids, catalogue, recipe) {
  const out = [];
  const seen = new Set();
  for (const raw of Array.isArray(ids) ? ids : []) {
    const m = String(raw || '').match(/^([a-z0-9-]+):([A-Za-z0-9._-]+)(?:@([a-z0-9-]+))?$/);
    if (!m || seen.has(m[0])) continue;
    const group = catalogue.groups && catalogue.groups[m[1]];
    const it = group && group.items.find((x) => x.id === m[2]);
    if (!it) continue;
    const fin = m[3] ? (it.finishes || []).find((f) => f.id === m[3]) : (it.default_finish ? (it.finishes || []).find((f) => f.id === it.default_finish) : null);
    if (m[3] && !fin) continue;
    seen.add(m[0]);
    const label = it.label.replace(/\s*\((back|front)\)/g, '');
    const [name, colour] = label.split(' · ');
    const tpl = recipe.groups[m[1]] || recipe.groups._default || '{label}';
    const say = tpl.replace('{label}', label).replace('{name}', name || label).replace('{colour}', colour || '')
      .replace('{finish}', fin ? ' in ' + fin.label : '').replace(/\s+/g, ' ').trim();
    out.push({ id: m[0], label: it.label, say, ref: (fin && fin.ref) || it.ref || null });
    if (out.length >= MAX_ENTITIES) break;
  }
  return out;
}

// ---------- colour names for a custom palette ----------
function hexToHsl(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  return [h, s, l];
}
export function colourName(hex) {
  const [h, s, l] = hexToHsl(hex);
  if (l < 0.08) return 'black';
  if (l > 0.94) return 'white';
  if (s < 0.12) return l < 0.3 ? 'charcoal' : l < 0.6 ? 'grey' : 'light grey';
  const hues = [[15, 'red'], [40, 'orange'], [52, 'amber'], [68, 'yellow'], [95, 'lime'], [150, 'green'], [178, 'teal'], [198, 'cyan'],
    [218, 'sky blue'], [245, 'blue'], [265, 'indigo'], [290, 'violet'], [318, 'purple'], [338, 'magenta'], [352, 'pink'], [361, 'red']];
  let hue = hues.find(([lim]) => h < lim)[1];
  if (hue === 'orange' && l < 0.35) hue = 'brown';
  const tone = l < 0.25 ? 'deep ' : l < 0.4 ? 'dark ' : l > 0.8 ? 'pale ' : l > 0.65 ? 'light ' : s > 0.75 ? 'vivid ' : '';
  return tone + hue;
}
const HEX = /^#[0-9a-f]{6}$/i;
function paletteText(recipe, palette, colors) {
  let p = null;
  const custom = (Array.isArray(colors) ? colors : []).map((c) => String(c || '').toLowerCase()).filter((c) => HEX.test(c)).slice(0, 4);
  if (palette === 'custom' && custom.length) p = { say: custom.map(colourName).join(', '), colors: custom };
  else if (recipe.palettes[palette] && recipe.palettes[palette].say) p = recipe.palettes[palette];
  if (!p) return '';
  return recipe.paletteClause.replace('{say}', p.say).replace('{hex}', (p.colors || []).join(', '));
}

// ---------- the prompt ----------
const HAND_WORDS = /\b(hand|hands|holding|counting|offering)\b/i;
const POLICY = new Set(['text', 'letters', 'words', 'numbers', 'captions', 'watermark', 'signature', 'added logos or brand marks', 'people', 'faces']);
export function composePrompt(recipe, opts) {
  const cat = recipe.categories[opts.category] || {};
  const style = recipe.styles[opts.style] || recipe.styles.auto || Object.values(recipe.styles)[0] || {};
  const aspect = recipe.aspects[opts.aspect] || recipe.aspects['1:1'];
  const space = recipe.spaces[opts.space] || recipe.spaces.top;
  const ents = opts.entities || [];
  const refs = ents.filter((e) => e.ref);
  const named = ents.filter((e) => !e.ref);
  const kw = opts.keywords || [];

  const parts = [];
  if (refs.length) {
    const list = refs.map((e, i) => (refs.length > 1 ? 'image ' + (i + 1) + ' is ' : '') + e.say).join('; ');
    parts.push(recipe.refClause.replace('{list}', list));
  }
  if (named.length) parts.push((refs.length ? 'Also ' : 'Featuring ') + named.map((e) => e.say.toLowerCase()).join(', '));
  if (kw.length) parts.push('Setting: ' + kw.join(', '));
  if (!parts.length) parts.push(cat.scene || 'a clean premium surface');
  const subject = parts.join('. ');

  const composition = [aspect.say, space.say, refs.length || named.length ? 'products fully visible, not cropped at the edges' : ''].filter(Boolean).join(', ');
  /* what you put in is what comes out: a word the customer typed lifts the
     same word from the Avoid list (cartoon, collage), and a product with hands
     in it lifts hands; the policy terms stay whatever is typed */
  const allow = ents.some((e) => HAND_WORDS.test(e.label)) || kw.some((w) => HAND_WORDS.test(w));
  const negative = [...new Set([...(recipe.negative || []), ...(cat.negative || [])])]
    .filter((n) => !(allow && /^(hands|body parts)$/.test(n)))
    .filter((n) => POLICY.has(n) || !kw.includes(n));

  const fill = (t) => t
    .replace('{lead}', style.lead || '').replace('{look}', style.look || '')
    .replace('{subject}', subject).replace('{anchor}', cat.anchor ? ', ' + cat.anchor : '')
    .replace('{palette}', paletteText(recipe, opts.palette, opts.colors)).replace('{composition}', composition)
    .replace('{quality}', recipe.quality || '').replace('{negative}', negative.join(', '));
  let prompt = fill(recipe.template)
    .replace(/\s+/g, ' ').replace(/\s+([.,])/g, '$1').replace(/([.,])(?:\s*[.,])+/g, '$1').replace(/^[.,\s]+/, '').trim();
  if (!recipe.models.negativeField && negative.length && !/\{negative\}/.test(recipe.template)) prompt += ' Avoid: ' + negative.join(', ') + '.';
  return { prompt, negative: negative.join(', '), refs: refs.map((e) => e.ref), aspect: opts.aspect in recipe.aspects ? opts.aspect : '1:1' };
}

// ---------- image providers ----------
const b64 = (buf) => Buffer.from(buf).toString('base64');
async function bytesOf(u, fetchImpl) {
  const r = await fetchImpl(u);
  if (!r.ok) throw new Error('reference image missing (' + r.status + ')');
  return { mime: r.headers.get('content-type') || 'image/jpeg', data: await r.arrayBuffer() };
}

/** fal: Seedream text-to-image, or Seedream edit with the references */
async function falImage(job, env, recipe, fetchImpl) {
  const m = recipe.models;
  const size = (recipe.aspects[job.aspect] || {}).fal || { width: 2048, height: 2048 };
  const body = { prompt: job.prompt, image_size: size, num_images: 1, enable_safety_checker: true };
  if (m.negativeField && job.negative) body.negative_prompt = job.negative;
  if (job.refs.length) body.image_urls = job.refUrls;
  const res = await fetchImpl('https://fal.run/' + (job.refs.length ? m.falEdit : m.falText), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Key ' + env.FAL_KEY },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`image model error (${res.status})`);
  const j = await res.json();
  const url = j.images?.[0]?.url;
  if (!url) throw new Error('the model declined this prompt, try different words');
  if (url.startsWith('data:')) {
    const m = url.match(/^data:([^;,]+);base64,(.*)$/s);
    if (!m) throw new Error('bad image from the model');
    return { mime: m[1], bytes: Buffer.from(m[2], 'base64') };
  }
  const img = await fetchImpl(url);
  if (!img.ok) throw new Error('image fetch failed');
  return { mime: img.headers.get('content-type') || 'image/jpeg', bytes: Buffer.from(await img.arrayBuffer()) };
}

/** Gemini: the references go inline, ahead of the words */
async function geminiImage(job, env, recipe, fetchImpl) {
  const model = recipe.models.gemini || 'gemini-3.1-flash-lite-image';
  const ratio = (recipe.aspects[job.aspect] || {}).gemini || job.aspect || '1:1';
  const supportsSize = model.includes('3-pro') || model === 'gemini-3.1-flash-image';
  const imgCfg = supportsSize ? { aspectRatio: ratio, imageSize: '1K' } : { aspectRatio: ratio };
  const parts = [];
  for (const r of job.refBytes || []) parts.push({ inlineData: { mimeType: r.mime, data: b64(r.data) } });
  parts.push({ text: job.prompt });
  const attempts = [
    { url: `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`,
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'], responseFormat: { image: imgCfg } } },
    { url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'], imageConfig: imgCfg } },
  ];
  let lastErr;
  for (const attempt of attempts) {
    const res = await fetchImpl(attempt.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_KEY },
      body: JSON.stringify({ contents: [{ parts }], generationConfig: attempt.generationConfig }),
    });
    if (res.status === 400) { lastErr = new Error('model rejected request'); continue; }
    if (!res.ok) throw new Error(`image model error (${res.status})`);
    const j = await res.json();
    const part = (j.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData || p.inline_data);
    if (!part) throw new Error('the model declined this prompt — try different words');
    const d = part.inlineData || part.inline_data;
    return { mime: d.mimeType || d.mime_type || 'image/png', bytes: Buffer.from(d.data, 'base64') };
  }
  throw lastErr || new Error('image model unavailable');
}

export const providerOf = (env, recipe) => {
  const want = recipe.models.provider;
  if (want === 'gemini' && env.GEMINI_KEY) return 'gemini';
  if (want === 'fal' && env.FAL_KEY) return 'fal';
  return env.FAL_KEY ? 'fal' : env.GEMINI_KEY ? 'gemini' : null;
};

export const dataUrlOf = (out) => `data:${out.mime};base64,${out.bytes.toString('base64')}`;

/**
 * One image, as { mime, bytes }. job: { prompt, negative, refs[] (site paths), aspect }.
 * The first provider is the recipe's (fal when FAL_KEY is set); the other is
 * the fallback when its key is set too. References: fal fetches them from the
 * site itself when the site is public, else they go inline as data URIs.
 */
export async function generateImage(job, env, recipe, deps) {
  const fetchImpl = (deps && deps.fetch) || fetch;
  const origin = String((deps && deps.origin) || env.SITE_URL || '').replace(/\/+$/, '');
  const order = providerOf(env, recipe) === 'gemini' ? ['gemini', 'fal'] : ['fal', 'gemini'];
  const usable = order.filter((p) => (p === 'fal' ? env.FAL_KEY : env.GEMINI_KEY));
  if (!usable.length) throw new Error('no image provider configured');
  const refs = job.refs || [];
  const publicSite = /^https:\/\//.test(origin) && !/\/\/(localhost|127\.|0\.0\.0\.0)/.test(origin);
  let refBytes = null;
  const needBytes = async () => (refBytes = refBytes || await Promise.all(refs.map((r) => bytesOf(origin + '/' + r, fetchImpl))));
  let lastErr;
  for (const p of usable) {
    try {
      if (p === 'fal') {
        const refUrls = publicSite ? refs.map((r) => origin + '/' + r)
          : (await needBytes()).map((b) => `data:${b.mime};base64,${b64(b.data)}`);
        return await falImage({ ...job, refs, refUrls }, env, recipe, fetchImpl);
      }
      return await geminiImage({ ...job, refs, refBytes: refs.length ? await needBytes() : [] }, env, recipe, fetchImpl);
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

// ---------- credits (plans.mjs) ----------
/* the fal model ids the recipe runs, by the names plans.mjs prices them
   under; any other model is priced under its own id (MODEL_COSTS), and a
   model with no price is not sold */
const FAL_PRICE_KEY = {
  'fal-ai/bytedance/seedream/v4/text-to-image': 'fal-seedream-v4',
  'fal-ai/bytedance/seedream/v4/edit': 'fal-seedream-v4-edit',
};
/** the models a job may run on, first choice first, as plans.mjs names them */
export function jobModels(env, recipe, refs) {
  const order = providerOf(env, recipe) === 'gemini' ? ['gemini', 'fal'] : ['fal', 'gemini'];
  return order.filter((p) => (p === 'fal' ? env.FAL_KEY : env.GEMINI_KEY)).map((p) => {
    if (p === 'gemini') return recipe.models.gemini || 'gemini-3.1-flash-lite-image';
    const m = refs ? recipe.models.falEdit : recipe.models.falText;
    return FAL_PRICE_KEY[m] || m;
  });
}
/** credits an image costs: the dearest model it could run on; null = not sold */
export function jobCredits(env, recipe, refs) {
  const ms = jobModels(env, recipe, refs);
  if (!ms.length) return null;
  let most = 0;
  for (const m of ms) {
    const c = creditsFor(m, env);
    if (c === null) return null;
    most = Math.max(most, c);
  }
  return most;
}
/** what an image can cost us at most, in dollars (operators see it) */
export function jobUsd(env, recipe, refs) {
  const t = modelCosts(env);
  return Math.max(0, ...jobModels(env, recipe, refs).map((m) => Number(t[m]) || 0));
}
const resetsOn = () => { const d = new Date(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).toISOString().slice(0, 10); };
const balanceOf = (user, admin) => (admin ? { unlimited: true, resets: resetsOn() } : { ...creditState(user), unlimited: false, resets: resetsOn() });
/* give back n credits of a run: bought ones first (they never expire) */
function part(spent, n) {
  const fromBought = Math.min(n, spent.fromBought || 0);
  return { fromBought, fromPlan: Math.min(spent.fromPlan || 0, n - fromBought), period: spent.period };
}

// ---------- generated pictures ----------
const IMG_ID = /^[a-f0-9]{32}$/;
const KEEP = 48;  // the newest pictures an account keeps in the store
async function keepImage(store, em, out) {
  const id = [...crypto.getRandomValues(new Uint8Array(16))].map((x) => x.toString(16).padStart(2, '0')).join('');
  await store.set('img/' + id, JSON.stringify({ mime: out.mime, b64: out.bytes.toString('base64'), by: em, ts: Date.now() }));
  return id;
}
async function pruneImages(store, em, ids) {
  const key = 'idx/' + em;
  let idx = [];
  try { idx = JSON.parse((await store.get(key)) || '[]'); } catch (e) { idx = []; }
  idx = idx.concat(ids);
  const drop = idx.slice(0, Math.max(0, idx.length - KEEP));
  await store.set(key, JSON.stringify(idx.slice(-KEEP)));
  await Promise.all(drop.map((id) => store.delete('img/' + id).catch(() => {})));
}

// ---------- the routes ----------
/**
 * deps: { json, readToken(req), getUser(em), putUser(u), freshUser(u),
 * isAdmin(em), bumpBy(key, n, cap) (the day's ceilings), bg (the published-
 * backgrounds store: the override), gen (the generated-pictures store),
 * fetchJson(url), fetch }
 */
export async function bggenRoute(req, url, p, env, deps) {
  const { json } = deps;
  const routes = ['/bggen/config', '/generate-bg', '/admin/bggen-recipe', '/admin/bggen-preview', '/admin/bggen-grant'];
  if (p.startsWith('/bggen/img/')) {
    const id = p.slice('/bggen/img/'.length);
    const raw = IMG_ID.test(id) ? await deps.gen.get('img/' + id) : null;
    if (!raw) return json({ error: 'Not found' }, 404);
    const { mime, b64 } = JSON.parse(raw);
    return new Response(Buffer.from(b64, 'base64'), { headers: { 'Content-Type': mime, 'Cache-Control': 'private, max-age=86400', 'X-Robots-Tag': 'noindex' } });
  }
  if (!routes.includes(p)) return null;
  const origin = String(env.SITE_URL || url.origin).replace(/\/+$/, '');
  const recipe = await loadRecipe(env, deps.bg);
  const provider = providerOf(env, recipe);
  const em = await deps.readToken(req);
  const admin = !!em && deps.isAdmin(em);
  const maxPerRun = Math.max(1, Math.min(8, Math.round(recipe.maxPerRun) || 1));

  if (p === '/bggen/config') {
    const pub = (o) => Object.entries(o).map(([id, v]) => clean({ id, label: v.label, emoji: v.emoji, colors: v.colors }));
    const cost = jobCredits(env, recipe, false), costRef = jobCredits(env, recipe, true);
    const out = {
      enabled: !!provider && cost !== null,
      references: !!provider && costRef !== null,  // both providers take reference images
      unit: 'credits',
      cost, costRef, maxPerRun,
      maxEntities: MAX_ENTITIES,
      styles: pub(recipe.styles),
      palettes: [...pub(recipe.palettes), { id: 'custom', label: 'Custom' }],
      aspects: pub(recipe.aspects),
      spaces: pub(recipe.spaces),
      catalogue: CATALOGUE_PATH,
      account: null,
    };
    if (em) {
      const user = await deps.getUser(em);
      if (user) out.account = balanceOf(user, admin);
    }
    if (admin) Object.assign(out, { usd: jobUsd(env, recipe, false), usdRef: jobUsd(env, recipe, true), provider });
    return json(out);
  }

  if (p === '/admin/bggen-recipe') {
    if (!admin) return json({ error: 'Not authorized' }, 403);
    if (req.method === 'POST') {
      const body = await req.json().catch(() => null);
      let override;
      try { override = checkOverride(body && 'override' in body ? body.override : undefined); }
      catch (e) { return json({ error: e.message }, 400); }
      if (override) await deps.bg.set(RECIPE_KEY, JSON.stringify(override));
      else await deps.bg.delete(RECIPE_KEY);
      recipeCache = { at: Date.now(), override };
    }
    const override = await loadOverride(deps.bg, req.method !== 'POST');
    return json({ base: baseRecipe(env), override, effective: merge(baseRecipe(env), override || {}), provider });
  }

  if (p === '/admin/bggen-grant' && req.method === 'POST') {
    if (!admin) return json({ error: 'Not authorized' }, 403);
    const { email, credits } = await req.json().catch(() => ({}));
    const target = await deps.getUser(String(email || '').trim().toLowerCase());
    const n = Math.round(Number(credits));
    if (!target) return json({ error: 'No account with that email' }, 404);
    if (!Number.isFinite(n) || Math.abs(n) > 100000) return json({ error: 'Credits must be a whole number' }, 400);
    target.creditsBought = Math.max(0, (target.creditsBought || 0) + n);
    await deps.putUser(target);
    return json({ ok: true, account: balanceOf(target, false) });
  }

  // ---- a run, or (operators) the prompt it would send ----
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (p === '/admin/bggen-preview' && !admin) return json({ error: 'Not authorized' }, 403);
  if (!em) return json({ error: 'Sign in to generate backgrounds' }, 401);
  const user = await deps.getUser(em);
  if (!user) return json({ error: 'Account not found' }, 404);
  const body = await req.json().catch(() => ({}));
  const legacy = !('count' in body);  // the older callers: one image, inline
  const n = legacy ? 1 : Math.max(1, Math.min(maxPerRun, Math.round(Number(body.count)) || 1));
  const category = String(body.category || '').toLowerCase();
  let entities = [];
  if (Array.isArray(body.entities) && body.entities.length) {
    let cat;
    try { cat = await loadCatalogue(origin, deps.fetchJson); }
    catch (e) { return json({ error: 'The product catalogue is unavailable, try again. Nothing was charged.' }, 503); }
    entities = resolveEntities(body.entities, cat, recipe);
  }
  const job = composePrompt(recipe, {
    category, entities, keywords: extractKeywords(body.text),
    style: String(body.style || 'auto'), palette: String(body.palette || 'auto'), colors: body.colors,
    aspect: String(body.aspect || '1:1'), space: String(body.space || 'top'),
  });
  const cost = jobCredits(env, recipe, job.refs.length > 0);
  if (p === '/admin/bggen-preview') {
    return json({ prompt: job.prompt, negative: job.negative, refs: job.refs, aspect: job.aspect, entities: entities.map((e) => e.id), cost, usd: jobUsd(env, recipe, job.refs.length > 0), provider });
  }
  if (!provider) return json({ error: 'AI backgrounds are not enabled yet' }, 503);
  if (cost === null) {
    console.error('generate-bg: the image model has no price in plans.mjs or MODEL_COSTS, so it is not sold');
    return json({ error: 'AI backgrounds are paused for a moment. Nothing was charged.' }, 503);
  }

  /* the run's credits in one write, the plan's month first (plans.mjs) */
  const total = cost * n;
  let spent = null;
  if (!admin) {
    await deps.freshUser(user);
    spent = spendCredits(user, total);
    if (!spent) {
      const c = creditState(user);
      const what = n > 1 ? `${n} AI backgrounds take ${total}` : `An AI background takes ${total}`;
      return json({ error: `${what} credit${total === 1 ? '' : 's'} and you have ${c.total} left`, need: total, credits: balanceOf(user, false) }, 402);
    }
    /* the free tier's AI is a marketing cost with a ceiling; paid credits are
       profitable by construction and only meet the runaway guard (as main's
       /generate-bg did before this file took it over) */
    const day = new Date().toISOString().slice(0, 10);
    if (spent.fromPlan && planId(user.plan) === 'free'
      && !(await deps.bumpBy('ai:free:' + day, spent.fromPlan, parseInt(env.AI_FREE_DAILY_CREDITS || '100', 10)))) {
      return json({ error: 'Free AI backgrounds are used up for today. Try again tomorrow, or go Pro. Nothing was charged.', credits: balanceOf(await deps.getUser(em), false) }, 429);
    }
    if (!(await deps.bumpBy('ai:all:' + day, total, parseInt(env.AI_DAILY_CREDITS || '2000', 10)))) {
      return json({ error: 'AI backgrounds are cooling down. Try again later. Nothing was charged.', credits: balanceOf(await deps.getUser(em), false) }, 429);
    }
    await deps.putUser(user);
  }

  const settled = await Promise.allSettled(Array.from({ length: n }, () => generateImage(job, env, recipe, { origin, fetch: deps.fetch })));
  const failed = settled.filter((r) => r.status === 'rejected');
  let credits = balanceOf(user, admin);
  if (spent && failed.length) {  // the failures' credits back, in one write
    const back = await deps.getUser(em);
    if (back) { refundCredits(back, part(spent, failed.length * cost)); await deps.putUser(back); credits = balanceOf(back, false); }
  }
  const charged = admin ? 0 : (n - failed.length) * cost;
  const refunded = spent ? failed.length * cost : 0;
  if (failed.length === n) {
    return json({ error: (failed[0].reason && failed[0].reason.message) || 'Generation failed', refunded: refunded > 0, credits }, 502);
  }
  // the prompt is intentionally NOT returned
  if (legacy) {
    const out = settled[0].value;
    if (out.bytes.length <= 4000000) return json({ image: dataUrlOf(out), spent: charged, credits });
    const id = await keepImage(deps.gen, em, out);
    await pruneImages(deps.gen, em, [id]);
    return json({ url: 'bggen/img/' + id, spent: charged, credits });
  }
  const images = [];
  for (const r of settled) {
    if (r.status === 'rejected') images.push({ error: (r.reason && r.reason.message) || 'Generation failed' });
    else images.push({ id: await keepImage(deps.gen, em, r.value) });
  }
  await pruneImages(deps.gen, em, images.filter((x) => x.id).map((x) => x.id));
  return json({ images: images.map((x) => (x.id ? { url: 'bggen/img/' + x.id } : x)), spent: charged, refunded, credits });
}
