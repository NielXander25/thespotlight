# The Spotlight — 20s brand intro

Final cut: `The_Spotlight_Intro_20s.mp4` (20s, 1920×1080, 30fps, 16:9).

Content is drawn straight from the Public Identity Overview: the hook
("Remarkable things happen every day / Most go unseen"), the positioning
("We find what others miss"), the six things The Spotlight covers, the
differentiator ("People beyond popularity"), the guiding belief ("Visibility
can create possibility"), and the logo sting.

## Files
- `film.html` — the animation. Open in a browser to preview in real time.
  All timings are in the `T` object; scene copy is in `T`/`CARDS`.
- `music.py` — the original 20s score. `python3 music.py music.wav` regenerates it.
- `render.js` — renders frames with Playwright: `node render.js film.html frames 30 20`.
- `fonts/`, `logo-mark.png` — brand assets used by the film.

## Reusable logo sting
`renderSting(t, t0)` in `film.html` is the self-contained logo animation
(mark lights up → ring draws → wordmark assembles → tagline tracks in → CTA).
Keep it identical across future videos for a consistent brand sign-off: copy
the `#sting` markup, its CSS, and `renderSting()` into any new film and call it
at the moment you want the reveal.

## Re-encode (music normalized, muxed with frames)
```
ffmpeg -framerate 30 -i frames/f%05d.jpg -i music.wav \
  -filter_complex "[1:a]loudnorm=I=-15:TP=-1.5:LRA=11,atrim=0:20[a]" \
  -map 0:v -map "[a]" -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p \
  -movflags +faststart -c:a aac -b:a 192k -shortest out.mp4
```
