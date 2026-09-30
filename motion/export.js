// Phone Ad Maker export: an MP4 made frame by frame with WebCodecs (no server,
// no upload), or a real-time recording where WebCodecs is missing.

import { canvas } from "./engine.js";
import { renderSoundtrack } from "./audio.js";

// Yield to the page without a timer: a background tab throttles setTimeout to
// once a second or even once a minute, which stalls an export somebody left
// running while they switched tabs. A message round trip is not throttled.
const yieldNow = () => new Promise(r => { const ch = new MessageChannel(); ch.port1.onmessage = () => r(); ch.port2.postMessage(0); });

export function canEncode() {
  return typeof VideoEncoder !== "undefined" && typeof window.Mp4Muxer !== "undefined";
}

async function pickVideoCodec(w, h, fps) {
  for (const codec of ["avc1.640034", "avc1.640028", "avc1.4d0034", "avc1.42003e", "avc1.42001f"]) {
    const cfg = { codec, width: w, height: h, bitrate: Math.round(w * h * fps * .16), framerate: fps, avc: { format: "avc" } };
    try { if ((await VideoEncoder.isConfigSupported(cfg)).supported) return cfg; } catch (e) { /* next */ }
  }
  return null;
}

async function pickAudioCodec() {
  if (typeof AudioEncoder === "undefined") return null;
  for (const [codec, muxCodec] of [["mp4a.40.2", "aac"], ["opus", "opus"]]) {
    const cfg = { codec, sampleRate: 44100, numberOfChannels: 2, bitrate: 160000 };
    try { if ((await AudioEncoder.isConfigSupported(cfg)).supported) return { cfg, muxCodec }; } catch (e) { /* next */ }
  }
  return null;
}

/** Render the whole ad to an MP4 Blob. onProgress(0..1, label). Pass audioBuf
 *  (the rendered soundtrack) to reuse one, or null for a silent video. */
export async function exportMp4(ad, onProgress = () => {}, { fps = 30, audioBuf } = {}) {
  const W = ad.W, H = ad.H, M = window.Mp4Muxer;
  const vcfg = await pickVideoCodec(W, H, fps);
  if (!vcfg) throw codeError("no-h264", "This browser cannot encode H.264 video at " + W + "×" + H + ".");
  if (audioBuf === undefined) { onProgress(0, "Mixing the sound"); audioBuf = await renderSoundtrack(ad); }
  const acodec = audioBuf ? await pickAudioCodec() : null;
  const muxer = new M.Muxer({
    target: new M.ArrayBufferTarget(),
    video: { codec: "avc", width: W, height: H, frameRate: fps },
    audio: acodec ? { codec: acodec.muxCodec, numberOfChannels: 2, sampleRate: 44100 } : undefined,
    fastStart: "in-memory",
  });
  let failed = null;
  const venc = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: e => { failed = e; } });
  venc.configure(vcfg);
  let aenc = null;
  if (acodec) {
    aenc = new AudioEncoder({ output: (chunk, meta) => muxer.addAudioChunk(chunk, meta), error: e => { failed = e; } });
    aenc.configure(acodec.cfg);
  }

  const c = canvas(W, H), ctx = c.getContext("2d");
  const frames = Math.round(ad.st.duration * fps), dt = 1 / fps;
  ad.still = null;
  for (let i = 0; i < frames; i++) {
    if (failed) throw failed;
    ad.frame(ctx, i * dt, { subsFly: 8, subsMove: 4 }, dt);
    const vf = new VideoFrame(c, { timestamp: Math.round(i * 1e6 / fps), duration: Math.round(1e6 / fps) });
    venc.encode(vf, { keyFrame: i % (fps * 2) === 0 });
    vf.close();
    while (venc.encodeQueueSize > 6) await yieldNow();
    if (i % 5 === 0) { onProgress(i / frames * .92, "Drawing frames"); await yieldNow(); }
  }
  await venc.flush();
  if (aenc) {
    onProgress(.94, "Encoding the sound");
    const L = audioBuf.getChannelData(0), R = audioBuf.getChannelData(1), step = 4096;
    for (let s = 0; s < audioBuf.length; s += step) {
      const n = Math.min(step, audioBuf.length - s), data = new Float32Array(n * 2);
      data.set(L.subarray(s, s + n), 0); data.set(R.subarray(s, s + n), n);
      const ad2 = new AudioData({ format: "f32-planar", sampleRate: 44100, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(s / 44100 * 1e6), data });
      aenc.encode(ad2); ad2.close();
    }
    await aenc.flush();
  }
  if (failed) throw failed;
  muxer.finalize();
  onProgress(1, "Done");
  return { blob: new Blob([muxer.target.buffer], { type: "video/mp4" }), ext: "mp4", audio: !!acodec, soundLost: !!audioBuf && !acodec };
}

