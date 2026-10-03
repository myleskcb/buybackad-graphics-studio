#!/usr/bin/env python3
"""Build motion/sounds/tracks/: real recordings the video ad maker can play under an ad.

Every track is a REAL performance whose recording and composition are both free to use
in an ad, and the manifest keeps the trail for each one:
  - US government works (Marine Band, Army Band, Navy Band, Air Force bands): public
    domain under 17 U.S.C. 105, including pieces their own musicians composed;
  - Musopen recordings, released to the public domain;
  - recordings published before 1926, public domain in the US since the Music
    Modernization Act;
  - performers who released their own recordings to the public domain.
Never: "PDP-CH" transfers (public domain in Switzerland, not the US), "European Archive"
LP transfers, synthesiser renditions, covers of songs still under copyright, or anything
with lyrics that would talk over an ad.

For each one it takes a 12-second section (the opening where the opening is what people
know, else the most energetic steady stretch in the window given), starts it on a strong
beat, measures its tempo, evens its loudness and encodes a small stereo MP3.

usage: python3 scripts/build_motion_tracks.py <ffmpeg>   (needs network access to Wikimedia Commons)
A producer's beats (work-for-hire, owned outright) go in the same way: see LOCAL below.
"""
import json, os, subprocess, sys, time, urllib.parse, urllib.request, urllib.error
import numpy as np

FF = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), "..", "motion", "sounds", "tracks")
CACHE = os.environ.get("TRACK_CACHE", "/tmp/track-cache")
SR, CLIP = 44100, 12.0
UA = {"User-Agent": "GraphicsStudio-track-builder/1.0 (https://buybackad-graphics-studio.netlify.app)"}

