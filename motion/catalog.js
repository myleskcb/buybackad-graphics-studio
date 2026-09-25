// Phone Ad Maker: every choice an ad makes, as data.
//
// A style is the whole design of one ad. Every field can be set by hand in the
// panel, and every field left unlocked is drawn from the seed INDEPENDENTLY, so
// no two cuts share a look: the typeface does not decide the palette, the
// palette does not decide the motion, the motion does not decide the sound.
// Ported from iphoneslainv scripts/phone-ad (the Mac engine), widened 2-3x.

export const FONTS = {
  // name: [family, weight, file(s), kind]   kind: geometric grotesk condensed wide slab serif display script mono
  "unbounded":        ["Unbounded", 900, "unbounded-var.woff2", "wide"],
  "bricolage":        ["Bricolage Grotesque", 800, "bricolage-grotesque-var.woff2", "grotesk"],
  "sofia-xcond":      ["Sofia Sans Extra Condensed", 900, "sofia-sans-xcond-var.woff2", "condensed"],
  "schibsted":        ["Schibsted Grotesk", 900, "schibsted-grotesk-var.woff2", "grotesk"],
  "clash":            ["Clash Display", 700, "clash-display-700.woff2", "geometric"],
  "satoshi":          ["Satoshi", 900, "satoshi-900.woff2", "geometric"],
  "chivo":            ["Chivo", 900, "chivo-900.woff2", "grotesk"],
  "franklin":         ["Libre Franklin", 900, "libre-franklin-900.woff2", "grotesk"],
  "oswald":           ["Oswald", 700, "oswald-700.woff2", "condensed"],
  "big-shoulders":    ["Big Shoulders Display", 700, "big-shoulders-display-700.woff2", "condensed"],
  "stencil":          ["Big Shoulders Stencil Display", 700, "big-shoulders-stencil-display-700.woff2", "condensed"],
  "barlow-cond":      ["Barlow Condensed", 700, "barlow-condensed-700.woff2", "condensed"],
  "saira-cond":       ["Saira Condensed", 700, "saira-condensed-700.woff2", "condensed"],
  "teko":             ["Teko", 700, "teko-700.woff2", "condensed"],
  "khand":            ["Khand", 700, "khand-700.woff2", "condensed"],
  "russo":            ["Russo One", 400, "russo-one-400.woff2", "wide"],
  "bungee":           ["Bungee", 400, "bungee-400.woff2", "display"],
  "bungee-shade":     ["Bungee Shade", 400, "bungee-shade-400.woff2", "display"],
  "bangers":          ["Bangers", 400, "bangers-400.woff2", "display"],
  "luckiest":         ["Luckiest Guy", 400, "luckiest-guy-400.woff2", "display"],
  "knewave":          ["Knewave", 400, "knewave-400.woff2", "script"],
  "shrikhand":        ["Shrikhand", 400, "shrikhand-400.woff2", "display"],
  "tilt-warp":        ["Tilt Warp", 400, "tilt-warp-400.woff2", "display"],
  "audiowide":        ["Audiowide", 400, "audiowide-400.woff2", "wide"],
  "squada":           ["Squada One", 400, "squada-one-400.woff2", "condensed"],
  "wallpoet":         ["Wallpoet", 400, "wallpoet-400.woff2", "display"],
  "faster-one":       ["Faster One", 400, "faster-one-400.woff2", "display"],
  "fascinate":        ["Fascinate", 400, "fascinate-400.woff2", "display"],
  "rye":              ["Rye", 400, "rye-400.woff2", "display"],
  "pirata":           ["Pirata One", 400, "pirata-one-400.woff2", "display"],
  "marker":           ["Permanent Marker", 400, "permanent-marker-400.woff2", "script"],
  "sedgwick":         ["Sedgwick Ave Display", 400, "sedgwick-ave-display-400.woff2", "script"],
  "kaushan":          ["Kaushan Script", 400, "kaushan-script-400.woff2", "script"],
  "wet-paint":        ["Rubik Wet Paint", 400, "rubik-wet-paint-400.woff2", "display"],
  "rubik-dirt":       ["Rubik Dirt", 400, "rubik-dirt-400.woff2", "display"],
  "press-start":      ["Press Start 2P", 400, "press-start-2p-400.woff2", "mono"],
  "gloock":           ["Gloock", 400, "gloock-400.woff2", "serif"],
  "young-serif":      ["Young Serif", 400, "young-serif-400.woff2", "serif"],
  "zodiak":           ["Zodiak", 700, "zodiak-700.woff2", "serif"],
  "melodrama":        ["Melodrama", 700, "melodrama-700.woff2", "serif"],
  "cormorant":        ["Cormorant Garamond", 700, "cormorant-garamond-700.woff2", "serif"],
  "roboto-slab":      ["Roboto Slab", 700, "roboto-slab-700.woff2", "slab"],
  "zilla-slab":       ["Zilla Slab", 700, "zilla-slab-700.woff2", "slab"],
  "manrope":          ["Manrope", 700, "manrope-700.woff2", "geometric"],
  "sora":             ["Sora", 700, "sora-700.woff2", "geometric"],
  "instrument-sans":  ["Instrument Sans", 700, "instrument-sans-700.woff2", "grotesk"],
  "instrument-serif": ["Instrument Serif", 400, "instrument-serif-400.woff2", "serif"],
  "nunito":           ["Nunito", 700, "nunito-700.woff2", "geometric"],
  "sniglet":          ["Sniglet", 400, "sniglet-400.woff2", "display"],
  "special-elite":    ["Special Elite", 400, "special-elite-400.woff2", "mono"],
  "jetbrains":        ["JetBrains Mono", 700, "jetbrains-mono-700.woff2", "mono"],
  "cabin-sketch":     ["Cabin Sketch", 700, "cabin-sketch-700.woff2", "display"],
};

