#!/bin/sh
# Draws WeBuy.AD's brand pictures from the HTML beside this file, the way
# reselling.us draws its own (resale-app docs/brand): the app icon at 1024 and the
# sizes the pages ask for, the favicon as the tag alone, the iPhone app's icon, the wordmark on dark and on light, and the link
# preview (og:image) as a JPEG under 300 KB (WhatsApp shows no preview above it).
#   sh tools/brand/make.sh
# Needs Playwright's headless shell (~/Library/Caches/ms-playwright) and macOS's sips.
set -eu
here="$(cd "$(dirname "$0")" && pwd)"
out="$here/../../assets/brand"
mkdir -p "$out"
shell="$(ls -d "$HOME"/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-*/chrome-headless-shell | tail -1)"
tmp="$(mktemp -d)"
shot() { # url w h out
  "$shell" --headless --hide-scrollbars --force-device-scale-factor=1 --window-size="$2,$3" \
    --allow-file-access-from-files --virtual-time-budget=3000 --default-background-color=00000000 \
    --screenshot="$4" "$1" >/dev/null 2>&1
}
shot "file://$here/icon.html" 1024 1024 "$out/icon-1024.png"
for s in 512 192 180; do sips -z "$s" "$s" "$out/icon-1024.png" --out "$out/icon-$s.png" >/dev/null; done
# the favicon is the tag alone: the word stops reading under about 40 px
shot "file://$here/icon.html?tag" 1024 1024 "$tmp/tag.png"
sips -z 32 32 "$tmp/tag.png" --out "$out/icon-32.png" >/dev/null
# the iPhone app's icon: the same picture, flattened (App Store Connect refuses an alpha channel)
sips -s format jpeg "$out/icon-1024.png" --out "$tmp/flat.jpg" >/dev/null
sips -s format png "$tmp/flat.jpg" --out "$here/../../ios/WeBuyAD/Assets.xcassets/AppIcon.appiconset/AppIcon.png" >/dev/null
shot "file://$here/wordmark.html" 1240 260 "$tmp/wl.png"
shot "file://$here/wordmark.html?on=dark" 1240 260 "$tmp/wd.png"
cp "$tmp/wl.png" "$out/wordmark-on-light.png"; cp "$tmp/wd.png" "$out/wordmark-on-dark.png"
shot "file://$here/share-card.html" 1200 630 "$tmp/card.png"
sips -s format jpeg -s formatOptions 86 "$tmp/card.png" --out "$out/share-card.jpg" >/dev/null
rm -rf "$tmp"
ls -l "$out"
