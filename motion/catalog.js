// Phone Ad Maker: every choice an ad makes, as data.
//
// A style is the whole design of one ad. Every field can be set by hand in the
// panel, and every field left unlocked is drawn from the seed INDEPENDENTLY, so
// no two cuts share a look: the typeface does not decide the palette, the
// palette does not decide the motion, the motion does not decide the sound.
// Ported from iphoneslainv scripts/phone-ad (the Mac engine), widened 2-3x.
//
// Who the ad is for (an audience: its words, looks, music and voice) lives in
// audiences.js; the voices in voices.js; the fifty themes in themes.js.

import { MORE_VIBES, AUDIENCES, AUDIENCE_KEYS, MOODS } from "./audiences.js";
import { CASTS } from "./voices.js";
import { THEME_PALETTES, THEME_BOARDS, THEME_GROUNDS, THEMES, THEME_FAMILIES } from "./themes.js";
export { THEMES, THEME_FAMILIES, THEME_GROUNDS };

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
  "kalam":            ["Kalam", 700, "kalam-700.woff2", "script"],
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
  // LA, 2026-09-25
  "golden_hour": { ...P("#3d1a70", "#ffc857", "#ffffff", "#ffe066", "#ff6a3d", "#3d1a70"), sky: ["#3d1a70", "#8a3196", "#ff6a3d", "#ffc857"], sil: "#1a0b2e", sun: "#ffb347" },
  "pink_hour": { ...P("#1d2b64", "#ffb88c", "#ffffff", "#ffe066", "#ff5e8e", "#1d2b64"), sky: ["#1d2b64", "#8e3a9d", "#ff5e8e", "#ffb88c"], sil: "#160f30", sun: "#ffc36b" },
  "dusk_purple": { ...P("#2a2466", "#f7797d", "#ffffff", "#ffd166", "#b1447a", "#2a2466"), sky: ["#2a2466", "#46408a", "#b1447a", "#f7797d"], sil: "#140f2e", sun: "#ff9a8b" },
  "la_sunset_teal": { ...P("#0b3c5d", "#ffd166", "#ffffff", "#ffd166", "#f76c6c", "#0b3c5d"), sky: ["#0b3c5d", "#328cc1", "#f76c6c", "#ffd166"], sil: "#08202f", sun: "#ffb347" },
  "freeway_sky": P("#6fb7e9", "#dff1ff", "#0b2545", "#ffd21f", "#006b3f", "#ffffff"),
  "freeway_dusk": { ...P("#f0875a", "#ffd8b0", "#ffffff", "#ffd21f", "#006b3f", "#ffffff"), sky: ["#3b2c85", "#b84f9e", "#f0875a", "#ffd8b0"], sil: "#1e1433" },
  "freeway_night": P("#0d1b36", "#27457a", "#ffffff", "#ffd21f", "#006b3f", "#ffffff"),
  "swap_yellow": P("#fff200", "#fffbb0", "#111111", "#e4002b", "#e4002b", "#ffffff"),
  "swap_green": P("#7dff3a", "#d8ffb8", "#111111", "#e4002b", "#111111", "#7dff3a"),
  "swap_orange": P("#ff9e1b", "#ffd29a", "#111111", "#0033cc", "#0033cc", "#ffffff"),
  "swap_pink": P("#ff5fb0", "#ffc2e2", "#111111", "#fff200", "#111111", "#fff200"),
  "stucco_peach": P("#e7c3a1", "#f6e2cf", "#1a1a1a", "#b5402a", "#b5402a", "#ffffff"),
  "stucco_white": P("#ece4d6", "#faf6ee", "#1a1a1a", "#c1121f", "#c1121f", "#ffffff"),
  "concrete_grey": P("#9a9a96", "#c9c9c4", "#111111", "#ff2bd6", "#111111", "#ffffff"),
  "store_red": P("#ece4d6", "#faf6ee", "#1a1a1a", "#c1121f", "#c1121f", "#ffffff"),
  "store_green": P("#dfe9dc", "#f5faf2", "#1a1a1a", "#1b7f3b", "#1b7f3b", "#ffffff"),
  "store_blue": P("#e3e8f0", "#f7f9fc", "#1a1a1a", "#1d4ed8", "#1d4ed8", "#ffffff"),
  "cork_board": P("#b27d4f", "#d9a877", "#111111", "#d90429", "#fbfaf5", "#111111"),
  "candy_red": P("#8a0016", "#ff1f45", "#ffffff", "#f6c945", "#f6c945", "#3a0008"),
  "candy_purple": P("#4a0a7a", "#b44dff", "#ffffff", "#f6c945", "#f6c945", "#26003f"),
  "candy_teal": P("#00393b", "#00b3b3", "#ffffff", "#f6c945", "#f6c945", "#00393b"),
  "candy_green": P("#0a3d12", "#22b14c", "#ffffff", "#f6c945", "#f6c945", "#0a3d12"),
  "night_brick": P("#2a1422", "#6b2f3f", "#ffffff", "#ff2e88", "#00e5ff", "#0d0716"),
  "night_blue": P("#101a3a", "#34457a", "#ffffff", "#00e5ff", "#ff2e88", "#0d0716"),
  "mural_marigold": P("#f4a300", "#ffd166", "#1d1a3a", "#0c7c8c", "#e0527b", "#ffffff"),
  "mural_teal": P("#0c7c8c", "#2ec4b6", "#ffffff", "#ffb000", "#e0527b", "#ffffff"),
  "mural_rose": P("#d64878", "#ff9ebb", "#ffffff", "#ffe066", "#2a1a5e", "#ffffff"),
  "la_blue": P("#005a9c", "#1f7fd1", "#ffffff", "#ef3e42", "#ffffff", "#005a9c"),
  "la_blue_white": P("#dce9f7", "#ffffff", "#005a9c", "#ef3e42", "#005a9c", "#ffffff"),
  "purple_gold": P("#3b1a6e", "#6a3fb5", "#fdb927", "#ffffff", "#fdb927", "#3b1a6e"),
  "venice_teal": { ...P("#48cae4", "#caf0f8", "#0b2545", "#ff6b35", "#ff6b35", "#ffffff"), sand: "#f2d7a6" },
  "venice_sand": { ...P("#90e0ef", "#fff3dc", "#0b2545", "#ff6b35", "#ff6b35", "#ffffff"), sand: "#f2d7a6" },
  "spray_concrete": P("#8d8d8d", "#bdbdbd", "#111111", "#ff2bd6", "#00f5d4", "#111111"),
  "spray_night": P("#1b1b1f", "#3a3a44", "#ffffff", "#39ff14", "#ff2bd6", "#111111"),
  "marquee_red": P("#3b0a0a", "#7a1414", "#ffffff", "#ffd166", "#c1121f", "#ffffff"),
  "marquee_night": P("#0f0f14", "#2b2b36", "#ffffff", "#ffd166", "#c1121f", "#ffffff"),
  // jewel tones, soft pastels with dark ink, one-hue metals (2026-09-26). Every
  // one keeps its headline ink 4.5:1 or more off the ground it sits on.
  "emerald": P("#0b5d4b", "#1f8f74", "#ffffff", "#ffd166", "#ffd166", "#0b3d31"),
  "sapphire": P("#0f2c6b", "#2753b8", "#ffffff", "#7fd3ff", "#7fd3ff", "#0a1f4d"),
  "amethyst": P("#3d1f6b", "#6b44b3", "#ffffff", "#ffd6f2", "#ffd6f2", "#2a1450"),
  "ruby": P("#7a0f24", "#b8243f", "#ffffff", "#ffe08a", "#ffe08a", "#4a0816"),
  "onyx_gold": P("#24211c", "#3d372d", "#ffffff", "#e9c46a", "#e9c46a", "#1a1712"),
  "pearl": P("#efeae4", "#ffffff", "#1b1b1f", "#9a7440", "#1b1b1f", "#ffffff"),
  "powder": P("#cfe0f5", "#f1f6fd", "#10243f", "#2f6fde", "#10243f", "#ffffff"),
  "pistachio": P("#cfe3b5", "#eef6e2", "#1d2e12", "#3f7d20", "#1d2e12", "#eef6e2"),
  "apricot": P("#f6c7a4", "#fde8d8", "#3a1a08", "#c2410c", "#3a1a08", "#fde8d8"),
  "lilac": P("#d8cdf0", "#f3eefc", "#251447", "#6d28d9", "#251447", "#f3eefc"),
  "rose_quartz": P("#f2c9cf", "#fdecef", "#3d0e1a", "#be123c", "#3d0e1a", "#fdecef"),
  "seafoam": P("#bfe8dd", "#e9f8f4", "#0b3b31", "#0f766e", "#0b3b31", "#e9f8f4"),
  "titanium": P("#4a4d52", "#7a7e85", "#ffffff", "#f5f5f7", "#f5f5f7", "#1d1d1f"),
  "rose_gold": P("#8e5253", "#b67a74", "#ffffff", "#fff1e6", "#3a1d1d", "#fff1e6"),
  "bronze": P("#5e3b1e", "#a8743f", "#ffffff", "#ffe0b0", "#ffe0b0", "#3d2512"),
  "platinum": P("#d9dbe0", "#f4f5f7", "#16181d", "#4b5563", "#16181d", "#ffffff"),
  "midnight_teal": P("#062a30", "#0e5561", "#ffffff", "#5eead4", "#5eead4", "#062a30"),
  "ink_blue": P("#0b1a33", "#1f3a66", "#ffffff", "#f9c74f", "#f9c74f", "#0b1a33"),
  "oxblood": P("#3b0d11", "#6e1a22", "#ffffff", "#f4d6b0", "#f4d6b0", "#3b0d11"),
  "pine": P("#12302a", "#2a5a4c", "#ffffff", "#e9f5a1", "#e9f5a1", "#12302a"),
  "signal_red": P("#c81e33", "#ec4a5e", "#ffffff", "#fff3b0", "#111111", "#ffffff"),
  "klein": P("#1f3fbf", "#4c6ef5", "#ffffff", "#fff275", "#fff275", "#10206b"),
  "cream_black": P("#f4efe6", "#fffaf2", "#111111", "#d0342c", "#111111", "#f4efe6"),
  "storm": P("#2e3440", "#4c566a", "#eceff4", "#88c0d0", "#88c0d0", "#2e3440"),
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
// Every line below is either a plain fact about the offer or an invitation. None
// promises a deadline, a price or that a person answers every message.
export const COPY = {
  en: {
    hooks: ["STILL GOT YOUR OLD IPHONE?", "UPGRADED THIS YEAR?", "OLD PHONE IN A DRAWER?", "GOT AN IPHONE YOU DON'T USE?",
      "WAIT. READ THIS.", "IPHONE OWNERS, LOOK", "NEW PHONE?", "THAT OLD IPHONE?", "STOP SCROLLING", "HOW MUCH IS YOUR OLD IPHONE WORTH?",
      "DRAWER FULL OF PHONES?", "SWITCHING PHONES?", "HEY {AREA}!", "{AREA}, LISTEN UP", "HEADS UP, IPHONE OWNERS"],
    headlines: ["WE BUY PHONES", "WE BUY IPHONES", "CASH FOR YOUR IPHONE", "SELL YOUR PHONE TODAY", "TURN YOUR PHONE INTO CASH",
      "CASH FOR PHONES", "SELL US YOUR IPHONE", "YOUR OLD PHONE IS WORTH CASH", "WE PAY CASH FOR IPHONES", "CASH IN YOUR OLD IPHONE",
      "WE BUY USED IPHONES", "SELL YOUR IPHONE LOCALLY", "GET CASH FOR YOUR PHONE", "{AREA} LOCALS BUYING IPHONES",
      "WE BUY IPHONES IN {AREA}", "LOCAL IPHONE BUYERS", "WE'RE FROM HERE. WE BUY IPHONES."],
    tags: ["", "", "TEXT FOR A QUOTE", "CALL OR TEXT", "LOCAL CASH OFFERS", "FREE QUOTE", "TEXT A PIC, GET A PRICE", "ALL MODELS WANTED",
      "FROM THE {CODE}", "{AREA} LOCAL", "WE'RE FROM HERE", "MEET UP LOCAL", "WE GOT YOU", "SE HABLA ESPAÑOL"],
    labels: ["", "", "CALL OR TEXT", "TEXT US", "GET A QUOTE", "TEXT FOR A QUOTE"],
    cta: ["TEXT NOW", "CALL NOW", "TEXT US NOW", "DON'T WAIT", "GET YOUR QUOTE"],
    urgent: ["IT LOSES VALUE EVERY MONTH", "SELL IT WHILE IT'S WORTH MORE", "NEW IPHONES ARE OUT. OLD ONES DROP."],
    ticker: ["TEXT A PIC", "GET A PRICE", "CASH", "LOCAL TO {AREA}", "ALL MODELS", "CALL OR TEXT", "SE HABLA ESPAÑOL", "IT LOSES VALUE EVERY MONTH"],
    stamp: ["CASH", "CASH PAID", "LOCAL"],
    burst: ["CASH!", "LOCAL!", "FREE QUOTE", "{CODE}"],
  },
  es: {
    hooks: ["¿TIENES UN IPHONE QUE YA NO USAS?", "¿CAMBIASTE DE TELÉFONO?", "¿IPHONE VIEJO EN EL CAJÓN?", "¡OYE! ¿Y ESE IPHONE VIEJO?",
      "NO LO DEJES EN EL CAJÓN", "¿SACASTE EL NUEVO IPHONE?", "¡ATENCIÓN, DUEÑOS DE IPHONE!", "¡OYE, {AREA}!"],
    headlines: ["COMPRAMOS IPHONES", "COMPRAMOS TELÉFONOS", "DINERO EN EFECTIVO POR TU IPHONE", "VENDE TU IPHONE AQUÍ",
      "TE COMPRAMOS TU IPHONE", "TU IPHONE VIEJO VALE DINERO", "CAMBIA TU IPHONE POR EFECTIVO", "COMPRAMOS IPHONES USADOS",
      "COMPRAMOS IPHONES EN {AREA}", "SOMOS DE AQUÍ. COMPRAMOS IPHONES."],
    tags: ["", "MÁNDANOS UNA FOTO", "LLAMA O MANDA TEXTO", "SOMOS DE AQUÍ", "COMPRADORES LOCALES", "COTIZACIÓN GRATIS", "TODOS LOS MODELOS", "SOMOS DE {AREA}", "AQUÍ EN {AREA}"],
    labels: ["", "LLAMA O MANDA TEXTO", "MÁNDANOS TEXTO", "LLÁMANOS"],
    cta: ["¡MÁNDANOS TEXTO!", "¡LLAMA YA!", "¡NO ESPERES!", "¡COTIZA AHORA!"],
    urgent: ["PIERDE VALOR CADA MES", "VÉNDELO MIENTRAS VALE MÁS", "SALIÓ EL NUEVO. EL VIEJO BAJA."],
    ticker: ["MÁNDANOS FOTO", "TE DAMOS PRECIO", "EFECTIVO", "SOMOS DE {AREA}", "TODOS LOS MODELOS", "LLAMA O MANDA TEXTO", "PIERDE VALOR CADA MES"],
    stamp: ["EFECTIVO", "EFECTIVO", "LOCAL"],
    burst: ["¡EFECTIVO!", "¡LOCAL!", "{CODE}"],
  },
  both: { labels: ["CALL OR TEXT \u00b7 LLAMA O ESCRIBE", "TEXT US \u00b7 MÁNDANOS TEXTO"] },
};

