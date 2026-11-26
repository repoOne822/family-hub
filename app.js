// Family Hub — static front end. All family data lives in a private Supabase
// database behind sign-in + row-level security. Nothing personal is in this repo.
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { STR } from "./i18n.js?v=20261125jb1";
import * as Pix from "./pixel.js?v=20261121r1";

const SUPABASE_URL = "https://iiplawparuxicjyflhzu.supabase.co";
const SUPABASE_KEY = "sb_publishable_p10mMjAj6HvAC8lLx8vMlQ_-eaCNwSq"; // publishable key: safe in public code, RLS protects the data
const sb = window.__SB_MOCK || createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
// 🩺 Error monitoring: uncaught errors (hub and the apps inside it) are saved for parents (public.client_errors; signed-in users only, capped per day)
const errSeen = new Set();
window.fhReportError = (page, msg, stack) => { const key = page + "|" + msg; if (!msg || errSeen.has(key) || errSeen.size > 30) return; errSeen.add(key);
  try { sb.rpc("log_client_error", { p_page: String(page).slice(0, 120), p_msg: String(msg).slice(0, 400), p_stack: stack ? String(stack).slice(0, 2000) : null, p_ua: navigator.userAgent.slice(0, 200) }).then(() => {}, () => {}); } catch (e) {} };
const errHook = (w, page) => { try {
  w.addEventListener("error", e => { if (e.message) window.fhReportError(page(), e.message, e.error && e.error.stack); });
  w.addEventListener("unhandledrejection", e => { const r = e.reason; const m = r && r.message || String(r); if (!/Failed to fetch|NetworkError|Load failed|AbortError/i.test(m)) window.fhReportError(page(), "unhandled: " + m, r && r.stack); });
} catch (e) {} };
errHook(window, () => "hub#" + (location.hash || "").slice(1, 40));

/* ---------------- state ---------------- */
let lang = "en";
try { lang = localStorage.getItem("fh_lang") || (navigator.language?.startsWith("zh") ? "zh" : "en"); } catch (e) {}
const T = () => STR[lang];
const S = { user: null, me: null, kids: [], entries: [], goals: [], metrics: [], checkins: [], readings: [], docs: [], journal: [], moods: [], subjects: [] };
const KID_DOMAIN = "kids.family-hub.local";
const LEARNER_DOMAIN = "learners.family-hub.local"; // 📖 adult English learners (Abby): own page at abby/, kept out of the boys' data // kid logins are username@this; no real email needed
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
/* ---------- Kids mode lock (shared parent device) ---------- */
const LS = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} } };
let lockedMem = false;
const isLocked = () => LS.get("fh_locked") === "1" || lockedMem;
async function pinHash(pin) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("fh:" + pin)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join(""); }
function lockPinForm(mode, onOk) {
  const t = T(), box = document.createElement("div"); box.className = "modal-bg open"; box.style.zIndex = 60;
  box.innerHTML = `<form class="modal" style="max-width:360px"><h3>${mode === "set" ? t.kidsMode : t.parentUnlock}</h3><p class="meta">${mode === "set" ? t.lockHelp : ""}</p>
    <label>${mode === "set" ? t.setLockPin : t.enterLockPin}</label><input type="password" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" minlength="4" required autocomplete="off" style="font-size:24px;letter-spacing:10px;text-align:center">
    <div class="err"></div><div class="modal-f"><button type="button" class="btn" data-x>${t.cancel}</button><button class="btn primary">${mode === "set" ? t.kidsMode : t.unlock}</button></div></form>`;
  document.body.appendChild(box); const inp = box.querySelector("input"); setTimeout(() => inp.focus(), 50);
  box.querySelector("[data-x]").onclick = () => box.remove();
  box.querySelector("form").onsubmit = async e => { e.preventDefault(); const h = await pinHash(inp.value);
    if (mode === "set") { LS.set("fh_lock_hash", h); box.remove(); onOk(); return; }
    if (h === LS.get("fh_lock_hash")) { box.remove(); onOk(); } else { box.querySelector(".err").textContent = t.wrongPin; inp.value = ""; } };
}
function lockDevice() { const go = () => { LS.set("fh_locked", "1"); lockedMem = true; openLobby(); }; LS.get("fh_lock_hash") ? go() : lockPinForm("set", go); }
function openLobby() { $("#kidMode").classList.add("open"); const c = $("#kidMode [data-fsclose]"); c.textContent = T().parentUnlock; kidStage("who"); }
function unlockDevice() { lockPinForm("check", () => { LS.set("fh_locked", null); lockedMem = false; $("#kidMode").classList.remove("open"); $("#kidMode [data-fsclose]").textContent = T().cancel; renderShell(); route(); }); }
function avatarHtml(av, size) { const sp = Pix.parse(av); return sp ? Pix.svg(sp, size) : `<span style="font-size:${Math.round(size * .6)}px;line-height:1">${esc(av || "⭐")}</span>`; }
const heroPills = () => `<div class="pills" aria-hidden="true">${T().tags.map((x, i) => `<span class="pill p${i + 1}">${esc(x)}</span>`).join("")}<span class="blob b1">✦</span><span class="blob b2">♥</span><span class="blob b3">★</span><span class="blob b4">↗</span></div>`;
const marquee = () => { const w = T().marquee.map(x => `<b>${esc(x)}</b><i>/</i>`).join(""); return `<div class="marquee" aria-hidden="true"><span>${w}${w}</span></div>`; };
function setStatus(msg, warn) { const s = $("#status"); if (s) { s.textContent = msg || ""; s.classList.toggle("warn", !!warn); } }
function applyStatic() { document.querySelectorAll("[data-t]").forEach(el => { const v = T()[el.dataset.t]; if (typeof v === "string") el.textContent = v; }); document.documentElement.lang = lang === "zh" ? "zh-CN" : "en"; }

/* ---------------- data ---------------- */
async function loadMe() {
  const { data, error } = await sb.from("allowed_users").select("role,kid_id,display_name").eq("email", (S.user.email || "").toLowerCase()).maybeSingle();
  if (error) throw error; S.me = data || null;
}
const isKid = () => S.me?.role === "kid";
async function loadAll() {
  if (isKid()) {
    const tables = ["kids", "entries", "goals", "metrics", "readings", "docs", "journal", "subjects", "calendar_events", "fencing_results", "fencing_lessons", "point_ledger", "rewards", "redemptions", "weekly_exams", "allowance_payouts"];
    const res = await Promise.all(tables.map(t => sb.from(t).select("*")));
    res.forEach((r, i) => { if (r.error) throw r.error; S[tables[i]] = r.data || []; });
    const m = await sb.rpc("kid_moods", { p_days: 400 }); S.moods = m.data || []; S.checkins = [];
    try { const jr = await sb.from("my_journal_replies").select("*"); S.jreplies = jr.data || []; } catch (e) { S.jreplies = []; }
    try { const r = await sb.from("brain_checks").select("*").order("taken_at"); S.brain_checks = r.data || []; } catch (e) { S.brain_checks = []; } // 🧠 his own checks
    S.metrics.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)); S.subjects.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)); return;
  }
  const tables = ["kids", "entries", "goals", "metrics", "checkins", "readings", "docs", "journal", "subjects", "feedback", "insights", "assessments", "app_saves", "roadmap_items", "parent_checks", "fencing_lessons", "askfred_sync", "fencing_results", "calendar_events", "point_ledger", "rewards", "redemptions", "weekly_exams", "allowance_payouts"];
  const res = await Promise.all(tables.map(t => sb.from(t).select("*")));
  res.forEach((r, i) => { if (r.error) throw r.error; S[tables[i]] = r.data || []; });
  try { const jr = await sb.from("journal_replies").select("*"); S.jreplies = jr.data || []; } catch (e) { S.jreplies = []; }
  S.kids.sort((a, b) => (a.sort ?? 9) - (b.sort ?? 9));
  S.metrics.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)); S.subjects.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  if (!coachKid || !S.kids.some(k => k.id === coachKid)) coachKid = S.kids[0]?.id || null;
  try { await lnLoad(); } catch (e) { S.skill_state = S.skill_state || []; S.learn_days = S.learn_days || []; } // 📚 nightly learning model
  try { const r = await sb.from("app_time").select("*").gte("date", daysAgo(60)); S.app_time = r.data || []; } catch (e) { S.app_time = []; } // ⏱️ time per app per day
  try { const r = await sb.from("integrity_flags").select("*").gte("date", daysAgo(21)).order("date", { ascending: false }); S.integrity_flags = r.data || []; } catch (e) { S.integrity_flags = []; } // 🛡️ fair play
  try { const r = await sb.from("integrity_settings").select("*"); S.integrity_settings = r.data || []; } catch (e) { S.integrity_settings = []; }
  try { const r = await sb.from("app_saves").select("kid,data").eq("app", "donewell"); S.donewell = r.data || []; } catch (e) { S.donewell = []; } // 🎯 done-well self-checks
  try { const r = await sb.from("brain_checks").select("*").order("taken_at"); S.brain_checks = r.data || []; } catch (e) { S.brain_checks = []; } // 🧠 brain development
  try { const r = await sb.from("brain_signals").select("*").gte("date", daysAgo(180)).order("date"); S.brain_signals = r.data || []; } catch (e) { S.brain_signals = []; }
  try { const r = await sb.from("body_log").select("*").gte("date", daysAgo(120)).order("date"); S.body_log = r.data || []; } catch (e) { S.body_log = []; }
  try { const r = await sb.from("home_ratings").select("*").order("month"); S.home_ratings = r.data || []; } catch (e) { S.home_ratings = []; }
  S.app_idle = []; if (!isKid()) try { const r = await sb.from("app_idle").select("*").gte("date", daysAgo(14)).order("started_at"); S.app_idle = r.data || []; } catch (e) {} // 😴 drift log (parents only)
}
async function upsert(table, row, onConflict) { const { error } = await sb.from(table).upsert(row, onConflict ? { onConflict } : undefined); if (error) throw error; }
async function del(table, match) { let q = sb.from(table).delete(); for (const [k, v] of Object.entries(match)) q = q.eq(k, v); const { error } = await q; if (error) throw error; }
async function refresh() { try { await loadAll(); route(); } catch (e) { setStatus(e.message || "Load failed", true); } }
document.addEventListener("visibilitychange", () => { if (!document.hidden && S.user) refresh(); });

/* ---------------- auth ---------------- */
let siStage = "landing", siMode = "parent", pMode = (() => { try { return localStorage.getItem("fh_pmode") || "link"; } catch (e) { return "link"; } })();
function renderLanding() {
  const t = T();
  $("#root").innerHTML = `<div class="landing">
    <div class="landtop"><span class="brand"><span class="dotlogo">✦</span> ${t.signInTitle}</span><button class="lang" id="langBtn">${lang === "en" ? "中文" : "English"}</button></div>
    <div class="headline" style="margin-top:6vh">${t.heroHtml}</div>${heroPills()}
    <div class="hero">
      <button class="herobtn" style="background:var(--lime)" data-door="kid">🧒 ${t.kidDoor}<small>${t.kidDoorSub}</small></button>
      <button class="herobtn" style="background:var(--pink)" data-door="parent">👨‍👩‍👦 ${t.parentDoor}<small>${t.parentDoorSub}</small></button>
    </div>
    <p class="meta" style="text-align:center;margin-top:18px">🔒 ${t.signInSub}</p>
    <div class="hero" style="grid-template-columns:1fr;margin-top:-10px"><button class="herobtn" style="background:var(--yellow,#ffe066);padding:20px 26px;font-size:22px" data-door="learner">📖 ${lang === "zh" ? "Abby 的英语学习" : "Abby's English"}<small>${lang === "zh" ? "用名字和 PIN 登录，每天练英语" : "Sign in with your name + PIN to practice English"}</small></button></div>
    ${marquee()}</div>`;
  $("#langBtn").onclick = toggleLang;
  document.querySelectorAll("[data-door]").forEach(b => b.onclick = () => { siMode = b.dataset.door; siStage = "form"; renderSignIn(); });
}
function renderSignIn(msg) {
  if (siStage === "landing" && !msg) return renderLanding();
  siStage = "form";
  const kidSide = siMode !== "parent", learner = siMode === "learner";
  $("#root").innerHTML = `<div class="signin" style="margin-top:9vh">
    <div style="display:flex;justify-content:space-between;align-items:center"><button class="linkbtn" id="backBtn" style="margin:0;text-decoration:none">${T().back}</button><button class="lang" id="langBtn">${lang === "en" ? "中文" : "English"}</button></div>
    <h1 style="margin-top:14px">${learner ? `📖 ${lang === "zh" ? "Abby 的英语学习" : "Abby's English"}` : kidSide ? `🧒 ${T().kidSignInTitle}` : `👨‍👩‍👦 ${T().parentSignInTitle}`}</h1>
    <p class="meta" style="margin-bottom:14px">${learner ? (lang === "zh" ? "输入名字（abby）和 PIN。登录后进度会保存，换设备也能接着学。" : "Type your name (abby) and your PIN. Signing in saves your progress across devices.") : kidSide ? T().kidSignInSub : T().parentSignInSub}</p>
    ${siMode === "parent" ? `<form id="siForm"><label>${T().emailLabel}</label><input type="email" id="siEmail" required autocomplete="email" value="${esc(lastEmail())}">${pMode === "pw" ? `<label style="margin-top:10px">${T().passwordL}</label><input type="password" id="siPw" required autocomplete="current-password" minlength="8">` : ""}<button class="btn primary" style="width:100%;margin-top:12px">${pMode === "pw" ? T().signIn : T().sendLink}</button></form>
      <button class="linkbtn" id="pModeBtn" type="button">${pMode === "pw" ? T().useLink : T().usePassword}</button>`
      : `<form id="kidForm2"><label>${T().username}</label><input id="kUser" required autocomplete="username" autocapitalize="none" spellcheck="false"><label style="margin-top:10px">${T().pin}</label><input id="kPin" type="password" inputmode="numeric" required autocomplete="current-password" minlength="6"><button class="btn primary" style="width:100%;margin-top:12px">${T().signIn}</button></form>`}
    <p class="meta" id="siMsg" style="margin-top:12px">${msg ? esc(msg) : ""}</p></div>`;
  $("#langBtn").onclick = toggleLang;
  $("#backBtn").onclick = () => { siStage = "landing"; renderLanding(); };
  if (learner) { $("#kUser").value = "abby"; $("#siMsg").insertAdjacentHTML("afterend", `<p class="meta" style="margin-top:6px"><a class="linkbtn" href="abby/">${lang === "zh" ? "先不登录，直接练习 →" : "Practice without signing in →"}</a></p>`); }
  if (kidSide) { $("#kidForm2").onsubmit = async e => {
    e.preventDefault();
    const u = $("#kUser").value.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
    const { error } = await sb.auth.signInWithPassword({ email: `${u}@${learner ? LEARNER_DOMAIN : KID_DOMAIN}`, password: $("#kPin").value });
    if (error) $("#siMsg").textContent = T().badLogin;
  }; return; }
  $("#pModeBtn").onclick = () => { pMode = pMode === "pw" ? "link" : "pw"; try { localStorage.setItem("fh_pmode", pMode); } catch (e) {} renderSignIn(); };
  $("#siForm").onsubmit = async e => {
    e.preventDefault();
    const email = $("#siEmail").value.trim();
    try { localStorage.setItem("fh_email", email); } catch (e2) {}
    if (pMode === "pw") {
      const { error } = await sb.auth.signInWithPassword({ email, password: $("#siPw").value });
      if (error) $("#siMsg").textContent = /rate limit/i.test(error.message) ? T().rateLimited : T().badParentPw;
      return;
    }
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } });
    $("#siMsg").textContent = error ? (/not on the family list|Database error/i.test(error.message) ? T().notListed : /rate limit/i.test(error.message) ? T().rateLimited : error.message) : T().linkSent;
  };
}
function lastEmail() { try { return localStorage.getItem("fh_email") || ""; } catch (e) { return ""; } }
function toggleLang() { lang = lang === "en" ? "zh" : "en"; try { localStorage.setItem("fh_lang", lang); } catch (e) {} applyStatic(); S.user ? (isKid() || preview ? kidRender() : (renderShell(), route())) : renderSignIn(); }

async function start() {
  applyStatic();
  const { data } = await sb.auth.getSession();
  S.user = data?.session?.user || null;
  sb.auth.onAuthStateChange((_e, session) => { const was = !!S.user; S.user = session?.user || null; if (!!S.user !== was) boot(); });
  boot();
}
async function boot() {
  if (!S.user) { siStage = "landing"; return renderLanding(); }
  try { await loadMe(); } catch (e) { S.me = null; }
  if (!S.me) { $("#root").innerHTML = `<div class="signin"><p>${T().notListed}</p><button class="btn" id="soBtn">${T().signOut}</button></div>`; $("#soBtn").onclick = () => sb.auth.signOut(); return; }
  if (S.me.role === "learner") { // 📖 adult English learner (Abby) has her own page
    // Bobby 2026-11-26: "any link I entered redirects to Abby's page". Only a plain visit goes to her page; a link with #page, or
    // coming back from her page, shows a choice so a parent can sign out of Abby's account on a shared browser.
    if (!location.hash && !/[?&]hub=1/.test(location.search)) { location.replace("abby/"); return; }
    const zh = lang === "zh";
    $("#root").innerHTML = `<div class="signin" style="max-width:460px;margin:60px auto;text-align:center"><div style="font-size:54px">📖</div>
      <h2>${zh ? "这台设备现在登录的是 Abby 的英语学习账号" : "This browser is signed in to Abby's English account"}</h2>
      <p class="meta">${zh ? "家长页面（比如“一眼看懂”）需要用家长账号登录。" : "Parent pages (like At a glance) need a parent account."}</p>
      <div style="display:grid;gap:10px;margin-top:16px"><a class="btn primary" href="abby/">📖 ${zh ? "去 Abby 的英语" : "Go to Abby's English"}</a>
      <button class="btn" id="soLearner">🔑 ${zh ? "退出，用家长账号登录" : "Sign out and sign in as a parent"}</button></div></div>`;
    $("#soLearner").onclick = async () => { try { await sb.auth.signOut(); } catch (e) {} try { history.replaceState(null, "", location.pathname + location.hash); } catch (e) {} location.reload(); };
    return;
  }
  if (isKid()) return kidBoot();
  renderShell(); setStatus(T().loading);
  try { await loadAll(); setStatus(""); route(); }
  catch (e) { setStatus(e.message || "Load failed", true); }
}

/* ---------------- shell + routing ---------------- */
const ROUTES = ["glance", "today", "calendar", "rewards", "dashboard", "learning", "brain", "roadmap", "performance", "feedback", "subjects", "log", "plans", "reports", "family"];
const NAVKEY = { glance: "Glance", today: "Today", calendar: "Cal", rewards: "Rewards", dashboard: "Dash", learning: "Learn", brain: "Brain", roadmap: "Roadmap", performance: "Perf", feedback: "Feedback", subjects: "Subjects", log: "Log", plans: "Plans", reports: "Reports", family: "Family" };
const navLabel = r => T()["nav" + NAVKEY[r]] || r;
const PICON = {
  glance: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  today: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  rewards: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8c-2-4-6-4-6-1.5S9 8 12 8zm0 0c2-4 6-4 6-1.5S15 8 12 8z"/>',
  dashboard: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  subjects: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M8 7h7"/>',
  roadmap: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
  performance: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  learning: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5M22 9v6"/>',
  feedback: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
  brain: '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3h1V4z"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3h-1V4z"/>',
  log: '<path d="M4 6h16M4 12h10M4 18h7"/><path d="M17 14l3 3-4 4h-3v-3z"/>',
  plans: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/>',
  reports: '<path d="M6 3h9l4 4v14H6z"/><path d="M9 17v-3M12 17v-6M15 17v-4"/>',
  family: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
  out: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/>' };
const pIcon = n => `<svg class="pico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PICON[n] || ""}</svg>`;
const NAVGROUPS = [[null, ["glance", "today", "calendar", "rewards"]], [{ en: "Kids", zh: "孩子" }, ["dashboard", "learning", "brain", "subjects", "roadmap", "performance", "feedback"]], [{ en: "Records", zh: "记录" }, ["log", "plans", "reports"]], [{ en: "Home", zh: "家庭" }, ["family"]]];
const TABS = ["glance", "today", "dashboard", "rewards"];
const parentHome = () => { try { return localStorage.getItem("fh_parent_home") || "today"; } catch (e) { return "today"; } };
function renderShell() {
  const t = T(), zh = lang === "zh", lk = (r, cls = "") => `<a href="#${r}" data-r="${r}" class="${cls}">${pIcon(r)}<span>${r === "dashboard" && cls.includes("tab") ? (zh ? "孩子" : "Kids") : navLabel(r)}</span></a>`;
  const tools = `<button class="pside-btn" id="langBtn">${pIcon("globe")}<span>${lang === "en" ? "中文" : "English"}</span></button>
      <button class="pside-btn" id="lockBtn">${pIcon("lock")}<span>${t.kidsMode.replace(/^🔒\s*/, "")}</span></button>
      <button class="pside-btn" id="soBtn">${pIcon("out")}<span>${t.signOut}</span></button>`;
  $("#root").innerHTML = `<div class="pshell">
    <aside class="pside"><div class="brand"><span class="dotlogo">✦</span>${t.appTitle}</div>
      <nav class="pnav">${NAVGROUPS.map(([g, rs]) => `${g ? `<div class="pgrp">${zh ? g.zh : g.en}</div>` : ""}${rs.map(r => lk(r)).join("")}`).join("")}</nav>
      <div class="ptools">${tools}</div></aside>
    <header class="pbar"><a class="pbar-lang" id="homeBtn2" href="#${parentHome()}" style="text-decoration:none;margin-right:6px" aria-label="${zh ? "首页" : "Home"}">🏠</a><div class="brand"><span class="dotlogo">✦</span><span id="pgTitle">${t.appTitle}</span></div><button class="pbar-lang" id="langBtn2">${lang === "en" ? "中文" : "EN"}</button></header>
    <main class="pmain"><div class="wrap"><a class="phome" href="#${parentHome()}">🏠 ${zh ? "首页" : "Home"}</a><div class="status" id="status"></div><div id="view"></div></div></main>
    <nav class="ptabs">${TABS.map(r => lk(r, "tab")).join("")}<button class="tab" id="moreBtn" aria-expanded="false">${pIcon("more")}<span>${zh ? "更多" : "More"}</span></button></nav>
    <div class="psheet-bg" id="moreSheet" hidden><div class="psheet" role="dialog" aria-label="${zh ? "更多" : "More"}"><div class="psheet-grab"></div>
      <div class="psheet-grid">${ROUTES.filter(r => !TABS.includes(r)).map(r => lk(r, "sheet")).join("")}</div>
      <div class="psheet-tools">${tools.replace(/id="(langBtn|lockBtn|soBtn)"/g, 'id="$1M"')}</div></div></div></div>`;
  const tog = () => { const m = $("#moreSheet"); m.hidden = !m.hidden; $("#moreBtn").setAttribute("aria-expanded", String(!m.hidden)); };
  $("#moreBtn").onclick = tog; $("#moreSheet").onclick = e => { if (e.target.id === "moreSheet" || e.target.closest("a")) { $("#moreSheet").hidden = true; $("#moreBtn").setAttribute("aria-expanded", "false"); } };
  ["langBtn", "langBtn2", "langBtnM"].forEach(id => $("#" + id) && ($("#" + id).onclick = toggleLang));
  ["soBtn", "soBtnM"].forEach(id => $("#" + id).onclick = async () => { await sb.auth.signOut(); });
  ["lockBtn", "lockBtnM"].forEach(id => $("#" + id).onclick = () => { $("#moreSheet").hidden = true; lockDevice(); });
}
window.addEventListener("hashchange", route);
function route() {
  if (!S.user || isKid()) return;
  if (!$("#view")) return;
  if (isLocked()) { document.querySelectorAll(".pside .pnav,.ptabs").forEach(n => n.style.display = "none"); openLobby(); return; }
  let h = location.hash.slice(1) || (() => { try { return localStorage.getItem("fh_parent_home") || "today"; } catch (e) { return "today"; } })();
  let doc = null;
  if (h.startsWith("doc-")) { doc = h.slice(4); h = "doc"; }
  if (!ROUTES.includes(h) && h !== "doc") h = "today";
  const onR = h === "doc" ? (S.docs.find(d => d.slug === doc)?.section === "report" ? "reports" : "plans") : h;
  document.querySelectorAll("[data-r]").forEach(a => a.classList.toggle("on", a.dataset.r === onR));
  document.querySelectorAll(".phome,#homeBtn2").forEach(a => { a.href = "#" + parentHome(); a.style.visibility = onR === parentHome() ? "hidden" : ""; });
  const mb = $("#moreBtn"); if (mb) mb.classList.toggle("on", !TABS.includes(onR));
  if ($("#pgTitle")) $("#pgTitle").textContent = navLabel(onR); window.scrollTo(0, 0);
  const waiting = (S.redemptions || []).filter(r => r.status === "requested").length; // badge: reward requests waiting for a parent
  document.querySelectorAll('[data-r="rewards"]').forEach(a => { let b = a.querySelector(".pbadge"); if (!waiting) { b && b.remove(); return; } if (!b) { b = document.createElement("span"); b.className = "pbadge"; a.appendChild(b); } b.textContent = waiting; b.setAttribute("aria-label", waiting + " waiting"); });
  ({ glance: viewGlance, today: viewToday, calendar: viewCalendar, rewards: viewRewards, dashboard: viewDash, learning: viewLearning, brain: viewBrain, log: viewLog, plans: () => viewDocs("plan"), reports: () => viewDocs("report"), family: viewFamily, subjects: viewSubjects, feedback: viewFeedback, performance: viewPerformance, roadmap: viewRoadmap, doc: () => viewDoc(doc) })[h]();
}

/* ---------------- 👀 AT A GLANCE (Bobby 2026-11-26) ----------------
   "A dashboard for my wife and I … user friendly. The daily email is a bit too complicated for Abby to read."
   One card per boy, plain sentences, big text, traffic-light status. Each boy only vs his own goals; no ranking. */
const GL_AMC = { eric: 90, ellis: 60 }; // same daily AMC targets as amc/index.html AMC_DAILY
const GL_MIN_JONAH = 20;
function glanceKid(k) {
  const zh = lang === "zh", L = (en, z) => zh ? z : en, d = today(), hr = new Date().getHours();
  const secsOn = (day, app) => (S.app_time || []).filter(x => x.kid === k.id && x.date === day && (!app || x.app === app)).reduce((a, x) => a + (+x.secs || 0), 0);
  const tot = secsOn(d), amc = secsOn(d, "amc"), goal = GL_AMC[k.id], minNow = Math.round(tot / 60), amcMin = Math.round(amc / 60);
  const top = Object.entries((S.app_time || []).filter(x => x.kid === k.id && x.date === d).reduce((o, x) => (o[x.app] = (o[x.app] || 0) + (+x.secs || 0), o), {})).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const jt = jToday(k.id), bad = jBad(k), jReq = !!k.journal_required, minW = k.journal_min_words || 250;
  const flags = (S.integrity_flags || []).filter(f => f.kid === k.id && f.status === "open" && f.points > 0 && f.severity !== "low");
  const c = (S.checkins || []).find(x => x.kid === k.id && x.date === d) || {};
  const wkGoal = k.weekly_goal || 500, wk = mondayOf(d), stars = weekStars(k.id, wk), pct = Math.min(100, Math.round(100 * stars / wkGoal));
  const tdPts = (S.point_ledger || []).filter(r => r.kid === k.id && r.date === d && r.source !== "spend").reduce((a, r) => a + r.points, 0);
  // journal line
  let jLine = null, jState = "na";
  if (jReq) {
    if (bad) { jState = "bad"; jLine = L(`⚠️ Journal has too many mistakes. Points are paused until he fixes it.`, `⚠️ 日记错误太多，改正之前积分暂停。`); }
    else if (jt && (jt.words || 0) >= minW) { jState = "ok"; jLine = L(`✅ Journal done (${jt.words} words)`, `✅ 日记写好了（${jt.words} 字）`); }
    else if (jt) { jState = "part"; jLine = L(`✏️ Journal started: ${jt.words || 0} of ${minW} words`, `✏️ 日记写了 ${jt.words || 0} / ${minW} 字`); }
    else { jState = "no"; jLine = L(`⏳ Journal not written yet (apps open after it)`, `⏳ 还没写日记（写完才能用 App）`); }
  }
  // study line
  const studyOk = goal ? amcMin >= goal : minNow >= GL_MIN_JONAH;
  const sLine = goal ? L(`⏱️ Studied ${hm(tot) || "0m"} today · AMC ${amcMin} of ${goal} min`, `⏱️ 今天学习 ${hm(tot) || "0 分钟"} · AMC ${amcMin} / ${goal} 分钟`)
                     : L(`⏱️ Learning games today: ${hm(tot) || "0m"}`, `⏱️ 今天学习游戏 ${hm(tot) || "0 分钟"}`);
  const sBar = goal ? Math.min(100, Math.round(100 * amcMin / goal)) : Math.min(100, Math.round(100 * minNow / 60));
  // status
  let st;
  if (jState === "bad" || flags.length || (jReq && jState !== "ok" && hr >= 19)) st = ["warn", "⚠️", L("Needs a look", "需要关注"), "#fde2e1", "#b42318"];
  else if ((!jReq || jState === "ok") && studyOk) st = ["good", "😀", L("Great day", "今天很好"), "#dcfce7", "#166534"];
  else st = ["mid", "🙂", L("In progress", "进行中"), "#fef3c7", "#92400e"];
  // talk tip (one, plain)
  let tip;
  if (jState === "bad") tip = L("Sit with him for 5 minutes and fix the journal together. Praise the effort, not the mistakes.", "陪他坐 5 分钟一起改日记。夸他认真改，不要盯着错误说。");
  else if (flags.length) tip = L("Some points are on hold (looked like rushing or repeating). Ask him calmly how he practiced today.", "有些积分在核查（像是赶快乱做或重复做）。平静地问问他今天是怎么练习的。");
  else if (jReq && jState !== "ok") tip = L("Remind him gently: journal first, then apps.", "温柔提醒：先写日记，再用 App。");
  else if (goal && !studyOk) tip = L(`About ${goal - amcMin} more AMC minutes to reach today's goal.`, `离今天的 AMC 目标还差约 ${goal - amcMin} 分钟。`);
  else if (pct >= 80 && pct < 100) tip = L(`Almost at his weekly star goal: only ${wkGoal - stars} to go!`, `快到本周星星目标了，只差 ${wkGoal - stars}！`);
  else if (studyOk) tip = L("He hit today's goal. Tell him one specific thing he did well.", "他完成了今天的目标。具体地夸他一件做得好的事。");
  else tip = L("Ask him what he learned today; let him teach you one thing.", "问问他今天学了什么，让他教你一件事。");
  // 7-day dots
  const days = []; for (let i = 6; i >= 0; i--) days.push(daysAgo(i));
  const dots = days.map(day => { const m = Math.round((goal ? secsOn(day, "amc") : secsOn(day)) / 60), tgt = goal || GL_MIN_JONAH, col = m >= tgt ? "#22c55e" : m > 0 ? "#facc15" : "#e5e7eb";
    const lab = day === d ? L("Today", "今天") : new Date(day + "T12:00").toLocaleDateString(zh ? "zh-CN" : "en-US", { weekday: "short" });
    return `<div style="text-align:center;flex:1"><div title="${m} min" style="height:30px;border-radius:9px;background:${col};display:grid;place-items:center;font-weight:800;font-size:13px;color:#333">${m || ""}</div><div style="font-size:12px;color:#666;margin-top:3px">${lab}</div></div>`; }).join("");
  const bar = (v, col) => `<div style="height:12px;border-radius:9px;background:#0000000f;overflow:hidden;margin-top:6px"><i style="display:block;height:100%;width:${v}%;background:${col};border-radius:9px"></i></div>`;
  const row = (html, extra = "") => `<div style="padding:12px 0;border-top:1px solid #0000000d;font-size:18px;line-height:1.4">${html}${extra}</div>`;
  return `<div class="card glk" style="border-top:6px solid ${KCOL[k.id] || "var(--k0)"};padding:18px 18px 12px">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px"><span style="width:56px;height:56px;border-radius:16px;background:#fff;display:grid;place-items:center;box-shadow:0 2px 0 #0001">${avatarHtml(k.avatar, 50)}</span>
      <div style="flex:1"><div style="font-size:24px;font-weight:800">${esc(kidName(k.id))}</div><div style="font-size:15px;color:#666">${c.kid_mood ? L(`Feels ${FACES[c.kid_mood - 1]} today`, `今天心情 ${FACES[c.kid_mood - 1]}`) : L("No mood check-in yet", "今天还没打卡心情")}</div></div>
      <span style="background:${st[3]};color:${st[4]};font-weight:800;font-size:17px;padding:8px 14px;border-radius:999px;white-space:nowrap">${st[1]} ${st[2]}</span></div>
    ${jLine ? row(jLine) : ""}
    ${row(sLine + (top.length ? `<div style="font-size:14px;color:#666">${top.map(([a, v]) => `${esc(appSubjName(k.id, a))} ${hm(v)}`).join(" · ")}</div>` : ""), bar(sBar, studyOk ? "#22c55e" : "#facc15"))}
    ${row(L(`⭐ This week: ${stars} of ${wkGoal} stars${stars >= wkGoal ? " — goal reached! 🎉" : ` · +${tdPts} today`}`, `⭐ 本周星星 ${stars} / ${wkGoal}${stars >= wkGoal ? "，目标达成！🎉" : ` · 今天 +${tdPts}`}`) + `<div style="font-size:14px;color:#666">${L(stars >= wkGoal ? "He can take the weekly exam for his $20." : `Reach ${wkGoal} to unlock the weekly exam ($20).`, stars >= wkGoal ? "他可以参加每周考试赢 $20 零花钱。" : `到 ${wkGoal} 颗星就能考试赢 $20 零花钱。`)}</div>`, bar(pct, "#6d4aff"))}
    ${flags.length ? row(L(`🛡️ ${flags.length} point item${flags.length > 1 ? "s" : ""} on hold for review`, `🛡️ 有 ${flags.length} 项积分在核查`) + ` <a href="#dashboard" style="font-size:15px">${L("see why →", "看原因 →")}</a>`) : ""}
    ${row(`<div style="font-size:15px;color:#666;margin-bottom:6px">${goal ? L(`Last 7 days · AMC minutes (green = goal met)`, `最近 7 天 · AMC 分钟（绿色 = 达标）`) : L(`Last 7 days · learning minutes (green = ${GL_MIN_JONAH}+)`, `最近 7 天 · 学习分钟（绿色 = ${GL_MIN_JONAH} 分钟以上）`)}</div><div style="display:flex;gap:6px">${dots}</div>`)}
    <div style="margin-top:6px;padding:12px 14px;border-radius:14px;background:#f5f3ff;font-size:17px;line-height:1.45">💬 <b>${L("Tonight", "今晚")}:</b> ${tip}</div>
  </div>`;
}
function viewGlance() {
  const zh = lang === "zh", L = (en, z) => zh ? z : en, d = today();
  const waiting = (S.redemptions || []).filter(r => r.status === "requested");
  let isHome = false; try { isHome = localStorage.getItem("fh_parent_home") === "glance"; } catch (e) {}
  const dstr = new Date(d + "T12:00").toLocaleDateString(zh ? "zh-CN" : "en-US", { weekday: "long", month: "long", day: "numeric" });
  $("#view").innerHTML = `
    <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:4px 0 12px">
      <div><h2 style="margin:0;font-size:28px">👀 ${L("Kids at a glance", "孩子们今天怎么样")}</h2><div style="font-size:17px;color:#666">${dstr}</div></div>
      <div class="row" style="gap:8px"><button class="btn sm" id="glLang">${zh ? "English" : "中文"}</button><button class="btn sm ${isHome ? "" : "primary"}" id="glHome">${isHome ? L("✓ My start page", "✓ 已设为首页") : L("Make this my start page", "设为我的首页")}</button></div></div>
    ${waiting.length ? `<a class="reqbanner" href="#rewards" style="font-size:18px">🎁 <b>${L(`${waiting.length} reward request${waiting.length > 1 ? "s" : ""} waiting for you`, `${waiting.length} 个奖励兑换等你确认`)}</b><em>→</em></a>` : ""}
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px;font-size:15px"><span style="background:#dcfce7;color:#166534;padding:5px 10px;border-radius:999px">😀 ${L("Great day", "今天很好")}</span><span style="background:#fef3c7;color:#92400e;padding:5px 10px;border-radius:999px">🙂 ${L("In progress", "进行中")}</span><span style="background:#fde2e1;color:#b42318;padding:5px 10px;border-radius:999px">⚠️ ${L("Needs a look", "需要关注")}</span></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:14px;align-items:start">${S.kids.map(glanceKid).join("")}</div>
    <p class="meta" style="margin-top:12px;font-size:14px">${L("Each boy is compared only with his own goals. Updates when you open or refresh this page. More detail: Kids → Dashboard.", "每个孩子只和自己的目标比，不和兄弟比较。打开或刷新页面就会更新。想看更多：孩子 → 总览。")}</p>
    <div id="glScores" style="margin-top:18px"></div>`;
  scoresRender();
  $("#glHome").onclick = () => { try { if (localStorage.getItem("fh_parent_home") === "glance") localStorage.removeItem("fh_parent_home"); else localStorage.setItem("fh_parent_home", "glance"); } catch (e) {} viewGlance(); };
  $("#glLang").onclick = () => { const b = document.getElementById("langBtn"); if (b) b.click(); };
}

/* ---------------- 📈 SUBJECT SCORES + BRAIN TREND (Bobby 2026-11-26) ----------------
   "add all subject's assessments, possible give a score to track the performance. also add the IQ+Brain development score
   as well on the same trend chart to see correlation". Per subject (0–100, his own scale):
   · App score  = average mastery of the skills he has practiced in that subject's app, carried forward day by day (skill_history)
   · Test/grade = school or test % entered by a parent (readings on the subject's % metrics; quick-add form below)
   · Parent rating = latest home assessment (1–5 → 0–100)
   Brain: 🧮 Thinking (IQ-style composite) and 🧠 Brain (all brain skills) from each check, on the same chart.
   Correlation is shown only once there are 4+ checks; before that it would be noise. */
let scKid = null, scHidden = {}; const SC_CACHE = {}, SC_DAYS = 60;
const SC_COL = ["#6d4aff", "#16a34a", "#ea580c", "#0891b2", "#db2777", "#ca8a04", "#4f46e5", "#059669", "#dc2626", "#7c3aed", "#0284c7", "#65a30d"];
async function scLoad(kid) {
  if (SC_CACHE[kid] && Date.now() - SC_CACHE[kid].at < 300000) return SC_CACHE[kid];
  const from = daysAgo(SC_DAYS), rows = [];
  for (let p = 0; p < 20; p++) { const { data, error } = await sb.from("skill_history").select("app,skill,date,mastery").eq("kid", kid).gte("date", from).order("date").range(p * 1000, p * 1000 + 999); if (error) throw error; rows.push(...(data || [])); if (!data || data.length < 1000) break; }
  return (SC_CACHE[kid] = { at: Date.now(), hist: rows });
}
const scBrain = c => { const sc = c.scores || {}, iqK = ["reason", "verbal", "number", "wm", "speed"].filter(k => sc[k] != null), all = Object.keys(sc).filter(k => k !== "thinking" && sc[k] != null);
  const avg = ks => ks.length ? Math.round(ks.reduce((a, k) => a + +sc[k], 0) / ks.length) : null;
  return { date: c.date, think: sc.thinking != null ? +sc.thinking : iqK.length >= 3 ? avg(iqK) : null, brain: avg(all) }; };
function scPearson(xs, ys) { const n = xs.length; if (n < 3) return null; const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sx = 0, sy = 0; for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sx += (xs[i] - mx) ** 2; sy += (ys[i] - my) ** 2; } return sx && sy ? sxy / Math.sqrt(sx * sy) : null; }
/* 📝 Journal quality (Bobby 2026-11-26: "find a way to measure their journal performance"). Each entry is scored on this device
   with the same writing coach the boys see (5 traits × 1–4 stars, 6+1 traits model, tuned by age) → 0–100. Parents see scores
   and trait names only, never the journal text. Cached per entry so it runs once. */
const JTRAIT = { ideas: ["💡 Ideas & details", "💡 内容和细节"], org: ["🧱 Organization", "🧱 结构"], words: ["🔤 Word choice", "🔤 用词"], flow: ["🌊 Sentence flow", "🌊 句子流畅"], conv: ["✅ Spelling & grammar", "✅ 拼写和语法"] };
const JTIP = { ideas: ["Ask at dinner: \"How did you feel, and what will you do next time?\" Those two answers make great journal details.", "晚饭时问他：“你当时什么感觉？下次会怎么做？”这两个回答就是很好的日记细节。"],
  org: ["Suggest 3 paragraphs: what happened → the most important part → what he learned.", "建议写 3 段：发生了什么 → 最重要的部分 → 学到了什么。"],
  words: ["Play a 1-minute word swap: replace good / fun / very with stronger words.", "玩 1 分钟换词游戏：把 good / fun / very 换成更有力的词。"],
  flow: ["Have him read one paragraph aloud; where he runs out of breath or it sounds choppy, fix that sentence.", "让他大声读一段；读得喘不过气或太断的地方，就改那一句。"],
  conv: ["Before saving, have him read it backwards sentence by sentence to catch spelling and capitals.", "保存前让他从最后一句往前读，检查拼写和大写。"] };
async function jScores(k) {
  const es = (S.journal || []).filter(j => j.kid === k.id && j.body && j.date >= daysAgo(SC_DAYS)).sort((a, b) => String(a.created_at || a.date).localeCompare(String(b.created_at || b.date)));
  const byDate = {}; es.forEach(e => { byDate[e.date] = e; }); // latest entry per day
  const list = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)); if (!list.length) return [];
  const J = await jLoad(), out = [];
  for (const e of list) {
    const key = `fh_jsc2_${e.id}_${e.body.length}`; let v = null; try { v = JSON.parse(localStorage.getItem(key) || "null"); } catch (x) {}
    if ((e.words ?? 999) < 60 || e.body.trim().split(/\s+/).length < 60) continue; // too short to judge writing quality
    if (!v) { const r = await J.check(e.body), c = J.coach(e.body, r.issues || [], +k.age || 10); v = { score: Math.round(100 * c.total / c.max), t: Object.fromEntries(c.traits.map(x => [x.key, x.stars])), words: e.words ?? r.words, mistakes: e.mistakes ?? r.mistakes }; try { localStorage.setItem(key, JSON.stringify(v)); } catch (x) {} }
    out.push({ date: e.date, ...v });
  }
  return out;
}
async function scoresRender() {
  const box = document.getElementById("glScores"); if (!box) return;
  const zh = lang === "zh", L = (en, z) => zh ? z : en;
  if (!scKid || !S.kids.some(k => k.id === scKid)) scKid = S.kids[0]?.id;
  const k = S.kids.find(x => x.id === scKid);
  const head = `<div class="card" style="padding:18px"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><h2 style="margin:0;font-size:24px">📈 ${L("Subject scores & brain trend", "各科分数和大脑发展趋势")}</h2>
    <div class="tabs">${S.kids.map(x => `<button data-sck="${esc(x.id)}" class="${x.id === scKid ? "on" : ""}">${esc(kidName(x.id))}</button>`).join("")}</div></div>`;
  box.innerHTML = head + `<p class="meta">${L("Loading…", "加载中…")}</p></div>`; box.querySelectorAll("[data-sck]").forEach(b => b.onclick = () => { scKid = b.dataset.sck; scoresRender(); });
  let D; try { D = await scLoad(k.id); } catch (e) { box.innerHTML = head + `<p class="meta">⚠️ ${esc(e.message)}</p></div>`; return; }
  let JD = []; try { JD = await jScores(k); } catch (e) { JD = []; }
  if (scKid !== k.id) return;
  const days = []; for (let i = SC_DAYS - 1; i >= 0; i--) days.push(daysAgo(i));
  const subs = (S.subjects || []).filter(x => x.kid === k.id && x.active !== false).sort((a, b) => (a.sort || 0) - (b.sort || 0));
  const sName = sj => `${sj.icon || ""} ${zh && sj.name_zh ? sj.name_zh : sj.name}`.trim();
  // app score series per subject
  const rowsBy = {}; D.hist.forEach(r => (rowsBy[r.app] = rowsBy[r.app] || []).push(r));
  const appSeries = app => { const rs = rowsBy[app]; if (!rs) return null; const last = {}; let i = 0; const out = {};
    rs.sort((a, b) => a.date.localeCompare(b.date));
    days.forEach(d => { while (i < rs.length && rs[i].date <= d) { if (rs[i].mastery != null) last[rs[i].skill] = +rs[i].mastery; i++; } const v = Object.values(last); if (v.length) out[d] = Math.round(100 * v.reduce((a, b) => a + b, 0) / v.length); });
    return Object.keys(out).length ? out : null; };
  const pctMetrics = sid => (S.metrics || []).filter(m => m.subject_id === sid && m.type === "level" && (m.unit || "").trim() === "%");
  const lines = subs.map((sj, i) => {
    const app = sj.app_url && APPS[sj.app_url] ? APPS[sj.app_url].id : null, ser = app ? appSeries(app) : null;
    const tests = pctMetrics(sj.id).flatMap(m => (S.readings || []).filter(r => r.metric === m.id).map(r => ({ date: r.date, v: +r.value, name: zh && m.name_zh ? m.name_zh : m.name }))).sort((a, b) => a.date.localeCompare(b.date));
    const as = (S.assessments || []).filter(a => a.kid === k.id && a.subject_id === sj.id).sort((a, b) => String(a.date).localeCompare(String(b.date))).pop();
    const asV = as ? (() => { const v = ["understanding", "speed", "accuracy", "effort", "confidence"].map(d => as[d]).filter(x => x != null && +x > 0).map(Number); return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length - 1) / 4 * 100) : null; })() : null;
    const st = (S.skill_state || []).filter(x => x.kid === k.id && x.app === app), mast = st.filter(x => x.status === "mastered").length;
    const ld = (S.learn_days || []).filter(x => x.kid === k.id && x.app === app && x.date > daysAgo(7)), att = ld.reduce((a, x) => a + (+x.attempts || 0), 0), cor = ld.reduce((a, x) => a + (+x.correct || 0), 0);
    return { sj, app, ser, tests, asV, asDate: as?.date, mast, nSk: st.length, acc: att >= 5 ? Math.round(100 * cor / att) : null, col: SC_COL[i % SC_COL.length], key: sj.id };
  }).filter(x => x.ser || x.tests.length || x.asV != null || x.app);
  // overall learning score per day = average of subject app scores available that day
  const overall = {}; days.forEach(d => { const v = lines.map(l => l.ser && l.ser[d]).filter(x => x != null); if (v.length) overall[d] = Math.round(v.reduce((a, b) => a + b, 0) / v.length); });
  const jSer = (() => { if (!JD.length) return null; const o = {}; let i = 0; const seen = [];
    days.forEach(d => { while (i < JD.length && JD[i].date <= d) seen.push(JD[i++].score); if (seen.length) { const l = seen.slice(-3); o[d] = Math.round(l.reduce((a, b) => a + b, 0) / l.length); } }); return Object.keys(o).length ? o : null; })();
  const brains = (S.brain_checks || []).filter(c => c.kid === k.id).map(scBrain).filter(b => b.date >= days[0]).sort((a, b) => a.date.localeCompare(b.date));
  // chart: start where his data starts (at least a 14-day window)
  { const firsts = [...lines.flatMap(l => [l.ser ? Object.keys(l.ser).sort()[0] : null, l.tests[0]?.date]), brains[0]?.date, JD[0]?.date].filter(Boolean).sort();
    const st = firsts.length ? (firsts[0] < daysAgo(13) ? addDays(firsts[0], -1) : daysAgo(13)) : daysAgo(13); for (let i = days.length - 1; i >= 0; i--) if (days[i] < st) days.splice(i, 1); }
  const W = 760, H = 300, P = { l: 36, r: 12, t: 12, b: 28 }, x = d => P.l + (days.indexOf(d) / (days.length - 1)) * (W - P.l - P.r), y = v => P.t + (1 - v / 100) * (H - P.t - P.b);
  const path = ser => { let dd = "", pen = false; days.forEach(d => { const v = ser[d]; if (v == null) { pen = false; return; } dd += `${pen ? "L" : "M"}${x(d).toFixed(1)},${y(v).toFixed(1)}`; pen = true; }); return dd; };
  const grid = [0, 25, 50, 75, 100].map(v => `<line x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}" stroke="#0000000f"/><text x="${P.l - 6}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="#888">${v}</text>`).join("");
  const tStep = Math.max(1, Math.ceil(days.length / 7)), ticks = days.filter((_, i) => i % tStep === 0 || i === days.length - 1).map(d => `<text x="${x(d)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="#888">${d.slice(5).replace("-", "/")}</text>`).join("");
  const subjLines = lines.filter(l => !scHidden[l.key]).map(l => (l.ser ? `<path d="${path(l.ser)}" fill="none" stroke="${l.col}" stroke-width="2" opacity=".55" stroke-linejoin="round"><title>${esc(sName(l.sj))}</title></path>` : "")
    + l.tests.filter(t => t.date >= days[0]).map(t => `<rect x="${x(t.date) - 5}" y="${y(Math.min(100, t.v)) - 5}" width="10" height="10" rx="2" fill="#fff" stroke="${l.col}" stroke-width="2.5"><title>${esc(sName(l.sj))} · ${esc(t.name)}: ${t.v}% (${t.date})</title></rect>`).join("")).join("");
  const ovLine = !scHidden.__ov && Object.keys(overall).length ? `<path d="${path(overall)}" fill="none" stroke="#111" stroke-width="3.5" stroke-linejoin="round"><title>${L("Overall learning score", "整体学习分数")}</title></path>` : "";
  const bLine = (f, col, dash, lab) => { const pts = brains.filter(b => b[f] != null); if (scHidden["__" + f] || !pts.length) return "";
    return (pts.length > 1 ? `<path d="${pts.map((b, i) => `${i ? "L" : "M"}${x(b.date).toFixed(1)},${y(b[f]).toFixed(1)}`).join("")}" fill="none" stroke="${col}" stroke-width="3" stroke-dasharray="${dash}"/>` : "")
      + pts.map(b => `<circle cx="${x(b.date)}" cy="${y(b[f])}" r="7" fill="${col}" stroke="#fff" stroke-width="2"><title>${lab}: ${b[f]} (${b.date})</title></circle>`).join(""); };
  const jLine = jSer && !scHidden.__journal ? `<path d="${path(jSer)}" fill="none" stroke="#0f766e" stroke-width="3" stroke-dasharray="1 0" stroke-linejoin="round"><title>${L("Journal score", "日记分数")}</title></path>` + JD.filter(j => j.date >= days[0]).map(j => `<circle cx="${x(j.date)}" cy="${y(j.score)}" r="3.5" fill="#0f766e"><title>${L("Journal", "日记")} ${j.date}: ${j.score}</title></circle>`).join("") : "";
  const svg = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">${grid}${ticks}${subjLines}${ovLine}${jLine}${bLine("brain", "#f59e0b", "2 6", L("Brain", "大脑发展"))}${bLine("think", "#e11d48", "8 6", L("Thinking (IQ-style)", "思维（类智商）"))}</svg>`;
  const chip = (key, col, lab, style = "") => `<button data-sch="${key}" style="display:inline-flex;align-items:center;gap:6px;border:1.5px solid ${scHidden[key] ? "#0002" : col};background:${scHidden[key] ? "#fff" : col + "14"};opacity:${scHidden[key] ? .5 : 1};border-radius:999px;padding:5px 10px;font:inherit;font-size:14px;cursor:pointer"><i style="width:14px;height:4px;border-radius:3px;background:${col};${style}"></i>${lab}</button>`;
  const legend = [chip("__ov", "#111", `<b>${L("Overall learning", "整体学习")}</b>`), chip("__think", "#e11d48", `🧮 ${L("Thinking (IQ-style)", "思维（类智商）")}`), chip("__brain", "#f59e0b", `🧠 ${L("Brain development", "大脑发展")}`), ...(jSer ? [chip("__journal", "#0f766e", `📝 ${L("Journal", "日记")}`)] : []), ...lines.map(l => chip(l.key, l.col, esc(sName(l.sj))))].join("");
  // correlation (paired: each brain check vs overall learning score on/just before that day)
  const ovAt = d => { const ks = Object.keys(overall).filter(x => x <= d).sort(); return ks.length ? overall[ks[ks.length - 1]] : null; };
  const pairs = brains.filter(b => b.think != null && ovAt(b.date) != null), need = 4;
  let corr;
  if (pairs.length >= need) { const r = scPearson(pairs.map(b => b.think), pairs.map(b => ovAt(b.date))), rs = r == null ? "–" : r.toFixed(2);
    const word = r == null ? "" : Math.abs(r) < .3 ? L("little or no link so far", "目前看不出明显关系") : r > 0 ? (r >= .6 ? L("a strong positive link: they rise and fall together", "强正相关：一起上升、一起下降") : L("a moderate positive link", "中等正相关")) : L("they move in opposite directions (worth a look)", "反方向变化（值得看一看）");
    corr = L(`🔗 Thinking vs overall learning, ${pairs.length} checks: r = ${rs}, ${word}. A link is not proof that one causes the other.`, `🔗 思维 vs 整体学习，${pairs.length} 次测评：r = ${rs}，${word}。相关不等于因果。`); }
  if (pairs.length >= need && jSer) { const jAt = d => { const ks = Object.keys(jSer).filter(x => x <= d).sort(); return ks.length ? jSer[ks[ks.length - 1]] : null; }, pj = brains.filter(b => b.think != null && jAt(b.date) != null);
    if (pj.length >= need) { const r2 = scPearson(pj.map(b => b.think), pj.map(b => jAt(b.date))); if (r2 != null) corr += L(` Thinking vs journal: r = ${r2.toFixed(2)}.`, ` 思维 vs 日记：r = ${r2.toFixed(2)}。`); } }
  if (pairs.length < need) corr = L(`🔗 Correlation appears after ${need} brain checks (has ${pairs.length}). ${k.id === "jonah" ? "Jonah's Brain Adventure is weekly, so about a month." : "Brain Games run every 2 weeks, so about 2 months."} Until then, read the lines by eye.`, `🔗 有 ${need} 次大脑测评后才显示相关性（现在 ${pairs.length} 次）。${k.id === "jonah" ? "Jonah 每周一次大脑冒险，大约一个月。" : "大脑游戏每 2 周一次，大约两个月。"}在那之前请直接看线条走势。`);
  const lastB = brains[brains.length - 1], prevB = brains[brains.length - 2];
  const dl = (a, b) => a == null || b == null ? "" : ` <span style="color:${a >= b ? "#16a34a" : "#dc2626"};font-weight:700">${a >= b ? "▲" : "▼"}${Math.abs(a - b)}</span>`;
  const ovNow = overall[days[days.length - 1]] ?? ovAt(days[days.length - 1]), ovWk = ovAt(daysAgo(7));
  const big = (lab, v, extra) => `<div style="flex:1;min-width:150px;background:#f8f7ff;border-radius:14px;padding:10px 14px"><div style="font-size:14px;color:#666">${lab}</div><div style="font-size:30px;font-weight:800">${v == null ? "–" : v}${extra || ""}</div></div>`;
  const cell = v => v == null ? `<td class="meta">–</td>` : `<td><b>${v}</b></td>`;
  const jPanel = () => { if (!JD.length) return k.journal_required ? `<div style="margin-top:16px"><h3 style="margin:0 0 6px">📝 ${L("Journal quality", "日记质量")}</h3><p class="meta">${L("No journal entries in the last 60 days yet.", "最近 60 天还没有日记。")}</p></div>` : "";
    const avg = a => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : null, last3 = JD.slice(-3), prev3 = JD.slice(-6, -3), last5 = JD.slice(-5), prev5 = JD.slice(-10, -5), last7 = JD.slice(-7);
    const sNow = avg(last3.map(j => j.score)), sPrev = prev3.length ? avg(prev3.map(j => j.score)) : null;
    const wAvg = avg(last7.map(j => j.words || 0)), mPer = (() => { const w = last7.reduce((a, j) => a + (j.words || 0), 0), m = last7.reduce((a, j) => a + (j.mistakes || 0), 0); return w ? (100 * m / w).toFixed(1) : null; })();
    const req = k.journal_required ? 14 : null, wrote = new Set(JD.filter(j => j.date > daysAgo(14)).map(j => j.date)).size;
    const tAvg = (arr, key) => arr.length ? arr.reduce((a, j) => a + (j.t?.[key] || 0), 0) / arr.length : null;
    const trows = Object.keys(JTRAIT).map(key => { const a = tAvg(last5, key), b = tAvg(prev5, key); return { key, a, b }; });
    const weakest = trows.filter(t => t.a != null).sort((p, q) => p.a - q.a)[0];
    const stars = v => v == null ? "–" : `<span style="color:#f59e0b;letter-spacing:1px">${"★".repeat(Math.round(v))}</span><span style="color:#0002;letter-spacing:1px">${"★".repeat(4 - Math.round(v))}</span> <span class="meta">${v.toFixed(1)}</span>`;
    return `<div style="margin-top:18px;padding-top:12px;border-top:2px solid #0000000d"><h3 style="margin:0 0 4px">📝 ${L("Journal quality", "日记质量")}</h3>
      <p class="meta" style="margin:0 0 8px">${L("Scored with the same writing coach he sees (5 traits, 1–4 stars each, tuned to his age). Parents see scores only, never the text.", "用他自己看到的写作教练打分（5 项，每项 1–4 星，按年龄调整）。家长只看到分数，看不到日记内容。")}</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap">${big(L("Journal score (last 3)", "日记分数（最近 3 篇）"), sNow, dl(sNow, sPrev))}${big(L("Avg words (last 7)", "平均字数（最近 7 篇）"), wAvg)}${big(L("Mistakes per 100 words", "每 100 字错误"), mPer)}${req ? big(L("Days written (14)", "写日记天数（14 天）"), `${wrote}/14`) : ""}</div>
      <table style="width:100%;border-collapse:collapse;font-size:15px;margin-top:10px"><tr class="meta" style="text-align:left"><th style="padding:6px 4px">${L("Writing trait", "写作能力")}</th><th>${L("Last 5 entries", "最近 5 篇")}</th><th>${L("5 before that", "再之前 5 篇")}</th></tr>
      ${trows.map(t => `<tr style="border-top:1px solid #0000000d"><td style="padding:7px 4px">${JTRAIT[t.key][zh ? 1 : 0]}</td><td>${stars(t.a)}</td><td>${t.b == null ? `<span class="meta">–</span>` : stars(t.b) + (t.a != null && Math.abs(t.a - t.b) >= .3 ? ` <span style="color:${t.a > t.b ? "#16a34a" : "#dc2626"};font-weight:700">${t.a > t.b ? "▲" : "▼"}</span>` : "")}</td></tr>`).join("")}</table>
      ${weakest ? `<p style="font-size:15px;margin:10px 0 0;padding:10px 12px;border-radius:12px;background:#ecfdf5">🎯 <b>${L("Next focus", "下一个重点")}: ${JTRAIT[weakest.key][zh ? 1 : 0]}</b> — ${JTIP[weakest.key][zh ? 1 : 0]}</p>` : ""}</div>`; };
  const table = `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:15px;margin-top:8px"><tr class="meta" style="text-align:left"><th style="padding:6px 4px">${L("Subject", "科目")}</th><th>${L("App score", "App 分数")}</th><th>${L("Accuracy (7d)", "正确率（7天）")}</th><th>${L("Skills mastered", "已掌握技能")}</th><th>${L("Test / grade", "考试 / 成绩")}</th><th>${L("Parent rating", "家长评分")}</th></tr>
    ${lines.map(l => { const ks = l.ser ? Object.keys(l.ser).sort() : [], now = ks.length ? l.ser[ks[ks.length - 1]] : null, wkK = ks.filter(d => d <= daysAgo(7)).pop(), t = l.tests[l.tests.length - 1];
      return `<tr style="border-top:1px solid #0000000d"><td style="padding:8px 4px"><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${l.col};margin-right:6px"></span><b style="font-weight:600">${esc(sName(l.sj))}</b></td>
        <td>${now == null ? "<span class=meta>–</span>" : `<b>${now}</b>${wkK ? dl(now, l.ser[wkK]) : ""}`}</td>${l.acc == null ? `<td class="meta">–</td>` : `<td>${l.acc}%</td>`}<td>${l.nSk ? `${l.mast}/${l.nSk}` : "<span class=meta>–</span>"}</td>
        <td>${t ? `<b>${t.v}%</b> <span class="meta">${t.date.slice(5)}</span>` : "<span class=meta>–</span>"}</td>${cell(l.asV)}</tr>`; }).join("")}</table></div>`;
  // quick add test / grade score
  const form = `<details style="margin-top:12px"><summary style="cursor:pointer;font-weight:700;font-size:16px">➕ ${L("Add a test or grade score", "添加考试或成绩分数")}</summary>
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px"><select id="scSub">${subs.map(sj => `<option value="${sj.id}">${esc(sName(sj))}</option>`).join("")}</select><select id="scMet"></select>
    <input id="scVal" type="number" min="0" max="120" step="0.1" placeholder="%" style="width:90px"><input id="scDate" type="date" value="${today()}" max="${today()}"><button class="btn primary" id="scSave">${L("Save", "保存")}</button><span class="meta" id="scMsg"></span></div>
    <p class="meta">${L("Use the % on the test or report card. It shows as a square on the chart in that subject's color.", "填试卷或成绩单上的百分比。会以该科目颜色的小方块显示在图上。")}</p></details>`;
  box.innerHTML = head + `
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin:10px 0">${big(L("Overall learning score", "整体学习分数"), ovNow, dl(ovNow, ovWk))}${big(`🧮 ${L("Thinking (IQ-style)", "思维（类智商）")}`, lastB?.think, dl(lastB?.think, prevB?.think))}${big(`🧠 ${L("Brain development", "大脑发展")}`, lastB?.brain, dl(lastB?.brain, prevB?.brain))}</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0">${legend}</div>${svg}
    <p style="font-size:15px;margin:8px 0;padding:10px 12px;border-radius:12px;background:#fff7ed">${corr}</p>
    <p class="meta" style="font-size:13px">${L("Lines = app score (average mastery of practiced skills, 0–100). Squares = school/test %. Dots = brain checks. All on his own scale; Thinking is a trend, not a normed IQ. Tap a chip to hide/show a line.", "线 = App 分数（已练技能的平均掌握度，0–100）。方块 = 学校/考试百分比。圆点 = 大脑测评。都是他自己的量表；思维指数看趋势，不是标准智商。点上面的标签可以隐藏/显示线条。")}</p>
    ${table}${jPanel()}${form}</div>`;
  box.querySelectorAll("[data-sck]").forEach(b => b.onclick = () => { scKid = b.dataset.sck; scoresRender(); });
  box.querySelectorAll("[data-sch]").forEach(b => b.onclick = () => { scHidden[b.dataset.sch] = !scHidden[b.dataset.sch]; scoresRender(); });
  const fillMet = () => { const sid = $("#scSub").value, ms = pctMetrics(sid); $("#scMet").innerHTML = ms.map(m => `<option value="${esc(m.id)}">${esc(zh && m.name_zh ? m.name_zh : m.name)}</option>`).join("") + `<option value="__new">${L("Test score", "考试分数")}</option>`; };
  if ($("#scSub")) { fillMet(); $("#scSub").onchange = fillMet;
    $("#scSave").onclick = async () => { const v = parseFloat($("#scVal").value), d = $("#scDate").value || today(), sid = $("#scSub").value; let mid = $("#scMet").value;
      if (isNaN(v) || v < 0 || v > 120) { $("#scMsg").textContent = L("Enter a % between 0 and 120.", "请输入 0–120 的百分比。"); return; }
      try { if (mid === "__new") { mid = `${k.id}-tests-${sid.slice(0, 8)}`; if (!(S.metrics || []).some(m => m.id === mid)) { const sj = subs.find(x => x.id === sid); const { error } = await sb.from("metrics").insert({ id: mid, kid: k.id, type: "level", name: `${sj ? sj.name : "Subject"} test scores`, name_zh: `${sj ? (sj.name_zh || sj.name) : "科目"}考试分数`, unit: "%", subject_id: sid, parent_only: true }); if (error) throw error; } }
        const { error } = await sb.from("readings").upsert({ metric: mid, kid: k.id, date: d, value: v }); if (error) throw error;
        $("#scMsg").textContent = "✓"; await refresh(); } catch (e) { $("#scMsg").textContent = "⚠️ " + e.message; } };
  }
}

/* ---------------- 🧠 BRAIN DEVELOPMENT (2026-11-26) ----------------
   8 skills per boy from 3 separate sources (Brain Check, app signals, monthly home rating) + foundations (sleep, exercise, outdoor).
   Each boy is shown on his own tab and compared ONLY with his own past. Not a clinical test. */
const BRAIN_D = ["wm", "attn", "inhib", "flex", "speed", "reason", "plan", "emo"];
const BRAIN_N = { wm: ["🧠 Working memory", "🧠 工作记忆"], attn: ["🎯 Focus", "🎯 专注力"], inhib: ["🛑 Impulse control", "🛑 自控力"], flex: ["🔀 Flexible thinking", "🔀 灵活思维"], speed: ["⚡ Processing speed", "⚡ 反应速度"], reason: ["🧩 Reasoning", "🧩 推理"], plan: ["🗺️ Planning & follow-through", "🗺️ 计划与执行"], emo: ["💛 Emotions & social", "💛 情绪与社交"], verbal: ["🗣️ Word smarts", "🗣️ 语言"], number: ["🔢 Number patterns", "🔢 数字规律"] };
const HOME_Q = { wm: ["Remembers 2–3 step instructions without reminders", "不用提醒就能记住 2–3 步的指令"], attn: ["Stays with a task he doesn't love (10+ min; Jonah 5+)", "能坚持做不太喜欢的事（10 分钟以上；Jonah 5 分钟）"], inhib: ["Stops and thinks before acting or blurting out", "做事或说话前会先停下来想一想"], flex: ["Handles changes in plans calmly", "计划改变时能平静接受"], speed: ["Gets everyday tasks done at a reasonable pace", "日常事情能按合理速度完成"], reason: ["Figures out new problems or puzzles on his own", "能自己想办法解决新问题或谜题"], plan: ["Plans ahead and finishes what he starts", "会提前计划，并把开始的事做完"], emo: ["Calms down and bounces back after frustration", "受挫后能平静下来并恢复"] };
const HOME_A = [["Rarely", "很少"], ["Sometimes", "有时"], ["Often", "经常"], ["Usually", "通常"], ["Almost always", "几乎总是"]];
let brainKid = null;
const bName = d => (BRAIN_N[d] || [d, d])[lang === "zh" ? 1 : 0];
const monthStart = (d = today()) => d.slice(0, 8) + "01";
const sleepNeed = age => (age <= 5 ? [10, 13] : age <= 12 ? [9, 12] : [8, 10]);
function bSpark(vals, w = 110, h = 26) { const v = vals.filter(x => x != null); if (v.length < 2) return ""; const xs = vals.map((_, i) => 4 + i * (w - 8) / Math.max(1, vals.length - 1));
  const pts = vals.map((x, i) => x == null ? null : `${xs[i].toFixed(1)},${(h - 3 - (x / 100) * (h - 6)).toFixed(1)}`).filter(Boolean).join(" ");
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="vertical-align:middle"><polyline points="${pts}" fill="none" stroke="var(--brand,#6d4aff)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/></svg>`; }
function bCell(v, delta, note) { if (v == null) return `<td class="meta">–</td>`;
  const col = v >= 70 ? "#16a34a" : v >= 45 ? "#ca8a04" : "#dc2626";
  return `<td><div style="display:flex;align-items:center;gap:6px"><b style="min-width:28px">${v}</b><span style="flex:1;max-width:70px;height:8px;border-radius:9px;background:#0001;overflow:hidden"><i style="display:block;height:100%;width:${v}%;background:${col}"></i></span>${delta != null && Math.abs(delta) >= 3 ? `<span style="color:${delta > 0 ? "#16a34a" : "#dc2626"};font-weight:700">${delta > 0 ? "▲" : "▼"}${Math.abs(delta)}</span>` : ""}</div>${note ? `<div class="meta" style="font-size:12px">${note}</div>` : ""}</td>`; }
function bSigNote(d, src, r) { const zh = lang === "zh"; if (!r) return "";
  if (src === "games") return (zh ? "大脑乐园等级 " : "Brain Park level ") + Object.entries(r).map(([g, l]) => `${g} ${l}`).join(", ");
  return { inhib: zh ? `急躁错题 ${r.rushed_mistakes}/${r.answers}（8 秒内答错）` : `${r.rushed_mistakes} rushed mistakes / ${r.answers} answers (wrong in <8 s)`,
    attn: zh ? `专注 ${r.active_min} 分钟，屏幕前发呆 ${r.onscreen_idle_min} 分钟` : `${r.active_min} min active, ${r.onscreen_idle_min} min idle on screen`,
    wm: zh ? `重复错误 ${r.repeat_mistakes} 次 / ${r.answers} 题` : `${r.repeat_mistakes} repeated mistakes / ${r.answers} answers`,
    plan: zh ? `日记 ${r.journal_days}/${r.of} 天` : `journal ${r.journal_days}/${r.of} days`,
    emo: zh ? `心情均值 ${r.mood_avg}/5（${r.days} 天）` : `mood avg ${r.mood_avg}/5 (${r.days} days)` }[d] || ""; }
function viewBrain() {
  const zh = lang === "zh", L = (en, z) => zh ? z : en;
  if (!brainKid || !S.kids.some(k => k.id === brainKid)) brainKid = S.kids[0]?.id;
  const k = S.kids.find(x => x.id === brainKid) || {}, age = +k.age || 10;
  // sources
  const checks = brainChecksOf(k.id), lastC = checks[checks.length - 1], prevC = checks[checks.length - 2];
  const sig = (S.brain_signals || []).filter(x => x.kid === k.id);
  const sigLatest = (d, src) => sig.filter(x => x.domain === d && x.source === src).sort((a, b) => a.date.localeCompare(b.date));
  const hr = (S.home_ratings || []).filter(x => x.kid === k.id).sort((a, b) => a.month.localeCompare(b.month));
  const hrMonths = [...new Set(hr.map(x => x.month))]; const hrAvg = m => { const rows = hr.filter(x => x.month === m); if (!rows.length) return null; const o = {}; BRAIN_D.forEach(d => { const v = rows.map(x => +x.answers[d]).filter(Boolean); if (v.length) o[d] = Math.round((v.reduce((a, b) => a + b, 0) / v.length - 1) / 4 * 100); }); return o; };
  const hrNow = hrMonths.length ? hrAvg(hrMonths[hrMonths.length - 1]) : null, hrPrev = hrMonths.length > 1 ? hrAvg(hrMonths[hrMonths.length - 2]) : null;
  const doms = [...BRAIN_D, ...(checks.some(c => c.scores.verbal != null || c.scores.number != null) ? ["verbal", "number"] : [])];
  const tiC = checks.filter(c => c.scores.thinking != null), tiL = tiC[tiC.length - 1], tiP = tiC[tiC.length - 2];
  const tiHtml = tiL ? `<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:8px 0 4px;padding:10px 12px;border-radius:12px;background:#f3f0ff"><div><div class="meta">🧮 ${L("Thinking index (parents only)", "思维指数（仅家长可见）")}</div><b style="font-size:26px">${tiL.scores.thinking}</b>${tiP ? ` <span style="color:${tiL.scores.thinking >= tiP.scores.thinking ? "#16a34a" : "#dc2626"};font-weight:700">${tiL.scores.thinking >= tiP.scores.thinking ? "▲" : "▼"}${Math.abs(tiL.scores.thinking - tiP.scores.thinking)}</span>` : ""}</div>${bSpark(tiC.map(c => c.scores.thinking), 150, 30)}
      <div class="meta" style="flex:1;min-width:220px">${L("Average of the IQ-style parts: reasoning, word smarts, number patterns, memory and speed (0–100 on his own scale). A trend for him only, not a normed IQ score; a real IQ needs a psychologist-given test like the WISC-V.", "IQ 类部分的平均：推理、语言、数字规律、记忆、速度（按他自己的 0–100 量表）。只看他自己的趋势，不是标准化智商；真正的智商需要心理学家施测的 WISC-V 等测验。")}</div></div>` : "";
  const rows = doms.map(d => {
    const cV = lastC ? lastC.scores[d] : null, cD = cV != null && prevC && prevC.scores[d] != null ? cV - prevC.scores[d] : null, cS = bSpark(checks.map(c => c.scores[d] ?? null));
    const srcs = ["apps", "games"].map(src => { const a = sigLatest(d, src); if (!a.length) return null; const l = a[a.length - 1], back = a.filter(x => x.date <= addDays(l.date, -14)).pop(); return { src, v: l.score, dl: back ? l.score - back.score : null, note: bSigNote(d, src, l.raw) }; }).filter(Boolean);
    const sCell = srcs.length ? srcs.map(x => bCell(x.v, x.dl, x.note).replace(/^<td>|<\/td>$/g, "")).join('<div style="height:6px"></div>') : null;
    return `<tr style="border-top:1px dashed #0002"><td><b>${bName(d)}</b></td>${bCell(cV, cD, cS)}${sCell ? `<td>${sCell}</td>` : `<td class="meta">–</td>`}${bCell(hrNow ? hrNow[d] : null, hrNow && hrPrev && hrPrev[d] != null && hrNow[d] != null ? hrNow[d] - hrPrev[d] : null)}</tr>`; }).join("");
  // foundations
  const bl = (S.body_log || []).filter(x => x.kid === k.id), last7 = bl.filter(x => x.date > daysAgo(7)), last30 = bl.filter(x => x.date > daysAgo(30));
  const avg = (a, f) => { const v = a.map(f).filter(x => x != null && !isNaN(x)); return v.length ? Math.round(v.reduce((s, x) => s + x, 0) / v.length) : null; };
  const sl = avg(last7, x => x.sleep_min), ex = avg(last7, x => x.exercise_min), od = avg(last7, x => x.outdoor_min), need = sleepNeed(age);
  const bedMins = last7.map(x => x.bedtime ? ((+x.bedtime.slice(0, 2) + 12) % 24) * 60 + +x.bedtime.slice(3, 5) : null).filter(x => x != null);
  const bedSpread = bedMins.length > 2 ? Math.round(Math.sqrt(bedMins.reduce((s, x) => s + (x - bedMins.reduce((a, b) => a + b, 0) / bedMins.length) ** 2, 0) / bedMins.length)) : null;
  const hm = m => m == null ? "–" : `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
  const slOk = sl == null ? null : sl >= need[0] * 60 && sl <= need[1] * 60;
  // standouts
  const notes = [];
  doms.forEach(d => { const a = sigLatest(d, "apps"); if (a.length > 1) { const l = a[a.length - 1], b = a.filter(x => x.date <= addDays(l.date, -14)).pop(); if (b && l.score - b.score <= -10) notes.push(L(`${bName(d)} app signal dropped ${b.score} → ${l.score} in 2 weeks.`, `${bName(d)} 应用信号两周内从 ${b.score} 降到 ${l.score}。`)); } });
  if (lastC && prevC) doms.forEach(d => { const a = prevC.scores[d], b = lastC.scores[d]; if (a != null && b != null && Math.abs(b - a) >= 15) notes.push(L(`${bName(d)} in Brain Games: ${a} → ${b}.`, `大脑游戏 ${bName(d)}：${a} → ${b}。`)); });
  if (sl != null && !slOk) notes.push(L(`Sleep averaged ${hm(sl)} last week; age ${age} needs about ${need[0]}–${need[1]} h.`, `上周平均睡眠 ${hm(sl)}；${age} 岁约需 ${need[0]}–${need[1]} 小时。`));
  if (ex != null && ex < 60) notes.push(L(`Exercise averaged ${ex} min/day; kids need about 60 min a day.`, `每天平均运动 ${ex} 分钟；孩子每天约需 60 分钟。`));
  const due = brainDue(k.id);
  const myRating = hr.find(x => x.month === monthStart() && x.rated_by === (S.me?.email || ""));
  // daily log rows for all boys
  const dl = window._brainLogDate || today();
  const logRow = kk => { const b = (S.body_log || []).find(x => x.kid === kk.id && x.date === dl) || {};
    return `<tr data-blkid="${esc(kk.id)}"><td><b>${esc(kidName(kk.id))}</b></td><td><input type="time" class="bl-bed" value="${b.bedtime ? b.bedtime.slice(0, 5) : ""}" style="width:110px"></td><td><input type="time" class="bl-wake" value="${b.wake ? b.wake.slice(0, 5) : ""}" style="width:110px"></td><td><input type="number" min="0" max="600" class="bl-ex" value="${b.exercise_min ?? ""}" style="width:76px"></td><td><input type="number" min="0" max="900" class="bl-out" value="${b.outdoor_min ?? ""}" style="width:76px"></td><td class="meta bl-sl">${b.sleep_min ? hm(b.sleep_min) : ""}</td></tr>`; };
  $("#view").innerHTML = `
    <div class="card"><h2 style="margin:0 0 6px">🧠 ${L("Brain development", "大脑发育")}</h2>
      <p class="meta">${L("Eight brain skills, each from up to three separate sources. Every boy is compared only with his own past, never with his brothers. Trends need 3+ points; this is not a clinical test.", "八项大脑能力，最多来自三个独立来源。每个孩子只和自己的过去比，绝不和兄弟比较。趋势需要 3 个以上数据点；这不是临床测试。")}</p>
      <div class="tabs" style="margin-top:8px">${S.kids.map(x => `<button data-bk="${esc(x.id)}" class="${x.id === k.id ? "on" : ""}">${esc(kidName(x.id))}</button>`).join("")}</div></div>
    <div class="card"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><h3 style="margin:0">📝 ${L("Daily log: sleep & activity", "每日记录：睡眠和运动")}</h3><input type="date" id="blDate" value="${dl}" max="${today()}"></div>
      <p class="meta">${L("Sleep = the night before this morning. Exercise = active play or sport; outdoor = time outside. Minutes.", "睡眠 = 当天早上之前的那一晚。运动 = 运动或活跃游戏；户外 = 在外面的时间。单位：分钟。")}</p>
      <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse"><tr class="meta" style="text-align:left"><th></th><th>${L("Bedtime", "上床")}</th><th>${L("Woke", "起床")}</th><th>${L("Exercise", "运动")}</th><th>${L("Outdoor", "户外")}</th><th>${L("Slept", "睡了")}</th></tr>${S.kids.map(logRow).join("")}</table></div>
      <div class="row" style="margin-top:8px"><button class="btn primary" id="blSave">${L("Save log", "保存记录")}</button><span class="meta" id="blMsg"></span></div></div>
    <div class="card"><h3 style="margin:0 0 4px">${esc(kidName(k.id))} · ${L("skills", "能力")}</h3>
      <p class="meta">${lastC ? L(`Last Brain Games ${lastC.date}${lastC.source === "brainpark" ? " (Brain Park)" : ""} · ${checks.length} so far`, `最近一次大脑游戏 ${lastC.date}${lastC.source === "brainpark" ? "（大脑乐园）" : ""} · 共 ${checks.length} 次`) : L("No Brain Games yet.", "还没有大脑游戏记录。")}
      ${due ? (due.due ? L(" · next one is ready on his page", " · 下一次已在他的页面上") : L(` · next in ${due.days} days`, ` · ${due.days} 天后下一次`)) : k.id === "jonah" ? L(" · Jonah's check lives in Brain Park (weekly, optional)", " · Jonah 的小测在大脑乐园（每周，可选）") : ""}</p>
      ${tiHtml}<p class="meta">${L("The boys see this only as a points game with personal high scores; skill names and these numbers are never shown to them.", "孩子们只看到一个有个人最高分的积分游戏；能力名称和这些数字不会显示给他们。")}</p>
      <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:6px"><tr class="meta" style="text-align:left"><th>${L("Skill", "能力")}</th><th>🎮 ${L("Brain Games (hidden check)", "大脑游戏（隐性测评）")}</th><th>📱 ${L("App & game signals (14 days)", "应用和游戏信号（14 天）")}</th><th>🏠 ${L("Home rating", "家长评分")}</th></tr>${rows}</table></div>
      <p class="meta" style="margin-top:8px">${L("▲/▼ = change vs his previous check / 2 weeks earlier / last month. Green 70+, amber 45–69, red under 45 (on his own scale).", "▲/▼ = 与上次小测 / 两周前 / 上个月相比。绿色 70+，黄色 45–69，红色 45 以下（按他自己的量表）。")}</p></div>
    <div class="card"><h3 style="margin:0 0 6px">🌱 ${L("Foundations (last 7 days)", "基础（最近 7 天）")}</h3>
      <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px">
        <div><div class="meta">😴 ${L("Sleep / night", "每晚睡眠")}</div><b style="font-size:22px;color:${slOk == null ? "inherit" : slOk ? "#16a34a" : "#dc2626"}">${hm(sl)}</b><div class="meta">${L(`needs ${need[0]}–${need[1]} h at ${age}`, `${age} 岁需 ${need[0]}–${need[1]} 小时`)}${bedSpread != null ? L(` · bedtime varies ±${bedSpread} min`, ` · 上床时间浮动 ±${bedSpread} 分钟`) : ""}</div>${bSpark(last30.map(x => x.sleep_min ? Math.min(100, x.sleep_min / (need[1] * 60) * 100) : null), 150, 26)}</div>
        <div><div class="meta">🏃 ${L("Exercise / day", "每天运动")}</div><b style="font-size:22px;color:${ex == null ? "inherit" : ex >= 60 ? "#16a34a" : "#ca8a04"}">${ex == null ? "–" : ex + " min"}</b><div class="meta">${L("goal: 60 min a day", "目标：每天 60 分钟")}</div></div>
        <div><div class="meta">🌳 ${L("Outdoor / day", "每天户外")}</div><b style="font-size:22px">${od == null ? "–" : od + " min"}</b><div class="meta">${L(`${last7.length}/7 days logged`, `已记录 ${last7.length}/7 天`)}</div></div>
      </div></div>
    ${notes.length ? `<div class="card"><h3 style="margin:0 0 6px">👀 ${L("What stands out", "值得注意")}</h3><ul style="margin:0;padding-left:18px">${notes.map(n => `<li>${esc(n)}</li>`).join("")}</ul></div>` : ""}
    <div class="card"><h3 style="margin:0 0 6px">🏠 ${L(`Monthly home rating · ${today().slice(0, 7)}`, `每月家长评分 · ${today().slice(0, 7)}`)}</h3>
      <p class="meta">${L(`How often did you see this in ${esc(kidName(k.id))} this month? Each parent can rate; answers are averaged.`, `这个月你多常看到 ${esc(kidName(k.id))} 这样？每位家长都可以评分，取平均。`)}${myRating ? L(" You've rated this month; you can update it.", " 你本月已评分，可以修改。") : ""}</p>
      ${BRAIN_D.map(d => `<div style="margin:8px 0"><div><b>${bName(d)}</b> · ${esc(HOME_Q[d][zh ? 1 : 0])}</div><div class="row" style="gap:6px;margin-top:4px">${HOME_A.map((a, i) => `<label style="display:inline-flex;gap:4px;align-items:center;padding:4px 8px;border:1.5px solid #0003;border-radius:10px;cursor:pointer"><input type="radio" name="hr-${d}" value="${i + 1}" ${myRating && +myRating.answers[d] === i + 1 ? "checked" : ""}>${a[zh ? 1 : 0]}</label>`).join("")}</div></div>`).join("")}
      <textarea id="hrNote" placeholder="${L("Optional note (what you noticed)", "可选：你注意到的事")}" style="width:100%;margin-top:8px">${esc(myRating?.note || "")}</textarea>
      <div class="row"><button class="btn primary" id="hrSave">${L("Save rating", "保存评分")}</button><span class="meta" id="hrMsg"></span></div>
      ${hrMonths.length ? `<p class="meta" style="margin-top:8px">${L("Past months", "以往月份")}: ${hrMonths.map(m => m.slice(0, 7)).join(" · ")}</p>` : ""}</div>`;
  document.querySelectorAll("[data-bk]").forEach(b => b.onclick = () => { brainKid = b.dataset.bk; viewBrain(); });
  $("#blDate").onchange = e => { window._brainLogDate = e.target.value; viewBrain(); };
  $("#blSave").onclick = async () => {
    const out = []; document.querySelectorAll("[data-blkid]").forEach(tr => { const bed = tr.querySelector(".bl-bed").value, wake = tr.querySelector(".bl-wake").value, exv = tr.querySelector(".bl-ex").value, ov = tr.querySelector(".bl-out").value;
      if (!bed && !wake && exv === "" && ov === "") return;
      let sm = null; if (bed && wake) { const b = +bed.slice(0, 2) * 60 + +bed.slice(3), w = +wake.slice(0, 2) * 60 + +wake.slice(3); sm = (w - b + 1440) % 1440; if (sm < 180 || sm > 900) sm = null; }
      out.push({ kid: tr.dataset.blkid, date: dl, bedtime: bed || null, wake: wake || null, sleep_min: sm, exercise_min: exv === "" ? null : +exv, outdoor_min: ov === "" ? null : +ov, updated_by: S.me?.email || null, updated_at: new Date().toISOString() }); });
    if (!out.length) { $("#blMsg").textContent = L("Nothing to save yet.", "还没有内容。"); return; }
    const { error } = await sb.from("body_log").upsert(out); if (error) { $("#blMsg").textContent = "⚠️ " + error.message; return; }
    out.forEach(o => { S.body_log = (S.body_log || []).filter(x => !(x.kid === o.kid && x.date === o.date)); S.body_log.push(o); }); viewBrain(); setStatus("✓");
  };
  $("#hrSave").onclick = async () => {
    const ans = {}; BRAIN_D.forEach(d => { const c = document.querySelector(`input[name="hr-${d}"]:checked`); if (c) ans[d] = +c.value; });
    if (Object.keys(ans).length < BRAIN_D.length) { $("#hrMsg").textContent = L("Please answer all 8.", "请回答全部 8 题。"); return; }
    const row = { kid: k.id, month: monthStart(), rated_by: S.me?.email || "parent", answers: ans, note: $("#hrNote").value.trim() || null };
    const { error } = await sb.from("home_ratings").upsert(row); if (error) { $("#hrMsg").textContent = "⚠️ " + error.message; return; }
    S.home_ratings = (S.home_ratings || []).filter(x => !(x.kid === row.kid && x.month === row.month && x.rated_by === row.rated_by)); S.home_ratings.push(row); viewBrain(); setStatus("✓");
  };
}

/* ---------------- TODAY ---------------- */
function viewToday() {
  const d = today();
  $("#view").innerHTML = `<div class="headline">${T().heroHtml}</div>${heroPills()}<div class="hero">
      <button class="herobtn" style="background:var(--lime)" id="goKids">🧒 ${T().kidsTapIn}<small>${T().kidsTapInSub}</small></button>
      <button class="herobtn" style="background:var(--pink)" id="goQuick">⚡ ${T().parentCheckin}<small>${T().parentCheckinSub}</small></button>
    </div>
    ${(() => { const w = (S.redemptions || []).filter(r => r.status === "requested"); return w.length ? `<a class="reqbanner" href="#rewards">🎁 <b>${lang === "zh" ? `${w.length} 个奖励兑换等你确认` : `${w.length} reward request${w.length > 1 ? "s" : ""} waiting for you`}</b><span>${w.slice(0, 3).map(r => `${esc(kidName(r.kid))}: ${esc(r.title)}`).join(" · ")}</span><em>→</em></a>` : ""; })()}
    <div class="section-h"><h3>${T().todayStatus} · ${fmtDate(d)}</h3><button class="btn sm" id="goLog">${T().logEntry}</button></div>
    <div class="todayrow">${S.kids.map((k, i) => { const c = S.checkins.find(c => c.kid === k.id && c.date === d) || {};
      const habits = S.metrics.filter(m => m.kid === k.id && m.type === "rate").map(m => { const r = S.readings.find(r => r.metric === m.id && r.date === d); return r && +r.value ? mKidLabel(m) : null; }).filter(Boolean);
      return `<div class="tcard" style="border-top:4px solid ${KC[i % 3]};display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center"><span style="width:52px;height:52px;border-radius:14px;background:#fff;display:grid;place-items:center">${avatarHtml(k.avatar, 46)}</span><div><b>${esc(kidName(k.id))}</b>
        <div class="meta">${c.kid_mood ? `${T().heSaid} ${FACES[c.kid_mood - 1]}` : T().notYet} · ${c.focus ? `${T().parentRated} ✓` : `${T().parentRated} —`}</div>
        ${habits.length ? `<div class="meta">${esc(habits.join(" · "))}</div>` : ""}${(() => { const q = ptsOf(k.id), td = (S.point_ledger || []).filter(r => r.kid === k.id && r.date === d && r.source !== "spend").reduce((a, r) => a + r.points, 0); return `<div class="meta">⭐ ${lang === "zh" ? `今天 +${td} · 可用 ${q.balance}` : `+${td} today · ${q.balance} to spend`}</div>`; })()}${(() => { const w7 = addDays(today(), -6), nf = (S.jreplies || []).filter(r => r.kid === k.id && r.flag && String(r.created_at).slice(0, 10) >= w7).length; return nf ? `<div class="meta jbflag" style="margin-top:6px">⚠️ ${lang === "zh" ? `Buddy 提醒：有 ${nf} 篇日记值得看看（家庭 → 日记）` : `Buddy flagged ${nf} journal entr${nf > 1 ? "ies" : "y"} for you (Family → Journals)`}</div>` : ""; })()}<button class="btn sm" style="margin-top:8px" data-pv="${esc(k.id)}">👀 ${T().viewHisPage}</button></div></div>`; }).join("")}</div>
    <div class="section-h" style="margin-top:22px"><h3>📖 ${lang === "zh" ? "Abby 的英语学习" : "Abby's English"}</h3><a class="btn sm" href="abby/" target="_blank" rel="noopener">${lang === "zh" ? "打开 →" : "Open →"}</a></div><div class="tcard" id="abbyCard"><span class="meta">…</span></div>
    <div class="section-h" style="margin-top:22px"><h3>📅 ${CL().upcoming}</h3><a class="btn sm" href="#calendar">${CL().h} →</a></div><div class="tcard">${calUpcoming("all", 14, true)}</div>${marquee()}`;
  $("#goKids").onclick = openKidMode; $("#goQuick").onclick = openQuick; $("#goLog").onclick = () => openEntry();
  fillAbbyCard();
}
// 📖 Abby's English summary on the parent Today page (reads learner_saves; quiet if not set up yet)
async function fillAbbyCard() {
  const el = $("#abbyCard"); if (!el) return; const zh = lang === "zh";
  let rows = null; try { const { data, error } = await sb.from("learner_saves").select("email,data,updated_at"); if (error) throw error; rows = data || []; } catch (e) { rows = null; }
  if (!el.isConnected) return;
  if (rows === null) { el.innerHTML = `<span class="meta">${zh ? "云端进度还没开通：需要运行 supabase/sql/2026-11-23_learner_abby.sql，然后在 Family 页面给 Abby 设 PIN。" : "Cloud progress isn't on yet: run supabase/sql/2026-11-23_learner_abby.sql, then set Abby's PIN on the Family page."}</span>`; return; }
  if (!rows.length) { el.innerHTML = `<span class="meta">${zh ? "还没有进度。Abby 用名字 abby 和 PIN 登录后，这里会显示她的学习情况。" : "No progress yet. Once Abby signs in (name abby + PIN), her practice shows here."}</span>`; return; }
  const d0 = today(), addD = n => { const x = new Date(d0 + "T12:00:00"); x.setDate(x.getDate() + n); return x.toLocaleDateString("en-CA"); };
  el.innerHTML = rows.map(r => { const s = r.data || {}, w = Object.values(s.words || {}), kn = w.filter(x => x.b >= 2).length, goal = (s.profile && s.profile.mins) || 15;
    const mins = [...Array(7)].map((_, i) => Math.round(((s.sec || {})[addD(i - 6)] || 0) / 60)), todayM = mins[6], hit = mins.filter(m => m >= goal).length;
    const alive = s.last === d0 || s.last === addD(-1) || s.last === addD(-2);
    const status = !s.last ? "⚪" : s.last === d0 ? "🟢" : alive ? "🟡" : "🔴";
    return `<div style="display:grid;gap:4px"><div><b>${status} ${esc((s.profile && s.profile.name) || "Abby")}</b> <span class="meta">${zh ? "今天" : "today"} ${todayM}/${goal} min · ${zh ? "连续" : "streak"} ${alive ? (+s.streak || 0) : 0} · ${zh ? "上次" : "last"} ${esc(s.last || "—")}</span></div>
      <div class="meta">${zh ? "已会单词" : "Words known"} <b>${kn}</b> · ${zh ? "在学" : "learning"} ${w.length - kn} · ${zh ? "我的句子" : "my phrases"} ${(s.custom || []).filter(x => x.topic === "mine").length} · ${zh ? "错题本" : "fix list"} ${(s.custom || []).filter(x => x.topic === "fix").length} · ${zh ? "语法点" : "grammar points"} ${Object.values(s.gram || {}).filter(g => g.b >= 1).length}/20</div>
      <div class="meta">${zh ? "近 7 天分钟" : "Minutes, last 7 days"}: ${mins.join(" · ")} (${zh ? `${hit} 天达标` : `goal met ${hit} day${hit === 1 ? "" : "s"}`})</div>
      ${(() => { const f = (s.fb || []).slice(-1)[0]; if (!f) return ""; const L = { easy: zh ? "太简单" : "too easy", ok: zh ? "刚好" : "just right", hard: zh ? "太难" : "too hard" }; return `<div class="meta">💬 ${zh ? "她的反馈" : "Her feedback"} ${esc(f.d)}: ${esc(L[f.level] || "—")}${(f.best || []).length ? ` · ${zh ? "最有帮助" : "helped most"}: ${esc(f.best.join(", "))}` : ""}${f.note ? ` · “${esc(f.note)}”` : ""}</div>`; })()}</div>`; }).join("");
}

/* ---------------- KID MODE ---------------- */
const kidSt = { kid: null, mood: null, counts: {} };
function openKidMode() { $("#kidMode").classList.add("open"); kidStage("who"); }
function kidStage(step) {
  const el = $("#kidStage"), d = today();
  if (step === "who") {
    el.innerHTML = `<h2>${T().whoChecking}</h2><div class="bigkids">${S.kids.map((k, i) => { const done = S.checkins.find(c => c.kid === k.id && c.date === d && c.kid_mood); return `<button class="bigkid" style="background:${KC[i % 3]}" data-kid="${esc(k.id)}"><span style="display:block;height:84px">${avatarHtml(k.avatar || "⭐", 84)}</span>${esc(kidName(k.id))}<small>${done ? T().doneToday : T().tapMe}</small></button>`; }).join("")}</div>`;
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
        el.innerHTML = `<div class="thanks">🎉</div><h2>${T().thanks(esc(kidName(kidSt.kid)))}</h2>`; confetti();
        setTimeout(() => kidStage("who"), 1600);
      } catch (err) { el.innerHTML = `<h2>${T().cantSave}</h2>`; setTimeout(() => kidStage("who"), 2500); }
    })();
  }
}

/* ---------------- BEHAVIOR TRACKER (Eric first) ----------------
   Parent taps 4 target behaviors in the daily quick check-in (✅ 2 · 〰 1 · ✗ 0), saved in checkins.traits.
   The dashboard panel adds what the apps measure on their own (pace vs accuracy) and his habit taps — no extra typing. */
const TRAITS = { eric: [
  ["mem", "🎒 Remembered his things & chores", "🎒 记得自己的东西和家务"],
  ["finish", "✅ Finished what he started (didn't drop it for a new thing)", "✅ 做完手头的事（没被新事打断就忘）"],
  ["pause", "⏸️ Paused before acting or asking", "⏸️ 行动或提问前先停一下"],
  ["conseq", "🔮 Thought about consequences first", "🔮 先想后果再做"] ] };
// Eric rates himself in his daily tap-in (first-person wording); parents don't rate (Bobby, 11/21). Parent rows stay off.
const PARENT_TRAITS = false;
const KID_TRAITS = { eric: [
  ["mem", "🎒 I remembered my stuff and my chores", "🎒 我记得自己的东西和家务"],
  ["finish", "✅ I finished what I started", "✅ 我把开始的事做完了"],
  ["pause", "⏸️ I stopped and thought before doing or asking", "⏸️ 做事或提问前我先停下来想了想"],
  ["conseq", "🔮 I thought about what could happen first", "🔮 我先想了会发生什么"] ] };
const TRAIT_HABITS = { eric: ["eric-planner", "eric-chunk", "eric-launchpad", "eric-lookback"] };
function behaviorPanel(kid) {
  const tr = TRAITS[kid]; if (!tr) return "";
  const zh = lang === "zh", days = []; for (let i = 13; i >= 0; i--) days.push(daysAgo(i));
  const ck = d => { const c = S.checkins.find(c => c.kid === kid && c.date === d) || {}; return c.kid_traits || (PARENT_TRAITS ? c.traits : null) || {}; };
  const pct = (key, from, to) => { const v = days.slice(from, to).map(d => ck(d)[key]).filter(x => x === 0 || x === 1 || x === 2); return v.length ? { p: Math.round(50 * v.reduce((a, b) => a + b, 0) / v.length), n: v.length } : null; };
  const dot = v => `<span title="${v ?? "—"}" style="display:inline-block;width:11px;height:11px;border-radius:3px;margin-right:2px;background:${v === 2 ? "var(--pos)" : v === 1 ? "#e8b84a" : v === 0 ? "var(--neg)" : "var(--line)"}"></span>`;
  const rows = tr.map(([key, en, z]) => { const now = pct(key, 7, 14), was = pct(key, 0, 7), arrow = now && was ? (now.p > was.p + 5 ? " ↑" : now.p < was.p - 5 ? " ↓" : " →") : "";
    return `<div style="display:grid;grid-template-columns:1fr auto;gap:4px 10px;align-items:center;margin:6px 0"><span style="font-size:13.5px">${zh ? z : en}</span><b style="font-size:13px">${now ? now.p + "%" + arrow : "—"}</b><span>${days.map(d => dot(ck(d)[key])).join("")}</span><span></span></div>`; }).join("");
  // pace vs accuracy from the apps (learn_days), last 7 days
  const ld = (S.learn_days || []).filter(x => x.kid === kid && x.date >= daysAgo(6) && x.attempts >= 5), apps = {};
  ld.forEach(x => { const a = apps[x.app] = apps[x.app] || { n: 0, ok: 0, med: [] }; a.n += x.attempts; a.ok += x.correct; if (x.median_secs) a.med.push(+x.median_secs); });
  const AN = { amc: "AMC 8", quest: "Realm of Forces", physics: "Physics", review: "Look Back", fencing: "Fencing", space: "Space Quest", brain: "Brain Park" };
  const pace = Object.entries(apps).map(([k, a]) => { const m = a.med.length ? a.med.reduce((x, y) => x + y, 0) / a.med.length : null, acc = Math.round(100 * a.ok / a.n), rush = m != null && m < 12 && acc < 70;
    return `<span class="chip" style="${rush ? "background:#fde8d6" : ""}">${AN[k] || k}: <b>${m == null ? "?" : Math.round(m) + "s"}</b> · ${acc}%${rush ? (zh ? " ⚡太快" : " ⚡rushing") : ""}</span>`; }).join("");
  const w1 = mondayISO(), hab = (TRAIT_HABITS[kid] || []).map(id => S.metrics.find(m => m.id === id)).filter(Boolean).map(m => { const c = S.readings.filter(r => r.metric === m.id && r.date >= w1).reduce((s, r) => s + (+r.value || 0), 0); return `<span class="chip">${esc(mKidLabel(m))} <b>${c}/${m.per_week || 1}</b></span>`; }).join("");
  const mm = S.metrics.find(m => m.id === `${kid}-missing`), mr = mm ? S.readings.filter(r => r.metric === mm.id).sort((a, b) => b.date.localeCompare(a.date))[0] : null;
  const rated = days.filter(d => Object.keys(ck(d)).length).length;
  return `<div class="goals"><h4>🧭 ${zh ? "行为追踪 · 14天" : "Behavior tracker · 14 days"}</h4>
    <div class="meta" style="margin:-4px 0 4px">${zh ? `${esc(kidName(kid))} 每天打卡时给自己打分（😀 做到了 · 😐 有一点 · 😕 今天没有）。已记录 ${rated}/14 天。百分比 = 最近7天。` : `${esc(kidName(kid))} rates himself each day when he taps in (😀 yes · 😐 sort of · 😕 not today). Rated ${rated}/14 days. % = last 7 days.`}</div>${rows}
    <div class="cats" style="margin-top:8px">${pace || `<span class="meta">${zh ? "应用里还没有足够的答题数据" : "Not enough app answers yet"}</span>`}</div>
    <div class="cats" style="margin-top:6px">${hab}${mm ? `<span class="chip">📋 ${zh ? "缺交作业" : "Missing work"} <b>${mr ? +mr.value : "—"}</b>${mr ? ` <span class="meta">${fmtDate(mr.date)}</span>` : ""}</span>` : ""}</div></div>`;
}

/* ---------------- PARENT QUICK CHECK-IN ---------------- */
const qSt = {};
function openQuick() { if (isLocked()) return; $("#qDate").value = today(); $("#qErr").textContent = ""; Object.keys(qSt).forEach(k => delete qSt[k]); quickRender(); $("#quickMode").classList.add("open"); }
function quickRender() {
  const d = $("#qDate").value;
  $("#quickRows").innerHTML = S.kids.map((k, i) => {
    const ex = S.checkins.find(c => c.kid === k.id && c.date === d) || {};
    const lastPlan = S.checkins.filter(c => c.kid === k.id && c.date < d && c.planned != null).sort((a, b) => b.date.localeCompare(a.date))[0]?.planned;
    const same = ex.focus && ex.focus === ex.behavior && ex.behavior === ex.effort;
    const st = qSt[k.id] = qSt[k.id] && qSt[k.id].date === d ? qSt[k.id] : { date: d, planned: ex.planned ?? lastPlan ?? 2, done: ex.done ?? null, day: same ? ex.focus : null, focus: ex.focus ?? null, behavior: ex.behavior ?? null, effort: ex.effort ?? null, more: !!(ex.focus && !same), note: ex.note || "", traits: Object.assign({}, ex.traits || {}) };
    const habits = S.metrics.filter(m => m.kid === k.id && m.type === "rate").map(m => { const r = S.readings.find(r => r.metric === m.id && r.date === d); return r && +r.value ? mKidLabel(m) + (+r.value > 1 ? ` ×${r.value}` : "") : null; }).filter(Boolean);
    const said = ex.kid_mood ? `${T().heSaid} ${FACES[ex.kid_mood - 1]}${habits.length ? ` · ${T().did}: ${esc(habits.join(", "))}` : ""}` : `<span style="color:#b07a1c">${T().hasntTapped}</span>`;
    const r5 = (key, val) => `<div class="rate" style="max-width:300px">${[1, 2, 3, 4, 5].map(n => `<button type="button" class="${val === n ? "on" : ""}" data-q="${k.id}" data-key="${key}" data-n="${n}">${n}</button>`).join("")}</div>`;
    return `<div class="qrow"><div class="top"><h3><span class="dot" style="--kc:${KC[i % 3]}"></span>${esc(kidName(k.id))}</h3><div class="kidsaid">${said}</div></div>
      <div class="qgrid"><label>${T().studySessions}</label>
        <div class="stepper"><button type="button" data-q="${k.id}" data-step="-1">−</button><span class="v">${st.done == null ? "?" : st.done} / ${st.planned}</span><button type="button" data-q="${k.id}" data-step="1">+</button><button type="button" class="btn sm ghost" data-q="${k.id}" data-all="1">${T().allDone}</button><button type="button" class="btn sm ghost" data-q="${k.id}" data-plan="1">${T().planPm}</button></div>
        ${st.more ? `<label>${T().focus}</label>${r5("focus", st.focus)}<label>${T().behavior}</label>${r5("behavior", st.behavior)}<label>${T().effort}</label>${r5("effort", st.effort)}` : `<label>${T().dayOverall}</label>${r5("day", st.day)}`}
      </div>
      ${PARENT_TRAITS && TRAITS[k.id] ? `<div class="qtraits" style="margin-top:10px"><label style="font-weight:600">🧭 ${lang === "zh" ? "今天的行为" : "Today's behaviors"}</label>${TRAITS[k.id].map(([key, en, z]) => `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:5px 0;flex-wrap:wrap"><span style="font-size:14px">${lang === "zh" ? z : en}</span><span class="rate" style="max-width:170px">${[[2, "✅"], [1, "〰"], [0, "✗"]].map(([n, ic]) => `<button type="button" class="${st.traits[key] === n ? "on" : ""}" data-q="${k.id}" data-trait="${key}" data-n="${n}">${ic}</button>`).join("")}</span></div>`).join("")}</div>` : ""}
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
  else if (b.dataset.trait) { const n = +b.dataset.n, t = st.traits; if (t[b.dataset.trait] === n) delete t[b.dataset.trait]; else t[b.dataset.trait] = n; }
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
      const hasTraits = st.traits && Object.keys(st.traits).length;
      if (st.done == null && !rated && !st.note && !hasTraits) continue;
      const f = st.more ? { focus: st.focus, behavior: st.behavior, effort: st.effort } : { focus: st.day, behavior: st.day, effort: st.day };
      const core = (st.done == null && !rated && !st.note) ? {} : { planned: st.planned, done: st.done ?? 0, ...f }; // behaviors only → don't touch study/ratings
      await upsert("checkins", { kid: k.id, date: d, ...core, ...(PARENT_TRAITS && TRAITS[k.id] ? { traits: hasTraits ? st.traits : null } : {}), ...(core.planned != null || st.note ? { note: st.note.trim() } : {}), updated_at: new Date().toISOString() }, "kid,date");
    }
    $("#quickMode").classList.remove("open"); await refresh(); setStatus(T().saved); setTimeout(() => setStatus(""), 2500);
  } catch (err) { $("#qErr").textContent = err.message || "Save failed"; }
};
document.querySelectorAll("[data-fsclose]").forEach(b => b.onclick = () => { if (!isKid() && isLocked() && b.closest("#kidMode")) return unlockDevice(); b.closest(".fs").classList.remove("open"); isKid() ? kidRender() : route(); });

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
  const fb7 = (S.feedback || []).filter(f => f.kid === kid && f.date >= w1from && f.date <= asOf), fbConcern = fb7.filter(f => f.tone === "concern").length;
  if (fbConcern >= 2) P("fix", R.parentNoticed(fbConcern));
  const pendingAdj = (S.insights || []).filter(i => i.kid === kid && i.kind === "adjustment" && i.status === "proposed").length;
  if (pendingAdj) P("info", R.adjWaiting(pendingAdj));
  behind.forEach(g => { if (g.kind === "level" && g.stale) return; const nm = esc(mName(g.m)); const det = g.kind === "level" ? R.progressVs(Math.round(g.progress * 100), Math.round(g.expected * 100)) : R.countVs(g.c7, g.m.per_week);
    if (adh7 != null && adh7 >= 0.75) P("fix", R.method(nm, pct(adh7), det)); else P("fix", R.routine(nm, adh7 == null ? R.noCheckins : R.doneP(pct(adh7)))); });
  const levelUp = adh7 != null && adh7 >= 0.85 && adhPrev != null && adhPrev >= 0.85 && engNow != null && engNow >= 0.7 && !behind.length && !easeOff;
  if (levelUp) P("up", R.levelUp(pct(adh7), pct(adhPrev), pct(engNow)));
  if (ahead.length && behind.length && !easeOff) P("info", R.shift(esc(mName(ahead[0].m)), esc(mName(behind[0].m))));
  goals.filter(g => g.kind === "level" && g.stale).forEach(g => P("info", R.stale(esc(mName(g.m)), g.staleDays)));
  if (!recs.filter(r => r.cls !== "info").length) P("up", R.steady());
  const status = logged7 < 3 ? "n" : (easeOff && logged7 >= 3) ? "r" : (levelUp || (!behind.length && !easeOff && logged7 >= 4)) ? "g" : "a";
  const flags = { easeOff, levelUp, behindN: behind.length, aheadN: ahead.length, staleN: goals.filter(g => g.kind === "level" && g.stale).length,
    moodLow: kidMood7 != null && moods.length >= 3 && kidMood7 <= 2.5, gapHigh: moodGap != null && moodGap >= 1.5, pattern: concerns7 >= 3 || (behAvg7 != null && behAvg7 <= 2.5) };
  return { adh7, adhPrev, engNow, engDelta, logged7, behAvg7, kidMood7, moodGap, concerns7, goals, recs, status, series, cks, flags };
}

/* ---------------- DECISION MAP: one-direction network, signals -> coach rules -> choice ---------------- */
const DNET = {
  en: { title: "Decision map", sub: "How the coach got to today's advice. Signals on the left feed the rules in the middle, which lead to a choice on the right. The highlighted path is what's driving it now.",
    legend: "● fired · ○ not fired · ◌ no data yet", cols: ["SIGNALS", "COACH RULES", "CHOICE"],
    inp: { n: "Check-ins (7d)", adh: "Adherence", eng: "Engagement", mood: "His mood (7d)", gap: "Parent vs him", conc: "Concerns / behavior", pace: "Goal pace", stale: "Grade freshness", amc: "AMC 8 data", skl: "Skills (learning model)" },
    rule: { R1: "Ease off", R2: "He says it's hard", R3: "Views don't match", R4: "Behavior pattern", R5: "Change the method", R6: "Fix the routine", R7: "Level up", R8: "Shift time", R9: "Update needed", R10: "Not enough data", R11: "AMC focus chapter", R13: "Retune practice" },
    out: { O1: "Lighten the load", O2: "Talk & connect first", O3: "Change practice type", O4: "Set a fixed time", O5: "Add one challenge", O6: "Move a session", O7: "Log a new grade", O8: "Keep logging, no changes", O9: "Practise weak skills (auto-tuned)" },
    behindAhead: (b, a) => `${b} behind · ${a} ahead`, stale: n => n ? `${n} stale` : "ok", noData: "no data yet",
    amc: { weak: "needs work", slow: "slow", rush: "rushing", ok: "ok", nodata: "no data yet" }, skl: (l, m, mv) => `${l} need help · ${m} mastered${mv ? ` · ${mv} retuned` : ""}` },
  zh: { title: "决策图", sub: "教练如何得出今天的建议：左边的信号进入中间的规则，再得出右边的决定。高亮的路径就是现在起作用的依据。",
    legend: "● 触发 · ○ 未触发 · ◌ 暂无数据", cols: ["信号", "教练规则", "决定"],
    inp: { n: "打卡次数（7天）", adh: "完成率", eng: "投入度", mood: "他的心情（7天）", gap: "家长与他评分差", conc: "担忧 / 行为", pace: "目标进度", stale: "成绩更新", amc: "AMC 8 数据", skl: "技能（学习模型）" },
    rule: { R1: "减负", R2: "他说很难", R3: "看法不一致", R4: "行为模式", R5: "换方法", R6: "固定作息", R7: "加一点难度", R8: "调配时间", R9: "需要更新成绩", R10: "数据不足", R11: "AMC 重点章节", R13: "重新调整练习" },
    out: { O1: "减轻负担", O2: "先沟通陪伴", O3: "换练习方式", O4: "定好固定时间", O5: "增加一个挑战", O6: "调整练习分配", O7: "录入新成绩", O8: "继续记录，暂不调整", O9: "练薄弱技能（自动调难度）" },
    behindAhead: (b, a) => `${b} 项落后 · ${a} 项超前`, stale: n => n ? `${n} 项过期` : "正常", noData: "暂无数据",
    amc: { weak: "需加强", slow: "偏慢", rush: "太急", ok: "正常", nodata: "暂无数据" }, skl: (l, m, mv) => `${l} 项需帮助 · ${m} 项已掌握${mv ? ` · ${mv} 项已调整` : ""}` } };
function amcFlag(kid) {
  const save = (S.app_saves || []).find(a => a.kid === kid && a.app === "amc"), P = save && save.data ? save.data[`${kid}_amc_progress`] : null;
  if (!P) return { flag: "nodata" };
  const from = daysAgo(13), st = amcStats({ ...P, events: amcRep(P.events).filter(e => (e.d || "") >= from) });
  if (!st.all.n) return { flag: "nodata" };
  for (const f of ["weak", "rush", "slow"]) { const tp = st.topics.find(r => r.flag === f); if (tp) return { flag: f, topic: tp.t }; }
  return { flag: "ok" };
}
function decisionNet(kid, r, color) {
  const L = DNET[lang] || DNET.en, f = r.flags, isAmc = (S.subjects || []).some(x => x.kid === kid && x.app_url === "amc/") || (S.app_saves || []).some(a => a.kid === kid && a.app === "amc");
  const am = isAmc ? amcFlag(kid) : null, hasCk = r.logged7 > 0;
  const fmt1 = v => v == null ? "—" : v.toFixed(1);
  const inputs = [
    ["n", `${r.logged7}/7`, true, r.logged7 < 4],
    ["adh", pct(r.adh7), r.adh7 != null, r.adh7 != null && r.adh7 < .6],
    ["eng", pct(r.engNow), r.engNow != null, f.easeOff && r.engNow != null && (r.engNow < .45 || (r.engDelta != null && r.engDelta <= -.15))],
    ["mood", r.kidMood7 == null ? "—" : fmt1(r.kidMood7) + "/5", r.kidMood7 != null, f.moodLow],
    ["gap", r.moodGap == null ? "—" : (r.moodGap >= 0 ? "+" : "") + fmt1(r.moodGap), r.moodGap != null, f.gapHigh],
    ["conc", `${r.concerns7}${r.behAvg7 != null ? " · " + fmt1(r.behAvg7) + "/5" : ""}`, hasCk || r.concerns7 > 0, f.pattern],
    ["pace", L.behindAhead(f.behindN, f.aheadN), r.goals.length > 0, f.behindN > 0],
    ["stale", L.stale(f.staleN), true, f.staleN > 0]];
  const sk = typeof skillSignal === "function" ? skillSignal(kid) : null; // 📚 nightly learning model
  if (sk) inputs.push(["skl", L.skl(sk.lack, sk.mast, sk.moved), sk.has, sk.lack >= 2 || sk.moved > 0]);
  if (isAmc) inputs.push(["amc", L.amc[am.flag] + (am.topic ? " · " + amcTopic(am.topic) : ""), am.flag !== "nodata", ["weak", "slow", "rush"].includes(am.flag)]);
  const adh = r.adh7, rules = [
    ["R1", f.easeOff && r.logged7 >= 3, ["adh", "eng"]], ["R2", f.moodLow, ["mood"]], ["R3", f.gapHigh && !f.moodLow, ["gap"]], ["R4", f.pattern, ["conc"]],
    ["R5", f.behindN > 0 && adh != null && adh >= .75, ["pace", "adh"]], ["R6", f.behindN > 0 && (adh == null || adh < .75), ["pace", "adh"]],
    ["R7", f.levelUp, ["adh", "eng", "pace"]], ["R8", f.aheadN > 0 && f.behindN > 0 && !f.easeOff, ["pace"]], ["R9", f.staleN > 0, ["stale"]], ["R10", r.logged7 < 4, ["n"]]];
  if (isAmc) rules.push(["R11", ["weak", "slow", "rush"].includes(am.flag), ["amc"]]);
  if (sk) rules.push(["R13", sk.has && (sk.lack >= 2 || sk.moved > 0), ["skl"]]);
  const ract = Object.fromEntries(rules.map(x => [x[0], x[1]])), gated = ract.R10;
  const outputs = [["O1", ["R1"]], ["O2", ["R2", "R3", "R4"]], ["O3", ["R5"].concat(isAmc ? ["R11"] : [])], ["O4", ["R6"]], ["O5", ["R7"]], ["O6", ["R8"]], ["O7", ["R9"]], ["O8", ["R10"]]].concat(sk ? [["O9", ["R13"]]] : []);
  const oact = Object.fromEntries(outputs.map(([k, src]) => [k, src.some(x => ract[x]) && !(gated && ["O1", "O3", "O4", "O5", "O6"].includes(k))]));
  const n = Math.max(inputs.length, rules.length, outputs.length), rowH = 46, top = 58, W = 870, H = top + (n - 1) * rowH + 30;
  const X = { i: 250, r: 470, o: 650 }, ys = m => [...Array(m)].map((_, i) => top + i * ((n - 1) * rowH) / Math.max(m - 1, 1));
  const yi = ys(inputs.length), yr = ys(rules.length), yo = ys(outputs.length);
  const P = {}; inputs.forEach((x, i) => P[x[0]] = [X.i, yi[i], x[2], x[3]]); rules.forEach((x, i) => P[x[0]] = [X.r, yr[i]]); outputs.forEach((x, i) => P[x[0]] = [X.o, yo[i]]);
  const grey = "var(--line2)", dim = "var(--muted)", rad = 10;
  const edge = (a, b, lit) => `<line x1="${a[0] + rad}" y1="${a[1]}" x2="${b[0] - rad - 4}" y2="${b[1]}" stroke="${lit ? color : grey}" stroke-width="${lit ? 2.6 : 1}" ${lit ? 'marker-end="url(#dnArrL)"' : 'marker-end="url(#dnArr)"'} opacity="${lit ? 1 : .8}"/>`;
  let back = "", front = "";
  rules.forEach(([k, act, src]) => src.forEach(i => { const lit = act && (P[i][3] || !P[i][2]); (lit ? (front += edge(P[i], P[k], 1)) : (back += edge(P[i], P[k], 0))); }));
  outputs.forEach(([k, src]) => src.forEach(x => { const lit = ract[x] && oact[k]; (lit ? (front += edge(P[x], P[k], 1)) : (back += edge(P[x], P[k], 0))); }));
  const node = (x, y, on, hollow) => hollow ? `<circle cx="${x}" cy="${y}" r="${rad}" fill="var(--card)" stroke="${dim}" stroke-width="1.5" stroke-dasharray="3 3"/>` : `<circle cx="${x}" cy="${y}" r="${rad}" fill="${on ? color : "var(--card)"}" stroke="${on ? color : dim}" stroke-width="2"/>`;
  let nodes = "";
  inputs.forEach(([k, disp, has, hot], i) => { const y = yi[i]; nodes += node(X.i, y, hot, !has) + `<text x="${X.i - 18}" y="${y - 3}" text-anchor="end" font-size="12.5" fill="var(--ink)">${esc(L.inp[k])}</text><text x="${X.i - 18}" y="${y + 13}" text-anchor="end" font-size="11.5" fill="${hot ? color : dim}" font-weight="${hot ? 700 : 400}">${esc(disp)}</text>`; });
  rules.forEach(([k, act], i) => { const y = yr[i]; nodes += node(X.r, y, act) + `<text x="${X.r}" y="${y - 15}" text-anchor="middle" font-size="11.5" fill="${act ? "var(--ink)" : dim}" font-weight="${act ? 700 : 400}" paint-order="stroke" stroke="var(--card)" stroke-width="4">${k} ${esc(L.rule[k])}</text>`; });
  outputs.forEach(([k], i) => { const y = yo[i], on = oact[k]; nodes += node(X.o, y, on) + `<text x="${X.o + 18}" y="${y + 4}" font-size="12.5" fill="${on ? "var(--ink)" : dim}" font-weight="${on ? 700 : 400}">${esc(L.out[k])}</text>`; });
  const cols = [X.i, X.r, X.o].map((x, i) => `<text x="${x}" y="18" text-anchor="middle" font-size="11" letter-spacing=".08em" fill="${dim}" font-weight="700">${L.cols[i]}</text>`).join("");
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="min-width:640px;display:block" role="img" aria-label="${esc(L.title)}">
    <defs><marker id="dnArr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10z" fill="${grey}"/></marker>
    <marker id="dnArrL" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0L10,5L0,10z" fill="${color}"/></marker></defs>
    ${cols}${back}${front}${nodes}</svg>`;
}

/* ---------------- 📚 LEARNING (2026-11-21): what each boy studied, mastered, is lacking, how efficient he is, how his goals are going.
   Data comes from the nightly learning model in Supabase (learn_refresh(), pg_cron ~7:35 PM PT): skill_state (one row per skill),
   skill_history (one row per skill per day, kept forever) and learn_days (time and answers per app per day). One boy at a time, never side by side. */
let lnKid = null, lnHist = {}, lnBusy = false;
const LN = {
  en: { title: "Learning", sub: "Built every night (about 7:35 PM) from all his apps: what he studied, what he has mastered, what he's missing and how efficiently he works.", last: d => `Last update: ${d}`, never: "Not built yet", refresh: "↻ Update now", refreshing: "Updating…",
    k: { time: "Active time", qs: "Questions", ft: "First-try right", eff: "Efficiency", mast: "Mastered skills" }, wk: "this week", prev: v => `last week ${v}`, effSub: "right answers per 10 active min", mastSub: n => n ? `+${n} new this week` : "none new this week",
    days: "Last 14 days · active minutes per app", stand: "Where he stands", byApp: "Skill by skill", goals: "Goals", changes: "Difficulty changes (14 days)", noChanges: "No changes yet. The coach waits for at least 5 new tries before moving a level.",
    trend: "Skills mastered over time", how: "How the coach decides", noData: n => `No app data for ${n} yet. Once he uses his apps, this page fills in after the next nightly update.`,
    cols: { skill: "Skill", status: "Status", m: "Mastery", tries: "Tries 7d / all", speed: "Speed", lvl: "Level", why: "Why" }, auto: "Auto", lvls: ["Easy", "Medium", "Hard"], selfAdapt: "adapts itself",
    st: { mastered: "Mastered", review: "Review due", learning: "Working on it", started: "Just started", lacking: "Needs help", slow: "Knows it, but slow", rushing: "Rushing", new: "Not started" },
    howTxt: ["Mastery = his recent first-try accuracy, with newer answers counting more (last 20 tries).", "Mastered = 85%+ over 8 or more tries and not slow. Needs help = under 60% over 4+ tries. Slow = right but 25%+ over the real-test pace. Rushing = mostly wrong and very fast.",
      "Difficulty (AMC 8 and Physics) moves one step at a time, only after 5 new tries: up at 85%+ mastery, down under 55%. Ellis's AMC stays at Easy/Medium (light plan).", "Space Quest, Brain Park, Realm of Forces and Piste Duel already adjust on every question, so their own level is shown instead.",
      "Pick a level yourself in the table to override the coach (Auto gives control back). Nothing he has done is ever erased; every night is saved as history."],
    pace: s => `${s}s`, notStarted: "Not started yet", newOnly: "Only not-started skills here.", tuned: "AMC 8 and Physics use this level for his daily exam and practice gym.", appsNone: "—" },
  zh: { title: "学习进度", sub: "每晚（约 7:35）根据他所有应用自动生成：学了什么、掌握了什么、还欠缺什么、学习效率如何。", last: d => `最近更新：${d}`, never: "尚未生成", refresh: "↻ 立即更新", refreshing: "更新中…",
    k: { time: "有效学习时间", qs: "做题数", ft: "一次做对", eff: "效率", mast: "已掌握技能" }, wk: "本周", prev: v => `上周 ${v}`, effSub: "每 10 分钟有效时间做对的题数", mastSub: n => n ? `本周新增 ${n}` : "本周无新增",
    days: "最近 14 天 · 每个应用的有效分钟", stand: "现在的状况", byApp: "逐项技能", goals: "目标", changes: "难度调整（14 天）", noChanges: "还没有调整。每次调整前教练至少等他新做 5 题。",
    trend: "已掌握技能的变化", how: "教练怎么决定", noData: n => `${n} 还没有应用数据。他开始使用后，下一次夜间更新就会出现在这里。`,
    cols: { skill: "技能", status: "状态", m: "掌握度", tries: "做题 7天/全部", speed: "速度", lvl: "难度", why: "原因" }, auto: "自动", lvls: ["简单", "中等", "难"], selfAdapt: "游戏自调",
    st: { mastered: "已掌握", review: "该复习了", learning: "学习中", started: "刚开始", lacking: "需要帮助", slow: "会做但慢", rushing: "太急", new: "未开始" },
    howTxt: ["掌握度 = 他最近一次做对的比例，越新的题权重越大（最近 20 题）。", "已掌握 = 8 题以上做对 85% 且不慢。需要帮助 = 4 题以上低于 60%。偏慢 = 会做但比真实考试节奏慢 25% 以上。太急 = 大多做错而且很快。",
      "难度（AMC 8 和物理）一次只动一级，而且要新做满 5 题：掌握度 85% 以上升级，低于 55% 降级。Ellis 的 AMC 只用简单/中等（轻松计划）。", "太空探险、大脑乐园、力之境和 Piste Duel 每题都会自己调整，所以这里显示它们自己的级别。",
      "在表格里选一个难度即可替代教练（选“自动”交回）。他做过的一切都不会删除，每晚都存为历史记录。"],
    pace: s => `${s} 秒`, notStarted: "还没开始", newOnly: "这里只有未开始的技能。", tuned: "AMC 8 和物理的每日小测和练习馆会按这个难度出题。", appsNone: "—" } };
const LN_APP = { amc: ["🏆", "AMC 8", "AMC 8", "#7c5cff"], physics: ["🧲", "Physics 6", "物理 6", "#2bb3ff"], quest: ["⚔️", "Realm of Forces", "力之境", "#ff5a5a"], space: ["🚀", "Space Quest", "太空探险", "#ffb020"],
  brain: ["🧠", "Brain Park", "大脑乐园", "#2fbf71"], robot: ["🤖", "Robot Lab", "机器人实验室", "#ff5ccb"], fencing: ["🤺", "Piste Duel", "Piste Duel", "#c4f53a"],
  chem: ["⚗️", "Chemistry", "化学", "#14b8a6"], bio: ["🧬", "Biology", "生物", "#22c55e"], prealg: ["➗", "Pre-Algebra", "代数预备", "#6366f1"], english: ["📝", "English", "英语", "#f97316"], latin: ["🏛️", "Latin", "拉丁语", "#a16207"], history: ["🗺️", "World History", "世界历史", "#db2777"] };
const LN_ST = { mastered: ["✅", "var(--pos)"], review: ["🔁", "#7c5cff"], learning: ["🔨", "var(--accent)"], started: ["🌱", "var(--muted)"], lacking: ["⚠️", "var(--neg)"], slow: ["🐢", "#e08a2b"], rushing: ["⚡", "#e08a2b"], new: ["⬜", "var(--muted)"] };
const LN_TUNED = ["amc", "physics"];
const lnApp = a => { const x = LN_APP[a] || ["📦", a, a]; return `${x[0]} ${lang === "zh" ? x[2] : x[1]}`; };
const lnSkill = s => lang === "zh" && s.label_zh ? s.label_zh : (s.label || s.skill);
async function lnLoadHist(kid) {
  const from = daysAgo(34), rows = [];
  for (let p = 0; p < 20; p++) { const { data, error } = await sb.from("skill_history").select("app,skill,date,status,difficulty,mastery,attempts_day").eq("kid", kid).gte("date", from).order("date").range(p * 1000, p * 1000 + 999); if (error) throw error; rows.push(...(data || [])); if (!data || data.length < 1000) break; }
  lnHist[kid] = rows; return rows;
}
async function lnLoad() {
  const [a, b] = await Promise.all([sb.from("skill_state").select("*"), sb.from("learn_days").select("*").gte("date", daysAgo(60))]);
  if (a.error) throw a.error; if (b.error) throw b.error; S.skill_state = a.data || []; S.learn_days = b.data || [];
}
async function viewLearning() {
  const L = LN[lang] || LN.en;
  lnKid = lnKid && S.kids.some(k => k.id === lnKid) ? lnKid : S.kids[0]?.id; if (!lnKid) return;
  if (!S.skill_state) { $("#view").innerHTML = `<div class="coach"><p class="meta">…</p></div>`; try { await lnLoad(); } catch (e) { setStatus(e.message, true); return; } }
  if (!lnHist[lnKid]) { try { await lnLoadHist(lnKid); } catch (e) { lnHist[lnKid] = []; } }
  lnRender();
}
function lnRender() {
  const L = LN[lang] || LN.en, kid = lnKid, ki = S.kids.findIndex(k => k.id === kid), name = esc(kidName(kid)), zh = lang === "zh";
  const SS = (S.skill_state || []).filter(s => s.kid === kid), LD = (S.learn_days || []).filter(x => x.kid === kid), H = lnHist[kid] || [];
  const last = SS.reduce((m, s) => s.computed_on > m ? s.computed_on : m, "");
  const w1 = daysAgo(6), w2 = daysAgo(13), w2e = daysAgo(7);
  const sumD = (f, t, k) => LD.filter(x => x.date >= f && x.date <= t).reduce((a, x) => a + (+x[k] || 0), 0);
  const tNow = sumD(w1, today(), "active_secs"), tPrev = sumD(w2, w2e, "active_secs");
  const qNow = sumD(w1, today(), "attempts"), qPrev = sumD(w2, w2e, "attempts"), cNow = sumD(w1, today(), "correct"), cPrev = sumD(w2, w2e, "correct");
  // efficiency only over apps that record time (so a game without a clock doesn't inflate it)
  const timed = (f, t) => LD.filter(x => x.date >= f && x.date <= t && +x.active_secs > 0), eff = (f, t) => { const r = timed(f, t), s = r.reduce((a, x) => a + +x.active_secs, 0), c = r.reduce((a, x) => a + +x.correct, 0); return s >= 300 ? c / (s / 600) : null; };
  const eNow = eff(w1, today()), ePrev = eff(w2, w2e);
  const mins = s => Math.round((s || 0) / 60), pc = (c, q) => q ? Math.round(c / q * 100) + "%" : "—", f1 = v => v == null ? "—" : v.toFixed(1);
  const mast = SS.filter(s => ["mastered", "review"].includes(s.status)), mastNew = mast.filter(s => s.mastered_on && s.mastered_on >= w1).length;
  const tabs = `<div class="tabs">${S.kids.map(x => `<button class="${x.id === kid ? "on" : ""}" data-lk="${esc(x.id)}">${esc(kidName(x.id))}</button>`).join("")}</div>`;
  const head = `<div class="section-h"><h3>📚 ${L.title}</h3>${tabs}</div><p class="meta">${L.sub} ${last ? L.last(fmtDate(last)) : L.never} <button class="btn sm" id="lnRef" ${lnBusy ? "disabled" : ""}>${lnBusy ? L.refreshing : L.refresh}</button></p>`;
  if (!SS.some(s => s.attempts_total > 0 || s.status !== "new")) { $("#view").innerHTML = head + `<div class="coach"><p>${L.noData(name)}</p></div>`; lnWire(); return; }
  const kpis = `<div class="pfkpis lnk" style="--kc:${KC[ki % 3]}">
    <div class="pfk"><b>${mins(tNow)}<small> min</small></b><span>⏱ ${L.k.time} · ${L.wk}<br>${L.prev(mins(tPrev) + " min")}</span></div>
    <div class="pfk"><b>${qNow}</b><span>✏️ ${L.k.qs} · ${L.wk}<br>${L.prev(qPrev)}</span></div>
    <div class="pfk"><b>${pc(cNow, qNow)}</b><span>🎯 ${L.k.ft}<br>${L.prev(pc(cPrev, qPrev))}</span></div>
    <div class="pfk"><b>${f1(eNow)}</b><span>⚡ ${L.k.eff}: ${L.effSub}<br>${L.prev(f1(ePrev))}</span></div>
    <div class="pfk"><b>${mast.length}</b><span>✅ ${L.k.mast}<br>${L.mastSub(mastNew)}</span></div></div>`;
  // 14-day stacked minutes per app
  const days = [...Array(14)].map((_, i) => daysAgo(13 - i)), apps = [...new Set(LD.map(x => x.app))].filter(a => LD.some(x => x.app === a && +x.active_secs > 0));
  const dayMax = Math.max(1, ...days.map(d => LD.filter(x => x.date === d).reduce((a, x) => a + +x.active_secs, 0)));
  const chart = `<div class="coach"><h4>📅 ${L.days}</h4><div class="pfdays lnd">${days.map(d => { const rs = LD.filter(x => x.date === d && +x.active_secs > 0), tot = rs.reduce((a, x) => a + +x.active_secs, 0);
      return `<div title="${esc(d)}"><span class="pfcol lncol">${apps.map(a => { const r = rs.find(x => x.app === a); return r ? `<i style="height:${Math.round(+r.active_secs / dayMax * 100)}%;background:${LN_APP[a]?.[3] || "var(--kc)"}"></i>` : ""; }).join("")}</span><small>${d.slice(5)}</small><b>${mins(tot) || "&nbsp;"}</b></div>`; }).join("")}</div>
    <div class="lnleg">${apps.map(a => `<span><i style="background:${LN_APP[a]?.[3]}"></i>${lnApp(a)}</span>`).join("")}</div></div>`;
  // where he stands
  const order = ["lacking", "rushing", "slow", "review", "learning", "started", "mastered"];
  const stand = `<div class="coach"><h4>🧭 ${L.stand}</h4>${order.map(st => { const xs = SS.filter(s => s.status === st).sort((a, b) => (b.attempts_7d - a.attempts_7d) || ((a.sort ?? 0) - (b.sort ?? 0))); if (!xs.length) return "";
      return `<div class="lnb"><div class="lnbh" style="color:${LN_ST[st][1]}">${LN_ST[st][0]} ${L.st[st]} <span class="meta">(${xs.length})</span></div><div class="pfchips">${xs.slice(0, 24).map(s => `<span class="chip" title="${esc(lnApp(s.app))}">${LN_APP[s.app]?.[0] || ""} ${esc(lnSkill(s))}${s.status === "mastered" && s.mastered_on >= w1 ? " ✨" : ""}</span>`).join("")}${xs.length > 24 ? `<span class="meta">+${xs.length - 24}</span>` : ""}</div></div>`; }).join("")}
    ${(() => { const n = SS.filter(s => s.status === "new").length; return n ? `<div class="lnb"><div class="lnbh meta">⬜ ${L.st.new} <span class="meta">(${n})</span></div></div>` : ""; })()}</div>`;
  // per-app tables
  const byApp = [...new Set(SS.map(s => s.app))].sort((a, b) => Object.keys(LN_APP).indexOf(a) - Object.keys(LN_APP).indexOf(b));
  const changed7 = s => s.difficulty_changed_on && s.difficulty_changed_on >= w1 && s.difficulty_prev != null && s.difficulty !== s.difficulty_prev;
  const lvlCell = s => {
    if (!LN_TUNED.includes(s.app)) return `<span class="meta">${s.app_level != null && !["space", "robot"].includes(s.app) ? (zh ? "级 " : "Lv ") + Math.round(+s.app_level) + " · " : ""}${L.selfAdapt}</span>`;
    const arrow = changed7(s) ? (s.difficulty > s.difficulty_prev ? " ⬆️" : " ⬇️") : "";
    return `<select class="lnsel" data-lsk="${esc(s.app + "|" + s.skill)}"><option value="">${L.auto}${s.parent_level == null && s.difficulty ? " (" + L.lvls[s.difficulty - 1] + ")" : ""}</option>${[1, 2, 3].map(n => `<option value="${n}" ${s.parent_level === n ? "selected" : ""}>${L.lvls[n - 1]}</option>`).join("")}</select>${arrow}`;
  };
  const tables = `<div class="coach"><h4>🔎 ${L.byApp}</h4><p class="meta">${L.tuned}</p>${byApp.map((a, ai) => { const xs = SS.filter(s => s.app === a).sort((x, y) => (x.sort ?? 0) - (y.sort ?? 0)), act = xs.filter(s => s.status !== "new");
      const tried = act.length, m7 = xs.reduce((t, s) => t + (s.attempts_7d || 0), 0);
      return `<details class="lnapp" ${ai === 0 || m7 > 0 ? "open" : ""}><summary><b>${lnApp(a)}</b> <span class="meta">· ${tried}/${xs.length} · ${m7} ${zh ? "题（7天）" : "tries this week"}</span></summary>
        ${tried ? `<div style="overflow-x:auto"><table class="pft lnt"><tr><th>${L.cols.skill}</th><th>${L.cols.status}</th><th>${L.cols.m}</th><th>${L.cols.tries}</th><th>${L.cols.speed}</th><th>${L.cols.lvl}</th></tr>
        ${act.map(s => `<tr><td><b style="font-weight:600">${esc(lnSkill(s))}</b><div class="meta">${esc(zh ? (s.reason_zh || s.reason || "") : (s.reason || ""))}</div></td>
          <td style="white-space:nowrap;color:${LN_ST[s.status]?.[1] || "inherit"}">${LN_ST[s.status]?.[0] || ""} ${L.st[s.status] || s.status}</td>
          <td style="white-space:nowrap">${s.mastery != null ? `<span class="pfbar"><i style="width:${Math.round(s.mastery * 100)}%;background:${LN_ST[s.status]?.[1] || "var(--kc)"}"></i></span> ${Math.round(s.mastery * 100)}%` : "—"}</td>
          <td>${s.attempts_7d || 0} / ${s.attempts_total || 0}</td>
          <td style="white-space:nowrap">${s.median_secs != null ? L.pace(Math.round(s.median_secs)) + (s.pace_secs ? ` <span class="meta">/ ${s.pace_secs}</span>` : "") : "—"}</td>
          <td>${lvlCell(s)}</td></tr>`).join("")}</table></div>` : `<p class="meta">${L.newOnly}</p>`}
        ${xs.length > tried ? `<p class="meta">⬜ ${L.notStarted}: ${xs.filter(s => s.status === "new").slice(0, 30).map(s => esc(lnSkill(s))).join(" · ")}${xs.length - tried > 30 ? " …" : ""}</p>` : ""}</details>`; }).join("")}</div>`;
  // goals (same engine as the Dashboard coach)
  const t = T(), r = engine(kid);
  const goals = `<div class="coach"><h4>🎯 ${L.goals}</h4>${r.goals.length ? `<table class="pft">${r.goals.map(g => { const u = esc(g.m.unit || "");
      const lab = g.kind === "rate" ? `${g.c7} / ${g.m.per_week} ${t.thisWeek}` : `${+g.m.baseline}${u} → <b>${g.cur}${u}</b> → ${+g.m.target}${u}${g.daysLeft != null ? ` · ${t.daysLeft(g.daysLeft)}` : ""}`;
      const fill = g.status === "behind" ? "var(--neg)" : ["ahead", "done", "met"].includes(g.status) ? "var(--pos)" : "var(--accent)";
      return `<tr><td>${subjOf(g.m.subject_id) ? subjOf(g.m.subject_id).icon + " " : ""}${esc(mName(g.m))}<div class="meta">${lab}</div></td><td style="width:34%"><div class="prog"><i style="width:${Math.round(clamp01(g.progress) * 100)}%;background:${fill}"></i></div></td><td><span class="pace ${g.kind === "level" && g.stale ? "stale" : g.status}">${g.kind === "level" && g.stale ? t.pace.stale : t.pace[g.status]}</span></td></tr>`; }).join("")}</table>` : `<p class="meta">${t.noGoals}</p>`}</div>`;
  // difficulty changes (history: day-to-day level changes, last 14 days)
  const chg = []; const prevD = {};
  H.forEach(h => { const k = h.app + "|" + h.skill; if (LN_TUNED.includes(h.app) && h.difficulty != null) { if (prevD[k] != null && prevD[k] !== h.difficulty && h.date >= w2) chg.push({ ...h, from: prevD[k] }); prevD[k] = h.difficulty; } });
  SS.filter(s => LN_TUNED.includes(s.app) && s.difficulty_changed_on && s.difficulty_changed_on >= w2 && s.difficulty_prev != null && s.difficulty !== s.difficulty_prev && !chg.some(c => c.app === s.app && c.skill === s.skill && c.date === s.difficulty_changed_on))
    .forEach(s => chg.push({ app: s.app, skill: s.skill, date: s.difficulty_changed_on, from: s.difficulty_prev, difficulty: s.difficulty }));
  const lab = (a, k) => { const s = SS.find(x => x.app === a && x.skill === k); return s ? lnSkill(s) : k; };
  const changes = `<div class="coach"><h4>🎚️ ${L.changes}</h4>${chg.length ? chg.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14).map(c => `<div class="pfslow">${c.difficulty > c.from ? "⬆️" : "⬇️"} <b>${esc(lab(c.app, c.skill))}</b> <span class="meta">${lnApp(c.app)} · ${fmtDate(c.date)}</span><div>${L.lvls[c.from - 1]} → <b>${L.lvls[c.difficulty - 1]}</b></div></div>`).join("") : `<p class="meta">${L.noChanges}</p>`}</div>`;
  // mastered count per day (28 days)
  const tdays = [...Array(28)].map((_, i) => daysAgo(27 - i)), mc = tdays.map(d => H.filter(h => h.date === d && ["mastered", "review"].includes(h.status)).length), has = tdays.map(d => H.some(h => h.date === d));
  const mx = Math.max(1, ...mc);
  const trend = `<div class="coach"><h4>📈 ${L.trend}</h4><div class="pfdays lntr">${tdays.map((d, i) => `<div title="${esc(d)}: ${has[i] ? mc[i] : "—"}"><span class="pfcol" style="height:56px;width:12px"><i style="height:${has[i] ? Math.max(4, Math.round(mc[i] / mx * 100)) : 0}%"></i></span>${i % 7 === 6 ? `<small>${d.slice(5)}</small>` : "<small>&nbsp;</small>"}</div>`).join("")}</div></div>`;
  const how = `<details class="howto coach"><summary>🧠 ${L.how}</summary><ul>${L.howTxt.map(x => `<li>${x}</li>`).join("")}</ul></details>`;
  $("#view").innerHTML = head + kpis + `<div class="fbgrid" style="--kc:${KC[ki % 3]};margin-top:12px"><div>${chart}${stand}</div><div>${goals}${changes}${trend}${how}</div></div><div style="--kc:${KC[ki % 3]};margin-top:12px">${tables}</div>`;
  lnWire();
}
function lnWire() {
  document.querySelectorAll("[data-lk]").forEach(b => b.onclick = async () => { lnKid = b.dataset.lk; if (!lnHist[lnKid]) { try { await lnLoadHist(lnKid); } catch (e) { lnHist[lnKid] = []; } } lnRender(); });
  const rb = $("#lnRef"); if (rb) rb.onclick = async () => {
    lnBusy = true; lnRender();
    try { const { error } = await sb.rpc("learn_refresh"); if (error) throw error; await lnLoad(); lnHist = {}; await lnLoadHist(lnKid); setStatus(T().saved); setTimeout(() => setStatus(""), 2000); }
    catch (e) { setStatus(e.message || "Update failed", true); }
    lnBusy = false; lnRender();
  };
  document.querySelectorAll("select[data-lsk]").forEach(sel => sel.onchange = async () => {
    const [app, skill] = sel.dataset.lsk.split("|"), v = sel.value ? +sel.value : null, row = (S.skill_state || []).find(s => s.kid === lnKid && s.app === app && s.skill === skill);
    const patch = v ? { parent_level: v, difficulty: v, reason: "Set by a parent", reason_zh: "家长设定" } : { parent_level: null };
    const { error } = await sb.from("skill_state").update({ ...patch, updated_at: new Date().toISOString() }).eq("kid", lnKid).eq("app", app).eq("skill", skill);
    if (error) { setStatus(error.message, true); return; }
    if (row) Object.assign(row, patch); setStatus(T().saved); setTimeout(() => setStatus(""), 1500); lnRender();
  });
}
/* skills signal for the decision map: how many skills need help / were retuned in the last 2 days */
function skillSignal(kid) {
  const SS = (S.skill_state || []).filter(s => s.kid === kid); if (!SS.length) return null;
  const lack = SS.filter(s => ["lacking", "rushing", "slow"].includes(s.status)), mast = SS.filter(s => ["mastered", "review"].includes(s.status)).length;
  const moved = SS.filter(s => s.difficulty_changed_on && s.difficulty_changed_on >= daysAgo(1) && s.difficulty_prev != null && s.difficulty !== s.difficulty_prev).length;
  return { lack: lack.length, top: lack.sort((a, b) => (b.attempts_7d || 0) - (a.attempts_7d || 0))[0], mast, moved, has: SS.some(s => s.attempts_total > 0) };
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
      <div class="kid-top"><div><h2 style="display:flex;align-items:center;gap:8px"><span style="display:inline-flex;width:40px;height:40px;border-radius:12px;background:#fff;align-items:center;justify-content:center;overflow:hidden">${avatarHtml(k.avatar, 36)}</span>${esc(kidName(k.id))}</h2><div class="meta">${meta}</div>${k.focus ? `<div class="meta"><b style="color:var(--ink)">${t.focusNow}:</b> ${esc(k.focus)}</div>` : ""}</div>
      <div class="kidacts"><a class="btn sm ghost" href="#feedback" data-fbkid="${esc(k.id)}">💬 ${t.feedbackBtn}</a><button class="btn sm ghost" data-log="${esc(k.id)}">${t.logBtn}</button><button class="btn sm ghost" data-edit="${esc(k.id)}">${t.edit}</button></div></div>
      <div class="stats"><div class="stat pos"><div class="n">${s.pos}</div><div class="l">${t.wins}</div></div><div class="stat neg"><div class="n">${s.neg}</div><div class="l">${t.concerns}</div></div><div class="stat neu"><div class="n">${s.neu}</div><div class="l">${t.notes}</div></div></div>
      ${spark(k.id)}
      ${(() => { const w = daysAgo(6), mm = S.checkins.filter(c => c.kid === k.id && c.date >= w && c.kid_mood).map(c => c.kid_mood), avg = mm.length ? mm.reduce((a, b) => a + b, 0) / mm.length : null;
        const wn = S.entries.filter(e => e.kid === k.id && e.by_kid && e.date >= w).length, jn = S.journal.filter(j => j.kid === k.id && j.date >= w).length, gp = S.goals.filter(g => g.kid === k.id && g.status === "proposed").length;
        const tp = S.readings.filter(r => r.kid === k.id && r.date >= w && S.metrics.find(m => m.id === r.metric)?.type === "rate").reduce((s, r) => s + (+r.value || 0), 0);
        return `<div class="goals"><h4>${t.hisVoice}</h4><div class="cats" style="margin-top:0">
          <span class="chip">${t.hisMood} <b>${avg == null ? "—" : FACES[Math.round(avg) - 1] + " " + avg.toFixed(1)}</b></span>
          <span class="chip">${t.hisWins} <b>${wn}</b></span><span class="chip">${t.hisJournal} <b>${jn}</b></span>
          <span class="chip">${t.hisTaps} <b>${tp}</b></span>${gp ? `<a class="chip" href="#family" style="text-decoration:none;background:var(--pos-bg)">${t.hisIdeas} <b>${gp}</b></a>` : ""}</div></div>`; })()}
      ${timePanel(k.id)}
      ${fairPanel(k.id)}
      ${doneWellParentHtml(k.id)}
      ${watchGuideHtml(k.id)}
      ${behaviorPanel(k.id)}
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
      <details class="howto"><summary>${t.howDecides}</summary><ul>${t.rules.map(x => `<li>${x}</li>`).join("")}</ul></details></div></div>
    ${(() => { const D = DNET[lang] || DNET.en, ki = Math.max(0, S.kids.findIndex(k => k.id === coachKid)); return `<div class="dnet"><div class="section-h" style="margin:18px 0 4px"><h4 style="margin:0">🧠 ${D.title}</h4><span class="meta">${D.legend}</span></div><div class="meta">${D.sub}</div><div class="dnet-svg">${decisionNet(coachKid, r, ["#c4f53a", "#ff6a1f", "#ff5ccb"][ki % 3])}</div></div>`; })()}`;
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
  // 🩺 System health (parents): app errors from everyone's devices, last 7 days (public.client_errors)
  let errs = []; try { const r = await sb.from("client_errors").select("day,who,page,msg,n,last_at").gte("day", daysAgo(6)).order("last_at", { ascending: false }).limit(50); errs = r.data || []; } catch (e) {}
  const zhE = lang === "zh", errTotal = errs.reduce((a, x) => a + x.n, 0);
  const healthHtml = `<div class="coach" style="margin-bottom:16px"><h4>🩺 ${zhE ? "系统健康（过去 7 天）" : "System health (last 7 days)"}</h4>
    ${errs.length ? `<p class="meta">${zhE ? `设备上出现了 ${errTotal} 次错误（${errs.length} 种）。截图发给 Claude 就能修。` : `${errTotal} error(s) on family devices (${errs.length} kinds). Send this to Claude to fix.`}</p>
      <div style="overflow-x:auto"><table style="border-collapse:collapse;font-size:13px;width:100%">${errs.slice(0, 12).map(x => `<tr><td style="padding:3px 6px;white-space:nowrap">${esc(x.day.slice(5))}</td><td style="padding:3px 6px">${esc(x.who.split("@")[0])}</td><td style="padding:3px 6px"><code>${esc(x.page)}</code></td><td style="padding:3px 6px">${esc(x.msg.slice(0, 120))}</td><td style="padding:3px 6px">×${x.n}</td></tr>`).join("")}</table></div>`
      : `<p class="meta">✅ ${zhE ? "没有记录到错误。" : "No app errors recorded."}</p>`}</div>`;
  $("#view").innerHTML = `<div class="section-h"><h3>${t.familyTitle}</h3></div>
    ${healthHtml}
    <div class="coach" style="margin-bottom:16px"><h4>👀 ${t.previewTitle}</h4><p class="meta">${t.previewHelp}</p>
      <div class="pvpick">${S.kids.map((k, i) => `<button data-pv="${esc(k.id)}" style="--kc:${KC[i % 3]}"><span class="av">${avatarHtml(k.avatar, 44)}</span><b>${esc(kidName(k.id))}</b><small>${t.viewHisPage}</small></button>`).join("")}</div></div>
    <div class="coach" style="margin-bottom:16px"><h4>🔑 ${t.myPassword}</h4><p class="meta">${t.myPasswordHelp} <b>${esc(S.user?.email || "")}</b></p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;max-width:560px;margin-top:8px"><input type="password" id="pw1" minlength="8" autocomplete="new-password" placeholder="${t.newPw}" style="flex:1;min-width:160px"><input type="password" id="pw2" minlength="8" autocomplete="new-password" placeholder="${t.confirmPw}" style="flex:1;min-width:160px"><button class="btn sm primary" id="pwSave" style="white-space:nowrap">${t.savePw}</button></div>
      <div class="err" id="pwMsg" style="margin-top:8px"></div></div>
    <div class="coach"><h4>${t.kidLogins}</h4><p class="meta">${t.pinHelp}</p>
      ${S.kids.map((k, i) => { const u = kidUsers.find(x => x.kid_id === k.id); return u ? `<div class="qgrid" style="grid-template-columns:150px 1fr;margin-top:10px">
        <div><span class="dot" style="--kc:${KC[i % 3]};display:inline-block"></span> <b>${esc(kidName(k.id))}</b><div class="meta">${t.username}: <code>${esc(u.email.split("@")[0])}</code></div></div>
        <div style="display:flex;gap:8px;max-width:360px"><input type="password" inputmode="numeric" minlength="6" placeholder="${t.pin}" data-pinfor="${esc(k.id)}"><button class="btn sm primary" style="white-space:nowrap" data-setpin="${esc(k.id)}">${t.setPin}</button></div></div>` : ""; }).join("")}
      <div class="err" id="pinMsg" style="margin-top:8px"></div></div>
    <div class="coach" style="margin-top:16px"><h4>📖 ${lang === "zh" ? "Abby 的英语学习" : "Abby's English"}</h4>
      <p class="meta">${lang === "zh" ? "Abby 的独立英语页面（不计入孩子们的积分和报告）。她用用户名 <code>abby</code> 和你设的 PIN 登录，进度保存在她自己的账户里。打开页面可查看她的进度。" : "Abby's own English page (separate from the boys' points and reports). She signs in with username <code>abby</code> and the PIN you set here; her progress saves to her own account. Open the page to see her progress."}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;max-width:560px;margin-top:8px"><input type="password" inputmode="numeric" minlength="6" placeholder="${t.pin}" id="abbyPin" style="flex:1;min-width:140px"><button class="btn sm primary" data-setlpin="abby">${t.setPin}</button><a class="btn sm" href="abby/" target="_blank" rel="noopener">${lang === "zh" ? "打开页面" : "Open page"}</a></div>
      <div class="err" id="lpinMsg" style="margin-top:8px"></div></div>
    <div class="coach" style="margin-top:16px"><h4>${t.proposals}</h4>
      ${props.length ? props.map(g => `<div class="goal"><span class="dot" style="--kc:${kidColor(g.kid)};margin-top:6px"></span><span><b>${esc(kidName(g.kid))}:</b> ${esc(g.text)}</span><span style="margin-left:auto;display:flex;gap:6px"><button class="btn sm primary" data-approve="${g.id}">${t.approve}</button><button class="btn sm" data-decline="${g.id}">${t.decline}</button></span></div>`).join("") : `<div class="meta">${t.noProposals}</div>`}</div>
    <div class="coach" style="margin-top:16px"><h4>${t.journals}</h4><p class="meta">${t.journalsHelp}</p>
      ${S.kids.map(k => { const js = jByKid(k.id), nf = js.filter(j => (buddyOf(j) || {}).flag).length; return `<details style="margin-top:8px"${nf ? " open" : ""}><summary><b>${esc(kidName(k.id))}</b> <span class="meta">(${js.length})</span>${nf ? ` <span class="jbflag" style="display:inline">⚠️ ${nf}</span>` : ""}</summary>${js.length ? js.map(j => `<div class="rec info"><div class="meta">${fmtDate(j.date)}</div><div class="n" style="white-space:pre-wrap">${esc(j.body)}</div>${buddyNote(j, true)}</div>`).join("") : `<div class="meta">—</div>`}</details>`; }).join("")}</div>`;
  $("#view").onclick = async e => {
    const x = e.target;
    try {
      if (x.dataset.setpin) {
        const inp = document.querySelector(`[data-pinfor="${CSS.escape(x.dataset.setpin)}"]`);
        const { error } = await sb.rpc("set_kid_pin", { p_kid: x.dataset.setpin, p_pin: inp.value });
        $("#pinMsg").style.color = error ? "var(--neg)" : "var(--pos)"; $("#pinMsg").textContent = error ? error.message : `${kidName(x.dataset.setpin)}: ${t.pinSet}`; if (!error) inp.value = "";
      }
      if (x.dataset.setlpin) {
        const inp = $("#abbyPin"), { error } = await sb.rpc("set_learner_pin", { p_login: x.dataset.setlpin, p_pin: inp.value });
        $("#lpinMsg").style.color = error ? "var(--neg)" : "var(--pos)";
        $("#lpinMsg").textContent = error ? (/set_learner_pin|schema cache|does not exist/i.test(error.message) ? (lang === "zh" ? "还需要先运行数据库设置（supabase/sql/2026-11-23_learner_abby.sql）。" : "The database setup still needs to run first (supabase/sql/2026-11-23_learner_abby.sql).") : error.message) : `Abby: ${t.pinSet}`;
        if (!error) inp.value = "";
      }
      if (x.id === "pwSave") {
        const a = $("#pw1").value, b = $("#pw2").value, m = $("#pwMsg");
        const bad = a.length < 8 ? t.pwShort : a !== b ? t.pwMismatch : "";
        if (bad) { m.style.color = "var(--neg)"; m.textContent = bad; return; }
        const { error } = await sb.auth.updateUser({ password: a });
        m.style.color = error ? "var(--neg)" : "var(--pos)"; m.textContent = error ? error.message : t.pwSaved;
        if (!error) { $("#pw1").value = $("#pw2").value = ""; try { localStorage.setItem("fh_pmode", "pw"); pMode = "pw"; } catch (e2) {} }
      }
      if (x.dataset.approve) { const { error } = await sb.from("goals").update({ status: "active" }).eq("id", x.dataset.approve); if (error) throw error; await refresh(); }
      if (x.dataset.decline) { await del("goals", { id: x.dataset.decline }); await refresh(); }
    } catch (err) { setStatus(err.message, true); }
  };
}


/* ---------------- FEEDBACK (parents write; the nightly coach learns) ---------------- */
let fbKid = null, fbTone = "neutral";
document.addEventListener("click", e => { const a = e.target.closest("[data-fbkid]"); if (a) fbKid = a.dataset.fbkid; }, true);
const KINDS = ["strength", "struggle", "what_works", "watch", "interest"];
/* ---------------- ROADMAP: how we raise them + a one-direction map for each boy ---------------- */
const RMS = {
  en: { title: "Roadmap", principlesH: "How we raise them", principlesSub: "Confidence comes from being good at something real, making their own choices, and feeling they belong. Standing out comes from depth, not from doing everything.",
    checkH: "This week's parent checklist", checkSub: "Tick as you go. Both parents share one list.", weekOf: d => `Week of ${d}`, last8: "Last 8 weeks",
    mapH: n => `${n}'s road`, mapSub: "One direction only: where he is now and where he's heading. Each boy is measured against his own path, never against his brothers.",
    stages: { now: "Now – Jan 27", spring27: "Spring 2027", summer27: "Summer 2027", fall27: "Fall 2027", later: "Further ahead" },
    kinds: { activity: "Activity", habit: "Habit", milestone: "Milestone", focus: "Parent focus" },
    status: { planned: "Planned", active: "In progress", done: "Done", skipped: "Skipped" }, tap: "Tap a status to change it.",
    add: "Add to this road", addTitle: "What is it?", addWhy: "Why (optional)", save: "Add", del: "Remove", focusH: "Parent focus for him", progress: (d, t) => `${d} of ${t} done` },
  zh: { title: "成长路线", principlesH: "我们的养育原则", principlesSub: "自信来自真正擅长某件事、能自己做选择、以及有归属感。脱颖而出来自深度，而不是什么都做。",
    checkH: "本周家长清单", checkSub: "做完就打勾。父母共用一份清单。", weekOf: d => `${d} 这一周`, last8: "最近8周",
    mapH: n => `${n} 的成长路线`, mapSub: "只有一个方向：他现在在哪里、要往哪里去。每个孩子只和自己的路线比，从不和兄弟比较。",
    stages: { now: "现在 – 1月27日", spring27: "2027 春季", summer27: "2027 夏季", fall27: "2027 秋季", later: "更远的将来" },
    kinds: { activity: "活动", habit: "习惯", milestone: "里程碑", focus: "家长关注" },
    status: { planned: "计划中", active: "进行中", done: "已完成", skipped: "跳过" }, tap: "点击状态可以更改。",
    add: "添加到路线", addTitle: "内容是什么？", addWhy: "原因（可选）", save: "添加", del: "删除", focusH: "家长对他的关注点", progress: (d, t) => `已完成 ${d} / ${t}` } };
const PRINCIPLES = [
  ["🎯", "Help each boy build one spike", "Find what he returns to without being pushed, then help him go deep and make something real from it.", "帮每个孩子培养一个特长", "找到他不用催也会主动做的事，帮他深入下去，做出真正的成果。"],
  ["💬", "Praise effort and strategy, not talent", "“You planned that speech well” builds confidence that survives failure; “you're so smart” builds fear of looking dumb.", "表扬努力和方法，不表扬天赋", "“你这次演讲准备得很好”培养能经得起失败的自信；“你真聪明”会让孩子害怕显得笨。"],
  ["⚖️", "Never compare them", "Each boy's yardstick is his own progress — in what we say, our tone, and who gets asked about grades first.", "永远不比较", "每个孩子只和自己的进步比——包括我们说的话、语气，以及先问谁的成绩。"],
  ["🫶", "One-on-one time every week", "30 minutes with one parent, on something he chooses.", "每周一对一时间", "每周和一位家长单独相处30分钟，做他选择的事。"],
  ["🧭", "Let them make real decisions", "Choosing activities, a small budget, planning an outing. Kids who decide become adults who lead.", "让他们做真正的决定", "选活动、管小预算、计划出游。会做决定的孩子长大会成为领导者。"],
  ["🌱", "Let them fail small", "A lost bout, a bad round, a messy robot — then talk about what to do differently.", "允许小失败", "输一场比赛、一轮辩论没发挥好、机器人做得乱——然后聊聊下次怎么做。"],
  ["🏮", "Make the bilingual heritage a strength", "Keep Chinese alive at home as something special about them, not a chore.", "把双语和文化传承变成优势", "在家保持中文，让它成为他们的特别之处，而不是负担。"],
  ["🤝", "Teach them to serve and teach others", "Helping younger kids builds empathy and a quiet kind of confidence.", "教他们帮助和教导别人", "帮助年幼的孩子能培养同理心和沉稳的自信。"],
  ["😴", "Protect sleep, exercise and one free day", "They affect focus, mood and confidence more than any class.", "保护睡眠、运动和每周一天空闲", "它们对专注、情绪和自信的影响比任何课程都大。"]];
const CHECKS = [["one_on_one", "1:1 time", "一对一时间", true], ["praise", "Praised effort or strategy (not talent)", "表扬了努力或方法（不是天赋）", false], ["no_compare", "No comparisons between the boys", "没有比较兄弟", false], ["planning", "Sunday planning session with Eric", "和 Eric 的周日计划时间", false], ["read", "Read together / reading time", "一起阅读 / 阅读时间", false], ["free_day", "One free day for each boy", "每个孩子有一天空闲", false], ["games", "Family logic-game night", "家庭逻辑游戏之夜", false]];
const RM_STAGES = ["now", "spring27", "summer27", "fall27", "later"];
let rmKid = null;
const mondayISO = (off = 0) => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) - 7 * off); return d.toLocaleDateString("en-CA"); };
function viewRoadmap() {
  const t = T(), L = RMS[lang] || RMS.en, zh = lang === "zh";
  rmKid = rmKid && S.kids.some(k => k.id === rmKid) ? rmKid : S.kids[0]?.id; if (!rmKid) return;
  const ki = S.kids.findIndex(k => k.id === rmKid), name = esc(kidName(rmKid));
  const wk = mondayISO(), checks = S.parent_checks || [];
  const isDone = (w, item, kid = "") => checks.some(c => c.week === w && c.item === item && c.kid === kid && c.done);
  const weekCount = w => CHECKS.reduce((n, [id, , , per]) => n + (per ? S.kids.filter(k => isDone(w, id, k.id)).length : isDone(w, id) ? 1 : 0), 0);
  const maxPer = CHECKS.reduce((n, c) => n + (c[3] ? S.kids.length : 1), 0);
  const items = (S.roadmap_items || []).filter(r => r.kid === rmKid).sort((a, b) => a.sort - b.sort || a.created_at.localeCompare(b.created_at));
  const focus = items.filter(r => r.kind === "focus"), path = items.filter(r => r.kind !== "focus");
  const doneN = path.filter(r => r.status === "done").length;
  const tx = (r, f) => esc(zh && r[f + "_zh"] ? r[f + "_zh"] : r[f] || "");
  $("#view").innerHTML = `<div class="section-h"><h3>🧭 ${L.title}</h3></div>
  <details class="coach rmprin" ${localStorage.getItem("fh_rm_prin") === "0" ? "" : "open"}><summary><h4 style="display:inline">🌟 ${L.principlesH}</h4></summary><p class="meta">${L.principlesSub}</p>
    <div class="rmgrid">${PRINCIPLES.map(p => `<div class="rmp"><div class="rmpi">${p[0]}</div><b>${esc(zh ? p[3] : p[1])}</b><div class="meta">${esc(zh ? p[4] : p[2])}</div></div>`).join("")}</div></details>
  <div class="coach"><div class="section-h" style="margin:0"><h4>✅ ${L.checkH}</h4><span class="meta">${L.weekOf(fmtDate(wk))} · ${weekCount(wk)}/${maxPer}</span></div><p class="meta">${L.checkSub}</p>
    <div class="rmchecks">${CHECKS.map(([id, en, z, per]) => `<div class="rmck"><span>${esc(zh ? z : en)}</span><span class="rmckb">${per ? S.kids.map(k => `<button class="ckb ${isDone(wk, id, k.id) ? "on" : ""}" data-ck="${id}" data-ckk="${esc(k.id)}">${isDone(wk, id, k.id) ? "✓ " : ""}${esc(kidName(k.id))}</button>`).join("") : `<button class="ckb ${isDone(wk, id) ? "on" : ""}" data-ck="${id}" data-ckk="">${isDone(wk, id) ? "✓" : "○"}</button>`}</span></div>`).join("")}</div>
    <div class="rmhist"><span class="meta">${L.last8}:</span>${[7, 6, 5, 4, 3, 2, 1, 0].map(o => { const w = mondayISO(o), n = weekCount(w); return `<span class="rmh" title="${esc(w)}: ${n}/${maxPer}" style="opacity:${0.25 + 0.75 * n / maxPer}"></span>`; }).join("")}</div></div>
  <div class="section-h" style="margin-top:20px"><h3 style="font-size:18px">🛤️ ${L.mapH(name)}</h3><div class="tabs" id="rmTabs">${S.kids.map(x => `<button class="${x.id === rmKid ? "on" : ""}" data-rk="${esc(x.id)}">${esc(kidName(x.id))}</button>`).join("")}</div></div>
  <p class="meta">${L.mapSub} ${L.tap} <b>${L.progress(doneN, path.length)}</b></p>
  <div class="rmroad" style="--kc:${KC[ki % 3]}">${RM_STAGES.map((st, i) => { const list = path.filter(r => r.stage === st); return `<div class="rmstage"><div class="rmsh"><span class="rmdot">${i + 1}</span>${L.stages[st]}</div>
    ${list.map(r => `<div class="rmi ${r.status}"><div class="rmik">${L.kinds[r.kind]}</div><b>${tx(r, "title")}</b>${r.why ? `<div class="meta">${tx(r, "why")}</div>` : ""}<div class="rmia"><button class="rmst ${r.status}" data-rst="${r.id}">${L.status[r.status]}</button><button class="x" data-rdel="${r.id}" title="${L.del}">×</button></div></div>`).join("")}
    <details class="rmadd"><summary>+ ${L.add}</summary><input data-rat="${st}" placeholder="${esc(L.addTitle)}" maxlength="120"><input data-raw="${st}" placeholder="${esc(L.addWhy)}" maxlength="200"><select data-rak="${st}">${["activity", "habit", "milestone"].map(k => `<option value="${k}">${L.kinds[k]}</option>`).join("")}</select><button class="btn sm primary" data-radd="${st}">${L.save}</button></details></div>${i < RM_STAGES.length - 1 ? `<div class="rmarrow">→</div>` : ""}`; }).join("")}</div>
  ${focus.length ? `<div class="coach rmfocus" style="--kc:${KC[ki % 3]}"><h4>🎯 ${L.focusH}</h4>${focus.map(r => `<div class="rmf"><b>${tx(r, "title")}</b>${r.why ? ` — <span class="meta">${tx(r, "why")}</span>` : ""}</div>`).join("")}</div>` : ""}`;
  const pr = $("#view").querySelector(".rmprin"); pr.ontoggle = () => { try { localStorage.setItem("fh_rm_prin", pr.open ? "1" : "0"); } catch (e) {} };
  $("#rmTabs").onclick = e => { const b = e.target.closest("[data-rk]"); if (b) { rmKid = b.dataset.rk; viewRoadmap(); } };
  $("#view").onclick = async e => {
    const b = e.target.closest("button"); if (!b) return;
    try {
      if (b.dataset.ck) {
        const kid = b.dataset.ckk, ex = checks.find(c => c.week === wk && c.item === b.dataset.ck && c.kid === kid);
        const { error } = await sb.from("parent_checks").upsert({ week: wk, item: b.dataset.ck, kid, done: !(ex && ex.done), author: S.user?.email || null, updated_at: new Date().toISOString() }, { onConflict: "week,item,kid" }); if (error) throw error; return refresh();
      }
      if (b.dataset.rst) { const r = items.find(x => x.id === b.dataset.rst), order = ["planned", "active", "done", "skipped"], next = order[(order.indexOf(r.status) + 1) % 4];
        const { error } = await sb.from("roadmap_items").update({ status: next, updated_at: new Date().toISOString() }).eq("id", r.id); if (error) throw error; return refresh(); }
      if (b.dataset.rdel) { if (!b.dataset.armed) { b.dataset.armed = 1; b.textContent = t.confirm; return; } await del("roadmap_items", { id: b.dataset.rdel }); return refresh(); }
      if (b.dataset.radd) { const st = b.dataset.radd, title = $(`[data-rat="${st}"]`).value.trim(); if (!title) return;
        const { error } = await sb.from("roadmap_items").insert({ kid: rmKid, stage: st, sort: 100 + items.length, kind: $(`[data-rak="${st}"]`).value, title, why: $(`[data-raw="${st}"]`).value.trim() || null }); if (error) throw error; return refresh(); }
    } catch (err) { setStatus(err.message, true); }
  };
}

/* ---------------- PERFORMANCE: AMC timing, strengths, parent assessments ---------------- */
const AMC_T = { factors: ["🧱", "Factors & Primes", "因数与质数"], parity: ["🧦", "Even, Odd & Divisibility", "奇偶与整除"], bases: ["👽", "Bases & Digits", "进制与数位"], sequences: ["🪜", "Sequences & Series", "数列与求和"], ratios: ["🧃", "Ratios, Rates & Percents", "比率与百分比"], equations: ["⚖️", "Equations", "方程与不等式"], venn: ["⭕", "Sets & Venn", "集合与韦恩图"], triangles: ["🔺", "Triangles", "三角形与相似"], polygons: ["🛑", "Polygons", "多边形"], circles: ["🍕", "Circles", "圆"], volumes: ["🧊", "Volumes", "体积"], stats: ["📊", "Statistics", "统计"], counting: ["👕", "Counting", "排列组合"], probability: ["🎲", "Probability", "概率"] };
const amcTopic = id => { const x = AMC_T[id]; return x ? `${x[0]} ${lang === "zh" ? x[2] : x[1]}` : (lang === "zh" ? "🧩 逻辑与趣题" : "🧩 Logic & puzzles"); };
const PFS = {
  en: { title: "Performance", noData: n => `${n} hasn't opened the AMC app yet. Once he does, time on the platform, seconds per problem and strong / weak topics show up here automatically.`,
    time: "Time on the platform", thisWeek: "This week", last7: "Last 7 days", total: "All time", min: "min",
    attempts: "Problems tried", acc: "First-try accuracy", med: "Typical time / problem", pace: "Real AMC 8 pace is about 96 s per problem (25 in 40 min).",
    byTopic: "By topic", byLevel: "By difficulty", topic: "Topic", n: "Tried", right: "1st try", secs: "Typical s", flag: "Read",
    strong: "💪 Strong", weak: "🎯 Needs work", slow: "🐢 Knows it, needs speed", rush: "⚡ Rushing", early: "· too few yet",
    exams: "Exam scores", slowest: "Slowest recent problems", reading: "Lesson reading", readTxt: (n, m) => `${n} lesson sections read · ${m} min reading`,
    assessH: "Your assessment", assessSub: "Rate what you see at home. Saved next to the data, and the nightly coach reads it.", dims: { understanding: "Understanding", speed: "Speed", accuracy: "Carefulness", effort: "Effort", confidence: "Confidence" },
    dataSays: "Data:", notePh: "What did you notice? (e.g. rushes word problems, lights up on counting)", save: "Save assessment", history: "Past assessments", none: "No assessments yet.", saved: "Assessment saved",
    levels: { easy: "Easy", medium: "Medium", hard: "Hard" }, daily: "Daily", weekly: "Weekly" },
  zh: { title: "学习表现", noData: n => `${n} 还没有打开 AMC 应用。打开后，这里会自动显示学习时长、每题用时和强弱项。`,
    time: "平台学习时长", thisWeek: "本周", last7: "最近7天", total: "累计", min: "分钟",
    attempts: "做题数", acc: "一次答对率", med: "每题典型用时", pace: "真实 AMC 8 节奏约每题 96 秒（40 分钟 25 题）。",
    byTopic: "按知识点", byLevel: "按难度", topic: "知识点", n: "题数", right: "一次对", secs: "典型秒数", flag: "判断",
    strong: "💪 强项", weak: "🎯 需加强", slow: "🐢 会做但偏慢", rush: "⚡ 太急", early: "· 数据还少",
    exams: "考试成绩", slowest: "最近最慢的题", reading: "课程阅读", readTxt: (n, m) => `已读 ${n} 个课程环节 · 阅读 ${m} 分钟`,
    assessH: "家长评估", assessSub: "根据你在家看到的情况打分。会和数据放在一起，每晚的教练也会参考。", dims: { understanding: "理解", speed: "速度", accuracy: "细心", effort: "努力", confidence: "自信" },
    dataSays: "数据：", notePh: "你观察到什么？（例如：应用题太急、计数题很兴奋）", save: "保存评估", history: "历史评估", none: "还没有评估。", saved: "评估已保存",
    levels: { easy: "简单", medium: "中等", hard: "难" }, daily: "每日", weekly: "每周" } };
let pfKid = null;
const median = a => { if (!a.length) return null; const b = [...a].sort((x, y) => x - y), m = b.length >> 1; return b.length % 2 ? b[m] : Math.round((b[m - 1] + b[m]) / 2); };
// 🔒 Repeats (Bobby 11/23): a problem he already got right in the last 3 days doesn't count. The AMC app marks these (ev.rep);
// for saves from before that, mark them here on the fly.
function amcRep(events) {
  if (!events || !events.length) return events || []; const last = {};
  return events.map(e => { if (!("ok" in e) || !e.q || e.m === "scratch") return e; const prev = last[e.q];
    const rep = e.rep || (prev && (new Date(e.d) - new Date(prev)) / 864e5 <= 3); if (e.ok === true) last[e.q] = e.d; return rep && !e.rep ? { ...e, rep: true } : e; });
}
function amcStats(P) {
  P = { ...P, events: amcRep(P.events) };
  const ev = (P.events || []).filter(e => e.m !== "read" && typeof e.s === "number" && !e.blank && !e.rep); // repeats of recently-solved problems don't count
  const rd = (P.events || []).filter(e => e.m === "read");
  const grp = key => { const o = {}; ev.forEach(e => { const k = e[key] || "?"; (o[k] = o[k] || []).push(e); }); return o; };
  const sum = list => ({ n: list.length, acc: list.length ? Math.round(list.filter(e => e.ok).length / list.length * 100) : null, med: median(list.map(e => e.s)) });
  const flag = r => r.n < 4 ? "early" : r.acc >= 80 && r.med <= 96 ? "strong" : r.acc < 60 && r.med < 30 ? "rush" : r.acc < 60 ? "weak" : r.acc >= 75 && r.med > 120 ? "slow" : "";
  const topics = Object.entries(grp("t")).map(([t, l]) => ({ t, ...sum(l) })).map(r => ({ ...r, flag: flag(r) })).sort((a, b) => (a.acc ?? 0) - (b.acc ?? 0));
  const levels = ["easy", "medium", "hard"].map(lv => ({ lv, ...sum(ev.filter(e => e.lv === lv)) }));
  const day = d => (P.sessions || []).filter(x => x.date === d).reduce((a, x) => a + (x.active || 0), 0);
  const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); const iso = d.toLocaleDateString("en-CA"); return { iso, sec: day(iso) }; });
  const mon = (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.toLocaleDateString("en-CA"); })();
  const week = (P.sessions || []).filter(x => x.date >= mon).reduce((a, x) => a + (x.active || 0), 0);
  const total = (P.sessions || []).reduce((a, x) => a + (x.active || 0), 0);
  const slow = ev.slice(-80).filter(e => e.s > 0).sort((a, b) => b.s - a.s).slice(0, 8);
  return { all: sum(ev), topics, levels, days, week, total, slow, exams: ((P.exams || {}).log || []).slice(-12), readN: new Set(rd.filter(e => e.part == null).map(e => e.t + e.step)).size, readSec: rd.reduce((a, e) => a + (e.s || 0), 0) };
}
/* ---- 📈 Same measurement framework for every school subject (Bobby 2026-11-23): AMC, Physics and the six class rooms.
   Each subject shows the AMC panels: time, tries, fresh first-try accuracy, median speed, by unit (with flags), by level, checkpoints/tests,
   slowest questions, lessons read, plus the unit table (level, nightly-model status, checkpoint) and the school grade goal. ---- */
const PF_APPS = ["amc", "physics", "chem", "bio", "prealg", "english", "latin", "history", "robot"];
const PF_ROOMS = ["chem", "bio", "prealg", "english", "latin", "history"];
const PF_GRADE = { physics: "physics", bio: "bio", english: "english", latin: "latin", history: "history" };
const pfKey = (kid, app) => app === "robot" ? `${kid}_robot_state` : app === "amc" ? `${kid}_amc_progress` : app === "physics" ? `${kid}_physics_progress` : `${kid}_study_${app}`;
let pfApp = "amc";
function pfDays(kid, app, sessions) {
  const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toLocaleDateString("en-CA"); });
  const mon = (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.toLocaleDateString("en-CA"); })();
  const at = (S.app_time || []).filter(x => x.kid === kid && x.app === app);
  const secOf = d => { const a = at.find(x => x.date === d); if (a) return a.secs; return (sessions || []).filter(x => x.date === d).reduce((s, x) => s + (x.active || 0), 0); };
  const dates = new Set([...at.map(x => x.date), ...(sessions || []).map(x => x.date)]);
  return { days: days.map(iso => ({ iso, sec: secOf(iso) })), week: [...dates].filter(d => d >= mon).reduce((s, d) => s + secOf(d), 0), total: [...dates].reduce((s, d) => s + secOf(d), 0) };
}
function pfFlags(r, pace) { return r.n < 4 ? "early" : r.acc >= 80 && (r.med == null || r.med <= pace) ? "strong" : r.acc < 60 && r.med != null && r.med < pace * 0.3 ? "rush" : r.acc < 60 ? "weak" : r.acc >= 75 && r.med != null && r.med > pace * 1.25 ? "slow" : ""; }
function roomStats(P, app, kid) {
  const lvName = ["", "easy", "medium", "hard"];
  const ev = (P.log || []).filter(e => e.first && !e.rep && e.m !== "learn").map(e => ({ t: e.u, ok: !!e.ok, s: e.s || null, lv: lvName[Math.round(e.lv || 2)] || "medium", d: e.d, q: e.q, m: e.m }));
  const sum = list => { const ss = list.map(e => e.s).filter(x => x); return { n: list.length, acc: list.length ? Math.round(list.filter(e => e.ok).length / list.length * 100) : null, med: ss.length ? median(ss) : null }; };
  const grp = {}; ev.forEach(e => (grp[e.t] = grp[e.t] || []).push(e));
  const topics = Object.entries(grp).map(([t, l]) => ({ t, ...sum(l) })).map(r => ({ ...r, flag: pfFlags(r, 40) })).sort((a, b) => (a.acc ?? 0) - (b.acc ?? 0));
  const levels = ["easy", "medium", "hard"].map(lv => ({ lv, ...sum(ev.filter(e => e.lv === lv)) }));
  const ssApp = (S.skill_state || []).filter(x => x.kid === kid && x.app === app).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  const nm = id => (P.names || {})[id] ? P.names[id][lang === "zh" ? 1 : 0] : ((x => x ? (lang === "zh" && x.label_zh ? x.label_zh : x.label) : id)(ssApp.find(x => x.skill === id)));
  const exams = (P.tests || []).slice(-12).map(x => ({ date: x.d, score: x.score, of: x.n, kind: x.cp ? "weekly" : "daily", label: `${x.cp ? "🏁" : "📝"} ${nm(x.u)}` }));
  const slow = ev.slice(-80).filter(e => e.s).sort((a, b) => b.s - a.s).slice(0, 8);
  const learned = Object.values(P.learn || {}).filter(x => x && x.done).length;
  const units = (P.names ? Object.keys(P.names) : ssApp.map(x => x.skill)).map(u => { const ss = (S.skill_state || []).find(x => x.kid === kid && x.app === app && x.skill === u) || {}, cp = (P.cp || {})[u] || {}, r = topics.find(x => x.t === u);
    return { u, name: nm(u), lv: (P.lv || {})[u], status: ss.status, mastery: ss.mastery, n: r ? r.n : 0, acc: r ? r.acc : null, cp: cp.passed ? `🏁 ${cp.score}/10` : cp.failAt ? "❌" : "", learned: !!((P.learn || {})[u] || {}).done }; });
  return { all: sum(ev), topics, levels, ...pfDays(kid, app, null), slow, exams, readN: learned, readSec: 0, units, nm, pace: 40 };
}
function phyStats(P, kid) {
  const ev = (P.events || []).filter(e => e.m !== "read" && e.t && e.ok != null && !e.blank && e.first !== false).map(e => ({ t: e.t, ok: !!e.ok, s: e.secs || null, lv: e.m === "challenge" || e.m === "test" || e.m === "checkpoint" ? "hard" : e.m === "practice" ? "easy" : "medium", d: e.d, q: e.q, m: e.m }));
  const sum = list => { const ss = list.map(e => e.s).filter(x => x); return { n: list.length, acc: list.length ? Math.round(list.filter(e => e.ok).length / list.length * 100) : null, med: ss.length ? median(ss) : null }; };
  const grp = {}; ev.forEach(e => (grp[e.t] = grp[e.t] || []).push(e));
  const topics = Object.entries(grp).map(([t, l]) => ({ t, ...sum(l) })).map(r => ({ ...r, flag: pfFlags(r, 90) })).sort((a, b) => (a.acc ?? 0) - (b.acc ?? 0));
  const levels = ["easy", "medium", "hard"].map(lv => ({ lv, ...sum(ev.filter(e => e.lv === lv)) }));
  const exams = []; Object.entries(P.tests || {}).forEach(([u, t]) => (t.log || []).forEach(x => exams.push({ date: x.date, score: x.score, of: t.of || 10, kind: "daily", label: `📝 ${u}` })));
  Object.entries(P.cp || {}).forEach(([u, c]) => (c.tries || []).forEach(x => exams.push({ date: x.d, score: x.score, of: 10, kind: "weekly", label: `🏁 ${u}` })));
  exams.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const units = Object.keys(P.lessons || {}).map(u => { const ss = (S.skill_state || []).find(x => x.kid === kid && x.app === "physics" && x.skill === u) || {}, c = (P.cp || {})[u] || {}, r = topics.find(x => x.t === u);
    return { u, name: ss.label || u, lv: ss.difficulty, status: ss.status, mastery: ss.mastery, n: r ? r.n : 0, acc: r ? r.acc : null, cp: c.passed ? `🏁 ${c.score}/10` : c.failAt ? "❌" : "", learned: (P.lessons[u].read ?? -1) >= 3 }; });
  return { all: sum(ev), topics, levels, ...pfDays(kid, "physics", P.sessions), slow: [], exams: exams.slice(-12), readN: units.filter(x => x.learned).length, readSec: 0, units, nm: u => ((S.skill_state || []).find(x => x.kid === kid && x.app === "physics" && x.skill === u) || {}).label || u, pace: 90 };
}
// 🤖 Robot Lab (coding): attempts = code runs and answers per chapter; checkpoints = 🏁 code checks (Ellis light version, 11/23)
function robotStats(P, kid) {
  const log = P.log || [], chOf = id => (String(id).match(/^c\d+/) || [""])[0];
  const ev = log.filter(e => chOf(e.id)).map(e => ({ t: chOf(e.id), ok: !!e.ok, s: e.secs || null, lv: e.cp ? "hard" : "medium", d: e.d, q: e.cp ? "Code check question" : e.id, cp: !!e.cp }));
  const sum = list => { const ss = list.map(e => e.s).filter(x => x); return { n: list.length, acc: list.length ? Math.round(list.filter(e => e.ok).length / list.length * 100) : null, med: ss.length ? median(ss) : null }; };
  const grp = {}; ev.forEach(e => (grp[e.t] = grp[e.t] || []).push(e));
  const topics = Object.entries(grp).map(([t, l]) => ({ t, ...sum(l), flag: "" })).sort((a, b) => a.t.localeCompare(b.t, undefined, { numeric: true }));
  const ss = (S.skill_state || []).filter(x => x.kid === kid && x.app === "robot"), nm = u => (ss.find(x => x.skill === u) || {}).label || u;
  const exams = []; Object.entries(P.cp || {}).forEach(([u, c]) => (c.tries || []).forEach(x => exams.push({ date: x.d, score: x.score, of: 5, kind: "weekly", label: `🏁 ${nm(u)}` })));
  exams.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const chs = [...new Set([...Object.keys(grp), ...ss.map(x => x.skill)])].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const units = chs.map(u => { const s1 = ss.find(x => x.skill === u) || {}, c = (P.cp || {})[u] || {}, r = topics.find(x => x.t === u), solved = Object.keys(P.done || {}).filter(id => id.startsWith(u) && !/^c\d+\d/.test(id.slice(u.length)) && (P.done[id].stars || 0) > 0).length;
    return { u, name: `${nm(u)} · ${solved} solved`, lv: null, status: s1.status, mastery: s1.mastery, n: r ? r.n : 0, acc: r ? r.acc : null, cp: c.passed ? `🏁 ${c.score}/5` : c.failAt ? "❌" : "", learned: !!(P.seen || {})[u] }; });
  return { all: sum(ev.filter(e => !e.cp)), topics, levels: [], ...pfDays(kid, "robot", null), slow: [], exams: exams.slice(-12), readN: Object.keys(P.seen || {}).length, readSec: 0, units, nm, pace: 120 };
}
function pfExtra(st, app, kid) {
  const zh = lang === "zh", gm = PF_GRADE[app] && (S.metrics || []).find(m => m.id === `${kid}-${PF_GRADE[app]}-grade`);
  let g = "";
  if (gm) { const cur = curLevel(gm), span = (+gm.target) - (+gm.baseline), p = span ? Math.max(0, Math.min(1, (cur - (+gm.baseline)) / span)) : 1;
    g = `<div class="coach"><h4>🏫 ${zh ? "学校成绩目标" : "School grade goal"}</h4><p>${esc(zh && gm.name_zh ? gm.name_zh : gm.name)}: ${+gm.baseline}% → <b>${cur}%</b> → ${+gm.target}% ${zh ? "截止" : "by"} ${esc(gm.deadline || "")}</p><span class="pfbar" style="width:100%"><i style="width:${Math.round(p * 100)}%"></i></span>
      <p class="meta">${zh ? "这里的练习正确率是方向，真正的成绩以学校成绩单为准。新成绩出来后在仪表板里更新。" : "Practice accuracy here points the way; the real measure is the school grade. Update it on the dashboard when a new grade comes in."}</p></div>`; }
  if (!st.units || !st.units.length) return g;
  const STN = zh ? { mastered: "已掌握", review: "该复习", learning: "练习中", started: "刚开始", lacking: "需要帮助", slow: "会但慢", rushing: "太急", new: "未开始" } : { mastered: "mastered", review: "review due", learning: "working on it", started: "just started", lacking: "needs help", slow: "right but slow", rushing: "rushing", new: "not started" };
  const stl = x => x ? `${LN_ST[x] ? LN_ST[x][0] : ""} ${STN[x] || x}` : "—";
  return g + `<div class="coach"><h4>🧱 ${zh ? "单元总览" : "Units at a glance"}</h4><table class="pft"><tr><th>${zh ? "单元" : "Unit"}</th><th>📖</th><th>${zh ? "题数" : "Tries"}</th><th>${zh ? "首答对" : "Right"}</th><th>🎚️</th><th>${zh ? "夜间模型" : "Model"}</th><th>🏁</th></tr>
    ${st.units.map(r => `<tr><td>${esc(r.name)}</td><td>${r.learned ? "✓" : ""}</td><td>${r.n}</td><td>${r.acc == null ? "—" : r.acc + "%"}</td><td>${r.lv == null ? "—" : Math.round(r.lv)}</td><td>${stl(r.status)}${r.mastery != null ? ` <span class="meta">${Math.round(r.mastery * 100)}%</span>` : ""}</td><td>${r.cp}</td></tr>`).join("")}</table>
    <p class="meta">${zh ? "只算新题的第一次作答（不算重复题和课中小测）。🎚️ 级别随对错自动升降。夜间模型每晚更新掌握度。" : "Counts first tries on fresh questions only (no repeats, no in-lesson checks). 🎚️ level moves with right/wrong answers. The nightly model updates mastery every evening."}</p></div>`;
}
function viewPerformance() {
  const t = T(); let L = PFS[lang] || PFS.en;
  pfKid = pfKid && S.kids.some(k => k.id === pfKid) ? pfKid : (S.kids.find(k => (S.app_saves || []).some(a => a.kid === k.id && a.app === "amc")) || S.kids[0])?.id; if (!pfKid) return;
  const name = esc(kidName(pfKid)), ki = S.kids.findIndex(k => k.id === pfKid);
  const appsHere = PF_APPS.filter(a => (S.app_saves || []).some(x => x.kid === pfKid && x.app === a)); if (!appsHere.includes(pfApp)) pfApp = appsHere[0] || "amc";
  const save = (S.app_saves || []).find(a => a.kid === pfKid && a.app === pfApp);
  const P = save && save.data ? save.data[pfKey(pfKid, pfApp)] : null;
  const subj = S.subjects.find(x => x.kid === pfKid && x.app_url === pfApp + "/");
  if (pfApp !== "amc") { const zh = lang === "zh", nmA = lnApp(pfApp), pace = pfApp === "physics" ? 90 : pfApp === "robot" ? 120 : 40;
    L = Object.assign({}, L, { noData: n => zh ? `${n} 还没有用过${nmA}。` : `${n} hasn't used ${nmA} yet.`, attempts: zh ? "新题首答数" : "Fresh questions tried",
      pace: pfApp === "robot" ? (zh ? "机器人实验室：每次运行代码都算一次尝试（失败的运行也算，这是编程的正常过程）；🏁 代码检查才是真正的测验。" : "Robot Lab: every code run counts as a try (failed runs are a normal part of coding); the 🏁 code checks are the real test.") : zh ? `${nmA}：每题约 ${pace} 秒算正常节奏；只算新题第一次作答。` : `${nmA}: about ${pace} s per question is a normal pace. Only first tries on fresh questions count.`,
      byTopic: zh ? "按单元" : "By unit", topic: zh ? "单元" : "Unit", exams: zh ? "关卡和单元测" : "Checkpoints & unit tests",
      readTxt: n => zh ? `已学完 ${n} 个单元的课` : `${n} unit lesson${n === 1 ? "" : "s"} finished` }); }
  const tp = id => pfApp === "amc" ? amcTopic(id) : esc(st && st.nm ? st.nm(id) : id);
  const asses = (S.assessments || []).filter(a => a.kid === pfKid).sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));
  const st = P ? (pfApp === "amc" ? amcStats(P) : pfApp === "physics" ? phyStats(P, pfKid) : pfApp === "robot" ? robotStats(P, pfKid) : roomStats(P, pfApp, pfKid)) : null;
  const mins = s => Math.round((s || 0) / 60);
  const pct = v => v == null ? "—" : v + "%";
  const sec = v => v == null ? "—" : v + " s";
  const bar = (v, max, c) => `<span class="pfbar"><i style="width:${Math.min(100, (v || 0) / (max || 1) * 100)}%;background:${c || "var(--kc)"}"></i></span>`;
  const dataFor = { understanding: st && st.all.acc != null ? pct(st.all.acc) : "", accuracy: st && st.all.acc != null ? pct(st.all.acc) : "", speed: st && st.all.med != null ? sec(st.all.med) : "", effort: st ? `${mins(st.week)} ${L.min}/${L.thisWeek}` : "", confidence: "" };
  const lastA = asses[0] || {};
  const dims = Object.keys(L.dims);
  const maxDay = Math.max(1, ...((st && st.days) || []).map(d => d.sec));
  $("#view").innerHTML = `<div class="section-h"><h3>📈 ${L.title}</h3><div class="tabs" id="pfTabs">${S.kids.map(x => `<button class="${x.id === pfKid ? "on" : ""}" data-pk="${esc(x.id)}">${esc(kidName(x.id))}</button>`).join("")}</div></div>
  <div class="tabs" id="pfApps" style="margin:6px 0 12px">${appsHere.map(a => `<button class="${a === pfApp ? "on" : ""}" data-pa="${a}">${lnApp(a)}</button>`).join("")}</div>
  <div class="fbgrid" style="--kc:${KC[ki % 3]}"><div>
    ${!st ? `<div class="coach"><p>${L.noData(name)}</p></div>` : `
    <div class="pfkpis">
      <div class="pfk"><b>${mins(st.week)}<small> ${L.min}</small></b><span>⏱ ${L.time} · ${L.thisWeek}</span></div>
      <div class="pfk"><b>${st.all.n}</b><span>✏️ ${L.attempts}</span></div>
      <div class="pfk"><b>${pct(st.all.acc)}</b><span>🎯 ${L.acc}</span></div>
      <div class="pfk ${st.all.med > 120 ? "warn" : ""}"><b>${sec(st.all.med)}</b><span>🐢 ${L.med}</span></div></div>
    <p class="meta">${L.pace} ${L.total}: ${mins(st.total)} ${L.min}.</p>
    ${pfApp !== "amc" ? pfExtra(st, pfApp, pfKid) : ""}
    <div class="coach"><h4>⏱ ${L.last7}</h4><div class="pfdays">${st.days.map(d => `<div><span class="pfcol"><i style="height:${Math.round(d.sec / maxDay * 100)}%"></i></span><small>${d.iso.slice(5)}</small><b>${mins(d.sec)}</b></div>`).join("")}</div></div>
    <div class="coach"><h4>🧭 ${L.byTopic}</h4><table class="pft"><tr><th>${L.topic}</th><th>${L.n}</th><th>${L.right}</th><th>${L.secs}</th><th>${L.flag}</th></tr>
      ${st.topics.map(r => `<tr><td>${tp(r.t)}</td><td>${r.n}</td><td>${bar(r.acc, 100)} ${pct(r.acc)}</td><td>${sec(r.med)}</td><td>${r.flag === "early" ? `<span class="meta">${L.early}</span>` : r.flag ? L[r.flag] : ""}</td></tr>`).join("")}</table></div>
    <div class="coach"><h4>📶 ${L.byLevel}</h4><table class="pft">${st.levels.map(r => `<tr><td>${L.levels[r.lv]}</td><td>${r.n}</td><td>${bar(r.acc, 100)} ${pct(r.acc)}</td><td>${sec(r.med)}</td></tr>`).join("")}</table></div>
    ${st.exams.length ? `<div class="coach"><h4>🏁 ${L.exams}</h4><div class="pfexams">${st.exams.map(x => `<div title="${esc(x.date)}"><span class="pfcol"><i style="height:${Math.round(x.score / x.of * 100)}%;background:${x.kind === "weekly" ? "#7c5cff" : "var(--kc)"}"></i></span><small>${esc((x.date || "").slice(5))}</small><b>${x.score}/${x.of}</b><small>${x.label ? esc(x.label) : x.kind === "weekly" ? L.weekly : L.daily}</small></div>`).join("")}</div></div>` : ""}
    ${st.slow.length ? `<div class="coach"><h4>🐢 ${L.slowest}</h4>${st.slow.map(e => `<div class="pfslow"><b>${e.s}s</b> ${e.ok ? "✅" : "❌"} <span class="meta">${tp(e.t)} · ${L.levels[e.lv] || ""} · ${esc(e.d || "")}</span><div>${esc(e.q || "")}${(e.q || "").length >= 90 ? "…" : ""}</div></div>`).join("")}</div>` : ""}
    <div class="coach"><h4>📖 ${L.reading}</h4><p>${L.readTxt(st.readN, mins(st.readSec))}</p></div>`}
  </div><div>
    <div class="coach"><h4>📝 ${L.assessH}: ${name}</h4><p class="meta">${L.assessSub}</p>
      ${dims.map(d => `<div class="pfdim"><span>${L.dims[d]}</span><div class="seg pfseg" data-dim="${d}">${[1, 2, 3, 4, 5].map(n => `<button data-n="${n}" class="${lastA[d] === n ? "was" : ""}">${n}</button>`).join("")}</div>${dataFor[d] ? `<small class="meta">${L.dataSays} ${dataFor[d]}</small>` : ""}</div>`).join("")}
      <textarea id="pfNote" rows="3" maxlength="2000" placeholder="${esc(L.notePh)}"></textarea>
      <div class="fbrow"><button class="btn primary" id="pfSave">${L.save}</button></div></div>
    <div class="section-h" style="margin-top:18px"><h3 style="font-size:16px">${L.history} <span class="meta">(${asses.length})</span></h3></div>
    ${asses.length ? asses.slice(0, 20).map(a => `<div class="fbitem neutral"><div class="meta">${fmtDate(a.date)}${a.author ? ` · ${esc(a.author.split("@")[0])}` : ""}<button class="x" data-delas="${a.id}" title="${t.del}">×</button></div><div class="pfchips">${dims.filter(d => a[d]).map(d => `<span class="chip">${L.dims[d]} ${"●".repeat(a[d])}${"○".repeat(5 - a[d])}</span>`).join("")}</div>${a.note ? `<div class="n">${esc(a.note)}</div>` : ""}</div>`).join("") : `<p class="meta">${L.none}</p>`}
    ${pfApp !== "amc" ? "" : `<div class="coach" style="margin-top:18px"><h4>🤖 ${lang === "zh" ? "他问 Buddy 的问题" : "Questions he asked Buddy"}</h4>
      <p class="meta">${lang === "zh" ? "AMC 应用里的学习助手。看看哪些词或概念让他卡住。" : "The helper next to his AMC lessons. Shows which words and ideas trip him up."}</p>
      ${(() => { const asks = ((P && P.events) || []).filter(e => e.m === "ask").slice(-25).reverse(); return asks.length ? `<div class="pfask">${asks.map(e => `<div class="pfslow"><span class="meta">${esc(e.d || "")}</span> ${e.ai ? "🤖" : e.hit ? "📖" : "❓"} <b>${esc(e.q || "")}</b>${e.hit ? ` <span class="meta">→ ${esc(e.hit)}</span>` : e.ai ? ` <span class="meta">→ AI</span>` : ` <span class="meta">(${lang === "zh" ? "没找到" : "not found"})</span>`}</div>`).join("")}</div>` : `<p class="meta">${lang === "zh" ? "还没有问题。" : "No questions yet."}</p>`; })()}
      <div id="pfTutor"></div></div>`}
  </div></div>`;
  const pick = {};
  (async () => { try { const { data, error } = await sb.from("tutor_log").select("created_at,question,answer,model").eq("kid", pfKid).order("created_at", { ascending: false }).limit(15); const box = $("#pfTutor");
    if (!box || error || !data || !data.length) return;
    box.innerHTML = `<h4 style="margin-top:10px">${lang === "zh" ? "AI 回答（最近 15 条）" : "AI answers (latest 15)"}</h4>` + data.map(r => `<details class="pfslow"><summary><span class="meta">${esc((r.created_at || "").slice(0, 10))}</span> <b>${esc(r.question)}</b></summary><div style="white-space:pre-wrap">${esc(r.answer || "")}</div></details>`).join(""); } catch (e) {} })();
  $("#pfApps").onclick = e => { const b = e.target.closest("[data-pa]"); if (b) { pfApp = b.dataset.pa; viewPerformance(); } };
  $("#pfTabs").onclick = e => { const b = e.target.closest("[data-pk]"); if (b) { pfKid = b.dataset.pk; viewPerformance(); } };
  $("#view").querySelectorAll(".pfseg").forEach(g => g.onclick = e => { const b = e.target.closest("[data-n]"); if (!b) return; pick[g.dataset.dim] = +b.dataset.n; g.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); });
  $("#pfSave").onclick = async () => {
    const note = $("#pfNote").value.trim(); if (!note && !Object.keys(pick).length) return;
    try { const { error } = await sb.from("assessments").insert({ kid: pfKid, subject_id: subj?.id || null, date: today(), author: S.user?.email || null, note: note || null, ...pick }); if (error) throw error; setStatus(L.saved); refresh(); } catch (err) { setStatus(err.message, true); }
  };
  $("#view").querySelectorAll("[data-delas]").forEach(x => x.onclick = async () => { if (!x.dataset.armed) { x.dataset.armed = 1; x.textContent = t.confirm; return; } try { await del("assessments", { id: x.dataset.delas }); refresh(); } catch (err) { setStatus(err.message, true); } });
}

function viewFeedback() {
  const t = T(); fbKid = fbKid && S.kids.some(k => k.id === fbKid) ? fbKid : S.kids[0]?.id; if (!fbKid) return;
  const k = S.kids.find(x => x.id === fbKid), name = esc(kidName(fbKid)), ki = S.kids.indexOf(k);
  const fbs = (S.feedback || []).filter(f => f.kid === fbKid).sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));
  const ins = (S.insights || []).filter(i => i.kid === fbKid);
  const live = ins.filter(i => i.kind !== "adjustment" && i.status !== "dismissed");
  const adj = ins.filter(i => i.kind === "adjustment" && i.status === "proposed");
  const subs = S.subjects.filter(x => x.kid === fbKid && x.active !== false);
  const lastLearn = [...fbs.map(f => f.learned_at), ...ins.filter(i => i.source === "coach").map(i => i.updated_at)].filter(Boolean).sort().pop();
  const unread = fbs.filter(f => !f.learned_at).length;
  const txt = i => esc(lang === "zh" && i.text_zh ? i.text_zh : i.text);
  const who = em => { const u = (em || "").split("@")[0]; return u ? esc(u) : ""; };
  const subjName = id => { const x = S.subjects.find(s => s.id === id); return x ? `${x.icon || ""} ${esc(lang === "zh" && x.name_zh ? x.name_zh : x.name)}` : ""; };
  $("#view").innerHTML = `<div class="section-h"><h3>💬 ${t.fbTitle}</h3><div class="tabs" id="fbTabs">${S.kids.map(x => `<button class="${x.id === fbKid ? "on" : ""}" data-fk="${esc(x.id)}">${esc(kidName(x.id))}</button>`).join("")}</div></div>
    <div class="fbgrid" style="--kc:${KC[ki % 3]}">
      <div>
        <div class="coach fbwrite"><h4>✍️ ${t.fbWriteH(name)}</h4>
          <div class="fbprompts">${t.fbPrompts.map(p => `<button data-prompt="${esc(p)}">${esc(p)}</button>`).join("")}</div>
          <textarea id="fbBody" rows="5" maxlength="4000" placeholder="${esc(t.fbPlaceholder(kidName(fbKid)))}"></textarea>
          <div class="fbrow"><div class="seg tone" id="fbTone">${[["positive", "🟢 " + t.toneWin], ["neutral", "⚪ " + t.toneNote], ["concern", "🟠 " + t.toneConcern]].map(([v, l]) => `<button class="${fbTone === v ? "on" : ""}" data-v="${v}">${l}</button>`).join("")}</div>
            ${subs.length ? `<select id="fbSubj"><option value="">${t.fbAnySubject}</option>${subs.map(x => `<option value="${x.id}">${x.icon || ""} ${esc(lang === "zh" && x.name_zh ? x.name_zh : x.name)}</option>`).join("")}</select>` : ""}
            <button class="btn primary" id="fbSave">${t.fbSave}</button></div>
          <p class="meta" style="margin-top:8px">🔒 ${t.fbPrivate}</p></div>
        <div class="section-h" style="margin-top:22px"><h3 style="font-size:16px">${t.fbHistory} <span class="meta">(${fbs.length})</span></h3>${unread ? `<span class="chip">${t.fbUnread(unread)}</span>` : ""}</div>
        ${fbs.length ? fbs.slice(0, 40).map(f => `<div class="fbitem ${f.tone}"><div class="meta">${fmtDate(f.date)}${f.author ? ` · ${who(f.author)}` : ""}${f.subject_id ? ` · ${subjName(f.subject_id)}` : ""} ${f.learned_at ? `<span class="learned">✓ ${t.fbLearned}</span>` : `<span class="pending">⏳ ${t.fbPending}</span>`}<button class="x" data-delfb="${f.id}" title="${t.del}">×</button></div><div class="n">${esc(f.body)}</div></div>`).join("") : `<p class="meta">${t.fbEmpty}</p>`}
      </div>
      <div>
        <div class="coach"><h4>🧠 ${t.learnH(name)}</h4><p class="meta">${lastLearn ? t.learnLast(fmtDate(lastLearn.slice(0, 10))) : t.learnNever}</p>
          ${adj.length ? `<div class="adjbox"><b>⚙️ ${t.adjH}</b>${adj.map(a => { const m = S.metrics.find(x => x.id === a.metric_id), c = a.change || {};
            return `<div class="adj"><div>${txt(a)}</div>${m && c.field ? `<div class="meta">${esc(mName(m))}: ${esc(t.fieldNames[c.field] || c.field)} <s>${esc(String(m[c.field] ?? c.from ?? "—"))}</s> → <b>${esc(String(c.to))}</b></div>` : ""}${a.evidence ? `<div class="meta">${t.because} ${esc(a.evidence)}</div>` : ""}
              <div class="adjbtns"><button class="btn sm primary" data-apply="${a.id}">${m && c.field ? t.adjApply : t.adjOk}</button><button class="btn sm" data-dismiss="${a.id}">${t.adjNo}</button></div></div>`; }).join("")}</div>` : ""}
          ${KINDS.map(kd => { const list = live.filter(i => i.kind === kd).sort((a, b) => (b.status === "confirmed") - (a.status === "confirmed") || b.confidence - a.confidence); if (!list.length) return "";
            return `<div class="insk"><div class="inskh">${t.kindNames[kd]}</div>${list.map(i => `<div class="ins ${i.status}"><div class="it">${txt(i)} <span class="conf" title="${t.confT}">${"●".repeat(i.confidence)}${"○".repeat(3 - i.confidence)}</span>${i.status === "confirmed" ? ` <span class="okb">✓ ${t.youConfirmed}</span>` : ""}</div>
              ${i.evidence ? `<div class="meta">${t.because} ${esc(i.evidence)}</div>` : ""}
              <div class="insbtns">${i.status !== "confirmed" ? `<button data-confirm="${i.id}">👍 ${t.insYes}</button>` : ""}<button data-dismiss="${i.id}">✕ ${t.insNo}</button></div></div>`).join("")}</div>`; }).join("")}
          <details class="addins"><summary>+ ${t.addInsight}</summary><div class="fbrow" style="margin-top:8px"><select id="insKind">${KINDS.map(kd => `<option value="${kd}">${t.kindNames[kd]}</option>`).join("")}</select><input id="insText" maxlength="300" placeholder="${esc(t.addInsightPh)}" style="flex:1;min-width:180px"><button class="btn sm primary" id="insAdd">${t.add}</button></div></details>
          <p class="meta" style="margin-top:12px">${t.learnHow}</p></div>
      </div></div>`;
  $("#fbTabs").onclick = e => { const b = e.target.closest("[data-fk]"); if (b) { fbKid = b.dataset.fk; viewFeedback(); } };
  $("#fbTone").onclick = e => { const b = e.target.closest("[data-v]"); if (!b) return; fbTone = b.dataset.v; $("#fbTone").querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); };
  $("#view").onclick = async e => {
    const x = e.target.closest("button"); if (!x) return;
    try {
      if (x.dataset.prompt) { const ta = $("#fbBody"); ta.value = (ta.value ? ta.value.trimEnd() + "\n" : "") + x.dataset.prompt + " "; ta.focus(); return; }
      if (x.id === "fbSave") {
        const body = $("#fbBody").value.trim(); if (!body) return $("#fbBody").focus();
        const { error } = await sb.from("feedback").insert({ kid: fbKid, body, tone: fbTone, subject_id: $("#fbSubj")?.value || null, date: today() }); if (error) throw error;
        fbTone = "neutral"; await refresh(); setStatus(t.fbSaved); return;
      }
      if (x.dataset.delfb) { if (!x.dataset.armed) { x.dataset.armed = 1; x.textContent = t.confirm; return; } await del("feedback", { id: x.dataset.delfb }); return refresh(); }
      if (x.dataset.confirm) { const { error } = await sb.from("insights").update({ status: "confirmed", updated_at: new Date().toISOString() }).eq("id", x.dataset.confirm); if (error) throw error; return refresh(); }
      if (x.dataset.dismiss) { const { error } = await sb.from("insights").update({ status: "dismissed", updated_at: new Date().toISOString() }).eq("id", x.dataset.dismiss); if (error) throw error; return refresh(); }
      if (x.dataset.apply) {
        const a = S.insights.find(i => i.id === x.dataset.apply), c = a?.change || {};
        if (a.metric_id && c.field && ["target", "per_week", "deadline", "baseline"].includes(c.field)) { const { error } = await sb.from("metrics").update({ [c.field]: c.to }).eq("id", a.metric_id); if (error) throw error; }
        const { error } = await sb.from("insights").update({ status: "applied", updated_at: new Date().toISOString() }).eq("id", a.id); if (error) throw error; await refresh(); setStatus(t.adjDone); return;
      }
      if (x.id === "insAdd") { const v = $("#insText").value.trim(); if (!v) return; const { error } = await sb.from("insights").insert({ kid: fbKid, kind: $("#insKind").value, text: v, status: "confirmed", confidence: 3, source: "parent", evidence: t.fromParent }); if (error) throw error; return refresh(); }
    } catch (err) { setStatus(err.message || "Save failed", true); }
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
/* ---- Robot Lab (coding & robotics): parent summary from app_saves ---- */
const ROBO_CH = [["c1", "🚀 Commands", 7], ["c2", "🔁 Loops", 7], ["c3", "🧩 Functions", 5], ["c4", "📡 Sensors & if", 6], ["c5", "♾️ While loops", 6], ["c6", "🌀 Maze algorithms", 5], ["c7", "📦 Variables", 6], ["c8", "〰️ Line following", 4], ["c9", "🏆 Final mission", 1]];
function robotStatsHtml(kid) {
  const zh = lang === "zh", save = (S.app_saves || []).find(a => a.kid === kid && a.app === "robot"), P = save && save.data ? save.data[`${kid}_robot_state`] : null;
  if (!P || !P.done) return `<p class="meta" style="margin-top:8px">🤖 ${zh ? "还没开始 Robot Lab。" : "Robot Lab not started yet."}</p>`;
  const done = P.done, ids = Object.keys(done).filter(k => done[k].stars > 0), stars = ids.reduce((a, k) => a + (done[k].stars || 0), 0);
  const total = ROBO_CH.reduce((a, c) => a + c[2], 0), since = Date.now() - 7 * 864e5, log = (P.log || []).filter(l => l.ts >= since);
  const days = new Set(log.map(l => l.d)).size, runs = log.length, solved = log.filter(l => l.ok).length;
  const hard = Object.entries(done).filter(([k, d]) => (d.tries || 0) >= 5).sort((a, b) => b[1].tries - a[1].tries).slice(0, 3);
  const cur = ROBO_CH.find(c => ids.filter(k => k.startsWith(c[0])).length < c[2]);
  return `<div class="pfslow" style="margin-top:8px"><b>🤖 Robot Lab</b> · ⭐ ${stars} · ${ids.length}/${total} ${zh ? "关" : "levels"} · ${zh ? "现在" : "now on"}: <b>${cur ? cur[1] : (zh ? "全部完成 🏆" : "all done 🏆")}</b><br>
    <span class="meta">${zh ? "最近7天" : "Last 7 days"}: ${days} ${zh ? "天" : "days"} · ${runs} ${zh ? "次运行" : "code runs"} · ${solved} ${zh ? "次通关" : "solved"}</span>
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">${ROBO_CH.map(c => { const n = ids.filter(k => k.startsWith(c[0])).length; return `<span class="meta" style="border:1px solid #ffffff33;border-radius:8px;padding:2px 6px">${c[1]} ${n}/${c[2]}</span>`; }).join("")}</div>
    ${hard.length ? `<div class="meta" style="margin-top:4px">${zh ? "花了最多次尝试" : "Took the most tries"}: ${hard.map(([k, d]) => `${esc(k)} (${d.tries})`).join(", ")}</div>` : ""}</div>`;
}
/* ---- Ellis's Think Habit (fencing app): daily checklist + Idea Checks, from app_saves ---- */
function thinkStatsHtml(kid) {
  const zh = lang === "zh", save = (S.app_saves || []).find(a => a.kid === kid && a.app === "fencing"), D = save && save.data ? save.data : {};
  const g = k => { let v = D[`${kid}_${k}`]; if (typeof v === "string") { try { v = JSON.parse(v); } catch (e) {} } return v; };
  const today = new Date().toLocaleDateString("en-CA"), dl = g("dailyList"), sk = g("dailyStreak") || {}, idea = g("thIdeaToday"), tl = g("thinkLog"), it = g("ideaToday"), st = (g("state") || {}).ideaStats;
  const log = Array.isArray(tl) ? tl : [], wk = log.filter(r => r.at >= Date.now() - 7 * 864e5), lab = ["😶", "🤏", "👍", "🌟"];
  const items = [["idea", "💡", zh ? "选好今天的主意" : "today's idea", !!(idea && idea.d === today)], ["play", "🎮", zh ? "带主意打3剑" : "3 touches with an idea", (it && it.d === today && it.n >= 3) || !!(dl && dl.d === today && dl.done && dl.done.play)], ["drill", "🏋️", zh ? "一个真实练习" : "one drill", (() => { const r = g("rematchDrills"); return !!(r && r.done && Object.keys(r.done).some(k => k.startsWith(today + "|"))); })()], ["tell", "🗣️", zh ? "告诉爸妈主意" : "told you his idea", !!(dl && dl.d === today && dl.done && dl.done.tell)], ["check", "📝", zh ? "主意检查" : "Idea Check", log.some(r => r.d === today)]];
  const done = dl && dl.d === today && dl.bonus;
  const ideaTxt = idea && idea.d === today ? (idea.txt || idea.id) : (zh ? "还没选" : "not picked yet");
  return `<div class="coach"><h4>💡 ${zh ? "思考习惯（每日清单）" : "Think Habit (daily list)"}</h4>
    <div class="meta">${zh ? "今天" : "Today"}: ${done ? (zh ? "✅ 全部完成" : "✅ all 5 done") : items.map(x => `${x[3] ? "✅" : "⬜"} ${x[1]} ${x[2]}`).join(" · ")} · 🔥 ${sk.n || 0} ${zh ? "天连续" : "-day streak"}</div>
    <div class="meta">${zh ? "今天的主意" : "Today's idea"}: <b>${esc(String(ideaTxt))}</b></div>
    <div class="meta">${zh ? "最近7天主意检查" : "Idea Checks, last 7 days"}: ${wk.length}${wk.length ? " · " + wk.map(r => lab[r.how] || "").join(" ") : ""}${st && st.touches ? ` · ${zh ? "Piste Duel 坚持主意" : "Piste Duel: stuck to his idea"} ${st.followed}/${st.touches}` : ""}</div>
    ${log.filter(r => r.worked).slice(-2).reverse().map(r => `<div class="meta">💡 ${esc(r.worked)} (${r.d})</div>`).join("")}
    <div class="meta">${zh ? "问他：“今天你的主意是什么？管用吗？”" : "Ask him: \"What was your idea today, and did it work?\""}</div></div>`;
}
/* ---- Space Quest (Jonah's math + words game): parent summary from app_saves ---- */
const SQ_W = ["", "Find the picture", "First sounds", "Rhyming words", "Short a words", "Short e, i, o, u words", "Missing letter", "Sight words 1", "Blends", "Digraphs", "Sight words 2", "Magic e", "Read a sentence", "Fill in the sentence", "Opposites", "Word meanings", "Story time"];
const SQ_G = { g1: { en: "Grade 1", zh: "一年级", n: 15 }, g2: { en: "Grade 2", zh: "二年级", n: 14 }, g3: { en: "Grade 3", zh: "三年级", n: 20 }, words: { en: "Reading", zh: "阅读", n: 16 }, zh: { en: "中文", zh: "中文", n: 10 } };
const SQ_L = { en: { t: "🚀 Space Quest progress", none: "No missions flown yet. He opens it from the 🚀 Space Quest card on his page.", stars: "mission stars", coins: "coins", wk: "Last 7 days", days: "days played", min: "min", q: "questions", ft: "first-try", skill: "Topic", acc: "First-try correct", n: "Questions", planet: "Planet", locked: "locked", note: "Grade 1–3 math (all areas: operations, place value, fractions, time, money, measurement incl. metric, graphs, geometry) + reading (16 planets: phonics, blends, digraphs, magic e, sight words, sentences, stories) + 中文 (10 planets, read aloud in Mandarin). Each planet = 2 missions + a boss; the boss unlocks the next planet, the last planet unlocks the next grade. 20 minutes of play, then a 5-minute break he can't skip (countdown + movement ideas); trophies unlock special rockets, skins and lasers. Mission types: Asteroid Blast, Star Race, Alien Rescue, Comet Catch, Crystal Cave, plus retro arcade rounds (Alien Rows, Brick Breaker, Block Drop, Maze Muncher, River Hopper, Pixel Jumper), and a Boss; optional retro 8-bit look in the hangar. Perfect (3-star) missions open a treasure chest (coins or rare items). A mistake costs 2 coins and a shield. After each wrong answer a card says what he picked, why it's wrong and a hint (2nd miss: the answer and a worked explanation); it is read aloud and the button stays locked until it has been heard. Missed questions come back at the end of the mission (same question) and again at the start of a later mission until he gets them right first try; the end-of-mission review must be heard before Next. Mix-it-up rule: after 3 missions in a row in Math, Reading or 中文, that area rests until he plays 2 missions in another area; the least-played area gives +10 coins. Focus mode (on by default; Parent corner in the game): calm screen, no shaking or lucky stars, still targets, think time before tapping, 3 choices in Grade 1 & Words, a slow-down nudge on fast guesses." },
  zh: { t: "🚀 太空探险进度", none: "还没玩过。他可以从自己页面上的 🚀 太空探险卡片打开。", stars: "颗任务星", coins: "金币", wk: "最近7天", days: "天玩过", min: "分钟", q: "题", ft: "一次答对", skill: "主题", acc: "一次答对率", n: "题数", planet: "星球", locked: "未解锁", note: "一至三年级数学（运算、位值、分数、时间、钱币、测量含公制、图表、几何）+ 单词。每个星球2个任务+1个大怪兽；打败大怪兽解锁下一个星球，最后一个星球解锁下一个年级。每玩20分钟强制休息5分钟（倒计时+活动建议）；奖杯可解锁特别火箭、皮肤和激光。任务类型：打陨石、星际赛跑、救外星人、接彗星、水晶洞，以及复古街机关卡（外星人方阵、打砖块、方块掉落、迷宫吃豆机器人、过河青蛙、像素跳跃），和大怪兽；机库里可开复古8位画风。满分任务开宝箱；答错扣2金币和1个护盾；每次答错都会弹出卡片说明他选了什么、为什么错、给提示（第二次错直接讲解答案），朗读完按钮才能点。错题会在任务结束时原题重做，并在之后的任务开头再出现，直到一次答对；任务结束的复习也要听完才能继续。轮换规则：数学、阅读、中文任一类连续玩3个任务后要休息，先在其他类玩2个任务才能解锁；当天玩得最少的一类额外+10金币。专注模式（默认开启，可在游戏家长角关闭）：画面安静、无震动和幸运星、目标不动、作答前有思考时间、一年级和单词只有3个选项、太快乱猜会提醒慢下来。" } };
function spaceStatsHtml(kid) {
  const L = SQ_L[lang] || SQ_L.en, save = (S.app_saves || []).find(a => a.kid === kid && a.app === "space"), P = save && save.data ? save.data[`${kid}_space_state`] : null;
  if (!P) return `<div class="coach"><h4>${L.t}</h4><div class="meta">${L.none}</div></div>`;
  const pct = (q, c) => q ? Math.round(c / q * 100) + "%" : "–", names = P.skillNames || {}, lv = P.lv || {};
  let sec = 0, dp = 0, wq = 0, wc = 0, ps = 0, pq = 0, pc = 0;
  for (let i = 7; i < 14; i++) { const k = new Date(Date.now() - i * 864e5).toLocaleDateString("en-CA"), d = (P.days || {})[k]; if (d) { ps += d.sec || 0; pq += d.q || 0; pc += d.c || 0; } }
  for (let i = 0; i < 7; i++) { const k = new Date(Date.now() - i * 864e5).toLocaleDateString("en-CA"), d = (P.days || {})[k]; if (d && d.sec > 0) { sec += d.sec; dp++; wq += d.q || 0; wc += d.c || 0; } }
  const gal = Object.entries(SQ_G).map(([g, x]) => `${x[lang] || x.en}: ${lv[g] ? `${L.planet} ${lv[g]}/${x.n}` : L.locked}`).join(" · ");
  const rows = Object.entries(P.skills || {}).filter(([k]) => P.v === 3 || k.startsWith("words")).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true })).map(([k, v]) => { const nmz = names[k] || (k.startsWith("words") ? SQ_W[+k.slice(5)] : k); const tag = k.startsWith("words") ? "📚" : k.startsWith("zh") ? "🀄" : "G" + k[1]; return `<tr><td>${tag} ${esc(nmz || k)}</td><td>${pct(v.q, v.c)}</td><td>${v.q}</td></tr>`; });
  return `<div class="coach"><h4>${L.t}</h4>
    <div class="meta">⭐ ${P.stars || 0} ${L.stars} · 🪙 ${P.coins || 0} ${L.coins} · 🏆 ${Object.keys(P.ach || {}).length}/18 · ${L.wk}: ${Math.round(sec / 60)} ${L.min}, ${dp}/7 ${L.days}, ${wq} ${L.q}, ${pct(wq, wc)} ${L.ft}</div>
    <div class="meta">📈 ${lang === "zh" ? `本周 vs 上周：${Math.round(sec / 60)} vs ${Math.round(ps / 60)} 分钟，首次答对率 ${pct(wq, wc)} vs ${pct(pq, pc)}` : `This week vs last week: ${Math.round(sec / 60)} vs ${Math.round(ps / 60)} min, first-try ${pct(wq, wc)} vs ${pct(pq, pc)}`} · ⚡ ${lang === "zh" ? `挑战题 ${(P.st || {}).chalWon || 0}/${(P.st || {}).chal || 0} 答对` : `stretch questions won ${(P.st || {}).chalWon || 0}/${(P.st || {}).chal || 0}`}</div>
    <div class="meta">${gal}</div>
    <div class="meta">❌ ${(P.st || {}).mistakes || 0} ${lang === "zh" ? "次错误" : "mistakes"} · 🧠 ${(P.st || {}).learned || 0} ${lang === "zh" ? "次重做答对" : "fixed on the retry"} · 🌟 ${(P.st || {}).perfect || 0} ${lang === "zh" ? "次满分任务" : "perfect missions"} · 🔁 ${(P.rv || []).length} ${lang === "zh" ? "道错题等下次复习" : "missed questions waiting for review"} · ✅ ${(P.st || {}).reviewed || 0} ${lang === "zh" ? "道复习时答对" : "got right on a later review"}</div>
    ${rows.length ? `<table style="margin-top:6px"><tr><th>${L.skill}</th><th>${L.acc}</th><th>${L.n}</th></tr>${rows.join("")}</table>` : ""}
    <div class="meta" style="margin-top:6px">${L.note}</div></div>`;
}

/* ---- Brain Park (Jonah's memory / focus / logic / creative games): parent summary from app_saves ---- */
const BP_G = [["feel", "💛", "Feelings Friends", "情绪小伙伴", 5], ["match", "🃏", "Pair Match", "配对翻牌", 6], ["simon", "💡", "Copy the Lights", "跟着灯光", 8], ["odd", "🔍", "Odd One Out", "找不同", 6], ["gonogo", "🚦", "Stop & Go", "红灯绿灯", 6], ["switch", "🔀", "Rule Switch", "规则切换", 5], ["pattern", "🚂", "Pattern Train", "规律火车", 6], ["shapes", "🔷", "Shape Puzzle", "形状拼图", 5], ["robot", "🤖", "Robot Coder", "机器人编程", 6], ["draw", "🖍️", "Color Pad", "画画板", 0], ["music", "🎵", "Music Maker", "音乐小屋", 4]];
function brainMeasure(id, m) {
  const zh = lang === "zh", last = (m || []).slice(-5); if (!last.length) return "–"; const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
  if (id === "match") return zh ? `每对 ${avg(last).toFixed(1)} 次（越低记忆越好）` : `${avg(last).toFixed(1)} tries per pair (lower = better memory)`;
  if (id === "simon") return zh ? `记忆广度 ${Math.max(...last)} 个` : `memory span ${Math.max(...last)} lights`;
  if (id === "odd") return `${(avg(last.filter(x => x)) / 1000).toFixed(1)} s`;
  if (id === "gonogo") return zh ? `冲动误按 ${avg(last.map(x => x.impulse || 0)).toFixed(1)}/轮 · 反应 ${Math.round(avg(last.map(x => x.rt || 0)))} ms` : `impulse taps ${avg(last.map(x => x.impulse || 0)).toFixed(1)}/round · reaction ${Math.round(avg(last.map(x => x.rt || 0)))} ms`;
  if (id === "switch") { const sw = last.map(x => x.sw).filter(x => x != null); return `${zh ? "正确率" : "accuracy"} ${Math.round(avg(last.map(x => x.acc)) * 100)}%${sw.length ? ` · ${zh ? "规则切换后" : "after a switch"} ${Math.round(avg(sw) * 100)}%` : ""}`; }
  if (id === "pattern" || id === "feel") return `${zh ? "正确率" : "accuracy"} ${Math.round(avg(last) * 100)}%`;
  if (id === "shapes") return zh ? `放错 ${avg(last).toFixed(1)} 次` : `${avg(last).toFixed(1)} wrong drops`;
  if (id === "robot") return zh ? `每题 ${avg(last).toFixed(1)} 次尝试` : `${avg(last).toFixed(1)} tries per puzzle`;
  if (id === "draw") return zh ? `${m.length} 幅画` : `${m.length} drawings`;
  if (id === "music") { const b = last.filter(x => x.beat != null); return b.length ? `${zh ? "节奏模仿" : "beat copying"} ${Math.round(avg(b.map(x => x.beat)) * 100)}%` : (zh ? "弹过歌曲" : "songs played"); }
  return "–";
}
function brainStatsHtml(kid) {
  const zh = lang === "zh", save = (S.app_saves || []).find(a => a.kid === kid && a.app === "brain"), P = save && save.data ? save.data[`${kid}_brain_state`] : null;
  const h = zh ? "🧠 大脑乐园进度" : "🧠 Brain Park progress";
  if (!P) return `<div class="coach"><h4>${h}</h4><div class="meta">${zh ? "还没玩过。他可以从自己页面上的 🧠 大脑乐园卡片打开。" : "Not played yet. He opens it from the 🧠 Brain Park card on his page."}</div></div>`;
  let r7 = 0, d7 = 0; for (let i = 0; i < 7; i++) { const d = (P.days || {})[new Date(Date.now() - i * 864e5).toLocaleDateString("en-CA")]; if (d && d.rounds) { r7 += d.rounds; d7++; } }
  const lvh = P.lvh || {}, past = Object.keys(lvh).sort().filter(d => d <= new Date(Date.now() - 7 * 864e5).toLocaleDateString("en-CA")).pop() || Object.keys(lvh).sort()[0], L0 = past ? lvh[past] : null;
  const dl = id => { if (!L0) return ""; const d = ((P.lv || {})[id] || 1) - (L0[id] || 1); return d > 0 ? ` <b style="color:#2d6a4f">▲${d}</b>` : d < 0 ? ` <span style="color:#c9184a">▼${-d}</span>` : ""; };
  const gained = L0 ? BP_G.reduce((s, [id]) => s + Math.max(0, ((P.lv || {})[id] || 1) - (L0[id] || 1)), 0) : 0, stt = P.st || {};
  const CKN = [["reason", "🧩", "Reasoning", "推理"], ["memory", "🧠", "Memory", "记忆"], ["speed", "⚡", "Speed", "速度"], ["verbal", "🗣️", "Words", "词语"], ["number", "🔢", "Numbers", "数感"], ["feel", "😊", "Feelings", "认识情绪"], ["persp", "👀", "Others' view", "理解他人"], ["calm", "🧘", "Good choices", "自控选择"]];
  const cks = (P.checks || []).slice(-8), ck = cks[cks.length - 1], ckp = cks[cks.length - 2];
  const ckd = (a, b) => b == null ? "" : a > b ? ` <b style="color:#2d6a4f">▲${a - b}</b>` : a < b ? ` <span style="color:#c9184a">▼${b - a}</span>` : "";
  const ckHtml = ck ? `<div class="meta" style="margin-top:6px"><b>🧪 ${zh ? "大脑小测" : "Brain Check"} ${ck.d}</b> · ${zh ? "思维" : "Thinking"} <b>${ck.iq}</b>${ckd(ck.iq, ckp && ckp.iq)} · ${zh ? "情商" : "Heart (EQ)"} <b>${ck.eq}</b>${ckd(ck.eq, ckp && ckp.eq)} · ${zh ? "趋势" : "trend"}: ${cks.map(c => c.iq + "/" + c.eq).join(" → ")}</div>
    <div class="meta">${CKN.map(([k, ic, en, z]) => `${ic} ${zh ? z : en} ${ck.s[k] ?? "–"}${ckd(ck.s[k], ckp && ckp.s[k])}`).join(" · ")} · ${zh ? "数字广度" : "digit span"} ${ck.raw.fwd || 0}/${ck.raw.bwd || 0}</div>
    <div class="meta" style="opacity:.8">${zh ? "分数=每项答对的百分比，看趋势，不是临床智商。" : "Scores = % of each subtest. Watch the trend; this is not a clinical IQ score."}</div>` : `<div class="meta">🧪 ${zh ? "还没做过大脑小测（每周一次，可选，不会挡住游戏）。" : "No Brain Check yet (optional, offered once a week in Brain Park; it never blocks games)."}</div>`;
  const rows = BP_G.map(([id, ic, en, z, max]) => { const s = (P.st || {})[id]; return `<tr><td>${ic} ${zh ? z : en}</td><td>${max ? `${(P.lv || {})[id] || 1}/${max}${dl(id)}` : "–"}</td><td>${s ? s.rounds : 0}</td><td>${s && s.rounds ? (s.stars / s.rounds).toFixed(1) : "–"}</td><td>${s ? brainMeasure(id, s.m) : "–"}</td></tr>`; }).join("");
  return `<div class="coach"><h4>${h}</h4>
    <div class="meta">🪙 ${P.coins || 0} ${zh ? "金币" : "coins"} · ${zh ? "最近7天" : "Last 7 days"}: ${r7} ${zh ? "局" : "rounds"}, ${d7}/7 ${zh ? "天" : "days"}</div>
    <div class="meta">📈 ${zh ? `过去7天升了 ${gained} 级` : `${gained} level${gained === 1 ? "" : "s"} gained in the last 7 days`} · ⚡ ${zh ? `挑战关 ${stt.chalWon || 0}/${stt.chal || 0} 过关` : `challenge rounds beaten ${stt.chalWon || 0}/${stt.chal || 0}`}</div>
    ${ckHtml}
    <table style="margin-top:6px"><tr><th>${zh ? "游戏" : "Game"}</th><th>${zh ? "级别（▲7天变化）" : "Level (▲ = 7-day change)"}</th><th>${zh ? "局数" : "Rounds"}</th><th>${zh ? "平均星" : "Avg ⭐"}</th><th>${zh ? "大脑指标（看趋势）" : "Brain measure (watch the trend)"}</th></tr>${rows}</table>
    <div class="meta" style="margin-top:6px">${zh ? "11个小游戏：💛情绪小伙伴（情商：认识情绪、理解别人的感受、友善和冷静的选择、气球呼吸）、记忆与专注（配对翻牌、跟着灯光、找不同）、大脑练习（红灯绿灯=冲动控制、规则切换=灵活思维）、拼图与逻辑（规律火车、形状拼图、机器人编程）、创作与音乐（画画板、音乐小屋）。每个游戏自动调难度：3星升一级，1星降一级。轮换规则：同一类（记忆、大脑练习、拼图）连续3局后休息，先玩2局其他类才解锁；每个游戏每天最多4局；画画和音乐要用🎟️票，每玩2局大脑游戏得1张；当天玩得最少的一类+5金币。语音读题，每天最多40积分。" : "11 mini-games: 💛 Feelings Friends (EQ: name feelings, how others feel, kind and calm-down choices, balloon breathing), Memory & focus (Pair Match, Copy the Lights, Odd One Out), Brain builders (Stop & Go = impulse control, Rule Switch = flexible thinking), Puzzles & logic (Pattern Train, Shape Puzzle, Robot Coder), Create & music (Color Pad, Music Maker). Each game adapts on its own: 3 stars moves up a level, 1 star moves down. Instructions are read aloud. Mix-it-up rule: each kind (memory, brain builders, puzzles) rests after 3 rounds in a row until he plays 2 rounds of other kinds; each game max 4 rounds a day; art & music cost a 🎟️ ticket earned every 2 brain games; the least-played kind gives +5 coins. Up to 40 hub points a day; the 20/5 break coach applies."}</div></div>`;
}

/* ---- 🐼 Panda Chinese (Jonah): parent summary from app_saves ---- */
const ZH_G = [["listen", "🎧", "Listen & Tap", "听一听", 12], ["read", "🔤", "Read characters", "认汉字", 12], ["tones", "🎵", "Pinyin & tones", "拼音声调", 5], ["write", "✍️", "Write characters", "写汉字", 12], ["sentence", "📖", "Sentences", "说句子", 5], ["poem", "📜", "Tang poems", "读古诗", 6]];
function chineseStatsHtml(kid) {
  const zh = lang === "zh", save = (S.app_saves || []).find(a => a.kid === kid && a.app === "chinese"), P = save && save.data ? save.data[`${kid}_chinese_state`] : null;
  const h = zh ? "🐼 熊猫中文进度" : "🐼 Panda Chinese progress";
  if (!P) return `<div class="coach"><h4>${h}</h4><div class="meta">${zh ? "还没玩过。他可以从自己页面上的 🐼 熊猫中文卡片打开。" : "Not played yet. He opens it from the 🐼 Panda Chinese card on his page."}</div></div>`;
  const ch = P.ch || {}, ent = Object.entries(ch), mast = ent.filter(([, s]) => (s.ok || 0) >= 3).map(([c]) => c), hard = ent.filter(([, s]) => (s.miss || 0) > (s.ok || 0)).sort((a, b) => b[1].miss - a[1].miss).slice(0, 12).map(([c]) => c);
  let r7 = 0, d7 = 0; for (let i = 0; i < 7; i++) { const d = (P.days || {})[new Date(Date.now() - i * 864e5).toLocaleDateString("en-CA")]; if (d && d.rounds) { r7 += d.rounds; d7++; } }
  const rows = ZH_G.map(([id, ic, en, z, max]) => { const s = (P.st || {})[id]; const m = s && s.m && s.m.length ? s.m.slice(-5) : null, avg = m ? m.reduce((a, b) => a + b, 0) / m.length : null;
    return `<tr><td>${ic} ${zh ? z : en}</td><td>${(P.lv || {})[id] || 1}/${max}</td><td>${s ? s.rounds : 0}</td><td>${s && s.rounds ? (s.stars / s.rounds).toFixed(1) : "–"}</td><td>${avg == null ? "–" : id === "write" ? `${avg.toFixed(1)} ${zh ? "笔错" : "wrong strokes"}` : `${Math.round(avg * 100)}%`}</td></tr>`; }).join("");
  return `<div class="coach"><h4>${h}</h4>
    <div class="meta">🏅 ${zh ? "掌握汉字" : "Characters mastered"}: <b>${mast.length}/120</b> · ${zh ? "见过" : "seen"} ${ent.length} · 🪙 ${P.coins || 0} · ${zh ? "最近7天" : "Last 7 days"}: ${r7} ${zh ? "局" : "rounds"}, ${d7}/7 ${zh ? "天" : "days"}</div>
    ${hard.length ? `<div class="meta">${zh ? "需要多练" : "Tricky for him"}: <span style="font-size:20px">${hard.join(" ")}</span></div>` : ""}
    ${mast.length ? `<div class="meta">${zh ? "已掌握" : "Mastered"}: ${mast.join(" ")}</div>` : ""}
    <table style="margin-top:6px"><tr><th>${zh ? "模式" : "Mode"}</th><th>${zh ? "级别" : "Level"}</th><th>${zh ? "局数" : "Rounds"}</th><th>${zh ? "平均星" : "Avg ⭐"}</th><th>${zh ? "首次答对" : "First-try"}</th></tr>${rows}</table>
    <div class="meta" style="margin-top:6px">${zh ? "一年级120个常用字（12组）：听音选图、认字、拼音四声、跟着笔顺写字、排句子、6首唐诗跟读和填字。答错有讲解卡，错题再练；每种模式连续3局后休息，每天最多40积分。" : "120 Grade 1 characters in 12 sets: hear → picture, read characters, pinyin tones, write with stroke order, build sentences, 6 Tang poems (read-along + fill-in). Mistake cards and re-practice, mix-it-up rest after 3 rounds of one mode, up to 40 hub points a day."}</div></div>`;
}

/* ---- fencing coach notes (parents write after each lesson; the Fencing Brain game shows them) ---- */
const FLS = { en: { h: "🤺 Coach notes → shown in his game", none: "No lesson notes yet.", add: "+ Add today's lesson notes", date: "Date", kind: "Type", kinds: { lesson: "Private lesson", practice: "Group practice", tournament: "Tournament" }, focus: "Big focus (one line)", points: "What coach taught (one per line)", hw: "Homework / questions (one per line)", raw: "Original notes (optional, e.g. 中文 from the coach)", save: "Save notes", tip: "Write it the way Ellis should read it in the game. Short lines work best.", saved: "Lesson notes saved. They'll show in his game next time he opens it." },
  zh: { h: "🤺 教练笔记 → 显示在他的游戏里", none: "还没有课堂笔记。", add: "+ 添加今天的课堂笔记", date: "日期", kind: "类型", kinds: { lesson: "私教课", practice: "集体训练", tournament: "比赛" }, focus: "重点（一句话）", points: "教练教了什么（每行一条）", hw: "作业 / 思考题（每行一条）", raw: "原始笔记（可选，例如教练的中文笔记）", save: "保存笔记", tip: "游戏是英文的，请尽量用 Ellis 能看懂的简短句子（也可以把中文发给 Claude 帮忙翻译）。", saved: "课堂笔记已保存，他下次打开游戏就能看到。" } };
function fencingLessonsHtml(kid) {
  const L = FLS[lang] || FLS.en, list = (S.fencing_lessons || []).filter(l => l.kid === kid).sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));
  return `<div class="latest fl"><h4>${L.h}</h4>
    ${list.length ? list.slice(0, 3).map(l => `<div class="flitem"><div class="meta">${fmtDate(l.date)} · ${L.kinds[l.kind] || l.kind}<button class="x" data-fldel="${l.id}" title="${T().del}">×</button></div>${l.focus ? `<div>🎯 <b>${esc(l.focus)}</b></div>` : ""}${(l.points || []).length ? `<ul>${l.points.map(p => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}${(l.homework || []).length ? `<div class="meta">🏠 ${l.homework.map(esc).join(" · ")}</div>` : ""}</div>`).join("") : `<div class="meta">${L.none}</div>`}
    <details style="margin-top:8px"><summary class="qmore" style="list-style:none;cursor:pointer">${L.add}</summary>
      <form class="flform" data-flkid="${esc(kid)}" style="margin-top:8px"><p class="meta">${L.tip}</p>
        <div class="grid2"><div class="field"><label>${L.date}</label><input name="date" type="date" value="${today()}" required></div><div class="field"><label>${L.kind}</label><select name="kind">${Object.entries(L.kinds).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></div></div>
        <div class="field"><label>${L.focus}</label><input name="focus" maxlength="120" placeholder="Control the other guy's blade"></div>
        <div class="field"><label>${L.points}</label><textarea name="points" rows="4" placeholder="Retreat FAST&#10;Counter-attack only after you've read it"></textarea></div>
        <div class="field"><label>${L.hw}</label><textarea name="homework" rows="2" placeholder="How do I bother him while I retreat?"></textarea></div>
        <div class="field"><label>${L.raw}</label><textarea name="raw" rows="2"></textarea></div>
        <button class="btn sm primary">${L.save}</button></form></details></div>
    ${askfredHtml(kid)}`;
}
/* ---- askFRED: competition results pulled by the askfred-sync edge function ---- */
const AF = { en: { h: "🏟️ Competition results", never: "Not synced yet.", last: d => `Last synced ${d}`, sync: "↻ Sync askFRED", syncing: "Syncing…", none: "No results found for him yet.", token: "Add your askFRED API token first: Supabase → Edge Functions → Secrets → ASKFRED_TOKEN.", ok: "askFRED synced.", seen: "secrets the server sees", bouts: "Bout-by-bout stats ↗", src: "Merged from askFRED + FencingTimeLive", all: n => `Show all ${n} results`, sum: (n, m, t) => `${n} events · ${m} podiums (top 3) · ${t} top-8 finishes`, season: (a, ap, b, bp) => `This season: ${a} events${ap != null ? `, finishes ahead of ${ap}% of the field on average` : ""} · Last season: ${b}${bp != null ? ` (${bp}%)` : ""}`, link: "Is he linked to your askFRED account? Check askFRED → My Fencers." },
  zh: { h: "🏟️ 比赛成绩", never: "还没有同步。", last: d => `上次同步：${d}`, sync: "↻ 同步 askFRED", syncing: "同步中…", none: "还没有找到他的成绩。", token: "请先添加 askFRED API 令牌：Supabase → Edge Functions → Secrets → ASKFRED_TOKEN。", ok: "askFRED 已同步。", seen: "服务器看到的密钥", bouts: "逐场对战数据 ↗", src: "合并自 askFRED + FencingTimeLive", all: n => `显示全部 ${n} 项成绩`, sum: (n, m, t) => `${n} 场比赛 · ${m} 次登上领奖台（前三） · ${t} 次进入前八`, season: (a, ap, b, bp) => `本赛季：${a} 场${ap != null ? `，平均排名超过 ${ap}% 的选手` : ""} · 上赛季：${b} 场${bp != null ? `（${bp}%）` : ""}`, link: "他是否已关联到你的 askFRED 账户？请查看 askFRED → My Fencers。" } };
const afList = x => Array.isArray(x) ? x : Array.isArray(x?.data) ? x.data : [];
const afPick = (o, keys) => { for (const k of keys) { const v = k.split(".").reduce((a, p) => a == null ? a : a[p], o); if (v != null && v !== "") return v; } return null; };
function askfredHtml(kid) {
  const L = AF[lang] || AF.en;
  const synced = (S.askfred_sync || []).find(r => r.kind === "fencers");
  const fr = (S.fencing_results || []).filter(r => r.kid === kid).sort((x, y) => String(y.date).localeCompare(String(x.date)) || String(x.event).localeCompare(String(y.event)));
  const seasonStart = d => { const t = new Date(d + "T12:00:00"); return t.getMonth() >= 7 ? t.getFullYear() : t.getFullYear() - 1; };
  const curSeason = seasonStart(today());
  const pct = r => r.place && r.field ? Math.round(100 * (1 - (r.place - 1) / r.field)) : null;
  const medals = fr.filter(r => r.place && r.place <= 3), top8 = fr.filter(r => r.place && r.place <= 8);
  const thisS = fr.filter(r => seasonStart(r.date) === curSeason), lastS = fr.filter(r => seasonStart(r.date) === curSeason - 1);
  const avg = list => { const v = list.map(pct).filter(x => x != null); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null; };
  const medal = p => p === 1 ? "🥇" : p === 2 ? "🥈" : p === 3 ? "🥉" : p <= 8 ? "🏅" : "";
  const row = r => `<div class="flitem"><div><b>${medal(r.place)} #${r.place ?? "?"}${r.field ? `/${r.field}` : ""}</b> · ${esc(r.event)}${r.source === "ftl" ? ` <span class="chip">FTL</span>` : ""}</div><div class="meta">${esc(r.tournament)} · ${esc(String(r.date).slice(0, 10))}</div></div>`;
  const kpi = fr.length ? `<div class="meta" style="margin:6px 0">${L.sum(fr.length, medals.length, top8.length)}<br>${L.season(thisS.length, avg(thisS), lastS.length, avg(lastS))}</div>` : "";
  return `<div class="latest fl"><h4>${L.h}</h4><div class="meta">${synced ? L.last(new Date(synced.fetched_at).toLocaleString()) : L.never} <button class="btn sm" data-afsync="1">${L.sync}</button></div>
    ${kpi}${fr.length ? fr.slice(0, 8).map(row).join("") : `<div class="meta">${synced ? L.none : ""}</div>`}
    ${fr.length > 8 ? `<details><summary class="meta" style="cursor:pointer">${L.all(fr.length)}</summary>${fr.slice(8).map(row).join("")}</details>` : ""}
    ${kid === "ellis" ? `<div class="meta" style="margin-top:6px">${L.src} · <a href="https://fencingtracker.com/p/100355738/Ellis-Lin/history" target="_blank" rel="noopener">${L.bouts}</a></div>` : ""}</div>`;
}
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-afsync]"); if (!b) return; e.stopPropagation();
  const L = AF[lang] || AF.en; b.disabled = true; b.textContent = L.syncing;
  try { const { data, error } = await sb.functions.invoke("askfred-sync", { body: {} });
    if (error) { let msg = error.message; try { const j = await error.context.json(); msg = j.error === "missing_token" ? L.token + (j.secret_names_seen ? ` (${L.seen}: ${j.secret_names_seen.length ? j.secret_names_seen.join(", ") : "—"})` : "") : (j.error || msg); } catch (x) {} throw new Error(msg); }
    setStatus(L.ok); refresh(); } catch (err) { setStatus(err.message, true); b.disabled = false; b.textContent = L.sync;
    let box = b.closest(".fl").querySelector(".aferr"); if (!box) { box = document.createElement("div"); box.className = "meta aferr"; box.style.cssText = "color:#e5484d;margin-top:6px"; b.closest(".fl").appendChild(box); } box.textContent = "⚠️ " + err.message; }
}, true);
document.addEventListener("submit", async e => {
  const f = e.target.closest(".flform"); if (!f) return; e.preventDefault();
  const L = FLS[lang] || FLS.en, lines = v => String(v || "").split("\n").map(x => x.trim()).filter(Boolean), fd = new FormData(f);
  try { const { error } = await sb.from("fencing_lessons").insert({ kid: f.dataset.flkid, date: fd.get("date"), kind: fd.get("kind"), focus: String(fd.get("focus") || "").trim() || null, points: lines(fd.get("points")), homework: lines(fd.get("homework")), raw_notes: String(fd.get("raw") || "").trim() || null, author: S.user?.email || null });
    if (error) throw error; setStatus(L.saved); refresh(); } catch (err) { setStatus(err.message, true); }
}, true);
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-fldel]"); if (!b) return; e.stopPropagation();
  if (!b.dataset.armed) { b.dataset.armed = 1; b.textContent = T().confirm; return; }
  try { await del("fencing_lessons", { id: b.dataset.fldel }); refresh(); } catch (err) { setStatus(err.message, true); }
}, true);

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
        <div class="grid2"><div class="field"><label>${t.goalType}</label><select name="type"><option value="rate">${t.typeRate}</option><option value="level">${t.typeLevel}</option></select></div><div class="field"><label>${lang === "zh" ? "难度（得分倍数）" : "Difficulty (points ×)"}</label>${diffSelect("difficulty", "medium")}</div></div>
        <div class="grid2 g-rate"><div class="field"><label>${t.perWeek}</label><input name="per_week" type="number" min="1" max="21" value="3"></div><div class="field"><label>${t.kidMax}</label><input name="kid_max" type="number" min="1" max="5" value="1"></div></div>
        <div class="field g-rate"><label>${t.kidLabel}</label><input name="kid_label" maxlength="40" placeholder="🏆 AMC practice"></div>
        <div class="grid2 g-level" style="display:none"><div class="field"><label>${t.startVal}</label><input name="baseline" type="number" step="any"></div><div class="field"><label>${t.targetVal}</label><input name="target" type="number" step="any"></div>
          <div class="field"><label>${t.deadlineL}</label><input name="deadline" type="date"></div><div class="field"><label>${t.unitL}</label><input name="unit" maxlength="8"></div></div>
        <button class="btn sm primary">${t.save}</button></form></details>`;
  const card = x => { const ms = S.metrics.filter(m => m.subject_id === x.id), notes = S.entries.filter(e => e.subject_id === x.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5), docs = S.docs.filter(d => d.subject_id === x.id);
    return `<div class="kid" style="--kc:${kidColor(x.kid)};cursor:default"><div class="kid-top"><div><h2>${x.icon} ${esc(sName(x))}</h2>${sDesc(x) ? `<div class="meta">${esc(sDesc(x))}</div>` : ""}</div><div style="display:flex;gap:6px">${x.app_url ? `<button class="btn sm primary" data-app="${esc(x.app_url)}" data-appkid="${esc(x.kid)}">▶ ${t.openApp}</button>` : ""}<button class="btn sm ghost" data-esubj="${x.id}">${t.edit}</button></div></div>
      ${x.app_url === "fencing/" ? fencingLessonsHtml(x.kid) + thinkStatsHtml(x.kid) : ""}
      ${x.app_url === "space/" ? spaceStatsHtml(x.kid) : ""}${x.app_url === "chinese/" ? chineseStatsHtml(x.kid) : ""}${x.app_url === "robot/" ? robotStatsHtml(x.kid) : ""}${x.app_url === "brain/" ? brainStatsHtml(x.kid) : ""}
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
    const row = { id, kid: subjKid, subject_id: f.dataset.sid, type, name: v.name.trim(), name_zh: v.name_zh?.trim() || null, difficulty: v.difficulty || "medium", sort: 100 + S.metrics.length };
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
/* ---- kid apps (e.g. Ellis's Fencing Brain Academy): full-screen, progress synced to app_saves ---- */
const APPS = { "fencing/": { id: "fencing", prefix: "ellis_", skip: ["ellis_pin", "ellis_coachNotes"], skipPre: ["ellis_amc_", "ellis_space_", "ellis_brain_", "ellis_physics_", "ellis_quest_", "ellis_review_"], label: { en: "Play Fencing Brain Academy", zh: "进入击剑大脑学院" } },
  "amc/": { id: "amc", prefix: kid => `${kid}_amc_`, skip: [], perKid: true, label: { en: "Open my AMC 8 lessons", zh: "打开我的 AMC 8 课程" } },
  "space/": { id: "space", prefix: kid => `${kid}_space_`, skip: [], perKid: true, label: { en: "Play Space Quest", zh: "进入太空探险" } },
  "chinese/": { id: "chinese", prefix: kid => `${kid}_chinese_`, skip: [], perKid: true, label: { en: "Play Panda Chinese", zh: "进入熊猫中文" } },
  "brain/": { id: "brain", prefix: kid => `${kid}_brain_`, skip: [], perKid: true, label: { en: "Play Brain Park", zh: "进入大脑乐园" } },
  "braincheck/": { id: "braincheck", prefix: kid => `${kid}_braincheck_`, skip: [], perKid: true, free: true, label: { en: "Play Brain Games", zh: "玩大脑游戏" } },
  "physics/": { id: "physics", prefix: kid => `${kid}_physics_`, skip: [], perKid: true, label: { en: "Open my Physics lessons", zh: "打开我的物理课程" } },
  "robot/": { id: "robot", prefix: kid => `${kid}_robot_`, skip: [], perKid: true, label: { en: "Open Robot Lab", zh: "进入机器人实验室" } },
  // 📚 Class Practice rooms (study/study.js), one per class, units from each syllabus
  "chem/": { id: "chem", prefix: kid => `${kid}_study_chem`, skip: [], perKid: true, label: { en: "Practice Chemistry", zh: "练习化学" } },
  "bio/": { id: "bio", prefix: kid => `${kid}_study_bio`, skip: [], perKid: true, label: { en: "Practice Biology", zh: "练习生物" } },
  "prealg/": { id: "prealg", prefix: kid => `${kid}_study_prealg`, skip: [], perKid: true, label: { en: "Practice Pre-Algebra", zh: "练习代数" } },
  "english/": { id: "english", prefix: kid => `${kid}_study_english`, skip: [], perKid: true, label: { en: "Practice English", zh: "练习英语" } },
  "latin/": { id: "latin", prefix: kid => `${kid}_study_latin`, skip: [], perKid: true, label: { en: "Practice Latin", zh: "练习拉丁语" } },
  "history/": { id: "history", prefix: kid => `${kid}_study_history`, skip: [], perKid: true, label: { en: "Practice History", zh: "练习历史" } },
  "review/": { id: "review", prefix: kid => `${kid}_review_`, skip: [], perKid: true, label: { en: "Start today's Look Back", zh: "开始今日回顾" } },
  "quest/": { id: "quest", prefix: kid => `${kid}_quest_`, skip: [], perKid: true, label: { en: "Play Realm of Forces", zh: "进入力之境" } } };
// 🤖 Ask Buddy bridge: the AMC app (same-origin iframe) calls window.parent.fhAsk(...) to reach the amc-tutor edge function.
window.fhAsk = async body => {
  try {
    const { data, error } = await sb.functions.invoke("amc-tutor", { body });
    if (error) { try { const j = await error.context.json(); return j; } catch (e) { return { error: "ai", message: "" }; } }
    return data;
  } catch (e) { return { error: "ai", message: "" }; }
};
const appLabel = url => (APPS[url]?.label || {})[lang] || T().openApp;
let appOpen = null;
/* ---- 🔒 AMC-first: daily active AMC minutes unlock games. Eric: Realm of Forces after 90 min. Ellis: Piste Duel after 60 min
   (enforced inside the fencing app; the hub hands it today's minutes). Parents and previews are never blocked. ---- */
const AMC_GATE = { eric: { apps: ["quest"], min: 90 } }, AMC_FOR_APP = { ellis: { fencing: 60 } };
const dayStr = () => new Date().toLocaleDateString("en-CA");
async function amcDaySec(kid) {
  const d = dayStr(), sum = P => ((P && P.sessions) || []).filter(x => x && x.date === d).reduce((a, x) => a + (+x.active || 0), 0);
  let db = 0, local = 0;
  try { const { data } = await sb.from("app_saves").select("data").eq("kid", kid).eq("app", "amc").maybeSingle(); db = sum(data && data.data ? data.data[`${kid}_amc_progress`] : null); } catch (e) {}
  try { local = sum(JSON.parse(localStorage.getItem(`${kid}_amc_progress`) || "null")); } catch (e) {}
  return Math.max(db, local);
}
async function amcGateOk(cfg, kid) {
  if (AMC_FOR_APP[kid] && AMC_FOR_APP[kid][cfg.id]) { try { localStorage.setItem("fh_amc_today", JSON.stringify({ kid, d: dayStr(), s: await amcDaySec(kid), need: AMC_FOR_APP[kid][cfg.id] * 60 })); } catch (e) {} }
  const g = AMC_GATE[kid];
  if (!isKid() || preview || !g || !g.apps.includes(cfg.id)) return true;
  const need = g.min * 60, sec = await amcDaySec(kid); if (sec >= need) return true;
  const zh = lang === "zh", m = Math.floor(sec / 60), left = Math.max(1, Math.ceil((need - sec) / 60)), pct = Math.min(100, Math.round(sec / need * 100));
  const ov = document.createElement("div"); ov.className = "amcgate";
  ov.innerHTML = `<div class="amcgate-box"><div style="font-size:58px">🔒</div>
    <h2>${zh ? "先学 AMC，再玩游戏！" : "AMC first, then play!"}</h2>
    <p>${zh ? `今天认真学习 AMC 满 <b>${g.min} 分钟</b>，游戏就会解锁（每天重新开始）。` : `This game unlocks after <b>${g.min} active minutes</b> of AMC today (it starts fresh every day).`}</p>
    <div class="amcgate-bar"><i style="width:${pct}%"></i></div>
    <p><b>${zh ? `今天：${m} / ${g.min} 分钟` : `Today: ${m} / ${g.min} minutes`}</b> · ${zh ? `还差 ${left} 分钟` : `${left} min to go`}</p>
    <p class="meta">${zh ? "只有认真做题、看课的时间才算（停下来超过 1 分钟不算）。" : "Only real working time counts (it pauses if you stop for 1 minute)."}</p>
    <div class="amcgate-row"><button class="btn primary" data-go="amc">${zh ? "📚 去学 AMC" : "📚 Open AMC lessons"}</button><button class="btn" data-x="1">${zh ? "返回" : "Back"}</button></div></div>`;
  document.body.appendChild(ov);
  ov.querySelector("[data-x]").onclick = () => ov.remove();
  ov.querySelector("[data-go]").onclick = () => { ov.remove(); openApp("amc/", kid); };
  return false;
}
// lets a game (e.g. the fencing app's Piste Duel lock) send him straight to his AMC lessons
window.fhOpenApp = async (url, kid) => { if (appOpen) await appOpen(); openApp(url, kid); };
async function openApp(url, kid) {
  const cfg = APPS[url]; if (!cfg) return;
  if (!cfg.free) { // 🧠 Brain Check is never gated (it's a measurement, not a game)
    if (!(await journalGateOk(kid))) return;
    if (!(await amcGateOk(cfg, kid))) return;
    if (!gameMixGate(cfg, kid)) return;
  }
  const t = T(), mark = `fh_save_${kid}_${cfg.id}`, pre = typeof cfg.prefix === "function" ? cfg.prefix(kid) : cfg.prefix;
  try {
    const { data } = await sb.from("app_saves").select("data,updated_at").eq("kid", kid).eq("app", cfg.id).maybeSingle();
    const localAt = localStorage.getItem(mark) || "";
    if (data && (preview || data.updated_at > localAt)) { Object.entries(data.data || {}).forEach(([k, v]) => { if (k.startsWith(pre) && !cfg.skip.includes(k) && !(cfg.skipPre || []).some(x => k.startsWith(x))) localStorage.setItem(k, JSON.stringify(v)); }); localStorage.setItem(mark, data.updated_at); }
  } catch (e) {}
  if (cfg.id === "quest") { // ⏳ parent-set daily limit (kids.quest_limit, minutes) always wins over the copy saved on his device
    try { const { data } = await sb.from("kids").select("quest_limit").eq("id", kid).maybeSingle(); const lim = data && data.quest_limit;
      if (lim != null) { const k = `${kid}_quest_save`, Q = JSON.parse(localStorage.getItem(k) || "null"); if (Q) { Q.settings = Q.settings || {}; if (Q.settings.limit !== lim) { Q.settings.limit = lim; localStorage.setItem(k, JSON.stringify(Q)); } } } } catch (e) {}
  }
  if (["amc", "physics"].includes(cfg.id)) { // 🎯 nightly coach difficulty per chapter/unit (not synced back: key has no app prefix)
    try { const { data } = await sb.rpc("my_tuning", { p_app: cfg.id, p_kid: kid }); localStorage.setItem(`fh_tune_${kid}_${cfg.id}`, JSON.stringify(data || {})); } catch (e) {}
  }
  if (cfg.id === "fencing") { // coach lesson notes written by parents → shown inside the game
    try { const { data } = await sb.from("fencing_lessons").select("date,kind,points,focus,homework").eq("kid", kid).order("date", { ascending: false }).limit(20);
      localStorage.setItem("ellis_coachNotes", JSON.stringify(data || [])); } catch (e) {}
  }
  let timer = null;
  const push = async () => {
    timer = null; if (preview) return;
    const out = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith(pre) && !cfg.skip.includes(k) && !(cfg.skipPre || []).some(x => k.startsWith(x))) { try { out[k] = JSON.parse(localStorage.getItem(k)); } catch (e) {} } }
    const at = new Date().toISOString();
    const { error } = await sb.from("app_saves").upsert({ kid, app: cfg.id, data: out, updated_at: at });
    const st = document.querySelector("#appFs .appst"); if (st) st.textContent = error ? "⚠️ " + t.appSaveErr : "☁️ " + t.appSaved;
    if (!error) localStorage.setItem(mark, at);
  };
  const onStore = e => { if (e.key && e.key.startsWith(pre) && !cfg.skip.includes(e.key) && !(cfg.skipPre || []).some(x => e.key.startsWith(x))) { clearTimeout(timer); timer = setTimeout(push, 1500); } };
  window.addEventListener("storage", onStore);
  const fs = document.createElement("div"); fs.id = "appFs"; fs.className = "appfs";
  fs.innerHTML = `<div class="appbar"><button class="appclose">🏠 ${lang === "zh" ? "首页" : "Home"}</button><span class="appst">${preview ? "👀 " + t.previewNoSave : ""}</span></div><iframe src="${url}?v=20261126hm1${cfg.perKid ? "&k=" + encodeURIComponent(kid) : ""}${!isKid() && !preview ? "&p=1" : ""}" title="app" allow="fullscreen"></iframe>`;
  document.body.appendChild(fs); document.body.style.overflow = "hidden";
  const stopCoach = (isKid() && !preview && !cfg.free && (cfg.id !== "space" || kid === "jonah")) ? playCoach(kid, fs) : () => {};
  const stopMix = gameMixTrack(kid, cfg, fs);
  const stopTime = appTimeTrack(kid, cfg, fs);
  appOpen = async () => { stopCoach(); stopMix(); stopTime(); window.removeEventListener("storage", onStore); if (preview) localStorage.removeItem(mark); if (timer) { clearTimeout(timer); await push(); } fs.remove(); document.body.style.overflow = ""; appOpen = null; if (awardsDirty && isKid() && !preview) { awardsDirty = false; try { await loadAll(); kidRender(); } catch (e) {} } };
  fs.querySelector(".appclose").onclick = () => appOpen();
}
/* ---- ⏱️ Time per subject (Bobby 2026-11-23): the hub measures every app the same way. A second counts when the app is open,
   the page is visible, and he touched, typed or scrolled in the last 90 s. Kid sessions only (not parent previews). Saved via log_app_time → app_time. ---- */
/* ---- 😴 Idle log (Bobby 2026-11-23: "he tends to drift away when both my wife and I are away"). Kid logins only.
   Any stretch of 2+ min is saved with its start time and the app he was in:
   idle = the Hub is on screen but nothing was touched, typed or scrolled; away = he left the Family Hub tab or app (another tab, another app, screen off).
   A stretch still open when the page closes is kept in localStorage and saved on the next visit. Parents read it (app_idle); kids can't. ---- */
const IDLE = { app: "hub", last: Date.now(), from: null, hidAt: null };
// 👋 Bobby 11/25: after 10+ min away (kids only), a friendly "welcome back" so he restarts on purpose instead of drifting
function welcomeBack(app, ms) {
  if (!isKid() || preview || document.querySelector(".wbback")) return;
  const zh = lang === "zh", m = Math.round(ms / 60000), nm = app && app !== "hub" ? appSubjName(S.kids[0]?.id, app) : (zh ? "Family Hub" : "the Family Hub");
  const ov = document.createElement("div"); ov.className = "amcgate wbback";
  ov.innerHTML = `<div class="amcgate-box"><div style="font-size:54px">👋</div><h2>${zh ? "欢迎回来！" : "Welcome back!"}</h2>
    <p>${zh ? `你离开了 ${m} 分钟。` : `You were away for ${m} minutes.`} ${zh ? `接着在 ${esc(nm)} 里做吧？` : `Pick up where you left off in ${esc(nm)}?`}</p>
    <p class="meta">${zh ? "先想一想：刚才做到哪一步了？" : "First, think: where were you before you left?"}</p>
    <div class="amcgate-row"><button class="btn primary" data-x="1">${zh ? "▶ 继续" : "▶ Keep going"}</button></div></div>`;
  document.body.appendChild(ov); ov.querySelector("[data-x]").onclick = () => ov.remove();
}
const idleSave = (app, kind, startMs, endMs) => { const secs = Math.round((endMs - startMs) / 1000); if (secs < 120 || !isKid()) return;
  sb.rpc("log_idle", { p_app: app, p_kind: kind, p_start: new Date(startMs).toISOString(), p_secs: secs }).then(r => { if (r.error) console.warn("idle", r.error.message); }); };
const idlePend = () => { try { if (IDLE.hidAt) localStorage.setItem("fh_idle_pend", JSON.stringify({ app: IDLE.app, kind: "away", start: IDLE.hidAt, end: Date.now() })); else if (IDLE.from) localStorage.setItem("fh_idle_pend", JSON.stringify({ app: IDLE.app, kind: "idle", start: IDLE.from, end: Date.now() })); else localStorage.removeItem("fh_idle_pend"); } catch (e) {} };
const idlePoke = () => { const now = Date.now(); if (IDLE.from) { idleSave(IDLE.app, "idle", IDLE.from, now); IDLE.from = null; idlePend(); } IDLE.last = now; };
const idleSetApp = id => { idlePoke(); IDLE.app = id || "hub"; };
(() => {
  ["pointerdown", "keydown", "wheel", "touchstart", "input", "scroll", "pointermove"].forEach(e => window.addEventListener(e, () => { if (e !== "pointermove" || Date.now() - IDLE.last > 3000) idlePoke(); }, { passive: true, capture: true }));
  document.addEventListener("visibilitychange", () => { const now = Date.now();
    if (document.hidden) { if (IDLE.from) { idleSave(IDLE.app, "idle", IDLE.from, now); IDLE.from = null; } IDLE.hidAt = now; }
    else { if (IDLE.hidAt) { idleSave(IDLE.app, "away", IDLE.hidAt, now); if (now - IDLE.hidAt >= 600000) welcomeBack(IDLE.app, now - IDLE.hidAt); } IDLE.hidAt = null; IDLE.last = now; }
    idlePend(); });
  addEventListener("pagehide", idlePend);
  setInterval(() => { if (!isKid()) { IDLE.from = null; IDLE.last = Date.now(); return; }
    if (!document.hidden && !IDLE.from && Date.now() - IDLE.last >= 120000) IDLE.from = IDLE.last;
    if (IDLE.from || IDLE.hidAt) idlePend(); }, 15000);
  // a stretch left open last time (page closed while idle or away): save it now
  const flushOld = () => { try { const x = JSON.parse(localStorage.getItem("fh_idle_pend") || "null"); if (x && isKid()) { localStorage.removeItem("fh_idle_pend"); idleSave(x.app, x.kind, x.start, x.end); } } catch (e) {} };
  setTimeout(flushOld, 8000);
})();
function idlePanel(kid) {
  if (isKid()) return "";
  const zh = lang === "zh", rows = (S.app_idle || []).filter(x => x.kid === kid && x.date >= daysAgo(6));
  if (!rows.length) return `<div class="meta" style="margin-top:6px">😴 ${zh ? "过去 7 天没有记录到 2 分钟以上的发呆或离开（11/23 起开始记录）。" : "No idle or away stretches of 2+ min in the last 7 days (logging started 11/23)."}</div>`;
  const days = []; for (let i = 6; i >= 0; i--) days.push(daysAgo(i));
  const sum = (d, k) => rows.filter(x => x.date === d && x.kind === k).reduce((a, x) => a + x.secs, 0);
  const tm = ts => new Date(ts).toLocaleTimeString(zh ? "zh-CN" : "en-US", { hour: "numeric", minute: "2-digit" });
  const dl = d => { const x = new Date(d + "T12:00"); return d === today() ? (zh ? "今天" : "Today") : x.toLocaleDateString(zh ? "zh-CN" : "en-US", { weekday: "short" }); };
  const long = rows.filter(x => x.secs >= 300).slice(-12).reverse();
  return `<div style="margin-top:10px"><b>😴 ${zh ? "发呆 / 离开（仅家长可见）" : "Idle & away (parents only)"}</b>
    <div style="overflow-x:auto"><table style="border-collapse:collapse;font-size:13px;width:100%"><tr><th></th>${days.map(d => `<th style="padding:3px 5px">${dl(d)}</th>`).join("")}</tr>
    <tr><td style="padding:3px 6px;white-space:nowrap">😴 ${zh ? "屏幕开着没动" : "Idle (screen on, no touch)"}</td>${days.map(d => `<td style="text-align:center">${hm(sum(d, "idle"))}</td>`).join("")}</tr>
    <tr><td style="padding:3px 6px;white-space:nowrap">🚪 ${zh ? "离开了 Hub" : "Away (left the Hub)"}</td>${days.map(d => `<td style="text-align:center">${hm(sum(d, "away"))}</td>`).join("")}</tr></table></div>
    ${long.length ? `<div class="meta" style="margin-top:4px">${zh ? "5 分钟以上：" : "Stretches of 5+ min:"} ${long.map(x => `${dl(x.date)} ${tm(x.started_at)} · ${hm(x.secs)} ${x.kind === "away" ? "🚪" : "😴"} ${esc(x.app === "hub" ? (zh ? "主页" : "Hub home") : appSubjName(kid, x.app))}`).join(" · ")}</div>` : ""}
    <div class="meta">${zh ? "2 分钟以上才记录。关掉浏览器或平板睡眠算“离开”，从离开那一刻算起。" : "Only stretches of 2+ min count. Closing the browser or the tablet going to sleep counts as away, from the moment he left."}</div></div>`;
}
function appTimeTrack(kid, cfg, fs) {
  if (!isKid() || preview) return () => {};
  idleSetApp(cfg.id);
  let last = Date.now(), pend = 0;
  const poke = () => { last = Date.now(); idlePoke(); };
  const EV = ["pointerdown", "keydown", "wheel", "touchstart", "input", "scroll"];
  const hook = w => { try { EV.forEach(e => w.addEventListener(e, poke, { passive: true, capture: true })); } catch (e) {} };
  const ifr = fs.querySelector("iframe"); hook(window);
  if (ifr) { ifr.addEventListener("load", () => { try { hook(ifr.contentWindow); errHook(ifr.contentWindow, () => "app:" + cfg.id); } catch (e) {} }); try { if (ifr.contentWindow) hook(ifr.contentWindow); } catch (e) {} }
  const flush = () => { const n = pend; pend = 0; return n > 0 ? sb.rpc("log_app_time", { p_app: cfg.id, p_secs: n }).then(r => { if (r.error) pend += n; }) : Promise.resolve(); };
  window.fhFlushTime = flush; // 🛡️ the server only pays app points that are backed by active time, so report time before each award
  const tick = setInterval(() => { if (!document.hidden && Date.now() - last < 90000) pend += 5; }, 5000);
  const fl = setInterval(flush, 60000);
  return () => { clearInterval(tick); clearInterval(fl); window.fhFlushTime = null; EV.forEach(e => { try { window.removeEventListener(e, poke, true); } catch (x) {} }); flush(); idleSetApp("hub"); };
}
const APP_NAMES = { amc: ["🏆 AMC 8", "🏆 AMC 8"], quest: ["⚔️ Realm of Forces", "⚔️ 力之境"], review: ["🔁 Look Back", "🔁 回顾"], space: ["🚀 Space Quest", "🚀 太空探险"], brain: ["🧠 Brain Park", "🧠 大脑乐园"], chinese: ["🐼 Panda Chinese", "🐼 熊猫中文"] };
function appSubjName(kid, id) {
  const sj = S.subjects.find(x => x.kid === kid && x.app_url && APPS[x.app_url] && APPS[x.app_url].id === id);
  if (sj) return `${sj.icon || ""} ${lang === "zh" && sj.name_zh ? sj.name_zh : sj.name}`;
  const n = APP_NAMES[id]; return n ? n[lang === "zh" ? 1 : 0] : id;
}
const hm = s => { const m = Math.round(s / 60); return m < 1 ? (s > 0 ? "<1m" : "") : m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`; };
/* ---- 🛡️ Fair play (Bobby 2026-11-25): the nightly integrity scan (public.integrity_scan) flags gaming patterns and HOLDS the points involved;
   held points don't count toward the $20 goal until a parent clears them. Repeated patterns tighten settings automatically for 14 days. ---- */
const FP_RULE = {
  history_rewritten: ["🧽", "Wrong answers erased from an app's history (older copy kept)", "应用记录里的错题被删掉了（旧版本已保存）"], journal_unchecked: ["🔤", "Journal saved without the spelling check", "日记保存时没有经过拼写检查"],
  habit_no_evidence: ["🧾", "Habit tapped, apps show no such work", "打卡了，但应用里没有记录"], habit_over_weekly: ["🔁", "Once-a-week habit tapped again", "每周一次的习惯又打卡了"],
  weekly_bonus_unsupported: ["🎯", "Weekly bonus without backed taps", "每周奖励缺少真实打卡"], away_in_checkpoint: ["🚪", "Left the page during a checkpoint", "关卡中离开了页面"],
  checkpoint_review: ["👀", "Checkpoint points waiting for a parent look", "关卡分数等家长查看"], win_before_exam: ["⏱️", "Win logged right before the $20 exam", "考试前刚记了一个成就"],
  repeat_answers: ["♻️", "Same problem answered again and again", "同一道题反复做"], rushing: ["⚡", "Answering faster than reading", "答题快到来不及读题"],
  exam_seen_questions: ["📋", "Exam used questions he had seen", "考试题以前做过"], drift: ["😴", "Apps open, mostly away", "应用开着但人不在"], journal_minimum: ["✍️", "Journal stops at the word minimum", "日记刚好写到最低字数"] };
const FP_SET = { self_habits_parent_only: ["Self-report habits: parent marks them", "自报习惯由家长打卡"], cp_review: ["Checkpoint points wait for a parent look", "关卡分数等家长查看"], min_answer_secs: ["Checkpoint answers under 6 s don't count", "关卡里 6 秒内的答案不算"] };
function fairPanel(kid) {
  if (isKid() || !["eric", "ellis"].includes(kid)) return "";
  const zh = lang === "zh", fl = (S.integrity_flags || []).filter(f => f.kid === kid), open = fl.filter(f => f.status === "open" && f.points > 0 && f.severity !== "low");
  const notes = fl.filter(f => f.severity === "low" && f.date >= daysAgo(6)), sets = (S.integrity_settings || []).filter(x => x.kid === kid);
  const nm = r => (FP_RULE[r] || ["•", r, r]), held = open.reduce((a, f) => a + f.points, 0);
  const byRule = {}; notes.forEach(f => byRule[f.rule] = (byRule[f.rule] || 0) + 1);
  return `<div class="fp" style="margin-top:12px"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b>🛡️ ${zh ? "公平检查" : "Fair play"}</b><button class="btn sm ghost" data-iscan>↻ ${zh ? "现在检查" : "Scan now"}</button></div>
    ${open.length ? `<div class="meta">${zh ? `${held} 分暂不计入每周 $20 目标，等你确认：` : `${held} points held from the $20 goal until you decide:`}</div>
      ${open.map(f => `<div style="display:flex;gap:8px;align-items:flex-start;border-top:1px dashed #ddd;padding:6px 0"><span>${nm(f.rule)[0]}</span><div style="flex:1;min-width:0"><div style="font-size:13px"><b>${fmtDate(f.date)}</b> · ${esc(f.detail && f.detail.msg ? f.detail.msg : (zh ? nm(f.rule)[2] : nm(f.rule)[1]))}</div>
        <div class="meta">${f.points} ${zh ? "分" : "pts"} · ${f.severity === "high" ? "🔴" : "🟠"}${(w => w ? ` · 💬 ${esc(zh ? w.q[1] : w.q[0])}` : "")(watchFor(f.rule))}</div></div>
        <button class="btn sm" data-ifl="${f.id}" data-act="clear" title="${zh ? "没问题，分数照算" : "It's fine: the points count"}">✓ ${zh ? "照算" : "OK"}</button><button class="btn sm" data-ifl="${f.id}" data-act="confirm" title="${zh ? "扣掉这些分（记一笔调整）" : "Remove these points (dated correction)"}">✗ ${zh ? "扣分" : "Remove"}</button></div>`).join("")}`
      : `<div class="meta">${zh ? "没有被暂扣的分数。" : "No points on hold."}</div>`}
    ${Object.keys(byRule).length ? `<details style="margin-top:6px"><summary class="meta">${zh ? "本周提醒" : "This week's notes"}: ${Object.entries(byRule).map(([r, n]) => `${nm(r)[0]} ${n}`).join(" · ")}</summary>
      ${notes.map(f => `<div class="meta" style="padding:2px 0">${nm(f.rule)[0]} ${fmtDate(f.date)} · ${esc(f.detail && f.detail.msg ? f.detail.msg : nm(f.rule)[1])}</div>`).join("")}</details>` : ""}
    <div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:6px">${Object.entries(FP_SET).map(([key, lab]) => { const on = sets.find(x => x.key === key);
      return `<button class="chip ${on ? "on" : ""}" data-ifs="${key}" data-kid="${kid}" data-on="${on ? 0 : 1}" title="${on ? esc(on.reason || "") : ""}">${on ? "🔒" : "○"} ${zh ? lab[1] : lab[0]}${on && on.set_by === "auto" ? (zh ? "（自动）" : " (auto)") : ""}</button>`; }).join("")}</div>
    <div class="meta" style="margin-top:4px">${zh ? "每晚 9:50 自动检查；同样的问题重复出现时，规则会自动收紧 14 天。" : "Checked automatically every evening; when a pattern repeats, a rule tightens itself for 14 days. Tap a chip to switch it."}</div></div>`;
}
document.addEventListener("click", async e => {
  const t = e.target.closest("[data-ifl],[data-ifs],[data-iscan]"); if (!t || isKid()) return;
  try {
    if (t.dataset.ifl) { if (t.dataset.act === "confirm" && !confirm(lang === "zh" ? "扣掉这些分？会记一笔带日期的调整。" : "Remove these points? A dated correction is added to the history.")) return; const { error } = await sb.rpc("parent_resolve_flag", { p_id: t.dataset.ifl, p_action: t.dataset.act }); if (error) throw error; }
    else if (t.dataset.ifs) { const { error } = await sb.rpc("parent_set_integrity", { p_kid: t.dataset.kid, p_key: t.dataset.ifs, p_on: t.dataset.on === "1" }); if (error) throw error; }
    else { t.disabled = true; const { error } = await sb.rpc("integrity_scan", { p_day: today() }); if (error) throw error; }
    await loadAll(); route();
  } catch (err) { setStatus(err.message, true); }
});
/* ---- 🎯 Done well? (Bobby 2026-11-26: "Eric always does things mindlessly; he doesn't seem to care how things should be unless adults ask").
   Builds SELF-MONITORING: before a task he writes what "done well" means (2–3 points, his own words); after it he checks himself against each.
   A parent spot-checks: 👍 agree (+5 ⭐, so points reward HONEST self-checking, not high self-scores) or 〽️ not quite.
   Stored in app_saves (app "donewell", key <kid>_donewell); no points for writing or rating, only for a parent agreeing. ---- */
const DW_KIDS = ["eric"];
const DW_TASKS = [["📚", "Homework", "作业"], ["🎒", "Launch pad", "出门准备"], ["🧹", "Room / chore", "房间/家务"], ["🤖", "Onshape build", "Onshape 建模"], ["🏁", "Checkpoint", "关卡"], ["✏️", "Other", "其他"]];
const DW_HINT = { "Homework": "e.g. every question answered, work shown, name on it, in my folder", "Launch pad": "e.g. bag zipped by the door, homework inside, water bottle filled", "Room / chore": "e.g. floor clear, clothes in the hamper, bed made",
  "Onshape build": "e.g. parts fit, measurements checked twice, saved with a clear name", "Checkpoint": "e.g. read every question twice, checked the units, no guessing", "Other": "what will it look like when it's done well?" };
const dwSave = kid => { const r = (S.donewell || []).find(x => x.kid === kid); return (r && r.data && r.data[`${kid}_donewell`]) || { items: [] }; };
async function dwWrite(kid, P) { const { error } = await sb.from("app_saves").upsert({ kid, app: "donewell", data: { [`${kid}_donewell`]: P }, updated_at: new Date().toISOString() }); if (error) throw error;
  const r = (S.donewell || []).find(x => x.kid === kid); if (r) r.data = { [`${kid}_donewell`]: P }; else (S.donewell = S.donewell || []).push({ kid, data: { [`${kid}_donewell`]: P } }); }
const dwWords = t => String(t || "").trim().split(/\s+/).filter(Boolean).length;
const RATE = [["❌", "No", "没有"], ["〽️", "Partly", "部分"], ["✅", "Yes", "做到了"]];
function doneWellKidHtml(k) {
  const zh = lang === "zh", P = dwSave(k.id), d = today(), open = P.items.find(x => !x.done), todayN = P.items.filter(x => x.d === d).length;
  const recent = P.items.filter(x => x.done).slice(-3).reverse();
  let body;
  if (open) { const mins = Math.floor((Date.now() - open.at) / 60000), ready = mins >= 5;
    body = `<div class="dwtask"><b>${esc(open.task)}</b> <span class="meta">${zh ? "开始于" : "started"} ${new Date(open.at).toLocaleTimeString(zh ? "zh-CN" : "en-US", { hour: "numeric", minute: "2-digit" })}</span></div>
      <p class="meta">${zh ? "做完后，诚实地检查每一条：" : "When you're done, check each one honestly:"}</p>
      ${open.crit.map((c, i) => `<div class="dwcrit"><span>${i + 1}. ${esc(c)}</span><span class="dwrate">${RATE.map((r, j) => `<button class="chip" data-dwr="${i}" data-v="${j}">${r[0]} ${zh ? r[2] : r[1]}</button>`).join("")}</span></div>`).join("")}
      <input id="dwNext" placeholder="${zh ? "下次我会先检查……（至少 3 个词）" : "Next time I'll check… (3+ words)"}" style="width:100%;margin-top:8px">
      <div class="row" style="margin-top:8px;gap:8px">${ready ? `<button class="btn primary" id="dwDone">${zh ? "保存我的自查" : "Save my self-check"}</button>` : `<span class="meta">⏳ ${zh ? `做完任务再来（${5 - mins} 分钟后可以自查）` : `Do the task first (self-check opens in ${5 - mins} min)`}</span>`}<button class="btn sm ghost" id="dwDrop">${zh ? "取消" : "Cancel"}</button></div>`; }
  else if (todayN >= 3) body = `<p class="meta">${zh ? "今天已经做了 3 次自查，明天继续！" : "3 self-checks today, nice. More tomorrow!"}</p>`;
  else body = `<div class="dwchips">${DW_TASKS.map(t => `<button class="chip" data-dwt="${t[1]}">${t[0]} ${zh ? t[2] : t[1]}</button>`).join("")}</div>
      <input id="dwTask" placeholder="${zh ? "我要做的事" : "What I'm about to do"}" style="width:100%;margin-top:8px">
      <p class="meta" style="margin:8px 0 4px">${zh ? "做得好是什么样子？写 2–3 条，用你自己的话：" : "What does DONE WELL look like? Write 2–3 things, in your own words:"}</p>
      ${[0, 1, 2].map(i => `<input class="dwc" data-i="${i}" placeholder="${i < 2 ? (zh ? "必填" : "required") : (zh ? "可选" : "optional")}" style="width:100%;margin-top:4px">`).join("")}
      <p class="meta" id="dwHint" style="margin-top:4px"></p>
      <button class="btn primary" id="dwStart" style="margin-top:6px">${zh ? "开始" : "Start"}</button>`;
  return `<div class="kw-h"><span class="kw-ht">🎯 ${zh ? "做得好吗？" : "Done well?"}</span></div><div class="kw-card">
    <p class="meta" style="margin-top:0">${zh ? "先想好“做得好”是什么样，做完自己检查。爸爸妈妈抽查时如果同意你的自查，+5 ⭐。诚实最重要。" : "Decide what \"done well\" looks like before you start, then check yourself. When Mom or Dad spot-checks and agrees with your self-check, +5 ⭐. Honest beats perfect."}</p>
    ${body}
    ${recent.length ? `<div style="margin-top:10px">${recent.map(x => `<div class="meta">${x.parent ? (x.parent.agree ? "👍" : "〽️") : "⏳"} ${esc(x.task)} · ${x.done.rates.map(v => RATE[v][0]).join("")}${x.parent && !x.parent.agree && x.parent.note ? ` · ${esc(x.parent.note)}` : ""}</div>`).join("")}</div>` : ""}</div>`;
}
document.addEventListener("click", async e => {
  const t = e.target.closest("[data-dwt],[data-dwr],#dwStart,#dwDone,#dwDrop"); if (!t || !isKid()) return;
  const k = S.kids[0], zh = lang === "zh", P = dwSave(k.id);
  try {
    if (t.dataset.dwt) { const inp = $("#dwTask"); if (inp) inp.value = t.dataset.dwt === "Other" ? "" : t.dataset.dwt; const h = $("#dwHint"); if (h) h.textContent = "💡 " + (DW_HINT[t.dataset.dwt] || ""); return; }
    if (t.dataset.dwr != null) { const row = t.closest(".dwrate"); row.querySelectorAll("button").forEach(b => b.classList.toggle("on", b === t)); return; }
    if (t.id === "dwStart") { const task = ($("#dwTask").value || "").trim(), crit = [...document.querySelectorAll(".dwc")].map(x => x.value.trim()).filter(Boolean);
      if (!task) return setStatus(zh ? "先写你要做什么" : "Write what you're about to do", true);
      if (crit.length < 2 || crit.some(c => dwWords(c) < 3 && !/[\u4e00-\u9fff]{4,}/.test(c))) return setStatus(zh ? "至少写 2 条，每条至少 3 个词" : "Write at least 2 points, 3+ words each", true);
      P.items.push({ id: Date.now().toString(36), d: today(), task: task.slice(0, 80), crit: crit.slice(0, 3).map(c => c.slice(0, 120)), at: Date.now() }); P.items = P.items.slice(-200); await dwWrite(k.id, P); kidRender(); return; }
    const open = P.items.find(x => !x.done); if (!open) return;
    if (t.id === "dwDrop") { P.items = P.items.filter(x => x !== open); await dwWrite(k.id, P); kidRender(); return; }
    if (t.id === "dwDone") { const rates = [...document.querySelectorAll(".dwrate")].map(r => { const b = r.querySelector("button.on"); return b ? +b.dataset.v : null; }), next = ($("#dwNext").value || "").trim();
      if (rates.some(v => v == null)) return setStatus(zh ? "每一条都要检查" : "Check every point", true);
      if (dwWords(next) < 3 && !/[\u4e00-\u9fff]{4,}/.test(next)) return setStatus(zh ? "写下下次你会先检查什么（至少 3 个词）" : "Write what you'll check next time (3+ words)", true);
      open.done = { rates, next: next.slice(0, 140), at: Date.now() }; await dwWrite(k.id, P); kidRender(); setStatus(zh ? "已保存。诚实地检查自己，就是在长本事！" : "Saved. Checking your own work honestly is a real skill!"); }
  } catch (err) { setStatus(err.message, true); }
});
/* ---- 🧭 Watch-for guide for parents (Bobby 2026-11-26): signs → what it usually means → what to do → what to say. Child-counselor framing:
   name the behavior calmly, stay curious, let small consequences teach, praise effort and honesty, never compare brothers. ---- */
const WATCH = [
  { k: "rush", i: "⚡", rules: ["rushing", "away_in_checkpoint"], s: ["Answers in 1–3 seconds; many fast wrong answers; checkpoints rushed, then retaken", "1–3 秒就答题；很多快速答错；关卡赶着做然后重考"],
    m: ["He's racing to finish or to get the reward, not to understand. It's often impulsivity, not laziness.", "他在赶着完成或拿奖励，而不是想弄懂。常常是冲动，不是懒。"],
    d: ["Sit nearby for the first 2–3 questions. Ask him to read each question aloud and say his plan before answering. Praise slowing down, even when the answer is wrong.", "前 2–3 题坐在旁边。让他把题读出来、先说思路再作答。即使答错，也表扬他放慢了。"],
    q: ["“Show me how you'd figure this out. I care more about the thinking than the answer.”", "“说说你会怎么想。我更在意你的思考，不是答案。”"] },
  { k: "farm", i: "♻️", rules: ["repeat_answers", "burst_taps"], s: ["The same easy problem again and again; points jumping without new learning; tapping a button many times", "同一道简单题反复做；分数涨得快但没学新东西；连续狂点按钮"],
    m: ["He's found that the system pays for repetition. That's smart, aimed the wrong way. The system's job is to stop paying for it; yours is to name it calmly.", "他发现系统会为重复付分。这是聪明，但用错了方向。系统负责不再为此付分；你负责平静地点出来。"],
    d: ["Don't shame. Tell him what you saw, what the points are for, and that the rule has changed. Let the held points decide themselves: remove them with him there, explaining why.", "不要羞辱。告诉他你看到了什么、分数是为了什么、规则已经改了。被暂扣的分，当着他的面决定并说明原因。"],
    q: ["“I noticed the same question 50 times. Points are for learning something new. What's a harder one you could try?”", "“我看到同一道题做了 50 次。分数是给学到新东西的。你可以挑一道更难的试试吗？”"] },
  { k: "claim", i: "🧾", rules: ["habit_no_evidence", "habit_over_weekly", "weekly_bonus_unsupported", "win_before_exam", "cp_reward_no_pass"], s: ["Habits tapped that the apps show weren't done; all habits tapped at once in the morning; a win logged right before the $20 exam", "应用显示没做的习惯也打了卡；早上一次性全打卡；考$20前刚记一个成就"],
    m: ["Claiming credit he didn't earn. At 10–11 this is usually wishful thinking plus a test of whether anyone checks, not a character flaw. It's the most important one to handle well.", "领了不该得的分。10–11 岁时通常是一厢情愿加上试探有没有人查，不是品格问题。但这是最需要处理好的一项。"],
    d: ["Raise it privately, with the evidence, without a lecture. Separate the act from him: you're honest, and this tap wasn't. Remove those points; don't add a punishment on top. Praise any honest correction loudly.", "私下谈，拿出证据，不说教。把行为和他本人分开：你是诚实的孩子，但这次打卡不是。扣掉那些分，不要再额外惩罚。他主动改正时大声表扬。"],
    q: ["“The app shows no Physics on Wednesday, but it's tapped. What happened? … Telling me the truth matters more to me than any points.”", "“应用显示周三没做物理，但打卡了。怎么回事？……对我来说，说实话比任何分数都重要。”"] },
  { k: "mindless", i: "🙈", rules: [], s: ["Does things carelessly unless an adult checks; doesn't notice his own mistakes; 'done' means 'stopped'", "没人检查就马虎；看不到自己的错误；“做完”就是“停了”"],
    m: ["Self-monitoring (the inner checker) develops late, often mid-teens, later in some boys. He borrows yours. The more you check, the less he needs to.", "自我监控（内心的检查员）发育得晚，常到青春期中期，有些男孩更晚。他在借用你的检查。你查得越多，他越不需要自己查。"],
    d: ["Use 🎯 Done well? before tasks: he sets the standard, he checks it, you spot-check. Ask instead of correcting. Fade reminders on purpose (full reminder → one-word cue → a look → nothing), and tell him you're doing it.", "任务前用 🎯“做得好吗？”：他定标准、他自查、你抽查。用提问代替纠正。有计划地减少提醒（完整提醒 → 一个词 → 一个眼神 → 不提醒），并告诉他你在这样做。"],
    q: ["“Before you start: what does done well look like?” · after: “Did you hit your three?”", "开始前：“做得好是什么样子？”· 做完后：“你那三条做到了吗？”"] },
  { k: "forget", i: "🧠", rules: [], s: ["Forgets belongings and chores; loses the first task when a new one comes in", "忘带东西、忘做家务；新任务一来就忘了上一个"],
    m: ["Working memory. It's a capacity, not a choice. Nagging doesn't grow it; outside systems do.", "工作记忆。这是能力，不是选择。唠叨不会让它变强，外部系统会。"],
    d: ["One instruction at a time; have him repeat it back. Use the launch-pad spot by the door and a checklist he made himself. Let small natural consequences happen (a forgotten water bottle on a cool day). Rescue only when it really matters.", "一次只说一件事，让他复述。用门口的出门准备区和他自己写的清单。让小的自然后果发生（凉天忘带水瓶）。只在真正重要时才救场。"],
    q: ["“Say it back to me: what are the two things?”", "“复述给我听：是哪两件事？”"] },
  { k: "impulse", i: "💥", rules: [], s: ["Acts before thinking about consequences; asks or says things without thinking", "做事不想后果；想都不想就问或说"],
    m: ["Impulse control is still under construction; the brakes come in after the engine. Normal at 11, but stronger in some kids.", "冲动控制还在发育中，刹车比油门来得晚。11 岁正常，但有些孩子更明显。"],
    d: ["Teach a pause routine: stop → think “what happens next?” → choose. Practice it when calm. Afterward, ask what happened and what he'd do next time instead of scolding.", "教一个暂停流程：停 → 想“接下来会怎样？” → 再选。平静时练习。事后问发生了什么、下次怎么做，而不是责骂。"],
    q: ["“Pause. What happens if you do that? What's another way?”", "“停一下。这么做会怎样？还有别的办法吗？”"] },
  { k: "drift", i: "😴", rules: ["drift"], s: ["Apps open for hours while he's away or idle; drifts off when both parents are out", "应用开着几个小时但人不在；父母都不在时就走神"],
    m: ["Not enough structure without an adult, plus easier rewards nearby (other tabs, games). Sometimes tiredness or boredom with work that's too easy or too hard.", "没有大人在时缺少结构，加上旁边有更容易的奖励（别的网页、游戏）。有时是累了，或者题太简单或太难而无聊。"],
    d: ["Before leaving, agree on a short plan: what, how long, and when you'll check in. Use short blocks (20–25 min) with a break. Look at the idle log together without blame.", "出门前约好一个简短计划：做什么、多久、几点联系。用短时段（20–25 分钟）加休息。一起看发呆记录，不责怪。"],
    q: ["“While we're out: AMC checkpoint, then a break, then Look Back. I'll call at 4.”", "“我们出去时：先做 AMC 关卡，休息一下，再做回顾。我 4 点打给你。”"] },
  { k: "minimum", i: "✍️", rules: ["journal_minimum"], s: ["Journal or writing stops right at the minimum; filler sentences", "日记或作文刚好写到最低字数；凑字的句子"],
    m: ["He's meeting the rule, not the purpose. Usually it means he doesn't see the point yet, or doesn't know what to say.", "他在满足规则，不是目的。通常是还不明白意义，或者不知道写什么。"],
    d: ["Give him a question to answer instead of a word count: what was hard today and what did you do about it? Read one entry together and ask a follow-up that shows you care.", "给他一个要回答的问题，而不是字数：今天什么难，你怎么处理的？一起读一篇，问一个表示你在乎的追问。"],
    q: ["“Tell me more about the part where…”", "“再多跟我说说……那部分。”"] },
  { k: "quit", i: "🌧️", rules: [], s: ["Gives up or gets upset after failing a checkpoint; says “I'm bad at this”", "关卡没过就放弃或生气；说“我就是不行”"],
    m: ["A failed test feels like a verdict on him. That's a fixed mindset, and it's more likely now that points depend on passing.", "没通过像是在评判他这个人。这是固定型思维，现在分数取决于通过，更容易出现。"],
    d: ["Sit with him for the review screen. Name one specific thing he did well. Make the retake about one thing to change. Praise effort and strategy, never “you're smart.”", "陪他看错题回顾。说出一件他做得好的具体事情。重考只专注改一件事。表扬努力和方法，不说“你真聪明”。"],
    q: ["“Not yet isn't never. Which one surprised you? What will you try differently?”", "“还没做到不等于做不到。哪题让你意外？下次换什么方法？”"] },
  { k: "mood", i: "💛", rules: [], s: ["“So tired,” low mood check-ins, withdrawing, irritable for days, sleep or appetite changes", "说“好累”，心情打卡低，退缩，连续几天烦躁，睡眠或胃口变化"],
    m: ["Could be tiredness, too much load, a social or school worry, or something more. Days of it matter more than one bad evening.", "可能是累、任务太多、社交或学校的烦恼，或者更多。连续几天比一个糟糕的晚上更值得注意。"],
    d: ["Lighten the load for a day. Check in one-on-one doing something side by side (a walk, the car). Listen more than you fix. If it lasts 2+ weeks, or he talks about hurting himself, call his pediatrician.", "减轻一天的任务。一对一在并肩做事时聊（散步、开车）。多听少给办法。如果持续 2 周以上，或说到伤害自己，联系儿科医生。"],
    q: ["“You seem tired lately. What's been the hardest part of your week?”", "“你最近好像很累。这周最难的是什么？”"] },
  { k: "compare", i: "⚖️", rules: [], s: ["You notice yourself comparing him with his brother or with classmates", "你发现自己拿他和弟弟或同学比较"],
    m: ["Comparison makes kids feel ranked, not motivated. Brothers develop on different timelines.", "比较让孩子觉得被排名，而不是被激励。兄弟发育的时间表不一样。"],
    d: ["Compare him only with himself last month. Point to his own progress numbers (checkpoints passed, self-check agreement).", "只拿他和上个月的自己比。用他自己的进步数据（通过的关卡、自查一致率）。"],
    q: ["“Last month you couldn't do this. Look at you now.”", "“上个月你还做不到这个。看看你现在。”"] } ];
const WATCH_HELP = ["When to ask his pediatrician: forgetfulness, losing track of tasks, acting before thinking and needing adults to check his work keep showing up together, at home and at school, for 6+ months, and they get in the way of grades or friendships. That isn't a diagnosis. Asking about an attention evaluation helps you choose strategies that fit.", "什么时候问儿科医生：健忘、做事丢三落四、不经思考就行动、需要大人检查，这些在家和学校同时出现 6 个月以上，并影响成绩或交友。这不是诊断；问一问注意力评估，能帮你选更合适的方法。"];
const watchFor = rule => WATCH.find(w => w.rules.includes(rule));
function watchGuideHtml(kid) {
  if (isKid() || !["eric", "ellis"].includes(kid)) return "";
  const zh = lang === "zh", L = a => esc(zh ? a[1] : a[0]);
  return `<details style="margin-top:12px"><summary><b>🧭 ${zh ? "家长观察指南：信号与应对" : "Watch-for guide: signs and how to respond"}</b></summary>
    <div class="meta" style="margin:6px 0">${zh ? "原则：平静地说出看到的行为，保持好奇，让小后果教他，表扬努力和诚实，绝不拿兄弟比较。" : "Ground rules: name the behavior calmly, stay curious, let small consequences teach, praise effort and honesty, never compare brothers."}</div>
    ${WATCH.map(w => `<details style="border-top:1px dashed #ddd;padding:6px 0"><summary>${w.i} ${L(w.s)}</summary>
      <div style="font-size:13px;margin:6px 0 0 4px"><div><b>${zh ? "可能意味着" : "What it usually means"}:</b> ${L(w.m)}</div><div style="margin-top:4px"><b>${zh ? "怎么做" : "What to do"}:</b> ${L(w.d)}</div><div style="margin-top:4px"><b>💬 ${zh ? "可以这样说" : "Try saying"}:</b> ${L(w.q)}</div></div></details>`).join("")}
    <div class="meta" style="margin-top:8px">🩺 ${L(WATCH_HELP)}</div></details>`;
}
function doneWellParentHtml(kid) {
  if (isKid() || !DW_KIDS.includes(kid)) return "";
  const zh = lang === "zh", P = dwSave(kid), wk = P.items.filter(x => x.d >= daysAgo(6)), done = wk.filter(x => x.done), pending = P.items.filter(x => x.done && !x.parent).slice(-5).reverse();
  const checked = P.items.filter(x => x.parent).slice(-20), agreeRate = checked.length ? Math.round(100 * checked.filter(x => x.parent.agree).length / checked.length) : null;
  const self = done.length ? Math.round(100 * done.reduce((a, x) => a + x.done.rates.reduce((b, v) => b + v, 0) / (2 * x.done.rates.length), 0) / done.length) : null;
  return `<div style="margin-top:12px"><b>🎯 ${zh ? "做得好吗？（自查）" : "Done well? (self-checks)"}</b>
    <div class="meta">${zh ? `本周 ${wk.length} 次计划，${done.length} 次完成自查` : `This week: ${wk.length} planned, ${done.length} self-checked`}${self != null ? ` · ${zh ? "自评" : "self-rating"} ${self}%` : ""}${agreeRate != null ? ` · ${zh ? "你同意他的自查" : "you agreed"} ${agreeRate}% ${zh ? "（越高说明他越会检查自己）" : "(higher = better self-judgment)"}` : ""}</div>
    ${pending.length ? pending.map(x => `<div style="border-top:1px dashed #ddd;padding:6px 0;font-size:13px"><b>${esc(x.task)}</b> <span class="meta">${fmtDate(x.d)}</span>
      ${x.crit.map((c, i) => `<div>${RATE[x.done.rates[i]][0]} ${esc(c)}</div>`).join("")}<div class="meta">${zh ? "下次：" : "Next time:"} ${esc(x.done.next)}</div>
      <div class="row" style="gap:6px;margin-top:4px"><button class="btn sm" data-dwp="${x.id}" data-kid="${kid}" data-agree="1">👍 ${zh ? "同意 (+5)" : "Agree (+5)"}</button><button class="btn sm" data-dwp="${x.id}" data-kid="${kid}" data-agree="0">〽️ ${zh ? "不太对" : "Not quite"}</button></div></div>`).join("")
      : `<div class="meta">${zh ? "没有等你查看的自查。" : "Nothing waiting for your spot-check."}</div>`}
    <div class="meta" style="margin-top:4px">${zh ? "抽查时看实际结果：他说做到了，真的做到了吗？同意才给分，奖励的是诚实的自我检查。" : "Spot-check the real result: did it match what he said? Points come only when you agree, so they reward honest self-checking."}</div></div>`;
}
document.addEventListener("click", async e => {
  const t = e.target.closest("[data-dwp]"); if (!t || isKid()) return;
  const kid = t.dataset.kid, P = dwSave(kid), x = P.items.find(i => i.id === t.dataset.dwp); if (!x) return; const agree = t.dataset.agree === "1";
  try {
    const note = agree ? "" : (prompt(lang === "zh" ? "哪里不太对？（他会看到，可以不写）" : "What wasn't quite right? (he'll see this; optional)") || "").slice(0, 120);
    x.parent = { agree, note, at: Date.now() }; await dwWrite(kid, P);
    if (agree) await sb.from("point_ledger").insert({ kid, date: today(), points: 5, source: "habit", ref: "donewell:" + x.id, label: "🎯 Done-well self-check (parent agreed)", label_zh: "🎯 自查做得好（家长同意）" });
    await loadAll(); route();
  } catch (err) { setStatus(err.message, true); }
});
function timePanel(kid) {
  const zh = lang === "zh", days = []; for (let i = 6; i >= 0; i--) days.push(daysAgo(i));
  const cell = {}; // app -> date -> secs. app_time (hub-measured) wins; older days fall back to the apps' own logs (learn_days)
  (S.learn_days || []).filter(x => x.kid === kid && days.includes(x.date) && x.active_secs > 0).forEach(x => { (cell[x.app] = cell[x.app] || {})[x.date] = x.active_secs; });
  (S.app_time || []).filter(x => x.kid === kid && days.includes(x.date)).forEach(x => { (cell[x.app] = cell[x.app] || {})[x.date] = x.secs; });
  const apps = Object.keys(cell).sort((a, b) => Object.values(cell[b]).reduce((s, v) => s + v, 0) - Object.values(cell[a]).reduce((s, v) => s + v, 0));
  const dl = d => { const x = new Date(d + "T12:00"); return d === today() ? (zh ? "今天" : "Today") : x.toLocaleDateString(zh ? "zh-CN" : "en-US", { weekday: "short" }); };
  const tot = d => apps.reduce((s, a) => s + (cell[a][d] || 0), 0), wk = a => days.reduce((s, d) => s + (cell[a][d] || 0), 0);
  const th = `<th style="text-align:left;padding:4px 6px">${zh ? "科目" : "Subject"}</th>${days.map(d => `<th style="padding:4px 5px;${d === today() ? "background:var(--line);border-radius:6px" : ""}">${dl(d)}</th>`).join("")}<th style="padding:4px 6px">${zh ? "7天" : "7 days"}</th>`;
  const rows = apps.map(a => `<tr><td style="padding:4px 6px;white-space:nowrap">${esc(appSubjName(kid, a))}</td>${days.map(d => `<td style="text-align:center;padding:4px 5px;${d === today() ? "font-weight:700" : ""}">${hm(cell[a][d] || 0)}</td>`).join("")}<td style="text-align:center;font-weight:700">${hm(wk(a))}</td></tr>`).join("");
  const foot = `<tr style="border-top:2px solid var(--line)"><td style="padding:4px 6px;font-weight:700">${zh ? "合计" : "Total"}</td>${days.map(d => `<td style="text-align:center;font-weight:700;padding:4px 5px">${hm(tot(d))}</td>`).join("")}<td style="text-align:center;font-weight:800">${hm(days.reduce((s, d) => s + tot(d), 0))}</td></tr>`;
  return `<div class="goals"><h4>⏱️ ${zh ? "每天各科学习时间" : "Time by subject, per day"}</h4>
    ${apps.length ? `<div style="overflow-x:auto"><table style="border-collapse:collapse;font-size:13.5px;width:100%"><tr>${th}</tr>${rows}${foot}</table></div>
    <div class="meta" style="margin-top:4px">${zh ? "只计算真正在用的时间（90秒内有点击或输入）。11/23 之前只有部分应用有记录。" : "Counts only active time (touched or typed in the last 90 s). Before 11/23 only some apps kept time."}</div>` : `<div class="meta">${zh ? "还没有记录。" : "No time recorded yet."}</div>`}${idlePanel(kid)}</div>`;
}
/* ---- 🔀 Game mix (Bobby 2026-11-21): don't spend all the time on one game. Once he has played 15+ min today,
   no single game may take more than 65% of today's game time; it rests until he plays his other games a bit. Kids only, not previews. ---- */
const GAMEMIX = { jonah: { share: 0.7, after: 25 } };
const GM_NAME = { space: ["🚀 Space Quest", "🚀 太空探险"], brain: ["🧠 Brain Park", "🧠 大脑乐园"], chinese: ["🐼 Panda Chinese", "🐼 熊猫中文"] };
const gmName = (kid, id) => { const n = GM_NAME[id]; if (n) return n[lang === "zh" ? 1 : 0]; const s = S.subjects.find(x => x.kid === kid && APPS[x.app_url] && APPS[x.app_url].id === id); return s ? `${s.icon || ""} ${lang === "zh" && s.name_zh ? s.name_zh : s.name}` : id; };
function gmApps(kid) { return [...new Set(S.subjects.filter(x => x.kid === kid && x.active && x.app_url && APPS[x.app_url]).map(x => x.app_url))]; }
function gmLoad(kid) { let s = {}; try { s = JSON.parse(localStorage.getItem(`fh_gmix_${kid}`) || "{}"); } catch (e) {} const d = new Date().toLocaleDateString("en-CA"); if (s.day !== d) s = { day: d, sec: {} }; s.sec = s.sec || {}; return s; }
function gmNeed(kid, id, s) { // seconds of OTHER games needed before `id` may open again (0 = free)
  const R = GAMEMIX[kid]; if (!R || gmApps(kid).length < 2) return 0;
  const T = Object.values(s.sec).reduce((x, y) => x + y, 0), ta = s.sec[id] || 0;
  if (T < R.after * 60 || ta <= R.share * T) return 0;
  return Math.ceil(ta / R.share - T);
}
function gmSay(t) { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = lang === "zh" ? "zh-CN" : "en-US"; u.rate = .9; speechSynthesis.speak(u); } catch (e) {} }
function gmRestCard(kid, id, need, onClose) {
  const zh = lang === "zh", others = gmApps(kid).filter(u => APPS[u].id !== id), mins = Math.max(1, Math.ceil(need / 60)), nm = gmName(kid, id), on = others.map(u => gmName(kid, APPS[u].id));
  const ov = document.createElement("div"); ov.className = "amcgate";
  ov.innerHTML = `<div class="amcgate-box"><div style="font-size:58px">💤</div><h2>${zh ? `${nm} 休息一下` : `${nm} is resting`}</h2>
    <p style="font-size:19px">${zh ? `今天你玩它玩了很多！换个游戏，大脑会长得更全面。` : `You played it a lot today! Switching games grows more of your brain.`}</p>
    <p style="font-size:19px"><b>${zh ? `去玩 ${on.join(" 或 ")} ${mins} 分钟，它就会醒来。` : `Play ${on.join(" or ")} for ${mins} more minute${mins > 1 ? "s" : ""} to wake it up.`}</b></p>
    <div class="amcgate-row">${others.map(u => `<button class="btn primary" data-go="${u}">${gmName(kid, APPS[u].id)} ▶</button>`).join("")}<button class="btn" data-x="1">${zh ? "返回" : "Back"}</button></div></div>`;
  document.body.appendChild(ov);
  gmSay(zh ? `${nm.replace(/^\S+\s/, "")}要休息一下。去玩${on.map(x => x.replace(/^\S+\s/, "")).join("或")}${mins}分钟，它就会醒来。` : `${nm.replace(/^\S+\s/, "")} is resting. Play ${on.map(x => x.replace(/^\S+\s/, "")).join(" or ")} for ${mins} more minute${mins > 1 ? "s" : ""} to wake it up.`);
  ov.querySelector("[data-x]").onclick = () => { ov.remove(); onClose && onClose(); };
  ov.querySelectorAll("[data-go]").forEach(b => b.onclick = () => { ov.remove(); onClose && onClose(); openApp(b.dataset.go, kid); });
}
function gameMixGate(cfg, kid) { if (!isKid() || preview || !GAMEMIX[kid]) return true; const need = gmNeed(kid, cfg.id, gmLoad(kid)); if (!need) return true; gmRestCard(kid, cfg.id, need); return false; }
function gameMixTrack(kid, cfg, fs) {
  if (!isKid() || preview || !GAMEMIX[kid]) return () => {};
  const key = `fh_gmix_${kid}`, zh = lang === "zh";
  const warn = document.createElement("div"); warn.style.cssText = "position:absolute;left:50%;top:56px;transform:translateX(-50%);z-index:4;display:none;background:#bde0fe;color:#0b2545;font-weight:800;padding:8px 16px;border-radius:14px;box-shadow:0 6px 20px #0006;text-align:center";
  fs.style.position = fs.style.position || "fixed"; fs.appendChild(warn);
  let warnAt = 0;
  const tick = setInterval(() => {
    if (document.hidden || Date.now() - IDLE.last >= 90000) return; // idle time doesn't count
    try { const c = JSON.parse(localStorage.getItem(`fh_coach_${kid}`) || "{}"); if (c.breakUntil > Date.now()) return;
      if (cfg.id === "space") { const q = JSON.parse(localStorage.getItem(`${kid}_space_state`) || "{}"); if (q.breakUntil > Date.now()) return; } } catch (e) {}
    const s = gmLoad(kid); s.sec[cfg.id] = (s.sec[cfg.id] || 0) + 5; try { localStorage.setItem(key, JSON.stringify(s)); } catch (e) {}
    if (gmNeed(kid, cfg.id, s)) {
      if (!warnAt) { warnAt = Date.now(); const on = gmApps(kid).filter(u => APPS[u].id !== cfg.id).map(u => gmName(kid, APPS[u].id)).join(zh ? " 或 " : " or "); warn.textContent = zh ? `⏳ 再玩2分钟，然后换去 ${on}！` : `⏳ 2 more minutes, then switch to ${on}!`; warn.style.display = "block"; }
      else if (Date.now() - warnAt > 120000) { clearInterval(tick); const need = gmNeed(kid, cfg.id, gmLoad(kid)); if (appOpen) appOpen(); gmRestCard(kid, cfg.id, need); }
    }
  }, 5000);
  return () => clearInterval(tick);
}
/* ---- 🧘 Play & break coach: wraps every hub game for the boys (Space Quest has its own) ---- */
/* Bobby 2026-11-25: fewer breaks for Jonah — one shared timer for ALL his games (Space Quest included), 30 min play then 5 min break. */
const COACH = { jonah: { play: 30, rest: 5, call: true }, eric: { play: 30, rest: 5 }, ellis: { play: 30, rest: 5 } };
const COACH_MOVES = { en: ["Do 10 jumping jacks 🤸", "Stretch up to the ceiling 10 times 🙆", "Get a drink of water 💧", "Look out the window at something far away 👀", "Do 5 slow squats 🏋️", "Take 5 big slow breaths 🌬️", "Walk around the house once 🚶", "Shake out your arms and legs 💃"],
  zh: ["做10个开合跳 🤸", "向上伸展10次 🙆", "去喝一杯水 💧", "看看窗外远处的东西 👀", "慢慢做5个深蹲 🏋️", "做5次慢慢的深呼吸 🌬️", "在家里走一圈 🚶", "甩甩胳膊和腿 💃"] };
/* 📣 Come back after the break (Bobby 2026-11-21): screen stays awake during the break; at the end a chime + voice call,
   repeated for ~3 min for Jonah (call: true); one chime for the older boys. */
let coachWake = null;
async function coachWakeOn() { try { if (navigator.wakeLock && !coachWake) { coachWake = await navigator.wakeLock.request("screen"); coachWake.addEventListener("release", () => { coachWake = null; }); } } catch (e) {} }
function coachWakeOff() { try { coachWake && coachWake.release(); } catch (e) {} coachWake = null; }
function coachChime() { try { const a = coachChime.a || (coachChime.a = new (window.AudioContext || window.webkitAudioContext)()); a.resume && a.resume();
  [784, 988, 1175, 1568].forEach((f, i) => { const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + i * .14; o.type = "triangle"; o.frequency.value = f; g.gain.setValueAtTime(.16, t); g.gain.exponentialRampToValueAtTime(.001, t + .25); o.connect(g).connect(a.destination); o.start(t); o.stop(t + .3); }); } catch (e) {} }
function playCoach(kid, fs) {
  const L = COACH[kid] || { play: 30, rest: 5 }, key = `fh_coach_${kid}`, zh = lang === "zh";
  let st = {}; try { st = JSON.parse(localStorage.getItem(key) || "{}"); } catch (e) {}
  const saveSt = () => { try { localStorage.setItem(key, JSON.stringify(st)); } catch (e) {} };
  if (st.last && Date.now() - st.last >= L.rest * 60000 && !(st.breakUntil > Date.now())) st.sec = 0;
  st.sec = st.sec || 0; saveSt();
  const ov = document.createElement("div");
  ov.style.cssText = "position:absolute;inset:0;z-index:5;display:none;align-items:center;justify-content:center;background:rgba(16,0,43,.92);color:#fff;text-align:center;padding:20px;font-family:inherit";
  fs.style.position = fs.style.position || "fixed"; fs.appendChild(ov);
  const warn = document.createElement("div");
  warn.style.cssText = "position:absolute;left:50%;top:56px;transform:translateX(-50%);z-index:4;display:none;background:#ffd166;color:#3b2400;font-weight:800;padding:8px 16px;border-radius:14px;box-shadow:0 6px 20px #0006";
  warn.textContent = zh ? "⏳ 还有1分钟就休息啦，先做完这一题！" : "⏳ Break in 1 minute — finish what you're doing!"; fs.appendChild(warn);
  let tick = null, bt = null;
  let callT = [];
  const first = String(kidName(kid) || kid).split(/\s/)[0];
  const CALLS = zh ? [`${first}，休息好啦！快回来玩吧！`, `${first}，游戏在等你哦！`, `${first}，快回来，我们继续！`] : [`${first}! Break's over. Come back and play!`, `${first}, your game is waiting for you!`, `${first}, come on back. Let's keep going!`];
  const stopCall = () => { callT.forEach(clearTimeout); callT = []; coachWakeOff(); };
  const startCall = () => { stopCall(); const times = L.call ? [0, 20, 45, 75, 110, 150, 180] : [0];
    times.forEach((sec, i) => callT.push(setTimeout(() => { coachChime(); if (L.call) setTimeout(() => gmSay(CALLS[i % CALLS.length]), 700); }, sec * 1000)));
    if (L.call) { coachWakeOn(); callT.push(setTimeout(coachWakeOff, 190000)); } else coachWakeOff(); };
  const showBreak = () => {
    warn.style.display = "none"; ov.style.display = "flex"; const total = L.rest * 60000; let lastMove = -1; coachWakeOn();
    const draw = () => { const left = Math.max(0, st.breakUntil - Date.now()), sec = Math.ceil(left / 1000), mv = Math.floor((total - left) / 60000) % 8;
      if (left > 0) { if (mv !== lastMove || !ov.innerHTML) { lastMove = mv; }
        ov.innerHTML = `<div style="max-width:420px"><div style="font-size:64px">🧘</div><h2 style="margin:6px 0">${zh ? "休息时间！" : "Break time!"}</h2><div style="font-size:60px;font-weight:800;color:#ffd166">${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}</div><p style="font-size:22px;margin:10px 0"><b>${COACH_MOVES[zh ? "zh" : "en"][(mv + new Date().getDate()) % 8]}</b></p><p style="opacity:.85">${zh ? `你已经玩了${L.play}分钟。让眼睛和身体休息一下，游戏会等你。` : `You played for ${L.play} minutes. Rest your eyes and move your body — your game will wait for you.`}</p></div>`; }
      else { clearInterval(bt); bt = null; st.sec = 0; st.breakUntil = 0; saveSt(); startCall();
        ov.innerHTML = `<div><div style="font-size:64px">✅</div><h2>${zh ? "休息好了！" : "Recharged!"}</h2><button style="font:inherit;font-weight:800;font-size:22px;padding:12px 26px;border:none;border-radius:16px;background:#ffd166;color:#3b2400;cursor:pointer">${zh ? "回到游戏 ▶" : "Back to the game ▶"}</button></div>`;
        ov.querySelector("button").onclick = () => { stopCall(); ov.style.display = "none"; }; } };
    draw(); clearInterval(bt); bt = setInterval(draw, 1000);
  };
  if (st.breakUntil > Date.now()) showBreak();
  tick = setInterval(() => {
    if (document.hidden || ov.style.display === "flex") return;
    /* Bobby 2026-11-25: idle time doesn't count — only seconds with a touch/tap/key in the last 90 s; 5+ idle minutes count as a break. */
    const idleMs = Date.now() - IDLE.last; if (idleMs >= L.rest * 60000) { if (st.sec) { st.sec = 0; saveSt(); } return; } if (idleMs >= 90000) return;
    st.sec++; st.last = Date.now();
    if (st.sec === L.play * 60 - 60) { warn.style.display = "block"; setTimeout(() => { warn.style.display = "none"; }, 8000); }
    if (st.sec >= L.play * 60) { st.breakUntil = Date.now() + L.rest * 60000; saveSt(); showBreak(); }
    if (st.sec % 10 === 0) saveSt();
  }, 1000);
  return () => { clearInterval(tick); clearInterval(bt); stopCall(); st.last = Date.now(); saveSt(); };
}
document.addEventListener("click", e => { const a = e.target.closest("[data-app]"); if (a) { e.preventDefault(); e.stopPropagation(); openApp(a.dataset.app, a.dataset.appkid); } }, true);

/* ---- parent preview: see a boy's page exactly as he does; nothing saves ---- */
let preview = null;
function openPreview(kidId) {
  const full = preview ? preview.full : { kids: S.kids, entries: S.entries, goals: S.goals, metrics: S.metrics, readings: S.readings, docs: S.docs, journal: S.journal, subjects: S.subjects, checkins: S.checkins, moods: S.moods, point_ledger: S.point_ledger, rewards: S.rewards, redemptions: S.redemptions, weekly_exams: S.weekly_exams, allowance_payouts: S.allowance_payouts };
  const f = a => (a || []).filter(x => x.kid === kidId);
  preview = { kid: kidId, full };
  Object.assign(S, { kids: full.kids.filter(k => k.id === kidId), entries: f(full.entries), goals: f(full.goals), metrics: f(full.metrics), readings: f(full.readings),
    docs: full.docs.filter(d => d.kid === kidId && d.kid_visible), journal: f(full.journal), subjects: f(full.subjects).filter(x => x.active !== false),
    moods: f(full.checkins).filter(c => c.kid_mood).map(c => ({ date: c.date, kid_mood: c.kid_mood })), checkins: [],
    point_ledger: f(full.point_ledger), redemptions: f(full.redemptions), weekly_exams: f(full.weekly_exams), allowance_payouts: f(full.allowance_payouts), rewards: (full.rewards || []).filter(r => r.active && (!r.kid || r.kid === kidId)) });
  lastBadges = null; window.scrollTo(0, 0); kidRender();
}
function exitPreview() {
  if (!preview) return; Object.assign(S, preview.full); preview = null; lastBadges = null;
  document.body.classList.remove("kidmode"); setKidTheme(null); renderShell(); route();
}
const previewBar = () => preview ? `<div class="pvbar"><span>👀 ${T().previewing(esc(kidName(preview.kid)))}</span><span class="pvkids">${preview.full.kids.map(k => `<button class="${k.id === preview.kid ? "on" : ""}" data-pv="${esc(k.id)}">${avatarHtml(k.avatar, 22)} ${esc(lang === "zh" && k.name_zh ? k.name_zh : k.name)}</button>`).join("")}</span><button class="pvexit" data-pvexit>${T().exitPreview}</button></div>` : "";
document.addEventListener("click", e => { const a = e.target.closest("[data-pv]"); if (a) { e.stopPropagation(); return openPreview(a.dataset.pv); } if (e.target.closest("[data-pvexit]")) { e.stopPropagation(); exitPreview(); } }, true);

async function kidBoot() {
  $("#root").innerHTML = `<div class="wrap"><div class="status" id="status">${T().loading}</div></div>`;
  try { await loadAll(); kidRender(); } catch (e) { setStatus(e.message || "Load failed", true); }
}
const AVATARS = ["🦊","🦁","🐼","🐯","🐸","🐨","🦄","🐲","🐙","🦖","🐵","🐧","🦉","🐬","🚀","⚽","🤺","🎸"];
const LEVEL_AT = [0, 50, 150, 300, 500, 800];
const BADGES = [["first","👣"],["s3","🔥"],["s7","⚡"],["s14","🌟"],["hero","🦸"],["stars5","⭐"],["stars20","🏅"],["writer","✏️"],["dreamer","💡"],["explorer","🧭"],["champ","🏆"]];
// Journal points need 500+ words. Chinese counts each character as a word; entries saved before the rule (2026-11-21 04:00 UTC) keep their points.
const JOURNAL_MIN_WORDS = 500, JOURNAL_RULE_FROM = "2026-11-21T04:00:00Z";
const wordCount = str => { const s = String(str || ""); const cjk = (s.match(/[\u3400-\u9fff\uf900-\ufaff]/g) || []).length; const rest = s.replace(/[\u3400-\u9fff\uf900-\ufaff]/g, " ").match(/[A-Za-z0-9\u00C0-\u024F]+(?:['’-][A-Za-z0-9]+)*/g) || []; return cjk + rest.length; };
const journalCounts = j => (S.point_ledger || []).some(r => r.ref === "journal:" + j.id);
const jMin = () => S.kids[0]?.journal_min_words ?? JOURNAL_MIN_WORDS;
/* ---- 📓 Journal gate (Bobby 2026-11-21): Eric & Ellis write a 250+ word journal every day before anything else opens.
   Too many mistakes (1+ per 50 words: 250 words → 4 allowed, 5 pauses) doesn't lock; it ⏸️ pauses ALL other points (server-side,
   private.journal_frozen) until that entry is fixed, even on later days. The spell + grammar check runs on the device (shared/jcheck.js).
   Parents can turn it off or skip one day. Jonah is exempt. ---- */
const JV = "20261121jg3";
let jcheckP = null;
const jLoad = () => jcheckP || (jcheckP = import(`./shared/jcheck.js?v=${JV}`).then(() => window.JCHECK).catch(e => { jcheckP = null; throw e; }));
const jRule = k => k && k.journal_required ? { min: k.journal_min_words || 250, per: k.journal_err_per || 50, open: k.journal_unlock_date === today() } : null;
const jToday = kid => (S.journal || []).filter(j => j.kid === kid && j.date === today()).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0] || null;
const jLockAt = (k, words) => Math.max(1, Math.floor(Math.max(words || 0, k.journal_min_words || 250) / Math.max(k.journal_err_per || 50, 10)));
const jBad = k => k && k.journal_required ? (S.journal || []).filter(j => j.kid === k.id && j.mistakes != null && j.date >= "2026-11-21" && j.mistakes >= jLockAt(k, j.words)).sort((a, b) => b.date.localeCompare(a.date))[0] || null : null;
const jEditing = k => jBad(k) || jToday(k.id);
/* ---- 📬 Journal Buddy (Bobby 11/25): a reader that writes back to every entry (edge function journal-buddy):
   a specific reaction, one question for tomorrow, one tip from his writing targets. Flags are parent-only. ---- */
const buddyOf = j => (S.jreplies || []).find(x => x.journal_id === j.id) || null;
const buddyNote = (j, parent) => { const r = buddyOf(j); if (!r) return ""; const zh = lang === "zh";
  return `<div class="jbuddy${parent && r.flag ? " flag" : ""}">${parent && r.flag ? `<div class="jbflag">⚠️ ${zh ? "Buddy 提醒家长看看" : "Buddy flagged this for you"}: ${esc(r.flag_reason || "")}</div>` : ""}<b>📬 ${zh ? "Buddy 的回信" : "Buddy's note"}${parent && r.source === "basic" ? ` <span class="meta" style="font-weight:500">(${zh ? "简单版：AI 未开启" : "simple version: AI not switched on"})</span>` : ""}</b>${esc(r.reaction)}${r.question ? `<div class="jbq2">💭 ${esc(r.question)}</div>` : ""}${r.tip ? `<div class="jbq2">✏️ ${esc(r.tip)}</div>` : ""}</div>`; };
const buddyLastQ = kid => { const j = (S.jreplies || []).filter(r => r.kid === kid && r.question).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0]; return j ? j.question : null; };
async function buddyAsk(id) { if (!id) return null;
  try { const { data, error } = await sb.functions.invoke("journal-buddy", { body: { journal_id: id } }); if (error || !data || !data.reaction) return null; return data; } catch (e) { return null; } }
/* ---- 🔊 Hear it (Bobby 11/25): reads writing aloud one sentence at a time and highlights each one, so a run-on is
   heard (no pause) and seen (one giant highlight). Uses the browser's voice. ---- */
let hearTok = 0;
const hearSplit = t => (String(t || "").match(/[^.!?\n]+(?:[.!?]+["')\]]*)?/g) || []).map(s => s.replace(/\s+/g, " ").trim()).filter(s => /[A-Za-z0-9]/.test(s));
function hearReset(panel, btn, done) { if (btn) { delete btn.dataset.playing; btn.textContent = btn.dataset.label || "▶ Hear it"; }
  if (panel) { panel.querySelectorAll("span.on").forEach(x => x.classList.remove("on")); const f = panel.querySelector(".jread-f"); if (f && done) f.hidden = false; } }
function hearIt(text, panel, btn) {
  const ss = window.speechSynthesis, zh = lang === "zh";
  if (!ss || !window.SpeechSynthesisUtterance) return setStatus(zh ? "这个浏览器不能朗读。" : "This browser can't read aloud.", true);
  const stopping = btn && btn.dataset.playing; hearTok++; ss.cancel();
  document.querySelectorAll("[data-playing]").forEach(b => hearReset(null, b));
  if (stopping) return hearReset(panel, btn);
  const parts = hearSplit(text); if (!parts.length || !panel) return;
  const tok = hearTok, long = n => n > 30;
  panel.innerHTML = `<div class="jread-h">🔊 ${zh ? "每个高亮的部分是一句话。高亮特别长、中间不停顿 = 连写句，试着拆开。" : "Each highlight is one sentence. A really long highlight with no pause is a run-on. Try splitting it."}</div>`
    + parts.map((s, i) => `<span data-s="${i}" class="${long(s.split(" ").length) ? "long" : ""}">${esc(s)}</span> `).join("")
    + `<div class="jread-f" hidden>✅ ${zh ? "读完了！有没有哪句话听起来一直停不下来？" : "Done! Did any sentence sound like it never stopped?"}${parts.some(s => long(s.split(" ").length)) ? (zh ? " 波浪线标出的是特别长的句子。" : " The wavy lines mark the longest sentences.") : ""}</div>`;
  panel.hidden = false; if (btn) { btn.dataset.label = btn.dataset.label || btn.textContent; btn.dataset.playing = 1; btn.textContent = zh ? "⏹ 停止" : "⏹ Stop"; }
  const vs = ss.getVoices() || [], voice = vs.find(v => /^en[-_]US/i.test(v.lang) && /natural|samantha|google|aria|jenny/i.test(v.name)) || vs.find(v => /^en[-_]US/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang));
  const ka = setInterval(() => { if (tok !== hearTok) return clearInterval(ka); if (ss.speaking && !ss.paused) { ss.pause(); ss.resume(); } }, 10000);
  let i = 0;
  const next = () => { if (tok !== hearTok) return; if (!panel.isConnected) { hearTok++; ss.cancel(); return; }
    panel.querySelectorAll("span.on").forEach(x => x.classList.remove("on"));
    if (i >= parts.length) { clearInterval(ka); return hearReset(panel, btn, true); }
    const sp = panel.querySelector(`[data-s="${i}"]`); if (sp) { sp.classList.add("on"); sp.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
    const u = new SpeechSynthesisUtterance(parts[i]); if (voice) u.voice = voice; u.lang = "en-US"; u.rate = 0.95;
    u.onend = u.onerror = () => { i++; setTimeout(next, 280); }; ss.speak(u); };
  next();
}
const JST = {};
async function jState(k) {
  const rule = jRule(k); if (!rule) return { ok: true };
  if (rule.open) return { ok: true, open: true, rule };
  const e = jToday(k.id); if (!e) return { ok: false, why: "none", rule };
  let J; try { J = await jLoad(); } catch (err) { return { ok: true, rule, err: true }; } // checker failed to load: never lock him out by accident
  const c = JST[k.id], r = c && c.body === e.body ? c.r : await J.check(e.body); JST[k.id] = { body: e.body, r };
  const v = J.verdict(r, rule.min, rule.per);
  return { ok: v.longEnough, why: !v.longEnough ? "short" : "", r, v, rule, entry: e };
}
function jLockMsg(st, zh) {
  if (st.why === "none") return zh ? `先写今天的日记（至少 ${st.rule.min} 字），其他功能才会打开。` : `Write today's journal first (at least ${st.rule.min} words). Everything else opens after that.`;
  if (st.why === "short") return zh ? `今天的日记只有 ${st.r.words} 字，需要 ${st.rule.min} 字。` : `Today's journal has ${st.r.words} words. It needs ${st.rule.min}.`;
  return "";
}
function jGoWrite() { const n = document.getElementById("ks-note"), i = document.getElementById("jIn"); if (n) n.scrollIntoView({ behavior: "smooth", block: "start" }); if (i) setTimeout(() => i.focus(), 400); }
async function journalGateOk(kid) {
  if (!isKid() || preview) return true;
  const k = S.kids.find(x => x.id === kid); const st = await jState(k); if (st.ok) return true;
  const zh = lang === "zh", ov = document.createElement("div"); ov.className = "amcgate";
  ov.innerHTML = `<div class="amcgate-box"><div style="font-size:58px">📓</div><h2>${zh ? "先写日记！" : "Journal first!"}</h2><p style="font-size:18px">${jLockMsg(st, zh)}</p>
    <div class="amcgate-row"><button class="btn primary" data-w="1">✏️ ${zh ? "去写日记" : "Write my journal"}</button><button class="btn" data-x="1">${zh ? "返回" : "Back"}</button></div></div>`;
  document.body.appendChild(ov);
  ov.querySelector("[data-x]").onclick = () => ov.remove(); ov.querySelector("[data-w]").onclick = () => { ov.remove(); jGoWrite(); };
  return false;
}
function jApplyPause(k) {
  const root = document.querySelector(".kw-layout")?.parentElement; if (!root) return;
  const b = jBad(k), zh = lang === "zh"; let bar = document.getElementById("jPauseBar");
  if (!b) { if (bar) bar.remove(); return; }
  if (!bar) { bar = document.createElement("div"); bar.id = "jPauseBar"; bar.className = "jlockbar jpause"; root.querySelector(".kw-layout").before(bar); }
  const allowed = jLockAt(k, b.words) - 1, day = b.date === today() ? (zh ? "今天" : "today") : fmtDate(b.date);
  bar.innerHTML = `<div class="jl-ic">⏸️</div><div><b>${zh ? "积分暂停了" : "Points are paused"}</b><div>${zh ? `${day}的日记有 ${b.mistakes} 个错误（最多 ${allowed} 个）。改好之前，做任何事都不会得分。` : `Your journal from ${day} has ${b.mistakes} mistakes (${allowed} allowed). Until you fix them, nothing earns points.`}</div></div><button type="button" class="btn primary" id="jPauseGo">✏️ ${zh ? "去改" : "Fix it"}</button>`;
  bar.querySelector("#jPauseGo").onclick = jGoWrite;
}
function jApplyLock(st) {
  const root = document.querySelector(".kw-layout")?.parentElement; if (!root) return;
  root.classList.toggle("jlocked", !st.ok);
  let bar = document.getElementById("jLockBar");
  if (st.ok) { if (bar) bar.remove(); return; }
  const zh = lang === "zh";
  if (!bar) { bar = document.createElement("div"); bar.id = "jLockBar"; bar.className = "jlockbar"; root.querySelector(".kw-layout").before(bar); }
  bar.innerHTML = `<div class="jl-ic">🔒</div><div><b>${zh ? "今天的日记还没完成" : "Today's journal isn't done yet"}</b><div>${jLockMsg(st, zh)}</div></div><button type="button" class="btn primary" id="jLockGo">✏️ ${zh ? "写日记" : "Write it"}</button>`;
  bar.querySelector("#jLockGo").onclick = jGoWrite;
}
const jOpen = { fix: false, coach: true };
function jExtraHtml(r, zh, text, age) {
  const J = window.JCHECK; if (!J || !J.coach || !text || r.words < 60) return "";
  const segs = J.corrected(text, r.issues), c = J.coach(text, r.issues, age);
  const fixHtml = segs.some(x => x.fix != null) ? segs.map(x => x.fix == null ? esc(x.t) : `${x.wrong ? `<del>${esc(x.wrong)}</del>` : ""}${x.fix ? `<ins${x.unsure ? ` title="${zh ? "最可能的拼法" : "best guess"}"` : ""}>${esc(x.fix)}${x.unsure ? "?" : ""}</ins>` : ""}`).join("") : "";
  const stars = n => "★".repeat(n) + "☆".repeat(4 - n);
  return `${fixHtml ? `<details class="jbox" data-jopen="fix" ${jOpen.fix ? "open" : ""}><summary>✅ ${zh ? "改正后的样子（自己动手改哦）" : "Corrected version (make the changes yourself)"}</summary>
      <div class="jfix">${fixHtml}</div><div class="kw-sub" style="opacity:.75">${zh ? "红色划掉的是错的，绿色是改正。带 ? 的是最可能的拼法。" : "Red = mistake, green = correction. A ? means it's the most likely spelling."}</div></details>` : ""}
    <details class="jbox" data-jopen="coach" ${jOpen.coach ? "open" : ""}><summary>✍️ ${zh ? "写作教练" : "Writing coach"} · ${c.total}/${c.max} ⭐</summary>
      ${c.focus ? `<div class="jfocus"><b>${zh ? "先试试这个：" : "Try this first:"}</b> ${esc(c.focus)}</div>` : `<div class="jfocus">🌟 ${zh ? "写得很好！" : "Great writing! Keep it up."}</div>`}
      <div class="jtraits">${c.traits.map(x => `<div class="jtrait"><div class="jt-h"><b>${esc(x.name)}</b><span class="jt-s">${stars(x.stars)}</span></div>${x.tips.length ? `<ul>${x.tips.map(tp => `<li>${esc(tp)}</li>`).join("")}</ul>` : `<div class="jt-ok">✓ ${zh ? "很好" : "Nice work"}</div>`}</div>`).join("")}</div>
      <div class="kw-sub" style="opacity:.7">${c.stats.paragraphs} ${zh ? "段" : "paragraphs"} · ${c.stats.sentences} ${zh ? "句" : "sentences"} · ${zh ? "平均每句" : "about"} ${Math.round(c.stats.avg)} ${zh ? "字" : "words per sentence"} · ${zh ? `按 ${age} 岁的标准` : `goals for age ${age}`}</div></details>`;
}
function jChkHtml(r, v, zh, text, age) {
  if (!r) return "";
  const head = v.tooMany ? (zh ? `✏️ 错误：<b>${r.mistakes}</b>（最多 ${v.allowed} 个）· 再改 ${r.mistakes - v.allowed} 个，不然所有积分都会暂停` : `✏️ Mistakes: <b>${r.mistakes}</b> (${v.allowed} allowed) · fix ${r.mistakes - v.allowed} more, or all your points stay paused`)
    : (zh ? `✏️ 错误：<b>${r.mistakes}</b> · 可以（最多 ${v.allowed} 个）` : `✏️ Mistakes: <b>${r.mistakes}</b> · OK (${v.allowed} allowed)`);
  return `<div class="jchk-head ${v.tooMany ? "bad" : "good"}">${head}</div>${r.issues.length ? `<div class="jchk-list">${r.issues.slice(0, 60).map((x, i) => `<button type="button" class="jchip k-${x.kind}" data-ji="${i}">${esc(x.msg)}${x.kind === "spell" && x.fix ? ` · ${lang === "zh" ? "可能是" : "maybe"} <b>${esc(x.fix)}</b>?` : ""}</button>`).join("")}</div><div class="kw-sub" style="opacity:.75">${zh ? "点一个错误，就会在日记里选中它。" : "Tap a mistake to jump to it in your journal."}</div>` : ""}${jExtraHtml(r, zh, text, age)}`;
}
function kidGame() {
  const d = today(), moodDays = new Set(S.moods.map(m => m.date));
  const rateIds = new Set(S.metrics.filter(m => m.type === "rate").map(m => m.id));
  const taps = S.readings.filter(r => rateIds.has(r.metric)).reduce((s, r) => s + (+r.value || 0), 0);
  const myWins = S.entries.filter(e => e.by_kid).length, jn = S.journal.filter(j => journalCounts(j) || (j.created_at && j.created_at < JOURNAL_RULE_FROM)).length, ideas = S.goals.filter(g => g.proposed_by_kid).length;
  const xp = ptsOf(S.kids[0]?.id).life; // lifetime points from the ledger (spending never lowers the level)
  let lvl = 0; LEVEL_AT.forEach((v, i) => { if (xp >= v) lvl = i; });
  const extra = Math.max(0, Math.floor((xp - 800) / 400)); const lvlNum = lvl + 1 + extra;
  const curAt = lvl < 5 ? LEVEL_AT[lvl] : 800 + extra * 400, nextAt = lvl < 5 ? LEVEL_AT[lvl + 1] : 800 + (extra + 1) * 400;
  let streak = 0, cur = moodDays.has(d) ? d : addDays(d, -1); while (moodDays.has(cur)) { streak++; cur = addDays(cur, -1); }
  let best = 0, run = 0, prev = null; [...moodDays].sort().forEach(x => { run = prev && addDays(prev, 1) === x ? run + 1 : 1; best = Math.max(best, run); prev = x; });
  const w1 = addDays(d, -6), hero = S.metrics.some(m => m.type === "rate" && m.per_week && S.readings.filter(r => r.metric === m.id && r.date >= w1).reduce((s, r) => s + (+r.value || 0), 0) >= m.per_week);
  const got = { first: moodDays.size >= 1, s3: best >= 3, s7: best >= 7, s14: best >= 14, hero, stars5: S.entries.length >= 5, stars20: S.entries.length >= 20, writer: jn >= 3, dreamer: ideas >= 1, explorer: lvlNum >= 3, champ: lvlNum >= 5 };
  return { xp, lvl, lvlNum, curAt, nextAt, streak, best, got, levelName: T().levels[Math.min(lvl, 5)] };
}
function confetti() {
  const box = document.createElement("div"); box.className = "confetti";
  const bits = ["🎉","⭐","✨","💚","💖","🧡","💜","🎊"];
  for (let i = 0; i < 40; i++) { const sp = document.createElement("span"); sp.textContent = bits[i % bits.length]; sp.style.left = Math.random() * 100 + "vw"; sp.style.animationDelay = Math.random() * .6 + "s"; sp.style.fontSize = 18 + Math.random() * 22 + "px"; box.appendChild(sp); }
  document.body.appendChild(box); setTimeout(() => box.remove(), 2800);
}
let lastBadges = null;

/* ---------- THEME ICONS: one pixel grid per icon, drawn flat (Pixel Quest) or as 3D cubes (Voxel); Pop uses emoji ---------- */
// k = outline (Pixel Quest only), K = dark detail (both), others = colours
const KI_PAL = { k: "#1b1b2f", K: "#1b1b2f", w: "#ffffff", s: "#b8b8c8", r: "#ff4d4d", o: "#ff9a3d", y: "#ffd23d", g: "#3ec46d", G: "#2a9d55", b: "#3d9bff", B: "#2a5bd7", c: "#7fd6fb", p: "#ff7eb6", P: "#7a5cff", n: "#a0632d" };
const KI_FACE = m => ["...kkkkk...", "..kyyyyyk..", ".kyyyyyyyk.", "kyyKyyyKyyk", "kyyKyyyKyyk", "kyyyyyyyyyk", ...m, ".kyyyyyyyk.", "..kyyyyyk..", "...kkkkk..."];
const KI_ART = {
  heart: ["..kk...kk..", ".krrk.krrk.", "krwrrkrrrrk", "krwrrrrrrrk", "krrrrrrrrrk", ".krrrrrrrk.", "..krrrrrk..", "...krrrk...", "....krk....", ".....k....."],
  star: [".....k.....", "....kyk....", "....kyk....", "kkkkyyykkkk", "kyywyyyyyyk", ".kyyyyyyyk.", "..kyyyyyk..", "..kyyyyyk..", ".kyyykyyyk.", ".kyyk.kyyk.", "kyk.....kyk", "kk.......kk"],
  fire: [".....k.....", "....kok....", "....kook...", "...kooook..", "..koooyook.", "..kooyyyok.", ".koooyyyook", ".kooyywyyok", ".koyyywyyok", "..koyyyyok.", "...kooook..", "....kkkk..."],
  bolt: ["......kkkk", ".....kyyk.", "....kyyk..", "...kyyk...", "..kyyykkkk", ".kyyyyyyyk", "..kkkkyyk.", ".....kyk..", "....kyk...", "...kyk....", "..kk......"],
  calendar: ["..K.....K..", "kkKkkkkkKkk", "krrrrrrrrrk", "krrrrrrrrrk", "kkkkkkkkkkk", "kwwwwwwwwwk", "kwswswswswk", "kwwwwwwwwwk", "kwswswrrswk", "kwwwwwrrwwk", "kwswswswswk", "kkkkkkkkkkk"],
  globe: ["...kkkkk...", "..kbbgbbk..", ".kbgggbbbk.", "kbwggbbggbk", "kbbbgbbgggk", "kbbbbbbbggk", "kbggbbbbgbk", "kbgggbbbbbk", ".kbggbbgbk.", "..kbbbbbk..", "...kkkkk..."],
  target: ["...kkkkk...", "..krrrrrk..", ".krwwwwwrk.", "krwrrrrrwrk", "krwrwwwrwrk", "krwrwrwrwrk", "krwrwwwrwrk", "krwrrrrrwrk", ".krwwwwwrk.", "..krrrrrk..", "...kkkkk..."],
  book: [".kkkk.kkkk.", "kwwwwkwwwwk", "kwsswkwsswk", "kwwwwkwwwwk", "kwsswkwsswk", "kwwwwkwwwwk", "kwsswkwsswk", "kwwwwkwwwwk", "kBBBBkBBBBk", ".kkkkkkkkk."],
  books: ["..kkkkkkkk.", "..krrrrrrk.", "..kkkkkkkk.", ".kkkkkkkk..", ".kggggggk..", ".kkkkkkkk..", "..kkkkkkkk.", "..kbbbbbbk.", "..kkkkkkkk.", "kkkkkkkkk..", "kyyyyyyyk..", "kkkkkkkkk.."],
  pencil: ["........kk.", ".......kppk", "......kyykk", ".....kyyk..", "....kyyk...", "...kyyk....", "..kyyk.....", ".knyk......", ".knk.......", "kk........."],
  bulb: ["...kkkkk...", "..kyyyyyk..", ".kyywyyyyk.", ".kywyyyyyk.", ".kyyyyyyyk.", ".kyyyyyyyk.", "..kyyyyyk..", "...kyyyk...", "...ksssk...", "...kkkkk...", "...ksssk...", "....kkk...."],
  compass: ["...kkkkk...", "..kwwwwwk..", ".kwwwwwrwk.", "kwwwwwrrwwk", "kwwwwrrrwwk", "kwwwwKwwwwk", "kwwbbbwwwwk", "kwwbbwwwwwk", ".kwbwwwwwk.", "..kwwwwwk..", "...kkkkk..."],
  trophy: [".kkkkkkkkk.", "kkyyyyyyykk", "kykyywyykyk", "kykyyyyykyk", ".kkyyyyykk.", "...kyyyk...", "....kyk....", "....kyk....", "...kkkkk...", "..knnnnnk..", "..kkkkkkk.."],
  medal: [".kk.....kk.", ".kbk...kbk.", "..kbk.kbk..", "...kbkbk...", "....kkk....", "...kyyyk...", "..kyywyyk..", "..kyyyyyk..", "..kyyyyyk..", "...kyyyk...", "....kkk...."],
  check: ["kkkkkkkkkkk", "kgggggggggk", "kgggggggwgk", "kggggggwwgk", "kgggggwwggk", "kgwggwwgggk", "kgwwwwggggk", "kggwwgggggk", "kgggggggggk", "kkkkkkkkkkk"],
  box: ["kkkkkkkkkkk", "kwwwwwwwwwk", "kwwwwwwwwwk", "kwwwwwwwwwk", "kwwwwwwwwwk", "kwwwwwwwwwk", "kwwwwwwwwwk", "kwwwwwwwwwk", "kwwwwwwwwwk", "kkkkkkkkkkk"],
  play: ["kk.........", "kwkk.......", "kwwwkk.....", "kwwwwwkk...", "kwwwwwwwkk.", "kwwwwwwwwwk", "kwwwwwwwkk.", "kwwwwwkk...", "kwwwkk.....", "kwkk.......", "kk........."],
  lock: ["...kkkkk...", "..kssssskk.", "..ks...sk..", "..ks...sk..", "kkkkkkkkkkk", "kyyyyyyyyyk", "kyyyyKyyyyk", "kyyyyKyyyyk", "kyyyyyyyyyk", "kkkkkkkkkkk"],
  question: ["...kkkkk...", "..kpppppk..", ".kppkkkppk.", ".kkk...kpk.", "......kppk.", ".....kppk..", "....kppk...", "....kkkk...", "...........", "....kkkk...", "....kppk...", "....kkkk..."],
  shield: ["kkkkkkkkkkk", "kbbbbbbbbbk", "kbbbbybbbbk", "kbbbyyybbbk", "kbyyyyyyybk", "kbbyyyyybbk", ".kbyybyybk.", ".kbbbbbbbk.", "..kbbbbbk..", "...kbbbk...", "....kkk...."],
  sparkle: [".....k.....", "....kyk....", "....kyk....", "...kyyyk...", "kkkyywyykkk", "kyyywwwyyyk", "kkkyywyykkk", "...kyyyk...", "....kyk....", "....kyk....", ".....k....."],
  flag: ["kk.........", "kkkkkkkkkk.", "kkwKwKwKwk.", "kkKwKwKwKk.", "kkwKwKwKwk.", "kkKwKwKwKk.", "kkkkkkkkkk.", "kk.........", "kk.........", "kk.........", "kk........."],
  sword: ["..........k", ".........kw", "........kwk", ".......kwk.", "......kwk..", ".....kwk...", "..k.kwk....", "...kwk.....", "..kykk.....", ".kyk.k.....", "kyk........", "kk........."],
  calc: [".kkkkkkkkk.", ".kPPPPPPPk.", ".kPwwwwwPk.", ".kPPPPPPPk.", ".kPsPsPsPk.", ".kPPPPPPPk.", ".kPsPsPrPk.", ".kPPPPPPPk.", ".kPsPsPrPk.", ".kPPPPPPPk.", ".kkkkkkkkk."],
  hand: ["..k.k.k....", ".kykykyk...", ".kykykyk.k.", ".kykykykkyk", ".kyyyyyykyk", ".kyyyyyyyk.", "kkyyyyyyyk.", "kyyyyyyyk..", ".kyyyyyyk..", "..kyyyyk...", "...kkkk...."],
  coin: ["...kkkkk...", "..kyyyyyk..", ".kyywyyyyk.", "kyywyKyyyyk", "kyyyyKyyyyk", "kyyyyKyyyyk", "kyyyyKyyyyk", "kyyyyyyyyyk", ".kyyyyyyyk.", "..kyyyyyk..", "...kkkkk..."],
  tv: ["..K.....K..", "...K...K...", "kkkkkkkkkkk", "knnnnnnnnnk", "kncwccccnrk", "knccccccnsk", "knccccccnrk", "knccccccnsk", "knnnnnnnnnk", "kkkkkkkkkkk", ".kk.....kk."],
  pizza: ["kkkkkkkkkkk", "knnnnnnnnnk", ".kyyrryyyk.", ".kyyrryyyk.", "..kyyyrrk..", "..kyrryyk..", "...kyyyk...", "...kyyyk...", "....kyk....", ".....k....."],
  moon: ["...kkkk....", "..kyyyk....", ".kyyyk.....", "kyyyk...w..", "kyyyk......", "kyyyk......", "kyyyyk..w..", ".kyyyyykkk.", "..kyyyyyyk.", "...kkkkkk.."],
  film: ["kkkkkkkkkkk", "kwKwKwKwKwk", "kkkkkkkkkkk", "kPPPPPPPPPk", "kPwwwwwwwPk", "kPPPPPPPPPk", "kPwwwwPPPPk", "kPPPPPPPPPk", "kkkkkkkkkkk"],
  gift: ["..kk...kk..", ".kyyk.kyyk.", "..kkykykk..", "kkkkkykkkkk", "kbbbbybbbbk", "kkkkkykkkkk", ".kbbbybbbk.", ".kbbbybbbk.", ".kbbbybbbk.", ".kkkkkkkkk."],
  magnet: ["kkkk...kkkk", "kssk...kssk", "kkkk...kkkk", "krrk...krrk", "krrk...krrk", "krrkkkkkrrk", "krrrrrrrrrk", ".krrrrrrrk.", "..kkkkkkk.."],
  flask: ["...kkkkk...", "....kwk....", "....kwk....", "...kwwwk...", "..kwwwwwk..", ".kgggggggk.", "kgwgggggggk", "kggggggwggk", "kgggggggggk", ".kkkkkkkkk."],
  dna: ["bk.....kp", ".bk...kp.", "..bsssp..", "...kbk...", "..pk.kb..", ".pk...kb.", "pk.....kb", ".pk...kb.", "..psssb.."],
  column: ["kkkkkkkkkkk", "kwwwwwwwwwk", "kkkkkkkkkkk", ".kwwkwwkwwk", ".kwwkwwkwwk", ".kwwkwwkwwk", ".kwwkwwkwwk", "kkkkkkkkkkk", "kwwwwwwwwwk", "kkkkkkkkkkk"],
  palette: ["..kkkkkk...", ".knnnnnnkk.", "knrnnnbnnnk", "knnnnnnnnnk", "kngnnkkknnk", "knnnk...knk", "knynnkkknnk", ".knnnnpnnk.", "..kkkkkkk.."],
  rocket: [".....k.....", "....kwk....", "...kwwwk...", "...kwbwk...", "...kwwwk...", "..kkwwwkk..", ".krkwwwkrk.", ".krkkkkkrk.", "..k.kok.k..", "....kyk....", ".....k....."],
  bag: ["...kkkkk...", "..kk...kk..", "kkkkkkkkkkk", "kpppppppppk", "kppKpppKppk", "kpppppppppk", "kpppppppppk", "kpppppppppk", "kkkkkkkkkkk"],
  face1: KI_FACE(["kyyKKKKKyyk", "kyKyyyyyKyk"]), face2: KI_FACE(["kyyyKKKyyyk", "kyyKyyyKyyk"]), face3: KI_FACE(["kyyyyyyyyyk", "kyyKKKKKyyk"]),
  face4: KI_FACE(["kyyKyyyKyyk", "kyyyKKKyyyk"]), face5: KI_FACE(["kyKyyyyyKyk", "kyyKKKKKyyk"]),
};
const KI_EMOJI = { "🤺": "sword", "📚": "books", "📖": "book", "🧮": "calc", "🧩": "calc", "🏆": "trophy", "🎯": "target", "⭐": "star", "🔥": "fire", "⚡": "bolt", "🌟": "sparkle", "🦸": "shield", "🏅": "medal", "✏️": "pencil", "💡": "bulb", "🧭": "compass", "👣": "flag", "📅": "calendar", "🗺️": "globe", "📓": "book", "✨": "sparkle", "👋": "hand", "❔": "question", "✅": "check", "⬜": "box", "▶": "play", "🔒": "lock", "🎉": "sparkle", "🏁": "flag", "🚀": "rocket", "🌈": "face4", "❤️": "heart", "🪙": "coin", "📺": "tv", "🍕": "pizza", "🌙": "moon", "🎬": "film", "🎡": "heart", "🎁": "gift", "🧲": "magnet", "🧪": "flask", "🧬": "dna", "🏛️": "column", "🎨": "palette", "🛒": "bag", "📝": "pencil", "🏊": "heart" };
const kiShade = (hex, f) => { const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(f > 1 ? v + (255 - v) * (f - 1) : v * f)))); return "#" + c.map(v => v.toString(16).padStart(2, "0")).join(""); };
const kiCache = {};
function kiSvg(name, mode) {
  const key = name + ":" + mode; if (kiCache[key]) return kiCache[key];
  const art = KI_ART[name]; if (!art) return null;
  const H = art.length, W = Math.max(...art.map(r => r.length)), at = (x, y) => (art[y] || "")[x] || ".";
  const filled = (x, y) => at(x, y) !== "." && !!KI_PAL[at(x, y)], color = (x, y) => KI_PAL[at(x, y)], isLine = (x, y) => at(x, y) === "k" || at(x, y) === "K";
  let body = "", vb;
  if (mode === "pixel") { // 8-bit sprite: auto light from the top-left, shade bottom-right, hard drop shadow
    let sh = "", px = "";
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!filled(x, y)) continue;
      sh += `<rect x="${x + 1}" y="${y + 1}" width="1.02" height="1.02"/>`;
      let c = color(x, y);
      if (!isLine(x, y)) { const lit = !filled(x, y - 1) || isLine(x, y - 1) || !filled(x - 1, y) || isLine(x - 1, y), dark = !filled(x, y + 1) || isLine(x, y + 1) || !filled(x + 1, y) || isLine(x + 1, y);
        if (lit && !dark) c = kiShade(c, 1.28); else if (dark && !lit) c = kiShade(c, .78); }
      px += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${c}"/>`;
    }
    body = `<g fill="rgba(13,20,51,.45)">${sh}</g>${px}`; vb = `0 0 ${W + 1} ${H + 1}`;
  } else if (mode === "voxel") { // soft 3D blocks: no outlines, deeper extrusion, top glow, ground shadow
    const d = 0.55, solid = (x, y) => filled(x, y) && at(x, y) !== "k";
    let sides = "", tops = "", fronts = "";
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!solid(x, y)) continue; const c = color(x, y), X = x, Y = y + d;
      if (!solid(x + 1, y)) sides += `<path d="M${X + 1} ${Y}l${d} ${-d}v1l${-d} ${d}z" fill="${kiShade(c, .62)}"/>`;
      if (!solid(x, y - 1)) tops += `<path d="M${X} ${Y}l${d} ${-d}h1l${-d} ${d}z" fill="${kiShade(c, 1.42)}"/>`;
      const edge = !solid(x, y - 1) ? 1.1 : !solid(x, y + 1) ? .9 : 1;
      fronts += `<rect x="${X}" y="${Y}" width="1.01" height="1.01" fill="${kiShade(c, edge)}"/>`;
    }
    body = `<ellipse cx="${(W + d) / 2}" cy="${H + d + .15}" rx="${W * .42}" ry=".55" fill="rgba(0,0,0,.13)"/>` + sides + tops + fronts; vb = `0 0 ${W + d} ${H + d + .8}`;
  } else { // pop: die-cut sticker — hard shadow, white sticker border, black outline, solid flat colours, glint
    let shadow = "", white = "", outline = "", tiles = "", glint = "";
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!filled(x, y)) continue;
      shadow += `<rect x="${x - .7}" y="${y - .7}" width="2.4" height="2.4" rx=".9"/>`;
      white += `<rect x="${x - .7}" y="${y - .7}" width="2.4" height="2.4" rx=".9"/>`;
      outline += `<rect x="${x - .18}" y="${y - .18}" width="1.36" height="1.36" rx=".35"/>`;
      if (!isLine(x, y)) tiles += `<rect x="${x}" y="${y}" width="1.03" height="1.03" fill="${color(x, y)}"/>`;
      if (!glint && !isLine(x, y) && (!filled(x, y - 1) || isLine(x, y - 1)) && (!filled(x - 1, y) || isLine(x - 1, y))) glint = `<rect x="${x + .15}" y="${y + .15}" width=".55" height=".55" rx=".15" fill="#fff" opacity=".85"/>`;
    }
    body = `<g transform="translate(1 1.1)" fill="#0a0a0a">${shadow}</g><g fill="#fff">${white}</g><g fill="#0a0a0a">${outline}</g>${tiles}${glint}`; vb = `-1.2 -1.2 ${W + 3.4} ${H + 3.5}`;
  }
  return (kiCache[key] = `<svg viewBox="${vb}" shape-rendering="${mode === "pixel" ? "crispEdges" : "geometricPrecision"}" aria-hidden="true">${body}</svg>`);
}
const kiTheme = () => document.body.classList.contains("kt-pixel") ? "pixel" : document.body.classList.contains("kt-voxel") ? "voxel" : "pop";
// KI("star", 22) or KI("🤺", 40): emoji in Pop, themed sprite otherwise (falls back to the emoji if there's no sprite)
function KI(nameOrEmoji, size = 22, cls = "") {
  const th = kiTheme(), name = KI_ART[nameOrEmoji] ? nameOrEmoji : KI_EMOJI[nameOrEmoji];
  if (!name) return `<span class="ki ki-emoji ${cls}" style="font-size:${Math.round(size * .9)}px">${nameOrEmoji}</span>`;
  return `<span class="ki ki-${th} ${cls}" style="width:${size}px;height:${size}px">${kiSvg(name, th)}</span>`;
}
const kiFace = (n, size = 30) => KI("face" + n, size);
const KI_EYEBROW = {
  voxel: { cal: ["Plan ahead", "提前计划"], worlds: ["Explore", "去探索"], jar: ["Collect wins", "收集胜利"], feel: ["Check in", "心情记录"], note: ["Just for you", "只属于你"], stick: ["Achievements", "成就"] },
  pixel: { cal: ["Quest log", "任务日志"], worlds: ["World map", "世界地图"], jar: ["Loot", "战利品"], feel: ["Status", "状态"], note: ["Save file", "存档"], stick: ["Inventory", "背包"] } };
const kwH = (icon, key, title, tag = "") => { const th = kiTheme(), eb = KI_EYEBROW[th]?.[key]; return `<div class="kw-h">${eb ? `<span class="kw-eyebrow">${lang === "zh" ? eb[1] : eb[0]}</span>` : ""}<span class="kw-ht">${KI(icon, 28)} ${title}</span>${tag}</div>`; };
const KTHEMES = { pop: { en: "Pop", zh: "波普", d: { en: "Bold & bright", zh: "大胆鲜艳" } }, voxel: { en: "Voxel", zh: "方块世界", d: { en: "Soft 3D blocks", zh: "柔和 3D 方块" } }, pixel: { en: "Pixel Quest", zh: "像素冒险", d: { en: "Retro 8-bit game", zh: "复古 8 位游戏" } } };
const KT_IDS = Object.keys(KTHEMES);
const setKidTheme = th => { document.body.classList.remove(...KT_IDS.map(x => "kt-" + x)); if (th) document.body.classList.add("kt-" + (KTHEMES[th] ? th : "pop")); };
const themeSwatch = id => id === "pixel" ? `<span class="tsw tsw-pixel"><i></i><i></i><i></i><b>LV</b></span>` : id === "voxel" ? `<span class="tsw tsw-voxel"><i></i><i></i><i></i><i></i></span>` : `<span class="tsw tsw-pop"><i></i><i></i><i></i></span>`;
// decorations drawn in CSS/SVG, shown only by the matching theme
const VOXEL_DECO = (() => { const cube = (x, y, c) => `<g transform="translate(${x},${y})"><path d="M0 6 10 0 20 6 10 12Z" fill="${c}" style="filter:brightness(1.25)"/><path d="M0 6 10 12 10 24 0 18Z" fill="${c}" style="filter:brightness(.85)"/><path d="M20 6 10 12 10 24 20 18Z" fill="${c}"/></g>`;
  const cols = ["#ff4d4d", "#ff9a3d", "#ffd23d", "#3ec46d", "#3d9bff", "#7a5cff"]; let g = "";
  cols.forEach((c, i) => { for (let j = 0; j < 3; j++) g += cube(10 + i * 10 + j * 10, 70 - i * 6 + j * 6 - i * 6, c); });
  return `<svg class="kt-deco kt-deco-voxel" viewBox="0 0 120 110" aria-hidden="true">${g}</svg>`; })();
const PIXEL_DECO = `<div class="kt-deco kt-deco-pixel" aria-hidden="true"><span class="px-hearts">${[1, 2, 3].map(() => `<span class="ki" style="width:14px;height:14px">${kiSvg("heart", "pixel")}</span>`).join("")}</span><span class="ki" style="width:14px;height:14px">${kiSvg("coin", "pixel")}</span></div>`;
// 📋 Today's plan: habits still to do (ticked when done), today's calendar events, and the study-plan day for his apps
function brainCardHtml(k) {
  const due = brainDue(k.id); if (!due || !due.due) return "";
  const zh = lang === "zh";
  return `<div class="card" style="border:2.5px solid #6d4aff;background:#f3f0ff"><div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><div style="font-size:40px">🎮</div>
    <div style="flex:1;min-width:200px"><b>${zh ? "新的大脑游戏挑战开放了！" : "New Brain Games challenge is open!"}</b><div class="meta">${zh ? "9 个小游戏，约 12 分钟，挑战你自己的最高分。+15 分" : "9 quick games, about 12 minutes. Beat your own high score! +15 points"}</div></div>
    <button class="btn primary" data-app="braincheck/" data-appkid="${k.id}">${zh ? "开始 →" : "Start →"}</button></div></div>`;
}
function kidPlanHtml(k) {
  const zh = lang === "zh", d = today(), dow = new Date(d + "T12:00").getDay(), items = [];
  S.metrics.filter(m => m.kid === k.id && m.type === "rate").forEach(m => { const r = S.readings.find(x => x.metric === m.id && x.date === d); items.push({ done: !!(r && +r.value), t: mKidLabel(m), ic: "check" }); });
  calItems(d, d, k.id).filter(x => x.kind !== "competition" || x.source !== "manual").forEach(x => items.push({ done: false, t: calTitle(x) + (x.time ? " · " + x.time : ""), ic: "calendar", ev: true }));
  const apps = S.subjects.filter(x => x.kid === k.id && x.active !== false && x.app_url);
  if (apps.some(x => x.app_url === "physics/") && [2, 4, 6].includes(dow)) items.push({ done: false, t: zh ? ["", "", "物理：读一节 + 练习", "", "物理：挑战或单元测验", "", "物理：可选小测验"][dow] : ["", "", "Physics: read + Practice", "", "Physics: Challenge or Unit test", "", "Physics: optional quick quiz"][dow], ic: "magnet", app: "physics/" });
  if (!items.length) return "";
  const todo = items.filter(x => !x.ev), done = todo.filter(x => x.done).length, eb = { voxel: ["Today", "今天"], pixel: ["Daily quests", "每日任务"] }[kiTheme()];
  return `<div class="kw-h">${eb ? `<span class="kw-eyebrow">${zh ? eb[1] : eb[0]}</span>` : ""}<span class="kw-ht">${KI("target", 28)} ${zh ? "今天的计划" : "Today's plan"}</span>${todo.length ? `<span class="tagc">${done}/${todo.length}</span>` : ""}</div>
    <div class="kw-card kplan">${todo.length ? `<div class="kneed" style="margin-bottom:10px"><i style="width:${Math.round(100 * done / todo.length)}%"></i></div>` : ""}
      ${items.map(x => `<div class="kpl ${x.done ? "done" : ""}">${KI(x.done ? "check" : x.ev ? "calendar" : x.ic === "magnet" ? "magnet" : "box", 22)}<span>${esc(x.t)}</span>${x.app ? `<button class="btn sm primary" data-app="${x.app}" data-appkid="${esc(k.id)}">${zh ? "开始" : "Start"}</button>` : ""}</div>`).join("")}
      ${todo.length && done === todo.length ? `<div class="kw-sub" style="opacity:1;margin-top:8px">🎉 ${zh ? "今天的习惯全部完成！" : "All of today's habits done!"}</div>` : todo.some(x => !x.done) ? `<div class="kw-sub" style="opacity:.8;margin-top:8px">${zh ? "做完后点上面的“打卡”记录。" : "Done one? Tap the check-in button above to log it."}</div>` : ""}</div>`;
}
function kidJumpBar() {
  const zh = lang === "zh", little = S.kids[0] && +S.kids[0].age > 0 && +S.kids[0].age < 7;
  const items = [["ks-home", "hand", zh ? "首页" : "Home"], ["ks-worlds", "globe", zh ? "世界" : "Worlds"], ["ks-shop", "coin", zh ? "商店" : "Shop"], ["ks-cal", "calendar", zh ? "日历" : "Calendar"], ["ks-stick", "medal", zh ? "贴纸" : "Stickers"]];
  return `<nav class="kw-jump" aria-label="${zh ? "跳转" : "Jump to"}">${items.map(([id, ic, l]) => `<a href="#${id}" data-jump="${id}">${KI(ic, 22)}<span>${l}</span></a>`).join("")}</nav>`;
}
function kidRender() {
  const t = T(), k = S.kids[0]; if (!k) return;
  document.body.classList.add("kidmode"); setKidTheme(k.theme || "pop");
  const d = today(), myMood = S.moods.find(m => m.date === d)?.kid_mood || null;
  const little = (+k.age || 99) < 7;
  const g = kidGame(), kc = "var(--k" + ({ eric: 0, ellis: 1, jonah: 2 }[k.id] ?? 0) + ")";
  const newly = lastBadges ? Object.keys(g.got).filter(b => g.got[b] && !lastBadges[b]) : [];
  lastBadges = g.got;
  const w1 = addDays(d, -6);
  const cnt = m => S.readings.filter(r => r.metric === m.id && r.date >= w1).reduce((s, r) => s + (+r.value || 0), 0);
  const curLevel = m => { const rs = S.readings.filter(r => r.metric === m.id).sort((a, b) => a.date.localeCompare(b.date)); return rs.length ? +rs[rs.length - 1].value : +m.baseline; };
  const worldColors = ["var(--lime)", "var(--sky)", "#ffe066", "#b9a6ff", "var(--pink)", "var(--orange)"];
  const goalHtml = m => {
    if (m.type === "rate") { const c = cnt(m), n = Math.max(1, Math.min(10, m.per_week || 1)); return `<div class="kw-goal"><div class="gn">${esc(mKidLabel(m))}</div><div class="kw-stars">${Array.from({ length: n }, (_, i) => `<span class="${i < c ? "" : "off"}">${KI("star", 22)}</span>`).join("")}</div><div class="kw-sub">${t.ofTarget(c, m.per_week)}${c >= m.per_week ? " " + KI("sparkle", 16) : ""}</div></div>`; }
    const cur = curLevel(m), span = (+m.target) - (+m.baseline), p = span ? clamp01((cur - (+m.baseline)) / span) : 1;
    return `<div class="kw-goal"><div class="gn">${esc(mName(m))}</div><div class="kw-rocket"><i style="width:${Math.round(p * 100)}%"></i><span style="left:${Math.max(6, Math.min(88, p * 100))}%">${KI("🚀", 24)}</span><em>${KI("flag", 18)}</em></div><div class="kw-sub">${t.nowAt} ${cur}${esc(m.unit || "")} → ${+m.target}${esc(m.unit || "")}</div></div>`;
  };
  const worlds = S.subjects.filter(x => x.active).map(x => ({ x, ms: S.metrics.filter(m => m.subject_id === x.id && !m.parent_only), docs: S.docs.filter(dc => dc.subject_id === x.id) })).filter(w => w.ms.length || w.docs.length || w.x.app_url);
  const loose = S.metrics.filter(m => !m.parent_only && !S.subjects.some(x => x.active && x.id === m.subject_id)); // parent_only = grades etc., parents see them, the kid page does not
  const looseDocs = S.docs.filter(dc => !S.subjects.some(x => x.active && x.id === dc.subject_id));
  const goals = S.goals.filter(x => x.status !== "proposed"), mine = S.goals.filter(x => x.status === "proposed");
  const wins = S.entries.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 18);
  const journal = S.journal.slice().sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)).slice(0, 10);
  const days = []; for (let i = 13; i >= 0; i--) { const dd = addDays(d, -i); days.push({ dd, m: S.moods.find(x => x.date === dd)?.kid_mood }); }
  const pct = g.nextAt > g.curAt ? Math.round(100 * (g.xp - g.curAt) / (g.nextAt - g.curAt)) : 100;
  $("#root").innerHTML = `${previewBar()}<div class="topbar"><div class="in"><div class="brand"><span class="dotlogo">✦</span>${esc(kidName(k.id))}</div>
      <button class="lang" id="themeBtn" aria-expanded="false">${KI("palette", 18)} ${lang === "zh" ? "主题" : "Theme"}</button><button class="lang" id="langBtn">${lang === "en" ? "中文" : "English"}</button><button class="btn sm ghost" id="soBtn">${preview ? t.exitPreview : t.signOut}</button></div></div>
    <div class="wrap"><div class="status" id="status"></div>
      <div class="kw-themes" id="themePick" hidden><b>🎨 ${lang === "zh" ? "选一个你喜欢的样子" : "Pick your look"}</b><div class="kw-themerow">${KT_IDS.map(id => `<button class="kw-theme ${(k.theme || "pop") === id ? "on" : ""}" data-ktheme="${id}">${themeSwatch(id)}<span><b>${KTHEMES[id][lang] || KTHEMES[id].en}</b><small>${KTHEMES[id].d[lang] || KTHEMES[id].d.en}</small></span></button>`).join("")}</div></div>
      <div class="kw-hero" style="--kc:${kc}">${VOXEL_DECO}${PIXEL_DECO}
        <div class="kw-avatar" id="avBtn" title="${t.pickAvatar}">${avatarHtml(k.avatar || "🦊", 92)}</div>
        <div><h1>${t.hi(esc(kidName(k.id)))}</h1>
          <div class="kw-level"><span class="kw-lvl">${t.levelWord} ${g.lvlNum}</span><span>${esc(g.levelName)}</span><span style="margin-left:auto">${g.xp} ${t.xp}</span></div>
          <div class="kw-xpbar"><i style="width:${pct}%"></i></div><div class="kw-sub">${t.toNext(Math.max(0, g.nextAt - g.xp))}</div></div>
        <div class="kw-stats">${[["coin", g.xp, lang === "zh" ? "积分" : "Points"], ["star", g.lvlNum, lang === "zh" ? "等级" : "Level"], ["fire", g.streak, lang === "zh" ? "连续天数" : "Day streak"], ["medal", `${Object.values(g.got).filter(Boolean).length}/${BADGES.length}`, lang === "zh" ? "贴纸" : "Stickers"]].map(([ic, v, l]) => `<div>${KI(ic, 22)}<b>${v}</b><small>${l}</small></div>`).join("")}</div>
      </div>
      <div class="kw-row">
        <button class="kw-tap ${myMood ? "done" : "todo"}" id="kTap"><span class="big">${myMood ? kiFace(myMood, 44) : KI("hand", 44)}</span>${myMood ? t.checkedIn : t.tapToStart}</button>
        <div class="kw-streak ${g.streak ? "" : "rest"}"><span class="fire">${KI("fire", 44)}</span><div>${g.streak ? t.streak(g.streak) : t.streakRest}<div class="kw-sub" style="opacity:.7">${g.best ? KI("trophy", 16) + " " + g.best : ""}</div></div></div>
      </div>
      <div class="kw-layout"><div class="kw-main"><section id="ks-home" class="kw-sec">
      ${little ? "" : brainCardHtml(k)}${little ? "" : kidPlanHtml(k)}
      <section id="ks-money" class="kw-sec">${kidChallengeHtml(k)}</section>
      ${DW_KIDS.includes(k.id) ? `<section id="ks-dw" class="kw-sec">${doneWellKidHtml(k)}</section>` : ""}
      ${S.subjects.filter(x => x.active && x.app_url === "space/").map(x => `<button class="kw-spacegame" data-app="space/" data-appkid="${esc(x.kid)}" style="display:flex;align-items:center;gap:16px;width:100%;margin:14px 0;padding:18px 20px;border:none;border-radius:26px;cursor:pointer;text-align:left;color:#fff;font:inherit;background:radial-gradient(circle at 85% 30%,#9b5de5 0,transparent 45%),linear-gradient(135deg,#1b1f4b,#3a2f7a);box-shadow:0 8px 0 #0003,0 10px 30px #3a2f7a66"><span style="font-size:64px;line-height:1;animation:kwfloat 2.4s ease-in-out infinite">🚀</span><span style="flex:1"><b style="display:block;font-size:28px;line-height:1.1">${lang === "zh" ? "太空探险" : "Space Quest"}</b><span style="opacity:.9;font-size:17px">${lang === "zh" ? "一至三年级数学和单词：打陨石、救外星人、打败大怪兽！" : "Grade 1–3 math + words: blast asteroids, rescue aliens, beat bosses!"}</span></span><span style="background:linear-gradient(#ffd166,#f4a300);color:#3b2400;font-weight:800;font-size:22px;padding:10px 20px;border-radius:16px;box-shadow:0 4px 0 #0004">▶ ${lang === "zh" ? "开始" : "Play"}</span></button>`).join("")}
      ${S.subjects.filter(x => x.active && x.app_url === "robot/").map(x => `<button class="kw-spacegame" data-app="robot/" data-appkid="${esc(x.kid)}" style="display:flex;align-items:center;gap:16px;width:100%;margin:14px 0;padding:18px 20px;border:none;border-radius:26px;cursor:pointer;text-align:left;color:#fff;font:inherit;background:radial-gradient(circle at 85% 30%,#e2683c 0,transparent 45%),linear-gradient(135deg,#120c24,#3b1d5e);box-shadow:0 8px 0 #0003,0 10px 30px #3b1d5e66"><span style="font-size:64px;line-height:1;animation:kwfloat 2.6s ease-in-out infinite">🤖</span><span style="flex:1"><b style="display:block;font-size:28px;line-height:1.1">${lang === "zh" ? "机器人实验室" : "Robot Lab"}</b><span style="opacity:.9;font-size:17px">${lang === "zh" ? "用真正的 Python 编程，救援火星基地！" : "Code a Mars rover in real Python. Rescue the base!"}</span></span><span style="background:linear-gradient(#b8f34a,#7fc61c);color:#122000;font-weight:800;font-size:22px;padding:10px 20px;border-radius:16px;box-shadow:0 4px 0 #0004">▶ ${lang === "zh" ? "开始" : "Code"}</span></button>`).join("")}
      ${S.subjects.filter(x => x.active && x.app_url === "brain/").map(x => `<button class="kw-spacegame" data-app="brain/" data-appkid="${esc(x.kid)}" style="display:flex;align-items:center;gap:16px;width:100%;margin:14px 0;padding:18px 20px;border:none;border-radius:26px;cursor:pointer;text-align:left;color:#2b2d42;font:inherit;background:radial-gradient(circle at 85% 30%,#ffd6e8 0,transparent 45%),linear-gradient(135deg,#caffbf,#a0c4ff);box-shadow:0 8px 0 #0002,0 10px 30px #a0c4ff66"><span style="font-size:64px;line-height:1;animation:kwfloat 2.8s ease-in-out infinite">🧠</span><span style="flex:1"><b style="display:block;font-size:28px;line-height:1.1">${lang === "zh" ? "大脑乐园" : "Brain Park"}</b><span style="opacity:.85;font-size:17px">${lang === "zh" ? "记忆、拼图、机器人编程、画画和音乐！" : "Memory games, puzzles, robot coding, drawing and music!"}</span></span><span style="background:#fff;color:#2b2d42;font-weight:800;font-size:22px;padding:10px 20px;border-radius:16px;box-shadow:0 4px 0 #0002">▶ ${lang === "zh" ? "开始" : "Play"}</span></button>`).join("")}
      ${S.subjects.filter(x => x.active && x.app_url === "chinese/").map(x => `<button class="kw-spacegame" data-app="chinese/" data-appkid="${esc(x.kid)}" style="display:flex;align-items:center;gap:16px;width:100%;margin:14px 0;padding:18px 20px;border:none;border-radius:26px;cursor:pointer;text-align:left;color:#2b2d42;font:inherit;background:radial-gradient(circle at 85% 30%,#fff 0,transparent 45%),linear-gradient(135deg,#ffd6a5,#ffadad);box-shadow:0 8px 0 #0002,0 10px 30px #ffadad66"><span style="font-size:64px;line-height:1;animation:kwfloat 3.1s ease-in-out infinite">🐼</span><span style="flex:1"><b style="display:block;font-size:28px;line-height:1.1">${lang === "zh" ? "熊猫中文" : "Panda Chinese 熊猫中文"}</b><span style="opacity:.85;font-size:17px">${lang === "zh" ? "听、认、写汉字，拼音和古诗！" : "Listen, read & write characters, tones and poems!"}</span></span><span style="background:#fff;color:#2b2d42;font-weight:800;font-size:22px;padding:10px 20px;border-radius:16px;box-shadow:0 4px 0 #0002">▶ ${lang === "zh" ? "开始" : "Play"}</span></button>`).join("")}
      </section><section id="ks-worlds" class="kw-sec">
      ${worlds.length || loose.length || goals.length || mine.length ? `${kwH("globe", "worlds", t.myWorlds)}
      <div class="kw-worlds">${worlds.map((w, i) => `<div class="kw-world" style="background:${worldColors[i % worldColors.length]}"><div class="wi">${KI(w.x.icon, 48)}</div><span class="kw-arrow">→</span><h3>${esc(sName(w.x))}</h3>${sDesc(w.x) ? `<div class="wd">${esc(sDesc(w.x))}</div>` : ""}${w.x.app_url ? `<button class="kw-play" data-app="${esc(w.x.app_url)}" data-appkid="${esc(w.x.kid)}">${KI("play", 16)} ${esc(appLabel(w.x.app_url))}</button>` : ""}${w.ms.map(goalHtml).join("")}${w.docs.map(dc => `<a href="#" class="kw-doc" data-kdoc="${esc(dc.slug)}">${KI("book", 16)} ${esc(lang === "zh" && dc.title_zh ? dc.title_zh : dc.title)}</a>`).join(" ")}</div>`).join("")}
        ${loose.length || goals.length || mine.length || looseDocs.length ? `<div class="kw-world" style="background:#e9e9e4"><div class="wi">${KI("target", 48)}</div><h3>${t.myGoals}</h3>${loose.map(goalHtml).join("")}
          ${goals.map(x => `<div class="kw-goal"><span class="gn">${KI(x.done ? "check" : "box", 18)} ${esc(x.text)}</span></div>`).join("")}
          ${mine.map(x => `<div class="kw-goal"><span class="gn">${KI("bulb", 18)} ${esc(x.text)}</span><div class="kw-sub">${t.pending} <button class="x" style="opacity:1" data-unprop="${x.id}">✕</button></div></div>`).join("")}
          ${looseDocs.map(dc => `<a href="#" class="kw-doc" data-kdoc="${esc(dc.slug)}">${KI("book", 16)} ${esc(lang === "zh" && dc.title_zh ? dc.title_zh : dc.title)}</a>`).join(" ")}
          <div class="addgoal" style="margin-top:12px"><input id="propIn" maxlength="120" placeholder="💡 ${t.suggestPh}" style="background:#fff;color:#111;border:2px solid #000"><button class="btn sm primary" id="propBtn" style="background:#000;color:#fff;border-color:#000">${t.suggest}</button></div></div>` : ""}
      </div>` : ""}
      <div id="kDocView" style="margin-top:14px"></div>
      </section><section id="ks-jar" class="kw-sec">
      ${kwH("star", "jar", t.starJar)}
      <div class="kw-card">
        ${little ? `<div class="kw-sub" style="margin:0 0 10px;opacity:1">${t.tapAWin}</div><div class="kw-littlewins">${t.littleWins.map((w, i) => `<button data-lwin="${i}">${KI("star", 20)} ${esc(w)}</button>`).join("")}</div>`
                 : `<form id="winForm" class="addgoal" style="margin:0"><input id="winIn" maxlength="140" placeholder="⭐ ${t.winPh}" required title="${lang === "zh" ? "用一句话说说你的进步" : "At least 5 words"}"><button class="btn sm primary">${t.addWin}</button></form>`}
        <div class="kw-jar" style="margin-top:14px">${wins.length ? wins.map(w => `<div class="kw-win">${KI("star", 18)} ${esc(w.title)}${w.by_kid ? `<button class="x" style="opacity:.5" data-delwin="${w.id}">✕</button>` : ""}</div>`).join("") : `<div class="meta">${t.noWinsYet}</div>`}</div>
      </div>
      </section><section id="ks-note" class="kw-sec">
      ${little ? "" : `${kwH("book", "note", t.secretNotebook, `<span class="tagc">${KI("lock", 14)}</span>`)}
      <div class="kw-notebook"><div style="font:600 12px var(--kfont);color:#888;line-height:20px">${t.journalPrivate}</div>
        ${buddyLastQ(k.id) ? `<div class="jbq">💭 ${lang === "zh" ? "Buddy 问你" : "Buddy asked you"}: ${esc(buddyLastQ(k.id))} <span style="font-weight:500;opacity:.7">${lang === "zh" ? "（可以在今天的日记里回答）" : "(you can answer it in today's entry)"}</span></div>` : ""}
        <form id="jForm"><textarea id="jIn" maxlength="30000" placeholder="${t.journalPh}" required>${jRule(k) && jEditing(k) ? esc(jSplit(jEditing(k).body).main) : ""}</textarea>
          ${jRule(k) && JREFLECT[k.id] ? `<div class="jrefl" style="margin-top:10px"><div style="font-weight:700;margin-bottom:4px">🪞 ${lang === "zh" ? `回答 3 个问题（每个至少 ${JREFLECT_MIN} 个词，算在总字数里）` : `Answer 3 questions (at least ${JREFLECT_MIN} words each; they count toward your total)`}</div>${JREFLECT[k.id].map((q, i) => `<label style="display:block;margin:6px 0"><span style="font-size:14px">${i + 1}. ${esc(lang === "zh" ? q[1] : q[0])}</span><textarea id="jR${i}" rows="2" maxlength="2000" style="width:100%;margin-top:3px">${jEditing(k) ? esc(jSplit(jEditing(k).body).ans[i] || "") : ""}</textarea></label>`).join("")}</div>` : ""}
          <div class="kw-wc" id="jWc">${jMin() ? (lang === "zh" ? `0 / ${jMin()} 字 · 写满 ${jMin()} 字才能得 +12 分` : `0 / ${jMin()} words · write ${jMin()} to earn +12 points`) : (lang === "zh" ? "写完保存就能得 +12 分" : "Save an entry to earn +12 points")}</div><div class="kw-wcbar"><i id="jWcBar"></i></div>
          ${jRule(k) ? `<div id="jChk" class="jchk"></div>` : ""}
          ${jRule(k) && jBad(k) && jBad(k).date !== today() ? `<div class="kw-sub" style="opacity:1;font-weight:700">${lang === "zh" ? `正在改 ${fmtDate(jBad(k).date)} 的日记。改好后再写今天的。` : `You're fixing your journal from ${fmtDate(jBad(k).date)}. After that, write today's.`}</div>` : ""}
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="btn sm primary">${jRule(k) && jEditing(k) ? (lang === "zh" ? "更新这篇日记" : "Update this entry") : t.saveEntry}</button><button type="button" class="btn sm" id="jHear">${lang === "zh" ? "▶ 读给我听" : "▶ Hear it"}</button></div></form>
        <div id="jRead" class="jread" hidden></div><div id="jBuddyNew"></div>
        ${journal.map(j => `<div class="entry"><small>${fmtDate(j.date)} · ${wordCount(j.body)} ${lang === "zh" ? "字" : "words"}${journalCounts(j) ? " ⭐+12" : ""} <button class="x" style="opacity:.5;color:#888" data-delj="${j.id}">✕</button></small>${esc(j.body)}<div class="jhear-row"><button type="button" class="btn sm" data-hear="${j.id}">${lang === "zh" ? "▶ 读给我听" : "▶ Hear it"}</button></div><div class="jread" data-readfor="${j.id}" hidden></div>${buddyNote(j)}</div>`).join("")}</div>`}
      </section></div><aside class="kw-side">
      <section id="ks-cal" class="kw-sec">
      ${kidCalendarHtml(k.id)}
      </section>
      <section id="ks-shop" class="kw-sec">
      ${kidShopHtml(k)}
      </section>
      <section id="ks-feel" class="kw-sec">
      ${kwH("face4", "feel", t.feelings)}
      <div class="kw-card"><div class="kw-mood">${days.map(x => `<div><div class="f ${x.m ? "" : "none"}">${x.m ? kiFace(x.m, 30) : "○"}</div><small>${fmtDate(x.dd)}</small></div>`).join("")}</div></div>
      </section>
      <section id="ks-stick" class="kw-sec">
      ${kwH("medal", "stick", t.stickerBook, `<span class="tagc">${Object.values(g.got).filter(Boolean).length}/${BADGES.length}</span>`)}
      <div class="kw-stickers">${BADGES.map(([id, em]) => `<div class="kw-sticker ${g.got[id] ? "" : "lock"} ${newly.includes(id) ? "got" : ""}"><span class="se">${g.got[id] ? KI(em, 44) : KI("question", 40)}</span><b>${esc(t.badges[id][0])}</b><small>${g.got[id] ? esc(t.badges[id][1]) : t.locked}</small></div>`).join("")}</div>
      </section>
      </aside></div>
      ${kidJumpBar()}
      ${marquee()}
    </div>
    <div class="modal-bg" id="avModal"><div class="modal" style="max-width:640px" id="avBody"></div></div>`;
  if (newly.length) { confetti(); setStatus(t.newBadge + " " + newly.map(b => BADGES.find(x => x[0] === b)[1]).join(" ")); }
  if (jRule(k)) { if (!jRule(k).open && !jToday(k.id)) jApplyLock({ ok: false, why: "none", rule: jRule(k) }); jState(k).then(st => { if (document.getElementById("jIn")) jApplyLock(st); }).catch(() => {}); jApplyPause(k); }
  $("#langBtn").onclick = toggleLang; $("#soBtn").onclick = () => { if (preview) return exitPreview(); document.body.classList.remove("kidmode"); setKidTheme(null); sb.auth.signOut(); };
  $("#themeBtn").onclick = () => { const p = $("#themePick"); p.hidden = !p.hidden; $("#themeBtn").setAttribute("aria-expanded", String(!p.hidden)); };
  document.querySelectorAll("[data-ktheme]").forEach(b => b.onclick = async () => {
    const th = b.dataset.ktheme; if (th === (k.theme || "pop")) return;
    if (!preview) { const { error } = await sb.rpc("kid_set_theme", { p_theme: th }); if (error) return setStatus(error.message, true); }
    k.theme = th; kidRender(); $("#themePick").hidden = false; if (!preview) confetti();
  });
  const R = async fn => { if (preview) { $("#avModal")?.classList.remove("open"); return setStatus(t.previewNoSave); } try { await fn(); await loadAll(); kidRender(); } catch (err) { setStatus(err.message || "Save failed", true); } };
  $("#kTap").onclick = () => kidTapIn();
  const curPx = Pix.parse(k.avatar);
  let avTab = curPx ? (curPx.a > 0 ? "pets" : "build") : (little || !k.avatar ? (little ? "pets" : "build") : "animals");
  let avSpec = curPx && !curPx.a ? curPx : Pix.random(), petSpec = curPx && curPx.a ? curPx : { ...Pix.defaultSpec(), a: 1 };
  const saveAv = v => R(async () => { const { error } = await sb.rpc("kid_set_avatar", { p_avatar: v }); if (error) throw error; confetti(); });
  const drawAv = () => {
    const opt = (key, n, labelFn, swatch) => `<div class="kw-optrow"><div class="kw-optl">${labelFn.title}</div><div class="kw-opts">${Array.from({ length: n }, (_, i) => `<button class="${avSpec[key] === i ? "on" : ""}" data-k="${key}" data-v="${i}" ${swatch ? `style="background:${swatch[i]}" aria-label="${i + 1}"` : ""}>${swatch ? "" : esc(labelFn.names[i])}</button>`).join("")}</div></div>`;
    const tabs = [["pets", "🐾 " + t.tabPets], ["build", "🎨 " + t.tabBuild], ["animals", "😀 " + t.tabEmoji]];
    if (!little) tabs.push(tabs.shift());
    const foot = save => `<div class="modal-f"><button class="btn" data-avclose>${t.cancel}</button>${save || ""}</div>`;
    let body;
    if (avTab === "build") body = `<div class="kw-builder"><div class="kw-preview">${Pix.svg(avSpec, 168)}<button class="btn sm" data-rand>${t.randomize}</button></div><div>
        ${opt("s", Pix.PX.skin.length, { title: t.skinL }, Pix.PX.skin)}
        ${opt("h", Pix.PX.hair.length, { title: t.hairL, names: t.hairNames })}
        ${opt("c", Pix.PX.hairC.length, { title: t.hairColorL }, Pix.PX.hairC)}
        ${opt("k", Pix.PX.outfit.length, { title: t.outfitL, names: t.outfitNames })}
        ${opt("o", Pix.PX.outC.length, { title: t.colorL }, Pix.PX.outC)}
        ${opt("x", Pix.PX.extra.length, { title: t.extraL, names: t.extraNames })}</div></div>${foot(`<button class="btn primary" data-savepx>${t.saveBuddy}</button>`)}`;
    else if (avTab === "pets") body = `<div class="kw-builder"><div class="kw-preview">${Pix.svg(petSpec, 168)}<button class="btn sm" data-prand>${t.randomize}</button></div><div>
        <div class="kw-optrow"><div class="kw-optl">${t.petL}</div><div class="kw-pets ${little ? "big" : ""}">${Pix.PX.animals.map((_, i) => `<button class="${petSpec.a === i + 1 ? "on" : ""}" data-pet="${i + 1}">${Pix.svg({ a: i + 1, x: 0 }, little ? 72 : 56)}</button>`).join("")}</div></div>
        <div class="kw-optrow"><div class="kw-optl">${t.petExtraL}</div><div class="kw-opts">${t.petExtraNames.map((n, i) => `<button class="${petSpec.x === i ? "on" : ""}" data-px="${i}">${esc(n)}</button>`).join("")}</div></div></div></div>${foot(`<button class="btn primary" data-savepet>${t.savePet}</button>`)}`;
    else body = `<div class="kw-avpick">${AVATARS.map(a => `<button data-av="${a}" class="${a === k.avatar ? "on" : ""}">${a}</button>`).join("")}</div>${foot()}`;
    $("#avBody").innerHTML = `<div class="tabs" style="margin-bottom:16px;width:max-content;max-width:100%">${tabs.map(([id, l]) => `<button class="${avTab === id ? "on" : ""}" data-tab="${id}">${l}</button>`).join("")}</div>${body}`;
  };
  $("#avBtn").onclick = () => { drawAv(); $("#avModal").classList.add("open"); };
  $("#avModal").onclick = e => {
    if (e.target.id === "avModal" || e.target.closest("[data-avclose]")) return $("#avModal").classList.remove("open");
    const tb = e.target.closest("[data-tab]"); if (tb) { avTab = tb.dataset.tab; return drawAv(); }
    const o = e.target.closest("[data-k]"); if (o) { avSpec[o.dataset.k] = +o.dataset.v; return drawAv(); }
    const pt = e.target.closest("[data-pet]"); if (pt) { petSpec.a = +pt.dataset.pet; return drawAv(); }
    const px = e.target.closest("[data-px]"); if (px) { petSpec.x = +px.dataset.px; return drawAv(); }
    if (e.target.closest("[data-rand]")) { avSpec = Pix.random(); return drawAv(); }
    if (e.target.closest("[data-prand]")) { petSpec = Pix.randomPet(); return drawAv(); }
    if (e.target.closest("[data-savepx]")) return saveAv(Pix.encode(avSpec));
    if (e.target.closest("[data-savepet]")) return saveAv(Pix.encode(petSpec));
    const b = e.target.closest("[data-av]"); if (b) saveAv(b.dataset.av);
  };
  if ($("#propBtn")) $("#propBtn").onclick = () => { const v = $("#propIn").value.trim(); if (v) R(async () => { const { error } = await sb.from("goals").insert({ kid: k.id, text: v, status: "proposed", proposed_by_kid: true }); if (error) throw error; }); };
  if ($("#winForm")) $("#winForm").onsubmit = e => { e.preventDefault(); const v = $("#winIn").value.trim(); if (v && !winOk(v)) { const zh = lang === "zh"; $("#winIn").setCustomValidity(zh ? "用一句话说说你的进步（至少 8 个字）。" : "Tell it in a sentence: at least 5 words about what you did."); $("#winIn").reportValidity(); $("#winIn").oninput = () => $("#winIn").setCustomValidity(""); return; } if (v) R(async () => { const { error } = await sb.from("entries").insert({ kid: k.id, date: today(), cat: "other", tone: "positive", title: v, by_kid: true }); if (error) throw error; }); };
  const jr = jRule(k), zhJ = lang === "zh";
  let jLast = null, jTimer = null;
  const jShow = (n, r) => { const min = (jr ? jr.min : jMin()) || 1, ok = n >= min;
    $("#jWc").textContent = jr ? (ok ? (zhJ ? `${n} 字 · 字数够了 ✓` : `${n} words · long enough ✓`) : (zhJ ? `${n} / ${min} 字 · 还差 ${min - n} 字` : `${n} / ${min} words · ${min - n} more to go`))
      : (ok ? (zhJ ? `${n} 字 · 太棒了！保存就能得 +12 分 ⭐` : `${n} words · awesome! Save it to earn +12 points ⭐`) : (zhJ ? `${n} / ${min} 字 · 再写 ${min - n} 字就能得 +12 分` : `${n} / ${min} words · ${min - n} more to earn +12 points`));
    $("#jWc").classList.toggle("ok", ok); $("#jWcBar").style.width = Math.min(100, Math.round(100 * n / min)) + "%";
    if (jr && r && $("#jChk")) { const J = window.JCHECK; $("#jChk").innerHTML = jChkHtml(r, J.verdict(r, jr.min, jr.per), zhJ, jFull(k.id), +k.age || 10);
      $("#jChk").querySelectorAll("details[data-jopen]").forEach(d => d.addEventListener("toggle", () => { jOpen[d.dataset.jopen] = d.open; })); } };
  const jRun = async () => { if (!jr || !$("#jIn")) return; try { const J = await jLoad(), v = jFull(k.id); const r = await J.check(v); if ($("#jIn") && jFull(k.id) === v) { jLast = r; jShow(r.words, r); } } catch (e) {} };
  if ($("#jIn")) {
    const jOnIn = () => { const v = jFull(k.id); jShow(window.JCHECK ? window.JCHECK.countWords(v) : wordCount(v), null); if (jr) { clearTimeout(jTimer); jTimer = setTimeout(jRun, 700); } };
    $("#jIn").oninput = jOnIn; document.querySelectorAll("[id^=jR]").forEach(x => { if (/^jR\d$/.test(x.id)) x.oninput = jOnIn; });
    if (jr) {
      const noPaste = e => { e.preventDefault(); setStatus(zhJ ? "日记要自己打字哦，不能粘贴。" : "Type your journal yourself. Pasting is turned off.", true); };
      $("#jIn").addEventListener("paste", noPaste); $("#jIn").addEventListener("drop", noPaste);
      if ($("#jIn").value) { jShow(wordCount(jFull(k.id)), null); jRun(); }
    }
  }
  if ($("#jChk")) $("#jChk").onclick = e => { const b = e.target.closest("[data-ji]"); if (!b || !jLast) return; const x = jLast.issues[+b.dataset.ji], ta = $("#jIn"); if (!x || !ta) return;
    ta.focus(); ta.setSelectionRange(x.start, x.end); const lh = parseFloat(getComputedStyle(ta).lineHeight) || 20; const before = ta.value.slice(0, x.start).split("\n").length; ta.scrollTop = Math.max(0, before * lh - ta.clientHeight / 2); };
  // 📬 after a save: show "Buddy is reading…", then his note (it also appears under the entry after the refresh)
  const jBuddyAfterSave = async id => { if (!id) return; const box = () => document.getElementById("jBuddyNew");
    if (box()) box().innerHTML = `<div class="jbuddy"><b>📬 ${zhJ ? "Buddy 正在读你的日记…" : "Buddy is reading your entry…"}</b></div>`;
    const rep = await buddyAsk(id);
    if (!rep) { if (box()) box().innerHTML = ""; return; }
    try { const jr2 = await sb.from("my_journal_replies").select("*"); if (!jr2.error) S.jreplies = jr2.data || S.jreplies; } catch (e) {}
    kidRender(); const n = document.querySelector(".kw-notebook .entry .jbuddy"); if (n) n.scrollIntoView({ behavior: "smooth", block: "center" }); };
  if ($("#jHear")) $("#jHear").onclick = () => hearIt(jFull(k.id), $("#jRead"), $("#jHear"));
  document.querySelectorAll("[data-hear]").forEach(b => b.onclick = () => { const j = (S.journal || []).find(x => x.id === b.dataset.hear); if (j) hearIt(j.body, document.querySelector(`[data-readfor="${b.dataset.hear}"]`), b); });
  if ($("#jForm")) $("#jForm").onsubmit = async e => { e.preventDefault(); const v = jFull(k.id).trim(); if (!v) return;
    if (jr) { const g = jReflectGap(k.id); if (g >= 0) { const el2 = document.getElementById("jR" + g); if (el2) el2.focus(); return setStatus(zhJ ? `第 ${g + 1} 个问题至少写 ${JREFLECT_MIN} 个词。` : `Question ${g + 1} needs at least ${JREFLECT_MIN} words.`, true); } }
    if (!jr) { const n = wordCount(v); let savedId = null;
      return R(async () => { const { data, error } = await sb.from("journal").insert({ kid: k.id, date: today(), body: v }).select("id").single(); if (error) throw error; savedId = data && data.id; })
        .then(() => { const JOURNAL_MIN_WORDS = jMin(); if (!preview && n < JOURNAL_MIN_WORDS) setStatus(zhJ ? `已保存（${n} 字）。写满 ${JOURNAL_MIN_WORDS} 字的日记才能得分哦。` : `Saved (${n} words). Entries with ${JOURNAL_MIN_WORDS}+ words earn points.`); if (!preview) jBuddyAfterSave(savedId); }); }
    let r; try { const J = await jLoad(); r = await J.check(v); } catch (err) { r = { words: wordCount(v), mistakes: null, issues: [] }; }
    if (r.words < jr.min || wordCount(v) < jr.min) return setStatus(zhJ ? `还差 ${jr.min - Math.min(r.words, wordCount(v))} 字才能保存（至少 ${jr.min} 字）。` : `${jr.min - Math.min(r.words, wordCount(v))} more words before you can save (at least ${jr.min}).`, true);
    const ex = jEditing(k), row = { body: v, words: r.words, mistakes: r.mistakes };
    let savedId = ex ? ex.id : null;
    await R(async () => { if (ex) { const { error } = await sb.from("journal").update(row).eq("id", ex.id); if (error) throw error; }
      else { const { data, error } = await sb.from("journal").insert({ kid: k.id, date: today(), ...row }).select("id").single(); if (error) throw error; savedId = data && data.id; } });
    if (!preview) jBuddyAfterSave(savedId);
    if (preview || r.mistakes == null) return;
    const vd = window.JCHECK.verdict(r, jr.min, jr.per);
    if (vd.pass) { setStatus(zhJ ? "✅ 日记完成！所有功能都打开了，积分照常。" : "✅ Journal done! Everything is open and points are on."); try { confetti(); } catch (e2) {} }
    else setStatus(zhJ ? `已保存，但有 ${r.mistakes} 个错误（最多 ${vd.allowed} 个）。改好之前，所有积分都暂停。` : `Saved, but it has ${r.mistakes} mistakes (${vd.allowed} allowed). All your points are paused until you fix them.`, true);
  };
  $("#root").onclick = e => {
    const x = e.target.closest("[data-unprop],[data-delwin],[data-delj],[data-kdoc],[data-lwin]"); if (!x) return;
    if (x.dataset.lwin) R(async () => { const { error } = await sb.from("entries").insert({ kid: k.id, date: today(), cat: "other", tone: "positive", title: T().littleWins[+x.dataset.lwin], by_kid: true }); if (error) throw error; });
    if (x.dataset.unprop) R(() => del("goals", { id: x.dataset.unprop }));
    if (x.dataset.delwin) R(() => del("entries", { id: x.dataset.delwin }));
    if (x.dataset.delj) { if (x.dataset.armed) R(() => del("journal", { id: x.dataset.delj })); else { x.dataset.armed = 1; x.textContent = T().confirm; } }
    if (x.dataset.kdoc) { e.preventDefault(); const dc = S.docs.find(y => y.slug === x.dataset.kdoc); const body = lang === "zh" && dc.body_md_zh ? dc.body_md_zh : dc.body_md; $("#kDocView").innerHTML = `<div class="md">${window.marked && window.DOMPurify ? DOMPurify.sanitize(marked.parse(body || "")) : esc(body)}</div>`; $("#kDocView").scrollIntoView({ behavior: "smooth" }); }
  };
}
/* ---- ✅ Habit checks (Bobby 2026-11-25, after Ellis's first $20 week): habits the apps can see check themselves from app data,
   so they can't be tapped on trust. Self-report habits (reading) open after 5 PM, once the day's work is mostly done. ---- */
const HABIT_VERIFY = {
  ellis: { selfAfter: 17,
    "ellis-amc-practice": { kind: "amc", min: 25 },      // 25+ active AMC minutes today
    "ellis-fencing-game": { kind: "duel", n: 1 },        // 1+ Piste Duel bout today in the fencing app
    "ellis-journal": { kind: "journal" } },
  // 🔒 Eric (Bobby 11/25 "make sure there is no loopholes"): he was tapping all 9 habits every day, including Physics and Look Back on days
  // the apps show no Physics or Look Back at all, and once-a-week habits (Sunday planner, chunking, Onshape) every day.
  eric: { selfAfter: 17,
    "eric-amc-practice": { kind: "time", apps: ["amc"], min: 30, name: "AMC" },
    "eric-physics-sessions": { kind: "time", apps: ["physics", "quest"], min: 12, name: "Physics / Realm of Forces" },
    "eric-lookback": { kind: "lookback" },
    "eric-review": { kind: "time", apps: ["review", "chem", "bio", "prealg", "english", "latin", "history"], min: 10, name: "Look Back + class practice" },
    "eric-rehearsal": { kind: "time", apps: ["chem", "bio", "prealg", "english", "latin", "history", "physics"], min: 20, name: "class practice" },
    "eric-planner": { kind: "week", max: 1, days: [0, 6] },  // once a week, Sat/Sun only
    "eric-chunk": { kind: "week", max: 1 },
    "eric-onshape": { kind: "week", max: 1 },
    "eric-launchpad": { kind: "after" } }               // today's journal saved
};
const parseMaybe = x => { if (typeof x === "string") { try { return JSON.parse(x); } catch (e) { return null; } } return x; };
async function duelsToday(kid) {
  const d = dayStr(), n = L => (Array.isArray(L) ? L : []).filter(r => r && r.type === "duel" && r.date === d && (r.finished || (r.steps || []).length >= 3)).length;
  let db = 0, local = 0;
  try { const { data } = await sb.from("app_saves").select("data").eq("kid", kid).eq("app", "fencing").maybeSingle(); db = n(parseMaybe(data && data.data ? data.data[`${kid}_perfLog`] : null)); } catch (e) {}
  try { local = n(JSON.parse(localStorage.getItem(`${kid}_perfLog`) || "null")); } catch (e) {}
  return Math.max(db, local);
}
async function appMinToday(kid, apps) { try { const { data } = await sb.from("app_time").select("app,secs").eq("kid", kid).eq("date", dayStr()); return Math.floor((data || []).filter(x => apps.includes(x.app)).reduce((a, x) => a + x.secs, 0) / 60); } catch (e) { return 0; } }
async function lookBackDone(kid) { const d = dayStr(), ok = P => !!(P && P.days && P.days[d] && P.days[d].done); let a = false, b = false;
  try { const { data } = await sb.from("app_saves").select("data").eq("kid", kid).eq("app", "review").maybeSingle(); a = ok(data && data.data ? data.data[`${kid}_review_progress`] : null); } catch (e) {}
  try { b = ok(JSON.parse(localStorage.getItem(`${kid}_review_progress`) || "null")); } catch (e) {} return a || b; }
async function habitWeekCount(kid, id) { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); const mon = d.toLocaleDateString("en-CA");
  try { const { data } = await sb.from("point_ledger").select("ref,date").eq("kid", kid).eq("source", "habit").gte("date", mon).like("ref", `habit:${id}:%`); return (data || []).filter(x => x.date !== dayStr()).length; } catch (e) { return 0; } }
async function habitCheck(kid, r, R) {
  const zh = lang === "zh";
  if (r.kind === "time") { const m = await appMinToday(kid, r.apps); return m >= r.min ? { ok: true, kind: "time", why: zh ? `🤖 今天 ${m} 分钟` : `🤖 ${m} active min today` } : { ok: false, kind: "time", why: zh ? `需要 ${r.min} 分钟（今天 ${m}）` : `Needs ${r.min} active min in ${r.name} (today: ${m})` }; }
  if (r.kind === "lookback") { const ok = await lookBackDone(kid); return ok ? { ok: true, kind: "lookback", why: zh ? "🤖 今天的回顾已完成" : "🤖 Today's Look Back is done" } : { ok: false, kind: "lookback", why: zh ? "先完成今天的 12 道回顾题" : "Finish today's 12 Look Back questions first" }; }
  if (r.kind === "week") { const dow = new Date().getDay(); if (r.days && !r.days.includes(dow)) return { ok: false, kind: "week", why: zh ? "只能在周末打卡" : "Only on Saturday or Sunday" };
    const n = await habitWeekCount(kid, r.id); return n >= r.max ? { ok: false, kind: "week", why: zh ? "这周已经打过卡了" : "Already done this week" } : { ok: true, kind: "after" }; }
  if (r.kind === "amc") { const m = Math.floor(await amcDaySec(kid) / 60); return m >= r.min ? { ok: true, kind: "amc", why: zh ? `🤖 AMC 今天 ${m} 分钟` : `🤖 ${m} active AMC min today` } : { ok: false, kind: "amc", why: zh ? `需要 AMC ${r.min} 分钟（今天 ${m}）` : `Needs ${r.min} active AMC min (today: ${m})` }; }
  if (r.kind === "duel") { const n = await duelsToday(kid); return n >= r.n ? { ok: true, kind: "duel", why: zh ? `🤖 今天 ${n} 场 Piste Duel` : `🤖 ${n} Piste Duel bout${n > 1 ? "s" : ""} today` } : { ok: false, kind: "duel", why: zh ? "在击剑应用里打 1 场 Piste Duel" : "Play 1 Piste Duel bout in the fencing app" }; }
  if (r.kind === "journal") { const j = jToday(kid); return j ? { ok: true, kind: "journal", why: zh ? "🤖 今天的日记已写" : "🤖 Today's journal is saved" } : { ok: false, kind: "journal", why: zh ? "先写今天的日记" : "Write today's journal first" }; }
  const h = new Date().getHours(), at = R.selfAfter; return h >= at ? { ok: true, kind: "after" } : { ok: false, kind: "after", why: zh ? `下午 ${at - 12} 点后才能打卡` : `Opens after ${at - 12} PM` };
}
// ⭐ Bobby 11/25: a win is a sentence, not a number ("67"): at least 5 words (or 8 Chinese characters)
const winOk = v => { const cjk = (v.match(/[\u4e00-\u9fff]/g) || []).length; return cjk >= 8 || v.split(/\s+/).filter(w => /[a-z0-9]/i.test(w)).length + Math.floor(cjk / 2) >= 5; };
/* ---- 🪞 Journal reflection (Bobby 2026-11-25): Ellis's entries were written to exactly the 250-word minimum. The minimum stays, but 3 reflection
   questions (10+ words each) are part of every entry, so the words go into thinking about the day, not padding. Saved at the end of the body. ---- */
const JREFLECT = { ellis: [["What did I learn or get better at today?", "今天我学会了什么，或者哪里进步了？"], ["What was hard, and what did I do about it?", "什么事情很难？我是怎么做的？"], ["What will I do differently tomorrow?", "明天我要怎么做得不一样？"]] };
const JREFLECT_MIN = 10, J_MARK = "\n\n🪞 Reflection\n";
const jSplit = body => { const s = String(body || ""), i = s.indexOf(J_MARK); if (i < 0) return { main: s, ans: [] };
  const ans = s.slice(i + J_MARK.length).split(/\n(?=\d\. )/).map(x => x.replace(/^\d\. /, "").trim()); return { main: s.slice(0, i), ans }; };
const jFull = kid => { const ta = document.getElementById("jIn"), main = ta ? ta.value : ""; const Q = JREFLECT[kid]; if (!Q || !document.getElementById("jR0")) return main;
  const ans = Q.map((q, i) => (document.getElementById("jR" + i) || {}).value || ""); if (!ans.some(a => a.trim())) return main;
  return main.trimEnd() + J_MARK + Q.map((q, i) => `${i + 1}. ${ans[i].trim().replace(/\n+/g, " ")}`).join("\n"); }; // answers only (question text would add free words)
const jReflectGap = kid => { const Q = JREFLECT[kid]; if (!Q || !document.getElementById("jR0")) return -1; return Q.findIndex((q, i) => wordCount((document.getElementById("jR" + i) || {}).value || "") < JREFLECT_MIN); };
function kidTapIn() {
  const t = T(), k = S.kids[0], d = today(), ms = S.metrics.filter(m => m.type === "rate");
  kidTap = { mood: S.moods.find(m => m.date === d)?.kid_mood || null, counts: {}, traits: {} };
  const kt = KID_TRAITS[k.id];
  ms.forEach(m => { const r = S.readings.find(r => r.metric === m.id && r.date === d); kidTap.counts[m.id] = r ? +r.value : 0; });
  $("#kidMode").classList.add("open");
  const el = $("#kidStage");
  const hvP = hvLoad().catch(() => {});
  const face = () => { el.innerHTML = `<h2>${t.howWasToday(esc(kidName(k.id)))}</h2><div class="bigfaces">${FACES.map((f, i) => `<button data-n="${i + 1}" class="${kidTap.mood === i + 1 ? "on" : ""}" aria-label="${t.faces[i]}">${f}</button>`).join("")}</div>`;
    el.querySelectorAll("[data-n]").forEach(b => b.onclick = () => { kidTap.mood = +b.dataset.n; b.classList.add("on"); setTimeout(kt ? rate : ms.length ? did : save, 180); }); };
  // rate myself: honest answers are the point, so there are no points for picking 😀
  const rate = () => { const zh = lang === "zh"; el.innerHTML = `<h2>${zh ? "今天你做得怎么样？" : "How did you do today?"}</h2><div class="meta" style="text-align:center;margin-top:-10px;margin-bottom:12px">${zh ? "说实话就好，没有对错。" : "Be honest. There's no wrong answer."}</div>
    ${kt.map(([key, en, z]) => `<div style="margin:10px 0"><div style="font-weight:600;margin-bottom:6px">${zh ? z : en}</div><div class="chips">${[[2, "😀", zh ? "做到了" : "Yes"], [1, "😐", zh ? "有一点" : "Sort of"], [0, "😕", zh ? "今天没有" : "Not today"]].map(([n, f, l]) => `<button class="chipbtn ${kidTap.traits[key] === n ? "on" : ""}" data-tr="${key}" data-n="${n}"><span>${f}</span> ${l}</button>`).join("")}</div></div>`).join("")}
    <div style="text-align:center;margin-top:14px"><button class="btn primary" id="kidRateNext">${zh ? "下一步" : "Next"} →</button></div>`;
    el.querySelectorAll("[data-tr]").forEach(b => b.onclick = () => { const key = b.dataset.tr, n = +b.dataset.n; if (kidTap.traits[key] === n) delete kidTap.traits[key]; else kidTap.traits[key] = n; rate(); });
    $("#kidRateNext").onclick = () => (ms.length ? did() : save()); };
  // ✅ Bobby 11/25: habits the apps can see are checked from the app data (no tapping them on trust); the rest open after 5 PM
  const hv = {}; // metric id -> { ok, why }
  const hvLoad = async () => { const R = HABIT_VERIFY[k.id]; if (!R || preview) return;
    const po = window.fhSetting && window.fhSetting(k.id, "self_habits_parent_only"); // 🛡️ auto-tightened after taps didn't match the app data
    for (const m of ms) { const r = R[m.id] || (R.selfAfter != null && !R[m.id] ? { kind: "after" } : null); if (!r) continue;
      if (po && (r.kind === "after" || r.kind === "week")) { hv[m.id] = { ok: false, kind: "parent", why: lang === "zh" ? "这周由爸爸妈妈来打卡" : "A parent marks this one this week" }; kidTap.counts[m.id] = 0; continue; }
      try { hv[m.id] = await habitCheck(k.id, Object.assign({ id: m.id }, r), R); } catch (e) { hv[m.id] = { ok: true }; }
      if (r.kind !== "after") { if (hv[m.id].ok) kidTap.counts[m.id] = Math.max(1, kidTap.counts[m.id] || 0); else if (!(kidTap.counts[m.id] > 0)) kidTap.counts[m.id] = 0; } } };
  const did = () => hvP.then(did0);
  const did0 = () => { const zh = lang === "zh"; el.innerHTML = `<h2>${t.whatDidYouDo}</h2><div class="meta" style="text-align:center;margin-top:-10px;margin-bottom:12px">${t.tapAll}</div><div class="chips">${ms.map(m => { const n = kidTap.counts[m.id] || 0, mx = m.kid_max || 1, v = hv[m.id], auto = v && v.kind !== "after", lock = v && !v.ok && !n; return `<button class="chipbtn ${n ? "on" : ""}" data-m="${esc(m.id)}" ${auto || lock ? "disabled" : ""} style="${lock ? "opacity:.55" : ""}"><span>${esc(mKidLabel(m))}${v && v.why ? `<small style="display:block;font-weight:400;font-size:12px;opacity:.85">${esc(v.why)}</small>` : ""}</span><span class="ct">${n ? (mx > 1 ? "✓".repeat(n) : "✓") : lock ? "🔒" : ""}</span></button>`; }).join("")}</div>${Object.values(hv).some(v => v.kind !== "after") ? `<div class="meta" style="text-align:center;margin:8px 0">${zh ? "🤖 有的习惯会根据应用里的记录自动打勾。" : "🤖 Some habits check themselves from what you did in the apps."}</div>` : ""}<button class="go" id="kidSave">${t.doneBtn}</button>`;
    el.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { const m = ms.find(x => x.id === b.dataset.m), v = hv[m.id]; if (v && (v.kind !== "after" || !v.ok)) return; const mx = m.kid_max || 1, n = kidTap.counts[m.id] || 0; kidTap.counts[m.id] = n >= mx ? 0 : n + 1; did(); });
    $("#kidSave").onclick = save; };
  const save = async () => { el.innerHTML = `<div class="thanks">⏳</div>`;
    if (preview) { el.innerHTML = `<div class="thanks">👀</div><h2>${t.previewNoSave}</h2>`; setTimeout(() => $("#kidMode").classList.remove("open"), 1600); return; }
    if (kt && Object.keys(kidTap.traits).length) { const r = await sb.rpc("kid_self_rate", { p_date: d, p_traits: kidTap.traits }); if (r.error) console.warn("self-rate", r.error.message); }
    const { data: tapRes, error } = await sb.rpc("kid_tapin", { p_date: d, p_mood: kidTap.mood, p_counts: kidTap.counts });
    if (error) { el.innerHTML = `<h2>${t.cantSave}</h2>`; return; }
    // 🛡️ the database holds back habit taps the apps can't back up yet (e.g. AMC minutes not reached); say so kindly
    const held = (tapRes && tapRes.held) || [], zhH = lang === "zh";
    const heldHtml = held.length ? `<div class="meta" style="margin-top:10px">🔒 ${held.map(h => { const m = ms.find(x => x.id === h.habit), nm = m ? esc(lang === "zh" && m.kid_label_zh ? m.kid_label_zh : (m.kid_label || m.name)) : esc(h.habit);
        return h.kind === "time" ? (zhH ? `${nm}：还差 ${Math.max(0, Math.ceil(h.need_min * 0.9 - h.have_min))} 分钟` : `${nm}: ${Math.max(0, Math.ceil(h.need_min * 0.9 - h.have_min))} more min needed`)
          : h.kind === "weekly" ? (zhH ? `${nm}：这周已经打过卡了` : `${nm}: already done this week`) : (zhH ? `${nm}：先完成今天的回顾` : `${nm}: finish today's round first`); }).join(" · ")}</div>` : "";
    el.innerHTML = `<div class="thanks">🎉</div><h2>${t.thanks(esc(kidName(k.id)))}</h2>${heldHtml}`; confetti();
    setTimeout(async () => { $("#kidMode").classList.remove("open"); await loadAll(); kidRender(); }, held.length ? 4200 : 1400); };
  face();
}

start();

/* ---------------- CALENDAR (parents' page + each kid's page) ---------------- */
const CALS = {
  en: { h: "Calendar", all: "Everyone", family: "Family", add: "+ Add event", today: "Today", upcoming: "Coming up", none: "Nothing on the calendar.", noneDay: "Nothing this day.",
    dows: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], more: n => `+${n} more`, who: "Who", date: "Date", end: "Ends (optional)", time: "Time (optional)", title: "What", titleZh: "中文标题 (optional)",
    kind: "Type", loc: "Where (optional)", notes: "Notes (optional)", vis: "Who can see it", visAll: "Kids can see it", visPar: "Parents only", rep: "Repeats", repNone: "Doesn't repeat", repWeekly: "Every week", until: "Until",
    save: "Save", cancel: "Cancel", saved: "Saved to the calendar.", del: "Delete", delOk: "Removed.", parentsOnly: "parents only", every: "every week", lesson: "Fencing lesson", myCal: "My calendar", fromFred: "from askFRED",
    kinds: { school: "🏫 School", fencing: "🤺 Fencing", competition: "🏆 Competition", swim: "🏊 Swim", amc: "🧮 AMC / math", debate: "🎤 Debate", family: "🏡 Family", appointment: "🩺 Appointment", other: "📌 Other" } },
  zh: { h: "日历", all: "全部", family: "全家", add: "+ 添加日程", today: "今天", upcoming: "接下来", none: "日历上还没有安排。", noneDay: "这天没有安排。",
    dows: ["一", "二", "三", "四", "五", "六", "日"], more: n => `还有 ${n} 项`, who: "谁", date: "日期", end: "结束日期（可选）", time: "时间（可选）", title: "内容", titleZh: "中文标题（可选）",
    kind: "类型", loc: "地点（可选）", notes: "备注（可选）", vis: "谁能看到", visAll: "孩子能看到", visPar: "仅家长", rep: "重复", repNone: "不重复", repWeekly: "每周", until: "直到",
    save: "保存", cancel: "取消", saved: "已加入日历。", del: "删除", delOk: "已删除。", parentsOnly: "仅家长", every: "每周", lesson: "击剑私教课", myCal: "我的日历", fromFred: "来自 askFRED",
    kinds: { school: "🏫 学校", fencing: "🤺 击剑", competition: "🏆 比赛", swim: "🏊 游泳", amc: "🧮 AMC / 数学", debate: "🎤 辩论", family: "🏡 家庭", appointment: "🩺 预约", other: "📌 其他" } } };
const CL = () => CALS[lang] || CALS.en;
const KCOL = { eric: "var(--k0)", ellis: "var(--k1)", jonah: "var(--k2)" };
const calCol = kid => kid ? (KCOL[kid] || "var(--sky)") : "var(--famc,#e9e9e4)";
const calSt = { month: null, kid: "all", day: null, kmonth: null };
const addMonths = (m, n) => { const [y, mo] = m.split("-").map(Number); const d = new Date(y, mo - 1 + n, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`; };
const calTitle = e => lang === "zh" && e.title_zh ? e.title_zh : e.title;
// every occurrence (one per day) of every item between from..to (inclusive), from the calendar table plus fencing history and lessons
function calItems(from, to, kidFilter) {
  const out = [], push = (e, d) => { if (d >= from && d <= to) out.push({ ...e, day: d }); };
  const kidPage = document.body.classList.contains("kidmode");
  for (const e of S.calendar_events || []) {
    if (kidPage && e.visibility === "parents") continue;
    if (e.repeat === "weekly") { const stop = e.repeat_until && e.repeat_until < to ? e.repeat_until : to; for (let d = e.date, i = 0; d <= stop && i < 200; d = addDays(d, 7), i++) push(e, d); }
    else { const last = e.end_date && e.end_date > e.date ? e.end_date : e.date; for (let d = e.date, i = 0; d <= last && i < 31; d = addDays(d, 1), i++) push(e, d); }
  }
  for (const r of S.fencing_results || []) push({ id: "fr-" + r.id, kid: r.kid, kind: "competition", title: `🤺 #${r.place ?? "?"}${r.field ? "/" + r.field : ""} · ${r.event}`, location: r.tournament, derived: true, date: r.date }, r.date);
  for (const l of S.fencing_lessons || []) push({ id: "fl-" + l.id, kid: l.kid, kind: "fencing", title: `🦉 ${CL().lesson}${l.focus ? ": " + l.focus : ""}`, derived: true, date: l.date }, l.date);
  return out.filter(x => kidFilter === "all" || !x.kid || x.kid === kidFilter)
    .sort((a, b) => a.day.localeCompare(b.day) || String(a.time || "").localeCompare(String(b.time || "")) || String(a.kid || "").localeCompare(String(b.kid || "")));
}
function calGrid(month, kidFilter, sel, compact) {
  const L = CL(), first = month, dow = (new Date(first + "T12:00").getDay() + 6) % 7, start = addDays(first, -dow);
  const last = addDays(addMonths(month, 1), -1), cells = Math.ceil((dow + +last.slice(8)) / 7) * 7, end = addDays(start, cells - 1);
  const items = calItems(start, end, kidFilter), t = today();
  const byDay = {}; items.forEach(x => (byDay[x.day] ||= []).push(x));
  const label = new Date(first + "T12:00").toLocaleDateString(lang === "zh" ? "zh-CN" : undefined, { month: "long", year: "numeric" });
  let html = `<div class="calhead"><button class="btn sm" data-calm="-1" aria-label="previous month">‹</button><b>${label}</b><button class="btn sm" data-calm="1" aria-label="next month">›</button><button class="btn sm ghost" data-calm="0">${L.today}</button></div>
    <div class="calgrid ${compact ? "compact" : ""}">${L.dows.map(d => `<div class="caldow">${d}</div>`).join("")}`;
  for (let i = 0; i < cells; i++) {
    const d = addDays(start, i), list = byDay[d] || [], out = d.slice(0, 7) !== month.slice(0, 7);
    html += `<button class="calday ${out ? "out" : ""} ${d === t ? "now" : ""} ${d === sel ? "sel" : ""}" data-calday="${d}"><span class="caln">${+d.slice(8)}</span>
      <span class="caldots">${list.slice(0, 4).map(x => `<i style="background:${calCol(x.kid)}"></i>`).join("")}</span>
      <span class="callabels">${list.slice(0, 3).map(x => `<em style="border-left-color:${calCol(x.kid)}">${esc(calTitle(x))}</em>`).join("")}${list.length > 3 ? `<em class="m">${L.more(list.length - 3)}</em>` : ""}</span></button>`;
  }
  return html + `</div>`;
}
function calRow(x, parent) {
  const L = CL(), range = x.end_date && x.end_date !== x.date ? `${fmtDate(x.date)} – ${fmtDate(x.end_date)}` : fmtDate(x.day);
  const who = x.kid ? kidName(x.kid) : L.family;
  return `<div class="calrow" style="border-left-color:${calCol(x.kid)}"><div><b>${esc(calTitle(x))}</b>
    <div class="meta">${range}${x.time ? " · " + esc(x.time) : ""}${who ? " · " + esc(who) : ""}${x.location ? " · " + esc(x.location) : ""}${x.repeat === "weekly" ? " · " + L.every : ""}${parent && x.visibility === "parents" ? ` · <span class="chip">${L.parentsOnly}</span>` : ""}${x.source === "askfred" ? " · " + L.fromFred : ""}</div>
    ${x.notes ? `<div class="meta">${esc(x.notes)}</div>` : ""}</div>${parent && !x.derived ? `<button class="x" data-caldel="${x.id}" title="${L.del}">✕</button>` : ""}</div>`;
}
function calUpcoming(kidFilter, days, parent) {
  const t = today(), seen = new Set();
  const list = calItems(t, addDays(t, days), kidFilter).filter(x => { if (seen.has(x.id)) return false; seen.add(x.id); return true; }); // weekly items appear once (next time)
  return list.length ? list.slice(0, 12).map(x => calRow(x, parent)).join("") : `<div class="meta">${CL().none}</div>`;
}
function calForm(day) {
  const L = CL(), kinds = Object.entries(L.kinds).map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
  return `<form class="calform" id="calForm"><div class="calf2">
    <label>${L.who}<select name="kid"><option value="">${L.family}</option>${S.kids.map(k => `<option value="${esc(k.id)}" ${calSt.kid === k.id ? "selected" : ""}>${esc(kidName(k.id))}</option>`).join("")}</select></label>
    <label>${L.kind}<select name="kind">${kinds}</select></label></div>
    <label>${L.title}<input name="title" required maxlength="140"></label>
    <label>${L.titleZh}<input name="title_zh" maxlength="140"></label>
    <div class="calf2"><label>${L.date}<input type="date" name="date" required value="${day || today()}"></label><label>${L.end}<input type="date" name="end_date"></label></div>
    <div class="calf2"><label>${L.time}<input name="time" maxlength="40" placeholder="5:00–6:30pm"></label><label>${L.loc}<input name="location" maxlength="140"></label></div>
    <div class="calf2"><label>${L.rep}<select name="repeat"><option value="none">${L.repNone}</option><option value="weekly">${L.repWeekly}</option></select></label><label>${L.until}<input type="date" name="repeat_until"></label></div>
    <div class="calf2"><label>${L.vis}<select name="visibility"><option value="all">${L.visAll}</option><option value="parents">${L.visPar}</option></select></label><span></span></div>
    <label>${L.notes}<textarea name="notes" rows="2" maxlength="600"></textarea></label>
    <div class="modal-f"><button type="button" class="btn" data-calcancel>${L.cancel}</button><button class="btn primary">${L.save}</button></div></form>`;
}
function viewCalendar() {
  const L = CL(); calSt.month ||= monthStart(today());
  const sel = calSt.day, dayList = sel ? calItems(sel, sel, calSt.kid) : [];
  $("#view").innerHTML = `<div class="section-h"><h3>📅 ${L.h}</h3><button class="btn sm primary" data-caladd>${L.add}</button></div>
    <div class="tabs" style="margin-bottom:14px;width:max-content;max-width:100%">${[["all", L.all], ...S.kids.map(k => [k.id, kidName(k.id)])].map(([id, l]) => `<button class="${calSt.kid === id ? "on" : ""}" data-calkid="${esc(id)}">${id !== "all" ? `<i class="caldot" style="background:${calCol(id)}"></i>` : ""}${esc(l)}</button>`).join("")}</div>
    <div class="calwrap"><div class="card calcard">${calGrid(calSt.month, calSt.kid, sel, false)}
      ${sel ? `<div class="calsel"><div class="section-h" style="margin:14px 0 6px"><h4>${fmtDate(sel)}</h4><button class="btn sm" data-caladd="${sel}">${L.add}</button></div>${dayList.length ? dayList.map(x => calRow(x, true)).join("") : `<div class="meta">${L.noneDay}</div>`}</div>` : ""}</div>
      <div class="card"><h4 style="margin:0 0 8px">${L.upcoming}</h4>${calUpcoming(calSt.kid, 45, true)}</div></div>
    <div class="modal-bg" id="calModal"><div class="modal" style="max-width:560px"><h3 style="margin-top:0">${L.add}</h3><div id="calFormBox"></div></div></div>`;
}
function kidCalendarHtml(kid) {
  const L = CL(); calSt.kmonth ||= monthStart(today());
  const sel = calSt.day, dayList = sel ? calItems(sel, sel, kid) : [];
  return `${kwH("calendar", "cal", L.myCal)}<div class="kw-card kcal">${calGrid(calSt.kmonth, kid, sel, true)}
    ${sel ? `<div class="calsel"><b style="font-family:var(--kfont)">${fmtDate(sel)}</b>${dayList.length ? dayList.map(x => calRow(x, false)).join("") : `<div class="meta">${L.noneDay}</div>`}</div>` : ""}
    <div style="margin-top:14px"><b style="font-family:var(--kfont)">${L.upcoming}</b>${calUpcoming(kid, 30, false)}</div></div>`;
}
// one click handler for both pages (parents re-route, kids re-render)
document.addEventListener("click", async e => {
  const kidPage = document.body.classList.contains("kidmode");
  const rerender = () => kidPage ? kidRender() : route();
  const m = e.target.closest("[data-calm]");
  if (m) { const key = kidPage ? "kmonth" : "month", n = +m.dataset.calm; calSt[key] = n ? addMonths(calSt[key] || monthStart(today()), n) : monthStart(today()); if (!n) calSt.day = today(); return rerender(); }
  const d = e.target.closest("[data-calday]");
  if (d) { calSt.day = calSt.day === d.dataset.calday ? null : d.dataset.calday; const key = kidPage ? "kmonth" : "month"; if (d.dataset.calday.slice(0, 7) !== (calSt[key] || "").slice(0, 7)) calSt[key] = monthStart(d.dataset.calday); rerender(); return; }
  if (kidPage) return;
  const k = e.target.closest("[data-calkid]"); if (k) { calSt.kid = k.dataset.calkid; return route(); }
  const a = e.target.closest("[data-caladd]");
  if (a) { $("#calFormBox").innerHTML = calForm(a.dataset.caladd || calSt.day); $("#calModal").classList.add("open"); return; }
  if (e.target.id === "calModal" || e.target.closest("[data-calcancel]")) return $("#calModal")?.classList.remove("open");
  const x = e.target.closest("[data-caldel]");
  if (x) { if (!x.dataset.armed) { x.dataset.armed = 1; x.textContent = CL().del + "?"; return; } try { await del("calendar_events", { id: x.dataset.caldel }); setStatus(CL().delOk); refresh(); } catch (err) { setStatus(err.message, true); } }
});
document.addEventListener("submit", async e => {
  if (e.target.id !== "calForm") return; e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target)), v = s => (s || "").trim() || null;
  const row = { kid: f.kid || null, date: f.date, end_date: v(f.end_date), time: v(f.time), title: f.title.trim(), title_zh: v(f.title_zh), kind: f.kind, location: v(f.location), notes: v(f.notes),
    visibility: f.visibility, repeat: f.repeat, repeat_until: f.repeat === "weekly" ? v(f.repeat_until) : null, source: "manual", created_by: S.user?.email || null };
  try { const { error } = await sb.from("calendar_events").insert(row); if (error) throw error; $("#calModal").classList.remove("open"); calSt.day = row.date; calSt.month = monthStart(row.date); setStatus(CL().saved); refresh(); }
  catch (err) { setStatus(err.message, true); }
});

/* ---------------- POINTS: ledger, reward shop, parent Rewards page ---------------- */
const DIFFS = ["easy", "medium", "hard", "boss"];
const DIFF_L = { en: { easy: "Easy ×1", medium: "Medium ×1.5", hard: "Hard ×2", boss: "Boss ×3" }, zh: { easy: "简单 ×1", medium: "中等 ×1.5", hard: "困难 ×2", boss: "首领 ×3" } };
const diffLabel = d => (DIFF_L[lang] || DIFF_L.en)[d] || d;
const diffSelect = (name, val, attrs = "") => `<select name="${name}" ${attrs}>${DIFFS.map(d => `<option value="${d}" ${d === (val || "medium") ? "selected" : ""}>${diffLabel(d)}</option>`).join("")}</select>`;
const ptsOf = kid => { const L = (S.point_ledger || []).filter(r => r.kid === kid), pend = (S.redemptions || []).filter(r => r.kid === kid && r.status === "requested").reduce((s, r) => s + r.cost, 0);
  const life = L.filter(r => r.source !== "spend").reduce((s, r) => s + r.points, 0), all = L.reduce((s, r) => s + r.points, 0), w = addDays(today(), -6);
  return { life, balance: all - pend, pending: pend, week: L.filter(r => r.source !== "spend" && r.date >= w).reduce((s, r) => s + r.points, 0), rows: L.slice().sort((a, b) => b.created_at.localeCompare(a.created_at)) }; };
const PL = {
  en: { shop: "Reward shop", bal: "Points to spend", life: "Earned all time", week: "This week", get: "Get it", need: n => `${n} more`, asked: "Asked a parent ✓", my: "My requests", recent: "Recent points",
    st: { requested: "⏳ waiting for a parent", approved: "✅ yes!", declined: "✕ not this time", cancelled: "cancelled" }, cancel: "Cancel", noItems: "No rewards yet — ask Mom or Dad to add some!",
    sent: "Sent to Mom and Dad! ⏳", notEnough: "Not enough points yet — keep going!", tooMany: "You already have 3 requests waiting.", how: "How points work",
    rules: ["✅ Daily check-in: +10 (streak bonus: 3 days +5, 7 days +10, 14 days +15, 30 days +20)", "💪 Each habit: 5 × difficulty (Easy ×1, Medium ×1.5, Hard ×2, Boss ×3)", "📅 Hit a weekly habit goal: bonus 5 × weekly target × difficulty",
      "📈 New best score on a goal: 10 × difficulty · reach the target: 50 × difficulty", "🎯 Finish a goal: 20 × difficulty · 💡 suggest one: +5 (+10 if approved)", "⭐ Log a win: +8 (3 a day) · 👀 a parent notices something great: +10",
      "📓 Journal: +12 (long entries +20, one a day)", "🎮 Learning apps: harder levels and first-try answers earn more (up to 120 a day per app)", "🎁 Spend points in the reward shop — your level keeps all the points you ever earned"],
    journalRule: n => n > 0 ? `📓 Journal: +12 for ${n}+ words, +20 for ${n * 2}+ (one a day)` : "📓 Journal: +12 for any entry (one a day)" },
  zh: { shop: "奖励商店", bal: "可用积分", life: "累计获得", week: "本周", get: "兑换", need: n => `还差 ${n}`, asked: "已发给爸妈 ✓", my: "我的兑换", recent: "最近积分",
    st: { requested: "⏳ 等爸妈确认", approved: "✅ 同意啦！", declined: "✕ 这次不行", cancelled: "已取消" }, cancel: "取消", noItems: "还没有奖励——请爸爸妈妈添加！",
    sent: "已发给爸爸妈妈！⏳", notEnough: "积分还不够——继续加油！", tooMany: "你已经有 3 个兑换在等待。", how: "积分怎么得",
    rules: ["✅ 每日打卡：+10（连续 3 天 +5，7 天 +10，14 天 +15，30 天 +20）", "💪 每个习惯：5 × 难度（简单 ×1，中等 ×1.5，困难 ×2，首领 ×3）", "📅 完成每周习惯目标：额外 5 × 每周次数 × 难度",
      "📈 目标创新纪录：10 × 难度 · 达成目标：50 × 难度", "🎯 完成目标：20 × 难度 · 💡 提出目标：+5（通过再 +10）", "⭐ 记录进步：+8（每天 3 次）· 👀 爸妈看到你的好表现：+10",
      "📓 写日记：+12（长篇 +20，每天一篇）", "🎮 学习应用：难度越高、一次做对，分越多（每个应用每天最多 120）", "🎁 积分可以在奖励商店兑换——等级会保留你得到过的全部积分"],
    journalRule: n => n > 0 ? `📓 写日记：${n} 字以上 +12，${n * 2} 字以上 +20（每天一篇）` : "📓 写日记：每篇 +12（每天一篇）" } };
const PLL = () => PL[lang] || PL.en;
const ledgerLabel = r => lang === "zh" && r.label_zh ? r.label_zh : (r.label || r.source);
// apps call window.parent.fhAward(app, ref, points, label, label_zh) — only a signed-in boy earns; the database caps it
let awardQ = Promise.resolve();
/* ---- 🧠 Brain development (2026-11-26): Brain Check bridge for braincheck/ ---- */
const BRAIN_EVERY = 14, BRAIN_KIDS = ["eric", "ellis"];
const brainChecksOf = (kid, src) => (S.brain_checks || []).filter(c => c.kid === kid && (!src || c.source === src)).sort((a, b) => String(a.taken_at).localeCompare(String(b.taken_at)));
const brainDue = kid => { if (!BRAIN_KIDS.includes(kid)) return null; const l = brainChecksOf(kid, "check").pop(); if (!l) return { due: true, days: 0, first: true }; const d = Math.floor((new Date(today()) - new Date(l.date)) / 864e5); return { due: d >= BRAIN_EVERY, days: BRAIN_EVERY - d, last: l }; };
window.fhCloseApp = () => { if (appOpen) appOpen(); };
window.fhBrainLast = kid => { const l = brainChecksOf(kid, "check").pop(); return l ? { date: l.date, scores: l.scores } : null; };
window.fhBrainCheck = async (kid, res) => {
  if (preview || !isKid()) return { ok: false, msg: lang === "zh" ? "家长预览：不保存" : "Parent preview: not saved" };
  const { data, error } = await sb.from("brain_checks").insert({ kid, date: res.date || today(), scores: res.scores, raw: res.raw, minutes: res.minutes }).select().single();
  if (error) return { ok: false, msg: error.message };
  (S.brain_checks = S.brain_checks || []).push(data); awardsDirty = true; return { ok: true };
};
window.fhAward = (app, ref, points, label, label_zh) => {
  if (!isKid() || preview) return;
  awardQ = awardQ.then(async () => {
    try { if (window.fhFlushTime) await window.fhFlushTime().catch(() => {});
      const { data } = await sb.rpc("award_app_points", { p_app: app, p_ref: String(ref), p_points: Math.round(points), p_label: label, p_label_zh: label_zh || null });
      if (data > 0) { const chip = document.createElement("div"); chip.className = "ptchip"; chip.textContent = `+${data} ⭐`; document.body.appendChild(chip); setTimeout(() => chip.remove(), 2200); awardsDirty = true; } } catch (e) {}
  });
};
let awardsDirty = false;
function kidShopHtml(k) {
  const L = PLL(), p = ptsOf(k.id), items = (S.rewards || []).filter(r => r.active && (!r.kid || r.kid === k.id)).sort((a, b) => a.cost - b.cost || a.sort - b.sort);
  const reqs = (S.redemptions || []).filter(r => r.kid === k.id).sort((a, b) => b.requested_at.localeCompare(a.requested_at)).slice(0, 6);
  const eb = { voxel: ["Treat yourself", "犒劳自己"], pixel: ["Item shop", "道具商店"] }[kiTheme()];
  return `<div class="kw-h">${eb ? `<span class="kw-eyebrow">${lang === "zh" ? eb[1] : eb[0]}</span>` : ""}<span class="kw-ht">${KI("coin", 28)} ${L.shop}</span></div>
    <div class="kw-card kshop"><div class="kbal"><div>${KI("coin", 34)}<b>${p.balance}</b><small>${L.bal}</small></div><div><b>${p.life}</b><small>${L.life}</small></div><div><b>+${p.week}</b><small>${L.week}</small></div></div>
      <div class="kshop-items">${items.length ? items.map(r => { const can = p.balance >= r.cost, waiting = reqs.some(x => x.reward_id === r.id && x.status === "requested");
        return `<div class="kitem ${can ? "can" : ""}"><span class="kic">${KI(r.icon || "🎁", 40)}</span><b>${esc(lang === "zh" && r.title_zh ? r.title_zh : r.title)}</b><span class="kcost">${KI("coin", 16)} ${r.cost}</span>
          ${waiting ? `<span class="meta">${L.asked}</span>` : can ? `<button class="btn sm primary" data-redeem="${r.id}">${L.get}</button>` : `<span class="meta">${L.need(r.cost - p.balance)}</span><div class="kneed"><i style="width:${Math.max(4, Math.min(100, Math.round(100 * Math.max(0, p.balance) / r.cost)))}%"></i></div>`}</div>`; }).join("") : `<div class="meta">${L.noItems}</div>`}</div>
      ${reqs.length ? `<div class="kreqs"><b>${L.my}</b>${reqs.map(r => `<div class="kreq"><span>${esc(r.title)} · ${KI("coin", 14)} ${r.cost}</span><span class="meta">${L.st[r.status] || r.status}${r.note ? " — " + esc(r.note) : ""}</span>${r.status === "requested" ? `<button class="x" style="opacity:.7" data-unredeem="${r.id}" title="${L.cancel}">✕</button>` : ""}</div>`).join("")}</div>` : ""}
      ${p.rows.length ? `<details class="krecent"><summary><b>${L.recent}</b></summary>${p.rows.slice(0, 15).map(r => `<div class="kpt"><span class="${r.points < 0 ? "neg" : ""}">${r.points > 0 ? "+" : ""}${r.points}</span>${esc(ledgerLabel(r))}<small>${fmtDate(r.date)}</small></div>`).join("")}</details>` : ""}
      <details class="krecent"><summary><b>${L.how}</b></summary><ul class="krules">${L.rules.map((x, i) => `<li>${esc(i === 6 ? L.journalRule(k.journal_min_words ?? 500) : x)}</li>`).join("")}</ul></details></div>`;
}
document.addEventListener("click", async e => {
  if (!document.body.classList.contains("kidmode")) return;
  const a = e.target.closest("[data-redeem]"), c = e.target.closest("[data-unredeem]"); if (!a && !c) return;
  const L = PLL(); if (preview) return setStatus(T().previewNoSave);
  try {
    if (a) { a.disabled = true; const { error } = await sb.rpc("kid_redeem", { p_reward: a.dataset.redeem }); if (error) throw new Error(/not_enough/.test(error.message) ? L.notEnough : /too_many/.test(error.message) ? L.tooMany : error.message); setStatus(L.sent); confetti(); }
    else { const { error } = await sb.rpc("kid_cancel_redeem", { p_id: c.dataset.unredeem }); if (error) throw error; }
    await loadAll(); kidRender();
  } catch (err) { setStatus(err.message, true); if (a) a.disabled = false; }
});

/* parents: 🎁 Rewards page */
let rwKid = null;
function viewRewards() {
  const t = T(), L = PLL(), zh = lang === "zh"; rwKid ||= S.kids[0]?.id;
  const pend = (S.redemptions || []).filter(r => r.status === "requested").sort((a, b) => a.requested_at.localeCompare(b.requested_at));
  const p = ptsOf(rwKid), k = S.kids.find(x => x.id === rwKid) || {};
  const habits = S.metrics.filter(m => m.kid === rwKid), goals = S.goals.filter(g => g.kid === rwKid && g.status !== "proposed" && !g.done);
  $("#view").innerHTML = `<div class="section-h"><h3>🎁 ${zh ? "积分与奖励" : "Points & rewards"}</h3></div>
    <div class="rwgrid">${S.kids.map(x => { const q = ptsOf(x.id); return `<div class="rwk" style="--kc:${calCol(x.id)}"><b>${esc(kidName(x.id))}</b><div><span>${q.balance}</span><small>${L.bal}</small></div><div><span>${q.life}</span><small>${L.life}</small></div><div><span>+${q.week}</span><small>${L.week}</small></div></div>`; }).join("")}</div>
    ${parentChallengeHtml()}
    <div class="card rwcard"><h4>⏳ ${zh ? "等待确认的兑换" : "Requests waiting for you"} (${pend.length})</h4>${pend.length ? pend.map(r => `<div class="rwreq"><div><b>${esc(kidName(r.kid))}</b> · ${esc(r.title)} · ${r.cost} ${zh ? "分" : "pts"}<div class="meta">${new Date(r.requested_at).toLocaleString()}</div></div>
      <input class="rwnote" data-note="${r.id}" maxlength="200" placeholder="${zh ? "备注（可选）" : "Note (optional)"}"><button class="btn sm primary" data-decide="${r.id}" data-ok="1">${zh ? "同意" : "Approve"}</button><button class="btn sm" data-decide="${r.id}" data-ok="0">${zh ? "不同意" : "Decline"}</button></div>`).join("") : `<div class="meta">${zh ? "没有等待中的兑换。" : "Nothing waiting."}</div>`}</div>
    <div class="tabs" style="margin:18px 0 12px;width:max-content;max-width:100%">${S.kids.map(x => `<button class="${x.id === rwKid ? "on" : ""}" data-rwk="${esc(x.id)}">${esc(kidName(x.id))}</button>`).join("")}</div>
    ${(() => { const SRC = { checkin: ["✅", "Check-ins", "打卡"], habit: ["💪", "Habits", "习惯"], weekly: ["📅", "Weekly goals", "每周目标"], level: ["📈", "Score goals", "分数目标"], goal: ["🎯", "Goals done", "完成目标"], idea: ["💡", "Goal ideas", "目标建议"], win: ["⭐", "Wins", "进步"], praise: ["👀", "Noticed by you", "爸妈看到"], journal: ["📓", "Journal", "日记"], app: ["🎮", "Learning apps", "学习应用"], bonus: ["🌟", "Bonus", "额外奖励"], penalty: ["🔁", "Repeated mistakes", "重复犯错"], adjust: ["✏️", "Parent corrections", "家长调整"] };
      const w = addDays(today(), -6), rows = (S.point_ledger || []).filter(r => r.kid === rwKid && r.date >= w && r.source !== "spend" && r.source !== "carryover"), by = {};
      rows.forEach(r => by[r.source] = (by[r.source] || 0) + r.points); const tot = Object.values(by).reduce((a, b) => a + b, 0), max = Math.max(1, ...Object.values(by));
      return `<div class="card rwcard" style="margin-bottom:16px"><h4>📊 ${esc(kidName(rwKid))} · ${zh ? "最近 7 天积分来源" : "Where the points came from (7 days)"} <span class="meta">· ${tot}</span></h4>${tot ? Object.entries(by).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="rwsrc"><span>${(SRC[k] || ["•", k, k])[0]} ${zh ? (SRC[k] || [0, k, k])[2] : (SRC[k] || [0, k])[1]}</span><i><b style="width:${Math.round(100 * v / max)}%"></b></i><em>${v}</em></div>`).join("") : `<div class="meta">${zh ? "这周还没有积分。" : "No points yet this week."}</div>`}</div>`; })()}
    <div class="rwcols">
      <div class="card rwcard"><h4>🎚️ ${zh ? "难度（决定得分）" : "Difficulty (sets the points)"}</h4><p class="meta">${zh ? "习惯每次 5 × 难度；每周目标、新纪录、达成目标和完成目标也按难度加倍。" : "Each habit tap is 5 × difficulty; weekly bonuses, new bests, reaching a target and finishing a goal scale the same way."}</p>
        ${habits.map(m => `<div class="rwrow"><span>${esc(zh && m.name_zh ? m.name_zh : m.name)} <span class="meta">${m.type === "rate" ? (zh ? `每周 ${m.per_week} 次` : `${m.per_week}×/week`) : (zh ? "分数目标" : "score goal")}</span></span>${diffSelect("d", m.difficulty, `data-mdiff="${esc(m.id)}"`)}</div>`).join("") || `<div class="meta">—</div>`}
        ${goals.length ? `<h5>${zh ? "目标" : "Goals"}</h5>` + goals.map(g => `<div class="rwrow"><span>${esc(g.text)}</span>${diffSelect("d", g.difficulty, `data-gdiff="${g.id}"`)}</div>`).join("") : ""}
        <div class="rwrow" style="margin-top:12px"><span>📓 ${zh ? "日记最少字数（0 = 不限）" : "Journal minimum words (0 = no minimum)"}</span><input type="number" min="0" max="5000" step="50" value="${k.journal_min_words ?? 500}" data-jmin="${esc(rwKid)}" style="width:100px"></div>
        <div class="rwrow"><span>🔒 ${zh ? "每天先写日记才能用其他功能；错误太多会暂停所有积分" : "Journal required every day before apps open; too many mistakes pauses all points"}</span><input type="checkbox" data-jreq="${esc(rwKid)}" ${k.journal_required ? "checked" : ""}></div>
        ${k.journal_required ? `<div class="rwrow"><span>🗝️ ${zh ? "今天免写（只限今天）" : "Unlock today only (skip the journal today)"}</span><input type="checkbox" data-junlock="${esc(rwKid)}" ${k.journal_unlock_date === today() ? "checked" : ""}></div>
        <div class="meta" style="margin-top:4px">${(() => { const e = jToday(rwKid); if (!e) return zh ? "今天：还没写" : "Today: not written yet"; const w = e.words ?? wordCount(e.body), m = e.mistakes, lk = jLockAt(k, w);
          return m == null ? (zh ? `今天：${w} 字` : `Today: ${w} words`) : (m >= lk ? (zh ? `今天：${w} 字 · ${m} 个错误（最多 ${lk - 1} 个）` : `Today: ${w} words · ${m} mistakes (${lk - 1} allowed)`) : (zh ? `今天：${w} 字 · ${m} 个错误 · ✅` : `Today: ${w} words · ${m} mistakes · ✅`)); })()}${jBad(k) ? ` · <b>⏸️ ${zh ? `积分暂停中（${fmtDate(jBad(k).date)} 的日记有 ${jBad(k).mistakes} 个错误）` : `points paused (journal from ${fmtDate(jBad(k).date)} has ${jBad(k).mistakes} mistakes)`}</b>` : ""}</div>` : ""}</div>
      <div class="card rwcard"><h4>🌟 ${zh ? "额外奖励" : "Give bonus points"}</h4><p class="meta">${zh ? "表扬努力、勇气、善良——说清楚为什么。" : "Reward effort, courage or kindness — say what for."}</p>
        <form id="bonusForm" class="rwbonus"><input name="pts" type="number" min="1" max="500" value="20" required><input name="why" maxlength="120" required placeholder="${zh ? "为什么？例如：主动帮弟弟" : "What for? e.g. helped Jonah without being asked"}"><button class="btn sm primary">${zh ? "奖励" : "Give"} ${esc(kidName(rwKid))}</button></form>
        <h4 style="margin-top:18px">🧾 ${esc(kidName(rwKid))} · ${L.recent}</h4>${p.rows.slice(0, 25).map(r => `<div class="kpt"><span class="${r.points < 0 ? "neg" : ""}">${r.points > 0 ? "+" : ""}${r.points}</span>${esc(ledgerLabel(r))}<small>${fmtDate(r.date)}</small></div>`).join("") || `<div class="meta">—</div>`}</div></div>
    <div class="card rwcard" style="margin-top:16px"><h4>🛒 ${zh ? "奖励清单" : "Reward shop items"}</h4><p class="meta">${zh ? "大约：每天认真做 ≈ 60–100 分。" : "Rough guide: a solid day ≈ 60–100 points."}</p>
      ${(S.rewards || []).slice().sort((a, b) => a.cost - b.cost).map(r => `<div class="rwrow rwitem ${r.active ? "" : "off"}"><span>${esc(r.icon || "🎁")} ${esc(r.title)}${r.title_zh ? ` <span class="meta">${esc(r.title_zh)}</span>` : ""}${r.kid ? ` <span class="chip">${esc(kidName(r.kid))}</span>` : ""}</span>
        <input type="number" min="10" max="100000" value="${r.cost}" data-rcost="${r.id}" style="width:90px"><button class="btn sm" data-ract="${r.id}">${r.active ? (zh ? "下架" : "Hide") : (zh ? "上架" : "Show")}</button><button class="x" data-rdel="${r.id}">✕</button></div>`).join("")}
      <form id="rewardForm" class="rwadd"><input name="icon" maxlength="4" value="🎁" style="width:56px"><input name="title" required maxlength="80" placeholder="${zh ? "奖励（英文）" : "Reward"}"><input name="title_zh" maxlength="60" placeholder="中文（可选）"><input name="cost" type="number" min="10" max="100000" value="300" required style="width:90px">
        <select name="kid"><option value="">${zh ? "所有孩子" : "All boys"}</option>${S.kids.map(x => `<option value="${esc(x.id)}">${esc(kidName(x.id))}</option>`).join("")}</select><button class="btn sm primary">${zh ? "添加" : "Add"}</button></form></div>`;
}
document.addEventListener("click", async e => {
  if (document.body.classList.contains("kidmode")) return;
  const tab = e.target.closest("[data-rwk]"); if (tab) { rwKid = tab.dataset.rwk; return viewRewards(); }
  const dec = e.target.closest("[data-decide]");
  try {
    if (dec) { const note = document.querySelector(`[data-note="${dec.dataset.decide}"]`)?.value || null; const { error } = await sb.rpc("parent_decide_redemption", { p_id: dec.dataset.decide, p_approve: dec.dataset.ok === "1", p_note: note }); if (error) throw error; setStatus("✓"); return refresh(); }
    const act = e.target.closest("[data-ract]"); if (act) { const r = S.rewards.find(x => x.id === act.dataset.ract); const { error } = await sb.from("rewards").update({ active: !r.active }).eq("id", r.id); if (error) throw error; return refresh(); }
    const rd = e.target.closest("[data-rdel]"); if (rd) { if (!rd.dataset.armed) { rd.dataset.armed = 1; rd.textContent = "?"; return; } const { error } = await sb.from("rewards").delete().eq("id", rd.dataset.rdel); if (error) throw error; return refresh(); }
  } catch (err) { setStatus(err.message, true); }
});
document.addEventListener("change", async e => {
  const el = e.target; if (document.body.classList.contains("kidmode")) return;
  try {
    if (el.dataset.mdiff) { const { error } = await sb.from("metrics").update({ difficulty: el.value }).eq("id", el.dataset.mdiff); if (error) throw error; setStatus("✓ " + diffLabel(el.value)); return refresh(); }
    if (el.dataset.gdiff) { const { error } = await sb.from("goals").update({ difficulty: el.value }).eq("id", el.dataset.gdiff); if (error) throw error; setStatus("✓ " + diffLabel(el.value)); return refresh(); }
    if (el.dataset.jreq) { const { error } = await sb.from("kids").update({ journal_required: el.checked }).eq("id", el.dataset.jreq); if (error) throw error; setStatus("✓"); return refresh(); }
    if (el.dataset.junlock) { const { error } = await sb.from("kids").update({ journal_unlock_date: el.checked ? today() : null }).eq("id", el.dataset.junlock); if (error) throw error; setStatus("✓"); return refresh(); }
    if (el.dataset.jmin) { const { error } = await sb.from("kids").update({ journal_min_words: Math.max(0, Math.min(5000, +el.value || 0)) }).eq("id", el.dataset.jmin); if (error) throw error; setStatus("✓"); return refresh(); }
    if (el.dataset.rcost) { const { error } = await sb.from("rewards").update({ cost: Math.max(10, +el.value || 10) }).eq("id", el.dataset.rcost); if (error) throw error; setStatus("✓"); return refresh(); }
  } catch (err) { setStatus(err.message, true); }
});
document.addEventListener("submit", async e => {
  const f = e.target; if (f.id !== "bonusForm" && f.id !== "rewardForm") return; e.preventDefault();
  const v = Object.fromEntries(new FormData(f));
  try {
    if (f.id === "bonusForm") { const { error } = await sb.rpc("parent_bonus", { p_kid: rwKid, p_points: +v.pts, p_reason: v.why.trim() }); if (error) throw error; setStatus(`+${v.pts} → ${kidName(rwKid)} 🌟`); }
    else { const { error } = await sb.from("rewards").insert({ icon: v.icon || "🎁", title: v.title.trim(), title_zh: v.title_zh?.trim() || null, cost: +v.cost, kid: v.kid || null, sort: (S.rewards || []).length + 1 }); if (error) throw error; }
    refresh();
  } catch (err) { setStatus(err.message, true); }
});
// kid page jump bar: scroll to a section without touching the URL (the hash drives parent routing)
document.addEventListener("click", e => { const a = e.target.closest("[data-jump]"); if (!a) return; e.preventDefault(); document.getElementById(a.dataset.jump)?.scrollIntoView({ behavior: "smooth", block: "start" }); });

/* ---------------- 💵 WEEKLY $20 CHALLENGE: stars → exam → money ---------------- */
const mondayOf = d => { const t = new Date(d + "T12:00"); t.setDate(t.getDate() - ((t.getDay() + 6) % 7)); return t.toISOString().slice(0, 10); };
// ⭐ same rule as private.week_stars: self-logged wins and ideas earn points but don't count toward the $20 goal (Bobby 11/25)
const heldRefs = kid => new Set((S.integrity_flags || []).filter(f => f.kid === kid && f.status === "open").flatMap(f => f.refs || []));
const weekStars = (kid, wk) => { const held = heldRefs(kid); return (S.point_ledger || []).filter(r => r.kid === kid && r.date >= wk && r.date <= addDays(wk, 6) && !["spend", "carryover", "win", "idea"].includes(r.source) && !held.has(r.ref)).reduce((a, r) => a + r.points, 0); };
const heldPts = (kid, wk) => { const held = heldRefs(kid); return (S.point_ledger || []).filter(r => r.kid === kid && r.date >= wk && r.date <= addDays(wk, 6) && held.has(r.ref)).reduce((a, r) => a + r.points, 0); };
window.fhSetting = (kid, key) => { const x = (S.integrity_settings || []).find(s => s.kid === kid && s.key === key); return x ? x.value : null; }; // read by the apps (e.g. min answer seconds)
const CH = {
  en: { h: "Weekly $ challenge", stars: "Stars this week", goal: "goal", left: n => `${n} more stars to unlock the exam`, ready: "You reached your goal! Pass the exam to earn", take: "📝 Take the exam", cont: "▶ Continue the exam",
    rules: n => `${n} questions · you need 80% · a hint after every mistake · 2 tries`, passed: amt => `🎉 You passed! You earned $${amt} this week.`, paid: "Paid ✓", waiting: "Mom or Dad will pay you soon.",
    failed1: (s, t) => `Try 1: ${s}/${t}. Not yet, but you get one more try!`, review: "👀 Review my mistakes", try2: "🎯 Start Try 2", try2note: "Try 2 is built from your mistakes, with extra questions on those topics.",
    failed2: (s, t) => `Try 2: ${s}/${t}. Not this week. Keep practicing — a new challenge starts Monday!`, days: n => n === 0 ? "last day!" : `${n} day${n > 1 ? "s" : ""} left`, last: "Last week's challenge (today only)",
    q: (i, n) => `Question ${i} of ${n}`, check: "Check", next: "Next →", right: "✅ Right!", hint: "💡 Hint", again: "Try again", answerIs: "The answer is", finish: "See my score", close: "Save & close", why: "Why",
    result: (s, t, m) => `${s} / ${t} (you needed ${m})`, focus: "Try 2 will focus on:", later: "Later", yourAns: "your answer", typeAns: "Type your answer", unit: "unit", loading: "Building your exam…", listen: "🔊 Listen" },
  zh: { h: "每周 $ 挑战", stars: "本周星星", goal: "目标", left: n => `再得 ${n} 颗星就能解锁考试`, ready: "你达到目标了！通过考试就能得到", take: "📝 开始考试", cont: "▶ 继续考试",
    rules: n => `${n} 道题 · 需要 80% · 每次做错都有提示 · 2 次机会`, passed: amt => `🎉 你通过了！本周赚到 $${amt}。`, paid: "已发放 ✓", waiting: "爸爸妈妈很快会给你。",
    failed1: (s, t) => `第 1 次：${s}/${t}。还差一点，你还有一次机会！`, review: "👀 看看我的错题", try2: "🎯 开始第 2 次", try2note: "第 2 次会根据你的错题出题，在那些知识点上多练几道。",
    failed2: (s, t) => `第 2 次：${s}/${t}。这周没通过。继续练习——下周一重新开始！`, days: n => n === 0 ? "最后一天！" : `还剩 ${n} 天`, last: "上周的挑战（仅限今天）",
    q: (i, n) => `第 ${i} / ${n} 题`, check: "检查", next: "下一题 →", right: "✅ 答对了！", hint: "💡 提示", again: "再试一次", answerIs: "正确答案是", finish: "看我的成绩", close: "保存并关闭", why: "为什么",
    result: (s, t, m) => `${s} / ${t}（需要 ${m}）`, focus: "第 2 次会重点考：", later: "稍后", yourAns: "你的答案", typeAns: "输入答案", unit: "单位", loading: "正在出题…", listen: "🔊 听题" } };
const CHL = () => CH[lang] || CH.en;
function challengeState(k) {
  const td = today(), cw = mondayOf(td), isMon = new Date(td + "T12:00").getDay() === 1, goal = k.weekly_goal || 500;
  const exams = wk => (S.weekly_exams || []).filter(e => e.kid === k.id && e.week === wk).sort((a, b) => a.attempt - b.attempt);
  const pay = wk => (S.allowance_payouts || []).find(p => p.kid === k.id && p.week === wk);
  // Monday grace: finish last week's challenge if he reached the goal and still has a try
  const pw = addDays(cw, -7), pe = exams(pw);
  if (isMon && weekStars(k.id, pw) >= goal && !pay(pw) && !(pe.length === 2 && pe[1].status !== "in_progress")) return { wk: pw, last: true, goal, stars: weekStars(k.id, pw), ex: pe, pay: null };
  return { wk: cw, last: false, goal, stars: weekStars(k.id, cw), ex: exams(cw), pay: pay(cw) };
}
function kidChallengeHtml(k) {
  const L = CHL(), st = challengeState(k), amt = ((k.allowance_cents ?? 2000) / 100).toFixed(0), pct = Math.min(100, Math.round(100 * st.stars / st.goal));
  const e1 = st.ex.find(e => e.attempt === 1), e2 = st.ex.find(e => e.attempt === 2), inProg = st.ex.find(e => e.status === "in_progress");
  const daysLeft = Math.max(0, 6 - Math.round((new Date(today() + "T12:00") - new Date(st.wk + "T12:00")) / 864e5));
  let body;
  if (st.pay) body = `<div class="chres ok">${L.passed(amt)}<br><small>${st.pay.status === "paid" ? L.paid : L.waiting}</small></div>`;
  else if (inProg) body = `<button class="btn primary chbig" data-exam="${inProg.attempt}">${L.cont}</button>`;
  else if (e2 && e2.status === "failed") body = `<div class="chres">${L.failed2(e2.score, e2.total)}</div><button class="btn sm" data-exreview="${e2.id}">${L.review}</button>`;
  else if (e1 && e1.status === "failed") body = `<div class="chres">${L.failed1(e1.score, e1.total)}</div><p class="meta">${L.try2note}</p><div class="chbtns"><button class="btn" data-exreview="${e1.id}">${L.review}</button><button class="btn primary" data-exam="2">${L.try2}</button></div>`;
  else if (st.stars >= st.goal) body = `<div class="chres ok">${L.ready} <b>$${amt}</b>!</div><p class="meta">${L.rules(k.id === "jonah" ? 8 : k.id === "eric" ? 12 : 10)}</p><button class="btn primary chbig" data-exam="1">${L.take}</button>`;
  else body = `<p class="meta">${L.left(st.goal - st.stars)} · ${L.days(daysLeft)}</p>`;
  const eb = { voxel: ["Earn it", "赚钱"], pixel: ["Weekly boss", "每周首领"] }[kiTheme()];
  return `<div class="kw-h">${eb ? `<span class="kw-eyebrow">${lang === "zh" ? eb[1] : eb[0]}</span>` : ""}<span class="kw-ht">${KI("coin", 28)} ${L.h.replace("$", "$" + amt)}</span>${st.last ? `<span class="tagc">${L.last}</span>` : ""}</div>
    <div class="kw-card kch"><div class="chtop"><b>${L.stars}: ${st.stars} / ${st.goal}</b><span>${KI("star", 20)} ${pct}%</span></div><div class="chbar"><i style="width:${pct}%"></i></div>${body}${(h => h > 0 ? `<p class="meta" style="margin-top:8px">⏸️ ${lang === "zh" ? `${h} 分暂时不算，等爸爸妈妈看一下（比如打卡和应用里的记录对不上，或者关卡中离开了页面）。` : `${h} points are on hold until a parent checks them (for example, a habit tap the apps couldn't see, or leaving the page during a checkpoint).`}</p>` : "")(heldPts(k.id, st.wk))}</div>`;
}

/* ----- the exam screen ----- */
let EXS = null; // {id, attempt, qs, prog, i, kid, wk}
const loadScript = src => new Promise((res, rej) => { if (document.querySelector(`script[data-src="${src}"]`)) return res(); const s = document.createElement("script"); s.src = src; s.dataset.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
async function examBanks() { const v = "?v=20261125xl1"; await Promise.all(["physics/lessons.js", "quest/gen.js", "amc/lessons.js", "exam/banks.js", "amc/gym.js", "physics/gen.js"].map(s => loadScript(s + v))); await Promise.all(["amc/gym2.js", "exam/exam.js"].map(s => loadScript(s + v))); }
const speak = txt => { try { if (!window.speechSynthesis || !txt) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(txt); u.rate = .9; u.lang = "en-US"; speechSynthesis.speak(u); } catch (e) {} };
async function startExam(attempt) {
  const k = S.kids[0], L = CHL(); if (preview) return setStatus(T().previewNoSave);
  const st = challengeState(k);
  const ov = document.createElement("div"); ov.className = "exov"; ov.innerHTML = `<div class="exbox"><div class="meta" style="text-align:center;padding:40px">${L.loading}</div></div>`; document.body.appendChild(ov);
  try {
    await examBanks();
    let qs;
    const existing = st.ex.find(e => e.attempt === attempt && e.status === "in_progress");
    if (!existing) {
      const { data: saves } = await sb.from("app_saves").select("app,data").eq("kid", k.id); // 🔒 questions he has already seen (apps + every earlier exam) are skipped
      const prevQs = (S.weekly_exams || []).filter(e => e.kid === k.id).flatMap(e => (e.questions || []).map(q => q.q));
      if (attempt === 1) { const ph = (saves || []).find(s => s.app === "physics"); qs = EXAM.buildTry1(k.id, saves || [], { prevQs, physicsClassNow: ph && ph.data && ph.data[`${k.id}_physics_progress`] && ph.data[`${k.id}_physics_progress`].classNow }); }
      else { const e1 = st.ex.find(e => e.attempt === 1); const missed = e1.questions.filter((q, i) => !(e1.progress[i] || {}).firstOk).map(q => q.topic), passedT = e1.questions.filter((q, i) => (e1.progress[i] || {}).firstOk).map(q => q.topic); qs = EXAM.buildTry2(k.id, missed, passedT, saves || [], prevQs); }
    }
    const { data, error } = await sb.rpc("exam_start", { p_week: st.wk, p_attempt: attempt, p_questions: qs || [] }); if (error) throw error;
    EXS = { id: data.id, attempt, qs: data.questions, prog: data.progress, i: Math.max(0, data.progress.findIndex(p => !p.done)), kid: k.id, ov, fb: null, left: 0 };
    if (EXS.i < 0) EXS.i = EXS.qs.length; renderExam();
  } catch (err) { ov.remove(); setStatus(err.message, true); }
}
function renderExam() {
  const L = CHL(), E = EXS, box = E.ov; if (E.i >= E.qs.length) return finishExam();
  const q = E.qs[E.i], p = E.prog[E.i] || {}, little = E.kid === "jonah", fb = E.fb;
  const dots = E.qs.map((_, j) => { const pp = E.prog[j] || {}; return `<i class="${j === E.i ? "on" : pp.done ? (pp.firstOk ? "ok" : "no") : ""}"></i>`; }).join("");
  const input = q.type === "mc" ? `<div class="exch ${little ? "big" : ""}">${q.c.map((c, j) => `<button data-exc="${j}" ${fb && (fb.done || fb.correct) ? "disabled" : ""}>${esc(c)}</button>`).join("")}</div>`
    : `<div class="exnum"><input id="exIn" inputmode="decimal" autocomplete="off" placeholder="${L.typeAns}" ${fb && fb.done ? "disabled" : ""}>${q.units ? `<select id="exUnit">${q.units.map(u => `<option>${esc(u)}</option>`).join("")}</select>` : ""}<button class="btn primary" id="exGo" ${fb && fb.done ? "disabled" : ""}>${L.check}</button></div>`;
  const fbHtml = !fb ? "" : fb.correct ? `<div class="exfb ok">${L.right}${fb.why ? `<div class="why">${esc(fb.why)}</div>` : ""}</div>`
    : fb.done ? `<div class="exfb no">${L.answerIs} <b>${esc(fb.answer || "")}</b>${fb.why ? `<div class="why">${esc(fb.why)}</div>` : ""}</div>`
    : `<div class="exfb hint">${L.hint}: ${esc(fb.hint)}<div class="meta">${L.again}</div></div>`;
  const warn = E.warn ? `<div class="exfb no" style="margin-bottom:10px">🚪 ${lang === "zh" ? "你离开了考试页面，所以那道题算错。请一直留在这个页面直到做完。<b>再离开一次，考试就结束。</b>" : "You left the exam page, so that question counts as wrong. Stay on this page until you finish. <b>Leaving again ends the exam.</b>"}</div>` : ""; E.warn = false;
  box.innerHTML = `<div class="exbox ${little ? "little" : ""}">${warn}<div class="exhead"><b>${KI("coin", 22)} ${lang === "zh" ? `第 ${E.attempt} 次` : `Try ${E.attempt}`} · ${L.q(E.i + 1, E.qs.length)}</b><button class="btn sm ghost" data-exclose>${L.close}</button></div>
    <div class="exdots">${dots}</div>${q.topicName ? `<div class="extopic">${esc(q.topicName)}</div>` : ""}
    <div class="exq">${esc(q.q)}</div>${little || q.tts ? `<button class="btn sm" data-exsay>${L.listen}</button>` : ""}
    ${input}${fbHtml}${fb && (fb.done || fb.correct) ? `<div class="exnext"><button class="btn primary" data-exnext>${E.i === E.qs.length - 1 ? L.finish : L.next}</button></div>` : ""}</div>`;
  if (!fb && (little || q.tts)) speak(q.tts || q.q);
  const inp = box.querySelector("#exIn"); if (inp && !(fb && fb.done)) { inp.focus(); inp.onkeydown = e => { if (e.key === "Enter") box.querySelector("#exGo").click(); }; }
}
/* 🔒 Bobby 11/25 "make sure there is no loopholes": the $20 exam can't be closed or left to look things up.
   Leaving the page (another tab or app) or closing the exam counts the current question as wrong. Leaving a second time ends the exam. */
async function examVoid(E) { const p = E.prog[E.i] || {}; if (!E || E.i >= E.qs.length || p.done) return;
  for (let t = 0; t < 2; t++) { const { data, error } = await sb.rpc("exam_answer", { p_id: E.id, p_idx: E.i, p_answer: "__left__" }); if (error) break; E.prog[E.i] = Object.assign({}, E.prog[E.i], { tries: (E.prog[E.i].tries || 0) + 1, done: data.done, firstOk: (E.prog[E.i].tries || 0) === 0 ? false : E.prog[E.i].firstOk, left: true }); if (data.done) break; } }
let exHidAt = 0;
document.addEventListener("visibilitychange", async () => { const E = EXS; if (!E || preview || E.kid === "jonah" || !document.body.contains(E.ov)) return; // Jonah (5) is exempt
  if (document.hidden) { exHidAt = Date.now(); return; } if (!exHidAt || Date.now() - exHidAt < 3000) { exHidAt = 0; return; } exHidAt = 0; E.left = (E.left || 0) + 1;
  try { if (E.left >= 2) { while (E.i < E.qs.length) { await examVoid(E); E.i++; } E.fb = null; renderExam(); return; } await examVoid(E); E.i++; E.fb = null; E.warn = true; renderExam(); } catch (e) { setStatus(e.message, true); } });
async function examAnswer(ans) {
  const E = EXS; try {
    const { data, error } = await sb.rpc("exam_answer", { p_id: E.id, p_idx: E.i, p_answer: String(ans) }); if (error) throw error;
    E.fb = data; E.prog[E.i] = Object.assign({}, E.prog[E.i], { tries: (E.prog[E.i].tries || 0) + 1, done: data.done, firstOk: data.firstTry ? data.correct : E.prog[E.i].firstOk });
    if (data.correct && data.firstTry) { try { confetti(); } catch (e) {} }
    if (!data.correct && !data.done && (E.kid === "jonah")) speak("Here's a hint. " + data.hint);
    renderExam();
  } catch (err) { setStatus(err.message, true); }
}
async function finishExam() {
  const L = CHL(), E = EXS; try {
    const { data, error } = await sb.rpc("exam_finish", { p_id: E.id }); if (error) throw error;
    const names = [...new Set(E.qs.filter((q, i) => !(E.prog[i] || {}).firstOk).map(q => q.topicName || q.topic))];
    E.ov.innerHTML = `<div class="exbox"><div class="exres ${data.passed ? "ok" : ""}">${data.passed ? "🎉" : E.attempt === 1 ? "💪" : "🌱"}<h2>${L.result(data.score, data.total, data.pass_mark)}</h2>
      <p>${data.passed ? L.passed(((S.kids[0].allowance_cents ?? 2000) / 100).toFixed(0)) + " " + L.waiting : E.attempt === 1 ? L.failed1(data.score, data.total) : L.failed2(data.score, data.total)}</p>
      ${!data.passed && E.attempt === 1 && names.length ? `<p><b>${L.focus}</b></p><ul class="exmiss">${names.map(n => `<li>${esc(n)}</li>`).join("")}</ul>` : ""}
      <div class="chbtns" style="justify-content:center">${!data.passed && E.attempt === 1 ? `<button class="btn" data-exdone>${L.later}</button><button class="btn primary" data-exam="2">${L.try2}</button>` : `<button class="btn primary" data-exdone>OK</button>`}</div></div></div>`;
    if (data.passed) { try { confetti(); setTimeout(confetti, 400); } catch (e) {} }
    await loadAll();
  } catch (err) { setStatus(err.message, true); }
}
function examReview(id) {
  const L = CHL(), e = (S.weekly_exams || []).find(x => x.id === id); if (!e) return;
  const ov = document.createElement("div"); ov.className = "exov";
  ov.innerHTML = `<div class="exbox"><div class="exhead"><b>${L.review}</b><button class="btn sm ghost" data-exdone>✕</button></div>${e.questions.map((q, i) => { const p = e.progress[i] || {}; if (p.firstOk) return ""; return `<div class="exrv"><div class="extopic">${esc(q.topicName || "")}</div><div class="exq sm">${esc(q.q)}</div>
    <div>${L.yourAns}: <b>${esc(q.type === "mc" && /^\d+$/.test(p.mine || "") ? (q.c || [])[+p.mine] || "" : (p.mine || "").replace("|", " "))}</b> · ${L.answerIs}: <b>${esc(p.answer || "")}</b></div>${p.why ? `<div class="why">${esc(p.why)}</div>` : ""}</div>`; }).join("") || `<p class="meta">—</p>`}</div>`;
  document.body.appendChild(ov);
}
document.addEventListener("click", e => {
  const t = e.target;
  const st = t.closest("[data-exam]"); if (st) { document.querySelectorAll(".exov").forEach(o => o.remove()); return startExam(+st.dataset.exam); }
  const rv = t.closest("[data-exreview]"); if (rv) return examReview(rv.dataset.exreview);
  if (t.closest("[data-exdone]")) { document.querySelectorAll(".exov").forEach(o => o.remove()); EXS = null; try { speechSynthesis.cancel(); } catch (x) {} if (document.body.classList.contains("kidmode")) kidRender(); return; }
  if (!EXS) return;
  if (t.closest("[data-exclose]")) { const E = EXS, open = E && E.kid !== "jonah" && E.i < E.qs.length && !(E.prog[E.i] || {}).done && !preview;
    if (open && !confirm(lang === "zh" ? "现在关闭，这道题会算错。确定关闭吗？" : "If you close now, this question counts as wrong. Close anyway?")) return;
    (open ? examVoid(E) : Promise.resolve()).finally(() => { E.ov.remove(); EXS = null; try { speechSynthesis.cancel(); } catch (x) {} loadAll().then(kidRender); }); return; }
  if (t.closest("[data-exsay]")) { const q = EXS.qs[EXS.i]; return speak(q.tts || q.q); }
  if (t.closest("[data-exnext]")) { EXS.i++; EXS.fb = null; return renderExam(); }
  const c = t.closest("[data-exc]"); if (c) return examAnswer(c.dataset.exc);
  if (t.id === "exGo") { const v = (document.getElementById("exIn").value || "").trim(); if (!v) return; const u = document.getElementById("exUnit"); return examAnswer(u ? `${v}|${u.value}` : v); }
});

/* ----- parents: the weekly challenge on the Rewards page ----- */
function parentChallengeHtml() {
  const zh = lang === "zh";
  const rows = S.kids.map(k => { const st = challengeState(k), e1 = st.ex.find(e => e.attempt === 1), e2 = st.ex.find(e => e.attempt === 2);
    const status = st.pay ? (zh ? "✅ 通过" : "✅ Passed") : e2 ? (e2.status === "in_progress" ? (zh ? "第 2 次进行中" : "Try 2 in progress") : (zh ? `两次未通过（${e1.score}/${e1.total}，${e2.score}/${e2.total}）` : `Not passed (${e1.score}/${e1.total}, ${e2.score}/${e2.total})`))
      : e1 ? (e1.status === "in_progress" ? (zh ? "第 1 次进行中" : "Try 1 in progress") : (zh ? `第 1 次 ${e1.score}/${e1.total}，还有 1 次` : `Try 1 ${e1.score}/${e1.total} · 1 try left`)) : st.stars >= st.goal ? (zh ? "🔓 可以考试" : "🔓 Exam unlocked") : (zh ? "积累中" : "Collecting stars");
    return `<div class="chrow"><b>${esc(kidName(k.id))}</b>
      <span>${st.stars} / <input type="number" min="50" max="10000" step="50" value="${st.goal}" data-wgoal="${esc(k.id)}" style="width:80px"> ${zh ? "星" : "stars"}</span>
      <span>$<input type="number" min="0" max="1000" step="1" value="${((k.allowance_cents ?? 2000) / 100)}" data-wamt="${esc(k.id)}" style="width:64px"></span>
      <span>${status}</span>
      ${st.pay ? (st.pay.status === "paid" ? `<span class="meta">${zh ? "已发放" : "Paid"} ${st.pay.paid_at ? fmtDate(st.pay.paid_at.slice(0, 10)) : ""} <button class="btn sm ghost" data-unpay="${st.pay.id}">${zh ? "撤销" : "Undo"}</button></span>` : `<button class="btn sm primary" data-pay="${st.pay.id}">💵 ${zh ? `标记已付 $${(st.pay.amount_cents / 100).toFixed(0)}` : `Mark $${(st.pay.amount_cents / 100).toFixed(0)} paid`}</button>`) : "<span></span>"}
      ${st.ex.filter(e => e.status !== "in_progress").map(e => `<button class="btn sm ghost" data-pexam="${e.id}">${zh ? `第 ${e.attempt} 次详情` : `Try ${e.attempt} details`}</button>`).join("")}</div>`; }).join("");
  const hist = (S.allowance_payouts || []).slice().sort((a, b) => b.week.localeCompare(a.week)).slice(0, 12);
  return `<div class="card rwcard" style="margin-bottom:16px"><h4>💵 ${zh ? "每周挑战：星星 → 考试 → 零花钱" : "Weekly challenge: stars → exam → money"}</h4>
    <p class="meta">${zh ? "达到本周星星目标后解锁考试。80% 通过，2 次机会，每次做错有提示；第 2 次按错题出题。考试答案在服务器上判分。" : "Reaching the week's star goal unlocks the exam. 80% to pass, 2 tries, a hint after each mistake; try 2 is built from the mistakes. Answers are graded on the server."}</p>
    ${rows}${hist.length ? `<h5>${zh ? "记录" : "History"}</h5>${hist.map(p => `<div class="kpt"><span>$${(p.amount_cents / 100).toFixed(0)}</span>${esc(kidName(p.kid))} · ${zh ? "第" : "week of"} ${fmtDate(p.week)}<small>${p.status === "paid" ? (zh ? "已发放" : "paid") : (zh ? "待发放" : "to pay")}</small></div>`).join("")}` : ""}</div>`;
}
async function parentExamDetail(id) {
  const zh = lang === "zh", e = (S.weekly_exams || []).find(x => x.id === id); if (!e) return;
  const { data: keys } = await sb.from("exam_keys").select("idx,key").eq("exam_id", id);
  const K = Object.fromEntries((keys || []).map(r => [r.idx, r.key]));
  const ov = document.createElement("div"); ov.className = "exov";
  ov.innerHTML = `<div class="exbox"><div class="exhead"><b>${esc(kidName(e.kid))} · ${zh ? `第 ${e.attempt} 次` : `Try ${e.attempt}`} · ${e.score}/${e.total}</b><button class="btn sm ghost" data-exdone>✕</button></div>${e.questions.map((q, i) => { const p = e.progress[i] || {}, k = K[i] || {};
    return `<div class="exrv ${p.firstOk ? "ok" : "no"}"><div class="extopic">${p.firstOk ? "✅" : p.ok ? "🟡" : "❌"} ${esc(q.topicName || q.topic || "")}</div><div class="exq sm">${esc(q.q)}</div><div class="meta">${zh ? "他的答案" : "His answer"}: ${esc(q.type === "mc" && /^\d+$/.test(p.mine || "") ? (q.c || [])[+p.mine] || "" : (p.mine || "—").replace("|", " "))} · ${zh ? "正确答案" : "Right answer"}: ${esc(k.answerText || "")}${p.tries > 1 ? ` · ${zh ? "用了提示" : "used the hint"}` : ""}</div></div>`; }).join("")}</div>`;
  document.body.appendChild(ov);
}
document.addEventListener("click", async e => {
  if (document.body.classList.contains("kidmode")) return;
  const pay = e.target.closest("[data-pay],[data-unpay]"), det = e.target.closest("[data-pexam]");
  try {
    if (pay) { const { error } = await sb.rpc("parent_mark_paid", { p_id: pay.dataset.pay || pay.dataset.unpay, p_paid: !!pay.dataset.pay }); if (error) throw error; setStatus("✓"); return refresh(); }
    if (det) return parentExamDetail(det.dataset.pexam);
  } catch (err) { setStatus(err.message, true); }
});
document.addEventListener("change", async e => {
  const el = e.target; if (!el.dataset.wgoal && !el.dataset.wamt) return;
  try { const patch = el.dataset.wgoal ? { weekly_goal: Math.max(50, Math.min(10000, +el.value || 500)) } : { allowance_cents: Math.round(Math.max(0, Math.min(1000, +el.value || 0)) * 100) };
    const { error } = await sb.from("kids").update(patch).eq("id", el.dataset.wgoal || el.dataset.wamt); if (error) throw error; setStatus("✓"); refresh(); } catch (err) { setStatus(err.message, true); }
});
