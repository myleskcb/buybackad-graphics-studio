#!/bin/bash
# Archive WeBuy.AD for iPhone, sign it for the App Store and, with --upload, send it
# to App Store Connect (TestFlight). Run on a Mac whose Xcode is signed in to the
# developer account, with ios/Config/Local.xcconfig naming the team.
#
#   ios/release.sh 1            # build number 1: archive and export an .ipa
#   ios/release.sh 1 --upload   # the same, then upload it
#
# The iPhones LA app's script (iphoneslainv ios/release.sh, 2026-11-18), for the
# same team: it has no registered iPhone, so Xcode cannot make the development
# profile an archive is normally signed with, and its App Store certificate is
# cloud-managed. So the app is archived unsigned, given an ad-hoc signature, and
# Xcode's export signs it for the App Store in the cloud. WeBuy.AD has no
# capabilities (no Sign in with Apple, push or app links), so the check is only
# that the package is the team's app and signed for distribution.
# The App Store Connect record for ad.webuy.app must exist before an upload.
set -euo pipefail

BUILD="${1:-}"
UPLOAD="${2:-}"
if ! [[ "$BUILD" =~ ^[0-9]+$ ]]; then
  echo "Usage: ios/release.sh <build number> [--upload]" >&2
  exit 2
fi
HERE="$(cd "$(dirname "$0")" && pwd)"
TEAM="$(sed -nE 's/^DEVELOPMENT_TEAM *= *([A-Z0-9]{10}).*/\1/p' "$HERE/Config/Local.xcconfig" 2>/dev/null | head -1)"
if [ -z "$TEAM" ]; then
  echo "Copy ios/Config/Local.example.xcconfig to Local.xcconfig first (see ios/README.md)." >&2
  exit 2
fi
BUNDLE="$(sed -nE 's/^PRODUCT_BUNDLE_IDENTIFIER *= *([^ ]+).*/\1/p' "$HERE/Config/Release.xcconfig" | head -1)"
OUT="${RELEASE_DIR:-$HOME/Library/Developer/WeBuyAD-releases}/build-$BUILD"
rm -rf "$OUT" && mkdir -p "$OUT"
ARCHIVE="$OUT/WeBuyAD.xcarchive"

echo "Archiving build $BUILD for $BUNDLE (team $TEAM) into $OUT"
xcodebuild -project "$HERE/WeBuyAD.xcodeproj" -scheme WeBuyAD -configuration Release \
  -destination 'generic/platform=iOS' -derivedDataPath "$OUT/dd" -archivePath "$ARCHIVE" \
  CURRENT_PROJECT_VERSION="$BUILD" CODE_SIGNING_ALLOWED=NO archive > "$OUT/archive.log" 2>&1 \
  || { tail -30 "$OUT/archive.log"; exit 1; }

ENT="$OUT/entitlements.plist"
cp "$HERE/WeBuyAD/WeBuyAD.entitlements" "$ENT"
plutil -convert xml1 "$ENT"
PB=/usr/libexec/PlistBuddy
"$PB" -c "Add :application-identifier string $TEAM.$BUNDLE" "$ENT"
"$PB" -c "Add :com.apple.developer.team-identifier string $TEAM" "$ENT"
"$PB" -c "Add :get-task-allow bool false" "$ENT"
codesign --force --sign - --entitlements "$ENT" --timestamp=none \
  "$ARCHIVE/Products/Applications/WeBuyAD.app"

options() {
  cat > "$OUT/$1.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>method</key><string>app-store-connect</string>
<key>destination</key><string>$1</string>
<key>teamID</key><string>$TEAM</string>
<key>signingStyle</key><string>automatic</string>
<key>uploadSymbols</key><true/>
<key>manageAppVersionAndBuildNumber</key><false/>
</dict></plist>
PLIST
}

options export
xcodebuild -exportArchive -archivePath "$ARCHIVE" -exportPath "$OUT/export" \
  -exportOptionsPlist "$OUT/export.plist" -allowProvisioningUpdates > "$OUT/export.log" 2>&1 \
  || { tail -30 "$OUT/export.log"; exit 1; }

mkdir -p "$OUT/ipa" && (cd "$OUT/ipa" && unzip -q ../export/WeBuyAD.ipa)
APP="$OUT/ipa/Payload/WeBuyAD.app"
codesign --verify --deep --strict "$APP"
SIGNED="$(codesign -d --entitlements :- "$APP" 2>/dev/null)"
grep -q "$TEAM.$BUNDLE" <<<"$SIGNED" || { echo "The signed app is not $TEAM.$BUNDLE. Not uploading." >&2; exit 1; }
WHO="$(codesign -dvv "$APP" 2>&1 || true)"
grep -q '^Authority=Apple Distribution' <<<"$WHO" \
  || { echo "The app is not signed for the App Store. Not uploading." >&2; exit 1; }
if strings "$APP/WeBuyAD" | grep -q "WEBUY_TEST_JS\|WEBUY_START_URL"; then
  echo "The release binary carries the Debug test hooks. Not uploading." >&2; exit 1
fi
echo "Signed for the App Store: $OUT/export/WeBuyAD.ipa"

if [ "$UPLOAD" = "--upload" ]; then
  options upload
  xcodebuild -exportArchive -archivePath "$ARCHIVE" -exportPath "$OUT/upload" \
    -exportOptionsPlist "$OUT/upload.plist" -allowProvisioningUpdates > "$OUT/upload.log" 2>&1 \
    || { tail -30 "$OUT/upload.log"; exit 1; }
  grep -q 'Upload succeeded' "$OUT/upload.log" && echo "Uploaded build $BUILD. Apple processes it for TestFlight in about 5 to 30 minutes."
fi
