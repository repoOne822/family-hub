// Family Hub — static front end. All family data lives in a private Supabase
// database behind sign-in + row-level security. Nothing personal is in this repo.
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { STR } from "./i18n.js";

const SUPABASE_URL = "https://iiplawparuxicjyflhzu.supabase.co";
const SUPABASE_KEY = "sb_publishable_p10mMjAj6HvAC8lLx8vMlQ_-eaCNwSq"; // publishable key: safe in public code, RLS protects the data
const sb = window.__SB_MOCK || createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });

/* ---------------- state ---------------- */
let lang = "en";
try { lang = localStorage.getItem("fh_lang") || (navigator.language?.startsWith("zh") ? "zh" : "en"); } catch (e) {}
const T = () => STR[lang];
const S = { user: null, me: null, kids: [], entries: [], goals: [], metrics: [], checkins: [], readings: [], docs: [], journal: [], moods: [], subjects: [] };
const KID_DOMAIN = "kids.family-hub.local"; // kid logins are username@this; no real email needed
let coachKid = null, selKid = "";

const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const addDays = (s, n) => { const d = new Date(s + "T12:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const daysAgo = n => addDays(today(), -n);
const dayDiff = (a, b) => Math.round((new Date(b + "T12:00") - new Date(a + "T12:00")) / 864e5);
const fmtDate = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString(lang === "zh" ? "zh-CN" : undefined, { month: "short", day: "numeric", year: y !== new Date().getFullYear() ? "numeric" : undefined }); };
const pct = v => v == null ? "—" : Math.round(v * 100) + "%";
const clamp01 = v => Math.max(0, Math.min(1, v));
const KC = ["var(--k0)", "var(--k1)", "var(--k2)"];
const FACES = ["😣", "🙁", "😐", "🙂", "😄"];
const kidName = id => { const k = S.kids.find(k => k.id === id); return k ? (lang === "zh" && k.name_zh ? k.name_zh : k.name) : ""; };
const kidColor = id => KC[Math.max(0, S.kids.findIndex(k => k.id === id)) % 3];
const mName = m => (lang === "zh" && m.name_zh) ? m.name_zh : m.name;
const sName = x => x ? ((lang === "zh" && x.name_zh) ? x.name_zh : x.name) : "";
const sDesc = x => (lang === "zh" && x.description_zh) ? x.description_zh : (x.description || "");
const subjOf = id => S.subjects.find(x => x.id === id);
const mKidLabel = m => (lang === "zh" && m.kid_label_zh) ? m.kid_label_zh : (m.kid_label || "✅ " + m.name);
function setStatus(msg, warn) { const s = $("#status"); if (s) { s.textContent = msg || ""; s.classList.toggle("warn", !!warn); } }
function applyStatic() { document.querySelectorAll("[data-t]").forEach(el => { const v = T()[el.dataset.t]; if (typeof v === "string") el.textContent = v; }); document.documentElement.lang = lang === "zh" ? "zh-CN" : "en"; document.body.style.fontFamily = lang === "zh" ? "Inter,'Noto Sans SC',system-ui,sans-serif" : ""; }

/* ---------------- data ---------------- */
async function loadMe() {
  const { data, error } = await sb.from("allowed_users").select("role,kid_id,display_name").eq("email", (S.user.email || "").toLowerCase()).maybeSingle();
  if (error) throw error; S.me = data || null;
}
const isKid = () => S.me?.role === "kid";
async function loadAll() {
  if (isKid()) {
    const tables = ["kids", "entries", "goals", "metrics", "readings", "docs", "journal", "subjects"];
    const res = await Promise.all(tables.map(t => sb.from(t).select("*")));
    res.forEach((r, i) => { if (r.error) throw r.error; S[tables[i]] = r.data || []; });
    const m = await sb.rpc("kid_moods", { p_days: 60 }); S.moods = m.data || []; S.checkins = [];
    S.metrics.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)); S.subjects.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)); return;
  }
  const tables = ["kids", "entries", "goals", "metrics", "checkins", "readings", "docs", "journal", "subjects"];
  const res = await Promise.all(tables.map(t => sb.from(t).select("*")));
  res.forEach((r, i) => { if (r.error) throw r.error; S[tables[i]] = r.data || []; });
  S.kids.sort((a, b) => (a.sort ?? 9) - (b.sort ?? 9));
  S.metrics.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)); S.subjects.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  if (!coachKid || !S.kids.some(k => k.id === coachKid)) coachKid = S.kids[0]?.id || null;
}
async function upsert(table, row, onConflict) { const { error } = await sb.from(table).upsert(row, onConflict ? { onConflict } : undefined); if (error) throw error; }
async function del(table, match) { let q = sb.from(table).delete(); for (const [k, v] of Object.entries(match)) q = q.eq(k, v); const { error } = await q; if (error) throw error; }
async function refresh() { try { await loadAll(); route(); } catch (e) { setStatus(e.message || "Load failed", true); } }
document.addEventListener("visibilitychange", () => { if (!document.hidden && S.user) refresh(); });

/* ---------------- auth ---------------- */
let siMode = "parent";
function renderSignIn(msg) {
  $("#root").innerHTML = `<div class="signin">
    <div style="display:flex;justify-content:space-between;align-items:center"><h1>🌱 ${T().signInTitle}</h1><button class="lang" id="langBtn">${lang === "en" ? "中文" : "English"}</button></div>
    <p class="meta">${T().signInSub}</p>
    <div class="tabs" style="margin:8px 0 14px"><button class="${siMode === "parent" ? "on" : ""}" data-mode="parent">${T().iAmParent}</button><button class="${siMode === "kid" ? "on" : ""}" data-mode="kid">${T().iAmKid}</button></div>
    ${siMode === "parent" ? `<form id="siForm"><label>${T().emailLabel}</label><input type="email" id="siEmail" required autocomplete="email"><button class="btn primary" style="width:100%;margin-top:12px">${T().sendLink}</button></form>`
      : `<form id="kidForm2"><label>${T().username}</label><input id="kUser" required autocomplete="username" autocapitalize="none" spellcheck="false"><label style="margin-top:10px">${T().pin}</label><input id="kPin" type="password" inputmode="numeric" required autocomplete="current-password" minlength="6"><button class="btn primary" style="width:100%;margin-top:12px">${T().signIn}</button></form>`}
    <p class="meta" id="siMsg" style="margin-top:12px">${msg ? esc(msg) : ""}</p></div>`;
  $("#langBtn").onclick = toggleLang;
  document.querySelectorAll("[data-mode]").forEach(b => b.onclick = () => { siMode = b.dataset.mode; renderSignIn(); });
  if (siMode === "kid") { $("#kidForm2").onsubmit = async e => {
    e.preventDefault();
    const u = $("#kUser").value.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
    const { error } = await sb.auth.signInWithPassword({ email: `${u}@${KID_DOMAIN}`, password: $("#kPin").value });
    if (error) $("#siMsg").textContent = T().badLogin;
  }; return; }
  $("#siForm").onsubmit = async e => {
    e.preventDefault();
    const email = $("#siEmail").value.trim();
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } });
    $("#siMsg").textContent = error ? (/not on the family list|Database error/i.test(error.message) ? T().notListed : error.message) : T().linkSent;
  };
}
function toggleLang() { lang = lang === "en" ? "zh" : "en"; try { localStorage.setItem("fh_lang", lang); } catch (e) {} applyStatic(); S.user ? (isKid() ? kidRender() : (renderShell(), route())) : renderSignIn(); }

async function start() {
  applyStatic();
  const { data } = await sb.auth.getSession();
  S.user = data?.session?.user || null;
  sb.auth.onAuthStateChange((_e, session) => { const was = !!S.user; S.user = session?.user || null; if (!!S.user !== was) boot(); });
  boot();
}
async function boot() {
  if (!S.user) return renderSignIn();
  try { await loadMe(); } catch (e) { S.me = null; }
  if (!S.me) { $("#root").innerHTML = `<div class="signin"><p>${T().notListed}</p><button class="btn" id="soBtn">${T().signOut}</button></div>`; $("#soBtn").onclick = () => sb.auth.signOut(); return; }
  if (isKid()) return kidBoot();
  renderShell(); setStatus(T().loading);
  try { await loadAll(); setStatus(""); route(); }
  catch (e) { setStatus(e.message || "Load failed", true); }
}

/* ---------------- shell + routing ---------------- */
const ROUTES = ["today", "dashboard", "subjects", "log", "plans", "reports", "family"];
function renderShell() {
  $("#root").innerHTML = `<div class="topbar"><div class="in">
    <div class="brand">🌱 ${T().appTitle}</div>
    <nav class="nav">${ROUTES.map(r => `<a href="#${r}" data-r="${r}">${T()["nav" + { today: "Today", dashboard: "Dash", subjects: "Subjects", log: "Log", plans: "Plans", reports: "Reports", family: "Family" }[r]]}</a>`).join("")}</nav>
    <button class="lang" id="langBtn">${lang === "en" ? "中文" : "English"}</button>
    <button class="btn sm ghost" id="soBtn">${T().signOut}</button></div></div>
    <div class="wrap"><div class="status" id="status"></div><div id="view"></div></div>`;
  $("#langBtn").onclick = toggleLang;
  $("#soBtn").onclick = async () => { await sb.auth.signOut(); };
}
window.addEventListener("hashchange", route);
function route() {
  if (!S.user || isKid()) return;
  if (!$("#view")) return;
  let h = location.hash.slice(1) || "today";
  let doc = null;
  if (h.startsWith("doc-")) { doc = h.slice(4); h = "doc"; }
  if (!ROUTES.includes(h) && h !== "doc") h = "today";
  document.querySelectorAll(".nav a").forEach(a => a.classList.toggle("on", a.dataset.r === h || (h === "doc" && a.dataset.r === (S.docs.find(d => d.slug === doc)?.section === "report" ? "reports" : "plans"))));
  ({ today: viewToday, dashboard: viewDash, log: viewLog, plans: () => viewDocs("plan"), reports: () => viewDocs("report"), family: viewFamily, subjects: viewSubjects, doc: () => viewDoc(doc) })[h]();
}

