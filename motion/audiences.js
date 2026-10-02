// WHO THE AD SPEAKS TO.
//
// The owner, 2026-09-30: "make sure we have more variety styles and a wider pool
// or base of ideas / knowledge to produce our video ads to appeal to any
// demographic or type of person", and of the voiceovers: "make the voices clean
// and vary by theme mood attitude etc."
//
// An audience is a person the ad is for, written down as what a good copywriter
// would know before writing a word: who they are, what moves them, what turns
// them off. From that it draws everything else: the words on screen (its own
// hooks, headlines, small lines and calls to action, in English and Spanish),
// the look (the vibes, palettes, faces and treatments that suit it), the music,
// and the voice (a cast and a mood, voices.js) with its own voiceover scripts.
//
// The copy follows the house rules (DESIGN-LAW 80; scripts/refresh_copy.mjs):
// a plain fact about the offer or an invitation, never a price, a deadline, a
// rank ("best", "#1", "highest"), a clock ("in minutes", "instant") or a promise
// about who answers. scripts/audience_check.mjs holds every line to them.
//
// The voiceovers never say the number (it is different on every ad): they point
// at it ("the number on your screen"), so one bank of clips serves every user.
// A script is sized for the ad it can fit: the maker's lengths are 5, 6 and 8
// seconds, and speech starts after the first hit and ends before the fade, so a
// script has about 4, 5 or 7 seconds (10, 13 or 18 words at an ad's pace).

export const MOODS = {
  hype:      { label: "Hype", note: "fast, bright, a smile in the voice" },
  playful:   { label: "Playful", note: "light, teasing, a wink" },
  warm:      { label: "Warm", note: "friendly, neighbourly, unhurried" },
  calm:      { label: "Calm", note: "slow, clear, reassuring" },
  confident: { label: "Confident", note: "direct, sure, no fuss" },
  luxe:      { label: "Luxe", note: "low, smooth, unhurried" },
  street:    { label: "Street", note: "casual, local, straight talk" },
  sincere:   { label: "Sincere", note: "honest, soft, plain" },
  newsy:     { label: "Newsy", note: "announcer, crisp, headline pace" },
  festive:   { label: "Festive", note: "cheerful, bright, celebratory" },
  reassuring:{ label: "Reassuring", note: "kind, patient, no judgement" },
};

