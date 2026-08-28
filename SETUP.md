# BUYBACK.AD monorepo, new machine setup

Two zips carry everything: `graphics-studio.zip` (the hosted site, all 129
backdrops, the Netlify backend function) and `orchard-photo-engine.zip` (the
local photo engine, your full generated-image library and settings database).

> These zips contain API keys (inside ORCHARD's data/orchard.db) and your
> whole asset library. Move them privately, never post them anywhere.

## 1. Prerequisites (one-time)

```sh
# Node 18+ (both servers are zero-dependency Node)
node -v

npm install -g netlify-cli
brew install gh          # GitHub CLI

netlify login            # Myles CB / myleskcb@gmail.com
gh auth login
```

## 2. Create the monorepo

```sh
mkdir -p ~/code/buyback/apps && cd ~/code/buyback
git init

# unzip both apps (zips extract as gfxv23/ and apple-photo-engine/)
unzip ~/Downloads/graphics-studio.zip -d apps/
unzip ~/Downloads/orchard-photo-engine.zip -d apps/
mv apps/gfxv23 apps/graphics-studio
mv apps/apple-photo-engine apps/orchard

# third app straight from GitHub (canonical repo, drives scans.ad via CD)
gh repo clone myleskcb/scanmap apps/scanmap

cat > .gitignore <<'EOF'
node_modules/
.netlify/
.env
.DS_Store
*.log
EOF

git add -A && git commit -m "Monorepo: graphics-studio + orchard + scanmap"

# optional but recommended: push it
gh repo create myleskcb/buyback-monorepo --private --source . --push
```

## 3. Graphics Studio (hosted site)

```sh
cd ~/code/buyback/apps/graphics-studio
npm install                                     # just @netlify/blobs
netlify link --id 95709613-cca5-4113-9498-68607779a4e9

# local dev secrets: copy the real values into .env
cp .env.example .env
netlify env:list --plain                        # paste JWT_SECRET + GEMINI_KEY into .env

netlify dev --port 8877                         # local:  http://localhost:8877
netlify deploy --prod                           # ship to production
```

Notes:
- Deploys are CLI-direct from this folder (the GitHub repo
  myleskcb/buybackad-graphics-studio is history, not CD).
- Live site: https://buybackad-graphics-studio.netlify.app
  (buyback.ad + www + studio.scans.ad are attached and go live once DNS exists).

## 4. ORCHARD photo engine (local tool)

```sh
cd ~/code/buyback/apps/orchard
GFX_BG_DIR="$HOME/code/buyback/apps/graphics-studio/assets/bg" node server.js
# → http://localhost:4477            (product photos)
# → http://localhost:4477/backgrounds.html   (129-slot backdrop board + curate wizard + library picker)
```

- `GFX_BG_DIR` tells ORCHARD where to write approved backdrops. Make it
  permanent by putting the export line in your shell profile, or edit the
  BG_DIR fallback near the top of server.js.
- Keys, budget ledger, style profiles and the full generation history are in
  `data/orchard.db` (already in the zip). The 359-image library is `output/`.
- `regen_dupes.py` is the quota watcher for duplicate-slot candidates; run
  `python3 regen_dupes.py &` if it never completed on the old machine
  (check regen_dupes.log).

## 5. Claude Code launch config (optional)

If you use the browser preview tools, recreate `.claude/launch.json` in your
working directory:

```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "photo-engine", "runtimeExecutable": "sh",
      "runtimeArgs": ["-c", "cd $HOME/code/buyback/apps/orchard && GFX_BG_DIR=$HOME/code/buyback/apps/graphics-studio/assets/bg node server.js"],
      "port": 4477 },
    { "name": "gfx-dev", "runtimeExecutable": "sh",
      "runtimeArgs": ["-c", "cd $HOME/code/buyback/apps/graphics-studio && netlify dev --port 8877 --offline"],
      "port": 8877 }
  ]
}
```

## 6. Sanity checklist after setup

- [ ] http://localhost:4477/backgrounds.html shows 129/129 live
- [ ] http://localhost:8877 loads, sign-in works, templates show photo backdrops
- [ ] `netlify deploy --prod` from graphics-studio succeeds
- [ ] ORCHARD approve on any slot writes a JPG into apps/graphics-studio/assets/bg