// The LA looks. Each vibe draws its palette, ground, faces, treatment, sign
// board, decorations and number style from its own pools, so one vibe is many
// looks, and its copy speaks the way that kind of sign speaks.
export const VIBES = {
  freeway: { label: "Freeway sign", palettes: ["freeway_sky", "freeway_dusk", "freeway_night"], backgrounds: ["sky_day", "sunset_sky", "asphalt"],
    fonts: ["oswald", "barlow-cond", "saira-cond", "sofia-xcond", "khand", "teko", "big-shoulders"], boards: ["freeway", "freeway", "freeway_blue"], boardChance: 1,
    decor: ["palms", "skyline"], decorMax: 2, numbers: ["pill", "box", "ticket"],
    copy: { en: { headlines: ["NEXT EXIT: CASH FOR IPHONES", "WE BUY IPHONES, NEXT EXIT", "CASH FOR IPHONES, {AREA}"], tags: ["{AREA} LOCAL", "TEXT A PIC, GET A PRICE", "LOCAL CASH OFFERS"], hooks: ["HEADS UP, {AREA}"] },
      es: { headlines: ["PRÓXIMA SALIDA: EFECTIVO POR TU IPHONE", "COMPRAMOS IPHONES"], tags: ["SOMOS DE AQUÍ", "MÁNDANOS UNA FOTO"] } } },
  sunset_blvd: { label: "Sunset palms", palettes: ["golden_hour", "pink_hour", "dusk_purple", "la_sunset_teal"], backgrounds: ["sunset_sky"],
    fonts: ["shrikhand", "kaushan", "knewave", "tilt-warp", "bungee", "unbounded", "clash"], fx: ["sticker", "extrude", "gradient", "long_shadow", "shadow", "hard_shadow"],
    numbers: ["sticker", "pill", "plain"],
    copy: { en: { headlines: ["SELL YOUR IPHONE IN {AREA}", "{AREA} LOCALS BUYING IPHONES", "CASH FOR YOUR OLD IPHONE"], tags: ["FROM THE {CODE}", "WE'RE FROM HERE"], hooks: ["{AREA}, GOT AN OLD IPHONE?"] },
      es: { headlines: ["COMPRAMOS IPHONES EN {AREA}", "TU IPHONE VIEJO VALE DINERO"], tags: ["SOMOS DE AQUÍ", "SOMOS DE {AREA}"] } } },
  swap_meet: { label: "Swap meet poster", palettes: ["swap_yellow", "swap_green", "swap_orange", "swap_pink"], backgrounds: ["fluoro", "halftone", "rays"],
    fonts: ["marker", "luckiest", "bangers", "sedgwick", "knewave", "bungee"], fx: ["flat", "hard_shadow", "sticker"], boards: ["poster"], boardChance: .5,
    decor: ["starburst"], decorMin: 1, numbers: ["tag", "sticker", "plain"],
    copy: { en: { headlines: ["WE BUY IPHONES!", "CASH FOR IPHONES!", "IPHONES WANTED!"], tags: ["ALL MODELS!", "TEXT A PIC!", "FREE QUOTE!"], burst: ["CASH!", "LOCAL!", "FREE QUOTE"] },
      es: { headlines: ["¡COMPRAMOS IPHONES!", "¡SE COMPRAN IPHONES!", "¡EFECTIVO POR TU IPHONE!"], tags: ["¡TODOS LOS MODELOS!", "¡MÁNDANOS FOTO!"], burst: ["¡EFECTIVO!", "¡LOCAL!"] } } },
  bandit_sign: { label: "Yellow street sign", palettes: ["stucco_peach", "stucco_white", "concrete_grey"], backgrounds: ["stucco", "concrete"],
    fonts: ["marker", "luckiest", "oswald", "franklin", "sedgwick", "kalam"], boards: ["bandit_yellow", "bandit_yellow", "bandit_white"], boardChance: 1, numbers: ["plain", "box"],
    copy: { en: { headlines: ["WE BUY IPHONES", "I BUY IPHONES", "IPHONES WANTED", "CASH FOR IPHONES"], tags: ["CALL OR TEXT", "ALL MODELS", "LOCAL BUYER"] },
      es: { headlines: ["COMPRO IPHONES", "COMPRAMOS IPHONES", "SE COMPRAN IPHONES"], tags: ["LLAMA O MANDA TEXTO"] } } },
  tear_off: { label: "Tear-off flyer", palettes: ["cork_board"], backgrounds: ["cork"], fonts: ["special-elite", "marker", "oswald", "franklin", "kalam"],
    boards: ["flyer"], boardChance: 1, numbers: ["underline", "plain", "box"],
    copy: { en: { headlines: ["I BUY IPHONES", "SELLING YOUR OLD IPHONE?", "WE BUY IPHONES. TAKE A NUMBER."], tags: ["LOCAL TO {AREA}", "TAKE A NUMBER"] },
      es: { headlines: ["COMPRO IPHONES", "¿VENDES TU IPHONE?"], tags: ["TOMA UN NÚMERO"] } } },
  lowrider: { label: "Lowrider candy paint", palettes: ["candy_red", "candy_purple", "candy_teal", "candy_green"], backgrounds: ["candy_flake"],
    fonts: ["kaushan", "pirata", "shrikhand", "clash", "knewave"], fx: ["chrome", "gold", "extrude", "glow"], decor: ["pinstripe", "sparkle"], decorMin: 1,
    numbers: ["chrome", "gold", "pill"],
    copy: { en: { headlines: ["WE BUY IPHONES", "CASH FOR YOUR IPHONE", "FROM THE {CODE}. WE BUY IPHONES."], tags: ["FROM THE {CODE}", "{AREA} LOCALS"] },
      es: { headlines: ["COMPRAMOS IPHONES", "EFECTIVO POR TU IPHONE"], tags: ["SOMOS DE {AREA}"] } } },
  neon_motel: { label: "Neon motel", palettes: ["night_brick", "night_blue"], backgrounds: ["brick_night"],
    fonts: ["kaushan", "shrikhand", "audiowide", "knewave", "tilt-warp", "bungee"], fx: ["neon"], boards: ["neon_box"], boardChance: .6,
    decor: ["neon_arrow", "sparkle"], numbers: ["neon", "pill"],
    copy: { en: { headlines: ["WE BUY IPHONES", "VACANCY: WE BUY IPHONES", "CASH FOR IPHONES"], tags: ["{AREA}", "TEXT US"] },
      es: { headlines: ["COMPRAMOS IPHONES"], tags: ["MÁNDANOS TEXTO"] } } },
  mural: { label: "Street mural", palettes: ["mural_marigold", "mural_teal", "mural_rose"], backgrounds: ["mural_wall"],
    fonts: ["bungee", "luckiest", "bangers", "tilt-warp", "shrikhand"], fx: ["double_outline", "extrude", "sticker", "hard_shadow"], decor: ["starburst"], decorMin: 0,
    numbers: ["sticker", "tag", "pill"],
    copy: { en: { headlines: ["WE BUY IPHONES", "{AREA} LOCALS BUYING IPHONES", "WE'RE FROM HERE. WE BUY IPHONES."], tags: ["FROM THE {CODE}", "SE HABLA ESPAÑOL"] },
      es: { headlines: ["SOMOS DE AQUÍ. COMPRAMOS IPHONES.", "COMPRAMOS IPHONES"], tags: ["AQUÍ EN {AREA}", "MÁNDANOS FOTO"] } } },
  corner_store: { label: "Corner store sign", palettes: ["store_red", "store_green", "store_blue"], backgrounds: ["stucco"],
    fonts: ["luckiest", "oswald", "bungee", "franklin", "big-shoulders"], boards: ["store_sign"], boardChance: 1, decor: ["awning"], decorMin: 0, numbers: ["box", "plain"],
    copy: { en: { headlines: ["WE BUY IPHONES", "CASH FOR IPHONES"], tags: ["SE HABLA ESPAÑOL", "LOCAL"] },
      es: { headlines: ["COMPRAMOS IPHONES", "EFECTIVO POR IPHONES"], tags: ["MÁNDANOS FOTO"] } } },
  la_blue: { label: "LA blue", palettes: ["la_blue", "la_blue_white"], backgrounds: ["sky_day", "stripes", "radial"],
    fonts: ["kaushan", "shrikhand", "clash", "franklin", "knewave"], fx: ["sticker", "shadow", "hard_shadow"], decor: ["skyline", "palms"], numbers: ["pill", "sticker"],
    copy: { en: { headlines: ["{AREA} LOCALS BUYING IPHONES", "WE BUY IPHONES", "CASH FOR YOUR IPHONE"], tags: ["FROM THE {CODE}", "{AREA} LOCAL"] },
      es: { headlines: ["COMPRAMOS IPHONES EN {AREA}"], tags: ["SOMOS DE AQUÍ"] } } },
  purple_gold: { label: "Purple and gold", palettes: ["purple_gold"], backgrounds: ["stripes", "rays", "halftone", "radial"],
    fonts: ["oswald", "big-shoulders", "sofia-xcond", "teko", "bungee"], fx: ["extrude", "hard_shadow", "shadow"], skew: [8, 12], decor: ["starburst"], decorMin: 0,
    numbers: ["pill", "box"],
    copy: { en: { headlines: ["WE BUY IPHONES", "CASH FOR IPHONES", "SELL YOUR IPHONE"], tags: ["{AREA} LOCAL"] }, es: { headlines: ["COMPRAMOS IPHONES"] } } },
  venice: { label: "Venice beach", palettes: ["venice_teal", "venice_sand", "la_sunset_teal"], backgrounds: ["beach"],
    fonts: ["knewave", "tilt-warp", "shrikhand", "sniglet", "luckiest"], fx: ["sticker", "extrude", "shadow"], numbers: ["sticker", "pill"],
    copy: { en: { headlines: ["SELL YOUR IPHONE", "CASH FOR YOUR OLD IPHONE", "{AREA} LOCALS BUYING IPHONES"], tags: ["WE'RE FROM HERE"] },
      es: { headlines: ["VENDE TU IPHONE", "COMPRAMOS IPHONES"] } } },
  street_spray: { label: "Spray paint wall", palettes: ["spray_concrete", "spray_night"], backgrounds: ["concrete", "brick_night"],
    fonts: ["sedgwick", "wet-paint", "marker", "knewave"], fx: ["flat", "glow"], decor: ["spray_halo"], decorMin: 1, numbers: ["plain", "sticker"],
    copy: { en: { headlines: ["WE BUY IPHONES", "CASH FOR IPHONES", "{CODE} WE BUY IPHONES"], tags: ["FROM THE {CODE}"] }, es: { headlines: ["COMPRAMOS IPHONES"] } } },
  marquee: { label: "Theatre marquee", palettes: ["marquee_red", "marquee_night"], backgrounds: ["velvet", "brick_night"],
    fonts: ["franklin", "oswald", "big-shoulders", "bungee", "clash"], boards: ["marquee"], boardChance: 1, decor: ["sparkle"], decorMin: 0, numbers: ["ticket", "box"],
    copy: { en: { headlines: ["NOW BUYING IPHONES", "NOW BUYING: IPHONES", "WE BUY IPHONES"], tags: ["{AREA}", "CALL OR TEXT"] },
      es: { headlines: ["COMPRAMOS IPHONES"] } } },
};

