# Session prompts

Copy-paste starters for a fresh Claude session on this project. Each one is
self-contained — it assumes the model has no memory of previous sessions.

---

## 1. The main study-session prompt

Use this to continue the design-education program. This is the one you want
most mornings.

```text
You are continuing an ongoing graphic-design study program on a real product.

PROJECT
Graphics Studio by BUYBACK.AD — a browser ad builder for phone buyers and
resellers. Working copy: ~/Downloads/gfxv23. Repo:
myleskcb/buybackad-graphics-studio. Live at
https://buybackad-graphics-studio.netlify.app.

This is a paid product ($15/mo Pro), not a toy. Hold every change to that
standard.

READ FIRST, IN THIS ORDER
1. AGENT-BRIEF.md          — landmines, deploy process, domain state
2. DESIGN-LAW.md           — 43 numbered rules, the authority on all design
3. docs/SESSION-PROTOCOL.md — how to run a session, incl. the 99% pause rule
4. The LAST THREE entries of docs/LEARNING-LOG.md — where we left off

Do not read the whole learning log. Do not re-derive anything the log records
as settled.

THE STANDARD
DESIGN-LAW was built by measuring the real 243-template library, not by quoting
textbooks. Rule 34: never model a blend, measure it. Rule 37: state no number
you can count. Rule 14: colour theory selects FROM a vocabulary observed in
real reference ads; it does not invent one.

So: a rule that cannot be checked with code against the library is not
finished. Do not state a colour, contrast or count you have not computed. When
something has "already been audited", ask what that audit could not have seen —
the most valuable finding so far came from changing the question, not from
looking harder.

THE BUSINESS CONSTRAINT
These ads must stop a scroll in a hostile feed, so restrained cannot mean
quiet. But they also say "give a stranger your phone and they will hand you
cash", so trust is the conversion and anything reading as a scam costs money.
Both are satisfied the same way: attention comes from contrast and scale, not
from saturation.

HARD RULES
- Never hand-splice app.js between two anchors. Replace a named function by
  locating its own opening and closing, or append. See DESIGN-LAW rule 42: a
  spliced range silently deleted enrichFills(), every later pass aborted, and
  the page still rendered 243/243 reporting no errors.
- Append to DESIGN-LAW.md. Never splice it.
- Verify by rendering, never by reading source and reasoning about it.
- Draft-deploy and look before --prod.
- Commit and push before the session ends. Always.
- Do not change DNS, Stripe, or plan limits unattended.

PAUSE AT 99%
At 99% of the session limit: stop starting new work, finish or cleanly abandon
the write in flight, commit what is green, push, then append a LEARNING-LOG
entry ending in a RESUME HERE line naming the exact next action. Say clearly
that you are pausing. A session that dies mid-edit in app.js leaves it silently
broken.

NOW
Pick up from the RESUME HERE line in the most recent log entry and continue.
Tell me what you are working on before you start.
```

---

## 2. Field-research session

Use when the next step is studying real competitor ads.

```text
Read AGENT-BRIEF.md, DESIGN-LAW.md and docs/FIELD-RESEARCH.md in
~/Downloads/gfxv23 first.

Task: run a field-research pass on real "we buy phones" ads, following the
method in docs/FIELD-RESEARCH.md exactly — including its legal limits. Study
and measure; never copy. No scrapers against Facebook Marketplace or OfferUp.
Record design attributes, never strangers' phone numbers or faces.

I specifically need the hue vocabulary actually in use in this niche, per
platform, and the variable that separates an ad reading as a legitimate
business from one reading as a scam. DESIGN-LAW rule 14 requires that any
replacement colour come from an observed vocabulary, and two themes are
currently blocked on exactly that:

  Crimson x Mint      5.26 normal -> 3.84 under deuteranopia
  Royal x Tangerine   4.58 normal -> 4.15 under protanopia

Score ads blind before analysing. Include the bad ones — selecting only ads
that already agree with DESIGN-LAW would confirm it rather than test it.

Deliverable: a findings file with the scored table, the correlations found, and
any proposed rule stated in the same form as the existing 43 — what the rule
is, what was measured, what it rejected, and where it is enforced in code.
```

---

## 3. Extend the CVD audit to all 243 templates

The current audit only covers the ten authored theme decks.

```text
Read AGENT-BRIEF.md, DESIGN-LAW.md rule 43, and scripts/cvd_audit.py in
~/Downloads/gfxv23.

Task: extend the colour-vision-deficiency audit from the ten theme decks to all
243 rendered templates.

Critical: reuse the EXISTING glyph-masked sampler in app.js. Do not write a new
one. Bounding-box sampling is a known false-positive trap — bandKnockout
measures 1.21:1 by bounding box and 12.06:1 glyph-masked, and the bbox number
would have "fixed" four perfectly good templates into unreadable ones. Also,
gradient headlines have no props.fill; reading it blind yields undefined, which
parses to [0,0,0], so 82 gradient words measure as black. Use the mean of
grad.c1/grad.c2.

Simulate on LINEAR RGB via LMS, not on sRGB — same reason rule 40 puts colour
maths in a perceptual space.

Report the worst of {normal, protan, deutan, tritan} per template, not the
normal-vision number. Do not repaint anything: name the defects and stop. That
is a finished unit of work.
```

---

## 4. Quick check-in from a phone

For when you just want status.

```text
In ~/Downloads/gfxv23: show me git log --oneline -5, whether the working tree
is clean, the last RESUME HERE line in docs/LEARNING-LOG.md, and the output of
python3 scripts/cvd_audit.py. Then curl the live site and confirm / returns 200
and /docs/README.md returns 404. Summarise in under 150 words.
```

---

## Note on auto-loading

Prompt 1 tells the model which files to read. To skip that step entirely, copy
`AGENT-BRIEF.md` to `CLAUDE.md` in the repo root — Claude Code reads that
automatically at the start of every session in this directory, and the brief
becomes ambient context instead of something you have to ask for.
