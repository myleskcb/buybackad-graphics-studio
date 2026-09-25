// Attention audit: what a viewer actually gets in the first seconds of an ad.
//
// Everything is MEASURED off rendered pixels, never read off the timeline:
//  - how much of the very first frame (the thumbnail, and what autoplay shows
//    before anyone has decided to watch) differs from the bare background
//  - motion: how much of the picture changes from one frame to the next
//  - when the headline and the number become readable: each is rendered with
//    and without, the difference is its ink, and it counts as read once that ink
//    matches where it finally settles
//  - dead air: the longest stretch in the first 3 s where nothing moves
//  - contrast between the headline's ink and what sits right behind it
//  - whether the soundtrack opens on a hit or on silence
// The weights are a judgement about feed video (a scroller decides in about
// 1.5 s, and most never hear the sound), written down so they can be argued with.

import { Ad, canvas, prog } from "./engine.js";
import { renderSoundtrack } from "./audio.js";

const FPS = 15;

function lumaOf(c, w, h) {
  const x = c.getContext("2d", { willReadFrequently: true }), d = x.getImageData(0, 0, w, h).data;
  const out = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) out[i] = .2126 * d[i * 4] + .7152 * d[i * 4 + 1] + .0722 * d[i * 4 + 2];
  return out;
}

function render(ad, t, skip, w, h, tmp) {
  ad.skip = skip;
  ad.still = null;
  const x = tmp.getContext("2d", { willReadFrequently: true });
  ad.frame(x, t, { subsFly: 1, subsMove: 1 }, 1 / FPS);
  ad.skip = null;
  return lumaOf(tmp, w, h);
}

function inkMask(a, b, thr = 22) {
  const m = new Uint8Array(a.length); let n = 0;
  for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > thr) { m[i] = 1; n++; }
  return { m, n };
}

function iou(a, b) {
  let i = 0, u = 0;
  for (let k = 0; k < a.length; k++) { if (a[k] && b[k]) i++; if (a[k] || b[k]) u++; }
  return u ? i / u : 0;
}