/* ---------------- TODAY ---------------- */
function viewToday() {
  const d = today();
  $("#view").innerHTML = `<div class="hero">
      <button class="herobtn" style="background:var(--k0)" id="goKids">🧒 ${T().kidsTapIn}<small>${T().kidsTapInSub}</small></button>
      <button class="herobtn" style="background:var(--accent)" id="goQuick">⚡ ${T().parentCheckin}<small>${T().parentCheckinSub}</small></button>
    </div>
    <div class="section-h"><h3>${T().todayStatus} · ${fmtDate(d)}</h3><button class="btn sm" id="goLog">${T().logEntry}</button></div>
    <div class="todayrow">${S.kids.map((k, i) => { const c = S.checkins.find(c => c.kid === k.id && c.date === d) || {};
      const habits = S.metrics.filter(m => m.kid === k.id && m.type === "rate").map(m => { const r = S.readings.find(r => r.metric === m.id && r.date === d); return r && +r.value ? mKidLabel(m) : null; }).filter(Boolean);
      return `<div class="tcard" style="border-top:4px solid ${KC[i % 3]}"><b>${esc(kidName(k.id))}</b>
        <div class="meta">${c.kid_mood ? `${T().heSaid} ${FACES[c.kid_mood - 1]}` : T().notYet} · ${c.focus ? `${T().parentRated} ✓` : `${T().parentRated} —`}</div>
        ${habits.length ? `<div class="meta">${esc(habits.join(" · "))}</div>` : ""}</div>`; }).join("")}</div>`;
  $("#goKids").onclick = openKidMode; $("#goQuick").onclick = openQuick; $("#goLog").onclick = () => openEntry();
}

/* ---------------- KID MODE ---------------- */
const kidSt = { kid: null, mood: null, counts: {} };
function openKidMode() { $("#kidMode").classList.add("open"); kidStage("who"); }
function kidStage(step) {
  const el = $("#kidStage"), d = today();
  if (step === "who") {
    el.innerHTML = `<h2>${T().whoChecking}</h2><div class="bigkids">${S.kids.map((k, i) => { const done = S.checkins.find(c => c.kid === k.id && c.date === d && c.kid_mood); return `<button class="bigkid" style="background:${KC[i % 3]}" data-kid="${esc(k.id)}">${esc(kidName(k.id))}<small>${done ? T().doneToday : T().tapMe}</small></button>`; }).join("")}</div>`;
    el.querySelectorAll("[data-kid]").forEach(b => b.onclick = () => {
      kidSt.kid = b.dataset.kid; kidSt.mood = S.checkins.find(c => c.kid === kidSt.kid && c.date === d)?.kid_mood || null; kidSt.counts = {};
      S.metrics.filter(m => m.kid === kidSt.kid && m.type === "rate").forEach(m => { const r = S.readings.find(r => r.metric === m.id && r.date === d); kidSt.counts[m.id] = r ? +r.value : 0; });
      kidStage("face");
    });
  }
  if (step === "face") {
    el.innerHTML = `<h2>${T().howWasToday(esc(kidName(kidSt.kid)))}</h2><div class="bigfaces">${FACES.map((f, i) => `<button data-n="${i + 1}" class="${kidSt.mood === i + 1 ? "on" : ""}" aria-label="${T().faces[i]}">${f}</button>`).join("")}</div>`;
    el.querySelectorAll("[data-n]").forEach(b => b.onclick = () => { kidSt.mood = +b.dataset.n; b.classList.add("on"); setTimeout(() => kidStage(S.metrics.some(m => m.kid === kidSt.kid && m.type === "rate") ? "did" : "save"), 180); });
  }
  if (step === "did") {
    const ms = S.metrics.filter(m => m.kid === kidSt.kid && m.type === "rate");
    const draw = () => {
      el.innerHTML = `<h2>${T().whatDidYouDo}</h2><div class="meta" style="text-align:center;margin-top:-10px;margin-bottom:12px">${T().tapAll}</div>
        <div class="chips">${ms.map(m => { const n = kidSt.counts[m.id] || 0, mx = m.kid_max || 1; return `<button class="chipbtn ${n ? "on" : ""}" data-m="${esc(m.id)}"><span>${esc(mKidLabel(m))}</span><span class="ct">${n ? (mx > 1 ? "✓".repeat(n) : "✓") : ""}</span></button>`; }).join("")}</div>
        <button class="go" id="kidSave">${T().doneBtn}</button>`;
      el.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { const m = ms.find(x => x.id === b.dataset.m), mx = m.kid_max || 1, n = kidSt.counts[m.id] || 0; kidSt.counts[m.id] = n >= mx ? 0 : n + 1; draw(); });
      $("#kidSave").onclick = () => kidStage("save");
    };
    draw();
  }
  if (step === "save") {
    el.innerHTML = `<div class="thanks">⏳</div>`;
    (async () => {
      try {
        const ex = S.checkins.find(c => c.kid === kidSt.kid && c.date === d);
        if (!ex || ex.kid_mood !== kidSt.mood) await upsert("checkins", { kid: kidSt.kid, date: d, kid_mood: kidSt.mood, updated_at: new Date().toISOString() }, "kid,date");
        for (const [mid, n] of Object.entries(kidSt.counts)) {
          const prev = S.readings.find(r => r.metric === mid && r.date === d);
          if (!n) { if (prev) await del("readings", { metric: mid, date: d }); continue; }
          if (prev && +prev.value === n) continue;
          await upsert("readings", { metric: mid, date: d, kid: kidSt.kid, value: n, updated_at: new Date().toISOString() }, "metric,date");
        }
        await loadAll();
        el.innerHTML = `<div class="thanks">🎉</div><h2>${T().thanks(esc(kidName(kidSt.kid)))}</h2>`;
        setTimeout(() => kidStage("who"), 1600);
      } catch (err) { el.innerHTML = `<h2>${T().cantSave}</h2>`; setTimeout(() => kidStage("who"), 2500); }
    })();
  }
}

/* ---------------- PARENT QUICK CHECK-IN ---------------- */
const qSt = {};
function openQuick() { $("#qDate").value = today(); $("#qErr").textContent = ""; Object.keys(qSt).forEach(k => delete qSt[k]); quickRender(); $("#quickMode").classList.add("open"); }
function quickRender() {
  const d = $("#qDate").value;
  $("#quickRows").innerHTML = S.kids.map((k, i) => {
    const ex = S.checkins.find(c => c.kid === k.id && c.date === d) || {};
    const lastPlan = S.checkins.filter(c => c.kid === k.id && c.date < d && c.planned != null).sort((a, b) => b.date.localeCompare(a.date))[0]?.planned;
    const same = ex.focus && ex.focus === ex.behavior && ex.behavior === ex.effort;
    const st = qSt[k.id] = qSt[k.id] && qSt[k.id].date === d ? qSt[k.id] : { date: d, planned: ex.planned ?? lastPlan ?? 2, done: ex.done ?? null, day: same ? ex.focus : null, focus: ex.focus ?? null, behavior: ex.behavior ?? null, effort: ex.effort ?? null, more: !!(ex.focus && !same), note: ex.note || "" };
    const habits = S.metrics.filter(m => m.kid === k.id && m.type === "rate").map(m => { const r = S.readings.find(r => r.metric === m.id && r.date === d); return r && +r.value ? mKidLabel(m) + (+r.value > 1 ? ` ×${r.value}` : "") : null; }).filter(Boolean);
    const said = ex.kid_mood ? `${T().heSaid} ${FACES[ex.kid_mood - 1]}${habits.length ? ` · ${T().did}: ${esc(habits.join(", "))}` : ""}` : `<span style="color:#b07a1c">${T().hasntTapped}</span>`;
    const r5 = (key, val) => `<div class="rate" style="max-width:300px">${[1, 2, 3, 4, 5].map(n => `<button type="button" class="${val === n ? "on" : ""}" data-q="${k.id}" data-key="${key}" data-n="${n}">${n}</button>`).join("")}</div>`;
    return `<div class="qrow"><div class="top"><h3><span class="dot" style="--kc:${KC[i % 3]}"></span>${esc(kidName(k.id))}</h3><div class="kidsaid">${said}</div></div>
      <div class="qgrid"><label>${T().studySessions}</label>
        <div class="stepper"><button type="button" data-q="${k.id}" data-step="-1">−</button><span class="v">${st.done == null ? "?" : st.done} / ${st.planned}</span><button type="button" data-q="${k.id}" data-step="1">+</button><button type="button" class="btn sm ghost" data-q="${k.id}" data-all="1">${T().allDone}</button><button type="button" class="btn sm ghost" data-q="${k.id}" data-plan="1">${T().planPm}</button></div>
        ${st.more ? `<label>${T().focus}</label>${r5("focus", st.focus)}<label>${T().behavior}</label>${r5("behavior", st.behavior)}<label>${T().effort}</label>${r5("effort", st.effort)}` : `<label>${T().dayOverall}</label>${r5("day", st.day)}`}
      </div>
      <button type="button" class="qmore" data-q="${k.id}" data-more="1">${st.more ? T().useOverall : T().rateSeparately}</button>
      <input style="margin-top:10px" placeholder="${T().noteOpt}" maxlength="200" data-q="${k.id}" data-note="1" value="${esc(st.note)}"></div>`;
  }).join("");
}
$("#quickRows").addEventListener("click", e => {
  const b = e.target.closest("button[data-q]"); if (!b) return; const st = qSt[b.dataset.q];
  if (b.dataset.step) st.done = Math.max(0, Math.min(st.planned, (st.done ?? 0) + +b.dataset.step));
  else if (b.dataset.all) st.done = st.planned;
  else if (b.dataset.plan) { st.planned = st.planned >= 4 ? 0 : st.planned + 1; if (st.done != null) st.done = Math.min(st.done, st.planned); }
  else if (b.dataset.more) { st.more = !st.more; if (st.more && st.day) st.focus = st.behavior = st.effort = st.day; }
  else if (b.dataset.key) { const n = +b.dataset.n; st[b.dataset.key] = st[b.dataset.key] === n ? null : n; }
  quickRender();
});
$("#quickRows").addEventListener("input", e => { if (e.target.dataset.note) qSt[e.target.dataset.q].note = e.target.value; });
$("#qDate").addEventListener("change", quickRender);
$("#quickSave").onclick = async () => {
  const d = $("#qDate").value; $("#qErr").textContent = "";
  try {
    for (const k of S.kids) {
      const st = qSt[k.id]; if (!st) continue;
      const rated = st.more ? (st.focus || st.behavior || st.effort) : st.day;
      if (st.done == null && !rated && !st.note) continue;
      const f = st.more ? { focus: st.focus, behavior: st.behavior, effort: st.effort } : { focus: st.day, behavior: st.day, effort: st.day };
      await upsert("checkins", { kid: k.id, date: d, planned: st.planned, done: st.done ?? 0, ...f, note: st.note.trim(), updated_at: new Date().toISOString() }, "kid,date");
    }
    $("#quickMode").classList.remove("open"); await refresh(); setStatus(T().saved); setTimeout(() => setStatus(""), 2500);
  } catch (err) { $("#qErr").textContent = err.message || "Save failed"; }
};
document.querySelectorAll("[data-fsclose]").forEach(b => b.onclick = () => { b.closest(".fs").classList.remove("open"); isKid() ? kidRender() : route(); });

