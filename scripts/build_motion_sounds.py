#!/usr/bin/env python3
"""Build motion/sounds/ from the Versilian Community Sample Library (CC0 1.0).

Picks a few zones per pitched instrument and one-shots for percussion and effects,
trims the silence, evens their level, encodes small mono MP3s and writes a manifest
that records the exact VCSL source file of every sound (the licence trail).

Then it MEASURES each note rather than trusting its file name: the library's
contributors label octaves two ways (middle C as C4 or as C3), the harpsichord's
8-foot register sounds an octave over its labels, some organ notes are dominated by
their octave pipe, and the kalimba is tuned by ear. Every zone gets the octave it
really sounds in (`shift`, and +1200 cents for an organ note that sounds an octave
up) and a fine tuning in cents, so every instrument plays in tune with every other.

usage: python3 scripts/build_motion_sounds.py <VCSL clone> motion/sounds <ffmpeg>
  (git clone --filter=blob:none https://github.com/sgossner/VCSL; any ffmpeg with libmp3lame)
"""
import json, os, re, subprocess, sys, numpy as np

VCSL = sys.argv[1]
OUT = sys.argv[2]
FF = sys.argv[3]
SR = 44100
NOTE = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}

files = subprocess.run(["git", "-C", VCSL, "ls-tree", "-r", "--name-only", "HEAD"], capture_output=True, text=True).stdout.split("\n")

def midi_of(name):
    m = re.search(r"(?<![A-Za-z])([A-G]#?)(-?\d)(?=[_.])", os.path.basename(name))
    return None if not m else (int(m.group(2)) + 1) * 12 + NOTE[m.group(1)]

def load(path):
    raw = subprocess.run(["git", "-C", VCSL, "show", "HEAD:" + path], capture_output=True).stdout
    pcm = subprocess.run([FF, "-v", "error", "-i", "pipe:0", "-ac", "1", "-ar", str(SR), "-f", "f32le", "pipe:1"], input=raw, capture_output=True).stdout
    return np.frombuffer(pcm, dtype=np.float32).copy()

def trim(x, max_len, tail=.25):
    a = np.abs(x)
    thr = max(a.max() * .02, 1e-4)
    i0 = max(0, int(np.argmax(a > thr)) - int(.002 * SR))
    x = x[i0:i0 + int(max_len * SR)]
    # end where it has died away, then fade the last part
    env = np.convolve(np.abs(x), np.ones(512) / 512, mode="same")
    alive = np.where(env > a.max() * .003)[0]
    if len(alive): x = x[:min(len(x), alive[-1] + 512)]
    n = min(len(x), int(tail * SR))
    x[-n:] *= np.linspace(1, 0, n) ** 2
    return x

def level(x, target_rms=.12, win=.35):
    head = x[:int(win * SR)]
    rms = np.sqrt(np.mean(head ** 2)) + 1e-9
    x = x * (target_rms / rms)
    pk = np.abs(x).max()
    return x * (.95 / pk) if pk > .95 else x