// Faces too fine or too busy to carry an outline or a thin treatment.
export const FINE_FACES = new Set(["instrument-serif", "cormorant", "bungee-shade", "rubik-iso", "faster-one", "cabin-sketch", "rubik-dirt"]);

// name: ground, light (middle of the ground), ink (headline), accent,
//       plate (behind boxed type), plate_ink (type on the plate)
const P = (ground, light, ink, accent, plate, plate_ink) => ({ ground, light, ink, accent, plate, plate_ink });
export const PALETTES = {
  "sand": P("#d6ba8e", "#ecd7b4", "#ffffff", "#1c1c1e", "#1c1c1e", "#ffffff"),
  "studio": P("#b9bcc3", "#e3e5ea", "#ffffff", "#0a84ff", "#0a84ff", "#ffffff"),
  "midnight": P("#0f1424", "#2a3560", "#ffffff", "#ffd60a", "#ffd60a", "#111111"),
  "graphite": P("#232427", "#4a4c53", "#ffffff", "#30d158", "#30d158", "#0b0b0b"),
  "sage": P("#9dac92", "#d6dfcd", "#ffffff", "#263a24", "#263a24", "#eef3e9"),
  "blush": P("#d9a99a", "#f0cfc2", "#ffffff", "#7a1535", "#7a1535", "#ffffff"),
  "cobalt": P("#1740c9", "#4a78ff", "#ffffff", "#ffe14d", "#ffe14d", "#0a1a5c"),
  "tangerine": P("#f26a1b", "#ffa15c", "#ffffff", "#1a1a1a", "#1a1a1a", "#ffffff"),
  "lime": P("#b8e62a", "#e4ff8a", "#111111", "#111111", "#111111", "#c6f432"),
  "paper": P("#ece8df", "#ffffff", "#111111", "#e63b2e", "#e63b2e", "#ffffff"),
  "cherry": P("#a50f2a", "#e0364f", "#ffffff", "#ffd166", "#ffd166", "#3a0010"),
  "mint": P("#98dcc2", "#d4f5e9", "#0d2b22", "#0d2b22", "#0d2b22", "#b8f0da"),
  "noir": P("#090909", "#262626", "#ffffff", "#ff375f", "#ff375f", "#ffffff"),
  "lavender": P("#b2a4d8", "#e7e0fb", "#ffffff", "#2c2152", "#2c2152", "#efeaff"),
  "ocean": P("#0b4f6c", "#1b8ab3", "#ffffff", "#7cf5ff", "#7cf5ff", "#062a3a"),
  "butter": P("#f3cf4a", "#fff0a6", "#1a1a1a", "#1a1a1a", "#1a1a1a", "#f6d55c"),
  "cash": P("#0f5132", "#1f8a57", "#ffffff", "#c9f27a", "#c9f27a", "#0b3322"),
  "concrete": P("#8e8e93", "#c7c7cc", "#ffffff", "#111111", "#111111", "#ffffff"),
  "ultraviolet": P("#2b0b5e", "#6a2cd6", "#ffffff", "#ff6ad5", "#ff6ad5", "#1a0638"),
  "burgundy": P("#4e1f2a", "#8b3a4d", "#ffffff", "#f2d3a0", "#f2d3a0", "#3e2128"),
  "glacier": P("#a9bdd4", "#e4eef8", "#173150", "#173150", "#173150", "#e4eef8"),
  "ultramarine": P("#353cae", "#6b73e6", "#ffffff", "#9ff0ff", "#9ff0ff", "#1a1d5c"),
  "teal": P("#5c9892", "#a9d6cf", "#ffffff", "#fff3b0", "#0e3b37", "#eafff9"),
  "soft-pink": P("#e3a4ae", "#fbe3e6", "#ffffff", "#7a1f35", "#7a1f35", "#ffffff"),
  "terracotta": P("#b5563b", "#e08a6b", "#fff6ec", "#2b1a12", "#2b1a12", "#fff6ec"),
  // widened 2026-09-24
  "electric": P("#0b0b2e", "#3a2fd6", "#ffffff", "#00f0ff", "#00f0ff", "#07072a"),
  "flamingo": P("#ff5f8f", "#ffa3bf", "#ffffff", "#2a0a1c", "#2a0a1c", "#ffffff"),
  "matcha": P("#6f8f4e", "#b8cf8e", "#ffffff", "#fffbe0", "#1f2d12", "#eaf5d8"),
  "espresso": P("#2b1a12", "#5c3a28", "#fff4e6", "#f0b36b", "#f0b36b", "#2b1a12"),
  "arctic": P("#d6ecfa", "#ffffff", "#0b2a44", "#0b2a44", "#0b2a44", "#dff3ff"),
  "neon-lime": P("#0a0a0a", "#1f2a0a", "#ffffff", "#c6ff00", "#c6ff00", "#0a0a0a"),
  "sunset": P("#ff7a3d", "#ffc15e", "#ffffff", "#5a0f2e", "#5a0f2e", "#ffffff"),
  "berry": P("#5b1647", "#a23b82", "#ffffff", "#ffcf5c", "#ffcf5c", "#3a0b2d"),
  "denim": P("#23395d", "#4a6fa5", "#ffffff", "#f4d35e", "#f4d35e", "#1a2a44"),
  "coral": P("#ff6f61", "#ffab9f", "#ffffff", "#1e2a38", "#1e2a38", "#ffffff"),
  "mocha": P("#8a6a55", "#c4a58e", "#ffffff", "#fff1e0", "#2a1d15", "#f5ebe2"),
  "forest": P("#0f3d2e", "#1f6b4f", "#ffffff", "#ffd479", "#ffd479", "#0f3d2e"),
  "royal": P("#1b1464", "#3d33c9", "#ffffff", "#ffb703", "#ffb703", "#1b1464"),
  "bubblegum": P("#ffb3d9", "#ffe0f0", "#3a0d2a", "#3a0d2a", "#3a0d2a", "#ffe0f0"),
  "slate": P("#334155", "#64748b", "#ffffff", "#38bdf8", "#38bdf8", "#0f172a"),
  "gold": P("#a87808", "#f0c75e", "#ffffff", "#fff6d8", "#1a1204", "#f7e3a6"),
  "chrome": P("#9ca3af", "#e5e7eb", "#ffffff", "#111827", "#111827", "#f3f4f6"),
  "infrared": P("#e0112f", "#ff6b7f", "#ffffff", "#fff2a8", "#1b0006", "#ffffff"),
  "aqua": P("#0096b8", "#90e0ef", "#ffffff", "#fff9b8", "#023e8a", "#caf0f8"),
  "plum": P("#3c1642", "#6d2e79", "#ffffff", "#f7b2bd", "#f7b2bd", "#3c1642"),
  "olive": P("#5a5a2e", "#9a9a5a", "#ffffff", "#f3e9d2", "#f3e9d2", "#3a3a1c"),
  "peach": P("#ffb38a", "#ffe0cc", "#3b1a0a", "#3b1a0a", "#3b1a0a", "#ffe0cc"),
  "cyberpunk": P("#120024", "#3b0a6b", "#ffffff", "#f5ff00", "#f5ff00", "#120024"),
  "vintage": P("#e9dcc3", "#fff7e6", "#3a2a1a", "#b23a2b", "#b23a2b", "#fff7e6"),
  "tropical": P("#00a67e", "#3fe0b0", "#ffffff", "#ffde59", "#ffde59", "#004d3a"),
  "rosewood": P("#7b2d26", "#b85c4e", "#ffffff", "#ffe3c9", "#ffe3c9", "#4a1813"),
  "steel": P("#1f2933", "#3e4c59", "#ffffff", "#e4e7eb", "#e4e7eb", "#1f2933"),
  "mango": P("#ffae00", "#ffd166", "#1a1a1a", "#1a1a1a", "#1a1a1a", "#ffd166"),
  "ice": P("#cfe8ff", "#f2f8ff", "#0a2540", "#0a2540", "#0a2540", "#cfe8ff"),
  "magenta": P("#c2185b", "#f06292", "#ffffff", "#fff176", "#fff176", "#6a0f33"),
  "navy-gold": P("#0a1931", "#185adb", "#ffffff", "#ffc947", "#ffc947", "#0a1931"),
  "carbon": P("#151515", "#2e2e2e", "#ffffff", "#ff6b00", "#ff6b00", "#151515"),
  "sky": P("#3fb3ec", "#b3e5fc", "#ffffff", "#fffde0", "#01579b", "#e1f5fe"),
  "sandstone": P("#c9a27e", "#ead7c3", "#ffffff", "#3b2a1a", "#3b2a1a", "#f6ede2"),
  "mint-choc": P("#3e2723", "#6d4c41", "#ffffff", "#a8e6cf", "#a8e6cf", "#3e2723"),
  "lemonade": P("#fff3a3", "#fffbe0", "#2b2b00", "#e4572e", "#e4572e", "#ffffff"),
};