/* ---------------- COACH ENGINE ---------------- */
const ALPHA = 0.3;
function engagementOf(c) { const xs = [c.focus, c.behavior, c.effort].filter(v => typeof v === "number" && v >= 1); return xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length - 1) / 4 : null; }
function engine(kid, asOf) {
  asOf = asOf || today(); const R = T().rec;
  const cks = S.checkins.filter(c => c.kid === kid && c.date <= asOf).sort((a, b) => a.date.localeCompare(b.date));
  const w1from = addDays(asOf, -6), w2from = addDays(asOf, -13), w2to = addDays(asOf, -7);
  const inW = (c, f, t) => c.date >= f && c.date <= t;
  const adh = list => { const p = list.reduce((s, c) => s + (+c.planned || 0), 0), d = list.reduce((s, c) => s + Math.min(+c.done || 0, +c.planned || 0), 0); return p ? d / p : null; };
  const last7 = cks.filter(c => inW(c, w1from, asOf)), prev7 = cks.filter(c => inW(c, w2from, w2to));
  const parent7 = last7.filter(c => c.planned != null || c.focus != null);
  const adh7 = adh(last7), adhPrev = adh(prev7);
  let e = null, ePrev = null; const series = [];
  cks.forEach(c => { const v = engagementOf(c); if (v == null) return; e = e == null ? v : ALPHA * v + (1 - ALPHA) * e; series.push({ date: c.date, v, e }); if (c.date <= w2to) ePrev = e; });
  const engNow = e, engDelta = (e != null && ePrev != null) ? e - ePrev : null;
  const bx = last7.map(c => c.behavior).filter(v => v >= 1); const behAvg7 = bx.length ? bx.reduce((a, b) => a + b, 0) / bx.length : null;
  const moods = last7.map(c => c.kid_mood).filter(v => v >= 1); const kidMood7 = moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null;
  const pairs = last7.filter(c => c.kid_mood >= 1 && c.behavior >= 1); const moodGap = pairs.length >= 3 ? pairs.reduce((s, c) => s + (c.behavior - c.kid_mood), 0) / pairs.length : null;
  const concerns7 = S.entries.filter(x => x.kid === kid && x.tone === "concern" && ["behavior", "social", "homework"].includes(x.cat) && x.date >= w1from && x.date <= asOf).length;
  const goals = S.metrics.filter(m => m.kid === kid).map(m => {
    const rs = S.readings.filter(r => r.metric === m.id && r.date <= asOf).sort((a, b) => a.date.localeCompare(b.date));
    if (m.type === "rate") {
      const c7 = rs.filter(r => r.date >= w1from).reduce((s, r) => s + (+r.value || 0), 0), cPrev = rs.filter(r => r.date >= w2from && r.date <= w2to).reduce((s, r) => s + (+r.value || 0), 0);
      const ratio = m.per_week ? c7 / m.per_week : 0;
      return { m, kind: "rate", c7, cPrev, ratio, progress: clamp01(ratio), status: ratio >= 1 ? "met" : ratio >= 0.67 ? "close" : "behind" };
    }
    const last = rs[rs.length - 1], cur = last ? +last.value : +m.baseline, span = (+m.target) - (+m.baseline);
    const progress = span ? (cur - (+m.baseline)) / span : 1;
    const total = m.start && m.deadline ? Math.max(1, dayDiff(m.start, m.deadline)) : 1;
    const expected = clamp01(m.start ? dayDiff(m.start, asOf) / total : 0), paceV = progress - expected;
    const staleDays = last ? dayDiff(last.date, asOf) : (m.start ? dayDiff(m.start, asOf) : 0);
    const status = progress >= 1 ? "done" : paceV >= 0.1 ? "ahead" : paceV > -0.1 ? "ontrack" : "behind";
    return { m, kind: "level", cur, progress, expected, status, stale: staleDays > 21 && status !== "done", staleDays, daysLeft: m.deadline ? dayDiff(asOf, m.deadline) : null };
  });
  const recs = []; const P = (cls, pair) => recs.push({ cls, h: pair[0], w: pair[1] });
  const logged7 = parent7.length;
  if (logged7 < 4) P("info", R.moreData(logged7));
  const behind = goals.filter(g => g.status === "behind"), ahead = goals.filter(g => g.status === "ahead" || (g.kind === "rate" && g.ratio >= 1.34));
  const easeOff = (adh7 != null && adh7 < 0.6) || (engNow != null && engNow < 0.45) || (engDelta != null && engDelta <= -0.15);
  if (easeOff && logged7 >= 3) { const why = []; if (adh7 != null && adh7 < 0.6) why.push(R.why.adh(pct(adh7))); if (engNow != null && engNow < 0.45) why.push(R.why.low(pct(engNow))); if (engDelta != null && engDelta <= -0.15) why.push(R.why.drop(Math.round(-engDelta * 100))); P("down", R.easeOff(why.join(lang === "zh" ? "；" : ", "))); }
  if (kidMood7 != null && moods.length >= 3 && kidMood7 <= 2.5) P("down", R.hard(kidMood7.toFixed(1), moods.length));
  else if (moodGap != null && moodGap >= 1.5) P("fix", R.gap(moodGap.toFixed(1)));
  if (concerns7 >= 3 || (behAvg7 != null && behAvg7 <= 2.5)) P("down", R.pattern(concerns7, behAvg7 != null ? behAvg7.toFixed(1) : null));
  behind.forEach(g => { if (g.kind === "level" && g.stale) return; const nm = esc(mName(g.m)); const det = g.kind === "level" ? R.progressVs(Math.round(g.progress * 100), Math.round(g.expected * 100)) : R.countVs(g.c7, g.m.per_week);
    if (adh7 != null && adh7 >= 0.75) P("fix", R.method(nm, pct(adh7), det)); else P("fix", R.routine(nm, adh7 == null ? R.noCheckins : R.doneP(pct(adh7)))); });
  const levelUp = adh7 != null && adh7 >= 0.85 && adhPrev != null && adhPrev >= 0.85 && engNow != null && engNow >= 0.7 && !behind.length && !easeOff;
  if (levelUp) P("up", R.levelUp(pct(adh7), pct(adhPrev), pct(engNow)));
  if (ahead.length && behind.length && !easeOff) P("info", R.shift(esc(mName(ahead[0].m)), esc(mName(behind[0].m))));
  goals.filter(g => g.kind === "level" && g.stale).forEach(g => P("info", R.stale(esc(mName(g.m)), g.staleDays)));
  if (!recs.filter(r => r.cls !== "info").length) P("up", R.steady());
  const status = logged7 < 3 ? "n" : (easeOff && logged7 >= 3) ? "r" : (levelUp || (!behind.length && !easeOff && logged7 >= 4)) ? "g" : "a";
  return { adh7, adhPrev, engNow, engDelta, logged7, behAvg7, kidMood7, concerns7, goals, recs, status, series, cks };
}

