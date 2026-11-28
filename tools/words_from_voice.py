#!/usr/bin/env python3
"""voice -> words.js. Usage: words_from_voice.py <voice_125.wav> <out words.js> ["prompt words"]
Word timings with faster-whisper; number words become digits ("five hundred" -> 500); But/So capitalised."""
import json, sys, subprocess, re, os
os.environ.setdefault("HF_HUB_DISABLE_XET", "1")
import numpy as np
from faster_whisper import WhisperModel
src, out = sys.argv[1], sys.argv[2]; prompt = sys.argv[3] if len(sys.argv) > 3 else "Gus, Steve, kingdom."
a = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True).stdout, np.float32)
segs, _ = WhisperModel("small.en", compute_type="int8").transcribe(a, word_timestamps=True, initial_prompt=prompt)
W = [[w.word.strip(), round(w.start, 2), round(w.end, 2)] for s in segs for w in s.words]
UNITS = {w: i for i, w in enumerate("zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split())}
TENS = {w: 10 * i for i, w in enumerate("_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()) if w != "_"}
SCALE = {"hundred": 100, "thousand": 1000, "million": 1000000}
core = lambda t: re.sub(r"[^a-z\-]", "", t.lower())
def isnum(t): return all(p in UNITS or p in TENS or p in SCALE for p in core(t).split("-") if p) and core(t) != ""
out_w, i = [], 0
while i < len(W):
    if isnum(W[i][0]) and core(W[i][0]) not in SCALE:
        j, total, cur = i, 0, 0
        while j < len(W) and isnum(W[j][0]):
            for p in core(W[j][0]).split("-"):
                if p in UNITS: cur += UNITS[p]
                elif p in TENS: cur += TENS[p]
                elif p == "hundred": cur *= 100
                else: total += cur * SCALE[p]; cur = 0
            j += 1
            if re.search(r"[.,!?]$", W[j - 1][0]): break
        tail = re.search(r"[.,!?]*$", W[j - 1][0]).group(0)
        val = total + cur; start = W[i][1] if W[i][2] > W[i][1] else max(0, W[i][1] - 0.2)
        out_w.append([str(val) + tail, round(start, 2), W[j - 1][2]]); i = j; continue
    t = W[i][0]
    if core(t) in ("but", "so"): t = t[0].upper() + t[1:]
    s, e = W[i][1], W[i][2]
    if out_w and s <= out_w[-1][1]: s = round(out_w[-1][1] + 0.1, 2)
    out_w.append([t, s, max(e, s + 0.05)]); i += 1
open(out, "w").write("window.WORDS = " + json.dumps(out_w) + ";\n")
print(" ".join(w[0] for w in out_w)); print(f"{len(out_w)} words, last word ends {out_w[-1][2]:.2f} s -> END = {out_w[-1][2] + 0.4:.1f}")
