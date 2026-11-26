// Generates arcade voice clips with Kokoro-82M (hexgrad/kokoro, via kokoro-js ONNX),
// then applies a retro arcade filter with ffmpeg (band-limit + 8-bit crush + light echo).
// Usage: node tools/gen_voices.mjs <outDir>   (run with NODE_USE_ENV_PROXY=1 behind a proxy)
import { KokoroTTS } from "kokoro-js";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] || join(here, "../public/voice");
mkdirSync(out, { recursive: true });
const spec = JSON.parse(readFileSync(join(here, "voices.json"), "utf8"));
const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", { dtype: "q8", device: "cpu" });
const manifest = {};
for (const [group, g] of Object.entries(spec)) {
  for (const [key, text] of Object.entries(g.lines)) {
    const audio = await tts.generate(text, { voice: g.voice, speed: g.speed });
    const raw = join(out, key + ".raw.wav");
    await audio.save(raw);
    const af = group === "announcer"
      ? "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,highpass=f=140,lowpass=f=5200,acrusher=bits=8:mode=lin:mix=0.3:samples=2,aecho=0.8:0.5:55:0.22,volume=1.8,alimiter=limit=0.95"
      : "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,highpass=f=180,lowpass=f=4800,acrusher=bits=8:mode=lin:mix=0.25:samples=2,volume=1.6,alimiter=limit=0.95";
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", raw, "-af", af, "-ar", "22050", "-ac", "1", "-b:a", "56k", join(out, key + ".mp3")]);
    rmSync(raw);
    manifest[key] = key + ".mp3";
    console.log("ok", key);
  }
}
writeFileSync(join(out, "manifest.json"), JSON.stringify(manifest, null, 1));
