// Physics 6 generated practice (Bobby 2026-11-21): endless multiple-choice problems per unit, 3 tiers (d = 1..3),
// used by the ♾️ Endless mode together with shared/adapt.js. Uses g = 9.8 m/s² like Dr. Covert's class.
// Each template returns { q, c (choices), a (index), hint, why, ok }; ok re-checks the answer.
(function () {
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const r = (x, n = 2) => { const v = Math.round(x * 10 ** n) / 10 ** n; return Object.is(v, -0) ? 0 : v; };
  const num = x => { const s = String(r(x, 3)); return s.includes("e") ? x.toPrecision(3) : s; };
  const G = 9.8;
  const an = n => (/^(8|11|18)/.test(String(n)) && !/^1[02-79]/.test(String(n)) ? "an" : "a"), An = n => an(n) === "an" ? "An" : "A";
  // Multiple choice from an answer + candidate wrongs (deduped by displayed text; numeric neighbours fill the gaps)
  function mc(q, ans, wrongs, fmt, hint, why, extra = {}) {
    fmt = fmt || (x => String(x)); const A = fmt(ans), ch = [A], seen = new Set([A]);
    for (const w of wrongs) { if (w == null || (typeof w === "number" && (!isFinite(w) || w <= 0 && !extra.neg))) continue; const s = fmt(w); if (!seen.has(s) && ch.length < 4) { seen.add(s); ch.push(s); } }
    if (typeof ans === "number") for (const k of [2, 0.5, 1.5, 3, 0.25, 10, 0.1, 4]) { if (ch.length >= 4) break; const s = fmt(r(ans * k, 3)); if (!seen.has(s)) { seen.add(s); ch.push(s); } }
    shuffle(ch); return { q, c: ch, a: ch.indexOf(A), hint, why, gen: true, ...extra };
  }
  const U = {};
  const T = (unit, lo, hi, fn) => { (U[unit] = U[unit] || []).push({ lo, hi, fn }); };

  // ───────── Unit 2: Scientific Inquiry ─────────
  const EXPS = [
    { iv: "the amount of sunlight", dv: "how tall the plants grow", cv: ["the type of plant", "the amount of water", "the soil"], text: "Mia gives bean plants 2, 4, 6 or 8 hours of light a day and measures how tall they grow." },
    { iv: "the ramp height", dv: "how far the toy car rolls", cv: ["the car", "the floor surface", "where the car starts"], text: "Leo lets the same toy car roll down a ramp set at different heights and measures how far it rolls." },
    { iv: "the water temperature", dv: "how fast the sugar dissolves", cv: ["the amount of sugar", "the amount of water", "stirring"], text: "Ava drops a sugar cube into cups of water at 10 °C, 30 °C and 50 °C and times how long it takes to dissolve." },
    { iv: "the mass hung on the spring", dv: "how far the spring stretches", cv: ["the spring", "the ruler", "how the mass is attached"], text: "Ben hangs 50 g, 100 g and 150 g on the same spring and measures how far it stretches." },
    { iv: "the paper airplane design", dv: "how far it flies", cv: ["the type of paper", "the throwing strength", "the room"], text: "Kai builds three paper airplane designs and throws each one the same way, measuring the distance." },
    { iv: "the type of ball", dv: "how high it bounces", cv: ["the drop height", "the floor", "the temperature"], text: "Zoe drops a tennis ball, a rubber ball and a golf ball from 1 m and measures the bounce height." }];
  T("inquiry", 1, 5, d => { const e = pick(EXPS), kind = pick(d === 1 ? ["iv", "dv"] : ["iv", "dv", "cv"]); const name = { iv: "independent variable (what is changed on purpose)", dv: "dependent variable (what is measured)", cv: "controlled variable (kept the same)" }[kind];
    const ans = kind === "cv" ? pick(e.cv) : e[kind]; const wr = shuffle([e.iv, e.dv, ...e.cv].filter(x => x !== ans && !(kind === "cv" && e.cv.includes(x))));
    return mc(`${e.text} What is the ${name}?`, ans, kind === "cv" ? [e.iv, e.dv, "the date of the test"] : wr, null, "Independent = what you change. Dependent = what you measure. Controlled = what you keep the same.", `${ans[0].toUpperCase() + ans.slice(1)} is the ${name.split(" (")[0]}.`, { ok: () => true }); });
  T("inquiry", 1, 4, d => { const set = pick([
      ["The water boiled at 100 °C.", ["Water is the best drink.", "Blue is a prettier color than red.", "Science class is boring."]],
      ["The ball rolled 3.2 meters.", ["That ball is the most fun toy.", "Rolling is better than bouncing.", "Everyone likes balls."]],
      ["The plant grew 4 cm in one week.", ["Plants are nicer than animals.", "That plant looks happy.", "Green plants are the best."]],
      ["The spring stretched 6 cm with a 200 g mass.", ["Springs are cool.", "Heavy things are scary.", "That experiment was the most interesting."]]]);
    return mc("Which statement is a scientific observation (something measured or seen, not an opinion)?", set[0], set[1], null, "Could two people check it with a tool and agree?", `"${set[0]}" can be measured and checked. The others are opinions.`, { ok: () => true }); });
  T("inquiry", 1, 5, d => { const n = d === 1 ? 3 : d === 2 ? 4 : 5; const xs = Array.from({ length: n }, () => r(ri(20, 60) / (d === 3 ? 10 : 1), 1)); const mean = r(xs.reduce((a, b) => a + b, 0) / n, 2); const u = pick(["cm", "s", "g"]);
    return mc(`In ${n} trials a measurement came out ${xs.join(" " + u + ", ")} ${u}. What is the mean (average)?`, mean, [r(xs.reduce((a, b) => a + b, 0), 2), r((Math.max(...xs) + Math.min(...xs)) / 2, 2), r(mean + 1, 2), xs.slice().sort((a, b) => a - b)[Math.floor(n / 2)]], x => `${num(x)} ${u}`, "Add all the trials, then divide by how many trials there were.", `(${xs.join(" + ")}) ÷ ${n} = ${num(mean)} ${u}. Repeating trials and averaging makes results more reliable.`, { ok: () => Math.abs(xs.reduce((a, b) => a + b, 0) / n - mean) < 0.006 }); });
  T("inquiry", 2, 5, d => { const base = ri(10, 30), xs = Array.from({ length: 5 }, () => base + ri(-2, 2)); const out = base + pick([-1, 1]) * ri(12, 20); const pos = ri(0, 5); xs.splice(pos, 0, out);
    return mc(`A student measured the same thing six times: ${xs.join(", ")} (cm). Which value is most likely an outlier (a mistake to re-check)?`, out, [...new Set(xs.filter(x => x !== out))].concat([base + 3, base - 3, base + 4]), x => `${x} cm`, "Which value is far away from all the others?", `${out} is far from the others (about ${base}). Re-measure it instead of including it.`, { ok: () => Math.abs(out - base) >= 12 }); });
  T("inquiry", 2, 5, d => { const e = pick(EXPS);
    const good = `If ${e.iv} changes, then ${e.dv} will change, because …`, bad = [`${e.dv[0].toUpperCase() + e.dv.slice(1)} is interesting.`, `I like ${e.iv}.`, `What happens to ${e.dv}?`];
    return mc(`${e.text} Which is a testable hypothesis?`, good, bad, null, "A hypothesis predicts what will happen and can be tested: 'If …, then …, because …'.", "A testable hypothesis links the variable you change to the one you measure.", { ok: () => true }); });

  // ───────── Unit 3: Measurement & Units ─────────
  const CONV = [["m", "cm", 100], ["m", "mm", 1000], ["km", "m", 1000], ["kg", "g", 1000], ["L", "mL", 1000], ["min", "s", 60], ["h", "min", 60], ["cm", "mm", 10]];
  T("measure", 1, 5, d => { const [big, small, f] = pick(CONV); const up = Math.random() < 0.5; const v = d === 1 ? ri(2, 9) : d === 2 ? r(ri(12, 95) / 10, 1) : r(ri(105, 9500) / 100, 2);
    const from = up ? big : small, to = up ? small : big, val = up ? v : r(v * f, 2), ans = up ? r(v * f, 3) : r(v, 3);
    return mc(`Convert ${num(val)} ${from} to ${to}.`, ans, [up ? r(v / f, 4) : r(val * f, 2), up ? r(v * f / 10, 3) : r(v * 10, 3), up ? r(v * f * 10, 3) : r(v / 10, 4), r(ans + 1, 3)], x => `${num(x)} ${to}`, `1 ${big} = ${f} ${small}. Going to a smaller unit → bigger number.`, `${num(val)} ${from} ${up ? "×" : "÷"} ${f} = ${num(ans)} ${to}.`, { ok: () => Math.abs((up ? val * f : val / f) - ans) < 0.01 }); });
  T("measure", 1, 3, d => { const qs = [["mass", "kilogram (kg)"], ["length", "meter (m)"], ["time", "second (s)"], ["temperature", "kelvin (K)"], ["force", "newton (N)"], ["energy", "joule (J)"], ["volume", "cubic meter (m³)"]]; const [what, unit] = pick(d === 1 ? qs.slice(0, 3) : qs);
    return mc(`What is the SI unit for ${what}?`, unit, qs.map(x => x[1]).filter(x => x !== unit).sort(() => Math.random() - 0.5), null, "SI = the metric system scientists use.", `${what[0].toUpperCase() + what.slice(1)} is measured in ${unit}.`, { ok: () => true }); });
  T("measure", 2, 5, d => { const m = ri(10, 200 * d), V = pick([2, 4, 5, 8, 10, 20, 25, 50]); const D = r(m / V, 2);
    const ask = d === 1 ? "D" : pick(["D", "m", "V"]);
    if (ask === "D") return mc(`A block has a mass of ${m} g and a volume of ${V} cm³. What is its density?`, D, [m * V, r(V / m, 3), m + V, r(D * 2, 2)], x => `${num(x)} g/cm³`, "Density = mass ÷ volume.", `${m} ÷ ${V} = ${num(D)} g/cm³.`, { ok: () => Math.abs(m / V - D) < 0.006 });
    if (ask === "m") return mc(`An object has density ${num(D)} g/cm³ and volume ${V} cm³. What is its mass?`, m, [r(D / V, 3), r(V / D, 3), r(D + V, 2), m * 2], x => `${num(x)} g`, "mass = density × volume.", `${num(D)} × ${V} = ${m} g.`, { ok: () => Math.abs(D * V - m) < 0.1 });
    return mc(`An object has mass ${m} g and density ${num(D)} g/cm³. What is its volume?`, V, [r(m * D, 2), r(D / m, 4), r(m - D, 2), V * 2], x => `${num(x)} cm³`, "volume = mass ÷ density.", `${m} ÷ ${num(D)} = ${V} cm³.`, { ok: () => Math.abs(m / D - V) < 0.1 }); });
  T("measure", 3, 5, d => { const e = ri(2, 7), m = r(ri(11, 99) / 10, 1), v = m * 10 ** e; const neg = Math.random() < 0.4; const val = neg ? r(m / 10 ** e, e + 2) : v; const ans = neg ? `${m} × 10⁻${["", "", "²", "³", "⁴", "⁵", "⁶", "⁷"][e]}` : `${m} × 10${["", "", "²", "³", "⁴", "⁵", "⁶", "⁷"][e]}`;
    const sup = k => (k < 0 ? "⁻" : "") + String(Math.abs(k)).split("").map(x => "⁰¹²³⁴⁵⁶⁷⁸⁹"[x]).join("");
    const pw = neg ? -e : e, A = `${m} × 10${sup(pw)}`, W = [`${m} × 10${sup(-pw)}`, `${m} × 10${sup(pw + 1)}`, `${r(m * 10, 1)} × 10${sup(pw)}`, `${m} × 10${sup(pw - 1)}`];
    return mc(`Write ${neg ? val.toFixed(e + 1).replace(/0+$/, "") : v.toLocaleString("en-US")} in scientific notation.`, A, W, null, "Move the decimal until one non-zero digit is in front. Count the moves.", `${neg ? "Moving the decimal right" : "Moving the decimal left"} ${e} places gives ${A}.`, { ok: () => Math.abs(m * 10 ** pw - (neg ? val : v)) / (neg ? val : v) < 1e-6 }); });

  // ───────── Unit 4: Kinematics ─────────
  T("kinematics", 1, 5, d => { const v = d === 1 ? ri(2, 10) : r(ri(15, 120) / (d === 3 ? 10 : 5), 1), t = d === 1 ? ri(2, 10) : ri(3, 25), dd = r(v * t, 2); const ask = d === 1 ? "v" : pick(["v", "d", "t"]); const who = pick(["A runner", "A cyclist", "A toy car", "A train", "A skateboarder"]);
    if (ask === "v") return mc(`${who} travels ${num(dd)} m in ${t} s at a steady speed. What is its speed?`, v, [r(dd * t, 1), r(t / dd, 3), r(dd - t, 1), r(v * 2, 1)], x => `${num(x)} m/s`, "speed = distance ÷ time.", `${num(dd)} m ÷ ${t} s = ${num(v)} m/s.`, { ok: () => Math.abs(dd / t - v) < 0.01 });
    if (ask === "d") return mc(`${who} moves at ${num(v)} m/s for ${t} s. How far does it go?`, dd, [r(v / t, 3), r(v + t, 1), r(dd / 2, 2), r(t / v, 3)], x => `${num(x)} m`, "distance = speed × time.", `${num(v)} × ${t} = ${num(dd)} m.`, { ok: () => Math.abs(v * t - dd) < 0.01 });
    return mc(`${who} moves at ${num(v)} m/s. How long does it take to go ${num(dd)} m?`, t, [r(dd * v, 1), r(v / dd, 3), r(dd - v, 1), t * 2], x => `${num(x)} s`, "time = distance ÷ speed.", `${num(dd)} ÷ ${num(v)} = ${t} s.`, { ok: () => Math.abs(dd / v - t) < 0.01 }); });
  T("kinematics", 1, 5, d => { const v1 = ri(0, 10), dv = ri(2, 6 + 4 * d) * (d === 3 && Math.random() < 0.4 ? -1 : 1), v2 = v1 + dv; if (v2 < 0) return null; const t = pick([2, 4, 5, 8, 10]); const a = r(dv / t, 2);
    return mc(`A bike speeds ${dv >= 0 ? "up" : "down"} from ${v1} m/s to ${v2} m/s in ${t} s. What is its acceleration?`, a, [r(v2 / t, 2), r(dv * t, 1), r((v1 + v2) / t, 2), r(-a, 2)], x => `${num(x)} m/s²`, "acceleration = (final speed − starting speed) ÷ time.", `(${v2} − ${v1}) ÷ ${t} = ${num(a)} m/s²${a < 0 ? " (negative: slowing down)" : ""}.`, { neg: true, ok: () => Math.abs((v2 - v1) / t - a) < 0.006 }); });
  T("kinematics", 2, 5, d => { const d1 = ri(2, 10) * 10, t1 = ri(2, 6) * 10, d2 = ri(2, 10) * 10, t2 = ri(2, 6) * 10, av = r((d1 + d2) / (t1 + t2), 2);
    return mc(`Sam walks ${d1} m in ${t1} s, then ${d2} m in ${t2} s. What is his average speed for the whole walk?`, av, [r((d1 / t1 + d2 / t2) / 2, 2), r((d1 + d2) / t1, 2), r(d1 / t1, 2), r((d1 + d2) * (t1 + t2) / 1000, 2)], x => `${num(x)} m/s`, "Average speed = TOTAL distance ÷ TOTAL time.", `(${d1} + ${d2}) ÷ (${t1} + ${t2}) = ${d1 + d2} ÷ ${t1 + t2} = ${num(av)} m/s.`, { ok: () => Math.abs((d1 + d2) / (t1 + t2) - av) < 0.006 }); });
  T("kinematics", 2, 5, d => { const v = ri(2, 6), pts = [0, 1, 2, 3, 4].map(t => [t, v * t + (d === 3 ? 0 : 0)]); const stop = d >= 2 && Math.random() < 0.5; if (stop) pts[3][1] = pts[2][1], pts[4][1] = pts[2][1];
    const ask = stop ? "What was happening from t = 2 s to t = 4 s?" : "What is the object's speed?";
    const tbl = pts.map(([t, x]) => `t = ${t} s → ${x} m`).join("; ");
    return stop ? mc(`A distance–time table: ${tbl}. ${ask}`, "It was stopped (not moving)", ["It was speeding up", "It was moving backward", `It moved at ${v} m/s`], null, "On a distance–time graph, a flat line means the distance isn't changing.", "The distance stays the same, so the object is at rest.", { ok: () => pts[3][1] === pts[2][1] })
      : mc(`A distance–time table: ${tbl}. ${ask}`, v, [v * 4, r(1 / v, 2), v + 1, v * 2], x => `${num(x)} m/s`, "Speed = change in distance ÷ change in time (the slope).", `Each second the distance grows by ${v} m, so speed = ${v} m/s.`, { ok: () => pts[4][1] / 4 === v }); });
  T("kinematics", 3, 5, d => { const kmh = pick([18, 36, 54, 72, 90, 108, 144]), ms = kmh / 3.6; const toMs = Math.random() < 0.5;
    return toMs ? mc(`A car drives at ${kmh} km/h. What is that in m/s?`, ms, [kmh * 3.6, kmh / 60, kmh / 1000, ms * 2], x => `${num(x)} m/s`, "1 km/h = 1000 m ÷ 3600 s, so divide by 3.6.", `${kmh} ÷ 3.6 = ${num(ms)} m/s.`, { ok: () => Math.abs(kmh * 1000 / 3600 - ms) < 1e-9 })
      : mc(`A cheetah runs at ${num(ms)} m/s. What is that in km/h?`, kmh, [r(ms / 3.6, 2), ms * 60, ms * 1000, kmh / 2], x => `${num(x)} km/h`, "m/s → km/h: multiply by 3.6.", `${num(ms)} × 3.6 = ${kmh} km/h.`, { ok: () => Math.abs(ms * 3.6 - kmh) < 1e-9 }); });

  // ───────── Unit 5: Forces & Newton's Laws ─────────
  T("forces", 1, 5, d => { let a = ri(5, 30 + 20 * d), b = ri(5, 30 + 20 * d); if (a === b) b += 3; const same = d === 1 ? Math.random() < 0.5 : Math.random() < 0.3; const net = same ? a + b : Math.abs(a - b); const dir = same ? "right" : a > b ? "right" : a < b ? "left" : "none";
    const txt = same ? `Two kids push a box to the right with ${a} N and ${b} N.` : `One team pulls a rope right with ${a} N; the other pulls left with ${b} N.`;
    return mc(`${txt} What is the net force?`, net === 0 ? "0 N (balanced)" : `${net} N ${dir}`, [same ? `${Math.abs(a - b)} N right` : `${a + b} N right`, `${net} N ${dir === "right" ? "left" : "right"}`, `${Math.round((a + b) / 2)} N right`, "0 N (balanced)"], null, "Same direction → add. Opposite directions → subtract; the bigger side wins.", net === 0 ? "The forces cancel: balanced, no acceleration." : `${same ? `${a} + ${b}` : `${Math.max(a, b)} − ${Math.min(a, b)}`} = ${net} N toward the ${dir}.`, { ok: () => true }); });
  T("forces", 1, 5, d => { const m = d === 1 ? ri(2, 10) : ri(2, 60), a = d === 1 ? ri(1, 5) : r(ri(5, 60) / 10, 1), F = r(m * a, 2); const ask = d === 1 ? "F" : pick(["F", "a", "m"]);
    if (ask === "F") return mc(`What net force is needed to give ${an(m)} ${m} kg cart an acceleration of ${num(a)} m/s²?`, F, [r(m / a, 2), r(a / m, 3), r(m + a, 1), r(F * 2, 1)], x => `${num(x)} N`, "Newton's 2nd law: F = m × a.", `${m} × ${num(a)} = ${num(F)} N.`, { ok: () => Math.abs(m * a - F) < 0.01 });
    if (ask === "a") return mc(`A net force of ${num(F)} N acts on ${an(m)} ${m} kg object. What is its acceleration?`, a, [r(F * m, 1), r(m / F, 3), r(F - m, 1), r(a * 2, 2)], x => `${num(x)} m/s²`, "a = F ÷ m.", `${num(F)} ÷ ${m} = ${num(a)} m/s².`, { ok: () => Math.abs(F / m - a) < 0.01 });
    return mc(`A net force of ${num(F)} N gives an object an acceleration of ${num(a)} m/s². What is its mass?`, m, [r(F * a, 1), r(a / F, 3), r(F - a, 1), m * 2], x => `${num(x)} kg`, "m = F ÷ a.", `${num(F)} ÷ ${num(a)} = ${m} kg.`, { ok: () => Math.abs(F / a - m) < 0.01 }); });
  T("forces", 1, 4, d => { const m = d === 1 ? ri(2, 10) : r(ri(5, 90) / (d === 3 ? 10 : 1), 1), W = r(m * G, 2); const moon = d >= 2 && Math.random() < 0.3;
    return moon ? mc(`On the Moon, gravity is about 1.6 m/s². What does ${an(m)} ${m} kg astronaut weigh there?`, r(m * 1.6, 2), [W, m, r(m / 1.6, 2), r(m * 1.6 * 2, 2)], x => `${num(x)} N`, "Weight = mass × gravity. Mass stays the same; gravity changes.", `${m} × 1.6 = ${num(r(m * 1.6, 2))} N. (On Earth: ${num(W)} N.)`, { ok: () => true })
      : mc(`What is the weight of ${an(m)} ${m} kg backpack on Earth? (g = 9.8 m/s²)`, W, [m, r(m / G, 2), r(m * 10 * 2, 1), r(W + 9.8, 2)], x => `${num(x)} N`, "Weight is a force: W = m × g.", `${m} × 9.8 = ${num(W)} N. Mass (kg) and weight (N) are different!`, { ok: () => Math.abs(m * G - W) < 0.01 }); });
  T("forces", 1, 5, d => { const pairs = [["A swimmer pushes the water backward.", "The water pushes the swimmer forward."], ["A rocket pushes gas downward.", "The gas pushes the rocket upward."], ["Your foot pushes the ground backward when you walk.", "The ground pushes your foot forward."], ["A hammer hits a nail.", "The nail pushes back on the hammer with the same force."], ["The Earth pulls a falling apple down.", "The apple pulls the Earth up with the same force."]];
    const [act, re] = pick(pairs), others = shuffle(pairs.filter(p => p[1] !== re).map(p => p[1])).slice(0, 2);
    return mc(`Newton's 3rd law: "${act}" What is the reaction force?`, re, [...others, "There is no reaction force."], null, "Every action has an equal and opposite reaction, acting on the OTHER object.", `${re} The two forces are equal in size and opposite in direction.`, { ok: () => true }); });
  T("forces", 2, 5, d => { const sc = pick([
      ["A book sits still on a table.", "Balanced: gravity down equals the table's push up", ["Unbalanced: gravity wins", "There are no forces on it", "Only gravity acts on it"]],
      ["A car drives at a steady 60 km/h on a straight road.", "Balanced: the forces cancel, so speed doesn't change", ["Unbalanced: it needs a net force to keep moving", "Only friction acts on it", "There are no forces on it"]],
      ["A sled speeds up going down a hill.", "Unbalanced: there is a net force down the hill", ["Balanced: the forces cancel", "There are no forces on it", "Only friction acts on it"]],
      ["A soccer ball rolls on grass and slowly stops.", "Unbalanced: friction is a net force opposite the motion", ["Balanced: it stops by itself", "Gravity pushes it backward", "There are no forces on it"]]]);
    return mc(`${sc[0]} Which describes the forces?`, sc[1], sc[2], null, "Changing speed or direction → unbalanced (net force). Steady or still → balanced.", sc[1] + ".", { ok: () => true }); });

  // ───────── Unit 8: Energy & Work ─────────
  T("energy", 1, 5, d => { const m = ri(1, 4 + 6 * d), v = ri(1, 3 + 3 * d), KE = 0.5 * m * v * v;
    return mc(`${An(m)} ${m} kg ball moves at ${v} m/s. What is its kinetic energy?`, KE, [m * v, m * v * v, 0.5 * m * v, KE * 2], x => `${num(x)} J`, "KE = ½ × m × v². Square the speed first.", `½ × ${m} × ${v}² = ½ × ${m} × ${v * v} = ${num(KE)} J.`, { ok: () => Math.abs(0.5 * m * v * v - KE) < 1e-9 }); });
  T("energy", 1, 5, d => { const m = ri(1, 3 + 5 * d), h = ri(1, 4 + 6 * d), PE = r(m * G * h, 2);
    return mc(`${An(m)} ${m} kg box sits on a shelf ${h} m high. What is its gravitational potential energy? (g = 9.8 m/s²)`, PE, [m * h, r(m * G, 2), r(m * G / h, 2), r(PE * 2, 1)], x => `${num(x)} J`, "PE = m × g × h.", `${m} × 9.8 × ${h} = ${num(PE)} J.`, { ok: () => Math.abs(m * G * h - PE) < 0.01 }); });
  T("energy", 1, 5, d => { const F = ri(5, 20 * d + 10), dd = ri(2, 5 + 5 * d), W = F * dd; const zero = d >= 2 && Math.random() < 0.25;
    return zero ? mc(`A waiter carries a ${F} N tray ${dd} m across a room, holding it at the same height. How much work does his upward force do on the tray?`, 0, [W, F, dd, W * 2, F + dd], x => `${num(x)} J`, "Work only counts force IN the direction of motion.", "The force is up but the motion is sideways, so the work done by that force is 0 J.", { neg: true, ok: () => true })
      : mc(`You push a box with ${F} N for ${dd} m in the direction you push. How much work do you do?`, W, [F + dd, r(F / dd, 2), W * 2, r(dd / F, 3)], x => `${num(x)} J`, "Work = force × distance (in the direction of the force).", `${F} × ${dd} = ${W} J.`, { ok: () => F * dd === W }); });
  T("energy", 2, 5, d => { const W = ri(2, 20) * 50, t = pick([2, 4, 5, 10, 20, 25]), P = r(W / t, 2);
    return mc(`A motor does ${W} J of work in ${t} s. What is its power?`, P, [W * t, r(t / W, 4), W - t, P * 2], x => `${num(x)} W`, "Power = work ÷ time (how fast work is done).", `${W} ÷ ${t} = ${num(P)} W.`, { ok: () => Math.abs(W / t - P) < 0.01 }); });
  T("energy", 3, 5, d => { const m = ri(1, 10), h = ri(2, 20), PE = r(m * G * h, 2), frac = pick([0.25, 0.5, 0.75]), hNow = h * (1 - frac);
    return mc(`${An(m)} ${m} kg ball is dropped from ${h} m (no air resistance). How much kinetic energy does it have when it has fallen to ${num(hNow)} m above the ground? (g = 9.8)`, r(m * G * h * frac, 2), [PE, r(m * G * hNow, 2), r(PE * (1 - frac) * 0.5, 2), r(m * h * frac, 2)], x => `${num(x)} J`, "Energy is conserved: PE lost on the way down becomes KE.", `PE lost = m × g × (drop) = ${m} × 9.8 × ${num(h - hNow)} = ${num(r(m * G * h * frac, 2))} J of KE.`, { ok: () => Math.abs(m * G * (h - hNow) - m * G * h * frac) < 1e-6 }); });

  // ───────── Unit 9: Waves & Oscillations ─────────
  T("waves", 1, 5, d => { const f = d === 1 ? ri(2, 10) : ri(5, 500), lam = d === 1 ? ri(1, 5) : r(ri(5, 400) / 100, 2), v = r(f * lam, 2); const ask = d === 1 ? "v" : pick(["v", "f", "lam"]);
    if (ask === "v") return mc(`A wave has frequency ${f} Hz and wavelength ${num(lam)} m. What is its speed?`, v, [r(f / lam, 2), r(lam / f, 4), r(f + lam, 2), r(v * 2, 2)], x => `${num(x)} m/s`, "wave speed = frequency × wavelength.", `${f} × ${num(lam)} = ${num(v)} m/s.`, { ok: () => Math.abs(f * lam - v) < 0.01 });
    if (ask === "f") return mc(`A wave travels at ${num(v)} m/s with wavelength ${num(lam)} m. What is its frequency?`, f, [r(v * lam, 2), r(lam / v, 4), r(v - lam, 2), f * 2], x => `${num(x)} Hz`, "f = v ÷ λ.", `${num(v)} ÷ ${num(lam)} = ${f} Hz.`, { ok: () => Math.abs(v / lam - f) < 0.01 });
    return mc(`A wave travels at ${num(v)} m/s with frequency ${f} Hz. What is its wavelength?`, lam, [r(v * f, 1), r(f / v, 4), r(v - f, 2), r(lam * 2, 2)], x => `${num(x)} m`, "λ = v ÷ f.", `${num(v)} ÷ ${f} = ${num(lam)} m.`, { ok: () => Math.abs(v / f - lam) < 0.01 }); });
  T("waves", 1, 5, d => { const f = pick(d === 1 ? [1, 2, 4, 5, 10] : [0.5, 0.25, 2, 4, 5, 8, 20, 25, 50]), Tp = r(1 / f, 4); const ask = Math.random() < 0.5;
    return ask ? mc(`A pendulum has a frequency of ${num(f)} Hz. What is its period?`, Tp, [f, r(f * 2, 2), r(Tp * 2, 3), r(60 / f, 2)], x => `${num(x)} s`, "Period = 1 ÷ frequency (seconds per swing).", `1 ÷ ${num(f)} = ${num(Tp)} s.`, { ok: () => Math.abs(1 / f - Tp) < 1e-6 })
      : mc(`A swing takes ${num(Tp)} s for one full back-and-forth. What is its frequency?`, f, [Tp, r(Tp * 2, 3), r(f * 2, 2), r(60 * Tp, 2)], x => `${num(x)} Hz`, "Frequency = 1 ÷ period (swings per second).", `1 ÷ ${num(Tp)} = ${num(f)} Hz.`, { ok: () => Math.abs(1 / Tp - f) < 1e-6 }); });
  T("waves", 1, 4, d => { const n = ri(10, 60), t = pick([2, 4, 5, 10, 20]), f = r(n / t, 2);
    return mc(`A buoy bobs up and down ${n} times in ${t} s. What is the frequency of the waves?`, f, [n * t, r(t / n, 3), n, f * 2], x => `${num(x)} Hz`, "Frequency = number of cycles ÷ time.", `${n} ÷ ${t} = ${num(f)} Hz.`, { ok: () => Math.abs(n / t - f) < 0.01 }); });
  T("waves", 1, 4, d => { const qs = [["the height of the wave from the middle line to a crest", "amplitude", ["wavelength", "frequency", "period"]], ["the distance from one crest to the next crest", "wavelength", ["amplitude", "frequency", "period"]], ["how many waves pass a point each second", "frequency", ["amplitude", "wavelength", "period"]], ["the time for one complete wave to pass", "period", ["amplitude", "wavelength", "frequency"]]];
    const [desc, ans, wr] = pick(qs); return mc(`Which word means ${desc}?`, ans, wr, null, "Picture a wave on a rope: up-down size, crest-to-crest length, and how often.", `That's the ${ans}.`, { ok: () => true }); });
  T("waves", 2, 5, d => { const sets = [["A sound wave in air", "longitudinal"], ["A slinky pushed back and forth along its length", "longitudinal"], ["A wave on a rope shaken up and down", "transverse"], ["Light from the Sun", "transverse"], ["Ripples on a pond", "transverse"]];
    const [ex, ans] = pick(sets); return mc(`${ex}: is it transverse or longitudinal?`, ans === "transverse" ? "Transverse: the medium moves across the wave's direction" : "Longitudinal: the medium moves back and forth along the wave's direction", ["Transverse: the medium moves across the wave's direction", "Longitudinal: the medium moves back and forth along the wave's direction", "Neither: it isn't a wave", "Both at once"].filter(x => !x.toLowerCase().startsWith(ans)), null, "Transverse = side-to-side (like a rope). Longitudinal = squeeze-and-stretch (like sound).", `${ex} is ${ans}.`, { ok: () => true }); });

  function make(unit, lv, item) {
    const list = U[unit] || []; if (!list.length) return null; lv = Math.max(1, Math.min(5, lv || 2));
    let pool = item && item.tid != null ? list.filter((t, i) => `${unit}:${i}` === item.tid) : [];
    if (!pool.length) pool = list.filter(t => lv >= t.lo && lv <= t.hi); if (!pool.length) pool = list;
    const d = lv <= 2 ? 1 : lv === 3 ? 2 : 3;
    for (let k = 0; k < 12; k++) { const t = pick(pool); let q; try { q = t.fn(d); } catch (e) { q = null; } if (!q || q.a < 0 || q.c.length < 4 || (q.ok && !q.ok()) || q.c.some(c => /NaN|undefined|Infinity/.test(c))) continue; q.tid = `${unit}:${list.indexOf(t)}`; q.glv = lv; return q; }
    return null;
  }
  window.PHY_GEN = { U, make, count: unit => (U[unit] || []).length };
})();