def write(x, dest, kbps=96):
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    subprocess.run([FF, "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "pipe:0", "-c:a", "libmp3lame", "-b:a", f"{kbps}k", dest],
                   input=x.astype(np.float32).tobytes(), check=True)

# id: (folder, filename must match, lowest midi, highest midi, spacing in semitones, max seconds)
PITCHED = {
    "piano":      ("Chordophones/Zithers/Grand Piano, Steinway B/Sus/", r"_vl3_rr1", 36, 96, 3, 2.6),
    "epiano":     ("Electrophones/TX81Z/FM Piano/", r"_vl2", 36, 96, 6, 2.2),
    "vibes":      ("Idiophones/Struck Idiophones/Vibraphone/Hard Mallets/", r"_v2_rr1", 50, 90, 3, 2.4),
    "marimba":    ("Idiophones/Struck Idiophones/Marimba/", r"_med_", 36, 96, 5, 1.6),
    "xylophone":  ("Idiophones/Struck Idiophones/Xylophone/Hard Mallets/", r"_ff_01", 55, 100, 5, 1.2),
    "glock":      ("Idiophones/Struck Idiophones/Glockenspiel/", r"glock_medium_", 67, 108, 5, 1.6),
    "organ":      ("Aerophones/Edge-blown Aerophones/Pipe Organ/Loud/", r"", 24, 96, 3, 2.6),
    "harpsichord":("Chordophones/Zithers/Harpsichord, Flemish/Sustains/Low/", r"_rr1", 36, 90, 3, 2.0),
    "sax":        ("Aerophones/Reed Aerophones/Tenor Saxophone/Non-Vibrato/", r"_vl3_rr1", 44, 80, 3, 2.2),
    "harp":       ("Chordophones/Composite Chordophones/Concert Harp/", r"_mf1", 36, 100, 3, 2.4),
    "kalimba":    ("Idiophones/Plucked Idiophones/Kalimba, Tanzania/", r"", 40, 90, 3, 1.6),
    "bells":      ("Idiophones/Struck Idiophones/Tubular Bells 2/", r"_v2_", 60, 80, 2, 3.0),
}

# id: (exact VCSL path, max seconds, level)
HITS = {
    "cowbell":       ("Idiophones/Struck Idiophones/Cowbells/Cowbell1_Normal_v3_rr1_Mid.wav", .8, .14),
    "cowbell_mute":  ("Idiophones/Struck Idiophones/Cowbells/Cowbell1_Muted_v3_rr1_Mid.wav", .4, .14),
    "agogo_hi":      ("Idiophones/Struck Idiophones/Agogo Bells/Agogo_High_v2_rr1_Mid.wav", .7, .12),
    "agogo_lo":      ("Idiophones/Struck Idiophones/Agogo Bells/Agogo_Low_v2_rr1_Mid.wav", .7, .12),
    "clave":         ("Idiophones/Struck Idiophones/Claves/Claves1_Hit_v2_rr1_Mid.wav", .3, .14),
    "guiro":         ("Idiophones/Struck Idiophones/Guiro/Guiro_Fast_rr1_Mid.wav", .5, .1),
    "guiro_hit":     ("Idiophones/Struck Idiophones/Guiro/Guiro_Hit_rr1_Mid.wav", .3, .1),
    "shaker":        ("Idiophones/Struck Idiophones/Shaker, Small/Mid_ShakerHighFaster_Down_rr1.wav", .3, .08),
    "shaker_up":     ("Idiophones/Struck Idiophones/Shaker, Small/Mid_ShakerHighFaster_Up_rr1.wav", .3, .08),
    "cabasa":        ("Idiophones/Struck Idiophones/Cabasa/Cabasa1_Hit_rr1_Mid.wav", .3, .08),
    "tamb":          ("Idiophones/Struck Idiophones/Tambourine 1/Tamb1_Hit_v2_rr1_Mid.wav", .6, .1),
    "tamb_shake":    ("Idiophones/Struck Idiophones/Tambourine 1/Tamb1_Shake_rr1_Mid.wav", .6, .08),
    "clap":          ("Idiophones/Struck Idiophones/Claps/Clap_rr1.wav", .5, .14),
    "clap2":         ("Idiophones/Struck Idiophones/Claps/Clap_rr2.wav", .5, .14),
    "hat":           ("Idiophones/Struck Idiophones/Hi-Hat Cymbal/HiHat_HitC_v3_rr1_Mid.wav", .25, .08),
    "hat_open":      ("Idiophones/Struck Idiophones/Hi-Hat Cymbal/HiHat_HitLoose_rr1_Mid.wav", .8, .08),
    "snare":         ("Membranophones/Struck Membranophones/Snare Drum, Modern 1/Snare2_HitSN_v5_rr1_Mid.wav", .6, .14),
    "rim":           ("Membranophones/Struck Membranophones/Tom 2/TomL_rimS_v2_rr1_Mid.wav", .3, .12),
    "bass_drum":     ("Membranophones/Struck Membranophones/Bass Drum 1/BDrumNew_hit_v5_rr1_Sum.wav", 1.6, .2),
    "tom_hi":        ("Membranophones/Struck Membranophones/Tom 1/Stick/TomH_HitS_v3_rr1_Mid.wav", .8, .14),
    "tom_lo":        ("Membranophones/Struck Membranophones/Tom 2/Stick/TomL_HitS_v4_rr1_Mid.wav", .9, .14),
    "bongo_hi":      ("Membranophones/Struck Membranophones/Bongos/BongoH_Hit1_v2_rr1_Mid.wav", .4, .12),
    "bongo_lo":      ("Membranophones/Struck Membranophones/Bongos/BongoL_Hit1_v3_rr1_Mid.wav", .5, .12),
    "conga":         ("Membranophones/Struck Membranophones/Conga/Conga_HitN_v2_rr1_Sum.wav", .6, .13),
    "conga_mute":    ("Membranophones/Struck Membranophones/Conga/Conga_HitFM_v1_rr1_Sum.wav", .4, .12),
    "tumba":         ("Membranophones/Struck Membranophones/Conga/Tumba_HitN_v3_rr1_Sum.wav", .7, .13),
    "cajon":         ("Idiophones/Struck Idiophones/Cajon/Cajon_hit1_f_rr1.wav", .5, .14),
    "cajon_slap":    ("Idiophones/Struck Idiophones/Cajon/Cajon_hit2_f_rr1.wav", .4, .13),
    "frame_drum":    ("Membranophones/Struck Membranophones/Frame Drum/HDrumL_Hit_v3_rr1_Sum.wav", 1.0, .14),
    "timpani":       ("Membranophones/Struck Membranophones/Timpani 1/Hit/Timpani1_Hit_v4_rr1_Sum.wav", 2.4, .2),
    "woodblock":     ("Idiophones/Struck Idiophones/Woodblock/wood_click_f_rr1.wav", .3, .12),
    "triangle":      ("Idiophones/Struck Idiophones/Triangles/Legacy/1/triangle1_hit_mp.wav", 2.0, .06),
    "crash":         ("Idiophones/Struck Idiophones/Clash Cymbals 1/cymbal_crash1_ff2.wav", 2.6, .1),
    "cym_swell":     ("Idiophones/Struck Idiophones/Suspended Cymbal 1/susCymb1_cresc_2s.wav", 3.0, .06),
    "ride_bell":     ("Idiophones/Struck Idiophones/Suspended Cymbal 1/susCymb1_hit_bell_mf1.wav", 1.6, .08),
    "gong":          ("Idiophones/Struck Idiophones/Gong 1/gong_f.wav", 3.0, .14),
    "anvil":         ("Idiophones/Struck Idiophones/Anvil/Anvil_Hit1_v3_rr1_Mid.wav", 1.4, .12),
    "brake_drum":    ("Idiophones/Struck Idiophones/Brake Drum/BrakeDrum1_Hammer_v2_rr1_Mid.wav", .9, .12),
    "whip":          ("Idiophones/Struck Idiophones/Slapstick/slapstick_rr1.wav", .4, .16),
    "vibraslap":     ("Idiophones/Struck Idiophones/Vibraslap/Legacy/vibraslap_rr1.wav", 1.4, .1),
    "ratchet":       ("Idiophones/Struck Idiophones/Ratchet/Ratchet1_Fast_rr1_Mid.wav", .9, .08),
    "windchimes":    ("Idiophones/Struck Idiophones/Mark Trees/Legacy/windchimes_fastAsc1.wav", 2.4, .05),
    "bell_tree":     ("Idiophones/Struck Idiophones/Bell Tree/Stroke/BellTree_Stroke_1_Mid.wav", 2.4, .05),
    "whistle":       ("Aerophones/Edge-blown Aerophones/Ball Whistle/Main_BallWhistle_Short-001.wav", .8, .1),
    "whistle_long":  ("Aerophones/Edge-blown Aerophones/Ball Whistle/Main_BallWhistle_Long-001.wav", 1.6, .1),
    "siren":         ("Aerophones/Free Aerophones/Siren/Main_SirenWhistle-005.wav", 2.4, .08),
    "sleigh":        ("Idiophones/Struck Idiophones/Sleigh Bells/Sleighbells_Hit_rr1_Mid.wav", .6, .07),
    "sleigh_shake":  ("Idiophones/Struck Idiophones/Sleigh Bells/sleighbell1_shake1.wav", 1.8, .06),
}

have = set(files)
manifest = {"source": "Versilian Community Sample Library (VCSL), CC0 1.0 Universal, https://github.com/sgossner/VCSL",
            "pitched": {}, "hits": {}}
total = 0
for inst, (folder, pat, lo, hi, step, mx) in PITCHED.items():
    cands = {}
    for f in files:
        if f.startswith(folder) and f.endswith(".wav") and re.search(pat, f):
            m = midi_of(f)
            if m is not None and lo <= m <= hi and m not in cands: cands[m] = f
    if not cands: sys.exit(f"no zones for {inst}")
    keep, last = [], -99
    for m in sorted(cands):
        if m - last >= step: keep.append(m); last = m
    zones = {}
    for m in keep:
        x = level(trim(load(cands[m]), mx, tail=.35 if mx > 1.5 else .15))
        dest = f"{OUT}/{inst}/{m}.mp3"; write(x, dest); total += os.path.getsize(dest)
        zones[m] = cands[m]
    manifest["pitched"][inst] = {"zones": sorted(zones), "files": {str(k): v for k, v in zones.items()}}
    print(inst, len(zones), "zones", sorted(zones)[0], "-", sorted(zones)[-1])
for hid, (path, mx, rms) in HITS.items():
    if path not in have: sys.exit(f"missing {path}")
    x = level(trim(load(path), mx, tail=min(.3, mx * .4)), target_rms=rms, win=.12)
    dest = f"{OUT}/{hid}.mp3"; write(x, dest, 112); total += os.path.getsize(dest)
    manifest["hits"][hid] = path
print("total KB", total // 1024)
# ------------------------------------------------------------ what each note really sounds

# instruments whose labels sit an octave under what they sound (measured: the waveform
# repeats every half of the labelled period, and the labelled fundamental is absent)
SHIFT = {"xylophone": 12, "glock": 12, "kalimba": 12, "vibes": 12, "marimba": 12, "sax": 12, "harpsichord": 12}

def decoded(inst, m):
    return np.frombuffer(subprocess.run([FF, "-v", "error", "-i", f"{OUT}/{inst}/{m}.mp3", "-ac", "1", "-ar", str(SR), "-f", "f32le", "pipe:1"],
                                        capture_output=True).stdout, dtype=np.float32).astype(np.float64)

def period_match(x, f):
    seg = x[4410:4410 + 8192]; L0 = SR / f
    def R(L):
        L = int(L); a, b = seg[:len(seg) - L], seg[L:]
        return np.dot(a, b) / np.sqrt(np.dot(a, a) * np.dot(b, b) + 1e-12)
    return max(R(round(L0) + d) for d in (-1, 0, 1))

def cents_off(x, f0):
    seg = x[int(.03 * SR):int(.03 * SR) + 16384]; N = 262144
    X = np.abs(np.fft.rfft(seg * np.hanning(len(seg)), N)); fr = np.fft.rfftfreq(N, 1 / SR)
    band = (fr > f0 * 2 ** (-1 / 12)) & (fr < f0 * 2 ** (1 / 12))
    if X[band].max() < X.max() * .05:            # a weak fundamental: read the 2nd harmonic
        f0 *= 2; band = (fr > f0 * 2 ** (-1 / 12)) & (fr < f0 * 2 ** (1 / 12))
    k = np.where(band)[0][np.argmax(X[band])]
    a, b, c = np.log(X[k - 1:k + 2] + 1e-12); p = .5 * (a - c) / (a - 2 * b + c)
    return 1200 * np.log2((k + p) * SR / N / f0)

for inst, v in manifest["pitched"].items():
    sh = SHIFT.get(inst, 0); v["shift"] = sh; v["cents"] = {}
    for m in v["zones"]:
        x = decoded(inst, m); f0 = 440 * 2 ** ((m + sh - 69) / 12)
        # under C3 the fundamental is too weak to measure, and a tubular bell has no single
        # partial at its pitch: those keep the recording's own tuning
        c = 0 if inst == "bells" or m + sh < 48 else max(-60, min(60, round(cents_off(x, f0))))
        if inst == "organ" and period_match(x, 2 * f0) >= .9: c += 1200     # the octave pipe leads this note
        v["cents"][str(m)] = c
    print(inst, "shift", sh, list(v["cents"].values()))
with open(f"{OUT}/index.json", "w") as fp: json.dump(manifest, fp, indent=1)