// a phone's finish -> the palette painted in it (palette "match")
export const FINISH_PALETTES = {
  "Burgundy": "burgundy", "Glacier": "glacier", "Ultramarine": "ultramarine", "Teal": "teal",
  "Lavender": "lavender", "Sage": "sage", "Soft Pink": "soft-pink", "Pink": "flamingo",
  "Cosmic Orange": "tangerine", "Deep Blue": "midnight", "Mist Blue": "ice", "Silver": "chrome",
  "Black": "carbon", "White": "paper",
};

export const HEADLINES = [
  "WE BUY PHONES", "WE BUY IPHONES", "CASH FOR YOUR IPHONE", "SELL YOUR PHONE TODAY",
  "TURN YOUR PHONE INTO CASH", "GOT AN OLD IPHONE?", "CASH FOR PHONES", "SELL US YOUR IPHONE",
  "YOUR OLD PHONE IS WORTH CASH", "DON'T LET IT SIT IN A DRAWER", "UPGRADED? SELL THE OLD ONE",
  "WE PAY CASH FOR IPHONES", "NEW PHONE? SELL THE OLD ONE", "CASH IN YOUR OLD IPHONE",
  "WE BUY USED IPHONES", "SELL YOUR IPHONE LOCALLY", "GET CASH FOR YOUR PHONE", "PHONES INTO CASH",
  "OLD IPHONE? GET PAID", "WE BUY IPHONES AND IPADS", "SELL IT, DON'T STORE IT", "EMPTY THAT DRAWER",
  "GOT A SPARE IPHONE?", "TRADE YOUR PHONE FOR CASH", "YOUR IPHONE HAS VALUE", "WE WANT YOUR IPHONE",
  "SELL YOUR OLD IPHONE", "CASH FOR IPHONES", "THAT OLD PHONE IS MONEY", "STILL GOT YOUR OLD IPHONE?",
  "WE BUY EVERY IPHONE", "SWITCHED PHONES? SELL US THE OLD ONE",
];
// The first second: a question or a pattern break, never a claim or a price.
export const HOOKS = ["STILL GOT YOUR OLD IPHONE?", "UPGRADED THIS YEAR?", "OLD PHONE IN A DRAWER?",
  "GOT AN IPHONE YOU DON'T USE?", "WAIT. READ THIS.", "IPHONE OWNERS, LOOK", "NEW PHONE?", "THAT OLD IPHONE?",
  "STOP SCROLLING", "HOW MUCH IS YOUR OLD IPHONE WORTH?", "DRAWER FULL OF PHONES?", "SWITCHING PHONES?"];
