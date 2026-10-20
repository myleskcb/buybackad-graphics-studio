/* Pure business rules, plus an optional real-browser workflow check.
   node scripts/social_studio_check.mjs
   STUDIO_BROWSER=1 PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node scripts/social_studio_check.mjs
   Start a static server on :8916 first for the browser check. */
import assert from "node:assert/strict";
import { PRESETS, newDraft, cleanDraft, validateDraft, shopDay } from "../social/presets.js";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const draft = newDraft();
for (const preset of PRESETS) {
  const initial = newDraft(preset.id);
  assert.deepEqual(cleanDraft(initial), initial, `Preset ${preset.id} must survive saving without changes`);
}
assert.deepEqual(validateDraft(draft, { day: "2026-10-20" }), []);
assert(validateDraft({ ...draft, category: "inventory" }).some(x => x.includes("actual item")));
assert.deepEqual(validateDraft({ ...draft, category: "inventory" }, { hasPhoto: true }), []);
assert(validateDraft({ ...draft, phone: "(555) 123-4567" }).some(x => x.includes("shop number")));
assert(validateDraft({ ...draft, expires: "2026-10-19" }, { day: "2026-10-20" }).length);
assert.deepEqual(validateDraft({ ...draft, expires: "2026-10-20" }, { day: "2026-10-20" }), []);
assert.equal(shopDay(new Date("2026-10-20T06:59:00Z")), "2026-10-19");
assert.equal(shopDay(new Date("2026-10-20T07:00:00Z")), "2026-10-20");
assert.throws(() => cleanDraft({ version: 99 }), /different format/);
const imported = cleanDraft({ ...draft, category: "__proto__", duration: 600, aspect: "bad", photo: "https://evil.invalid", headline: "A".repeat(300) });
assert.equal(imported.category, "selling");
assert.equal(imported.duration, 6);
assert.equal(imported.aspect, "9:16");
assert.equal(imported.headline.length, 60);
assert.equal(imported.photo, undefined);
const config = readFileSync(new URL("../social/config.js", import.meta.url), "utf8");
for (const [host, preview] of [["localhost", true], ["127.0.0.1", true], ["buybackad-graphics-studio.netlify.app", false], ["localhost.evil.invalid", false]]) {
  const c = { window: {}, location: { hostname: host, search: "?preview=1", href: `https://${host}/social/?preview=1` }, URL, URLSearchParams };
  vm.runInNewContext(config, c);
  assert.equal(c.window.IPLA_SOCIAL_PREVIEW, preview);
  assert.equal(c.window.PGFX_API, "/api");
}
console.log("Social draft validation, LA date boundaries and local-only preview checks passed.");

