/* The symbols a logo may carry (DESIGN-LAW 170). The first twenty are the house set, assets/icon-set.svg
   (spec/icons.json): one 100-unit box, a 12-unit margin, one stroke weight, round caps and joins, generic by
   silhouette and never a brand's mark. The last five are drawn here in the same grammar for the lines the set
   had nothing for (consoles, computers, headphones, watches, cameras). scripts/logo_check.mjs holds the first
   twenty to spec/icons.json. Each: [path, name]. */
export const LOGO_ICONS = {
  cardStar: ["M38 10 H62 A12 12 0 0 1 74 22 V78 A12 12 0 0 1 62 90 H38 A12 12 0 0 1 26 78 V22 A12 12 0 0 1 38 10 Z M50 34 L54.2 45.6 L66.5 46.1 L56.9 53.7 L60.2 65.5 L50 58.4 L39.8 65.5 L43.1 53.7 L33.5 46.1 L45.8 45.6 Z", "Card"],
  slab: ["M34 10 H66 A14 14 0 0 1 80 24 V76 A14 14 0 0 1 66 90 H34 A14 14 0 0 1 20 76 V24 A14 14 0 0 1 34 10 Z M32 32 H68 M32 46 H68", "Graded card"],
  boosterPk: ["M28 78 V32 L34 22 L40 32 L46 22 L52 32 L58 22 L64 32 L70 22 L76 32 V78 A10 10 0 0 1 66 88 H38 A10 10 0 0 1 28 78 Z M36 52 H68", "Pack"],
  sparkle: ["M50 12 C53 35 65 47 88 50 C65 53 53 65 50 88 C47 65 35 53 12 50 C35 47 47 35 50 12 Z", "Sparkle"],
  baseball: ["M50 14 A36 36 0 1 0 50 86 A36 36 0 1 0 50 14 Z M29 23 Q41 50 29 77 M71 23 Q59 50 71 77", "Ball"],
  trophy: ["M34 14 H66 V38 A16 16 0 0 1 34 38 Z M34 20 H24 A10 10 0 0 0 34 32 M66 20 H76 A10 10 0 0 1 66 32 M50 54 V66 M36 78 H64 A4 4 0 0 1 68 82 V86 H32 V82 A4 4 0 0 1 36 78 Z", "Trophy"],
  barStack: ["M40 26 H60 A4 4 0 0 1 63.6 28.2 L69 40 A4 4 0 0 1 65.4 46 H34.6 A4 4 0 0 1 31 40 L36.4 28.2 A4 4 0 0 1 40 26 Z M20 58 H40 A4 4 0 0 1 43.6 60.2 L49 72 A4 4 0 0 1 45.4 78 H14.6 A4 4 0 0 1 11 72 L16.4 60.2 A4 4 0 0 1 20 58 Z M60 58 H80 A4 4 0 0 1 83.6 60.2 L89 72 A4 4 0 0 1 85.4 78 H54.6 A4 4 0 0 1 51 72 L56.4 60.2 A4 4 0 0 1 60 58 Z", "Bars"],
  ring: ["M50 18 A32 32 0 1 0 50 82 A32 32 0 1 0 50 18 Z M50 38 A12 12 0 1 0 50 62 A12 12 0 1 0 50 38 Z", "Ring"],
  karatSeal: ["M50 12 A38 38 0 1 0 50 88 A38 38 0 1 0 50 12 Z M50 26 A24 24 0 1 0 50 74 A24 24 0 1 0 50 26 Z M42 50 L48 57 L59 44", "Seal"],
  coinStack: ["M50 20 C67 20 80 25 80 31 C80 37 67 42 50 42 C33 42 20 37 20 31 C20 25 33 20 50 20 Z M20 31 V47 C20 53 33 58 50 58 C67 58 80 53 80 47 V31 M20 47 V63 C20 69 33 74 50 74 C67 74 80 69 80 63 V47", "Coins"],
  loupe: ["M44 14 A28 28 0 1 0 44 70 A28 28 0 1 0 44 14 Z M64 64 L86 86", "Loupe"],
  carSide: ["M12 62 V50 A8 8 0 0 1 18 42 L36 38 L47 25 A10 10 0 0 1 55 21 H68 A10 10 0 0 1 76 25 L85 40 A8 8 0 0 1 88 48 V62 Z M28 62 A11 11 0 1 0 50 62 A11 11 0 1 0 28 62 Z M60 62 A11 11 0 1 0 82 62 A11 11 0 1 0 60 62 Z", "Car"],
  keyFob: ["M38 12 H62 A12 12 0 0 1 74 24 V58 A12 12 0 0 1 62 70 H38 A12 12 0 0 1 26 58 V24 A12 12 0 0 1 38 12 Z M50 30 A6 6 0 1 0 50 42 A6 6 0 1 0 50 30 Z M50 70 V88", "Key"],
  phone: ["M34 8 H66 A12 12 0 0 1 78 20 V80 A12 12 0 0 1 66 92 H34 A12 12 0 0 1 22 80 V20 A12 12 0 0 1 34 8 Z M43 20 H57 M40 80 H60", "Phone"],
  lock: ["M32 46 V33 A18 18 0 0 1 68 33 V46 M28 46 H72 A10 10 0 0 1 82 56 V80 A10 10 0 0 1 72 90 H28 A10 10 0 0 1 18 80 V56 A10 10 0 0 1 28 46 Z M50 62 V74", "Lock"],
  testStrip: ["M38 12 H62 A8 8 0 0 1 70 20 V80 A8 8 0 0 1 62 88 H38 A8 8 0 0 1 30 80 V20 A8 8 0 0 1 38 12 Z M41 26 H59 A3 3 0 0 1 62 29 V38 A3 3 0 0 1 59 41 H41 A3 3 0 0 1 38 38 V29 A3 3 0 0 1 41 26 Z M42 66 V80 M50 66 V80 M58 66 V80", "Strip"],
  sealedBox: ["M50 12 L84 30 V70 L50 88 L16 70 V30 Z M16 30 L50 48 L84 30 M50 48 V88", "Box"],
  shieldTick: ["M50 10 L82 22 V48 Q82 74 50 90 Q18 74 18 48 V22 Z M38 50 L47 59 L64 40", "Shield"],
  cashTag: ["M54 12 H80 A8 8 0 0 1 88 20 V46 A8 8 0 0 1 85.6 51.7 L48 89 A8 8 0 0 1 36.7 89 L11 63.3 A8 8 0 0 1 11 52 L48.4 14.4 A8 8 0 0 1 54 12 Z M70 30 A5 5 0 1 0 70 30.1 Z", "Tag"],
  boltFast: ["M56 10 L26 54 A3 3 0 0 0 28.5 59 H45 L42 90 L74 44 A3 3 0 0 0 71.5 39 H55 Z", "Bolt"],
  // drawn here, in the set's grammar
  controller: ["M31 34 H69 A18 18 0 0 1 86 50 L90 66 A9 9 0 0 1 74 73 L65 62 H35 L26 73 A9 9 0 0 1 10 66 L14 50 A18 18 0 0 1 31 34 Z M30 43 V57 M23 50 H37 M66 46 V46.5 M74 53 V53.5", "Controller"],
  laptop: ["M27 24 H73 A6 6 0 0 1 79 30 V64 H21 V30 A6 6 0 0 1 27 24 Z M11 74 H89 L84 80 H16 Z", "Laptop"],
  headphones: ["M19 62 V52 A31 31 0 0 1 81 52 V62 M19 60 H27 A5 5 0 0 1 32 65 V79 A5 5 0 0 1 27 84 H24 A5 5 0 0 1 19 79 Z M81 60 H73 A5 5 0 0 0 68 65 V79 A5 5 0 0 0 73 84 H76 A5 5 0 0 0 81 79 Z", "Headphones"],
  watch: ["M37 29 H63 A9 9 0 0 1 72 38 V62 A9 9 0 0 1 63 71 H37 A9 9 0 0 1 28 62 V38 A9 9 0 0 1 37 29 Z M39 29 L42 13 H58 L61 29 M39 71 L42 87 H58 L61 71 M50 40 V50 L57 55", "Watch"],
  camera: ["M19 35 H34 L40 25 H60 L66 35 H81 A7 7 0 0 1 88 42 V73 A7 7 0 0 1 81 80 H19 A7 7 0 0 1 12 73 V42 A7 7 0 0 1 19 35 Z M50 43 A14 14 0 1 0 50 71 A14 14 0 1 0 50 43 Z", "Camera"],
};
/** the symbols that suit each line Easy Mode lists (app.js CATS), the best first */
export const ICONS_FOR = {
  phones: ["phone","boltFast","shieldTick","cashTag"],
  gaming: ["controller","trophy","boltFast","cashTag"],
  gold: ["barStack","karatSeal","ring","coinStack"],
  coins: ["coinStack","karatSeal","loupe","sparkle"],
  pokemon: ["cardStar","boosterPk","slab","sparkle"],
  silver: ["barStack","coinStack","ring","karatSeal"],
  cars: ["carSide","keyFob","cashTag","shieldTick"],
  sports: ["baseball","trophy","slab","cardStar"],
  computers: ["laptop","boltFast","shieldTick","cashTag"],
  audio: ["headphones","boltFast","cashTag","sparkle"],
  wearables: ["watch","ring","sparkle","cashTag"],
  cameras: ["camera","loupe","sparkle","cashTag"],
  strips: ["testStrip","sealedBox","shieldTick","cashTag"],
};
