# iPhones.LA Social Studio

`/social/` is the shop's internal version of Graphics Studio and Video Ads.
It requires the existing Studio admin account on a deployed site. It has no
entry in the customer navigation and uses no consumer-app code.

Five kinds of post have editable starting points: inventory, selling to us,
helpful information, seasonal content, and shop updates. The same draft makes
a JPG and a six- or eight-second video in Story, Feed, or Square format.
The phone number is the shop's existing `(562) 999-4994`; the call to action
must retain `iPhones.LA`.

The renderer and encoder are the existing `motion/` modules. The business
adapter selects three looks and preserves an uploaded item's full photograph
instead of inventing its unseen front or removing its background. Inventory
downloads require that photograph. General campaigns use existing catalogue
device artwork, which is illustrative and does not claim available inventory.
The video uses generated music with voiceover disabled, so an informational
post cannot inherit a canned buying offer.

Story compositions keep clear of the platform overlays. Every build runs the
shared attention audit and layout checks; failed copy and contrast checks
block downloads. The UI uses the same preview as the export. Review the
actual picture: an attention score is not a verification of inventory facts.

Drafts, including their photos, are saved in a separate IndexedDB database in
the current browser. JSON recipes contain words and design choices only.
Loading an imported inventory recipe requires attaching its photo again.
“Relevant until” uses the shop's Los Angeles date and blocks an old draft's
download; it is a reminder, not a posting schedule.

Downloads do not enter the WE BUY library, shared feed or story queue. This
page deliberately omits `iphonesla-link.js` and `ad-library.js`, whose existing
hooks could send a seasonal graphic to a marketplace. The business owner
downloads the media and copies the caption for manual social posting.
Extending the story publisher to scheduled custom JPG/MP4 campaigns remains
separate work; the current inventory publisher is unchanged.

## Run and check

Serve the repo with a static server, then open
`http://127.0.0.1:8916/social/?preview=1`. That explicit preview switch works
only on localhost/127.0.0.1. It is never an account bypass on a deployed host.
Normal deployment uses the existing `/api/me`, `/export/check` and `/export`
account checks; customer plan rules are unchanged.

`node scripts/social_studio_check.mjs` checks draft validation and dates.
With `STUDIO_BROWSER=1` it checks the actual browser workflow, including
saved photos, late uploads, access roles, JPG download and mobile width.
`PLAYWRIGHT_MODULE` may point to an installed Playwright module; `GFX_BASE`
and `CHROME` override the local server and browser paths. `STUDIO_VIDEO=1`
also exercises the real video download. `SOCIAL_SCREENSHOT` and
`SOCIAL_VIDEO` optionally retain the test artifacts.
