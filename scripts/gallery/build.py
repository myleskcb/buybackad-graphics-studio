#!/usr/bin/env python3
"""Build the "Video Ad Cuts" playback gallery from every rendered round.

Each round is a folder made by scripts/motion_gallery.mjs (v1 came from the
retired scripts/video_gallery.mjs):
  .render/video/gallery/<version>/{manifest.json, clips/, posters/}
This writes .render/video/gallery/page.html (fonts and data inlined) and
.render/video/gallery/files.json, the published-path -> source map for the
Artifact publish. The gallery artifact lives at
https://claude.ai/artifact/G9CVJtTGMTQBpYA3AyZQmj — republish to that URL so
earlier rounds stay beside the new one for before-and-after.

usage: python3 scripts/gallery/build.py
"""
import base64, json, pathlib

root = pathlib.Path(__file__).resolve().parents[2]
gal = root / '.render/video/gallery'
rounds = sorted((json.loads(p.read_text()) for p in gal.glob('*/manifest.json')), key=lambda m: m['made'])
if not rounds:
    raise SystemExit('no rounds in ' + str(gal) + ': run scripts/motion_gallery.mjs first')
b64 = lambda p: base64.b64encode((root / p).read_bytes()).decode()
page = (root / 'scripts/gallery/page.html').read_text()
page = (page.replace('__SAT500__', b64('assets/fonts/satoshi-500.woff2'))
            .replace('__SAT700__', b64('assets/fonts/satoshi-700.woff2'))
            .replace('__CLASH600__', b64('assets/fonts/clash-display-600.woff2'))
            .replace('__DATA__', json.dumps(rounds, ensure_ascii=False).replace('</', '<\\/')))
(gal / 'page.html').write_text(page)
files = {}
for m in rounds:
    for c in m['clips']:
        for k in ('clip', 'poster', 'end'):            # 'end': where a v2+ clip lands
            if c.get(k):
                files[f"{m['version']}/{c[k]}"] = f".render/video/gallery/{m['version']}/{c[k]}"
(gal / 'files.json').write_text(json.dumps(files, indent=1))
print(f"{len(rounds)} round(s), {sum(len(m['clips']) for m in rounds)} clips, page {len(page.encode()) // 1024} KB, {len(files)} files")