export const TAGS = ["", "", "", "TEXT FOR A QUOTE", "CALL OR TEXT", "LOCAL CASH OFFERS", "FAST, FAIR, LOCAL",
  "FREE QUOTE", "QUICK QUOTES", "LOCAL BUYER", "IPHONE, IPAD, MACBOOK", "MEET LOCALLY", "ALL MODELS WANTED",
  "TEXT A PHOTO FOR A QUOTE"];
export const NUMBER_LABELS = ["", "", "CALL OR TEXT", "TEXT US", "GET A QUOTE", "TEXT FOR A QUOTE", "CALL NOW", "TEXT ME"];

export const OPTIONS = {
  font: Object.keys(FONTS),
  number_font: ["same", ...Object.keys(FONTS)],
  case: ["upper", "title"],
  tracking: [-0.02, 0, 0.02, 0.05, 0.1],
  skew: [0, 0, 0, 8, 12, -8],
  text_fx: ["shadow", "hard_shadow", "outline", "sticker", "extrude", "box", "glow", "flat",
    "neon", "gradient", "chrome", "long_shadow", "highlighter", "double_outline", "rgb_split", "cutout"],
  color_mode: ["mono", "accent_word", "split_lines", "accent_line"],
  text_in: ["slide", "skew_slide", "slide_letters", "wipe", "slam", "drop_letters",
    "typewriter", "word_pop", "blur_in", "rise_mask", "flip_in", "stomp", "scramble", "spin_letters"],
  text_pos: ["top-left", "top-center", "middle-left", "bottom-left", "center", "top-right"],
  number_style: ["plain", "pill", "box", "outline", "underline", "sticker", "ticket", "tag", "neon", "split", "stacked", "chrome"],
  number_format: ["raw", "dashed", "dotted", "parens", "spaced"],
  number_pos: ["bottom-center", "bottom-left", "bottom-right", "under-headline"],
  number_in: ["pop", "slide_up", "type", "wipe", "flip", "roll", "slide_left", "drop"],
  arrangement: ["row", "fan", "pile", "diagonal", "arc", "grid", "hero", "cascade",
    "tower", "spiral", "vee", "ring", "staircase", "crossed", "giants", "pairs"],
  entry: ["fly_spin", "drop", "conveyor", "zoom", "orbit", "deal", "pop", "rain", "boomerang", "split", "spiral_in", "whip"],
  end_face: ["back", "front", "mixed"],
  front_glimpse: ["spin", "hold"],
  background: ["radial", "flat", "linear", "split", "rays", "dots", "stripes", "spotlight", "bigword", "grid",
    "mesh", "rings", "checker", "waves", "bokeh", "confetti", "duotone", "halftone", "beams", "frame", "sunburst", "noise"],
  palette: [...Object.keys(PALETTES), "match", "match", "match"],
  camera: ["push_in", "push_out", "still", "drift", "punch", "tilt", "whip_in", "handheld"],
  shake: [0, 1, 2],
  sound_kit: ["house", "trap", "boombap", "minimal", "lofi", "edm", "afrobeat", "funk", "drumline", "none"],
  hit: ["impact", "riser", "glitch", "cymbal", "bass_drop", "clap_stack"],
  number_sfx: ["pop", "register", "ticks", "coin", "chime", "whoosh_ding"],
  glare: [0.5, 1, 1, 1.5],
  hook: ["hook_line", "hook_line", "hook_line", "crash_zoom", "flash_cut", "punch_in", "cold_open"],
  overlay: ["none", "none", "confetti", "light_leak", "vignette_pulse", "lens_flare", "glitch", "grain_live", "sparkle_field"],
};

