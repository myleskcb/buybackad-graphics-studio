# WeBuy.AD for iPhone

The studio at https://webuy.ad in a native iPhone shell, made 2026-11-19 (owner:
"now that the iPhones LA app is out we need to make the we buy. ad app",
"ASAP", "ship this and make it usable SAAS"). It follows the iPhones LA app's
shell (iphoneslainv `ios/`), without its native sign-in and push: the studio
signs in with email in the page.

## What the app adds to the website

- **A made ad or video goes to the iOS share sheet.** The page's Download is an
  `<a download>` on a blob or a data URL; the shell takes it as a `WKDownload`
  and opens the share sheet, where Save Image (or Save Video) puts it in
  Photos, or Instagram, Messages, Mail and AirDrop take it. Checked in the
  simulator on 2026-11-19: Download, the sheet ("neon-vault-ad-1080, PNG
  Image, 1.6 MB"), Allow, and the ad in Photos.
- **Payments in Safari.** A plan or credit pack is paid on Stripe's own page
  in Safari, and Manage billing opens there too (`NavigationPolicy.payment`).
  Apple lets a US app send customers to pay on the web (guideline 3.1.1(a),
  since May 2025) but not take a subscription's card in the app, so the page
  never mounts Stripe's form in the app (`app.js` `IN_IOS_APP`: the shell adds
  `WeBuyADApp/1.0` to the user agent). Coming back to the app confirms the
  payment from Stripe's record of the session (`resumeAppCheckout`).
  **Distribute in the United States storefront only** until the app offers
  Apple's in-app purchase or the external purchase link entitlement elsewhere.
- **Delete account** in the account menu (guideline 5.1.1(v)): it cancels a
  paid plan at Stripe first, then deletes the saved ads, the AI pictures and
  the account (`/api/account/delete`, `scripts/billing_check.mjs`).
- Our reading pages (terms, privacy, about) open in a Safari sheet over the
  studio; Phone, Messages and Mail open their apps; iOS alerts for the page's
  confirm and prompt; the camera, the photo library and location for the
  ad's pictures and area; a screen with Try again when the connection is gone;
  the launch screen in the site's ground (#f2f4f8 light, #070d1c dark).

## Build and run

```sh
python3 ios/generate_project.py      # after adding a Swift source, or a new icon
xcodebuild -project ios/WeBuyAD.xcodeproj -scheme WeBuyAD -configuration Debug \
  -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 17' \
  -derivedDataPath ios/build CODE_SIGNING_ALLOWED=NO build
```

A Debug build can start on a local copy of the site in demo mode, and run one
script on its first page, for testing without a real account:

```sh
SIMCTL_CHILD_WEBUY_START_URL="http://127.0.0.1:8898/?demo=1" \
SIMCTL_CHILD_WEBUY_TEST_JS='…' xcrun simctl launch booted ad.webuy.app
```

A Release build has neither (`release.sh` refuses a binary that does).

## Releasing

- Team `9Y5UV74466` (the iPhones LA app's), bundle ID `ad.webuy.app`.
- **Before the first upload, the owner** (signed in at
  https://appstoreconnect.apple.com): Apps, +, New App: iOS, name
  "WeBuy.AD" (a fallback such as "WeBuy.AD Ad Maker" if the name is taken),
  primary language English (U.S.), bundle ID `ad.webuy.app` (register it
  first under Certificates, Identifiers & Profiles, Identifiers, if the list
  does not offer it), SKU `webuyad-ios`. Availability: United States only.
- Then `ios/release.sh 1 --upload` on this Mac (Xcode signed in to the
  account). Each later build: a higher number.
- App Privacy answers (App Store Connect): Email Address, Photos or Videos,
  Purchase History; all linked to the user, for App Functionality, not
  tracking (`WeBuyAD/PrivacyInfo.xcprivacy`).
- App Review notes: a demo account (email and password) on webuy.ad, made
  for the reviewer; that payments open Stripe in Safari (US storefront,
  3.1.1(a)); and where Delete account is (the account menu).
