# Agent brief — Graphics Studio by BUYBACK.AD

Notes for whoever, or whatever, is about to change this repo. Most of what
follows has already cost a silent breakage, seven weeks of unbacked work, or a
palette that looked fine and was not.

Read `DESIGN-LAW.md` before touching a template. Read this before touching
anything.

> **To make this auto-load:** copy this file to `CLAUDE.md` in the repo root and
> Claude Code will read it at the start of every session in this directory.
> It is kept under a separate name because `CLAUDE.md` is a protected
> agent-instruction file that needs the owner's explicit approval to write.

## What this is

**Graphics Studio by BUYBACK.AD** — a browser ad builder for phone buyers and
resellers. Pick a template, type a headline and a phone number, export a
post-ready graphic for Facebook Marketplace, OfferUp, Instagram or Craigslist.

It is a **product people pay for** (Free / Pro $15 mo), not an internal tool.
That is the standard every change is held to.

| | |
|---|---|
| Repo | `myleskcb/buybackad-graphics-studio` |
| Working copy | `~/Downloads/gfxv23` — see the warning below |
| Live | https://buybackad-graphics-studio.netlify.app |
| Netlify project | `buybackad-graphics-studio` (CLI is authenticated) |
| Study program | `docs/` — start at `docs/README.md` |

Single-page app, no build step: `index.html` + `app.js` (~7.7k lines, 560KB) +
`styles.css`. Free/Pro limits are enforced **server-side** in a Cloudflare
Worker; the browser copy in `PLANS` is display only.

## The business constraint that governs every decision

From DESIGN-LAW.md, and it is the most important sentence here:

> These are ads that must stop a scroll in a hostile feed, so "restrained"
> cannot be allowed to mean "quiet". But they are also ads that say *give a
> stranger your phone and they will hand you cash*, so trust is the conversion.
> Anything that reads as a scam costs money directly.

Resolved by: **attention comes from contrast and scale, not from saturation.**

A change that buys attention with saturation is moving backwards even when it
looks louder.

## The prime directive: measure, do not assert

`DESIGN-LAW.md` is 43 numbered rules, and almost every one was derived by
measuring the real library rather than by quoting a textbook. Rule 34 says
*never model a blend, measure it*. Rule 37 says *state no number you can count*.
Rule 14 says colour theory selects **from** a vocabulary observed in real
reference ads — it does not get to invent one.

Hold yourself to the standard the file holds the templates to:

- A rule that cannot be checked with code against the library is not finished.
- Do not describe a colour, a contrast or a count you have not computed.
- Do not call something broken because one guessed URL returned 404. Find the
  real one. (This exact mistake produced a confident "the product is not live"
  about a product that was live at a different subdomain.)
- Prefer a script that can be re-run over a number pasted into prose.

**The most valuable finding so far came from changing the question, not from
looking harder.** Every contrast figure in DESIGN-LAW had been measured with
normal colour vision, which silently assumed the whole audience has it. Two
themes passed that audit and failed once the question changed. See rule 43.

Generalised: **a passing check that asks the wrong question is worse than no
check**, because it manufactures confidence. When something has "already been
audited", ask what the audit could not have seen.

## Landmines

### 1. Never hand-splice `app.js` between two anchors

This is rule 42 and it has already caused a silent production breakage. A
cutout rewrite replaced everything between `/* PRODUCT CUTOUT */` and
`const LAYOUT_FAMILY` — a range that had quietly accumulated other functions.
It deleted `enrichFills()`. The call site survived, threw on every load, and
**aborted every pass after it**: tracking, gradient washes, contrast repair,
phone plates, body panels, white-tinting, all silently absent in production,
while the page still rendered 243/243 and reported no errors.

Replace a *named function* by locating its own opening and closing, or append.
When adding a rule to DESIGN-LAW.md, **append** — never splice.

### 2. The library lies about its own health

243/243 renders is not proof. A broken pass does not announce itself. **Verify
by loading the page and looking**, or with a script that recomputes the thing
you changed. Never by reading the source and reasoning about it.

### 3. This working copy lives in `~/Downloads`

There are ~23 sibling copies (`gfxv6` … `gfxv23`, `phonegfxv5`, `GFX SITE`,
plus a *different* `gfxv23` on the Desktop). **Only `~/Downloads/gfxv23` has the
git remote.** On 2026-08-28 its last commit was seven weeks old while the tree
held 5,080 uncommitted lines — the entire design-law audit.

**Commit and push every session. No exceptions.** Migration to
`~/dev/buybackad-graphics-studio` is recommended but not done; do it with the
owner present, and leave the old copies alone until they confirm.

### 4. More than one agent may be working here

Deploys have appeared minutes apart from separate sessions. Before concluding
something is broken, check `git log` and the Netlify deploy list.

### 6. `main` is not the newest code, so check before you build

On 2026-09-26 `main` was a month behind: the product had moved on across a
dozen branches (the violet landing, the palettes, `/motion`, the iPhones LA
link) and none of it was on `main`. Three sessions that day started from `main`
and rebuilt things in a language the owner had already abandoned, one of them
a second video engine beside `/motion`. Nothing errored; the page just looked a
month old.

Before changing anything:

```bash
git fetch origin --prune
git for-each-ref --sort=-committerdate --format='%(committerdate:short) %(refname:short)' refs/remotes | head
git merge-base --is-ancestor origin/main <newest-branch> && echo "main is behind it"
```

If `main` is behind the newest integration branch, start from that branch and
say so. Screenshot the landing before you touch it: the violet Template Lab page
is current; a warm orange one is August.

### 5. Internal docs are blocked from the public site

`docs/`, `scripts/` and `DESIGN-LAW.md` are 404'd at the edge in
`netlify.toml`. They ship in the deploy but must not be fetchable — the house
rulebook is not product. If you add another internal folder, block it too.

