// 🎯 ADAPT: one adaptive-practice engine for every app (Bobby 2026-11-21).
// - Every skill has a level 1..5.  Up: 3 first-try correct in a row (not rushed-slow).  Down: 2 misses in the last 4.
// - No repeats: remembers the last ~80 problems (exact problem AND its "shape") and avoids them.
// - Missed problems come back: a fresh version 3–6 problems later, then again the next day; cleared after a next-day success.
// - State lives in localStorage under `<kid>_<app>_adapt`, which the hub already syncs to app_saves, so it follows him across devices.
// Use:
//   const A = ADAPT.create("eric_amc_adapt", { start: id => 2 });
//   const p = A.next("ratios", lv => makeProblem(lv), p => p.key, p => p.shape);   // fresh, level-matched, not recently seen
//   A.record("ratios", correct, { firstTry, key: p.key, item: p.meta });            // → { lv, moved: 1 | 0 | -1 }
//   A.pick("unit4", bankArray, q => q.id, q => q.lv)                               // for fixed question lists
(function () {
  const day = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const pickR = a => a[Math.floor(Math.random() * a.length)];
  const shapeOf = s => String(s || "").replace(/<[^>]+>/g, "").replace(/-?\d+([.,/]\d+)?/g, "#").replace(/\s+/g, " ").trim().toLowerCase().slice(0, 140);

  function create(key, opt = {}) {
    let S; try { S = JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { S = {}; }
    S.v = 1; S.sk = S.sk || {}; S.seen = S.seen || []; S.shapes = S.shapes || []; S.miss = S.miss || []; S.n = S.n || 0;
    const MEM = opt.memory || 80, SHAPEMEM = opt.shapeMemory || 6;
    const save = () => { try { localStorage.setItem(key, JSON.stringify(S)); } catch (e) {} };
    const sk = id => S.sk[id] || (S.sk[id] = { lv: clamp(+((opt.start && opt.start(id)) || 2), 1, 5), h: [], n: 0, ok: 0, best: 0 });

    function level(id) { return sk(id).lv; }
    function setLevel(id, lv) { sk(id).lv = clamp(lv, 1, 5); sk(id).h = []; save(); }
    function record(id, correct, info = {}) {
      const s = sk(id); s.n++; if (correct) s.ok++; S.n++;
      s.h.push(correct ? (info.firstTry === false ? 0.5 : 1) : 0); s.h = s.h.slice(-8);
      let moved = 0; const l3 = s.h.slice(-3), l4 = s.h.slice(-4);
      if (l3.length === 3 && l3.every(x => x === 1) && s.lv < 5 && !info.slow) { s.lv++; s.h = []; moved = 1; }
      else if (l4.filter(x => x === 0).length >= 2 && s.lv > 1) { s.lv--; s.h = []; moved = -1; }
      s.best = Math.max(s.best || 0, s.lv); s.last = day();
      if (info.key != null) {
        const m = S.miss.find(x => x.key === info.key || (info.mkey && x.mkey === info.mkey));
        if (!correct) {
          if (m) { m.due = S.n + 3 + Math.floor(Math.random() * 3); m.next = null; }
          else S.miss.push({ id, key: info.key, mkey: info.mkey || null, item: info.item ?? null, due: S.n + 3 + Math.floor(Math.random() * 4), next: null, day: day() });
          S.miss = S.miss.slice(-50);
        } else if (m) {
          if (m.next && m.next <= day() && m.day !== day()) S.miss = S.miss.filter(x => x !== m);       // next-day success: learned
          else { const t = new Date(); t.setDate(t.getDate() + 1); t.setMinutes(t.getMinutes() - t.getTimezoneOffset()); m.next = t.toISOString().slice(0, 10); m.due = Infinity; }
        }
      }
      save(); return { lv: s.lv, moved };
    }
    const seenRecently = (k, within = MEM) => { const i = S.seen.lastIndexOf(k); return i >= 0 && S.seen.length - i <= within; };
    const shapeRecently = (sh, within = SHAPEMEM) => { const i = S.shapes.lastIndexOf(sh); return i >= 0 && S.shapes.length - i <= within; };
    function markSeen(k, sh) { S.seen.push(k); S.seen = S.seen.slice(-MEM); if (sh) { S.shapes.push(sh); S.shapes = S.shapes.slice(-40); } save(); }
    // A missed problem that is due now (for this skill, or any skill if id is null).
    function dueMiss(id) { const today = day(); return S.miss.find(m => (id == null || m.id === id) && ((m.due !== Infinity && m.due <= S.n) || (m.next && m.next <= today && m.day !== today))) || null; }
    function takeMiss(m) { m.day = day(); if (m.due !== Infinity) m.due = Infinity; save(); return m; }

    // Generated problems: make(lv, missItem) → problem. Tries to avoid recent exact repeats and recent shapes.
    function next(id, make, keyOf = p => JSON.stringify(p), shOf = p => shapeOf(p.q || p.text || p.prompt || "")) {
      const m = dueMiss(id), lv = level(id);
      if (m) { takeMiss(m); const p = make(lv, m.item); if (p) { p._review = true; markSeen(keyOf(p), shOf(p)); return p; } }
      let best = null, bestScore = -1;
      for (let i = 0; i < 16; i++) {
        const p = make(lv, null); if (!p) continue;
        const k = keyOf(p), sh = shOf(p), score = (seenRecently(k) ? 0 : 2) + (shapeRecently(sh) ? 0 : 1);
        if (score > bestScore) { best = p; bestScore = score; } if (score === 3) break;
      }
      if (best) markSeen(keyOf(best), shOf(best));
      return best;
    }
    // Fixed lists: prefer due misses, then items near his level he hasn't seen recently, then the least recently seen.
    function pick(id, items, keyOf = q => q.id ?? JSON.stringify(q), lvOf = null, n = 1) {
      if (!items || !items.length) return n === 1 ? null : [];
      const out = [], used = new Set(), lv = level(id);
      const m = dueMiss(id); if (m) { const q = items.find(x => keyOf(x) === m.key); if (q) { takeMiss(m); out.push(q); used.add(m.key); } }
      while (out.length < n && used.size < items.length) {
        const pool = items.filter(q => !used.has(keyOf(q)));
        const fresh = pool.filter(q => !seenRecently(keyOf(q), Math.min(MEM, Math.floor(items.length * 0.8))));
        let cand = fresh.length ? fresh : pool.slice().sort((a, b) => S.seen.lastIndexOf(keyOf(a)) - S.seen.lastIndexOf(keyOf(b))).slice(0, Math.max(1, Math.ceil(pool.length / 4)));
        if (lvOf) { const near = cand.filter(q => Math.abs((lvOf(q) || 3) - lv) <= 1); if (near.length) cand = near; }
        const q = pickR(cand); out.push(q); used.add(keyOf(q));
      }
      out.forEach(q => markSeen(keyOf(q), null));
      return n === 1 ? out[0] : out;
    }
    function stats() { return Object.fromEntries(Object.entries(S.sk).map(([id, s]) => [id, { lv: s.lv, best: s.best, n: s.n, acc: s.n ? Math.round(100 * s.ok / s.n) : null, last: s.last }])); }
    return { level, setLevel, record, next, pick, dueMiss, stats, missCount: id => S.miss.filter(m => id == null || m.id === id).length, state: () => S, save };
  }
  // Map a 1..5 level onto a generator's own difficulty range (e.g. 1..3).
  const tier = (lv, max = 3) => clamp(Math.round(1 + (clamp(lv, 1, 5) - 1) * (max - 1) / 4), 1, max);
  window.ADAPT = { create, tier, shapeOf, day };
})();