# id: (title shown, kind, Commons file, how to pick the section, licence basis)
#   section: ("start",) the opening; ("loud", a, b) the strongest stretch between a and b seconds
#   (negative counts from the end)
TRACKS = {
    "mountain_king": ("In the Hall of the Mountain King · Musopen Symphony", "classical", "File:Musopen - In the Hall Of The Mountain King.ogg", ("loud", 90, -1), "Musopen, public domain"),
    "morning_mood": ("Morning Mood (Grieg) · Musopen Symphony", "classical", "File:Grieg - Peer Gynt Suite No. 1, Op. 46 - I. Morning Mood (Musopen Symphony).flac", ("start",), "Musopen, public domain"),
    "mozart40": ("Symphony No. 40 (Mozart) · Musopen Symphony", "classical", "File:Mozart - Symphony No. 40 in G minor, K550 - I. Molto allegro (Musopen Symphony).flac", ("start",), "Musopen, public domain"),
    "moonlight": ("Moonlight Sonata · Paul Pitman (Musopen)", "classical", "File:Ludwig van Beethoven - sonata no. 14 in c sharp minor 'moonlight', op. 27 no. 2 - i. adagio sostenuto.ogg", ("start",), "Musopen, public domain"),
    "fur_elise": ("Für Elise (Beethoven) · piano", "classical", "File:FurElise.ogg", ("start",), "performer's own recording, released to the public domain"),
    "gymnopedie": ("Gymnopédie No. 1 (Satie) · Michael Laucke, guitar", "classical", "File:Satie Gymnopedie No 1 performed by Michael Laucke.flac", ("start",), "performer's own recording, released to the public domain"),
    "new_world": ("New World Symphony, finale (Dvořák) · Musopen", "classical", "File:Antonin Dvorak - symphony no. 9 in e minor 'from the new world', op. 95 - iv. allegro con fuoco.ogg", ("loud", 0, 60), "Musopen, public domain"),
    "vivaldi_winter": ("Winter, Four Seasons (Vivaldi) · USAF Concert Band", "classical", "File:Vivaldi Winter mvt 1 Allegro non molto - The USAF Concert.ogg", ("loud", 0, 90), "US Air Force, public domain"),
    "can_can": ("The Can-Can (Offenbach) · Musopen", "classical", "File:Offenbach - Orpheus in the Underworld - Overture, Can Can section.ogg", ("loud", 0, -1), "Musopen, public domain"),
    "william_tell": ("William Tell Overture, finale · US Marine Band", "march", "File:Gioachino Rossini, William Tell Overture (military band version, 2000).ogg", ("loud", -150, -20), "US Marine Band, public domain"),
    "gladiators": ("Entry of the Gladiators (circus march) · US Marine Band", "march", "File:Julius Fučík's \"Entrance of the Gladiators\", performed by the U.S. Marine Band.oga", ("start",), "US Marine Band, public domain"),
    "light_cavalry": ("Light Cavalry Overture (Suppé) · US Marine Band", "march", "File:Overture to Light Cavalry - U.S. Marine Band.ogg", ("loud", 0, 120), "US Marine Band, public domain"),
    "overture_1812": ("1812 Overture, finale · US Marine Band", "march", "File:1812 Overture - United States Marine Band.opus", ("loud", -110, -5), "US Marine Band, public domain"),
    "liberty_bell": ("The Liberty Bell (Sousa) · US Marine Band", "march", "File:Sousa The Liberty Bell United States Marine Band.ogg", ("start",), "US Marine Band, public domain"),
    "stars_stripes": ("The Stars and Stripes Forever · US Army Band", "march", "File:The Stars and Stripes Forever - U.S. Army Band.ogg", ("loud", -90, -1), "US Army Band, public domain"),
    "radetzky": ("Radetzky March · US Marine Band", "march", "File:USMC Band - Radetzky March.mp3", ("start",), "US Marine Band, public domain"),
    "pomp": ("Pomp and Circumstance No. 1 · US Marine Band", "march", "File:ELGAR Pomp and Circumstance in D, Opus 39, No. 1 - United States Marine Band.mp3", ("loud", -110, -10), "US Marine Band, public domain"),
    "bumblebee": ("Flight of the Bumblebee · USAF Band of the Rockies", "classical", "File:Flight of the Bumblebee - Concert Band - United States Air Force Band of the Rockies.mp3", ("start",), "US Air Force, public domain"),
    "hungarian_rhapsody": ("Hungarian Rhapsody No. 2 (Liszt) · US Navy Band", "classical", "File:Hungarian Rhapsody No 2.ogg", ("loud", -150, -10), "US Navy Band, public domain"),
    "blue_danube": ("The Blue Danube · US Marine Band", "classical", "File:\"An der schönen, blauen Donau\" performed by the U.S. Marine Band.mp3", ("loud", 60, 200), "US Marine Band, public domain"),
    "small_note_boogaloo": ("Small Note Boogaloo · USAF Airmen of Note", "jazz", "File:Small Note Boogaloo - Airmen of Note - United States Air Force Band.mp3", ("loud", 0, 80), "US Air Force (composed by MSgt Ben Patterson), public domain"),
    "eagle_eyes": ("Eagle Eyes · USAF Airmen of Note", "jazz", "File:Eagle Eyes - Airmen of Note - United States Air Force Band.mp3", ("loud", 0, 80), "US Air Force (composed by MSgt Jeff Martin), public domain"),
    "sheridan_square": ("Sheridan Square · USAF Airmen of Note", "jazz", "File:Sheridan Square - Airmen of Note - United States Air Force Band.mp3", ("loud", 0, 80), "US Air Force (composed by MSgt Kevin Cerovich), public domain"),
    "skyscrapers": ("Skyscrapers · USAF Airmen of Note", "jazz", "File:Skyscrapers - Airmen of Note - United States Air Force Band.mp3", ("loud", 0, 150), "US Air Force (composed by MSgt Alan Baylock), public domain"),
    "sousa_funk": ("Sousa Gone Funk · US Navy Band", "jazz", "File:Sousa gone Funk (Washington Post) - U.S. Navy Band.opus", ("loud", 0, -1), "US Navy Band, public domain"),
    "aero_groove": ("Aero Groove Evolution · USAF Rhythm in Blue", "jazz", "File:Aero Groove Evolution - Rhythm in Blue - United States Air Force Heritage of America Band.mp3", ("loud", 0, 150), "US Air Force, public domain"),
    "mr_bo_hica": ("Mr. Bo Hica · USAF Dimensions in Blue", "jazz", "File:Mr. Bo Hica - Dimensions in Blue - United States Air Force Band of the West.mp3", ("loud", 0, 80), "US Air Force (composed by SrA David Bandman), public domain"),
    "livery_stable": ("Livery Stable Blues (1917) · Original Dixieland Jass Band", "vintage", "File:ODJB Livery Stable Blues 1917.ogg", ("loud", 0, 90), "recorded 1917, public domain in the US"),
    "tiger_rag": ("Tiger Rag (1918) · Original Dixieland Jass Band", "vintage", "File:Tiger Rag ODJB.ogg", ("loud", 0, 90), "recorded 1918, public domain in the US"),
    "hot_time": ("A Hot Time in the Old Town (1915) · Prince's Band", "vintage", "File:There'll be a hot time in the old town to-night (1915 sound recording).mp3", ("loud", 0, 90), "recorded 1915, public domain in the US"),
    "valkyries": ("Ride of the Valkyries (1921 Edison recording)", "vintage", "File:Richard Wagner - Ride of the Valkyries original.ogg", ("loud", 0, -1), "recorded 1921, public domain in the US"),
    "hungarian_dance5": ("Hungarian Dance No. 5 · Arthur Nikisch, 1906 piano roll", "vintage", "File:Brahms nikisch hd5.ogg", ("start",), "recorded 1906, public domain"),
    # holiday ads only
    "jingle_bells": ("Jingle Bells · USAF Starlifter & Roots in Blue", "christmas", "File:Jingle Bells (2020) - Starlifter and Roots in Blue - United States Air Force Band of Mid-America.mp3", ("loud", 0, 90), "US Air Force, public domain"),
    "hallelujah": ("Hallelujah Chorus (1916 Edison recording)", "christmas", "File:Messiah Hallelujah Chorus 1916.ogg", ("loud", 0, 60), "recorded 1916, public domain in the US"),
    "o_christmas_tree": ("O Christmas Tree · USAF Airmen of Note", "christmas", "File:O Christmas Tree - Airmen of Note - United States Air Force Band.mp3", ("loud", 0, 120), "US Air Force, public domain"),
    "danse_macabre": ("Danse Macabre (1925) · Philadelphia Orchestra, Stokowski", "halloween", "File:PhiladelphiaSymphonyOrchestra-DanseMacabre.ogg", ("loud", 20, 120), "recorded 1925, public domain in the US"),
    "bald_mountain": ("Night on Bald Mountain · Musopen", "halloween", "File:Modest Mussorgsky - night on bald mountain.ogg", ("start",), "Musopen, public domain"),
    "funeral_march": ("Funeral March (Chopin) · Paul Pitman (Musopen)", "halloween", "File:Chopin Pitman sonata no 2 in b flat minor funeral march III marche funebre lento.ogg", ("start",), "Musopen, public domain"),
    "toccata": ("Toccata and Fugue in D minor · pipe organ", "halloween", "File:Toccata et Fugue BWV565.ogg", ("start",), "performer's own recording, released to the public domain"),
}
# A producer's beats bought outright: id -> (title, kind, local path, section, licence note)
LOCAL = {}

