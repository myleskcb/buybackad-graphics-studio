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

### 6. Start from `main`, and put your work back on it

**Since 2026-09-30 `main` is the whole product.** The owner: "Audit and push
all to main site, unify the sites or branches." Every line of work was merged
into one (the trunk, the one-engine work, the colour themes, the video maker,
and the live branch production served, with its iOS-only emoji) and `main`
was moved to it. Start a session from `main`; when your work is done, merge
`main` in again (another session may have moved it), run the checks, and put
the result back on `main`. A branch that is not on `main` is not the product.
Two August branches were left unmerged on purpose (OPEN-ITEMS §J, §U):
`claude/busy-allen-2d5iv1` and `claude/quirky-ritchie-f0zuc8`; port from
them, never merge them.

**It happened again within a day.** On 2026-10-01 twelve branches carried
finished work `main` did not have (OPEN-ITEMS §Y): six video-maker sessions,
two library sessions and a palette session had all started from `main` on
2026-09-30, done what the owner asked, pushed their branch and stopped. The
owner asked for "anything left behind", and got two palette sessions that
had gone opposite ways on the same palettes. A session's work is not done
when its branch is pushed: merge `main` in, run the checks, and put the
result on `main` the same day, or say plainly in your last message that it
is not on `main` and why.

History, and why this matters:

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

**The newest branch is not always what is live either.** On 2026-09-29 three
heads had diverged (`claude/vibrant-lovelace-rze4rx`, the trunk;
`claude/vibrant-hawking-htxrvn`; `claude/fervent-pascal-w6mthe`), and the
Netlify project the connector sees, `buybackad-finished-copy`, was serving
production from `claude/fervent-pascal-w6mthe` (deploy `6abb0be6`, commit
`47ec573a`). Ask the deploy which branch it built (`get-deploy-for-site`
through the Netlify connector names `branch` and `commit_ref`) and build what
the owner is looking at; say which branch you started from, and which heads
you did not merge.

### 7. A deploy must contain what is live, or it rolls someone back

Sessions deploy the Netlify project straight from their own branches, and on
2026-09-29 three lines were live or about to be: the trunk
(`claude/vibrant-lovelace-rze4rx`), the branch production served
(`claude/fervent-pascal-w6mthe`) and the one-engine work
(`claude/vibrant-hawking-htxrvn`), each missing the others' last day. A deploy
from any one of them would have taken the other two's work off the site.

