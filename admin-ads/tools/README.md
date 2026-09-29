# Ad review (temporary admin)

`/admin-ads/` shows the best video ads from every round of work on the maker,
how each round scored against the one before, and the recipe of every ad, with
stars, favourites, notes and a thumbs up or down per ingredient. Ratings stay in
the browser (localStorage) until exported from the My formula tab. The same tab
downloads suggested `WEIGHTS` for `motion/catalog.js` from the ratings.

Adding a round, e.g. when a new effects branch lands:

    admin-ads/tools/freeze-batch.sh <git-ref> <batch-id> "<label>"
    node admin-ads/tools/scan.mjs <batch-id>        # about 2 minutes for 15 categories

A round is `motion/{engine,catalog,decor,audio}.js` copied from that ref, so it
keeps drawing its own ads after the maker moves on. Every round is scored with
`admin-ads/audit.js`, a frozen copy of the audit, so scores stay comparable.

Removing it: delete `admin-ads/`, and its blocks in `netlify.toml`, `_headers`
and `robots.txt`. Nothing else links to it.
