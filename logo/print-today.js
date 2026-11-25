/* ═══════════════════════════════════════════════════════════════════════════
   PRINT IT TODAY (DESIGN-LAW 167, continued, and 185): where to print a business card the same day near
   the customer, as map searches they open themselves. One copy, for the card maker (cards/) and the brand
   kit's card step (logo/): Apple Maps on an iPhone, iPad or Mac and in the iPhone app (where a
   maps.apple.com link opens the Maps app: ios/ NavigationPolicy.opensInSystemApp), Google Maps elsewhere,
   and a switch to the other that the device remembers.

   Apple Maps searches round the area's own point (the area dialog's lat and lon, or the ZIP and town
   tables for a place typed): words alone found T-shirt shops 50 miles off, the point found the town's print
   shops (iOS 27 simulator, 2026-11-24). Only chains whose own sites offer same-day business cards for store
   pickup are named (checked 2026-11-24: FedEx Office, Staples, Office Depot OfficeMax; The UPS Store's US
   pages promise no same day). Nothing is sent anywhere until the customer opens a link.

   Pure at the top (the function may import logo/pdf.js, which re-exports printLinks): the browser's parts
   are read only when called.
   ═══════════════════════════════════════════════════════════════════════════ */
export const CHAINS = ["FedEx Office", "Staples", "Office Depot OfficeMax"];
export const MAPS_NAME = { apple: "Apple Maps", google: "Google Maps" };
const ua = () => (typeof navigator !== "undefined" && navigator.userAgent) || "";
export const inIosApp = () => /\bWeBuyADApp\//.test(ua());
export const appleDevice = () => inIosApp() || /iPhone|iPad|iPod|Macintosh/.test(ua());
const MAPS_KEY = "pgfx_card_maps";
const box = () => { try { return typeof localStorage !== "undefined" ? localStorage : null; } catch (e) { return null; } };
const jget = (k, fb) => { try { const v = box() && box().getItem(k); return v == null ? fb : JSON.parse(v); } catch (e) { return fb; } };
const jset = (k, v) => { try { if (box()) box().setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } };
export function mapsChoice() { const m = jget(MAPS_KEY, null); return m === "apple" || m === "google" ? m : appleDevice() ? "apple" : "google"; }
export const setMapsChoice = m => jset(MAPS_KEY, m);

/** The searches: Apple Maps (the long-standing ?q= form every iOS reads) round a point when there is one
 *  (sll, spn), else "near" the place; Google Maps (the Maps URLs API) reads "same day … near 90802". */
export function printLinks(q, opt = {}) {
  const where = String(q || "").trim(), app = opt.maps === "apple" || opt.maps === "google" ? opt.maps : mapsChoice();
  const at = opt.at && Number.isFinite(opt.at.lat) && Number.isFinite(opt.at.lon) ? opt.at : null;
  const near = where ? " near " + where : "", label = s => s + near;
  if (app === "apple") {
    const url = s => "https://maps.apple.com/?q=" + encodeURIComponent(at ? s : s + near) + (at ? "&sll=" + at.lat.toFixed(4) + "," + at.lon.toFixed(4) + "&spn=0.2,0.2" : "");
    return [{ name: label("Business card printing"), url: url("business card printing"), main: true }].concat(CHAINS.map(c => ({ name: c, url: url(c) })));
  }
  const url = s => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(s + (near || " near me"));
  return [{ name: label("Same-day business card printing"), url: url("same day business card printing"), main: true }].concat(CHAINS.map(c => ({ name: c, url: url(c) })));
}

/** the studio's saved area (app.js resolveArea: the ZIP, the town, its point) */
export function savedArea() {
  const a = (jget("pgfx_brand", null) || {}).area || null;
  return { zip: a && a.zip || "", home: a && a.home || "", at: a && Number.isFinite(a.lat) && Number.isFinite(a.lon) ? { lat: a.lat, lon: a.lon } : null };
}
export const placeLike = q => /^\d{5}$/.test(q) || /^[^\d]{3,}$/.test(q);   // a whole ZIP or a town's name, not a ZIP half typed
export function savedPoint(text, area = savedArea()) {
  const low = String(text || "").trim().toLowerCase();
  return low && area.at && [area.zip, area.home, String(area.home || "").split(",")[0]].some(s => s && String(s).trim().toLowerCase() === low) ? area.at : null;
}
const GEO = {};
const geoFetch = (k, f) => GEO[k] || (GEO[k] = fetch(new URL("../assets/geo/" + f, import.meta.url)).then(r => r.ok ? r.json() : null).catch(() => null));
/** a place's point: the saved area's, else the area dialog's own ZIP and town tables (fetched only now) */
export async function pointOf(text, area = savedArea()) {
  const t = String(text || "").trim(), low = t.toLowerCase();
  if (!t) return null;
  const s = savedPoint(t, area); if (s) return s;
  const z = t.match(/^\d{5}$/);
  if (z) { const zips = await geoFetch("zips", "us-zips.json"), p = zips && zips[z[0]]; return p ? { lat: p[0], lon: p[1] } : null; }
  const m = low.match(/^(.*?)(?:[,\s]+([a-z]{2}))?$/), name = (m && m[1] || low).trim(), st = m && m[2] ? m[2].toUpperCase() : null;
  const places = ((await geoFetch("places", "us-places.json")) || {}).places || [];
  const hit = places.filter(p => p[0].toLowerCase() === name && (!st || p[1] === st)).sort((a, b) => b[4] - a[4])[0];   // the largest town of that name
  return hit ? { lat: hit[2], lon: hit[3] } : null;
}

/** Wire a page's Print it today: the Near box, the links, the line saying which maps they open, and the
 *  switch. Returns draw(), for a page that changes the Near box itself. */
export function mountPrint({ input, links, mapsName, switchBtn, linkClass = "pt-link", esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch])) }) {
  let maps = mapsChoice(), n = 0;
  const area = savedArea();
  async function draw() {
    const run = ++n, q = input.value.trim();
    const paint = at => {
      links.innerHTML = printLinks(q, { maps, at }).map(l => `<a class="${linkClass}${l.main ? " main" : ""}" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.name)}<span aria-hidden="true">↗</span></a>`).join("");
      if (mapsName) mapsName.textContent = MAPS_NAME[maps];
      if (switchBtn) switchBtn.textContent = "Use " + MAPS_NAME[maps === "apple" ? "google" : "apple"] + " instead";
    };
    const saved = maps === "apple" ? savedPoint(q, area) : null;
    paint(saved);
    if (saved || maps !== "apple" || !placeLike(q)) return;
    await new Promise(r => setTimeout(r, 350));   // a typed place is looked up once the typing pauses
    if (run !== n) return;
    const at = await pointOf(q, area);
    if (run === n && at) paint(at);
  }
  input.addEventListener("input", draw);
  if (switchBtn) switchBtn.addEventListener("click", () => { maps = maps === "apple" ? "google" : "apple"; setMapsChoice(maps); draw(); });
  draw();
  return { draw, maps: () => maps };
}
