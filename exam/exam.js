// Weekly $20 challenge — question builder.
// Builds each boy's exam from what he practiced (his own apps' banks), weighted to this week's topics.
// Try 2 is built from try 1's mistakes: several questions per missed topic, easy → hard, plus a little review.
// A question: {type: "mc"|"num", q, c?, a?, ans?, tol?, unit?, units?, hint, why, answerText, topic, topicName, tts?}
// (answers go to the server and are graded there; the kid's screen only ever gets the question).
(() => {
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const weekStart = () => { const d = new Date(); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return d.toISOString().slice(0, 10); };

// multiple-choice from a lesson bank item {q, c, a, hint, why}: shuffle choices, keep the right index
function mcFrom(item, topic, topicName) {
  const o = shuffle(item.c.map((c, j) => [c, j]));
  return { type: "mc", q: item.q, c: o.map(x => x[0]), a: o.findIndex(x => x[1] === item.a), hint: item.hint || "Read every choice. Cross out the ones that can't be right.", why: item.why || "", answerText: item.c[item.a], topic, topicName };
}
// fresh-number problem from Realm of Forces' generators (quest/gen.js)
function genQ(key, d) {
  const G = window.QGEN.GEN[key], p = G.gen(d), needUnit = p.unit && p.units && p.units.length > 1;
  const target = p.kind === "frac" ? p.ans.n / p.ans.d : p.ans;
  return { type: "num", q: p.q, ans: target, tol: Math.max(Math.abs(target) * 0.01, 0.006), unit: needUnit ? p.unit : undefined, units: needUnit ? shuffle(p.units) : undefined,
    hint: (p.steps && p.steps[0]) ? "Hint: " + p.steps[0] : "Write the formula first, then plug in the numbers.", why: (p.steps || []).join(" → "), answerText: window.QGEN.answerText(p),
    topic: "g:" + key, topicName: G.name, frac: p.kind === "frac" || undefined };
}
const phyBank = (id, hard) => { const L = (window.PHY_LESSONS || []).find(l => l.id === id); if (!L) return []; return hard ? [...(L.ch || []), ...(L.tq || [])] : [...(L.pr || []), ...(L.tq || [])]; };
const phyName = id => { const L = (window.PHY_LESSONS || []).find(l => l.id === id); return L ? `Physics: ${L.title}` : id; };
const amcBank = (id, hard) => { const L = (window.AMC_LESSONS || []).find(l => l.id === id); if (!L) return []; return hard ? [...(L.ch || []), ...(L.pr || [])] : (L.pr || []); };
const amcName = id => { const L = (window.AMC_LESSONS || []).find(l => l.id === id); return L ? `AMC: ${L.title}` : id; };
const FEN_NAME = { see: "Fencing: 👀 Read", set: "Fencing: 🪤 Set up", hit: "Fencing: ⚡ Strike & defend" };
function fenQ(t, used) {
  const bank = (window.EXAM_FENCING || []).filter(q => (!t || q.t === t) && !used.has(q.q)); const it = pick(bank.length ? bank : window.EXAM_FENCING);
  const o = shuffle(it.o.map((c, j) => [c, j]));
  return { type: "mc", q: it.q, c: o.map(x => x[0]), a: o.findIndex(x => x[1] === it.a), hint: { see: "Think: what does a smart fencer READ first: distance, rhythm, his own balance?", set: "Think: how do you CREATE a chance instead of waiting for one?", hit: "Think: which action is fastest and safest right now?" }[it.t] || "Think like your coach.",
    why: it.w || "", answerText: it.o[it.a], topic: "fen:" + it.t, topicName: FEN_NAME[it.t] || "Fencing" };
}

/* ---------- Jonah (5): Grade 1 math + words, read aloud, picture choices ---------- */
const FR = ["🍎", "⭐", "🐟", "🍪", "🎈", "🚗", "🌸", "🐞"];
function jonahQ(topic) {
  const nums = (right, spread = 3, min = 0) => { const s = new Set([right]); while (s.size < 3) s.add(Math.max(min, right + ri(-spread, spread))); return shuffle([...s]); };
  const mk = (q, right, choices, hint, why, tts, name) => ({ type: "mc", q, c: choices.map(String), a: choices.indexOf(right), hint, why, answerText: String(right), topic: "j:" + topic, topicName: name, tts: tts || q });
  if (topic === "add") { const a = ri(2, 10), b = ri(1, 10 - Math.min(a, 9) + 5); const r = a + b; return mk(`${a} + ${b} = ?`, r, nums(r), "Start at the bigger number and count up on your fingers.", `${a} + ${b} = ${r}`, `What is ${a} plus ${b}?`, "Adding"); }
  if (topic === "sub") { const a = ri(6, 18), b = ri(1, Math.min(9, a)); const r = a - b; return mk(`${a} − ${b} = ?`, r, nums(r), "Start at the big number and count back.", `${a} − ${b} = ${r}`, `What is ${a} minus ${b}?`, "Taking away"); }
  if (topic === "count") { const n = ri(5, 15), f = pick(FR); return mk(`How many? ${f.repeat(n)}`, n, nums(n, 2, 1), "Touch each one and count out loud.", `There are ${n}.`, "How many are there? Count them.", "Counting"); }
  if (topic === "compare") { let a = ri(10, 99), b = ri(10, 99); while (b === a) b = ri(10, 99); const big = Math.max(a, b); return mk(`Which number is bigger: ${a} or ${b}?`, big, shuffle([a, b]), "Look at the tens first.", `${big} has more tens, so it is bigger.`, `Which number is bigger, ${a} or ${b}?`, "Bigger and smaller"); }
  if (topic === "tens") { const t = ri(1, 9), o = ri(0, 9), n = t * 10 + o; return mk(`${t} tens and ${o} ones make…`, n, nums(n, 11, 1), "Each ten is 10. Count by tens, then add the ones.", `${t} tens = ${t * 10}, plus ${o} = ${n}`, `${t} tens and ${o} ones make what number?`, "Tens and ones"); }
  if (topic === "time") { const h = ri(1, 12), half = Math.random() < .5; const right = half ? `${h}:30` : `${h}:00`, other = half ? `${h}:00` : `${h}:30`, third = `${h % 12 + 1}:00`; return mk(`🕐 The short hand points at ${h}${half ? " and a bit past" : ""}. The long hand points at ${half ? "6" : "12"}. What time is it?`, right, shuffle([right, other, third]), "Long hand at 12 means o'clock. Long hand at 6 means half past.", `It is ${right}.`, null, "Telling time"); }
  if (topic === "coins") { const p = ri(0, 4), n = ri(0, 2), d = ri(1, 2), tot = p + n * 5 + d * 10, part = (k, one, many) => k ? `${k} ${k === 1 ? one : many}` : ""; const words = [part(d, "dime", "dimes"), part(n, "nickel", "nickels"), part(p, "penny", "pennies")].filter(Boolean).join(", ");
    return mk(`🪙 ${words}. How many cents? (dime = 10¢, nickel = 5¢, penny = 1¢)`, tot, nums(tot, 5, 1), "Count the dimes by 10s first, then nickels by 5s, then pennies by 1s.", `${words} = ${tot}¢`, `You have ${words}. How many cents is that? A dime is ten cents, a nickel is five cents, and a penny is one cent.`, "Money"); }
  if (topic === "shape") { const S = [["triangle", 3], ["square", 4], ["pentagon", 5], ["hexagon", 6]], s = pick(S); return mk(`How many sides does a ${s[0]} have?`, s[1], shuffle([...new Set([s[1], s[1] + 1, Math.max(3, s[1] - 1), 4])].slice(0, 3)).concat([]).filter((v, i, arr) => arr.indexOf(v) === i), "Draw it in the air and count the straight sides.", `A ${s[0]} has ${s[1]} sides.`, null, "Shapes"); }
  if (topic === "rhyme") { const R = [["cat", "hat", "dog"], ["sun", "bun", "car"], ["bug", "rug", "fish"], ["fox", "box", "pig"], ["hen", "pen", "cup"], ["bee", "tree", "ball"]], r = pick(R); return mk(`Which word rhymes with "${r[0]}"?`, r[1], shuffle([r[1], r[2]]), "Say them out loud. Rhymes sound the same at the end.", `${r[0]} and ${r[1]} rhyme.`, `Which word rhymes with ${r[0]}? ${r[1]}, or ${r[2]}?`, "Rhyming"); }
  const W = [["dog", "d", "🐶"], ["sun", "s", "☀️"], ["cat", "c", "🐱"], ["fish", "f", "🐟"], ["ball", "b", "⚽"], ["moon", "m", "🌙"], ["pig", "p", "🐷"]], w = pick(W);
  return mk(`${w[2]} ${w[0]}: what is the first sound?`, w[1], shuffle([w[1], ...shuffle("abcdfgmpst".split("").filter(x => x !== w[1])).slice(0, 2)]), "Say the word slowly. What sound do your lips make first?", `${w[0]} starts with ${w[1]}.`, `What is the first sound in ${w[0]}?`, "First sounds");
}
const JONAH_TOPICS = ["add", "sub", "count", "compare", "tens", "time", "coins", "shape", "rhyme", "first"];

/* ---------- 🔒 never-seen questions (Bobby 11/25: Eric's $20 exam had 5 of 12 questions he had already answered, up to 11 times) ---------- */
const keyQ = q => String(q || "").replace(/\s+/g, " ").trim().toLowerCase().slice(0, 80);
function seenKeys(saves, kid, prevQs) {
  const out = new Set(), get = (app, key) => { const r = saves.find(s => s.app === app); return r && r.data ? r.data[key] : null; };
  const a = get("amc", `${kid}_amc_progress`); if (a && a.events) a.events.forEach(x => x.q && out.add(keyQ(x.q)));
  const p = get("physics", `${kid}_physics_progress`); if (p && p.events) p.events.forEach(x => x.q && out.add(keyQ(x.q)));
  const qz = get("quest", `${kid}_quest_save`); if (qz && qz.log) qz.log.forEach(x => x.q && out.add(keyQ(x.q)));
  (prevQs || []).forEach(q => out.add(keyQ(q)));
  return out;
}
let SEEN = new Set();
const fresh = q => !SEEN.has(keyQ(q));

/* ---------- what he practiced this week (from his app saves) ---------- */
function practiced(saves, kid) {
  const wk = weekStart(), out = {};
  const bump = (k, n = 1) => { out[k] = (out[k] || 0) + n; };
  const get = (app, key) => { const r = saves.find(s => s.app === app); return r && r.data ? r.data[key] : null; };
  const q = get("quest", `${kid}_quest_save`); if (q && q.log) q.log.filter(x => x.d >= wk).forEach(x => bump(x.k.startsWith("g:") ? x.k : "phy:" + x.k, x.ok ? 1 : 2));
  const p = get("physics", `${kid}_physics_progress`); if (p && p.events) p.events.filter(x => x.d >= wk && x.t).forEach(x => bump("phy:" + x.t, x.ok === false ? 2 : 1));
  const a = get("amc", `${kid}_amc_progress`); if (a && a.events) a.events.filter(x => x.d >= wk && x.t).forEach(x => bump("amc:" + x.t, x.ok === false ? 2 : 1));
  return out;
}
const weighted = (w, n, fallback) => { const keys = Object.keys(w); const out = []; for (let i = 0; i < n; i++) { if (!keys.length) { out.push(pick(fallback)); continue; } let r = Math.random() * keys.reduce((s, k) => s + w[k], 0); out.push(keys.find(k => (r -= w[k]) <= 0) || keys[0]); } return out; };

/* ---------- one question for any topic key ---------- */
function forTopic(topic, level, used) {
  for (let tries = 0; tries < 6; tries++) {
    let q;
    if (topic.startsWith("g:") && window.QGEN && window.QGEN.GEN[topic.slice(2)]) q = genQ(topic.slice(2), Math.min(3, level));
    else if (topic.startsWith("phy:")) { const id = topic.slice(4), b = phyBank(id, level >= 3).filter(x => !used.has(x.q) && fresh(x.q));
      if (b.length && Math.random() < .5) q = mcFrom(pick(b), topic, phyName(id));
      else if (window.PHY_GEN) { const g = PHY_GEN.make(id, Math.min(5, level + 1)); if (g && g.c && g.c.length >= 3) q = mcFrom(g, topic, phyName(id)); }
      if (!q && b.length) q = mcFrom(pick(b), topic, phyName(id)); }
    else if (topic.startsWith("amc:")) { const id = topic.slice(4); // freshly generated AMC problems (never memorized warm-ups); the fixed bank only if a problem is new to him
      if (window.AMC_GYM && AMC_GYM.makeAt) { const g = AMC_GYM.makeAt(id, level >= 3 ? 4 : level + 1); if (g && g.c && g.c.length >= 4) q = mcFrom(g, topic, amcName(id)); }
      if (!q) { const b = amcBank(id, level >= 3).filter(x => !used.has(x.q) && fresh(x.q)); if (b.length) q = mcFrom(pick(b), topic, amcName(id)); } }
    else if (topic.startsWith("fen:")) q = fenQ(topic.slice(4), used);
    else if (topic.startsWith("j:")) q = jonahQ(topic.slice(2));
    if (q && !used.has(q.q) && (fresh(q.q) || tries >= 5)) { used.add(q.q); return q; }
  }
  return null;
}

/* ---------- try 1 ---------- */
function buildTry1(kid, saves, cfg) {
  SEEN = seenKeys(saves, kid, cfg && cfg.prevQs);
  const used = new Set(), out = [], add = q => q && out.push(q);
  if (kid === "jonah") { shuffle(JONAH_TOPICS).concat(shuffle(JONAH_TOPICS)).slice(0, 8).forEach(t => add(forTopic("j:" + t, 1, used))); return out; }
  const w = practiced(saves, kid);
  if (kid === "eric") {
    const classNow = (cfg && cfg.physicsClassNow) || "kinematics", order = ["inquiry", "measure", "kinematics", "forces", "energy", "waves"], upto = order.slice(0, Math.max(1, order.indexOf(classNow) + 1));
    const phyMC = upto.map(id => "phy:" + id), phyGen = { inquiry: [], measure: ["conv"], kinematics: ["speed", "dist", "time", "accel", "avgspeed"], forces: ["weight", "netforce", "fma"], energy: ["work", "ke", "pe"], waves: ["wave", "period"] };
    const gens = upto.flatMap(id => phyGen[id]).map(k => "g:" + k).concat(["int", "expr", "eq", "frac", "gcf", "exp", "pct", "prop", "angle"].map(k => "g:" + k));
    const amc = (window.AMC_LESSONS || []).slice(0, 8).map(l => "amc:" + l.id);
    const pw = k => Object.fromEntries(Object.entries(w).filter(([t]) => k(t)));
    weighted(pw(t => t.startsWith("phy:")), 3, phyMC).forEach(t => add(forTopic(t, 2, used)));
    weighted(pw(t => t.startsWith("g:")), 5, gens).forEach(t => add(forTopic(t, 2, used)));
    weighted(pw(t => t.startsWith("amc:")), 4, amc).forEach(t => add(forTopic(t, 3, used)));
  } else { // ellis: his AMC chapters + fencing knowledge
    const mine = [1, 2, 4, 5, 7, 9, 12, 13, 14], amc = (window.AMC_LESSONS || []).filter(l => mine.includes(l.n)).map(l => "amc:" + l.id);
    weighted(Object.fromEntries(Object.entries(w).filter(([t]) => t.startsWith("amc:"))), 6, amc).forEach(t => add(forTopic(t, 1, used)));
    ["see", "set", "hit", pick(["see", "set", "hit"])].forEach(t => add(forTopic("fen:" + t, 1, used)));
  }
  while (out.length < (kid === "eric" ? 12 : 10)) { const extra = forTopic(kid === "eric" ? "g:" + pick(["int", "eq", "frac", "pct"]) : "fen:" + pick(["see", "set", "hit"]), 2, used); if (!extra) break; out.push(extra); }
  return shuffle(out);
}

/* ---------- try 2: built from the mistakes, in depth ---------- */
function buildTry2(kid, missed, passedTopics, saves, prevQs) {
  if (saves) SEEN = seenKeys(saves, kid, prevQs);
  const used = new Set(), out = [], topics = [...new Set(missed)].slice(0, 5), per = topics.length <= 2 ? 4 : 3;
  topics.forEach(t => { for (let i = 0; i < per; i++) { const q = forTopic(t, kid === "jonah" ? 1 : Math.min(3, 1 + i), used); if (q) out.push(Object.assign(q, { focus: true })); } }); // easy → hard within each missed topic
  shuffle([...new Set(passedTopics)]).slice(0, 2).forEach(t => { const q = forTopic(t, 2, used); if (q) out.push(q); });
  while (out.length < 8) { const q = forTopic(topics.length ? pick(topics) : (kid === "jonah" ? "j:add" : "g:eq"), 2, used); if (!q) break; out.push(q); }
  return out.slice(0, 18);
}

window.EXAM = { buildTry1, buildTry2, weekStart };
})();
