import { CATEGORIES, PRESETS, newDraft, cleanDraft, validateDraft } from "./presets.js";
import { listDrafts, getDraft, saveDraft, deleteDraft } from "./drafts.js";
import { createRenderer } from "./media.js";

const $ = id => document.getElementById(id);
const fields = ["headline", "detail", "cta", "phone", "caption", "aspect", "look", "duration", "expires"];
const state = { draft: newDraft(), photo: null, renderer: null, report: null, revision: 0, drawn: -1,
  mode: "graphic", allowed: false, busy: false, photoPending: false, started: false, renderChain: Promise.resolve(), links: [] };
let timer, t0 = performance.now(), lastPhoto, frame, photoRead = 0, accessRevision = 0;
const note = text => { $("status").textContent = text; };

function revokeDownloads() {
  state.links.forEach(url => URL.revokeObjectURL(url));
  state.links = [];
  $("downloads")?.replaceChildren();
}
function download(blob, name, label) {
  let box = $("downloads");
  if (!box) {
    box = document.createElement("div"); box.id = "downloads"; box.className = "download-results";
    $("status").insertAdjacentElement("afterend", box);
  }
  const url = URL.createObjectURL(blob);
  state.links.push(url);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.textContent = label;
  box.appendChild(a);
  return a;
}
function filename(ext, draft = state.draft) {
  const name = (draft.name || "social-ad").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 55);
  return `iphonesla-${name || "social-ad"}-${draft.aspect.replace(":", "x")}.${ext}`;
}
function readForm() {
  const out = { ...state.draft, category: $("category").value, preset: $("preset").value, name: $("draft-name").value };
  fields.forEach(key => { out[key] = key === "duration" ? Number($(key).value) : $(key).value; });
  state.draft = cleanDraft(out);
}
function fillPresets() {
  $("preset").replaceChildren(...PRESETS.filter(p => p.category === state.draft.category).map(p => new Option(p.name, p.id)));
  $("preset").value = state.draft.preset;
}
function fillForm() {
  $("category").value = state.draft.category;
  fillPresets();
  fields.forEach(key => { $(key).value = state.draft[key]; });
  $("draft-name").value = state.draft.name;
  $("photo").value = "";
  $("photo-note").textContent = state.photo ? `Photo attached: ${state.photo.name || "saved item photo"}.` :
    state.draft.category === "inventory" ? "Add the actual item photo to download this ad." : "Optional: use your own photo in place of the device artwork.";
}
function blockers() {
  return [...validateDraft(state.draft, { hasPhoto: !!state.photo }), ...(state.report?.blockers || [])];
}
function syncButtons() {
  const ready = state.allowed && !state.busy && !state.photoPending && state.drawn === state.revision && !blockers().length;
  $("download-jpg").disabled = !ready;
  $("download-video").disabled = !ready;
  $("remove-photo").disabled = state.busy || !state.photo;
  $("copy-caption").disabled = state.busy || !state.draft.caption;
  $("save-draft").disabled = state.busy || state.photoPending;
}
function displayReport() {
  const reasons = blockers();
  const warnings = state.report?.warnings || [];
  const preset = PRESETS.find(p => p.id === state.draft.preset);
  $("preview-note").textContent = reasons.length ? reasons.join(" ") :
    warnings.length ? warnings.join(" ") : preset?.hint || "Ready to download. Review the words and item details before posting.";
  if (state.renderer) {
    const d = state.renderer.dimensions();
    $("preview-size").textContent = `${d.width} × ${d.height} · ${state.draft.duration}s video`;
  }
  syncButtons();
}
function scheduleRender() {
  state.revision++;
  revokeDownloads();
  clearTimeout(timer);
  syncButtons();
  const revision = state.revision;
  timer = setTimeout(() => {
    state.renderChain = state.renderChain.then(async () => {
      if (revision !== state.revision || !state.allowed) return;
      const photo = state.photo;
      const options = photo !== lastPhoto ? { photoFile: photo } : {};
      try {
        const report = await state.renderer.build({ ...state.draft }, options);
        lastPhoto = photo;
        if (revision !== state.revision) return;
        state.report = report;
        state.drawn = revision;
        t0 = performance.now();
        displayReport();
      } catch (e) {
        if (revision !== state.revision) return;
        state.report = { blockers: [e.message || "The preview could not be drawn. Try another look."] };
        state.drawn = -1;
        $("preview").getContext("2d").clearRect(0, 0, $("preview").width, $("preview").height);
        displayReport();
      }
    });
  }, 180);
}
function preview(now) {
  if (state.allowed && state.drawn === state.revision && state.renderer) {
    try {
      state.renderer.draw($("preview"), { video: state.mode === "video" && $("play").checked,
        time: ((now - t0) / 1000) % state.draft.duration });
    } catch (e) { state.drawn = -1; note("Preview stopped: " + e.message); syncButtons(); }
  }
  frame = requestAnimationFrame(preview);
}
function setMode(mode) {
  state.mode = mode;
  $("mode-graphic").setAttribute("aria-pressed", String(mode === "graphic"));
  $("mode-video").setAttribute("aria-pressed", String(mode === "video"));
  $("play").disabled = mode !== "video";
  $("play").checked = mode === "video" && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  t0 = performance.now();
}
function setBusy(on) {
  state.busy = on;
  $("workspace").querySelectorAll("input, select, textarea, button").forEach(el => { el.disabled = on; });
  $("workspace").setAttribute("aria-busy", String(on));
  if (!on) { $("play").disabled = state.mode !== "video"; syncButtons(); }
}
async function access() {
  if (window.IPLA_SOCIAL_PREVIEW) return true;
  const acct = window.pgfxAccount;
  if (!acct?.signedIn()) return false;
  const token = acct.token();
  // Always read the server again for a download: a cached role cannot grant access.
  const response = await acct.api("/me");
  return acct.token() === token && response.user?.role === "admin";
}
async function updateAccess() {
  const request = ++accessRevision;
  try {
    const allowed = await access();
    if (request !== accessRevision) return;
    state.allowed = allowed;
    $("access-note").textContent = state.allowed ? "" : "Sign in with the shop’s Studio admin account to open this business workspace.";
  } catch (e) {
    if (request !== accessRevision) return;
    state.allowed = false;
    $("access-note").textContent = "The account check did not finish. " + e.message;
  }
  $("access").hidden = state.allowed;
  $("workspace").hidden = !state.allowed;
  if (!state.allowed) { revokeDownloads(); syncButtons(); return; }
  if (!state.started) {
    state.started = true;
    try {
      state.renderer = await createRenderer();
      fillForm();
      await refreshDrafts();
      scheduleRender();
      frame = requestAnimationFrame(preview);
      note(window.IPLA_SOCIAL_PREVIEW ? "Local preview. Drafts and downloads stay on this computer." : "Drafts stay in this browser. Download a graphic or video when it is ready.");
    } catch (e) { state.started = false; note("The editor could not start: " + e.message); }
  } else { scheduleRender(); }
}
async function exportMedia(kind) {
  if (state.busy || state.photoPending || state.drawn !== state.revision) return;
  readForm();
  if (blockers().length) { displayReport(); return; }
  const revision = state.revision, draft = { ...state.draft };
  setBusy(true);
  try {
    if (!await access()) { await updateAccess(); throw new Error("Sign in with the shop’s admin account to download."); }
    if (!window.IPLA_SOCIAL_PREVIEW) await window.pgfxAccount.api("/export/check", { kind });
    revokeDownloads();
    const progress = (value, label) => note(`${label || "Preparing download"}${Number.isFinite(value) ? ` · ${Math.round(value * 100)}%` : ""}`);
    const photo = await state.renderer.jpg(progress);
    const clip = kind === "video" ? await state.renderer.video(progress) : null;
    if (revision !== state.revision) throw new Error("The draft changed during the download. Review the new preview and try again.");
    if (!window.IPLA_SOCIAL_PREVIEW) {
      if (!await access()) throw new Error("The admin session ended. Sign in again to download.");
      await window.pgfxAccount.api("/export", { kind });
    }
    if (!state.allowed) throw new Error("The admin session ended. Sign in again to download.");
    if (revision !== state.revision) throw new Error("The draft changed. Download it again from the current preview.");
    if (clip) {
      const a = download(clip.blob, filename(clip.ext, draft), `Download ${clip.ext.toUpperCase()} again`);
      download(photo.blob, filename("jpg", draft), "Download matching JPG");
      a.click();
      note(`Video ready. The matching image is available below.${clip.ext !== "mp4" ? " This browser produced WebM; use Chrome or Safari with H.264 support for MP4." : ""}${clip.soundLost ? " The browser could not include sound." : ""}`);
    } else {
      download(photo.blob, filename("jpg", draft), "Download JPG again").click();
      note("Graphic ready. Your caption is separate so you can paste it when posting.");
    }
  } catch (e) { note(e.message || "The download failed. Try again."); }
  finally { setBusy(false); }
}
async function refreshDrafts(selected = state.draft.id) {
  try {
    const saved = await listDrafts();
    $("drafts").replaceChildren(new Option("Choose a saved draft", ""), ...saved.map(d => new Option(d.name || "Untitled draft", d.id)));
    $("drafts").value = selected || "";
  } catch (e) { note(e.message); }
}
async function readPhoto(file) {
  if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Choose a JPG, PNG or WebP photo.");
  if (file.size > 12 * 1024 * 1024) throw new Error("Choose a photo smaller than 12 MB.");
  const bitmap = await createImageBitmap(file);
  const valid = bitmap.width >= 200 && bitmap.height >= 200 && bitmap.width * bitmap.height <= 32000000;
  bitmap.close();
  if (!valid) throw new Error("Choose a photo at least 200 pixels on each side and no larger than 32 megapixels.");
  return file;
}
function applyPreset(id) {
  photoRead++; state.photoPending = false;
  const shape = { aspect: state.draft.aspect, look: state.draft.look, duration: state.draft.duration };
  state.draft = { ...newDraft(id), ...shape };
  state.photo = null;
  fillForm(); scheduleRender();
  note("New draft started. Previously saved drafts remain in the shelf.");
}
function action(id, run) {
  $(id).addEventListener("click", async () => {
    try { await run(); } catch (e) { note(e.message || "That did not finish. Try again."); }
  });
}
$("sign-in").addEventListener("click", () => window.pgfxAccount.openAuth({ mode: "in", message: "Use the shop’s Studio admin account.", next: updateAccess }));
window.pgfxAccount.onChange(() => { updateAccess(); });
window.addEventListener("storage", event => {
  if (event.key === "pgfx_token") {
    state.allowed = false; $("workspace").hidden = true; revokeDownloads(); syncButtons();
    updateAccess();
  }
});
$("category").replaceChildren(...Object.entries(CATEGORIES).map(([id, label]) => new Option(label, id)));
fields.forEach(key => $(key).addEventListener("input", () => {
  readForm();
  if (key === "caption" || key === "expires") { displayReport(); return; }
  scheduleRender();
}));
$("draft-name").addEventListener("input", readForm);
$("category").addEventListener("change", () => applyPreset(PRESETS.find(p => p.category === $("category").value).id));
$("preset").addEventListener("change", () => applyPreset($("preset").value));
$("photo").addEventListener("change", async () => {
  const read = ++photoRead;
  try {
    const file = $("photo").files[0];
    if (!file) return;
    state.photoPending = true; state.revision++; clearTimeout(timer); syncButtons();
    const photo = await readPhoto(file);
    if (read !== photoRead) return;
    state.photo = photo;
    $("photo-note").textContent = `Photo attached: ${state.photo.name}.`;
    scheduleRender();
  } catch (e) { if (read === photoRead) { $("photo").value = ""; scheduleRender(); note(e.message); } }
  finally { if (read === photoRead) { state.photoPending = false; syncButtons(); } }
});
action("remove-photo", () => { photoRead++; state.photoPending = false; state.photo = null; fillForm(); scheduleRender(); });
action("mode-graphic", () => setMode("graphic"));
action("mode-video", () => setMode("video"));
action("download-jpg", () => exportMedia("photo"));
action("download-video", () => exportMedia("video"));
action("copy-caption", async () => {
  readForm();
  try { await navigator.clipboard.writeText(state.draft.caption); note("Caption copied."); }
  catch { $("caption").focus(); $("caption").select(); note("Select and copy the caption from the text box."); }
});
action("save-draft", async () => {
  if (state.busy || state.photoPending) return;
  readForm();
  if (!state.draft.name) throw new Error("Give this draft a name.");
  setBusy(true);
  try {
    const saved = await saveDraft(state.draft, state.photo);
    state.draft.id = saved.id;
    await refreshDrafts(saved.id);
    note("Saved in this browser, including the attached photo.");
  } finally { setBusy(false); }
});
action("load-draft", async () => {
  if (state.busy) return;
  if (!$("drafts").value) throw new Error("Choose a draft to open.");
  photoRead++; state.photoPending = false; setBusy(true);
  try {
    const saved = await getDraft($("drafts").value);
    if (!saved) throw new Error("That draft was removed. Refresh the page.");
    state.draft = cleanDraft(saved); state.photo = saved.photo || null;
    fillForm(); scheduleRender(); note("Draft opened.");
  } finally { setBusy(false); }
});
action("delete-draft", async () => {
  if (state.busy) return;
  const id = $("drafts").value;
  if (!id) throw new Error("Choose a saved draft to delete.");
  setBusy(true);
  try {
    const old = await getDraft(id);
    await deleteDraft(id);
    if (state.draft.id === id) state.draft.id = "";
    await refreshDrafts();
    note("Draft removed from the shelf. The current canvas stays open.");
    if (old) {
      const undo = document.createElement("button"); undo.type = "button"; undo.textContent = "Undo delete";
      undo.addEventListener("click", async () => {
        if (state.busy) return;
        setBusy(true);
        try { await saveDraft(old, old.photo); await refreshDrafts(old.id); note("Draft restored."); }
        catch (e) { note(e.message); }
        finally { setBusy(false); }
      });
      $("status").append(" ", undo);
    }
  } finally { setBusy(false); }
});
action("export-draft", () => {
  readForm(); revokeDownloads();
  download(new Blob([JSON.stringify(state.draft, null, 2)], { type: "application/json" }), filename("json"), "Download draft JSON again").click();
  note("Draft recipe downloaded. Photos stay in the browser; attach the item photo again when importing elsewhere.");
});
$("import-draft").addEventListener("change", async () => {
  if (state.busy) return;
  setBusy(true);
  try {
    const file = $("import-draft").files[0];
    if (!file) return;
    if (file.size > 30000) throw new Error("Choose a Social Studio JSON recipe smaller than 30 KB.");
    const draft = cleanDraft(JSON.parse(await file.text()));
    photoRead++; state.photoPending = false;
    state.draft = { ...draft, id: "" }; state.photo = null;
    fillForm(); scheduleRender(); note("Recipe imported. Add its photo again if it uses one, then save to keep it.");
  } catch (e) { note("Could not import the draft. " + e.message); }
  finally { $("import-draft").value = ""; setBusy(false); }
});
action("reset-draft", () => applyPreset($("preset").value || "three-steps"));
window.addEventListener("pagehide", event => {
  cancelAnimationFrame(frame); revokeDownloads();
  if (!event.persisted) state.renderer?.dispose();
});
window.addEventListener("pageshow", event => {
  if (event.persisted) { frame = requestAnimationFrame(preview); updateAccess(); }
});
setMode("graphic");
updateAccess();