/** Audit one style. AdClass lets the same audit judge an older engine. */
export async function auditLook(style, assets, { AdClass = Ad, size = 200, secs = 4, sound = true } = {}) {
  const probe = new AdClass(style, assets, 100, 100);
  const aspect = (style.aspect || "1:1").split(":").map(Number);
  const k = size / Math.max(aspect[0], aspect[1]);
  const W = Math.round(aspect[0] * k), H = Math.round(aspect[1] * k);
  const ad = new AdClass(style, assets, W, H);
  // any engine: honour a skip set for the parts we need to take out
  for (const [part, fn] of [["headline", "_headline"], ["number", "_number"], ["hook", "_hookLine"]]) {
    if (typeof ad[fn] === "function") { const orig = ad[fn].bind(ad); ad[fn] = (...a) => (ad.skip && ad.skip.has(part) ? undefined : orig(...a)); }
  }
  const tmp = canvas(W, H);
  const none = new Set(), noHead = new Set(["headline"]), noNum = new Set(["number"]), noHook = new Set(["hook"]);
  const hasHook = !!ad.hookLines;
  const tEnd = Math.min(ad.st.duration - .1, 5.5);
  const finalF = render(ad, tEnd, none, W, H, tmp);
  const finalHead = inkMask(finalF, render(ad, tEnd, noHead, W, H, tmp));
  const finalNum = inkMask(finalF, render(ad, tEnd, noNum, W, H, tmp));
  // the bare ground: the background canvas the engine drew, scaled
  const g = canvas(W, H); g.getContext("2d").drawImage(ad.bg, 0, 0, W, H);
  const ground = lumaOf(g, W, H);

  const n = Math.round(secs * FPS);
  const motion = [], headRead = [], numRead = [], hookSeen = [];
  let prev = null, cover0 = 0, black0 = 0;
  for (let i = 0; i <= n; i++) {
    const t = i / FPS;
    const f = render(ad, t, none, W, H, tmp);
    if (i === 0) {
      let c = 0, dark = 0, sat = 0;
      for (let j = 0; j < f.length; j++) { if (Math.abs(f[j] - ground[j]) > 18) c++; if (f[j] < 28) dark++; }
      cover0 = c / f.length; black0 = dark / f.length;
    }
    if (prev) { let s = 0; for (let j = 0; j < f.length; j++) s += Math.abs(f[j] - prev[j]); motion.push(s / f.length); }
    prev = f;
    const h = inkMask(f, render(ad, t, noHead, W, H, tmp));
    headRead.push(finalHead.n ? iou(h.m, finalHead.m) : 0);
    const nm = inkMask(f, render(ad, t, noNum, W, H, tmp));
    numRead.push(finalNum.n ? iou(nm.m, finalNum.m) : 0);
    if (hasHook && t < 1.2) { const hk = inkMask(f, render(ad, t, noHook, W, H, tmp)); hookSeen.push(hk.n / f.length); }
  }
  const readAt = arr => { for (let i = 0; i < arr.length; i++) if (arr[i] >= .8 && (arr[i + 1] ?? 1) >= .8 && (arr[i + 2] ?? 1) >= .8) return i / FPS; return Infinity; };
  const headlineAt = readAt(headRead), numberAt = readAt(numRead);
  // the opening line counts as words on screen once a tenth of the frame is its ink
  let hookAt = Infinity;
  for (let i = 0; i < hookSeen.length; i++) if (hookSeen[i] > .1) { hookAt = i / FPS; break; }
  const wordsAt = Math.min(hookAt, headlineAt);

  // dead air: frames where almost nothing moves, BEFORE the whole message is readable.
  // Calm after the number has landed is the ad resting, not the ad stalling.
  const still = motion.map(m => m < 1.5);
  let run = 0, dead = 0;
  const until = Math.min(motion.length, Math.round(Math.min(3, isFinite(numberAt) ? numberAt : 3) * FPS));
  for (let i = 0; i < until; i++) { run = still[i] ? run + 1 : 0; dead = Math.max(dead, run); }
  const deadAir = dead / FPS;
  const hookMotion = Math.max(...motion.slice(0, Math.round(.6 * FPS)));

  // contrast of the headline: the lettering against everything right behind it.
  // The headline's own layer holds its shadow, outline or plate too, so the
  // lettering is the brightest (or darkest) part of that layer, whichever is
  // further from the ground around it, and "behind" is the rest of a box
  // three pixels around the layer, shadow and plate included.
  let contrast = 0;
  if (finalHead.n) {
    const idx = [], lumv = [];
    for (let j = 0; j < finalF.length; j++) if (finalHead.m[j]) { idx.push(j); lumv.push(finalF[j]); }
    const sorted = lumv.slice().sort((p, q) => p - q);
    const hi = sorted[Math.floor(sorted.length * .85)], lo = sorted[Math.floor(sorted.length * .15)];
    const grow = new Uint8Array(finalF.length);
    for (const j of idx) { const y = (j / W) | 0, x0 = j % W; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const yy = y + dy, xx = x0 + dx; if (yy >= 0 && yy < H && xx >= 0 && xx < W) grow[yy * W + xx] = 1; } }
    let ringS = 0, ringN = 0; for (let j = 0; j < grow.length; j++) if (grow[j] && !finalHead.m[j]) { ringS += finalF[j]; ringN++; }
    const ringM = ringS / Math.max(1, ringN);
    const inkIsLight = Math.abs(hi - ringM) >= Math.abs(lo - ringM);
    let ink = 0, ni = 0, beh = 0, nb = 0;
    for (let j = 0; j < grow.length; j++) {
      if (!grow[j]) continue;
      const v = finalF[j], isInk = finalHead.m[j] && (inkIsLight ? v >= hi : v <= lo);
      if (isInk) { ink += v; ni++; } else { beh += v; nb++; }
    }
    const L = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
    const p1 = L(ink / Math.max(1, ni)), p2 = L(beh / Math.max(1, nb));
    contrast = (Math.max(p1, p2) + .05) / (Math.min(p1, p2) + .05);
  }

  let soundAt0 = null;
  if (sound) {
    try {
      const full = new AdClass(style, assets, 320, 320);
      const buf = await renderSoundtrack(full);
      const d = buf.getChannelData(0), n0 = Math.round(buf.sampleRate * .15);
      let s = 0; for (let i = 0; i < n0; i++) s += d[i] * d[i];
      soundAt0 = 20 * Math.log10(Math.sqrt(s / n0) + 1e-9);
    } catch (e) { soundAt0 = null; }
  }

  const checks = [
    { id: "frame0", label: "First frame shows something", value: `${Math.round(cover0 * 100)}% of the frame`, ok: cover0 >= .15, weight: 20, grade: Math.min(1, cover0 / .15) },
    { id: "black0", label: "First frame is not mostly black", value: `${Math.round(black0 * 100)}% near black`, ok: black0 <= .35, weight: 10, grade: black0 <= .35 ? 1 : black0 <= .55 ? .4 : 0 },
    { id: "hook", label: "Movement in the first half second", value: hookMotion.toFixed(1), ok: hookMotion >= 6, weight: 10, grade: Math.min(1, hookMotion / 6) },
    { id: "words", label: "Words on screen by 1 s", value: isFinite(wordsAt) ? wordsAt.toFixed(1) + " s" : "never", ok: wordsAt <= 1, weight: 20, grade: wordsAt <= 1 ? 1 : wordsAt <= 1.5 ? .6 : wordsAt <= 2 ? .3 : 0 },
    { id: "headline", label: "Headline readable by 2 s", value: isFinite(headlineAt) ? headlineAt.toFixed(1) + " s" : "never", ok: headlineAt <= 2, weight: 15, grade: headlineAt <= 2 ? 1 : headlineAt <= 2.6 ? .5 : 0 },
    { id: "number", label: "Number readable by 3 s", value: isFinite(numberAt) ? numberAt.toFixed(1) + " s" : "never", ok: numberAt <= 3, weight: 20, grade: numberAt <= 3 ? 1 : numberAt <= 4 ? .4 : 0 },
    { id: "dead", label: "Never still for over 0.6 s before the number lands", value: deadAir.toFixed(1) + " s", ok: deadAir <= .6, weight: 10, grade: deadAir <= .6 ? 1 : deadAir <= 1.2 ? .5 : 0 },
    { id: "contrast", label: "Headline stands out (3:1 or more)", value: contrast.toFixed(1) + ":1", ok: contrast >= 3, weight: 10, grade: Math.min(1, contrast / 3) },
  ];
  if (soundAt0 != null) checks.push({ id: "sound", label: "Sound opens on a hit, not silence", value: soundAt0.toFixed(0) + " dB", ok: soundAt0 > -30, weight: 0, grade: soundAt0 > -30 ? 1 : 0 });
  const total = checks.reduce((a, c) => a + c.weight, 0);
  const score = Math.round(checks.reduce((a, c) => a + c.weight * c.grade, 0) / total * 100);
  return { score, checks, motion, headRead, numRead, headlineAt, numberAt, hookAt, wordsAt, cover0, black0, deadAir, hookMotion, contrast, soundAt0, fps: FPS };
}

