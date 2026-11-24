// Look Back: daily spaced review of everything Eric's classes already covered (Physics, Biology, Pre-Algebra, Latin, English, World History).
// Leitner boxes: right → next box (due in 1, 3, 7, 14, 30 days); wrong → box 1, and it comes back again later in the same session.
// Ideas he missed on real tests (f: 1) come first until he's got them twice in a row.
// Progress lives in localStorage `${kid}_review_progress`; the hub syncs it to app_saves (app "review").
(() => {
const QS = new URLSearchParams(location.search);
const KID = (QS.get("k") || "eric").toLowerCase().replace(/[^a-z]/g, "") || "eric";
const PARENT = QS.get("p") === "1";
const LS = `${KID}_review_progress`;
const load = () => { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } };
let P = load(); P.box = P.box || {}; P.log = P.log || []; P.days = P.days || {};
const save = () => { try { localStorage.setItem(LS, JSON.stringify(P)); } catch (e) {} };
const today = new Date().toLocaleDateString("en-CA");
const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString("en-CA"); };
const award = (ref, pts, label, zh) => { try { if (window.parent !== window && window.parent.fhAward) window.parent.fhAward("review", ref, pts, label, zh); } catch (e) {} };
const $ = s => document.querySelector(s), app = $("#app");
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const INTERVAL = [0, 1, 3, 7, 14, 30];
const SUBJ = ["Physics", "Biology", "Pre-Algebra", "Latin", "English", "World History"];
const ICON = { Physics: "🧲", Biology: "🧬", "Pre-Algebra": "➗", Latin: "🏛️", English: "📝", "World History": "🗺️" };

// ---------- the item pool ----------
const TOPICS = Object.assign({}, window.LB_TOPICS || {});
const POOL = (window.LB_BANK || []).map(x => Object.assign({ kind: "mc" }, x));
const PHY_PAST = ["inquiry", "measure", "kinematics", "forces"]; // Physics units 1–3 (forces = Unit 3)
(window.PHY_LESSONS || []).filter(l => PHY_PAST.includes(l.id)).forEach(l => {
  TOPICS["phy:" + l.id] = ["Physics", l.title];
  [...(l.pr || []), ...(l.tq || [])].forEach((q, i) => POOL.push({ kind: "mc", id: `p:${l.id}:${i}`, t: "phy:" + l.id, q: q.q, c: q.c, a: q.a, why: q.why || "", f: l.id === "forces" && i < 12 ? 1 : 0 }));
});
const GENS = { Physics: ["conv", "speed", "dist", "time", "accel", "weight", "netforce", "fma"], "Pre-Algebra": ["int", "expr", "eq", "frac", "gcf", "exp", "pct", "prop"] };
const GF = ["weight", "netforce", "fma"];
const G = (window.QGEN || {}).GEN || {};
Object.entries(GENS).forEach(([s, keys]) => keys.filter(k => G[k]).forEach(k => { TOPICS["g:" + k] = [s, G[k].name]; POOL.push({ kind: "num", id: "g:" + k, t: "g:" + k, gen: k, f: GF.includes(k) ? 1 : 0 }); }));
const subjOf = it => (TOPICS[it.t] || ["?"])[0];
const B = id => P.box[id] || null;
const isDue = it => { const b = B(it.id); return !b || b.due <= today; };
const hot = it => it.f && !((B(it.id) || {}).streak >= 2); // a test miss he hasn't nailed twice yet

