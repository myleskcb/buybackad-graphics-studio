#!/bin/sh
# Freeze the video ad maker as it stood at one commit, as a batch the review page can draw.
#   admin-ads/tools/freeze-batch.sh <git-ref> <batch-id> "<label>"
# Copies motion/{engine,catalog,decor,audio}.js from that ref into admin-ads/batches/<id>/
# and adds the batch to admin-ads/batches/index.json. Then run scan.mjs to score it.
set -e
ref="$1"; id="$2"; label="$3"
[ -n "$ref" ] && [ -n "$id" ] && [ -n "$label" ] || { echo "usage: $0 <git-ref> <batch-id> \"<label>\"" >&2; exit 1; }
root=$(git rev-parse --show-toplevel); dir="$root/admin-ads/batches/$id"
mkdir -p "$dir"
for f in engine catalog decor audio; do
  if git cat-file -e "$ref:motion/$f.js" 2>/dev/null; then git show "$ref:motion/$f.js" > "$dir/$f.js"; fi
done
commit=$(git rev-parse --short "$ref"); date=$(git log -1 --format=%ad --date=short "$ref"); subject=$(git log -1 --format=%s "$ref")
node -e '
const fs = require("fs"), [file, id, label, commit, date, subject] = process.argv.slice(1);
const idx = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : { batches: [] };
idx.batches = idx.batches.filter(b => b.id !== id);
idx.batches.push({ id, label, commit, date, subject });
idx.batches.sort((a, b) => a.date.localeCompare(b.date) || 0);
fs.writeFileSync(file, JSON.stringify(idx, null, 2) + "\n");
' "$root/admin-ads/batches/index.json" "$id" "$label" "$commit" "$date" "$subject"
echo "froze $commit as $id"
