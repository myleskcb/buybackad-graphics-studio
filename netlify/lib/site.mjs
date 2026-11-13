/**
 * The site's one public address and the one address customers write to
 * (2026-11-12). Every canonical link, Open Graph link, structured-data URL,
 * sitemap entry and the robots.txt Sitemap line names SITE_ORIGIN, and every
 * "write to us" names SUPPORT_EMAIL.
 *
 * To move the site (buyback.ad, once it is registered and attached to the
 * Netlify project): change SITE_ORIGIN here, then
 *     node scripts/site_address.mjs          rewrites every page to it
 *     node scripts/site_address.mjs --check  fails while a page names another
 * scripts/build_seo_pages.mjs reads SITE_ORIGIN too, so a rebuilt ads/ page
 * agrees.
 *
 * Why it moved off buybackad-graphics-studio.netlify.app: that project serves
 * a build from before 2026-10-08 (Pro at $15, its own separate accounts), while
 * buybackad-finished-copy.netlify.app serves main with billing on
 * (docs/FLOW-AUDIT-2026-11-11.md, finding 1). A search result or a shared link
 * sent customers to a price the checkout does not honour.
 *
 * Not secret: this folder is 404'd at the edge (netlify.toml) only because it
 * is the server's code, and the function imports this file.
 */
export const SITE_ORIGIN = 'https://buybackad-finished-copy.netlify.app';

/** Shared with Reselling.US (one company, iPhones LA LLC). reselling.us's mail
 *  is Namecheap forwarding: this alias must exist there to receive anything. */
export const SUPPORT_EMAIL = 'support@reselling.us';

/** Every address the site has been published under. scripts/site_address.mjs
 *  rewrites any of them (other than SITE_ORIGIN) in a page. */
export const PAST_ORIGINS = [
  'https://buybackad-graphics-studio.netlify.app',
  'https://buybackad-finished-copy.netlify.app',
  'https://buyback.ad',
  'https://www.buyback.ad',
];