def api(**p):
    p.update(format="json")
    req = urllib.request.Request("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(p), headers=UA)
    for k in range(7):
        try: return json.load(urllib.request.urlopen(req, timeout=60))
        except urllib.error.HTTPError as e:
            if e.code != 429: raise
            time.sleep(int(e.headers.get("Retry-After") or 0) or 5 * 2 ** k)
    raise SystemExit("Wikimedia keeps rate-limiting; try again later")

def get(url, lo, hi):
    """Bytes lo..hi of a file. The media server turns requests away (429) when this address
    has fetched a lot lately; wait as long as it asks, a minute at most at a time."""
    for k in range(80):
        try:
            req = urllib.request.Request(url, headers={**UA, "Range": f"bytes={lo}-{hi}"})
            with urllib.request.urlopen(req, timeout=120) as r: return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 416: return b""
            if e.code != 429: raise
            time.sleep(min(60, int(e.headers.get("Retry-After") or 5)) if k > 3 else 3)
        except (urllib.error.URLError, TimeoutError): time.sleep(5)
    raise SystemExit("the media server would not serve " + url)

def fetch(url, dest, spans):
    """Download only the given byte spans of a file, in 512 KB pieces, joined end to end
    (an Ogg or MP3 decoder picks up again after a gap)."""
    if os.path.exists(dest) and os.path.getsize(dest) > 0: return
    with open(dest + ".part", "wb") as f:
        for lo, hi in spans:
            at = lo
            while at <= hi:
                b = get(url, at, min(hi, at + (1 << 19) - 1))
                if not b: break
                f.write(b); at += len(b)
    os.replace(dest + ".part", dest)

def decode(path):
    pcm = subprocess.run([FF, "-v", "error", "-i", path, "-ac", "2", "-ar", str(SR), "-f", "f32le", "pipe:1"], capture_output=True).stdout
    return np.frombuffer(pcm, dtype=np.float32).reshape(-1, 2).astype(np.float64)

def analyse(x):
    """Loudness (dB) and onset strength, every 25 ms."""
    m = x.mean(axis=1); hop, win = 1102, 2048
    n = max(1, (len(m) - win) // hop)
    frames = np.lib.stride_tricks.sliding_window_view(m, win)[::hop][:n] * np.hanning(win)
    rms = 20 * np.log10(np.sqrt((frames ** 2).mean(axis=1)) + 1e-9)
    spec = np.abs(np.fft.rfft(frames, axis=1)); spec = np.log1p(spec * 10)
    flux = np.concatenate([[0], np.maximum(0, np.diff(spec, axis=0)).sum(axis=1)])
    return rms, flux, hop / SR

def section(x, how):
    rms, flux, dt = analyse(x); total = len(x) / SR
    if how[0] == "start":
        t0 = max(0.0, np.argmax(rms > rms.max() - 35) * dt - .02)
    else:
        a = how[1] if how[1] >= 0 else total + how[1]; b = how[2] if how[2] >= 0 else total + how[2]
        a, b = max(0, a), min(total - CLIP, b - CLIP)
        best, t0 = -1e9, a
        for t in np.arange(a, max(a, b) + 1e-6, .5):
            i, j = int(t / dt), int((t + CLIP) / dt)
            seg = rms[i:j]
            if len(seg) < 10: continue
            score = seg.mean() - .6 * seg.std()          # loud and steady: no fade, no silence
            if score > best: best, t0 = score, t
    # begin on the strongest onset within 0.4 s
    i0, i1 = int(t0 / dt), int((t0 + .4) / dt) + 1
    t0 = (i0 + int(np.argmax(flux[i0:i1]))) * dt if i1 > i0 else t0
    return max(0.0, t0 - .01)

def tempo(seg):
    _, flux, dt = analyse(seg)
    f = flux - flux.mean(); ac = np.correlate(f, f, "full")[len(f) - 1:]
    lags = np.arange(len(ac)) * dt; ok = (lags > 60 / 180) & (lags < 60 / 70)
    if not ok.any() or ac[ok].max() <= 0: return 0, 0.0
    lag = lags[ok][np.argmax(ac[ok])]
    return round(60 / lag, 1), round(float(ac[ok].max() / ac[0]), 2)

def main():
    os.makedirs(OUT, exist_ok=True); os.makedirs(CACHE, exist_ok=True)
    titles = [t[2] for t in TRACKS.values()]
    info = {}
    for i in range(0, len(titles), 20):
        r = api(action="query", titles="|".join(titles[i:i + 20]), prop="imageinfo|videoinfo", iiprop="url|extmetadata|size|metadata", viprop="derivatives")
        norm = {n["to"]: n["from"] for n in r["query"].get("normalized", [])}
        for p in r["query"]["pages"].values():
            if "imageinfo" not in p: print("MISSING on Commons:", p["title"]); continue
            md = p["imageinfo"][0]["extmetadata"]; g = lambda k: md.get(k, {}).get("value", "")
            mm = {m["name"]: m["value"] for m in (p["imageinfo"][0].get("metadata") or []) if isinstance(m, dict) and "name" in m}
            # the smallest good copy: a ~100 kbps Ogg transcode where Commons has one, else the file itself
            der = [d for d in (p.get("videoinfo") or [{}])[0].get("derivatives", []) if "vorbis" in d.get("type", "") or d.get("type") == "audio/mpeg"]
            der.sort(key=lambda d: (0 if "vorbis" in d["type"] else 1, d.get("bandwidth", 1e9)))
            small = der[0] if der and der[0].get("bandwidth", 1e9) < 400000 else None
            info[norm.get(p["title"], p["title"])] = {"small": small and small["src"].split("?")[0], "small_bps": small and small.get("bandwidth"), "size": p["imageinfo"][0].get("size", 0), "length": float(mm.get("length") or mm.get("playtime_seconds") or 0), "url": p["imageinfo"][0]["url"], "page": p["imageinfo"][0]["descriptionurl"] if "descriptionurl" in p["imageinfo"][0] else "",
                                                     "license": g("LicenseShortName"), "artist": g("Artist"), "date": g("DateTimeOriginal")}
        time.sleep(2)
    manifest, total = [], 0
    for tid, (title, kind, src, how, basis) in {**TRACKS, **LOCAL}.items():
        if src.startswith("File:"):
            meta = info.get(src)
            if not meta: print("skip (not found):", tid); continue
            lic = meta["license"].lower()
            if not any(k in lic for k in ("public domain", "cc0")): print("skip (licence):", tid, meta["license"]); continue
            L = meta["length"] or 600
            if meta["small"]:
                url, bps = meta["small"], meta["small_bps"] / 8 * 1.15        # bytes a second, with room for variation
                ext = ".ogg" if meta["small"].endswith(".ogg") else ".mp3"
            else:
                url, bps, ext = meta["url"].split("?")[0], meta["size"] / L * 1.05, os.path.splitext(urllib.parse.urlparse(meta["url"]).path)[1]
            a, b = (0, CLIP + 4) if how[0] == "start" else (how[1] if how[1] >= 0 else L + how[1], how[2] if how[2] >= 0 else L + how[2])
            a, b = max(0, a - 1), min(L, b + 1)
            head = 0 if a < 2 else 24000                                      # the codec's set-up at the very start
            spans = ([(0, head - 1)] if head else []) + [(int(a * bps), int(b * bps) + 16000)]
            path = os.path.join(CACHE, tid + ext)
            fetch(url, path, spans)
        else:
            meta, path = {"url": "", "license": basis, "artist": "", "date": ""}, src
        x = decode(path)
        if len(x) < SR * (CLIP + 1): print("skip (too short):", tid); continue
        t0 = section(x, how)
        seg = x[int(t0 * SR):int((t0 + CLIP) * SR)].copy()
        bpm, beat_conf = tempo(seg)
        rms = np.sqrt((seg ** 2).mean()); seg *= 10 ** (-17 / 20) / (rms + 1e-9)       # every track at the same loudness
        pk = np.abs(seg).max()
        if pk > .97: seg *= .97 / pk
        n = len(seg); fi, fo = int(.015 * SR), int(1.2 * SR)
        seg[:fi] *= np.linspace(0, 1, fi)[:, None]; seg[-fo:] *= (np.linspace(1, 0, fo) ** 1.5)[:, None]
        dest = os.path.join(OUT, tid + ".mp3")
        subprocess.run([FF, "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "pipe:0", "-c:a", "libmp3lame", "-b:a", "112k", dest],
                       input=seg.astype(np.float32).tobytes(), check=True)
        total += os.path.getsize(dest)
        manifest.append({"id": tid, "title": title, "kind": kind, "bpm": bpm, "beat": beat_conf, "from": round(t0, 2),
                         "source": src, "url": meta["url"], "license": meta["license"], "basis": basis})
        print(f"{tid:20s} {kind:9s} from {t0:6.1f}s  {bpm:6.1f} bpm (beat {beat_conf:.2f})  {meta['license']}")
    with open(os.path.join(OUT, "index.json"), "w") as f: json.dump({"tracks": manifest}, f, indent=1, ensure_ascii=False)
    # the page's own list (motion/tracks.js): what each track is called, what it is, and its tempo
    js = os.path.join(OUT, "..", "..", "tracks.js")
    rows = [{k: t[k] for k in ("id", "title", "kind", "bpm", "beat")} for t in manifest]
    with open(js, "w") as f:
        f.write("// Real recordings the video maker can play under an ad. Made by scripts/build_motion_tracks.py:\n"
                "// the licence trail for each is in sounds/tracks/index.json.\n\nexport const TRACKS = " + json.dumps(rows, ensure_ascii=False, indent=1) + ";\n")
    print("tracks:", len(manifest), " KB:", total // 1024)

main()