/** Draw the attention curve: motion over time, with the headline and number marks and the 3 s line. */
export function drawCurve(c, rep) {
  const x = c.getContext("2d"), W = c.width, H = c.height, css = getComputedStyle(document.body);
  const fg = css.getPropertyValue("--text-2") || "#ccc", acc = css.getPropertyValue("--btn") || "#b48cff", muted = css.getPropertyValue("--muted") || "#888";
  x.clearRect(0, 0, W, H);
  const secs = rep.motion.length / rep.fps, px = t => t / secs * W;
  x.fillStyle = "rgba(127,127,127,.12)"; x.fillRect(0, 0, px(3), H);
  const max = Math.max(12, ...rep.motion);
  x.beginPath(); x.moveTo(0, H);
  rep.motion.forEach((m, i) => x.lineTo(px((i + 1) / rep.fps), H - 4 - (m / max) * (H - 18)));
  x.lineTo(W, H); x.closePath(); x.fillStyle = acc.trim(); x.globalAlpha = .35; x.fill(); x.globalAlpha = 1;
  const mark = (t, label, col) => { if (!isFinite(t) || t > secs) return; x.strokeStyle = col; x.lineWidth = 2; x.beginPath(); x.moveTo(px(t), 0); x.lineTo(px(t), H); x.stroke(); x.fillStyle = col; x.font = "600 11px Satoshi, system-ui, sans-serif"; x.fillText(label, Math.min(px(t) + 4, W - 60), 12); };
  mark(3, "3 s", muted.trim()); mark(rep.headlineAt, "headline", fg.trim()); mark(rep.numberAt, "number", fg.trim());
}

/** Many looks at once: medians and the share that pass each check. */
export function summarise(reps) {
  const med = a => { const s = a.filter(isFinite).sort((p, q) => p - q); return s.length ? s[Math.floor(s.length / 2)] : Infinity; };
  const share = id => { const has = reps.filter(r => r.checks.some(c => c.id === id)); return has.length ? has.filter(r => r.checks.find(c => c.id === id).ok).length / has.length : null; };
  return {
    n: reps.length, score: med(reps.map(r => r.score)),
    wordsAt: med(reps.map(r => r.wordsAt ?? r.headlineAt)), headlineAt: med(reps.map(r => r.headlineAt)), numberAt: med(reps.map(r => r.numberAt)),
    cover0: med(reps.map(r => r.cover0)), deadAir: med(reps.map(r => r.deadAir)), contrast: med(reps.map(r => r.contrast)),
    black0: med(reps.map(r => r.black0)),
    pass: Object.fromEntries(["frame0", "black0", "hook", "words", "headline", "number", "dead", "contrast", "sound"].map(id => [id, share(id)])),
  };
}

export { prog };
