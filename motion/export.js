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

/** Render the whole ad to an MP4 Blob. onProgress(0..1, label). */
export async function exportMp4(ad, onProgress = () => {}, { fps = 30 } = {}) {
  const W = ad.W, H = ad.H, M = window.Mp4Muxer;
  const vcfg = await pickVideoCodec(W, H, fps);
  if (!vcfg) throw new Error("This browser cannot encode H.264 video. Try Chrome, Edge or Safari 17+.");
  onProgress(0, "Mixing the sound");
  const audioBuf = await renderSoundtrack(ad);
  const acodec = await pickAudioCodec();
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
  return { blob: new Blob([muxer.target.buffer], { type: "video/mp4" }), ext: "mp4", audio: !!acodec };
}

/** Fallback: play the ad in real time into a MediaRecorder. */
export async function recordRealtime(ad, onProgress = () => {}, { fps = 30 } = {}) {
  const W = ad.W, H = ad.H, c = canvas(W, H), ctx = c.getContext("2d");
  const audioBuf = await renderSoundtrack(ad);
  const actx = new AudioContext({ sampleRate: 44100 });
  const dest = actx.createMediaStreamDestination();
  const src = actx.createBufferSource(); src.buffer = audioBuf; src.connect(dest);
  const stream = c.captureStream(fps);
  dest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
  const mime = ["video/mp4;codecs=avc1,mp4a", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm"].find(m => MediaRecorder.isTypeSupported(m)) || "";
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8e6 });
  const parts = []; rec.ondataavailable = e => e.data.size && parts.push(e.data);
  const done = new Promise(r => { rec.onstop = r; });
  ad.still = null; ad.frame(ctx, 0);
  rec.start(); src.start();
  const t0 = performance.now();
  await new Promise(resolve => {
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      if (t >= ad.st.duration) { resolve(); return; }
      ad.frame(ctx, t, { subsFly: 3, subsMove: 2 });
      onProgress(t / ad.st.duration, "Recording");
      requestAnimationFrame(tick);
    };
    tick();
  });
  rec.stop(); await done; actx.close();
  const type = mime.split(";")[0] || "video/webm";
  return { blob: new Blob(parts, { type }), ext: type.includes("mp4") ? "mp4" : "webm", audio: true };
}
