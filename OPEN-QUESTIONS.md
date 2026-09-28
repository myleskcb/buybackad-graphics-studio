# Open questions and contradictions

The repo carries several partial forks of one design language: an old
single-file app, four colour systems, two font stories, two backends, four
domains, and docs that disagree with the code about counts. None of them is
wrong on its own. Together they are why the product "feels like there's
separate things going on".

This is the list, one entry per contradiction, each with **where it lives**,
**why it matters**, the **options**, and a **proposed resolution**. Every entry
carries a status line so the console can count what is still open:

- **Status:** OPEN — needs the owner's decision
- **Status:** PROPOSED — a resolution is written here, waiting for a yes
- **Status:** DECIDED — decided, work not yet done (say where)
- **Status:** DONE — resolved; move the entry to CHANGELOG.md

The rule for adding to this file is DESIGN-LAW rule 42: **append, never
splice**. Number entries in order of discovery, not of importance.

The order of importance, as of 2026-09-28, is: 1, 3, 6, 4, 2, then the rest.
Settling those five removes every fork that a user can see.

---

## 1. Two whole apps are deployed: `index.html` and `phonegfx-studio.html`

**Where.** `phonegfx-studio.html` (1.0 MB, 5,183 lines) is a complete
single-file build of an earlier studio: its own `:root` tokens (`--bg:#0a0a0c`,
`--orange:#ff4d00`, Instrument Sans), a Google Fonts stylesheet with eleven
faces, its own copy of `COLOR_THEMES`, canonical URL `https://buyback.ad/`.
Committed in the first commit (`991f255`) and never touched or referenced since.
Nothing links to it, `netlify.toml` does not block it, so it is live at
`/phonegfx-studio.html` on every deploy, in the pre-design-law look.

**Why it matters.** It is the most literal "second design language" in the
repo. A search engine, a shared link, or a future agent grepping for
`COLOR_THEMES` finds two studios with two looks, and a change made in one is
silently absent from the other.

**Options.** (a) Delete it. (b) Move it to `archive/` and 404 it in
`netlify.toml`. (c) Keep it as a reference build under a different name.

**Proposed.** (a). Git has it forever; nothing in the current build reads it.
If any layout in it is missed, recover it from history into `app.js` under the
house law rather than keeping a parallel engine.

**Status:** PROPOSED

---

## 2. `styles.css` exists twice: the file and `CSS_FALLBACK` inside `app.js`

**Where.** `app.js` line ~8080 holds an 82 KB JSON string that is
`styles.css` verbatim, injected by `ensureCss()` if the stylesheet "did not
apply". HANDOFF §8 says it must be regenerated after every CSS edit. Today the
two are identical (checked: zero diff after whitespace normalisation), which
means someone remembered; the day they forget, the fallback is a fork.

Its header comment also still says the chrome is "Unified with unified-crm and
the iphones.la launcher … Liquid Glass", while HANDOFF §6 says the liquid-glass
direction is *superseded* and must not be restored. Same header in
`styles.css` line 1.

**Why it matters.** Two sources of truth for every UI token. And the reason it
exists, a host that strips `<style>` or a CSP that blocks styles, does not apply
to this deployment: `styles.css` is an external file served by the same origin,
which `style-src 'self'` permits.

**Options.** (a) Delete `CSS_FALLBACK` and `ensureCss()`'s injection routes.
(b) Keep it, but generate it in a deploy step so it cannot drift. (c) Keep it
as is with the `cssFallback` console switch as the only guard.

**Proposed.** (a), after one production check with the `cssFallback` switch
off (the console does this). Rewrite both header comments to describe the
*current* direction: warm / street, accent `#ff7a1a`.

**Status:** PROPOSED

---

## 3. Four colour systems, and they disagree with each other

**Where.**

| system | where | what it is | rules it follows |
|---|---|---|---|
| `PAL` (12 palettes) | `app.js` ~598 | the designer library's grounds and accents; `tameAccents` deepens the neon ones at build | 8 |
| `CAT_HUE` / `CAT_COLOUR` | `app.js` ~6680 | one OKLCH money hue per category, split-complement at ±160° | 40, 41, 32 |
| `COLOR_THEMES` (10 themes) | `app.js` ~4252 and again in `phonegfx-studio.html` | Easy Mode's "suggested colour themes": exact complements ("opposite-wheel hues"), accents `#a3e635` lime, `#38bdf8` cyan, `#ffd200` yellow, `#f472b6` pink | none; predates the law |
| UI tokens | `styles.css` `:root` | the chrome: `--accent:#ff7a1a`, brand `#ff7a33`/`#f5a623` | its own header "laws" |

