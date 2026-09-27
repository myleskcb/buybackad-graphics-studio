#!/usr/bin/env python3
"""Build the Tagline Lab review page from .render/tagline/manifest.json
(scripts/tagline_lab/render.mjs). Writes .render/tagline/page.html (fonts and
data inlined) and .render/tagline/files.json, the published-path -> source map
for the Artifact publish (images are served as img/<file>).

The page declares the `db` capability: the owner's picks are stored at
picks/<cardId> = {keep: [styles], best: style|null, at}. Read them back with
ArtifactData list on collection "picks".

usage: python3 scripts/tagline_lab/build.py
"""
import base64, json, pathlib

root = pathlib.Path(__file__).resolve().parents[2]
lab = root / '.render/tagline'
m = json.loads((lab / 'manifest.json').read_text())
b64 = lambda p: base64.b64encode((root / p).read_bytes()).decode()
page = (root / 'scripts/tagline_lab/page.html').read_text()
page = (page.replace('__SAT500__', b64('assets/fonts/satoshi-500.woff2'))
            .replace('__SAT700__', b64('assets/fonts/satoshi-700.woff2'))
            .replace('__CLASH600__', b64('assets/fonts/clash-display-600.woff2'))
            .replace('__DATA__', json.dumps(m, ensure_ascii=False).replace('</', '<\\/')))
(lab / 'page.html').write_text(page)
files = {f"img/{s['img']}": f".render/tagline/{s['img']}" for c in m['cards'] for s in c['styles']}
(lab / 'files.json').write_text(json.dumps(files, indent=1))
size = sum((root / v).stat().st_size for v in files.values())
print(f"{len(m['cards'])} ads x {len(m['styles'])} styles, page {len(page.encode()) // 1024} KB, {len(files)} images, {size // 1048576} MB")
