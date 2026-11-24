// Physics 6 study app (same look and rhythm as the AMC 8 app). Runs inside the Family Hub iframe.
// Progress lives in localStorage under `${kid}_physics_progress`; the hub syncs it to app_saves (app "physics").
(() => {
const QS = new URLSearchParams(location.search);
const KID = (QS.get("k") || "eric").toLowerCase().replace(/[^a-z]/g, "") || "eric";
const PARENT = QS.get("p") === "1";
const NAME = KID.charAt(0).toUpperCase() + KID.slice(1);
const LES = window.PHY_LESSONS || [];
const LS = `${KID}_physics_progress`;
const load = () => { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } };
let P = load();
P.lessons = P.lessons || {}; P.tests = P.tests || {}; P.quizzes = P.quizzes || []; P.events = P.events || []; P.sessions = P.sessions || [];
P.classNow = P.classNow || "kinematics";
const save = () => { try { localStorage.setItem(LS, JSON.stringify(P)); } catch (e) {} };
const today = new Date().toLocaleDateString("en-CA");
// 🎯 Adaptive ♾️ Endless mode (2026-11-21): unit level 1–5 (shared/adapt.js), generated problems (gen.js) + the unit's own questions.
const AD = window.ADAPT ? ADAPT.create(`${KID}_physics_adapt`, { start: id => { try { const t = JSON.parse(localStorage.getItem(`fh_tune_${KID}_physics`) || "{}")[id]; return t && t.d ? [2, 3, 4][Math.min(3, Math.max(1, t.d)) - 1] : 2; } catch (e) { return 2; } } }) : null;
const LVN = ["", "Warm-up", "Building", "Solid", "Strong", "Challenge"];
// ⭐ Hub points for correct first-try answers (the hub caps points per day)
const hubAward = (ref, pts, label, zh) => { try { if (window.parent !== window && window.parent.fhAward) window.parent.fhAward("physics", ref, pts, label, zh); } catch (e) {} };
const track = ev => { const e = Object.assign({ ts: Date.now(), d: today }, ev); P.events.push(e); if (P.events.length > 1500) P.events = P.events.slice(-1500); save();
 };
// 🏁 Points come ONLY from passing a unit checkpoint (Bobby 11/23): 30 per unit, +5 for 10/10. Practice, tests and quizzes are for learning.

// active time on the app (only counts while he's actually interacting)
let lastInput = Date.now();
["click", "keydown", "touchstart", "scroll", "pointermove"].forEach(e => addEventListener(e, () => { lastInput = Date.now(); }, { passive: true }));
const SESS = { id: Date.now(), date: today, start: new Date().toISOString(), active: 0 };
P.sessions.push(SESS); P.sessions = P.sessions.filter(x => x === SESS || x.active >= 15).slice(-300);
setInterval(() => { if (document.visibilityState === "visible" && Date.now() - lastInput < 90000) SESS.active += 5; }, 5000);
setInterval(() => { SESS.end = new Date().toISOString(); save(); }, 30000);
addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") { SESS.end = new Date().toISOString(); save(); } });

const $ = s => document.querySelector(s), app = $("#app");
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const LET = "ABCD", COLORS = ["c1", "c2", "c3", "c4", "c5", "c6"];
const rec = id => (P.lessons[id] = P.lessons[id] || { read: -1 });
const readOf = id => (P.lessons[id] || {}).read ?? -1;
const starsOf = id => (P.lessons[id] || {}).best || 0;
const starStr = (n, of = 5) => "★".repeat(n) + "☆".repeat(of - n);
const total = () => LES.reduce((a, l) => a + starsOf(l.id), 0);
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// shuffle answer choices so the right answer isn't always in the same spot
const mix = q => { const o = shuffle(q.c.map((c, j) => [c, j])); return Object.assign({}, q, { c: o.map(x => x[0]), a: o.findIndex(x => x[1] === q.a) }); };
const idxNow = () => Math.max(0, LES.findIndex(l => l.id === P.classNow));
const covered = () => LES.slice(0, idxNow() + 1);
const confetti = () => { for (let i = 0; i < 24; i++) { const d = document.createElement("div"); d.className = "conf"; d.textContent = ["⭐", "🎉", "✨", "🧲", "⚡"][i % 5]; d.style.left = Math.random() * 100 + "vw"; d.style.animationDelay = Math.random() * .5 + "s"; document.body.appendChild(d); setTimeout(() => d.remove(), 2400); } };
const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// ---- weekly rhythm: light while AMC 8 is on (2 short sessions + an optional quiz) ----
const START = "2026-11-23";
const dow = d => new Date(d + "T12:00:00").getDay();
function dayPlan(d) {
  if (d < START) return [];
  const L = LES[idxNow()], wd = dow(d);
  if (wd === 2) return [{ k: "learn", l: L, t: `📖 ${L.emoji} ${L.title} (what you're doing in class): read it + ⭐ Practice (aim 5/6)` }];
  if (wd === 4) return [{ k: "deep", l: L, t: (P.lessons[L.id] || {}).best >= 4 ? `⬆️ Challenge or 📝 Unit test: ${L.title}` : `⭐ Finish Practice: ${L.title} (aim 5/6)` }];
  if (wd === 6) return [{ k: "quiz", t: "⚡ Quick quiz: 5 mixed questions, 8 min", opt: true }];
  return [];
}
function taskDone(x, d) {
  const ev = P.events.filter(e => e.d === d);
  if (x.k === "learn") return ev.some(e => e.t === x.l.id && e.m === "practice") && readOf(x.l.id) >= 2;
  if (x.k === "deep") return ev.some(e => e.t === x.l.id && (e.m === "challenge" || e.m === "test" || e.m === "practice"));
  if (x.k === "quiz") return P.quizzes.some(q => q.date === d);
  return null;
}

function home() {
  window.scrollTo(0, 0);
  const T = dayPlan(today), L = LES[idxNow()];
  app.innerHTML = `<div class="top"><h1>🧲 Physics 6</h1><span class="pill">⭐ ${total()} / ${LES.length * 5}</span></div>
    <p class="sub">Dr. Covert's units, explained simply. In class you're on <b>${L.emoji} ${esc(L.title)}</b>. Two short sessions a week (Tue + Thu, ~15 min) is the plan while AMC 8 is on. Calculator is OK, just like in class.</p>
    ${T.length ? `<div class="card plan"><div class="q">📆 Today</div>${T.map((x, i) => { const ok = taskDone(x, today); return `<div class="task ${ok ? "ok" : ""}"><span class="tk">${ok ? "✅" : "⬜"}</span><div class="tt"><b>${esc(x.t)}</b>${x.opt ? "<small>Optional</small>" : ""}</div>${ok ? "" : `<button class="btn sm go" data-task="${i}">Go →</button>`}</div>`; }).join("")}</div>`
      : today < START ? `<div class="card plan"><div class="q">📆 Your physics rhythm starts Tuesday, Nov 24</div><p class="sub">Tuesday: read + practice. Thursday: challenge or unit test. Saturday: optional quick quiz.</p></div>` : `<div class="card plan"><div class="q">📆 No physics today 🎈</div><p class="sub">Tuesday: read + practice · Thursday: challenge or unit test · Saturday: optional quick quiz.</p></div>`}
    <div class="row"><button class="btn pink" id="quizBtn">⚡ Quick quiz (5 mixed)</button>${P.quizzes.length ? `<span class="sub">Last quiz: ${P.quizzes[P.quizzes.length - 1].score}/${P.quizzes[P.quizzes.length - 1].of} on ${P.quizzes[P.quizzes.length - 1].date}</span>` : `<span class="sub">Mixes every unit up to where your class is.</span>`}</div>
    <div class="grid">${LES.map((l, i) => { const r = P.lessons[l.id] || {}, t = P.tests[l.id]; return `<button class="tile ${COLORS[i % 6]}" data-l="${i}">${l.id === P.classNow ? `<span class="wk">In class now</span>` : i > idxNow() ? `<span class="wk" style="background:#bbb">Coming up</span>` : ""}<div class="em">${l.emoji}</div><div class="n">Unit ${l.unit}${i === 4 ? " · after PreComp" : ""}</div><div class="t">${esc(l.title)}</div><div class="z">${esc(l.zh)}</div><div class="st">${starStr(starsOf(l.id))}</div><div class="pg">${r.chBest != null ? `⬆️ ${r.chBest}/3 · ` : ""}${t ? `📝 best ${t.best}/${t.of}` : "📝 no unit test yet"}</div></button>`; }).join("")}</div>
    ${PARENT ? parentHtml() : ""}`;
  app.querySelectorAll("[data-l]").forEach(b => b.onclick = () => lesson(+b.dataset.l, 0));
  app.querySelectorAll("[data-task]").forEach(b => b.onclick = () => { const x = T[+b.dataset.task];
    if (x.k === "learn") lesson(LES.indexOf(x.l), readOf(x.l.id) >= 2 ? 4 : 0);
    else if (x.k === "deep") lesson(LES.indexOf(x.l), 4, (P.lessons[x.l.id] || {}).best >= 4 ? "challenge" : "practice");
    else quiz(); });
  $("#quizBtn").onclick = quiz;
  const sel = $("#classNow"); if (sel) sel.onchange = () => { P.classNow = sel.value; save(); home(); };
}

function parentHtml() {
  const wk = new Date(Date.now() - 7 * 864e5).toLocaleDateString("en-CA");
  const mins = Math.round(P.sessions.filter(s => s.date >= wk).reduce((a, s) => a + (s.active || 0), 0) / 60);
  const miss = {}; P.events.filter(e => e.ok === false && e.q).forEach(e => { miss[e.q] = (miss[e.q] || 0) + 1; });
  const top = Object.entries(miss).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return `<div class="card parent"><div class="q">👨‍👩‍👦 Parent corner <span class="sub">(${NAME} doesn't see this)</span></div>
    <p class="sub">Set which unit Dr. Covert's class is on. It drives "In class now", the Tue/Thu plan and what the quick quiz mixes in.</p>
    <label>Class is on: <select id="classNow">${LES.map(l => `<option value="${l.id}"${l.id === P.classNow ? " selected" : ""}>Unit ${l.unit} · ${esc(l.title)}</option>`).join("")}</select></label>
    <p style="margin-top:12px"><b>Active time, last 7 days:</b> ${mins} min</p>
    <table style="width:100%;border-collapse:collapse;font-size:15px;margin-top:6px"><tr style="text-align:left"><th>Unit</th><th>Read</th><th>⭐ Practice</th><th>⬆️ Challenge</th><th>📝 Unit test</th></tr>
    ${LES.map(l => { const r = P.lessons[l.id] || {}, t = P.tests[l.id]; return `<tr style="border-top:1px dashed #0003"><td>${l.emoji} ${esc(l.title)}</td><td>${Math.max(0, readOf(l.id) + 1)}/4</td><td>${r.pBest != null ? `${r.pBest}/6` : "–"}</td><td>${r.chBest != null ? `${r.chBest}/3` : "–"}</td><td>${t ? `best ${t.best}/${t.of} · last ${t.last}/${t.of} (${t.date})` : "–"}</td></tr>`; }).join("")}</table>
    ${P.quizzes.length ? `<p style="margin-top:10px"><b>Quick quizzes:</b> ${P.quizzes.slice(-6).map(q => `${q.score}/${q.of} (${q.date.slice(5)})`).join(" · ")}</p>` : ""}
    ${P.ws ? `<p style="margin-top:10px"><b>✍️ Worksheets (typed answers):</b> ${Object.entries(P.ws).map(([u, w]) => `${esc((LES.find(x => x.id === u) || {}).title || u)}: ${w.first}/${w.n} right without notes, work shown on ${w.work}`).join(" · ")}</p>` : ""}
    ${(P.flags || []).filter(f => !f.done).length ? `<p style="margin-top:10px"><b>🚩 Circled for office hours (${(P.flags || []).filter(f => !f.done).length}):</b></p><ol>${(P.flags || []).filter(f => !f.done).slice(-12).map(f => `<li>${esc(f.q)} <span class="sub">(${esc(f.why)}, ${f.d.slice(5)})</span></li>`).join("")}</ol>` : ""}
    ${top.length ? `<p style="margin-top:10px"><b>Most-missed questions:</b></p><ul>${top.map(([q, n]) => `<li>${esc(q)} <span class="sub">(${n}×)</span></li>`).join("")}</ul>` : ""}
    <p class="sub" style="margin-top:8px">Lessons follow the official syllabus (basis.campusconcourse.com, course 7369). Dr. Covert teaches from guided notes, so if his notes use a different value (e.g. g = 10 instead of 9.8), follow the notes.</p></div>`;
}

// ---- reading gate (same idea as the AMC app): read for a calm amount of time, scroll to the end, tick each card ----
const readSecs = text => Math.min(60, Math.max(6, Math.round(String(text).split(/\s+/).filter(Boolean).length / 160 * 60)));
function gate(btn, secs, opts) {
  const need = opts.ticks || 0, label = btn.textContent; let ticked = 0, seenEnd = false, left = secs, done = false;
  const g = document.createElement("span"); g.className = "gate"; btn.before(g);
  let io = null; const row = btn.closest(".row");
  if (row && "IntersectionObserver" in window) { io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { seenEnd = true; upd(); } }); io.observe(row); } else seenEnd = true;
  const upd = () => {
    const ready = left <= 0 && seenEnd && ticked >= need; btn.disabled = !ready;
    if (ready) { g.innerHTML = "✅ Nice reading!"; btn.textContent = label; if (!done) { done = true; clearInterval(iv); io && io.disconnect(); opts.onDone(); } return; }
    g.innerHTML = `<span class="gbar"><i style="width:${Math.round((1 - Math.max(0, left) / secs) * 100)}%"></i></span>${left > 0 ? `📖 Keep reading… ${left}s` : !seenEnd ? "👇 Scroll to the end" : `Tap ✓ on each card (${ticked}/${need})`}`;
  };
  const iv = setInterval(() => { if (!btn.isConnected) { clearInterval(iv); io && io.disconnect(); return; } if (document.visibilityState === "visible") left--; upd(); }, 1000);
  upd();
  return { tick: () => { ticked++; upd(); } };
}
const markRead = (l, k) => { const r = rec(l.id); if (k > r.read) { r.read = k; track({ t: l.id, m: "read", s: k }); save(); } };

