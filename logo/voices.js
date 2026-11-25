/* The type pairs the logo maker sets (DESIGN-LAW 176): the full ad's vetted pairs
   (motion/full-voices.js, each read at a feed's size and by eye) and Bold, the card's default, as
   motion/catalog.js TYPE_VOICES names them. A copy, so the engine and the function that draws a paid
   file need no catalogue; scripts/logo_check.mjs fails when it and TYPE_VOICES say different things.
   kind: what the display face is (motion/catalog.js FONTS kinds), which a layout reads to decide
   whether a face suits it (a script face never goes round a seal's ring). */
export const LOGO_VOICES = {
  bold:    { name: "Bold",    display: "oswald",          label: "satoshi-700",     kind: "condensed" },
  street:  { name: "Street",  display: "sofia-xcond-800", label: "schibsted-800",   kind: "condensed" },
  stadium: { name: "Stadium", display: "big-shoulders",   label: "manrope",         kind: "condensed" },
  sport:   { name: "Sport",   display: "teko",            label: "chivo-700",       kind: "condensed" },
  tech:    { name: "Tech",    display: "saira-cond",      label: "sora",            kind: "condensed" },
  block:   { name: "Block",   display: "barlow-cond",     label: "franklin-700",    kind: "condensed" },
  arcade:  { name: "Arcade",  display: "russo",           label: "sora",            kind: "wide" },
  squad:   { name: "Squad",   display: "squada",          label: "instrument-sans", kind: "condensed" },
  retro:   { name: "Retro",   display: "bungee",          label: "instrument-sans", kind: "display" },
  pop:     { name: "Pop",     display: "luckiest",        label: "nunito",          kind: "display" },
  luxe:    { name: "Luxe",    display: "gloock",          label: "schibsted-700",   kind: "serif" },
  warp:    { name: "Warp",    display: "tilt-warp",       label: "sora",            kind: "display" },
  stencil: { name: "Stencil", display: "stencil",         label: "barlow-cond",     kind: "condensed" },
  grotesk: { name: "Grotesk", display: "bricolage",       label: "instrument-sans", kind: "grotesk" },
  tall:    { name: "Tall",    display: "bahiana",         label: "barlow-cond",     kind: "condensed" },
  cutout:  { name: "Cutout",  display: "londrina-solid",  label: "nunito",          kind: "condensed" },
  press:   { name: "Press",   display: "truculenta",      label: "manrope",         kind: "condensed" },
  speed:   { name: "Speed",   display: "kanit-italic",    label: "chivo-700",       kind: "grotesk" },
  varsity: { name: "Varsity", display: "tourney",         label: "chivo-700",       kind: "display" },
  brush:   { name: "Brush",   display: "caveat-brush",    label: "manrope",         kind: "script" },
  marker:  { name: "Marker",  display: "sedgwick",        label: "manrope",         kind: "script" },
  puff:    { name: "Puff",    display: "dynapuff",        label: "nunito",          kind: "display" },
  riot:    { name: "Riot",    display: "protest-riot",    label: "franklin-700",    kind: "display" },
  boogie:  { name: "Boogie",  display: "boogaloo",        label: "instrument-sans", kind: "display" },
  toon:    { name: "Toon",    display: "galindo",         label: "nunito",          kind: "display" },
  /* The logo's own tones (DESIGN-LAW 183): what real businesses in the trade set their names in, from faces
     the site already ships (assets/fonts, each open-licence and in motion/catalog.js FONTS). The ads never
     wear them, so they are held to FONTS and their outlines, not to TYPE_VOICES (logoOnly). case: how the
     name is set by the layouts drawn for them ("title", "lower" or capitals); track: the name's tracking. */
  classic:   { name: "Classic",   display: "young-serif",      label: "manrope",         kind: "serif",     logoOnly: true, case: "title" },
  banker:    { name: "Banker",    display: "zodiak",           label: "schibsted-700",   kind: "serif",     logoOnly: true, track: .05 },
  engraved:  { name: "Engraved",  display: "cormorant",        label: "instrument-sans", kind: "serif",     logoOnly: true, track: .14 },
  editorial: { name: "Editorial", display: "instrument-serif", label: "instrument-sans", kind: "serif",     logoOnly: true, case: "title" },
  sleek:     { name: "Modern",    display: "satoshi-700",      label: "manrope",         kind: "geometric", logoOnly: true, case: "lower", track: -.02 },
  geometric: { name: "Geometric", display: "sora",             label: "sora",            kind: "geometric", logoOnly: true, case: "title", track: -.02 },
  clean:     { name: "Clean",     display: "instrument-sans",  label: "manrope",         kind: "grotesk",   logoOnly: true, case: "title", track: -.01 },
  friendly:  { name: "Friendly",  display: "nunito",           label: "nunito",          kind: "geometric", logoOnly: true, case: "lower", track: -.01 },
  studio:    { name: "Studio",    display: "clash",            label: "satoshi-700",     kind: "geometric", logoOnly: true, case: "title" },
  sturdy:    { name: "Sturdy",    display: "roboto-slab",      label: "franklin-700",    kind: "slab",      logoOnly: true, case: "title" },
  workshop:  { name: "Workshop",  display: "zilla-slab",       label: "barlow-cond",     kind: "slab",      logoOnly: true, case: "title" },
};
/** every face a logo may be set in: the modules logo/glyphs/<face>.js */
export const LOGO_FACES = [...new Set(Object.values(LOGO_VOICES).flatMap(v => [v.display, v.label]))];