// The looks that are not LA signs (clean tech, luxury noir, campus, game day...),
// drawn and picked exactly like the LA vibes.
Object.assign(VIBES, MORE_VIBES);

// A sign board the headline sits on. ink/accent colour the words on the board;
// the number keeps the scene's palette because it is not on the board.
export const BOARDS = {
  freeway: { ink: "#ffffff", accent: "#ffd21f", fx: ["flat"], pad: .42, fonts: ["oswald", "barlow-cond", "saira-cond", "sofia-xcond", "khand", "teko"] },
  freeway_blue: { ink: "#ffffff", accent: "#ffd21f", fx: ["flat"], pad: .42, fonts: ["oswald", "barlow-cond", "saira-cond", "sofia-xcond", "khand", "teko"] },
  poster: { ink: "#111111", accent: "#e4002b", fx: ["flat", "hard_shadow"], pad: .36 },
  bandit_yellow: { ink: "#111111", accent: "#d90429", fx: ["flat"], pad: .32 },
  bandit_white: { ink: "#d90429", accent: "#111111", fx: ["flat"], pad: .32 },
  flyer: { ink: "#111111", accent: "#d90429", fx: ["flat"], pad: .36, tabs: 1.45 },
  neon_box: { ink: "#ffffff", fx: ["neon"], pad: .58 },
  marquee: { ink: "#1a1a1a", accent: "#c1121f", fx: ["flat"], pad: .64 },
  store_sign: { ink: "auto", accent: "#ffe066", fx: ["flat", "shadow"], pad: .36 },
};