function lesson(i, step, mode) {
  window.scrollTo(0, 0);
  const l = LES[i]; if (!l) return home();
  if (!PARENT && step > readOf(l.id) + 1) step = readOf(l.id) + 1;
  const names = ["1 · Big idea", "2 · Key words", "3 · Formulas & moves", "4 · Watch me solve", "5 · Your turn"];
  const needGate = k => !PARENT && readOf(l.id) < k;
  const head = `<div class="top"><button class="btn" id="back">← Units</button><h1 style="font-size:24px">${l.emoji} Unit ${l.unit}: ${esc(l.title)} <span class="zh">${esc(l.zh)}</span></h1></div>
    <div class="steps">${names.map((n, k) => { const lock = !PARENT && k > readOf(l.id) + 1; return `<button class="${k === step ? "on" : k <= readOf(l.id) ? "done" : lock ? "lock" : ""}" data-s="${k}"${lock ? ' data-lock="1"' : ""}>${lock ? "🔒 " : ""}${n}</button>`; }).join("")}</div>`;
  const nav = label => `<div class="row"><span class="spacer"></span><button class="btn go" id="next">${label}</button></div>`;
  let body = "";
  if (step === 0) body = `<div class="card six"><div class="big" style="font-size:48px">${l.emoji}</div>${l.six.map(p => `<p>${esc(p)}</p>`).join("")}</div>${window.SIMS && SIMS[l.id] ? `<div class="card"><div class="q">🧪 Try it yourself</div><p class="sub">Move the sliders and watch the numbers. This is the same math as the formulas in section 3.</p><div id="sim"></div></div>` : ""}${nav("Got it! →")}`;
  if (step === 1) body = `<div class="card"><div class="q">📘 Key words</div><p class="sub">Dr. Covert's tests use these exact words. Know them cold.</p><div class="words">${l.words.map(w => `<div class="word"><div class="wt">${esc(w[0])} <span class="zh">${esc(w[1])}</span></div><div>${esc(w[2])}</div><div class="eg">e.g. ${esc(w[3])}</div>${needGate(1) ? `<button class="tick" data-tick>✓ Got it</button>` : ""}</div>`).join("")}</div></div>${nav("Next →")}`;
  if (step === 2) body = `<div class="card"><div class="q">⚡ Formulas & moves</div><p class="sub">Each one comes with WHY it works. Always write the formula, list what you know with units, then plug in.</p>${l.moves.map((m, k) => `<div class="move"><b>${k + 1}</b><div style="flex:1;min-width:0"><div class="mm">${esc(m.m)}</div><div class="why"><span>Why?</span> ${esc(m.why)}</div>${needGate(2) ? `<button class="tick" data-tick>✓ Got it</button>` : ""}</div></div>`).join("")}</div>${nav("Next →")}`;
  if (step === 3) body = `<div id="exs"></div>`;
  if (step === 4) {
    mode = mode || "practice"; const r = P.lessons[l.id] || {}, t = P.tests[l.id];
    const chOpen = PARENT || (r.pBest || 0) >= 4;
    body = `<div class="modes" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))!important">
      <button data-m="practice" class="${mode === "practice" ? "on" : ""}">⭐ Practice (6)<span>${r.pBest != null ? `best ${r.pBest}/6` : "hints allowed"}</span></button>
      <button data-m="challenge" class="${mode === "challenge" ? "on" : ""}"${chOpen ? "" : " disabled"}>⬆️ Challenge (3)<span>${chOpen ? (r.chBest != null ? `best ${r.chBest}/3` : "multi-step") : "🔒 get 4/6 in Practice"}</span></button>
      <button data-m="checkpoint" class="${mode === "checkpoint" ? "on" : ""}">🏁 Checkpoint<span>${cpPassed(l.id) ? `passed ${P.cp[l.id].score}/10` : "10 new · 30 pts"}</span></button>
      <button data-m="test" class="${mode === "test" ? "on" : ""}">📝 Unit test (10)<span>${t ? `best ${t.best}/${t.of}` : "15 min, no hints"}</span></button>
      ${AD && window.PHY_GEN ? `<button data-m="endless" class="${mode === "endless" ? "on" : ""}">♾️ Endless<span>Level ${AD.level(l.id)}/5 · ${LVN[AD.level(l.id)]}</span></button>` : ""}
      ${wsKinds(l.id).length ? `<button data-m="worksheet" class="${mode === "worksheet" ? "on" : ""}">✍️ Worksheet<span>type it · show work${(P.flags || []).filter(f => f.u === l.id && !f.done).length ? ` · 🚩 ${(P.flags || []).filter(f => f.u === l.id && !f.done).length}` : ""}</span></button>` : ""}</div><div id="play"></div>`;
  }
  app.innerHTML = head + body;
  if (step === 0 && window.SIMS && SIMS[l.id] && document.getElementById("sim")) { try { SIMS[l.id](document.getElementById("sim")); } catch (e) { console.warn("sim", e); } }
  $("#back").onclick = home;
  app.querySelectorAll("[data-s]").forEach(b => b.onclick = () => { if (b.dataset.lock) { b.animate([{ transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "none" }], 250); return; } lesson(i, +b.dataset.s); });
  if ($("#next")) {
    $("#next").onclick = () => { markRead(l, step); lesson(i, step + 1); };
    if (step <= 2 && needGate(step)) {
      const text = step === 0 ? l.six.join(" ") : step === 1 ? l.words.map(w => w[2] + " " + w[3]).join(" ") : l.moves.map(m => m.m + " " + m.why).join(" ");
      const ticks = [...app.querySelectorAll("[data-tick]")];
      const G = gate($("#next"), readSecs(text), { ticks: ticks.length, onDone: () => markRead(l, step) });
      ticks.forEach(b => b.onclick = () => { if (b.classList.contains("on")) return; b.classList.add("on"); b.textContent = "✓ Got it!"; b.closest(".word,.move").classList.add("ok"); G.tick(); });
    }
  }
  if (step === 3) examples(i, 0);
  if (step === 4) {
    app.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { if (!b.disabled) lesson(i, 4, b.dataset.m); });
    if (mode === "checkpoint") cpRun(i);
    else if (mode === "test") testRun({ title: `📝 Unit ${l.unit} test: ${l.title}`, qs: (() => { const fixed = shuffle([...l.pr, ...l.ch, ...l.tq]); if (!window.PHY_GEN || !PHY_GEN.setSeen) return fixed.slice(0, 10).map(q => mix(Object.assign({ t: l.id }, q))); const seen = {}, gen = [], used = new Set(); for (let k = 0; k < 30 && gen.length < 5; k++) { PHY_GEN.setSeen(seen); const g = PHY_GEN.make(l.id, Math.max(3, AD ? AD.level(l.id) : 3)); if (g && !used.has(g.q)) { used.add(g.q); seen[g.angle] = (seen[g.angle] || 0) + 1; gen.push(g); } } return shuffle([...fixed.slice(0, 10 - gen.length), ...gen]).map(q => mix(Object.assign({ t: l.id }, q))); })(), secs: 15 * 60, box: $("#play"), done: res => {
      const t = P.tests[l.id] = P.tests[l.id] || { best: 0, of: res.of, log: [] }; t.last = res.score; t.of = res.of; t.date = today; t.best = Math.max(t.best, res.score); t.log.push({ date: today, score: res.score, secs: res.secs }); save(); } });
    else if (mode === "endless") endless(i);
    else if (mode === "worksheet") worksheet(i);
    else practice(i, mode);
  }
}