// ---------- build today's set: 12 questions, mixed subjects, misses first ----------
function buildSet(n = 12) {
  const due = POOL.filter(isDue);
  const rank = it => (hot(it) ? 0 : 10) + (B(it.id) ? B(it.id).b : 0.5) + Math.random();
  const bySub = {}; SUBJ.forEach(s => bySub[s] = shuffle(due.filter(it => subjOf(it) === s)).sort((a, b) => rank(a) - rank(b)));
  const out = []; let round = 0;
  // Physics gets an extra slot while the Unit 3 misses are still hot
  const order = POOL.some(it => it.f && subjOf(it) === "Physics" && hot(it)) ? ["Physics", ...SUBJ] : SUBJ;
  while (out.length < n && round < 6) { for (const s of order) { if (out.length >= n) break; const it = bySub[s].shift(); if (it) out.push(it); } round++; }
  if (out.length < n) shuffle(POOL.filter(it => !out.includes(it))).slice(0, n - out.length).forEach(it => out.push(it));
  return shuffle(out);
}
function ask(it) {
  if (it.kind === "num") { const p = G[it.gen].gen(Math.min(3, Math.max(1, (B(it.id) || { b: 1 }).b))); return Object.assign({ it, num: true }, p); }
  const o = shuffle(it.c.map((c, j) => [c, j]));
  return { it, q: it.q, c: o.map(x => x[0]), a: o.findIndex(x => x[1] === it.a), why: it.why, right: it.c[it.a] };
}
function record(it, ok, first) {
  const b = P.box[it.id] = P.box[it.id] || { b: 0, n: 0, ok: 0, streak: 0 };
  b.n++; if (ok) { b.ok++; b.streak++; b.b = Math.min(5, b.b + 1); } else { b.streak = 0; b.b = 1; }
  b.due = addDays(ok ? INTERVAL[b.b] : 1); b.last = today;
  P.log.push({ d: today, id: it.id, t: it.t, ok: ok ? 1 : 0, first: first ? 1 : 0 }); if (P.log.length > 4000) P.log = P.log.slice(-4000);
  save();
}

// ---------- stats ----------
function subjStats(days = 14) {
  const since = addDays(-days), rows = {};
  SUBJ.forEach(s => rows[s] = { s, n: 0, ok: 0, items: POOL.filter(it => subjOf(it) === s).length, mastered: 0, seen: 0, topics: {} });
  POOL.forEach(it => { const b = B(it.id), r = rows[subjOf(it)]; if (!r || !b) return; r.seen++; if (b.b >= 4) r.mastered++; });
  P.log.filter(l => l.d >= since && l.first).forEach(l => { const s = (TOPICS[l.t] || [])[0], r = rows[s]; if (!r) return; r.n++; r.ok += l.ok; const t = r.topics[l.t] = r.topics[l.t] || { n: 0, ok: 0 }; t.n++; t.ok += l.ok; });
  return SUBJ.map(s => rows[s]);
}
const streak = () => { let k = 0; for (let i = 0; i < 400; i++) { const d = addDays(-i); if (P.days[d] && P.days[d].done) k++; else if (i > 0) break; } return k; };