function codeError(code, message) { const e = new Error(message); e.code = code; return e; }

/** The best format the real-time recorder can write here. A bare "video/mp4"
 *  is only trusted where the browser also plays H.264: an open-source Chromium
 *  answers yes and then writes VP9 in an MP4 box, which the platforms refuse. */
export function recorderMime() {
  if (typeof MediaRecorder === "undefined" || !HTMLCanvasElement.prototype.captureStream) return null;
  const ok = m => { try { return MediaRecorder.isTypeSupported(m); } catch (e) { return false; } };
  let h264 = false;
  try { h264 = !!document.createElement("video").canPlayType('video/mp4; codecs="avc1.42E01E"'); } catch (e) { /* no */ }
  return ["video/mp4;codecs=avc1,mp4a", "video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/mp4;codecs=avc1"].find(ok)
    || (h264 && ok("video/mp4") ? "video/mp4" : null)
    || ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find(ok) || "";
}

/** Fallback: play the ad in real time into a MediaRecorder. audioBuf as for
 *  exportMp4. Hiding the tab stops it (timers drop to once a second there, so
 *  it would save a frozen video) with an error that says so. */
export async function recordRealtime(ad, onProgress = () => {}, { fps = 30, audioBuf } = {}) {
  const mime = recorderMime();
  if (mime === null) throw codeError("no-recorder", "This browser cannot record video.");
  const W = ad.W, H = ad.H, c = canvas(W, H), ctx = c.getContext("2d");
  if (audioBuf === undefined) audioBuf = await renderSoundtrack(ad);
  const stream = c.captureStream(fps);
  let actx = null, src = null;
  if (audioBuf) {
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: audioBuf.sampleRate });
      const dest = actx.createMediaStreamDestination();
      src = actx.createBufferSource(); src.buffer = audioBuf; src.connect(dest);
      dest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
    } catch (e) { console.warn("Recording without sound:", e); src = null; }
  }
  const rec = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), videoBitsPerSecond: 8e6 });
  const parts = []; rec.ondataavailable = e => e.data.size && parts.push(e.data);
  const done = new Promise((res, rej) => { rec.onstop = res; rec.onerror = e => rej((e && e.error) || new Error("The recorder stopped with an error.")); });
  let hidden = false, finish = null;
  const onVis = () => { if (document.hidden) { hidden = true; if (finish) finish(); } };
  document.addEventListener("visibilitychange", onVis);
  ad.still = null; ad.frame(ctx, 0);
  try {
    rec.start(250);
    if (src) { try { await actx.resume(); } catch (e) { /* plays silent */ } src.start(); }
    // a timer on absolute time, not requestAnimationFrame: rAF follows the
    // display (and crawls in a background or headless tab), captureStream does not
    const t0 = performance.now(), step = 1000 / fps;
    await new Promise(resolve => {
      finish = resolve;
      let n = 0;
      const tick = () => {
        if (hidden) return;
        const t = (performance.now() - t0) / 1000;
        if (t >= ad.st.duration) { resolve(); return; }
        ad.frame(ctx, t, { subsFly: 3, subsMove: 2 });
        onProgress(t / ad.st.duration, "Recording");
        n = Math.max(n + 1, Math.floor((performance.now() - t0) / step) + 1);
        setTimeout(tick, Math.max(0, t0 + n * step - performance.now()));
      };
      tick();
    });
  } finally {
    document.removeEventListener("visibilitychange", onVis);
    try { rec.state !== "inactive" && rec.stop(); } catch (e) { /* stopped */ }
    if (src) try { src.stop(); } catch (e) { /* stopped */ }
  }
  await done;
  stream.getTracks().forEach(t => t.stop());
  if (actx) actx.close().catch(() => {});
  if (hidden) throw codeError("hidden", "The recording stopped because this tab was hidden.");
  const type = (rec.mimeType || mime || "video/webm").split(";")[0];
  return { blob: new Blob(parts, { type }), ext: type.includes("mp4") ? "mp4" : "webm", audio: !!src };
}