// ---- 🏁 Checkpoint (Bobby 11/23): 10 questions, never the same: all different, and nothing asked in an earlier checkpoint comes back ----
// 1 key word + 1 WHY (each with a reverse form) + 6 apply (unit questions not right in the last 3 days, or freshly generated, different angles) + 2 deep.
// Pass = 8/10 with at least 1 deep → 30 points (+5 for 10/10). Finish lesson steps 1–4 first. A miss: full review, 1-hour wait, all-new questions.
P.cp = P.cp || {}; P.cpAsked = P.cpAsked || [];
const cpPassed = id => !!(P.cp[id] && P.cp[id].passed);
const cpWait = id => { const c = P.cp[id]; return c && !c.passed && c.failAt ? Math.max(0, c.failAt + 3600e3 - Date.now()) : 0; };
const keyQ = t => String(t).replace(/\s+/g, " ").trim().toLowerCase().slice(0, 140);
const rightRecently = q => { const since = new Date(Date.now() - 3 * 864e5).toLocaleDateString("en-CA"); return P.events.some(e => e.ok && e.q === q && e.d >= since); };
function cpBuild(l) {
  const out = [], used = new Set(), asked = new Set(P.cpAsked), angles = {};
  const ok = q => { const k = keyQ(q); return !used.has(k) && !asked.has(k); };
  const add = (q, extra) => { used.add(keyQ(q.q)); out.push(Object.assign({ t: l.id }, mix(q), extra)); return true; };
  const gen = (lv, extra) => { if (!window.PHY_GEN) return false; for (let pass = 0; pass < 2; pass++) for (let k = 0; k < 40; k++) { if (PHY_GEN.setSeen) PHY_GEN.setSeen(pass ? {} : angles);
      const g = PHY_GEN.make(l.id, lv); if (g && g.c && ok(g.q) && (pass || !g.angle || !angles[g.angle])) { if (g.angle) angles[g.angle] = 1; return add(g, extra); } } return false; };
  const allW = LES.flatMap(x => x.words), allM = LES.flatMap(x => x.moves);
  const wq = shuffle(l.words).flatMap(w => { const d = shuffle(allW.filter(x => x[2] !== w[2])).slice(0, 3);
    return [{ q: `What does "${w[0]}" mean?`, c: [w[2], ...d.map(x => x[2])], a: 0, why: `${w[0]}: ${w[2]} (e.g. ${w[3]})` }, { q: `Which word means: ${w[2]}`, c: [w[0], ...d.map(x => x[0])], a: 0, why: `${w[0]}: ${w[2]}` }]; }).find(x => ok(x.q));
  if (wq) add(wq, { kind: "word" }); else gen(2, { kind: "apply" });
  const mq = shuffle(l.moves).flatMap(m => { const d = shuffle(allM.filter(x => x.why !== m.why)).slice(0, 3);
    return [{ q: `"${m.m}"\nWhy does this work?`, c: [m.why, ...d.map(x => x.why)], a: 0, why: m.why }, { q: `Which formula or move does this reason explain?\n"${m.why}"`, c: [m.m, ...d.map(x => x.m)], a: 0, why: `${m.m}: ${m.why}` }]; }).find(x => ok(x.q));
  if (mq) add(mq, { kind: "why" }); else gen(3, { kind: "apply" });
  const own = shuffle([...(l.pr || []), ...(l.tq || [])]).filter(q => ok(q.q) && !rightRecently(q.q));
  for (let k = 0; k < 6; k++) { if (k % 2 === 0 && own.length) { const q = own.shift(); if (ok(q.q)) { add(q, { kind: "apply" }); continue; } } if (!gen(Math.max(2, Math.min(5, (AD ? AD.level(l.id) : 3) + [-1, 0, 0, 0, 1, 1][k])), { kind: "apply" }) && own.length) add(own.shift(), { kind: "apply" }); }
  const ch = shuffle(l.ch || []).find(q => ok(q.q) && !rightRecently(q.q)); if (ch) add(ch, { kind: "deep" }); else gen(5, { kind: "deep" });
  gen(5, { kind: "deep" }) || (() => { const q = shuffle(l.ch || []).find(x => ok(x.q)); if (q) add(q, { kind: "deep" }); })();
  for (let k = 0; out.length < 10 && k < 6; k++) gen(4, { kind: "apply" });
  return out.slice(0, 10);
}
function cpRun(i) {
  const l = LES[i], box = $("#play"), c = P.cp[l.id] || {};
  if (cpPassed(l.id)) { box.innerHTML = `<div class="card done"><div class="big">🏁</div><div class="q">Checkpoint passed on ${c.passed} (${c.score}/10)</div><p class="sub">Keep it fresh in ♾️ Endless and the unit test.</p></div>`; return; }
  if (!PARENT && readOf(l.id) < 3) { box.innerHTML = `<div class="card"><div class="q">📖 Learn it first</div><p class="sub">Finish steps 1–4 of this unit, then take the checkpoint.</p></div>`; return; }
  const w = cpWait(l.id); if (!PARENT && w) { box.innerHTML = `<div class="card"><div class="q">⏳ Review first</div><p class="sub">Read your mistakes, practice in ♾️ Endless, and try again in ${Math.ceil(w / 60000)} min with all-new questions.</p></div>`; return; }
  box.innerHTML = `<div class="card"><div class="q">🏁 Checkpoint · ${esc(l.title)}</div><p class="sub">10 questions you've never had in a checkpoint: 2 on what words and formulas <b>mean</b>, 6 to apply it, 2 🔥 deep ones. No hints. Pass with 8/10 (including 1 deep) to earn <b>30 points</b>.</p><div class="row"><span class="spacer"></span><button class="btn go" id="cpGo">Start →</button></div></div>`;
  $("#cpGo").onclick = () => {
    const qs = cpBuild(l); if (qs.length < 10) { box.innerHTML = `<div class="card"><div class="q">Not enough new questions yet</div><p class="sub">This unit has run out of questions you haven't had in a checkpoint. Keep practicing; parents can add more.</p></div>`; return; }
    P.cpAsked.push(...qs.map(q => keyQ(q.q))); if (P.cpAsked.length > 4000) P.cpAsked = P.cpAsked.slice(-4000); save(); window.__lastCP = qs;
    testRun({ title: `🏁 Checkpoint · ${l.title}`, qs, secs: 20 * 60, box, mode: "checkpoint", done: res => {
      const score = res.score, deepOk = qs.some((q, j) => q.kind === "deep" && res.ans[j] === q.a), pass = score >= 8 && deepOk;
      const r = P.cp[l.id] = P.cp[l.id] || { tries: [] }; r.tries = r.tries || []; r.tries.push({ d: today, score, secs: res.secs }); r.best = Math.max(r.best || 0, score);
      if (pass) { r.passed = today; r.score = score; delete r.failAt; if (!PARENT) { hubAward(`cp:${l.id}`, 30, `Physics checkpoint passed: ${l.title}`, `物理关卡通过：${l.zh}`); if (score === 10) hubAward(`cp10:${l.id}`, 5, `Physics checkpoint perfect: ${l.title}`, `物理关卡满分：${l.zh}`); } }
      else r.failAt = Date.now();
      save();
      setTimeout(() => { const h = box.querySelector(".card.done .q"); if (h) h.insertAdjacentHTML("afterend", `<p><b>${pass ? `🏁 Checkpoint passed! +30 points${score === 10 ? " +5 perfect" : ""}` : `Not yet: you need 8/10${deepOk ? "" : " and at least one 🔥 deep question"}. Read every solution below, then try again in 1 hour with all-new questions.`}</b></p>`); }, 0);
    } });
  };
}
window.__phyCP = { cpBuild, LES };

