// Runs the Kokoro neural voice off the main thread so the games stay smooth.
// Model: onnx-community/Kokoro-82M-v1.0-ONNX (Apache-2.0), downloaded once by the browser and then cached.
import { KokoroTTS } from "./kokoro.web.js";

let tts = null;
self.onmessage = async (e) => {
  const m = e.data || {};
  if (m.type === "init") {
    try {
      tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
        dtype: "q8",
        device: "wasm",
        progress_callback: (p) => {
          if (p && p.status === "progress" && /\.onnx$/.test(p.file || "")) self.postMessage({ type: "progress", pct: Math.round(p.progress || 0) });
        },
      });
      self.postMessage({ type: "ready" });
    } catch (err) {
      self.postMessage({ type: "fail", err: String(err && err.message || err) });
    }
  } else if (m.type === "gen") {
    if (!tts) { self.postMessage({ type: "err", id: m.id, err: "not ready" }); return; }
    try {
      const t0 = performance.now();
      const a = await tts.generate(m.text, { voice: m.voice || "af_heart", speed: m.speed || 1 });
      const pcm = a.audio instanceof Float32Array ? a.audio : new Float32Array(a.audio);
      self.postMessage({ type: "audio", id: m.id, pcm, sr: a.sampling_rate, ms: performance.now() - t0 }, [pcm.buffer]);
    } catch (err) {
      self.postMessage({ type: "err", id: m.id, err: String(err && err.message || err) });
    }
  }
};