export const TAGS = ["", "", "", "TEXT FOR A QUOTE", "CALL OR TEXT", "LOCAL CASH OFFERS", "FAST, FAIR, LOCAL",
  "FREE QUOTE", "QUICK QUOTES", "LOCAL BUYER", "IPHONE, IPAD, MACBOOK", "MEET LOCALLY", "ALL MODELS WANTED",
  "TEXT A PHOTO FOR A QUOTE"];
export const NUMBER_LABELS = ["", "", "CALL OR TEXT", "TEXT US", "GET A QUOTE", "TEXT FOR A QUOTE", "CALL NOW", "TEXT ME"];

export const OPTIONS = {
  // who the ad speaks to, and the voice it speaks in
  audience: ["none", ...AUDIENCE_KEYS],
  voice: ["on", "off"],
  voice_mood: Object.keys(MOODS),
  voice_cast: Object.keys(CASTS),
  vibe: ["none", ...Object.keys(VIBES)],
  board: ["none", ...Object.keys(BOARDS)],
  urgency: ["none", "pulse_cta", "caution_tape", "ticker", "stamp", "arrows", "flash_border", "beat_pump"],
  font: Object.keys(FONTS),
  number_font: ["same", ...Object.keys(FONTS)],
  case: ["upper", "title"],
  tracking: [-0.02, 0, 0.02, 0.05, 0.1],
  skew: [0, 0, 0, 8, 12, -8],
  text_fx: ["shadow", "hard_shadow", "outline", "sticker", "extrude", "box", "glow", "flat",
    "neon", "gradient", "chrome", "gold", "long_shadow", "highlighter", "double_outline", "rgb_split", "cutout",
    "block3d", "glass", "foil"],
  color_mode: ["mono", "accent_word", "split_lines", "accent_line"],
  text_in: ["slide", "skew_slide", "slide_letters", "wipe", "slam", "drop_letters",
    "typewriter", "word_pop", "blur_in", "rise_mask", "flip_in", "stomp", "scramble", "spin_letters",
    "mask_words", "zoom_blur", "elastic"],
  text_pos: ["top-left", "top-center", "middle-left", "bottom-left", "center", "top-right"],
  number_style: ["plain", "pill", "box", "outline", "underline", "sticker", "ticket", "tag", "neon", "split", "stacked", "chrome", "gold"],
  number_format: ["raw", "dashed", "dotted", "parens", "spaced"],
  number_pos: ["bottom-center", "bottom-left", "bottom-right", "under-headline"],
  number_in: ["pop", "slide_up", "type", "wipe", "flip", "roll", "slide_left", "drop", "slot", "glow_on"],
  // styled, tidy sets only (owner, 2026-10-02: "stylistic arrangements of phones ... not
  // messy views"); piles, spirals, rings, towers, collages and the like are gone
  arrangement: ["lineup", "showcase", "wings", "fan", "hand", "podium", "headliner", "burst", "tents",
    "gallery", "crown", "spotlight", "lean_in"],
  entry: ["fly_spin", "drop", "conveyor", "zoom", "orbit", "deal", "pop", "rain", "boomerang", "split", "spiral_in", "whip",
    "slide_up", "swing", "float_up", "zipper", "sweep", "pinwheel", "snap", "roll", "magnet", "shuffle", "flip_in"],
  end_face: ["back", "front", "mixed"],
  // the phone angle, one for every phone in the video so the set reads as one: flat, turned
  // in 3-D to show one edge, swaying on a turntable, or one wide spin once they land
  pose: ["flat", "edge_left", "edge_right", "turntable", "wide_spin"],
  front_glimpse: ["spin", "hold"],
  background: ["radial", "flat", "linear", "split", "rays", "dots", "stripes", "spotlight", "bigword", "grid",
    "mesh", "rings", "checker", "waves", "bokeh", "confetti", "duotone", "halftone", "beams", "frame", "sunburst", "noise",
    "sunset_sky", "sky_day", "stucco", "concrete", "brick_night", "candy_flake", "cork", "fluoro", "asphalt", "beach", "mural_wall", "velvet",
    "tonal", "aurora", "drift"],
  palette: [...Object.keys(PALETTES), "match", "match", "match"],
  camera: ["push_in", "push_out", "still", "drift", "punch", "tilt", "whip_in", "handheld"],
  shake: [0, 1, 2],
  // scored like a commercial: every kit plays chords in a key (audio.js); the grooves
  // after cinematic are patterns of their own on real instruments (music.js)
  sound_kit: ["uplift", "house", "hiphop", "lofi", "minimal", "cinematic",
    "reggaeton", "jersey_club", "drill", "phonk", "baile_funk", "amapiano", "cumbia", "disco", "uk_garage", "swing", "epic", "march", "bossa", "none"],
  hit: ["impact", "riser", "cymbal", "bass_drop", "gong", "timpani", "whip", "anvil", "crash", "swell", "orchestra"],
  number_sfx: ["pop", "chime", "register", "whoosh_ding", "ticks", "shave_haircut", "cash_counter", "text_ding", "phone_buzz",
    "bells", "triangle", "glock_run", "harp_gliss", "whistle"],
  // a famous public-domain tune over the groove (music.js), and what plays it
  melody: ["none", "mountain_king", "fur_elise", "beethoven5", "ode_to_joy", "saints", "ballgame", "cucaracha", "toccata",
    "turkish_march", "eine_kleine", "greensleeves", "morning_mood", "bumblebee", "carol_bells", "entertainer", "canon"],
  lead: ["piano", "epiano", "vibes", "marimba", "xylophone", "glock", "organ", "harpsichord", "sax", "harp", "kalimba", "synth"],
  // a sound over the opening hook (not the accents below, which are drawn on screen)
  accent: ["none", "air_horn", "siren", "whistle", "gong", "windchimes", "bell_tree", "vibraslap"],
  glare: [0.5, 1, 1, 1.5],
  hook: ["hook_line", "hook_line", "word_beat", "word_beat", "crash_zoom", "flash_cut", "punch_in", "cold_open"],
  overlay: ["none", "none", "confetti", "light_leak", "vignette_pulse", "lens_flare", "glitch", "grain_live", "sparkle_field",
    "bokeh_drift", "light_rays", "dust", "shimmer", "bloom"],
  // the whole frame's colour, as a last pass
  grade: ["none", "clean", "warm", "cool", "punchy", "matte", "film"],
  // what gives the phones weight on the ground
  depth: ["none", "soft_floor", "reflection", "dof"],
  // how the opening words hand over to the scene
  transition: ["fade", "flash", "zoom_through", "whip", "iris", "slice", "block"],
  // the last second
  outro: ["none", "settle", "end_card"],
  // accents (accents.js): how many, on what topic, drawn as what, and how they move
  accents: [0, 1, 2, 3],
  accent_set: ["cash", "money", "hype", "phones", "deal", "local", "trust", "sparkle", "checks",
    "party", "fast", "premium", "shop", "today", "love", "la_sun", "eco", "keys", "marks"],
  accent_kind: ["mix", "emoji", "asset", "symbol"],
  accent_in: ["fade", "pop", "slide", "fly", "drop", "flip3d", "wide_spin", "zoom", "swing", "orbit", "bounce_in", "unfold", "spiral", "rise", "stamp"],
  accent_idle: ["bob", "pulse", "wiggle", "turntable", "float", "still", "sway", "heartbeat", "breathe", "circle"],
  accent_out: ["fade", "pop_out", "fly_out", "spin_out", "drop_out", "none", "shrink", "rise_out", "flip_out", "blur_out"],
};

