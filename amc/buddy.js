// 🤖 Ask Buddy: a learning helper that sits next to the AMC lessons.
// Layer 1 (always on, no internet needed): a term helper. It answers "what does ___ mean?" from every key word
//   in the lessons (window.AMC_LESSONS[].words), the 🌱 Basics blocks (window.AMC_SCRATCH[].words) and a
//   built-in math dictionary below, and links to the lesson block that teaches it.
// Layer 2 (optional): an AI tutor (Supabase Edge Function "amc-tutor", reached through the hub's window.fhAsk).
//   It explains in a different way, at the kid's level, and never hands over answers to practice/test problems.
//   It only shows up when the hub says it's switched on.
// Hidden during timed exams and real past tests (window.AMC_CTX.test === true).
(function () {
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // ---- built-in dictionary: everyday AMC words + symbols a 10–11 year old may not know yet ----
  // [term, aliases (comma list), meaning, example, basics chapter id (optional)]
  const EXTRA = [
   ["sum", "total,add up,added", "The answer when you ADD numbers.", "The sum of 3 and 5 is 8."],
   ["difference", "", "The answer when you SUBTRACT one number from another.", "The difference of 9 and 4 is 5."],
   ["product", "", "The answer when you MULTIPLY numbers.", "The product of 3 and 4 is 12.", "factors"],
   ["quotient", "", "The answer when you DIVIDE.", "The quotient of 12 ÷ 3 is 4.", "factors"],
   ["digit", "digits", "One of the ten symbols 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 used to write numbers.", "The number 507 has three digits: 5, 0 and 7.", "parity"],
   ["units digit", "ones digit,last digit,units", "The digit in the ones place, at the far right of a number.", "The units digit of 2,348 is 8.", "parity"],
   ["whole number", "whole numbers,counting number", "A number with no fraction or decimal part: 0, 1, 2, 3, …", "7 is a whole number. 7.5 is not."],
   ["integer", "integers", "A whole number or its negative: … −2, −1, 0, 1, 2 …", "−3, 0 and 12 are all integers. ½ is not."],
   ["positive", "positive number", "Bigger than zero.", "5 is positive. 0 is not positive (and not negative)."],
   ["negative", "negative number,minus number", "Smaller than zero. Written with a − sign.", "−4 is 4 below zero, like −4 degrees on a cold day."],
   ["even", "even number", "A whole number that splits into pairs with nothing left over. Ends in 0, 2, 4, 6 or 8.", "14 is even.", "parity"],
   ["odd", "odd number", "A whole number with one left over when you make pairs. Ends in 1, 3, 5, 7 or 9.", "15 is odd.", "parity"],
   ["consecutive", "in a row", "Numbers that come one right after another.", "7, 8, 9 are three consecutive numbers.", "parity"],
   ["distinct", "different", "All different from each other. No repeats.", "3 distinct digits: 4, 7, 1 (not 4, 4, 1).", "counting"],
   ["divisible", "divisible by,divides evenly,divides", "Splits evenly with no remainder.", "12 is divisible by 3 because 12 ÷ 3 = 4 exactly.", "parity"],
   ["remainder", "left over,leftover", "What's left after you make as many equal groups as you can.", "17 ÷ 5 = 3 remainder 2.", "factors"],
   ["fraction", "fractions", "A number that means part of a whole, like ¾. The bottom says how many equal parts, the top says how many you have.", "Eat 3 of 4 pizza slices: you ate ¾.", "ratios"],
   ["numerator", "top number", "The TOP number of a fraction: how many parts you have.", "In ¾, the numerator is 3.", "ratios"],
   ["denominator", "bottom number", "The BOTTOM number of a fraction: how many equal parts the whole is cut into.", "In ¾, the denominator is 4.", "ratios"],
   ["decimal", "decimals,decimal point", "A number with a point, showing parts of 10, 100, 1000.", "0.5 = ½ and 0.25 = ¼.", "ratios"],
   ["reciprocal", "flip", "Flip a fraction upside down.", "The reciprocal of ⅔ is 3/2. The reciprocal of 5 is ⅕."],
   ["equation", "equations", "A math sentence with an = sign saying two things are equal.", "3 + x = 10 is an equation. x = 7 makes it true."],
   ["variable", "unknown,letter", "A letter that stands for a number we don't know yet.", "In n + 4 = 9, the variable n is 5."],
   ["expression", "", "Numbers and letters joined by + − × ÷, without an = sign.", "2 × n + 3 is an expression."],
   ["square number", "perfect square,square numbers,squares", "A number times itself.", "1, 4, 9, 16, 25 (5 × 5 = 25).", "factors"],
   ["square root", "root,√", "Goes backwards from a square: which number times itself makes this?", "√49 = 7 because 7 × 7 = 49.", "factors"],
   ["cube", "cubed,perfect cube", "A number times itself three times. Also a box shape with 6 square faces.", "2 cubed = 2 × 2 × 2 = 8."],
   ["exponent", "power,powers,to the power", "The small raised number. It says how many times to multiply the base by itself.", "2³ = 2 × 2 × 2 = 8.", "factors"],
   ["prime factorization", "factor tree,prime factors", "Writing a number as primes multiplied together.", "12 = 2 × 2 × 3 = 2² × 3.", "factors"],
   ["GCF", "greatest common factor,gcd,greatest common divisor,hcf", "The biggest number that divides two numbers evenly.", "GCF of 12 and 18 is 6.", "factors"],
   ["LCM", "least common multiple,lowest common multiple", "The smallest number that both numbers divide into evenly.", "LCM of 4 and 6 is 12.", "factors"],
   ["factorial", "!", "Multiply all the whole numbers from that number down to 1. Written with !", "4! = 4 × 3 × 2 × 1 = 24.", "counting"],
   ["permutation", "arrangement,order matters", "A way to line things up where ORDER matters.", "ABC and BAC are different permutations.", "counting"],
   ["combination", "choose,group,order doesn't matter", "A group where ORDER doesn't matter.", "Picking Ann and Bo is the same pair as Bo and Ann.", "counting"],
   ["probability", "chance,likely,odds", "How likely something is, from 0 (never) to 1 (always). Good ways ÷ all ways.", "Chance of heads is ½.", "probability"],
   ["outcome", "outcomes,result", "One possible result.", "A die has 6 outcomes: 1 to 6.", "probability"],
   ["at random", "random,randomly", "Picked by chance, with every choice equally likely.", "Pick a card at random: each card has the same chance.", "probability"],
   ["equally likely", "fair", "Each outcome has the same chance.", "A fair coin: heads and tails are equally likely.", "probability"],
   ["independent", "", "One result doesn't change the chances of the other.", "Two coin flips are independent.", "probability"],
   ["mean", "average,arithmetic mean", "Add up all the values, then divide by how many there are.", "Mean of 2, 4, 9 = 15 ÷ 3 = 5.", "stats"],
   ["median", "middle", "The middle value after you put the numbers in order.", "Median of 3, 1, 8 → 1, 3, 8 → 3.", "stats"],
   ["mode", "most common,most often", "The value that appears the most.", "Mode of 2, 5, 5, 7 is 5.", "stats"],
   ["range", "spread", "Biggest value minus smallest value.", "Range of 4, 9, 2 = 9 − 2 = 7.", "stats"],
   ["ratio", "ratios,to", "Compares two amounts, written a : b.", "2 cups juice to 3 cups water is 2 : 3.", "ratios"],
   ["rate", "per,unit rate", "How much of one thing for each ONE of another.", "60 miles per hour = 60 miles in each hour.", "ratios"],
   ["percent", "%,per cent,percentage", "Out of 100.", "25% = 25 out of 100 = ¼.", "ratios"],
   ["perimeter", "around", "The distance all the way around a shape.", "A 5 by 3 rectangle: 5 + 3 + 5 + 3 = 16.", "polygons"],
   ["area", "", "How much flat space is inside a shape, counted in squares.", "A 5 by 3 rectangle has area 15.", "polygons"],
   ["volume", "", "How much space is inside a 3D shape, counted in little cubes.", "A 2 × 3 × 4 box has volume 24."],
   ["polygon", "polygons", "A flat, closed shape with straight sides.", "Triangles, squares and hexagons are polygons. Circles are not.", "polygons"],
   ["vertex", "vertices,corner,corners", "A corner where two sides (or edges) meet.", "A triangle has 3 vertices.", "polygons"],
   ["edge", "edges", "A line where two faces of a 3D shape meet.", "A cube has 12 edges."],
   ["face", "faces", "A flat side of a 3D shape.", "A cube has 6 faces."],
   ["diagonal", "diagonals", "A line joining two corners that are NOT next to each other.", "A square has 2 diagonals.", "polygons"],
   ["regular", "regular polygon", "All sides equal AND all angles equal.", "A square is a regular quadrilateral.", "polygons"],
   ["parallel", "", "Lines that go in the same direction and never meet, like train tracks.", "Opposite sides of a rectangle are parallel."],
   ["perpendicular", "", "Lines that meet at a right angle (90°), like a plus sign.", "The sides of a square corner are perpendicular."],
   ["angle", "angles", "The amount of turn between two lines that meet. Measured in degrees.", "A square corner is a 90° angle.", "polygons"],
   ["degree", "degrees,°", "The unit for measuring angles. A full turn is 360°.", "A straight line is 180°.", "polygons"],
   ["right angle", "90 degrees,square corner", "An angle of exactly 90°, like the corner of a book.", "Every corner of a rectangle is a right angle.", "polygons"],
   ["acute", "acute angle", "An angle smaller than 90°.", "A 45° angle is acute.", "polygons"],
   ["obtuse", "obtuse angle", "An angle between 90° and 180°.", "A 120° angle is obtuse.", "polygons"],
   ["isosceles", "", "A triangle with 2 equal sides (and 2 equal angles).", "Sides 5, 5, 3 make an isosceles triangle.", "polygons"],
   ["equilateral", "", "A triangle with all 3 sides equal. Every angle is 60°.", "Sides 4, 4, 4.", "polygons"],
   ["radius", "radii", "The distance from the center of a circle to its edge.", "A circle 10 cm across has radius 5 cm."],
   ["diameter", "", "The distance straight across a circle through the center. It's 2 × the radius.", "Radius 5 → diameter 10."],
   ["circumference", "", "The distance around a circle. It's π × diameter.", "Diameter 10 → circumference ≈ 31.4."],
   ["pi", "π", "The number you get from circumference ÷ diameter for ANY circle. About 3.14.", "A circle 1 m across is about 3.14 m around."],
   ["inclusive", "including both,including", "Count the end numbers too.", "From 3 to 7 inclusive: 3, 4, 5, 6, 7 (that's 5 numbers).", "sequences"],
   ["at least", "minimum,no fewer than", "That number OR MORE.", "At least 3 means 3, 4, 5, …", "counting"],
   ["at most", "maximum,no more than", "That number OR LESS.", "At most 3 means 0, 1, 2 or 3."],
   ["respectively", "", "In the same order as listed.", "Ann and Bo are 8 and 10, respectively → Ann is 8, Bo is 10."],
   ["sequence", "pattern,list", "A list of numbers that follows a rule.", "2, 5, 8, 11 (add 3 each time).", "sequences"],
   ["arithmetic sequence", "arithmetic", "A sequence that adds the same amount each time.", "4, 7, 10, 13 (step 3).", "sequences"],
   ["geometric sequence", "geometric", "A sequence that multiplies by the same amount each time.", "3, 6, 12, 24 (× 2).", "sequences"],
   ["term", "terms", "One number in a sequence.", "In 2, 5, 8, the 3rd term is 8.", "sequences"],
   ["set", "sets,group", "A group of things.", "{2, 4, 6} is the set of even numbers from 1 to 6.", "venn"],
   ["Venn diagram", "venn,circles", "Overlapping circles that show which groups things belong to.", "Kids who like pizza in one circle, tacos in the other; both in the middle.", "venn"],
   ["neither", "none", "Not in either group: outside both circles.", "Neither soccer nor basketball.", "venn"],
   ["× (times)", "×,x,times,multiplied by,multiply", "Multiply.", "3 × 4 = 12.", "factors"],
   ["÷ (divided by)", "÷,/,divided by,divide,division", "Divide: split into equal groups.", "12 ÷ 3 = 4.", "factors"],
   ["= (equals)", "=,equals,equal", "Both sides are the same amount.", "2 + 3 = 5."],
   ["≠ (not equal)", "≠,not equal", "The two sides are NOT the same.", "3 ≠ 4."],
   ["< and > (less than, greater than)", "<,>,less than,greater than,more than,bigger than,smaller than", "The open mouth faces the bigger number.", "3 < 8 (3 is less than 8). 9 > 2."],
   ["≤ and ≥", "≤,≥,less than or equal,greater than or equal", "Less than OR equal to (≤), greater than OR equal to (≥).", "x ≤ 5 means x can be 5 or anything smaller."],
   ["… (and so on)", "…,...,dots", "Keep going with the same pattern.", "1, 2, 3, …, 100 means all the numbers from 1 to 100.", "sequences"],
   [": (ratio sign)", ":,colon", "Read it as \"to\" in a ratio.", "3 : 5 is \"3 to 5\".", "ratios"],
   ["² (squared)", "²,squared", "Times itself.", "5² = 5 × 5 = 25.", "factors"],
   ["³ (cubed)", "³", "Times itself 3 times.", "2³ = 2 × 2 × 2 = 8.", "factors"],
   ["multiple choice", "choices,answer choices", "On the AMC 8 you pick one of five answers, A to E. There's no penalty for guessing.", "If you can rule out 2 choices, guess from the other 3."]
  ];
  const STOP = new Set("what whats what's is are does do mean means meaning the a an word words term explain define definition of how i me tell about by please pls can you what's again this that it in math called means? whats? is? help with understand dont don't get know not sure confused".split(" "));
  let G = null;
  const norm = s => String(s).toLowerCase().replace(/[“”"'’?.!,;()]/g, " ").replace(/\s+/g, " ").trim();
  const sing = w => w.length > 4 && /ies$/.test(w) ? w.slice(0, -3) + "y" : w.length > 3 && /ses$|xes$|ches$/.test(w) ? w.slice(0, -2) : w.length > 3 && /s$/.test(w) && !/ss$/.test(w) ? w.slice(0, -1) : w;
  function build() {
    const map = new Map(), LES = window.AMC_LESSONS || [], SCR = window.AMC_SCRATCH || {};
    const add = (term, meaning, eg, src, zh, aliases) => {
      const k = norm(term).replace(/\s*\(.*\)$/, "");
      let e = map.get(k);
      if (!e) { e = { term, meaning, eg: eg || "", zh: zh || "", src: [], keys: new Set([k, sing(k)]) }; map.set(k, e); }
      else { if (!e.eg && eg) e.eg = eg; if (!e.zh && zh) e.zh = zh; }
      (aliases || []).forEach(a => { a = String(a).trim(); if (!a) return; if (/^[^a-z0-9 ]+$/i.test(a)) { e.keys.add(a); return; } const n = norm(a); if (n) { e.keys.add(n); e.keys.add(sing(n)); } });
      if (src && !e.src.some(s => s.lesson === src.lesson && s.block === src.block)) e.src.push(src);
    };
    LES.forEach(l => (l.words || []).forEach(w => add(w[0], w[2], w[3], { lesson: l.id, step: 1, label: `${l.emoji} ${l.title}: Key words` }, w[1])));
    Object.keys(SCR).forEach(id => SCR[id].forEach((b, bi) => (b.words || []).forEach(w => {
      const parts = w[0].split(/\s*[\/(]\s*/); const main = w[0].replace(/\s*\(.*\)/, "");
      add(main, w[1], "", { lesson: id, block: bi, label: `🌱 ${b.t}` }, "", parts.map(p => p.replace(/\)$/, "")));
    })));
    EXTRA.forEach(x => {
      add(x[0], x[2], x[3], null, "", (x[1] || "").split(","));
      if (x[4] && SCR[x[4]]) { // link to the first basics block that mentions the word
        const k = norm(x[0].replace(/\s*\(.*\)/, "")), bi = SCR[x[4]].findIndex(b => norm(b.t + " " + b.idea.join(" ")).includes(k.split(" ")[0]));
        const e = map.get(norm(x[0]).replace(/\s*\(.*\)$/, ""));
        if (e && bi >= 0 && !e.src.length) e.src.push({ lesson: x[4], block: bi, label: `🌱 ${SCR[x[4]][bi].t}` });
      }
    });
    G = [...map.values()];
  }
  function lev(a, b) { if (Math.abs(a.length - b.length) > 2) return 9; const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; }
  function lookup(q) {
    if (!G) build();
    const raw = String(q), n = norm(raw), words = n.split(" ").filter(w => w && !STOP.has(w)), core = words.join(" "), coreS = words.map(sing).join(" ");
    const scored = [];
    G.forEach(e => {
      let s = 0;
      e.keys.forEach(k => {
        if (!k) return;
        const sym = /^[^a-z0-9]+$/.test(k);
        if (sym) {
          if (!raw.includes(k)) return;
          const risky = ["!", "/", ":", "...", "…", "<", ">", "="].includes(k);
          const esck = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const near = new RegExp("\\d\\s*" + esck + "|" + esck + "\\s*\\d").test(raw) || raw.replace(/what|is|does|mean|the|sign|symbol|\?|'s|\s/gi, "") === k;
          if (!risky || near) s = Math.max(s, words.length <= 2 || near ? 95 : 75); return; }
        if (k === core || k === coreS) s = Math.max(s, 100);
        else if (core && (` ${coreS} `.includes(` ${k} `) || ` ${core} `.includes(` ${k} `))) s = Math.max(s, 60 + Math.min(30, k.length * 2));
        else if (core.length >= 4 && k.startsWith(core)) s = Math.max(s, k.length - core.length <= 2 ? 68 : 58);
        else if (core.length >= 4 && k.length >= 4) { const dd = lev(coreS, k); if (dd <= (k.length > 6 ? 2 : 1)) s = Math.max(s, 72 - dd * 6); }
      });
      if (s) scored.push({ e, s });
    });
    scored.sort((a, b) => b.s - a.s || b.e.src.length - a.e.src.length || a.e.term.length - b.e.term.length);
    if ((!scored.length || scored[0].s < 70) && words.length > 1 && !lookup._inner) {
      lookup._inner = true; const seen = new Set(scored.map(x => x.e));
      try { words.filter(w => w.length >= 4 && !["number", "numbers", "much", "many", "solve", "find"].includes(w)).forEach(w => lookup(w).slice(0, 2).forEach(h => { if (!seen.has(h.e)) { seen.add(h.e); scored.push({ e: h.e, s: h.s - 8 }); } })); }
      finally { lookup._inner = false; }
      scored.sort((a, b) => b.s - a.s || b.e.src.length - a.e.src.length || a.e.term.length - b.e.term.length);
    }
    return scored;
  }
  // ---------- UI ----------
  const css = `.bud-fab{position:fixed;left:14px;bottom:14px;z-index:60;background:#7c3aed;color:#fff;border:0;border-radius:999px;padding:12px 16px;font:700 17px Fredoka,system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:pointer}
.bud-fab.hide{display:none}
.bud{position:fixed;top:0;bottom:0;left:0;width:380px;max-width:100vw;z-index:70;background:#faf5ff;border-right:3px solid #16161d;box-shadow:6px 0 30px rgba(0,0,0,.2);display:flex;flex-direction:column;transform:translateX(-105%);transition:transform .25s;font:16px/1.45 Fredoka,system-ui,sans-serif;color:#16161d}
.bud.open{transform:none}
.bud-h{display:flex;align-items:center;gap:8px;padding:12px 14px;background:#ede9fe;border-bottom:2px solid #16161d}.bud-h b{font-size:19px;flex:1}.bud-h button{border:2px solid #16161d;background:#fff;border-radius:10px;padding:4px 10px;font:inherit;cursor:pointer}
.bud-log{flex:1;overflow:auto;padding:12px}
.bud-m{margin:8px 0;padding:10px 12px;border-radius:14px;max-width:92%;word-wrap:break-word}.bud-m.pre{white-space:pre-wrap}.bud-m.me{background:#7c3aed;color:#fff;margin-left:auto;border-bottom-right-radius:4px}.bud-m.bot{background:#fff;border:2px solid #e9d5ff;border-bottom-left-radius:4px}
.bud-t{font-weight:700;font-size:18px}.bud-zh{color:#7c3aed;font-weight:500;margin-left:6px}.bud-eg{background:#fef3c7;border-radius:10px;padding:6px 8px;margin-top:6px}
.bud-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.bud-chips button{border:2px solid #c4b5fd;background:#fff;border-radius:999px;padding:4px 10px;font:inherit;font-size:14px;cursor:pointer}.bud-chips button.go{background:#dcfce7;border-color:#86efac}.bud-chips button.ai{background:#ede9fe;border-color:#a78bfa}
.bud-f{display:flex;gap:6px;padding:10px;border-top:2px solid #16161d;background:#fff}.bud-f input{flex:1;border:2px solid #16161d;border-radius:12px;padding:10px;font:inherit;min-width:0}.bud-f button{border:2px solid #16161d;background:#c4f53a;border-radius:12px;padding:0 14px;font:700 16px Fredoka,system-ui,sans-serif;cursor:pointer}
.bud-sug{padding:0 12px 8px;display:flex;flex-wrap:wrap;gap:6px}.bud-sug button{border:1px dashed #a78bfa;background:#fff;border-radius:999px;padding:3px 9px;font:inherit;font-size:13px;cursor:pointer}
.bud-note{font-size:12.5px;color:#6b7280;padding:0 12px 8px}
@media (max-width:640px){.bud{width:100vw;top:auto;height:78vh;border-right:0;border-top:3px solid #16161d;border-radius:18px 18px 0 0;transform:translateY(105%)}.bud.open{transform:none}}`;
  let el, log, inp, aiOn = false, aiLeft = null, hist = [], busy = false;
  const ctx = () => window.AMC_CTX || {};
  const kidName = () => { const k = (ctx().kid || "").toLowerCase(); return k ? k[0].toUpperCase() + k.slice(1) : "friend"; };
  function say(html, who) { const m = document.createElement("div"); m.className = "bud-m " + (who || "bot"); html = String(html).replace(/>\s+</g, "><"); m.innerHTML = html; log.appendChild(m); log.scrollTop = log.scrollHeight; return m; }
  function track(o) { try { window.AMC_TRACK && window.AMC_TRACK(Object.assign({ m: "ask" }, o)); } catch (e) {} }
  function srcChips(e) {
    const c = ctx(), mine = c.chapters || [], rank = s => (mine.length && !mine.includes(s.lesson) ? 10 : 0) + (s.block != null ? (c.scratch ? 0 : 1) : (c.scratch ? 1 : 0));
    return e.src.slice().sort((a, b) => rank(a) - rank(b)).slice(0, 3).map((s, k) => `<button class="go" data-src="${esc(JSON.stringify(s))}">📚 ${esc(s.label.length > 38 ? s.label.slice(0, 36) + "…" : s.label)}</button>`).join("");
  }
  function answerTerm(q, hits) {
    const e = hits[0].e;
    const more = hits.slice(1).filter(h => h.s >= 55 && h.e !== e).slice(0, 3);
    say(`<div class="bud-t">📖 ${esc(e.term)}${e.zh ? `<span class="bud-zh">${esc(e.zh)}</span>` : ""}</div><div>${esc(e.meaning)}</div>${e.eg ? `<div class="bud-eg">✏️ Example: ${esc(e.eg)}</div>` : ""}
      <div class="bud-chips">${srcChips(e)}${aiOn ? `<button class="ai" data-ai="${esc(q)}">🤔 Explain it another way</button>` : ""}${more.map(h => `<button data-ask="${esc(h.e.term)}">${esc(h.e.term)}?</button>`).join("")}</div>`);
    track({ q: q.slice(0, 120), hit: e.term });
  }
  async function askAI(q, why) {
    if (!aiOn || busy) return false;
    busy = true; const wait = say("🤖 Thinking…");
    const c = ctx();
    const res = await window.parent.fhAsk({ q, history: hist.slice(-6), ctx: { lesson: c.lesson || "", lessonTitle: c.lessonTitle || "", block: c.blockTitle || "", screen: c.screen || "" } }).catch(e => ({ error: String(e) }));
    busy = false; wait.remove();
    if (res && res.answer) {
      hist.push({ role: "user", content: q }, { role: "assistant", content: res.answer }); if (typeof res.left === "number") aiLeft = res.left;
      say(`<div style="white-space:pre-wrap">${esc(res.answer)}</div>` + (aiLeft != null && aiLeft <= 5 ? `<div class="bud-note" style="padding:6px 0 0">${aiLeft} AI questions left today.</div>` : ""));
      track({ q: q.slice(0, 120), ai: 1, why });
      return true;
    }
    say(esc((res && res.message) || "Buddy's AI brain is resting right now. Try the word helper, or ask a grown-up. 🙂"));
    if (res && res.error === "limit") aiLeft = 0;
    return true;
  }
  async function handle(q) {
    q = String(q || "").trim().slice(0, 300); if (!q) return;
    say(esc(q), "me");
    const hits = lookup(q);
    if (hits.length && hits[0].s >= 70) return answerTerm(q, hits);
    if (aiOn && await askAI(q, hits.length ? "weak" : "miss")) return;
    if (hits.length && hits[0].s >= 55) return answerTerm(q, hits);
    track({ q: q.slice(0, 120), hit: null });
    const near = hits.slice(0, 4);
    say(`Hmm, I don't know that one yet. 🤔 I'm best at math <b>words</b> and <b>symbols</b>. Try asking like: <i>"what does median mean?"</i> or just type the word.${near.length ? `<div class="bud-chips">${near.map(h => `<button data-ask="${esc(h.e.term)}">${esc(h.e.term)}?</button>`).join("")}</div>` : ""}<div class="bud-note" style="padding:6px 0 0">Still stuck? Ask a grown-up, and they'll know to look at it with you.</div>`);
  }
  function suggestions() {
    const c = ctx(), SCR = window.AMC_SCRATCH || {}, LES = window.AMC_LESSONS || [];
    let ws = [];
    if (c.lesson && SCR[c.lesson] && c.block != null && SCR[c.lesson][c.block]) ws = (SCR[c.lesson][c.block].words || []).map(w => w[0].replace(/\s*\(.*\)/, ""));
    if (!ws.length && c.lesson) { const l = LES.find(x => x.id === c.lesson); if (l) ws = (l.words || []).slice(0, 5).map(w => w[0]); }
    if (!ws.length) ws = ["factor", "prime", "median", "ratio", "consecutive"];
    return ws.slice(0, 5);
  }
  function refreshSug() { const s = el.querySelector(".bud-sug"); s.innerHTML = suggestions().map(w => `<button data-ask="${esc(w)}">${esc(w)}?</button>`).join(""); }
  function open() {
    el.classList.add("open"); refreshSug();
    if (!log.children.length) say(`Hi ${esc(kidName())}! I'm <b>Buddy</b> 🤖. Stuck on a word or a symbol? Ask me, like <i>"what does divisible mean?"</i> or <i>"what is √?"</i>${aiOn ? "<br>I can also explain an idea in a different way." : ""}`);
    setTimeout(() => inp.focus(), 250);
  }
  function go(s) {
    el.classList.remove("open");
    try { window.AMC_GO && window.AMC_GO(s); } catch (e) {}
  }
  function init() {
    if (el) return;
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    const fab = document.createElement("button"); fab.className = "bud-fab"; fab.id = "budFab"; fab.textContent = "🤖 Ask Buddy";
    el = document.createElement("aside"); el.className = "bud"; el.setAttribute("aria-label", "Ask Buddy");
    el.innerHTML = `<div class="bud-h"><span style="font-size:26px">🤖</span><b>Ask Buddy</b><button id="budX" aria-label="Close">✕</button></div>
      <div class="bud-log" id="budLog"></div><div class="bud-sug"></div>
      <div class="bud-note" id="budNote">Word helper: works any time.</div>
      <form class="bud-f" id="budF"><input id="budIn" maxlength="300" autocomplete="off" placeholder="Type a word or a question…"><button>Ask</button></form>`;
    document.body.append(fab, el);
    log = el.querySelector("#budLog"); inp = el.querySelector("#budIn");
    fab.onclick = open; el.querySelector("#budX").onclick = () => el.classList.remove("open");
    el.querySelector("#budF").onsubmit = ev => { ev.preventDefault(); const v = inp.value; inp.value = ""; handle(v); };
    el.addEventListener("click", ev => {
      const a = ev.target.closest("[data-ask]"); if (a) return handle(a.dataset.ask);
      const g = ev.target.closest("[data-src]"); if (g) { try { go(JSON.parse(g.dataset.src)); } catch (e) {} return; }
      const ai = ev.target.closest("[data-ai]"); if (ai) { say(esc("Explain it another way: " + ai.dataset.ai), "me"); askAI(`Please explain "${ai.dataset.ai}" a different way, with a tiny example.`, "again"); }
    });
    // hide during timed tests
    setInterval(() => { const t = !!ctx().test; fab.classList.toggle("hide", t); if (t) el.classList.remove("open"); }, 500);
    // AI layer: only if the hub provides it and it's switched on
    try {
      if (window.parent && window.parent !== window && typeof window.parent.fhAsk === "function") {
        window.parent.fhAsk({ ping: true }).then(r => { if (r && r.enabled) { aiOn = true; aiLeft = r.left; el.querySelector("#budNote").textContent = "Word helper + AI explainer are on. Buddy won't give answers to practice or test problems, but it will help you understand them."; } }).catch(() => {});
      }
    } catch (e) {}
  }
  window.AMCBuddy = { init, lookup, build, open };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