**Why it matters.**
- `COLOR_THEMES` is one click away from the customer and it violates rule 8
  (neon accents; `tameAccents` never sees it because it is not in `PAL`) and
  rule 41 (exact complements, which "vibrate"). The comment on `colourTheory`
  in `app.js` already notes that "the shipped templates never touched it".
- `PAL` authors 28 `a1 → a2` gradients (kicker ribbons, CTA type, phone
  plates), several of which travel between hues (`sunset` amber → pink,
  `royal` amber → coral). `houseType` then flattens any gradient past 40° of
  hue travel (rule 5). So the palette data authors what the law deletes, on
  every load. Whichever side is right, one of them is dead code.
- `CAT_HUE` decides the money word; `PAL` decides everything else on the same
  template. Two palettes, one ad, joined only by the audit numbers.

**Options.** (a) One palette module (`palette.js`) that owns `PAL`, `CAT_HUE`
and derives `COLOR_THEMES` from `PAL` through `tameAccents` and the ±160° rule.
(b) Keep the systems, but run `COLOR_THEMES` through the same `tameAccents`
and hue-gap checks. (c) Remove the Easy Mode theme row (the `easyColorThemes`
switch shows what that looks like).

**Proposed.** (a), in two steps: first (b) so nothing neon is one click away;
then move the three tables into one file and let `PAL` stop authoring
cross-hue gradients that rule 5 removes anyway.

**Decision needed from the owner:** is the Easy Mode theme row a feature you
want at all? If not, (c) is one line.

**Status:** OPEN

---

## 4. Two font stories

**Where.**
- Rule 9 and `styles.css`: five self-hosted house faces (Clash Display,
  Satoshi, Khand, Melodrama, Zodiak); `index.html` says "No Google Fonts
  stylesheet".
- `app.js` still defaults to `'Bebas Neue'` in three places (`pt-font`,
  the text-measure context, `tp-font`) and `index.html` lines 396–397 render
  "Ag" samples in Bebas Neue and Barlow Condensed, neither of which is loaded.
- `FONT_GROUPS` lazy-loads a ~60-face Google Fonts catalogue for the picker,
  and the CSP still permits `fonts.googleapis.com` / `fonts.gstatic.com`.
- `phonegfx-studio.html` loads eleven Google faces up front.

**Why it matters.** A fallback to a face that is not loaded renders in the
browser default. And a picker with sixty faces contradicts the law's "five
faces, hierarchy from scale not effects".

**Options.** (a) Picker offers the five house faces only; remove the Google
catalogue and the CSP allowance. (b) Keep the catalogue for Pro as a deliberate
"bring your own look" feature. (c) Status quo, but fix the dead defaults.

**Proposed.** Fix the dead defaults now regardless (Bebas → Clash Display,
Barlow → Khand). Then the owner decides (a) or (b).

**Status:** OPEN

---

## 5. The docs state numbers the code contradicts (rule 37)

| claim | where | reality |
|---|---|---|
| "43 enforced rules" | `docs/README.md`, HANDOFF §8 | DESIGN-LAW.md has 50 |
| "Free = 20 templates · Pro = all 50+" | `README.md` Plan rules | 54 free / 243 total (HANDOFF §1) |
| "160+ proven templates" | `index.html` meta description, og:description, plans table (line 146), Pro upsell (`app.js` 5213), account panel (716) | 243; `app.js` 4815 already comments that "160+" was "written when the library was that size and never" updated, and fixes it *only* in the plan-feature strings |
| `PGFX_BUILD = 'v21'` | `app.js` | working copy is `gfxv23` |
| `og:image` → `assets/tplbg/cash_offer.jpg` | `index.html` | no such file; `assets/tplbg/` does not exist (the image is embedded in `tplbg-data.js`) |

**Proposed.** Derive every count from `TEMPLATES.length` the way
`refreshCountCopy()` already does for the plan features; delete the literal
numbers from copy and docs; point `og:image` at a real file in `assets/bg/`.

**Status:** PROPOSED

---

## 6. Random assignment is the architecture, and the owner has said it feels random

**Where.** HANDOFF §4: style family, accent hue, cutout and icon are chosen by
`hash(id) % n` across four of the nineteen passes. HANDOFF §6 then records the
split "duotone 121 · wash 76 · photo 46" as *locked design direction*, but
that split is just what the hash produced; nobody chose it.

