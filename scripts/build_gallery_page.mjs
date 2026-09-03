#!/usr/bin/env node
/* Assemble the theme gallery: one dropdown per layout family, its premise,
   and the rendered variations under it (.render/gallery/<layout>/). */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const ROOT = new URL('../', import.meta.url).pathname;
const THEMES = [
  { key:'checklistHero', name:'Checklist Hero',  style:'Professional',  tags:['professional','direct','product-led'],
    premise:'The straight talker. Product on the right, the money word on the left, three tick rows that say exactly what you do. Reads like a trusted local service ad; the workhorse for phones, gold and cars.' },
  { key:'reviewProof',   name:'Review Proof',    style:'Social proof',  tags:['social proof','trust','testimonial'],
    premise:'Someone else says it for you. A star rating, a real-sounding quote with a name and a city, then the BUYER word. Best approval rate of any layout; carries the review family formats.' },
  { key:'trustSeal',     name:'Trust Seal',      style:'Credentialed',  tags:['professional','tiles','licensed'],
    premise:'The licensed operator. A kicker seal over the money word, then four fact tiles: top payout, rating, years, same-day. For sellers who want to know you are legitimate before they text.' },
  { key:'stepsFlow',     name:'Steps Flow',      style:'Explainer',     tags:['how it works','friendly','1-2-3'],
    premise:'How it works in three steps. Text pics, get offer, get paid. Lowers the barrier for first-time sellers; pairs with a product up top and a phone bar at the foot.' },
  { key:'bubblePop',     name:'Bubble Pop',      style:'Playful',       tags:['playful','rounded','sticker'],
    premise:'Rounded, bright, sticker energy. Big friendly type, a tilted TOP $$$ sticker, pill panels. Made for Pokémon, sports cards and younger sellers; still carries the phone number at full size.' },
  { key:'voltStack',     name:'Volt Stack',      style:'Bold',          tags:['bold','stacked','electric'],
    premise:'Stacked, loud, electric. The headline is a column of heavy type with the money word knocked out in the accent. For cars and phones when the message is price.' },
  { key:'neonNight',     name:'Neon Night',      style:'Nightlife',     tags:['dark','neon','premium'],
    premise:'After dark. A deep ground, glowing accent type, a centred stack. Premium feel for gold, watches and high-end phones; keep copy short so the glow stays clean.' },
  { key:'slabPoster',    name:'Slab Poster',     style:'Poster',        tags:['poster','heavy type','street'],
    premise:'A poster on a wall. Slab type at full width, minimal panels, the photograph does the talking. Strongest with the street and stencil faces on cars and silver.' },
  { key:'scriptRetro',   name:'Script Retro',    style:'Retro',         tags:['retro','script','divider'],
    premise:'Signage from a better decade. A script opener over a heavy money word, a star divider, a pill of items. Warm palettes and serif faces; gold, coins and vintage cards.' },
  { key:'lowerThird',    name:'Lower Third',     style:'Broadcast',     tags:['broadcast','lower third','product'],
    premise:'A broadcast lower third. The product owns the top half, the band carries kicker, headline, number and CTA. The most approved layout across sets; the challenge sentence lives here well.' },
  { key:'gradientWave',  name:'Gradient Wave',   style:'Dynamic',       tags:['dynamic','wave','gradient'],
    premise:'Movement. The money word rides a wave, the ground is a gradient of the palette, the CTA card anchors the foot. Condensed faces only on the wave; strong on phones and Pokémon.' },
  { key:'ticketStub',    name:'Ticket Stub',     style:'Novelty',       tags:['novelty','ticket','admit one'],
    premise:'Admit one: instant cash. A perforated ticket holds the whole pitch; the number sits under it on its own pill. A wink, for test strips and cards; less for gold.' },
  { key:'hudTech',       name:'HUD Tech',        style:'Tech',          tags:['tech','hud','readout'],
    premise:'A heads-up display. Thin rules top and bottom, a ring behind the money word, a two-line data chip, monospace numerals. For phones, watches and anything with a spec sheet.' },
  { key:'bandKnockout',  name:'Band Knockout',   style:'Bold',          tags:['bold','band','knockout'],
    premise:'One band, one word. The money word sits in a full band of the accent (golden under GOLD), the seal row under it, the CTA card at the foot. Fast to read at feed size.' },
  { key:'arcCrown',      name:'Arc Crown',       style:'Classic',       tags:['classic','arched','badge'],
    premise:'A crown of type. SELL YOUR arcs over the money word like a badge; items and cities under it; a pill for the number. Classic shop-sign feel that suits every category.' },
  { key:'glassCard',     name:'Glass Card',      style:'Modern glass',  tags:['modern','glass','ios'],
    premise:'A frosted glass card over the photograph. iOS-flat panels, tinted not blurred, a kicker pill at the top. Clean and current; phones, Apple lines and coins.' },
];
const cards = [];
for (const t of THEMES){
  const dir = ROOT + (process.env.GALLERY_DIR || '.render/gallery').replace(/\/?$/, '/') + t.key + '/';
  if (!existsSync(dir + 'manifest.json')){ console.log('  missing: ' + t.key); continue; }
  const man = JSON.parse(readFileSync(dir + 'manifest.json', 'utf8'));
  man.forEach(m => cards.push({ ...m, src: 'data:image/webp;base64,' + readFileSync(dir + m.id + '.webp').toString('base64') }));
}
const tpl = readFileSync(new URL('./gallery_page.html', import.meta.url).pathname, 'utf8');
const out = tpl.replace('/*__THEMES__*/', JSON.stringify(THEMES)).replace('/*__CARDS__*/', JSON.stringify(cards));
writeFileSync(ROOT + (process.env.GALLERY_DIR || '.render/gallery').replace(/\/?$/, '/') + 'picker.html', out);
console.log(`gallery: ${cards.length} cards across ${THEMES.filter(t => existsSync(ROOT + (process.env.GALLERY_DIR || '.render/gallery').replace(/\/?$/, '/') + t.key + '/manifest.json')).length} themes, ${(out.length/1048576).toFixed(1)} MB`);
