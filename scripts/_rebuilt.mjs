/* THE REBUILT ADS' ONE STAMP (scripts/render_rebuilt_ads.mjs, scripts/library_api_check.mjs).

   A rebuilt ad's full-size render (assets/rebuilt-ads/) is drawn from its recipe (motion/recipes.json):
   its seed, its line, its words, its pictures, whether it stands on its words alone, and its name. The
   render's index keeps this stamp of what it was drawn from; a recipe changed since makes the render stale,
   so the renderer draws it again (--stale) and the check fails until it has. One formula for both. */
import { createHash } from 'node:crypto';

export const stampOf = r => createHash('sha1').update(JSON.stringify([r.seed, r.subject, r.words, r.pictures, r.words_only || false, r.label])).digest('hex');
/* the library's rebuilt ads: the recipes made from library cards (an offer card was never in the library) */
export const libraryRecipes = recipes => recipes.filter(r => r.gen === 'sc');