**Why it matters.** This is the root of "separate things going on": each pass
is defensible, the composition of nineteen is not a design, and there is no
place to look up *why* template X looks the way it does.

**Options.** (a) A stored design record per template (style, palette, cutout,
icon, explicit) with the passes demoted to defaults for new templates, as
HANDOFF recommends. (b) Keep the hash but expose the knobs (the console's
`styleForce` is this, for one dimension). (c) Status quo.

**Proposed.** (a). The console is the first step: it makes the passes
switchable and their effect visible. The next step is to write out what each
pass decided for each template into a `records.json`, load it, and have the
passes skip any template that has a record.

**Status:** PROPOSED

---

## 7. Dark theme "matching the CRM", on a product whose CRM look is superseded

**Where.** `index.html` line 20: dark is default "(house preference, matching
the CRM)". HANDOFF §6: the CRM / liquid-glass direction is superseded. The
light theme exists (`styles.css` `:root[data-theme='light']`), and its toggle
was dead in production from 08-27 to 08-28 without anyone noticing.

**Question for the owner.** Is a light theme wanted? Nobody missed it. If yes,
it needs a contrast pass of its own (the CVD audit ran on the templates, not on
the chrome). If no, remove it and the two hashed inline scripts that exist only
to support it.

**Status:** OPEN

---

## 8. Four domains

**Where.** `index.html` canonical, `sitemap.xml`, `robots.txt`:
`https://buyback.ad/`. Live: `https://buybackad-graphics-studio.netlify.app`.
Configured custom domain `studio.scans.ad`: never resolved (HANDOFF, OPERATIONS).
Option B in `deploy-notes/`: `reselling.us/gfx` via a Cloudflare Worker.

**Why it matters.** Canonical and sitemap pointing at a domain that does not
serve the app is an SEO no-op at best, and every share card (`og:url`) points
there too.

**Question for the owner.** Which one is the product's address? Then the other
three references are a five-minute fix and the DNS record is a two-minute one.

**Status:** OPEN

---

## 9. Two backends

