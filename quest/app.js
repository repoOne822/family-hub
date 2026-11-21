// Realm of Forces: a turn-based dungeon RPG where every attack is a learning question.
// Physics questions come from ../physics/lessons.js (multiple choice) and gen.js (fresh numbers, typed answer + unit).
// Saves to localStorage `${kid}_quest_save`; the Family Hub syncs it to app_saves (app "quest").
(() => {
const QS = new URLSearchParams(location.search);
const KID = (QS.get("k") || "eric").toLowerCase().replace(/[^a-z]/g, "") || "eric";
const PARENT = QS.get("p") === "1";
const D = window.QDATA, LESSONS = window.PHY_LESSONS || [], { GEN, check, answerText, fmt } = window.QGEN;
const LMAP = Object.fromEntries(LESSONS.map(l => [l.id, l]));
const KEY = `${KID}_quest_save`;
const today = () => new Date().toLocaleDateString("en-CA");
const $ = s => document.querySelector(s), app = $("#app");
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const award = (ref, pts, label, zh) => { try { if (window.parent !== window && window.parent.fhAward) window.parent.fhAward("quest", ref, pts, label, zh); } catch (e) {} };

// ---------- save ----------
let P; try { P = JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { P = null; }
const fresh = () => ({ v: 1, hero: null, acts: {}, mastery: {}, log: [], daily: { date: today(), secs: 0 }, settings: { limit: 30, sound: true }, stats: { q: 0, ok: 0, kills: 0, deaths: 0 } });
if (!P) P = fresh();
P.settings = Object.assign({ limit: 30, sound: true }, P.settings || {});
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) {} };
const H = () => P.hero;
const actState = id => (P.acts[id] = P.acts[id] || { floor: 1, max: 1, cleared: false, bossBest: null, bossWins: 0 });

// ---------- time on task + daily limit (parents set it; default 30 min) ----------
let lastInput = Date.now();
["click", "keydown", "touchstart", "pointermove"].forEach(e => addEventListener(e, () => { lastInput = Date.now(); }, { passive: true }));
setInterval(() => {
  if (P.daily.date !== today()) P.daily = { date: today(), secs: 0 };
  if (document.visibilityState === "visible" && Date.now() - lastInput < 90000) { P.daily.secs += 5; if (P.daily.secs % 30 === 0) save(); }
}, 5000);
const overLimit = () => !PARENT && P.settings.limit > 0 && P.daily.date === today() && P.daily.secs >= P.settings.limit * 60;

// ---------- sound (tiny synth beeps) ----------
let AC = null;
const beep = (f, dur = .08, type = "square", vol = .05, slide = 0) => { if (!P.settings.sound) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = f; if (slide) o.frequency.linearRampToValueAtTime(f + slide, AC.currentTime + dur); g.gain.value = vol; g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + dur); o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime + dur); } catch (e) {} };
const SFX = { hit: () => beep(180, .12, "sawtooth", .06, -80), crit: () => { beep(520, .08); setTimeout(() => beep(780, .12), 70); }, hurt: () => beep(110, .18, "triangle", .08, -40), miss: () => beep(240, .15, "sine", .04, -120), loot: () => { beep(660, .07, "triangle"); setTimeout(() => beep(990, .1, "triangle"), 80); }, legend: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, .14, "triangle", .06), i * 90)), lvl: () => [392, 523, 659, 784].forEach((f, i) => setTimeout(() => beep(f, .12, "square", .04), i * 100)), heal: () => beep(440, .2, "sine", .05, 220) };

// ---------- hero stats ----------
const CLS = () => D.classes[H().cls];
function stats() {
  const h = H(), c = CLS(), s = { dmg: c.dmg + 2 * h.lvl + 3 * h.skills.might, arm: c.arm + h.lvl, hp: c.hp + 8 * h.lvl + 12 * h.skills.vit, crit: c.crit + 2 * h.skills.focus, gold: 0, xp: 0, swift: 2 * h.skills.focus, mp: 30 + 3 * h.lvl + (c.mp || 0) };
  Object.values(h.equip).forEach(it => { if (it) Object.entries(it.stats).forEach(([k, v]) => s[k] = (s[k] || 0) + v); });
  s.crit = Math.min(60, s.crit); s.clarity = 1 + Math.floor(h.skills.insight / 2); s.skillMult = c.skill.mult * (1 + .12 * h.skills.mastery);
  return s;
}
const xpNeed = l => Math.round(60 * Math.pow(l, 1.45));

// ---------- loot ----------
const ROLL = { dmg: l => ri(1, 2 + Math.ceil(l * .7)), arm: l => ri(1, 3 + l), hp: l => ri(4, 8 + 2 * l), crit: l => ri(1, 2 + Math.floor(l / 4)), gold: l => ri(5, 12 + l), xp: l => ri(4, 10 + l), swift: l => ri(1, 2 + Math.floor(l / 6)), mp: l => ri(3, 6 + l) };
const MAIN = { weapon: "dmg", helm: "hp", armor: "arm", boots: "arm", amulet: "mp", ring: "crit" };
function makeItem(ilvl, rarity, slot) {
  slot = slot || pick(Object.keys(D.slots));
  const tier = clamp(Math.floor(ilvl / 7), 0, 3), h = H();
  const base = slot === "weapon" ? D.bases.weapon[h.cls][tier] : D.bases[slot][tier];
  const stats = {}; const add = k => { stats[k] = (stats[k] || 0) + ROLL[k](ilvl); };
  add(MAIN[slot]); if (slot === "weapon") stats.dmg += 2 + tier * 2;
  let name = base;
  if (rarity === 3) { const L = D.legendary[slot]; L.stats.forEach(add); add(MAIN[slot]); Object.keys(stats).forEach(k => stats[k] = Math.round(stats[k] * 1.4)); name = L.name; return { id: Date.now() + "" + ri(100, 999), slot, name, base, rarity, ilvl, stats, flavor: L.flavor }; }
  const pool = Object.keys(ROLL).filter(k => k !== MAIN[slot]);
  const extra = shuffle(pool).slice(0, rarity === 0 ? 0 : rarity === 1 ? ri(1, 2) : ri(3, 4));
  extra.forEach(add);
  if (rarity === 1) { const [a, b] = extra; name = `${a ? D.prefixes[a] + " " : ""}${base}${b ? " " + D.suffixes[b] : ""}`; }
  if (rarity === 2) name = `${pick(D.rareA)} ${pick(D.rareB)}`;
  return { id: Date.now() + "" + ri(100, 999), slot, name, base, rarity, ilvl, stats };
}
const rollRarity = w => { const t = w.reduce((a, b) => a + b, 0); let x = Math.random() * t; for (let i = 0; i < w.length; i++) { if ((x -= w[i]) < 0) return i; } return 0; };
const itemIcon = it => it.slot === "weapon" ? D.classes[H().cls].weapon : D.slotIcon[it.slot];
const itemScore = it => it ? Object.entries(it.stats).reduce((a, [k, v]) => a + v * ({ dmg: 3, arm: 1.2, hp: .6, crit: 2.5, gold: .4, xp: .5, swift: 2, mp: .6 })[k], 0) : 0;
const sellPrice = it => Math.round((6 + it.ilvl * 2) * [1, 2.5, 6, 15][it.rarity]);
const RC = r => D.rarity[r][1];
const itemHtml = (it, cmp) => { const eq = H().equip[it.slot]; const diff = cmp ? itemScore(it) - itemScore(eq) : 0;
  return `<div class="item r${it.rarity}"><div class="iname" style="color:${RC(it.rarity)}">${itemIcon(it)} ${esc(it.name)}</div><div class="ibase">${D.rarity[it.rarity][0]} ${D.slots[it.slot]}${it.rarity && it.rarity < 3 ? " · " + esc(it.base) : ""} · ilvl ${it.ilvl}</div>
    ${Object.entries(it.stats).map(([k, v]) => `<div class="istat">+${v} ${D.statName[k]}</div>`).join("")}${it.flavor ? `<div class="iflav">“${esc(it.flavor)}”</div>` : ""}
    ${cmp ? `<div class="icmp ${diff > 0 ? "up" : diff < 0 ? "down" : ""}">${!eq ? "▲ empty slot" : diff > 0 ? "▲ better than equipped" : diff < 0 ? "▼ weaker than equipped" : "= same"}</div>` : ""}</div>`; };

