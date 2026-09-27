#!/usr/bin/env bash
# ┌──────────────────────────────────────────────────────────────────────────┐
# │ SUPERSEDED 2026-09-01 by scripts/converge_themes.mjs                      │
# │                                                                          │
# │ This loop cannot converge, and the comment below explains why without    │
# │ noticing: it re-runs bake_contrast.mjs, which loads the page with        │
# │ ?nofix=1 precisely so it measures the UNREPAIRED state. Every round      │
# │ therefore measures the same page and writes the same table. "Bake ->     │
# │ reload -> bake again" describes something the scripts do not do.         │
# │                                                                          │
# │ converge_themes.mjs loads the app WITH the table applied, measures what  │
# │ actually rendered, and derives the next ink from each layer's own        │
# │ actual/predicted ratio. That one converges because each round sees the   │
# │ result of the last.                                                      │
# └──────────────────────────────────────────────────────────────────────────┘
#
# Converge the measured contrast table.
#
# One bake cannot finish the job: the table repairs the ink, which changes what
# the next measurement sees. Bake -> reload (the app applies the new table) ->
# bake again, and the residual shrinks each round until it stops moving.
#
# Stops when the audit's critical count stops improving, or after 5 rounds.
# Every number printed comes from a real render.
set -u
cd "$(dirname "$0")/.."

prev=99999
for i in 1 2 3 4 5; do
  echo "── round $i ───────────────────────────────"
  node scripts/bake_contrast.mjs 2>&1 | head -2
  node scripts/legibility_audit.mjs > /tmp/gfx_legib_round.txt 2>&1
  crit=$(grep -o 'headline/phone/cta: *[0-9]*' /tmp/gfx_legib_round.txt | grep -o '[0-9]*$')
  wcag=$(grep -o 'below WCAG for their size: *[0-9]*' /tmp/gfx_legib_round.txt | grep -o '[0-9]*$')
  echo "   critical (headline/phone/cta): ${crit:-?}   all-WCAG: ${wcag:-?}"
  if [ -z "${crit:-}" ]; then echo "   audit produced no number — stopping"; break; fi
  if [ "$crit" -ge "$prev" ]; then
    echo "   no further improvement ($crit >= $prev) — converged"
    break
  fi
  prev=$crit
done

echo
echo "final:"
head -4 /tmp/gfx_legib_round.txt