// ---------- screens ----------
function home() {
  const st = subjStats(), done = P.days[today] && P.days[today].done, dueN = POOL.filter(isDue).length;
  app.innerHTML = `<div class="top"><h1>🔁 Look Back</h1><span class="pill">🔥 ${streak()} day${streak() === 1 ? "" : "s"}</span></div>
  <p class="sub">Old stuff comes back on tests. 12 quick questions a day keep it fresh. Miss one and it comes back tomorrow; get it right and it waits longer.</p>
  <div class="card">${done ? `<b>✅ Today's Look Back is done.</b> ${P.days[today].ok}/${P.days[today].n} right the first time. Come back tomorrow!<br><button class="btn" id="more" style="margin-top:12px">One more round</button>` :
    `<b>Today: 12 questions · about 10 minutes</b><div class="sub">${dueN} cards are ready for review.</div><button class="btn go" id="go" style="margin-top:12px">Start ▶</button>`}</div>
  ${cpCard()}
  <div class="grid">${st.map(r => `<div class="tile"><div class="em">${ICON[r.s]}</div><div class="t">${r.s}</div><div class="bar"><i style="width:${r.items ? Math.round(100 * r.mastered / r.items) : 0}%"></i></div><div class="pg">${r.mastered}/${r.items} locked in${r.n ? ` · ${Math.round(100 * r.ok / r.n)}% lately` : ""}</div></div>`).join("")}</div>
  ${PARENT ? parentView(st) : ""}`;
  const g = $("#go") || $("#more"); if (g) g.onclick = () => run(!done);
  const cg = $("#cpGo"); if (cg) cg.onclick = cpRun;
}
function parentView(st) {
  const weak = []; st.forEach(r => Object.entries(r.topics).forEach(([t, v]) => { if (v.n >= 3) weak.push({ t, s: r.s, name: TOPICS[t][1], acc: v.ok / v.n, n: v.n }); }));
  weak.sort((a, b) => a.acc - b.acc);
  const hotLeft = POOL.filter(hot).map(it => TOPICS[it.t][1]); const hotSet = [...new Set(hotLeft)];
  const days14 = Object.keys(P.days).filter(d => d >= addDays(-13) && P.days[d].done).length;
  return `<div class="card parent"><h3>👪 Parent corner</h3>
  <p>Finished ${days14} of the last 14 days · streak ${streak()}.</p>
  <table><tr><th>Subject</th><th>First-try right (14 d)</th><th>Locked in</th></tr>${st.map(r => `<tr><td>${ICON[r.s]} ${r.s}</td><td>${r.n ? `${Math.round(100 * r.ok / r.n)}% (${r.ok}/${r.n})` : "—"}</td><td>${r.mastered}/${r.items}</td></tr>`).join("")}</table>
  <p><b>Weakest topics:</b> ${weak.slice(0, 5).map(w => `${w.s}: ${esc(w.name)} ${Math.round(w.acc * 100)}% (${w.n})`).join(" · ") || "not enough answers yet"}</p>
  <p><b>Test misses not fixed yet</b> (need 2 right in a row): ${hotSet.length ? hotSet.map(esc).join(", ") : "all fixed 🎉"} (${hotLeft.length} cards)</p></div>`;
}
function run(scored) {
  const set = buildSet(), again = []; let i = 0, ok1 = 0, n1 = set.length;
  const next = () => {
    if (i >= set.length && again.length) { set.push(...again.splice(0)); }
    if (i >= set.length) return finish();
    const it = set[i], first = i < n1, q = ask(it); i++;
    const name = TOPICS[it.t] ? `${ICON[subjOf(it)]} ${subjOf(it)} · ${TOPICS[it.t][1]}` : "";
    const needUnit = q.num && q.unit && q.units && q.units.length > 1;
    app.innerHTML = `<div class="top"><h1>🔁 ${Math.min(i, n1)}/${n1}${first ? "" : " · again"}</h1><button class="btn" id="quit">✕</button></div>
      <div class="card"><div class="sub">${esc(name)}${it.f ? " · 🎯 from a test" : ""}</div><div class="q">${esc(q.q)}</div>
      ${q.num ? `<div class="numrow"><input id="ans" inputmode="decimal" autocomplete="off" placeholder="answer">${needUnit ? `<select id="unit">${shuffle(q.units).map(u => `<option>${esc(u)}</option>`).join("")}</select>` : ""}<button class="btn go" id="sub">Check</button></div>` :
        `<div class="opts">${q.c.map((c, j) => `<button class="opt" data-j="${j}">${"ABCD"[j]}. ${esc(c)}</button>`).join("")}</div>`}<div id="fb"></div></div>`;
    $("#quit").onclick = home;
    const resolve = (ok, why) => {
      record(it, ok, first); if (first && ok) ok1++;
      if (!ok && first) again.push(it);
      const right = q.num ? window.QGEN.answerText(q) : q.right, expl = q.num ? (q.steps || []).join(" → ") : q.why;
      $("#fb").innerHTML = `<div class="fb ${ok ? "good" : "bad"}"><b>${ok ? "✅ Yes!" : `❌ Answer: ${esc(right)}`}</b>${why === "unit" ? " (check the unit)" : why === "simplify" ? " (simplify the fraction)" : ""}<div>${esc(expl || "")}</div><button class="btn go" id="nx">Next ▶</button></div>`;
      $("#nx").onclick = next; $("#nx").focus();
    };
    if (q.num) { const go = () => { const v = $("#ans").value; if (!v.trim()) return $("#ans").focus(); const r = window.QGEN.check(q, v, $("#unit") ? $("#unit").value : q.unit); $("#sub").disabled = true; resolve(r.ok, r.why); };
      $("#sub").onclick = go; $("#ans").onkeydown = e => { if (e.key === "Enter" && !$("#sub").disabled) go(); }; setTimeout(() => $("#ans") && $("#ans").focus(), 50); }
    else document.querySelectorAll(".opt").forEach(b => b.onclick = () => { const j = +b.dataset.j; document.querySelectorAll(".opt").forEach(x => { x.disabled = true; if (+x.dataset.j === q.a) x.classList.add("right"); }); if (j !== q.a) b.classList.add("wrong"); resolve(j === q.a); });
  };
  const finish = () => {
    if (scored) { P.days[today] = { done: 1, n: n1, ok: ok1 }; save(); }
    app.innerHTML = `<div class="card" style="text-align:center"><div style="font-size:60px">${ok1 >= n1 * .8 ? "🏆" : ok1 >= n1 * .5 ? "💪" : "🌱"}</div><h2>${ok1}/${n1} right the first time</h2>
      <p class="sub">Every miss comes back tomorrow, so it'll stick.</p><button class="btn go" id="hm">Done</button></div>`; $("#hm").onclick = home;
  };
  next();
}
// ---------- 🏁 Weekly checkpoint (Bobby 11/23): the daily review repeats on purpose (spaced memory) and pays no points.
// Points come only from this: once a week, 10 mixed questions he has NEVER had in a checkpoint, no hints, answers shown at the end.
// Pass = 8/10 → 30 points (+5 for 10/10). Needs today's review done first. A miss: 1-hour wait, all-new questions.
P.cp = P.cp || {}; P.cpAsked = P.cpAsked || [];
const keyQ = t => String(t).replace(/\s+/g, " ").trim().toLowerCase().slice(0, 140);
const weekOf = () => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.toLocaleDateString("en-CA"); };
const cpW = () => P.cp[weekOf()] || {};
function cpCard() {
  const c = cpW(), wait = c.failAt && !c.passed ? Math.max(0, c.failAt + 3600e3 - Date.now()) : 0, doneToday = P.days[today] && P.days[today].done;
  if (c.passed) return `<div class="card">🏁 <b>This week's checkpoint: passed</b> on ${c.passed} (${c.score}/10). Next one opens Monday.</div>`;
  return `<div class="card">🏁 <b>Weekly checkpoint</b>: 10 questions from every subject you've never had in a checkpoint, no hints. Pass with 8/10 for <b>30 points</b> (the only points in Look Back).${c.best != null ? ` Best this week: ${c.best}/10.` : ""}<br>
    ${!doneToday && !PARENT ? `<span class="sub">Finish today's 12 first.</span>` : wait && !PARENT ? `<span class="sub">⏳ Try again in ${Math.ceil(wait / 60000)} min, with all-new questions.</span>` : `<button class="btn go" id="cpGo" style="margin-top:10px">🏁 Take it</button>`}</div>`;
}
function cpBuild() {
  const asked = new Set(P.cpAsked), used = new Set(), out = [], bySub = {};
  const since = addDays(-3), recentOk = it => P.log.some(l => l.id === it.id && l.ok && l.d >= since);
  SUBJ.forEach(s => bySub[s] = shuffle(POOL.filter(it => subjOf(it) === s)));
  const take = it => { for (let t = 0; t < (it.kind === "num" ? 30 : 1); t++) { const q = it.kind === "num" ? Object.assign({ it, num: true }, G[it.gen].gen(1 + Math.min(2, Math.floor((B(it.id) || { b: 1 }).b / 2)) + (t > 15 ? 0 : 0))) : ask(it), k = keyQ(q.q);
      if (!asked.has(k) && !used.has(k) && (it.kind === "num" || !recentOk(it))) { used.add(k); out.push(q); return true; } } return false; };
  for (let round = 0; out.length < 10 && round < 8; round++) for (const s of shuffle(SUBJ)) { if (out.length >= 10) break; const list = bySub[s]; while (list.length) { if (take(list.shift())) break; } }
  return out;
}
function cpRun() {
  const qs = cpBuild();
  if (qs.length < 10) { app.innerHTML = `<div class="card"><h2>Not enough new questions yet</h2><p class="sub">You've had almost every question in a checkpoint already. Parents can add more.</p><button class="btn" id="hm">Back</button></div>`; $("#hm").onclick = home; return; }
  P.cpAsked.push(...qs.map(q => keyQ(q.q))); if (P.cpAsked.length > 4000) P.cpAsked = P.cpAsked.slice(-4000); save(); window.__lastCP = qs;
  const res = []; let i = 0;
  const draw = () => {
    const q = qs[i], it = q.it, name = TOPICS[it.t] ? `${ICON[subjOf(it)]} ${subjOf(it)} · ${TOPICS[it.t][1]}` : "";
    const needUnit = q.num && q.unit && q.units && q.units.length > 1;
    app.innerHTML = `<div class="top"><h1>🏁 ${i + 1}/10</h1></div><div class="card"><div class="sub">${esc(name)} · no hints</div><div class="q">${esc(q.q)}</div>
      ${q.num ? `<div class="numrow"><input id="ans" inputmode="decimal" autocomplete="off" placeholder="answer">${needUnit ? `<select id="unit">${shuffle(q.units).map(u => `<option>${esc(u)}</option>`).join("")}</select>` : ""}<button class="btn go" id="sub">Next</button></div>`
        : `<div class="opts">${q.c.map((c, j) => `<button class="opt" data-j="${j}">${"ABCD"[j]}. ${esc(c)}</button>`).join("")}</div>`}</div>`;
    const done = (ok, given) => { record(it, ok, true); res.push({ ok, given }); i++; i < qs.length ? draw() : finish(); };
    if (q.num) { const go = () => { const v = $("#ans").value; if (!v.trim()) return $("#ans").focus(); done(window.QGEN.check(q, v, $("#unit") ? $("#unit").value : q.unit).ok, v); }; $("#sub").onclick = go; $("#ans").onkeydown = e => { if (e.key === "Enter") go(); }; setTimeout(() => $("#ans") && $("#ans").focus(), 50); }
    else document.querySelectorAll(".opt").forEach(b => b.onclick = () => done(+b.dataset.j === q.a, q.c[+b.dataset.j]));
  };
  const finish = () => {
    const score = res.filter(r => r.ok).length, pass = score >= 8, c = P.cp[weekOf()] = P.cp[weekOf()] || {}; c.best = Math.max(c.best || 0, score);
    if (pass) { c.passed = today; c.score = score; delete c.failAt; if (!PARENT) { award(`cp:wk:${weekOf()}`, 30, "Look Back weekly checkpoint passed", "回顾每周关卡通过"); if (score === 10) award(`cp10:wk:${weekOf()}`, 5, "Look Back checkpoint perfect", "回顾关卡满分"); } }
    else c.failAt = Date.now();
    save();
    app.innerHTML = `<div class="card" style="text-align:center"><div style="font-size:60px">${pass ? "🏁" : "🌱"}</div><h2>${score}/10${pass ? " · Checkpoint passed!" : ""}</h2><p>${pass ? `+30 points${score === 10 ? " +5 perfect" : ""}.` : "You need 8/10. Read every answer below; misses come back in your daily review. Try again in 1 hour with all-new questions."}</p></div>
      <div class="card">${qs.map((q, j) => `<div style="border-top:1px dashed #ddd;padding:8px 0">${res[j].ok ? "✅" : "❌"} ${esc(q.q)}<div class="sub">You: ${esc(res[j].given)} · Answer: ${esc(q.num ? window.QGEN.answerText(q) : q.right)}</div>${res[j].ok ? "" : `<div class="sub">${esc(q.num ? (q.steps || []).join(" → ") : q.why || "")}</div>`}</div>`).join("")}
      <div class="row" style="text-align:right"><button class="btn go" id="hm">Done</button></div></div>`;
    $("#hm").onclick = home;
  };
  draw();
}
window.__lbCP = { cpBuild };
home();
})();
