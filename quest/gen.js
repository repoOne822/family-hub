// Fresh-number problem generators for Realm of Forces (and anything else that wants them).
// Each generator: gen(d) with difficulty d = 1..3 → { q, ans, unit, units, steps, kind }
//   ans: a number, or {n, d} for a fraction answer (kind "frac"). unit: the right unit ("" = none).
//   units: unit choices to show (the right one is included). steps: worked solution lines.
(() => {
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const r = (x, n = 4) => Math.round(x * 10 ** n) / 10 ** n;
const fmt = x => { const s = String(r(x, 6)); if (s.includes("e")) return s; const [i, f] = s.split("."); const ii = i.replace(/\B(?=(\d{3})+(?!\d))/g, ","); return f ? ii + "." + f : ii; };
const G = 9.8;
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
const lcm = (a, b) => a / gcd(a, b) * b;
const fr = (n, d) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return { n: n / g, d: d / g }; };
const frs = f => f.d === 1 ? String(f.n) : `${f.n}/${f.d}`;

const PRE = [["k", 3], ["h", 2], ["da", 1], ["", 0], ["d", -1], ["c", -2], ["m", -3]];
const PRE_NAME = { k: "kilo", h: "hecto", da: "deca", "": "base", d: "deci", c: "centi", m: "milli" };

const GEN = {
 // ---------------- PHYSICS ----------------
 conv: { name: "Metric conversions", subject: "physics", lesson: "measure", gen(d) {
   const base = pick(["m", "g", "L"]);
   const pool = d === 1 ? [["k", 3], ["", 0], ["c", -2], ["m", -3]] : PRE;
   let a = pick(pool), b = pick(pool); while (b[0] === a[0]) b = pick(pool);
   const v = d === 1 ? ri(1, 40) * (pick([1, 1, 10])) : d === 2 ? r(ri(1, 900) / pick([1, 10]), 2) : r(ri(1, 9999) / pick([10, 100, 1000]), 3);
   const steps = a[1] - b[1], ans = r(v * 10 ** steps, 6);
   const u1 = a[0] + base, u2 = b[0] + base;
   return { q: `Convert ${fmt(v)} ${u1} to ${u2}.`, ans, unit: u2, units: [...new Set([u2, u1, (pick(PRE.filter(p => p[0] !== a[0] && p[0] !== b[0]))[0]) + base])],
     steps: [`${u1} → ${u2}: that's ${Math.abs(steps)} step${Math.abs(steps) > 1 ? "s" : ""} ${steps > 0 ? "DOWN the ladder (smaller unit)" : "UP the ladder (bigger unit)"}.`,
       steps > 0 ? `Going down → multiply by ${fmt(10 ** steps)}.` : `Going up → divide by ${fmt(10 ** -steps)}.`,
       `${fmt(v)} ${steps > 0 ? "×" : "÷"} ${fmt(10 ** Math.abs(steps))} = ${fmt(ans)} ${u2}`] }; } },
 speed: { name: "Speed = d ÷ t", subject: "physics", lesson: "kinematics", gen(d) {
   const kmh = d >= 2 && Math.random() < .4;
   const v = kmh ? ri(3, 24) * 5 : ri(2, d === 1 ? 12 : 30), t = kmh ? ri(1, 5) : ri(2, d === 1 ? 10 : 40), dist = v * t;
   const [du, tu, vu] = kmh ? ["km", "h", "km/h"] : ["m", "s", "m/s"];
   return { q: `A ${pick(["cyclist", "runner", "drone", "train", "skateboarder"])} travels ${fmt(dist)} ${du} in ${t} ${tu}. What is the average speed?`, ans: v, unit: vu, units: [vu, kmh ? "m/s" : "km/h", du, tu === "s" ? "m/s²" : "km"],
     steps: ["Formula: v = d ÷ t", `Knowns: d = ${fmt(dist)} ${du}, t = ${t} ${tu}`, `v = ${fmt(dist)} ÷ ${t} = ${v} ${vu}`] }; } },
 dist: { name: "Distance = v × t", subject: "physics", lesson: "kinematics", gen(d) {
   const v = d === 1 ? ri(2, 10) : r(ri(15, 300) / 10, 1), t = ri(3, d === 3 ? 90 : 30), ans = r(v * t, 2);
   return { q: `A cart moves at a constant ${fmt(v)} m/s for ${t} s. How far does it go?`, ans, unit: "m", units: ["m", "m/s", "s", "m/s²"],
     steps: ["Formula: d = v × t", `d = ${fmt(v)} × ${t}`, `d = ${fmt(ans)} m`] }; } },
 time: { name: "Time = d ÷ v", subject: "physics", lesson: "kinematics", gen(d) {
   const v = ri(2, d === 1 ? 10 : 25), t = ri(2, d === 3 ? 120 : 40), dist = v * t;
   return { q: `How long does it take to travel ${fmt(dist)} m at ${v} m/s?`, ans: t, unit: "s", units: ["s", "m", "m/s", "min"],
     steps: ["Formula: t = d ÷ v", `t = ${fmt(dist)} ÷ ${v}`, `t = ${t} s`] }; } },
 accel: { name: "Acceleration", subject: "physics", lesson: "kinematics", gen(d) {
   const t = ri(2, 8), a = d === 1 ? ri(1, 6) : (Math.random() < .45 ? -ri(1, 6) : ri(1, 9)), v0 = a < 0 ? ri(Math.abs(a) * t, Math.abs(a) * t + 20) : ri(0, d === 1 ? 0 : 15), v1 = v0 + a * t;
   return { q: `A ${pick(["car", "bike", "rocket sled", "scooter"])} goes from ${v0} m/s to ${v1} m/s in ${t} s. What is its acceleration?${d > 1 ? " (Use a negative number if it slows down.)" : ""}`, ans: a, unit: "m/s²", units: ["m/s²", "m/s", "m", "N"],
     steps: ["Formula: a = (v_final − v_start) ÷ t", `a = (${v1} − ${v0}) ÷ ${t} = ${v1 - v0} ÷ ${t}`, `a = ${a} m/s²${a < 0 ? " (negative = slowing down)" : ""}`] }; } },
 avgspeed: { name: "Average speed (two legs)", subject: "physics", lesson: "kinematics", gen(d) {
   const t1 = ri(1, 4), t2 = ri(1, 4), v1 = ri(2, 12) * 10, v2 = ri(2, 12) * 10, d1 = v1 * t1, d2 = v2 * t2, ans = r((d1 + d2) / (t1 + t2), 2);
   return { q: `A bus drives ${d1} km in ${t1} h, then ${d2} km in ${t2} h. What is its average speed for the whole trip?`, ans, unit: "km/h", units: ["km/h", "km", "h", "m/s"],
     steps: ["Average speed = TOTAL distance ÷ TOTAL time", `Total distance = ${d1} + ${d2} = ${d1 + d2} km; total time = ${t1} + ${t2} = ${t1 + t2} h`, `${d1 + d2} ÷ ${t1 + t2} = ${fmt(ans)} km/h`] }; } },
 weight: { name: "Weight = m × g", subject: "physics", lesson: "forces", gen(d) {
   if (d === 3 && Math.random() < .5) { const m = ri(2, 90), W = r(m * G, 2); return { q: `An object weighs ${fmt(W)} N on Earth. What is its mass? (g = 9.8 m/s²)`, ans: m, unit: "kg", units: ["kg", "N", "g", "m/s²"], steps: ["W = m × g, so m = W ÷ g", `m = ${fmt(W)} ÷ 9.8`, `m = ${m} kg`] }; }
   const m = d === 1 ? ri(1, 20) : r(ri(5, 900) / 10, 1), W = r(m * G, 2);
   return { q: `What does a ${fmt(m)} kg ${pick(["backpack", "dog", "bike", "box", "student"])} weigh on Earth? (g = 9.8 m/s²)`, ans: W, unit: "N", units: ["N", "kg", "m/s²", "J"],
     steps: ["Formula: W = m × g", `W = ${fmt(m)} × 9.8`, `W = ${fmt(W)} N`] }; } },
 netforce: { name: "Net force", subject: "physics", lesson: "forces", gen(d) {
   const n = d === 1 ? 2 : 3, fs = Array.from({ length: n }, () => ri(2, 40) * (Math.random() < .5 ? 1 : -1)); if (fs.every(x => x > 0)) fs[0] = -fs[0];
   const ans = fs.reduce((a, b) => a + b, 0);
   const desc = fs.map(f => `${Math.abs(f)} N ${f > 0 ? "right" : "left"}`).join(", ");
   return { q: `Forces on a crate: ${desc}. What is the net force? (Use + for right, − for left.)`, ans, unit: "N", units: ["N", "kg", "m/s²", "J"],
     steps: ["Right = +, left = −. Add them all.", `${fs.map(f => (f > 0 ? "+" : "−") + Math.abs(f)).join(" ")} = ${ans}`, ans === 0 ? "Net = 0 N: balanced forces." : `Net = ${Math.abs(ans)} N ${ans > 0 ? "right" : "left"} (${ans} N)`] }; } },
 fma: { name: "F = m × a", subject: "physics", lesson: "forces", gen(d) {
   const m = ri(1, d === 1 ? 10 : 50), a = ri(1, d === 1 ? 6 : 12), F = m * a, which = d === 1 ? "a" : pick(["F", "a", "m"]);
   if (which === "F") return { q: `What net force accelerates a ${m} kg cart at ${a} m/s²?`, ans: F, unit: "N", units: ["N", "kg", "m/s²", "J"], steps: ["F = m × a", `F = ${m} × ${a}`, `F = ${F} N`] };
   if (which === "m") return { q: `A net force of ${F} N gives an object an acceleration of ${a} m/s². What is its mass?`, ans: m, unit: "kg", units: ["kg", "N", "m/s²", "g"], steps: ["m = F ÷ a", `m = ${F} ÷ ${a}`, `m = ${m} kg`] };
   const fr2 = d === 3 ? ri(1, Math.max(1, Math.floor(F / 3))) : 0;
   return { q: fr2 ? `You push a ${m} kg sled with ${F + fr2} N. Friction pushes back with ${fr2} N. What is its acceleration?` : `A net force of ${F} N acts on a ${m} kg ball. What is its acceleration?`, ans: a, unit: "m/s²", units: ["m/s²", "m/s", "N", "kg"],
     steps: fr2 ? [`Net force = ${F + fr2} − ${fr2} = ${F} N`, "a = F_net ÷ m", `a = ${F} ÷ ${m} = ${a} m/s²`] : ["a = F ÷ m", `a = ${F} ÷ ${m}`, `a = ${a} m/s²`] }; } },
 work: { name: "Work = F × d", subject: "physics", lesson: "energy", gen(d) {
   const F = ri(2, d === 1 ? 50 : 300), dd = d === 1 ? ri(1, 10) : r(ri(5, 200) / 10, 1), W = r(F * dd, 2);
   if (d === 3 && Math.random() < .4) return { q: `${W} J of work moves a box ${fmt(dd)} m. What force was applied (in the direction of motion)?`, ans: F, unit: "N", units: ["N", "J", "m", "kg"], steps: ["W = F × d, so F = W ÷ d", `F = ${W} ÷ ${fmt(dd)}`, `F = ${F} N`] };
   return { q: `You push a box with ${F} N for ${fmt(dd)} m in the direction of the push. How much work do you do?`, ans: W, unit: "J", units: ["J", "N", "m", "W"], steps: ["W = F × d", `W = ${F} × ${fmt(dd)}`, `W = ${fmt(W)} J`] }; } },
 ke: { name: "Kinetic energy", subject: "physics", lesson: "energy", gen(d) {
   const m = d === 1 ? ri(1, 10) * 2 : ri(1, 80), v = ri(1, d === 1 ? 6 : 20), KE = r(.5 * m * v * v, 2);
   return { q: `A ${m} kg ${pick(["ball", "cart", "bowling ball", "skater"])} moves at ${v} m/s. What is its kinetic energy?`, ans: KE, unit: "J", units: ["J", "N", "m/s", "kg"],
     steps: ["KE = ½ × m × v²", `Square the speed first: ${v}² = ${v * v}`, `KE = ½ × ${m} × ${v * v} = ${fmt(KE)} J`] }; } },
 pe: { name: "Potential energy", subject: "physics", lesson: "energy", gen(d) {
   const m = ri(1, d === 1 ? 10 : 60), h = ri(1, d === 1 ? 10 : 40), PE = r(m * G * h, 2);
   if (d === 3 && Math.random() < .5) return { q: `A ${m} kg rock has ${fmt(PE)} J of potential energy. How high is it? (g = 9.8 m/s²)`, ans: h, unit: "m", units: ["m", "J", "kg", "N"], steps: ["PE = m × g × h, so h = PE ÷ (m × g)", `h = ${fmt(PE)} ÷ (${m} × 9.8) = ${fmt(PE)} ÷ ${fmt(m * G)}`, `h = ${h} m`] };
   return { q: `A ${m} kg ${pick(["box", "rock", "backpack", "cat"])} sits ${h} m above the ground. What is its potential energy? (g = 9.8 m/s²)`, ans: PE, unit: "J", units: ["J", "N", "m", "kg"],
     steps: ["PE = m × g × h", `PE = ${m} × 9.8 × ${h}`, `PE = ${fmt(PE)} J`] }; } },
 wave: { name: "Wave speed v = f × λ", subject: "physics", lesson: "waves", gen(d) {
   const f = ri(1, d === 1 ? 10 : 500), lam = d === 1 ? ri(1, 10) : r(ri(1, 40) / pick([1, 10]), 1), v = r(f * lam, 2), which = d === 1 ? "v" : pick(["v", "f", "lam"]);
   if (which === "f") return { q: `A wave travels at ${fmt(v)} m/s with a wavelength of ${fmt(lam)} m. What is its frequency?`, ans: f, unit: "Hz", units: ["Hz", "m", "m/s", "s"], steps: ["f = v ÷ λ", `f = ${fmt(v)} ÷ ${fmt(lam)}`, `f = ${f} Hz`] };
   if (which === "lam") return { q: `A wave travels at ${fmt(v)} m/s with a frequency of ${f} Hz. What is its wavelength?`, ans: lam, unit: "m", units: ["m", "Hz", "m/s", "s"], steps: ["λ = v ÷ f", `λ = ${fmt(v)} ÷ ${f}`, `λ = ${fmt(lam)} m`] };
   return { q: `A wave has a frequency of ${f} Hz and a wavelength of ${fmt(lam)} m. How fast does it travel?`, ans: v, unit: "m/s", units: ["m/s", "Hz", "m", "s"], steps: ["v = f × λ", `v = ${f} × ${fmt(lam)}`, `v = ${fmt(v)} m/s`] }; } },
 period: { name: "Period & frequency", subject: "physics", lesson: "waves", gen(d) {
   const opts = [[1, 1], [2, .5], [4, .25], [5, .2], [10, .1], [20, .05], [8, .125], [0.5, 2], [0.25, 4], [0.2, 5]];
   const [f, T] = pick(opts);
   return Math.random() < .5
     ? { q: `A pendulum swings with a frequency of ${f} Hz. What is its period?`, ans: T, unit: "s", units: ["s", "Hz", "m", "m/s"], steps: ["T = 1 ÷ f", `T = 1 ÷ ${f}`, `T = ${T} s`] }
     : { q: `One full swing takes ${T} s. What is the frequency?`, ans: f, unit: "Hz", units: ["Hz", "s", "m", "m/s"], steps: ["f = 1 ÷ T", `f = 1 ÷ ${T}`, `f = ${f} Hz`] }; } },

 // ---------------- PRE-ALGEBRA ----------------
 int: { name: "Integer operations", subject: "math", lesson: "m-numbers", gen(d) {
   const big = d === 1 ? 20 : d === 2 ? 60 : 150, a = ri(-big, big), b = ri(-big, big) || 3, op = pick(d === 1 ? ["+", "−"] : ["+", "−", "×", "÷"]);
   let q, ans;
   if (op === "÷") { const bb = ri(2, 12) * pick([1, -1]); ans = ri(-12, 12); q = `${ans * bb} ÷ (${bb})`; return { q: `Compute: ${q}`, ans, unit: "", steps: ["Same signs → positive; different signs → negative.", `${ans * bb} ÷ ${bb} = ${ans}`] }; }
   ans = op === "+" ? a + b : op === "−" ? a - b : a * b;
   q = `${a} ${op} ${b < 0 ? "(" + b + ")" : b}`;
   return { q: `Compute: ${q}`, ans, unit: "", steps: [op === "−" ? "Subtracting = adding the opposite." : op === "×" ? "Same signs → positive; different signs → negative." : "Think of a number line.", `${q} = ${ans}`] }; } },
 expr: { name: "Evaluate expressions", subject: "math", lesson: "m-expr", gen(d) {
   const x = ri(-6, 9), y = ri(-5, 8), a = ri(2, 7), b = ri(1, 9), c = ri(2, 5);
   if (d === 1) { const ans = a * x + b; return { q: `Evaluate ${a}x + ${b} when x = ${x}.`, ans, unit: "", steps: [`Replace x with ${x}: ${a}(${x}) + ${b}`, `${a * x} + ${b} = ${ans}`] }; }
   if (d === 2) { const ans = a * x - c * y; return { q: `Evaluate ${a}x − ${c}y when x = ${x} and y = ${y}.`, ans, unit: "", steps: [`${a}(${x}) − ${c}(${y})`, `${a * x} − ${c * y} = ${ans}`] }; }
   const ans = x * x + a * (y - b); return { q: `Evaluate x² + ${a}(y − ${b}) when x = ${x} and y = ${y}.`, ans, unit: "", steps: ["Order of operations: parentheses, exponents, multiply, add.", `${x}² = ${x * x}; (${y} − ${b}) = ${y - b}`, `${x * x} + ${a}(${y - b}) = ${x * x} + ${a * (y - b)} = ${ans}`] }; } },
 eq: { name: "Solve equations", subject: "math", lesson: "m-expr", gen(d) {
   const x = ri(-12, 15), a = ri(2, 9), b = ri(-20, 20), c = ri(1, 6);
   if (d === 1) { const k = x + b; return { q: `Solve for x: x + ${b < 0 ? "(" + b + ")" : b} = ${k}`, ans: x, unit: "", steps: [`Subtract ${b} from both sides.`, `x = ${k} − ${b < 0 ? "(" + b + ")" : b} = ${x}`] }; }
   if (d === 2) { const k = a * x + b; return { q: `Solve for x: ${a}x ${b < 0 ? "−" : "+"} ${Math.abs(b)} = ${k}`, ans: x, unit: "", steps: [`${b < 0 ? "Add" : "Subtract"} ${Math.abs(b)} on both sides: ${a}x = ${k - b}`, `Divide by ${a}: x = ${x}`] }; }
   const a2 = a + c, k = a2 * x + b - a * x; // a2 x + b = a x + k  → c x = k - b
   return { q: `Solve for x: ${a2}x ${b < 0 ? "−" : "+"} ${Math.abs(b)} = ${a}x ${k < 0 ? "−" : "+"} ${Math.abs(k)}`, ans: x, unit: "", steps: [`Subtract ${a}x from both sides: ${c}x ${b < 0 ? "−" : "+"} ${Math.abs(b)} = ${k}`, `${b < 0 ? "Add" : "Subtract"} ${Math.abs(b)}: ${c}x = ${k - b}`, `Divide by ${c}: x = ${x}`] }; } },
 frac: { name: "Fractions", subject: "math", lesson: "m-frac", gen(d) {
   const dens = d === 1 ? [2, 3, 4, 5, 6, 8] : [2, 3, 4, 5, 6, 7, 8, 9, 10, 12];
   const b = pick(dens), e = pick(dens), a = ri(1, b - 1 || 1), c = ri(1, e - 1 || 1), op = pick(d === 1 ? ["+", "−"] : ["+", "−", "×", "÷"]);
   let A;
   if (op === "+") A = fr(a * e + c * b, b * e); else if (op === "−") A = fr(a * e - c * b, b * e); else if (op === "×") A = fr(a * c, b * e); else A = fr(a * e, b * c);
   const L = lcm(b, e);
   return { q: `Compute and simplify: ${a}/${b} ${op} ${c}/${e}`, ans: A, unit: "", kind: "frac",
     steps: op === "+" || op === "−" ? [`Common denominator: ${L}`, `${a}/${b} = ${a * L / b}/${L}, ${c}/${e} = ${c * L / e}/${L}`, `${a * L / b} ${op} ${c * L / e} = ${a * L / b + (op === "+" ? 1 : -1) * c * L / e} → ${frs(A)}`]
       : op === "×" ? ["Multiply tops, multiply bottoms.", `${a}×${c} / ${b}×${e} = ${a * c}/${b * e}`, `Simplify → ${frs(A)}`]
       : ["Keep, change, flip: multiply by the reciprocal.", `${a}/${b} × ${e}/${c} = ${a * e}/${b * c}`, `Simplify → ${frs(A)}`] }; } },
 gcf: { name: "GCF & LCM", subject: "math", lesson: "m-frac", gen(d) {
   const g = ri(2, d === 1 ? 6 : 12), a = g * ri(1, 9), b = g * ri(1, 9), A = a === b ? a + g : a;
   if (Math.random() < .5) { const ans = gcd(A, b); return { q: `What is the GCF of ${A} and ${b}?`, ans, unit: "", steps: ["GCF = the biggest number that divides both.", `Factors in common… the biggest is ${ans}.`] }; }
   const ans = lcm(A, b); return { q: `What is the LCM of ${A} and ${b}?`, ans, unit: "", steps: ["LCM = the smallest number both divide into.", `LCM = ${A} × ${b} ÷ GCF(${gcd(A, b)}) = ${ans}`] }; } },
 exp: { name: "Exponents & roots", subject: "math", lesson: "m-exp", gen(d) {
   const t = pick(d === 1 ? ["pow", "root"] : ["pow", "root", "rule", "neg"]);
   if (t === "root") { const n = ri(2, d === 1 ? 12 : 20); return { q: `√${n * n} = ?`, ans: n, unit: "", steps: [`What number times itself is ${n * n}?`, `${n} × ${n} = ${n * n}, so √${n * n} = ${n}`] }; }
   if (t === "rule") { const a = ri(2, 9), b = ri(2, 9), mul = Math.random() < .5; return { q: mul ? `x^${a} · x^${b} = x^? (give the exponent)` : `x^${a + b} ÷ x^${b} = x^? (give the exponent)`, ans: mul ? a + b : a, unit: "", steps: [mul ? "Same base, multiplying → ADD the exponents." : "Same base, dividing → SUBTRACT the exponents.", mul ? `${a} + ${b} = ${a + b}` : `${a + b} − ${b} = ${a}`] }; }
   if (t === "neg") { const b = ri(2, 5), e = pick([2, 3]), neg = Math.random() < .5; const val = neg ? -(b ** e) : (-b) ** e; return { q: neg ? `Compute: −${b}^${e}` : `Compute: (−${b})^${e}`, ans: val, unit: "", steps: [neg ? `Exponent first, then the minus: −(${b}^${e})` : `The minus is inside: (−${b}) multiplied ${e} times.`, `= ${val}`] }; }
   const b = ri(2, d === 1 ? 5 : 9), e = ri(2, d === 1 ? 3 : 4), ans = b ** e; return { q: `${b}^${e} = ?`, ans, unit: "", steps: [`${b} multiplied by itself ${e} times`, `${Array(e).fill(b).join(" × ")} = ${ans}`] }; } },
 pct: { name: "Percents", subject: "math", lesson: "m-ratio", gen(d) {
   const t = pick(d === 1 ? ["of"] : d === 2 ? ["of", "what"] : ["of", "what", "change"]);
   if (t === "what") { const whole = ri(2, 20) * 10, p = pick([10, 20, 25, 30, 40, 50, 60, 75, 80]), part = whole * p / 100; return { q: `${part} is what percent of ${whole}?`, ans: p, unit: "%", units: ["%"], steps: ["percent = part ÷ whole × 100", `${part} ÷ ${whole} × 100 = ${p}%`] }; }
   if (t === "change") { const old = ri(2, 20) * 10, p = pick([10, 20, 25, 50]) * pick([1, -1]), nw = old * (1 + p / 100); return { q: `A price changes from $${old} to $${nw}. What is the percent change? (negative = decrease)`, ans: p, unit: "%", units: ["%"], steps: ["percent change = (new − old) ÷ old × 100", `(${nw} − ${old}) ÷ ${old} × 100 = ${p}%`] }; }
   const p = pick(d === 1 ? [10, 20, 25, 50] : [5, 15, 30, 35, 40, 60, 75, 120]), n = ri(2, 30) * (d === 1 ? 4 : 20), ans = r(p * n / 100, 2); return { q: `What is ${p}% of ${n}?`, ans, unit: "", steps: [`${p}% = ${p / 100}`, `${p / 100} × ${n} = ${fmt(ans)}`] }; } },
 prop: { name: "Ratios & proportions", subject: "math", lesson: "m-ratio", gen(d) {
   const a = ri(1, 9), b = ri(2, 12), k = ri(2, d === 1 ? 5 : 12), c = a * k, x = b * k;
   if (Math.random() < .5) return { q: `Solve for x: ${a}/${b} = ${c}/x`, ans: x, unit: "", steps: ["Cross-multiply: " + `${a}·x = ${b}·${c}`, `x = ${b * c} ÷ ${a} = ${x}`] };
   const price = ri(2, 9) * (d === 1 ? 1 : 0.5) , n1 = ri(2, 6), n2 = n1 * ri(2, 5), ans = r(price * n2, 2);
   return { q: `${n1} notebooks cost $${fmt(r(price * n1, 2))}. At the same rate, how much do ${n2} notebooks cost? (in dollars)`, ans, unit: "", steps: [`Unit rate: $${fmt(r(price * n1, 2))} ÷ ${n1} = $${fmt(price)} each`, `${n2} × $${fmt(price)} = $${fmt(ans)}`] }; } },
 angle: { name: "Angles & triangles", subject: "math", lesson: "m-angles", gen(d) {
   const t = pick(d === 1 ? ["supp", "comp", "tri"] : ["supp", "comp", "tri", "vert", "triX", "ext"]);
   if (t === "supp") { const a = ri(20, 160); return { q: `Two angles are supplementary. One is ${a}°. What is the other?`, ans: 180 - a, unit: "°", units: ["°"], steps: ["Supplementary angles add to 180°.", `180 − ${a} = ${180 - a}°`] }; }
   if (t === "comp") { const a = ri(10, 80); return { q: `Two angles are complementary. One is ${a}°. What is the other?`, ans: 90 - a, unit: "°", units: ["°"], steps: ["Complementary angles add to 90°.", `90 − ${a} = ${90 - a}°`] }; }
   if (t === "vert") { const a = ri(20, 160); return { q: `Two lines cross. One angle is ${a}°. What is the angle vertically opposite it?`, ans: a, unit: "°", units: ["°"], steps: ["Vertical angles are equal.", `${a}°`] }; }
   if (t === "ext") { const a = ri(25, 80), b = ri(25, 80); return { q: `A triangle has interior angles ${a}° and ${b}°. What is the exterior angle at the third corner?`, ans: a + b, unit: "°", units: ["°"], steps: ["An exterior angle = the sum of the two far interior angles.", `${a} + ${b} = ${a + b}°`] }; }
   if (t === "triX") { const x = ri(10, 30), A = 2 * x, B = x + ri(5, 20), C = 180 - A - B; if (C <= 0) return GEN.angle.gen(1); const k = B - x; return { q: `A triangle's angles are 2x, x + ${k}, and ${C}°. Find x.`, ans: x, unit: "", steps: ["Angles in a triangle add to 180°.", `2x + x + ${k} + ${C} = 180 → 3x = ${180 - k - C}`, `x = ${x}`] }; }
   const a = ri(25, 100), b = ri(20, 155 - a); return { q: `A triangle has angles ${a}° and ${b}°. What is the third angle?`, ans: 180 - a - b, unit: "°", units: ["°"], steps: ["Angles in a triangle add to 180°.", `180 − ${a} − ${b} = ${180 - a - b}°`] }; } }
};

// answer checking: number + unit (units matter, like Dr. Covert's tests); fractions compared by value
const parseNum = s => { s = String(s).trim().replace(/,/g, "").replace(/−/g, "-").replace(/\s+/g, ""); if (/^-?\d+\/-?\d+$/.test(s)) { const [n, d] = s.split("/").map(Number); return d ? n / d : NaN; } if (/^-?\d+\s*\d+\/\d+$/.test(s)) return NaN; return s === "" ? NaN : Number(s); };
function check(p, raw, unit) {
  const v = parseNum(raw); if (!isFinite(v)) return { ok: false, why: "number" };
  const target = p.kind === "frac" ? p.ans.n / p.ans.d : p.ans;
  const close = Math.abs(v - target) <= Math.max(Math.abs(target) * 0.01, 0.006);
  if (p.kind === "frac" && close && /\//.test(String(raw))) { const [n, d] = String(raw).replace(/−/g, "-").split("/").map(Number); if (gcd(n, d) !== 1) return { ok: false, why: "simplify" }; }
  const needUnit = p.unit && p.units && p.units.length > 1;
  if (close && needUnit && unit !== p.unit) return { ok: false, why: "unit" };
  return { ok: close, why: close ? "" : "value" };
}
const answerText = p => p.kind === "frac" ? frs(p.ans) : fmt(p.ans) + (p.unit ? (p.unit === "%" || p.unit === "°" ? p.unit : " " + p.unit) : "");
window.QGEN = { GEN, check, answerText, fmt };
})();
