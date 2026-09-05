# Buyback graphics engine — device library, auditor and console

Everything the studio has worked out about buyback ads, as code you can run:
sixteen composition devices, eight layout archetypes, eight palettes, six type
pairings and twelve audit rules — plus the console that lets you switch any of it
on and off and measures whether the change actually helped.

Nothing here is traced from a third-party template. Every shape is generated.

---

## What's in the box

```
buyback-console.html      the console — open it in any browser, no server needed
engine/engine.mjs         the whole engine as one pure ES module (no DOM, no deps)
tools/sweep.mjs           audit sweep across every archetype × vertical × format
tools/contribution.mjs    what each device is actually worth, in points
tools/render.mjs          batch-render cards to SVG (PNG with sharp installed)
tools/emit-spec.mjs       dump the data blocks to JSON
spec/*.json               palettes, type pairs, devices, rules, exclusions, content
spec/contribution-report.txt   measured device contribution, phones · 4:5
samples/                  eight archetypes rendered, SVG + PNG
```

## Run it

```bash
open buyback-console.html          # the console, offline

node tools/sweep.mjs 12            # 12 seed sets = 2,304 configurations
node tools/contribution.mjs        # rank every device by measured contribution
node tools/render.mjs out cars 916 # batch render, cars vertical, 9:16
node tools/emit-spec.mjs spec      # regenerate the JSON contract
```

`sweep.mjs` exits non-zero on any rule failure, so it drops straight into CI.
Node 18+. No dependencies. `npm i sharp` if you want PNG out of `render.mjs`.

## Use the engine

```js
import * as E from './engine/engine.mjs';

const cfg = { ...E.DEFAULT_CFG(), sunburst: false };   // any device off
const r   = E.render('nightLot', 4242, 'phones', '45', cfg);

r.svg                 // complete SVG string, 1080 × 1350
r.audit.coverage      // 0.66
r.audit.dead          // largest empty rectangle, as a fraction of canvas
r.audit.rules         // [['R1', true], ['R2', true], …]
E.buildPrompt('nightLot', r, cfg).pos   // the generated positive prompt
E.buildPrompt('nightLot', r, cfg).neg   // negatives: everything off + exclusions
E.sentiment(r, cfg).words               // ['Loud', 'print-shop', 'well-vouched']
```

---

## The twelve rules

| # | Rule | Threshold | Catches |
|---|------|-----------|---------|
| R1 | Coverage floor | ≥ 62% of canvas carries content | the empty card — 29% coverage reads as a placeholder |
| R2 | Dead space | largest empty rectangle ≤ 18% | a card that averages fine but has one big hole |
| R3 | Footer bar | full-bleed footer carrying the number | a number floating with nothing under it |
| R4 | Hero bleed | hero crosses an edge by ≥ 6% | product parked inside a box like a catalogue photo |
| R5 | Shape language | headline on stroke, tear, band or rays | the flat rounded plate behind every headline |
| R6 | Badge placement | seal covers 6–32% of the hero | a seal floating in dead space, or swallowing the product |
| R7 | Text collision | no two text boxes intersect | overlap you only notice after export |
| R8 | Minimum size | every text ≥ 2.0% of the short edge | fine print that dies in a feed thumbnail |
| R9 | Contrast | every text ≥ 4.5:1 on its own backing | accent-on-accent text that vanishes |
| R10 | Hot restraint | hot colour ≤ 14% of canvas | the all-red card where nothing reads as urgent |
| R11 | Sheen parentage | every sheen sits inside its own plate | the highlight drawn at the layout's original geometry |
| R12 | Safe area | non-bleed elements inside a 4.5% margin | clipped corners after a crop |

Coverage and dead space run on a 20px occupancy grid; dead space uses
largest-rectangle-in-histogram, so an evenly-filled 62% passes where a 62% with
one big hole fails. Ambient fields (sunburst, halftone, checker, grain) are
excluded from the coverage grid on purpose — texture must never be able to
rescue a thin card.

## Measured, not asserted

`spec/contribution-report.txt` ranks every device by how much it moves the
composite score when switched off, averaged over four seeds × eight archetypes.
The top of that list on phones · 4:5:

| pts | device |
|-----|--------|
| 19.6 | Product hero |
| 10.0 | Footer bar |
| 4.1 | Call to action |
| 4.1 | Promise pills |
| 3.8 | Corner lockup |
| 3.0 | Starburst seal |
| 2.8 | Proof block |
| 2.4 | Bleed off the edge |

Devices near zero are decorative for these layouts. That is a finding, not a
verdict — a device can be worth keeping for reasons the auditor cannot see.

## Porting order

1. **Palettes and type pairs** — `spec/palettes.json`, `spec/type-pairs.json`.
   Each palette carries measured contrast ratios and the correct on-colour for
   hot, accent and paper, so you never have to guess ink again.
2. **The four chrome devices** — `footerBar`, `cornerLockup`, `starburst`,
   `outlineDisplay`. These are the ones the reference ads all share.
3. **Shape language** — `paintStroke`, `tornPaper`, `sunburst`. This is what
   replaces the flat rounded plate behind the headline.
4. **`angledBleed`** — the hero rotated 6–24° and pushed past one edge.
5. **Rules R1, R2, R4, R11** — the four that catch the blandness directly.

## Two bugs worth knowing about

**The sheen.** `D.sheen(card, plate, colour)` takes the plate and derives from
it: inset 5% of the plate's width each side, 7% down, 9% of its height tall.
It cannot be given canvas coordinates, so it cannot drift when a plate moves.
R11 verifies containment on every render.

**Text overflowing its box.** Every text node declares a box. `Card.text` fits
the size to that box, and only stretches with `textLength` when the natural
width is within 0.70–1.60 of the target — outside that range it shrinks to fit
rather than squashing. This is what stopped the footer number running into the
address, and the review quote running out of its card.

---

Cards use real iPhones.LA / Cars Buyer copy and (562) 999-4994.
Swap `spec/content.json` (or `CONTENT` in the engine) for another vertical.