// ---------- questions ----------
// skill key: lesson id for multiple choice, "g:<gen>" for generated problems
const skillName = k => k.startsWith("g:") ? GEN[k.slice(2)].name : (LMAP[k] ? `${LMAP[k].title} (concepts)` : k);
const actSkills = a => [...a.lessons, ...a.gens.map(g => "g:" + g)];
const recentQ = [];
function makeQ(act, level, purpose) {
  // purpose: normal | hard | boss | train:<key>
  let key;
  if (purpose.startsWith("train:")) key = purpose.slice(6);
  else { const useMC = act.lessons.length && Math.random() < (purpose === "boss" ? .45 : .5); key = useMC ? pick(act.lessons) : "g:" + pick(act.gens); }
  if (!key.startsWith("g:")) {
    const L = LMAP[key]; const bank = purpose === "boss" ? L.tq : purpose === "hard" ? [...L.ch, ...L.pr] : L.pr;
    let q; for (let i = 0; i < 8; i++) { q = pick(bank); if (!recentQ.includes(q.q)) break; }
    recentQ.push(q.q); if (recentQ.length > 12) recentQ.shift();
    const o = shuffle(q.c.map((c, j) => [c, j]));
    return { type: "mc", key, q: q.q, c: o.map(x => x[0]), a: o.findIndex(x => x[1] === q.a), hint: q.hint, why: q.why };
  }
  const d = purpose === "boss" ? 3 : purpose === "hard" ? clamp(level + 1, 1, 3) : level;
  const p = GEN[key.slice(2)].gen(d);
  return Object.assign({ type: "num", key, d }, p, { units: p.units ? shuffle(p.units) : null });
}
function record(q, ok, secs, ans) {
  const m = P.mastery[q.key] = P.mastery[q.key] || []; m.push(ok ? 1 : 0); if (m.length > 12) m.shift();
  P.stats.q++; if (ok) P.stats.ok++;
  P.log.push({ ts: Date.now(), d: today(), k: q.key, ok, secs, q: q.q.slice(0, 140), a: String(ans).slice(0, 40), r: q.type === "mc" ? q.c[q.a] : answerText(q) });
  if (P.log.length > 1500) P.log = P.log.slice(-1500);
}
const mastery = k => { const m = P.mastery[k] || []; return { n: m.length, pct: m.length ? Math.round(m.reduce((a, b) => a + b, 0) / m.length * 100) : 0 }; };
const mClass = k => { const { n, pct } = mastery(k); return n < 5 ? "m0" : pct >= 80 && n >= 8 ? "m3" : pct >= 60 ? "m2" : "m1"; };

// ---------- screens ----------
const top = (title, back) => `<div class="hdr">${back ? `<button class="btn ghost" id="back">← ${back}</button>` : ""}<h1>${title}</h1><span class="sp"></span>${H() ? `<span class="gold">🪙 ${H().gold}</span>` : ""}<button class="btn ghost sm" id="snd" title="Sound">${P.settings.sound ? "🔊" : "🔇"}</button></div>`;
const wire = (back) => { const b = $("#back"); if (b) b.onclick = back || town; const s = $("#snd"); if (s) s.onclick = () => { P.settings.sound = !P.settings.sound; save(); s.textContent = P.settings.sound ? "🔊" : "🔇"; }; };
const bar = (v, max, cls, label) => `<div class="bar ${cls}"><i style="width:${clamp(v / max * 100, 0, 100)}%"></i><span>${label || `${Math.max(0, Math.round(v))} / ${max}`}</span></div>`;

function create() {
  app.innerHTML = `<div class="title"><div class="logo">⚔️ Realm of Forces</div><div class="sub">力之境 · a turn-based dungeon crawl where knowledge is your weapon</div></div>
   <div class="panel"><h2>Choose your hero</h2><div class="classes">${Object.entries(D.classes).map(([id, c]) => `<button class="cls" data-c="${id}"><div class="big">${c.icon}</div><b>${c.name}</b> <span class="zh">${c.zh}</span><p>${c.blurb}</p><p class="skl">${c.skill.icon} ${c.skill.name}: ${c.skill.desc}</p></button>`).join("")}</div>
   <label class="nm">Hero name <input id="hname" maxlength="16" value="${esc(KID.charAt(0).toUpperCase() + KID.slice(1))}"></label>
   <p class="hint">How it works: every Strike is a question. Right answers hit (fast right answers dodge the counterattack and hit harder). Wrong answers miss, and you see the explanation so you learn it. Bosses are mastery tests for each unit.</p></div>`;
  app.querySelectorAll("[data-c]").forEach(b => b.onclick = () => {
    P.hero = { cls: b.dataset.c, name: ($("#hname").value || "Hero").slice(0, 16), lvl: 1, xp: 0, gold: 40, sp: 0, skills: { might: 0, vit: 0, focus: 0, insight: 0, mastery: 0 }, equip: { weapon: null, helm: null, armor: null, boots: null, amulet: null, ring: null }, bag: [], potions: 3 };
    P.hero.equip.weapon = makeItem(1, 0, "weapon"); save(); town();
  });
}

