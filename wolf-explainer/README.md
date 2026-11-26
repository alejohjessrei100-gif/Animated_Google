# Wolf explainer: How you invented the doorbell (PS1 style)

`wolf-explainer.html` is one self-contained page: three.js scene + the mixed soundtrack (base64) + word times.
Open it in a browser; it keeps the page contract `canvas#c`, `window.ready`, `window.drawFrame(t)`, `window.END`.
The **Render MP4** button encodes the video on the device's own GPU/encoder (WebCodecs + mp4-muxer) and saves it.

- Engine and character build come from the low-poly-explainer kit (vertex snap, affine UVs, 23-level Bayer dither, slice plane).
- The wolf is 298 triangles; every texture is painted in code at 64 px or less.
- Edit `src/page.html`, then rebuild:

```bash
python3 -I tools/mix.py        # voice.mp3 + synthesised effects + felt-piano bed -> build/mix.mp3
python3 -I tools/envelope.py   # jaw track from the voice -> build/env.json
python3 -I tools/build.py      # -> wolf-explainer.html
```
