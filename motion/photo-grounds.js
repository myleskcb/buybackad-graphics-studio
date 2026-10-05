/* The video maker's scenes as grounds for the image ads (owner, 2026-10-02: "we have
   really clean backgrounds" ... "same with the background photo generation").

   Each scene is the video maker's own painter (motion/decor.js), registered with the
   shared catalogue (grounds.js, GROUNDS.register) under a key of letters only, so a
   card stores it like any drawn ground ("ground:sceneSunsetSynth/..."), the studio
   thumbnails, edits, gates and exports it like any photograph, and it paints in the
   card's own palette: its ground and light from the card's two ground stops (already
   fitted to the ink), its paint from the card's accent. The ground is an image to the
   gate, as a photograph is: pgGate shades it where a line needs it. */
import { vibeBackground, candidateGround, themeGround, freshGround, FRESH_GROUNDS, withoutPalms } from "./decor.js";
import { GROUND_CANDIDATES, FRESH_REVIEW } from "./catalog.js";
import { rng, mix, lum } from "./engine.js";

// the scenes, in the picker's groups (no more than a dozen to a group: each swatch is painted whole).
// Left out: asphalt (its road line), sky_day (clouds), mural_rainbow and racing_stripes (bold
// bands): each put a hard edge through the copy of the image cards, which the video lays out round.
export const SCENE_GROUPS = [
  { key: "scene_sky", label: "Sky & beach", kinds: ["sunset_sky", "sunset_synth", "sunset_ocean", "sunset_dusk", "beach", "beach_sunset", "beach_top"] },
  { key: "scene_walls", label: "Walls & street", kinds: ["stucco", "concrete", "cork", "brick_night", "brick_neon_wash", "brick_wet", "brick_lamp", "mural_wall", "mural_waves", "mural_shapes"] },
  { key: "scene_show", label: "Showtime", kinds: ["velvet", "velvet_parted", "velvet_bulbs", "beams_cross", "beams_stage", "rays_corner", "rays_bold", "candy_flake", "candy_flames", "candy_fade", "fluoro"] },
  { key: "scene_pop", label: "Pop & print", kinds: ["halftone_duo", "halftone_comic", "halftone_lines", "checker_floor", "checker_diamond", "starfield", "holo"] },
  { key: "scene_made", label: "Materials", kinds: ["blueprint", "newsprint", "kraft", "wood", "tile", "brushed_metal", "carbon", "gingham", "pegboard", "diamond_plate", "notebook"] },
  // the fresh grounds the owner approved (2026-10-04: "I do like all of them"), only once approved
  { key: "scene_fresh", label: "Fresh & clean", kinds: ["studio_sweep", "pill_stage", "arch_window", "paper_cut", "ribbon_wave", "concentric", "split_soft", "marble_soft", "tile_gloss", "sky_gradient", "window_light", "podium_steps"].filter(k => FRESH_REVIEW.approved.includes(k)) },
  { key: "scene_party", label: "Party & colour", kinds: ["confetti_pop", "sprinkles", "streamers", "confetti_soft", "pastel_blobs", "sun_rays", "polka_pop", "terrazzo", "paper_shapes"].filter(k => FRESH_REVIEW.approved.includes(k)) },
  { key: "scene_glow", label: "Glow & lines", kinds: ["spot_floor", "bokeh_night", "grid_glow", "neon_frame", "glow_orbs", "halftone_fade", "diagonal_lines", "wave_lines", "checker_fade"].filter(k => FRESH_REVIEW.approved.includes(k)) },
];

/** "brick_neon_wash" → "sceneBrickNeonWash" (grounds.js keys are letters only). */
export const sceneKey = id => "scene" + id.split("_").map(w => w[0].toUpperCase() + w.slice(1)).join("");

const nameOf = id => (GROUND_CANDIDATES[id] && GROUND_CANDIDATES[id].label) || FRESH_GROUNDS[id] || id.split("_").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");

/** The video maker's palette from a card's (grounds.js P: c1, c2, accent, support, ink). */
function motionPalette(P) {
  const g = P.c1, other = P.c2 && P.c2 !== P.c1 ? P.c2 : mix(g, lum(g) < .4 ? "#ffffff" : "#000000", .18);
  // the video maker's ground is the deeper of the two, its light the brighter
  const [ground, light] = lum(other) >= lum(g) ? [g, other] : [other, g];
  return { ground, light, ink: P.ink || "#ffffff", accent: P.accent || light, plate: P.support || P.accent || light, plate_ink: ground, sun: P.accent };
}

function paint(id) {
  return (g, W, H, P, r) => {
    const seed = Math.floor(r() * 1e6) + 1, p = motionPalette(P), sc = [W / 2, H * .55], st = { seed, decor: [], score: "" };
    g.fillStyle = p.ground; g.fillRect(0, 0, W, H);
    const R = rng(seed);
    const drew = withoutPalms(() => freshGround(id, g, st, p, W, H, sc, R) || candidateGround(id, g, st, p, W, H, sc, R) || themeGround(id, g, st, p, W, H, sc, R) || vibeBackground(id, g, st, p, W, H, sc, R));
    if (!drew) return;
    // the video maker's own finish: a soft vignette about the stage
    const D = Math.hypot(W, H), v = g.createRadialGradient(sc[0], sc[1], D * .35, sc[0], sc[1], D * .8);
    v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.2)"); g.fillStyle = v; g.fillRect(0, 0, W, H);
  };
}

export function registerScenes(G = typeof window !== "undefined" ? window.GROUNDS : null) {
  if (!G || typeof G.register !== "function") return 0;
  let n = 0;
  for (const grp of SCENE_GROUPS) for (const id of grp.kinds)
    if (G.register(sceneKey(id), { name: nameOf(id), note: "from the video maker", group: grp.key, draw: paint(id) })) n++;
  return n;
}

if (typeof window !== "undefined") {
  registerScenes();
  window.SCENE_GROUPS = SCENE_GROUPS.map(g => ({ key: g.key, label: g.label, kinds: g.kinds.map(sceneKey) }));
  window.dispatchEvent(new Event("scenes-ready"));
}