function town() {
  window.scrollTo(0, 0);
  if (!H()) return create();
  const h = H(), s = stats(), c = CLS();
  const mins = Math.floor(P.daily.secs / 60);
  app.innerHTML = top("🏰 Haven") + `
   <div class="panel herobox"><div class="portrait">${c.icon}</div><div class="hinfo"><div class="hname">${esc(h.name)} <span class="lv">Lv ${h.lvl} ${c.name}</span></div>
     ${bar(h.xp, xpNeed(h.lvl), "xp", `XP ${h.xp} / ${xpNeed(h.lvl)}`)}
     <div class="chips"><span>⚔️ ${s.dmg} dmg</span><span>🛡️ ${s.arm} armor</span><span>❤️ ${s.hp} HP</span><span>💥 ${s.crit}% crit</span><span>🔷 ${s.mp} mana</span><span>🧪 ${h.potions}</span></div></div></div>
   ${P.settings.limit ? `<div class="limit">⏳ Adventure time today: ${mins} / ${P.settings.limit} min</div>` : ""}
   <div class="tgrid">
     <button class="tbtn big" id="go"><span>🌀</span><b>Waypoints</b><small>Enter the dungeons</small></button>
     <button class="tbtn" id="bag"><span>🎒</span><b>Gear</b><small>${h.bag.length} in bag</small></button>
     <button class="tbtn" id="sk"><span>✨</span><b>Skills</b><small>${h.sp ? `<em>${h.sp} point${h.sp > 1 ? "s" : ""} to spend!</em>` : "Talent tree"}</small></button>
     <button class="tbtn" id="shop"><span>⚖️</span><b>Merchant</b><small>Potions · sell loot</small></button>
     <button class="tbtn" id="codex"><span>📖</span><b>Codex</b><small>Your mastery + training</small></button>
   </div>
   ${PARENT ? parentHtml() : ""}`;
  wire(() => {}); if ($("#back")) $("#back").remove();
  $("#go").onclick = waypoints; $("#bag").onclick = gear; $("#sk").onclick = skills; $("#shop").onclick = shop; $("#codex").onclick = codex;
  wireParent();
}

function waypoints() {
  window.scrollTo(0, 0);
  const acts = D.acts;
  const open = a => a.side || a.n === 1 || actState(acts[a.n - 2].id).cleared;
  app.innerHTML = top("🌀 Waypoints", "Haven") + `<div class="acts">${acts.map(a => { const st = actState(a.id), ok = open(a); return `<button class="act ${ok ? "" : "locked"}" data-a="${a.id}" style="--bg:${a.bg}"${ok ? "" : " disabled"}>
     <div class="aname">${a.side ? "📐" : "Act " + ["I", "II", "III", "IV", "V"][a.n - 1]} · ${esc(a.name)} <span class="zh">${a.zh}</span></div><div class="ablurb">${esc(a.blurb)}</div>
     <div class="aprog">${ok ? `${st.cleared ? `👑 Boss defeated (best ${st.bossBest}%)` : `Floor ${st.max} / 5`}` : "🔒 Defeat the previous act's boss"}</div>
     <div class="amobs">${a.mobs.map(m => m[0]).join(" ")} … ${a.boss[0]}</div></button>`; }).join("")}
     ${D.sealed.map(s => `<div class="act locked sealed"><div class="aname">${s[0]} ${s[1]}</div><div class="ablurb">${s[2]}: sealed. Coming soon.</div></div>`).join("")}</div>`;
  wire();
  app.querySelectorAll("[data-a]").forEach(b => b.onclick = () => floorPick(D.acts.find(a => a.id === b.dataset.a)));
}

function floorPick(act) {
  if (overLimit()) return rest();
  const st = actState(act.id);
  app.innerHTML = top(`${act.side ? "📐" : "Act " + act.n} · ${esc(act.name)}`, "Waypoints") + `<div class="panel"><p>${esc(act.blurb)} Choose a floor. Floor 5 holds the boss: <b>${act.boss[0]} ${esc(act.boss[1])}</b>.</p>
    <div class="floors">${[1, 2, 3, 4, 5].map(f => `<button class="floor ${f === 5 ? "bossf" : ""}" data-f="${f}"${f <= st.max ? "" : " disabled"}>${f === 5 ? act.boss[0] : "🕯️"}<b>Floor ${f}</b><small>${f === 5 ? (st.cleared ? "Boss (rematch)" : "BOSS") : f < st.max ? "cleared" : f === st.max ? "next" : "locked"}</small></button>`).join("")}</div></div>`;
  wire(waypoints);
  app.querySelectorAll("[data-f]").forEach(b => b.onclick = () => startRun(act, +b.dataset.f));
}

