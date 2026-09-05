#!/usr/bin/env bash
# THE ONLY ROAD TO PRODUCTION.
# Deploys used to be typed by hand, which means the gate could be forgotten.
# Now it cannot: the release gate runs first and a single refusal or pixel
# fault stops everything. 100% confidence, no less.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "· metrics + assets"
node tools/gfx/measure_fonts.mjs >/dev/null
node tools/gfx/build_assets.mjs

echo "· engine sweep (health, informational — the raw engine across every switch)"
node tools/gfx/sweep.mjs | head -3 || true

echo "· release gate — THE decision: renderClean() must find a clean card for every ask, and Chrome must agree"
if ! curl -sf -o /dev/null http://localhost:8899/assets/fonts/satoshi-700.woff2; then
  echo "  local server not running: python3 -m http.server 8899" >&2; exit 2
fi
node tools/gfx/gate.mjs "${GATE_SEEDS:-8}"

echo "· console"
BUILD_STAMP="$(date +%Y-%m-%d)" node scripts/build_console.mjs

if [ "${1:-}" = "--deploy" ]; then
  echo "· deploy"
  npx netlify deploy --prod --dir=. "${@:2}"
else
  echo "gate passed · run with --deploy to publish"
fi