// Looks that are not LA street signs (the LA vibes stay in catalog.js). Every
// palette, ground, face and treatment here already exists in the catalog;
// scripts/audience_check.mjs checks that. la: false keeps {AREA} from
// defaulting to LA on them. hooks: the openings that suit the look, measured
// (audit-sweep, 30 looks each, 2026-09-30): a dark look opens on its words or
// a punch-in, never on black glass over a black ground, and a flat one does
// not open on a crash zoom, whose first frame is nearly empty ground.
export const MORE_VIBES = {
  clean_tech: { label: "Clean tech", la: false,
    palettes: ["arctic", "titanium", "ink_blue", "platinum", "slate", "paper", "ice"],
    backgrounds: ["radial", "flat", "spotlight", "tonal", "mesh", "aurora", "linear"],
    fonts: ["satoshi", "sora", "instrument-sans", "manrope", "clash", "schibsted", "unbounded"],
    fx: ["flat", "shadow", "glass", "gradient"], numbers: ["plain", "pill", "outline"],
    text_in: ["blur_in", "rise_mask", "mask_words", "wipe"] },
  luxury_noir: { label: "Luxury noir", la: false,
    palettes: ["onyx_gold", "noir", "carbon", "rose_gold", "platinum", "cream_black", "oxblood"],
    backgrounds: ["spotlight", "tonal", "radial", "bokeh"],
    fonts: ["cormorant", "gloock", "zodiak", "young-serif", "clash"],
    fx: ["gold", "foil", "flat", "shadow"], numbers: ["gold", "outline", "plain"],
    text_in: ["blur_in", "rise_mask", "wipe"], hooks: ["hook_line", "word_beat", "punch_in"] },
  family_warm: { label: "Family warm", la: false,
    palettes: ["peach", "butter", "powder", "apricot", "rose_quartz", "mint", "lemonade"],
    backgrounds: ["radial", "waves", "sunburst", "bokeh", "tonal"],
    fonts: ["nunito", "sniglet", "bricolage", "young-serif", "satoshi", "kalam"],
    fx: ["sticker", "shadow", "flat"], numbers: ["pill", "sticker", "box"],
    text_in: ["word_pop", "slide", "elastic", "rise_mask"] },
  campus: { label: "Campus", la: false,
    palettes: ["cobalt", "royal", "bubblegum", "electric", "mango", "lemonade"],
    backgrounds: ["halftone", "dots", "stripes", "checker", "confetti", "rays"],
    fonts: ["bricolage", "bungee", "luckiest", "tilt-warp", "unbounded", "knewave"],
    fx: ["sticker", "hard_shadow", "double_outline", "highlighter", "extrude"], numbers: ["sticker", "tag", "pill"],
    text_in: ["word_pop", "stomp", "slam", "elastic"], hooks: ["hook_line", "word_beat", "punch_in", "flash_cut"] },
  gamer_rgb: { label: "Gamer RGB", la: false,
    palettes: ["cyberpunk", "ultraviolet", "neon-lime", "magenta", "midnight_teal"],
    backgrounds: ["grid", "beams", "aurora", "noise"],
    fonts: ["audiowide", "russo", "press-start", "squada", "wallpoet", "unbounded"],
    fx: ["neon", "glow", "rgb_split"], numbers: ["neon", "box", "split"],
    text_in: ["scramble", "zoom_blur", "slam", "typewriter"], hooks: ["hook_line", "word_beat", "punch_in"] },
  eco_green: { label: "Eco green", la: false,
    palettes: ["forest", "pine", "pistachio", "seafoam", "olive"],
    backgrounds: ["tonal", "waves", "radial", "mesh", "bokeh"],
    fonts: ["young-serif", "bricolage", "nunito", "manrope", "satoshi", "zilla-slab"],
    fx: ["flat", "shadow"], numbers: ["pill", "plain", "underline"],
    text_in: ["rise_mask", "blur_in", "wipe", "slide"] },
  breaking_news: { label: "Breaking news", la: false,
    palettes: ["signal_red", "klein", "navy-gold", "cream_black", "ink_blue", "storm"],
    backgrounds: ["stripes", "beams", "split", "grid", "linear"],
    fonts: ["franklin", "oswald", "roboto-slab", "big-shoulders", "barlow-cond", "schibsted"],
    fx: ["box", "flat", "hard_shadow"], numbers: ["box", "ticket", "stacked"],
    text_in: ["wipe", "typewriter", "slide", "mask_words"], hooks: ["hook_line", "word_beat", "punch_in", "flash_cut"] },
  pro_office: { label: "Pro office", la: false,
    palettes: ["slate", "navy-gold", "graphite", "steel", "ink_blue", "titanium"],
    backgrounds: ["linear", "flat", "grid", "tonal", "spotlight"],
    fonts: ["instrument-sans", "manrope", "schibsted", "chivo", "franklin", "sora"],
    fx: ["flat", "shadow"], numbers: ["box", "plain", "outline"],
    text_in: ["wipe", "rise_mask", "slide", "mask_words"], hooks: ["hook_line", "word_beat", "punch_in"] },
  senior_clear: { label: "Clear and simple", la: false,
    palettes: ["paper", "cream_black", "pearl", "ice", "butter", "navy-gold", "ink_blue"],
    backgrounds: ["flat", "radial", "tonal", "linear"],
    fonts: ["franklin", "roboto-slab", "nunito", "manrope", "zilla-slab", "young-serif"],
    fx: ["flat", "shadow", "box"], numbers: ["box", "plain", "pill"],
    text_in: ["slide", "wipe", "rise_mask"], skew: [0], hooks: ["hook_line", "cold_open", "punch_in"] },
  holiday_gift: { label: "Holiday", la: false,
    palettes: ["cherry", "forest", "gold", "pine", "ruby", "emerald"],
    backgrounds: ["bokeh", "confetti", "sunburst", "rays", "radial"],
    fonts: ["young-serif", "shrikhand", "kaushan", "gloock", "zodiak", "bricolage"],
    fx: ["gold", "foil", "sticker", "glow"], numbers: ["gold", "pill", "ticket"],
    text_in: ["drop_letters", "word_pop", "elastic", "blur_in"], hooks: ["hook_line", "word_beat", "punch_in", "flash_cut"] },
  repair_shop: { label: "Repair bench", la: false,
    palettes: ["steel", "carbon", "signal_red", "graphite", "storm", "concrete"],
    backgrounds: ["noise", "grid", "halftone", "linear", "spotlight"],
    fonts: ["stencil", "big-shoulders", "oswald", "jetbrains", "special-elite", "russo"],
    fx: ["hard_shadow", "box", "flat", "extrude"], numbers: ["box", "tag", "stacked"],
    text_in: ["slam", "stomp", "typewriter", "wipe"], hooks: ["hook_line", "word_beat", "punch_in"] },
  y2k_pop: { label: "Y2K pop", la: false,
    palettes: ["bubblegum", "lilac", "powder", "magenta", "aqua"],
    backgrounds: ["mesh", "aurora", "checker", "dots", "halftone"],
    fonts: ["unbounded", "tilt-warp", "clash", "bungee", "sniglet"],
    fx: ["chrome", "glass", "sticker", "gradient", "double_outline"], numbers: ["chrome", "sticker", "pill"],
    text_in: ["elastic", "word_pop", "spin_letters", "zoom_blur"] },
  mercado: { label: "Mercado bright", la: false,
    palettes: ["mango", "swap_orange", "tropical", "terracotta", "mural_marigold", "teal"],
    backgrounds: ["sunburst", "confetti", "rays", "halftone"],
    fonts: ["shrikhand", "luckiest", "knewave", "bricolage", "kaushan"],
    fx: ["sticker", "extrude", "hard_shadow"], numbers: ["sticker", "tag", "pill"],
    text_in: ["word_pop", "stomp", "slide_letters"] },
  sports_broadcast: { label: "Game day", la: false,
    palettes: ["royal", "signal_red", "navy-gold", "klein", "purple_gold"],
    backgrounds: ["beams", "stripes", "spotlight", "rays"],
    fonts: ["big-shoulders", "teko", "oswald", "khand", "saira-cond", "sofia-xcond"],
    fx: ["extrude", "block3d", "hard_shadow", "foil"], numbers: ["box", "ticket", "stacked", "split"],
    text_in: ["slam", "skew_slide", "zoom_blur", "stomp"], skew: [0, 8, 12], hooks: ["hook_line", "word_beat", "punch_in"] },
};