// ---------- a run: a floor = 3 rooms you choose between, then the stairs (floor 5 = boss) ----------
let RUN = null;
function startRun(act, floor) {
  const s = stats();
  RUN = { act, floor, step: 0, hp: s.hp, mp: s.mp, buff: 1, loot: [], gold: 0 };
  if (floor === 5) return bossIntro();
  doors();
}
function doors() {
  if (overLimit()) return rest();
  const { act, floor, step } = RUN, s = stats();
  if (step >= 3) return stairs();
  const kinds = [["fight", 5], ["elite", floor >= 2 ? 2 : 0], ["chest", 1.4], ["shrine", 1]];
  const pickKind = () => { const t = kinds.reduce((a, k) => a + k[1], 0); let x = Math.random() * t; for (const k of kinds) if ((x -= k[1]) < 0) return k[0]; return "fight"; };
  let opts = [pickKind(), pickKind()]; if (Math.random() < .5) opts.push(pickKind()); opts[0] = opts.includes("fight") ? opts[0] : "fight";
  const info = { fight: ["⚔️", "Monster", "A regular fight."], elite: ["💀", "Elite", "Tougher enemy, guaranteed magic loot. Harder questions."], chest: ["🧰", "Treasure", "Gold and an item. No fight."], shrine: ["⛲", "Shrine", "Heal up or get a power blessing."] };
  app.innerHTML = top(`${esc(act.name)} · Floor ${floor}`) + runBar() + `<div class="panel"><h2>Room ${step + 1} of 3: choose a door</h2><div class="doors">${opts.map((k, i) => `<button class="door" data-i="${i}"><div class="big">${info[k][0]}</div><b>${info[k][1]}</b><small>${info[k][2]}</small></button>`).join("")}</div>
    <div class="row"><button class="btn ghost" id="portal">🌀 Portal to town (keep loot)</button></div></div>`;
  wire();
  app.querySelectorAll("[data-i]").forEach(b => b.onclick = () => { const k = opts[+b.dataset.i]; if (k === "fight" || k === "elite") fight(k); else if (k === "chest") chest(); else shrine(); });
  $("#portal").onclick = () => endRun(false);
}
const runBar = () => { const s = stats(); return `<div class="runbar">${bar(RUN.hp, s.hp, "hp")}${bar(RUN.mp, s.mp, "mp")}<span>🧪 ${H().potions}</span>${RUN.buff > 1 ? "<span>🔥 Blessed</span>" : ""}<span>💰 ${RUN.gold}</span><span>🎁 ${RUN.loot.length}</span></div>`; };
function chest() {
  const ilvl = ilvlNow(), it = makeItem(ilvl, rollRarity([45, 40, 13, 2])), g = ri(10, 25) * RUN.act.n;
  RUN.loot.push(it); RUN.gold += g; SFX.loot();
  app.innerHTML = top("🧰 Treasure!") + runBar() + `<div class="panel center"><p>You pry open the chest and find <b>🪙 ${g} gold</b> and:</p>${itemHtml(it, true)}<button class="btn go" id="on">Onward →</button></div>`;
  wire(); $("#on").onclick = () => { RUN.step++; doors(); };
}
function shrine() {
  const s = stats();
  app.innerHTML = top("⛲ Shrine") + runBar() + `<div class="panel center"><p>An old shrine glows softly. Choose one blessing:</p><div class="doors">
    <button class="door" id="heal"><div class="big">❤️</div><b>Restore</b><small>Full health and mana</small></button>
    <button class="door" id="pow"><div class="big">🔥</div><b>Empower</b><small>+30% damage for the rest of this floor</small></button></div></div>`;
  wire();
  $("#heal").onclick = () => { RUN.hp = s.hp; RUN.mp = s.mp; SFX.heal(); RUN.step++; doors(); };
  $("#pow").onclick = () => { RUN.buff = 1.3; SFX.crit(); RUN.step++; doors(); };
}
function stairs() {
  const { act, floor } = RUN, st = actState(act.id);
  if (floor >= st.max) st.max = Math.min(5, floor + 1);
  save();
  app.innerHTML = top("🪜 Stairs down") + runBar() + `<div class="panel center"><div class="big">🪜</div><h2>Floor ${floor} cleared!</h2><p>${floor + 1 === 5 ? `The next floor is the lair of <b>${act.boss[0]} ${esc(act.boss[1])}</b>.` : `Floor ${floor + 1} awaits.`}</p>
    <div class="row c"><button class="btn go" id="down">Descend →</button><button class="btn ghost" id="portal">🌀 Back to town</button></div></div>`;
  wire();
  $("#down").onclick = () => { RUN.floor++; RUN.step = 0; RUN.buff = 1; RUN.hp = Math.min(stats().hp, RUN.hp + stats().hp * .3); if (RUN.floor === 5) bossIntro(); else doors(); };
  $("#portal").onclick = () => endRun(false);
}
const ilvlNow = () => (RUN.act.side ? 4 : (RUN.act.n - 1) * 5) + RUN.floor + 1;
function endRun(died) {
  const h = H(); let lost = 0;
  if (died) { lost = Math.floor(h.gold * .1); h.gold -= lost; P.stats.deaths++; }
  h.gold += RUN.gold; const got = RUN.loot.slice();
  got.forEach(it => { if (h.bag.length < 24) h.bag.push(it); else h.gold += sellPrice(it); });
  save();
  app.innerHTML = top(died ? "💀 You have fallen" : "🌀 Back in Haven") + `<div class="panel center">${died ? `<p>The healer pulls you back to town. You dropped 🪙 ${lost} gold, but kept everything you found.</p><p class="hint">Tip: wrong answers let enemies hit you. Read the explanations: the same idea comes back!</p>` : `<p>You return safely.</p>`}
    <p>Brought home: 🪙 ${RUN.gold} gold${got.length ? ` and ${got.length} item${got.length > 1 ? "s" : ""}` : ""}.</p>${got.map(it => itemHtml(it, true)).join("")}<button class="btn go" id="ok">To town</button></div>`;
  wire(); RUN = null; $("#ok").onclick = town;
}

