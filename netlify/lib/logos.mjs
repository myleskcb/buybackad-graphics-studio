/* THE LOGO FILES, DRAWN BY THE FUNCTION (DESIGN-LAW 176; OPEN-ITEMS §BU "super pay walled").

   The logo maker (logo/) draws every preview in the browser with logo/engine.js and marks it until the
   plan includes logos. The files a customer keeps are drawn here, by the same engine with the same
   faces, after api.mjs has checked the plan (plans.mjs logos: Pro and Business) and counted one photo
   download: the page sends the design (a layout, the words, a type pair, a colour pair, a symbol) and
   gets back the SVGs and a note of the colours, from which it makes the PNGs. A design is held to what
   the engine draws (cleanDesign) before anything is drawn.

   The faces are imported by name, each a literal import, so the bundler packs every one with the
   function; scripts/logo_check.mjs fails when this list and logo/voices.js LOGO_FACES differ. The
   engine too is imported when a file is drawn, not when the function starts: the checks that run the
   function from a copy of netlify/ alone (billing_check and its kind) never reach it. */
const engine = () => import("../../logo/engine.js");

export const FACE_MODULES = {
  "oswald": () => import("../../logo/glyphs/oswald.js"),
  "satoshi-700": () => import("../../logo/glyphs/satoshi-700.js"),
  "sofia-xcond-800": () => import("../../logo/glyphs/sofia-xcond-800.js"),
  "schibsted-800": () => import("../../logo/glyphs/schibsted-800.js"),
  "big-shoulders": () => import("../../logo/glyphs/big-shoulders.js"),
  "manrope": () => import("../../logo/glyphs/manrope.js"),
  "teko": () => import("../../logo/glyphs/teko.js"),
  "chivo-700": () => import("../../logo/glyphs/chivo-700.js"),
  "saira-cond": () => import("../../logo/glyphs/saira-cond.js"),
  "sora": () => import("../../logo/glyphs/sora.js"),
  "barlow-cond": () => import("../../logo/glyphs/barlow-cond.js"),
  "franklin-700": () => import("../../logo/glyphs/franklin-700.js"),
  "russo": () => import("../../logo/glyphs/russo.js"),
  "squada": () => import("../../logo/glyphs/squada.js"),
  "instrument-sans": () => import("../../logo/glyphs/instrument-sans.js"),
  "bungee": () => import("../../logo/glyphs/bungee.js"),
  "luckiest": () => import("../../logo/glyphs/luckiest.js"),
  "nunito": () => import("../../logo/glyphs/nunito.js"),
  "gloock": () => import("../../logo/glyphs/gloock.js"),
  "schibsted-700": () => import("../../logo/glyphs/schibsted-700.js"),
  "tilt-warp": () => import("../../logo/glyphs/tilt-warp.js"),
  "stencil": () => import("../../logo/glyphs/stencil.js"),
  "bricolage": () => import("../../logo/glyphs/bricolage.js"),
  "bahiana": () => import("../../logo/glyphs/bahiana.js"),
  "londrina-solid": () => import("../../logo/glyphs/londrina-solid.js"),
  "truculenta": () => import("../../logo/glyphs/truculenta.js"),
  "kanit-italic": () => import("../../logo/glyphs/kanit-italic.js"),
  "tourney": () => import("../../logo/glyphs/tourney.js"),
  "caveat-brush": () => import("../../logo/glyphs/caveat-brush.js"),
  "sedgwick": () => import("../../logo/glyphs/sedgwick.js"),
  "dynapuff": () => import("../../logo/glyphs/dynapuff.js"),
  "protest-riot": () => import("../../logo/glyphs/protest-riot.js"),
  "boogaloo": () => import("../../logo/glyphs/boogaloo.js"),
  "galindo": () => import("../../logo/glyphs/galindo.js"),
  // the logo's own tones (DESIGN-LAW 186)
  "young-serif": () => import("../../logo/glyphs/young-serif.js"),
  "zodiak": () => import("../../logo/glyphs/zodiak.js"),
  "cormorant": () => import("../../logo/glyphs/cormorant.js"),
  "instrument-serif": () => import("../../logo/glyphs/instrument-serif.js"),
  "clash": () => import("../../logo/glyphs/clash.js"),
  "roboto-slab": () => import("../../logo/glyphs/roboto-slab.js"),
  "zilla-slab": () => import("../../logo/glyphs/zilla-slab.js"),
  "kaushan": () => import("../../logo/glyphs/kaushan.js"),
};

/** the kit for a design: { "logo.svg": "<svg…", …, "README.txt": "…" } */
export async function logoFiles(design, phone = "") {
  const { kitFiles, facesOf, cleanDesign } = await engine();
  const d = cleanDesign(design), faces = {};
  for (const k of facesOf(d)) {
    const load = FACE_MODULES[k];
    if (!load) throw new Error("no face " + k);
    faces[k] = (await load()).default;
  }
  return kitFiles(d, faces, { phone: String(phone || "").replace(/[^0-9()+\-. ]/g, "").slice(0, 24) });
}

/* THE BRAND KIT'S FILES (logo/kit.js, DESIGN-LAW 180): every file of a saved kit's tier as SVG, drawn by
   the same engine the page previews with, after api.mjs has found the kit on the account. The page makes
   the PNGs, the card's print PDF and the zip from these. */
const kitModule = () => import("../../logo/kit.js");
/** a kit as the engine draws it (the server stores only this) */
export async function cleanKitSpec(spec) {
  const { cleanSpec } = await kitModule();
  if (!spec || typeof spec !== "object") throw new Error("no kit");
  return cleanSpec(spec);
}
/** { files: { id: "<svg…" }, readme, tier } for a kit and its tier */
export async function brandKitFiles(spec, tier) {
  const { kitFor, kitSvg, cleanSpec, readme } = await kitModule();
  const { facesOf } = await engine();
  const s = cleanSpec(spec), faces = {};
  for (const k of facesOf(s.design)) {
    const load = FACE_MODULES[k];
    if (!load) throw new Error("no face " + k);
    faces[k] = (await load()).default;
  }
  const t = tier === "complete" ? "complete" : "essentials", files = {};
  for (const F of kitFor(t)) files[F.id] = kitSvg(F.id, s, faces).svg;
  return { files, readme: readme(s, t, faces), tier: t };
}