/* ---------------- DASHBOARD ---------------- */
function stats(kid, days) { const from = daysAgo(days); const es = S.entries.filter(e => e.kid === kid && e.date >= from); const pos = es.filter(e => e.tone === "positive").length, neg = es.filter(e => e.tone === "concern").length; return { es, pos, neg, neu: es.length - pos - neg }; }
function spark(kid) {
  const wk = []; for (let w = 7; w >= 0; w--) { const f = daysAgo(w * 7 + 6), t = daysAgo(w * 7); const es = S.entries.filter(e => e.kid === kid && e.date >= f && e.date <= t); wk.push({ p: es.filter(e => e.tone === "positive").length, c: es.filter(e => e.tone === "concern").length }); }
  const max = Math.max(1, ...wk.map(w => Math.max(w.p, w.c))), W = 280, H = 50, mid = H / 2, bw = W / 8;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="8 weeks"><line x1="0" x2="${W}" y1="${mid}" y2="${mid}" stroke="var(--line)"/>${wk.map((w, i) => { const x = i * bw + bw * .22, b = bw * .56, hp = w.p / max * (mid - 3), hc = w.c / max * (mid - 3); return (w.p ? `<rect x="${x}" y="${mid - hp}" width="${b}" height="${hp}" rx="2" fill="var(--pos)"/>` : "") + (w.c ? `<rect x="${x}" y="${mid + 1}" width="${b}" height="${hc}" rx="2" fill="var(--neg)"/>` : ""); }).join("")}</svg>`;
}
function coachChart(r) {
  const days = 28, end = today(), start = addDays(end, -(days - 1)), W = 560, H = 140, x0 = 30, x1 = W - 8, y0 = 10, yb = H - 22, xi = i => x0 + (i + .5) * (x1 - x0) / days, bw = (x1 - x0) / days * .6;
  const byDate = Object.fromEntries(r.cks.map(c => [c.date, c]));
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="28 days"><line x1="${x0}" x2="${x1}" y1="${yb}" y2="${yb}" stroke="var(--line)"/><line x1="${x0}" x2="${x1}" y1="${y0}" y2="${y0}" stroke="var(--line)" stroke-dasharray="3 4"/><text x="0" y="${y0 + 4}" font-size="10" fill="var(--muted)">100%</text>`;
  for (let i = 0; i < days; i++) { const c = byDate[addDays(start, i)]; if (!c || !(+c.planned)) continue; const h = Math.min(1, (+c.done || 0) / (+c.planned)) * (yb - y0); s += `<rect x="${xi(i) - bw / 2}" y="${yb - h}" width="${bw}" height="${Math.max(h, 1)}" rx="2" fill="var(--neu)" opacity=".35"/>`; }
  const pts = r.series.filter(p => p.date >= start).map(p => [xi(dayDiff(start, p.date)), yb - p.e * (yb - y0)]);
  if (pts.length) s += `<polyline points="${pts.map(p => p.join(",")).join(" ")}" fill="none" stroke="var(--accent)" stroke-width="2.2"/>` + pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="2.5" fill="var(--accent)"/>`).join("");
  return s + `<text x="${x0}" y="${H - 5}" font-size="10" fill="var(--muted)">${fmtDate(start)}</text></svg>`;
}
function viewDash() {
  const t = T();
  const cards = S.kids.map((k, i) => {
    const s = stats(k.id, 30), kg = S.goals.filter(g => g.kid === k.id && g.status !== "proposed").sort((a, b) => (a.done - b.done)), last = S.entries.filter(e => e.kid === k.id).sort((a, b) => b.date.localeCompare(a.date))[0];
    const meta = [k.age ? `${t.age} ${esc(k.age)}` : "", k.grade ? esc(k.grade) : "", k.school ? esc(k.school) : ""].filter(Boolean).join(" · ");
    return `<div class="kid ${selKid === k.id ? "sel" : ""}" style="--kc:${KC[i % 3]}" data-kid="${esc(k.id)}">
      <div class="kid-top"><div><h2>${esc(kidName(k.id))}</h2><div class="meta">${meta}</div>${k.focus ? `<div class="meta"><b style="color:var(--ink)">${t.focusNow}:</b> ${esc(k.focus)}</div>` : ""}</div>
      <div style="display:flex"><button class="btn sm ghost" data-log="${esc(k.id)}">${t.logBtn}</button><button class="btn sm ghost" data-edit="${esc(k.id)}">${t.edit}</button></div></div>
      <div class="stats"><div class="stat pos"><div class="n">${s.pos}</div><div class="l">${t.wins}</div></div><div class="stat neg"><div class="n">${s.neg}</div><div class="l">${t.concerns}</div></div><div class="stat neu"><div class="n">${s.neu}</div><div class="l">${t.notes}</div></div></div>
      ${spark(k.id)}
      ${(() => { const w = daysAgo(6), mm = S.checkins.filter(c => c.kid === k.id && c.date >= w && c.kid_mood).map(c => c.kid_mood), avg = mm.length ? mm.reduce((a, b) => a + b, 0) / mm.length : null;
        const wn = S.entries.filter(e => e.kid === k.id && e.by_kid && e.date >= w).length, jn = S.journal.filter(j => j.kid === k.id && j.date >= w).length, gp = S.goals.filter(g => g.kid === k.id && g.status === "proposed").length;
        const tp = S.readings.filter(r => r.kid === k.id && r.date >= w && S.metrics.find(m => m.id === r.metric)?.type === "rate").reduce((s, r) => s + (+r.value || 0), 0);
        return `<div class="goals"><h4>${t.hisVoice}</h4><div class="cats" style="margin-top:0">
          <span class="chip">${t.hisMood} <b>${avg == null ? "—" : FACES[Math.round(avg) - 1] + " " + avg.toFixed(1)}</b></span>
          <span class="chip">${t.hisWins} <b>${wn}</b></span><span class="chip">${t.hisJournal} <b>${jn}</b></span>
          <span class="chip">${t.hisTaps} <b>${tp}</b></span>${gp ? `<a class="chip" href="#family" style="text-decoration:none;background:var(--pos-bg)">${t.hisIdeas} <b>${gp}</b></a>` : ""}</div></div>`; })()}
      <div class="goals"><h4>${t.goals}</h4>${kg.length ? kg.map(g => `<div class="goal ${g.done ? "done" : ""}"><input type="checkbox" ${g.done ? "checked" : ""} data-goal="${g.id}"><span>${esc(g.text)}</span><button class="x" data-delgoal="${g.id}">✕</button></div>`).join("") : `<div class="meta empty">${t.noGoals}</div>`}
        <div class="addgoal"><input placeholder="${t.addGoal}" maxlength="120" data-goalin="${esc(k.id)}"><button class="btn sm" data-addgoal="${esc(k.id)}">${t.add}</button></div></div>
      <div class="latest"><h4>${t.latest}</h4>${last ? `<span class="tag ${last.tone}">${{ positive: t.toneWin, concern: t.toneConcern, neutral: t.toneNote }[last.tone]}</span>${esc(last.title)} <span class="meta">· ${fmtDate(last.date)}</span>` : `<span class="meta empty">${t.nothingYet}</span>`}</div></div>`;
  }).join("");
  $("#view").innerHTML = `<div class="kids" id="kidsCards">${cards}</div>
    <div class="section"><div class="section-h"><h3>${t.coach}</h3><div class="tabs" id="coachTabs">${S.kids.map(k => `<button class="${k.id === coachKid ? "on" : ""}" data-ck="${esc(k.id)}">${esc(kidName(k.id))}</button>`).join("")}</div></div><div class="coach" id="coach"></div></div>
    <div class="section"><div class="section-h"><h3>${t.sideBySide}</h3></div><div class="compare" id="compare"></div></div>`;
  renderCoach(); renderCompare();
  $("#coachTabs").onclick = e => { const b = e.target.closest("button"); if (b) { coachKid = b.dataset.ck; viewDash(); } };
  $("#kidsCards").onclick = async e => {
    const x = e.target;
    try {
      if (x.dataset.log) return openEntry(x.dataset.log);
      if (x.dataset.edit) return openKid(x.dataset.edit);
      if (x.dataset.goal) { await sb.from("goals").update({ done: x.checked, done_at: x.checked ? today() : null }).eq("id", x.dataset.goal); return refresh(); }
      if (x.dataset.delgoal) { await del("goals", { id: x.dataset.delgoal }); return refresh(); }
      if (x.dataset.addgoal) { const inp = document.querySelector(`[data-goalin="${CSS.escape(x.dataset.addgoal)}"]`); if (inp.value.trim()) { await sb.from("goals").insert({ kid: x.dataset.addgoal, text: inp.value.trim() }); refresh(); } return; }
    } catch (err) { setStatus(err.message, true); }
  };
}
function renderCoach() {
  if (!coachKid) return; const t = T(), r = engine(coachKid);
  const arrow = r.engDelta == null ? "" : r.engDelta > .05 ? " ↑" : r.engDelta < -.05 ? " ↓" : " →";
  const rows = r.goals.length ? r.goals.map(g => {
    const fill = g.status === "behind" ? "var(--neg)" : ["ahead", "done", "met"].includes(g.status) ? "var(--pos)" : "var(--accent)", u = esc(g.m.unit || "");
    const label = g.kind === "rate" ? `${g.c7} / ${g.m.per_week} ${t.thisWeek} <span class="meta">(${t.lastWk} ${g.cPrev})</span>` : `${+g.m.baseline}${u} → <b>${g.cur}${u}</b> → ${+g.m.target}${u} <span class="meta">${g.daysLeft != null ? "· " + t.daysLeft(g.daysLeft) : ""}</span>`;
    const st = g.kind === "level" && g.stale ? `<span class="pace stale">${t.pace.stale}</span>` : `<span class="pace ${g.status}">${t.pace[g.status]}</span>`;
    return `<tr><td><b style="font-weight:500">${subjOf(g.m.subject_id) ? subjOf(g.m.subject_id).icon + " " : ""}${esc(mName(g.m))}</b><div class="meta">${label}</div></td><td style="width:36%"><div class="prog"><i style="width:${Math.round(clamp01(g.progress) * 100)}%;background:${fill}"></i>${g.kind === "level" ? `<b style="left:${Math.round(g.expected * 100)}%"></b>` : ""}</div></td><td style="text-align:right">${st}</td></tr>`;
  }).join("") : `<tr><td class="meta">${t.noGoals}</td></tr>`;
  $("#coach").innerHTML = `<div class="kpis">
    <div class="kpi"><div class="l">${t.status}</div><div class="n" style="font-size:18px;margin-top:4px"><span class="light ${r.status}"></span>${t.statusTxt[r.status]}</div><div class="s">${t.daysChecked(r.logged7)}</div></div>
    <div class="kpi"><div class="l">${t.adherence7}</div><div class="n">${pct(r.adh7)}</div><div class="s">${t.priorWeek} ${pct(r.adhPrev)}</div></div>
    <div class="kpi"><div class="l">${t.engagement}</div><div class="n">${pct(r.engNow)}${arrow}</div><div class="s">${t.engagementSub}</div></div>
    <div class="kpi"><div class="l">${t.concerns7}</div><div class="n" style="color:${r.concerns7 >= 3 ? "var(--neg)" : "inherit"}">${r.concerns7}</div><div class="s">${t.behaviorAvg} ${r.behAvg7 == null ? "—" : r.behAvg7.toFixed(1)} · ${t.hisOwn} ${r.kidMood7 == null ? "—" : FACES[Math.round(r.kidMood7) - 1] + " " + r.kidMood7.toFixed(1)}</div></div></div>
    <div class="coach-grid"><div><h4>${t.goalsPace}</h4><table><tbody>${rows}</tbody></table><div class="meta" style="margin-top:6px">${t.paceNote}</div>
      <h4 style="margin-top:16px">${t.last28}</h4>${coachChart(r)}<div class="meta">${t.chartNote}</div></div>
      <div><h4>${t.whatToAdjust}</h4>${r.recs.map(x => `<div class="rec ${x.cls}"><div class="h">${x.h}</div><div class="w">${x.w}</div></div>`).join("")}
      <details class="howto"><summary>${t.howDecides}</summary><ul>${t.rules.map(x => `<li>${x}</li>`).join("")}</ul></details></div></div>`;
}
function renderCompare() {
  const t = T();
  const rows = S.kids.map((k, i) => {
    const s = stats(k.id, 30), tot = s.pos + s.neg + s.neu, ratio = s.pos + s.neg ? Math.round(100 * s.pos / (s.pos + s.neg)) : null;
    const f = arr => { const p = arr.filter(e => e.tone === "positive").length, c = arr.filter(e => e.tone === "concern").length; return arr.length ? `<span style="color:var(--pos)">${p}</span> / <span style="color:var(--neg)">${c}</span>` : "—"; };
    const last = S.entries.filter(e => e.kid === k.id).map(e => e.date).sort().pop();
    const gd = S.goals.filter(g => g.kid === k.id && g.status !== "proposed" && g.done).length, go = S.goals.filter(g => g.kid === k.id && g.status !== "proposed" && !g.done).length;
    return `<tr><td><span class="who"><span class="dot" style="--kc:${KC[i % 3]}"></span>${esc(kidName(k.id))}</span></td><td>${tot}</td>
      <td><div class="bar"><i style="width:${tot ? 100 * s.pos / tot : 0}%;background:var(--pos)"></i><i style="width:${tot ? 100 * s.neu / tot : 0}%;background:var(--neu);opacity:.35"></i><i style="width:${tot ? 100 * s.neg / tot : 0}%;background:var(--neg)"></i></div></td>
      <td>${ratio == null ? "—" : ratio + "%"}</td><td>${f(s.es.filter(e => ["academic", "homework"].includes(e.cat)))}</td><td>${f(s.es.filter(e => ["behavior", "social"].includes(e.cat)))}</td><td>${t.goalsDoneOpen(gd, go)}</td><td>${last ? fmtDate(last) : "—"}</td></tr>`;
  }).join("");
  $("#compare").innerHTML = `<table><thead><tr><th>${t.thBoy}</th><th>${t.thEntries}</th><th>${t.thMix}</th><th>${t.thWinRate}</th><th>${t.thSchool}</th><th>${t.thBeh}</th><th>${t.thGoals}</th><th>${t.thLast}</th></tr></thead><tbody>${rows}</tbody></table><div class="meta" style="margin-top:10px">${t.winRateNote}</div>`;
}

/* ---------------- LOG ---------------- */
const CAT_KEYS = ["academic", "homework", "behavior", "social", "activity", "habits", "health", "other"];
let logF = { kid: "", cat: "", tone: "", range: "30" };
function viewLog() {
  const t = T(), from = +logF.range ? daysAgo(+logF.range) : "";
  const list = S.entries.filter(e => (!logF.kid || e.kid === logF.kid) && (!logF.cat || e.cat === logF.cat) && (!logF.tone || e.tone === logF.tone) && (!from || e.date >= from)).sort((a, b) => b.date.localeCompare(a.date) || (b.created_at || "").localeCompare(a.created_at || ""));
  $("#view").innerHTML = `<div class="section-h"><h3>${t.logTitle}</h3><div class="filters">
      <select id="fKid"><option value="">${t.allBoys}</option>${S.kids.map(k => `<option value="${esc(k.id)}">${esc(kidName(k.id))}</option>`).join("")}</select>
      <select id="fCat"><option value="">${t.allCats}</option>${CAT_KEYS.map(c => `<option value="${c}">${t.cats[c]}</option>`).join("")}</select>
      <select id="fTone"><option value="">${t.anyTone}</option><option value="positive">${t.toneWin}</option><option value="concern">${t.toneConcern}</option><option value="neutral">${t.toneNote}</option></select>
      <select id="fRange">${["30", "90", "365", "0"].map(r => `<option value="${r}">${t.range[r]}</option>`).join("")}</select>
      <button class="btn sm primary" id="newEntry">${t.logEntry}</button></div></div>
    <div class="feed">${list.length ? list.map(e => `<div class="row"><div class="date">${fmtDate(e.date)}</div><div class="who"><span class="dot" style="--kc:${kidColor(e.kid)}"></span>${esc(kidName(e.kid))}</div>
      <div><div><span class="tag ${e.tone}">${{ positive: t.toneWin, concern: t.toneConcern, neutral: t.toneNote }[e.tone]}</span><span class="tag cat">${t.cats[e.cat] || esc(e.cat)}</span>${subjOf(e.subject_id) ? `<span class="tag cat">${subjOf(e.subject_id).icon} ${esc(sName(subjOf(e.subject_id)))}</span>` : ""}<span class="t">${esc(e.title)}</span>${e.score ? ` <b>· ${esc(e.score)}</b>` : ""}${e.by_kid ? ` <span class="tag cat">${t.byHim}</span>` : ""}</div>${e.note ? `<div class="n">${esc(e.note)}</div>` : ""}${e.logged_by ? `<div class="meta">— ${esc(e.logged_by)}</div>` : ""}</div>
      <div class="acts"><button class="btn sm ghost" data-ee="${e.id}">${t.edit}</button><button class="btn sm ghost" data-de="${e.id}">${t.delete}</button></div></div>`).join("") : `<div class="emptystate">${S.entries.length ? t.noMatch : t.emptyLog}</div>`}</div>`;
  ["Kid", "Cat", "Tone", "Range"].forEach(k => { const el = $("#f" + k); el.value = logF[k.toLowerCase()]; el.onchange = () => { logF[k.toLowerCase()] = el.value; viewLog(); }; });
  $("#newEntry").onclick = () => openEntry(logF.kid || null);
  $(".feed").onclick = async e => {
    const x = e.target;
    if (x.dataset.ee) openEntry(null, S.entries.find(y => y.id === x.dataset.ee));
    if (x.dataset.de) { if (x.dataset.armed) { try { await del("entries", { id: x.dataset.de }); refresh(); } catch (err) { setStatus(err.message, true); } } else { x.dataset.armed = 1; x.textContent = t.confirm; x.style.color = "var(--neg)"; } }
  };
}

/* ---------------- entry + kid modals ---------------- */
let editingEntry = null, form = { kid: "", tone: "positive" }, editingKid = null;
function setSeg(c, v) { c.querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.v === v)); }
function openEntry(kid, entry) {
  editingEntry = entry || null; const t = T();
  $("#entryTitle").textContent = entry ? t.edit : t.logEntry.replace("+ ", "");
  $("#eKid").innerHTML = S.kids.map(k => `<button type="button" data-v="${esc(k.id)}">${esc(kidName(k.id))}</button>`).join("");
  $("#eCat").innerHTML = CAT_KEYS.map(c => `<option value="${c}">${t.cats[c]}</option>`).join("");
  form.kid = entry?.kid || kid || S.kids[0]?.id; form.tone = entry?.tone || "positive"; form.subj = entry?.subject_id || entrySubj || "";
  fillSubjSel();
  setSeg($("#eKid"), form.kid); setSeg($("#eTone"), form.tone);
  $("#eDate").value = entry?.date || today(); $("#eCat").value = entry?.cat || "academic";
  $("#eT").value = entry?.title || ""; $("#eScore").value = entry?.score || ""; $("#eBy").value = entry?.logged_by || ""; $("#eN").value = entry?.note || ""; $("#eErr").textContent = "";
  $("#entryModal").classList.add("open");
}
let entrySubj = "";
function fillSubjSel() { $("#eSubj").innerHTML = `<option value="">${T().none}</option>` + S.subjects.filter(x => x.kid === form.kid && x.active).map(x => `<option value="${x.id}">${x.icon} ${esc(sName(x))}</option>`).join(""); $("#eSubj").value = S.subjects.some(x => x.id === form.subj && x.kid === form.kid) ? form.subj : ""; }
$("#eKid").onclick = e => { const b = e.target.closest("button"); if (b) { form.kid = b.dataset.v; setSeg($("#eKid"), form.kid); fillSubjSel(); } };
$("#eTone").onclick = e => { const b = e.target.closest("button"); if (b) { form.tone = b.dataset.v; setSeg($("#eTone"), form.tone); } };
$("#entryForm").onsubmit = async ev => {
  ev.preventDefault();
  const row = { kid: form.kid, tone: form.tone, date: $("#eDate").value, cat: $("#eCat").value, title: $("#eT").value.trim(), score: $("#eScore").value.trim() || null, logged_by: $("#eBy").value.trim() || null, note: $("#eN").value.trim() || null, subject_id: $("#eSubj").value || null, updated_at: new Date().toISOString() };
  try { if (editingEntry) { const { error } = await sb.from("entries").update(row).eq("id", editingEntry.id); if (error) throw error; } else { const { error } = await sb.from("entries").insert(row); if (error) throw error; } $("#entryModal").classList.remove("open"); refresh(); }
  catch (err) { $("#eErr").textContent = err.message; }
};
function openKid(id) {
  const k = S.kids.find(k => k.id === id); editingKid = id;
  $("#kName").value = k.name || ""; $("#kNameZh").value = k.name_zh || ""; $("#kAge").value = k.age || ""; $("#kGrade").value = k.grade || ""; $("#kSchool").value = k.school || ""; $("#kAct").value = k.activities || ""; $("#kFocus").value = k.focus || ""; $("#kErr").textContent = "";
  $("#kidModal").classList.add("open");
}
$("#kidForm").onsubmit = async ev => {
  ev.preventDefault();
  const { error } = await sb.from("kids").update({ name: $("#kName").value.trim(), name_zh: $("#kNameZh").value.trim() || null, age: $("#kAge").value.trim(), grade: $("#kGrade").value.trim(), school: $("#kSchool").value.trim(), activities: $("#kAct").value.trim(), focus: $("#kFocus").value.trim(), updated_at: new Date().toISOString() }).eq("id", editingKid);
  if (error) { $("#kErr").textContent = error.message; return; } $("#kidModal").classList.remove("open"); refresh();
};
document.querySelectorAll("[data-close]").forEach(b => b.onclick = () => b.closest(".modal-bg").classList.remove("open"));
document.querySelectorAll(".modal-bg").forEach(m => m.addEventListener("click", e => { if (e.target === m) m.classList.remove("open"); }));
document.addEventListener("keydown", e => { if (e.key === "Escape") document.querySelectorAll(".modal-bg.open").forEach(m => m.classList.remove("open")); });

/* ---------------- PLANS + REPORTS ---------------- */
function viewDocs(section) {
  const t = T(), list = S.docs.filter(d => section === "report" ? d.section === "report" : d.section !== "report").sort((a, b) => section === "report" ? b.slug.localeCompare(a.slug) : (a.title || "").localeCompare(b.title || ""));
  $("#view").innerHTML = `<div class="section-h"><h3>${section === "report" ? t.reportsTitle : t.plansTitle}</h3></div>
    <div class="feed doclist">${list.length ? list.map(d => `<a href="#doc-${encodeURIComponent(d.slug)}"><b>${esc(lang === "zh" && d.title_zh ? d.title_zh : d.title)}</b>${d.kid ? ` <span class="dot" style="--kc:${kidColor(d.kid)};display:inline-block"></span> <span class="meta">${esc(kidName(d.kid))}</span>` : ""}<div class="meta">${t.updated} ${fmtDate(d.updated_at.slice(0, 10))}</div></a>`).join("") : `<div class="emptystate">${t.noDocs}</div>`}</div>`;
}
function viewDoc(slug) {
  const t = T(), d = S.docs.find(x => x.slug === decodeURIComponent(slug || ""));
  if (!d) { $("#view").innerHTML = `<div class="emptystate">${t.noDocs}</div>`; return; }
  const zh = lang === "zh" && d.body_md_zh, body = zh ? d.body_md_zh : d.body_md;
  const html = window.marked && window.DOMPurify ? DOMPurify.sanitize(marked.parse(body || "")) : `<pre>${esc(body)}</pre>`;
  const tog = d.kid ? `<label style="display:inline-flex;gap:6px;align-items:center;margin-left:14px;font-size:13px"><input type="checkbox" id="kvis" style="width:auto" ${d.kid_visible ? "checked" : ""}> ${t.showOnHisPage} (${esc(kidName(d.kid))})</label>` : "";
  $("#view").innerHTML = `<p><a href="#${d.section === "report" ? "reports" : "plans"}" style="color:var(--accent)">${t.back}</a>${tog}</p>${lang === "zh" && !d.body_md_zh ? `<div class="meta" style="margin-bottom:8px">${t.onlyEnglish}</div>` : ""}<div class="md">${html}</div>`;
  if ($("#kvis")) $("#kvis").onchange = async e => { const { error } = await sb.from("docs").update({ kid_visible: e.target.checked }).eq("slug", d.slug); if (error) setStatus(error.message, true); else { d.kid_visible = e.target.checked; setStatus(T().saved); setTimeout(() => setStatus(""), 1500); } };
}

/* ---------------- FAMILY (parents): kid logins, goal proposals, journals ---------------- */
async function viewFamily() {
  const t = T();
  const { data: users } = await sb.from("allowed_users").select("email,role,display_name,kid_id");
  const kidUsers = (users || []).filter(u => u.role === "kid");
  const props = S.goals.filter(g => g.status === "proposed");
  const jByKid = id => S.journal.filter(j => j.kid === id).sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));
  $("#view").innerHTML = `<div class="section-h"><h3>${t.familyTitle}</h3></div>
    <div class="coach"><h4>${t.kidLogins}</h4><p class="meta">${t.pinHelp}</p>
      ${S.kids.map((k, i) => { const u = kidUsers.find(x => x.kid_id === k.id); return u ? `<div class="qgrid" style="grid-template-columns:150px 1fr;margin-top:10px">
        <div><span class="dot" style="--kc:${KC[i % 3]};display:inline-block"></span> <b>${esc(kidName(k.id))}</b><div class="meta">${t.username}: <code>${esc(u.email.split("@")[0])}</code></div></div>
        <div style="display:flex;gap:8px;max-width:360px"><input type="password" inputmode="numeric" minlength="6" placeholder="${t.pin}" data-pinfor="${esc(k.id)}"><button class="btn sm primary" style="white-space:nowrap" data-setpin="${esc(k.id)}">${t.setPin}</button></div></div>` : ""; }).join("")}
      <div class="err" id="pinMsg" style="margin-top:8px"></div></div>
    <div class="coach" style="margin-top:16px"><h4>${t.proposals}</h4>
      ${props.length ? props.map(g => `<div class="goal"><span class="dot" style="--kc:${kidColor(g.kid)};margin-top:6px"></span><span><b>${esc(kidName(g.kid))}:</b> ${esc(g.text)}</span><span style="margin-left:auto;display:flex;gap:6px"><button class="btn sm primary" data-approve="${g.id}">${t.approve}</button><button class="btn sm" data-decline="${g.id}">${t.decline}</button></span></div>`).join("") : `<div class="meta">${t.noProposals}</div>`}</div>
    <div class="coach" style="margin-top:16px"><h4>${t.journals}</h4><p class="meta">${t.journalsHelp}</p>
      ${S.kids.map(k => { const js = jByKid(k.id); return `<details style="margin-top:8px"><summary><b>${esc(kidName(k.id))}</b> <span class="meta">(${js.length})</span></summary>${js.length ? js.map(j => `<div class="rec info"><div class="meta">${fmtDate(j.date)}</div><div class="n" style="white-space:pre-wrap">${esc(j.body)}</div></div>`).join("") : `<div class="meta">—</div>`}</details>`; }).join("")}</div>`;
  $("#view").onclick = async e => {
    const x = e.target;
    try {
      if (x.dataset.setpin) {
        const inp = document.querySelector(`[data-pinfor="${CSS.escape(x.dataset.setpin)}"]`);
        const { error } = await sb.rpc("set_kid_pin", { p_kid: x.dataset.setpin, p_pin: inp.value });
        $("#pinMsg").style.color = error ? "var(--neg)" : "var(--pos)"; $("#pinMsg").textContent = error ? error.message : `${kidName(x.dataset.setpin)}: ${t.pinSet}`; if (!error) inp.value = "";
      }
      if (x.dataset.approve) { const { error } = await sb.from("goals").update({ status: "active" }).eq("id", x.dataset.approve); if (error) throw error; await refresh(); }
      if (x.dataset.decline) { await del("goals", { id: x.dataset.decline }); await refresh(); }
    } catch (err) { setStatus(err.message, true); }
  };
}

/* ---------------- SUBJECTS (parents): per-boy focus areas with goals, results, notes, plans ---------------- */
let subjKid = null, editingSubj = null;
function goalProgress(m) {
  const w1 = daysAgo(6), rs = S.readings.filter(r => r.metric === m.id).sort((a, b) => a.date.localeCompare(b.date));
  if (m.type === "rate") { const c = rs.filter(r => r.date >= w1).reduce((s, r) => s + (+r.value || 0), 0); return { c, p: m.per_week ? clamp01(c / m.per_week) : 0 }; }
  const cur = rs.length ? +rs[rs.length - 1].value : +m.baseline, span = (+m.target) - (+m.baseline);
  return { cur, last: rs[rs.length - 1]?.date, p: span ? clamp01((cur - (+m.baseline)) / span) : 1 };
}
function viewSubjects() {
  const t = T(); if (!subjKid || !S.kids.some(k => k.id === subjKid)) subjKid = S.kids[0]?.id;
  const subs = S.subjects.filter(x => x.kid === subjKid && x.active);
  const loose = S.metrics.filter(m => m.kid === subjKid && !S.subjects.some(x => x.id === m.subject_id && x.active));
  const goalRow = m => { const g = goalProgress(m), u = esc(m.unit || "");
    return `<div style="margin:10px 0"><div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline"><b style="font-weight:500">${esc(mName(m))}</b>
      <span class="meta">${m.type === "rate" ? t.ofTarget(g.c, m.per_week) : `${+m.baseline}${u} → <b style="color:var(--ink)">${g.cur}${u}</b> → ${+m.target}${u}${m.deadline ? " · " + fmtDate(m.deadline) : ""}`} <button class="x" style="opacity:.5" data-delm="${esc(m.id)}" title="${t.removeGoal}">✕</button></span></div>
      <div class="prog" style="margin-top:5px"><i style="width:${Math.round(g.p * 100)}%;background:${g.p >= 1 ? "var(--pos)" : "var(--accent)"}"></i></div>
      ${m.type === "level" ? `<div class="addgoal" style="margin-top:6px;max-width:320px"><input type="number" step="any" placeholder="${t.recordResult}${u ? " (" + u + ")" : ""}" data-resin="${esc(m.id)}"><button class="btn sm" data-res="${esc(m.id)}">${t.record}</button></div>` : ""}</div>`; };
  const goalForm = sid => `<details style="margin-top:8px"><summary class="qmore" style="list-style:none;cursor:pointer">${t.addGoal2}</summary>
      <form class="gform" data-sid="${sid}" style="margin-top:8px">
        <div class="grid2"><div class="field"><label>${t.goalName}</label><input name="name" required maxlength="60"></div><div class="field"><label>${t.goalNameZh}</label><input name="name_zh" maxlength="30"></div></div>
        <div class="field"><label>${t.goalType}</label><select name="type"><option value="rate">${t.typeRate}</option><option value="level">${t.typeLevel}</option></select></div>
        <div class="grid2 g-rate"><div class="field"><label>${t.perWeek}</label><input name="per_week" type="number" min="1" max="21" value="3"></div><div class="field"><label>${t.kidMax}</label><input name="kid_max" type="number" min="1" max="5" value="1"></div></div>
        <div class="field g-rate"><label>${t.kidLabel}</label><input name="kid_label" maxlength="40" placeholder="🏆 AMC practice"></div>
        <div class="grid2 g-level" style="display:none"><div class="field"><label>${t.startVal}</label><input name="baseline" type="number" step="any"></div><div class="field"><label>${t.targetVal}</label><input name="target" type="number" step="any"></div>
          <div class="field"><label>${t.deadlineL}</label><input name="deadline" type="date"></div><div class="field"><label>${t.unitL}</label><input name="unit" maxlength="8"></div></div>
        <button class="btn sm primary">${t.save}</button></form></details>`;
  const card = x => { const ms = S.metrics.filter(m => m.subject_id === x.id), notes = S.entries.filter(e => e.subject_id === x.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5), docs = S.docs.filter(d => d.subject_id === x.id);
    return `<div class="kid" style="--kc:${kidColor(x.kid)};cursor:default"><div class="kid-top"><div><h2>${x.icon} ${esc(sName(x))}</h2>${sDesc(x) ? `<div class="meta">${esc(sDesc(x))}</div>` : ""}</div><button class="btn sm ghost" data-esubj="${x.id}">${t.edit}</button></div>
      <div class="goals"><h4>${t.goals}</h4>${ms.length ? ms.map(goalRow).join("") : `<div class="meta">${t.noGoals}</div>`}${goalForm(x.id)}</div>
      <div class="latest"><h4>${t.notes}</h4>${notes.map(e => `<div class="meta" style="color:var(--ink)"><span class="tag ${e.tone}">${{ positive: t.toneWin, concern: t.toneConcern, neutral: t.toneNote }[e.tone]}</span>${esc(e.title)} <span class="meta">· ${fmtDate(e.date)}</span></div>`).join("")}
        <form class="nform addgoal" data-sid="${x.id}" style="margin-top:6px"><select name="tone" style="width:auto"><option value="positive">${t.toneWin}</option><option value="neutral">${t.toneNote}</option><option value="concern">${t.toneConcern}</option></select><input name="title" maxlength="140" placeholder="${t.noteIn}" required><button class="btn sm">${t.addNote}</button></form></div>
      ${docs.length ? `<div class="latest"><h4>${t.plansIn}</h4>${docs.map(d => `<div><a href="#doc-${encodeURIComponent(d.slug)}" style="color:var(--accent)">${esc(lang === "zh" && d.title_zh ? d.title_zh : d.title)}</a>${d.kid_visible ? ` <span class="meta">· ${t.shownOnHisPage}</span>` : ""}</div>`).join("")}</div>` : ""}</div>`; };
  $("#view").innerHTML = `<div class="section-h"><h3>${t.subjectsTitle}</h3><div style="display:flex;gap:8px;align-items:center"><div class="tabs" id="subjTabs">${S.kids.map(k => `<button class="${k.id === subjKid ? "on" : ""}" data-sk="${esc(k.id)}">${esc(kidName(k.id))}</button>`).join("")}</div><button class="btn sm primary" id="addSubj">${t.addSubject}</button></div></div>
    <div class="kids" style="grid-template-columns:repeat(auto-fill,minmax(330px,1fr))">${subs.length ? subs.map(card).join("") : `<div class="emptystate">${t.noSubjects}</div>`}
      ${loose.length ? `<div class="kid" style="--kc:var(--neu);cursor:default"><h2>${t.other}</h2><div class="goals" style="border:0;padding-top:4px">${loose.map(goalRow).join("")}</div></div>` : ""}</div>`;
  $("#subjTabs").onclick = e => { const b = e.target.closest("button"); if (b) { subjKid = b.dataset.sk; viewSubjects(); } };
  $("#addSubj").onclick = () => openSubj(null);
  $("#view").querySelectorAll(".gform select[name=type]").forEach(sel => sel.onchange = () => { const f = sel.form; f.querySelectorAll(".g-rate").forEach(x => x.style.display = sel.value === "rate" ? "" : "none"); f.querySelectorAll(".g-level").forEach(x => x.style.display = sel.value === "level" ? "" : "none"); });
  $("#view").querySelectorAll(".gform").forEach(f => f.onsubmit = async ev => {
    ev.preventDefault(); const v = Object.fromEntries(new FormData(f)), type = v.type;
    const id = `${subjKid}-${(v.name || "goal").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24)}-${Math.random().toString(36).slice(2, 6)}`;
    const row = { id, kid: subjKid, subject_id: f.dataset.sid, type, name: v.name.trim(), name_zh: v.name_zh?.trim() || null, sort: 100 + S.metrics.length };
    if (type === "rate") Object.assign(row, { per_week: +v.per_week || 1, kid_max: +v.kid_max || 1, kid_label: v.kid_label?.trim() || "✅ " + v.name.trim(), unit: null });
    else { if (v.baseline === "" || v.target === "") return setStatus(t.startVal + " / " + t.targetVal + "?", true); Object.assign(row, { baseline: +v.baseline, target: +v.target, start: today(), deadline: v.deadline || null, unit: v.unit || null }); }
    const { error } = await sb.from("metrics").insert(row); if (error) return setStatus(error.message, true); await refresh();
  });
  $("#view").querySelectorAll(".nform").forEach(f => f.onsubmit = async ev => {
    ev.preventDefault(); const v = Object.fromEntries(new FormData(f));
    const { error } = await sb.from("entries").insert({ kid: subjKid, subject_id: f.dataset.sid, date: today(), cat: "activity", tone: v.tone, title: v.title.trim() }); if (error) return setStatus(error.message, true); await refresh();
  });
  $("#view").onclick = async e => {
    const x = e.target.closest("[data-esubj],[data-res],[data-delm]"); if (!x) return;
    try {
      if (x.dataset.esubj) return openSubj(S.subjects.find(y => y.id === x.dataset.esubj));
      if (x.dataset.res) { const inp = document.querySelector(`[data-resin="${CSS.escape(x.dataset.res)}"]`); if (inp.value === "") return; await upsert("readings", { metric: x.dataset.res, date: today(), kid: subjKid, value: +inp.value, updated_at: new Date().toISOString() }, "metric,date"); await refresh(); }
      if (x.dataset.delm) { if (x.dataset.armed) { await del("metrics", { id: x.dataset.delm }); await refresh(); } else { x.dataset.armed = 1; x.textContent = T().sure; x.style.opacity = 1; x.style.color = "var(--neg)"; } }
    } catch (err) { setStatus(err.message, true); }
  };
}
function openSubj(x) {
  editingSubj = x; const t = T();
  $("#subjTitle").textContent = x ? t.editSubject : t.newSubject;
  $("#sName").value = x?.name || ""; $("#sNameZh").value = x?.name_zh || ""; $("#sIcon").value = x?.icon || "⭐"; $("#sDesc").value = x?.description || ""; $("#sDescZh").value = x?.description_zh || ""; $("#sErr").textContent = "";
  $("#sArchive").style.display = x ? "" : "none"; $("#subjModal").classList.add("open");
}
$("#subjForm").onsubmit = async ev => {
  ev.preventDefault();
  const row = { name: $("#sName").value.trim(), name_zh: $("#sNameZh").value.trim() || null, icon: $("#sIcon").value.trim() || "⭐", description: $("#sDesc").value.trim() || null, description_zh: $("#sDescZh").value.trim() || null };
  const { error } = editingSubj ? await sb.from("subjects").update(row).eq("id", editingSubj.id) : await sb.from("subjects").insert({ ...row, kid: subjKid, sort: S.subjects.filter(x => x.kid === subjKid).length + 1 });
  if (error) { $("#sErr").textContent = error.message; return; } $("#subjModal").classList.remove("open"); await refresh();
};
$("#sArchive").onclick = async () => { if (!editingSubj) return; const { error } = await sb.from("subjects").update({ active: false }).eq("id", editingSubj.id); if (error) { $("#sErr").textContent = error.message; return; } $("#subjModal").classList.remove("open"); await refresh(); };

/* ---------------- KID APP: his own page ---------------- */
let kidTap = null;
async function kidBoot() {
  $("#root").innerHTML = `<div class="wrap"><div class="status" id="status">${T().loading}</div></div>`;
  try { await loadAll(); kidRender(); } catch (e) { setStatus(e.message || "Load failed", true); }
}
function kidRender() {
  const t = T(), k = S.kids[0]; if (!k) return;
  const d = today(), myMood = S.moods.find(m => m.date === d)?.kid_mood || null;
  const rates = S.metrics.filter(m => m.type === "rate"), levels = S.metrics.filter(m => m.type === "level");
  const w1 = addDays(d, -6);
  const cnt = m => S.readings.filter(r => r.metric === m.id && r.date >= w1).reduce((s, r) => s + (+r.value || 0), 0);
  const curLevel = m => { const rs = S.readings.filter(r => r.metric === m.id).sort((a, b) => a.date.localeCompare(b.date)); return rs.length ? +rs[rs.length - 1].value : +m.baseline; };
  const goals = S.goals.filter(g => g.status !== "proposed"), mine = S.goals.filter(g => g.status === "proposed");
  const wins = S.entries.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
  const journal = S.journal.slice().sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));
  const days = []; for (let i = 13; i >= 0; i--) { const dd = addDays(d, -i); days.push({ dd, m: S.moods.find(x => x.date === dd)?.kid_mood }); }
  const color = KC[0];
  $("#root").innerHTML = `<div class="topbar"><div class="in"><div class="brand">🌱 ${t.hi(esc(kidName(k.id)))}</div>
      <button class="lang" id="langBtn">${lang === "en" ? "中文" : "English"}</button><button class="btn sm ghost" id="soBtn">${t.signOut}</button></div></div>
    <div class="wrap" style="max-width:860px"><div class="status" id="status"></div>
      <button class="herobtn" style="background:${color};width:100%;margin-bottom:18px" id="kTap">${myMood ? FACES[myMood - 1] + " " + t.tapInDone : "👋 " + t.myTapIn}</button>
      <div class="section-h"><h3>${t.myGoals}</h3></div>
      ${(() => { const groups = S.subjects.filter(x => x.active).map(x => ({ x, ms: S.metrics.filter(m => m.subject_id === x.id), docs: S.docs.filter(d => d.subject_id === x.id) })).filter(g => g.ms.length || g.docs.length);
        const rowL = m => { const cur = curLevel(m), span = (+m.target) - (+m.baseline), p = span ? clamp01((cur - (+m.baseline)) / span) : 1, u = esc(m.unit || ""); return `<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between"><b style="font-weight:500">${esc(mName(m))}</b><span class="meta">${t.nowAt} <b style="color:var(--ink)">${cur}${u}</b> → ${+m.target}${u}</span></div><div class="prog" style="margin-top:6px"><i style="width:${Math.round(p * 100)}%;background:var(--accent)"></i></div></div>`; };
        const rowR = m => { const c = cnt(m), p = m.per_week ? clamp01(c / m.per_week) : 0; return `<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between"><b style="font-weight:500">${esc(mKidLabel(m))}</b><span class="meta">${t.ofTarget(c, m.per_week)}${p >= 1 ? " 🎉" : ""}</span></div><div class="prog" style="margin-top:6px"><i style="width:${Math.round(p * 100)}%;background:${p >= 1 ? "var(--pos)" : "var(--accent)"}"></i></div></div>`; };
        return groups.map(g => `<div class="coach" style="margin-bottom:12px"><h3 style="font-family:Fraunces,Georgia,serif;font-weight:600;margin:0 0 4px">${g.x.icon} ${esc(sName(g.x))}</h3>${sDesc(g.x) ? `<div class="meta" style="margin-bottom:10px">${esc(sDesc(g.x))}</div>` : ""}
          ${g.ms.map(m => m.type === "rate" ? rowR(m) : rowL(m)).join("")}${g.docs.map(dc => `<a href="#" data-kdoc="${esc(dc.slug)}" style="display:inline-block;margin-top:4px;color:var(--accent)">📄 ${esc(lang === "zh" && dc.title_zh ? dc.title_zh : dc.title)}</a>`).join(" · ")}</div>`).join(""); })()}
      <div class="coach">
        ${levels.filter(m => !S.subjects.some(x => x.active && x.id === m.subject_id)).map(m => { const cur = curLevel(m), span = (+m.target) - (+m.baseline), p = span ? clamp01((cur - (+m.baseline)) / span) : 1, u = esc(m.unit || ""); return `<div style="margin-bottom:14px"><div style="display:flex;justify-content:space-between"><b style="font-weight:500">${esc(mName(m))}</b><span class="meta">${t.nowAt} <b style="color:var(--ink)">${cur}${u}</b> → ${+m.target}${u}</span></div><div class="prog" style="margin-top:6px"><i style="width:${Math.round(p * 100)}%;background:var(--accent)"></i></div></div>`; }).join("")}
        ${rates.filter(m => !S.subjects.some(x => x.active && x.id === m.subject_id)).map(m => { const c = cnt(m), p = m.per_week ? clamp01(c / m.per_week) : 0; return `<div style="margin-bottom:14px"><div style="display:flex;justify-content:space-between"><b style="font-weight:500">${esc(mKidLabel(m))}</b><span class="meta">${t.ofTarget(c, m.per_week)}${p >= 1 ? " 🎉" : ""}</span></div><div class="prog" style="margin-top:6px"><i style="width:${Math.round(p * 100)}%;background:${p >= 1 ? "var(--pos)" : "var(--accent)"}"></i></div></div>`; }).join("")}
        ${goals.length ? `<div style="margin-top:6px">${goals.map(g => `<div class="goal ${g.done ? "done" : ""}"><span>${g.done ? "✅" : "⬜"}</span><span>${esc(g.text)}</span></div>`).join("")}</div>` : ""}
        ${mine.map(g => `<div class="goal"><span>💡</span><span>${esc(g.text)} <span class="meta">· ${t.pending}</span></span><button class="x" style="opacity:1" data-unprop="${g.id}">✕</button></div>`).join("")}
        <div class="addgoal" style="margin-top:10px"><input id="propIn" maxlength="120" placeholder="${t.suggestPh}"><button class="btn sm" id="propBtn">${t.suggest}</button></div>
      </div>
      <div class="section-h" style="margin-top:22px"><h3>${t.myWeek}</h3></div>
      <div class="coach" style="display:flex;gap:4px;justify-content:space-between;flex-wrap:wrap">${days.map(x => `<div style="text-align:center;min-width:40px"><div style="font-size:24px;opacity:${x.m ? 1 : .25}">${x.m ? FACES[x.m - 1] : "·"}</div><div class="meta" style="font-size:11px">${fmtDate(x.dd)}</div></div>`).join("")}</div>
      <div class="section-h" style="margin-top:22px"><h3>${t.myWins}</h3></div>
      <div class="coach">
        <form id="winForm" class="addgoal"><input id="winIn" maxlength="140" placeholder="${t.winPh}" required><button class="btn sm primary">${t.addWin}</button></form>
        <div style="margin-top:10px">${wins.length ? wins.map(w => `<div class="goal"><span>⭐</span><span>${esc(w.title)}${w.score ? ` <b>· ${esc(w.score)}</b>` : ""} <span class="meta">· ${fmtDate(w.date)}</span></span>${w.by_kid ? `<button class="x" style="opacity:.6" data-delwin="${w.id}">✕</button>` : ""}</div>`).join("") : `<div class="meta">${t.noWinsYet}</div>`}</div>
      </div>
      <div class="section-h" style="margin-top:22px"><h3>${t.myJournal}</h3></div>
      <div class="coach"><p class="meta" style="margin-top:0">🔒 ${t.journalPrivate}</p>
        <form id="jForm"><textarea id="jIn" maxlength="4000" placeholder="${t.journalPh}" required></textarea><button class="btn sm primary" style="margin-top:8px">${t.saveEntry}</button></form>
        <div style="margin-top:12px">${journal.length ? journal.map(j => `<div class="rec info"><div class="meta" style="display:flex;justify-content:space-between">${fmtDate(j.date)}<button class="x" style="opacity:.6;border:0;background:none;cursor:pointer;color:var(--muted)" data-delj="${j.id}">✕</button></div><div style="white-space:pre-wrap">${esc(j.body)}</div></div>`).join("") : `<div class="meta">${t.noJournal}</div>`}</div>
      </div>
      ${S.docs.filter(dc => !S.subjects.some(x => x.active && x.id === dc.subject_id)).length ? `<div class="section-h" style="margin-top:22px"><h3>${t.myPlans}</h3></div><div class="feed doclist">${S.docs.filter(dc => !S.subjects.some(x => x.active && x.id === dc.subject_id)).map(dc => `<a href="#" data-kdoc="${esc(dc.slug)}"><b>${esc(lang === "zh" && dc.title_zh ? dc.title_zh : dc.title)}</b></a>`).join("")}</div>` : ""}<div id="kDocView" style="margin-top:12px"></div>
    </div>`;
  $("#langBtn").onclick = toggleLang; $("#soBtn").onclick = () => sb.auth.signOut();
  const R = async fn => { try { await fn(); await loadAll(); kidRender(); } catch (err) { setStatus(err.message || "Save failed", true); } };
  $("#kTap").onclick = () => kidTapIn();
  $("#propBtn").onclick = () => { const v = $("#propIn").value.trim(); if (v) R(async () => { const { error } = await sb.from("goals").insert({ kid: k.id, text: v, status: "proposed", proposed_by_kid: true }); if (error) throw error; }); };
  $("#winForm").onsubmit = e => { e.preventDefault(); const v = $("#winIn").value.trim(); if (v) R(async () => { const { error } = await sb.from("entries").insert({ kid: k.id, date: today(), cat: "other", tone: "positive", title: v, by_kid: true }); if (error) throw error; }); };
  $("#jForm").onsubmit = e => { e.preventDefault(); const v = $("#jIn").value.trim(); if (v) R(async () => { const { error } = await sb.from("journal").insert({ kid: k.id, date: today(), body: v }); if (error) throw error; }); };
  $("#root").onclick = e => {
    const x = e.target.closest("[data-unprop],[data-delwin],[data-delj],[data-kdoc]"); if (!x) return;
    if (x.dataset.unprop) R(() => del("goals", { id: x.dataset.unprop }));
    if (x.dataset.delwin) R(() => del("entries", { id: x.dataset.delwin }));
    if (x.dataset.delj) { if (x.dataset.armed) R(() => del("journal", { id: x.dataset.delj })); else { x.dataset.armed = 1; x.textContent = T().confirm; } }
    if (x.dataset.kdoc) { e.preventDefault(); const dc = S.docs.find(y => y.slug === x.dataset.kdoc); const body = lang === "zh" && dc.body_md_zh ? dc.body_md_zh : dc.body_md; $("#kDocView").innerHTML = `<div class="md">${window.marked && window.DOMPurify ? DOMPurify.sanitize(marked.parse(body || "")) : esc(body)}</div>`; $("#kDocView").scrollIntoView({ behavior: "smooth" }); }
  };
}
function kidTapIn() {
  const t = T(), k = S.kids[0], d = today(), ms = S.metrics.filter(m => m.type === "rate");
  kidTap = { mood: S.moods.find(m => m.date === d)?.kid_mood || null, counts: {} };
  ms.forEach(m => { const r = S.readings.find(r => r.metric === m.id && r.date === d); kidTap.counts[m.id] = r ? +r.value : 0; });
  $("#kidMode").classList.add("open");
  const el = $("#kidStage");
  const face = () => { el.innerHTML = `<h2>${t.howWasToday(esc(kidName(k.id)))}</h2><div class="bigfaces">${FACES.map((f, i) => `<button data-n="${i + 1}" class="${kidTap.mood === i + 1 ? "on" : ""}" aria-label="${t.faces[i]}">${f}</button>`).join("")}</div>`;
    el.querySelectorAll("[data-n]").forEach(b => b.onclick = () => { kidTap.mood = +b.dataset.n; b.classList.add("on"); setTimeout(ms.length ? did : save, 180); }); };
  const did = () => { el.innerHTML = `<h2>${t.whatDidYouDo}</h2><div class="meta" style="text-align:center;margin-top:-10px;margin-bottom:12px">${t.tapAll}</div><div class="chips">${ms.map(m => { const n = kidTap.counts[m.id] || 0, mx = m.kid_max || 1; return `<button class="chipbtn ${n ? "on" : ""}" data-m="${esc(m.id)}"><span>${esc(mKidLabel(m))}</span><span class="ct">${n ? (mx > 1 ? "✓".repeat(n) : "✓") : ""}</span></button>`; }).join("")}</div><button class="go" id="kidSave">${t.doneBtn}</button>`;
    el.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { const m = ms.find(x => x.id === b.dataset.m), mx = m.kid_max || 1, n = kidTap.counts[m.id] || 0; kidTap.counts[m.id] = n >= mx ? 0 : n + 1; did(); });
    $("#kidSave").onclick = save; };
  const save = async () => { el.innerHTML = `<div class="thanks">⏳</div>`;
    const { error } = await sb.rpc("kid_tapin", { p_date: d, p_mood: kidTap.mood, p_counts: kidTap.counts });
    if (error) { el.innerHTML = `<h2>${t.cantSave}</h2>`; return; }
    el.innerHTML = `<div class="thanks">🎉</div><h2>${t.thanks(esc(kidName(k.id)))}</h2>`;
    setTimeout(async () => { $("#kidMode").classList.remove("open"); await loadAll(); kidRender(); }, 1400); };
  face();
}

start();