// ---- ♾️ Endless: one problem after another at his level; level moves up/down, misses come back, no recent repeats ----
function endless(i) {
  const l = LES[i], box = $("#play"); let n = 0, stars = 0;
  P.angles = P.angles || {}; P.angOk = P.angOk || {}; const AS = P.angles[l.id] = P.angles[l.id] || {}, AO = P.angOk[l.id] = P.angOk[l.id] || {};
  const AN = PHY_GEN.ANAME || {}, unitAngles = PHY_GEN.ANGLES ? PHY_GEN.ANGLES.filter(a => (PHY_GEN.U[l.id] || []).some(t => t.angle === a)) : [];
  const coverage = () => unitAngles.length ? `<div class="sub" style="margin-top:10px;line-height:1.9">🧭 <b>Angles on ${esc(l.title)}</b> (${unitAngles.filter(a => AO[a]).length}/${unitAngles.length} mastered): ${unitAngles.map(a => `<span style="display:inline-block;padding:1px 8px;border-radius:999px;margin:2px;border:1.5px solid #16161d;background:${AO[a] >= 3 ? "#bbf7d0" : AO[a] ? "#fef3c7" : (AS[a] ? "#fee2e2" : "#fff")}">${AN[a] || a}${AS[a] ? ` ${AO[a] || 0}/${AS[a]}` : ""}</span>`).join("")}<br><span style="opacity:.7">Green = 3+ right on the first try · yellow = started · red = tried, not yet right</span></div>` : "";
  const own = [...l.pr.map(q => ({ ...q, lv: 2 })), ...l.ch.map(q => ({ ...q, lv: 5 })), ...(l.tq || []).map(q => ({ ...q, lv: 3 }))];
  const nextQ = () => { const lv = AD.level(l.id);
    if (own.length && Math.random() < 0.25) { const q = AD.pick(l.id, own, x => x.q, x => x.lv); if (q) return mix(q); }
    if (PHY_GEN.setSeen) PHY_GEN.setSeen(AS);
    return AD.next(l.id, (lvl, item) => PHY_GEN.make(l.id, lvl, item), q => q.q) || mix(own[Math.floor(Math.random() * own.length)]); };
  const draw = () => {
    const q = nextQ(); let tries = 0; const t0 = Date.now(); n++; if (q.angle) { AS[q.angle] = (AS[q.angle] || 0) + 1; save(); }
    box.innerHTML = `<div class="card"><div class="sub">♾️ Problem ${n} · <b>Level ${AD.level(l.id)}/5 ${LVN[AD.level(l.id)]}</b> · ⭐ ${stars}${q.angle ? ` · <b>${AN[q.angle] || q.angle}</b>` : ""}${q._review ? " · 🔁 one you missed earlier" : ""}</div><div class="q" style="margin-top:6px">${esc(q.q)}</div>
      <div class="ch">${q.c.map((c, j) => `<button data-c="${j}"><span class="L">${LET[j]}</span><span>${esc(c)}</span></button>`).join("")}</div><div id="fb"></div>
      <div class="row"><button class="btn" id="stopE">🏁 Stop</button></div>${coverage()}</div>`;
    $("#stopE").onclick = () => lesson(i, 4, "endless");
    box.querySelectorAll("[data-c]").forEach(b => b.onclick = () => {
      const j = +b.dataset.c, fb = $("#fb"); tries++; const secs = Math.round((Date.now() - t0) / 1000);
      const done = (ok, first) => { track({ t: l.id, m: "endless", ok: first, first, secs, q: q.q });
        const mv = AD.record(l.id, ok, { firstTry: first, slow: secs > 180, key: q.q, mkey: q.tid || null, item: q.tid ? { tid: q.tid } : null }); return mv; };
      if (j === q.a) {
        const first = tries === 1; if (first) { stars++; if (q.angle) { AO[q.angle] = (AO[q.angle] || 0) + 1; save(); } } const mv = done(true, first);
        b.classList.add("right"); box.querySelectorAll("[data-c]").forEach(x => x.disabled = true);
        fb.innerHTML = `<div class="fb ok">${first ? "✅ Yes!" : "✅ Got it on the second try."} ${esc(q.why || "")}</div>${mv.moved > 0 ? `<div class="fb ok">⬆️ <b>Level up!</b> Now Level ${mv.lv}/5 (${LVN[mv.lv]}). Harder problems are coming.</div>` : ""}<div class="row"><span class="spacer"></span><button class="btn go" id="nq">Next →</button></div>`;
        $("#nq").onclick = draw;
      } else if (tries === 1) { b.classList.add("wrong"); b.disabled = true; fb.innerHTML = `<div class="fb hint">💡 Hint: ${esc(q.hint || "Read the question again slowly.")}</div>`; }
      else { const mv = done(false, false);
        b.classList.add("wrong"); box.querySelectorAll("[data-c]").forEach(x => { x.disabled = true; if (+x.dataset.c === q.a) x.classList.add("right"); });
        fb.innerHTML = `<div class="fb no">The answer is ${LET[q.a]}. ${esc(q.why || "")} A fresh version will come back soon.</div>${mv.moved < 0 ? `<div class="fb hint">⬇️ Let's build it up: back to Level ${mv.lv}/5 for a bit.</div>` : ""}<div class="row"><span class="spacer"></span><button class="btn go" id="nq">Next →</button></div>`;
        $("#nq").onclick = draw; }
    });
  };
  draw();
}

