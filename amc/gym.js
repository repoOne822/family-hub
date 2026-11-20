// Practice gym: endless, auto-generated AMC-style problems for each lesson.
// Every template computes its own answer, builds "smart" wrong choices from common mistakes,
// and writes a step-by-step solution (Look / Plan / Solve / Check) plus the trap.
(function () {
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const lcm = (a, b) => (a / gcd(a, b)) * b;
  const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  const sup = n => String(n).split("").map(d => SUP[+d]).join("");
  const nf = n => { let c = 0; for (let d = 1; d <= n; d++) if (n % d === 0) c++; return c; };
  const fac = n => { const parts = []; let m = n; for (let p = 2; p * p <= m; p++) { let e = 0; while (m % p === 0) { m /= p; e++; } if (e) parts.push(p + (e > 1 ? sup(e) : "")); } if (m > 1) parts.push(String(m)); return parts.join(" × ") || "1"; };
  const frac = (n, d) => { const g = gcd(n, d); n /= g; d /= g; return d === 1 ? String(n) : `${n}/${d}`; };
  const money = c => "$" + (c / 100).toFixed(2);
  const deg = x => `${x}°`;
  const pi = k => (k === 1 ? "π" : `${k}π`);
  const fact = n => (n <= 1 ? 1 : n * fact(n - 1));
  const P = (n, r) => { let x = 1; for (let i = 0; i < r; i++) x *= n - i; return x; };
  const Cn = (n, r) => P(n, r) / fact(r);
  const sgn = (v, first) => (v < 0 ? (first ? "−" : " − ") + Math.abs(v) : (first ? "" : " + ") + v);

  // build 5 choices: answer + smart wrongs, then numeric neighbours if needed
  function build(t) {
    const fmt = t.fmt || (x => String(x));
    const ans = fmt(t.a), seen = new Set([ans]), ch = [ans];
    for (const w of t.w || []) { if (w === undefined || w === null || (typeof w === "number" && (!isFinite(w) || w < (t.min ?? 0)))) continue; const s = fmt(w); if (!seen.has(s) && ch.length < 5) { seen.add(s); ch.push(s); } }
    if (typeof t.a === "number") { const step = t.step || 1; let k = 1; while (ch.length < 5 && k < 60) { for (const v of [t.a + k * step, t.a - k * step]) { if (ch.length < 5 && v >= (t.min ?? 0)) { const s = fmt(v); if (!seen.has(s)) { seen.add(s); ch.push(s); } } } k++; } }
    for (let i = ch.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ch[i], ch[j]] = [ch[j], ch[i]]; }
    return { q: t.q, c: ch, a: ch.indexOf(ans), steps: t.s, trap: t.trap, why: t.s[2], hint: t.s[1], gen: true, ok: t.ok ? t.ok() : true };
  }

  const G = {};
  G.factors = [
    () => { let p, q, a, b, n; do { [p, q] = pick([[2, 3], [2, 5], [2, 7], [3, 5], [3, 7]]); a = ri(1, 4); b = ri(1, 3); n = p ** a * q ** b; } while (n > 2000); const ans = (a + 1) * (b + 1);
      return { q: `How many positive factors does ${n} have?`, a: ans, w: [a * b, a + b + 2, a + b, ans + 2, ans - 2],
        s: [`Count the factors of ${n}. Listing them all is slow and easy to mess up.`, "Break it into prime bricks, add 1 to each power, then multiply.",
            `${n} = ${p}${sup(a)} × ${q}${sup(b)}. (${a} + 1) × (${b} + 1) = ${a + 1} × ${b + 1} = ${ans}.`, `Each factor uses 0 to ${a} ${p}s and 0 to ${b} ${q}s: ${a + 1} × ${b + 1} choices. ✅`],
        trap: "Multiplying the powers themselves forgets the choice of using NONE of a prime. That's why you add 1.", ok: () => nf(n) === ans }; },
    () => { let g = ri(2, 15), m, k; do { m = ri(2, 9); k = ri(2, 9); } while (m === k || gcd(m, k) !== 1); const A = g * m, B = g * k;
      return { q: `What is the greatest common factor of ${A} and ${B}?`, a: g, w: [Math.min(A, B), Math.abs(A - B), g * 2, lcm(A, B), Math.floor(g / 2)],
        s: [`Find the BIGGEST number that divides both ${A} and ${B}.`, "Break both into prime bricks and keep only the bricks they share.",
            `${A} = ${fac(A)}. ${B} = ${fac(B)}. The shared bricks multiply to ${g}.`, `${A} ÷ ${g} = ${m} and ${B} ÷ ${g} = ${k}, and ${m} and ${k} share no factor, so nothing bigger works. ✅`],
        trap: "The smaller number only works if it divides the bigger one evenly.", ok: () => gcd(A, B) === g }; },
    () => { let a, b; do { a = pick([4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20]); b = pick([4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20]); } while (a >= b || b % a === 0); const L = lcm(a, b);
      return { q: `Light A blinks every ${a} seconds and light B every ${b} seconds. They just blinked together. In how many seconds will they next blink together?`, a: L, w: [a * b, a + b, gcd(a, b), 2 * L, b],
        s: ["'Together again' means a time that is a multiple of BOTH numbers, and we want the first one.", "That's the LCM: every prime brick, using the most of each.",
            `${a} = ${fac(a)}, ${b} = ${fac(b)}. Most of each brick: ${fac(L)} = ${L}.`, `${L} ÷ ${a} = ${L / a} and ${L} ÷ ${b} = ${L / b}. Both whole. ✅`],
        trap: `${a} × ${b} = ${a * b} works, but it's only the smallest when the numbers share no factor.`, ok: () => L % a === 0 && L % b === 0 && [...Array(L - 1)].every((_, i) => !((i + 1) % a === 0 && (i + 1) % b === 0)) }; }];

  G.parity = [
    () => { let a, b; do { a = ri(2, 9); b = ri(2, 9); } while (a >= b || b % a === 0); const N = ri(50, 200), na = Math.floor(N / a), nb = Math.floor(N / b), L = lcm(a, b), nab = Math.floor(N / L), ans = na + nb - nab;
      return { q: `How many whole numbers from 1 to ${N} are divisible by ${a} or by ${b}?`, a: ans, w: [na + nb, na + nb - 2 * nab, N - ans, ans + 1],
        s: [`Count numbers divisible by ${a} OR ${b} (or both).`, `Count each list, then subtract the overlap (multiples of ${L}, the LCM), which got counted twice.`,
            `Multiples of ${a}: ${N} ÷ ${a} → ${na}. Multiples of ${b}: ${N} ÷ ${b} → ${nb}. Both (multiples of ${L}): ${nab}. ${na} + ${nb} − ${nab} = ${ans}.`, `The ${nab} multiples of ${L} are now counted exactly once. ✅`],
        trap: `${na + nb} counts the multiples of ${L} twice.`, ok: () => { let c = 0; for (let i = 1; i <= N; i++) if (i % a === 0 || i % b === 0) c++; return c === ans; } }; },
    () => { const d = [ri(1, 9), ri(0, 9), ri(0, 9), ri(0, 9)], pos = ri(0, 3), lo = pos === 0 ? 1 : 0; const known = d.reduce((s, x, i) => s + (i === pos ? 0 : x), 0);
      let ans = lo; while ((known + ans) % 9) ans++; const pat = d.map((x, i) => (i === pos ? "▢" : x)).join("");
      return { q: `The four-digit number ${pat} is divisible by 9. What is the smallest digit that can go in the box?`, a: ans, w: [(ans + 3) % 10, (ans + 1) % 10, (9 - known % 9) % 10 === ans ? (ans + 6) % 10 : (9 - known % 9) % 10, known % 10], step: 1, fmt: x => String(x),
        s: ["A digit is missing, the number must divide by 9, and we want the smallest digit.", "Digit-sum rule: all the digits must add to a multiple of 9.",
            `The known digits add to ${known}. ${known} + ▢ must be a multiple of 9, so ▢ = ${ans}${ans === 0 && known % 9 === 0 ? " (or 9, but 0 is smaller)" : ""}.`, `${pat.replace("▢", ans)}: digit sum ${known + ans} = 9 × ${(known + ans) / 9}. ✅`],
        trap: pos === 0 ? "The first digit can't be 0." : "Check 0 too! It's the smallest digit.", ok: () => Number(pat.replace("▢", ans)) % 9 === 0 }; },
    () => { const N = ri(10000, 99999), ds = String(N).split("").reduce((s, x) => s + +x, 0), ans = N % 9;
      return { q: `What is the remainder when ${N} is divided by 9?`, a: ans, w: [(ans + 1) % 9, (ans + 8) % 9, (ans + 3) % 9, (ans + 5) % 9],
        s: ["Dividing a 5-digit number by 9 is slow. There's a shortcut.", "A number and its digit sum leave the SAME remainder when divided by 9.",
            `Digit sum: ${String(N).split("").join(" + ")} = ${ds}. ${ds} ÷ 9 leaves remainder ${ans}.`, `${N} = 9 × ${Math.floor(N / 9)} + ${ans}. ✅`],
        trap: "The digit sum itself isn't the answer. You still divide IT by 9.", ok: () => N % 9 === ds % 9 }; }];

  G.bases = [
    () => { const b = ri(3, 7), d = [ri(1, b - 1), ri(0, b - 1), ri(0, b - 1)], str = d.join(""), ans = d[0] * b * b + d[1] * b + d[2];
      return { q: `What is ${str} in base ${b}, written as a normal (base 10) number?`, a: ans, w: [+str, d[0] * b + d[1] * b + d[2], d[0] * 10 * b + d[1] * b + d[2], ans + b],
        s: [`Base ${b} places, from the right: 1, ${b}, ${b * b}.`, "Multiply each digit by its place value and add.",
            `${d[0]} × ${b * b} + ${d[1]} × ${b} + ${d[2]} × 1 = ${d[0] * b * b} + ${d[1] * b} + ${d[2]} = ${ans}.`, `Every digit is less than ${b}, so ${str} is a real base-${b} number. ✅`],
        trap: `Don't read it as ${+str}. The places are ${b * b}, ${b}, 1, not 100, 10, 1.`, ok: () => parseInt(str, b) === ans }; },
    () => { const n = ri(9, 63), ans = n.toString(2), places = []; for (let p = 2 ** (ans.length - 1); p >= 1; p /= 2) places.push(p);
      const rev = ans.split("").reverse().join(""); return { q: `What is ${n} written in base 2?`, a: ans, fmt: x => x,
        w: [rev, (n + 1).toString(2), (n - 1).toString(2), (n ^ 2).toString(2), (n ^ 1).toString(2), (n ^ 4).toString(2)],
        s: [`Base 2 places: ${places.join(", ")}.`, "Take the biggest place that fits, subtract, and repeat. Write 1 if it fits, 0 if not.",
            `${n} = ${places.filter((p, i) => ans[i] === "1").join(" + ")} → ${ans}.`, `${places.filter((p, i) => ans[i] === "1").join(" + ")} = ${n}. ✅`],
        trap: "The biggest place goes on the LEFT.", ok: () => parseInt(ans, 2) === n }; },
    () => { const a = pick([2, 3, 4, 7, 8, 9]), n = ri(11, 99), cyc = []; let x = a % 10; while (!cyc.includes(x)) { cyc.push(x); x = (x * a) % 10; } const L = cyc.length, r = n % L, ans = cyc[(r + L - 1) % L];
      let mp = 1; for (let i = 0; i < n; i++) mp = (mp * a) % 10;
      return { q: `What is the ones digit of ${a}${sup(n)}?`, a: ans, w: [...cyc.filter(v => v !== ans), a, (ans + 5) % 10],
        s: ["We only need the LAST digit of a gigantic number.", "Last digits of powers repeat in a cycle. Find the cycle, then use the remainder.",
            `Last digits of ${a}, ${a}², ${a}³, …: ${cyc.join(", ")} (cycle of ${L}). ${n} ÷ ${L} leaves remainder ${r}${r === 0 ? `, which means the LAST one in the cycle` : ` → number ${r} in the cycle`}: ${ans}.`, `The pattern ${cyc.join(", ")} repeats every ${L} steps. ✅`],
        trap: "Remainder 0 means the last digit in the cycle, not the first.", ok: () => mp === ans }; }];

  G.sequences = [
    () => { const a = ri(1, 20), d = ri(2, 9), n = ri(10, 40), ans = a + (n - 1) * d;
      return { q: `What is term number ${n} in the list ${a}, ${a + d}, ${a + 2 * d}, ${a + 3 * d}, …?`, a: ans, w: [a + n * d, a + (n - 2) * d, n * d, ans + 1],
        s: [`It starts at ${a} and adds ${d} each time.`, "Term n = first + (n − 1) × step.", `${a} + ${n - 1} × ${d} = ${a} + ${(n - 1) * d} = ${ans}.`, `Term 2 = ${a} + 1 × ${d} = ${a + d}, which matches the list. ✅`],
        trap: `${a} + ${n} × ${d} takes one step too many.`, ok: () => { let v = a; for (let i = 1; i < n; i++) v += d; return v === ans; } }; },
    () => { const a = ri(2, 30), d = ri(2, 9), n = ri(12, 45), l = a + (n - 1) * d;
      return { q: `How many numbers are in the list ${a}, ${a + d}, ${a + 2 * d}, …, ${l}?`, a: n, w: [n - 1, n + 1, Math.floor(l / d), n - 2],
        s: [`The list goes from ${a} to ${l}, adding ${d} each time.`, "(last − first) ÷ step counts the GAPS. Add 1 for the numbers (like fence posts).",
            `(${l} − ${a}) ÷ ${d} = ${n - 1} gaps, so ${n - 1} + 1 = ${n} numbers.`, `Term ${n} = ${a} + ${n - 1} × ${d} = ${l}. ✅`],
        trap: `${n - 1} counts the gaps, not the numbers.`, ok: () => { let c = 0; for (let v = a; v <= l; v += d) c++; return c === n; } }; },
    () => { let a, d, n; do { a = ri(1, 20); d = ri(1, 6); n = ri(6, 20); } while (((2 * a + (n - 1) * d) * n) % 2); const l = a + (n - 1) * d, ans = (a + l) * n / 2;
      return { q: `What is the sum ${a} + ${a + d} + ${a + 2 * d} + … + ${l}?`, a: ans, w: [(a + l) * n, (a + l) * (n - 1) / 2, ans + l, ans - a],
        s: [`Add a list that goes up by ${d} each time, from ${a} to ${l}.`, "Count the terms, then sum = (first + last) × count ÷ 2.",
            `Count = (${l} − ${a}) ÷ ${d} + 1 = ${n}. Sum = (${a} + ${l}) × ${n} ÷ 2 = ${a + l} × ${n} ÷ 2 = ${ans}.`, `Pairing first + last gives ${a + l} each time. ✅`],
        trap: "Don't forget the ÷ 2. Each pair is counted once.", ok: () => { let s = 0; for (let v = a; v <= l; v += d) s += v; return s === ans; } }; },
    () => { const word = pick(["PLANET", "SCHOOL"].filter(w => new Set(w).size >= 5).concat(["MAGIC", "BRAVE", "TIGER", "ROCKET", "PURPLE"].filter(w => new Set(w).size === w.length))), k = word.length, p = ri(100, 3000), r = p % k, ans = word[(r + k - 1) % k];
      return { q: `The letters ${word} repeat forever: ${word}${word}${word}… What is letter number ${p}?`, a: ans, fmt: x => x, w: word.split("").filter(c => c !== ans),
        s: [`The pattern is ${k} letters long and keeps repeating.`, `Divide the position by ${k} and look at the remainder.`,
            `${p} ÷ ${k} = ${Math.floor(p / k)} remainder ${r}. ${r === 0 ? `Remainder 0 means the LAST letter: ${ans}.` : `Remainder ${r} → letter ${r} of ${word}: ${ans}.`}`, `After ${Math.floor(p / k)} full rounds you're back at the start, then count ${r || k} more. ✅`],
        trap: "Remainder 0 means the last letter, not the first.", ok: () => word.repeat(Math.ceil(p / k) + 1)[p - 1] === ans }; }];

  G.ratios = [
    () => { let a, b; do { a = ri(1, 9); b = ri(1, 9); } while (a === b || gcd(a, b) !== 1); const k = ri(2, 12), T = (a + b) * k, ans = a * k;
      return { q: `Red and blue beads are in the ratio ${a} : ${b}. There are ${T} beads. How many are red?`, a: ans, w: [b * k, k, a * (k + 1), T - k],
        s: [`${a} parts red for every ${b} parts blue.`, "Total parts → the size of one part → the red parts.", `${a} + ${b} = ${a + b} parts. ${T} ÷ ${a + b} = ${k} per part. Red = ${a} × ${k} = ${ans}.`, `Blue = ${b * k}. ${ans} + ${b * k} = ${T}. ✅`],
        trap: `Use ${a + b} total parts, not just ${a} or ${b}.`, ok: () => ans * b === b * k * a && ans + b * k === T }; },
    () => { const c = 5 * ri(3, 19), n = ri(3, 8), m = ri(9, 20);
      return { q: `${n} notebooks cost ${money(n * c)}. How much do ${m} notebooks cost?`, a: m * c, fmt: money, w: [(m + 1) * c, (m - 1) * c, n * c + (m - n) * 10, m * c + 50, m * c - 25], step: 5,
        s: ["Every notebook costs the same.", "Find the price of ONE first (the unit price).", `${money(n * c)} ÷ ${n} = ${money(c)} each. ${m} × ${money(c)} = ${money(m * c)}.`, `${m} notebooks are ${m} ÷ ${n} of the original bunch, and the price grows the same way. ✅`],
        trap: "Find the price of one before scaling up.", ok: () => (n * c) / n === c }; },
    () => { let t1, t2, s1, s2; do { t1 = ri(1, 4); t2 = ri(1, 4); s1 = 2 * ri(1, 6); s2 = 2 * ri(1, 6); } while (s1 === s2 || (s1 * t1 + s2 * t2) % (t1 + t2) || t1 === t2); const D = s1 * t1 + s2 * t2, ans = D / (t1 + t2);
      const mph = x => `${+x.toFixed(2)} mph`;
      return { q: `A biker rides ${s1} mph for ${t1} hour${t1 > 1 ? "s" : ""}, then ${s2} mph for ${t2} hour${t2 > 1 ? "s" : ""}. What is the average speed for the whole ride?`, a: ans, fmt: mph, w: [(s1 + s2) / 2, ans + 1, ans - 1, Math.max(s1, s2), (s1 + s2) / 2 + 0.5],
        s: ["The average over the WHOLE ride.", "Average speed = total distance ÷ total time. Don't just average the two speeds!",
            `Distance: ${s1} × ${t1} + ${s2} × ${t2} = ${s1 * t1} + ${s2 * t2} = ${D} miles. Time: ${t1 + t2} hours. ${D} ÷ ${t1 + t2} = ${ans} mph.`, `${ans} is closer to the speed ridden for longer. ✅`],
        trap: `(${s1} + ${s2}) ÷ 2 = ${(s1 + s2) / 2} ignores how long each part took.`, ok: () => ans * (t1 + t2) === D }; },
    () => { const Pr = 20 * ri(2, 10), x = pick([10, 20, 25, 50]), y = pick([10, 20, 25]), ans = Pr * 100 * (100 - x) * (100 - y) / 10000;
      return { q: `A game costs ${money(Pr * 100)}. It's ${x}% off, and then you get another ${y}% off the sale price. What do you pay?`, a: ans, fmt: money, step: 100,
        w: [Pr * 100 * (100 - x - y) / 100, Pr * (100 - x), Pr * (100 - y), Pr * 100 - (x + y) * 100],
        s: ["Two discounts, one after the other. The second one is taken from the NEW price.", `${x}% off means you pay ${100 - x}%. Then ${y}% off means you pay ${100 - y}% of that.`,
            `${100 - x}% of ${money(Pr * 100)} = ${money(Pr * (100 - x))}. ${100 - y}% of that = ${money(ans)}.`, `${money(Pr * 100)} × ${(100 - x) / 100} × ${(100 - y) / 100} = ${money(ans)}. ✅`],
        trap: `Adding them to ${x + y}% off is wrong. The ${y}% comes off a smaller price.`, ok: () => Math.abs(ans - Pr * 100 * (1 - x / 100) * (1 - y / 100)) < 1e-6 }; }];

  G.equations = [
    () => { const x = ri(2, 15), a = ri(3, 9), c = ri(1, a - 1), b = pick([-9, -7, -5, -4, -3, -2, 2, 3, 4, 5, 6, 8, 10]), d = (a - c) * x + b, cx = c === 1 ? "x" : `${c}x`;
      return { q: `Solve ${a}x${sgn(b)} = ${cx}${sgn(d)}.`, a: x, w: [x + 1, x - 1, d - b, Math.round((d + b) / (a - c)), (a - c) * x], min: 1,
        s: ["There are x's on both sides.", "Move the x's to one side and the plain numbers to the other, doing the same to BOTH sides.",
            `Subtract ${cx}: ${a - c}x${sgn(b)} = ${d}. ${b >= 0 ? `Subtract ${b}` : `Add ${-b}`}: ${a - c}x = ${d - b}. Divide by ${a - c}: x = ${x}.`, `Left: ${a} × ${x}${sgn(b)} = ${a * x + b}. Right: ${c} × ${x}${sgn(d)} = ${c * x + d}. Equal! ✅`],
        trap: `${d - b} is ${a - c}x, not x. Don't forget the last step.`, ok: () => a * x + b === c * x + d }; },
    () => { const k = pick([3, 5]), m = ri(10, 60), S = k * m, big = Math.random() < 0.6, h = (k - 1) / 2, ans = big ? m + h : m - h;
      return { q: `${k} numbers in a row add up to ${S}. What is the ${big ? "largest" : "smallest"} one?`, a: ans, w: [m, big ? ans + 1 : ans - 1, big ? m - h : m + h, S / k + k],
        s: [`${k} consecutive numbers, total ${S}. We want the ${big ? "largest" : "smallest"}.`, `The middle number = total ÷ ${k}, because they balance around the middle.`,
            `${S} ÷ ${k} = ${m} is the middle. The numbers are ${[...Array(k)].map((_, i) => m - h + i).join(", ")}. The ${big ? "largest" : "smallest"} is ${ans}.`, `${[...Array(k)].map((_, i) => m - h + i).join(" + ")} = ${S}. ✅`],
        trap: `${m} is the middle one. Read what the question asks!`, ok: () => [...Array(k)].reduce((s, _, i) => s + m - h + i, 0) === S }; },
    () => { let n, p, q, x; do { n = ri(8, 20); p = ri(2, 6); q = ri(p + 1, 9); x = ri(1, n - 1); } while (false); const T = q * x + p * (n - x);
      return { q: `Stickers cost $${p} and posters cost $${q}. Mia buys ${n} items and spends $${T}. How many posters did she buy?`, a: x, w: [n - x, x + 1, x - 1, Math.floor(T / q)],
        s: [`Two kinds of items: ${n} items for $${T} in total.`, `Let x = posters. Then stickers = ${n} − x. Write the cost equation.`,
            `${q}x + ${p}(${n} − x) = ${T} → ${q}x + ${p * n} − ${p}x = ${T} → ${q - p}x = ${T - p * n} → x = ${x}.`, `${x} posters ($${q * x}) + ${n - x} stickers ($${p * (n - x)}) = $${T}. ✅`],
        trap: `${n - x} is the number of stickers.`, ok: () => q * x + p * (n - x) === T }; }];

  G.venn = [
    () => { let T, A, B, both; do { T = ri(20, 60); A = ri(5, T - 5); B = ri(5, T - 5); both = ri(1, Math.min(A, B) - 1); } while (A + B - both > T); const ans = T - (A + B - both);
      return { q: `In a class of ${T}, ${A} kids play soccer, ${B} play basketball, and ${both} play both. How many play neither?`, a: ans, w: [T - A - B, A + B - both, both, ans + both],
        s: [`${T} kids, two overlapping groups. We want 'neither'.`, "Find 'soccer or basketball' first: A + B − both. Then subtract from the total.",
            `${A} + ${B} − ${both} = ${A + B - both} play at least one. ${T} − ${A + B - both} = ${ans}.`, `Soccer only ${A - both}, basketball only ${B - both}, both ${both}, neither ${ans}: ${A - both} + ${B - both} + ${both} + ${ans} = ${T}. ✅`],
        trap: "The 'both' kids are inside BOTH numbers, so subtract them once.", ok: () => (A - both) + (B - both) + both + ans === T }; },
    () => { let T, A, B; do { T = ri(20, 60); A = ri(T / 2, T - 2); B = ri(T / 2, T - 2); } while (A + B <= T || A + B - T >= Math.min(A, B)); A = Math.round(A); B = Math.round(B); const ans = A + B - T;
      return { q: `${T} kids are each in art club, music club, or both. ${A} are in art and ${B} are in music. How many are in both?`, a: ans, w: [ans + 1, T - A, T - B, ans - 1],
        s: ["Everyone is in at least one club, so 'neither' = 0.", "Art + music − both = everyone.", `${A} + ${B} − both = ${T} → both = ${A + B} − ${T} = ${ans}.`, `Art only ${A - ans}, music only ${B - ans}, both ${ans}: ${T}. ✅`],
        trap: `${A} + ${B} = ${A + B} is more than ${T} kids. The extra ones were counted twice.`, ok: () => (A - ans) + (B - ans) + ans === T && ans >= 0 }; },
    () => { let A, B, both; do { A = ri(8, 30); B = ri(8, 30); both = ri(2, Math.min(A, B) - 2); } while (false); const onlyB = Math.random() < 0.5, ans = onlyB ? B - both : A - both, nm = onlyB ? "only like dogs" : "only like cats";
      return { q: `${A} kids like cats, ${B} like dogs, and ${both} like both. How many ${nm}?`, a: ans, w: [onlyB ? B : A, both, onlyB ? A - both : B - both, ans + 1],
        s: ["'Only' means inside one hoop but NOT in the middle.", `${onlyB ? "Dogs" : "Cats"} only = ${onlyB ? "dogs" : "cats"} − both.`, `${onlyB ? B : A} − ${both} = ${ans}.`, `${ans} + ${both} = ${onlyB ? B : A}. ✅`],
        trap: `${onlyB ? B : A} includes the kids who like both.`, ok: () => ans + both === (onlyB ? B : A) }; }];

  G.triangles = [
    () => { const a = ri(20, 100), b = ri(20, 155 - a), ans = 180 - a - b;
      return { q: `Two angles of a triangle are ${a}° and ${b}°. What is the third angle?`, a: ans, fmt: deg, w: [360 - a - b, a + b, 90 - Math.abs(a - b), ans + 10], step: 5,
        s: ["Two of the three angles are known.", "All three angles in a triangle add to 180°.", `${a} + ${b} = ${a + b}. 180 − ${a + b} = ${ans}°.`, `${a} + ${b} + ${ans} = 180. ✅`],
        trap: "Subtract from 180°, not 360° (360° is for four-sided shapes).", ok: () => a + b + ans === 180 }; },
    () => { const [x, y, z] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]]), k = ri(1, 4), a = x * k, b = y * k, c = z * k, hyp = Math.random() < 0.5;
      return hyp ? { q: `A right triangle has legs ${a} and ${b}. How long is the hypotenuse (the longest side)?`, a: c, w: [a + b, c * c, c + k, b + 1],
        s: ["Right triangle, both legs known.", "a² + b² = c², then take the square root.", `${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}. √${c * c} = ${c}.`, `It's the ${x}-${y}-${z} triple${k > 1 ? ` × ${k}` : ""}. ✅`],
        trap: `${c * c} is c², not c. Take the square root.`, ok: () => a * a + b * b === c * c }
      : { q: `A right triangle has hypotenuse ${c} and one leg ${a}. How long is the other leg?`, a: b, w: [c - a, c + a, b * b, b + k],
        s: ["The hypotenuse and one leg are known.", "a² + b² = c², so b² = c² − a².", `${c}² − ${a}² = ${c * c} − ${a * a} = ${b * b}. √${b * b} = ${b}.`, `${a}² + ${b}² = ${c * c} = ${c}². ✅`],
        trap: `${c} − ${a} = ${c - a} subtracts the sides, not the squares.`, ok: () => a * a + b * b === c * c }; },
    () => { const h = ri(4, 6), s = ri(2, 8), k = ri(2, 9), S = s * k, ans = h * k;
      return { q: `A ${h}-foot person casts a ${s}-foot shadow. At the same time, a flagpole casts a ${S}-foot shadow. How tall is the flagpole?`, a: ans, w: [h + S - s, S, ans + h, Math.round(S * s / h)],
        s: ["The sun makes two similar triangles: person + shadow and pole + shadow.", "Height ÷ shadow is the same for both.", `${h} ÷ ${s} = pole ÷ ${S}. The pole's shadow is ${S} ÷ ${s} = ${k} times longer, so the pole is ${k} × ${h} = ${ans} feet.`, `${ans} ÷ ${S} = ${h} ÷ ${s}. ✅`],
        trap: "Similar means MULTIPLY by the same factor, not add the same amount.", ok: () => ans * s === h * S }; }];

  G.polygons = [
    () => { const n = ri(5, 20), ans = (n - 2) * 180;
      return { q: `What is the sum of the inside angles of a polygon with ${n} sides?`, a: ans, fmt: deg, w: [n * 180, (n - 1) * 180, (n - 3) * 180, 360],
        s: [`A ${n}-sided shape.`, "From one corner it splits into (n − 2) triangles, each 180°.", `(${n} − 2) × 180 = ${n - 2} × 180 = ${ans}°.`, `A triangle (3 sides): 1 × 180 = 180°. The pattern works. ✅`],
        trap: `${n} × 180 uses n triangles instead of n − 2.`, ok: () => ans === (n - 2) * 180 }; },
    () => { const n = pick([5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36]), ext = 360 / n, ans = 180 - ext;
      return { q: `What is each inside angle of a regular polygon with ${n} sides?`, a: ans, fmt: deg, w: [ext, (n - 2) * 180, 180 - 360 / (n + 1) | 0, ans - 10],
        s: ["Regular means all the angles are equal.", "Each outside angle = 360° ÷ n. Inside = 180° − outside.", `Outside: 360 ÷ ${n} = ${ext}°. Inside: 180 − ${ext} = ${ans}°.`, `${n} × ${ans} = ${n * ans} = (${n} − 2) × 180. ✅`],
        trap: `${ext}° is the OUTSIDE angle.`, ok: () => n * ans === (n - 2) * 180 }; },
    () => { const n = ri(5, 20), ans = n * (n - 3) / 2;
      return { q: `How many diagonals does a polygon with ${n} sides have?`, a: ans, w: [n * (n - 3), n * (n - 1) / 2, n, n * (n - 2) / 2],
        s: [`n = ${n}.`, "Each corner connects to n − 3 other corners (not itself, not its 2 neighbors). Divide by 2 because each diagonal has 2 ends.", `${n} × ${n - 3} ÷ 2 = ${ans}.`, "Square check: 4 × 1 ÷ 2 = 2 diagonals. Correct! ✅"],
        trap: `${n * (n - 3)} counts every diagonal twice.`, ok: () => ans === n * (n - 3) / 2 }; },
    () => { const n = pick([5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36]), ext = 360 / n;
      return { q: `Each outside angle of a regular polygon is ${ext}°. How many sides does it have?`, a: n, w: [Math.round(180 / ext), n + 1, n - 1, Math.round(360 / (180 - ext))],
        s: ["Regular → every outside angle is the same.", "The outside angles always add to 360°.", `360 ÷ ${ext} = ${n} sides.`, `${n} × ${ext} = 360. ✅`],
        trap: "Use 360°, not 180°.", ok: () => n * ext === 360 }; }];

  G.circles = [
    () => { const r = ri(2, 12), d = 2 * r;
      return { q: `A circle has diameter ${d}. What is its area?`, a: r * r, fmt: pi, w: [d * d, d, r * r * 2, r], min: 1,
        s: ["The DIAMETER is given, but the area formula uses the radius.", "Radius = diameter ÷ 2. Area = πr².", `r = ${d} ÷ 2 = ${r}. Area = π × ${r}² = ${r * r}π.`, `${r * r}π ≈ ${(r * r * 3.14).toFixed(0)}, which fits in a ${d} × ${d} square (${d * d}). ✅`],
        trap: `${d * d}π uses the diameter instead of the radius.`, ok: () => true }; },
    () => { const r = ri(2, 20);
      return { q: `A circle's circumference is ${2 * r}π. What is its radius?`, a: r, w: [2 * r, r * r, r + 2, Math.max(1, r - 1)],
        s: ["The circumference is given.", "Circumference = 2πr. Solve for r.", `2πr = ${2 * r}π → 2r = ${2 * r} → r = ${r}.`, `2π × ${r} = ${2 * r}π. ✅`],
        trap: `${2 * r} is the diameter, not the radius.`, ok: () => true }; },
    () => { const R = ri(4, 12), r = ri(1, R - 1), ans = R * R - r * r;
      return { q: `Two circles share a center. Their radii are ${R} and ${r}. What is the area of the ring between them?`, a: ans, fmt: pi, w: [(R - r) ** 2, R * R + r * r, R * R, 2 * (R - r)], min: 1,
        s: ["Ring = big circle with the small circle cut out.", "Big area − small area.", `π × ${R}² − π × ${r}² = ${R * R}π − ${r * r}π = ${ans}π.`, `${ans}π is less than the big circle (${R * R}π). ✅`],
        trap: `π × (${R} − ${r})² subtracts first, in the wrong order.`, ok: () => ans === R * R - r * r }; }];

  G.volumes = [
    () => { const l = ri(2, 12), w = ri(2, 12), h = ri(2, 12), ans = l * w * h;
      return { q: `How many 1×1×1 cubes fit in a box that is ${l} by ${w} by ${h}?`, a: ans, w: [l + w + h, 2 * (l * w + w * h + l * h), l * w, ans + l * w],
        s: ["Count cubes in layers.", "One layer = length × width. Then × the number of layers (the height).", `${l} × ${w} = ${l * w} per layer. × ${h} layers = ${ans}.`, `${l} × ${w} × ${h} in any order = ${ans}. ✅`],
        trap: "Adding the sides isn't volume. Multiply.", ok: () => ans === l * w * h }; },
    () => { const s = ri(2, 9), V = s ** 3, ans = 6 * s * s;
      return { q: `A cube has volume ${V}. What is its surface area?`, a: ans, w: [s * s, 6 * s, V, 4 * s * s],
        s: ["Volume → edge → surface area.", `Find the edge: which number × itself × itself = ${V}?`, `${s} × ${s} × ${s} = ${V}, so the edge is ${s}. One face = ${s * s}. Six faces = ${ans}.`, `A cube has 6 square faces. ✅`],
        trap: "The volume isn't the surface area. Count the 6 faces.", ok: () => s ** 3 === V }; },
    () => { const r = ri(1, 6), h = ri(2, 12), ans = r * r * h;
      return { q: `What is the volume of a cylinder with radius ${r} and height ${h}?`, a: ans, fmt: pi, w: [2 * r * h, r * h, r * r, 4 * r * r * h], min: 1,
        s: ["A cylinder = a stack of circles.", "Volume = (circle area) × height = πr² × h.", `π × ${r}² = ${r * r}π per layer. × ${h} = ${ans}π.`, `${ans}π ≈ ${(ans * 3.14).toFixed(0)}, less than the box around it (${4 * r * r * h}). ✅`],
        trap: "Square the radius: r², not r.", ok: () => true }; },
    () => { const n = ri(3, 7), k = ri(0, 3), cnt = [(n - 2) ** 3, 6 * (n - 2) ** 2, 12 * (n - 2), 8], ans = cnt[k];
      let brute = 0; for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) for (let z = 0; z < n; z++) { if ([x, y, z].filter(v => v === 0 || v === n - 1).length === k) brute++; }
      const where = ["completely hidden inside", "in the middle of a face", "along an edge (not a corner)", "at a corner"][k];
      return { q: `A ${n}×${n}×${n} cube is painted on the outside, then cut into 1×1×1 cubes. How many small cubes have exactly ${k} painted face${k === 1 ? "" : "s"}?`, a: ans, w: cnt.filter((_, i) => i !== k).concat([n ** 3, ans + 4]),
        s: [`${n ** 3} small cubes. Which ones have exactly ${k} painted face${k === 1 ? "" : "s"}?`, "Sort by position: corners have 3, edge middles have 2, face middles have 1, hidden inside have 0.",
            `Those cubes sit ${where}. ${["The hidden cube is (n − 2)³ = " + (n - 2) + "³", "Each of 6 faces has (n − 2)² = " + (n - 2) ** 2, "Each of 12 edges has n − 2 = " + (n - 2), "A cube has 8 corners"][k]} → ${ans}.`,
            `8 + ${12 * (n - 2)} + ${6 * (n - 2) ** 2} + ${(n - 2) ** 3} = ${n ** 3}. ✅`],
        trap: "Corners have 3 painted faces. Use n − 2 for the middles, because you peel a layer from both ends.", ok: () => brute === ans }; }];

  G.stats = [
    () => { let n, sc, target, need; do { n = ri(3, 5); sc = [...Array(n)].map(() => ri(70, 100)); target = ri(80, 95); need = target * (n + 1) - sc.reduce((s, x) => s + x, 0); } while (need < 60 || need > 100); const sum = sc.reduce((s, x) => s + x, 0);
      return { q: `Leo scored ${sc.join(", ")} on his first ${n} tests. What does he need on the next test to average exactly ${target}?`, a: need, w: [target, need + n, Math.round(sum / n), need - 2, target * n - sum + target - 1],
        s: [`Average of ${n + 1} tests = ${target}.`, "Turn the average into a total: total = average × number of tests.", `He needs ${target} × ${n + 1} = ${target * (n + 1)} in total. He has ${sum}. ${target * (n + 1)} − ${sum} = ${need}.`, `(${sum} + ${need}) ÷ ${n + 1} = ${target}. ✅`],
        trap: `Getting a ${target} won't do it unless he's already averaging exactly ${target}.`, ok: () => (sum + need) / (n + 1) === target }; },
    () => { let n, m1, m2, x; do { n = ri(5, 8); m1 = ri(10, 30); m2 = ri(8, 32); x = n * m1 - (n - 1) * m2; } while (x <= 0 || x > 80 || m1 === m2);
      return { q: `The mean of ${n} numbers is ${m1}. One number is removed, and the mean of the other ${n - 1} is ${m2}. Which number was removed?`, a: x, w: [Math.abs(m1 - m2), m1, n * Math.abs(m1 - m2), x + n],
        s: ["Means → totals.", "Compare the totals before and after.", `Before: ${n} × ${m1} = ${n * m1}. After: ${n - 1} × ${m2} = ${(n - 1) * m2}. Removed: ${n * m1} − ${(n - 1) * m2} = ${x}.`, `(${(n - 1) * m2} + ${x}) ÷ ${n} = ${m1}. ✅`],
        trap: "Subtracting the two means compares averages, not totals.", ok: () => ((n - 1) * m2 + x) / n === m1 }; },
    () => { const k = pick([5, 7, 9]), arr = [...Array(k)].map(() => ri(1, 40)), srt = [...arr].sort((a, b) => a - b), mid = (k - 1) / 2, ans = srt[mid];
      return { q: `What is the median of ${arr.join(", ")}?`, a: ans, w: [arr[mid], srt[mid - 1], srt[mid + 1], Math.round(arr.reduce((s, x) => s + x, 0) / k), srt[k - 1] - srt[0]],
        s: [`${k} numbers, not in order.`, `Sort them first, then take the middle one (number ${mid + 1}).`, `Sorted: ${srt.join(", ")}. The middle (number ${mid + 1}) is ${ans}.`, `${mid} numbers on each side. ✅`],
        trap: "Always SORT first. The middle of the unsorted list is usually wrong.", ok: () => srt.filter(v => v < ans).length <= mid && srt.filter(v => v > ans).length <= mid }; }];

  G.counting = [
    () => { const a = ri(2, 6), b = ri(2, 6), c = ri(2, 5), ans = a * b * c;
      return { q: `A lunch has ${a} sandwich choices, ${b} drink choices and ${c} fruit choices. How many different lunches use one of each?`, a: ans, w: [a + b + c, a * b, a * b + c, ans / 2 | 0, ans + a],
        s: ["Pick one from each group.", "One from each group → MULTIPLY.", `${a} × ${b} × ${c} = ${ans}.`, `${a * b} sandwich-and-drink combos, each with ${c} fruits → ${ans}. ✅`],
        trap: "Adding counts the choices, not the combinations.", ok: () => ans === a * b * c }; },
    () => { const n = ri(5, 9), r = ri(2, 3), jobs = r === 2 ? "a president and a vice president" : "a president, a vice president and a secretary", ans = P(n, r);
      return { q: `From ${n} students, how many ways can you choose ${jobs}?`, a: ans, w: [Cn(n, r), n ** r, n * r, ans / 2],
        s: ["Different jobs → ORDER matters.", `Fill the jobs one at a time: ${n} choices, then ${n - 1}${r === 3 ? `, then ${n - 2}` : ""}.`, `${[...Array(r)].map((_, i) => n - i).join(" × ")} = ${ans}.`, "Ann-president/Bo-VP is different from Bo-president/Ann-VP, so don't divide. ✅"],
        trap: "Only divide when order DOESN'T matter.", ok: () => ans === P(n, r) }; },
    () => { const n = ri(5, 10), r = ri(2, 3), ans = Cn(n, r);
      return { q: `How many ways can you pick ${r} friends out of ${n} to come to a movie? (Order doesn't matter.)`, a: ans, w: [P(n, r), n * r, Cn(n, r - 1), ans + n],
        s: ["A group, so ORDER doesn't matter.", `Count in order, then divide by ${r}! (the number of ways to order ${r} people).`, `${[...Array(r)].map((_, i) => n - i).join(" × ")} = ${P(n, r)} in order. ÷ ${fact(r)} = ${ans}.`, `Each group of ${r} shows up ${fact(r)} times in the ordered count. ✅`],
        trap: `${P(n, r)} counts the same group several times.`, ok: () => ans === Cn(n, r) }; },
    () => { const dig = pick([2, 3]), d = ri(1, 9), lo = 10 ** (dig - 1), hi = 10 ** dig - 1, total = hi - lo + 1, none = 8 * 9 ** (dig - 1), ans = total - none;
      let brute = 0; for (let v = lo; v <= hi; v++) if (String(v).includes(String(d))) brute++;
      return { q: `How many ${dig}-digit numbers have at least one digit ${d}?`, a: ans, w: [none, total - 9 ** dig, ans + 9, dig === 2 ? 19 : 271, total / 10],
        s: ["'At least one' has lots of cases. Use the complement.", `All ${dig}-digit numbers − the ones with NO ${d}.`,
            `Total: ${total}. No ${d}: first digit 8 choices (1–9 except ${d}), each other digit 9 choices (0–9 except ${d}) → ${dig === 2 ? "8 × 9" : "8 × 9 × 9"} = ${none}. ${total} − ${none} = ${ans}.`, `Counted directly by computer: ${brute}. ✅`],
        trap: "The first digit can't be 0, so it has 8 choices, not 9.", ok: () => brute === ans }; }];

  G.probability = [
    () => { let r, b; do { r = ri(2, 9); b = ri(2, 9); } while (r === b); const n = r + b;
      return { q: `A bag has ${r} red and ${b} blue marbles. You pick one without looking. What is the chance it's red?`, a: frac(r, n), fmt: x => x, w: [frac(b, n), frac(r, b), frac(1, n), frac(r, n + 1), frac(r - 1, n)],
        s: [`${n} marbles in total, ${r} of them red.`, "Probability = good ÷ total.", `${r} ÷ ${n} = ${frac(r, n)}.`, `Blue: ${frac(b, n)}. Red + blue = 1. ✅`],
        trap: `${r}/${b} compares red to blue. Divide by the TOTAL.`, ok: () => true }; },
    () => { const s = ri(3, 11); let cnt = 0; const pairs = []; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b === s) { cnt++; pairs.push(`(${a},${b})`); }
      return { q: `Roll two dice. What is the chance the sum is ${s}?`, a: frac(cnt, 36), fmt: x => x, w: [frac(Math.max(1, cnt - 1), 36), frac(cnt + 1, 36), frac(1, 6), frac(1, s), frac(cnt, 12), frac(cnt, 11)],
        s: ["Two dice: 6 × 6 = 36 equally likely pairs.", `List the pairs that add to ${s}.`, `${pairs.join(" ")} → ${cnt} pairs. ${cnt}/36 = ${frac(cnt, 36)}.`, "(1,2) and (2,1) are different rolls, so both count. ✅"],
        trap: "Don't forget the flipped pairs like (2,5) and (5,2).", ok: () => true }; },
    () => { let r, b; do { r = ri(3, 8); b = ri(2, 8); } while (false); const n = r + b;
      return { q: `A bag has ${r} red and ${b} blue marbles. You take 2 without putting the first one back. What is the chance both are red?`, a: frac(r * (r - 1), n * (n - 1)), fmt: x => x,
        w: [frac(r * r, n * n), frac(r * (r - 1), n * n), frac(r, n), frac(2 * r, n * (n - 1)), frac((r - 1), n)],
        s: ["Two picks. The first marble is NOT put back.", "Multiply the chances. The second fraction changes because one red is gone.", `First red: ${r}/${n}. Then ${r - 1} reds are left out of ${n - 1}: ${r - 1}/${n - 1}. ${r}/${n} × ${r - 1}/${n - 1} = ${frac(r * (r - 1), n * (n - 1))}.`, "Counting pairs gives the same answer. ✅"],
        trap: `${r}/${n} × ${r}/${n} pretends the marble went back in.`, ok: () => true }; },
    () => { const n = ri(2, 6), N = 2 ** n;
      return { q: `Flip ${n} coins. What is the chance of getting at least one head?`, a: frac(N - 1, N), fmt: x => x, w: [frac(1, N), frac(n, N), "1/2", frac(N - 2, N), frac(N - n, N), frac(N - 1, 2 * N), frac(n, n + 1)],
        s: ["'At least one' → use the complement.", "1 − P(no heads at all).", `P(all tails) = (1/2)${sup(n)} = 1/${N}. So 1 − 1/${N} = ${frac(N - 1, N)}.`, `Only 1 of the ${N} outcomes is all tails. ✅`],
        trap: `${frac(n, N)} is exactly one head, not at least one.`, ok: () => true }; }];

  window.AMC_GYM = { G, build, make: id => { const t = pick(G[id]); return build(t()); }, count: id => (G[id] || []).length };
})();
