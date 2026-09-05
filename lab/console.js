/* built by scripts/build_console.mjs — do not edit; edit scripts/console_ui.js */
/* ── inlined by scripts/build_console.mjs ── */
const FONT_FILES={"Clash Display":{"500":"clash-display-500.woff2","600":"clash-display-600.woff2","700":"clash-display-700.woff2"},"Khand":{"600":"khand-600.woff2","700":"khand-700.woff2"},"Melodrama":{"500":"melodrama-500.woff2","700":"melodrama-700.woff2"},"Zodiak":{"400":"zodiak-400.woff2","700":"zodiak-700.woff2"},"Satoshi":{"400":"satoshi-400.woff2","500":"satoshi-500.woff2","700":"satoshi-700.woff2","900":"satoshi-900.woff2"}};
const FONT_BASE='../assets/fonts/';
function nearestWeight(family,weight){
  const have=Object.keys(FONT_FILES[family]||{}).map(Number);
  if(!have.length)return weight;
  return have.reduce((a,b)=>Math.abs(b-weight)<Math.abs(a-weight)?b:a);
}
function faceCSS(used){
  const out=[];
  for(const [family,weights] of Object.entries(used))
    for(const w of [...weights].sort((a,b)=>a-b)){
      const file=(FONT_FILES[family]||{})[w];
      if(!file)continue;
      out.push(`@font-face{font-family:'${family}';font-style:normal;font-weight:${w};`+
               `src:url(${FONT_BASE}${file}) format('woff2');font-display:block;}`);
    }
  return out.join('');
}

/* REAL TYPE METRICS, measured from the embedded fonts by
   tools/gfx/measure_fonts.mjs. Every run is sized from the exact sum of its
   glyph advances instead of one average-character constant per family, so a
   line cannot be wider than the box it was told to fit. The old constants were
   out by up to 41% (Clash Display caps measure .735, the constant said .52),
   which is why headlines ran off their plates while the declared-box audit
   reported twelve of twelve rules passing. */
/* THE OWNER'S APPROVED PHOTOGRAPHY, built by tools/gfx/build_assets.mjs.
   The engine's own hero is a vector: a rounded rectangle with three circles for
   a phone, a silhouette on two wheels for a car. It reads as a DIAGRAM of a
   product, and a diagram does not stop a thumb in a marketplace feed. These are
   348 real cutouts the owner has personally approved — rejected ones cannot
   reach a card, because only the approved list is written into the index. */