// ---------- combat ----------
let F = null;
function fight(kind, opts = {}) {
  const act = RUN.act, s = stats(), floor = RUN.floor;
  const boss = kind === "boss", elite = kind === "elite", train = kind === "train";
  const [icon, name] = boss ? act.boss : train ? ["🎯", "Training Dummy"] : pick(elite ? act.elite : act.mobs);
  const hits = boss ? 8 : elite ? 4 : train ? 999 : floor <= 2 ? 2 : 3; // correct answers needed to win (keeps learning per fight steady no matter the gear)
  const hp = Math.round(s.dmg * RUN.buff * hits * (train ? 1 : .95 + Math.random() * .1));
  const atkPct = boss ? .15 : elite ? .14 : .1 + floor * .007;
  F = { kind, icon, name, hp, max: hp, atk: Math.round(s.hp * atkPct), stun: false, turn: 0, clarity: s.clarity, level: floor <= 2 ? 1 : floor <= 4 ? 2 : 3, purpose: train ? "train:" + opts.key : boss ? "boss" : elite ? "hard" : "normal", log: [], qs: 0, right: 0, first: !boss };
  if (train) { F.hp = F.max = 9999; F.atk = 0; F.trainLeft = 10; }
  combatView(boss ? `${icon} ${name} rises! ${act.boss[2]}` : `A ${name} blocks your path!`);
}
function combatView(msg) {
  if (msg) F.log.unshift(msg); F.log = F.log.slice(0, 4);
  const s = stats(), c = CLS();
  app.innerHTML = top(F.kind === "boss" ? "👑 Boss battle" : F.kind === "train" ? "🎯 Training" : "⚔️ Battle") + `
   <div class="arena" style="--bg:${RUN.act.bg}">
    <div class="foe ${F.kind}"><div class="fport" id="foe">${F.icon}</div><div class="fname">${esc(F.name)}${F.kind === "elite" ? " <em>Elite</em>" : ""}</div>${F.kind === "train" ? `<div class="hint">Questions left: ${F.trainLeft}</div>` : bar(F.hp, F.max, "fhp")}${F.stun ? `<div class="stun">💫 Stunned</div>` : ""}</div>
    <div class="clog">${F.log.map((l, i) => `<div style="opacity:${1 - i * .22}">${l}</div>`).join("")}</div>
    <div class="me"><div class="mport" id="me">${c.icon}</div><div class="mbars">${bar(RUN.hp, s.hp, "hp")}${bar(RUN.mp, s.mp, "mp")}</div></div>
   </div>
   <div class="actions" id="acts">
    <button class="abtn" data-x="strike">⚔️<b>Strike</b><small>Answer a question</small></button>
    <button class="abtn" data-x="skill"${RUN.mp < c.skill.cost ? " disabled" : ""}>${c.skill.icon}<b>${c.skill.name}</b><small>${c.skill.cost} mana · harder question</small></button>
    <button class="abtn" data-x="potion"${H().potions && RUN.hp < s.hp ? "" : " disabled"}>🧪<b>Potion</b><small>${H().potions} left · heal 50%</small></button>
    <button class="abtn" data-x="flee">🏃<b>${F.kind === "train" ? "Stop" : "Flee"}</b><small>${F.kind === "train" ? "Back to the Codex" : "Portal to town"}</small></button>
   </div><div id="qbox"></div>`;
  wire(() => {}); if ($("#back")) $("#back").remove();
  app.querySelectorAll("[data-x]").forEach(b => b.onclick = () => act(b.dataset.x));
}
function act(x) {
  const s = stats(), c = CLS();
  if (x === "potion") { H().potions--; RUN.hp = Math.min(s.hp, RUN.hp + s.hp * .5); SFX.heal(); save(); return enemyTurn("🧪 You drink a potion and feel much better."); }
  if (x === "flee") { if (F.kind === "train") { RUN = null; return codex(); } return endRun(false); }
  const skill = x === "skill";
  if (skill) RUN.mp -= c.skill.cost;
  const q = makeQ(RUN.act, F.level, skill && !F.purpose.startsWith("train") ? (F.purpose === "boss" ? "boss" : "hard") : F.purpose);
  ask(q, skill);
}
function ask(q, skill) {
  $("#acts").style.display = "none";
  const s = stats(), box = $("#qbox"), swift = (q.type === "mc" ? 12 : 40) + s.swift, t0 = Date.now();
  let tries = 0, clar = false;
  const draw = () => {
    box.innerHTML = `<div class="qcard"><div class="qhead"><span>${skill ? CLS().skill.icon + " " + CLS().skill.name : "⚔️ Strike"}</span><span class="qskill">${esc(skillName(q.key))}</span></div>
      <div class="swift"><i id="sw"></i></div><div class="qq">${esc(q.q)}</div>
      ${q.type === "mc" ? `<div class="mc">${q.c.map((c, j) => `<button data-c="${j}"${clar && j !== q.a && q.kill?.includes(j) ? " disabled class='gone'" : ""}><b>${"ABCD"[j]}</b> ${esc(c)}</button>`).join("")}</div>`
        : `<div class="numrow"><input id="ans" inputmode="decimal" autocomplete="off" placeholder="${q.kind === "frac" ? "e.g. 7/12 or 3" : "your answer"}">${q.units && q.units.length > 1 ? `<select id="unit"><option value="">unit…</option>${q.units.map(u => `<option>${esc(u)}</option>`).join("")}</select>` : q.unit ? `<span class="u">${esc(q.unit)}</span>` : ""}<button class="btn go" id="sub">Cast!</button></div>
           ${clar ? `<div class="clar">📜 ${esc(q.steps[0])}</div>` : ""}<div class="hint">Calculator OK. ${q.units && q.units.length > 1 ? "Pick the unit too. Units matter!" : ""}</div>`}
      <div class="row">${F.clarity > 0 && !clar ? `<button class="btn ghost sm" id="clar">📜 Scroll of Clarity (${F.clarity})</button>` : ""}</div></div>`;
    const sw = $("#sw"); const tick = () => { if (!sw.isConnected) return; const left = Math.max(0, 1 - (Date.now() - t0) / 1000 / swift); sw.style.width = left * 100 + "%"; sw.className = left > 0 ? "" : "late"; if (left > 0) requestAnimationFrame(tick); }; tick();
    if (q.type === "mc") box.querySelectorAll("[data-c]").forEach(b => b.onclick = () => resolve(+b.dataset.c === q.a, q.c[+b.dataset.c]));
    else { const go = () => { const v = $("#ans").value, u = $("#unit") ? $("#unit").value : q.unit; if (!v.trim()) return $("#ans").focus(); const r = check(q, v, u); resolve(r.ok, v + (u ? " " + u : ""), r.why); }; $("#sub").onclick = go; $("#ans").onkeydown = e => { if (e.key === "Enter") go(); }; setTimeout(() => $("#ans") && $("#ans").focus(), 50); }
    const cb = $("#clar"); if (cb) cb.onclick = () => { F.clarity--; clar = true; if (q.type === "mc") q.kill = shuffle([0, 1, 2, 3].filter(j => j !== q.a)).slice(0, 2); draw(); };
  };
  const resolve = (ok, ans, why) => {
    const secs = Math.round((Date.now() - t0) / 1000), fast = ok && secs <= swift;
    record(q, ok, secs, ans); F.qs++; if (ok) F.right++;
    if (ok && F.first && F.kind !== "train") award(`${today()}:${P.stats.q}`, 2, "Realm of Forces: correct answer", "力之境：答对");
    save();
    if (F.kind === "train") { F.trainLeft--; return feedback(q, ok, ans, why, () => { if (F.trainLeft <= 0) return trainDone(); combatView(ok ? "🎯 Bullseye!" : "❌ Missed. Read it and try the next one."); }); }
    if (!ok) { SFX.miss(); shake("#me"); return feedback(q, ok, ans, why, () => enemyTurn(`❌ Your ${skill ? CLS().skill.name : "strike"} misses!`)); }
    // hit!
    const s2 = stats(), crit = Math.random() * 100 < s2.crit;
    let dmg = s2.dmg * RUN.buff * (skill ? s2.skillMult : 1) * (fast ? 1.25 : 1) * (crit ? 1.75 : 1) * (.9 + Math.random() * .2);
    dmg = Math.round(dmg); F.hp -= dmg; (crit ? SFX.crit : SFX.hit)(); floatNum("#foe", dmg, crit); shake("#foe");
    let msg = `${crit ? "💥 CRITICAL! " : ""}${fast ? "⚡ Swift " : ""}${skill ? CLS().skill.name : "Strike"} hits for ${dmg}!`;
    if (skill && H().cls === "vanguard") { F.stun = true; msg += " 💫 Stunned!"; }
    if (skill && H().cls === "arcanist") { const heal = Math.round(dmg * .25); RUN.hp = Math.min(s2.hp, RUN.hp + heal); msg += ` (+${heal} HP)`; }
    RUN.mp = Math.min(s2.mp, RUN.mp + 5);
    const after = () => { if (F.hp <= 0) return victory(); enemyTurn(msg, fast); };
    feedback(q, true, ans, why, after, fast);
  };
  draw();
}
function feedback(q, ok, ans, why, next, fast) {
  const box = $("#qbox");
  const right = q.type === "mc" ? `${"ABCD"[q.a]}. ${q.c[q.a]}` : answerText(q);
  const note = why === "unit" ? "Your number was right, but the unit was wrong. Units matter!" : why === "simplify" ? "Right value, but simplify the fraction all the way." : why === "number" ? "That isn't a number I can read." : "";
  box.innerHTML = `<div class="qcard ${ok ? "good" : "bad"}"><div class="verdict">${ok ? (fast ? "⚡ Swift and correct!" : "✅ Correct!") : "❌ Not quite."}</div>
    ${ok ? "" : `<div class="yours">You said: <b>${esc(ans)}</b>${note ? ` · <em>${esc(note)}</em>` : ""}</div><div class="rightans">Answer: <b>${esc(right)}</b></div>`}
    ${q.type === "mc" ? `<div class="why">💡 ${esc(q.why)}</div>` : `<div class="steps">${q.steps.map(s => `<div>▸ ${esc(s)}</div>`).join("")}</div>`}
    <div class="row c"><button class="btn go" id="cont">${ok ? "Continue" : "Got it"} →</button></div></div>`;
  const b = $("#cont"); b.focus(); b.onclick = next;
  if (!ok) { b.disabled = true; setTimeout(() => { b.disabled = false; }, 1800); } // a moment to actually read the explanation
}
function enemyTurn(msg, dodge) {
  const s = stats();
  if (F.stun) { F.stun = false; return combatView(msg + ` ${F.name} is stunned and can't attack.`); }
  if (dodge) return combatView(msg + " You dodge the counterattack!");
  const dmg = Math.max(1, Math.round(F.atk * (100 / (100 + s.arm * 3)) * (.85 + Math.random() * .3)));
  RUN.hp -= dmg;
  setTimeout(() => { SFX.hurt(); shake("#me"); floatNum("#me", dmg, false, true); }, 50);
  if (RUN.hp <= 0) { RUN.hp = 0; return setTimeout(() => endRun(true), 650); }
  combatView(msg + ` ${F.name} hits you for ${dmg}.`);
}
function victory() {
  const h = H(), act = RUN.act, boss = F.kind === "boss", elite = F.kind === "elite", s = stats();
  P.stats.kills++;
  const xp = Math.round((boss ? 120 : elite ? 40 : 18) * (1 + (act.side ? 1 : act.n - 1) * .35 + RUN.floor * .1) * (1 + s.xp / 100));
  const gold = Math.round(ri(6, 14) * (boss ? 8 : elite ? 3 : 1) * (act.side ? 1.5 : act.n) * (1 + s.gold / 100));
  const drops = [];
  const ilvl = ilvlNow();
  if (boss) { drops.push(makeItem(ilvl + 2, rollRarity([0, 0, 70, 30]))); drops.push(makeItem(ilvl + 1, rollRarity([0, 50, 40, 10]))); }
  else if (elite) drops.push(makeItem(ilvl + 1, rollRarity([0, 62, 31, 7])));
  else if (Math.random() < .35) drops.push(makeItem(ilvl, rollRarity([62, 30, 7, 1])));
  if (Math.random() < (boss ? 1 : .12)) h.potions = Math.min(9, h.potions + 1);
  RUN.loot.push(...drops); RUN.gold += gold;
  const lv = gainXp(xp);
  drops.some(d => d.rarity === 3) ? SFX.legend() : drops.length ? SFX.loot() : SFX.hit();
  let bossHtml = "";
  if (boss) {
    const st = actState(act.id), pct = Math.round(F.right / F.qs * 100), first = !st.cleared;
    st.cleared = true; st.bossWins++; st.bossBest = Math.max(st.bossBest || 0, pct);
    award(`boss:${act.id}:${today()}`, 15, `Realm of Forces: defeated ${act.boss[1]}`, `力之境：击败 ${act.zh} 首领`);
    bossHtml = `<div class="bosswin"><h2>👑 ${esc(act.boss[1])} is defeated!</h2><p>Mastery check: <b>${F.right} of ${F.qs}</b> answered correctly (${pct}%).${pct >= 80 ? " ⭐ That's mastery-level!" : " Keep training this unit in the Codex."}</p>${first && !act.side && act.n < 5 ? `<p>🌀 A new waypoint opens: <b>${esc(D.acts[act.n].name)}</b>!</p>` : ""}</div>`;
  }
  save();
  app.innerHTML = top("🏆 Victory!") + runBar() + `<div class="panel center">${bossHtml}<p>${F.icon} ${esc(F.name)} is defeated. +${xp} XP · 🪙 ${gold}</p>${lv ? `<div class="lvup">⬆️ LEVEL UP! You are now level ${h.lvl}. You have ${h.sp} skill point${h.sp > 1 ? "s" : ""}.</div>` : ""}
    ${drops.length ? `<div class="drops">${drops.map(d => `<div class="beam r${d.rarity}">${itemHtml(d, true)}</div>`).join("")}</div>` : `<p class="hint">No item this time.</p>`}
    <div class="row c">${boss ? `<button class="btn go" id="home">🌀 Return to Haven</button>` : `<button class="btn go" id="on">Onward →</button><button class="btn ghost" id="home">🌀 Town</button>`}</div></div>`;
  wire();
  const on = $("#on"); if (on) on.onclick = () => { RUN.step++; RUN.hp = Math.min(s.hp, RUN.hp + s.hp * .15); doors(); };
  $("#home").onclick = () => endRun(false);
}
function gainXp(x) {
  const h = H(); h.xp += x; let up = false;
  while (h.xp >= xpNeed(h.lvl)) { h.xp -= xpNeed(h.lvl); h.lvl++; h.sp++; up = true; award(`lvl:${h.lvl}`, 5, `Realm of Forces: reached level ${h.lvl}`, `力之境：升到 ${h.lvl} 级`); }
  if (up) { SFX.lvl(); if (RUN) RUN.hp = stats().hp; }
  return up;
}
function bossIntro() {
  const act = RUN.act, st = actState(act.id);
  app.innerHTML = top("👑 The boss lair") + runBar() + `<div class="panel center"><div class="bossport">${act.boss[0]}</div><h2>${esc(act.boss[1])}</h2><p><i>${esc(act.boss[2])}</i></p>
    <p>This boss is your <b>mastery test</b> for ${esc(act.blurb.split(".")[0].toLowerCase())}. Its questions come from a special set you haven't practiced, plus the hardest fresh-number problems. You need about <b>8 correct answers</b> to win.</p>
    ${st.bossBest != null ? `<p class="hint">Your best so far: ${st.bossBest}% correct.</p>` : ""}<div class="row c"><button class="btn go" id="fight">⚔️ Fight!</button><button class="btn ghost" id="portal">🌀 Not yet, back to town</button></div></div>`;
  wire(); $("#fight").onclick = () => fight("boss"); $("#portal").onclick = () => endRun(false);
}