// ---- ✍️ Worksheet mode (2026-11-21), built on Dr. Covert's advice to parents:
// "Physics is heavily calculation based… worksheets are designed around the types of questions on the exams." Study method he gave:
// try it WITHOUT notes → circle what you can't do → retry WITH the notes, writing the steps → bring circled ones to office hours.
// Typed number + unit (checked like his tests), the formula and knowns written out, notes open only after a miss, 🚩 office-hours list.
const WS_KINDS = { measure: ["conv"], kinematics: ["speed", "dist", "time", "accel", "avgspeed"], forces: ["weight", "netforce", "fma"], energy: ["work", "ke", "pe"], waves: ["wave", "period"] };
const FORMULAS = { measure: ["Metric ladder: k · h · da · BASE · d · c · m (×10 each step down)"], kinematics: ["v = d ÷ t", "d = v × t", "t = d ÷ v", "a = (v_final − v_start) ÷ t", "v_final = v_start + a × t", "average speed = total d ÷ total t"],
  forces: ["W = m × g", "m = W ÷ g", "F_net = m × a", "a = F_net ÷ m", "m = F_net ÷ a", "F_net = add forces (+ one way, − the other)"], energy: ["Work = F × d", "F = W ÷ d", "KE = ½ × m × v²", "PE = m × g × h", "h = PE ÷ (m × g)", "P = W ÷ t"], waves: ["v = f × λ", "f = v ÷ λ", "λ = v ÷ f", "T = 1 ÷ f", "f = 1 ÷ T"] };
