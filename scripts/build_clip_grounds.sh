#!/bin/bash
# The video maker's moving grounds (motion/clips/, read by motion/clips.js; DESIGN-LAW 175).
#
# Each ground is a square clip drawn first as a still (Seedream v4 on fal, 3 cents) and animated
# with MiniMax Hailuo 02 (Standard, 27 cents; the aerial on Pro, 48 cents), given the same picture
# as its first and last frame. Its last 0.75 s was then faded into its opening, so it loops without
# a jump (the motion-ground test, 2026-11-24). This script takes those loops and makes, per ground:
#
#   <id>.mp4         the clip for the page: H.264, no sound, a key frame every half second (12
#                    frames) and no B-frames, so the export can seek to any frame quickly
#   <id>.webp        its first frame, whole size: drawn until the clip can play, and by every
#                    path that wants a still (the gallery, the audit, the plan)
#   <id>-sheet.webp  12 frames across the clip, every 10th, 256 px, in a 4 x 3 grid: what the
#                    readability checks measure, so the words read on every moment, not the first
#
# usage: scripts/build_clip_grounds.sh <folder of loops>   (needs ffmpeg with libx264, and cwebp)
set -euo pipefail
SRC=${1:?folder of the looped clips}
OUT=$(cd "$(dirname "$0")/.." && pwd)/motion/clips
mkdir -p "$OUT"
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT

# id  <-  the loop it is made from
while read -r id src; do
  [ -z "$id" ] && continue
  in="$SRC/$src.mp4"; [ -f "$in" ] || { echo "missing $in" >&2; exit 1; }
  ffmpeg -nostdin -v error -y -i "$in" -an -c:v libx264 -preset slow -crf 23 -profile:v high -pix_fmt yuv420p \
    -g 12 -keyint_min 12 -sc_threshold 0 -bf 0 -movflags +faststart "$OUT/$id.mp4"
  ffmpeg -nostdin -v error -y -i "$OUT/$id.mp4" -frames:v 1 "$TMP/$id.png"
  cwebp -quiet -q 84 "$TMP/$id.png" -o "$OUT/$id.webp"
  ffmpeg -nostdin -v error -y -i "$OUT/$id.mp4" -vf "select='not(mod(n\,10))',scale=256:256:flags=area,tile=4x3" -frames:v 1 -fps_mode passthrough "$TMP/$id-sheet.png"
  cwebp -quiet -q 80 "$TMP/$id-sheet.png" -o "$OUT/$id-sheet.webp"
  read -r w h n d < <(ffprobe -v error -select_streams v -count_frames -show_entries stream=width,height,nb_read_frames:format=duration -of default=nw=1:nk=1 "$OUT/$id.mp4" < /dev/null | tr '\n' ' '; echo)
  printf '%-18s %sx%s %s frames %.3f s  mp4 %4d KB  still %3d KB  sheet %3d KB\n' "$id" "$w" "$h" "$n" "$d" \
    $(( $(stat -f%z "$OUT/$id.mp4") / 1024 )) $(( $(stat -f%z "$OUT/$id.webp") / 1024 )) $(( $(stat -f%z "$OUT/$id-sheet.webp") / 1024 ))
done <<'EOF'
clip_phone_light   phone_light
clip_neon_street   cars_night
clip_city_gold     city_air
clip_circuit       circuit_glow
clip_gold_bars     gold_bars
clip_city_aerial   la_aerial__hailuo_pro
EOF
