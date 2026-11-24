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
P.seen = P.seen || {}; P.tests = P.tests || []; P.log = P.log || []; P.days = P.days || {};
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
function record(it, ok, first) {
  const s = P.seen[it.id] = P.seen[it.id] || { n: 0, ok: 0, streak: 0 };
  s.n++; if (ok) { s.ok++; s.streak++; } else s.streak = 0; s.last = today;
  P.log.push({ d: today, u: it.u, id: it.id, ok: ok ? 1 : 0, first: first ? 1 : 0 }); if (P.log.length > 3000) P.log = P.log.slice(-3000);
  save();
}

// ---------- screens ----------
function home() {
  const totalM = POOL.filter(mastered).length;
  app.innerHTML = `<div class="top"><h1>${C.icon} ${esc(zh ? C.zh : C.name)}</h1><span class="pill">⭐ ${totalM}/${POOL.length}</span></div>
  <p class="sub">${C.teacher ? esc(C.teacher) + " · " : ""}${L("Practice what your class covers. Get a question right twice in a row and it's locked in ⭐.", "练习课上学的内容。同一题连续答对两次就算掌握 ⭐。")}</p>
  <div class="card"><b>⚡ ${L("Quick 10", "快速10题")}</b> <span class="sub">${L("what you're learning now + your weakest units", "正在学的 + 最弱的单元")}</span><br><button class="btn go" id="quick" style="margin-top:10px">${L("Start", "开始")} ▶</button></div>
  <div class="units">${C.units.map(u => { const s = unitStats(u); return `<div class="unit ${u.st}"><div class="uh"><b>${esc(zh ? u.zh : u.name)}</b><span class="chip ${u.st}">${ST[u.st]}</span></div>
    <div class="bar"><i style="width:${s.pct}%"></i></div><div class="sub">${s.m}/${s.n} ⭐${s.acc != null ? ` · ${s.acc}% ${L("first-try", "一次答对")}` : ""}${s.last ? ` · ${L("last check", "上次单元测")} ${s.last.score}/${s.last.n}` : ""}</div>
    <div class="ub"><button class="btn sm" data-prac="${u.id}">${L("Practice", "练习")}</button><button class="btn sm" data-test="${u.id}">${L("Unit check", "单元测")}</button></div></div>`; }).join("")}</div>
  ${PARENT ? parentView() : ""}`;
  $("#quick").onclick = () => run(quickSet(), { kind: "quick" });
  app.querySelectorAll("[data-prac]").forEach(b => b.onclick = () => run(pick([b.dataset.prac], 10), { kind: "prac", u: b.dataset.prac }));
  app.querySelectorAll("[data-test]").forEach(b => b.onclick = () => run(pick([b.dataset.test], 10), { kind: "test", u: b.dataset.test }));
}
function parentView() {
  const days = Object.keys(P.days).filter(d => d >= addDays(-13)).length;
  return `<div class="card parent"><h3>👪 ${L("Parent corner", "家长角")}</h3><p>${L(`Practiced on ${days} of the last 14 days.`, `最近14天练习了 ${days} 天。`)}</p>
  <table><tr><th>${L("Unit", "单元")}</th><th>${L("First-try right (30 d)", "一次答对（30天）")}</th><th>⭐</th><th>${L("Unit checks", "单元测")}</th></tr>
  ${C.units.map(u => { const s = unitStats(u), ts = P.tests.filter(t => t.u === u.id).slice(-3); return `<tr><td>${esc(u.name)}</td><td>${s.acc != null ? `${s.acc}% (${s.tries})` : "—"}</td><td>${s.m}/${s.n}</td><td>${ts.map(t => `${t.score}/${t.n} <span class="sub">${t.d.slice(5)}</span>`).join(", ") || "—"}</td></tr>`; }).join("")}</table></div>`;
}
function run(set, mode) {
  if (!set.length) return home();
  const n1 = set.length, again = []; let i = 0, ok1 = 0;
  const test = mode.kind === "test";
  const next = () => {
    if (i >= set.length && again.length && !test) set.push(...again.splice(0));
    if (i >= set.length) return finish();
    const it = set[i], first = i < n1, q = ask(it); i++;
    const unit = C.units.find(u => u.id === it.u);
    const needUnit = q.num && q.unit && q.units && q.units.length > 1;
    app.innerHTML = `<div class="top"><h1>${test ? "📝" : "✏️"} ${Math.min(i, n1)}/${n1}${first ? "" : " · " + L("again", "再来")}</h1><button class="btn" id="quit">✕</button></div>
      <div class="card"><div class="sub">${esc(unit ? (zh ? unit.zh : unit.name) : "")}${it.f ? " · 🎯 " + L("from a test", "考试错题") : ""}</div><div class="q">${esc(q.q)}</div>
      ${q.num ? `<div class="numrow"><input id="ans" inputmode="decimal" autocomplete="off" placeholder="${L("answer", "答案")}">${needUnit ? `<select id="unit">${shuffle(q.units).map(u => `<option>${esc(u)}</option>`).join("")}</select>` : ""}<button class="btn go" id="sub">${L("Check", "检查")}</button></div>` :
        `<div class="opts">${q.c.map((c, j) => `<button class="opt" data-j="${j}">${"ABCD"[j]}. ${esc(c)}</button>`).join("")}</div>`}<div id="fb"></div></div>`;
    $("#quit").onclick = home;
    const resolve = (ok, why) => {
      record(it, ok, first); if (first && ok) { ok1++; if (!PARENT) award(`${it.id}:${Date.now()}`, 2, `${C.name} practice`, `${C.zh}练习`); }
      if (!ok && first && !test) again.push(it);
      const right = q.num ? window.QGEN.answerText(q) : q.right, expl = q.num ? (q.steps || []).join(" → ") : q.why;
      $("#fb").innerHTML = `<div class="fb ${ok ? "good" : "bad"}"><b>${ok ? "✅ " + L("Yes!", "对了！") : `❌ ${L("Answer", "答案")}: ${esc(right)}`}</b>${why === "unit" ? L(" (check the unit)", "（检查单位）") : why === "simplify" ? L(" (simplify the fraction)", "（约分）") : ""}<div>${esc(expl || "")}</div><button class="btn go" id="nx">${L("Next", "下一题")} ▶</button></div>`;
      $("#nx").onclick = next; $("#nx").focus();
    };
    if (q.num) { const go = () => { const v = $("#ans").value; if (!v.trim()) return $("#ans").focus(); const r = window.QGEN.check(q, v, $("#unit") ? $("#unit").value : q.unit); $("#sub").disabled = true; resolve(r.ok, r.why); };
      $("#sub").onclick = go; $("#ans").onkeydown = e => { if (e.key === "Enter" && !$("#sub").disabled) go(); }; setTimeout(() => $("#ans") && $("#ans").focus(), 50); }
    else app.querySelectorAll(".opt").forEach(b => b.onclick = () => { const j = +b.dataset.j; app.querySelectorAll(".opt").forEach(x => { x.disabled = true; if (+x.dataset.j === q.a) x.classList.add("right"); }); if (j !== q.a) b.classList.add("wrong"); resolve(j === q.a); });
  };
  const finish = () => {
    P.days[today] = (P.days[today] || 0) + 1;
    if (test) P.tests.push({ u: mode.u, d: today, score: ok1, n: n1 });
    save();
    if (!PARENT) { award(`set:${today}:${P.days[today]}`, 8, `${C.name}: practice set`, `${C.zh}：完成一组练习`); if (test && ok1 >= Math.ceil(n1 * 0.8)) award(`test:${mode.u}:${today}`, 10, `${C.name}: unit check 80%+`, `${C.zh}：单元测80%以上`); }
    app.innerHTML = `<div class="card" style="text-align:center"><div style="font-size:60px">${ok1 >= n1 * .8 ? "🏆" : ok1 >= n1 * .5 ? "💪" : "🌱"}</div><h2>${ok1}/${n1} ${L("right the first time", "一次答对")}</h2>
      <p class="sub">${test ? L("Saved as a unit check.", "已记录为单元测。") : L("Misses came back once; they'll show up again next time too.", "错题已重做一次，下次还会再出现。")}</p><button class="btn go" id="hm">${L("Done", "完成")}</button></div>`;
    $("#hm").onclick = home;
  };
  next();
}
home();
})();