// Spin-offs of the best grounds (audit 2026-09-30), painted in decor.js
// candidateGround. tier 3: the best of the best, three spin-offs each; tier 2:
// the best, two each. None is drawn by a shuffle until the owner approves it:
// GROUND_REVIEW is the owner's decision, id by id. An approved spin-off of an LA
// vibe's ground joins that vibe; an approved studio one joins the studio grounds.
export const GROUND_CANDIDATES = {
  mural_waves:     { parent: "mural_wall",  tier: 3, label: "Mural: painted waves" },
  mural_rainbow:   { parent: "mural_wall",  tier: 3, label: "Mural: seventies rainbow" },
  mural_shapes:    { parent: "mural_wall",  tier: 3, label: "Mural: shapes and squiggles" },
  sunset_synth:    { parent: "sunset_sky",  tier: 3, label: "Sunset: retro grid" },
  sunset_ocean:    { parent: "sunset_sky",  tier: 3, label: "Sunset: over the ocean" },
  sunset_dusk:     { parent: "sunset_sky",  tier: 3, label: "Sunset: dusk and stars" },
  brick_neon_wash: { parent: "brick_night", tier: 3, label: "Brick: neon wash" },
  brick_wet:       { parent: "brick_night", tier: 3, label: "Brick: wet night" },
  brick_lamp:      { parent: "brick_night", tier: 3, label: "Brick: streetlamp" },
  halftone_duo:    { parent: "halftone",    tier: 3, label: "Halftone: two corners" },
  halftone_comic:  { parent: "halftone",    tier: 3, label: "Halftone: comic panel" },
  halftone_lines:  { parent: "halftone",    tier: 3, label: "Halftone: line screen" },
  rays_corner:     { parent: "rays",        tier: 2, label: "Rays: from the corner" },
  rays_bold:       { parent: "rays",        tier: 2, label: "Rays: bold sunburst" },
  beams_cross:     { parent: "beams",       tier: 2, label: "Beams: crossed searchlights" },
  beams_stage:     { parent: "beams",       tier: 2, label: "Beams: stage lights" },
  beach_sunset:    { parent: "beach",       tier: 2, label: "Beach: golden hour" },
  beach_top:       { parent: "beach",       tier: 2, label: "Beach: from above" },
  velvet_parted:   { parent: "velvet",      tier: 2, label: "Velvet: curtain parted" },
  velvet_bulbs:    { parent: "velvet",      tier: 2, label: "Velvet: marquee bulbs" },
  checker_floor:   { parent: "checker",     tier: 2, label: "Checker: floor" },
  checker_diamond: { parent: "checker",     tier: 2, label: "Checker: diamonds" },
  candy_flames:    { parent: "candy_flake", tier: 2, label: "Candy paint: flames" },
  candy_fade:      { parent: "candy_flake", tier: 2, label: "Candy paint: two-tone fade" },
};
// Owner, 2026-09-30: "keep the spin offs" (all 24, from the review page)
export const GROUND_REVIEW = { approved: Object.keys(GROUND_CANDIDATES), rejected: [] };
// The fresh grounds (motion/decor.js FRESH_GROUNDS, 2026-10-03): candidates until the
// owner approves them on the review page; only approved ones join the shuffle.
export const FRESH_REVIEW = { approved: [], rejected: [] };
for (const id of FRESH_REVIEW.approved) if (!OPTIONS.background.includes(id)) OPTIONS.background.push(id);
for (const id of GROUND_REVIEW.approved) {
  const c = GROUND_CANDIDATES[id]; if (!c) continue;
  // the audiences' own looks keep the grounds they were swept and pruned on
  const vibes = Object.values(VIBES).filter(v => v.la !== false && (v.backgrounds || []).includes(c.parent));
  if (vibes.length) vibes.forEach(v => v.backgrounds.push(id));
  if (OPTIONS.background.includes(c.parent)) OPTIONS.background.push(id);
}