// The BACK is what makes a model recognisable: every drawn cut ends on the backs,
// and most show the fronts only as they flash past. Type that ENTERS FROM THE
// LEFT is drawn three times as often as the rest.
export const WEIGHTS = {
  end_face: { back: 1, front: 0, mixed: 0 },
  front_glimpse: { spin: 3, hold: 1 },
  text_in: { slide: 3, skew_slide: 3, slide_letters: 3, wipe: 3 },
};

export const FLAGS = { flash: 0.6, shine: 0.5, rgb_hit: 0.3, speed_lines: 0.35, sparkles: 0.35 };

export const DEFAULT_STYLE = {
  phones: [], headline: "WE BUY PHONES", tag: "", number: "", number_label: "",
  seed: 1, aspect: "1:1", duration: 6, fps: 30,
  font: "franklin", number_font: "same", case: "upper", tracking: 0, skew: 0,
  text_fx: "shadow", color_mode: "mono", accent_word: -1, text_in: "slide", text_pos: "top-left",
  text_scale: 1, number_style: "plain", number_format: "raw", number_pos: "bottom-center", number_in: "pop",
  number_scale: 1, arrangement: "row", entry: "fly_spin", end_face: "back", front_glimpse: "spin",
  phone_scale: 1, background: "radial", palette: "sand", scrim: -1, camera: "push_in", shake: 1,
  flash: true, shine: true, rgb_hit: false, speed_lines: false, sparkles: false, grain: true,
  sound_kit: "house", bpm: 118, hit: "impact", number_sfx: "pop", music_volume: 0.5, glare: 1,
  overlay: "none", bigword: "CASH", hook: "hook_line", hook_text: "",
};