// The people. Each: who, the insight the words are built on, what to avoid;
// its moods and voice casts (voices.js); the looks and music that suit it; its
// words on screen; its voiceover scripts. byHand: an audience whose words state
// a service not every buyer offers (bulk lots, cracked phones) is never drawn
// by a shuffle; the maker's user picks it, and so says it.
export const AUDIENCES = {
  upgraders: {
    label: "Upgraders", who: "Just bought (or about to buy) the new iPhone; the old one is in a drawer or a box.",
    insight: "The old phone is money they forgot they have, and it loses value the longer it sits.",
    avoid: "Tech jargon, pressure, anything that makes the new phone feel like a mistake.",
    moods: ["confident", "hype"], casts: ["crisp_f", "crisp_m", "host_m", "host_f"],
    looks: { vibes: ["clean_tech", "y2k_pop", "none"], sound_kit: ["house", "minimal"], bpm: [112, 126], grade: ["clean", "cool", "none"] },
    copy: {
      en: { hooks: ["GOT THE NEW IPHONE?", "UPGRADED THIS YEAR?", "NEW PHONE. OLD ONE?", "WHERE'S YOUR OLD IPHONE?"],
        headlines: ["SELL THE ONE YOU REPLACED", "YOUR OLD IPHONE IS WORTH CASH", "UPGRADED? SELL THE OLD ONE", "NEW PHONE? CASH FOR THE OLD ONE"],
        tags: ["TEXT A PIC, GET A PRICE", "ALL MODELS WANTED", "FREE QUOTE"], cta: ["TEXT US", "GET YOUR QUOTE"] },
      es: { hooks: ["¿YA TIENES EL NUEVO IPHONE?", "¿CAMBIASTE DE IPHONE?"],
        headlines: ["VENDE EL IPHONE QUE YA NO USAS", "TU IPHONE VIEJO VALE DINERO"],
        tags: ["MÁNDANOS UNA FOTO", "COTIZACIÓN GRATIS"], cta: ["¡MÁNDANOS TEXTO!"] },
    },
    vo: {
      en: ["Got the new iPhone? Your old one is worth cash.",
        "New phone in your hand? Turn the old one into cash. Text the number on your screen.",
        "You upgraded. Now let the old iPhone pay you back. Text us a picture for a quote.",
        "Old iPhone sitting in a drawer? Text us a photo for a free quote."],
      es: ["¿Ya tienes el iPhone nuevo? Tu iPhone viejo vale dinero.",
        "¿Cambiaste de iPhone? Mándanos una foto del viejo y te damos una cotización."],
    },
  },
  students: {
    label: "Students", who: "College and high-school age; money is tight, phones get replaced and passed down.",
    insight: "Cash for textbooks, rent or a night out from a phone they already stopped using.",
    avoid: "Talking down, parent voice, long sentences.",
    moods: ["playful", "hype"], casts: ["host_f", "host_m", "gamer_m"],
    looks: { vibes: ["campus", "y2k_pop", "gamer_rgb"], sound_kit: ["hiphop", "house", "lofi"], bpm: [118, 134], grade: ["punchy", "none"] },
    copy: {
      en: { hooks: ["BROKE? CHECK YOUR DRAWER", "TEXTBOOK MONEY?", "OLD PHONE = RENT MONEY?", "STUDENTS, LOOK"],
        headlines: ["TURN YOUR OLD IPHONE INTO CASH", "YOUR OLD PHONE IS MONEY", "CASH FOR YOUR OLD IPHONE"],
        tags: ["TEXT A PIC", "FREE QUOTE", "ALL MODELS"], cta: ["TEXT US", "TEXT NOW"] },
      es: { hooks: ["¿TE FALTA DINERO?", "¿TIENES UN IPHONE VIEJO?"],
        headlines: ["TU IPHONE VIEJO VALE DINERO", "CAMBIA TU IPHONE POR EFECTIVO"],
        tags: ["MÁNDANOS UNA FOTO"], cta: ["¡MÁNDANOS TEXTO!"] },
    },
    vo: {
      en: ["Textbook money is hiding in your drawer.",
        "That old iPhone? It's cash. Text us a pic for a quote.",
        "Broke till Friday? Your old iPhone isn't. Text the number on your screen for a free quote.",
        "Old phone, new cash. Snap a pic and text us."],
      es: ["¿Te falta dinero? Tu iPhone viejo vale efectivo.",
        "Mándanos una foto de tu iPhone viejo y te damos precio."],
    },
  },
  parents: {
    label: "Parents and families", who: "A household with a few old phones: the kids' last ones, a partner's, a spare.",
    insight: "Clearing clutter and getting a little back for the family, simply and safely.",
    avoid: "Hype, slang, anything that sounds risky.",
    moods: ["warm", "reassuring"], casts: ["warm_f", "warm_m"],
    looks: { vibes: ["family_warm", "eco_green", "none"], sound_kit: ["lofi", "uplift", "minimal"], bpm: [96, 112], grade: ["warm", "clean"], urgency: ["none", "pulse_cta", "arrows"] },
    copy: {
      en: { hooks: ["A DRAWER FULL OF OLD PHONES?", "THE KIDS UPGRADED?", "SPRING CLEANING?"],
        headlines: ["WE BUY THE FAMILY'S OLD IPHONES", "CLEAR THE DRAWER, GET CASH", "OLD IPHONES INTO CASH"],
        tags: ["FREE QUOTE", "MEET UP LOCAL", "ALL MODELS WANTED"], cta: ["TEXT US", "CALL OR TEXT"] },
      es: { hooks: ["¿UN CAJÓN LLENO DE CELULARES?", "¿LOS NIÑOS CAMBIARON DE IPHONE?"],
        headlines: ["COMPRAMOS LOS IPHONES DE TU FAMILIA", "VACÍA EL CAJÓN Y GANA EFECTIVO"],
        tags: ["COTIZACIÓN GRATIS", "SOMOS DE AQUÍ"], cta: ["¡LLÁMANOS!"] },
    },
    vo: {
      en: ["A drawer full of old phones? We buy them.",
        "The kids upgraded again? We'll buy the old iPhones. Just text us a picture.",
        "Clear out the drawer of old iPhones. Call or text the number on your screen.",
        "Old family phones are worth something. Text us for a free quote."],
      es: ["¿Un cajón lleno de celulares viejos? Nosotros los compramos.",
        "Vacía el cajón y gana efectivo. Llama o manda texto al número en tu pantalla."],
    },
  },
  seniors: {
    label: "Seniors", who: "Sixty and up; a phone from a grandchild, an old one replaced by a carrier.",
    insight: "Simple, respectful, no pressure: someone local who explains it plainly.",
    avoid: "Speed, slang, small print, anything that feels like a sales trick.",
    moods: ["calm", "reassuring"], casts: ["elder_m", "calm_f"],
    looks: { vibes: ["senior_clear", "family_warm"], sound_kit: ["minimal", "lofi"], bpm: [90, 104], grade: ["clean", "warm"], hook: ["cold_open", "hook_line"], urgency: ["none"] },
    copy: {
      en: { hooks: ["HAVE AN OLD IPHONE?", "A PHONE YOU NO LONGER USE?"],
        headlines: ["WE BUY OLD IPHONES", "SELL YOUR OLD IPHONE, SIMPLY", "CASH FOR YOUR OLD IPHONE"],
        tags: ["CALL OR TEXT", "FREE QUOTE", "MEET UP LOCAL"], cta: ["CALL US", "CALL OR TEXT"] },
      es: { hooks: ["¿TIENE UN IPHONE QUE YA NO USA?"],
        headlines: ["COMPRAMOS IPHONES USADOS", "VENDA SU IPHONE VIEJO"],
        tags: ["LLAME O MANDE TEXTO", "COTIZACIÓN GRATIS"], cta: ["¡LLÁMENOS!"] },
    },
    vo: {
      en: ["Have an old iPhone you no longer use? We buy them.",
        "We buy old iPhones. Just call the number on your screen.",
        "If you have an iPhone you no longer use, we'd be glad to buy it. Just call us.",
        "We buy old iPhones. Just give us a call."],
      es: ["¿Tiene un iPhone que ya no usa? Nosotros lo compramos.",
        "Llame al número en su pantalla. Con gusto le damos una cotización."],
    },
  },
  professionals: {
    label: "Busy professionals", who: "Short on time; a work phone and a personal one, both replaced.",
    insight: "Quick and hassle-free matters more than squeezing out the last dollar.",
    avoid: "Cute, loud, long explanations.",
    moods: ["confident", "calm"], casts: ["crisp_m", "crisp_f"],
    looks: { vibes: ["pro_office", "clean_tech"], sound_kit: ["minimal", "house"], bpm: [108, 120], grade: ["clean", "cool"], urgency: ["none", "pulse_cta"] },
    copy: {
      en: { hooks: ["NO TIME TO SELL YOUR OLD IPHONE?", "OLD PHONE, NO HASSLE"],
        headlines: ["SELL YOUR OLD IPHONE WITHOUT THE HASSLE", "ONE TEXT. ONE QUOTE.", "WE BUY IPHONES"],
        tags: ["TEXT A PIC, GET A PRICE", "MEET UP LOCAL"], cta: ["TEXT US", "GET YOUR QUOTE"] },
      es: { hooks: ["¿SIN TIEMPO PARA VENDER TU IPHONE?"],
        headlines: ["VENDE TU IPHONE SIN COMPLICACIONES"], tags: ["MÁNDANOS UNA FOTO"], cta: ["¡COTIZA AHORA!"] },
    },
    vo: {
      en: ["Sell your old iPhone without the hassle.",
        "One photo, one text, one quote. That's it.",
        "No listings, no strangers, no back and forth. Just text a photo of your old iPhone."],
      es: ["Vende tu iPhone viejo sin complicaciones.",
        "Una foto, un texto y te damos precio."],
    },
  },
  deal_seekers: {
    label: "Deal seekers", who: "Likes a good deal and knows what their phone is worth; compares offers.",
    insight: "A straight, fair offer from a local buyer beats the hassle of listing it.",
    avoid: "Promises of the most money, anything that sounds too good.",
    moods: ["hype", "street"], casts: ["host_m", "street_m", "host_f"],
    looks: { vibes: ["swap_meet", "bandit_sign", "breaking_news", "corner_store", "sports_broadcast"], sound_kit: ["hiphop", "cinematic"], bpm: [116, 132], grade: ["punchy", "none"] },
    copy: {
      en: { hooks: ["GOT ANOTHER QUOTE?", "SELLING YOUR IPHONE?", "WAIT. READ THIS."],
        headlines: ["GET A CASH OFFER FOR YOUR IPHONE", "A FAIR CASH OFFER", "WE BUY IPHONES. FAIR AND LOCAL."],
        tags: ["COMPARE US", "FREE QUOTE", "TEXT A PIC, GET A PRICE"], cta: ["TEXT NOW", "GET YOUR QUOTE"] },
      es: { hooks: ["¿VENDES TU IPHONE?", "¿YA TIENES OTRA COTIZACIÓN?"],
        headlines: ["UNA OFERTA JUSTA EN EFECTIVO", "COMPRAMOS IPHONES"], tags: ["COTIZACIÓN GRATIS"], cta: ["¡COTIZA AHORA!"] },
    },
    vo: {
      en: ["Selling your iPhone? Get our cash offer first.",
        "Already got a quote? Get ours too. Text a pic to the number on your screen.",
        "Before you list it, get a fair cash offer from a local buyer. Text us a photo."],
      es: ["¿Vas a vender tu iPhone? Pide nuestra oferta en efectivo.",
        "Antes de venderlo, mándanos una foto y compara nuestra oferta."],
    },
  },
  spanish_speakers: {
    label: "Spanish-speaking families", who: "Spanish first, or both; family and neighbours matter.",
    insight: "Someone from the community who speaks their language and treats them fairly.",
    avoid: "Clumsy translation, stereotypes, English-only fine print.",
    moods: ["warm", "festive"], casts: ["warm_es_f", "warm_es_m"], lang: "es",
    looks: { vibes: ["mercado", "mural", "sunset_blvd", "lowrider"], sound_kit: ["house", "uplift"], bpm: [100, 120], grade: ["warm", "punchy"] },
    copy: {
      es: { hooks: ["¡OYE! ¿Y ESE IPHONE VIEJO?", "¿TIENES UN IPHONE QUE YA NO USAS?", "¡ATENCIÓN, FAMILIA!"],
        headlines: ["COMPRAMOS IPHONES", "TU IPHONE VIEJO VALE DINERO", "SOMOS DE AQUÍ. COMPRAMOS IPHONES."],
        tags: ["SE HABLA ESPAÑOL", "MÁNDANOS UNA FOTO", "COTIZACIÓN GRATIS"], cta: ["¡MÁNDANOS TEXTO!", "¡LLAMA YA!"] },
      en: { hooks: ["SE HABLA ESPAÑOL"], headlines: ["WE BUY IPHONES"], tags: ["SE HABLA ESPAÑOL"], cta: ["CALL OR TEXT"] },
    },
    vo: {
      es: ["¡Oye! ¿Y ese iPhone viejo? Nosotros lo compramos.",
        "Tu iPhone viejo vale dinero. Mándanos una foto y te damos precio.",
        "Somos de aquí y hablamos español. Llama o manda texto al número en tu pantalla.",
        "Compramos iPhones usados. Cotización gratis, en español."],
      en: ["We buy iPhones. Se habla español.", "We buy iPhones. Se habla español. Call or text the number on your screen."],
    },
  },
  gig_workers: {
    label: "Drivers and gig workers", who: "Rideshare, delivery; the phone is a work tool and gets replaced often.",
    insight: "A worn or cracked work phone is still worth cash, and time off the road is money.",
    avoid: "Office tone, anything slow.",
    moods: ["street", "confident"], casts: ["street_m", "street_f"],
    looks: { vibes: ["freeway", "street_spray", "repair_shop", "neon_motel"], sound_kit: ["hiphop", "uplift"], bpm: [92, 112], grade: ["film", "punchy"] },
    copy: {
      en: { hooks: ["DRIVE FOR A LIVING?", "PHONE TAKING A BEATING?", "NEW WORK PHONE?"],
        headlines: ["CASH FOR YOUR OLD WORK PHONE", "WE BUY USED IPHONES", "WORN OUT? STILL WORTH CASH"],
        tags: ["TEXT A PIC", "MEET UP LOCAL", "ALL MODELS"], cta: ["TEXT US", "CALL OR TEXT"] },
      es: { hooks: ["¿MANEJAS PARA VIVIR?"], headlines: ["EFECTIVO POR TU CELULAR DEL TRABAJO"], tags: ["MÁNDANOS UNA FOTO"], cta: ["¡MÁNDANOS TEXTO!"] },
    },
    vo: {
      en: ["New work phone? Sell us the old one.",
        "Your phone works as hard as you do. When it's replaced, it's still worth cash.",
        "Drivers, that old iPhone in the glovebox is cash. Text a pic to the number on your screen."],
      es: ["¿Celular nuevo para el trabajo? Véndenos el viejo.",
        "Ese iPhone viejo todavía vale dinero. Mándanos una foto."],
    },
  },
  eco_minded: {
    label: "Eco-minded", who: "Cares where things end up; would rather reuse than throw away.",
    insight: "A used phone passed on is one less in a landfill, and they get paid for it.",
    avoid: "Preachy tone, big environmental claims we cannot back.",
    moods: ["sincere", "calm"], casts: ["sincere_x", "calm_f", "warm_m"],
    looks: { vibes: ["eco_green", "clean_tech", "family_warm"], sound_kit: ["lofi", "minimal"], bpm: [92, 108], grade: ["warm", "clean", "film"], urgency: ["none", "pulse_cta"] },
    copy: {
      en: { hooks: ["DON'T TOSS IT", "GIVE YOUR OLD IPHONE A SECOND LIFE", "OLD PHONE IN A DRAWER?"],
        headlines: ["SELL IT, DON'T TOSS IT", "A SECOND LIFE FOR YOUR IPHONE", "REUSE IT. GET PAID."],
        tags: ["FREE QUOTE", "MEET UP LOCAL"], cta: ["TEXT US"] },
      es: { hooks: ["NO LO TIRES"], headlines: ["NO LO TIRES, VÉNDELO", "DALE UNA SEGUNDA VIDA A TU IPHONE"], tags: ["COTIZACIÓN GRATIS"], cta: ["¡MÁNDANOS TEXTO!"] },
    },
    vo: {
      en: ["Don't toss your old iPhone. Sell it.",
        "Give your old iPhone a second life, and get paid for it.",
        "An old phone in a drawer helps nobody. Pass it on, and get paid for it."],
      es: ["No tires tu iPhone viejo. Véndelo.",
        "Dale una segunda vida a tu iPhone y gana dinero."],
    },
  },
  business_bulk: {
    label: "Businesses and bulk", byHand: true, who: "Offices, schools, shops and fleets refreshing many devices at once.",
    insight: "One buyer for the whole batch, handled plainly and professionally.",
    avoid: "Consumer slang, fun fonts, anything that looks like a side hustle.",
    moods: ["confident", "newsy"], casts: ["crisp_m", "crisp_f", "news_m"],
    looks: { vibes: ["pro_office", "breaking_news", "clean_tech"], sound_kit: ["minimal", "house"], bpm: [104, 118], grade: ["clean", "cool"] },
    copy: {
      en: { hooks: ["REFRESHING YOUR COMPANY PHONES?", "A BOX OF OLD DEVICES?"],
        headlines: ["WE BUY IPHONES IN BULK", "COMPANY PHONES INTO CASH", "ONE BUYER FOR THE WHOLE BATCH"],
        tags: ["IPHONE, IPAD, MACBOOK", "BULK OK", "FREE QUOTE"], cta: ["CALL US", "GET A QUOTE"] },
      es: { hooks: ["¿RENOVANDO LOS CELULARES DE TU EMPRESA?"], headlines: ["COMPRAMOS IPHONES AL MAYOREO"], tags: ["COTIZACIÓN GRATIS"], cta: ["¡LLÁMANOS!"] },
    },
    vo: {
      en: ["Refreshing your company phones? We buy in bulk.",
        "One buyer for the whole batch of old iPhones. Call the number on your screen.",
        "Offices, schools and fleets: we buy used iPhones, iPads and MacBooks in bulk. Call for a quote."],
      es: ["¿Renovando los celulares de tu empresa? Compramos al mayoreo.",
        "Un solo comprador para todo el lote. Llama al número en tu pantalla."],
    },
  },
  gamers_genz: {
    label: "Gamers and Gen Z", who: "Always online, trend-aware, hates being sold to.",
    insight: "Old phone into money for the next thing: games, a drop, a new setup.",
    avoid: "Trying too hard, cringe slang, corporate tone.",
    moods: ["hype", "playful"], casts: ["gamer_m", "host_f"],
    looks: { vibes: ["gamer_rgb", "y2k_pop", "neon_motel"], sound_kit: ["hiphop", "house"], bpm: [124, 134], grade: ["punchy", "cool"], overlay: ["glitch", "grain_live", "none"] },
    copy: {
      en: { hooks: ["STOP SCROLLING", "LOOT DROP IN YOUR DRAWER", "OLD PHONE?"],
        headlines: ["CASH OUT YOUR OLD IPHONE", "OLD PHONE. NEW MONEY.", "LEVEL UP: SELL YOUR OLD IPHONE"],
        tags: ["TEXT A PIC", "ALL MODELS"], cta: ["TEXT US", "TEXT NOW"] },
      es: { hooks: ["DEJA DE SCROLLEAR"], headlines: ["CAMBIA TU IPHONE VIEJO POR EFECTIVO"], tags: ["MÁNDANOS UNA FOTO"], cta: ["¡MÁNDANOS TEXTO!"] },
    },
    vo: {
      en: ["Stop scrolling. Your old iPhone is cash.",
        "Old phone, new money. Text us a pic and cash out.",
        "Loot drop: that old iPhone in your drawer is real money. Text us a pic."],
      es: ["Deja de scrollear. Tu iPhone viejo es dinero.",
        "Celular viejo, dinero nuevo. Mándanos una foto."],
    },
  },
  luxury: {
    label: "Premium owners", who: "Pro and Pro Max buyers every year; expects discretion and polish.",
    insight: "A smooth, discreet sale of last year's Pro, handled like it's worth something.",
    avoid: "Loud colours, shouting, bargain-bin words.",
    moods: ["luxe", "confident"], casts: ["luxe_f", "luxe_m"],
    looks: { vibes: ["luxury_noir", "clean_tech"], sound_kit: ["minimal", "house", "lofi"], bpm: [96, 112], grade: ["film", "matte", "clean"], overlay: ["none", "bloom", "light_rays"], urgency: ["none"] },
    copy: {
      en: { hooks: ["LAST YEAR'S PRO?", "UPGRADED TO THE NEW PRO MAX?"],
        headlines: ["WE BUY IPHONE PRO AND PRO MAX", "YOUR LAST PRO, SOLD DISCREETLY", "SELL YOUR PRO MAX"],
        tags: ["FREE QUOTE", "MEET UP LOCAL"], cta: ["GET YOUR QUOTE", "TEXT US"] },
      es: { hooks: ["¿TU PRO DEL AÑO PASADO?"], headlines: ["COMPRAMOS IPHONE PRO Y PRO MAX"], tags: ["COTIZACIÓN GRATIS"], cta: ["¡COTIZA AHORA!"] },
    },
    vo: {
      en: ["Upgraded to the new Pro? We buy last year's.",
        "Your last iPhone Pro deserves a proper sale. Text us for a quote.",
        "We buy iPhone Pro and Pro Max, quietly and simply. Text us a photo."],
      es: ["¿Ya tienes el nuevo Pro? Compramos el del año pasado.",
        "Compramos iPhone Pro y Pro Max. Mándanos una foto."],
    },
  },
  broken_phones: {
    label: "Cracked or broken", byHand: true, who: "A phone with a cracked screen, a bad battery or water damage.",
    insight: "They assume it's worthless; a buyer who still wants it is a relief.",
    avoid: "Blame, judgement, promises about what any damage is worth.",
    moods: ["reassuring", "street"], casts: ["warm_m", "calm_f", "street_m"],
    looks: { vibes: ["repair_shop", "bandit_sign", "breaking_news"], sound_kit: ["hiphop", "uplift", "minimal"], bpm: [96, 116], grade: ["film", "none"] },
    copy: {
      en: { hooks: ["CRACKED SCREEN?", "DROPPED IT?", "DEAD BATTERY?"],
        headlines: ["WE BUY CRACKED IPHONES TOO", "BROKEN? TEXT US A PIC", "CRACKED? ASK US"],
        tags: ["TEXT A PIC, GET A PRICE", "CRACKED SCREENS WELCOME", "FREE QUOTE"], cta: ["TEXT US", "TEXT A PIC"] },
      es: { hooks: ["¿PANTALLA ROTA?"], headlines: ["COMPRAMOS IPHONES ROTOS TAMBIÉN", "¿ROTO? MÁNDANOS UNA FOTO"], tags: ["PANTALLAS ROTAS TAMBIÉN"], cta: ["¡MÁNDANOS TEXTO!"] },
    },
    vo: {
      en: ["Cracked screen? We buy those too.",
        "Dropped it, cracked it, battery's done? Text us a pic anyway.",
        "Don't write off a broken iPhone. Text us a photo and we'll tell you what we can do."],
      es: ["¿Pantalla rota? También la compramos.",
        "¿Se te rompió el iPhone? Mándanos una foto de todos modos."],
    },
  },
  declutter: {
    label: "Movers and declutterers", who: "Moving house, spring cleaning, clearing an estate.",
    insight: "Every box they empty is a win; getting paid for part of it is a bonus.",
    avoid: "Sad tones, pressure.",
    moods: ["warm", "playful"], casts: ["warm_f", "host_f", "warm_m"],
    looks: { vibes: ["family_warm", "tear_off", "eco_green", "venice"], sound_kit: ["uplift", "lofi", "house"], bpm: [100, 118], grade: ["warm", "clean"] },
    copy: {
      en: { hooks: ["MOVING SOON?", "SPRING CLEANING?", "CLEARING OUT?"],
        headlines: ["PACK LESS. GET CASH.", "OLD IPHONES INTO CASH", "WE BUY THE PHONES YOU FIND"],
        tags: ["FREE QUOTE", "MEET UP LOCAL", "ALL MODELS WANTED"], cta: ["TEXT US"] },
      es: { hooks: ["¿TE VAS A MUDAR?"], headlines: ["EMPACA MENOS, GANA EFECTIVO"], tags: ["COTIZACIÓN GRATIS"], cta: ["¡MÁNDANOS TEXTO!"] },
    },
    vo: {
      en: ["Moving? Pack less, and sell us the old iPhones.",
        "Found old iPhones while you clean out? We buy them.",
        "Clearing out the house? Every old iPhone you find is cash. Text us a photo."],
      es: ["¿Te vas a mudar? Empaca menos y véndenos los iPhones viejos.",
        "¿Encontraste iPhones viejos limpiando? Nosotros los compramos."],
    },
  },
  holiday: {
    label: "Holiday season", who: "Gifting a new iPhone, or getting one; the old one comes out of the box.",
    insight: "Holiday money from last year's phone, just when it's needed.",
    avoid: "Deadlines and countdowns; a sale that ends.",
    moods: ["festive", "warm"], casts: ["host_f", "warm_m", "warm_f"],
    looks: { vibes: ["holiday_gift", "family_warm"], sound_kit: ["house", "uplift", "cinematic"], bpm: [108, 124], grade: ["warm", "punchy"], overlay: ["confetti", "sparkle_field", "bokeh_drift", "none"] },
    copy: {
      en: { hooks: ["NEW IPHONE UNDER THE TREE?", "HOLIDAY UPGRADE?", "GIFTING A NEW IPHONE?"],
        headlines: ["TURN LAST YEAR'S IPHONE INTO HOLIDAY CASH", "NEW IPHONE? SELL THE OLD ONE", "HOLIDAY CASH FROM YOUR OLD IPHONE"],
        tags: ["FREE QUOTE", "TEXT A PIC"], cta: ["TEXT US"] },
      es: { hooks: ["¿UN IPHONE NUEVO DE REGALO?"], headlines: ["TU IPHONE VIEJO, DINERO PARA LAS FIESTAS"], tags: ["COTIZACIÓN GRATIS"], cta: ["¡MÁNDANOS TEXTO!"] },
    },
    vo: {
      en: ["New iPhone under the tree? Sell us the old one.",
        "Turn last year's iPhone into holiday cash. Text us a pic.",
        "New iPhone this season? The old one is holiday cash. Text us a pic."],
      es: ["¿Un iPhone nuevo de regalo? Véndenos el viejo.",
        "Convierte tu iPhone viejo en dinero para las fiestas."],
    },
  },
  locals: {
    label: "Hometown locals", who: "Proud of the neighbourhood; buys from people nearby.",
    insight: "A buyer who is from here, meets up nearby and talks like a neighbour.",
    avoid: "Corporate tone, chains.",
    moods: ["street", "warm"], casts: ["street_m", "street_f", "warm_m"],
    looks: { vibes: ["sunset_blvd", "swap_meet", "bandit_sign", "lowrider", "mural", "la_blue", "street_spray", "marquee", "freeway", "corner_store"], sound_kit: ["hiphop", "uplift", "house"], bpm: [92, 116], grade: ["film", "warm", "punchy"] },
    copy: {
      en: { hooks: ["HEY NEIGHBOR", "LOCALS, LISTEN UP"], headlines: ["WE'RE FROM HERE. WE BUY IPHONES.", "LOCAL IPHONE BUYERS"],
        tags: ["WE'RE FROM HERE", "MEET UP LOCAL"], cta: ["TEXT US", "CALL OR TEXT"] },
      es: { hooks: ["¡OYE, VECINO!"], headlines: ["SOMOS DE AQUÍ. COMPRAMOS IPHONES."], tags: ["SOMOS DE AQUÍ"], cta: ["¡MÁNDANOS TEXTO!"] },
    },
    vo: {
      en: ["We're from here, and we buy iPhones.",
        "Local buyers, meeting up nearby. Text us a pic of your old iPhone.",
        "Skip the strangers online. We're local, and we'll meet you nearby. Text us a pic."],
      es: ["Somos de aquí y compramos iPhones.",
        "Compradores locales. Mándanos una foto de tu iPhone viejo."],
    },
  },
};

export const AUDIENCE_KEYS = Object.keys(AUDIENCES);

// The voice of an ad made for no one in particular: the classic looks speak too.
export const GENERAL = {
  label: "Everyone", moods: ["confident", "hype", "warm", "street"], casts: ["host_m", "host_f", "crisp_f", "warm_m", "street_m"],
  vo: {
    en: ["We buy iPhones. Text us a pic.",
      "Your old iPhone is worth cash. Text us a photo for a free quote.",
      "Got an iPhone you don't use? We buy them. Text the number on your screen."],
    es: ["Compramos iPhones. Mándanos una foto.",
      "Tu iPhone viejo vale dinero. Mándanos una foto y te damos precio."],
  },
};

/** How long a script runs at an ad's pace, in seconds (about 2.6 words a
 *  second, plus a breath for each sentence). The voice bank measures the real
 *  clip; this is for choosing before there is one. */
export function scriptSecs(text) {
  const words = String(text).trim().split(/\s+/).filter(Boolean).length;
  const breaths = (String(text).match(/[.?!]/g) || []).length;
  return words / 2.6 + Math.max(0, breaths - 1) * 0.25;
}