const wsKinds = id => (window.QGEN && WS_KINDS[id] || []).filter(k => QGEN.GEN[k]);
const flagIt = (l, q, why) => { P.flags = P.flags || []; if (P.flags.some(f => f.q === q.q)) return; P.flags.push({ d: today, u: l.id, q: q.q, a: QGEN.answerText(q), why, done: false }); P.flags = P.flags.slice(-60); save(); };
function officeList(l) { const fl = (P.flags || []).filter(f => !f.done && (!l || f.u === l.id)); if (!fl.length) return "";
  return `<div class="card" style="margin-top:12px"><div class="q">🚩 Circled for office hours${l ? "" : " (all units)"} · ${fl.length}</div><p class="sub">Dr. Covert asked: bring the problems you circled so he can see what's hard. Show him this list or copy them into your notebook.</p>
    <ol style="margin:6px 0 0 18px">${fl.map(f => `<li style="margin:6px 0">${esc(f.q)} <span class="sub">· ${f.d.slice(5)}${l ? "" : ` · ${esc((LES.find(x => x.id === f.u) || {}).title || f.u)}`}</span> <button class="btn" data-flagdone="${esc(f.q)}" style="padding:2px 10px;font-size:13px">✓ Asked</button></li>`).join("")}</ol></div>`; }
function worksheet(i) {
  const l = LES[i], box = $("#play"), kinds = wsKinds(l.id); let n = 0, stars = 0;
  if (!kinds.length) { box.innerHTML = `<div class="card"><p>No calculation worksheet for this unit; use ♾️ Endless.</p></div>`; return; }
  const nextP = () => AD.next(l.id + ":ws", (lv, item) => { const k = item && item.k && kinds.includes(item.k) ? item.k : kinds[Math.floor(Math.random() * kinds.length)]; const p = QGEN.GEN[k].gen(ADAPT.tier(lv, 3)); p.k = k; return p; }, p => p.q);
  const draw = () => {
    const p = nextP(); n++; let tries = 0; const t0 = Date.now(); const units = (p.units && p.units.length > 1) ? shuffle(p.units.slice()) : null;
    box.innerHTML = `<div class="card"><div class="sub">✍️ Worksheet problem ${n} · <b>Level ${AD.level(l.id + ":ws")}/5</b> · ⭐ ${stars} · <span id="wsMode">📕 No notes first</span>${p._review ? " · 🔁 one you missed earlier" : ""}</div>
      <div class="q" style="margin-top:6px">${esc(p.q)}</div>
      <div style="display:grid;gap:8px;margin-top:10px">
        <label class="sub"><b>1 · Given</b> (list what you know, with units): <input id="wsGiven" placeholder="e.g. d = 120 m, t = 8 s" style="width:100%;padding:8px;border:2px solid #16161d;border-radius:10px;font:inherit"></label>
        <label class="sub"><b>2 · Equation</b>: <select id="wsEq" style="padding:8px;border:2px solid #16161d;border-radius:10px;font:inherit;max-width:100%"><option value="">— pick the formula —</option>${(FORMULAS[l.id] || []).map(f => `<option>${esc(f)}</option>`).join("")}</select></label>
        <label class="sub"><b>3 · Answer</b>: <span style="display:flex;gap:8px;flex-wrap:wrap"><input id="wsAns" inputmode="decimal" placeholder="number${p.kind === "frac" ? " or a/b" : ""}" style="flex:1;min-width:120px;padding:10px;border:2px solid #16161d;border-radius:10px;font:600 18px inherit">${units ? `<select id="wsUnit" style="padding:10px;border:2px solid #16161d;border-radius:10px;font:600 16px inherit"><option value="">unit…</option>${units.map(u => `<option>${esc(u)}</option>`).join("")}</select>` : p.unit ? `<span style="align-self:center;font-weight:700">${esc(p.unit)}</span>` : ""}</span></label>
      </div>
      <div class="row"><button class="btn go" id="wsCheck">Check ✓</button><button class="btn" id="wsFlag">🚩 Circle for office hours</button><span class="spacer"></span><button class="btn" id="wsStop">🏁 Stop</button></div>
      <div id="fb"></div></div>${officeList(l)}`;
    $("#wsStop").onclick = () => lesson(i, 4, "worksheet");
    $("#wsFlag").onclick = () => { flagIt(l, p, "circled"); $("#wsFlag").textContent = "🚩 Circled"; $("#wsFlag").disabled = true; };
    box.querySelectorAll("[data-flagdone]").forEach(b => b.onclick = () => { const f = (P.flags || []).find(x => x.q === b.dataset.flagdone); if (f) { f.done = true; f.asked = today; save(); } b.closest("li").remove(); });
    const steps = () => `<div class="fb hint" style="margin-top:8px"><b>✅ Worked solution</b>${p.steps.map((s, k) => `<div style="margin-top:4px"><b>${["Equation · ", "Substitute · ", "Solve · ", "Check · "][k] || ""}</b>${esc(s)}</div>`).join("")}<div style="margin-top:4px"><b>Answer:</b> ${esc(QGEN.answerText(p))}</div></div>`;
    const notes = () => `<div class="fb" style="background:#eef6ff;border:2px dashed #3b82f6;margin-top:8px"><b>📒 Your notes are open now.</b> Write the formula, list the knowns with units, plug in, then solve.<ul style="margin:6px 0 0 18px">${(FORMULAS[l.id] || []).map(f => `<li>${esc(f)}</li>`).join("")}</ul>${l.moves.slice(0, 3).map(m => `<div class="sub" style="margin-top:4px">• ${esc(m.m)}</div>`).join("")}</div>`;
    $("#wsCheck").onclick = () => {
      const raw = $("#wsAns").value.trim(); if (!raw) { $("#fb").innerHTML = `<div class="fb hint">Type your answer first.</div>`; return; }
      const unit = units ? $("#wsUnit").value : p.unit; if (units && !unit) { $("#fb").innerHTML = `<div class="fb hint">Pick a unit. On Dr. Covert's tests the unit counts.</div>`; return; }
      tries++; const res = QGEN.check(p, raw, unit), secs = Math.round((Date.now() - t0) / 1000), shown = !!($("#wsGiven").value.trim() && $("#wsEq").value);
      if (res.ok) { const first = tries === 1; if (first) stars++;
        track({ t: l.id, m: "worksheet", ok: first, first, secs, q: p.q, work: shown }); const mv = AD.record(l.id + ":ws", true, { firstTry: first, slow: secs > 300, key: p.q, mkey: p.k, item: { k: p.k } });
        P.ws = P.ws || {}; const w = P.ws[l.id] = P.ws[l.id] || { n: 0, first: 0, work: 0 }; w.n++; if (first) w.first++; if (shown) w.work++; save();
        box.querySelectorAll("input,select,#wsCheck").forEach(x => x.disabled = true);
        $("#fb").innerHTML = `<div class="fb ok">${first ? "⭐ Right without notes!" : "✅ Got it with your notes."}${shown ? "" : " Next time fill in Given and Equation too: on the test, showing work earns points."}</div>${mv.moved > 0 ? `<div class="fb ok">⬆️ Level up! Worksheet level ${mv.lv}/5.</div>` : ""}${steps()}<div class="row"><span class="spacer"></span><button class="btn go" id="wsNext">Next problem →</button></div>`;
        $("#wsNext").onclick = draw;
      } else if (tries === 1) {
        const why = { unit: "Your number is right, but the UNIT is wrong.", simplify: "Right value, but simplify the fraction.", number: "That isn't a number I can read.", value: "Not quite." }[res.why] || "Not quite.";
        $("#wsMode").textContent = "📒 Notes open"; $("#fb").innerHTML = `<div class="fb no">${why} Try again with your notes.</div>${notes()}`;
      } else {
        track({ t: l.id, m: "worksheet", ok: false, first: false, secs, q: p.q, work: shown }); const mv = AD.record(l.id + ":ws", false, { firstTry: false, key: p.q, mkey: p.k, item: { k: p.k } });
        flagIt(l, p, "missed twice"); box.querySelectorAll("input,select,#wsCheck,#wsFlag").forEach(x => x.disabled = true);
        $("#fb").innerHTML = `<div class="fb no">Still not it, so I circled it for office hours 🚩. Read the worked solution, then copy the steps into your notebook.</div>${mv.moved < 0 ? `<div class="fb hint">⬇️ Back to worksheet level ${mv.lv}/5 for a bit.</div>` : ""}${steps()}<div class="row"><span class="spacer"></span><button class="btn go" id="wsNext">Next problem →</button></div>`;
        $("#wsNext").onclick = draw;
      }
    };
  };
  draw();
}