// The fifty themes (themes.js): their palettes, signs and grounds are always known (so a
// look saved with one draws), but a theme joins the maker's vibes only once the owner
// approves it on the review page. THEME_REVIEW is that decision, id by id.
Object.assign(PALETTES, THEME_PALETTES);
Object.assign(BOARDS, THEME_BOARDS);
for (const g of THEME_GROUNDS) if (!OPTIONS.background.includes(g)) OPTIONS.background.push(g);
// Owner, 2026-10-02: "approve all" (all fifty, after the review page and the 3-D phone fix)
export const THEME_REVIEW = { approved: Object.keys(THEMES), rejected: [] };
for (const id of THEME_REVIEW.approved) if (THEMES[id]) { VIBES[id] = THEMES[id]; if (!OPTIONS.vibe.includes(id)) OPTIONS.vibe.push(id); }

// The BACK is what makes a model recognisable: every drawn cut ends on the backs,
// and most show the fronts only as they flash past. Type that ENTERS FROM THE
// LEFT is drawn three times as often as the rest.
export const WEIGHTS = {
  // an ad for everyone stays common; an audience that states a service (bulk, cracked) is only ever picked by hand
  audience: { none: 4, ...Object.fromEntries(AUDIENCE_KEYS.filter(k => AUDIENCES[k].byHand).map(k => [k, 0])) },
  voice: { on: 3, off: 1 },
  vibe: { none: 5 },
  board: { none: 10 },
  urgency: { none: 1 },
  number_format: { raw: 0, spaced: .6 },   // ten digits run together read as one long number; the raw format stays a pick by hand
  end_face: { back: 1, front: 0, mixed: 0 },
  arrangement: { lineup: 3, showcase: 3, wings: 2, fan: 2, hand: 2, podium: 2, headliner: 2, burst: 1, tents: 1, gallery: 2, crown: 2, spotlight: 2, lean_in: 2 },
  pose: { flat: 3, edge_left: 1, edge_right: 1, turntable: 2, wide_spin: 1 },   // turned, as often as a turntable, either edge
  accents: { 0: 6, 1: 3, 2: 2, 3: 1 },                   // DESIGN-LAW 88: some looks (about half), and few
  accent_kind: { mix: 3, emoji: 1, asset: 2, symbol: 2 },
  front_glimpse: { spin: 3, hold: 1 },
  text_in: { slide: 3, skew_slide: 3, slide_letters: 3, wipe: 3 },
  overlay: { none: 4 },
  grade: { none: 2, clean: 3 },
  depth: { none: 3, soft_floor: 3, reflection: 2 },
  transition: { fade: 2 },
  outro: { none: 3, settle: 2, end_card: 2 },
  sound_kit: { uplift: 3, house: 2, hiphop: 2, lofi: 1, minimal: 2, cinematic: 2, none: .5 },
  number_sfx: { pop: 2, chime: 2, register: 1, whoosh_ding: 1, ticks: 1 },
  melody: { none: 5 },
  accent: { none: 7 },
};

