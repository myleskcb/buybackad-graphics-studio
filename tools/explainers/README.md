# Explainer videos

Five short video ads for WeBuy.AD itself (the owner, 2026-11-11: videos
that "explain all the functions and how to make ads on our platform", for
"people who don't even understand the platform", with the AI comparison and
the price, and "make it seem like a no-brainer"). Square 1080, 30 frames a
second, H.264 with AAC, each readable with the sound off.

| file | what it says | length |
|---|---|---|
| `what-it-is` | who it is for and what it makes | 20 s |
| `how-to-make-an-ad` | the three steps, on the studio's own screens | 32 s |
| `look-professional` | a post typed over a photo beside an ad made here | 24 s |
| `ai-vs-ready-made` | asking an AI and trying again, or picking a finished design | 33 s |
| `the-math` | the plans as cents an ad | 19 s |

The finished files are `assets/explainers/<id>.mp4` and `<id>.jpg` (the
poster). `learn.html` shows them; the landing's workflow section links to it.

## Change one

The words and the timing are `videos.js`: a video is a list of scenes, a scene
a list of parts with the second each comes in. `engine.js` draws any second
from the time alone, so the same page plays live and renders to a file.

```bash
python3 -m http.server 8899
```

Open `http://localhost:8899/tools/explainers/stage.html?v=the-math` to watch
one play (`&t=6.5` holds a frame).

```bash
node tools/explainers/render.mjs --sheet
```

writes a sheet of frames per video into `tools/explainers/.out/` to look at
before rendering, and

```bash
node tools/explainers/render.mjs
```

renders them all (`--only <id>` for one; about half a minute each). It needs
Chromium through Playwright (`PLAYWRIGHT_MODULE=/path/to/playwright` when it is
not on the module path) and ffmpeg with libx264.

The end card prints the site's address, `webuy.ad`, which answers since
2026-11-19 (OPEN-ITEMS §BL); `--url other.example` prints another and
`--url none` the plain line instead. An ad must not send people to an address
that does not answer.

The look is the site's (DESIGN-LAW 152, 153, 2026-11-19): reselling.us's navy,
light grey and blue grounds, mint for the highlighted words, flat cards, the
system face, and the WeBuy.AD wordmark and W. icon on the end card and in the
corner. The screens are taken in the site's dark mode (`shots.mjs`,
`SHOTS_SCHEME=light` for the other).

## What the videos may say

Only what the product does. `node tools/explainers/check.mjs` fails when a
number in `videos.js` (its `FACTS` block) is not `netlify/lib/plans.mjs`'s, or
a picture is missing; run it after changing a plan. The screens are cut out of
the running studio by `shots.mjs` (run it against a deploy to take them again
after the studio's look changes). The ads are the library's own renders, and
the number typed in the walkthrough is a 555-01xx one. No customer results,
no reviews, no rival's product: the "typed over a photo" post and the AI
"tries" are drawn as plain shapes, never passed off as anyone's work (rule 55).

The music is from `motion/sounds/tracks` (public-domain recordings; `index.json`
there has each source): orchestral since 2026-11-19 (New World, Vivaldi's
Winter, Mozart 40), not the big-band jazz, since the owner wants the video
ads to sound like a trailer or a commercial. Each track is a 12-second clip:
it plays from its start and repeats under a 1.2 s crossfade to the end of the
picture. Before 2026-11-19 the render started 4 s into the clip and every
video went silent after 8 s. The video maker's own trailer bed
(`motion/music.js`, branch `claude/video-music-sfx-audit-3691d1`) is drawn
live and is not a file yet; once it is, it is the better bed here.

## Not done

- Story (9:16) cuts for Reels and TikTok: the scenes are placed for a square.
- A voiceover. The lines on screen are the script.
- Spanish.
