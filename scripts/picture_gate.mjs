/* WHICH PRODUCT PICTURES MAY REACH A CARD (2026-09-27).
 *
 * Two lists say so, and a picture must pass both:
 *   assets/approved-assets.json  the owner's own pass over every cutout
 *                                (2026-09-03: approved, or rejected with a
 *                                reason), plus the pictures added since
 *                                (the card placeholders, the real Charizard)
 *   assets/cutout-flags.json     what was found wrong since (garbled
 *                                lettering, the wrong product, cut off at the
 *                                frame, too small), even on approved ones
 * The owner's "off-category" rejections (a speaker, a gaming laptop, a
 * Windows laptop: "not something the shop advertises") are lifted for the
 * five categories the owner opened on 2026-09-27 for exactly those goods ("any
 * other assets we have can be used.. adjacent types"). Every other reason
 * stands everywhere.
 *
 * Used by audit_templates.mjs, audit_showcase_content.mjs and
 * audit_showcase_school.mjs; swap_flagged_cutouts.py applies the same rule.
 */
import { readFileSync } from 'node:fs';
const ROOT = new URL('../', import.meta.url).pathname;
const FLAGS = JSON.parse(readFileSync(ROOT + 'assets/cutout-flags.json', 'utf8'));
const G = JSON.parse(readFileSync(ROOT + 'assets/approved-assets.json', 'utf8'))['asset-grid-v1'];
const APPROVED = new Set(G.approved), REJECTED = new Set(G.rejected), WHY = G.reasonById || {};
export const NEW_CATS = new Set(['gaming', 'audio', 'computers', 'wearables', 'cameras']);
/* the picture's id from a layer's src; null when it is not a product cutout
   (a brand mark, a photograph) */
export const pictureId = src => /assets\/cutouts\//.test(String(src || '')) ? String(src).replace(/^.*\//, '').replace(/\.[a-z0-9]+$/i, '') : null;
/* null when the picture may be drawn on a card of category `cat`, else why not */
export function pictureVerdict(id, cat){
  if (!id) return null;
  if (id !== '_about' && FLAGS[id]) return 'flagged: ' + FLAGS[id];
  if (REJECTED.has(id)){
    if (WHY[id] === 'off-category' && NEW_CATS.has(cat)) return null;
    return 'rejected by the owner (' + (WHY[id] || 'no reason given') + ')';
  }
  if (!APPROVED.has(id)) return 'not in the owner\'s approval list';
  return null;
}