// The sound options added after the first looks were made. They are drawn from a
// stream of their own, so every earlier look keeps the design it always had.
export const LATE_OPTIONS = ["melody", "lead", "accent"];

// The tempo each newer groove is played at (the scored kits take any).
export const KIT_BPM = { reggaeton: [88, 100], jersey_club: [136, 144], drill: [138, 146], phonk: [124, 136], baile_funk: [126, 132],
  amapiano: [110, 115], cumbia: [90, 100], disco: [116, 124], uk_garage: [130, 134], swing: [140, 168], epic: [88, 108], march: [112, 126], bossa: [120, 136] };

// Sounds retired in the commercial pass (owner, 2026-09-30) play as the nearest one
// still offered, so a saved or locked look keeps working.
export const SOUND_ALIASES = {
  sound_kit: { trap: "hiphop", boombap: "hiphop", edm: "house", funk: "uplift", afrobeat: "house", drumline: "cinematic" },
  hit: { glitch: "impact", clap_stack: "impact" },
  number_sfx: { coin: "chime" },
};

// The panel's names for the sounds; any other shows as its own words ("reggaeton": Reggaeton).
export const SOUND_NAMES = {
  sound_kit: { uplift: "Uplifting pop", house: "Deep house", hiphop: "Hip-hop", lofi: "Lo-fi", minimal: "Minimal pulse", cinematic: "Cinematic",
    jersey_club: "Jersey club", baile_funk: "Baile funk", uk_garage: "UK garage", swing: "Swing jazz", epic: "Epic drums", march: "March / circus",
    bossa: "Bossa nova", none: "No music" },
  hit: { impact: "Low hit", riser: "Swell into a hit", cymbal: "Reverse cymbal", bass_drop: "Sub drop", swell: "Cymbal swell", orchestra: "Orchestra hit" },
  number_sfx: { pop: "Soft pop", chime: "Two bells", register: "Cash register", whoosh_ding: "Whoosh and bell", ticks: "Soft typing",
    shave_haircut: "Shave and a haircut", cash_counter: "Bill counter", text_ding: "Message ding", phone_buzz: "Phone buzz",
    bells: "Tubular bell", glock_run: "Glockenspiel run", harp_gliss: "Harp sweep", whistle: "Referee whistle" },
  melody: { none: "None", mountain_king: "In the Hall of the Mountain King (Grieg)", fur_elise: "Für Elise (Beethoven)", beethoven5: "Symphony No. 5 (Beethoven)",
    ode_to_joy: "Ode to Joy (Beethoven)", saints: "When the Saints Go Marching In", ballgame: "Take Me Out to the Ball Game (1908)",
    cucaracha: "La Cucaracha", toccata: "Toccata in D minor (Bach)", turkish_march: "Turkish March (Mozart)", eine_kleine: "Eine kleine Nachtmusik (Mozart)",
    greensleeves: "Greensleeves", morning_mood: "Morning Mood (Grieg)", bumblebee: "Flight of the Bumblebee (Rimsky-Korsakov)",
    carol_bells: "Carol of the Bells (Leontovych, 1916)", entertainer: "The Entertainer (Joplin)", canon: "Canon in D (Pachelbel)" },
  lead: { epiano: "Electric piano", vibes: "Vibraphone", glock: "Glockenspiel", sax: "Tenor sax", synth: "Synth lead" },
  accent: { none: "None", air_horn: "Air horn", whistle: "Referee whistle", windchimes: "Wind chimes", bell_tree: "Bell tree" },
};