// ---------- town services ----------
function gear() {
  window.scrollTo(0, 0);
  const h = H();
  app.innerHTML = top("🎒 Gear", "Haven") + `<div class="panel"><h2>Equipped</h2><div class="eqgrid">${Object.keys(D.slots).map(sl => `<div class="eqslot">${h.equip[sl] ? itemHtml(h.equip[sl]) : `<div class="item empty">${sl === "weapon" ? CLS().weapon : D.slotIcon[sl]} ${D.slots[sl]}: empty</div>`}</div>`).join("")}</div></div>
   <div class="panel"><h2>Bag (${h.bag.length}/24)</h2>${h.bag.length ? `<div class="baggrid">${h.bag.map((it, i) => `<div class="bagit">${itemHtml(it, true)}<div class="row"><button class="btn go sm" data-eq="${i}">Equip</button><button class="btn ghost sm" data-sell="${i}">Sell 🪙${sellPrice(it)}</button></div></div>`).join("")}</div>
     <div class="row"><button class="btn ghost sm" id="sellj">Sell all Common & Magic items that are weaker than equipped</button></div>` : `<p class="hint">Empty. Go find some loot!</p>`}</div>`;
  wire();
  app.querySelectorAll("[data-eq]").forEach(b => b.onclick = () => { const it = h.bag.splice(+b.dataset.eq, 1)[0], old = h.equip[it.slot]; h.equip[it.slot] = it; if (old) h.bag.push(old); SFX.loot(); save(); gear(); });
  app.querySelectorAll("[data-sell]").forEach(b => b.onclick = () => { const it = h.bag.splice(+b.dataset.sell, 1)[0]; h.gold += sellPrice(it); save(); gear(); });
  const sj = $("#sellj"); if (sj) sj.onclick = () => { const keep = []; h.bag.forEach(it => { if (it.rarity <= 1 && itemScore(it) <= itemScore(h.equip[it.slot])) h.gold += sellPrice(it); else keep.push(it); }); h.bag = keep; save(); gear(); };
}
function skills() {
  window.scrollTo(0, 0);
  const h = H(), c = CLS();
  const T = [["might", "💪", "Might", "+3 damage per point"], ["vit", "❤️", "Vitality", "+12 max health per point"], ["focus", "⏱️", "Focus", "+2 s Swift window and +2% crit per point"], ["insight", "📜", "Insight", "+1 Scroll of Clarity per fight every 2 points"], ["mastery", c.skill.icon, `${c.skill.name} mastery`, "+12% skill damage per point"]];
  app.innerHTML = top("✨ Skills", "Haven") + `<div class="panel"><p>You get 1 skill point each level. Points to spend: <b>${h.sp}</b></p>${T.map(([k, ic, n, d]) => `<div class="talent"><span class="big">${ic}</span><div><b>${n}</b> <span class="rank">${h.skills[k]} / 10</span><div class="hint">${d}</div></div><button class="btn go sm" data-t="${k}"${h.sp && h.skills[k] < 10 ? "" : " disabled"}>+1</button></div>`).join("")}</div>`;
  wire();
  app.querySelectorAll("[data-t]").forEach(b => b.onclick = () => { h.sp--; h.skills[b.dataset.t]++; SFX.lvl(); save(); skills(); });
}
function shop() {
  window.scrollTo(0, 0);
  const h = H(), price = 20 + 4 * h.lvl;
  const stock = (P.shop && P.shop.date === today() && P.shop.lvl === h.lvl) ? P.shop.items : (P.shop = { date: today(), lvl: h.lvl, items: [makeItem(h.lvl + 2, 1), makeItem(h.lvl + 2, 1), makeItem(h.lvl + 3, 2)] }).items;
  const cost = it => Math.round(sellPrice(it) * 3.2);
  app.innerHTML = top("⚖️ Merchant", "Haven") + `<div class="panel"><p>“Welcome, ${esc(h.name)}. Fresh stock every day.”</p>
    <div class="talent"><span class="big">🧪</span><div><b>Healing potion</b><div class="hint">Heals 50%. You have ${h.potions} (max 9).</div></div><button class="btn go sm" id="pot"${h.gold >= price && h.potions < 9 ? "" : " disabled"}>Buy 🪙${price}</button></div>
    <h2>Today's wares</h2><div class="baggrid">${stock.map((it, i) => it ? `<div class="bagit">${itemHtml(it, true)}<button class="btn go sm" data-buy="${i}"${h.gold >= cost(it) && h.bag.length < 24 ? "" : " disabled"}>Buy 🪙${cost(it)}</button></div>` : `<div class="bagit"><div class="item empty">Sold</div></div>`).join("")}</div>
    <p class="hint">Sell loot from the 🎒 Gear screen.</p></div>`;
  wire();
  $("#pot").onclick = () => { h.gold -= price; h.potions++; SFX.loot(); save(); shop(); };
  app.querySelectorAll("[data-buy]").forEach(b => b.onclick = () => { const it = stock[+b.dataset.buy]; h.gold -= cost(it); h.bag.push(it); stock[+b.dataset.buy] = null; SFX.loot(); save(); shop(); });
}
function codex() {
  window.scrollTo(0, 0);
  app.innerHTML = top("📖 Codex of Mastery", "Haven") + `<div class="panel"><p>Every skill tracks your last 12 answers. <span class="m3 pill">⭐ Mastered</span> = 80%+ over 8 or more tries. <span class="m2 pill">Getting there</span> 60–79% · <span class="m1 pill">Needs work</span> under 60% · <span class="m0 pill">New</span> fewer than 5 tries.</p>
    <p class="hint">Train any skill against the 🎯 Training Dummy: 10 questions, no danger, all XP.</p></div>
    ${D.acts.map(a => `<div class="panel"><h2>${a.side ? "📐" : "Act " + a.n} · ${esc(a.name)}</h2>${actSkills(a).map(k => { const m = mastery(k); return `<div class="mrow ${mClass(k)}"><span class="mname">${esc(skillName(k))}</span><span class="mbar"><i style="width:${m.n ? m.pct : 0}%"></i></span><span class="mpct">${m.n ? m.pct + "%" : "–"} <small>(${m.n})</small></span><button class="btn ghost sm" data-tr="${k}" data-a="${a.id}">🎯 Train</button></div>`; }).join("")}</div>`).join("")}`;
  wire();
  app.querySelectorAll("[data-tr]").forEach(b => b.onclick = () => { if (overLimit()) return rest(); const a = D.acts.find(x => x.id === b.dataset.a); const s = stats(); RUN = { act: a, floor: 1, step: 0, hp: s.hp, mp: s.mp, buff: 1, loot: [], gold: 0 }; fight("train", { key: b.dataset.tr }); });
}
function trainDone() {
  const xp = 15 + F.right * 6, up = gainXp(xp); save();
  app.innerHTML = top("🎯 Training complete") + `<div class="panel center"><h2>${F.right} / ${F.qs} correct</h2><p>+${xp} XP${up ? ` · ⬆️ Level ${H().lvl}!` : ""}</p><p>${esc(skillName(F.purpose.slice(6)))}: now ${mastery(F.purpose.slice(6)).pct}% over the last ${mastery(F.purpose.slice(6)).n}.</p><div class="row c"><button class="btn go" id="again">Train again</button><button class="btn ghost" id="cx">Codex</button></div></div>`;
  wire(codex); const k = F.purpose.slice(6), a = RUN.act;
  $("#again").onclick = () => { if (overLimit()) return rest(); const s = stats(); RUN = { act: a, floor: 1, step: 0, hp: s.hp, mp: s.mp, buff: 1, loot: [], gold: 0 }; fight("train", { key: k }); };
  $("#cx").onclick = () => { RUN = null; codex(); };
}
function rest() {
  if (RUN && RUN.loot.length) { const h = H(); h.gold += RUN.gold; RUN.loot.forEach(it => h.bag.length < 24 ? h.bag.push(it) : h.gold += sellPrice(it)); save(); }
  RUN = null;
  app.innerHTML = top("🌙 The realm rests") + `<div class="panel center"><div class="big">🏕️</div><h2>That's today's adventure time (${P.settings.limit} min).</h2><p>Your hero camps by the fire. Your loot is safe in your bag. Come back tomorrow, stronger!</p><p class="hint">Go move around, read, or tell someone one thing you learned today. 🙂</p><button class="btn ghost" id="ok">Look at my gear</button></div>`;
  wire(); $("#ok").onclick = gear;
}

