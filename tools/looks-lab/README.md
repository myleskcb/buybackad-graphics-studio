# Looks lab

Candidate looks for the site, as stylesheets laid over the real pages. Nothing
here is loaded by the site. It exists so a look can be judged on the real
landing page and editor before any of it goes into `styles.css`.

Started 2026-11-11, when the owner asked to see site styles, colour schemes,
typefaces and backgrounds that are not generic, placed against Canva, Pixlr,
fal.ai and the other design tools, and sold as part of the reselling.us family.

## The looks

Each of the six is written on top of the counter finish (`?finish=counter`),
which already removes the poster kit, so it sets tokens and a few rules of its
own. Each has a light and a dark set.

| File | Idea |
|---|---|
| `suite.css` | The resale. grammar on plain greys, with orange as Graphics Studio's own colour. Includes `family.css`. |
| `family.css` | The resale. system as written: violet, a cyan dot, violet-tinted greys. |
| `greenback.css` | Oatmeal paper and one banknote green; an engraved rosette and wave border; Besley. |
| `signal.css` | The yellow and black of a WE BUY sign; Big Shoulders capitals. |
| `workbench.css` | A dotted pasteboard, a ruler, named artboards, one thing selected in pink. `workbench.js` picks the selected card. |
| `gallery.css` | No brand colour; the ads are the only colour on the page. |
| `ux.css`, `ux.js` | Not a look: the suite bar, the number-first hero and the works-with row. Goes on top of any look with `--extra=ux`. |
| `signal-oat.css`, `signal-split.css`, `signal-night.css` | Round 2 (owner: "the high contrast, black and yellow actually looks not half bad but what other ways can we represent this?"). The same sign-capitals headline, with the yellow as a highlighter on oatmeal, as half the hero, or as type on black. Each includes `signal.css`. |
| `mix.css`, `mix.js` | The suite bar with the tool names the suite site uses (Sweep, Pricing, CRM, Buying ads, Bulk buying) and a works-with row. `--extra=mix`. |
| `t1`-`t4`, `c1`-`c4`, `g1`-`g4` | One change only on the live poster look: typeface, colour, ground. |

The sheets use CSS nesting and pull their faces from Google Fonts. Both are
fine for a preview and neither should ship: flatten the rules and vendor the
fonts into `assets/fonts` when a look is built in.

## The Cash Buyer ad

`ad-prototype/` redraws the first ad in Easy Mode (`top_buyer`) at runtime, to
the owner's notes of 2026-11-11, without touching `app.js`. `make.cjs` says how
to run it and what each version is; `page-helpers.js` holds the new `$` ground,
the subline fix and the contrast measurement (each line's fill against the
pixels behind it).

What it found, for whoever builds it in:

- The grey ground is `placeholderBgImage` (app.js ~9913): the photo is shown as
  a grey blur until a background is picked.
- The title is forced white by the `top_buyer` row of `COLOUR_FIX` (~1791).
- The headline is authored white; `colourTheory` (~8882) makes it orange and
  `inkVsWash` (~8465, via `liftInk`) lifts it to peach. A change to the spec at
  line 83 alone does not survive these passes: an authored neon orange comes
  out pale. The card needs an opt-out there, and that pass runs on every classic.
- The subline's panel is sized by `bodyPanel` (~8695) before `alignPass`
  shrinks the type, so the type ends up small in a wide box.
- Versions A, B and C go against rules 8, 95 and 122. D and E do not.

Not run on any version: the colour-vision pass (rule 43), `pgCheck`, any
format but square.

## The headline lock

The owner, on the capitals: "clearly we should have text you first all in one
line". In `signal*.css` and `t3.css` the phrase cannot break, and the headline
is sized from its own column (`cqi`), from the line widths measured in the face
(Big Shoulders Display 900: BUYBACK ADS 5.07em, THAT MAKE 4.17, STRANGERS 4.28,
TEXT YOU FIRST. 5.88). `checklock.cjs` re-measures it at twelve widths from 320
to 1920; all five sheets passed on 2026-11-11. Change the headline's words or
its face and the numbers have to be measured again.

## Rendering one

    python3 -m http.server 8899
    node tools/looks-lab/render.cjs /tmp/suite.jpg --finish=counter --look=suite

`render.cjs` lists its options at the top. It needs Playwright.

## What has been checked

The landing hero (desktop and phone, light and dark) and the first screen of
the editor, by eye, for all six. `suite` was also read down the whole landing
page. Nothing else: no contrast audit, no other pages, no colour-vision pass
(DESIGN-LAW rule 43). A look that is chosen gets all of that when it is built in.
