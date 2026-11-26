# OddTilt-style low-poly Shorts (Three.js + Remotion)

Episode 1: **How you invented the doorbell!** It stars the wolf in a suit. The script and beat sheet are in [SCRIPT.md](SCRIPT.md).

```bash
npm install
npm run wolf      # character turnaround → out/wolf_turnaround.png
npm run preview   # 540x960 quick render
npm run full      # 1080x1920 final → out/doorbell_1080p.mp4
npm run studio    # live editing
```

Audio: `public/voice.wav` (Piper TTS narrator) is mixed with synthesised foley and music by
`python3 tools/audio.py public/voice.wav public/mix.wav`. Re-run that after changing any SFX cue frames.

| file | what |
|---|---|
| `src/wolf.tsx` | main character rig (poses, puffed cheeks, neck brace, bandage, briefcase) |
| `src/pig.tsx` | pig homeowner / cop pig |
| `src/set.tsx` | street, brick house, hanging bell, electric bell board (button, battery, coil, nail, hammer, spring contact), VFX |
| `src/Short.tsx` | key frames, camera shots, per-frame staging, captions |
| `src/timeline.ts` | word timings from the voiceover |
| `src/lowpoly.tsx` | flat-shaded materials, 5-frame pop-in, green/red emissive flash |