// ---------- parent corner ----------
function parentHtml() {
  const wk = new Date(Date.now() - 6 * 864e5).toLocaleDateString("en-CA"), L = P.log.filter(e => e.d >= wk);
  const acc = L.length ? Math.round(L.filter(e => e.ok).length / L.length * 100) : 0;
  const misses = P.log.filter(e => !e.ok).slice(-8).reverse();
  return `<div class="panel parent"><h2>👨‍👩‍👦 Parent corner <small>(hidden from ${esc(H().name)})</small></h2>
   <label>Daily adventure limit: <select id="plim">${[0, 15, 20, 30, 45, 60].map(m => `<option value="${m}"${P.settings.limit === m ? " selected" : ""}>${m ? m + " min" : "no limit"}</option>`).join("")}</select></label>
   <p>Today: ${Math.floor(P.daily.secs / 60)} min · Last 7 days: <b>${L.length}</b> questions, <b>${acc}%</b> correct · Fights won: ${P.stats.kills} · Falls: ${P.stats.deaths}</p>
   <p><b>Bosses (mastery tests):</b> ${D.acts.map(a => { const st = actState(a.id); return `${a.boss[0]} ${st.cleared ? `best ${st.bossBest}%` : "not yet"}`; }).join(" · ")}</p>
   <table class="ptab"><tr><th>Skill</th><th>Last 12</th><th>Tries</th></tr>${D.acts.flatMap(a => actSkills(a)).map(k => { const m = mastery(k); return `<tr class="${mClass(k)}"><td>${esc(skillName(k))}</td><td>${m.n ? m.pct + "%" : "–"}</td><td>${m.n}</td></tr>`; }).join("")}</table>
   ${misses.length ? `<p><b>Recent misses:</b></p><ul class="pmiss">${misses.map(e => `<li>${esc(e.q)}<br><small>He said <b>${esc(e.a)}</b> · answer <b>${esc(e.r)}</b></small></li>`).join("")}</ul>` : ""}
   <p class="hint">Questions: multiple choice from the Physics 6 lessons (bosses use a held-back set) + fresh-number problems that need a typed answer and the right unit. Points: 2 per correct answer, 15 per boss, 5 per level (hub caps apps at 120/day).</p></div>`;
}
function wireParent() { const s = $("#plim"); if (s) s.onchange = () => { P.settings.limit = +s.value; save(); town(); }; }

// ---------- fx ----------
function shake(sel) { const el = $(sel); if (el) el.animate([{ transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(-3px)" }, { transform: "none" }], 260); }
function floatNum(sel, n, crit, hurt) { const el = $(sel); if (!el) return; const r = el.getBoundingClientRect(), d = document.createElement("div"); d.className = "dmg" + (crit ? " crit" : "") + (hurt ? " hurt" : ""); d.textContent = (hurt ? "-" : "") + n + (crit ? "!" : ""); d.style.left = r.left + r.width / 2 + scrollX + "px"; d.style.top = r.top + scrollY + "px"; document.body.appendChild(d); setTimeout(() => d.remove(), 1100); }

town();
})();
