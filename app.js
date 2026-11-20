// Family Hub — static front end. All family data lives in a private Supabase
// database behind sign-in + row-level security. Nothing personal is in this repo.
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { STR } from "./i18n.js?v=20261119c";
import * as Pix from "./pixel.js?v=20261119c";

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
    const tables = ["kids", "entries", "goals", "metrics", "readings", "docs", "journal", "subjects"];
    const res = await Promise.all(tables.map(t => sb.from(t).select("*")));
    res.forEach((r, i) => { if (r.error) throw r.error; S[tables[i]] = r.data || []; });
    const m = await sb.rpc("kid_moods", { p_days: 400 }); S.moods = m.data || []; S.checkins = [];
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
  $("#root").innerHTML = `<div class="headline" style="margin-top:7vh">${T().signInHero}</div><div class="signin" style="margin-top:20px">
    <div style="display:flex;justify-content:space-between;align-items:center"><h1><span class="dotlogo" style="width:26px;height:26px;border-radius:50%;background:var(--lime);display:inline-grid;place-items:center;color:#0a0a0a;font-size:14px;vertical-align:3px">✦</span> ${T().signInTitle}</h1><button class="lang" id="langBtn">${lang === "en" ? "中文" : "English"}</button></div>
    <p class="meta">${T().signInSub}</p>
    <div class="tabs signin" style="margin:8px 0 14px"><button class="${siMode === "parent" ? "on" : ""}" data-mode="parent">${T().iAmParent}</button><button class="${siMode === "kid" ? "on" : ""}" data-mode="kid">${T().iAmKid}</button></div>
    ${siMode === "parent" ? `<button class="btn gbtn" id="gBtn" type="button"><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg> ${T().withGoogle}</button><div class="ordiv"><span>${T().orEmail}</span></div><form id="siForm"><label>${T().emailLabel}</label><input type="email" id="siEmail" required autocomplete="email"><button class="btn primary" style="width:100%;margin-top:12px">${T().sendLink}</button></form>`
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
  $("#gBtn").onclick = async () => {
    const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname, queryParams: { prompt: "select_account" } } });
    if (error) $("#siMsg").textContent = /provider is not enabled|Unsupported provider/i.test(error.message) ? T().googleOff : error.message;
  };
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
  // Google sign-in comes back with an error in the URL when the account isn't on the family list
  const qs = new URLSearchParams(location.search + "&" + location.hash.slice(1));
  const authErr = qs.get("error_description");
  if (authErr) history.replaceState(null, "", location.pathname);
  const { data } = await sb.auth.getSession();
  S.user = data?.session?.user || null;
  sb.auth.onAuthStateChange((_e, session) => { const was = !!S.user; S.user = session?.user || null; if (!!S.user !== was) boot(); });
  if (authErr && !S.user) return renderSignIn(/family list|Database error/i.test(authErr) ? T().notListed : authErr);
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
    <div class="brand"><span class="dotlogo">✦</span>${T().appTitle}</div>
    <nav class="nav">${ROUTES.map(r => `<a href="#${r}" data-r="${r}">${T()["nav" + { today: "Today", dashboard: "Dash", subjects: "Subjects", log: "Log", plans: "Plans", reports: "Reports", family: "Family" }[r]]}</a>`).join("")}</nav>
    <button class="lang" id="langBtn">${lang === "en" ? "中文" : "English"}</button>
    <button class="btn sm" id="lockBtn">${T().kidsMode}</button>
    <button class="btn sm ghost" id="soBtn">${T().signOut}</button></div></div>
    <div class="wrap"><div class="status" id="status"></div><div id="view"></div></div>`;
  $("#langBtn").onclick = toggleLang;
  $("#soBtn").onclick = async () => { await sb.auth.signOut(); };
  $("#lockBtn").onclick = lockDevice;
}
window.addEventListener("hashchange", route);
function route() {
  if (!S.user || isKid()) return;
  if (!$("#view")) return;
  if (isLocked()) { $(".topbar .nav") && ($(".topbar .nav").style.display = "none"); openLobby(); return; }
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
  $("#view").innerHTML = `<div class="headline">${T().heroHtml}</div>${heroPills()}<div class="hero">
      <button class="herobtn" style="background:var(--lime)" id="goKids">🧒 ${T().kidsTapIn}<small>${T().kidsTapInSub}</small></button>
      <button class="herobtn" style="background:var(--pink)" id="goQuick">⚡ ${T().parentCheckin}<small>${T().parentCheckinSub}</small></button>
    </div>
    <div class="section-h"><h3>${T().todayStatus} · ${fmtDate(d)}</h3><button class="btn sm" id="goLog">${T().logEntry}</button></div>
    <div class="todayrow">${S.kids.map((k, i) => { const c = S.checkins.find(c => c.kid === k.id && c.date === d) || {};
      const habits = S.metrics.filter(m => m.kid === k.id && m.type === "rate").map(m => { const r = S.readings.find(r => r.metric === m.id && r.date === d); return r && +r.value ? mKidLabel(m) : null; }).filter(Boolean);
      return `<div class="tcard" style="border-top:4px solid ${KC[i % 3]};display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center"><span style="width:52px;height:52px;border-radius:14px;background:#fff;display:grid;place-items:center">${avatarHtml(k.avatar, 46)}</span><div><b>${esc(kidName(k.id))}</b>
        <div class="meta">${c.kid_mood ? `${T().heSaid} ${FACES[c.kid_mood - 1]}` : T().notYet} · ${c.focus ? `${T().parentRated} ✓` : `${T().parentRated} —`}</div>
        ${habits.length ? `<div class="meta">${esc(habits.join(" · "))}</div>` : ""}</div></div>`; }).join("")}</div>${marquee()}`;
  $("#goKids").onclick = openKidMode; $("#goQuick").onclick = openQuick; $("#goLog").onclick = () => openEntry();
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

/* ---------------- PARENT QUICK CHECK-IN ---------------- */
const qSt = {};
function openQuick() { if (isLocked()) return; $("#qDate").value = today(); $("#qErr").textContent = ""; Object.keys(qSt).forEach(k => delete qSt[k]); quickRender(); $("#quickMode").classList.add("open"); }
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
      <div class="kid-top"><div><h2 style="display:flex;align-items:center;gap:8px"><span style="display:inline-flex;width:40px;height:40px;border-radius:12px;background:#fff;align-items:center;justify-content:center;overflow:hidden">${avatarHtml(k.avatar, 36)}</span>${esc(kidName(k.id))}</h2><div class="meta">${meta}</div>${k.focus ? `<div class="meta"><b style="color:var(--ink)">${t.focusNow}:</b> ${esc(k.focus)}</div>` : ""}</div>
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
const AVATARS = ["🦊","🦁","🐼","🐯","🐸","🐨","🦄","🐲","🐙","🦖","🐵","🐧","🦉","🐬","🚀","⚽","🤺","🎸"];
const LEVEL_AT = [0, 50, 150, 300, 500, 800];
const BADGES = [["first","👣"],["s3","🔥"],["s7","⚡"],["s14","🌟"],["hero","🦸"],["stars5","⭐"],["stars20","🏅"],["writer","✏️"],["dreamer","💡"],["explorer","🧭"],["champ","🏆"]];
function kidGame() {
  const d = today(), moodDays = new Set(S.moods.map(m => m.date));
  const rateIds = new Set(S.metrics.filter(m => m.type === "rate").map(m => m.id));
  const taps = S.readings.filter(r => rateIds.has(r.metric)).reduce((s, r) => s + (+r.value || 0), 0);
  const myWins = S.entries.filter(e => e.by_kid).length, jn = S.journal.length, ideas = S.goals.filter(g => g.proposed_by_kid).length;
  const xp = moodDays.size * 10 + taps * 5 + myWins * 8 + jn * 12 + ideas * 5;
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
function kidRender() {
  const t = T(), k = S.kids[0]; if (!k) return;
  document.body.classList.add("kidmode");
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
    if (m.type === "rate") { const c = cnt(m), n = Math.max(1, Math.min(10, m.per_week || 1)); return `<div class="kw-goal"><div class="gn">${esc(mKidLabel(m))}</div><div class="kw-stars">${Array.from({ length: n }, (_, i) => `<span class="${i < c ? "" : "off"}">⭐</span>`).join("")}</div><div class="kw-sub">${t.ofTarget(c, m.per_week)}${c >= m.per_week ? " 🎉" : ""}</div></div>`; }
    const cur = curLevel(m), span = (+m.target) - (+m.baseline), p = span ? clamp01((cur - (+m.baseline)) / span) : 1;
    return `<div class="kw-goal"><div class="gn">${esc(mName(m))}</div><div class="kw-rocket"><i style="width:${Math.round(p * 100)}%"></i><span style="left:${Math.max(6, Math.min(88, p * 100))}%">🚀</span><em>🏁</em></div><div class="kw-sub">${t.nowAt} ${cur}${esc(m.unit || "")} → ${+m.target}${esc(m.unit || "")}</div></div>`;
  };
  const worlds = S.subjects.filter(x => x.active).map(x => ({ x, ms: S.metrics.filter(m => m.subject_id === x.id), docs: S.docs.filter(dc => dc.subject_id === x.id) })).filter(w => w.ms.length || w.docs.length);
  const loose = S.metrics.filter(m => !S.subjects.some(x => x.active && x.id === m.subject_id));
  const looseDocs = S.docs.filter(dc => !S.subjects.some(x => x.active && x.id === dc.subject_id));
  const goals = S.goals.filter(x => x.status !== "proposed"), mine = S.goals.filter(x => x.status === "proposed");
  const wins = S.entries.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 18);
  const journal = S.journal.slice().sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)).slice(0, 10);
  const days = []; for (let i = 13; i >= 0; i--) { const dd = addDays(d, -i); days.push({ dd, m: S.moods.find(x => x.date === dd)?.kid_mood }); }
  const pct = g.nextAt > g.curAt ? Math.round(100 * (g.xp - g.curAt) / (g.nextAt - g.curAt)) : 100;
  $("#root").innerHTML = `<div class="topbar"><div class="in"><div class="brand"><span class="dotlogo">✦</span>${esc(kidName(k.id))}</div>
      <button class="lang" id="langBtn">${lang === "en" ? "中文" : "English"}</button><button class="btn sm ghost" id="soBtn">${t.signOut}</button></div></div>
    <div class="wrap"><div class="status" id="status"></div>
      <div class="kw-hero" style="--kc:${kc}">
        <div class="kw-avatar" id="avBtn" title="${t.pickAvatar}">${avatarHtml(k.avatar || "🦊", 92)}</div>
        <div><h1>${t.hi(esc(kidName(k.id)))}</h1>
          <div class="kw-level"><span class="kw-lvl">${t.levelWord} ${g.lvlNum}</span><span>${esc(g.levelName)}</span><span style="margin-left:auto">${g.xp} ${t.xp}</span></div>
          <div class="kw-xpbar"><i style="width:${pct}%"></i></div><div class="kw-sub">${t.toNext(Math.max(0, g.nextAt - g.xp))}</div></div>
      </div>
      <div class="kw-row">
        <button class="kw-tap ${myMood ? "done" : "todo"}" id="kTap"><span class="big">${myMood ? FACES[myMood - 1] : "👋"}</span>${myMood ? t.checkedIn : t.tapToStart}</button>
        <div class="kw-streak ${g.streak ? "" : "rest"}"><span class="fire">🔥</span><div>${g.streak ? t.streak(g.streak) : t.streakRest}<div class="kw-sub" style="opacity:.7">${g.best ? "🏆 " + g.best : ""}</div></div></div>
      </div>
      ${worlds.length || loose.length || goals.length || mine.length ? `<div class="kw-h">🗺️ ${t.myWorlds}</div>
      <div class="kw-worlds">${worlds.map((w, i) => `<div class="kw-world" style="background:${worldColors[i % worldColors.length]}"><div class="wi">${w.x.icon}</div><h3>${esc(sName(w.x))}</h3>${sDesc(w.x) ? `<div class="wd">${esc(sDesc(w.x))}</div>` : ""}${w.ms.map(goalHtml).join("")}${w.docs.map(dc => `<a href="#" class="kw-doc" data-kdoc="${esc(dc.slug)}">📖 ${esc(lang === "zh" && dc.title_zh ? dc.title_zh : dc.title)}</a>`).join(" ")}</div>`).join("")}
        ${loose.length || goals.length || mine.length || looseDocs.length ? `<div class="kw-world" style="background:#e9e9e4"><div class="wi">🎯</div><h3>${t.myGoals}</h3>${loose.map(goalHtml).join("")}
          ${goals.map(x => `<div class="kw-goal"><span class="gn">${x.done ? "✅" : "⬜"} ${esc(x.text)}</span></div>`).join("")}
          ${mine.map(x => `<div class="kw-goal"><span class="gn">💡 ${esc(x.text)}</span><div class="kw-sub">${t.pending} <button class="x" style="opacity:1" data-unprop="${x.id}">✕</button></div></div>`).join("")}
          ${looseDocs.map(dc => `<a href="#" class="kw-doc" data-kdoc="${esc(dc.slug)}">📖 ${esc(lang === "zh" && dc.title_zh ? dc.title_zh : dc.title)}</a>`).join(" ")}
          <div class="addgoal" style="margin-top:12px"><input id="propIn" maxlength="120" placeholder="💡 ${t.suggestPh}" style="background:#fff;color:#111;border:2px solid #000"><button class="btn sm primary" id="propBtn" style="background:#000;color:#fff;border-color:#000">${t.suggest}</button></div></div>` : ""}
      </div>` : ""}
      <div id="kDocView" style="margin-top:14px"></div>
      <div class="kw-h">⭐ ${t.starJar}</div>
      <div class="kw-card">
        ${little ? `<div class="kw-sub" style="margin:0 0 10px;opacity:1">${t.tapAWin}</div><div class="kw-littlewins">${t.littleWins.map((w, i) => `<button data-lwin="${i}">⭐ ${esc(w)}</button>`).join("")}</div>`
                 : `<form id="winForm" class="addgoal" style="margin:0"><input id="winIn" maxlength="140" placeholder="⭐ ${t.winPh}" required><button class="btn sm primary">${t.addWin}</button></form>`}
        <div class="kw-jar" style="margin-top:14px">${wins.length ? wins.map(w => `<div class="kw-win">⭐ ${esc(w.title)}${w.by_kid ? `<button class="x" style="opacity:.5" data-delwin="${w.id}">✕</button>` : ""}</div>`).join("") : `<div class="meta">${t.noWinsYet}</div>`}</div>
      </div>
      <div class="kw-h">🌈 ${t.feelings}</div>
      <div class="kw-card"><div class="kw-mood">${days.map(x => `<div><div class="f ${x.m ? "" : "none"}">${x.m ? FACES[x.m - 1] : "○"}</div><small>${fmtDate(x.dd)}</small></div>`).join("")}</div></div>
      ${little ? "" : `<div class="kw-h">📓 ${t.secretNotebook} <span class="tagc">🔒</span></div>
      <div class="kw-notebook"><div style="font:600 12px var(--kfont);color:#888;line-height:20px">${t.journalPrivate}</div>
        <form id="jForm"><textarea id="jIn" maxlength="4000" placeholder="${t.journalPh}" required></textarea><button class="btn sm primary">${t.saveEntry}</button></form>
        ${journal.map(j => `<div class="entry"><small>${fmtDate(j.date)} <button class="x" style="opacity:.5;color:#888" data-delj="${j.id}">✕</button></small>${esc(j.body)}</div>`).join("")}</div>`}
      <div class="kw-h">🏅 ${t.stickerBook} <span class="tagc">${Object.values(g.got).filter(Boolean).length}/${BADGES.length}</span></div>
      <div class="kw-stickers">${BADGES.map(([id, em]) => `<div class="kw-sticker ${g.got[id] ? "" : "lock"} ${newly.includes(id) ? "got" : ""}"><span class="se">${g.got[id] ? em : "❔"}</span><b>${esc(t.badges[id][0])}</b><small>${g.got[id] ? esc(t.badges[id][1]) : t.locked}</small></div>`).join("")}</div>
      <div class="kw-card" style="margin-top:22px"><b style="font-family:var(--kfont)">✨ ${t.howEarn}</b><div class="kw-earn">${t.earnList.map(x => `<span>${esc(x)}</span>`).join("")}</div></div>
      ${marquee()}
    </div>
    <div class="modal-bg" id="avModal"><div class="modal" style="max-width:640px" id="avBody"></div></div>`;
  if (newly.length) { confetti(); setStatus(t.newBadge + " " + newly.map(b => BADGES.find(x => x[0] === b)[1]).join(" ")); }
  $("#langBtn").onclick = toggleLang; $("#soBtn").onclick = () => { document.body.classList.remove("kidmode"); sb.auth.signOut(); };
  const R = async fn => { try { await fn(); await loadAll(); kidRender(); } catch (err) { setStatus(err.message || "Save failed", true); } };
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
  if ($("#winForm")) $("#winForm").onsubmit = e => { e.preventDefault(); const v = $("#winIn").value.trim(); if (v) R(async () => { const { error } = await sb.from("entries").insert({ kid: k.id, date: today(), cat: "other", tone: "positive", title: v, by_kid: true }); if (error) throw error; }); };
  if ($("#jForm")) $("#jForm").onsubmit = e => { e.preventDefault(); const v = $("#jIn").value.trim(); if (v) R(async () => { const { error } = await sb.from("journal").insert({ kid: k.id, date: today(), body: v }); if (error) throw error; }); };
  $("#root").onclick = e => {
    const x = e.target.closest("[data-unprop],[data-delwin],[data-delj],[data-kdoc],[data-lwin]"); if (!x) return;
    if (x.dataset.lwin) R(async () => { const { error } = await sb.from("entries").insert({ kid: k.id, date: today(), cat: "other", tone: "positive", title: T().littleWins[+x.dataset.lwin], by_kid: true }); if (error) throw error; });
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
    el.innerHTML = `<div class="thanks">🎉</div><h2>${t.thanks(esc(kidName(k.id)))}</h2>`; confetti();
    setTimeout(async () => { $("#kidMode").classList.remove("open"); await loadAll(); kidRender(); }, 1400); };
  face();
}

start();
