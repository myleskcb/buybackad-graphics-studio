/* The explainer videos say only what the plans are. Fails (exit 1) when a
   number in videos.js FACTS is not netlify/lib/plans.mjs's, when a picture a
   scene names is missing, or when a rendered video is missing or older than
   its script. Run after changing a plan or a scene:
     node tools/explainers/check.mjs */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { PLANS } from '../../netlify/lib/plans.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../..');
const src = readFileSync(path.join(HERE, 'videos.js'), 'utf8');
const block = /FACTS:BEGIN[^\n]*\n([\s\S]*?)\/\* FACTS:END/.exec(src);
const problems = [];
if (!block) problems.push('videos.js has no FACTS block');
const FACTS = block ? new Function(block[1] + '; return FACTS;')() : {};
const cents = (plan, n) => { const c = Math.round(plan.price.month / n); return c + '¢'; };
const want = [
  ['free.weekly', FACTS.free && FACTS.free.weekly, PLANS.free.weekly],
  ['starter.month', FACTS.starter && FACTS.starter.month, PLANS.basic.price.month / 100],
  ['starter.downloads', FACTS.starter && FACTS.starter.downloads, PLANS.basic.monthly],
  ['starter.each', FACTS.starter && FACTS.starter.each, cents(PLANS.basic, PLANS.basic.monthly)],
  ['pro.month', FACTS.pro && FACTS.pro.month, PLANS.pro.price.month / 100],
  ['pro.downloads', FACTS.pro && FACTS.pro.downloads, PLANS.pro.monthly],
  ['pro.each', FACTS.pro && FACTS.pro.each, cents(PLANS.pro, PLANS.pro.monthly)],
  ['business.month', FACTS.business && FACTS.business.month, PLANS.business.price.month / 100],
];
for (const [k, said, is] of want) if (said !== is) problems.push(`FACTS.${k} says ${said}, the plans say ${is}`);
if (!PLANS.pro.video) problems.push('the videos say Pro downloads video; plans.mjs says it does not');
if (PLANS.business.monthly !== null) problems.push('the videos say Business is unlimited; plans.mjs caps it');
for (const p of Object.values(PLANS)) if (p.price.year && p.price.year !== p.price.month * 10) problems.push(`"two months free" is not true of ${p.label}`);
for (const m of src.matchAll(/AD\('([^']+)'\)/g)) if (!existsSync(path.join(ROOT, 'assets/library-ads', m[1] + '.jpg'))) problems.push('missing ad render: ' + m[1]);
for (const m of src.matchAll(/'((?:glassCard|ticketStub|checklistHero|bubblePop|neonNight|scriptRetro|bandKnockout)-[a-z0-9-]+)'/g)) if (!existsSync(path.join(ROOT, 'assets/library-ads', m[1] + '.jpg'))) problems.push('missing ad render: ' + m[1]);
for (const m of src.matchAll(/'((?:step|ad-|video-|themes|landing)[a-z0-9-]*)'/g)) if (!existsSync(path.join(HERE, 'shots', m[1] + '.jpg'))) problems.push('missing screen: shots/' + m[1] + '.jpg');
const ids = [...src.matchAll(/define\('([a-z-]+)'/g)].map(m => m[1]);
const newest = Math.max(...['videos.js', 'engine.js', 'stage.css'].map(f => statSync(path.join(HERE, f)).mtimeMs));
for (const id of ids) for (const ext of ['mp4', 'jpg']) {
  const f = path.join(ROOT, 'assets/explainers', id + '.' + ext);
  if (!existsSync(f)) problems.push(`not rendered: assets/explainers/${id}.${ext} (node tools/explainers/render.mjs)`);
  else if (process.argv.includes('--fresh') && statSync(f).mtimeMs < newest) problems.push(`older than its script: assets/explainers/${id}.${ext}`);
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log(`explainers ok: ${ids.length} videos, the plan numbers are the plans', every picture is there`);
