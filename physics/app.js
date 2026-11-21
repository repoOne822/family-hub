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
// ⭐ Hub points for correct first-try answers (the hub caps points per day)
const hubAward = (ref, pts, label, zh) => { try { if (window.parent !== window && window.parent.fhAward) window.parent.fhAward("physics", ref, pts, label, zh); } catch (e) {} };
const track = ev => { const e = Object.assign({ ts: Date.now(), d: today }, ev); P.events.push(e); if (P.events.length > 1500) P.events = P.events.slice(-1500); save();
  if (e.ok && e.m !== "read") { const test = e.m === "test" || e.m === "quiz" || e.m === "exam"; hubAward(`${e.m}:${e.t}:${e.ts}:${(e.q || "").length}`, test ? 4 : 3, `Physics ${test ? "test" : "practice"} ✓`, `物理${test ? "测验" : "练习"} ✓`); } };

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
    body = `<div class="modes" style="grid-template-columns:repeat(3,1fr)!important">
      <button data-m="practice" class="${mode === "practice" ? "on" : ""}">⭐ Practice (6)<span>${r.pBest != null ? `best ${r.pBest}/6` : "hints allowed"}</span></button>
      <button data-m="challenge" class="${mode === "challenge" ? "on" : ""}"${chOpen ? "" : " disabled"}>⬆️ Challenge (3)<span>${chOpen ? (r.chBest != null ? `best ${r.chBest}/3` : "multi-step") : "🔒 get 4/6 in Practice"}</span></button>
      <button data-m="test" class="${mode === "test" ? "on" : ""}">📝 Unit test (10)<span>${t ? `best ${t.best}/${t.of}` : "15 min, no hints"}</span></button></div><div id="play"></div>`;
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
    if (mode === "test") testRun({ title: `📝 Unit ${l.unit} test: ${l.title}`, qs: shuffle([...l.pr, ...l.ch, ...l.tq]).slice(0, 10).map(q => mix(Object.assign({ t: l.id }, q))), secs: 15 * 60, box: $("#play"), done: res => {
      const t = P.tests[l.id] = P.tests[l.id] || { best: 0, of: res.of, log: [] }; t.last = res.score; t.of = res.of; t.date = today; t.best = Math.max(t.best, res.score); t.log.push({ date: today, score: res.score, secs: res.secs }); save(); } });
    else practice(i, mode);
  }
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
    o.done({ score, of: qs.length, secs });
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
})();