Before a production deploy, read the current production deploy's commit
(the Netlify deploy list, or the connector's get-deploy) and check it is an
ancestor of what you are about to deploy:

```bash
git merge-base --is-ancestor <live commit> HEAD && echo "contains what is live"
```

If it is not, merge that branch first (merge, never rebase another session's
work), run the checks, then deploy. Merge the newest branches' finished work
the same way before you build on top of it.

### 5. Internal docs are blocked from the public site

`docs/`, `scripts/` and `DESIGN-LAW.md` are 404'd at the edge in
`netlify.toml`. They ship in the deploy but must not be fetchable — the house
rulebook is not product. If you add another internal folder, block it too.

## Deploying

**Deploy `main`, and only `main`.** Two Netlify projects serve this app:
`buybackad-graphics-studio` (the URL in these docs, deployed from the owner's
Mac with the CLI) and `buybackad-finished-copy` (the only one the owner's
Netlify connector sees, in the `myleskcb2` team, deployed by sessions). Until
2026-09-30 each was deployed from whatever branch a session stood on, so the
two showed different products. Deploy the same `main` commit to both, or
retire one; the lasting fix is to link one project to this repository's
`main` in Netlify (Project configuration, Build & deploy, Link repository;
publish directory `.`) so that every push to `main` deploys and nobody deploys
by hand. The cloud sessions cannot reach Netlify (their network policy denies
`*.netlify.app` and `api.netlify.com`). The connector's deploy-site does not
deploy by itself: it returns an `npx @netlify/mcp --site-id … --proxy-path
https://netlify-mcp.netlify.app/proxy/…` command, which zips the working
tree (all but node_modules and .git) and uploads it through those hosts, so
from a cloud session it fails with 403 (2026-10-01, twice). Check out `main`
before running it anywhere: the deploy records the branch and commit the
tree is on.

```bash
cd ~/Downloads/gfxv23 && git fetch origin
# a clean checkout of exactly main: nothing uncommitted or untracked ships
git worktree add ~/Downloads/studio-main origin/main    # the first time
cd ~/Downloads/studio-main
git fetch origin && git checkout --detach origin/main   # every time after
git log -1 --oneline        # the main you mean to ship
netlify link --name buybackad-graphics-studio           # the first time
netlify deploy --dir=.      # DRAFT first, always
# before it uploads: "Config file" must be …/studio-main/netlify.toml and
# "Deploy path" …/studio-main; "No config file was defined" means the wrong
# folder, so Ctrl+C
# open the draft URL and confirm it renders
netlify deploy --prod --dir=.
```

Draft-deploy and *look* before `--prod`. Given landmine 2, the preview render is
the only real check.

`--dir=.` is whatever folder the terminal is in. On 2026-10-01 the owner ran
`netlify link` and `netlify deploy --prod --dir=.` in the home folder
(`/Users/admin`); the CLI said "No config file was defined", "Deploy path:
/Users/admin", and began hashing the Photos library to publish it on
studio.scans.ad. When you hand the owner deploy commands, start them with the
`cd`, and tell them to read the Deploy path line before anything uploads. A
home folder linked by mistake is undone with `netlify unlink` there; a deploy
made from one is deleted with `netlify api deleteDeploy --data
'{"deploy_id":"…"}'` after the last good deploy is published again (every
finished deploy keeps a public address of its own).

To click through a branch on your own machine first: `python3 -m http.server
8899` in the repo, then open `http://localhost:8899/?demo=1`. A local copy has
no backend, so `?demo=1` (localhost only, remembered until `?demo=0`) runs the
config.js demo mode: sign up with any email and take Pro through the simulated
checkout to see every template.

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
produced." DESIGN-LAW rule 87. In practice:

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
- **Emoji** (rule 88, 2026-09-29): iOS style or none. `pgEmojiPass` places
  one device-font emoji on about three in ten cards, only when
  `PG_IOS_EMOJI` (an Apple device; `?emoji=ios` forces it for tests). Never
  ship emoji artwork files, never place a non-Apple emoji.
- **Copy under a shape** (rule 91): the gate fails an invisible line of any
  role and a line with a solid shape over its letters; `pgUncover` moves
  such copy clear after the layout. A rotated rect is never rebuilt from its
  bounding box.
- **One colour to a card** (rule 95): `pgOneHue` runs after the layout, a
  theme, a tagline look and copy-follows-ground; everything coloured on a card
  is within 30 degrees of its hue, at its own luminance. The gate fails 'hues'.
  Do not add a pass that paints a second hue after these without running it.
- **The chrome is the poster look** (rule 98, superseding rule 96): skin
  'poster' is the default (index.html bootstrap): paper, ink outlines, hard
  offset shadows, and four signal colours each with one job (blue action,
  tomato heat, marigold highlighter, mint cash). No glass, blur or glow in it.
  Its rules are scoped `:root[data-skin='poster']` at the end of styles.css;
  run sync_css_fallback.mjs after editing them.
- **No see-through products** (rule 94): no product wall (ghosted cut-outs
  over the ground), no product picture under 60% opacity; the gate fails it
  ('ghostPic') and `pgGhostWallStrip` removes a wall after the layout.
- **Face passes and baked tables** (rule 92): `pgHairlineHeads` sets a
  card's serif at load, and `assets/number-fix.json` sets the number's face
  after it. Change a face pass and re-bake the rows of the cards it changes
  (`number_block.mjs --classics --ids a,b --json f`, then replace those ids'
  rows; `--classics --write` rewrites the whole table from what it measured).
- **The shade is bands** (rule 87, 2026-09-28): `scrimMode: 'bands:a-b,c-d'`
  shades only the bands of the height that hold copy on the photograph.
  `scrimRect` draws it (`scrimBands` parses it); `naturalGround` solves it
  with modes `['bands', 'gradient', 'normal']`; the studio derives its own
  from the scene (`pgShadeBands`). Never write a whole-card veil where a
  bands shade would hold the lines, and never treat a bands mode as
  'gradient' (normaliseBackdrop keeps it).
- **Easy Mode's themes, grounds and effects** (rule 90, 2026-09-29): after
  the layout, `themeScene` repaints plates, marks and lines. With no theme,
  `ezCopyFollowsGround` answers for a flat ground the visitor picks. The
  overlay's tone is set by `ezOverlayPre`, then `ezOverlayFit`. Before a
  commit that touches any of them, or the Easy Mode controls, run
  `node scripts/ez_theme_audit.mjs`. It exits 1 on any problem and takes
  about 70 minutes for its 20-card sample (`--quick` runs a quarter).
  Measure each card in a fresh browser context: the studio keeps the
  visitor's draft in localStorage, and a shared context leaks it into the
  next card.
- **The designer** (rule 93, 2026-09-30): the advanced editor calls the same
  passes on its live canvas through one colour pass, `edRecolour`. It
  starts each time from the paint every object had before any theme
  (`pgOrig`, saved with the object). Colour a designer object through it,
  and save a deep copy of any paint, never the object: fabric shares a
  gradient's stops, and the passes turn them in place. Before a commit that
  touches the designer's panel, its grounds or the passes, run
  `node scripts/designer_audit.mjs` too. It exits 1 on any problem and takes
  about 12 minutes for its six cards. It fails a card that does not open
  rather than measure the one left on screen.
- **Text shapes** (rule 99, 2026-09-30): a curve or a warp is `pgShape` on
  a text object, laid out again with the text (`tsSet`). Never build a curved
  line as a group of letters, and never let a layout pass move a line bound
  to its ring (`TS_RINGS`, `tsBindRings`, run at the head of `alignPass`).
- **Type voices and two faces** (rule 100): `applyVoice` sets the whole
  card's faces before the layout, each line keeping its footprint;
  `houseTwoFaces` sets two families on every classic, last at load and again
  when a table sets a face.
- **The palettes are twelve proven pairings** (rule 103, 2026-10-01):
  `PALETTES` in scripts/refresh_palettes.mjs, two hue families each, named
  for the two colours, never food or drink. `scripts/repalette_showcase.mjs`
  moves every library record onto them, colour only, and maps from each
  card's CURRENT colours: run it on records still in the old palettes, never
  twice. Then rethumb_showcase.mjs and verify_showcase.mjs, and bump
  ASSET_REV. (Two sessions answered the same request with 25 and with 12
  pairings; the twelve, the later answer, are the product.)
- **Every choice on every card** (rule 101): `node
  scripts/every_card_audit.mjs --write-holds` takes every offered card
  through every theme, look and voice on Easy Mode's render and writes
  assets/choice-holds.json. The studio turns a held chip off with its reason
  and keeps a card that fails as offered out of the lists. It takes hours in
  full; run it with `--ids a,b` on the cards a change touches (the table is
  updated for those cards only) and `--resume` to continue a stopped run. It
  loads the studio with `?nochoiceholds=1`.
- **The designer's guides and lock** (rule 107, 2026-10-02): the pink guides
  (`sgSnap`) and the lock to the middle (`pgCentreLock`, kept by `ccKeep`
  before every render and undo step) work on the parts `ccParts` finds. A
  pass that moves designer objects leaves a locked group to the keeper;
  never set `left` on one without its group.
- **What is under a line** is found by hiding its ink (`pgHideInk`), never
  the whole object: a line's backing is its ground.
- **A stack keeps one rhythm to its call to action** (rule 108, 2026-10-02):
  `pgStepRhythm`, last in the layout and again after `numberFill`, sets the
  Steps Flow cards one gap apart and one gap off the CTA plate (the rows
  move, the plate stays); `pgCtaStandOut` gives a plate in its rows' own
  neutral the card's accent. A pass that moves or resizes the steps or the
  number's plate after them must leave `node scripts/steps_rhythm_audit.mjs`
  passing.
- **The headline is the hero** (rule 109, 2026-10-03): judged by the letters
  it covers (30,000 px² on the 1080 square at least), never by font size
  alone. `node scripts/hero_headline.mjs --live` reports any live card under
  it; with `--write` it grows them, gated. Look at every card on a
  before-and-after before you show it.
- **The scripts:** a script that rewrites a showcase record passes its
  candidates through `gateRecords(page, pairs)` and writes only what
  `accept` keeps (see neutral_panels.mjs for the pattern). `live()` from the
  harness is the one live-card predicate.
- **Before a commit that touches the classics' passes or tables:**
  `node scripts/verify_showcase.mjs --classics --write` (writes
  assets/classics-gate.json; a classic that fails is not offered). The
  re-bake order is bake_contrast, number_block --classics --write,
  naturalize_classics --write, then verify. The contrast and the shade answer
  each other and number_block moves lines, so after a change that moves
  anything run bake_contrast and naturalize a second time before verify and
  audit_templates. The bakes take held classics too (`noholds=1`: a held
  classic that is never baked is held again for want of its fixes) and leave
  the offer family as authored.
- **Before a commit that touches assets/showcase:**
  `node scripts/verify_showcase.mjs --write` (exit 1 on any failure; it
  stamps legib / num / numInk / gate / blur / ground on the index). Then
  `rethumb_showcase.mjs` for the cards that changed, and bump `ASSET_REV`.
- **The pipeline order** is in OPEN-ITEMS §R. Passes undo each other when
  run out of order (refresh reads git HEAD; import restores the tone grade;
  naturalize then darken; support_highlights before neutral_panels; content
  audit after overlap; curate last).
- **The record of what is still inconsistent** is docs/COHESION-AUDIT.md.
  Read it before touching the classics' passes or the render paths.
