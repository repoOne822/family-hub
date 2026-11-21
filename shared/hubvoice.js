// 🗣️ Natural (human-like) voice for the kids' games.
// Uses the Kokoro neural voice in a Web Worker; audio is cached in memory and in IndexedDB so
// repeated lines (instructions, praise, common questions) play instantly. English only;
// Chinese and anything that fails fall back to the device voice in the game.
const V = { st: "off", pct: 0, err: "", w: null, q: [], busy: null, id: 0, jobs: {}, mem: new Map(), ctx: null, src: null, tok: 0, slowN: 0, slow: false, getS: () => ({}), db: null };
const MODEL_KEY = "kokoro82m-q8";

const clean = (t) => String(t || "").replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{20E3}]/gu, "").replace(/[☐_]{1,}/g, " blank ").replace(/\s+/g, " ").trim();
const voiceName = () => V.getS().aiVoiceName || "af_heart";
const key = (t) => `${MODEL_KEY}|${voiceName()}|${clean(t)}`;

/* ---------- IndexedDB cache (Int16, last ~250 lines) ---------- */
function idb() {
  if (V.db) return V.db;
  V.db = new Promise((res) => {
    try {
      const r = indexedDB.open("hubvoice", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("a");
      r.onsuccess = () => res(r.result);
      r.onerror = () => res(null);
    } catch (e) { res(null); }
  });
  return V.db;
}
async function idbGet(k) {
  const db = await idb(); if (!db) return null;
  return new Promise((res) => {
    try {
      const g = db.transaction("a").objectStore("a").get(k);
      g.onsuccess = () => { const v = g.result; if (!v) return res(null); const f = new Float32Array(v.d.length); for (let i = 0; i < f.length; i++) f[i] = v.d[i] / 32767; res({ pcm: f, sr: v.sr }); };
      g.onerror = () => res(null);
    } catch (e) { res(null); }
  });
}
async function idbPut(k, a) {
  const db = await idb(); if (!db) return;
  try {
    const d = new Int16Array(a.pcm.length); for (let i = 0; i < d.length; i++) d[i] = Math.max(-1, Math.min(1, a.pcm[i])) * 32767;
    const tx = db.transaction("a", "readwrite"), st = tx.objectStore("a");
    st.put({ d, sr: a.sr, at: Date.now() }, k);
    const c = st.count(); c.onsuccess = () => { if (c.result > 260) { const cur = st.openCursor(); let n = c.result - 250; cur.onsuccess = () => { const x = cur.result; if (x && n-- > 0) { x.delete(); x.continue(); } }; } };
  } catch (e) {}
}

/* ---------- worker + queue ---------- */
function pump() {
  if (V.busy || !V.q.length || V.st !== "ready") return;
  const job = V.q.shift(); const id = ++V.id; V.busy = id; V.jobs[id] = job;
  V.w.postMessage({ type: "gen", id, text: job.text, voice: voiceName(), speed: 0.95 });
}
export function init(opts = {}) {
  if (opts.getS) V.getS = opts.getS;
  if (V.st !== "off" || V.getS().aiVoice === 0 || !window.Worker) return;
  V.st = "loading";
  try {
    V.w = new Worker(new URL("./voice-worker.js", import.meta.url), { type: "module" });
  } catch (e) { V.st = "fail"; V.err = "worker"; return; }
  V.w.onmessage = (e) => {
    const m = e.data || {};
    if (m.type === "progress") V.pct = m.pct;
    else if (m.type === "ready") { V.st = "ready"; V.pct = 100; pump(); }
    else if (m.type === "fail") { V.st = "fail"; V.err = m.err; V.q.forEach((j) => j.rej(new Error("fail"))); V.q = []; }
    else if (m.type === "audio" || m.type === "err") {
      const job = V.jobs[m.id]; delete V.jobs[m.id]; V.busy = null;
      if (job) {
        if (m.type === "audio") {
          const a = { pcm: m.pcm, sr: m.sr }, dur = m.pcm.length / m.sr * 1000;
          if (m.ms > dur * 2.2 && m.ms > 2500) { if (++V.slowN >= 3) V.slow = true; } else V.slowN = 0;
          job.res(a); idbPut(job.k, a);
        } else { job.rej(new Error(m.err)); V.mem.delete(job.k); }
      }
      pump();
    }
  };
  V.w.onerror = () => { V.st = "fail"; V.err = "worker error"; };
  V.w.postMessage({ type: "init" });
}
export function status() { return { st: V.st, pct: V.pct, err: V.err, slow: V.slow, voice: voiceName() }; }
export function canSpeak(t) { const S = V.getS(); return V.st === "ready" && S.aiVoice !== 0 && !/[一-鿿]/.test(String(t)) && clean(t).length > 0; }
function request(t, prio) {
  const k = key(t);
  if (V.mem.has(k)) { const p = V.mem.get(k); V.mem.delete(k); V.mem.set(k, p); return p; }
  const p = (async () => {
    const hit = await idbGet(k); if (hit) return hit;
    return new Promise((res, rej) => { const job = { k, text: clean(t), res, rej }; prio ? V.q.unshift(job) : V.q.push(job); pump(); });
  })();
  p.catch(() => V.mem.delete(k));
  V.mem.set(k, p); while (V.mem.size > 300) V.mem.delete(V.mem.keys().next().value);
  return p;
}
function ensureCtx() {
  try { if (!V.ctx) V.ctx = new (window.AudioContext || window.webkitAudioContext)(); if (V.ctx.state === "suspended") V.ctx.resume(); } catch (e) {}
}
addEventListener("pointerdown", ensureCtx, { capture: true });
addEventListener("keydown", ensureCtx, { capture: true });
export function stop() { V.tok++; if (V.src) { try { V.src.stop(); } catch (e) {} V.src = null; } }
// Resolves when the line has finished playing. Rejects if it can't be made in time (the game then uses the device voice).
export function speakDone(t, timeoutMs = 7000) {
  stop(); const tok = V.tok; ensureCtx();
  const gen = request(t, true);
  const timer = new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), timeoutMs));
  return Promise.race([gen, timer]).then((a) => new Promise((res) => {
    if (tok !== V.tok || !V.ctx) return res();
    const b = V.ctx.createBuffer(1, a.pcm.length, a.sr); b.copyToChannel(a.pcm, 0);
    const s = V.ctx.createBufferSource(); s.buffer = b; s.connect(V.ctx.destination);
    s.onended = () => { if (V.src === s) V.src = null; res(); };
    V.src = s; s.start();
  }));
}
export function prefetch(list) { (list || []).forEach((t) => { if (canSpeak(t)) request(t, false); }); }
export const VOICES = [["af_heart", "Heart — warm (default)"], ["af_bella", "Bella — bright"], ["af_nicole", "Nicole — soft"], ["bf_emma", "Emma — British"], ["am_michael", "Michael — male"], ["am_puck", "Puck — playful male"]];