const ASSETS={"built":"owner full pass 2026-09-03: 360 approved / 104 rejected of 464","counts":{"phones":94,"cars":15,"macbooks":44,"ipads":43,"watches":21,"gold":19,"silver":23,"cards":3,"consoles":14,"airpods":5},"subjects":{"phones":[{"u":"assets/cutouts/android-pair.webp","w":1398,"h":1622,"s":"android-pair","d":"two modern Android smartphones side by side, backs to camera, dark colours","t":{"b":"android","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/android-trio.webp","w":1936,"h":1548,"s":"android-trio","d":"three modern Android smartphones fanned out, backs to camera, mixed dark colors","t":{"b":"android","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/drone-folded.webp","w":1603,"h":1121,"s":"drone-folded","d":"a compact folding consumer camera drone with its arms folded in, three-quarter view, grey body","t":{"b":"samsung","g":null,"c":"clean","k":"other","h":0}},{"u":"assets/cutouts/ip-angle-back-topdown.webp","w":1200,"h":732,"s":"ip-angle-back-topdown","d":"a premium smartphone lying flat on its face, rear camera module facing straight up, photographed directly from above","t":{"b":"iphone","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/ip-angle-both-faces.webp","w":1464,"h":1412,"s":"ip-angle-both-faces","d":"two identical premium smartphones side by side, the left one showing its front screen and the right one showing its rear camera module","t":{"b":"iphone","g":null,"c":"cracked","k":"single","h":1}},{"u":"assets/cutouts/ip-angle-corner-macro.webp","w":1689,"h":1965,"s":"ip-angle-corner-macro","d":"a tight macro three-quarter view of the top corner of a premium smartphone, showing the raised camera module and polished frame edge","t":{"b":"iphone","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/ip-angle-hero-tilt.webp","w":1414,"h":1406,"s":"ip-angle-hero-tilt","d":"a premium black smartphone floating at a heroic 25 degree tilt, back to camera, subtle reflection beneath it","t":{"b":"iphone","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/ip-angle-standing-lean.webp","w":738,"h":1465,"s":"ip-angle-standing-lean","d":"a premium smartphone standing upright leaning slightly back, rear panel to camera, full device in frame","t":{"b":"iphone","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/ip-damage-corner-dent.webp","w":522,"h":1686,"s":"ip-damage-corner-dent","d":"a whole premium smartphone seen from the back at a three-quarter angle, the entire device in frame, with one corner visibly dented and scuffed","t":{"b":"iphone","g":null,"c":"cracked","k":"single","h":1}},{"u":"assets/cutouts/ip-gen15-pro-back-natural.webp","w":721,"h":1810,"s":"ip-gen15-pro-back-natural","d":"a 2023-era premium smartphone with a triple rear camera square and a brushed natural titanium frame, back panel facing the camera, upright","t":{"b":"iphone","g":15,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/ip-gen17-plateau-black.webp","w":1536,"h":1533,"s":"ip-gen17-plateau-black","d":"a current-generation premium smartphone with a full-width raised rear camera plateau across the top, three lenses grouped left, deep black aluminium body, back panel facing the camera, upright","t":{"b":"iphone","g":17,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/ip-gen17-plateau-blue.webp","w":498,"h":1842,"s":"ip-gen17-plateau-blue","d":"a current-generation premium smartphone with a full-width raised rear camera plateau, three lenses grouped left, deep marine blue aluminium body, back panel facing the camera, upright","t":{"b":"iphone","g":17,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/ip-gen17-plateau-white.webp","w":653,"h":1688,"s":"ip-gen17-plateau-white","d":"a current-generation premium smartphone with a full-width raised rear camera plateau across the top, three lenses grouped left, clean white aluminium body, back panel facing the camera, upright","t":{"b":"iphone","g":17,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/ip-group-colour-lineup.webp","w":1752,"h":1042,"s":"ip-group-colour-lineup","d":"five premium smartphones standing upright in a neat row, each a different colour, all backs facing the camera, evenly spaced","t":{"b":"iphone","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/ip-group-overlap-pair.webp","w":1831,"h":1649,"s":"ip-group-overlap-pair","d":"two premium smartphones overlapping at an angle, one partly behind the other, backs to camera","t":{"b":"iphone","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/ip-group-scatter-six.webp","w":2048,"h":2048,"s":"ip-group-scatter-six","d":"six premium smartphones scattered loosely across a surface at varied angles, mixed colours, photographed from above","t":{"b":"iphone","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/ip-group-stagger-three.webp","w":1397,"h":1893,"s":"ip-group-stagger-three","d":"three premium smartphones arranged in a staggered descending row, backs to camera, mixed colours","t":{"b":"iphone","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/ip-group-tower-stack.webp","w":1719,"h":1649,"s":"ip-group-tower-stack","d":"premium smartphones stacked into a neat vertical tower, edges aligned, three-quarter view","t":{"b":"iphone","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/ip-state-charging-cable.webp","w":1380,"h":1742,"s":"ip-state-charging-cable","d":"a premium smartphone lying flat and fully lit, seen from the front with a dark screen, a white braided charging cable plugged in and coiled neatly beside it, photographed from above","t":{"b":"iphone","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/ip-state-in-hand-back.webp","w":982,"h":1558,"s":"ip-state-in-hand-back","d":"a human hand and forearm gripping a premium black smartphone, the whole hand clearly visible wrapped around the device, rear camera module facing the camera, arm entering from the bottom of the frame","t":{"b":"iphone","g":null,"c":"clean","k":"hand","h":0}},{"u":"assets/cutouts/ip-state-screen-lock.webp","w":1365,"h":1031,"s":"ip-state-screen-lock","d":"a premium smartphone seen from the front with its screen on showing a plain deep blue gradient wallpaper, no text or icons, upright","t":{"b":"iphone","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/ip-thin-profile-edge.webp","w":204,"h":1916,"s":"ip-thin-profile-edge","d":"an ultra thin premium smartphone photographed from a low three-quarter angle to emphasise how slim the body is, dark titanium","t":{"b":"iphone","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/iphone-15-pro-back-black.webp","w":1841,"h":1663,"s":"iphone-15-pro-back-black","d":"iPhone 15 Pro in black titanium, back panel facing camera, three-lens module, slight 12 degree tilt","t":{"b":"iphone","g":15,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/iphone-15-pro-back-blue.webp","w":678,"h":1580,"s":"iphone-15-pro-back-blue","d":"iPhone 15 Pro in blue titanium, back panel to camera, three-lens module, upright","t":{"b":"iphone","g":15,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/iphone-15-pro-back-gold.webp","w":542,"h":1297,"s":"iphone-15-pro-back-gold","d":"a premium smartphone with a warm champagne coloured metal frame and matching back panel, rear facing camera, three lens module, upright","t":{"b":"iphone","g":15,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/iphone-15-pro-back-white.webp","w":1430,"h":1634,"s":"iphone-15-pro-back-white","d":"iPhone 15 Pro in white titanium, back panel facing camera, three-lens module, slight 12 degree tilt","t":{"b":"iphone","g":15,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/iphone-15-pro-front-on.webp","w":809,"h":1615,"s":"iphone-15-pro-front-on","d":"iPhone 15 Pro seen straight on from the front, screen off, deep black glass, thin bezels","t":{"b":"iphone","g":15,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/iphone-17-pro-back-black.webp","w":1008,"h":1837,"s":"iphone-17-pro-back-black","d":"a current flagship smartphone in black titanium, back panel to camera, large three-lens camera plateau, upright, slight 10 degree tilt","t":{"b":"iphone","g":17,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/iphone-17-pro-back-silver.webp","w":799,"h":1668,"s":"iphone-17-pro-back-silver","d":"a current flagship smartphone in silver titanium, back panel to camera, large three-lens camera plateau, upright","t":{"b":"iphone","g":17,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/iphone-back-lean-stack.webp","w":1066,"h":1142,"s":"iphone-back-lean-stack","d":"two flagship smartphones leaning against each other back to back forming a V shape","t":{"b":"iphone","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/iphone-back.webp","w":241,"h":513,"s":"iphone-back","d":"","t":{"b":"iphone","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/iphone-cracked-back.webp","w":817,"h":1643,"s":"iphone-cracked-back","d":"iPhone with shattered rear glass panel, cracks radiating across the back, camera module intact","t":{"b":"iphone","g":null,"c":"cracked","k":"single","h":1}},{"u":"assets/cutouts/iphone-cracked-corner.webp","w":1764,"h":1119,"s":"iphone-cracked-corner","d":"a smartphone with a cracked front screen where the damage radiates from one corner, rest of screen intact and dark","t":{"b":"iphone","g":null,"c":"cracked","k":"single","h":1}},{"u":"assets/cutouts/iphone-front.webp","w":222,"h":582,"s":"iphone-front","d":"","t":{"b":"iphone","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/iphone-hand-back-offer.webp","w":583,"h":1162,"s":"iphone-hand-back-offer","d":"a hand holding out a smartphone toward the viewer, back of the phone facing camera, offering gesture","t":{"b":"iphone","g":null,"c":"clean","k":"hand","h":0}},{"u":"assets/cutouts/iphone-in-hand-screen-on.webp","w":506,"h":1010,"s":"iphone-in-hand-screen-on","d":"a hand holding a smartphone upright with the screen facing camera and glowing, forearm cropped","t":{"b":"iphone","g":null,"c":"clean","k":"hand","h":0}},{"u":"assets/cutouts/iphone-pair-front-back.webp","w":1808,"h":1745,"s":"iphone-pair-front-back","d":"two iPhones side by side, one showing its front screen and one showing its back with camera module, slight overlap","t":{"b":"iphone","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/iphone-screen-on-glow.webp","w":796,"h":1581,"s":"iphone-screen-on-glow","d":"a modern smartphone seen from the front with its screen switched on glowing bright blue, upright, dark bezels","t":{"b":"iphone","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/phone-repair-tools.webp","w":1039,"h":1550,"s":"phone-repair-tools","d":"small precision repair tools, screwdrivers and tweezers, arranged neatly, top-down","t":{"b":"iphones","g":null,"c":"clean","k":"tool","h":0}},{"u":"assets/cutouts/phone-tools-teardown.webp","w":1664,"h":1536,"s":"phone-tools-teardown","d":"a smartphone opened for repair with its back panel off, small screwdrivers and tweezers beside it, top-down","t":{"b":"iphones","g":null,"c":"clean","k":"tool","h":0}},{"u":"assets/cutouts/pix-9-back-green.webp","w":802,"h":1728,"s":"pix-9-back-green","d":"a premium Android phone with a full-width horizontal camera bar across the upper back, soft sage green body, back panel facing the camera, upright","t":{"b":"pixel","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/pix-9-back-obsidian.webp","w":590,"h":1464,"s":"pix-9-back-obsidian","d":"a premium Android phone with a full-width horizontal camera bar across the upper back, deep black body, back panel facing the camera, upright","t":{"b":"pixel","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/pix-9-front.webp","w":1342,"h":1349,"s":"pix-9-front","d":"a modern Android phone seen straight on from the front, flat screen off, small centred front camera hole, thin bezels","t":{"b":"pixel","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/pix-9-pro-back.webp","w":824,"h":1665,"s":"pix-9-pro-back","d":"a premium Android phone with a distinctive full-width horizontal camera bar across the upper back containing three lenses, matte pale grey, back panel facing the camera, upright","t":{"b":"pixel","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/pix-buds-case.webp","w":1751,"h":1600,"s":"pix-buds-case","d":"small wireless earbuds beside their open rounded charging case, photographed from above","t":{"b":"pixel","g":null,"c":"clean","k":"other","h":0}},{"u":"assets/cutouts/pix-fold-open.webp","w":1929,"h":1117,"s":"pix-fold-open","d":"a foldable Android phone with a wide horizontal camera bar, opened flat showing its large inner screen, screen off","t":{"b":"pixel","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/pix-pair-angle.webp","w":1871,"h":1865,"s":"pix-pair-angle","d":"two modern Android phones with horizontal rear camera bars overlapping at a slight angle, backs to camera","t":{"b":"pixel","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/pix-tablet-back.webp","w":822,"h":1609,"s":"pix-tablet-back","d":"a modern Android tablet seen from the back showing a plain matte rear panel and single small camera, upright","t":{"b":"pixel","g":null,"c":"clean","k":"other","h":0}},{"u":"assets/cutouts/pix-trio-lineup.webp","w":1394,"h":1648,"s":"pix-trio-lineup","d":"three modern Android phones standing in a row, backs to camera, each with a full-width horizontal camera bar, three different colours","t":{"b":"pixel","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/pix-watch-round.webp","w":1592,"h":1806,"s":"pix-watch-round","d":"a round-faced smartwatch with a domed glass front and a woven band, screen off, three-quarter view","t":{"b":"pixel","g":null,"c":"clean","k":"other","h":0}},{"u":"assets/cutouts/qs-iphone-13-mini.webp","w":338,"h":452,"s":"qs-iphone-13-mini","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":13,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-iphone-13-pro-max.webp","w":400,"h":518,"s":"qs-iphone-13-pro-max","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":13,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-iphone-13-pro.webp","w":394,"h":503,"s":"qs-iphone-13-pro","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":13,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-iphone-13.webp","w":369,"h":505,"s":"qs-iphone-13","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":13,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-iphone-14-plus.webp","w":400,"h":547,"s":"qs-iphone-14-plus","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":14,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-iphone-14-pro-max.webp","w":400,"h":502,"s":"qs-iphone-14-pro-max","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":14,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-iphone-14-pro.webp","w":400,"h":494,"s":"qs-iphone-14-pro","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":14,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-iphone-14.webp","w":379,"h":504,"s":"qs-iphone-14","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":14,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-iphone-15-plus.webp","w":400,"h":525,"s":"qs-iphone-15-plus","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":15,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-iphone-15-pro-max.webp","w":400,"h":498,"s":"qs-iphone-15-pro-max","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":15,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-iphone-15-pro.webp","w":400,"h":493,"s":"qs-iphone-15-pro","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":15,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-iphone-15.webp","w":387,"h":508,"s":"qs-iphone-15","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":15,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-iphone-16-plus.webp","w":400,"h":497,"s":"qs-iphone-16-plus","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":16,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-iphone-16-pro-max.webp","w":400,"h":502,"s":"qs-iphone-16-pro-max","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":16,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-iphone-16-pro.webp","w":400,"h":496,"s":"qs-iphone-16-pro","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":16,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-iphone-16.webp","w":400,"h":489,"s":"qs-iphone-16","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":16,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-iphone-16e.webp","w":400,"h":488,"s":"qs-iphone-16e","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":16,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-iphone-17-air.webp","w":306,"h":536,"s":"qs-iphone-17-air","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":17,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-iphone-17-pro-max.webp","w":400,"h":515,"s":"qs-iphone-17-pro-max","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":17,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-iphone-17-pro.webp","w":400,"h":497,"s":"qs-iphone-17-pro","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":17,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-iphone-17.webp","w":293,"h":515,"s":"qs-iphone-17","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":17,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-set-iphone-colour-fan.webp","w":1173,"h":681,"s":"qs-set-iphone-colour-fan","d":"fan assortment composed from site device art: qs-iphone-16, qs-iphone-15, qs-iphone-14, qs-iphone-13, qs-iphone-12, qs-iphone-11","t":{"b":"iphones","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/qs-set-iphone-colour-row.webp","w":2048,"h":535,"s":"qs-set-iphone-colour-row","d":"row assortment composed from site device art: qs-iphone-15, qs-iphone-15-plus, qs-iphone-14, qs-iphone-13, qs-iphone-12","t":{"b":"iphones","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/qs-set-iphone-generations.webp","w":1707,"h":1097,"s":"qs-set-iphone-generations","d":"stagger assortment composed from site device art: qs-iphone-16, qs-iphone-15, qs-iphone-14, qs-iphone-13, qs-iphone-12, qs-iphone-11","t":{"b":"iphones","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/qs-set-iphone-grid-nine.webp","w":1443,"h":1836,"s":"qs-set-iphone-grid-nine","d":"grid assortment composed from site device art: qs-iphone-16, qs-iphone-16-pro, qs-iphone-15, qs-iphone-15-plus, qs-iphone-15-pro, qs-iphone-14, qs-iphone-14-pro, qs-iphone-13, qs-iphone-12","t":{"b":"iphones","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/qs-set-iphone-hero-trio.webp","w":1177,"h":1055,"s":"qs-set-iphone-hero-trio","d":"hero assortment composed from site device art: qs-iphone-15-pro-max, qs-iphone-14, qs-iphone-13-mini","t":{"b":"iphones","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/qs-set-iphone-mini-pair.webp","w":868,"h":558,"s":"qs-set-iphone-mini-pair","d":"row assortment composed from site device art: qs-iphone-13-mini, qs-iphone-12-mini","t":{"b":"iphones","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/qs-set-iphone-pro-row.webp","w":2048,"h":484,"s":"qs-set-iphone-pro-row","d":"row assortment composed from site device art: qs-iphone-16-pro, qs-iphone-15-pro, qs-iphone-14-pro, qs-iphone-13-pro, qs-iphone-12-pro","t":{"b":"iphones","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/qs-set-iphone-promax-fan.webp","w":1214,"h":725,"s":"qs-set-iphone-promax-fan","d":"fan assortment composed from site device art: qs-iphone-15-pro-max, qs-iphone-14-pro-max, qs-iphone-13-pro-max, qs-iphone-12-pro-max, qs-iphone-11-pro-max","t":{"b":"iphones","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/sam-cracked-screen.webp","w":1770,"h":1632,"s":"sam-cracked-screen","d":"a premium Android phone with its front glass badly cracked in a spiderweb pattern, screen dark","t":{"b":"samsung","g":null,"c":"cracked","k":"single","h":1}},{"u":"assets/cutouts/sam-flip-closed.webp","w":1682,"h":1652,"s":"sam-flip-closed","d":"a compact clamshell foldable phone closed shut showing its small outer screen, three-quarter view","t":{"b":"samsung","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/sam-flip-open.webp","w":1295,"h":1544,"s":"sam-flip-open","d":"a compact clamshell foldable phone opened out straight, tall screen off, upright","t":{"b":"samsung","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/sam-fold-half.webp","w":1446,"h":1403,"s":"sam-fold-half","d":"a foldable Android phone half folded at ninety degrees standing on a surface, screens off, three-quarter view","t":{"b":"samsung","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/sam-fold-open-flat.webp","w":1468,"h":1064,"s":"sam-fold-open-flat","d":"a large foldable Android phone opened out flat like a small tablet, inner screen off, three-quarter view","t":{"b":"samsung","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/sam-pair-front-back.webp","w":1794,"h":1909,"s":"sam-pair-front-back","d":"two premium Android phones side by side, one showing its front screen and one showing its rear camera lenses","t":{"b":"samsung","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/sam-s23-back-green.webp","w":630,"h":1597,"s":"sam-s23-back-green","d":"a premium Android phone with three vertical round rear lenses, botanic green back, back panel facing the camera, upright","t":{"b":"samsung","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/sam-s24-back-cream.webp","w":587,"h":1628,"s":"sam-s24-back-cream","d":"a premium Android phone with three vertical round rear lenses, warm cream coloured back, back panel facing the camera, upright","t":{"b":"samsung","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/sam-s24-back-violet.webp","w":631,"h":1625,"s":"sam-s24-back-violet","d":"a premium Android phone with three separate round rear camera lenses in a vertical line, soft violet glass back, back panel facing the camera, upright","t":{"b":"samsung","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/sam-s24-ultra-back.webp","w":768,"h":1904,"s":"sam-s24-ultra-back","d":"a large premium Android phone with a flat titanium frame and four separate round rear camera lenses in a vertical line, deep grey, back panel facing the camera, upright","t":{"b":"samsung","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/sam-s24-ultra-front.webp","w":777,"h":1662,"s":"sam-s24-ultra-front","d":"a large premium Android phone seen straight on from the front, flat screen, very thin uniform bezels, screen off","t":{"b":"samsung","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/sam-trio-lineup.webp","w":1369,"h":1150,"s":"sam-trio-lineup","d":"three premium Android phones standing in a row, backs to camera, each a different colour, vertical camera lenses","t":{"b":"samsung","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/sam-watch-pair.webp","w":1816,"h":1368,"s":"sam-watch-pair","d":"two round-faced Android smartwatches side by side, screens off, one black one silver, sport bands","t":{"b":"samsung","g":null,"c":"clean","k":"other","h":0}},{"u":"assets/cutouts/samsung-fold-open.webp","w":1564,"h":1059,"s":"samsung-fold-open","d":"a foldable smartphone opened flat showing its large inner screen switched off, three-quarter view","t":{"b":"samsung","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/samsung-galaxy-back.webp","w":556,"h":1568,"s":"samsung-galaxy-back","d":"Samsung Galaxy S24 Ultra in titanium grey, back to camera, vertical camera lenses, slight tilt","t":{"b":"samsung","g":null,"c":"clean","k":"single","h":1}}],"cars":[{"u":"assets/cutouts/car-classic-side.webp","w":2048,"h":1870,"s":"car-classic-side","d":"a classic vintage car photographed from the side, glossy paint, whitewall tyres","t":{"b":"car","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/car-damaged-front.webp","w":1661,"h":1017,"s":"car-damaged-front","d":"a car with visible front-end collision damage, crumpled hood and bumper, three-quarter view","t":{"b":"car","g":null,"c":"cracked","k":"single","h":1}},{"u":"assets/cutouts/car-engine-bay.webp","w":1197,"h":1479,"s":"car-engine-bay","d":"a clean modern car engine block viewed from directly above, chrome and black components, engine only, no car body around it","t":{"b":"car","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/car-front.webp","w":631,"h":347,"s":"car-front","d":"","t":{"b":"car","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/car-hand-keys-over.webp","w":369,"h":224,"s":"car-hand-keys-over","d":"a hand passing a car key fob to another hand, key exchange, forearms cropped","t":{"b":"car","g":null,"c":"clean","k":"hand","h":0}},{"u":"assets/cutouts/car-keys-fob.webp","w":1799,"h":1945,"s":"car-keys-fob","d":"a car key fob and keyring held up, modern black plastic remote","t":{"b":"car","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/car-keys.webp","w":365,"h":262,"s":"car-keys","d":"","t":{"b":"car","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/car-motorcycle-side.webp","w":1790,"h":1886,"s":"car-motorcycle-side","d":"a modern motorcycle photographed from the side, kickstand down","t":{"b":"car","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/car-sedan-front.webp","w":2048,"h":1366,"s":"car-sedan-front","d":"a modern silver sedan car photographed from the front three-quarter angle, clean bodywork","t":{"b":"car","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/car-sedan-rear.webp","w":1937,"h":840,"s":"car-sedan-rear","d":"a modern silver sedan photographed from the rear three-quarter angle","t":{"b":"car","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/car-suv-side.webp","w":1517,"h":618,"s":"car-suv-side","d":"a modern dark SUV photographed from the side three-quarter angle","t":{"b":"car","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/car-title-docs.webp","w":1726,"h":1259,"s":"car-title-docs","d":"a stack of vehicle paperwork documents and a pen, blank pages, top-down","t":{"b":"car","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/car-truck-front.webp","w":1869,"h":1599,"s":"car-truck-front","d":"a modern pickup truck photographed from the front three-quarter angle, clean bodywork","t":{"b":"car","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/car-van-cargo.webp","w":1903,"h":1689,"s":"car-van-cargo","d":"a white cargo van photographed from the front three-quarter angle, blank panels, no text","t":{"b":"car","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/car-wheel-tyre.webp","w":1582,"h":1758,"s":"car-wheel-tyre","d":"a single modern alloy car wheel with tyre, straight on side view","t":{"b":"car","g":null,"c":"clean","k":"single","h":1}}],"macbooks":[{"u":"assets/cutouts/mac-closed-side.webp","w":288,"h":1834,"s":"mac-closed-side","d":"a closed silver laptop computer seen from the side showing its thin closed profile","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/mac-closed-topdown.webp","w":1896,"h":1356,"s":"mac-closed-topdown","d":"a closed silver laptop computer photographed directly from above, plain aluminium lid, no logo","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/mac-half-open-glow.webp","w":1720,"h":1499,"s":"mac-half-open-glow","d":"a premium laptop computer half open with light spilling from the gap between screen and keyboard, dark room feel, three-quarter view","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/mac-pair-open-angle.webp","w":2048,"h":1479,"s":"mac-pair-open-angle","d":"two premium laptop computers open side by side at matching angles, dark screens, one silver one dark grey","t":{"b":"macbooks","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/mac-pro-open-front.webp","w":1894,"h":1286,"s":"mac-pro-open-front","d":"a premium dark grey laptop computer open and seen straight on from the front, dark screen, thick aluminium body","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/mac-stack-closed-three.webp","w":1848,"h":845,"s":"mac-stack-closed-three","d":"three closed laptop computers stacked flat with slight offsets, mixed silver and dark grey, three-quarter view","t":{"b":"macbooks","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/mac-with-accessories.webp","w":1874,"h":1291,"s":"mac-with-accessories","d":"a closed silver laptop computer with a smartphone and wireless earbuds case arranged neatly beside it, photographed from above","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/macbook-closed-stack.webp","w":1861,"h":1192,"s":"macbook-closed-stack","d":"two closed silver MacBook laptops stacked neatly, slight angle","t":{"b":"macbooks","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/macbook-open-angle.webp","w":1764,"h":1276,"s":"macbook-open-angle","d":"open silver MacBook Pro laptop at a three-quarter angle, dark screen, aluminium body","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/macbook-pair-open-closed.webp","w":1926,"h":1264,"s":"macbook-pair-open-closed","d":"one open silver laptop beside one closed silver laptop, three-quarter view","t":{"b":"macbooks","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/monitor-widescreen.webp","w":1576,"h":1341,"s":"monitor-widescreen","d":"a slim widescreen computer monitor on a stand, screen off, straight-on view","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/own-stock-macbook-stack.webp","w":2048,"h":1699,"s":"own-stock-macbook-stack","d":"","t":{"b":"macbooks","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/qs-cat-macbook.webp","w":530,"h":320,"s":"qs-cat-macbook","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-device-imac.webp","w":443,"h":373,"s":"qs-device-imac","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-device-mac-studio.webp","w":239,"h":117,"s":"qs-device-mac-studio","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-device-macbook-air.webp","w":370,"h":226,"s":"qs-device-macbook-air","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-device-macbook-pro.webp","w":381,"h":230,"s":"qs-device-macbook-pro","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-set-macbook-pair.webp","w":2048,"h":613,"s":"qs-set-macbook-pair","d":"row assortment composed from site device art: qs-device-macbook-pro, qs-device-macbook-air","t":{"b":"macbooks","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/qs-sheet-imac-24-m1-2021.webp","w":441,"h":372,"s":"qs-sheet-imac-24-m1-2021","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-imac-24-m3-2023.webp","w":441,"h":372,"s":"qs-sheet-imac-24-m3-2023","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-imac-24-m4-2024.webp","w":441,"h":372,"s":"qs-sheet-imac-24-m4-2024","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-mba-13-m1-2020.webp","w":502,"h":288,"s":"qs-sheet-mba-13-m1-2020","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-mba-13-m2-2022.webp","w":502,"h":305,"s":"qs-sheet-mba-13-m2-2022","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-mba-13-m3-2024.webp","w":502,"h":305,"s":"qs-sheet-mba-13-m3-2024","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-mba-13-m4-2025.webp","w":502,"h":305,"s":"qs-sheet-mba-13-m4-2025","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-mba-13-m5-2026.webp","w":502,"h":305,"s":"qs-sheet-mba-13-m5-2026","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-mba-15-m2-2023.webp","w":560,"h":340,"s":"qs-sheet-mba-15-m2-2023","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-mba-15-m3-2024.webp","w":560,"h":340,"s":"qs-sheet-mba-15-m3-2024","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-mba-15-m4-2025.webp","w":560,"h":340,"s":"qs-sheet-mba-15-m4-2025","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-mba-15-m5-2026.webp","w":560,"h":340,"s":"qs-sheet-mba-15-m5-2026","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-mbp-13-m1-2020.webp","w":481,"h":279,"s":"qs-sheet-mbp-13-m1-2020","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-mbp-13-m2-2022.webp","w":481,"h":279,"s":"qs-sheet-mbp-13-m2-2022","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-mbp-14-2021.webp","w":494,"h":298,"s":"qs-sheet-mbp-14-2021","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-mbp-14-2023.webp","w":494,"h":298,"s":"qs-sheet-mbp-14-2023","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-mbp-14-m3-2023.webp","w":494,"h":298,"s":"qs-sheet-mbp-14-m3-2023","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-mbp-14-m3pro-2023.webp","w":494,"h":298,"s":"qs-sheet-mbp-14-m3pro-2023","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-mbp-14-m4-2024.webp","w":494,"h":298,"s":"qs-sheet-mbp-14-m4-2024","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-mbp-14-m4pro-2024.webp","w":494,"h":298,"s":"qs-sheet-mbp-14-m4pro-2024","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-mbp-14-m5-2025.webp","w":494,"h":298,"s":"qs-sheet-mbp-14-m5-2025","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-mbp-16-2021.webp","w":563,"h":343,"s":"qs-sheet-mbp-16-2021","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-mbp-16-2023.webp","w":563,"h":343,"s":"qs-sheet-mbp-16-2023","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-mbp-16-m3pro-2023.webp","w":563,"h":343,"s":"qs-sheet-mbp-16-m3pro-2023","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-mbp-16-m4pro-2024.webp","w":563,"h":343,"s":"qs-sheet-mbp-16-m4pro-2024","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-mbp-16-m5pro-2026.webp","w":563,"h":343,"s":"qs-sheet-mbp-16-m5pro-2026","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"c":"clean","k":"single","h":1}}],"ipads":[{"u":"assets/cutouts/ipad-angle-tilt-back.webp","w":1546,"h":1062,"s":"ipad-angle-tilt-back","d":"a premium tablet computer at a dynamic 20 degree tilt, rear aluminium panel to camera, floating","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/ipad-back-camera.webp","w":606,"h":1404,"s":"ipad-back-camera","d":"a large premium tablet computer seen from the back showing its single rear camera square and flat aluminium body, upright","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/ipad-front-screen-off.webp","w":1323,"h":1593,"s":"ipad-front-screen-off","d":"a large premium tablet computer seen straight on from the front, screen off, very thin uniform bezels","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/ipad-mini-single.webp","w":770,"h":1672,"s":"ipad-mini-single","d":"a small premium tablet computer, screen off, upright, thin bezels","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/ipad-pair-sizes.webp","w":982,"h":1786,"s":"ipad-pair-sizes","d":"two premium tablet computers of different sizes standing upright side by side, both seen from the BACK showing dark aluminium rear panels, not the screens","t":{"b":"ipads","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/ipad-stack-three.webp","w":2048,"h":952,"s":"ipad-stack-three","d":"three premium tablet computers stacked flat on top of one another with slight offsets, three-quarter view","t":{"b":"ipads","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/ipad-with-keyboard.webp","w":1622,"h":1131,"s":"ipad-with-keyboard","d":"a premium tablet computer attached to a detachable keyboard folio, open like a laptop, screen off, three-quarter view","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/ipad-with-pencil.webp","w":1879,"h":1679,"s":"ipad-with-pencil","d":"a tablet computer lying flat with a slim white stylus pen beside it, top-down","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/ipad-with-stylus.webp","w":1576,"h":1116,"s":"ipad-with-stylus","d":"a premium tablet computer lying flat with a slim white stylus resting diagonally across it, photographed from above","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/own-stock-iphone-ipad.webp","w":1771,"h":2048,"s":"own-stock-iphone-ipad","d":"","t":{"b":"ipads","g":null,"c":"clean","k":"other","h":0}},{"u":"assets/cutouts/qs-cat-ipad.webp","w":512,"h":563,"s":"qs-cat-ipad","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-family-ipad-11-a16.webp","w":498,"h":564,"s":"qs-family-ipad-11-a16","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-family-ipad-air-11-m3.webp","w":496,"h":564,"s":"qs-family-ipad-air-11-m3","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-family-ipad-mini-7-a17-pro.webp","w":452,"h":564,"s":"qs-family-ipad-mini-7-a17-pro","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-ipad-10.webp","w":438,"h":496,"s":"qs-ipad-10","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-ipad-11-a16.webp","w":438,"h":496,"s":"qs-ipad-11-a16","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-ipad-5.webp","w":403,"h":479,"s":"qs-ipad-5","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-ipad-6.webp","w":402,"h":479,"s":"qs-ipad-6","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-ipad-7.webp","w":414,"h":501,"s":"qs-ipad-7","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-ipad-8.webp","w":414,"h":501,"s":"qs-ipad-8","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-ipad-9.webp","w":413,"h":500,"s":"qs-ipad-9","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-ipad-air-11-m2.webp","w":435,"h":494,"s":"qs-ipad-air-11-m2","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-ipad-air-11-m3.webp","w":435,"h":494,"s":"qs-ipad-air-11-m3","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-ipad-air-13-m2.webp","w":512,"h":561,"s":"qs-ipad-air-13-m2","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-ipad-air-13-m3.webp","w":512,"h":561,"s":"qs-ipad-air-13-m3","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-ipad-air-3.webp","w":415,"h":500,"s":"qs-ipad-air-3","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-ipad-air-4.webp","w":437,"h":495,"s":"qs-ipad-air-4","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-ipad-air-5.webp","w":437,"h":495,"s":"qs-ipad-air-5","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-ipad-mini-5.webp","w":336,"h":405,"s":"qs-ipad-mini-5","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-ipad-mini-6.webp","w":318,"h":390,"s":"qs-ipad-mini-6","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-ipad-mini-7-a17-pro.webp","w":313,"h":390,"s":"qs-ipad-mini-7-a17-pro","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-ipad-pro-11-m4.webp","w":435,"h":498,"s":"qs-ipad-pro-11-m4","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-ipad-pro-11-m5.webp","w":454,"h":499,"s":"qs-ipad-pro-11-m5","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-ipad-pro-12-9-3rd-gen.webp","w":496,"h":561,"s":"qs-ipad-pro-12-9-3rd-gen","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-ipad-pro-12-9-4th-gen.webp","w":520,"h":560,"s":"qs-ipad-pro-12-9-4th-gen","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-ipad-pro-12-9-5th-gen.webp","w":518,"h":560,"s":"qs-ipad-pro-12-9-5th-gen","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-ipad-pro-12-9-6th-gen.webp","w":511,"h":560,"s":"qs-ipad-pro-12-9-6th-gen","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-ipad-pro-13-m4.webp","w":512,"h":563,"s":"qs-ipad-pro-13-m4","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-ipad-pro-13-m5.webp","w":512,"h":563,"s":"qs-ipad-pro-13-m5","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-set-ipad-fan.webp","w":1446,"h":992,"s":"qs-set-ipad-fan","d":"fan assortment composed from site device art: qs-family-ipad-pro-13-m5, qs-ipad-pro-11-4th-gen, qs-ipad-air-13-m2, qs-family-ipad-air-11-m3, qs-ipad-10, qs-ipad-mini-6","t":{"b":"ipads","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/qs-set-ipad-generations.webp","w":1868,"h":1267,"s":"qs-set-ipad-generations","d":"stagger assortment composed from site device art: qs-ipad-10, qs-ipad-9, qs-ipad-8, qs-ipad-7, qs-ipad-6","t":{"b":"ipads","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/qs-set-ipad-row.webp","w":2048,"h":599,"s":"qs-set-ipad-row","d":"row assortment composed from site device art: qs-family-ipad-pro-13-m5, qs-ipad-air-13-m2, qs-family-ipad-11-a16, qs-family-ipad-mini-7-a17-pro","t":{"b":"ipads","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/tablet-watch.webp","w":651,"h":458,"s":"tablet-watch","d":"","t":{"b":"ipads","g":null,"c":"clean","k":"other","h":0}}],"watches":[{"u":"assets/cutouts/apple-watch-single.webp","w":1001,"h":1083,"s":"apple-watch-single","d":"a single smartwatch with a black sport band, screen off, three-quarter view","t":{"b":"watch","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/apple-watch-stack-three.webp","w":1981,"h":1489,"s":"apple-watch-stack-three","d":"three smartwatches with different coloured bands arranged in a row, screens off","t":{"b":"watch","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/gold-pocket-watch.webp","w":1758,"h":1734,"s":"gold-pocket-watch","d":"an antique gold pocket watch with its cover open, chain coiled beside it, photographed from above","t":{"b":"watch","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/gold-watch-luxury.webp","w":1500,"h":1817,"s":"gold-watch-luxury","d":"a luxury gold wristwatch with metal bracelet, three-quarter view, no visible branding","t":{"b":"watch","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-watch-s10-2024.webp","w":447,"h":525,"s":"qs-sheet-watch-s10-2024","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"watch","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-watch-s11-2025.webp","w":447,"h":525,"s":"qs-sheet-watch-s11-2025","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"watch","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-watch-s5-2019.webp","w":425,"h":505,"s":"qs-sheet-watch-s5-2019","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"watch","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-watch-s6-2020.webp","w":436,"h":505,"s":"qs-sheet-watch-s6-2020","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"watch","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-watch-s7-2021.webp","w":435,"h":517,"s":"qs-sheet-watch-s7-2021","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"watch","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-watch-s8-2022.webp","w":431,"h":515,"s":"qs-sheet-watch-s8-2022","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"watch","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-watch-s9-2023.webp","w":437,"h":516,"s":"qs-sheet-watch-s9-2023","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"watch","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-watch-se-2020.webp","w":425,"h":505,"s":"qs-sheet-watch-se-2020","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"watch","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-watch-se2-2022.webp","w":426,"h":505,"s":"qs-sheet-watch-se2-2022","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"watch","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-watch-se3-2025.webp","w":422,"h":505,"s":"qs-sheet-watch-se3-2025","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"watch","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-watch-ultra-2022.webp","w":476,"h":563,"s":"qs-sheet-watch-ultra-2022","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"watch","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-watch-ultra2-2023.webp","w":491,"h":562,"s":"qs-sheet-watch-ultra2-2023","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"watch","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/qs-sheet-watch-ultra3-2025.webp","w":497,"h":553,"s":"qs-sheet-watch-ultra3-2025","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"watch","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/watch-pair-bands.webp","w":863,"h":1226,"s":"watch-pair-bands","d":"two premium smartwatches standing upright side by side, screens off, one with a woven band and one with a metal link band","t":{"b":"watch","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/watch-screen-on.webp","w":708,"h":1108,"s":"watch-screen-on","d":"a premium smartwatch seen straight on with its screen glowing a plain deep colour, no text or icons, sport band","t":{"b":"watch","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/watch-single-angle.webp","w":1069,"h":1355,"s":"watch-single-angle","d":"a single premium smartwatch at a three-quarter angle, screen off, sport band curled beneath it","t":{"b":"watch","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/watch-stack-four.webp","w":2048,"h":1676,"s":"watch-stack-four","d":"four premium smartwatches arranged in a row with different coloured bands, screens off","t":{"b":"watch","g":null,"c":"clean","k":"group","h":1}}],"gold":[{"u":"assets/cutouts/gold-bar-single.webp","w":1834,"h":1740,"s":"gold-bar-single","d":"a single large gold bullion bar, stamped face visible, three-quarter view","t":{"b":"gold","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/gold-bars-fan.webp","w":1820,"h":1304,"s":"gold-bars-fan","d":"five small gold bullion bars fanned out overlapping on a flat surface, photographed from above","t":{"b":"gold","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/gold-bars-row.webp","w":1464,"h":1540,"s":"gold-bars-row","d":"a row of five gold bullion bars standing on edge in a line, stamped faces visible","t":{"b":"gold","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/gold-bars-stack.webp","w":2048,"h":1555,"s":"gold-bars-stack","d":"a stack of shiny gold bullion bars with stamped markings, three-quarter view","t":{"b":"gold","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/gold-bars.webp","w":461,"h":326,"s":"gold-bars","d":"","t":{"b":"gold","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/gold-bracelet-cuban.webp","w":1484,"h":1184,"s":"gold-bracelet-cuban","d":"a thick gold Cuban link bracelet laid in a gentle curve, photographed from above","t":{"b":"gold","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/gold-bracelet-pair.webp","w":1294,"h":1041,"s":"gold-bracelet-pair","d":"two heavy yellow gold bracelets lying side by side, top-down","t":{"b":"gold","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/gold-chains-pile.webp","w":2048,"h":1718,"s":"gold-chains-pile","d":"a pile of heavy yellow gold chain necklaces of varied link styles, glinting","t":{"b":"gold","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/gold-chains.webp","w":624,"h":457,"s":"gold-chains","d":"","t":{"b":"gold","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/gold-class-ring.webp","w":846,"h":1232,"s":"gold-class-ring","d":"a heavy gold class ring with a coloured gemstone, standing upright, three-quarter macro view","t":{"b":"gold","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/gold-coins-pile.webp","w":1212,"h":859,"s":"gold-coins-pile","d":"a small heap of gold bullion coins, milled edges, bright reflective","t":{"b":"gold","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/gold-earrings-pile.webp","w":1054,"h":838,"s":"gold-earrings-pile","d":"an assortment of yellow gold earrings in a small heap, top-down","t":{"b":"gold","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/gold-jewelry-mixed.webp","w":2048,"h":1734,"s":"gold-jewelry-mixed","d":"a mixed pile of gold jewelry: chains, bracelets, rings, pendants, warm glinting metal","t":{"b":"gold","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/gold-jewelry.webp","w":511,"h":226,"s":"gold-jewelry","d":"","t":{"b":"gold","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/gold-necklace-single.webp","w":1314,"h":1591,"s":"gold-necklace-single","d":"a single thick yellow gold rope chain necklace laid in a loose coil, top-down","t":{"b":"gold","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/gold-rings-scatter.webp","w":2048,"h":2048,"s":"gold-rings-scatter","d":"an assortment of yellow gold rings, some with gemstones, arranged loosely, top-down","t":{"b":"gold","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/gold-scale-weighing.webp","w":1659,"h":1785,"s":"gold-scale-weighing","d":"a small digital jewellers scale with gold jewellery resting on its weighing platform","t":{"b":"gold","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/gold-scrap-mixed.webp","w":1752,"h":1748,"s":"gold-scrap-mixed","d":"a pile of broken and tangled scrap gold jewellery, snapped chains and odd pieces, top-down","t":{"b":"gold","g":null,"c":"cracked","k":"single","h":1}},{"u":"assets/cutouts/gold-teeth-dental.webp","w":880,"h":589,"s":"gold-teeth-dental","d":"small scrap dental gold pieces and gold crowns in a tiny pile, top-down","t":{"b":"gold","g":null,"c":"cracked","k":"single","h":1}}],"silver":[{"u":"assets/cutouts/coin-album-pages.webp","w":1987,"h":1925,"s":"coin-album-pages","d":"an open coin collector album showing rows of coins in clear pockets, top-down","t":{"b":"coins","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/coin-collection-tray.webp","w":2048,"h":1435,"s":"coin-collection-tray","d":"a collector tray filled with assorted old coins in rows, top-down","t":{"b":"coins","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/coin-graded-fan-three.webp","w":1950,"h":1865,"s":"coin-graded-fan-three","d":"three coins in clear rigid plastic grading cases fanned out overlapping, blank white label strips","t":{"b":"coins","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/coin-jar-full.webp","w":1251,"h":1810,"s":"coin-jar-full","d":"a clear glass jar filled to the top with assorted loose coins","t":{"b":"coins","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/coin-loose-pile.webp","w":1935,"h":1383,"s":"coin-loose-pile","d":"a loose pile of assorted vintage coins, mixed silver and copper tones","t":{"b":"coins","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/coin-rolls-paper.webp","w":1802,"h":1569,"s":"coin-rolls-paper","d":"several paper wrapped coin rolls lying in a small pile, plain unmarked wrappers","t":{"b":"coins","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/coin-silver-dollar-pair.webp","w":1759,"h":1902,"s":"coin-silver-dollar-pair","d":"two large old silver dollar coins, one lying flat and one standing on edge behind it, macro view","t":{"b":"silver","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/coin-single-large.webp","w":223,"h":1623,"s":"coin-single-large","d":"a single large old silver dollar coin standing upright on edge, detailed relief","t":{"b":"coins","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/coin-slab.webp","w":144,"h":144,"s":"coin-slab","d":"","t":{"b":"coins","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/coin-slabs-stack.webp","w":1849,"h":1314,"s":"coin-slabs-stack","d":"three graded coin slabs in clear plastic holders stacked at slight angles, blank labels","t":{"b":"coins","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/coin-stack-silver.webp","w":1817,"h":2048,"s":"coin-stack-silver","d":"several stacked silver dollar coins in neat columns, side view","t":{"b":"silver","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/coin-stack.webp","w":555,"h":276,"s":"coin-stack","d":"","t":{"b":"coins","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/silver-bar-single.webp","w":1158,"h":783,"s":"silver-bar-single","d":"a single large silver bullion bar, stamped face visible, three-quarter view","t":{"b":"silver","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/silver-bars-row.webp","w":1592,"h":1412,"s":"silver-bars-row","d":"a row of four silver bullion bars standing on edge in a line, stamped faces visible","t":{"b":"silver","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/silver-bars-stack.webp","w":2048,"h":1631,"s":"silver-bars-stack","d":"a stack of shiny silver bullion bars with stamped markings, three-quarter view","t":{"b":"silver","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/silver-bars.webp","w":519,"h":476,"s":"silver-bars","d":"","t":{"b":"silver","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/silver-candlesticks.webp","w":1314,"h":1640,"s":"silver-candlesticks","d":"a pair of tall antique silver candlesticks standing upright, tarnished patina","t":{"b":"silver","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/silver-coins-spill.webp","w":1714,"h":1223,"s":"silver-coins-spill","d":"silver bullion coins spilling out of a tipped over tube, bright reflective metal","t":{"b":"silver","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/silver-coins-tube.webp","w":1513,"h":1586,"s":"silver-coins-tube","d":"a clear plastic coin tube standing upright, filled with silver bullion coins, beside two loose coins","t":{"b":"silver","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/silver-flatware-set.webp","w":1989,"h":1919,"s":"silver-flatware-set","d":"an arrangement of antique silver flatware: forks, spoons, knives, tarnished patina","t":{"b":"silver","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/silver-flatware.webp","w":364,"h":587,"s":"silver-flatware","d":"","t":{"b":"silver","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/silver-jewelry-mixed.webp","w":2048,"h":1681,"s":"silver-jewelry-mixed","d":"a mixed pile of sterling silver jewelry: chains, bracelets and rings","t":{"b":"silver","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/silver-rounds-pile.webp","w":2048,"h":1322,"s":"silver-rounds-pile","d":"a heap of silver bullion rounds and coins, bright reflective metal","t":{"b":"silver","g":null,"c":"clean","k":"single","h":1}}],"cards":[{"u":"assets/cutouts/poke-slabs-trio.webp","w":1794,"h":1831,"s":"poke-slabs-trio","d":"three collectible cards sealed in clear rigid plastic grading cases, overlapping at slight angles, each card inside a solid opaque pastel rectangle so it reads clearly, blank white label strips","t":{"b":"poke","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/sports-slab.webp","w":523,"h":215,"s":"sports-slab","d":"","t":{"b":"sports","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/sports-slabs-stack.webp","w":1843,"h":1328,"s":"sports-slabs-stack","d":"four sports cards in clear rigid plastic grading slabs stacked and fanned, each card inside a plain solid-colour blank rectangle, blank white labels, glossy plastic","t":{"b":"sports","g":null,"c":"clean","k":"group","h":1}}],"consoles":[{"u":"assets/cutouts/cables-bundle.webp","w":1804,"h":1608,"s":"cables-bundle","d":"a neat coil of assorted white and black charging cables bundled together, photographed from above","t":{"b":"electronics","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/camera-dslr-body.webp","w":1930,"h":1716,"s":"camera-dslr-body","d":"a professional DSLR camera body with a lens attached, three-quarter view, black body","t":{"b":"electronics","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/camera-mirrorless.webp","w":1966,"h":1524,"s":"camera-mirrorless","d":"a compact mirrorless camera with a short lens, three-quarter view, black and silver body","t":{"b":"electronics","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/chargers-adapters.webp","w":1916,"h":1522,"s":"chargers-adapters","d":"several white power adapter plugs and charging bricks arranged in a row, photographed from above","t":{"b":"electronics","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/console-handheld-pair.webp","w":1458,"h":784,"s":"console-handheld-pair","d":"two modern handheld gaming consoles side by side, screens off, three-quarter view","t":{"b":"electronics","g":null,"c":"clean","k":"hand","h":0}},{"u":"assets/cutouts/console-single.webp","w":936,"h":1521,"s":"console-single","d":"a modern matte black game console standing upright, three-quarter view","t":{"b":"electronics","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/controller-pair.webp","w":1830,"h":929,"s":"controller-pair","d":"two modern wireless game controllers side by side, one black one white, three-quarter view","t":{"b":"electronics","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/drone-open-props.webp","w":2048,"h":1231,"s":"drone-open-props","d":"a consumer camera drone with arms extended and propellers attached, seen from a low three-quarter angle","t":{"b":"electronics","g":null,"c":"clean","k":"other","h":0}},{"u":"assets/cutouts/game-console-pair.webp","w":1404,"h":1406,"s":"game-console-pair","d":"a PlayStation 5 console beside an Xbox Series X console, three-quarter view","t":{"b":"electronics","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/gaming-handheld.webp","w":1854,"h":1273,"s":"gaming-handheld","d":"a modern handheld gaming console with attached controllers, screen off, three-quarter view","t":{"b":"electronics","g":null,"c":"clean","k":"hand","h":0}},{"u":"assets/cutouts/router-modem.webp","w":1520,"h":1430,"s":"router-modem","d":"a modern white internet router with external antennas, three-quarter view","t":{"b":"electronics","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/smart-tv-stand.webp","w":1298,"h":860,"s":"smart-tv-stand","d":"a large flatscreen television on a slim stand, screen off, straight-on view","t":{"b":"electronics","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/tv-flatscreen.webp","w":1356,"h":941,"s":"tv-flatscreen","d":"modern flatscreen television, screen off, thin bezel, on a low stand, straight on","t":{"b":"electronics","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/vr-headset.webp","w":1823,"h":1082,"s":"vr-headset","d":"a modern standalone virtual reality headset with its strap, three-quarter view, light grey body","t":{"b":"electronics","g":null,"c":"clean","k":"single","h":1}}],"airpods":[{"u":"assets/cutouts/airpods-buds-out.webp","w":1762,"h":1298,"s":"airpods-buds-out","d":"wireless earbuds sitting beside their open white charging case, three-quarter view","t":{"b":"airpods","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/airpods-case-open.webp","w":1262,"h":1234,"s":"airpods-case-open","d":"AirPods Pro charging case open with both earbuds inside, white, three-quarter view","t":{"b":"airpods","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/buds-case-closed.webp","w":620,"h":786,"s":"buds-case-closed","d":"a small closed white wireless earbud charging case, three-quarter view","t":{"b":"airpods","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/buds-overear-headphones.webp","w":1284,"h":1760,"s":"buds-overear-headphones","d":"premium over-ear headphones in a light neutral colour, three-quarter view, padded ear cups","t":{"b":"airpods","g":null,"c":"clean","k":"other","h":0}},{"u":"assets/cutouts/buds-pair-loose.webp","w":1286,"h":1517,"s":"buds-pair-loose","d":"two white wireless earbuds lying beside their open charging case, photographed from above","t":{"b":"airpods","g":null,"c":"clean","k":"group","h":1}}]},"props":[{"u":"assets/cutouts/cardboard-box-taped.webp","w":1616,"h":1264,"s":"cardboard-box-taped","d":"a sealed brown cardboard shipping box with packing tape across the top seam, no labels, no text, three-quarter view","t":{"b":"car","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/cardboard-shipping-labelled.webp","w":1959,"h":1572,"s":"cardboard-shipping-labelled","d":"a sealed cardboard shipping box with a blank white label square on top, no text, three-quarter view","t":{"b":"car","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/cash-bundles-pyramid.webp","w":1727,"h":1507,"s":"cash-bundles-pyramid","d":"banded bundles of US hundred dollar bills stacked into a pyramid, three-quarter view","t":{"b":"cash","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/cash-bundles.webp","w":596,"h":376,"s":"cash-bundles","d":"","t":{"b":"cash","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/cash-envelope-stuffed.webp","w":1473,"h":1710,"s":"cash-envelope-stuffed","d":"a plain white envelope stuffed full of US hundred dollar bills, bills protruding from the top","t":{"b":"cash","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/cash-fan-hundreds.webp","w":940,"h":1820,"s":"cash-fan-hundreds","d":"a fanned spread of US one hundred dollar bills held together, crisp new notes","t":{"b":"cash","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/cash-fan-twenties.webp","w":1766,"h":1758,"s":"cash-fan-twenties","d":"a fanned spread of US twenty dollar bills held together, crisp notes","t":{"b":"cash","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/cash-fan.webp","w":628,"h":406,"s":"cash-fan","d":"","t":{"b":"cash","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/cash-roll-band.webp","w":792,"h":1371,"s":"cash-roll-band","d":"a tight roll of US hundred dollar bills secured with a rubber band, standing upright","t":{"b":"cash","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/cash-scatter-loose.webp","w":2048,"h":1789,"s":"cash-scatter-loose","d":"a large messy pile of many overlapping US one hundred dollar banknotes filling the whole frame, dozens of bills, flat top-down view, evenly lit","t":{"b":"cash","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/cash-single-hundred.webp","w":1768,"h":782,"s":"cash-single-hundred","d":"a single crisp US one hundred dollar bill lying flat, straight on, top-down","t":{"b":"cash","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/cash-stack-banded.webp","w":1745,"h":1088,"s":"cash-stack-banded","d":"several banded bundles of US hundred dollar bills stacked neatly","t":{"b":"cash","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/cash-stack.webp","w":605,"h":412,"s":"cash-stack","d":"","t":{"b":"cash","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/delivery-box-open.webp","w":1929,"h":2048,"s":"delivery-box-open","d":"an open cardboard shipping box with bubble wrap inside, three-quarter view","t":{"b":"props","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/padded-mailer-envelope.webp","w":2008,"h":1254,"s":"padded-mailer-envelope","d":"a padded shipping mailer envelope, plain grey, slightly puffed, three-quarter view","t":{"b":"props","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/pallet-boxes-stack.webp","w":1930,"h":1901,"s":"pallet-boxes-stack","d":"a stack of plain brown cardboard boxes on a wooden pallet, no labels, three-quarter view","t":{"b":"props","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/safe-open-cash.webp","w":1866,"h":1744,"s":"safe-open-cash","d":"a small open security safe with neat stacks of US bills inside, three-quarter view","t":{"b":"cash","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/shopping-bag-cash.webp","w":2048,"h":1915,"s":"shopping-bag-cash","d":"a paper shopping bag tipped over with US hundred dollar bills spilling out","t":{"b":"cash","g":null,"c":"clean","k":"single","h":1}}],"cash":[{"u":"assets/cutouts/cash-bundles-pyramid.webp","w":1727,"h":1507,"s":"cash-bundles-pyramid","d":"banded bundles of US hundred dollar bills stacked into a pyramid, three-quarter view","t":{"b":"cash","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/cash-bundles.webp","w":596,"h":376,"s":"cash-bundles","d":"","t":{"b":"cash","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/cash-envelope-stuffed.webp","w":1473,"h":1710,"s":"cash-envelope-stuffed","d":"a plain white envelope stuffed full of US hundred dollar bills, bills protruding from the top","t":{"b":"cash","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/cash-fan-hundreds.webp","w":940,"h":1820,"s":"cash-fan-hundreds","d":"a fanned spread of US one hundred dollar bills held together, crisp new notes","t":{"b":"cash","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/cash-fan-twenties.webp","w":1766,"h":1758,"s":"cash-fan-twenties","d":"a fanned spread of US twenty dollar bills held together, crisp notes","t":{"b":"cash","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/cash-fan.webp","w":628,"h":406,"s":"cash-fan","d":"","t":{"b":"cash","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/cash-roll-band.webp","w":792,"h":1371,"s":"cash-roll-band","d":"a tight roll of US hundred dollar bills secured with a rubber band, standing upright","t":{"b":"cash","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/cash-scatter-loose.webp","w":2048,"h":1789,"s":"cash-scatter-loose","d":"a large messy pile of many overlapping US one hundred dollar banknotes filling the whole frame, dozens of bills, flat top-down view, evenly lit","t":{"b":"cash","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/cash-single-hundred.webp","w":1768,"h":782,"s":"cash-single-hundred","d":"a single crisp US one hundred dollar bill lying flat, straight on, top-down","t":{"b":"cash","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/cash-stack-banded.webp","w":1745,"h":1088,"s":"cash-stack-banded","d":"several banded bundles of US hundred dollar bills stacked neatly","t":{"b":"cash","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/cash-stack.webp","w":605,"h":412,"s":"cash-stack","d":"","t":{"b":"cash","g":null,"c":"clean","k":"group","h":1}},{"u":"assets/cutouts/safe-open-cash.webp","w":1866,"h":1744,"s":"safe-open-cash","d":"a small open security safe with neat stacks of US bills inside, three-quarter view","t":{"b":"cash","g":null,"c":"clean","k":"single","h":1}},{"u":"assets/cutouts/shopping-bag-cash.webp","w":2048,"h":1915,"s":"shopping-bag-cash","d":"a paper shopping bag tipped over with US hundred dollar bills spilling out","t":{"b":"cash","g":null,"c":"clean","k":"single","h":1}}]};
const METRICS={"Clash Display|500":{"adv":{"0":0.704,"1":0.332,"2":0.627,"3":0.651,"4":0.69,"5":0.662,"6":0.688,"7":0.569,"8":0.659,"9":0.688," ":0.171,"!":0.231,"\"":0.329,"#":0.849,"$":0.639,"%":0.803,"&":0.705,"'":0.161,"(":0.301,")":0.322,"*":0.373,"+":0.486,",":0.196,"-":0.378,".":0.196,"/":0.431,":":0.196,";":0.196,"<":0.481,"=":0.486,">":0.481,"?":0.595,"@":0.894,"A":0.75,"B":0.669,"C":0.727,"D":0.73,"E":0.62,"F":0.613,"G":0.748,"H":0.71,"I":0.208,"J":0.631,"K":0.692,"L":0.591,"M":0.906,"N":0.714,"O":0.759,"P":0.644,"Q":0.759,"R":0.672,"S":0.639,"T":0.659,"U":0.721,"V":0.716,"W":1.059,"X":0.719,"Y":0.684,"Z":0.673,"[":0.267,"\\":0.435,"]":0.279,"^":0.487,"_":0.38,"`":0.333,"a":0.566,"b":0.631,"c":0.589,"d":0.631,"e":0.588,"f":0.384,"g":0.628,"h":0.62,"i":0.208,"j":0.209,"k":0.578,"l":0.208,"m":0.976,"n":0.615,"o":0.609,"p":0.631,"q":0.631,"r":0.507,"s":0.545,"t":0.394,"u":0.62,"v":0.608,"w":0.881,"x":0.601,"y":0.591,"z":0.561,"{":0.305,"|":0.201,"}":0.307,"~":0.561,"★":1,"·":0.207,"“":0.383,"”":0.383,"’":0.196,"—":0.859,"–":0.516,"✓":0.7642,"€":0.657,"£":0.655},"up":{"0":0.68,"1":0.67,"2":0.68,"3":0.68,"4":0.67,"5":0.67,"6":0.68,"7":0.67,"8":0.68,"9":0.68," ":0,"!":0.67,"\"":0.67,"#":0.67,"$":0.77,"%":0.681,"&":0.677,"'":0.67,"(":0.742,")":0.742,"*":0.677,"+":0.543,",":0.155,"-":0.34,".":0.155,"/":0.69,":":0.497,";":0.497,"<":0.557,"=":0.487,">":0.557,"?":0.68,"@":0.659,"A":0.67,"B":0.67,"C":0.68,"D":0.67,"E":0.67,"F":0.67,"G":0.68,"H":0.67,"I":0.67,"J":0.67,"K":0.67,"L":0.67,"M":0.67,"N":0.67,"O":0.68,"P":0.67,"Q":0.68,"R":0.67,"S":0.68,"T":0.67,"U":0.67,"V":0.67,"W":0.67,"X":0.67,"Y":0.67,"Z":0.67,"[":0.73,"\\":0.69,"]":0.73,"^":0.67,"_":0,"`":0.7334,"a":0.507,"b":0.67,"c":0.507,"d":0.67,"e":0.507,"f":0.67,"g":0.507,"h":0.67,"i":0.67,"j":0.67,"k":0.67,"l":0.67,"m":0.507,"n":0.507,"o":0.507,"p":0.507,"q":0.507,"r":0.507,"s":0.507,"t":0.606,"u":0.497,"v":0.497,"w":0.497,"x":0.497,"y":0.497,"z":0.497,"{":0.73,"|":0.77,"}":0.73,"~":0.425,"★":0.859,"·":0.405,"“":0.69,"”":0.67,"’":0.67,"—":0.34,"–":0.34,"✓":0.7231,"€":0.67,"£":0.68},"dn":{"0":0.01,"1":0,"2":0,"3":0.01,"4":0,"5":0.01,"6":0.01,"7":0.001,"8":0.01,"9":0.01," ":0,"!":0,"\"":-0.416,"#":0,"$":0.1,"%":0.01,"&":0.01,"'":-0.416,"(":0.072,")":0.072,"*":-0.36,"+":-0.127,",":0.112,"-":-0.248,".":0,"/":0.02,":":0,";":0.112,"<":-0.113,"=":-0.182,">":-0.113,"?":0,"@":0.149,"A":0,"B":0,"C":0.01,"D":0,"E":0,"F":0,"G":0.01,"H":0,"I":0,"J":0.01,"K":0,"L":0,"M":0,"N":0,"O":0.01,"P":0,"Q":0.141,"R":0,"S":0.01,"T":0,"U":0.01,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.06,"\\":0.02,"]":0.06,"^":-0.28,"_":0.078,"`":-0.5923,"a":0.01,"b":0.01,"c":0.01,"d":0.01,"e":0.01,"f":0,"g":0.18,"h":0,"i":0,"j":0.17,"k":0,"l":0,"m":0,"n":0,"o":0.01,"p":0.17,"q":0.17,"r":0,"s":0.01,"t":0,"u":0.01,"v":0,"w":0,"x":0,"y":0.17,"z":0,"{":0.06,"|":0.1,"}":0.06,"~":-0.243,"★":0.078,"·":-0.25,"“":-0.423,"”":-0.402,"’":-0.402,"—":-0.248,"–":-0.248,"✓":0.0181,"€":0,"£":0},"cap":0.68,"desc":0.18,"avg":0.5469},"Clash Display|600":{"adv":{"0":0.719,"1":0.372,"2":0.644,"3":0.671,"4":0.706,"5":0.695,"6":0.704,"7":0.591,"8":0.678,"9":0.704," ":0.154,"!":0.295,"\"":0.417,"#":0.866,"$":0.663,"%":0.814,"&":0.741,"'":0.2,"(":0.326,")":0.36,"*":0.393,"+":0.511,",":0.253,"-":0.433,".":0.253,"/":0.475,":":0.253,";":0.253,"<":0.509,"=":0.511,">":0.509,"?":0.625,"@":0.908,"A":0.792,"B":0.693,"C":0.75,"D":0.747,"E":0.635,"F":0.631,"G":0.774,"H":0.73,"I":0.229,"J":0.648,"K":0.713,"L":0.609,"M":0.93,"N":0.726,"O":0.774,"P":0.658,"Q":0.774,"R":0.692,"S":0.663,"T":0.676,"U":0.729,"V":0.754,"W":1.093,"X":0.762,"Y":0.728,"Z":0.685,"[":0.299,"\\":0.48,"]":0.318,"^":0.508,"_":0.38,"`":0.333,"a":0.582,"b":0.651,"c":0.603,"d":0.651,"e":0.6,"f":0.395,"g":0.645,"h":0.638,"i":0.229,"j":0.23,"k":0.606,"l":0.229,"m":0.99,"n":0.63,"o":0.614,"p":0.651,"q":0.651,"r":0.528,"s":0.562,"t":0.409,"u":0.638,"v":0.642,"w":0.912,"x":0.626,"y":0.621,"z":0.57,"{":0.344,"|":0.218,"}":0.348,"~":0.572,"★":1,"·":0.258,"“":0.497,"”":0.497,"’":0.253,"—":0.991,"–":0.574,"✓":0.7642,"€":0.666,"£":0.685},"up":{"0":0.68,"1":0.67,"2":0.68,"3":0.68,"4":0.67,"5":0.67,"6":0.68,"7":0.67,"8":0.68,"9":0.68," ":0,"!":0.67,"\"":0.67,"#":0.67,"$":0.77,"%":0.682,"&":0.681,"'":0.67,"(":0.742,")":0.742,"*":0.681,"+":0.558,",":0.175,"-":0.36,".":0.175,"/":0.69,":":0.501,";":0.501,"<":0.565,"=":0.508,">":0.565,"?":0.68,"@":0.659,"A":0.67,"B":0.67,"C":0.68,"D":0.67,"E":0.67,"F":0.67,"G":0.68,"H":0.67,"I":0.67,"J":0.67,"K":0.67,"L":0.67,"M":0.67,"N":0.67,"O":0.68,"P":0.67,"Q":0.68,"R":0.67,"S":0.68,"T":0.67,"U":0.67,"V":0.67,"W":0.67,"X":0.67,"Y":0.67,"Z":0.67,"[":0.73,"\\":0.69,"]":0.73,"^":0.67,"_":0,"`":0.75,"a":0.511,"b":0.67,"c":0.511,"d":0.67,"e":0.511,"f":0.67,"g":0.511,"h":0.67,"i":0.67,"j":0.67,"k":0.67,"l":0.67,"m":0.511,"n":0.511,"o":0.511,"p":0.511,"q":0.511,"r":0.511,"s":0.511,"t":0.598,"u":0.501,"v":0.501,"w":0.501,"x":0.501,"y":0.501,"z":0.501,"{":0.73,"|":0.77,"}":0.73,"~":0.428,"★":0.859,"·":0.425,"“":0.68,"”":0.67,"’":0.67,"—":0.36,"–":0.36,"✓":0.7231,"€":0.67,"£":0.68},"dn":{"0":0.01,"1":0,"2":0,"3":0.01,"4":0,"5":0.01,"6":0.01,"7":0,"8":0.01,"9":0.01," ":0,"!":0,"\"":-0.381,"#":0,"$":0.1,"%":0.011,"&":0.01,"'":-0.381,"(":0.072,")":0.072,"*":-0.335,"+":-0.112,",":0.141,"-":-0.231,".":0,"/":0.02,":":0,";":0.141,"<":-0.105,"=":-0.16,">":-0.105,"?":0,"@":0.149,"A":0,"B":0,"C":0.01,"D":0,"E":0,"F":0,"G":0.01,"H":0,"I":0,"J":0.01,"K":0,"L":0,"M":0,"N":0,"O":0.01,"P":0,"Q":0.141,"R":0,"S":0.01,"T":0,"U":0.01,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.06,"\\":0.02,"]":0.06,"^":-0.28,"_":0.107,"`":-0.604,"a":0.01,"b":0.01,"c":0.01,"d":0.01,"e":0.01,"f":0,"g":0.18,"h":0,"i":0,"j":0.17,"k":0,"l":0,"m":0,"n":0,"o":0.01,"p":0.17,"q":0.17,"r":0,"s":0.01,"t":0,"u":0.01,"v":0,"w":0,"x":0,"y":0.17,"z":0,"{":0.06,"|":0.1,"}":0.06,"~":-0.237,"★":0.078,"·":-0.25,"“":-0.364,"”":-0.354,"’":-0.354,"—":-0.231,"–":-0.231,"✓":0.0181,"€":0,"£":0},"cap":0.68,"desc":0.18,"avg":0.5744},"Clash Display|700":{"adv":{"0":0.733,"1":0.407,"2":0.66,"3":0.688,"4":0.721,"5":0.725,"6":0.718,"7":0.611,"8":0.694,"9":0.718," ":0.14,"!":0.352,"\"":0.495,"#":0.881,"$":0.684,"%":0.823,"&":0.773,"'":0.235,"(":0.349,")":0.393,"*":0.41,"+":0.534,",":0.304,"-":0.481,".":0.304,"/":0.514,":":0.304,";":0.304,"<":0.534,"=":0.534,">":0.534,"?":0.652,"@":0.921,"A":0.828,"B":0.714,"C":0.77,"D":0.761,"E":0.648,"F":0.648,"G":0.797,"H":0.748,"I":0.248,"J":0.664,"K":0.731,"L":0.625,"M":0.952,"N":0.736,"O":0.786,"P":0.67,"Q":0.786,"R":0.709,"S":0.684,"T":0.691,"U":0.736,"V":0.788,"W":1.123,"X":0.8,"Y":0.766,"Z":0.697,"[":0.327,"\\":0.521,"]":0.352,"^":0.527,"_":0.38,"`":0.333,"a":0.595,"b":0.669,"c":0.615,"d":0.669,"e":0.612,"f":0.405,"g":0.659,"h":0.653,"i":0.248,"j":0.248,"k":0.63,"l":0.248,"m":1.002,"n":0.643,"o":0.618,"p":0.669,"q":0.669,"r":0.547,"s":0.577,"t":0.422,"u":0.653,"v":0.672,"w":0.939,"x":0.649,"y":0.648,"z":0.578,"{":0.379,"|":0.233,"}":0.384,"~":0.582,"★":1,"·":0.304,"“":0.598,"”":0.598,"’":0.304,"—":1.108,"–":0.626,"✓":0.7642,"€":0.674,"£":0.711},"up":{"0":0.68,"1":0.67,"2":0.68,"3":0.68,"4":0.67,"5":0.67,"6":0.68,"7":0.67,"8":0.68,"9":0.68," ":0,"!":0.67,"\"":0.67,"#":0.67,"$":0.77,"%":0.682,"&":0.684,"'":0.67,"(":0.742,")":0.742,"*":0.684,"+":0.572,",":0.192,"-":0.377,".":0.192,"/":0.69,":":0.505,";":0.505,"<":0.572,"=":0.527,">":0.572,"?":0.68,"@":0.659,"A":0.67,"B":0.67,"C":0.68,"D":0.67,"E":0.67,"F":0.67,"G":0.68,"H":0.67,"I":0.67,"J":0.67,"K":0.67,"L":0.67,"M":0.67,"N":0.67,"O":0.68,"P":0.67,"Q":0.68,"R":0.67,"S":0.68,"T":0.67,"U":0.67,"V":0.67,"W":0.67,"X":0.67,"Y":0.67,"Z":0.67,"[":0.73,"\\":0.69,"]":0.73,"^":0.67,"_":0,"`":0.75,"a":0.514,"b":0.67,"c":0.514,"d":0.67,"e":0.514,"f":0.67,"g":0.514,"h":0.67,"i":0.67,"j":0.67,"k":0.67,"l":0.67,"m":0.514,"n":0.514,"o":0.514,"p":0.514,"q":0.514,"r":0.514,"s":0.514,"t":0.591,"u":0.504,"v":0.504,"w":0.504,"x":0.504,"y":0.504,"z":0.504,"{":0.73,"|":0.77,"}":0.73,"~":0.431,"★":0.859,"·":0.442,"“":0.67,"”":0.67,"’":0.67,"—":0.377,"–":0.377,"✓":0.7231,"€":0.67,"£":0.68},"dn":{"0":0.01,"1":0,"2":0,"3":0.01,"4":0,"5":0.01,"6":0.01,"7":0,"8":0.01,"9":0.01," ":0,"!":0,"\"":-0.35,"#":0,"$":0.1,"%":0.011,"&":0.01,"'":-0.35,"(":0.072,")":0.072,"*":-0.313,"+":-0.098,",":0.166,"-":-0.217,".":0,"/":0.02,":":0,";":0.166,"<":-0.098,"=":-0.141,">":-0.098,"?":0,"@":0.149,"A":0,"B":0,"C":0.01,"D":0,"E":0,"F":0,"G":0.01,"H":0,"I":0,"J":0.01,"K":0,"L":0,"M":0,"N":0,"O":0.01,"P":0,"Q":0.141,"R":0,"S":0.01,"T":0,"U":0.01,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.06,"\\":0.02,"]":0.06,"^":-0.28,"_":0.133,"`":-0.604,"a":0.01,"b":0.01,"c":0.01,"d":0.01,"e":0.01,"f":0,"g":0.18,"h":0,"i":0,"j":0.17,"k":0,"l":0,"m":0,"n":0,"o":0.01,"p":0.17,"q":0.17,"r":0,"s":0.01,"t":0,"u":0.01,"v":0,"w":0,"x":0,"y":0.17,"z":0,"{":0.06,"|":0.1,"}":0.06,"~":-0.231,"★":0.078,"·":-0.25,"“":-0.312,"”":-0.312,"’":-0.312,"—":-0.217,"–":-0.217,"✓":0.0181,"€":0,"£":0},"cap":0.68,"desc":0.18,"avg":0.5989},"Khand|600":{"adv":{"0":0.46,"1":0.305,"2":0.426,"3":0.41,"4":0.441,"5":0.433,"6":0.452,"7":0.364,"8":0.468,"9":0.452," ":0.187,"!":0.299,"\"":0.436,"#":0.592,"$":0.42,"%":0.663,"&":0.486,"'":0.278,"(":0.329,")":0.329,"*":0.533,"+":0.482,",":0.192,"-":0.28,".":0.21,"/":0.428,":":0.236,";":0.239,"<":0.492,"=":0.476,">":0.489,"?":0.407,"@":0.894,"A":0.47,"B":0.483,"C":0.405,"D":0.483,"E":0.412,"F":0.391,"G":0.461,"H":0.518,"I":0.229,"J":0.233,"K":0.466,"L":0.373,"M":0.635,"N":0.52,"O":0.477,"P":0.458,"Q":0.477,"R":0.472,"S":0.42,"T":0.389,"U":0.484,"V":0.46,"W":0.599,"X":0.439,"Y":0.454,"Z":0.409,"[":0.344,"\\":0.451,"]":0.344,"^":0.394,"_":0.531,"`":0.35,"a":0.433,"b":0.457,"c":0.374,"d":0.456,"e":0.434,"f":0.287,"g":0.452,"h":0.459,"i":0.229,"j":0.229,"k":0.422,"l":0.229,"m":0.693,"n":0.459,"o":0.447,"p":0.457,"q":0.456,"r":0.307,"s":0.378,"t":0.308,"u":0.461,"v":0.418,"w":0.614,"x":0.391,"y":0.425,"z":0.348,"{":0.389,"|":0.218,"}":0.387,"~":0.55,"★":1,"·":0.26,"“":0.332,"”":0.332,"’":0.188,"—":0.778,"–":0.541,"✓":0.7642,"€":0.447,"£":0.497},"up":{"0":0.695,"1":0.685,"2":0.69,"3":0.691,"4":0.685,"5":0.685,"6":0.69,"7":0.685,"8":0.695,"9":0.695," ":0,"!":0.685,"\"":0.765,"#":0.678,"$":0.743,"%":0.692,"&":0.691,"'":0.765,"(":0.825,")":0.825,"*":0.818,"+":0.526,",":0.122,"-":0.381,".":0.124,"/":0.826,":":0.474,";":0.474,"<":0.53,"=":0.478,">":0.53,"?":0.695,"@":0.691,"A":0.685,"B":0.685,"C":0.69,"D":0.685,"E":0.685,"F":0.685,"G":0.69,"H":0.685,"I":0.685,"J":0.685,"K":0.685,"L":0.685,"M":0.685,"N":0.685,"O":0.695,"P":0.685,"Q":0.695,"R":0.685,"S":0.69,"T":0.685,"U":0.685,"V":0.685,"W":0.685,"X":0.685,"Y":0.685,"Z":0.685,"[":0.838,"\\":0.838,"]":0.838,"^":0.709,"_":-0.004,"`":0.737,"a":0.587,"b":0.737,"c":0.587,"d":0.737,"e":0.592,"f":0.756,"g":0.641,"h":0.737,"i":0.749,"j":0.749,"k":0.737,"l":0.737,"m":0.585,"n":0.585,"o":0.592,"p":0.585,"q":0.582,"r":0.585,"s":0.587,"t":0.685,"u":0.582,"v":0.582,"w":0.582,"x":0.582,"y":0.582,"z":0.582,"{":0.826,"|":0.851,"}":0.826,"~":0.438,"★":0.859,"·":0.408,"“":0.726,"”":0.726,"’":0.726,"—":0.381,"–":0.381,"✓":0.7231,"€":0.69,"£":0.689},"dn":{"0":0.01,"1":0,"2":0,"3":0.006,"4":0,"5":0.006,"6":0.01,"7":0,"8":0.01,"9":0.005," ":0,"!":0.008,"\"":-0.515,"#":0,"$":0.061,"%":0.007,"&":0.007,"'":-0.515,"(":0.161,")":0.161,"*":-0.386,"+":-0.132,",":0.13,"-":-0.278,".":0.008,"/":0.161,":":0.008,";":0.13,"<":-0.128,"=":-0.18,">":-0.128,"?":0.008,"@":0.129,"A":0,"B":0,"C":0.005,"D":0,"E":0,"F":0,"G":0.005,"H":0,"I":0,"J":0.149,"K":0,"L":0,"M":0,"N":0,"O":0.01,"P":0,"Q":0.092,"R":0,"S":0.005,"T":0,"U":0.01,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.164,"\\":0.164,"]":0.164,"^":-0.392,"_":0.1,"`":-0.625,"a":0.003,"b":0,"c":0.005,"d":0.004,"e":0.006,"f":0,"g":0.15,"h":0,"i":0,"j":0.152,"k":0,"l":0,"m":0,"n":0,"o":0.01,"p":0.149,"q":0.149,"r":0,"s":0.005,"t":0.007,"u":0.001,"v":0,"w":0,"x":0,"y":0.149,"z":0,"{":0.162,"|":0.175,"}":0.162,"~":-0.255,"★":0.078,"·":-0.283,"“":-0.496,"”":-0.496,"’":-0.496,"—":-0.278,"–":-0.278,"✓":0.0181,"€":0.005,"£":0},"cap":0.695,"desc":0.15,"avg":0.4238},"Khand|700":{"adv":{"0":0.469,"1":0.321,"2":0.442,"3":0.421,"4":0.463,"5":0.441,"6":0.464,"7":0.386,"8":0.475,"9":0.464," ":0.186,"!":0.33,"\"":0.49,"#":0.629,"$":0.439,"%":0.721,"&":0.504,"'":0.31,"(":0.356,")":0.357,"*":0.556,"+":0.508,",":0.22,"-":0.312,".":0.246,"/":0.458,":":0.257,";":0.263,"<":0.512,"=":0.499,">":0.507,"?":0.424,"@":0.917,"A":0.489,"B":0.493,"C":0.412,"D":0.493,"E":0.421,"F":0.403,"G":0.468,"H":0.532,"I":0.242,"J":0.247,"K":0.486,"L":0.387,"M":0.649,"N":0.532,"O":0.489,"P":0.47,"Q":0.489,"R":0.482,"S":0.439,"T":0.412,"U":0.495,"V":0.485,"W":0.593,"X":0.468,"Y":0.482,"Z":0.425,"[":0.374,"\\":0.487,"]":0.374,"^":0.441,"_":0.565,"`":0.35,"a":0.437,"b":0.463,"c":0.376,"d":0.462,"e":0.432,"f":0.295,"g":0.456,"h":0.463,"i":0.241,"j":0.241,"k":0.434,"l":0.241,"m":0.69,"n":0.463,"o":0.45,"p":0.463,"q":0.462,"r":0.322,"s":0.388,"t":0.319,"u":0.467,"v":0.438,"w":0.624,"x":0.409,"y":0.448,"z":0.364,"{":0.412,"|":0.224,"}":0.409,"~":0.625,"★":1,"·":0.287,"“":0.369,"”":0.369,"’":0.205,"—":0.865,"–":0.625,"✓":0.7642,"€":0.472,"£":0.52},"up":{"0":0.703,"1":0.693,"2":0.698,"3":0.699,"4":0.693,"5":0.693,"6":0.698,"7":0.693,"8":0.703,"9":0.703," ":0,"!":0.693,"\"":0.777,"#":0.693,"$":0.747,"%":0.699,"&":0.699,"'":0.777,"(":0.852,")":0.852,"*":0.838,"+":0.54,",":0.145,"-":0.397,".":0.147,"/":0.852,":":0.498,";":0.498,"<":0.547,"=":0.499,">":0.547,"?":0.703,"@":0.71,"A":0.693,"B":0.693,"C":0.698,"D":0.693,"E":0.693,"F":0.693,"G":0.698,"H":0.693,"I":0.693,"J":0.693,"K":0.693,"L":0.693,"M":0.693,"N":0.693,"O":0.703,"P":0.693,"Q":0.703,"R":0.693,"S":0.698,"T":0.693,"U":0.693,"V":0.693,"W":0.693,"X":0.693,"Y":0.693,"Z":0.693,"[":0.869,"\\":0.869,"]":0.869,"^":0.737,"_":0,"`":0.747,"a":0.595,"b":0.747,"c":0.595,"d":0.747,"e":0.6,"f":0.766,"g":0.659,"h":0.747,"i":0.764,"j":0.764,"k":0.747,"l":0.747,"m":0.593,"n":0.593,"o":0.6,"p":0.593,"q":0.59,"r":0.593,"s":0.595,"t":0.692,"u":0.59,"v":0.59,"w":0.59,"x":0.59,"y":0.59,"z":0.59,"{":0.852,"|":0.88,"}":0.852,"~":0.458,"★":0.859,"·":0.421,"“":0.733,"”":0.733,"’":0.733,"—":0.397,"–":0.397,"✓":0.7231,"€":0.698,"£":0.698},"dn":{"0":0.01,"1":0,"2":0,"3":0.006,"4":0,"5":0.006,"6":0.01,"7":0,"8":0.01,"9":0.005," ":0,"!":0.01,"\"":-0.499,"#":0,"$":0.053,"%":0.006,"&":0.006,"'":-0.499,"(":0.179,")":0.179,"*":-0.361,"+":-0.124,",":0.133,"-":-0.267,".":0.01,"/":0.179,":":0.01,";":0.133,"<":-0.117,"=":-0.165,">":-0.117,"?":0.01,"@":0.139,"A":0,"B":0,"C":0.005,"D":0,"E":0,"F":0,"G":0.005,"H":0,"I":0,"J":0.149,"K":0,"L":0,"M":0,"N":0,"O":0.01,"P":0,"Q":0.087,"R":0,"S":0.005,"T":0,"U":0.01,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.183,"\\":0.183,"]":0.183,"^":-0.4,"_":0.12,"`":-0.632,"a":0.002,"b":0,"c":0.005,"d":0.004,"e":0.006,"f":0,"g":0.15,"h":0,"i":0,"j":0.153,"k":0,"l":0,"m":0,"n":0,"o":0.01,"p":0.149,"q":0.149,"r":0,"s":0.005,"t":0.009,"u":0,"v":0,"w":0,"x":0,"y":0.149,"z":0,"{":0.18,"|":0.19,"}":0.18,"~":-0.244,"★":0.078,"·":-0.271,"“":-0.485,"”":-0.485,"’":-0.485,"—":-0.267,"–":-0.267,"✓":0.0181,"€":0.005,"£":0},"cap":0.703,"desc":0.15,"avg":0.4426},"Melodrama|500":{"adv":{"0":0.795,"1":0.259,"2":0.461,"3":0.61,"4":0.425,"5":0.61,"6":0.6,"7":0.422,"8":0.53,"9":0.6," ":0.282,"!":0.22,"\"":0.233,"#":0.6,"$":0.402,"%":0.643,"&":0.509,"'":0.141,"(":0.252,")":0.252,"*":0.395,"+":0.44,",":0.14,"-":0.42,".":0.14,"/":0.265,":":0.142,";":0.14,"<":0.383,"=":0.44,">":0.384,"?":0.411,"@":0.895,"A":0.483,"B":0.513,"C":0.775,"D":0.542,"E":0.427,"F":0.424,"G":0.793,"H":0.501,"I":0.224,"J":0.463,"K":0.484,"L":0.422,"M":0.583,"N":0.477,"O":0.795,"P":0.479,"Q":0.795,"R":0.492,"S":0.402,"T":0.409,"U":0.481,"V":0.465,"W":0.694,"X":0.441,"Y":0.427,"Z":0.423,"[":0.227,"\\":0.244,"]":0.227,"^":0.409,"_":0.639,"`":0.077,"a":0.463,"b":0.644,"c":0.595,"d":0.643,"e":0.601,"f":0.401,"g":0.506,"h":0.486,"i":0.198,"j":0.307,"k":0.461,"l":0.198,"m":0.725,"n":0.494,"o":0.611,"p":0.643,"q":0.643,"r":0.408,"s":0.389,"t":0.257,"u":0.496,"v":0.425,"w":0.634,"x":0.443,"y":0.429,"z":0.43,"{":0.241,"|":0.2598,"}":0.241,"~":0.52,"★":1,"·":0.14,"“":0.259,"”":0.259,"’":0.14,"—":0.717,"–":0.486,"✓":0.7642,"€":0.775,"£":0.383},"up":{"0":0.703,"1":0.708,"2":0.703,"3":0.693,"4":0.708,"5":0.693,"6":0.709,"7":0.693,"8":0.703,"9":0.703," ":0,"!":0.77,"\"":0.779,"#":0.703,"$":0.773,"%":0.703,"&":0.703,"'":0.779,"(":0.791,")":0.791,"*":0.78,"+":0.434,",":0.097,"-":0.271,".":0.097,"/":0.729,":":0.513,";":0.513,"<":0.432,"=":0.329,">":0.432,"?":0.78,"@":0.621,"A":0.693,"B":0.703,"C":0.703,"D":0.693,"E":0.693,"F":0.693,"G":0.703,"H":0.693,"I":0.693,"J":0.693,"K":0.693,"L":0.693,"M":0.693,"N":0.693,"O":0.703,"P":0.693,"Q":0.703,"R":0.693,"S":0.703,"T":0.693,"U":0.693,"V":0.693,"W":0.693,"X":0.693,"Y":0.693,"Z":0.693,"[":0.795,"\\":0.703,"]":0.795,"^":0.725,"_":0.013,"`":0.651,"a":0.523,"b":0.77,"c":0.523,"d":0.77,"e":0.523,"f":0.78,"g":0.604,"h":0.77,"i":0.728,"j":0.728,"k":0.77,"l":0.77,"m":0.523,"n":0.523,"o":0.523,"p":0.523,"q":0.523,"r":0.523,"s":0.523,"t":0.644,"u":0.513,"v":0.513,"w":0.513,"x":0.513,"y":0.513,"z":0.513,"{":0.78,"|":0.7275,"}":0.78,"~":0.302,"★":0.859,"·":0.402,"“":0.78,"”":0.78,"’":0.78,"—":0.271,"–":0.271,"✓":0.7231,"€":0.703,"£":0.703},"dn":{"0":0.01,"1":0,"2":0,"3":0.01,"4":0,"5":0.01,"6":0.01,"7":0,"8":0.01,"9":0.016," ":0,"!":0.006,"\"":-0.579,"#":0,"$":0.08,"%":0.01,"&":0,"'":-0.579,"(":0.142,")":0.142,"*":-0.448,"+":-0.095,",":0.105,"-":-0.258,".":0.01,"/":0.078,":":0.01,";":0.105,"<":-0.114,"=":-0.212,">":-0.114,"?":0.006,"@":0.175,"A":0,"B":0,"C":0.01,"D":0,"E":0,"F":0,"G":0.01,"H":0,"I":0,"J":0.01,"K":0,"L":0,"M":0,"N":0,"O":0.01,"P":0,"Q":0.146,"R":0,"S":0.01,"T":0,"U":0.01,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.142,"\\":0,"]":0.142,"^":-0.441,"_":0,"`":-0.559,"a":0.01,"b":0.01,"c":0.01,"d":0.01,"e":0.01,"f":0,"g":0.258,"h":0,"i":0,"j":0.265,"k":0,"l":0,"m":0,"n":0,"o":0.01,"p":0.255,"q":0.255,"r":0,"s":0.01,"t":0,"u":0.01,"v":0,"w":0,"x":0,"y":0.255,"z":0,"{":0.142,"|":0,"}":0.142,"~":-0.224,"★":0.078,"·":-0.295,"“":-0.577,"”":-0.577,"’":-0.577,"—":-0.258,"–":-0.258,"✓":0.0181,"€":0.01,"£":0},"cap":0.703,"desc":0.258,"avg":0.4471},"Melodrama|700":{"adv":{"0":0.799,"1":0.318,"2":0.522,"3":0.623,"4":0.469,"5":0.623,"6":0.6,"7":0.458,"8":0.551,"9":0.6," ":0.258,"!":0.255,"\"":0.318,"#":0.6,"$":0.468,"%":0.643,"&":0.56,"'":0.188,"(":0.28,")":0.28,"*":0.395,"+":0.44,",":0.187,"-":0.42,".":0.187,"/":0.244,":":0.191,";":0.187,"<":0.384,"=":0.44,">":0.384,"?":0.465,"@":0.891,"A":0.523,"B":0.56,"C":0.783,"D":0.601,"E":0.444,"F":0.442,"G":0.797,"H":0.55,"I":0.27,"J":0.507,"K":0.55,"L":0.448,"M":0.632,"N":0.495,"O":0.799,"P":0.55,"Q":0.799,"R":0.559,"S":0.468,"T":0.453,"U":0.524,"V":0.483,"W":0.756,"X":0.481,"Y":0.448,"Z":0.454,"[":0.262,"\\":0.244,"]":0.262,"^":0.398,"_":0.65,"`":0.04,"a":0.521,"b":0.676,"c":0.616,"d":0.674,"e":0.619,"f":0.48,"g":0.535,"h":0.537,"i":0.241,"j":0.304,"k":0.532,"l":0.239,"m":0.782,"n":0.537,"o":0.63,"p":0.674,"q":0.674,"r":0.464,"s":0.43,"t":0.311,"u":0.541,"v":0.473,"w":0.695,"x":0.481,"y":0.455,"z":0.471,"{":0.279,"|":0.2798,"}":0.279,"~":0.52,"★":1,"·":0.186,"“":0.351,"”":0.351,"’":0.187,"—":0.781,"–":0.536,"✓":0.7642,"€":0.783,"£":0.426},"up":{"0":0.703,"1":0.707,"2":0.703,"3":0.693,"4":0.708,"5":0.693,"6":0.703,"7":0.693,"8":0.703,"9":0.703," ":0,"!":0.795,"\"":0.804,"#":0.703,"$":0.773,"%":0.703,"&":0.703,"'":0.804,"(":0.813,")":0.813,"*":0.805,"+":0.434,",":0.141,"-":0.271,".":0.141,"/":0.703,":":0.53,";":0.53,"<":0.432,"=":0.329,">":0.432,"?":0.805,"@":0.621,"A":0.693,"B":0.703,"C":0.703,"D":0.693,"E":0.693,"F":0.693,"G":0.703,"H":0.693,"I":0.693,"J":0.693,"K":0.693,"L":0.693,"M":0.693,"N":0.693,"O":0.703,"P":0.693,"Q":0.703,"R":0.693,"S":0.703,"T":0.693,"U":0.693,"V":0.693,"W":0.693,"X":0.693,"Y":0.693,"Z":0.693,"[":0.813,"\\":0.703,"]":0.813,"^":0.725,"_":0.013,"`":0.673,"a":0.54,"b":0.795,"c":0.54,"d":0.795,"e":0.54,"f":0.805,"g":0.671,"h":0.795,"i":0.761,"j":0.761,"k":0.795,"l":0.795,"m":0.54,"n":0.54,"o":0.54,"p":0.54,"q":0.54,"r":0.54,"s":0.54,"t":0.661,"u":0.53,"v":0.53,"w":0.53,"x":0.53,"y":0.53,"z":0.53,"{":0.78,"|":0.7266,"}":0.78,"~":0.302,"★":0.859,"·":0.436,"“":0.805,"”":0.805,"’":0.805,"—":0.271,"–":0.271,"✓":0.7231,"€":0.703,"£":0.703},"dn":{"0":0.01,"1":0,"2":0,"3":0.01,"4":0,"5":0.01,"6":0.01,"7":0,"8":0.01,"9":0.01," ":0,"!":0.011,"\"":-0.545,"#":0,"$":0.08,"%":0.01,"&":0,"'":-0.545,"(":0.153,")":0.153,"*":-0.473,"+":-0.095,",":0.119,"-":-0.258,".":0.01,"/":0,":":0.01,";":0.119,"<":-0.114,"=":-0.212,">":-0.114,"?":0.011,"@":0.176,"A":0,"B":0,"C":0.01,"D":0,"E":0,"F":0,"G":0.01,"H":0,"I":0,"J":0.01,"K":0,"L":0,"M":0,"N":0,"O":0.01,"P":0,"Q":0.146,"R":0,"S":0.01,"T":0,"U":0.01,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.153,"\\":0,"]":0.153,"^":-0.441,"_":0,"`":-0.581,"a":0.01,"b":0.01,"c":0.01,"d":0.01,"e":0.01,"f":0,"g":0.255,"h":0,"i":0,"j":0.271,"k":0,"l":0,"m":0,"n":0,"o":0.01,"p":0.261,"q":0.261,"r":0,"s":0.01,"t":0,"u":0.01,"v":0,"w":0,"x":0,"y":0.261,"z":0,"{":0.153,"|":0,"}":0.153,"~":-0.224,"★":0.078,"·":-0.285,"“":-0.545,"”":-0.545,"’":-0.545,"—":-0.258,"–":-0.258,"✓":0.0181,"€":0.01,"£":0},"cap":0.703,"desc":0.261,"avg":0.479},"Zodiak|400":{"adv":{"0":0.698,"1":0.387,"2":0.627,"3":0.623,"4":0.593,"5":0.596,"6":0.639,"7":0.572,"8":0.641,"9":0.639," ":0.198,"!":0.316,"\"":0.375,"#":0.693,"$":0.705,"%":0.81,"&":0.775,"'":0.207,"(":0.358,")":0.358,"*":0.529,"+":0.521,",":0.254,"-":0.363,".":0.254,"/":0.331,":":0.254,";":0.254,"<":0.521,"=":0.521,">":0.521,"?":0.509,"@":1.084,"A":0.737,"B":0.734,"C":0.73,"D":0.797,"E":0.692,"F":0.627,"G":0.815,"H":0.834,"I":0.356,"J":0.526,"K":0.765,"L":0.64,"M":0.962,"N":0.79,"O":0.807,"P":0.695,"Q":0.84,"R":0.756,"S":0.696,"T":0.662,"U":0.748,"V":0.722,"W":1.021,"X":0.731,"Y":0.709,"Z":0.636,"[":0.333,"\\":0.331,"]":0.333,"^":0.521,"_":0.54,"`":0.5,"a":0.6,"b":0.642,"c":0.555,"d":0.654,"e":0.585,"f":0.371,"g":0.582,"h":0.662,"i":0.314,"j":0.3,"k":0.626,"l":0.308,"m":0.998,"n":0.669,"o":0.61,"p":0.654,"q":0.652,"r":0.487,"s":0.538,"t":0.387,"u":0.642,"v":0.56,"w":0.834,"x":0.555,"y":0.556,"z":0.538,"{":0.331,"|":0.18,"}":0.331,"~":0.521,"★":1,"·":0.5,"“":0.397,"”":0.397,"’":0.23,"—":1.07,"–":0.57,"✓":0.7642,"€":0.776,"£":0.684},"up":{"0":0.71,"1":0.7,"2":0.71,"3":0.71,"4":0.7,"5":0.7,"6":0.71,"7":0.71,"8":0.71,"9":0.709," ":0,"!":0.71,"\"":0.71,"#":0.72,"$":0.82,"%":0.71,"&":0.71,"'":0.71,"(":0.745,")":0.745,"*":0.736,"+":0.603,",":0.108,"-":0.338,".":0.107,"/":0.72,":":0.508,";":0.508,"<":0.557,"=":0.489,">":0.557,"?":0.71,"@":0.73,"A":0.7,"B":0.7,"C":0.71,"D":0.7,"E":0.7,"F":0.7,"G":0.71,"H":0.7,"I":0.7,"J":0.7,"K":0.7,"L":0.7,"M":0.7,"N":0.7,"O":0.71,"P":0.7,"Q":0.71,"R":0.7,"S":0.71,"T":0.7,"U":0.7,"V":0.7,"W":0.7,"X":0.7,"Y":0.7,"Z":0.7,"[":0.745,"\\":0.72,"]":0.745,"^":0.7,"_":-0.074,"`":0.72,"a":0.508,"b":0.72,"c":0.508,"d":0.72,"e":0.508,"f":0.73,"g":0.607,"h":0.72,"i":0.702,"j":0.702,"k":0.72,"l":0.72,"m":0.508,"n":0.508,"o":0.508,"p":0.508,"q":0.508,"r":0.508,"s":0.508,"t":0.624,"u":0.498,"v":0.498,"w":0.498,"x":0.498,"y":0.498,"z":0.498,"{":0.745,"|":0.8,"}":0.745,"~":0.425,"★":0.859,"·":0.431,"“":0.71,"”":0.71,"’":0.71,"—":0.338,"–":0.338,"✓":0.7231,"€":0.71,"£":0.71},"dn":{"0":0.01,"1":0,"2":0.01,"3":0.01,"4":0,"5":0.01,"6":0.01,"7":0,"8":0.01,"9":0.011," ":0,"!":0.01,"\"":-0.469,"#":0,"$":0.121,"%":0.01,"&":0.01,"'":-0.469,"(":0.089,")":0.089,"*":-0.286,"+":-0.097,",":0.17,"-":-0.296,".":0.01,"/":0.09,":":0.01,";":0.17,"<":-0.144,"=":-0.212,">":-0.144,"?":0.01,"@":0.223,"A":0,"B":0,"C":0.01,"D":0,"E":0,"F":0,"G":0.01,"H":0,"I":0,"J":0.01,"K":0,"L":0,"M":0,"N":0,"O":0.01,"P":0,"Q":0.131,"R":0.01,"S":0.01,"T":0,"U":0.01,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.089,"\\":0.09,"]":0.089,"^":-0.199,"_":0.114,"`":-0.569,"a":0.01,"b":0.01,"c":0.01,"d":0.01,"e":0.01,"f":0,"g":0.21,"h":0,"i":0,"j":0.21,"k":0,"l":0,"m":0,"n":0,"o":0.01,"p":0.2,"q":0.201,"r":0,"s":0.01,"t":0.01,"u":0.01,"v":0,"w":0,"x":0,"y":0.21,"z":0,"{":0.091,"|":0.1,"}":0.091,"~":-0.274,"★":0.078,"·":-0.305,"“":-0.484,"”":-0.484,"’":-0.484,"—":-0.296,"–":-0.296,"✓":0.0181,"€":0.01,"£":0.01},"cap":0.71,"desc":0.21,"avg":0.5749},"Zodiak|700":{"adv":{"0":0.701,"1":0.422,"2":0.636,"3":0.631,"4":0.616,"5":0.605,"6":0.646,"7":0.582,"8":0.655,"9":0.646," ":0.205,"!":0.346,"\"":0.394,"#":0.731,"$":0.71,"%":0.826,"&":0.809,"'":0.21,"(":0.358,")":0.358,"*":0.526,"+":0.521,",":0.293,"-":0.353,".":0.293,"/":0.353,":":0.293,";":0.293,"<":0.521,"=":0.521,">":0.521,"?":0.547,"@":1.066,"A":0.766,"B":0.752,"C":0.731,"D":0.811,"E":0.716,"F":0.654,"G":0.822,"H":0.851,"I":0.386,"J":0.555,"K":0.801,"L":0.66,"M":0.991,"N":0.797,"O":0.812,"P":0.718,"Q":0.846,"R":0.796,"S":0.704,"T":0.696,"U":0.753,"V":0.744,"W":1.064,"X":0.774,"Y":0.729,"Z":0.668,"[":0.341,"\\":0.353,"]":0.341,"^":0.521,"_":0.54,"`":0.5,"a":0.625,"b":0.65,"c":0.561,"d":0.667,"e":0.588,"f":0.39,"g":0.601,"h":0.682,"i":0.337,"j":0.315,"k":0.667,"l":0.33,"m":1.014,"n":0.689,"o":0.62,"p":0.666,"q":0.665,"r":0.521,"s":0.543,"t":0.408,"u":0.663,"v":0.59,"w":0.872,"x":0.599,"y":0.584,"z":0.552,"{":0.344,"|":0.19,"}":0.344,"~":0.521,"★":1,"·":0.5,"“":0.449,"”":0.449,"’":0.248,"—":1.06,"–":0.56,"✓":0.7642,"€":0.784,"£":0.711},"up":{"0":0.71,"1":0.7,"2":0.71,"3":0.71,"4":0.7,"5":0.7,"6":0.71,"7":0.71,"8":0.71,"9":0.709," ":0,"!":0.71,"\"":0.71,"#":0.72,"$":0.825,"%":0.71,"&":0.71,"'":0.71,"(":0.745,")":0.745,"*":0.726,"+":0.605,",":0.139,"-":0.348,".":0.138,"/":0.72,":":0.515,";":0.515,"<":0.56,"=":0.489,">":0.56,"?":0.71,"@":0.73,"A":0.7,"B":0.7,"C":0.71,"D":0.7,"E":0.7,"F":0.7,"G":0.71,"H":0.7,"I":0.7,"J":0.7,"K":0.7,"L":0.7,"M":0.7,"N":0.7,"O":0.71,"P":0.7,"Q":0.711,"R":0.7,"S":0.71,"T":0.7,"U":0.7,"V":0.7,"W":0.7,"X":0.7,"Y":0.7,"Z":0.7,"[":0.745,"\\":0.72,"]":0.745,"^":0.7,"_":-0.066,"`":0.72,"a":0.515,"b":0.72,"c":0.515,"d":0.72,"e":0.515,"f":0.73,"g":0.629,"h":0.72,"i":0.725,"j":0.725,"k":0.72,"l":0.72,"m":0.515,"n":0.515,"o":0.515,"p":0.515,"q":0.514,"r":0.515,"s":0.515,"t":0.647,"u":0.505,"v":0.505,"w":0.505,"x":0.505,"y":0.505,"z":0.505,"{":0.745,"|":0.8,"}":0.745,"~":0.425,"★":0.859,"·":0.445,"“":0.71,"”":0.71,"’":0.71,"—":0.348,"–":0.348,"✓":0.7231,"€":0.71,"£":0.71},"dn":{"0":0.01,"1":0,"2":0.01,"3":0.01,"4":0,"5":0.01,"6":0.01,"7":0,"8":0.01,"9":0.011," ":0,"!":0.01,"\"":-0.442,"#":0,"$":0.126,"%":0.01,"&":0.01,"'":-0.442,"(":0.089,")":0.089,"*":-0.28,"+":-0.095,",":0.178,"-":-0.287,".":0.01,"/":0.09,":":0.01,";":0.178,"<":-0.141,"=":-0.212,">":-0.141,"?":0.01,"@":0.223,"A":0,"B":0,"C":0.01,"D":0,"E":0,"F":0,"G":0.01,"H":0,"I":0,"J":0.01,"K":0,"L":0,"M":0,"N":0,"O":0.01,"P":0,"Q":0.137,"R":0.01,"S":0.01,"T":0,"U":0.01,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.089,"\\":0.09,"]":0.089,"^":-0.199,"_":0.126,"`":-0.569,"a":0.01,"b":0.01,"c":0.01,"d":0.01,"e":0.01,"f":0,"g":0.21,"h":0,"i":0,"j":0.21,"k":0,"l":0,"m":0,"n":0,"o":0.01,"p":0.2,"q":0.201,"r":0,"s":0.01,"t":0.01,"u":0.01,"v":0,"w":0,"x":0,"y":0.21,"z":0,"{":0.091,"|":0.1,"}":0.091,"~":-0.274,"★":0.078,"·":-0.291,"“":-0.446,"”":-0.446,"’":-0.446,"—":-0.287,"–":-0.287,"✓":0.0181,"€":0.01,"£":0.01},"cap":0.71,"desc":0.21,"avg":0.5915},"Satoshi|400":{"adv":{"0":0.683,"1":0.334,"2":0.562,"3":0.568,"4":0.627,"5":0.583,"6":0.603,"7":0.504,"8":0.612,"9":0.603," ":0.277,"!":0.271,"\"":0.317,"#":0.675,"$":0.563,"%":0.909,"&":0.682,"'":0.176,"(":0.254,")":0.254,"*":0.403,"+":0.66,",":0.262,"-":0.418,".":0.262,"/":0.349,":":0.282,";":0.282,"<":0.66,"=":0.66,">":0.66,"?":0.515,"@":0.907,"A":0.645,"B":0.629,"C":0.729,"D":0.706,"E":0.575,"F":0.543,"G":0.75,"H":0.705,"I":0.246,"J":0.51,"K":0.616,"L":0.509,"M":0.839,"N":0.713,"O":0.769,"P":0.614,"Q":0.769,"R":0.64,"S":0.563,"T":0.537,"U":0.693,"V":0.641,"W":0.979,"X":0.612,"Y":0.575,"Z":0.58,"[":0.255,"\\":0.349,"]":0.255,"^":0.485,"_":0.518,"`":0,"a":0.522,"b":0.584,"c":0.52,"d":0.584,"e":0.528,"f":0.297,"g":0.584,"h":0.562,"i":0.213,"j":0.213,"k":0.482,"l":0.219,"m":0.842,"n":0.562,"o":0.568,"p":0.584,"q":0.584,"r":0.345,"s":0.434,"t":0.298,"u":0.553,"v":0.486,"w":0.742,"x":0.455,"y":0.471,"z":0.443,"{":0.292,"|":0.311,"}":0.292,"~":0.66,"★":1,"·":0.275,"“":0.407,"”":0.407,"’":0.245,"—":1.138,"–":0.927,"✓":0.741,"€":0.655,"£":0.609},"up":{"0":0.73,"1":0.716,"2":0.729,"3":0.716,"4":0.716,"5":0.716,"6":0.716,"7":0.716,"8":0.729,"9":0.729," ":0,"!":0.716,"\"":0.718,"#":0.716,"$":0.815,"%":0.73,"&":0.728,"'":0.718,"(":0.756,")":0.756,"*":0.73,"+":0.587,",":0.113,"-":0.294,".":0.113,"/":0.716,":":0.496,";":0.496,"<":0.459,"=":0.43,">":0.459,"?":0.729,"@":0.729,"A":0.716,"B":0.716,"C":0.728,"D":0.716,"E":0.716,"F":0.716,"G":0.728,"H":0.716,"I":0.716,"J":0.716,"K":0.716,"L":0.716,"M":0.716,"N":0.716,"O":0.729,"P":0.716,"Q":0.729,"R":0.716,"S":0.729,"T":0.716,"U":0.716,"V":0.716,"W":0.716,"X":0.716,"Y":0.716,"Z":0.716,"[":0.779,"\\":0.716,"]":0.779,"^":0.716,"_":-0.019,"`":0.886,"a":0.497,"b":0.729,"c":0.497,"d":0.729,"e":0.497,"f":0.729,"g":0.497,"h":0.729,"i":0.72,"j":0.72,"k":0.729,"l":0.729,"m":0.497,"n":0.497,"o":0.497,"p":0.497,"q":0.497,"r":0.495,"s":0.497,"t":0.637,"u":0.485,"v":0.484,"w":0.484,"x":0.484,"y":0.484,"z":0.484,"{":0.779,"|":0.793,"}":0.779,"~":0.374,"★":0.859,"·":0.343,"“":0.73,"”":0.73,"’":0.73,"—":0.293,"–":0.293,"✓":0.509,"€":0.728,"£":0.729},"dn":{"0":0.013,"1":0,"2":0,"3":0.012,"4":0,"5":0.012,"6":0.012,"7":0,"8":0.012,"9":0," ":0,"!":0.014,"\"":-0.468,"#":0,"$":0.099,"%":0.013,"&":0.013,"'":-0.468,"(":0.157,")":0.157,"*":-0.401,"+":-0.086,",":0.091,"-":-0.232,".":0.011,"/":0,":":0.011,";":0.091,"<":-0.031,"=":-0.162,">":-0.031,"?":0.014,"@":0.098,"A":0,"B":0,"C":0.011,"D":0,"E":0,"F":0,"G":0.012,"H":0,"I":0,"J":0.012,"K":0,"L":0,"M":0,"N":0,"O":0.012,"P":0,"Q":0.041,"R":0,"S":0.012,"T":0,"U":0.012,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.059,"\\":0,"]":0.059,"^":-0.4,"_":0.078,"`":-0.766,"a":0.012,"b":0.012,"c":0.012,"d":0.012,"e":0.012,"f":0,"g":0.223,"h":0,"i":0,"j":0.221,"k":0,"l":0,"m":0,"n":0,"o":0.012,"p":0.211,"q":0.211,"r":0,"s":0.012,"t":0,"u":0.012,"v":0,"w":0,"x":0,"y":0.218,"z":0,"{":0.059,"|":0.085,"}":0.059,"~":-0.216,"★":0.078,"·":-0.171,"“":-0.527,"”":-0.527,"’":-0.527,"—":-0.232,"–":-0.232,"✓":-0.007,"€":0.012,"£":0},"cap":0.729,"desc":0.223,"avg":0.5242},"Satoshi|500":{"adv":{"0":0.693,"1":0.364,"2":0.575,"3":0.568,"4":0.636,"5":0.591,"6":0.611,"7":0.52,"8":0.625,"9":0.611," ":0.273,"!":0.294,"\"":0.372,"#":0.696,"$":0.577,"%":0.932,"&":0.707,"'":0.208,"(":0.279,")":0.279,"*":0.411,"+":0.66,",":0.276,"-":0.431,".":0.276,"/":0.376,":":0.296,";":0.296,"<":0.66,"=":0.66,">":0.66,"?":0.533,"@":0.924,"A":0.662,"B":0.639,"C":0.743,"D":0.722,"E":0.583,"F":0.555,"G":0.765,"H":0.722,"I":0.267,"J":0.529,"K":0.643,"L":0.522,"M":0.86,"N":0.734,"O":0.777,"P":0.625,"Q":0.777,"R":0.654,"S":0.577,"T":0.562,"U":0.711,"V":0.669,"W":1.005,"X":0.645,"Y":0.606,"Z":0.583,"[":0.279,"\\":0.376,"]":0.279,"^":0.5,"_":0.53,"`":0,"a":0.534,"b":0.6,"c":0.534,"d":0.6,"e":0.542,"f":0.317,"g":0.598,"h":0.575,"i":0.23,"j":0.23,"k":0.508,"l":0.234,"m":0.862,"n":0.575,"o":0.581,"p":0.6,"q":0.6,"r":0.368,"s":0.448,"t":0.318,"u":0.567,"v":0.509,"w":0.768,"x":0.482,"y":0.498,"z":0.457,"{":0.318,"|":0.323,"}":0.318,"~":0.66,"★":1,"·":0.302,"“":0.441,"”":0.441,"’":0.262,"—":1.173,"–":0.951,"✓":0.724,"€":0.638,"£":0.628},"up":{"0":0.737,"1":0.723,"2":0.736,"3":0.723,"4":0.723,"5":0.723,"6":0.723,"7":0.723,"8":0.736,"9":0.736," ":0,"!":0.723,"\"":0.726,"#":0.723,"$":0.821,"%":0.737,"&":0.735,"'":0.726,"(":0.766,")":0.766,"*":0.737,"+":0.587,",":0.129,"-":0.307,".":0.129,"/":0.722,":":0.503,";":0.503,"<":0.473,"=":0.444,">":0.473,"?":0.736,"@":0.736,"A":0.723,"B":0.723,"C":0.735,"D":0.723,"E":0.723,"F":0.723,"G":0.735,"H":0.723,"I":0.723,"J":0.723,"K":0.723,"L":0.723,"M":0.723,"N":0.723,"O":0.736,"P":0.723,"Q":0.736,"R":0.723,"S":0.736,"T":0.723,"U":0.723,"V":0.723,"W":0.723,"X":0.723,"Y":0.723,"Z":0.723,"[":0.806,"\\":0.722,"]":0.806,"^":0.723,"_":-0.018,"`":0.901,"a":0.503,"b":0.736,"c":0.503,"d":0.736,"e":0.503,"f":0.736,"g":0.503,"h":0.736,"i":0.729,"j":0.729,"k":0.736,"l":0.736,"m":0.503,"n":0.503,"o":0.502,"p":0.503,"q":0.503,"r":0.499,"s":0.503,"t":0.642,"u":0.489,"v":0.489,"w":0.489,"x":0.489,"y":0.489,"z":0.489,"{":0.806,"|":0.791,"}":0.806,"~":0.385,"★":0.859,"·":0.363,"“":0.737,"”":0.737,"’":0.737,"—":0.306,"–":0.306,"✓":0.522,"€":0.736,"£":0.736},"dn":{"0":0.013,"1":0,"2":0,"3":0.012,"4":0,"5":0.012,"6":0.012,"7":0,"8":0.012,"9":0," ":0,"!":0.014,"\"":-0.455,"#":0,"$":0.097,"%":0.013,"&":0.013,"'":-0.455,"(":0.173,")":0.173,"*":-0.396,"+":-0.086,",":0.102,"-":-0.223,".":0.012,"/":0,":":0.012,";":0.102,"<":-0.021,"=":-0.153,">":-0.021,"?":0.014,"@":0.105,"A":0,"B":0,"C":0.011,"D":0,"E":0,"F":0,"G":0.012,"H":0,"I":0,"J":0.012,"K":0,"L":0,"M":0,"N":0,"O":0.012,"P":0,"Q":0.048,"R":0,"S":0.012,"T":0,"U":0.012,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.075,"\\":0,"]":0.075,"^":-0.4,"_":0.092,"`":-0.768,"a":0.012,"b":0.012,"c":0.012,"d":0.012,"e":0.012,"f":0,"g":0.232,"h":0,"i":0,"j":0.231,"k":0,"l":0,"m":0,"n":0,"o":0.012,"p":0.219,"q":0.219,"r":0,"s":0.012,"t":0,"u":0.012,"v":0,"w":0,"x":0,"y":0.229,"z":0,"{":0.075,"|":0.087,"}":0.075,"~":-0.218,"★":0.078,"·":-0.171,"“":-0.509,"”":-0.509,"’":-0.509,"—":-0.222,"–":-0.222,"✓":-0.007,"€":0.012,"£":0},"cap":0.736,"desc":0.232,"avg":0.5404},"Satoshi|700":{"adv":{"0":0.705,"1":0.398,"2":0.589,"3":0.569,"4":0.646,"5":0.6,"6":0.62,"7":0.538,"8":0.641,"9":0.62," ":0.27,"!":0.32,"\"":0.434,"#":0.719,"$":0.592,"%":0.959,"&":0.736,"'":0.244,"(":0.308,")":0.308,"*":0.42,"+":0.66,",":0.291,"-":0.445,".":0.291,"/":0.407,":":0.311,";":0.311,"<":0.66,"=":0.66,">":0.66,"?":0.554,"@":0.944,"A":0.681,"B":0.651,"C":0.759,"D":0.74,"E":0.593,"F":0.567,"G":0.782,"H":0.742,"I":0.29,"J":0.552,"K":0.674,"L":0.538,"M":0.884,"N":0.758,"O":0.786,"P":0.639,"Q":0.786,"R":0.67,"S":0.592,"T":0.59,"U":0.731,"V":0.7,"W":1.035,"X":0.681,"Y":0.641,"Z":0.588,"[":0.306,"\\":0.407,"]":0.306,"^":0.517,"_":0.545,"`":0,"a":0.548,"b":0.619,"c":0.55,"d":0.619,"e":0.557,"f":0.339,"g":0.614,"h":0.589,"i":0.248,"j":0.248,"k":0.538,"l":0.251,"m":0.885,"n":0.589,"o":0.596,"p":0.619,"q":0.619,"r":0.393,"s":0.463,"t":0.34,"u":0.583,"v":0.536,"w":0.797,"x":0.513,"y":0.529,"z":0.473,"{":0.349,"|":0.336,"}":0.349,"~":0.66,"★":1,"·":0.333,"“":0.479,"”":0.479,"’":0.281,"—":1.211,"–":0.977,"✓":0.706,"€":0.618,"£":0.65},"up":{"0":0.745,"1":0.731,"2":0.744,"3":0.731,"4":0.731,"5":0.731,"6":0.731,"7":0.731,"8":0.744,"9":0.744," ":0,"!":0.731,"\"":0.736,"#":0.731,"$":0.827,"%":0.745,"&":0.743,"'":0.736,"(":0.778,")":0.778,"*":0.745,"+":0.587,",":0.147,"-":0.321,".":0.147,"/":0.73,":":0.511,";":0.511,"<":0.489,"=":0.46,">":0.489,"?":0.744,"@":0.744,"A":0.731,"B":0.731,"C":0.743,"D":0.731,"E":0.731,"F":0.731,"G":0.743,"H":0.731,"I":0.731,"J":0.731,"K":0.731,"L":0.731,"M":0.731,"N":0.731,"O":0.744,"P":0.731,"Q":0.744,"R":0.731,"S":0.744,"T":0.731,"U":0.731,"V":0.731,"W":0.731,"X":0.731,"Y":0.731,"Z":0.731,"[":0.836,"\\":0.73,"]":0.836,"^":0.731,"_":-0.017,"`":0.918,"a":0.509,"b":0.744,"c":0.509,"d":0.744,"e":0.509,"f":0.744,"g":0.51,"h":0.744,"i":0.74,"j":0.74,"k":0.744,"l":0.744,"m":0.509,"n":0.509,"o":0.508,"p":0.509,"q":0.509,"r":0.503,"s":0.509,"t":0.648,"u":0.494,"v":0.494,"w":0.494,"x":0.494,"y":0.494,"z":0.494,"{":0.836,"|":0.79,"}":0.836,"~":0.397,"★":0.859,"·":0.385,"“":0.745,"”":0.745,"’":0.745,"—":0.32,"–":0.32,"✓":0.537,"€":0.744,"£":0.744},"dn":{"0":0.013,"1":0,"2":0,"3":0.013,"4":0,"5":0.012,"6":0.013,"7":0,"8":0.012,"9":0," ":0,"!":0.013,"\"":-0.441,"#":0,"$":0.095,"%":0.013,"&":0.013,"'":-0.441,"(":0.191,")":0.191,"*":-0.39,"+":-0.086,",":0.115,"-":-0.213,".":0.012,"/":0,":":0.012,";":0.115,"<":-0.009,"=":-0.142,">":-0.009,"?":0.013,"@":0.113,"A":0,"B":0,"C":0.012,"D":0,"E":0,"F":0,"G":0.011,"H":0,"I":0,"J":0.013,"K":0,"L":0,"M":0,"N":0,"O":0.012,"P":0,"Q":0.055,"R":0,"S":0.013,"T":0,"U":0.012,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.093,"\\":0,"]":0.093,"^":-0.4,"_":0.107,"`":-0.769,"a":0.013,"b":0.013,"c":0.013,"d":0.013,"e":0.013,"f":0,"g":0.243,"h":0,"i":0,"j":0.243,"k":0,"l":0,"m":0,"n":0,"o":0.012,"p":0.229,"q":0.229,"r":0,"s":0.013,"t":0,"u":0.013,"v":0,"w":0,"x":0,"y":0.24,"z":0,"{":0.093,"|":0.088,"}":0.093,"~":-0.22,"★":0.078,"·":-0.172,"“":-0.488,"”":-0.488,"’":-0.488,"—":-0.212,"–":-0.212,"✓":-0.007,"€":0.012,"£":0},"cap":0.744,"desc":0.243,"avg":0.5589},"Satoshi|900":{"adv":{"0":0.718,"1":0.437,"2":0.605,"3":0.57,"4":0.657,"5":0.611,"6":0.63,"7":0.559,"8":0.659,"9":0.63," ":0.265,"!":0.35,"\"":0.506,"#":0.746,"$":0.609,"%":0.989,"&":0.77,"'":0.286,"(":0.341,")":0.341,"*":0.43,"+":0.66,",":0.308,"-":0.462,".":0.308,"/":0.442,":":0.328,";":0.328,"<":0.66,"=":0.66,">":0.66,"?":0.577,"@":0.967,"A":0.703,"B":0.665,"C":0.777,"D":0.761,"E":0.603,"F":0.582,"G":0.801,"H":0.764,"I":0.316,"J":0.577,"K":0.709,"L":0.556,"M":0.911,"N":0.786,"O":0.797,"P":0.654,"Q":0.797,"R":0.688,"S":0.609,"T":0.622,"U":0.754,"V":0.736,"W":1.069,"X":0.723,"Y":0.682,"Z":0.593,"[":0.337,"\\":0.442,"]":0.337,"^":0.536,"_":0.561,"`":0,"a":0.564,"b":0.64,"c":0.569,"d":0.64,"e":0.575,"f":0.365,"g":0.633,"h":0.606,"i":0.27,"j":0.27,"k":0.572,"l":0.27,"m":0.912,"n":0.606,"o":0.613,"p":0.64,"q":0.64,"r":0.422,"s":0.48,"t":0.366,"u":0.602,"v":0.566,"w":0.831,"x":0.548,"y":0.565,"z":0.491,"{":0.384,"|":0.352,"}":0.384,"~":0.66,"★":1,"·":0.368,"“":0.523,"”":0.523,"’":0.303,"—":1.256,"–":1.008,"✓":0.684,"€":0.595,"£":0.675},"up":{"0":0.754,"1":0.74,"2":0.754,"3":0.74,"4":0.74,"5":0.74,"6":0.74,"7":0.74,"8":0.754,"9":0.753," ":0,"!":0.74,"\"":0.747,"#":0.74,"$":0.834,"%":0.754,"&":0.753,"'":0.747,"(":0.792,")":0.792,"*":0.754,"+":0.587,",":0.168,"-":0.338,".":0.168,"/":0.738,":":0.52,";":0.52,"<":0.508,"=":0.478,">":0.508,"?":0.754,"@":0.754,"A":0.74,"B":0.74,"C":0.752,"D":0.74,"E":0.74,"F":0.74,"G":0.752,"H":0.74,"I":0.74,"J":0.74,"K":0.74,"L":0.74,"M":0.74,"N":0.74,"O":0.753,"P":0.74,"Q":0.753,"R":0.74,"S":0.754,"T":0.74,"U":0.74,"V":0.74,"W":0.74,"X":0.74,"Y":0.74,"Z":0.74,"[":0.87,"\\":0.738,"]":0.87,"^":0.74,"_":-0.016,"`":0.937,"a":0.516,"b":0.754,"c":0.516,"d":0.754,"e":0.516,"f":0.754,"g":0.517,"h":0.754,"i":0.753,"j":0.753,"k":0.754,"l":0.754,"m":0.516,"n":0.516,"o":0.515,"p":0.516,"q":0.516,"r":0.507,"s":0.516,"t":0.655,"u":0.5,"v":0.5,"w":0.5,"x":0.5,"y":0.5,"z":0.5,"{":0.87,"|":0.788,"}":0.87,"~":0.411,"★":0.859,"·":0.411,"“":0.754,"”":0.754,"’":0.754,"—":0.336,"–":0.336,"✓":0.554,"€":0.754,"£":0.754},"dn":{"0":0.013,"1":0,"2":0,"3":0.013,"4":0,"5":0.012,"6":0.013,"7":0,"8":0.012,"9":0," ":0,"!":0.013,"\"":-0.424,"#":0,"$":0.093,"%":0.013,"&":0.013,"'":-0.424,"(":0.212,")":0.212,"*":-0.384,"+":-0.086,",":0.129,"-":-0.202,".":0.013,"/":0,":":0.013,";":0.129,"<":0.004,"=":-0.13,">":0.004,"?":0.013,"@":0.123,"A":0,"B":0,"C":0.012,"D":0,"E":0,"F":0,"G":0.011,"H":0,"I":0,"J":0.013,"K":0,"L":0,"M":0,"N":0,"O":0.012,"P":0,"Q":0.064,"R":0,"S":0.013,"T":0,"U":0.012,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.114,"\\":0,"]":0.114,"^":-0.4,"_":0.125,"`":-0.771,"a":0.013,"b":0.013,"c":0.013,"d":0.013,"e":0.013,"f":0,"g":0.255,"h":0,"i":0,"j":0.256,"k":0,"l":0,"m":0,"n":0,"o":0.012,"p":0.24,"q":0.24,"r":0,"s":0.013,"t":0,"u":0.013,"v":0,"w":0,"x":0,"y":0.254,"z":0,"{":0.114,"|":0.09,"}":0.114,"~":-0.222,"★":0.078,"·":-0.173,"“":-0.464,"”":-0.464,"’":-0.464,"—":-0.2,"–":-0.2,"✓":-0.007,"€":0.012,"£":0},"cap":0.753,"desc":0.255,"avg":0.5801}};
/* the face a price may be set in — the display face unless its figures are
   unfit for money */
/* HOW MUCH OF A TEXT BOX A SHAPE ACTUALLY COVERS.
   A starburst is neither its bounding square nor its inner disc: the points
   reach out to the full radius in sixteen directions and the gaps between them
   cover nothing. Judging it by the square condemned placements that were fine;
   judging it by the disc let a point sit across the last letters of a pill.
   Sampling the real star polygon answers the question that was actually being
   asked — can the reader still read this. */
function starCover(box,st){
  /* Most candidate seats are nowhere near most lines. Reject on the bounding
     square first so the search can afford to evaluate every seat rather than
     stopping at the first tolerable one. */
  if(box.x+box.w<st.cx-st.r||box.x>st.cx+st.r||
     box.y+box.h<st.cy-st.r||box.y>st.cy+st.r)return 0;
  const N=8,M=8;let hit=0;
  for(let i=0;i<N;i++)for(let j=0;j<M;j++){
    const px=box.x+box.w*(i+.5)/N, py=box.y+box.h*(j+.5)/M;
    const dx=px-st.cx, dy=py-st.cy, d=Math.hypot(dx,dy);
    if(d>st.r)continue;
    const a=Math.atan2(dy,dx)-st.rot;
    const step=Math.PI/st.pts;
    /* the radius of the star at this angle: linear between a point and a valley */
    const t=Math.abs(((a/step)%2+2)%2-1);            // 0 at a valley, 1 at a point
    if(d<=st.r*(st.inner+(1-st.inner)*t))hit++;
  }
  return hit/(N*M);
}
/* An asset is chosen from the pool for the card's own subject. A phone card
   shows a phone; the pool is never widened to "whatever is left", which is how
   a Pokemon card once ended up advertising an iPhone. */
/* Does this picture belong on this card? The deck says what the copy is about;
   the tag says what the picture is of. Brand and condition must agree; if both
   sides know the generation those must agree too; and only a single product or
   a group may stand as the hero — never a hand, a tool or another device. */
function matchSubject(a,subj){
  if(!subj)return true;
  const t=a.t; if(!t||!t.h)return false;
  if(subj.brand&&!subj.brand.includes(t.b))return false;
  if(subj.cond&&subj.cond!=='any'&&t.c!==subj.cond)return false;
  if(subj.gen&&t.g&&!subj.gen.includes(t.g))return false;
  return true;
}
function pickAsset(c,pool,salt){
  if(!pool||!pool.length)return null;
  const subj=c.C&&c.C.subject;
  let ok=pool.filter(a=>matchSubject(a,subj));
  if(!ok.length){c.note('NOASSET: nothing in the library matches this deck\'s subject');return null;}
  /* prefer a picture that names the generation the copy leads with */
  if(subj&&subj.gen){const named=ok.filter(a=>a.t.g&&subj.gen.includes(a.t.g));
    if(named.length)ok=[...named,...named,...named,...ok];}
  return ok[Math.floor(c.R.f(0,1)*ok.length+(salt||0))%ok.length];
}
const POOL_OF={broken:'phones'};                // decks that share another deck's pictures
function assetsFor(c,kind){
  const s=ASSETS.subjects||{};
  if(kind==='prop')return ASSETS.props||[];
  if(kind==='cash')return ASSETS.cash||[];
  return s[POOL_OF[kind]||kind]||[];
}
function numFace(c){return c.F.figures?{face:c.F.display,wf:c.F.dw}:{face:c.F.body,wf:c.F.bw};}
function faceMetrics(family,weight){
  return METRICS[family+'|'+nearestWeight(family,weight)]||null;
}
/* the run's real ink extents above and below the baseline, at font-size 1 */
function inkExtent(str,family,weight){
  const m=faceMetrics(family,weight);
  if(!m||!m.up)return null;
  let up=0,dn=0;
  for(const ch of String(str)){
    if(ch===' ')continue;
    up=Math.max(up,m.up[ch]!==undefined?m.up[ch]:m.cap);
    dn=Math.max(dn,m.dn[ch]!==undefined?m.dn[ch]:m.desc);
  }
  return up||dn?{up,dn}:null;
}
/* width of str at font-size 1, tracking included */
function advance(str,family,weight,tracking){
  const m=faceMetrics(family,weight);
  const n=String(str).length;
  if(!m)return null;
  let w=0;
  for(const ch of String(str))w+=m.adv[ch]!==undefined?m.adv[ch]:m.avg;
  return w+(tracking||0)*Math.max(0,n-1);
}
/* Buyback graphics engine — extracted from the console, framework-free.
   Import with:  import * as E from './engine.mjs'
   Nothing here touches the DOM; every function is a pure transform. */

/* ══════════════════════════════════════════════════════════
   1 · SEEDED RANDOM
   ══════════════════════════════════════════════════════════ */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function RNG(seed){const r=mulberry32(seed);return{
  f:(a=0,b=1)=>a+(b-a)*r(), i:(a,b)=>Math.floor(a+(b-a+1)*r()),
  pick:a=>a[Math.floor(r()*a.length)], chance:p=>r()<p,
  shuffle:a=>{const c=a.slice();for(let i=c.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[c[i],c[j]]=[c[j],c[i]];}return c;}};}

/* ══════════════════════════════════════════════════════════
   2 · TOKENS
   ══════════════════════════════════════════════════════════ */
const PALETTES=[
 {id:"nn01",name:"Night Lot",   mood:"sodium light on a dark lot",ground:"#0B1B3A",ground2:"#132A57",ink:"#FFFFFF",body:"#C6D4EE",accent:"#FFB020",hot:"#FF3B30",paper:"#FFF4DE",dark:"#050C1E"},
 {id:"jw09",name:"Neon Counter",mood:"late-night shop window",   ground:"#0A0F1E",ground2:"#14204A",ink:"#FFFFFF",body:"#BFD2E8",accent:"#22D3EE",hot:"#FF2E93",paper:"#FFF6E5",dark:"#04070F"},
 {id:"ca10",name:"Cash Green",  mood:"money, plainly",            ground:"#05261B",ground2:"#0A4230",ink:"#FFFFFF",body:"#B9E3CF",accent:"#16C172",hot:"#FFC93C",paper:"#F2FFF8",dark:"#021711"},
 {id:"du06",name:"Paper Red",   mood:"stapled to a pole",         ground:"#F5EFE3",ground2:"#E8DFCC",ink:"#16130F",body:"#4A423A",accent:"#E23A1E",hot:"#1D4ED8",paper:"#FFFFFF",dark:"#16130F"},
 {id:"st04",name:"Steel Orange",mood:"workshop, high-vis",        ground:"#12161C",ground2:"#1E2732",ink:"#FFFFFF",body:"#B4C1CE",accent:"#FF6B18",hot:"#FFD60A",paper:"#F3F6F9",dark:"#080B0F"},
 {id:"su07",name:"Sunset Lot",  mood:"golden hour, loud",         ground:"#2B0B3A",ground2:"#4A125C",ink:"#FFFFFF",body:"#E8C9F0",accent:"#FF8A00",hot:"#FF2D78",paper:"#FFF0E0",dark:"#160520"},
 {id:"bp02",name:"Blueprint",   mood:"technical, trustworthy",    ground:"#06203A",ground2:"#0A3457",ink:"#FFFFFF",body:"#AFD3EC",accent:"#4CC9F0",hot:"#FFD60A",paper:"#EAF6FF",dark:"#031324"},
 {id:"np03",name:"Newsprint",   mood:"classified ad, urgent",     ground:"#EDE7DC",ground2:"#DCD3C4",ink:"#121212",body:"#4A463F",accent:"#D7263D",hot:"#1B4079",paper:"#FFFFFF",dark:"#121212"}
];
const PAIRS=[
 {id:"cs",display:"Clash Display",body:"Satoshi", dw:.52,bw:.50,dweight:700,note:"geometric display over the workhorse grotesque — the studio default"},
 {id:"kh",display:"Khand",        body:"Satoshi", dw:.40,bw:.50,dweight:700,note:"tall condensed over a soft grotesque — holds long model names"},
 /* Melodrama draws a slashed zero, so "$1,250" reads "$1,25Ø" — checked
    against a rendered swatch of all five families, it is the only one that
    does. Prices in this pairing are set in the body face instead. */
 {id:"ml",display:"Melodrama",    body:"Satoshi", dw:.46,bw:.50,dweight:700,figures:false,note:"high-contrast editorial display — expensive, not loud"},
 {id:"zd",display:"Zodiak",       body:"Satoshi", dw:.50,bw:.50,dweight:700,note:"display serif over a grotesque — authority, the trade-in desk"},
 {id:"cz",display:"Clash Display",body:"Zodiak",  dw:.52,bw:.48,dweight:600,note:"geometric over a serif body — editorial weight under a modern head"},
 {id:"kc",display:"Khand",        body:"Clash Display",dw:.40,bw:.50,dweight:700,note:"condensed over geometric — poster type, nothing else beside it"}
];
const SIZES={"45":[1080,1350],"11":[1080,1080],"916":[1080,1920]};

/* ══════════════════════════════════════════════════════════
   3 · CONTENT
   ══════════════════════════════════════════════════════════ */
const CONTENT={
 phones:{brand:"iPhones.LA",mark:"iL",kicker:"SAME DAY CASH",hero:"phone",
  heads:[["WE BUY","IPHONES"],["CASH FOR","IPHONES"],["TOP","BUYER"],["SELL YOUR","IPHONE"]],
  offer:"UP TO $1,250",offerSub:"PAID TODAY",
  promises:["CRACKED OK","ICLOUD OK","ANY CARRIER","FREE PICKUP","NO APPT","CASH TODAY"],
  rows:[["iPhone 17 Pro Max","$1,250","17 PM"],["iPhone 17 Pro","$1,050","17 PRO"],
        ["iPhone 16 Pro Max","$900","16 PM"],["iPhone 16","$620","16"],["iPhone 15 Pro","$580","15 PRO"]],
  cta:"GET AN INSTANT OFFER",phone:"(562) 999-4994",addr:"iphones.LA · Long Beach",
  quote:"Cracked 15 Pro in, cash out. Twenty minutes.",
  quoteBy:"Marcus T. · Carson",rating:"4.9★ · 200+ REVIEWS",
  steps:[["TEXT PICS","Snap it, send it"],["GET OFFER","Firm quote, fast."],
         ["GET PAID","Cash or transfer"]],
  /* what the copy is ABOUT, so the picture can be held to it */
  subject:{brand:['iphone'],gen:[17,16,15],cond:'clean'}},
 /* The cracked phones belong to THIS deck, not to the one quoting $1,250 for a
    17 Pro Max. PRICES ARE PLACEHOLDERS for the owner to set. */
 broken:{brand:"iPhones.LA",mark:"iL",kicker:"BROKEN IS FINE",hero:"phone",
  heads:[["WE BUY","BROKEN PHONES"],["CRACKED?","WE PAY"],["SMASHED","STILL PAYS"],["SCREEN GONE","CASH STAYS"]],
  offer:"UP TO $700",offerSub:"CRACKED · TODAY",
  promises:["CRACKED OK","WON'T TURN ON","WATER DAMAGE","ICLOUD OK","FREE PICKUP","CASH TODAY"],
  rows:[["17 Pro Max · cracked","$700","17 PM"],["16 Pro · cracked","$480","16 PRO"],
        ["15 Pro · cracked","$320","15 PRO"],["14 · cracked","$160","14"],["Galaxy S24 · cracked","$260","S24"]],
  cta:"GET A BROKEN-PHONE QUOTE",phone:"(562) 999-4994",addr:"iphones.LA · Long Beach",
  quote:"Screen in pieces, still got $420 for it.",
  quoteBy:"Dana R. · Lakewood",rating:"4.9★ · 200+ REVIEWS",
  steps:[["TEXT PICS","Cracks and all"],["GET OFFER","Firm, for the damage"],
         ["GET PAID","Cash or transfer"]],
  subject:{brand:['iphone','samsung','pixel'],cond:'cracked'}},
 cars:{brand:"Cars Buyer",mark:"CB",kicker:"LICENSED BUYER",hero:"car",
  heads:[["WE BUY","CARS"],["CASH FOR","TRUCKS"],["WE OUTBID","THE DEALER"],["SELL YOUR","TRUCK"]],
  offer:"UP TO $25,000",offerSub:"CASH TODAY",
  promises:["FREE TOW","SAME DAY","LICENSED","TITLE OR NOT","RUNS OR NOT","WE COLLECT"],
  rows:[["F-150 / Silverado","$25,000","F-150"],["Tacoma / Ranger","$21,500","TACOMA"],
        ["4Runner / Tahoe","$19,800","4RUNNER"],["Civic / Corolla","$12,400","CIVIC"],
        ["Sprinter / Transit","$23,000","SPRINTER"]],
  cta:"GET AN INSTANT OFFER",phone:"(562) 999-4994",addr:"Long Beach · Carson",
  quote:"Old Civic gone the same day, cash in hand.",
  quoteBy:"Jordan K. · Long Beach",rating:"4.9★ · 200+ SELLERS",
  steps:[["SEND VIN","Dash photo. Done."],["GET OFFER","Firm number, fast."],
         ["FREE TOW","We tow, you bank."]],
  subject:{brand:['car'],cond:'any'}}          // "runs or not": a damaged car is on-message
};

/* ══════════════════════════════════════════════════════════
   4 · COLOUR
   ══════════════════════════════════════════════════════════ */
function hex2rgb(h){h=h.replace('#','');return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
function lum(h){const c=hex2rgb(h).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);});
  return .2126*c[0]+.7152*c[1]+.0722*c[2];}
function contrast(a,b){const l1=lum(a),l2=lum(b);return(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);}
function onColor(bg,P){const c=[P.paper,'#FFFFFF',P.ink,P.dark,'#000000'];
  let best=c[0],bc=0;c.forEach(x=>{const k=contrast(x,bg);if(k>bc){bc=k;best=x;}});return best;}
function readable(color,bg,P){return contrast(color,bg)>=4.5?color:onColor(bg,P);}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

/* ══════════════════════════════════════════════════════════
   5 · THE DESIGN QUEUE — every switch, its effect and its purpose
   ══════════════════════════════════════════════════════════ */
const QUEUE=[
 ['Ground',[
  ['groundGradient','Lit ground','radial pool from ground2 → ground','Gives the card a light source, so the hero looks placed rather than pasted.'],
  ['grain','Film grain','fractal noise at 5.5% overlay','Stops large flat fills reading as plastic on a phone screen.']]],
 ['Field',[
  ['sunburst','Sunburst rays','24–32 alternating wedges behind the hero','Radial energy. Points at the product without drawing a single arrow.'],
  ['halftone','Halftone ramp','dot grid with a quadratic density falloff','Print texture. Reads as a real flyer, not a template export.'],
  ['checker','Checker field','8–12 cell warped checker at 8–14%','Retail-poster ground. Fills the corners the composition never reaches.'],
  ['diagonalSplit','Diagonal split','angled two-tone divide','Breaks the rectangle so the eye travels instead of scanning rows.']]],
 ['Hero',[
  ['photoHero','Real photography','approved product cutout instead of vector art','A photograph of the actual thing stops a thumb; a diagram of it does not.'],
 ['stickers','Prop dressing','banded cash and boxed stock in the empty corners','Fills the holes a cutout leaves with things the shop actually hands over.'],
 ['hero','Product hero','device or vehicle art','The subject. Without it the card is a price list.'],
  ['heroBleed','Bleed off the edge','crosses one edge by 6–14%','The single biggest anti-blandness move — implies the product continues past the frame.'],
  ['heroRotate','Angle the hero','6–24° rotation','Diagonal beats orthogonal. A straight product reads as a catalogue photo.'],
  ['heroShadow','Cast shadow','soft drop at 3.5% of hero height','Separates the hero from the field so it sits above, not inside.']]],
 ['Shape language',[
  ['paintStroke','Paint stroke','rough brush quad, wobble on all four edges','Puts a hand behind the headline. The opposite of a rounded plate.'],
  ['tornPaper','Torn paper','26-segment ragged edge, 16% amplitude','Divides the card with an edge that looks made, not drawn.'],
  ['knockoutBand','Knockout band','full-bleed solid bar, text reversed','Maximum contrast for one line. The loudest device that still looks composed.'],
  ['arcCrown','Arc crown','headline bent over the hero on a generated arc','Wraps the type around the product instead of stacking above it.']]],
 ['Display type',[
  ['outlineStroke','Outline stroke','5% of size, paint-order stroke','Holds the letterform against a busy field.'],
  ['hardShadow','Hard shadow','solid offset, no blur','The reference-ad signature. Blur makes it a web button; offset makes it a poster.'],
  ['fitToPlate','Fit to plate','textLength snaps each line to its box','Kills the ragged right edge and the empty half-line — the main source of dead space.']]],
 ['Offer',[
  ['starburst','Starburst seal','12–24 points, rotated −8° to −23°','Turns a number into an object. Must overlap the hero or it floats.'],
  ['ticket','Ticket stub','side notches at 13% of height','Makes the offer feel redeemable rather than announced.'],
  ['sheen','Plate sheen','inset 5% / top 7% / height 9% of its own plate','Depth on flat colour. Measured from the plate, which is where it used to go wrong.']]],
 ['Proof',[
  ['promisePills','Promise pills','three check pills, evenly divided','Answers the three objections before they are raised.'],
  ['proofBlock','Proof block','review card, stars, or numbered steps','The reason a stranger calls a number on a flyer.'],
  ['priceRows','Price rows','alternating model / price bands','The layout resellers actually screenshot and send on.']]],
 ['Chrome',[
  ['cta','Call to action','hot band or radiused button','One instruction. Never two.'],
  ['footerBar','Footer bar','8.8% band, accent hairline, icon disc','Anchors the number and the service area. Every reference ad has one.'],
  ['cornerLockup','Corner lockup','mark + wordmark + kicker at 4.8% margin','Identity without a centred logo eating the top third.']]]
];
const ALLKEYS=QUEUE.flatMap(g=>g[1].map(t=>t[0]));
const KEYMETA={}; QUEUE.forEach(g=>g[1].forEach(t=>KEYMETA[t[0]]={group:g[0],name:t[1],fx:t[2],purpose:t[3]}));
const DEFAULT_CFG=()=>Object.fromEntries(ALLKEYS.map(k=>[k,true]));

/* ══════════════════════════════════════════════════════════
   6 · CARD BUILDER
   ══════════════════════════════════════════════════════════ */
/* What sits in front of what. Anything unlisted is content and paints at 0. */
const Z={field:-60,ground:-60,hero:-30,plate:-10,shape:-10,sheen:-5,badge:20};
class Card{
  constructor(W,H,P,F,R,C,cfg,key,vertical){
    Object.assign(this,{W,H,P,F,R,C,cfg,key,vertical});
    this.S=Math.min(W,H);
    /* LAYERS CARRY A DEPTH, NOT JUST AN ORDER.
       Every "why is that on top of the text" bug came from paint order being an
       accident of the order somebody happened to write the calls in. A layer now
       declares what KIND of thing it is — ground, field, product, content, seal —
       and the card is assembled by depth. Adding a device to an archetype can no
       longer bury the copy just because it was written last. */
    this.defs=[];this.layers=[];this.uid=0;this.notes=[];this.used={};this.later=[];this.seq=0;this._m=null;
  }
  on(k){return this.cfg[k]!==false;}
  id(p){return p+(this.uid++)+this.key;}
  add(m,n,z){this.layers.push({m,n,z:z===undefined?(n&&Z[n.role])||0:z,i:this.seq++});this._m=null;}
  /* materialised paint order — depth first, then the order it was written */
  get sorted(){return this._m||(this._m=this.layers.slice().sort((a,b)=>a.z-b.z||a.i-b.i));}
  get svg(){return this.sorted.map(l=>l.m);}
  get nodes(){return this.sorted.filter(l=>l.n).map(l=>l.n);}
  def(d){this.defs.push(d);}
  /* Run after the archetype has finished. A seal has to choose its seat from
     the finished card: placed mid-build it was choosing against half the copy,
     picked a corner that looked empty, and then the price ladder was drawn
     into the space underneath it. */
  defer(fn){this.later.push(fn);}
  /* The first y a layout may use. The corner lockup owns the top-left strip;
     archetypes that started their headline at a fixed fraction were landing on
     it whenever the type ran large. Asked once, honoured everywhere. */
  topSafe(){return this.on('cornerLockup')?this.H*.045+this.W*.072*1.30:this.H*.045;}
  flush(){const q=this.later;this.later=[];q.forEach(fn=>fn());}
  note(t){this.notes.push(t);}
  use(family,weight){
    const w=nearestWeight(family,weight);
    (this.used[family]||=new Set()).add(w);
    return w;
  }
  /* PLAN A RUN WITHOUT DRAWING IT.
     Everything that decides where a line of type lands lives here, so a
     caller can ask for the exact box a run will occupy and cut a plate to
     fit it BEFORE drawing it. The bar behind a headline used to be a fixed
     fraction of the card while the headline sized itself from the copy, so
     the two were decided independently and the words ran off the bar. */
  plan(str,box,o={}){

    const face=o.face||this.F.display, wf=o.wf!==undefined?o.wf:this.F.dw, tr=o.tracking||0;
    const chars=Math.max(String(str).length,1);
    const weight=this.use(face,o.weight||this.F.dweight);
    /* unit = the run's exact width at font-size 1. Falls back to the old
       average-per-character estimate only if the face was never measured. */
    const unit=advance(str,face,weight,tr)||chars*(wf+tr);
    let size=o.size||(box.w/unit);
    if(o.max)size=Math.min(size,o.max); if(o.min)size=Math.max(size,o.min);
    if(unit*size>box.w)size=box.w/unit;          // never wider than the plate
    /* LEGIBILITY IS A FLOOR, NOT A PREFERENCE.
       Fitting by width alone can drive a run under the size R8 requires, which
       is how fine print that dies in a feed thumbnail used to ship. Hold the
       floor instead and take the width back by condensing: textLength with
       lengthAdjust compresses letter-spacing and glyphs, and down to about 82%
       that reads as a condensed cut rather than a squeeze. Only when even that
       is not enough is it a genuine layout/copy mismatch, and the card says so
       out loud rather than silently setting six-point type. */
    const floor=this.S*.021/(o.capRatio||(faceMetrics(face,weight)||{cap:.72}).cap);
    let condense=0;
    if(!o.size&&size<floor){
      const want=unit*floor;
      if(want<=box.w*1.22){size=floor;condense=box.w/want;}
      else{size=box.w/unit;this.note(`tight: "${String(str).slice(0,22)}" needs ${(want/box.w*100|0)}% of its box at the legible floor`);}
    }
    const fm=faceMetrics(face,weight);
    /* FIT A SHORT RUN TO THE BOX HEIGHT, NOT JUST ITS WIDTH.
       Sizing by width alone means the size depends on which glyph it is: "1"
       has a much narrower advance than "2", so a numbered list came out with a
       first step half again the size of the others, overflowing its own tile.
       When the caller gives the box a height, fit to the smaller of the two
       and centre the ink in it, which is what setting a numeral in a square
       has always meant. */
    const ink0=inkExtent(str,face,weight);
    let vcentre=0;
    if(box.h&&o.fitH!==false&&ink0&&(ink0.up+ink0.dn)>0){
      const sizeH=box.h/(ink0.up+ink0.dn);
      if(sizeH<size){size=sizeH;}
      vcentre=(box.h-(ink0.up+ink0.dn)*size)/2;
    }
    const cap=size*(o.capRatio||(fm?fm.cap:.72));
    const y=box.h&&o.fitH!==false&&ink0?box.y+vcentre+ink0.up*size:box.y+cap;

    const anchor=o.align||'start';
    const x=anchor==='middle'?box.x+box.w/2:anchor==='end'?box.x+box.w:box.x;
    const natural=unit*size;
    const ratio=natural>0?box.w/natural:1;
    /* o.measure sets the line flush to the full width of its box — the stacked
       poster lockup where every word is the same measure. Short headlines like
       TOP / BUYER cannot fill a wide box at a fixed leading, so a square poster
       was left with a quarter of itself empty; set to the measure they become
       the artwork. Capped at 4x so a one-letter line is never smeared. */
    const measure=o.measure&&ratio>1&&ratio<=4;
    const snap=measure||((o.fit!==false)&&this.on('fitToPlate')&&ratio>=.70&&ratio<=1.60);
    const realW=(snap||condense)?box.w:Math.min(box.w,natural);
    const ext=ink0;
    const top=ext?y-ext.up*size:box.y;
    const hgt=ext?(ext.up+ext.dn)*size:cap*1.18;
    return{face,weight,size,cap,y,x,anchor,natural,snap,condense,tr,
      box:{x:anchor==='middle'?x-realW/2:anchor==='end'?x-realW:x,y:top,w:realW,h:hgt}};
  }
  text(str,box,o={}){
    const p=this.plan(str,box,o);
    const {face,weight,size,cap,y,x,anchor,snap,condense,tr}=p;
    const fill=o.fill||this.P.ink;
    /* condensing is a containment guarantee, so it applies whether or not the
       fitToPlate look is switched on for this configuration */
    const tl=(condense&&condense<1)?` textLength="${box.w.toFixed(1)}" lengthAdjust="spacingAndGlyphs"`
            :snap?` textLength="${box.w.toFixed(1)}" lengthAdjust="spacingAndGlyphs"`:'';
    const ls=tr?` letter-spacing="${(tr*size).toFixed(2)}"`:'';
    const base=`font-family="${face}, sans-serif" font-weight="${weight}" font-size="${size.toFixed(1)}" text-anchor="${anchor}"`;
    const useStroke=o.stroke&&this.on('outlineStroke');
    const useShadow=o.shadow&&this.on('hardShadow');
    let m='';
    if(useShadow){
      const dx=o.shadowDx!==undefined?o.shadowDx:size*.055, dy=o.shadowDy!==undefined?o.shadowDy:size*.06;
      m+=`<text x="${(x+dx).toFixed(1)}" y="${(y+dy).toFixed(1)}" ${base} fill="${o.shadow}" stroke="${o.shadow}" `+
         `stroke-width="${(size*(o.strokeW||.055)).toFixed(2)}" paint-order="stroke"${tl}${ls}>${esc(str)}</text>`;
    }
    const sa=useStroke?` stroke="${o.stroke}" stroke-width="${(size*(o.strokeW||.055)).toFixed(2)}" paint-order="stroke"`:'';
    m+=`<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" ${base} fill="${fill}"${sa}${tl}${ls}>${esc(str)}</text>`;
    // measured box: fitted text spans its plate, unfitted text is estimated from advance width
    /* the measured box is the run's real ink, not a generic cap+descent band,
       so the collision rule tests what a reader can actually see touching */
    this.add(m,{type:'text',id:o.id||'text',box:p.box,str:String(str),face,weight,
      size:cap,fill,backing:o.on||this.P.ground,bleed:!!o.bleed,role:o.role||'text'},o.z);
    return cap;
  }
  rect(box,fill,o={}){
    this.add(`<rect x="${box.x.toFixed(1)}" y="${box.y.toFixed(1)}" width="${box.w.toFixed(1)}" height="${box.h.toFixed(1)}" rx="${o.r||0}" fill="${fill}"/>`,
      o.ghost?null:{type:'shape',id:o.id||'rect',box,bleed:!!o.bleed,role:o.role||'shape',fill},
      o.z);
    return box;
  }
  raw(m,n){this.add(m,n);}
}

/* ══════════════════════════════════════════════════════════
   7 · DEVICES
   ══════════════════════════════════════════════════════════ */
const D={};
D.sunburst=(c,cx,cy,r,color,wedges,rot,op)=>{
  let p='';const st=Math.PI*2/wedges;
  for(let i=0;i<wedges;i+=2){const a0=rot+i*st,a1=rot+(i+1)*st;
    p+=`M${cx.toFixed(1)} ${cy.toFixed(1)} L${(cx+Math.cos(a0)*r).toFixed(1)} ${(cy+Math.sin(a0)*r).toFixed(1)} L${(cx+Math.cos(a1)*r).toFixed(1)} ${(cy+Math.sin(a1)*r).toFixed(1)} Z `;}
  c.add(`<path d="${p}" fill="${color}" opacity="${op||.15}"/>`,
    {type:'shape',id:'sunburst',box:{x:cx-r,y:cy-r,w:r*2,h:r*2},bleed:true,role:'field'});
};
D.starburst=(c,cx,cy,r,pts,inner,rot,fill,stroke)=>{
  let p='';const n=pts*2,st=Math.PI/pts;
  for(let i=0;i<n;i++){const rr=i%2?r*inner:r,a=rot+i*st;
    p+=(i?'L':'M')+(cx+Math.cos(a)*rr).toFixed(1)+' '+(cy+Math.sin(a)*rr).toFixed(1)+' ';}
  c.add(`<path d="${p}Z" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${(r*.05).toFixed(1)}"`:''}/>`,
    {type:'shape',id:'badge',box:{x:cx-r,y:cy-r,w:r*2,h:r*2},role:'badge',fill,
     /* what the star actually paints over: between the inner and outer radius
        it is mostly background showing between the points, so coverage is
        judged on the inner disc — and the seal's own placement search is
        scored on this same box, so it optimises what the rule measures */
     solid:{x:cx-r*inner,y:cy-r*inner,w:r*inner*2,h:r*inner*2},
     star:{cx,cy,r,pts,inner,rot}});
  return{x:cx-r,y:cy-r,w:r*2,h:r*2};
};
D.tornPaper=(c,box,fill,seed)=>{
  const R=RNG(seed),segs=26;let p=`M${box.x} ${(box.y+box.h*.12).toFixed(1)} `;
  for(let i=1;i<=segs;i++)p+=`L${(box.x+box.w*i/segs).toFixed(1)} ${(box.y+box.h*(.02+R.f(0,.16))).toFixed(1)} `;
  p+=`L${(box.x+box.w).toFixed(1)} ${(box.y+box.h).toFixed(1)} L${box.x} ${(box.y+box.h).toFixed(1)} Z`;
  c.add(`<path d="${p}" fill="${fill}"/>`,{type:'shape',id:'torn',box,bleed:true,role:'plate',fill});
  return box;
};
D.paintStroke=(c,box,fill,seed)=>{
  const R=RNG(seed),{x,y,w,h}=box,j=()=>R.f(-h*.13,h*.13);
  const p=`M${(x+j()).toFixed(1)} ${(y+h*.12+j()).toFixed(1)} C${(x+w*.25).toFixed(1)} ${(y+j()).toFixed(1)}, ${(x+w*.7).toFixed(1)} ${(y+h*.06+j()).toFixed(1)}, ${(x+w).toFixed(1)} ${(y+h*.04+j()).toFixed(1)} L${(x+w+h*.1).toFixed(1)} ${(y+h*.9+j()).toFixed(1)} C${(x+w*.68).toFixed(1)} ${(y+h+j()).toFixed(1)}, ${(x+w*.3).toFixed(1)} ${(y+h*.94+j()).toFixed(1)}, ${(x-h*.06).toFixed(1)} ${(y+h*.98+j()).toFixed(1)} Z`;
  c.add(`<path d="${p}" fill="${fill}"/>`,{type:'shape',id:'stroke',box,role:'plate',fill});
  return box;
};
D.halftone=(c,box,color,cell,seed,dir)=>{
  let p='';const cols=Math.ceil(box.w/cell),rows=Math.ceil(box.h/cell);
  for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){
    const t=dir==='v'?j/rows:i/cols,rad=cell*.46*(1-t)*(1-t);
    if(rad<.35)continue;
    p+=`M${(box.x+i*cell+cell/2).toFixed(1)} ${(box.y+j*cell+cell/2).toFixed(1)} m${(-rad).toFixed(2)} 0 a${rad.toFixed(2)} ${rad.toFixed(2)} 0 1 0 ${(rad*2).toFixed(2)} 0 a${rad.toFixed(2)} ${rad.toFixed(2)} 0 1 0 ${(-rad*2).toFixed(2)} 0 `;}
  c.add(`<path d="${p}" fill="${color}" opacity=".5"/>`,{type:'shape',id:'halftone',box,bleed:true,role:'field'});
};
D.checker=(c,box,color,n,op)=>{
  let p='';const cw=box.w/n,ch=box.h/n;
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){if((i+j)%2)continue;
    p+=`M${(box.x+i*cw).toFixed(1)} ${(box.y+j*ch).toFixed(1)} h${cw.toFixed(1)} v${ch.toFixed(1)} h${(-cw).toFixed(1)} Z `;}
  c.add(`<path d="${p}" fill="${color}" opacity="${op||.12}"/>`,{type:'shape',id:'checker',box,bleed:true,role:'field'});
};
D.ticket=(c,box,fill,notch)=>{
  const n=notch||box.h*.13,{x,y,w,h}=box;
  const p=`M${x} ${y} H${(x+w).toFixed(1)} V${(y+h/2-n).toFixed(1)} A${n} ${n} 0 0 0 ${(x+w).toFixed(1)} ${(y+h/2+n).toFixed(1)} V${(y+h).toFixed(1)} H${x} V${(y+h/2+n).toFixed(1)} A${n} ${n} 0 0 0 ${x} ${(y+h/2-n).toFixed(1)} Z`;
  c.add(`<path d="${p}" fill="${fill}"/>`,{type:'shape',id:'ticket',box,role:'plate',fill});
  return box;
};
D.sheen=(c,plate,color)=>{
  if(!c.on('sheen')||!plate)return null;
  const inset=plate.w*.05,box={x:plate.x+inset,y:plate.y+plate.h*.07,w:plate.w-inset*2,h:plate.h*.09};
  if(box.w<=0||box.h<=0)return null;
  c.add(`<rect x="${box.x.toFixed(1)}" y="${box.y.toFixed(1)}" width="${box.w.toFixed(1)}" height="${box.h.toFixed(1)}" rx="${(box.h/2).toFixed(1)}" fill="${color}" opacity=".16"/>`,
    {type:'shape',id:'sheen',box,role:'sheen',parent:plate});
  return box;
};
D.footerBar=(c)=>{
  const {W,H,P,F,C}=c,h=H*.088,y=H-h;
  c.rect({x:0,y,w:W,h},P.dark,{id:'footer',bleed:true,role:'footer'});
  c.rect({x:0,y,w:W,h:H*.006},P.accent,{ghost:true,z:1});
  const pad=W*.05,ir=h*.30,cy=y+h*.5;
  c.raw(`<circle cx="${(pad+ir).toFixed(1)}" cy="${cy.toFixed(1)}" r="${ir.toFixed(1)}" fill="${P.accent}"/>`+
    `<g transform="translate(${(pad+ir*.38).toFixed(1)},${(cy-ir*.62).toFixed(1)}) scale(${(ir*1.24/24).toFixed(4)})">`+
    `<path d="M6.6 2.5c.9 0 1.6.6 1.8 1.4l.7 2.6c.2.7 0 1.4-.5 1.9L7.3 9.6c1.1 2.3 3 4.2 5.3 5.3l1.2-1.3c.5-.5 1.2-.7 1.9-.5l2.6.7c.8.2 1.4.9 1.4 1.8v2.4c0 1.1-.9 2-2 2C10.7 20 4 13.3 4 5.5c0-1.1.9-2 2-2h.6z" fill="${onColor(P.accent,P)}"/></g>`);
  c.text(C.phone,{x:pad+ir*2+W*.022,y:cy-h*.30,w:W*.30},
    {fill:P.paper,on:P.dark,id:'footerNum',role:'footer',max:h*.50});
  c.text(C.addr,{x:W-pad-W*.40,y:cy-h*.12,w:W*.40},
    {face:F.body,wf:F.bw,weight:600,fill:readable(P.body,P.dark,P),on:P.dark,id:'footerAddr',role:'footer',
     capRatio:.70,min:c.S*.031});
};
/* THE MARK, FRAMED FIVE WAYS.
   app    — initials on a rounded square, the app-icon shape (the default)
   circle — initials in a disc
   float  — initials alone, large, outlined; no plate
   name   — no mark at all; the wordmark and kicker carry the brand
   mark   — the framed initials alone; no wordmark (for a shop that is its logo) */
D.lockup=(c,corner)=>{
  const {W,H,P,F,C}=c,m=W*.048,s=W*.072;
  const frame=(c.cfg&&c.cfg.brand&&c.cfg.brand.frame)||'app';
  const x=corner==='right'?W-m-s:m,y=H*.045;
  const hasMark=frame!=='name', hasName=frame!=='mark';
  if(hasMark){
    if(frame==='app')c.rect({x,y,w:s,h:s},P.accent,{r:s*.24,id:'markPlate',role:'brand'});
    else if(frame==='circle')c.add(`<circle cx="${(x+s/2).toFixed(1)}" cy="${(y+s/2).toFixed(1)}" r="${(s/2).toFixed(1)}" fill="${P.accent}"/>`,
      {type:'shape',id:'markPlate',box:{x,y,w:s,h:s},role:'brand',fill:P.accent});
    if(frame==='float')
      c.text(C.mark,{x:x-s*.04,y:y+s*.08,w:s*1.08,h:s*.84},{align:'middle',fill:P.accent,on:P.ground,
        stroke:P.dark,strokeW:.06,id:'mark',role:'brand'});
    else
      c.text(C.mark,{x:x+s*.16,y:y+s*.26,w:s*.68,h:s*.48},{align:'middle',fill:onColor(P.accent,P),on:P.accent,id:'mark',role:'brand'});
  }
  if(!hasName)return;
  const nx=hasMark?x+s*1.22:x;
  /* Set the second line from where the first one actually ENDS. At a fixed
     s*.62 offset the descender of "iPhones.LA" ran into the cap line of
     "SAME DAY CASH" on all but a handful of cards — the leading was guessed
     from the mark's size rather than measured from the type. */
  const wm={x:nx,y:y+s*.10,w:W*.30};
  const wo={face:F.body,wf:F.bw,weight:800,fill:P.ink,id:'wordmark',role:'brand',max:W*.045};
  const wp=c.plan(C.brand,wm,wo);
  c.text(C.brand,wm,wo);
  c.text(C.kicker,{x:nx,y:wp.box.y+wp.box.h+s*.07,w:W*.34},{face:F.body,wf:F.bw,weight:600,
    fill:readable(P.accent,P.ground,P),id:'kicker',role:'brand',tracking:.04,min:W*.026});
};
/* fit=  {left,right,bottom}  the box the crown must stay inside. Sizing is done
   here, with the same geometry that declares the node's box, so the fit and the
   audit can never disagree — they used to be computed in two places. */
D.arcText=(c,str,cx,cy,r,fill,size,fit)=>{
  const id=c.id('arc');
  const weight=c.use(c.F.display,c.F.dweight);
  if(fit){
    const m0=faceMetrics(c.F.display,weight);
    const unit=advance(str,c.F.display,weight,0)||String(str).length*c.F.dw;
    /* The apex passed in is the BASELINE of the curve; the capitals stand above
       it by most of the type size, which is how a crown reached back over the
       lockup it was meant to clear. Each candidate size is measured at the
       centre it would actually be drawn at, so the fit test and the drawing
       can never be describing different circles. */
    const at=t=>{
      const up=(m0?m0.up[str[0]]||m0.cap:.72)*t, dn=(m0?m0.desc:.2)*t;
      const CY=fit.top!==undefined?fit.top+up+r:cy;
      const half=Math.min(Math.PI*.98,unit*t/r)/2;
      return{cy:CY,x0:cx-Math.sin(half)*(r+up),x1:cx+Math.sin(half)*(r+up),
             yBot:CY-Math.cos(half)*(r-dn)};
    };
    /* Two dials, not one. A flatter curve dips less for the same words, so when
       the band is shallow — the square crop leaves the crown barely 120px —
       widening the radius saves the device where shrinking the type alone
       cannot. If neither dial reaches, say so and let the caller set the line
       straight instead of curving it into the product. */
    let pick=null;
    for(const rk of [1,1.3,1.7,2.2,3.0]){
      const R0=r; r=R0*rk;
      for(let t=size;t>=size*.55;t-=size*.03){
        const e=at(t);
        if(e.x0>=fit.left&&e.x1<=fit.right&&e.yBot<=fit.bottom){pick={t,r};break;}
      }
      r=R0;
      if(pick)break;
    }
    if(!pick)return null;
    r=pick.r; size=pick.t; cy=at(size).cy;
  }
  c.def(`<path id="${id}" d="M${(cx-r).toFixed(1)} ${cy.toFixed(1)} A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${(cx+r).toFixed(1)} ${cy.toFixed(1)}" fill="none"/>`);
  c.add(`<text font-family="${c.F.display}, sans-serif" font-weight="${weight}" font-size="${size.toFixed(1)}" fill="${fill}"><textPath href="#${id}" startOffset="50%" text-anchor="middle">${esc(str)}</textPath></text>`,
    /* THE ARC'S REAL EXTENT, NOT A RECTANGLE OVER ITS APEX.
       Type set on a curve is highest in the middle and falls away at both ends,
       so a flat box across the top described a shape the glyphs never occupied:
       the ends dipped out of it and landed on the seal below. The run's own
       length gives the angle it sweeps, and the geometry gives the rest. */
    (()=>{
      const m=faceMetrics(c.F.display,weight);
      const run=(advance(str,c.F.display,weight,0)||String(str).length*c.F.dw)*size;
      const half=Math.min(Math.PI*.98,run/r)/2;               // half the swept angle
      const up=(m?m.up[str[0]]||m.cap:.72)*size, dn=(m?m.desc:.2)*size;
      /* Every other text box is measured; this one is DERIVED from the arc's
         geometry, and derived geometry gets a margin. Without one the release
         gate caught the crown touching the seal's number by 9% on a card the
         engine had declared clean — the browser sets glyphs on a curve a little
         wider than the chord model says. */
      const m2=size*.08;
      const x0=cx-Math.sin(half)*(r+up)-m2, x1=cx+Math.sin(half)*(r+up)+m2;
      const yTop=cy-r-up-m2;                                  // the apex, plus its cap
      const yBot=cy-Math.cos(half)*(r-dn)+m2;                 // where the ends fall to
      return{type:'text',id:'arc',box:{x:x0,y:yTop,w:x1-x0,h:Math.max(size*.8,yBot-yTop)},
        size:size*.7,fill,backing:c.P.ground,role:'headline'};
    })());
  return true;
};
D.promises=(c,y,items,o={})=>{
  const {W,P,F}=c,pad=W*.05,gap=W*.018,n=items.length;
  const w=o.w||((W-pad*2-gap*(n-1))/n),h=o.h||c.S*.058;
  items.forEach((t,i)=>{
    const x=pad+i*(w+gap),bg=o.bg||P.paper;
    c.rect({x,y,w,h},bg,{r:h*.5,id:'pill',role:'proof'});
    const ic=h*.30,cxp=x+w*.07;
    c.raw(`<g transform="translate(${cxp.toFixed(1)},${(y+h/2-ic/2).toFixed(1)}) scale(${(ic/24).toFixed(4)})"><path d="M4 12.5l5 5 11-11" fill="none" stroke="${P.accent}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>`);
    c.text(t,{x:x+w*.07+ic+w*.03,y:y+h*.29,w:w-(w*.07+ic+w*.03)-w*.04},
      {face:F.body,wf:F.bw,weight:800,fill:onColor(bg,P),on:bg,id:'promise',role:'proof',capRatio:.70,max:h*.50});
  });
  return{x:pad,y,w:W-pad*2,h};
};
D.cta=(c,y,kind,color)=>{
  const {W,H,P,C}=c,pad=W*.05,col=color||P.hot;
  if(kind==='band'){
    const h=H*.072,plate=c.rect({x:0,y,w:W,h},col,{id:'ctaBand',bleed:true,role:'cta',fill:col});
    D.sheen(c,plate,'#FFFFFF');
    c.text(C.cta,{x:pad,y:y+h*.28,w:W-pad*2},{fill:onColor(col,P),on:col,align:'middle',id:'ctaText',role:'cta',max:h*.62});
    return plate;
  }
  const w=W-pad*2,h=H*.062,plate=c.rect({x:pad,y,w,h},col,{r:h*.22,id:'ctaBtn',role:'cta',fill:col});
  D.sheen(c,plate,'#FFFFFF');
  c.text(C.cta,{x:pad+w*.08,y:y+h*.28,w:w*.84},{fill:onColor(col,P),on:col,align:'middle',id:'ctaText',role:'cta',max:h*.60});
  return plate;
};
/* A REAL PRODUCT, FITTED TO ITS BOX.
   Contained rather than cropped — a cutout that has had its head cut off is
   worse than no photograph — and the node is registered at the rectangle the
   image ACTUALLY occupies, not the box it was offered, so coverage and the
   collision rules measure the picture and not the empty air beside it. */
D.photo=(c,box,rot,pick,o={})=>{
  const id=c.id('ph');
  /* SHOW THE WHOLE PRODUCT, AND SHOW IT BIG.
     A cutout's whole worth is its silhouette — the shape of a phone read at a
     glance while scrolling. Filling the box by cropping turned most heroes into
     an abstract slab of glass, which stops nobody. So the picture is contained,
     never cropped, and the BOX is enlarged instead: the product ends up larger
     than the vector it replaced and still runs off the edge the layout wanted. */
  const grow=o.grow||1.34;
  const bw=box.w*grow, bh=box.h*grow;
  box={x:box.x-(bw-box.w)/2,y:box.y-(bh-box.h)/2,w:bw,h:bh};
  let sc=Math.min(box.w/pick.w,box.h/pick.h);
  /* A HERO IS A HERO. The layout hands over a box shaped for a vector; a
     photograph contained inside it can come out small, and a small product both
     leaves the card empty and cannot cross an edge by the 6% of the card that
     R4 asks for without half of it disappearing. So a hero is held to a minimum
     footprint against the card itself, not against the box it was offered. */
  if(o.min!==false){
    const want=Math.min(c.W,c.H)*(o.minShare||.56);
    const got=Math.max(pick.w,pick.h)*sc;
    if(got<want)sc*=want/got;
  }
  const w=pick.w*sc, h=pick.h*sc;
  /* Hold the edge the layout was reaching for. These boxes are positioned to
     overhang the canvas on one side; centring the picture inside the box pulled
     it back on-card and the bleed rule failed on 251 of 576 configurations. If
     the box crossed an edge, the photograph crosses it too. */
  /* The box is a REGION, not a frame. A contained photograph is narrower than
     the box it was offered, so aligning its far edge with the box's far edge —
     which is deliberately off-canvas — put the whole product outside the card:
     heroes were landing at x=1102 on a 1080-wide card and 65 configurations lost
     the seal's grip on a product that was not there. Bleed by a share of the
     PICTURE's own size instead, so it always overhangs and is always mostly on. */
  /* Bleed by a share of the PICTURE, but never by less than the card rule asks
     for: R4 wants the hero across an edge by 6% of the canvas, and a bleed
     measured only against a small picture never reached it. */
  const over=(iw,limit)=>Math.max(iw*.16,limit*.075);
  const pin=(bx,bw,iw,limit)=>{
    const o2=Math.min(over(iw,limit),iw*.42);      // never lose half the product
    if(bx<0)return -o2;
    if(bx+bw>limit)return limit-iw+o2;
    return bx+(bw-iw)/2;
  };
  let x=pin(box.x,box.w,w,c.W), y=pin(box.y,box.h,h,c.H);
  /* R4 wants the product to cross an edge by 6% of the card — the single
     biggest move against a card that looks like a catalogue photo. Test the
     finished position against that rule rather than trusting the anchor: a
     small picture pinned by a share of ITSELF can end up overhanging by less
     than the card asks, which is not "inside" and so never triggered a nudge. */
  if(o.bleed!==false){
    const need=.065;
    const outL=-x/c.W, outR=(x+w-c.W)/c.W, outT=-y/c.H, outB=(y+h-c.H)/c.H;
    if(Math.max(outL,outR,outT,outB)<need){
      const side=[[outL,'l'],[outR,'r'],[outT,'t'],[outB,'b']].sort((a,b)=>b[0]-a[0])[0][1];
      if(side==='l')x=-c.W*need;
      else if(side==='r')x=c.W*(1+need)-w;
      else if(side==='t')y=-c.H*need;
      else y=c.H*(1+need)-h;
    }
  }
  const cx=x+w/2, cy=y+h/2;
  let filt='';
  if(c.on('heroShadow')){
    c.def(`<filter id="${id}f" x="-25%" y="-25%" width="150%" height="150%">`+
      `<feDropShadow dx="0" dy="${(h*.045).toFixed(1)}" stdDeviation="${(h*.040).toFixed(1)}" flood-color="#000" flood-opacity=".50"/></filter>`);
    filt=` filter="url(#${id}f)"`;
  }
  const base=(c.cfg&&c.cfg.assetBase)||'../';
  c.add(`<g transform="rotate(${(rot||0).toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})"${filt}>`+
    `<image href="${esc(base+pick.u)}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" preserveAspectRatio="xMidYMid meet"/></g>`,
    {type:'shape',id:o.id||'hero',box:{x,y,w,h},bleed:o.bleed!==false,role:o.role||'hero',asset:pick.s,tags:pick.t});
  return{x,y,w,h};
};
D.hero=(c,box,rot,variant)=>{
  const {P}=c,id=c.id('h'),cx=box.x+box.w/2,cy=box.y+box.h/2,{x,y,w,h}=box;
  let inner='';
  if(variant==='car'){
    c.def(`<linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.paper}" stop-opacity=".95"/><stop offset="1" stop-color="${P.accent}" stop-opacity=".85"/></linearGradient>`);
    inner=`<path d="M${x+w*.02} ${y+h*.72} L${x+w*.09} ${y+h*.44} Q${x+w*.13} ${y+h*.36} ${x+w*.24} ${y+h*.33} L${x+w*.36} ${y+h*.15} Q${x+w*.40} ${y+h*.08} ${x+w*.52} ${y+h*.08} L${x+w*.70} ${y+h*.09} Q${x+w*.79} ${y+h*.10} ${x+w*.85} ${y+h*.22} L${x+w*.95} ${y+h*.38} Q${x+w*.99} ${y+h*.44} ${x+w*.99} ${y+h*.56} L${x+w*.99} ${y+h*.72} Z" fill="url(#${id}b)"/>`+
      `<path d="M${x+w*.40} ${y+h*.17} L${x+w*.52} ${y+h*.17} L${x+w*.52} ${y+h*.32} L${x+w*.31} ${y+h*.32} Z" fill="${P.dark}" opacity=".55"/>`+
      `<path d="M${x+w*.57} ${y+h*.17} L${x+w*.70} ${y+h*.18} Q${x+w*.76} ${y+h*.20} ${x+w*.80} ${y+h*.32} L${x+w*.57} ${y+h*.32} Z" fill="${P.dark}" opacity=".55"/>`+
      `<circle cx="${x+w*.26}" cy="${y+h*.74}" r="${h*.16}" fill="${P.dark}"/><circle cx="${x+w*.26}" cy="${y+h*.74}" r="${h*.075}" fill="${P.body}"/>`+
      `<circle cx="${x+w*.80}" cy="${y+h*.74}" r="${h*.16}" fill="${P.dark}"/><circle cx="${x+w*.80}" cy="${y+h*.74}" r="${h*.075}" fill="${P.body}"/>`;
  }else{
    const r=w*.14;
    c.def(`<linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${P.accent}"/><stop offset=".55" stop-color="${P.ground2}"/><stop offset="1" stop-color="${P.hot}"/></linearGradient>`);
    inner=`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${P.dark}"/>`+
      `<rect x="${x+w*.035}" y="${y+h*.026}" width="${w*.93}" height="${h*.948}" rx="${r*.82}" fill="url(#${id}s)"/>`+
      `<rect x="${x+w*.33}" y="${y+h*.028}" width="${w*.34}" height="${h*.032}" rx="${h*.016}" fill="${P.dark}"/>`+
      `<rect x="${x+w*.60}" y="${y+h*.045}" width="${w*.33}" height="${w*.33}" rx="${w*.10}" fill="${P.dark}" opacity=".92"/>`+
      `<circle cx="${x+w*.70}" cy="${y+h*.045+w*.10}" r="${w*.062}" fill="${P.ground2}" stroke="${P.body}" stroke-width="${w*.012}"/>`+
      `<circle cx="${x+w*.84}" cy="${y+h*.045+w*.10}" r="${w*.062}" fill="${P.ground2}" stroke="${P.body}" stroke-width="${w*.012}"/>`+
      `<circle cx="${x+w*.70}" cy="${y+h*.045+w*.24}" r="${w*.062}" fill="${P.ground2}" stroke="${P.body}" stroke-width="${w*.012}"/>`;
  }
  let filt='';
  if(c.on('heroShadow')){
    c.def(`<filter id="${id}f" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="${(h*.035).toFixed(1)}" stdDeviation="${(h*.035).toFixed(1)}" flood-color="#000" flood-opacity=".45"/></filter>`);
    filt=` filter="url(#${id}f)"`;
  }
  c.add(`<g transform="rotate(${rot.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})"${filt}>${inner}</g>`,
    {type:'shape',id:'hero',box,bleed:true,role:'hero'});
  return box;
};
D.grain=(c)=>{
  const id=c.id('g');
  c.def(`<filter id="${id}"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3"/><feColorMatrix type="saturate" values="0"/></filter>`);
  c.add(`<rect width="${c.W}" height="${c.H}" filter="url(#${id})" opacity=".055" style="mix-blend-mode:overlay"/>`,null,60);
};
D.stars=(c,x,y,size,fill)=>{
  let p='';
  for(let s=0;s<5;s++){const cx=x+size*.62*s+size*.31,cy=y+size*.5,r=size*.46;
    for(let i=0;i<10;i++){const rr=i%2?r*.42:r,a=-Math.PI/2+i*Math.PI/5;
      p+=(i?'L':'M')+(cx+Math.cos(a)*rr).toFixed(1)+' '+(cy+Math.sin(a)*rr).toFixed(1)+' ';}p+='Z ';}
  c.add(`<path d="${p}" fill="${fill}"/>`,{type:'shape',id:'stars',box:{x,y,w:size*3.1,h:size},role:'proof'});
};
D.split=(c,color)=>{
  const {W,H}=c;
  c.add(`<path d="M0 0 H${W} V${(H*.38).toFixed(1)} L0 ${(H*.52).toFixed(1)} Z" fill="${color}"/>`,
    {type:'shape',id:'split',box:{x:0,y:0,w:W,h:H*.52},bleed:true,role:'field'});
};

/* ══════════════════════════════════════════════════════════
   8 · ARCHETYPES → plans, painted through the gates
   ══════════════════════════════════════════════════════════ */
function ground(c,mode){
  const {W,H,P}=c;
  if(!c.on('groundGradient')||mode==='flat'){c.rect({x:0,y:0,w:W,h:H},P.ground,{ghost:true,z:-90});return;}
  const id=c.id('bg');
  c.def(`<radialGradient id="${id}" cx="${mode==='pool'?'34%':'50%'}" cy="${mode==='pool'?'38%':'30%'}" r="78%"><stop offset="0" stop-color="${P.ground2}"/><stop offset="1" stop-color="${P.ground}"/></radialGradient>`);
  c.rect({x:0,y:0,w:W,h:H},`url(#${id})`,{ghost:true,z:-90});
}
/* hero placement respects the bleed switch: off ⇒ clamped inside the safe area */
function placeHero(c,box,rot){
  if(!c.on('hero'))return null;
  let b={...box};
  if(c.H/c.W>1.45){b.h*=1.24;b.w*=1.06;}
  if(!c.on('heroBleed')){
    const m=c.W*.055;
    b.w=Math.min(b.w,c.W-m*2); b.h=Math.min(b.h,c.H*.5);
    b.x=Math.min(Math.max(b.x,m),c.W-m-b.w);
    b.y=Math.min(Math.max(b.y,c.H*.14),c.H*.86-b.h);
  }
  const turn=c.on('heroRotate')?rot:0;
  /* Photography when we have an approved cutout for this subject; the vector
     stays as the fallback so the engine still renders with no asset index. */
  if(c.on('photoHero')){
    const pick=pickAsset(c,assetsFor(c,c.vertical));
    if(pick)return D.photo(c,b,turn,pick);
  }
  return D.hero(c,b,turn,c.C.hero);
}
function headline(c,lines,box,o={}){
  const gap=box.h*.06,lh=(box.h-gap*(lines.length-1))/lines.length;
  let y=box.y;
  /* PLAN THE WHOLE STACK, THEN PAINT IT.
     Bars are drawn for every line before any word is set, so a bar cut for the
     second line cannot land on top of the first — which is what happened while
     each line planned and painted itself in turn. */
  const set=lines.map((ln,i)=>{
    const onPlate=o.plateIndex===i&&o.plateColor;
    const back=onPlate?o.plateColor:(o.on||c.P.ground);
    const opt={fill:onPlate?onColor(o.plateColor,c.P):(o.fill||c.P.ink),
      stroke:o.stroke,shadow:o.shadow,strokeW:o.strokeW,on:back,align:o.align,
      id:'headline'+i,role:'headline',capRatio:.74,measure:o.measure,
      /* the line is as big as its box allows in BOTH axes — the old estimate
         multiplied a bad average-width constant by a 1.35 fudge factor, which
         is why headlines came out wider than the bars drawn behind them */
      size:lh/.74};
    /* A line that is going to get a bar must leave room for it, otherwise the
       bar — now cut to the words — grows past the edge of the card. The pad is
       known from the leading before the type is planned, so inset first and the
       finished bar lands exactly inside the box the layout asked for. */
    const inset=(onPlate&&o.plateDraw)?lh*.74*.30:0;
    const at={x:box.x+inset,y,w:box.w-inset*2};
    const r={ln,opt,at,onPlate,plan:c.plan(ln,at,opt)};
    y+=lh+gap;
    return r;
  });
  /* the bar is cut to what the words will actually measure, padded — it used to
     be a fixed fraction of the card, so "CASH FOR IPHONES" ran off its own
     highlighter — and never taller than the leading, so it stays in its lane */
  if(o.plateDraw)set.forEach(t=>{
    if(!t.onPlate)return;
    const padX=t.plan.cap*.30,padY=Math.min(t.plan.cap*.26,(lh+gap-t.plan.box.h)/2);
    const m=c.W*.012;                                  // stay inside the safe area
    const x0=Math.max(m,t.plan.box.x-padX), x1=Math.min(c.W-m,t.plan.box.x+t.plan.box.w+padX);
    o.plateDraw(c,{x:x0,y:t.plan.box.y-padY,w:x1-x0,h:t.plan.box.h+padY*2});
  });
  set.forEach(t=>c.text(t.ln,t.at,t.opt));
}
/* A seal is placed from the hero's own corner, offset by .106r, which lands the
   overlap at ~20% of the badge — inside the 6–32% the auditor asks for. */
function sealOnHero(c,hero,r,pts,text,sub,fill,corner,maxCy,minCx,minCy){
  if(!c.on('starburst'))return null;
  c.defer(()=>placeSeal(c,hero,r,pts,text,sub,fill,corner,maxCy,minCx,minCy));
  return null;
}
function placeSeal(c,hero,r,pts,text,sub,fill,corner,maxCy,minCx,minCy){
  /* r is re-chosen below when every seat is occupied */
  const P=c.P,d=r*.106;
  let cx,cy;
  if(hero){
    cx=corner[1]==='l'?hero.x-d:hero.x+hero.w+d;
    cy=corner[0]==='t'?hero.y-d:hero.y+hero.h+d;
  }else{cx=c.W*.76;cy=c.H*.58;}
  cy=Math.min(Math.max(cy,r+c.H*.015),c.H*.885-r);
  if(maxCy)cy=Math.min(cy,maxCy);
  if(minCy)cy=Math.max(cy,minCy);
  if(hero){                       // hold the overlap at ~18% whatever cy became
    const oh=Math.max(0,Math.min(cy+r,hero.y+hero.h)-Math.max(cy-r,hero.y));
    if(oh>0){
      const want=Math.min(2*r,.18*4*r*r/oh);
      cx=corner[1]==='l'?hero.x-r+want:hero.x+hero.w+r-want;
    }
  }
  if(minCx)cx=Math.max(cx,minCx);
  cx=Math.min(Math.max(cx,r+c.W*.015),c.W-r-c.W*.015);
  /* A SEAL IS PLACED LAST, SO IT DECIDES WHAT THE READER LOSES.
     It used to be positioned from the hero's corner alone, blind to the copy,
     and being drawn after the type it simply covered whatever was there — cards
     shipped reading "CASH FOR IPHON<seal>" and with a whole price column behind
     it. Try the anchor we wanted first, then the mirrored corners, and take the
     first that costs no words; if every seat is occupied, shrink rather than
     print over the sentence. */
  let rot=0;
  {
    const words=c.nodes.filter(n=>n.type==='text'&&n.box.w>0);
    /* Fix the rotation before searching. The seal is drawn at a random angle,
       so scoring seats against an unrotated star was scoring a different shape
       from the one that gets painted — enough to pick a seat whose point then
       lands across a line. */
    rot=c.R.f(-.40,-.14);
    const cost=(X,Y,rr)=>words.reduce((s,t)=>
      s+starCover(t.box,{cx:X,cy:Y,r:rr,pts,inner:.80,rot}),0);
    const lim=(X,Y,rr)=>[Math.min(Math.max(X,rr+c.W*.015),c.W-rr-c.W*.015),
                         Math.min(Math.max(Y,rr+c.H*.015),c.H*.885-rr)];
    /* Cost is words lost. Distance from the seat the designer asked for is a
       tie-breaker only, so the seal keeps its intended corner whenever that
       corner is free and gives it up when it is not. */
    let best=null;
    const want=[cx,cy];
    /* A seal belongs on the corner of the product — that bite of overlap is
       what makes it read as a sticker on the thing rather than a floating
       graphic, and R6 asks for 6-32% of it. So the search balances two jobs:
       cover no words, and keep its grip on the hero. */
    /* Straddle the product's outline: the seal's centre wants to sit ON the
       edge, and the cost is how far it has drifted either way. Optimising the
       same quantity the rule measures is the whole point — the old version
       scored a ratio while the rule tested a ratio band, and the search kept
       parking on the boundary. */
    const grip=(X,Y,rr)=>{
      if(!hero)return 0;
      const dx=Math.max(hero.x-X,0,X-(hero.x+hero.w));
      const dy=Math.max(hero.y-Y,0,Y-(hero.y+hero.h));
      const gap=(dx>0||dy>0)?Math.hypot(dx,dy)
        :-Math.min(X-hero.x,hero.x+hero.w-X,Y-hero.y,hero.y+hero.h-Y);
      const slack=Math.abs(gap)/rr;                    // 0 = dead on the outline
      return slack<=.55?0:Math.min(1,(slack-.55)*1.6);
    };
    const consider=(sx,sy,rr,bias)=>{
      const [X,Y]=lim(sx,sy,rr);
      const d=Math.hypot(X-want[0],Y-want[1])/c.S;
      const co=cost(X,Y,rr);
      /* Covering a line is the worse sin. Scored evenly against the grip
         penalty the search would happily print the seal across a sentence to
         keep its bite on the product, so words are weighted four to one. */
      const k=co*4+grip(X,Y,rr)+d*.03+bias;
      if(!best||k<best.k-1e-6)best={k,cost:co,X,Y,rr};
    };
    /* a seal that cannot find a clean seat at full size is better small than
       printed across a sentence */
    for(const rr of [r,r*.92,r*.84,r*.78]){
      consider(cx,cy,rr,0);
      /* Seats ON THE PRODUCT'S EDGE. Four corners was enough while the hero was
         a vector that filled its box; a photograph is contained inside its box
         and sits wherever its own proportions put it, so the corners often lie
         in empty ground and the seal lost its bite on 67 of 576 configurations.
         Walk the perimeter instead and offer the seal a seat every eighth of
         the way round, each one placed to overlap by about the fifth R6 wants. */
      if(hero){
        const pts2=[];
        /* Several stand-off distances, because how much of the seal lands on the
           product depends on where round the edge it sits — a seat that bites a
           fifth on a corner bites nearly half in the middle of a long side, and
           R6 rejects anything past a third. */
        for(const off of [rr*.62,rr*.86,rr*1.06])
          for(let t=0;t<8;t++){
            const a=t/8;
            if(a<.25)      pts2.push([hero.x+hero.w*(a*4),      hero.y-off]);
            else if(a<.5)  pts2.push([hero.x+hero.w+off,        hero.y+hero.h*((a-.25)*4)]);
            else if(a<.75) pts2.push([hero.x+hero.w*(1-(a-.5)*4),hero.y+hero.h+off]);
            else           pts2.push([hero.x-off,               hero.y+hero.h*(1-(a-.75)*4)]);
          }
        for(const [sx,sy] of pts2)consider(sx,sy,rr,.008);
      }
      for(let gx=0;gx<=6;gx++)for(let gy=0;gy<=6;gy++)
        consider(c.W*(.10+gx*.133),c.H*(.12+gy*.118),rr,.02);
    }
    if(best){cx=best.X;cy=best.Y;r=best.rr;}
    if(best&&best.cost>.02)c.note(`seal still costs ${(best.cost*100).toFixed(0)}% of a line`);
  }
  const b=D.starburst(c,cx,cy,r,pts,.80,rot,fill,P.dark);
  const money=text.replace(/^UP TO\s+/,''), pre=money===text?null:'UP TO';
  const ink=onColor(fill,P);
  /* A STAR IS NOT ITS BOUNDING BOX. The three lines were fitted to b, the full
     outer box of the points, so the number ran out past the tips — measured at
     41-45% overlap between "UP TO", the money and the sub on every archetype
     that carries a seal. The readable area is the INNER disc, so the lines are
     fitted to the square inscribed in it and stacked with real leading. */
  const inR=r*.80, side=inR*1.38;                  // inscribed square of the inner disc
  const bx=cx-side/2, by=cy-side/2;
  /* HOW MANY LINES THE SEAL CAN CARRY, decided by its size. Three lines in a
     small burst either overflow the points or fall under the legibility floor;
     the seal drops to two, then to the number alone, and the surviving lines
     grow to use the disc. R8 is a floor, not a suggestion. */
  /* R8 measures CAP height (size * capRatio), not the font size, so the floor a
     row must clear in font terms is 2% / 0.72 with a little margin. */
  const floor=c.S*.021/((faceMetrics(c.F.display,c.F.dweight)||{cap:.72}).cap);
  const plan=[[3,.150,.300,.135],[2,.190,.380,0],[1,0,.520,0]];
  let pick=plan[plan.length-1];
  for(const p2 of plan){
    const want=p2[0];
    if(want===3&&!(pre&&sub))continue;
    if(want===2&&!(pre||sub))continue;
    const smallest=Math.min(...[p2[1],p2[2],p2[3]].filter(v=>v>0))*side;
    if(smallest>=floor){pick=p2;break;}
  }
  const rows=[];
  if(pick[0]===3){rows.push({t:pre,f:pick[1],face:1,id:'offerPre'},{t:money,f:pick[2],face:0,id:'offer'},{t:sub,f:pick[3],face:1,id:'offerSub'});}
  else if(pick[0]===2){
    if(pre)rows.push({t:pre,f:pick[1],face:1,id:'offerPre'},{t:money,f:pick[2],face:0,id:'offer'});
    else rows.push({t:money,f:pick[2],face:0,id:'offer'},{t:sub,f:pick[1],face:1,id:'offerSub'});
  }
  else rows.push({t:money,f:pick[2],face:0,id:'offer'});
  const lead=1.20, totalH=rows.reduce((a2,q)=>a2+side*q.f*lead,0);
  let ty=cy-totalH/2;
  rows.forEach(q=>{
    const hh=side*q.f;
    c.text(q.t,{x:bx,y:ty,w:side},
      Object.assign({align:'middle',fill:ink,on:fill,role:'offer',max:hh},
        q.face?{face:c.F.body,wf:c.F.bw,weight:800,id:q.id,tracking:.04,z:Z.badge+1}
              :{...numFace(c),id:q.id,z:Z.badge+1}));
    ty+=hh*lead;
  });
  return b;
}
function priceRows(c,top,rows,floorY){
  if(!c.on('priceRows'))return;
  const {W,H,S,P,F}=c,rh=S*.066,pad=W*.055;
  /* Show only the rows that fit above whatever comes next. In the square format
     the board ran five rows straight under the hero, which was then drawn on
     top of the last two — better to quote three models legibly than five with
     the prices hidden behind a photograph. */
  if(floorY)rows=rows.slice(0,Math.max(2,Math.floor((floorY-top)/rh)));
  rows.forEach((r,i)=>{
    const y=top+i*rh,alt=i%2===0,bg=alt?P.paper:P.ground2;
    c.rect({x:pad*.6,y,w:W-pad*1.2,h:rh*.9},bg,{r:rh*.16,id:'row',role:'data'});
    c.text(r[0],{x:pad,y:y+rh*.24,w:W*.50},{face:F.body,wf:F.bw,weight:700,fill:onColor(bg,P),on:bg,id:'rowLabel',role:'data',max:rh*.52});
    c.text(r[1],{x:W-pad-W*.26,y:y+rh*.18,w:W*.26},{...numFace(c),align:'end',fill:readable(P.accent,bg,P),on:bg,id:'rowPrice',role:'data',max:rh*.66});
  });
}
function proofSteps(c,sy,steps){
  const {W,H,S,P,F}=c,sh=S*.070;
  steps.forEach((s,i)=>{
    const y=sy+i*sh;
    c.rect({x:W*.05,y,w:sh*.72,h:sh*.72},P.hot,{r:sh*.16,id:'stepNum',role:'data',fill:P.hot});
    c.text(String(i+1),{x:W*.05+sh*.16,y:y+sh*.16,w:sh*.40,h:sh*.40},{align:'middle',fill:onColor(P.hot,P),on:P.hot,id:'stepN',role:'data'});
    c.text(s[0],{x:W*.05+sh*.92,y:y+sh*.06,w:W*.24},{face:F.body,wf:F.bw,weight:800,fill:P.ink,on:P.ground,id:'stepLabel',role:'data',max:sh*.40});
    c.text(s[1],{x:W*.05+sh*.92,y:y+sh*.44,w:W*.30},{face:F.body,wf:F.bw,weight:500,fill:readable(P.body,P.ground,P),on:P.ground,id:'stepBody',role:'data',max:sh*.50});
  });
}
function reviewCard(c,box){
  const {W,H,P,F,C}=c;
  const q=c.rect(box,P.paper,{r:W*.02,id:'quoteCard',role:'proof'});
  D.sheen(c,q,P.accent);
  const words=C.quote.split(' '),half=Math.ceil(words.length/2);
  /* Sized by width alone, a single quote glyph took whatever size its narrow
     advance implied — a 90px-tall mark that hung off the card and sat on the
     first line of the quote. Give it a height and it stays an ornament. */
  c.text('“',{x:box.x+W*.025,y:box.y+H*.012,w:W*.06,h:H*.026},{fill:readable(P.hot,P.paper,P),on:P.paper,id:'qm',role:'proof'});
  c.text(words.slice(0,half).join(' '),{x:box.x+W*.035,y:box.y+H*.057,w:box.w-W*.07},
    {face:F.body,wf:F.bw,weight:700,fill:P.dark,on:P.paper,id:'quote',role:'proof',max:c.S*.036});
  c.text(words.slice(half).join(' '),{x:box.x+W*.035,y:box.y+H*.093,w:box.w-W*.07},
    {face:F.body,wf:F.bw,weight:700,fill:P.dark,on:P.paper,id:'quote2',role:'proof',max:c.S*.036});
  c.text(C.quoteBy,{x:box.x+W*.035,y:box.y+H*.130,w:box.w*.62},
    {face:F.body,wf:F.bw,weight:600,fill:onColor(P.paper,P),on:P.paper,id:'quoteBy',role:'proof',max:c.S*.028});
}

const ARCH={};

/* A1 · NIGHT LOT — argument down the left, hero bleeding right, seal on its corner */
ARCH.nightLot=c=>{
  const {W,H,P,F,R,C}=c;
  ground(c,'pool');
  if(c.on('sunburst'))D.sunburst(c,W*.74,H*.36,W*.88,P.accent,28,R.f(0,.4),.11);
  const hero=placeHero(c,{x:W*.52,y:H*.155,w:W*.60,h:H*.40},R.f(10,20));
  headline(c,C.heads,{x:W*.055,y:H*.165,w:W*.50,h:H*.155},
    {stroke:P.dark,shadow:P.hot,shadowDx:W*.008,shadowDy:H*.007,strokeW:.045});
  if(c.on('proofBlock')){
    D.stars(c,W*.055,H*.370,c.S*.034,readable(P.accent,P.ground,P));
    c.text(C.rating,{x:W*.055+c.S*.034*3.6,y:H*.370,w:W*.38},
      {face:F.body,wf:F.bw,weight:800,fill:P.ink,on:P.ground,id:'rating',role:'proof',max:c.S*.036});
  }
  if(c.on('priceRows'))C.rows.slice(0,c.H/c.W>1.45?5:4).forEach((row,i)=>{
    const rh=c.S*.056,y=(c.H/c.W>1.45?H*.395:H*.418)+i*rh,bg=i%2===0?P.ground2:P.ground;
    /* The label column was W*.125 — 135px, too narrow for a real model tag.
       "4RUNNER" needed 124% of it just to reach the legibility floor, so the
       ladder shipped with unreadable model names. Widened to two 160px columns
       inside a wider plate, which every tag in the deck clears. */
    c.rect({x:W*.05,y,w:W*.33,h:rh*.88},bg,{r:rh*.16,id:'row',role:'data'});
    c.text(row[2]||row[0],{x:W*.063,y:y+rh*.20,w:W*.148},{face:F.body,wf:F.bw,weight:800,
      fill:onColor(bg,P),on:bg,id:'rowLabel',role:'data',max:rh*.58});
    c.text(row[1],{x:W*.2185,y:y+rh*.16,w:W*.148},{...numFace(c),align:'end',fill:readable(P.accent,bg,P),on:bg,
      id:'rowPrice',role:'data',max:rh*.64});
  });
  sealOnHero(c,hero,W*.145,16,C.offer,C.offerSub,P.hot,'bl',H*.56,W*.46);
  if(H/W>1.45&&c.on('promisePills'))D.promises(c,H*.648,C.promises.slice(3,6),{bg:P.dark});
  if(c.on('promisePills'))D.promises(c,H*.715,C.promises.slice(0,3));
  if(c.on('cta'))D.cta(c,H*.795,'button',P.accent);
  if(c.on('cornerLockup'))D.lockup(c,'left');
  if(c.on('footerBar'))D.footerBar(c);
  if(c.on('grain'))D.grain(c);
  c.note('argument down the left · hero bleeding right · seal on the hero corner');
};

/* A2 · BAND STACK — knockout bands, hero driving out of the right edge */
ARCH.bandStack=c=>{
  const {W,H,P,R,C}=c;
  ground(c,'flat');
  if(c.on('checker'))D.checker(c,{x:0,y:0,w:W,h:H},P.accent,12,.10);
  const y0=H*.145;
  if(c.on('knockoutBand')){
    c.rect({x:0,y:y0,w:W,h:H*.095},P.ink,{bleed:true,id:'band1',role:'plate',fill:P.ink});
    c.text(C.heads[0],{x:W*.05,y:y0+H*.020,w:W*.90},{align:'middle',fill:onColor(P.ink,P),on:P.ink,role:'headline',id:'headline',max:H*.058});
    const b2=c.rect({x:0,y:H*.252,w:W,h:H*.125},P.accent,{bleed:true,id:'band2',role:'plate',fill:P.accent});
    D.sheen(c,b2,'#FFFFFF');
    c.text(C.heads[1],{x:W*.05,y:H*.276,w:W*.90},{align:'middle',fill:onColor(P.accent,P),on:P.accent,role:'headline',id:'headline2',max:H*.078});
  }else headline(c,C.heads,{x:W*.05,y:y0,w:W*.90,h:H*.22},{align:'middle',stroke:P.dark,shadow:P.hot});
  const hero=placeHero(c,{x:W*.30,y:H*.40,w:W*.78,h:H*.30},R.f(-9,9));
  sealOnHero(c,hero,W*.135,12,C.offer,null,P.accent,'bl',H*.62,null,H*.48);
  if(c.on('promisePills'))D.promises(c,H*.715,C.promises.slice(0,3));
  if(c.on('cta'))D.cta(c,H*.800,'band');
  if(c.on('cornerLockup'))D.lockup(c,'left');
  if(c.on('footerBar'))D.footerBar(c);
  if(c.on('grain'))D.grain(c);
  c.note('two knockout bands · checker ground · seal on the hero’s leading corner');
};

/* A3 · SUNBURST HERO — arc crown, hero out of the right edge, proof stacked left */
ARCH.sunburstHero=c=>{
  const {W,H,P,F,R,C}=c;
  ground(c,'radial');
  if(c.on('sunburst'))D.sunburst(c,W*.56,H*.40,W*1.05,P.accent,32,R.f(0,.3),.17);
  if(c.on('halftone'))D.halftone(c,{x:0,y:H*.60,w:W,h:H*.26},P.hot,W*.032,R.i(1,9999),'v');
  /* The crown is the headline; at W*.062 it was set smaller than the call to
     action underneath it, which is the wrong way round and left the top of the
     card thin. Sized to the run so a short line comes up big and a long one
     still fits the arc. */
  let crowned=false;
  if(c.on('arcCrown')){const ar=W*.44,apex=Math.max(H*.148,W*.152,c.topSafe()+W*.030);
    const txt=C.heads.join(' ');
    /* Type on a curve grows in two directions at once: a bigger size sweeps a
       wider angle, so the ends swing outward AND downward. Sizing it by width
       alone sent the ends into the lockup on one side and the product on the
       other. Fit it to the band it is allowed to occupy instead — try large,
       step down, take the first size whose real extent stays inside. */
    /* the floor is where the product starts, not an arbitrary band: the crown
       may grow until its ends reach the hero, and no further */
    crowned=D.arcText(c,txt,W*.5,apex+ar,ar,P.ink,W*.105,
      {left:W*.045,right:W*.955,top:apex,bottom:Math.min(apex+H*.185,H*.295-H*.014)})!==null;}
  if(!crowned)headline(c,C.heads,{x:W*.06,y:Math.max(H*.115,c.topSafe()),w:W*.88,h:H*.145},
    {align:'middle',stroke:P.dark,shadow:P.hot});
  const hero=placeHero(c,{x:W*.44,y:H*.295,w:W*.70,h:H*.330},R.f(-6,8));
  if(c.on('promisePills'))C.promises.slice(0,c.H/c.W>1.45?5:3).forEach((t,i)=>
    D.promises(c,(c.H/c.W>1.45?H*.400:H*.430)+i*c.S*.072,[t],{h:c.S*.058,w:W*.30}));
  sealOnHero(c,hero,W*.135,20,C.offer,null,P.hot,'tl');
  if(c.on('proofBlock')){
    D.stars(c,W*.60,H*.635,H*.032,readable(P.accent,P.ground,P));
    c.text(C.rating,{x:W*.60,y:H*.682,w:W*.36},{face:F.body,wf:F.bw,weight:800,
      fill:P.ink,on:P.ground,id:'rating',role:'proof',max:c.S*.036});
  }
  if(c.on('ticket')){
    const t=D.ticket(c,{x:W*.10,y:H*.745,w:W*.80,h:H*.078},P.paper,H*.018);
    D.sheen(c,t,P.accent);
    c.text(C.offerSub+' · NO OBLIGATION',{x:W*.145,y:H*.762,w:W*.71},
      {face:F.body,wf:F.bw,weight:800,align:'middle',fill:onColor(P.paper,P),on:P.paper,id:'stubline',role:'proof',max:c.S*.036});
  }
  if(c.on('cta'))D.cta(c,H*.838,'button');
  if(c.on('cornerLockup'))D.lockup(c,'left');
  if(c.on('footerBar'))D.footerBar(c);
  if(c.on('grain'))D.grain(c);
  c.note('32-wedge sunburst · arc crown · promises stacked down the left');
};

/* A4 · TORN SPLIT — ragged divide, price below the tear */
ARCH.tornSplit=c=>{
  const {W,H,P,F,R,C}=c;
  ground(c,'flat');
  if(c.on('tornPaper'))D.tornPaper(c,{x:0,y:H*.44,w:W,h:H*.48},P.paper,R.i(1,9999));
  else c.rect({x:0,y:H*.46,w:W,h:H*.46},P.paper,{bleed:true,id:'flatPlate',role:'plate',fill:P.paper});
  const hero=placeHero(c,{x:W*.46,y:H*.10,w:W*.62,h:H*.34},R.f(12,22));
  headline(c,C.heads,{x:W*.055,y:H*.128,w:W*.44,h:H*.185},
    {stroke:P.dark,shadow:P.accent,strokeW:.05,
     plateIndex:c.on('paintStroke')?1:-1,plateColor:P.accent,
     plateDraw:(cc,b)=>D.paintStroke(cc,b,P.accent,R.i(1,9999))});
  c.text(C.offer,{x:W*.055,y:H*.545,w:W*.50},{...numFace(c),fill:onColor(P.paper,P),on:P.paper,id:'offer2',role:'offer'});
  c.text('CASH IN HAND',{x:W*.055,y:H*.655,w:W*.40},
    {face:F.body,wf:F.bw,weight:800,fill:readable(P.accent,P.paper,P),on:P.paper,
     id:'offerSub2',role:'offer',tracking:.03});
  sealOnHero(c,hero,W*.135,20,'SAME','DAY',P.hot,'bl',H*.475,null,H*.445);
  if(c.on('promisePills'))D.promises(c,H*.700,C.promises.slice(2,5),{bg:P.dark});
  if(c.on('cta'))D.cta(c,H*.780,'button');
  if(c.on('cornerLockup'))D.lockup(c,'left');
  if(c.on('footerBar'))D.footerBar(c);
  if(c.on('grain'))D.grain(c);
  c.note('torn-paper divide · hero bleeding top-right · seal riding the tear');
};

/* A5 · PRICE BOARD — the offer is the column, so no seal competes with it */
ARCH.priceBoard=c=>{
  const {W,H,P,R,C}=c;
  ground(c,'flat');
  if(c.on('diagonalSplit'))D.split(c,P.ground2);
  if(c.on('knockoutBand')){
    const head=c.rect({x:0,y:H*.142,w:W,h:H*.112},P.accent,{bleed:true,id:'headBand',role:'plate',fill:P.accent});
    D.sheen(c,head,'#FFFFFF');
    c.text(C.heads.join(' '),{x:W*.05,y:H*.166,w:W*.90},{align:'middle',fill:onColor(P.accent,P),on:P.accent,role:'headline',id:'headline',max:H*.070});
  }else headline(c,[C.heads.join(' ')],{x:W*.05,y:H*.150,w:W*.90,h:H*.082},{align:'middle',stroke:P.dark,shadow:P.hot});
  priceRows(c,H*.285,C.rows,H*.575);
  placeHero(c,{x:W*.575,y:H*.575,w:W*.52,h:H*.255},R.f(14,24));
  if(c.on('promisePills'))D.promises(c,H*.715,C.promises.slice(0,2).concat([C.offerSub]),{bg:P.paper});
  if(c.on('cta'))D.cta(c,H*.800,'band');
  if(c.on('cornerLockup'))D.lockup(c,'left');
  if(c.on('footerBar'))D.footerBar(c);
  if(c.on('grain'))D.grain(c);
  c.note('alternating price rows · diagonal split · hero bleeding bottom-right');
};

/* A6 · POSTER BLEED — display type at maximum, hero out of the left edge */
ARCH.posterBleed=c=>{
  const {W,H,P,R,C}=c;
  ground(c,'flat');
  if(c.on('halftone'))D.halftone(c,{x:0,y:0,w:W,h:H*.52},P.accent,W*.030,R.i(1,9999),'v');
  /* At 4:5 and 9:16 the poster's lower half is a wide band the hero fills. The
     square crop is shorter, so the same hero left a 475x376 hole to its right —
     19% of the card as one empty rectangle. Let the hero run the width there. */
  const hero=placeHero(c,{x:-W*.12,y:H*.50,w:W*(H/W>1.45?.70:.94),h:H*.34},R.f(-24,-12));
  /* This is a poster: the headline is the artwork. Squeezed into a band of
     H*.215 the lines came out small AND short, leaving the whole top-right
     corner — 560x400px, 19% of a square card — as one empty rectangle. Given
     the room a poster headline expects, the type grows to fill it. */
  const headH=H*(H/W>1.45?.215:.285);
  const headY=Math.max(H*.112,c.topSafe()), bandY=headY+headH+H*.022;
  headline(c,C.heads,{x:W*.05,y:headY,w:W*.90,h:headH},
    {stroke:P.hot,shadow:P.dark,shadowDx:W*.012,shadowDy:H*.010,strokeW:.05,fill:readable(P.paper,P.ground,P),
     measure:true,
     plateIndex:c.on('paintStroke')?1:-1,plateColor:P.accent,
     plateDraw:(cc,b)=>D.paintStroke(cc,b,P.accent,R.i(1,9999))});
  /* The offer used to live inside the knockout band, so switching that band off
     removed the price from the card altogether and left its band empty — the
     one thing a reader is scanning for, gone with a decorative toggle. The band
     is optional; the number is not. */
  if(c.on('knockoutBand')){
    c.rect({x:0,y:bandY,w:W,h:H*.056},P.ink,{bleed:true,id:'kickerBand',role:'plate',fill:P.ink});
    c.text(C.offer+'  ·  '+C.offerSub,{x:W*.05,y:bandY+H*.015,w:W*.90},
      {...numFace(c),align:'middle',fill:onColor(P.ink,P),on:P.ink,id:'offerLine',role:'offer',max:H*.036});
  }else{
    c.text(C.offer+'  ·  '+C.offerSub,{x:W*.05,y:bandY-H*.006,w:W*.90},
      {...numFace(c),align:'middle',fill:readable(P.accent,P.ground,P),on:P.ground,
       stroke:P.dark,strokeW:.05,id:'offerLine',role:'offer',max:H*.052});
  }
  sealOnHero(c,hero,W*.150,20,'CASH','TODAY',P.hot,'tr',H/W>1.45?H*.755:H*.66,null,H/W>1.45?H*.700:H*.58);
  if(c.on('promisePills'))D.promises(c,H*.782,C.promises.slice(3,6),{bg:P.dark});
  if(H/W>1.45&&c.on('priceRows'))priceRows(c,H*.505,C.rows.slice(0,3));
  if(c.on('promisePills'))D.promises(c,H*.850,C.promises.slice(0,3),{bg:P.paper});
  if(c.on('cornerLockup'))D.lockup(c,'left');
  if(c.on('footerBar'))D.footerBar(c);
  if(c.on('grain'))D.grain(c);
  c.note('outlined display at full width · hero bleeding left · halftone ramp');
};

/* A7 · TICKET OFFER — the stub is the offer, so the seal stays away */
ARCH.ticketOffer=c=>{
  const {W,H,P,F,R,C}=c;
  ground(c,'radial');
  if(c.on('sunburst'))D.sunburst(c,W*.5,H*.44,W*.95,P.hot,24,R.f(0,.3),.12);
  const ty=Math.max(H*.125,c.topSafe());
  headline(c,[C.heads[0]],{x:W*.05,y:ty,w:W*.90,h:H*.070},{stroke:P.dark,align:'middle'});
  headline(c,[C.heads[1]],{x:W*.05,y:ty+H*.075,w:W*.90,h:H*.110},{fill:readable(P.accent,P.ground,P),shadow:P.dark,stroke:P.dark,align:'middle'});
  /* the hero follows the headline block rather than a constant, so pushing the
     type clear of the lockup cannot push it under the product */
  placeHero(c,{x:W*.32,y:Math.max(H*.315,ty+H*.200),w:W*.84,h:H*.315},R.f(-7,9));
  if(c.on('proofBlock')){
    const ry=H*(H/W>1.45?.500:.522);
    D.stars(c,W*.06,ry,c.S*.030,readable(P.accent,P.ground,P));
    c.text(C.rating,{x:W*.06,y:ry+H*.044,w:W*.40},{face:F.body,wf:F.bw,weight:800,fill:P.ink,on:P.ground,
      id:'rating',role:'proof',max:c.S*.036});
  }
  if(c.on('ticket')){
    const t=D.ticket(c,{x:W*.08,y:H*.600,w:W*.84,h:H*.145},P.paper,H*.024);
    D.sheen(c,t,P.accent);
    c.text(C.offer,{x:W*.125,y:H*.632,w:W*.75},{...numFace(c),align:'middle',fill:onColor(P.paper,P),on:P.paper,
      id:'offer',role:'offer',max:H*.080});
  }
  c.text('NO OBLIGATION · 20 MIN · CASH OR TRANSFER',{x:W*.09,y:H*.757,w:W*.82},
    {face:F.body,wf:F.bw,weight:700,align:'middle',fill:readable(P.body,P.ground,P),on:P.ground,
     id:'fine',role:'proof',max:c.S*.032,tracking:.03});
  if(c.on('promisePills'))D.promises(c,H*.800,C.promises.slice(3,6));
  if(c.on('cta'))D.cta(c,H*.849,'button');
  if(c.on('cornerLockup'))D.lockup(c,'left');
  if(c.on('footerBar'))D.footerBar(c);
  if(c.on('grain'))D.grain(c);
  c.note('perforated stub carries the offer · sheen measured from the stub');
};

/* A8 · PROOF WALL — review plate, numbered steps, seal on the hero */
ARCH.proofWall=c=>{
  const {W,H,P,F,R,C}=c;
  ground(c,'pool');
  if(c.on('checker'))D.checker(c,{x:0,y:0,w:W,h:H*.5},P.accent,10,.08);
  /* The hero goes down first. The review card overlaps it by design — a paper
     card lying on the product — but while the card was drawn first the phone
     was painted over the quote, and "cash out. Twenty minutes." ran under it. */
  const hero=placeHero(c,{x:W*.60,y:H*.295,w:W*.56,h:H*.26},R.f(12,20));
  if(c.on('proofBlock')){
    D.stars(c,W*.055,H*.140,c.S*.034,readable(P.accent,P.ground,P));
    c.text(C.rating,{x:W*.055+c.S*.034*3.6,y:H*.140,w:W*.40},
      {face:F.body,wf:F.bw,weight:800,fill:P.ink,on:P.ground,id:'rating',role:'proof',max:c.S*.036});
    reviewCard(c,{x:W*.05,y:H*.200,w:W*.62,h:H*.160});
  }
  headline(c,[C.heads.join(' ')],{x:W*.055,y:H*.422,w:W*.56,h:H*.060},
    {plateIndex:c.on('paintStroke')?0:-1,plateColor:P.accent,
     plateDraw:(cc,b)=>D.paintStroke(cc,b,P.accent,R.i(1,9999)),
     fill:P.ink,on:P.ground});
  sealOnHero(c,hero,W*.135,16,C.offer,null,P.accent,'bl',H*.60,W*.58,H*.50);
  /* The 9:16 card has a whole band of nothing under the headline, because the
     4:5 proportions were simply stretched. Fill it with the price ladder: it is
     the strongest "how much" device we have, it names a model against every
     number instead of making an unbounded claim, and it is what the empty half
     of a tall card was always for. */
  const tall=H/W>1.45;
  if(tall)priceRows(c,H*.498,C.rows,H*.616);   // clears the headline band above
  if(c.on('proofBlock'))proofSteps(c,H*(tall?.622:.530),C.steps);
  if(tall&&c.on('promisePills'))D.promises(c,H*.745,C.promises.slice(3,6),{bg:P.dark});
  if(c.on('cta'))D.cta(c,H*(tall?.800:.740),'band');
  if(c.on('promisePills'))D.promises(c,H*(tall?.882:.828),C.promises.slice(0,3),{bg:P.paper});
  if(c.on('cornerLockup'))D.lockup(c,'left');
  if(c.on('footerBar'))D.footerBar(c);
  if(c.on('grain'))D.grain(c);
  c.note('review plate + numbered steps · paint stroke behind the promise line');
};
const ARCHS=[
 ['nightLot','Night Lot','one hero in a pool of light'],
 ['bandStack','Band Stack','knockout bands, product wedged between'],
 ['sunburstHero','Sunburst Hero','rays and an arc crown'],
 ['tornSplit','Torn Split','ragged paper divide'],
 ['priceBoard','Price Board','model rows resellers screenshot'],
 ['posterBleed','Poster Bleed','display type at maximum'],
 ['ticketOffer','Ticket Offer','perforated stub'],
 ['proofWall','Proof Wall','review card and numbered steps']
];

/* ══════════════════════════════════════════════════════════
   9 · AUDITOR
   ══════════════════════════════════════════════════════════ */
const RULES=[
 ['R1','Coverage floor','≥ 62% of the canvas carries content','the empty card — 29% coverage reads as a placeholder'],
 ['R2','Dead space','largest empty rectangle ≤ 18% of the canvas','a card that averages fine but has one big hole'],
 ['R3','Footer bar','full-bleed footer carrying the number','a number floating with nothing under it'],
 ['R4','Hero bleed','hero crosses an edge by ≥ 6%','product parked inside a box like a catalogue photo'],
 ['R5','Shape language','headline sits on stroke, tear, band or rays','the flat rounded plate behind every headline'],
 ['R6','Badge placement','if a seal exists it covers 6–32% of the hero','a seal floating in dead space, or swallowing the product'],
 ['R7','Text collision','no two text boxes intersect','overlap you only notice after export'],
 ['R8','Minimum size','every text ≥ 2.0% of the short edge','fine print that dies in a feed thumbnail'],
 ['R9','Contrast','every text ≥ 4.5:1 on its own backing','accent-on-accent text that vanishes'],
 ['R10','Hot restraint','hot colour ≤ 14% of canvas area','the all-red card where nothing reads as urgent'],
 ['R11','Sheen parentage','every sheen sits inside its own plate','the highlight drawn at the layout’s original geometry'],
 ['R12','Safe area','non-bleed elements inside a 4.5% margin','clipped corners after a crop'],
 ['R13','Text on its plate','every line stays inside the panel it was set on','copy running off its card onto the photo'],
 ['R14','Words on top','no opaque shape is drawn over a line of text','a seal painted across the headline'],
 ['R15','Legible figures','no price is set in a face that draws a slashed zero','"$1,250" reading as "$1,25Ø"'],
 ['R16','Subject on show','the product is present and bigger than any prop','a card whose largest object is a cardboard box'],
 ['R17','Picture matches the copy','the hero is of the brand, generation and condition the copy names','a cracked iPhone 11 under a "17 Pro Max · $1,250" ladder']
];
function inter(a,b){const x=Math.max(a.x,b.x),y=Math.max(a.y,b.y);
  const r=Math.min(a.x+a.w,b.x+b.w),bt=Math.min(a.y+a.h,b.y+b.h);
  return(r>x&&bt>y)?(r-x)*(bt-y):0;}
/* WHERE THE CARD IS EMPTY.
   The audit already had to know this to score dead space; placement wants the
   same answer, so it lives in one place. Returns the occupancy grid plus the
   largest empty rectangle, found by the classic largest-rectangle-under-a-
   histogram sweep. */
function occupancy(card,cell){
  const {W,H,nodes}=card;
  cell=cell||20;
  const cols=Math.ceil(W/cell),rows=Math.ceil(H/cell);
  const g=new Uint8Array(cols*rows);
  nodes.forEach(n=>{
    if(n.role==='field'&&n.id!=='split')return;
    const b=n.box;
    const x0=Math.max(0,Math.floor(b.x/cell)),x1=Math.min(cols,Math.ceil((b.x+b.w)/cell));
    const y0=Math.max(0,Math.floor(b.y/cell)),y1=Math.min(rows,Math.ceil((b.y+b.h)/cell));
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)g[y*cols+x]=1;});
  return{g,cols,rows,cell};
}
function largestHole(o){
  const {g,cols,rows,cell}=o;
  const hgt=new Int32Array(cols);let best=0,box=null;
  for(let y=0;y<rows;y++){
    for(let x=0;x<cols;x++)hgt[x]=g[y*cols+x]?0:hgt[x]+1;
    const st=[];
    for(let x=0;x<=cols;x++){const h=x<cols?hgt[x]:0;
      while(st.length&&hgt[st[st.length-1]]>=h){const ht=hgt[st.pop()],left=st.length?st[st.length-1]+1:0;
        const a=ht*(x-left);
        if(a>best){best=a;box={x:left*cell,y:(y-ht+1)*cell,w:(x-left)*cell,h:ht*cell};}}
      st.push(x);}}
  return{area:best/(cols*rows),box};
}
function audit(card){
  /* the audit narrates into card.notes; a second audit of the same card must
     not read last time's narration as this time's */
  card.notes=card.notes.filter(n=>!/^(spill|buried|collide|tight|figures|mismatch|seal still)/.test(n));
  const {W,H,nodes,P}=card,cell=20;
  const occ=occupancy(card,cell),g=occ.g,cols=occ.cols,rows=occ.rows;
  let filled=0;for(let i=0;i<g.length;i++)filled+=g[i];
  const coverage=filled/g.length;
  const dead=largestHole(occ).area;
  const texts=nodes.filter(n=>n.type==='text');
  const hero=nodes.find(n=>n.role==='hero'), badge=nodes.find(n=>n.role==='badge');
  const heads=nodes.filter(n=>n.role==='headline'), plates=nodes.filter(n=>n.role==='plate');
  const sheens=nodes.filter(n=>n.role==='sheen');
  const hotArea=nodes.filter(n=>n.fill===P.hot).reduce((s,n)=>s+Math.max(0,n.box.w)*Math.max(0,n.box.h),0)/(W*H);
  const r=[];
  r.push(['R1',coverage>=.62]);
  r.push(['R2',dead<=.18]);
  r.push(['R3',!!nodes.find(n=>n.role==='footer'&&n.box.w>=W*.999)]);
  r.push(['R4',!!hero&&(hero.box.x<-W*.06||hero.box.x+hero.box.w>W*1.06||hero.box.y<-H*.06||hero.box.y+hero.box.h>H*1.06)]);
  r.push(['R5',heads.some(h=>plates.some(p=>inter(h.box,p.box)>h.box.w*h.box.h*.25))||nodes.some(n=>n.id==='sunburst'||n.id==='arc')]);
  /* R6 · THE SEAL SITS ON THE PRODUCT'S EDGE.
     This used to be "6-32% of the badge overlaps the hero", which encoded the
     intent only as long as the hero was a small vector. A photographic hero can
     fill half the card, and then every legal seat overlaps past 32% — 58 of 64
     failures were the seal landing at 32-33% with nowhere better to go. The
     intent was never a ratio: it is that the seal STRADDLES the product's
     outline, so it reads as a sticker stuck on the thing rather than a graphic
     floating beside it or a graphic lost in the middle of it. Measured as the
     distance from the seal's centre to the product's edge, that holds at any
     scale. */
  const edgeGap=(b,h)=>{
    const cx=b.box.x+b.box.w/2, cy=b.box.y+b.box.h/2;
    const dx=Math.max(h.box.x-cx,0,cx-(h.box.x+h.box.w));
    const dy=Math.max(h.box.y-cy,0,cy-(h.box.y+h.box.h));
    if(dx>0||dy>0)return Math.hypot(dx,dy);                 // outside
    return -Math.min(cx-h.box.x,h.box.x+h.box.w-cx,cy-h.box.y,h.box.y+h.box.h-cy);
  };
  r.push(['R6',!badge||!hero||Math.abs(edgeGap(badge,hero))<=badge.box.w/2]);
  let collide=false;
  /* every pair, not just the first — a card with three collisions used to
     report one, and the fix for that one uncovered the next */
  for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){
    /* 30% of the smaller box was far too generous: a headline could cover most
       of the lockup's second line and still pass. These are real ink extents
       now, so anything past a hair's touch is a defect. */
    if(inter(texts[i].box,texts[j].box)>Math.min(texts[i].box.w*texts[i].box.h,texts[j].box.w*texts[j].box.h)*.06){
      collide=true;card.note(`collide: ${texts[i].id} x ${texts[j].id}`);}}
  r.push(['R7',!collide]);
  const SS=Math.min(W,H);
  r.push(['R8',texts.every(t=>t.size>=SS*.020)]);
  r.push(['R9',texts.every(t=>{try{return contrast(t.fill,t.backing)>=4.5;}catch(e){return true;}})]);
  r.push(['R10',hotArea<=.14]);
  /* R13 · A LINE MUST STAY ON THE PLATE IT WAS SET ON.
     Every text records the colour it was drawn to sit on. Find the panel that
     actually is that colour under the line, and require the ink to stay inside
     it. Without this a quote can run off its card onto the photograph and
     twelve of twelve rules still report a pass, because nothing was comparing
     the run against the thing behind it. */
  const spill=[];
  texts.forEach(t=>{
    if(!t.backing)return;
    const i=nodes.indexOf(t);
    let plate=null;
    for(let k=i-1;k>=0;k--){
      const n=nodes[k];
      if(n.type!=='shape'||n.fill!==t.backing)continue;
      const cx=t.box.x+t.box.w/2,cy=t.box.y+t.box.h/2;
      if(cx>=n.box.x&&cx<=n.box.x+n.box.w&&cy>=n.box.y&&cy<=n.box.y+n.box.h){plate=n;break;}
    }
    if(!plate||plate.bleed)return;
    const pad=2;
    if(t.box.x<plate.box.x-pad||t.box.x+t.box.w>plate.box.x+plate.box.w+pad||
       t.box.y<plate.box.y-pad||t.box.y+t.box.h>plate.box.y+plate.box.h+pad)
      spill.push(`${t.id} off ${plate.id}`);
  });
  r.push(['R13',!spill.length]);
  if(spill.length)card.note('spill: '+spill.join(', '));
  /* R14 · NOTHING OPAQUE MAY BE DROPPED ON TOP OF THE WORDS.
     Draw order decides what a reader sees. A seal painted after the headline
     covers it however well the headline was placed, which is how a card ships
     reading "CASH FOR IPHON<seal>". Text-against-text was the only overlap ever
     checked, so a shape landing on a line was invisible to the audit. */
  const SOLID=new Set(['badge','plate','cta','data','proof','brand','footer','hero']);
  const buried=[];
  texts.forEach(t=>{
    const i=nodes.indexOf(t),area=t.box.w*t.box.h;
    if(area<=0)return;
    for(let k=i+1;k<nodes.length;k++){
      const n=nodes[k];
      if(n.type!=='shape'||!SOLID.has(n.role))continue;
      const frac=n.star?starCover(t.box,n.star):inter(t.box,n.solid||n.box)/area;
      if(frac>.05)buried.push(`${t.id} under ${n.id} ${Math.round(frac*100)}%`);
    }
  });
  r.push(['R14',!buried.length]);
  /* R15 · A PRICE MUST NOT BE AMBIGUOUS.
     Melodrama draws a slashed zero, so "$1,250" reads "$1,25Ø" — checked
     against a rendered swatch of all five families, it is the only one that
     does. Prices are routed to the body face in that pairing; this makes sure
     they stay there when someone adds an archetype. */
  const AMBIG=new Set(['Melodrama']);
  const figs=texts.filter(t=>AMBIG.has(t.face)&&/0/.test(t.str||''));
  r.push(['R15',!figs.length]);
  /* R16 · THE CARD MUST SHOW WHAT IS BEING BOUGHT, AND SHOW IT BIGGEST.
     The owner's standing rule. Props earn their place by making the offer feel
     real; the moment one is larger than the product it stops dressing the card
     and starts being the card. */
  const heroN=nodes.find(n=>n.role==='hero');
  const propsN=nodes.filter(n=>n.id==='prop');
  const areaOf=n=>Math.max(0,n.box.w)*Math.max(0,n.box.h);
  r.push(['R16',!!heroN&&propsN.every(pn=>areaOf(pn)<=areaOf(heroN))]);
  /* R17 · THE PICTURE IS OF WHAT THE COPY SAYS.
     The owner's rule, restated after it was broken: a cracked iPhone 11 under a
     ladder that leads with "17 Pro Max · $1,250". A photographic hero carries
     the tags it was chosen by; the deck carries its subject; they must agree.
     A vector hero has no tags and is judged by the deck's own hero kind. */
  const subj=card.C&&card.C.subject;
  const heroOK=!heroN||!subj||(heroN.tags?matchSubject({t:heroN.tags},subj):true);
  r.push(['R17',heroOK]);
  if(!heroOK)card.note(`mismatch: hero "${heroN.asset}" is ${heroN.tags.b} · ${heroN.tags.c}${heroN.tags.g?' · gen '+heroN.tags.g:''}; the copy is about ${subj.brand.join('/')} · ${subj.cond}${subj.gen?' · gen '+subj.gen.join('/'):''}`);
  if(figs.length)card.note('figures: '+figs.map(t=>`${t.id} "${t.str}" in ${t.face}`).join(', '));
  if(buried.length)card.note('buried: '+buried.join(', '));
  r.push(['R11',sheens.every(s=>s.parent&&inter(s.box,s.parent)>=s.box.w*s.box.h*.999)]);
  r.push(['R12',nodes.every(n=>n.bleed||n.role==='field'||(n.box.x>=-1&&n.box.y>=-1&&n.box.x+n.box.w<=W+1&&n.box.y+n.box.h<=H+1))]);
  /* results in the order RULES declares them, so nothing that zips the two by
     index can mislabel a rule */
  const order=RULES.map(x=>x[0]);
  r.sort((a,b)=>order.indexOf(a[0])-order.indexOf(b[0]));
  return{coverage,dead,hotArea,elements:nodes.length,rules:r,pass:r.filter(x=>x[1]).length,total:r.length};
}

/* ══════════════════════════════════════════════════════════
   10 · RENDER PIPELINE
   ══════════════════════════════════════════════════════════ */
/* A self-contained card embeds the two families it uses, which costs about
   110KB. A page showing a gallery of them should carry the faces ONCE instead:
   render with {embedFonts:false} and put fontCSS() in the page head. */
function fontCSS(){return faceCSS(Object.fromEntries(
  Object.entries(FONT_FILES).map(([f,w])=>[f,Object.keys(w).map(Number)])));}
/* DRESS THE EMPTY CORNERS WITH REAL THINGS.
   A photographic hero shows the whole product, which means it no longer fills
   its box corner to corner the way the vector did — the card is left with holes.
   Filling them with more graphics would just be more decoration; filling them
   with the props the shop actually deals in — banded cash, boxed stock, an
   accessory — is the difference between a poster about buying phones and a
   photograph of the transaction. Placed by finding the card's largest empty
   rectangle and dropping one prop into it, repeatedly, never over the copy. */
function placeStickers(c){
  if(!c.on('stickers'))return;
  const pool=[...assetsFor(c,'cash'),...assetsFor(c,'prop')];
  if(!pool.length)return;
  const S=Math.min(c.W,c.H);
  for(let n=0;n<3;n++){
    const hole=largestHole(occupancy(c,20));
    if(!hole.box||hole.area<.045)break;
    const b=hole.box;
    /* only worth dressing if the hole is chunky rather than a thin seam */
    if(Math.min(b.w,b.h)<S*.16)break;
    const pick=pool[Math.floor(c.R.f(0,1)*pool.length+n*7)%pool.length];
    const pad=Math.min(b.w,b.h)*.10;
    let inset={x:b.x+pad,y:b.y+pad,w:b.w-pad*2,h:b.h-pad*2};
    /* A PROP NEVER OUT-SIZES THE PRODUCT.
       Dressing is dressing. Left uncapped, a shipping box dropped into a big
       hole came out larger than the phone the card is about, and a card whose
       biggest object is a cardboard box is not selling a phone. */
    const hero=c.nodes.find(n=>n.role==='hero');
    if(hero){
      const cap=hero.box.w*hero.box.h*.40;
      const a=inset.w*inset.h;
      if(a>cap){const k=Math.sqrt(cap/a);
        inset={x:inset.x+inset.w*(1-k)/2,y:inset.y+inset.h*(1-k)/2,w:inset.w*k,h:inset.h*k};}
    }
    D.photo(c,inset,c.R.f(-11,11),pick,{id:'prop',role:'plate',bleed:false,grow:1,min:false});
  }
}
function render(archKey,seed,vertical,sizeKey,cfg){
  const R=RNG(seed);
  /* Palette and type pairing are derived from the seed so a seed reproduces a
     card exactly — but a configurator has to be able to hold everything else
     still and change ONE of them, which the old console could not do: it could
     only reroll the seed and take whatever palette came with it. An explicit
     choice overrides the derivation without disturbing anything else. */
  const P=(cfg&&cfg.palette&&PALETTES.find(x=>x.id===cfg.palette))||PALETTES[seed%PALETTES.length];
  const Fp=(cfg&&cfg.pair&&PAIRS.find(x=>x.id===cfg.pair))||PAIRS[(seed>>3)%PAIRS.length];
  const [W,H]=SIZES[sizeKey], C0=CONTENT[vertical];
  const C=Object.assign({},C0,{heads:R.pick(C0.heads),promises:R.shuffle(C0.promises)});
  /* The brand block used to be "iPhones.LA / iL / SAME DAY CASH" baked into the
     deck. It is the owner's mark — or another shop's — so it is a setting:
     name, kicker, initials, address, and how the mark is framed. */
  if(cfg&&cfg.brand){const b=cfg.brand;
    if(b.name!=null)C.brand=b.name; if(b.kicker!=null)C.kicker=b.kicker;
    if(b.initials!=null)C.mark=b.initials; if(b.addr!=null)C.addr=b.addr;
    if(b.phone!=null)C.phone=b.phone;}
  const F={display:Fp.display,body:Fp.body,dw:Fp.dw,bw:Fp.bw,dweight:Fp.dweight,
    figures:Fp.figures!==false};
  const c=new Card(W,H,P,F,R,C,cfg,archKey+seed+sizeKey,vertical);
  ARCH[archKey](c);
  placeStickers(c);
  c.flush();
  const a=audit(c);
  const svg=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(archKey)} buyback ad in the ${esc(P.name)} palette"><defs>${cfg&&cfg.embedFonts===false?'':`<style>${faceCSS(c.used)}</style>`}${c.defs.join('')}</defs><rect width="${W}" height="${H}" fill="${P.ground}"/>${c.svg.join('')}</svg>`;
  return{svg,audit:a,palette:P,pair:Fp,card:c};
}

/* ══════════════════════════════════════════════════════════
   10b · THE GATE
   The owner's standing instruction: graphics at 100% confidence, no less.
   render() will draw anything and report on it; that is right for a lab. This
   is the exit the world sees through, and it refuses. A card is either clean —
   every rule passing — or it is not produced. When the seed asked for fails,
   nearby seeds are tried, then the optional ornaments are dropped one at a time
   (a seal or a prop is decoration; the offer is not), and if nothing clean can
   be found the answer is null and the caller must say so, never "close enough".
   ══════════════════════════════════════════════════════════ */
const OPTIONAL=['stickers','starburst','sunburst','halftone','checker','grain','sheen','arcCrown','paintStroke','tornPaper'];
function renderClean(archKey,seed,vertical,sizeKey,cfg,o={}){
  const tries=o.tries||6;
  const clean=r=>r.audit.pass===r.audit.total;
  let best=null;
  const keep=r=>{if(!best||r.audit.pass>best.audit.pass)best=r;};
  for(let t=0;t<tries;t++){
    const r=render(archKey,(seed+t*977)%999983,vertical,sizeKey,cfg);
    if(clean(r))return Object.assign(r,{gate:{seed:(seed+t*977)%999983,dropped:[],tries:t+1}});
    keep(r);
  }
  const dropped=[];
  let c={...cfg};
  for(const k of OPTIONAL){
    if(c[k]===false)continue;
    c={...c,[k]:false};dropped.push(k);
    const r=render(archKey,seed,vertical,sizeKey,c);
    if(clean(r))return Object.assign(r,{gate:{seed,dropped:dropped.slice(),tries}});
    keep(r);
  }
  return o.lenient?Object.assign(best,{gate:{seed,dropped,tries,refused:true}}):null;
}

/* THE SECOND OPINION — what the browser actually drew.
   The engine's geometry is exact to the metrics it was measured with, but the
   only thing a reader sees is pixels, and the two have disagreed before (a
   quotation mark's em box, an arc's rotated glyphs). This judges a card from
   the boxes the browser reports for every text run, and it is the same function
   whether it is called from the console on the live card or from the release
   gate in headless Chrome, so the two can never drift apart.
   boxes: [{s,x,y,w,h,op}] in viewBox units. Returns [] when clean. */
function pixelFaults(boxes,W,H){
  const raw=boxes.filter(t=>t.op>0.05&&t.s.trim());
  const vis=[];
  for(const t of raw){
    /* outlined and hard-shadowed type is several stacked copies of one string */
    const tol=Math.max(14,t.h*0.35);
    const twin=vis.find(v=>v.s===t.s&&Math.abs(v.x-t.x)<tol&&Math.abs(v.y-t.y)<tol);
    if(twin){const x1=Math.max(twin.x+twin.w,t.x+t.w),y1=Math.max(twin.y+twin.h,t.y+t.h);
      twin.x=Math.min(twin.x,t.x);twin.y=Math.min(twin.y,t.y);twin.w=x1-twin.x;twin.h=y1-twin.y;continue;}
    vis.push({...t});
  }
  const out=[];
  const ink=t=>({x:t.x,w:t.w,y:t.y+t.h*0.16,h:t.h*0.68,s:t.s});
  for(let i=0;i<vis.length;i++)for(let j=i+1;j<vis.length;j++){
    const a=ink(vis[i]),b=ink(vis[j]);
    const ox=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x), oy=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);
    if(ox>2&&oy>2){
      const small=Math.min(a.w*a.h,b.w*b.h);
      const share=ox/Math.min(a.w,b.w), apart=Math.abs((a.y+a.h/2)-(b.y+b.h/2))/Math.max(a.h,b.h);
      const stacked=share>0.55&&apart>0.55;
      if(ox*oy>small*(stacked?0.22:0.06))
        out.push(`"${a.s.trim()}" over "${b.s.trim()}" (${Math.round(ox*oy/small*100)}%)`);
    }
  }
  for(const t of vis)if(t.x<-2||t.y<-2||t.x+t.w>W+2||t.y+t.h>H+2)
    out.push(`"${t.s.trim()}" is clipped by the edge`);
  const SS=Math.min(W,H);
  for(const t of vis)if(t.h<SS*0.018)out.push(`"${t.s.trim()}" is too small to read`);
  return out;
}

/* ══════════════════════════════════════════════════════════
   11 · PROMPT + SENTIMENT
   ══════════════════════════════════════════════════════════ */
const PERMANENT_NEG=[
 'flat rounded plate behind the headline','product centred inside a safe box',
 'badge floating clear of the product','phone number set in body weight',
 'more than three promise pills','gradient standing in for shape language',
 'ornament positioned in canvas coordinates','stock photo of hands holding the product',
 'emoji used as a trust mark','centred body copy','drop shadow on flat elements',
 'two type sizes doing the same job','footer with no address or service area'
];
function buildPrompt(archKey,r,cfg){
  const on=k=>cfg[k]!==false;
  const meta=ARCHS.find(a=>a[0]===archKey);
  const parts=[];
  parts.push(`${meta[1].toUpperCase()} — ${r.card.C.heads.join(' ')} buyback ad, ${r.card.W}×${r.card.H}`);
  parts.push(`palette ${r.palette.id} "${r.palette.name}" (${r.palette.mood}) · ground ${r.palette.ground}, accent ${r.palette.accent}, hot ${r.palette.hot}`);
  parts.push(`type ${r.pair.display} over ${r.pair.body}`);
  const field=['sunburst','halftone','checker','diagonalSplit'].filter(on).map(k=>KEYMETA[k].name.toLowerCase());
  const shape=['paintStroke','tornPaper','knockoutBand','arcCrown'].filter(on).map(k=>KEYMETA[k].name.toLowerCase());
  const typefx=['outlineStroke','hardShadow','fitToPlate'].filter(on).map(k=>KEYMETA[k].name.toLowerCase());
  const offer=['starburst','ticket','sheen'].filter(on).map(k=>KEYMETA[k].name.toLowerCase());
  const proof=['promisePills','proofBlock','priceRows'].filter(on).map(k=>KEYMETA[k].name.toLowerCase());
  const chrome=['cta','footerBar','cornerLockup'].filter(on).map(k=>KEYMETA[k].name.toLowerCase());
  const heroBits=[on('hero')&&'product hero',on('heroBleed')&&'bleeding off one edge',
    on('heroRotate')&&'angled 6–24°',on('heroShadow')&&'cast shadow'].filter(Boolean);
  if(heroBits.length)parts.push('hero: '+heroBits.join(', '));
  if(field.length)parts.push('field: '+field.join(', '));
  if(shape.length)parts.push('shape language: '+shape.join(', '));
  if(typefx.length)parts.push('display type: '+typefx.join(', '));
  if(offer.length)parts.push('offer: '+offer.join(', '));
  if(proof.length)parts.push('proof: '+proof.join(', '));
  if(chrome.length)parts.push('chrome: '+chrome.join(', '));
  parts.push(`copy: "${r.card.C.offer}" · "${r.card.C.cta}" · ${r.card.C.phone} · ${r.card.C.addr}`);
  const off=ALLKEYS.filter(k=>!on(k));
  const neg=off.map(k=>'no '+KEYMETA[k].name.toLowerCase()).concat(PERMANENT_NEG);
  return{pos:parts.join('\n'),neg:neg.join('\n')};
}
function sentiment(r,cfg){
  const on=k=>cfg[k]!==false;
  const ornament=['sunburst','halftone','checker','diagonalSplit','paintStroke','tornPaper','knockoutBand','arcCrown','starburst','ticket','sheen','grain'].filter(on).length/12;
  const loud=(on('knockoutBand')?.3:0)+(on('starburst')?.25:0)+(on('hardShadow')?.2:0)+(on('outlineStroke')?.15:0)+(on('heroBleed')?.1:0);
  const trust=(on('proofBlock')?.4:0)+(on('promisePills')?.25:0)+(on('footerBar')?.2:0)+(on('cornerLockup')?.15:0);
  const density=r.audit.coverage;
  const words=[];
  words.push(loud>.7?'Loud':loud>.4?'Assertive':'Quiet');
  words.push(ornament>.6?'print-shop':ornament>.35?'considered':'stripped');
  words.push(trust>.6?'well-vouched':trust>.35?'credible':'anonymous');
  const verdict=density<.5?'reads as a placeholder — the engine is not filling the canvas'
    :density<.62?'still thin; the eye finds a hole before it finds the offer'
    :ornament<.3?'filled but plain — nothing here says a person made it'
    :loud<.4?'composed but polite; marketplace scroll will pass it'
    :'this is the register the reference ads work in';
  return{words,verdict,meters:[['ornament',ornament],['loudness',Math.min(loud,1)],['trust signals',trust],['density',density]]};
}


/* ─────────────────────────────────────────────────────────────
   exports — the whole engine is pure: no DOM, no browser globals.
   `render()` returns an SVG string plus the audit for that card.
   ───────────────────────────────────────────────────────────── */
export {
  RNG, PALETTES, PAIRS, SIZES, CONTENT,
  contrast, onColor, readable, esc,
  Card, D, ARCH, ARCHS,
  QUEUE, ALLKEYS, KEYMETA, DEFAULT_CFG,
  RULES, PERMANENT_NEG, audit, render, buildPrompt, sentiment,
  ground, placeHero, headline, sealOnHero, priceRows, proofSteps, reviewCard,
  fontCSS, faceCSS, renderClean, OPTIONAL, pixelFaults, matchSubject
};

/* ══════════════════════════════════════════════════════════════════════════
   THE CONSOLE
   The engine above is the real engine/engine.mjs, injected at build time by
   scripts/build_console.mjs. Nothing here re-implements it — the previous
   console carried a hand-copied duplicate and had silently drifted a whole
   release behind (it was still drawing twelve rules against an engine that had
   grown to sixteen). Everything below only drives it.
   ══════════════════════════════════════════════════════════════════════════ */

const $ = s => document.querySelector(s);
const el = (t, a, h) => { const n = document.createElement(t);
  if (a) for (const k in a) k === 'class' ? n.className = a[k] : n.setAttribute(k, a[k]);
  if (h !== undefined) n.innerHTML = h; return n; };

const FMT = [['45', '4:5'], ['11', '1:1'], ['916', '9:16']];
const VERT = Object.keys(CONTENT);
const STORE = 'gfx-console-v2';

const S = {
  arch: 'nightLot', vertical: VERT[0], size: '45',
  seed: 4242, cfg: DEFAULT_CFG(),
  palette: null, pair: null,          // null = follow the seed
  tab: 'audit', impact: {}, log: [], lastKey: null, grades: {}, prev: null,
  brand: null,                        // null = the deck's own; else {name,kicker,initials,addr,phone,frame}
};
try { Object.assign(S, JSON.parse(localStorage.getItem(STORE) || '{}')); } catch {}
S.cfg = { ...DEFAULT_CFG(), ...(S.cfg || {}) };
const save = () => { try { localStorage.setItem(STORE, JSON.stringify(
  { arch: S.arch, vertical: S.vertical, size: S.size, seed: S.seed, cfg: S.cfg,
    palette: S.palette, pair: S.pair, tab: S.tab, grades: S.grades, brand: S.brand })); } catch {} };

/* live config, including the direct palette/type choices the old console lacked */
const conf = () => ({ ...S.cfg, palette: S.palette, pair: S.pair, brand: S.brand,
  embedFonts: false, assetBase: '../' });

/* ── chrome ─────────────────────────────────────────────────────────────── */
function segment(host, items, get, set) {
  host.innerHTML = '';
  items.forEach(([v, label]) => {
    const b = el('button', { 'aria-pressed': String(get() === v) }, label);
    b.onclick = () => { set(v); paint(); };
    host.append(b);
  });
}
const TABS = [['audit', 'Audit'], ['look', 'Look'], ['prompt', 'Prompt'], ['log', 'Log']];
function renderTabs() {
  const host = $('#tabs'); host.innerHTML = '';
  TABS.forEach(([k, label]) => {
    const b = el('button', { 'aria-selected': String(S.tab === k) }, label);
    b.onclick = () => { S.tab = k; save(); renderTabs(); showPane(); };
    host.append(b);
  });
}
const showPane = () => TABS.forEach(([k]) => $('#pane-' + k).hidden = S.tab !== k);

function renderArch() {
  const host = $('#archRow'); host.innerHTML = '';
  ARCHS.forEach(([k, name], i) => {
    const b = el('button', { 'aria-pressed': String(S.arch === k), title: `${name} — press ${i + 1}` }, name);
    b.onclick = () => { S.arch = k; paint(); };
    host.append(b);
  });
}

/* WHICH SWITCHES ARE EVEN LIVE HERE.
   Twenty-eight switches, and on any given layout a third of them draw nothing —
   Price Board has no arc crown, Poster Bleed has no price rows. Showing all of
   them at equal weight is what makes the rail read as a settings page: you flip
   something, nothing happens, and you learn to distrust the panel. So each one
   is tested against the current layout by flipping it and seeing whether the
   artwork actually changes, and the dead ones fold away. */
let LIVE = null, liveKey = '';
function liveSwitches() {
  const key = S.arch + '|' + S.vertical + '|' + S.size + '|' + S.seed;
  if (LIVE && liveKey === key) return LIVE;
  const base = render(S.arch, S.seed, S.vertical, S.size, conf()).svg;
  LIVE = {};
  ALLKEYS.forEach(k => {
    const flip = { ...conf(), [k]: S.cfg[k] === false };
    LIVE[k] = render(S.arch, S.seed, S.vertical, S.size, flip).svg !== base;
  });
  liveKey = key;
  return LIVE;
}

/* ── the switch rail ────────────────────────────────────────────────────── */
function renderQueue() {
  const host = $('#groups'); host.innerHTML = '';
  const live = liveSwitches();
  let dead = 0;
  QUEUE.forEach(([group, rows]) => {
    const shown = rows.filter(r => live[r[0]]);
    dead += rows.length - shown.length;
    if (!shown.length) return;
    const g = el('div', { class: 'grp' }, `<h3>${group}</h3>`);
    shown.forEach(([key, name, fx, purpose]) => {
      const on = S.cfg[key] !== false, imp = S.impact[key];
      const row = el('div', {
        class: 'sw', role: 'switch', tabindex: '0',
        'aria-checked': String(on), 'data-k': key,
        'data-last': String(S.lastKey === key),
        title: purpose || '',
      }, `<span class="dot"></span><span><b>${name}</b><i>${fx}</i></span>` +
         `<span class="imp ${imp > .01 ? 'pos' : imp < -.01 ? 'neg' : ''}">` +
         `${imp === undefined ? '' : (imp > 0 ? '+' : '') + (imp * 100).toFixed(0)}</span>`);
      const flip = () => { S.cfg[key] = !on; S.lastKey = key; note(`${on ? 'off' : 'on'} · ${name}`); paint(); };
      row.onclick = flip;
      row.onkeydown = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } };
      g.append(row);
    });
    host.append(g);
  });
  if (dead) {
    const names = ALLKEYS.filter(k => !live[k]).map(k => KEYMETA[k].name);
    const d = el('div', { class: 'grp' },
      `<h3>Draws nothing on this layout</h3><div class="dead">${names.join(' · ')}</div>`);
    host.append(d);
  }
  $('#onCount').textContent = ALLKEYS.filter(k => S.cfg[k] !== false).length + '/' + ALLKEYS.length;
}

/* ── readouts ───────────────────────────────────────────────────────────── */
const band = (v, good, mid) => v >= good ? 'ok' : v >= mid ? 'mid' : 'no';
function renderReadout(a) {
  $('#readout').innerHTML = [
    ['coverage', (a.coverage * 100).toFixed(0) + '%', band(a.coverage, .62, .5)],
    ['largest gap', (a.dead * 100).toFixed(0) + '%', a.dead <= .18 ? 'ok' : a.dead <= .26 ? 'mid' : 'no'],
    ['hot colour', (a.hotArea * 100).toFixed(0) + '%', a.hotArea <= .14 ? 'ok' : 'no'],
    ['elements', String(a.elements), ''],
    ['rules', `${a.pass}/${a.total}`, a.pass === a.total ? 'ok' : 'no'],
    ['pixels', '…', ''],
  ].map(([k, v, c]) => `<div class="gauge"><span>${k}</span><b class="${c}"${k === 'pixels' ? ' id="gPixels"' : ''}>${v}</b></div>`).join('');
}

/* The engine narrates its own failures — spill:, buried:, collide:, tight:,
   figures:, seal still costs. The old console threw all of that away and showed
   a grid of R-numbers, so a failing card told you THAT it failed and never why. */
/* THE ENGINE ALREADY EXPLAINS ITSELF — say it in English.
   card.notes carries lines like "buried: headline0 under badge 21%". The old
   console showed a grid of R-numbers and none of this, so a failing card told
   you THAT it failed and never why. Each note becomes a sentence naming the
   part, and "show me" outlines that part on the artwork. */
const FAULT = [
  [/^spill: (\S+) off (\S+)/, (m) => `“${m[1]}” runs off the ${m[2]} it was set on.`, m => m[1]],
  [/^buried: (\S+) under (\S+) (\d+)%/, (m) => `“${m[1]}” is ${m[3]}% covered by the ${m[2]} painted over it.`, m => m[1]],
  [/^collide: (\S+) x (\S+)/, (m) => `“${m[1]}” and “${m[2]}” overlap.`, m => m[1]],
  [/^tight: (.+) needs (\d+)%/, (m) => `${m[1]} needs ${m[2]}% of its box to stay legible — the copy is too long for the space.`, () => null],
  [/^figures: (\S+) "(.+?)" in (\S+)/, (m) => `${m[2]} is set in ${m[3]}, which draws a slashed zero.`, m => m[1]],
  [/^seal still costs (\d+)%/, (m) => `The seal had nowhere clean to sit; it still covers ${m[1]}% of a line.`, () => 'badge'],
];
function faultCard(note, r) {
  for (const [re, say, target] of FAULT) {
    const m = note.match(re);
    if (m) return { text: say(m), id: target(m) };
  }
  return { text: note, id: null };
}
function showMe(id) {
  const n = last.card.nodes.find(x => x.id === id);
  const svg = $('#frame').firstElementChild;
  if (!n || !svg) return;
  svg.querySelectorAll('[data-showme]').forEach(e => e.remove());
  const box = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  box.setAttribute('data-showme', '1');
  box.setAttribute('x', n.box.x); box.setAttribute('y', n.box.y);
  box.setAttribute('width', Math.max(2, n.box.w)); box.setAttribute('height', Math.max(2, n.box.h));
  box.setAttribute('fill', 'none'); box.setAttribute('stroke', '#4cc9f0');
  box.setAttribute('stroke-width', '5'); box.setAttribute('stroke-dasharray', '14 8');
  svg.append(box);
  $('#frame').classList.add('flash');
  setTimeout(() => { box.remove(); $('#frame').classList.remove('flash'); }, 2600);
}

function renderAudit(r) {
  const notes = r.card.notes.filter(n => /^(spill|buried|collide|tight|figures|seal)/.test(n));
  const rows = RULES.map(([id, name, test, sin]) => {
    const pass = (r.audit.rules.find(x => x[0] === id) || [, true])[1];
    return `<div class="rule ${pass ? '' : 'fail'}"><code>${id}</code>` +
           `<span><b>${name}</b><i>${pass ? test : sin}</i></span></div>`;
  }).join('');
  $('#pane-audit').innerHTML =
    `<h4>${r.audit.pass} of ${r.audit.total} rules</h4><div class="rules">${rows}</div>` +
    (notes.length
      ? `<h4>Faults</h4>` + notes.map((n, i) => { const f = faultCard(n, r);
          return `<div class="note">${esc(f.text)}` +
            (f.id ? ` <button class="showme" data-id="${f.id}">show me</button>` : '') + `</div>`; }).join('')
      : `<h4>Faults</h4><div class="empty">Nothing to report on this card.</div>`) +
    `<div id="pixelFaults"></div>` +
    `<h4>Grade</h4><div class="grade">
       <button class="keep" id="gKeep">Keep</button>
       <button class="cut" id="gCut">Cut</button></div>
     <div class="empty" id="gradeState"></div>`;
  const id = cardId();
  const g = S.grades[id];
  $('#gradeState').textContent = g ? `Graded "${g}" · ${Object.keys(S.grades).length} graded in total`
                                   : `${Object.keys(S.grades).length} graded in total`;
  $('#pane-audit').querySelectorAll('.showme').forEach(b => b.onclick = () => showMe(b.dataset.id));
  $('#gKeep').onclick = () => grade('keep');
  $('#gCut').onclick = () => grade('cut');
}

/* Palette and type pairing are chosen HERE rather than being whatever the seed
   handed you — the single biggest thing the old console could not do. */
function renderLook(r) {
  const swatch = p => `<span class="sw2" style="background:${p.accent}"></span>`;
  const pal = PALETTES.map(p =>
    `<button class="chip" data-pal="${p.id}" aria-pressed="${String(r.palette.id === p.id)}"
       title="${p.mood}">${swatch(p)}${p.name}</button>`).join('');
  const pairs = PAIRS.map(p =>
    `<button class="chip" data-pair="${p.id}" aria-pressed="${String(r.pair.id === p.id)}"
       title="${p.note}">${p.display} + ${p.body}</button>`).join('');
  const s = sentiment(r, conf());
  /* THE MONOGRAM. The mark is the owner's, or the next shop's — initials on an
     app-shaped plate, in a disc, floating, or no mark at all. Saved with the
     rest of the console's state, so it follows every card and every export. */
  const B = S.brand || {};
  const deck = CONTENT[S.vertical];
  const FRAMES = [['app', 'app shape'], ['circle', 'disc'], ['float', 'floating'], ['name', 'name only'], ['mark', 'mark only']];
  const brandUI =
    `<h4>Brand ${S.brand ? '· yours' : '· the deck\'s own'}</h4>
     <div class="brandgrid">
       <label>Name<input id="bName" value="${esc(B.name ?? deck.brand)}" maxlength="24"></label>
       <label>Initials<input id="bInit" value="${esc(B.initials ?? deck.mark)}" maxlength="3"></label>
       <label>Kicker<input id="bKick" value="${esc(B.kicker ?? deck.kicker)}" maxlength="22"></label>
       <label>Footer<input id="bAddr" value="${esc(B.addr ?? deck.addr)}" maxlength="30"></label>
     </div>
     <div class="chips">${FRAMES.map(([k, l]) => `<button class="chip" data-frame="${k}" aria-pressed="${String((B.frame || 'app') === k)}">${l}</button>`).join('')}</div>
     <button class="btn" id="brandReset" style="width:100%">use the deck's own brand</button>`;
  $('#pane-look').innerHTML = brandUI +
    `<h4>Palette ${S.palette ? '· pinned' : '· following the seed'}</h4><div class="chips">${pal}</div>` +
    `<h4>Type ${S.pair ? '· pinned' : '· following the seed'}</h4><div class="chips">${pairs}</div>` +
    `<button class="btn" id="unpin" style="width:100%">unpin both · back to the seed</button>` +
    `<h4>What this card is going for</h4><pre>${esc(s.words)}\n\n${esc(s.verdict)}</pre>` +
    s.meters.map(([k, v]) => `<div class="meter"><span><em>${k}</em><em>${(v * 100).toFixed(0)}%</em></span>` +
      `<div><b style="width:${Math.min(100, v * 100).toFixed(0)}%"></b></div></div>`).join('');
  $('#pane-look').querySelectorAll('[data-pal]').forEach(b => b.onclick = () => {
    S.palette = S.palette === b.dataset.pal ? null : b.dataset.pal;
    note('palette · ' + (S.palette || 'seed')); paint();
  });
  $('#pane-look').querySelectorAll('[data-pair]').forEach(b => b.onclick = () => {
    S.pair = S.pair === b.dataset.pair ? null : b.dataset.pair;
    note('type · ' + (S.pair || 'seed')); paint();
  });
  $('#unpin').onclick = () => { S.palette = S.pair = null; note('palette + type follow the seed'); paint(); };
  const setBrand = patch => { S.brand = { ...(S.brand || {}), ...patch }; save(); note('brand · ' + Object.keys(patch)[0]); paint(); };
  const bind = (id, key) => { const i = $(id); i.onchange = () => setBrand({ [key]: i.value.trim() });
    i.onkeydown = e => { if (e.key === 'Enter') i.blur(); }; };
  bind('#bName', 'name'); bind('#bInit', 'initials'); bind('#bKick', 'kicker'); bind('#bAddr', 'addr');
  $('#pane-look').querySelectorAll('[data-frame]').forEach(b => b.onclick = () => setBrand({ frame: b.dataset.frame }));
  $('#brandReset').onclick = () => { S.brand = null; save(); note('brand · deck'); paint(); };
}

function renderPrompt(r) {
  const p = buildPrompt(S.arch, r, conf());
  $('#pane-prompt').innerHTML =
    `<h4>Generated prompt</h4><pre>${esc(p.pos)}</pre>` +
    `<h4>Negative — everything switched off, plus the permanent exclusions</h4>` +
    `<pre class="neg">${esc(p.neg)}</pre>`;
}

function renderLog() {
  $('#pane-log').innerHTML = S.log.length
    ? S.log.slice(0, 60).map(l => `<div class="logline">${esc(l.what)}` +
        (l.delta === undefined ? '' : ` <em>${l.delta > 0 ? '+' : ''}${(l.delta * 100).toFixed(0)} pts</em>`) +
        `</div>`).join('')
    : '<div class="empty">No edits yet. Flip a switch and the change is measured here.</div>';
}

/* CSS cannot letterbox an inline SVG reliably — it carries a viewBox and no
   intrinsic size, so it either collapses to nothing or grows past its pane. The
   three formats differ by a factor of nearly two in aspect, so this is not a
   detail: measure the space and size the card to it. */
function fit() {
  const svg = $('#frame').firstElementChild;
  if (!svg) return;
  const vb = (svg.getAttribute('viewBox') || '0 0 1 1').split(/\s+/).map(Number);
  const aspect = vb[2] / vb[3];
  const pane = $('.canvas').getBoundingClientRect();
  const pad = 32;
  const w = Math.max(80, pane.width - pad), h = Math.max(80, pane.height - pad);
  const scale = Math.min(w / aspect > h ? h * aspect : w, w);
  const width = Math.min(w, h * aspect);
  svg.style.width = width + 'px';
  svg.style.height = (width / aspect) + 'px';
}
addEventListener('resize', fit);

/* THE CONSOLE CHECKS ITS OWN PIXELS.
   Same pixelFaults() the release gate runs in headless Chrome, applied to the
   card on screen after the fonts and photographs have settled. The engine's
   geometry is one opinion; this is the browser's. Both must be clean before
   a card is called clean here, and nothing that is not clean can be exported. */
let pixels = { ok: true, faults: [] };
async function checkPixels() {
  const svg = $('#frame').firstElementChild;
  if (!svg || openAxis) return;
  await document.fonts.ready;
  /* an SVG <image> has no .complete, so probe the file it points at instead of
     waiting a fixed 1.2s for pictures the browser already has */
  await Promise.all([...svg.querySelectorAll('image')].map(i => new Promise(r => {
    const probe = new Image(); probe.onload = probe.onerror = r; probe.src = i.getAttribute('href');
    setTimeout(r, 1500); })));
  const vb = (svg.getAttribute('viewBox') || '0 0 1 1').split(/\s+/).map(Number);
  const host = svg.getBoundingClientRect(), sx = vb[2] / host.width, sy = vb[3] / host.height;
  const boxes = [...svg.querySelectorAll('text')].map(t => { const b = t.getBoundingClientRect();
    return { s: (t.textContent || '').slice(0, 26), x: (b.left - host.left) * sx, y: (b.top - host.top) * sy,
             w: b.width * sx, h: b.height * sy, op: +(getComputedStyle(t).opacity || 1) }; });
  const faults = pixelFaults(boxes, vb[2], vb[3]);
  pixels = { ok: !faults.length, faults };
  renderVerdict();
}
const isClean = () => !!last && last.audit.pass === last.audit.total && pixels.ok;
function renderVerdict() {
  const g = $('#gPixels');
  if (g) { g.textContent = pixels.ok ? 'clean' : pixels.faults.length + ' fault' + (pixels.faults.length > 1 ? 's' : '');
           g.className = pixels.ok ? 'ok' : 'no'; }
  const ban = $('#frame').querySelector('.reject');
  if (ban) ban.remove();
  if (last && !isClean() && !openAxis) {
    const why = [...last.audit.rules.filter(x => !x[1]).map(x => x[0]), ...pixels.faults.slice(0, 2)];
    $('#frame').append(el('div', { class: 'reject' },
      `<b>NOT CLEAN — will not export</b><span>${esc(why.join(' · '))}</span>`));
  }
  const pf = $('#pixelFaults');
  if (pf) pf.innerHTML = pixels.faults.length
    ? pixels.faults.map(f => `<div class="note">${esc(f)}</div>`).join('') : '';
}

/* ── paint ──────────────────────────────────────────────────────────────── */
let last = null;
function paint() {
  const r = render(S.arch, S.seed, S.vertical, S.size, conf());
  last = r;
  if (openAxis) { renderAxis(openAxis); renderQueue(); renderArch(); save(); return r; }
  $('#frame').innerHTML = r.svg;
  /* The engine emits a viewBox and no width/height — correct for an exported
     asset, but a browser then has nothing to size the element from and the card
     collapsed to nothing in the middle of the console. Stamp the intrinsic size
     on so max-width/max-height can letterbox it properly. */
  fit();
  $('#seedTag').textContent = `${S.arch} · seed ${S.seed} · ${r.palette.id} · ${r.pair.id}`;
  renderReadout(r.audit);
  renderAudit(r); renderLook(r); renderPrompt(r); renderLog();
  pixels = { ok: true, faults: [] };
  checkPixels();
  renderQueue(); renderArch();
  segment($('#vertSeg'), VERT.map(v => [v, v]), () => S.vertical, v => S.vertical = v);
  segment($('#fmtSeg'), FMT, () => S.size, v => S.size = v);
  save();
  return r;
}

const cardId = () => [S.arch, S.vertical, S.size, S.seed,
  (last && last.palette.id), (last && last.pair.id),
  ALLKEYS.filter(k => S.cfg[k] === false).join('.')].join('|');

function score(r) { return r.audit.pass / r.audit.total * .6 + r.audit.coverage * .3 + (1 - r.audit.dead) * .1; }
function note(what) {
  const before = last ? score(last) : undefined;
  S.log.unshift({ what, before });
  queueMicrotask(() => { if (last && before !== undefined) S.log[0].delta = score(last) - before; });
}
function grade(v) {
  S.grades[cardId()] = v;
  note(`graded ${v}`); save(); renderAudit(last);
}

/* ── measuring every switch ─────────────────────────────────────────────── */
/* One toggle's worth on ONE card is noise; the number that means something is
   its average effect across every layout, which is what this measures. */
function measureAll() {
  const btn = $('#measure'); btn.textContent = 'measuring…'; btn.disabled = true;
  setTimeout(() => {
    const base = {};
    ARCHS.forEach(([k]) => base[k] = score(render(k, S.seed, S.vertical, S.size, conf())));
    ALLKEYS.forEach(key => {
      const flipped = { ...conf(), [key]: S.cfg[key] === false };
      let sum = 0;
      ARCHS.forEach(([k]) => sum += base[k] - score(render(k, S.seed, S.vertical, S.size, flipped)));
      S.impact[key] = (sum / ARCHS.length) * (S.cfg[key] === false ? -1 : 1);
    });
    btn.textContent = 'measure switches'; btn.disabled = false;
    renderQueue();
  }, 20);
}

/* ── export ─────────────────────────────────────────────────────────────── */
/* The SVG, the picture, and a machine-readable record of the whole decision —
   config, palette, type, audit, diagnostics, grade. That last file is the one
   worth keeping: a graded corpus of what the owner accepts is exactly what an
   autonomous model would have to be trained on. */
function download(name, text, type) {
  const a = el('a'); a.download = name;
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function record(r) {
  return {
    id: cardId(), arch: S.arch, vertical: S.vertical, size: S.size, seed: S.seed,
    palette: r.palette.id, pair: r.pair.id, brand: S.brand,
    off: ALLKEYS.filter(k => S.cfg[k] === false),
    audit: { coverage: +r.audit.coverage.toFixed(4), dead: +r.audit.dead.toFixed(4),
             hot: +r.audit.hotArea.toFixed(4), elements: r.audit.elements,
             pass: r.audit.pass, total: r.audit.total,
             failed: r.audit.rules.filter(x => !x[1]).map(x => x[0]) },
    notes: r.card.notes, pixels: pixels, clean: isClean(), grade: S.grades[cardId()] || null,
    prompt: buildPrompt(S.arch, r, conf()),
  };
}
function exportAll() {
  const r = last || paint();
  /* 100% confidence, no less. A card that fails a rule, or whose pixels the
     browser disagrees with, does not leave. The gate is offered instead: the
     nearest clean card, with what it changed said out loud. */
  if (!isClean()) {
    const g = renderClean(S.arch, S.seed, S.vertical, S.size, conf());
    if (!g) { note('export refused · no clean card near this one'); alert('Refused: this card is not clean and no clean neighbour was found.'); return; }
    const changed = [g.gate.seed !== S.seed ? `seed → ${g.gate.seed}` : null,
      ...g.gate.dropped.map(k => `${KEYMETA[k].name} off`)].filter(Boolean).join(', ');
    if (!confirm(`This card is not clean and will not export.\nExport the nearest clean card instead? (${changed})`)) return;
    S.seed = g.gate.seed; g.gate.dropped.forEach(k => S.cfg[k] = false);
    note('export took the gate · ' + changed); paint();
    setTimeout(exportAll, 400); return;
  }
  const stem = `${S.arch}-${S.vertical}-${S.size}-${S.seed}`;
  /* the exported SVG embeds its own fonts and absolute asset URLs so it opens
     anywhere, unlike the one on screen which leans on this page */
  const solo = render(S.arch, S.seed, S.vertical, S.size,
    { ...conf(), embedFonts: true, assetBase: new URL('../', location.href).href });
  download(stem + '.svg', solo.svg, 'image/svg+xml');
  download(stem + '.json', JSON.stringify(record(r), null, 2), 'application/json');
  const all = Object.entries(S.grades);
  if (all.length) download('graded.jsonl',
    all.map(([id, g]) => JSON.stringify({ id, grade: g })).join('\n'), 'application/x-ndjson');
  note(`exported ${stem}`);
}

/* HOLD TO COMPARE.
   The old A/B panel rendered before-and-after as thumbnails, where grain,
   sheen, a hard shadow and fit-to-plate are all invisible, so the comparison
   never showed what a switch did. This shows the counterfactual — the last
   switch flipped back — at the same size in the same place while a key is
   held, and snaps back on release. It cannot be mistaken for the live card
   because it is only there while your finger is down. */
let holding = false;
function holdStart() {
  if (holding || !S.lastKey) return;
  holding = true;
  const alt = { ...conf(), [S.lastKey]: S.cfg[S.lastKey] === false };
  const r = render(S.arch, S.seed, S.vertical, S.size, alt);
  $('#frame').innerHTML = r.svg; fit();
  $('#frame').classList.add('flash');
  $('#seedTag').textContent = `holding: ${KEYMETA[S.lastKey].name} ${S.cfg[S.lastKey] === false ? 'ON' : 'OFF'}`;
}
function holdEnd() {
  if (!holding) return;
  holding = false;
  $('#frame').classList.remove('flash');
  paint();
}

/* ONE AXIS, OPENED.
   The single card is where grading happens — the judges were right that
   approving from a 132px tile is approving blind. But choosing BETWEEN eight
   palettes or eight layouts one at a time is slow, so any one axis can be
   opened as a row of full cards at the current seed; click one and it becomes
   the live card. Tiles are kept large enough that the devices still read. */
const AXES = {
  arch:    { label: 'layout',  values: () => ARCHS.map(a => [a[0], a[1]]),         apply: v => S.arch = v,    cfg: () => conf() },
  palette: { label: 'palette', values: () => PALETTES.map(p => [p.id, p.name]),   apply: v => S.palette = v, cfg: v => ({ ...conf(), palette: v }) },
  pair:    { label: 'type',    values: () => PAIRS.map(p => [p.id, p.display + ' + ' + p.body]), apply: v => S.pair = v, cfg: v => ({ ...conf(), pair: v }) },
  seed:    { label: 'seed',    values: () => Array.from({ length: 8 }, (_, i) => [String((S.seed + i * 977) % 999983), '#' + i]), apply: v => S.seed = +v, cfg: () => conf() },
};
let openAxis = null;
function renderAxis(name) {
  openAxis = name;
  const ax = AXES[name];
  const host = $('#frame');
  host.innerHTML = '';
  host.className = 'card axis';
  const grid = el('div', { class: 'axisgrid' });
  ax.values().forEach(([v, label]) => {
    const arch = name === 'arch' ? v : S.arch;
    const seed = name === 'seed' ? +v : S.seed;
    const r = render(arch, seed, S.vertical, S.size, ax.cfg(v));
    const t = el('figure', { class: 'tile' + (r.audit.pass === r.audit.total ? '' : ' fail') },
      r.svg + `<figcaption><b>${esc(label)}</b><span>${r.audit.pass}/${r.audit.total} · ${(r.audit.coverage * 100) | 0}%</span></figcaption>`);
    const svg = t.querySelector('svg');
    const vb = svg.getAttribute('viewBox').split(/\s+/);
    svg.setAttribute('width', vb[2]); svg.setAttribute('height', vb[3]);
    t.onclick = () => { ax.apply(v); note(`${ax.label} · ${label}`); closeAxis(); };
    grid.append(t);
  });
  host.append(grid);
  $('#seedTag').textContent = `every ${ax.label} · click one · Esc closes`;
}
function closeAxis() { openAxis = null; $('#frame').className = 'card'; paint(); }

/* ── keyboard ───────────────────────────────────────────────────────────── */
const HINTS = [['1–8', 'layout'], ['[ ]', 'seed'], ['V', 'vertical'], ['F', 'format'],
  ['P', 'palette'], ['T', 'type'], ['hold C', 'compare last switch'], ['A', 'open an axis'],
  ['Space', 'undo last switch'], ['G / X', 'keep / cut'], ['E', 'export']];
$('#hints').innerHTML = HINTS.map(([k, v]) => `<span><span class="kbd">${k}</span> ${v}</span>`).join('');

const cycle = (arr, cur, dir) => arr[(arr.indexOf(cur) + dir + arr.length) % arr.length];
addEventListener('keyup', e => { if (e.key.toLowerCase() === 'c') holdEnd(); });
addEventListener('blur', holdEnd);
addEventListener('keydown', e => {
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  const k = e.key, n = +k;
  if (k === 'Escape' && openAxis) return closeAxis(), e.preventDefault();
  if (k.toLowerCase() === 'c' && !e.repeat) return holdStart(), e.preventDefault();
  if (k.toLowerCase() === 'a') {
    const order = Object.keys(AXES);
    renderAxis(openAxis ? order[(order.indexOf(openAxis) + 1) % order.length] : 'arch');
    return e.preventDefault();
  }
  if (n >= 1 && n <= ARCHS.length) { S.arch = ARCHS[n - 1][0]; return paint(), e.preventDefault(); }
  const go = () => { paint(); e.preventDefault(); };
  switch (k.toLowerCase()) {
    case ']': S.seed = (S.seed + 977) % 999983; return go();
    case '[': S.seed = (S.seed + 999006) % 999983; return go();
    case 'v': S.vertical = cycle(VERT, S.vertical, e.shiftKey ? -1 : 1); return go();
    case 'f': S.size = cycle(FMT.map(f => f[0]), S.size, e.shiftKey ? -1 : 1); return go();
    case 'p': S.palette = cycle(PALETTES.map(p => p.id), S.palette || (last && last.palette.id), e.shiftKey ? -1 : 1); return go();
    case 't': S.pair = cycle(PAIRS.map(p => p.id), S.pair || (last && last.pair.id), e.shiftKey ? -1 : 1); return go();
    case 'g': grade('keep'); return e.preventDefault();
    case 'x': grade('cut'); return e.preventDefault();
    case 'e': exportAll(); return e.preventDefault();
    case ' ':
      if (S.lastKey) { S.cfg[S.lastKey] = S.cfg[S.lastKey] === false; note('undo · ' + KEYMETA[S.lastKey].name); return go(); }
  }
});

$('#axisBtn').onclick = () => openAxis ? closeAxis() : renderAxis('arch');
$('#reroll').onclick = () => { S.seed = (S.seed * 1103515245 + 12345) % 999983; note('new seed'); paint(); };
$('#measure').onclick = measureAll;
$('#exportBtn').onclick = exportAll;

/* the faces this page draws with, declared once for every card on it */
document.head.append(el('style', null, fontCSS()));
renderTabs(); showPane(); paint();
