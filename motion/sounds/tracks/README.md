# Real recordings

The video ad maker can play one of these under an ad instead of the music it makes
itself. Every one is a real performance that is free to use in an ad: `index.json`
records, for each, the Wikimedia Commons file it came from, its licence and the basis
for it.

What qualifies (scripts/build_motion_tracks.py checks the licence of every file):

- US government works: Marine Band, Army Band, Navy Band and Air Force band recordings,
  including pieces their own musicians composed (public domain under 17 U.S.C. 105).
- Musopen recordings, released to the public domain.
- Recordings published before 1926 (public domain in the US).
- Performers who released their own recordings to the public domain.

What never goes in: "PDP-CH" transfers (public domain in Switzerland, not the US),
"European Archive" LP transfers, synthesiser renditions, covers of songs still under
copyright, and anything with lyrics.

## Adding a producer's beats

Beats you commission as work-for-hire, or buy outright with a written licence that
allows them to ship inside this app, go in the same way:

1. Put the audio files somewhere the build can read them.
2. Add each to `LOCAL` in `scripts/build_motion_tracks.py`:
   `"my_beat": ("Title shown", "beats", "/path/to/file.wav", ("loud", 0, 60), "work-for-hire, <producer>, <date>")`
3. Run `python3 scripts/build_motion_tracks.py <ffmpeg>`. It cuts each to 12 seconds,
   starting on a strong beat, measures its tempo, evens its loudness, and lists it in
   `motion/tracks.js`, so it appears under "Real recording" and in shuffles.

Keep the signed licence with the business records; the note in `LOCAL` is what ends up
in `index.json`.
