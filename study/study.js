// Class Practice: a practice room for one class (window.SUBJ = chem | bio | prealg | english | latin | history).
// Units follow the class syllabus. Each unit: Practice (10 questions, misses come back at the end) and Unit check (10 questions, scored).
// ⚡ Quick 10 mixes the current unit with his weakest earlier units. Progress lives in localStorage `${kid}_study_${subj}`.
(() => {
const QS = new URLSearchParams(location.search);
const KID = (QS.get("k") || "eric").toLowerCase().replace(/[^a-z]/g, "") || "eric";
const PARENT = QS.get("p") === "1";
const SUBJ = window.SUBJ, C = (window.STUDY || {})[SUBJ];
const app = document.getElementById("app");
if (!C) { app.textContent = "Unknown class."; return; }
const zh = (() => { try { return (localStorage.getItem("fh_lang") || "").includes("zh"); } catch (e) { return false; } })();
const LS = `${KID}_study_${SUBJ}`;
let P; try { P = JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { P = {}; }
P.seen = P.seen || {}; P.tests = P.tests || []; P.log = P.log || []; P.days = P.days || {}; P.learn = P.learn || {};
const save = () => { try { localStorage.setItem(LS, JSON.stringify(P)); } catch (e) {} };
const today = new Date().toLocaleDateString("en-CA");
const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString("en-CA"); };
const award = (ref, pts, label, lz) => { try { if (window.parent !== window && window.parent.fhAward) window.parent.fhAward("study", `${SUBJ}:${ref}`, pts, label, lz); } catch (e) {} };
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const L = (en, z) => zh ? z : en;
const G = (window.QGEN || {}).GEN || {};
const ST = { done: L("Learned in class", "课上学过"), now: L("In class now", "正在学"), next: L("Coming up · preview", "即将学习 · 预习") };

// ---------- pool ----------
const POOL = [];
(C.bank || []).forEach((x, i) => POOL.push(Object.assign({ kind: "mc", id: `${SUBJ}:${i}` }, x)));
const LB = window.LB_BANK || [];
C.units.forEach(u => {
  (u.topics || []).forEach(t => LB.filter(x => x.t === t).forEach(x => POOL.push({ kind: "mc", id: "lb:" + x.id, u: u.id, q: x.q, c: x.c, a: x.a, why: x.why, f: x.f })));
  (u.gens || []).filter(k => G[k]).forEach(k => { for (let r = 0; r < 4; r++) POOL.push({ kind: "num", id: `g:${k}:${r}`, u: u.id, gen: k }); }); // 4 slots per generator so number skills weigh like a few questions
});
// 🧠 Understanding items from each unit's lesson: WHY a power move works, and what a key word means (Bobby 11/23: test understanding, not memory)
const LESX = window.STUDY_LESSONS || {};
C.units.forEach(u => { const ls = LESX[u.id]; if (!ls) return;
  const allWhy = C.units.flatMap(x => (LESX[x.id] || {}).moves || []).map(m => m.why), allDef = C.units.flatMap(x => (LESX[x.id] || {}).words || []).map(w => w[2]);
  ls.moves.forEach((m, k) => { const d = shuffle(allWhy.filter(x => x !== m.why)).slice(0, 3); if (d.length < 3) return; const c = shuffle([m.why, ...d]);
    POOL.push({ kind: "mc", id: `why:${u.id}:${k}`, u: u.id, q: `"${m.m}"\nWhy does this work?`, c, a: c.indexOf(m.why), why: m.why, deep: 1 }); });
  ls.words.forEach((w, k) => { const d = shuffle(allDef.filter(x => x !== w[2])).slice(0, 3); if (d.length < 3) return; const c = shuffle([w[2], ...d]);
    POOL.push({ kind: "mc", id: `lw:${u.id}:${k}`, u: u.id, q: `What does "${w[0]}" mean?`, c, a: c.indexOf(w[2]), why: `${w[0]}: ${w[2]} (e.g. ${w[3]})` }); });
});
const unitItems = uid => POOL.filter(x => x.u === uid);
const S = id => P.seen[id];
const mastered = it => (S(it.id) || {}).streak >= 2;
const unitStats = u => { const its = unitItems(u.id), m = its.filter(mastered).length, since = addDays(-30), lg = P.log.filter(l => l.u === u.id && l.first && l.d >= since);
  const last = P.tests.filter(t => t.u === u.id).slice(-1)[0];
  return { n: its.length, m, pct: its.length ? Math.round(100 * m / its.length) : 0, acc: lg.length ? Math.round(100 * lg.filter(l => l.ok).length / lg.length) : null, tries: lg.length, last }; };
const prio = it => { const s = S(it.id); return (it.f && !mastered(it) ? -2 : 0) + (!s ? 0 : s.streak >= 2 ? 3 : s.streak === 0 && s.n ? -1 : 1) + Math.random(); };

function pick(uids, n) {
  const pool = POOL.filter(x => uids.includes(x.u)).sort((a, b) => prio(a) - prio(b));
  const out = [], gensUsed = {};
  for (const it of pool) { if (out.length >= n) break; if (it.kind === "num") { if ((gensUsed[it.gen] || 0) >= 2) continue; gensUsed[it.gen] = (gensUsed[it.gen] || 0) + 1; } out.push(it); }
  return shuffle(out);
}
function quickSet() {
  const now = C.units.filter(u => u.st === "now").map(u => u.id), done = C.units.filter(u => u.st === "done");
  const weak = done.map(u => ({ u, s: unitStats(u) })).sort((a, b) => (a.s.acc ?? 50) - (b.s.acc ?? 50) || a.s.pct - b.s.pct).slice(0, 3).map(x => x.u.id);
  const a = pick(now, 4), b = pick(weak.length ? weak : now, 10 - a.length);
  return shuffle([...a, ...b.filter(x => !a.includes(x))]).slice(0, 10);
}
function ask(it) {
  if (it.kind === "num") { const lvl = Math.min(3, 1 + Math.floor(((S(it.id) || {}).streak || 0))); return Object.assign({ it, num: true }, G[it.gen].gen(lvl)); }
  const o = shuffle(it.c.map((c, j) => [c, j]));
  return { it, q: it.q, c: o.map(x => x[0]), a: o.findIndex(x => x[1] === it.a), why: it.why, right: it.c[it.a] };
}
// 🔒 Repeat rule (Bobby 11/23): a question he already got right in the last 3 days earns no points, and ⭐ needs right answers on 2 DIFFERENT days.
const recentRight = it => { const s = S(it.id); return !!(s && s.okDay && s.okDay >= addDays(-3)); };
function record(it, ok, first) {
  const s = P.seen[it.id] = P.seen[it.id] || { n: 0, ok: 0, streak: 0 };
  s.n++; if (ok) { s.ok++; if (s.okDay !== today) s.streak++; s.okDay = today; } else s.streak = 0; s.last = today;
  P.log.push({ d: today, u: it.u, id: it.id, ok: ok ? 1 : 0, first: first ? 1 : 0 }); if (P.log.length > 3000) P.log = P.log.slice(-3000);
  save();
}

// ---------- screens ----------
function home() {
  const totalM = POOL.filter(mastered).length;
  app.innerHTML = `<div class="top"><h1>${C.icon} ${esc(zh ? C.zh : C.name)}</h1><span class="pill">⭐ ${totalM}/${POOL.length}</span></div>
  <p class="sub">${C.teacher ? esc(C.teacher) + " · " : ""}${L("Learn each unit, practice it, then pass its 🏁 Checkpoint (8/10 on new questions, including WHY questions). Points come only from passing checkpoints.", "学习每个单元、练习，然后通过 🏁 关卡（新题答对8/10，包括“为什么”题）。只有通过关卡才得分。")}</p>
  <div class="card"><b>⚡ ${L("Quick 10", "快速10题")}</b> <span class="sub">${L("what you're learning now + your weakest units", "正在学的 + 最弱的单元")}</span><br><button class="btn go" id="quick" style="margin-top:10px">${L("Start", "开始")} ▶</button></div>
  <div class="units">${C.units.map(u => { const s = unitStats(u); return `<div class="unit ${u.st}"><div class="uh"><b>${esc(zh ? u.zh : u.name)}</b><span class="chip ${u.st}">${ST[u.st]}</span></div>
    <div class="bar"><i style="width:${s.pct}%"></i></div><div class="sub">${s.m}/${s.n} ⭐${s.acc != null ? ` · ${s.acc}% ${L("first-try", "一次答对")}` : ""}${s.last ? ` · ${L("last check", "上次单元测")} ${s.last.score}/${s.last.n}` : ""}</div>
    <div class="ub">${LES[u.id] ? `<button class="btn sm ${P.learn[u.id] && P.learn[u.id].done ? "" : "go"}" data-learn="${u.id}">📖 ${P.learn[u.id] && P.learn[u.id].done ? L("Learned ✓", "已学 ✓") : L("Learn", "学习")}</button>` : ""}<button class="btn sm" data-prac="${u.id}">${L("Practice", "练习")}</button>${cpOk(u.id) ? `<span class="chip done">🏁 ${L("Passed", "已通过")} ${P.cp[u.id].score}/10</span>` : `<button class="btn sm" data-test="${u.id}">🏁 ${L("Checkpoint", "关卡")}</button>`}</div></div>`; }).join("")}</div>
  ${PARENT ? parentView() : ""}`;
  $("#quick").onclick = () => run(quickSet(), { kind: "quick" });
  app.querySelectorAll("[data-learn]").forEach(b => b.onclick = () => learn(b.dataset.learn, 0));
  app.querySelectorAll("[data-prac]").forEach(b => b.onclick = () => run(pick([b.dataset.prac], 10), { kind: "prac", u: b.dataset.prac }));
  app.querySelectorAll("[data-test]").forEach(b => b.onclick = () => cpStart(b.dataset.test));
}
function parentView() {
  const days = Object.keys(P.days).filter(d => d >= addDays(-13)).length;
  return `<div class="card parent"><h3>👪 ${L("Parent corner", "家长角")}</h3><p>${L(`Practiced on ${days} of the last 14 days.`, `最近14天练习了 ${days} 天。`)}</p>
  <table><tr><th>${L("Unit", "单元")}</th><th>${L("First-try right (30 d)", "一次答对（30天）")}</th><th>📖</th><th>⭐</th><th>${L("Unit checks", "单元测")}</th></tr>
  ${C.units.map(u => { const s = unitStats(u), ts = P.tests.filter(t => t.u === u.id).slice(-3); return `<tr><td>${esc(u.name)}</td><td>${s.acc != null ? `${s.acc}% (${s.tries})` : "—"}</td><td>${P.learn[u.id] && P.learn[u.id].done ? "✓ " + P.learn[u.id].done.slice(5) : "—"}</td><td>${s.m}/${s.n}</td><td>${ts.map(t => `${t.score}/${t.n} <span class="sub">${t.d.slice(5)}</span>`).join(", ") || "—"}</td></tr>`; }).join("")}</table></div>`;
}
// ---------- 📖 Learn: same 4 steps as the AMC app (explain simply → key words → power moves with WHY → worked examples), then practice ----------
const LES = window.STUDY_LESSONS || {};
const readSecs = txt => Math.min(40, Math.max(5, Math.round(String(txt).split(/\s+/).length / 3.2))); // ~190 words/min, so he actually reads
function gateBtn(btn, secs) { // the Next button wakes up after a short read time (parents skip it)
  if (PARENT || !btn) return; const label = btn.textContent; btn.disabled = true; let left = secs;
  const t = setInterval(() => { left--; if (left <= 0) { clearInterval(t); btn.disabled = false; btn.textContent = label; } else btn.textContent = `⏳ ${left}s · ${label}`; }, 1000);
  btn.textContent = `⏳ ${left}s · ${label}`;
}
function learn(uid, step) {
  const les = LES[uid], unit = C.units.find(u => u.id === uid); if (!les) return home();
  const rec = P.learn[uid] = P.learn[uid] || {}; rec.read = Math.max(rec.read ?? -1, step - 1); save();
  const STEPS = [L("Explain it simply", "简单讲讲"), L("Key words", "关键词"), L("Power moves", "关键方法"), L("Worked examples", "例题")];
  const head = `<div class="top"><button class="btn" id="back">← ${L("Units", "单元")}</button><h1 style="font-size:22px">${C.icon} ${esc(zh ? unit.zh : unit.name)}</h1></div>
    <div class="steps">${STEPS.map((x, i) => `<span class="${i === step ? "on" : i < step ? "done" : ""}">${i < step ? "✓" : i + 1} ${x}</span>`).join("")}</div>`;
  const nav = (txt, secs) => `<div style="text-align:right;margin-top:14px"><button class="btn go" id="next">${txt}</button></div>`;
  let body = "", text = "";
  if (step === 0) { text = les.six.join(" "); body = `<div class="card six">${les.six.map(p => `<p>${esc(p)}</p>`).join("")}</div>${nav(L("Got it! →", "懂了！→"))}`; }
  if (step === 1) { text = les.words.map(w => w[2] + " " + w[3]).join(" ");
    body = `<div class="card"><div class="q">📘 ${L("Key words: know these first", "关键词：先弄懂这些")}</div><p class="sub">${L("Tests use these exact words. Tap ✓ when you could explain each one to a friend.", "考试就用这些词。能给朋友讲清楚就点 ✓。")}</p>
      ${les.words.map(w => `<div class="word"><div class="wt">${esc(w[0])} <span class="zh">${esc(w[1])}</span></div><div>${esc(w[2])}</div><div class="eg">${L("e.g.", "例")} ${esc(w[3])}</div>${PARENT ? "" : `<button class="tick" data-tick>✓ ${L("Got it", "懂了")}</button>`}</div>`).join("")}</div>${nav(L("Next →", "下一步 →"))}`; }
  if (step === 2) { text = les.moves.map(m => m.m + " " + m.why).join(" ");
    body = `<div class="card"><div class="q">⚡ ${L("Power moves", "关键方法")}</div><p class="sub">${L("Each move comes with WHY it works. Know the why and you'll remember it on test day.", "每个方法都有“为什么”。懂了为什么，考试时就记得住。")}</p>
      ${les.moves.map((m, k) => `<div class="move"><b>${k + 1}</b><div style="flex:1;min-width:0"><div class="mm">${esc(m.m)}</div><div class="why"><span>🤔 ${L("Why it works:", "为什么：")}</span> ${esc(m.why)}</div>${PARENT ? "" : `<button class="tick" data-tick>✓ ${L("Got it", "懂了")}</button>`}</div></div>`).join("")}</div>${nav(L("See examples →", "看例题 →"))}`; }
  if (step === 3) return examples(uid, 0, 1);
  app.innerHTML = head + body; window.scrollTo(0, 0);
  $("#back").onclick = home;
  const nx = $("#next"), ticks = [...app.querySelectorAll("[data-tick]")];
  const ready = () => ticks.every(t => t.classList.contains("on"));
  ticks.forEach(t => t.onclick = () => { t.classList.toggle("on"); if (nx.dataset.timed === "1") nx.disabled = !ready(); });
  gateBtn(nx, readSecs(text));
  if (ticks.length && !PARENT) { const iv = setInterval(() => { if (!document.body.contains(nx)) return clearInterval(iv); if (!nx.textContent.startsWith("⏳")) { clearInterval(iv); nx.dataset.timed = "1"; nx.disabled = !ready(); if (!ready()) nx.title = L("Tap every ✓ first", "先把每个 ✓ 点上"); } }, 300); }
  nx.onclick = () => { track(uid, step);
    if (step === 1) return quickCheck(uid, "lw", 2, () => learn(uid, 1), () => learn(uid, 2));
    if (step === 2) return quickCheck(uid, "why", 1, () => learn(uid, 2), () => learn(uid, 3));
    learn(uid, step + 1); };
}
// ✅ Check-yourself stops inside the lesson: after Key words (2 word questions) and after Power moves (1 WHY question).
// All must be right to continue; a miss shows the answer and sends him back to re-read that step.
function quickCheck(uid, kind, n, back, onPass) {
  const items = shuffle(POOL.filter(x => x.u === uid && x.id.startsWith(kind + ":"))).slice(0, n); if (!items.length) return onPass();
  let k = 0;
  const draw = () => { const it = items[k], q = ask(it);
    app.innerHTML = `<div class="card"><div class="sub">✅ ${L("Check yourself", "自我检查")} ${k + 1}/${items.length} · ${L("no peeking", "不许偷看")}</div><div class="q" style="white-space:pre-line">${esc(q.q)}</div>
      <div class="opts">${q.c.map((c, j) => `<button class="opt" data-j="${j}">${"ABCD"[j]}. ${esc(c)}</button>`).join("")}</div><div id="fb"></div></div>`;
    app.querySelectorAll(".opt").forEach(b => b.onclick = () => { const j = +b.dataset.j, ok = j === q.a; record(it, ok, true);
      app.querySelectorAll(".opt").forEach(x => { x.disabled = true; if (+x.dataset.j === q.a) x.classList.add("right"); }); if (!ok) b.classList.add("wrong");
      $("#fb").innerHTML = ok ? `<div class="fb good"><b>✅ ${L("Yes!", "对了！")}</b><div>${esc(q.why)}</div><button class="btn go" id="nx">${L("Next", "继续")} ▶</button></div>`
        : `<div class="fb bad"><b>❌ ${L("Not yet.", "还没懂。")}</b><div>${esc(q.why)}</div><button class="btn go" id="nx">↩ ${L("Re-read that part", "回去再读一遍")}</button></div>`;
      $("#nx").onclick = () => { if (!ok) return back(); k++; k < items.length ? draw() : onPass(); }; }); };
  draw();
}
// 🏁 Checkpoint: 10 questions he hasn't gotten right recently: 2 WHY + 1 key word + 7 from the unit (number problems are always new).
// Pass = 8/10 → unit passed + 30 points (+5 for 10/10). A miss: full review, then 1 hour before a retake with different questions.
P.cp = P.cp || {};
const cpOk = uid => !!(P.cp[uid] && P.cp[uid].passed);
const cpWait = uid => { const c = P.cp[uid]; return c && !c.passed && c.failAt ? Math.max(0, c.failAt + 3600e3 - Date.now()) : 0; };
function cpStart(uid) {
  const unit = C.units.find(u => u.id === uid), w = cpWait(uid);
  if (!PARENT && LES[uid] && !(P.learn[uid] && P.learn[uid].done)) { app.innerHTML = `<div class="card" style="text-align:center"><div style="font-size:50px">📖</div><h2>${L("Learn it first", "先学习")}</h2><p>${L("Finish the 📖 lesson for this unit, then take the checkpoint.", "先学完这个单元的 📖 课，再挑战关卡。")}</p><button class="btn go" id="gl">📖 ${L("Start the lesson", "开始学习")}</button> <button class="btn" id="hm">${L("Back", "返回")}</button></div>`; $("#gl").onclick = () => learn(uid, 0); $("#hm").onclick = home; return; }
  if (!PARENT && w) { app.innerHTML = `<div class="card" style="text-align:center"><div style="font-size:50px">⏳</div><h2>${L("Review first", "先复习")}</h2><p>${L(`Practice this unit and re-read the lesson. You can retake the checkpoint in ${Math.ceil(w / 60000)} min, with different questions.`, `练习这个单元、重读课文。${Math.ceil(w / 60000)} 分钟后可以重新挑战（换新题）。`)}</p><button class="btn go" id="pr">${L("Practice", "练习")}</button> <button class="btn" id="hm">${L("Back", "返回")}</button></div>`; $("#pr").onclick = () => run(pick([uid], 10), { kind: "prac", u: uid }); $("#hm").onclick = home; return; }
  const notRecent = x => !(S(x.id) && S(x.id).okDay && S(x.id).okDay >= addDays(-3));
  const fromPre = (pre, n) => shuffle(POOL.filter(x => x.u === uid && x.id.startsWith(pre) && notRecent(x))).slice(0, n);
  const set = [...fromPre("why:", 2), ...fromPre("lw:", 1)];
  const rest = shuffle(POOL.filter(x => x.u === uid && !x.id.startsWith("why:") && !x.id.startsWith("lw:") && (x.kind === "num" || notRecent(x))));
  const g = {}; for (const it of rest) { if (set.length >= 10) break; if (it.kind === "num") { if ((g[it.gen] || 0) >= 2) continue; g[it.gen] = (g[it.gen] || 0) + 1; } set.push(it); }
  if (set.length < 6) { app.innerHTML = `<div class="card" style="text-align:center"><h2>${L("Not enough new questions yet", "新题还不够")}</h2><p>${L("You've recently answered most of this unit's questions. Come back in a day or two.", "这个单元的题最近大多答过了，过一两天再来。")}</p><button class="btn" id="hm">${L("Back", "返回")}</button></div>`; $("#hm").onclick = home; return; }
  run(shuffle(set), { kind: "test", u: uid, cp: true });
}

function track(uid, step) { const r = P.learn[uid] = P.learn[uid] || {}; r.read = Math.max(r.read ?? -1, step); save(); }
function examples(uid, e, shown) {
  const les = LES[uid], unit = C.units.find(u => u.id === uid), x = les.ex[e];
  const STEPS = [L("Explain it simply", "简单讲讲"), L("Key words", "关键词"), L("Power moves", "关键方法"), L("Worked examples", "例题")];
  app.innerHTML = `<div class="top"><button class="btn" id="back">← ${L("Units", "单元")}</button><h1 style="font-size:22px">${C.icon} ${esc(zh ? unit.zh : unit.name)}</h1></div>
    <div class="steps">${STEPS.map((s, i) => `<span class="${i === 3 ? "on" : "done"}">${i < 3 ? "✓" : 4} ${s}</span>`).join("")}</div>
    <div class="card"><div class="sub">${L("Example", "例题")} ${e + 1} / ${les.ex.length}</div><div class="q">${esc(x.q)}</div>
    <p class="sub">${L("Before each step, guess what comes next. Then check.", "每一步之前先猜下一步，再看答案。")}</p>
    ${x.steps.slice(0, shown).map((st, k) => `<div class="step"><b>${k + 1}</b><span>${esc(st)}</span></div>`).join("")}
    <div style="text-align:right;margin-top:12px">${shown < x.steps.length ? `<button class="btn" id="more">${L("Show next step", "显示下一步")} (${shown}/${x.steps.length})</button>` : e < les.ex.length - 1 ? `<button class="btn go" id="nx">${L("Next example →", "下一个例题 →")}</button>` : `<button class="btn go" id="nx">${L("My turn! Practice →", "轮到我了！去练习 →")}</button>`}</div></div>`;
  $("#back").onclick = home;
  if ($("#more")) { gateBtn($("#more"), Math.max(4, readSecs(shown ? x.steps[shown - 1] : x.q))); $("#more").onclick = () => examples(uid, e, shown + 1); }
  if ($("#nx")) $("#nx").onclick = () => {
    if (e < les.ex.length - 1) return examples(uid, e + 1, 1);
    const r = P.learn[uid] = P.learn[uid] || {}; r.read = 3; const first = !r.done; r.done = r.done || today; save();
    run(pick([uid], 10), { kind: "prac", u: uid });
  };
}

function run(set, mode) {
  if (!set.length) return home();
  const n1 = set.length, again = []; let i = 0, ok1 = 0;
  const test = mode.kind === "test";
  const next = () => {
    if (i >= set.length && again.length && !test) set.push(...again.splice(0));
    if (i >= set.length) return finish();
    const it = set[i], first = i < n1, q = ask(it), rep = it.kind === "mc" && recentRight(it), shownAt = Date.now(); i++;
    const unit = C.units.find(u => u.id === it.u);
    const needUnit = q.num && q.unit && q.units && q.units.length > 1;
    app.innerHTML = `<div class="top"><h1>${test ? "📝" : "✏️"} ${Math.min(i, n1)}/${n1}${first ? "" : " · " + L("again", "再来")}</h1><button class="btn" id="quit">✕</button></div>
      <div class="card"><div class="sub">${esc(unit ? (zh ? unit.zh : unit.name) : "")}${it.f ? " · 🎯 " + L("from a test", "考试错题") : ""}${mode.cp ? " · 🏁 " + L("Checkpoint", "关卡") : ""}</div><div class="q" style="white-space:pre-line">${esc(q.q)}</div>
      ${q.num ? `<div class="numrow"><input id="ans" inputmode="decimal" autocomplete="off" placeholder="${L("answer", "答案")}">${needUnit ? `<select id="unit">${shuffle(q.units).map(u => `<option>${esc(u)}</option>`).join("")}</select>` : ""}<button class="btn go" id="sub">${L("Check", "检查")}</button></div>` :
        `<div class="opts">${q.c.map((c, j) => `<button class="opt" data-j="${j}">${"ABCD"[j]}. ${esc(c)}</button>`).join("")}</div>`}<div id="fb"></div></div>`;
    $("#quit").onclick = home;
    const resolve = (ok, why) => {
      const fast = Date.now() - shownAt < 4000;
      record(it, ok, first); if (first && ok) { ok1++; /* no per-question points: points only from 🏁 checkpoints */ void rep; void fast; }
      if (!ok && first && !test) again.push(it);
      const right = q.num ? window.QGEN.answerText(q) : q.right, expl = q.num ? (q.steps || []).join(" → ") : q.why;
      $("#fb").innerHTML = `${rep && ok ? `<div class="fb" style="background:#fff8d6">🔁 ${L("You got this one right in the last few days: practice only, no points.", "这题最近几天答对过：只算练习，不加分。")}</div>` : ""}<div class="fb ${ok ? "good" : "bad"}"><b>${ok ? "✅ " + L("Yes!", "对了！") : `❌ ${L("Answer", "答案")}: ${esc(right)}`}</b>${why === "unit" ? L(" (check the unit)", "（检查单位）") : why === "simplify" ? L(" (simplify the fraction)", "（约分）") : ""}<div>${esc(expl || "")}</div><button class="btn go" id="nx">${L("Next", "下一题")} ▶</button></div>`;
      $("#nx").onclick = next; $("#nx").focus();
    };
    if (q.num) { const go = () => { const v = $("#ans").value; if (!v.trim()) return $("#ans").focus(); const r = window.QGEN.check(q, v, $("#unit") ? $("#unit").value : q.unit); $("#sub").disabled = true; resolve(r.ok, r.why); };
      $("#sub").onclick = go; $("#ans").onkeydown = e => { if (e.key === "Enter" && !$("#sub").disabled) go(); }; setTimeout(() => $("#ans") && $("#ans").focus(), 50); }
    else app.querySelectorAll(".opt").forEach(b => b.onclick = () => { const j = +b.dataset.j; app.querySelectorAll(".opt").forEach(x => { x.disabled = true; if (+x.dataset.j === q.a) x.classList.add("right"); }); if (j !== q.a) b.classList.add("wrong"); resolve(j === q.a); });
  };
  const finish = () => {
    P.days[today] = (P.days[today] || 0) + 1;
    if (test) P.tests.push({ u: mode.u, d: today, score: ok1, n: n1, cp: mode.cp ? 1 : 0 });
    let cpMsg = "";
    if (mode.cp) { const c = P.cp[mode.u] = P.cp[mode.u] || {}, pass = ok1 >= Math.ceil(n1 * 0.8);
      if (pass) { c.passed = today; c.score = ok1; delete c.failAt; if (!PARENT) { award(`cp:${mode.u}`, 30, `${C.name} checkpoint passed`, `${C.zh}关卡通过`); if (ok1 === n1) award(`cp10:${mode.u}`, 5, `${C.name} checkpoint perfect`, `${C.zh}关卡满分`); } }
      else c.failAt = Date.now();
      cpMsg = pass ? `🏁 ${L("Checkpoint passed! +30 points", "关卡通过！+30 分")}${ok1 === n1 ? " +5" : ""}` : L(`Need ${Math.ceil(n1 * 0.8)}/${n1} to pass. Review the misses, practice, and retake in 1 hour with different questions.`, `需要 ${Math.ceil(n1 * 0.8)}/${n1} 才能通过。复习错题、练习，1 小时后换新题再挑战。`); }
    save();
    // (no set points: points only from 🏁 checkpoints)
    app.innerHTML = `<div class="card" style="text-align:center"><div style="font-size:60px">${ok1 >= n1 * .8 ? "🏆" : ok1 >= n1 * .5 ? "💪" : "🌱"}</div><h2>${ok1}/${n1} ${L("right the first time", "一次答对")}</h2>
      <p class="sub">${mode.cp ? `<b>${cpMsg}</b>` : test ? L("Saved as a unit check.", "已记录为单元测。") : L("Misses came back once; they'll show up again next time too.", "错题已重做一次，下次还会再出现。")}</p><button class="btn go" id="hm">${L("Done", "完成")}</button></div>`;
    $("#hm").onclick = home;
  };
  next();
}
home();
})();