export const FLAGS = { flash: 0.6, shine: 0.5, rgb_hit: 0.3, speed_lines: 0.35, sparkles: 0.35 };

export const DEFAULT_STYLE = {
  phones: [], headline: "WE BUY PHONES", tag: "", number: "", number_label: "",
  seed: 1, aspect: "1:1", duration: 6, fps: 30,
  font: "franklin", number_font: "same", case: "upper", tracking: 0, skew: 0,
  text_fx: "shadow", color_mode: "mono", accent_word: -1, text_in: "slide", text_pos: "top-left",
  text_scale: 1, number_style: "plain", number_format: "dashed", number_pos: "bottom-center", number_in: "pop",
  number_scale: 1, arrangement: "lineup", entry: "fly_spin", end_face: "back", front_glimpse: "spin", pose: "flat",
  phone_scale: 1, background: "radial", palette: "sand", scrim: -1, camera: "push_in", shake: 1,
  flash: true, shine: true, rgb_hit: false, speed_lines: false, sparkles: false, grain: true,
  sound_kit: "uplift", bpm: 112, hit: "impact", number_sfx: "pop", music_volume: 0.5, glare: 1,
  melody: "none", lead: "piano", accent: "none",
  overlay: "none", bigword: "CASH", hook: "hook_line", hook_text: "",
  vibe: "none", board: "none", decor: [], urgency: "none", cta: "", lang_mode: "mix", lang: "en", area: "",
  grade: "none", depth: "none", transition: "fade", outro: "none",
  audience: "none", voice: "on", voice_mood: "confident", voice_cast: "host_m", vo_clip: "", vo_text: "", vo_lang: "en",
};

// The first ad's look, as a starting point.
export const CLASSIC = {
  font: "franklin", text_fx: "shadow", text_in: "slide", text_pos: "top-left", number_style: "plain",
  number_pos: "bottom-center", number_in: "pop", arrangement: "lineup", pose: "flat", accents: 0, accent_set: "cash", accent_kind: "mix", accent_in: "pop", accent_idle: "bob", accent_out: "fade", entry: "fly_spin", end_face: "back",
  front_glimpse: "hold", background: "radial", palette: "sand", color_mode: "mono", camera: "push_in",
  sound_kit: "house", overlay: "none", hook: "cold_open",
};

// Human labels for the panel.
export const LABELS = {
  font: "Typeface", number_font: "Number typeface", case: "Case", tracking: "Letter spacing", skew: "Slant",
  text_fx: "Type treatment", color_mode: "Colour use", text_in: "Headline entrance", text_pos: "Headline position",
  number_style: "Number style", number_format: "Number format", number_pos: "Number position",
  number_in: "Number entrance", arrangement: "Phone layout", pose: "Phone angle",
  accents: "Accents", accent_set: "Accent topic", accent_kind: "Accents drawn as", accent_in: "Accents enter by", accent_idle: "Accents move", accent_out: "Accents leave by", entry: "Phones enter by", end_face: "Phones end on",
  front_glimpse: "Screens shown", background: "Background", palette: "Palette", camera: "Camera", shake: "Impact shake",
  sound_kit: "Music", melody: "Famous tune (public domain)", lead: "Tune played on", accent: "Opening sound", hit: "Headline hit sound", number_sfx: "Number sound", glare: "Screen glare", overlay: "Overlay effect", hook: "Opening hook (first second)",
  vibe: "Vibe", board: "Sign board", urgency: "Urgency",
  audience: "Made for", voice: "Voiceover", voice_mood: "Voice mood", voice_cast: "Voice",
  grade: "Colour grade", depth: "Phone depth", transition: "Hook transition", outro: "Ending",
};

export const GROUPS = [
  ["Audience and voice", ["audience", "voice", "voice_mood", "voice_cast"]],
  ["Vibe and urgency", ["vibe", "board", "urgency"]],
  ["Type", ["font", "number_font", "case", "tracking", "skew", "text_fx", "color_mode"]],
  ["Opening", ["hook", "transition", "text_in", "text_pos"]],
  ["Number", ["number_style", "number_format", "number_pos", "number_in"]],
  ["Phones", ["arrangement", "pose", "entry", "end_face", "front_glimpse", "glare", "depth"]],
  ["Accents", ["accents", "accent_set", "accent_kind", "accent_in", "accent_idle", "accent_out"]],
  ["Scene", ["background", "palette", "camera", "shake", "overlay", "grade", "outro"]],
  ["Sound", ["sound_kit", "melody", "lead", "accent", "hit", "number_sfx"]],
];

export function countLooks() {
  let n = 1;
  for (const k of Object.keys(OPTIONS)) n *= new Set(OPTIONS[k]).size;
  return n;
}