function examples(i, k) {
  const l = LES[i], ex = l.ex[k], box = $("#exs"); let shown = 1;
  const draw = () => {
    box.innerHTML = `<div class="card"><div class="sub">Example ${k + 1} of ${l.ex.length}</div><div class="q">${esc(ex.q)}</div>
      ${ex.steps.slice(0, shown).map((s, j) => `<div class="step s${j % 4} ${j === shown - 1 ? "new" : ""}"><span class="lb">${["👀 Look", "🧠 Plan", "⚔️ Solve", "✅ Check"][j] || "•"}</span><span>${esc(s)}</span></div>`).join("")}</div>
      <div class="row">${shown < ex.steps.length ? `<span class="spacer"></span><button class="btn alt" id="more">Show next step ↓</button>` : k < l.ex.length - 1 ? `<span class="spacer"></span><button class="btn go" id="nx">Next example →</button>` : `<span class="spacer"></span><button class="btn go" id="nx">My turn! →</button>`}</div>`;
    const m = $("#more"); if (m) m.onclick = () => { shown++; draw(); };
    const n = $("#nx"); if (n) n.onclick = () => { if (k < l.ex.length - 1) examples(i, k + 1); else { markRead(l, 3); lesson(i, 4); } };
  };
  draw();
}

// ---- practice / challenge: one question at a time, a hint after a miss, the answer after two misses ----
function practice(i, mode) {
  const l = LES[i], qs = (mode === "challenge" ? l.ch : shuffle(l.pr)).map(mix), box = $("#play");
  let k = 0, score = 0, tries = 0, t0 = Date.now();
  const draw = () => {
    if (k >= qs.length) return finish();
    const q = qs[k]; tries = 0; t0 = Date.now();
    box.innerHTML = `<div class="card"><div class="prog"><i style="width:${Math.round(k / qs.length * 100)}%"></i></div><div class="sub" style="margin-top:8px">Question ${k + 1} of ${qs.length} · ⭐ ${score}</div><div class="q" style="margin-top:6px">${esc(q.q)}</div>
      <div class="ch">${q.c.map((c, j) => `<button data-c="${j}"><span class="L">${LET[j]}</span><span>${esc(c)}</span></button>`).join("")}</div><div id="fb"></div></div>`;
    box.querySelectorAll("[data-c]").forEach(b => b.onclick = () => pick(+b.dataset.c, b));
  };
  const pick = (j, b) => {
    const q = qs[k], fb = $("#fb"); tries++;
    if (j === q.a) {
      if (tries === 1) score++;
      track({ t: l.id, m: mode, ok: tries === 1, first: tries === 1, secs: Math.round((Date.now() - t0) / 1000), q: q.q });
      b.classList.add("right"); box.querySelectorAll("[data-c]").forEach(x => x.disabled = true);
      fb.innerHTML = `<div class="fb ok">${tries === 1 ? "✅ Yes!" : "✅ Got it on the second try."} ${esc(q.why)}</div><div class="row"><span class="spacer"></span><button class="btn go" id="nq">${k < qs.length - 1 ? "Next →" : "Finish"}</button></div>`;
      $("#nq").onclick = () => { k++; draw(); };
    } else if (tries === 1) {
      b.classList.add("wrong"); b.disabled = true;
      fb.innerHTML = `<div class="fb hint">💡 Hint: ${esc(q.hint)}</div>`;
    } else {
      track({ t: l.id, m: mode, ok: false, first: false, secs: Math.round((Date.now() - t0) / 1000), q: q.q });
      b.classList.add("wrong"); box.querySelectorAll("[data-c]").forEach(x => { x.disabled = true; if (+x.dataset.c === q.a) x.classList.add("right"); });
      fb.innerHTML = `<div class="fb no">The answer is ${LET[q.a]}. ${esc(q.why)}</div><div class="row"><span class="spacer"></span><button class="btn go" id="nq">${k < qs.length - 1 ? "Next →" : "Finish"}</button></div>`;
      $("#nq").onclick = () => { k++; draw(); };
    }
  };
  const finish = () => {
    const r = rec(l.id);
    if (mode === "challenge") { r.chBest = Math.max(r.chBest ?? 0, score); }
    else { r.pBest = Math.max(r.pBest ?? 0, score); r.best = Math.max(r.best || 0, Math.round(score / qs.length * 5)); }
    if (r.read < 4) r.read = 4; save();
    const great = mode === "challenge" ? score >= 2 : score >= 5;
    if (great) confetti();
    box.innerHTML = `<div class="card done"><div class="big">${great ? "🏆" : "💪"}</div><div class="q">${score} / ${qs.length} on the first try</div>
      ${mode === "practice" ? `<div class="stars">${starStr(Math.round(score / qs.length * 5))}</div>` : ""}
      <p>${great ? "Excellent! You're ready for the next step." : mode === "practice" ? "Good effort. Reread section 3 (Formulas & moves) and try again. Aim for 5/6." : "Challenge problems are supposed to be hard. Look at the explanations and try again another day."}</p>
      <div class="row" style="justify-content:center"><button class="btn" id="again">Try again</button>${mode === "practice" && score >= 4 ? `<button class="btn alt" id="toCh">⬆️ Challenge</button>` : ""}<button class="btn go" id="toTest">📝 Unit test</button><button class="btn" id="toHome">Units</button></div></div>`;
    $("#again").onclick = () => lesson(i, 4, mode);
    if ($("#toCh")) $("#toCh").onclick = () => lesson(i, 4, "challenge");
    $("#toTest").onclick = () => lesson(i, 4, "test");
    $("#toHome").onclick = home;
  };
  draw();
}