// The first ad's look, as a starting point.
export const CLASSIC = {
  font: "franklin", text_fx: "shadow", text_in: "slide", text_pos: "top-left", number_style: "plain",
  number_pos: "bottom-center", number_in: "pop", arrangement: "row", entry: "fly_spin", end_face: "back",
  front_glimpse: "hold", background: "radial", palette: "sand", color_mode: "mono", camera: "push_in",
  sound_kit: "house", overlay: "none", hook: "cold_open",
};

// Human labels for the panel.
export const LABELS = {
  font: "Typeface", number_font: "Number typeface", case: "Case", tracking: "Letter spacing", skew: "Slant",
  text_fx: "Type treatment", color_mode: "Colour use", text_in: "Headline entrance", text_pos: "Headline position",
  number_style: "Number style", number_format: "Number format", number_pos: "Number position",
  number_in: "Number entrance", arrangement: "Phone layout", entry: "Phones enter by", end_face: "Phones end on",
  front_glimpse: "Screens shown", background: "Background", palette: "Palette", camera: "Camera", shake: "Impact shake",
  sound_kit: "Music", hit: "Headline hit sound", number_sfx: "Number sound", glare: "Screen glare", overlay: "Overlay effect", hook: "Opening hook (first second)",
};

export const GROUPS = [
  ["Type", ["font", "number_font", "case", "tracking", "skew", "text_fx", "color_mode"]],
  ["Opening", ["hook", "text_in", "text_pos"]],
  ["Number", ["number_style", "number_format", "number_pos", "number_in"]],
  ["Phones", ["arrangement", "entry", "end_face", "front_glimpse", "glare"]],
  ["Scene", ["background", "palette", "camera", "shake", "overlay"]],
  ["Sound", ["sound_kit", "hit", "number_sfx"]],
];

export function countLooks() {
  let n = 1;
  for (const k of Object.keys(OPTIONS)) n *= new Set(OPTIONS[k]).size;
  return n;
}
