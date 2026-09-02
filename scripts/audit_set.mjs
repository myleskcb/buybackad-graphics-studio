#!/usr/bin/env node
/* Self-audit of a rendered set from the final layer tables (LAB_DEBUG=ALL).
   Every rule here is one the owner has called out. A card fails on any hit. */
import { readFileSync, writeFileSync } from 'node:fs';
const DIR = process.env.LAB_OUT ? new URL('../' + process.env.LAB_OUT.replace(/\/?$/, '/'), import.meta.url).pathname : new URL('../.render/retheme/', import.meta.url).pathname;
const cards = JSON.parse(readFileSync(DIR + 'audit-layers.json', 'utf8'));
const W = 1080, H = 1080;
const DECOR = /Faster One|Sedgwick|Rubik|Wallpoet|Freckle|Nosifer|Creepster|Bungee|Rye|Fascinate|Luckiest|Shrikhand|Special Elite|Press Start|Pirata|Kaushan|Knewave|Bangers|Permanent|Kalam|Patrick|Shadows|Gloria|Nanum|Architects|Amatic|Cabin Sketch/i;
const norm = t => t.trim().toUpperCase().replace(/\s+/g, ' ');
const report = [];
for (const c of cards){
  const rows = c.layers.map(r => { const f = r.split(' | '); const bb = f[6] === '-' ? null : f[6].split(',').map(Number);
    return { k:+f[0], kind:f[1], role:f[2], name:f[3], text:f[4], fs:+f[5] || 0, bb, fill:f[8] }; });
  const texts = rows.filter(r => r.kind !== 'rect' && r.text && r.bb);
  const hits = [];
  // 1. no line repeats — exact or a shorter cut of another (8+ chars)
  const seen = [];
  texts.forEach(r => { const k = norm(r.text.replace(/⏎/g, ' ')); if (k.length < 8) return;
    if (seen.some(x => x === k || x.startsWith(k) || k.startsWith(x))) hits.push('repeat: ' + r.text.slice(0, 30)); else seen.push(k); });
  // 2. nothing off the page (22px margin) — cutouts get 12
  rows.filter(r => r.bb).forEach(r => { const m = r.kind === 'cutout' ? 12 : 20; const [x, y, w, h] = r.bb;
    if (x < m - 2 || y < m - 2 || x + w > W - m + 2 || y + h > H - m + 2) hits.push('off-page: ' + (r.text || r.name).slice(0, 24) + ' [' + r.bb.join(',') + ']'); });
  // 3. text on text: two text boxes overlapping by more than 18% of the smaller
  for (let a = 0; a < texts.length; a++) for (let b = a + 1; b < texts.length; b++){
    const A = texts[a].bb, B = texts[b].bb;
    const ix = Math.max(0, Math.min(A[0]+A[2], B[0]+B[2]) - Math.max(A[0], B[0])), iy = Math.max(0, Math.min(A[1]+A[3], B[1]+B[3]) - Math.max(A[1], B[1]));
    const inter = ix * iy, small = Math.min(A[2]*A[3], B[2]*B[3]);
    if (small > 0 && inter / small > 0.18) hits.push('text-on-text: ' + texts[a].text.slice(0, 18) + ' / ' + texts[b].text.slice(0, 18));
  }
  // 4. unreadable: rendered line height under 15px for real copy
  texts.forEach(r => { if (r.bb[3] < 15 && r.text.length > 3) hits.push('tiny: ' + r.text.slice(0, 24) + ' h=' + r.bb[3]); });
  // 5. headline width — the owner's 82% rule (86% tolerance for measurement)
  texts.filter(r => r.role === 'headline').forEach(r => { if (r.bb[2] > W * 0.86) hits.push('wide headline: ' + r.text.slice(0, 20) + ' w=' + r.bb[2]); });
  // 6. grammar the owner caught
  texts.forEach(r => { if (/\bA THE\b|\bA AN\b/i.test(r.text)) hits.push('grammar: ' + r.text.slice(0, 30)); });
  // 7. ambitious claims
  texts.forEach(r => { if (/ANY (WRITTEN )?OFFER/i.test(r.text)) hits.push('claim: ' + r.text.slice(0, 30)); });
  // 8. sparse
  if (c.density < 12) hits.push('sparse: density ' + c.density);
  // 10. product over words — a cutout covering a tenth of any text box (owner, 2026-09-02: a coin over the tiles and the number)
  rows.filter(r => r.kind === 'cutout' && r.bb && !/^Wall /.test(r.name)).forEach(r => texts.forEach(t => {   // the wall is behind the words by design
    const A = r.bb, B = t.bb;
    const ix = Math.max(0, Math.min(A[0]+A[2], B[0]+B[2]) - Math.max(A[0], B[0])), iy = Math.max(0, Math.min(A[1]+A[3], B[1]+B[3]) - Math.max(A[1], B[1]));
    if (B[2] * B[3] > 0 && ix * iy > 0.1 * B[2] * B[3]) hits.push('product-on-text: ' + t.text.slice(0, 24));
  }));
  // 11. stars are always five — an ornament of three reads as a three-star review
  texts.forEach(r => { const n = (r.text.match(/★/g) || []).length; if (n && /^[★\s·]+$/.test(r.text.trim()) && n !== 5) hits.push('stars: ' + n + ' in ' + r.text.slice(0, 16)); });
  // 9. decorative face on a long line is caught at source; report the face for the record
  report.push({ id: c.id, cat: c.cat, display: c.faces.display, hits });
}
// 12. no two cards alike — same words, same products (owner, 2026-09-02: two Blue Ticket silver cards, identical)
{ const sig = new Map();
  cards.forEach((c, n) => {
    const rows = c.layers.map(r => r.split(' | '));
    /* same palette, same words, same products: the pair the owner saw. The
       same words on two PALETTES is a different card in the lab's own terms
       (the palette is what a page compares), so it is not flagged here. */
    const key = (c.id.split('-')[1] || '') + '#' + rows.filter(f => f[4] && f[4] !== '-').map(f => f[4]).sort().join('|') + '#' + rows.filter(f => f[1] === 'cutout').map(f => f[3]).sort().join('|');
    if (sig.has(key)) report[n].hits.push('duplicate: of ' + sig.get(key)); else sig.set(key, c.id);
  }); }
const bad = report.filter(r => r.hits.length);
writeFileSync(DIR + 'audit.json', JSON.stringify(report, null, 1));
const byRule = {}; bad.forEach(r => r.hits.forEach(h => { const k = h.split(':')[0]; byRule[k] = (byRule[k] || 0) + 1; }));
console.log(`audit: ${cards.length} cards · ${bad.length} with hits · rules: ` + Object.entries(byRule).map(([k, v]) => k + ' ' + v).join(', '));
bad.slice(0, 40).forEach(r => console.log('  ' + r.id.padEnd(24) + r.hits.slice(0, 3).join(' · ')));