// ---- timed test (unit test or quick quiz): all questions, jump around, submit, then review ----
function testRun(o) {
  const qs = o.qs, ans = Array(qs.length).fill(null), box = o.box; let cur = 0, left = o.secs, t0 = Date.now(), over = false;
  const iv = setInterval(() => { if (!box.isConnected) return clearInterval(iv); if (document.visibilityState === "visible") left--; const tm = $("#tmr"); if (tm) { tm.textContent = "⏱ " + fmt(Math.max(0, left)); tm.classList.toggle("warn", left < 60); } if (left <= 0) submit(); }, 1000);
  const draw = () => {
    const q = qs[cur];
    box.innerHTML = `<div class="card"><div class="q" style="display:flex;gap:8px;align-items:center">${esc(o.title)}<span class="spacer"></span><span class="pill timer" id="tmr">⏱ ${fmt(left)}</span></div>
      <p class="sub">No hints. Calculator OK. Skip and come back any time; a blank is always wrong, so guess at the end.</p>
      <div class="dots">${qs.map((_, j) => `<button data-j="${j}" class="${ans[j] != null ? "ans" : ""} ${j === cur ? "cur" : ""}">${j + 1}</button>`).join("")}</div>
      <div class="q" style="margin-top:14px">${cur + 1}. ${esc(q.q)}</div>
      <div class="ch">${q.c.map((c, j) => `<button data-c="${j}" class="${ans[cur] === j ? "pick" : ""}"><span class="L">${LET[j]}</span><span>${esc(c)}</span></button>`).join("")}</div>
      <div class="row"><button class="btn" id="prev"${cur ? "" : " disabled"}>← Back</button><span class="spacer"></span>${cur < qs.length - 1 ? `<button class="btn alt" id="fwd">Next →</button>` : ""}<button class="btn go" id="sub">Hand it in</button></div></div>`;
    box.querySelectorAll("[data-j]").forEach(b => b.onclick = () => { cur = +b.dataset.j; draw(); });
    box.querySelectorAll("[data-c]").forEach(b => b.onclick = () => { ans[cur] = +b.dataset.c; if (cur < qs.length - 1) cur++; draw(); });
    $("#prev").onclick = () => { cur--; draw(); };
    if ($("#fwd")) $("#fwd").onclick = () => { cur++; draw(); };
    $("#sub").onclick = () => { const blank = ans.filter(a => a == null).length; if (blank && !confirm(`${blank} question${blank > 1 ? "s are" : " is"} blank. Hand it in anyway?`)) return; submit(); };
  };
  const submit = () => {
    if (over) return; over = true; clearInterval(iv);
    const secs = Math.round((Date.now() - t0) / 1000), score = qs.filter((q, j) => ans[j] === q.a).length;
    qs.forEach((q, j) => track({ t: q.t, m: o.mode || "test", ok: ans[j] === q.a, blank: ans[j] == null, q: q.q }));
    o.done({ score, of: qs.length, secs, ans });
    if (score / qs.length >= 0.8) confetti();
    box.innerHTML = `<div class="card done"><div class="big">${score / qs.length >= 0.8 ? "🏆" : score / qs.length >= 0.6 ? "👍" : "💪"}</div><div class="q">${score} / ${qs.length} · ${Math.round(score / qs.length * 100)}%</div><p class="sub">Time used: ${fmt(secs)}</p></div>
      <div class="card"><div class="q">Review</div>${qs.map((q, j) => `<details class="rev ${ans[j] === q.a ? "ok" : "no"}"${ans[j] === q.a ? "" : " open"}><summary>${j + 1}. ${esc(q.q)}</summary><p>Your answer: <b>${ans[j] == null ? "blank" : LET[ans[j]] + " · " + esc(q.c[ans[j]])}</b> · Right answer: <b>${LET[q.a]} · ${esc(q.c[q.a])}</b></p><p class="why">${esc(q.why)}</p></details>`).join("")}
      <div class="row"><span class="spacer"></span><button class="btn go" id="toHome">Back to units</button></div></div>`;
    $("#toHome").onclick = home;
  };
  draw();
}

function quiz() {
  window.scrollTo(0, 0);
  const pool = covered().flatMap(l => [...l.pr, ...l.tq].map(q => Object.assign({ t: l.id }, q)));
  app.innerHTML = `<div class="top"><button class="btn" id="back">← Units</button><h1 style="font-size:24px">⚡ Quick quiz</h1></div><div id="play"></div>`;
  $("#back").onclick = home;
  testRun({ title: "⚡ Quick quiz", mode: "quiz", qs: shuffle(pool).slice(0, 5).map(mix), secs: 8 * 60, box: $("#play"), done: res => { P.quizzes.push({ date: today, score: res.score, of: res.of, secs: res.secs }); P.quizzes = P.quizzes.slice(-100); save(); } });
}

home();
try { window.__phy = { lesson, AD, LES }; } catch (e) {} // test/debug handle
})();