**Where.** `worker.js` (Cloudflare Worker, KV, described in `README.md` as
"backend/worker.js") and `netlify/functions/api.mjs` ("Netlify Function port of
worker.js, plus the AI background service"). `README.md` documents the Worker
path; HANDOFF §1 says the backend *is* the Netlify Function. `deno.lock` exists
for Netlify edge functions that are not in the repo.

**Proposed.** Keep `api.mjs`, move `worker.js` to `deploy-notes/` as reference
(it is not deployed from this repo), rewrite `README.md`'s backend section to
match, delete `deno.lock` unless an edge function is planned.

**Status:** PROPOSED

---

## 10. The agent brief wants to be `CLAUDE.md` and is not

**Where.** `AGENT-BRIEF.md` line 35: "copy this file to `CLAUDE.md`".
`netlify.toml` already 404s `/CLAUDE.md`. No `CLAUDE.md` exists, so every fresh
session starts without the landmines list unless someone pastes it.

**Proposed.** Create `CLAUDE.md` containing one line: "Read `AGENT-BRIEF.md`
then `DESIGN-LAW.md` before changing anything", so there is one brief and it is
always loaded. Needs the owner's explicit approval per the brief's own note.

**Status:** OPEN

---

## 11. Emoji: removed, and asked for twice

**Where.** HANDOFF §6: "pictorial ones removed; the owner has asked twice for
emoji as a deliberate LARGE-format style. Not built." `app.js` still ships an
`EMOJIS` palette of ten (📱 💰 💵 ✅ …) in the full editor's add-menu.

**Question for the owner.** Is emoji-as-a-style a template family (a layout
where one huge emoji *is* the composition) or a sticker the user adds? They are
different work. The first is a layout under the house law; the second already
exists.

**Status:** OPEN

---

## 12. Internal docs are hidden from the site; the console needs two of them

**Where.** `netlify.toml` 404s `/docs/*` and every root markdown file. The
console (`console.html`) reads `CHANGELOG.md` and `OPEN-QUESTIONS.md` to show
them in its tabs. This change deliberately does **not** add those two files to
the block list, and does not block the console, so the console works on the
live site. Both files are noindex by virtue of being markdown; `robots.txt`
disallows the console.

**Question for the owner.** Happy with the console and these two files being
reachable on the live URL (unlinked, noindex, harmless to the product), or
should all three be blocked so the console is local-only? Blocking is three
more redirects in `netlify.toml`.

**Status:** OPEN

---

## 13. Rule 44 is recorded, the assets are still undersized

**Where.** `docs/LEARNING-LOG.md` 2026-08-28 (later): the 153 designer
backdrops in `assets/bg/` are authored below the 2160px Pro export. Rule 44
written; recreation not started. HANDOFF §7 item 2 puts cutout coverage
(68/243) beside it: "~$3 of fal spend is the proven lever".

**Status:** DECIDED — recreate at 2160 and extend cutout coverage; not started.

---

## 14. HANDOFF §7 items the console now makes visible but does not fix

- Sharp-cornered boxes: no radius system exists for template plates (the
  chrome has `--r-sm/md/lg`; the canvas does not).
- "Strange overlays": owner flagged, never pointed at one. The *Authored only*
  and *No colour work* presets in the console are the fastest way to find
  which pass adds the overlay in question: switch passes back on one at a time.
- 8 text collisions with no vertical room to resolve.

**Status:** OPEN

---

*Items 15 onward were found by the coverage audit of the console on
2026-09-28 (later the same day): a sweep of every hash, every template-mutating
loop, every design data table, every duplicated definition across files, and
every count the docs state.*

## 15. Enhance restores the pre-law look, including the unreadable phone number

**Where.** `TRAITS` (what the Enhance button restores) is snapshotted at
`app.js` ~1799, right after the library is built and **before** the pass chain
at the end of the file runs. The chain then darkens inks on bright plates,
bans Satoshi from headlines, warms whites, tints plates. Enhance puts every
layer back to the snapshot.

**Measured.** Template 101's fills, snapshot vs after the chain:
`#ffffff` → `#f6f2ea` (warmed white), `#ffffff` → `#141110` (ink darkened on a
bright plate by `enforceInkOnPlate` / `highlightBudget`). Enhance reverts that
second one, which is exactly the "82 templates ship the phone number
unreadable" bug of 08-28, re-introduced by the button whose tooltip promises
to "snap every layer back to the template's look".

**Options.** (a) Snapshot after the chain (the `traitsAfterChain` switch does
this; off as shipped). (b) Enhance re-runs the chain on the one template
instead of restoring a snapshot. (c) Remove Enhance.

**Proposed.** (a) now, it is one line; (b) when the template editor exists.

**Status:** PROPOSED

---

## 16. The split-complement direction comes from the length of the category name

**Where.** `app.js` `CAT_COLOUR`: `splitComp(money, k.length % 2 ? 1 : -1)`.
"phones" (6 letters) gets −160°, "gold" (4) gets −160°, "silver" (6) −160°,
"coins" (5) +160°, "cars" (4) −160°, "strips" (6) −160°, "pokemon" (7) +160°,
"sports" (6) −160°. Rename a category and its accent moves to the other side
of the wheel.

**Proposed.** Choose per category and write it into `CAT_HUE` as a field. The
`compDirection` switch shows both sides for every category.

**Status:** PROPOSED

---

## 17. Four hashed choices, and a reshuffle looks like a different library

**Where.** Backdrop photo (`completeTemplate`), display face
(`displayFaceFix`), style family (`assignStyle`) and cutout
(`addProductCutout`) are each `hash(id) % n`. The console's *Reshuffle* preset
salts all four.

**Measured.** With salt "a": duotone 121 → 116, wash 76 → 89, photo 46 → 38,
and the backdrop, face and cutout move on most templates. Nothing else
changed. If the reshuffled library is as good as the shipped one, none of
those four were decisions; if it is worse, the shipped one is a lucky draw
that a stored record should freeze (item 6).

**Status:** OPEN — the owner should look at *Shipped* next to *Reshuffle* in
the console and say which is better and why.

---

## 18. `PLANS` is defined four times

**Where.** `app.js` 4858, `worker.js` 9, `netlify/functions/api.mjs` 30,
`phonegfx-studio.html` 3757. `README.md` says "change in ONE place each side"
(two places); there are four, and the worker's copy carries a `starter` plan
the others do not.

**Proposed.** Delete with items 1 and 9; then it is two, as the README says.

**Status:** PROPOSED

---

## 19. The Content-Security-Policy is defined twice

**Where.** `_headers` and `netlify.toml` both carry the full CSP, including the
two inline-script hashes. Netlify reads both; whichever is wrong wins somewhere.
The 08-28 theme-toggle fix had to be applied to both.

**Proposed.** One source: keep `netlify.toml` (it also carries the redirects),
delete the CSP line from `_headers`, and have `scripts/csp_hashes.mjs` write
into one file.

**Status:** PROPOSED

---

## 20. Two background libraries

**Where.** `assets/bg/` holds 154 designer backdrops (files, cached 30 days).
`tplbg-data.js` (635 KB) embeds 8 classic backdrops as base64 "so they can
never 404". They are loaded in different ways, sized differently, and the
`og:image` in `index.html` points at the embedded set's *file path*, which
does not exist on disk (item 5).

**Proposed.** Move the 8 classics to `assets/bg/` as files, delete
`tplbg-data.js`, and let the same preload path handle all of them. Rule 44's
2160px recreation (item 13) then covers both sets in one pass.

**Status:** PROPOSED

---

## 21. Backgrounds and AI prompts that the law forbids on templates

**Where.**
- `PROC_BGS` (procedural backgrounds, Backgrounds tab): beams from
  `#b01030` red to `#7b2d9e` violet, `#0d0d12` to `#2563eb`; and `BG_PRESETS`
  (Easy Mode): red → violet again. Hue-travelling gradients, which rule 5
  strips from type and `houseType` would flatten.
- `MOOD` (AI background prompt per palette): volt = "electric lime + cyan
  accents on deep navy", ocean = "deep teal-blue with cyan glow". That is the
  neon that rule 8 and `tameAccents` remove from the same palettes.
- `ADMIN_PAL_BACKDROP` (a second AI prompt table for the same palettes):
  volt = "cool deep blue tones", ocean = "airy teal and sky blue tones". The
  two prompt tables disagree with each other about what a palette is.

**Why it matters.** A customer can put a rule-5 gradient or a rule-8 neon
backdrop under a rule-abiding template in two clicks, and the AI service is
prompted toward the look the law was written to remove.

**Proposed.** Derive `MOOD` and `ADMIN_PAL_BACKDROP` from `PAL` (one table),
after `tameAccents`; rewrite `PROC_BGS` / `BG_PRESETS` as single-hue
gradients from the same palettes. Same move as item 3.

**Status:** PROPOSED

---

## 22. Five deploy documents, one of which describes a different repository

**Where.** `README.md` (Cloudflare Worker path), `SETUP.md` ("BUYBACK.AD
monorepo, new machine setup": zips, an `orchard` photo engine, `129
backdrops`, a `buyback-monorepo` that this repo is not), `deploy-notes/README.md`
(domains + Worker), `docs/OPERATIONS.md` (hosting, DNS, hygiene), `HANDOFF.md`
§8b (hosting). `SETUP.md` also notes the zips carry API keys.

**Proposed.** `docs/OPERATIONS.md` becomes the one deploy doc; the other four
link to it. `SETUP.md` moves out of this repo (it is about the monorepo).

**Status:** PROPOSED

---

## 23. Superseded colours still in the code

| colour | meaning | where it survives |
|---|---|---|
| `#3b9bff` | the blue of the superseded liquid-glass direction | `app.js` 2529 and `index.html` 893, as the fallback when `--accent` cannot be read |
| `#ff4d00` | the pre-law orange from `phonegfx-studio.html` | default fill for a new rectangle (`app.js` 3365) and the properties-panel colour input (`app.js` 3149, `index.html` 531) |

A new rectangle in the editor is drawn in a colour that appears nowhere else
in the design language.

**Proposed.** Both fall back to `#ff7a1a`; the rectangle default takes the
template's own accent.

**Status:** PROPOSED

---

## 24. `assets/icon-set.svg` is an orphan contact sheet

**Where.** A 950×840 sheet titled "BUYBACK.AD category marks, 20 icons". The
live icon system is the `ICONS` table in `app.js` (20 entries, drawn as paths).
Nothing references the SVG. If the two ever differ, the sheet is the fork.

**Proposed.** Either generate the sheet from `ICONS` with a script (so it is
documentation, not a source), or delete it.

**Status:** PROPOSED

---

## 25. How many passes there are depends on who is counting

HANDOFF §4 says 19: the 18 in the chain plus the money-word colour fix that
runs inside the library closure. The console shows 31 switches: 18 chain,
7 build-time (including two choices), 3 render-time, 2 UI, plus the forced
style. Neither number is wrong; they count different things. When the
template editor lands (item 6), the chain becomes *defaults for new
templates* and the count stops mattering.

**Status:** DONE — recorded here so the next reader does not reconcile it again.
