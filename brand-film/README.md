# The Spotlight — brand film

Final cut: `public/brand/the-spotlight-film.mp4` (40 s, 1920×1080, 30 fps, -16 LUFS).
It's served on the site at `/brand/the-spotlight-film.mp4`.

## What's in here
- `film.html` — the motion graphics. Open it in a browser to preview in real time.
  All timings live in the `T` object at the top of the script, matched to the voiceover.
- `music.py` — the original score (96 BPM, A minor lifting to C), synthesized from scratch.
  `python3 music.py music.wav` regenerates `music.wav`.
- `vo/script.txt` + `vo/v1–v8.wav` — the voiceover, one clip per line, made with an
  offline female voice (CMU SLT, Festival). Swap these for a studio or ElevenLabs
  recording, keeping each line's start time, for a more natural read.
- `render.js` — renders frames with Playwright (`node render.js film.html frames 30 40`).

## Voiceover start times (s)
2.0, 6.5, 8.75, 12.0, 16.5, 21.5, 25.5, 31.25

## Re-encode
Mix voice over the music (music ducks under the voice), then encode the frames
with that mix: see the ffmpeg commands in this folder's history, or ask Claude.