if (process.env.STUDIO_BROWSER === "1") {
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
  const browser = await chromium.launch({ executablePath: process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const errors = [];
    const writes = [];
    page.on("pageerror", e => errors.push(String(e)));
    page.on("request", r => { if (r.method() !== "GET") writes.push(r.url()); });
    const base = process.env.GFX_BASE || "http://127.0.0.1:8916";
    await page.goto(`${base}/social/`);
    await page.locator("#access").waitFor({ state: "visible" });
    assert(await page.locator("#workspace").isHidden());
    await page.goto(`${base}/social/?preview=1`);
    await page.locator("#workspace").waitFor({ state: "visible" });
    await page.waitForFunction(() => !document.querySelector("#download-jpg").disabled, { timeout: 60000 });
    assert.equal(await page.locator("#category option").count(), 5);
    await page.locator("#draft-name").fill("Test business draft");
    await page.locator("#save-draft").click();
    await page.waitForFunction(() => document.querySelector("#status").textContent.includes("Saved in this browser"));
    await page.reload();
    await page.locator("#workspace").waitFor({ state: "visible" });
    await page.locator("#drafts option", { hasText: "Test business draft" }).waitFor({ state: "attached" });
    await page.locator("#drafts").selectOption({ label: "Test business draft" });
    await page.locator("#load-draft").click();
    await page.waitForFunction(() => document.querySelector("#draft-name").value === "Test business draft");
    await page.locator("#category").selectOption("inventory");
    await page.waitForFunction(() => document.querySelector("#preview-note").textContent.includes("actual item"));
    assert(await page.locator("#download-jpg").isDisabled());
    const photo = await page.evaluate(async () => {
      const c = document.createElement("canvas"); c.width = 600; c.height = 600;
      const x = c.getContext("2d"); x.fillStyle = "#b43838"; x.fillRect(0, 0, 600, 600);
      x.fillStyle = "white"; x.font = "60px sans-serif"; x.fillText("TEST PHOTO", 80, 320);
      return c.toDataURL("image/png").split(",")[1];
    });
    await page.locator("#headline").fill("iPhone 16");
    await page.locator("#detail").fill("128 GB. See listing for details.");
    await page.locator("#photo").setInputFiles({ name: "test-item.png", mimeType: "image/png", buffer: Buffer.from(photo, "base64") });
    await page.waitForFunction(() => !document.querySelector("#download-jpg").disabled);
    await page.locator("#draft-name").fill("Actual item with photo");
    await page.locator("#save-draft").click();
    await page.waitForFunction(() => document.querySelector("#status").textContent.includes("Saved in this browser"));
    await page.locator("#remove-photo").click();
    await page.locator("#drafts").selectOption({ label: "Actual item with photo" });
    await page.locator("#load-draft").click();
    await page.waitForFunction(() => !document.querySelector("#download-jpg").disabled);
    assert.match(await page.locator("#photo-note").innerText(), /test-item/);
    await page.locator("#delete-draft").click();
    await page.getByRole("button", { name: "Undo delete" }).waitFor({ state: "visible" });
    assert.equal(await page.locator("#drafts option", { hasText: "Actual item with photo" }).count(), 0);
    await page.getByRole("button", { name: "Undo delete" }).click();
    await page.waitForFunction(() => document.querySelector("#status").textContent.includes("Draft restored"));
    await page.locator("#load-draft").click();
    await page.waitForFunction(() => !document.querySelector("#download-jpg").disabled);
    assert.match(await page.locator("#photo-note").innerText(), /test-item/);
    // A late image decoder must not attach yesterday's selection to a new post.
    await page.evaluate(() => {
      const original = window.createImageBitmap;
      window.createImageBitmap = async (...args) => {
        await new Promise(resolve => { window.releasePhotoDecode = resolve; });
        return original(...args);
      };
    });
    await page.locator("#photo").setInputFiles({ name: "late-photo.png", mimeType: "image/png", buffer: Buffer.from(photo, "base64") });
    await page.waitForFunction(() => typeof window.releasePhotoDecode === "function");
    await page.locator("#category").selectOption("selling");
    await page.evaluate(() => window.releasePhotoDecode());
    await page.waitForFunction(() => !document.querySelector("#download-jpg").disabled, { timeout: 60000 });
    assert(!/late-photo/.test(await page.locator("#photo-note").innerText()));
    const event = page.waitForEvent("download");
    await page.locator("#download-jpg").click();
    const file = await event;
    assert(file.suggestedFilename().endsWith(".jpg"));
    await page.waitForFunction(() => document.querySelector("#status").textContent.includes("Graphic ready"));
    if (process.env.STUDIO_VIDEO === "1") {
      const videoEvent = page.waitForEvent("download", { timeout: 120000 });
      await page.locator("#download-video").click();
      const video = await videoEvent;
      assert(/\.(mp4|webm)$/.test(video.suggestedFilename()));
      if (process.env.SOCIAL_VIDEO) await video.saveAs(process.env.SOCIAL_VIDEO);
      await page.waitForFunction(() => document.querySelector("#status").textContent.includes("Video ready"));
      assert.equal(await page.locator("#downloads a").count(), 2);
    }
    if (process.env.SOCIAL_SCREENSHOT) await page.screenshot({ path: process.env.SOCIAL_SCREENSHOT, fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
    assert.deepEqual(writes, [], "Preview must never save to a remote library or posting feed");
    const gated = await browser.newContext();
    await gated.addInitScript(() => localStorage.setItem("pgfx_token", JSON.stringify("test-session-only")));
    const gatePage = await gated.newPage();
    await gatePage.route("**/api/me", r => r.fulfill({ json: { user: { role: "user", plan: "business" } } }));
    await gatePage.goto(`${base}/social/`);
    await gatePage.waitForFunction(() => document.querySelector("#access-note").textContent.includes("admin"));
    assert(await gatePage.locator("#workspace").isHidden(), "Paying consumer accounts must not gain the business workspace");
    await gatePage.unroute("**/api/me");
    await gatePage.route("**/api/me", r => r.fulfill({ json: { user: { role: "admin", plan: "business" } } }));
    await gatePage.reload();
    await gatePage.locator("#workspace").waitFor({ state: "visible" });
    // Cross-tab sign-out must hide the workspace and invalidate an older /me response.
    await gatePage.unroute("**/api/me");
    let releaseMe, meFinished;
    const heldMe = new Promise(resolve => { meFinished = resolve; });
    await gatePage.route("**/api/me", async r => {
      await new Promise(resolve => { releaseMe = resolve; });
      await r.fulfill({ json: { user: { role: "admin", plan: "business" } } });
      meFinished();
    });
    await gatePage.reload();
    await gatePage.waitForFunction(() => document.readyState === "complete");
    assert(releaseMe, "The delayed account check must have started");
    await gatePage.evaluate(() => {
      localStorage.removeItem("pgfx_token");
      window.dispatchEvent(new StorageEvent("storage", { key: "pgfx_token", newValue: null }));
    });
    await gatePage.waitForFunction(() => document.querySelector("#access-note").textContent.includes("admin"));
    releaseMe();
    await heldMe;
    await gatePage.waitForFunction(() => document.querySelector("#workspace").hidden);
    assert(await gatePage.locator("#workspace").isHidden(), "A stale admin response must not reopen a signed-out workspace");
    console.log("Browser access and sign-out, draft/photo persistence, stale-upload guard, inventory guard, downloads and mobile layout passed.");
  } finally { await browser.close(); }
}
