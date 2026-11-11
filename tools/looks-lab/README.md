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
| `t1`-`t4`, `c1`-`c4`, `g1`-`g4` | One change only on the live poster look: typeface, colour, ground. |

The sheets use CSS nesting and pull their faces from Google Fonts. Both are
fine for a preview and neither should ship: flatten the rules and vendor the
fonts into `assets/fonts` when a look is built in.

## Rendering one

    python3 -m http.server 8899
    node tools/looks-lab/render.cjs /tmp/suite.jpg --finish=counter --look=suite

`render.cjs` lists its options at the top. It needs Playwright.

## What has been checked

The landing hero (desktop and phone, light and dark) and the first screen of
the editor, by eye, for all six. `suite` was also read down the whole landing
page. Nothing else: no contrast audit, no other pages, no colour-vision pass
(DESIGN-LAW rule 43). A look that is chosen gets all of that when it is built in.