## Deploying

```bash
cd ~/Downloads/gfxv23
netlify status              # confirm the link
netlify deploy --dir=.      # DRAFT first, always
# open the draft URL and confirm it renders
netlify deploy --prod --dir=.
```

Draft-deploy and *look* before `--prod`. Given landmine 2, the preview render is
the only real check.

Verify after promoting:

```bash
U=https://buybackad-graphics-studio.netlify.app
curl -sS -o /dev/null -w '%{http_code} /\n'       $U
curl -sS -o /dev/null -w '%{http_code} /app.js\n' $U/app.js
curl -sS -o /dev/null -w '%{http_code} /docs\n'   $U/docs/README.md   # must be 404
python3 scripts/cvd_audit.py                                         # exits 1 on failure
```

## Domains — known broken, needs a human

| URL | State |
|---|---|
| `buybackad-graphics-studio.netlify.app` | **works — this is the URL to share** |
| `studio.scans.ad` | configured in Netlify, **no public DNS** |
| `buyback.ad` / `www.buyback.ad` | domain alias set, no DNS at all |

The `studio` record exists and is correct on Netlify's nameservers, but
`scans.ad` is delegated at the registrar to `dns1.registrar-servers.com`
(Namecheap), so the Netlify zone is not authoritative and nobody can see it:

```bash
dig +short studio.scans.ad @dns1.p04.nsone.net   # 52.52.192.191, 13.52.188.95
dig +short studio.scans.ad @8.8.8.8              # nothing
```

Two fixes, both needing registrar access, both moving DNS for a live product —
**do not do this unattended.** Detail in `docs/OPERATIONS.md`.

`reselling.us/GFX` returns 200 but serves a *different* app (RU CRM v1), whose
SPA catch-all answers every path. Mounting there means a subdomain
(`gfx.reselling.us` as a CNAME) rather than fighting another router.

## Study sessions

This project runs an ongoing design-education program. `docs/README.md` is the
entry point; `docs/SESSION-PROTOCOL.md` has the rules, including the **99% pause
rule** — stop at 99% of the session limit, not 100%, because landmine 1 means a
session that dies mid-edit can leave `app.js` silently broken.

Append to `docs/LEARNING-LOG.md` at the end of every session, including a
`RESUME HERE` line. Read the last three entries at the start of one.

## Do not

- Repaint a template to fix a measured defect without doing the field research
  rule 14 requires. Naming the defect **is** a finished unit of work; guessing a
  replacement hue is not.
- Add a rule sourced from a textbook rather than from the library.
- Change DNS, registrar settings, Stripe products, or plan limits unattended.
- Treat a green audit as proof the property is safe. Ask what it did not check.

## The gate (2026-09-27): every generation is measured before it is produced

Owner: "every generation has a self audit process and a check before they're
produced." DESIGN-LAW rule 66. In practice:

- **One measure:** `pgCheck(scene)` in app.js. Contrast per line (core and
  worst letter), the number's size and placement, the headline in a tile, the
  guides, copy on copy. Thresholds in `PG_T`. The scripts reach it as
  `__sc.check(t)`; the legibility audit and the critic read their numbers
  from it. Never add another luminance helper, contrast formula, hex parser or
  "plate under a line" finder: `pgLum`, `pgCr`, `pgRgb`, `pgCheck`.
- **The studio:** `pgGate()` runs before a download, a video and a print
  order. It shades a failing ground (neutral, in the direction the lines
  need) and otherwise names the problem in a modal. Do not add an export
  path that bypasses it.
- **Emoji accents** (rule 67, 2026-09-29): `pgEmojiPass` runs after
  alignPass on every render and places 0 to 2 emoji from
  assets/emoji/fluent-3d.webp beside the copy; the gate fails one on copy.
  A script that paints must wait for `pgEmojiLoad()` (openStudio does), or
  it paints cards without their accents. After a change to the pass,
  re-render every library thumbnail (`rethumb_showcase.mjs`) and bump
  ASSET_REV. Never add a system-font emoji as artwork.
- **The shade is bands** (rule 66, 2026-09-28): `scrimMode: 'bands:a-b,c-d'`
  shades only the bands of the height that hold copy on the photograph.
  `scrimRect` draws it (`scrimBands` parses it); `naturalGround` solves it
  with modes `['bands', 'gradient', 'normal']`; the studio derives its own
  from the scene (`pgShadeBands`). Never write a whole-card veil where a
  bands shade would hold the lines, and never treat a bands mode as
  'gradient' (normaliseBackdrop keeps it).
- **The scripts:** a script that rewrites a showcase record passes its
  candidates through `gateRecords(page, pairs)` and writes only what
  `accept` keeps (see neutral_panels.mjs for the pattern). `live()` from the
  harness is the one live-card predicate.
- **Before a commit that touches the classics' passes or tables:**
  `node scripts/verify_showcase.mjs --classics --write` (writes
  assets/classics-gate.json; a classic that fails is not offered). The
  re-bake order is bake_contrast, number_block --classics --write,
  naturalize_classics --write, then verify.
- **Before a commit that touches assets/showcase:**
  `node scripts/verify_showcase.mjs --write` (exit 1 on any failure; it
  stamps legib / num / numInk / gate / blur / ground on the index). Then
  `rethumb_showcase.mjs` for the cards that changed, and bump `ASSET_REV`.
- **The pipeline order** is in OPEN-ITEMS §L. Passes undo each other when
  run out of order (refresh reads git HEAD; import restores the tone grade;
  naturalize then darken; support_highlights before neutral_panels; content
  audit after overlap; curate last).
- **The record of what is still inconsistent** is docs/COHESION-AUDIT.md.
  Read it before touching the classics' passes or the render paths.
