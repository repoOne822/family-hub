// 🤖 Robot Lab engine: a small, safe subset of real Python ("RoboPy") + a grid robot world.
// Runs the whole program up front and returns a trace of frames for the UI to animate.
// Works in the browser (window.RoboEngine) and in Node (module.exports) so levels can be auto-tested.
(function (root) {
  "use strict";
  // ---------------- tokenizer ----------------
  const KW = new Set(["def", "for", "in", "range", "while", "if", "elif", "else", "and", "or", "not", "True", "False", "pass", "break", "continue", "return", "None"]);
  function RoboError(msg, line) { this.message = msg; this.line = line; }
  function tokLine(src, ln) {
    const t = []; let i = 0;
    while (i < src.length) {
      const c = src[i];
      if (c === " " || c === "\t") { i++; continue; }
      if (c === "#") break;
      if (/[0-9]/.test(c)) { let j = i; while (j < src.length && /[0-9]/.test(src[j])) j++; t.push({ k: "num", v: +src.slice(i, j) }); i = j; continue; }
      if (/[A-Za-z_]/.test(c)) { let j = i; while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++; const w = src.slice(i, j); t.push({ k: KW.has(w) ? "kw" : "name", v: w }); i = j; continue; }
      if (c === '"' || c === "'") { let j = i + 1; while (j < src.length && src[j] !== c) j++; if (j >= src.length) throw new RoboError("A text in quotes never ends. Add the closing " + c + ".", ln); t.push({ k: "str", v: src.slice(i + 1, j) }); i = j + 1; continue; }
      const two = src.slice(i, i + 2);
      if (["==", "!=", "<=", ">=", "//", "+=", "-=", "*="].includes(two)) { t.push({ k: "op", v: two }); i += 2; continue; }
      if ("+-*/%<>=():,".includes(c)) { t.push({ k: "op", v: c }); i++; continue; }
      throw new RoboError(`I don't understand the symbol "${c}".`, ln);
    }
    return t;
  }
  // ---------------- parser ----------------
  const PR = { or: 1, and: 2, "==": 4, "!=": 4, "<": 4, ">": 4, "<=": 4, ">=": 4, "+": 5, "-": 5, "*": 6, "/": 6, "//": 6, "%": 6 };
  function exprParser(T, q0, ln) { // Pratt parser over one line's tokens
    let q = q0;
    function expr(minP) {
      let left = unary();
      for (;;) {
        const o = T[q]; if (!o) break; const pr = PR[o.v];
        if (pr === undefined || (o.k !== "op" && o.k !== "kw") || pr < minP) break;
        q++; left = { t: "bin", op: o.v, a: left, b: expr(pr + 1) };
      }
      return left;
    }
    function unary() {
      const x = T[q];
      if (x && x.k === "kw" && x.v === "not") { q++; return { t: "not", a: expr(3) }; }
      if (x && x.k === "op" && x.v === "-") { q++; return { t: "neg", a: unary() }; }
      return atom();
    }
    function atom() {
      const x = T[q++];
      if (!x) throw new RoboError("This line ends too early. Something is missing.", ln);
      if (x.k === "num") return { t: "num", v: x.v };
      if (x.k === "str") return { t: "str", v: x.v };
      if (x.k === "kw" && (x.v === "True" || x.v === "False")) return { t: "num", v: x.v === "True" };
      if (x.k === "kw" && x.v === "None") return { t: "num", v: null };
      if (x.v === "(") { const e = expr(0); if (!T[q] || T[q].v !== ")") throw new RoboError('A "(" is missing its closing ")".', ln); q++; return e; }
      if (x.k === "name" || (x.k === "kw" && x.v === "range")) {
        if (T[q] && T[q].v === "(") {
          q++; const args = [];
          if (T[q] && T[q].v !== ")") { args.push(expr(0)); while (T[q] && T[q].v === ",") { q++; args.push(expr(0)); } }
          if (!T[q] || T[q].v !== ")") throw new RoboError(`"${x.v}(" is missing its closing ")".`, ln);
          q++; return { t: "call", name: x.v, args };
        }
        return { t: "var", name: x.v };
      }
      throw new RoboError(`"${x.v}" can't go here.`, ln);
    }
    return { expr, pos: () => q };
  }
  function parse(code) {
    const raw = code.replace(/\t/g, "    ").split("\n"), lines = [];
    raw.forEach((s, i) => { const body = s.replace(/\s+$/, ""); if (!body.trim() || body.trim().startsWith("#")) return; lines.push({ ind: body.match(/^ */)[0].length, toks: tokLine(body, i + 1), ln: i + 1, text: body.trim() }); });
    let p = 0;
    function block(ind) {
      const out = [];
      while (p < lines.length && lines[p].ind === ind) out.push(stmt(ind));
      if (p < lines.length && lines[p].ind > ind) throw new RoboError("This line is pushed in (indented) but it doesn't belong to anything above. Line it up with the line before.", lines[p].ln);
      return out;
    }
    function sub(L) {
      const n = lines[p];
      if (!n || n.ind <= L.ind) throw new RoboError(`After "${L.text}" the next line must be pushed in by 4 spaces (that's the inside of it).`, L.ln);
      return block(n.ind);
    }
    function cond(L, start) { // "<expr>:" from token index start
      if (L.toks.slice(start).some(t => t.k === "op" && t.v === "=")) throw new RoboError('To compare, use two equal signs: ==   (one = puts a value into a variable).', L.ln);
      const P = exprParser(L.toks, start, L.ln), e = P.expr(0), q = P.pos();
      if (!L.toks[q] || L.toks[q].v !== ":") throw new RoboError('This line needs a colon ":" at the end.', L.ln);
      if (q + 1 < L.toks.length) throw new RoboError("There's extra stuff after the colon.", L.ln);
      return e;
    }
    function stmt(ind) {
      const L = lines[p++], T = L.toks, f = T[0];
      const need = (i, k, v, msg) => { const x = T[i]; if (!x || x.k !== k || (v !== undefined && x.v !== v)) throw new RoboError(msg, L.ln); return x; };
      if (f.k === "kw") {
        if (f.v === "def") {
          const nm = need(1, "name", undefined, "Give your function a name, like: def turn_around():").v;
          if (!T[2] || T[2].v !== "(" || !T[3] || T[3].v !== ")") throw new RoboError(`Write it as: def ${nm}():`, L.ln);
          if (!T[4] || T[4].v !== ":" || T.length > 5) throw new RoboError(`Write it as: def ${nm}():  (with the colon)`, L.ln);
          return { t: "def", name: nm, body: sub(L), ln: L.ln };
        }
        if (f.v === "for") {
          const v = need(1, "name", undefined, "Write it like: for i in range(3):").v;
          need(2, "kw", "in", "Write it like: for i in range(3):");
          const it = cond(L, 3);
          if (it.t !== "call" || it.name !== "range") throw new RoboError("In Robot Lab, for-loops use range, like: for i in range(3):", L.ln);
          return { t: "for", v, args: it.args, body: sub(L), ln: L.ln };
        }
        if (f.v === "while") { const c = cond(L, 1); return { t: "while", c, body: sub(L), ln: L.ln }; }
        if (f.v === "if") {
          const node = { t: "if", arms: [{ c: cond(L, 1), ln: L.ln }], els: null, ln: L.ln };
          node.arms[0].body = sub(L);
          while (p < lines.length && lines[p].ind === ind && lines[p].toks[0].v === "elif") { const E = lines[p++]; const arm = { c: cond(E, 1), ln: E.ln }; arm.body = sub(E); node.arms.push(arm); }
          if (p < lines.length && lines[p].ind === ind && lines[p].toks[0].v === "else") { const E = lines[p++]; if (E.toks.length !== 2 || E.toks[1].v !== ":") throw new RoboError('Write it as "else:"', E.ln); node.els = sub(E); }
          return node;
        }
        if (f.v === "elif" || f.v === "else") throw new RoboError(`"${f.v}" must come right after an if-block, lined up with the "if".`, L.ln);
        if (["pass", "break", "continue", "return"].includes(f.v)) { if (T.length > 1) throw new RoboError(`"${f.v}" stands alone on its line.`, L.ln); return { t: f.v, ln: L.ln }; }
      }
      if (f.k === "name" && T[1] && ["=", "+=", "-=", "*="].includes(T[1].v)) {
        const P = exprParser(T, 2, L.ln), e = P.expr(0);
        if (P.pos() < T.length) throw new RoboError("There's extra stuff at the end of this line.", L.ln);
        return { t: "set", name: f.v, op: T[1].v, e, ln: L.ln };
      }
      const P = exprParser(T, 0, L.ln), e = P.expr(0), q = P.pos();
      if (q < T.length) throw new RoboError(T[q].v === ":" ? "A colon only goes after if, elif, else, while, for or def." : `There's extra stuff after "${L.text.split(/[\s(]/)[0]}". One command per line.`, L.ln);
      if (e.t !== "call") throw new RoboError(e.t === "var" ? `"${e.name}" needs brackets to run, like ${e.name}()` : "This line doesn't do anything. Did you mean to call a command?", L.ln);
      return { t: "expr", e, ln: L.ln };
    }
    const prog = block(0);
    if (p < lines.length) throw new RoboError("This line is indented by a different amount than the lines around it.", lines[p].ln);
    return prog;
  }
  const parseSafe = parse;
  // ---------------- world ----------------
  const DIRS = { ">": [1, 0], "v": [0, 1], "<": [-1, 0], "^": [0, -1] }, ORDER = [">", "v", "<", "^"];
  function makeWorld(map) {
    const rows = map.trim().split("\n").map(r => r.trim()), H = rows.length, W = Math.max(...rows.map(r => r.length));
    const w = { W, H, wall: new Set(), bat: new Set(), line: new Set(), goal: null, x: 0, y: 0, d: ">", held: 0, out: [], visited: new Set(), crashed: false };
    rows.forEach((r, y) => [...r].forEach((c, x) => {
      const k = x + "," + y;
      if (c === "#") w.wall.add(k);
      if (c === "b") w.bat.add(k);
      if (c === "L") w.line.add(k);
      if (c === "B") { w.bat.add(k); w.line.add(k); }
      if (c === "G") { w.goal = k; w.line.add(k); }
      if (DIRS[c]) { w.x = x; w.y = y; w.d = c; w.line.add(k); }
      if (c === "@") { w.x = x; w.y = y; w.d = ">"; w.goal = k; w.line.add(k); }
    }));
    w.bat0 = w.bat.size; w.visited.add(w.x + "," + w.y);
    return w;
  }
  const blocked = (w, x, y) => x < 0 || y < 0 || x >= w.W || y >= w.H || w.wall.has(x + "," + y);
  const rel = (w, turn) => { const d = ORDER[(ORDER.indexOf(w.d) + turn + 4) % 4], v = DIRS[d]; return [w.x + v[0], w.y + v[1]]; };
  // ---------------- interpreter ----------------
  const SUGGEST = ["move", "turn_left", "turn_right", "pick_up", "wall_ahead", "wall_left", "wall_right", "path_ahead", "at_goal", "on_battery", "line_ahead", "line_left", "line_right", "print", "range"];
  function closest(n) { let best = null, bd = 9; SUGGEST.forEach(s => { const d = lev(n, s); if (d < bd) { bd = d; best = s; } }); return bd <= 2 ? best : null; }
  function lev(a, b) { const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; }
  function run(code, map, opt) {
    opt = opt || {};
    const allowed = opt.allowed ? new Set(opt.allowed) : null;
    const w = makeWorld(map), frames = [], snap = (ln, ev) => frames.push({ x: w.x, y: w.y, d: w.d, held: w.held, bat: [...w.bat], ln, ev: ev || null, out: w.out.slice() });
    snap(0);
    let ops = 0, actions = 0; const MAXOPS = opt.maxOps || 50000, MAXACT = opt.maxActions || 600;
    const funcs = {}, vars = {};
    const BRK = {}, CONT = {}, RET = {};
    function tick(ln) { if (++ops > MAXOPS) throw new RoboError("Your program kept going forever (an endless loop?). Check your while-loop: will its condition ever change?", ln); }
    function act(ln) { if (++actions > MAXACT) throw new RoboError("The robot ran out of battery after " + MAXACT + " moves. Is there a loop that never stops?", ln); }
    const SENS = {
      wall_ahead: () => { const [x, y] = rel(w, 0); return blocked(w, x, y); },
      wall_left: () => { const [x, y] = rel(w, -1); return blocked(w, x, y); },
      wall_right: () => { const [x, y] = rel(w, 1); return blocked(w, x, y); },
      path_ahead: () => { const [x, y] = rel(w, 0); return !blocked(w, x, y); },
      at_goal: () => w.goal === w.x + "," + w.y,
      on_battery: () => w.bat.has(w.x + "," + w.y),
      line_ahead: () => { const [x, y] = rel(w, 0); return w.line.has(x + "," + y); },
      line_left: () => { const [x, y] = rel(w, -1); return w.line.has(x + "," + y); },
      line_right: () => { const [x, y] = rel(w, 1); return w.line.has(x + "," + y); },
      batteries: () => w.held,
    };
    function call(node, ln) {
      const n = node.name;
      if (allowed && SUGGEST.includes(n) && !allowed.has(n) && !funcs[n] && n !== "range") throw new RoboError(`You haven't unlocked ${n}() yet. Use the commands shown in the buttons.`, ln);
      if (n === "move") { act(ln); const [x, y] = rel(w, 0); if (blocked(w, x, y)) { w.crashed = true; snap(ln, "crash"); throw new RoboError("💥 Bonk! The robot drove into a wall.", ln); } w.x = x; w.y = y; w.visited.add(x + "," + y);
        if (opt.line && !w.line.has(x + "," + y)) { snap(ln, "offline"); throw new RoboError("The robot left the line! Line-following robots must stay on the line.", ln); } snap(ln); return null; }
      if (n === "turn_left") { act(ln); w.d = ORDER[(ORDER.indexOf(w.d) + 3) % 4]; snap(ln); return null; }
      if (n === "turn_right") { act(ln); w.d = ORDER[(ORDER.indexOf(w.d) + 1) % 4]; snap(ln); return null; }
      if (n === "pick_up") { act(ln); const k = w.x + "," + w.y; if (!w.bat.has(k)) { snap(ln, "nopick"); throw new RoboError("There's no battery here to pick up.", ln); } w.bat.delete(k); w.held++; snap(ln, "pick"); return null; }
      if (n === "print") { const v = node.args.map(a => fmt(ev(a, ln))).join(" "); w.out.push(v); snap(ln, "print"); return null; }
      if (SENS[n]) { if (node.args.length) throw new RoboError(`${n}() doesn't take anything inside the brackets.`, ln); return SENS[n](); }
      if (funcs[n]) { if (node.args.length) throw new RoboError(`${n}() doesn't take anything inside the brackets.`, ln); if ((call.depth = (call.depth || 0) + 1) > 60) throw new RoboError("Your function keeps calling itself forever.", ln);
        try { execBlock(funcs[n]); } catch (e) { if (e !== RET) throw e; } finally { call.depth--; } return null; }
      if (n === "range") throw new RoboError("range() goes inside a for-loop, like: for i in range(3):", ln);
      const c = closest(n); throw new RoboError(`I don't know "${n}".${c ? ` Did you mean ${c}()?` : ""}`, ln);
    }
    const fmt = v => v === true ? "True" : v === false ? "False" : v === null ? "None" : String(v);
    function ev(e, ln) {
      tick(ln);
      switch (e.t) {
        case "num": case "str": return e.v;
        case "var": if (e.name in vars) return vars[e.name]; if (SENS[e.name] || funcs[e.name] || e.name === "move") throw new RoboError(`"${e.name}" needs brackets: ${e.name}()`, ln); { const c = closest(e.name); throw new RoboError(`"${e.name}" has no value yet. Set it first, like ${e.name} = 0${c ? ` (or did you mean ${c}()?)` : ""}.`, ln); }
        case "call": return call(e, ln);
        case "not": return !truthy(ev(e.a, ln));
        case "neg": return -num(ev(e.a, ln), ln);
        case "bin": {
          if (e.op === "and") { const a = ev(e.a, ln); return truthy(a) ? ev(e.b, ln) : a; }
          if (e.op === "or") { const a = ev(e.a, ln); return truthy(a) ? a : ev(e.b, ln); }
          const a = ev(e.a, ln), b = ev(e.b, ln);
          switch (e.op) {
            case "+": return typeof a === "string" || typeof b === "string" ? fmt(a) + fmt(b) : num(a, ln) + num(b, ln);
            case "-": return num(a, ln) - num(b, ln); case "*": return num(a, ln) * num(b, ln);
            case "/": if (num(b, ln) === 0) throw new RoboError("You can't divide by zero.", ln); return a / b;
            case "//": if (num(b, ln) === 0) throw new RoboError("You can't divide by zero.", ln); return Math.floor(a / b);
            case "%": if (num(b, ln) === 0) throw new RoboError("You can't divide by zero.", ln); return ((a % b) + b) % b;
            case "==": return a === b; case "!=": return a !== b; case "<": return a < b; case ">": return a > b; case "<=": return a <= b; case ">=": return a >= b;
          }
        }
      }
      throw new RoboError("Something unexpected happened.", ln);
    }
    const truthy = v => !!v && v !== 0;
    const num = (v, ln) => { if (typeof v === "boolean") return v ? 1 : 0; if (typeof v !== "number") throw new RoboError(`"${v}" is not a number.`, ln); return v; };
    function execBlock(b) { for (const s of b) exec(s); }
    function exec(s) {
      tick(s.ln);
      switch (s.t) {
        case "def": funcs[s.name] = s.body; return;
        case "expr": ev(s.e, s.ln); return;
        case "set": { const v = ev(s.e, s.ln); if (s.op === "=") vars[s.name] = v; else { if (!(s.name in vars)) throw new RoboError(`"${s.name}" has no value yet. Set it first, like ${s.name} = 0`, s.ln); vars[s.name] = s.op === "+=" ? (typeof vars[s.name] === "string" ? vars[s.name] + fmt(v) : num(vars[s.name], s.ln) + num(v, s.ln)) : s.op === "-=" ? num(vars[s.name], s.ln) - num(v, s.ln) : num(vars[s.name], s.ln) * num(v, s.ln); } snap(s.ln, "var"); return; }
        case "for": {
          const a = s.args.map(x => num(ev(x, s.ln), s.ln)); const [from, to] = a.length === 1 ? [0, a[0]] : [a[0], a[1]];
          if (a.length < 1 || a.length > 2) throw new RoboError("Use range(n) or range(start, stop).", s.ln);
          if (to - from > 1000) throw new RoboError("That's too many repeats for a robot.", s.ln);
          for (let i = from; i < to; i++) { vars[s.v] = i; try { execBlock(s.body); } catch (e) { if (e === BRK) break; if (e === CONT) continue; throw e; } }
          return;
        }
        case "while": while (truthy(ev(s.c, s.ln))) { try { execBlock(s.body); } catch (e) { if (e === BRK) break; if (e === CONT) continue; throw e; } } return;
        case "if": { for (const arm of s.arms) if (truthy(ev(arm.c, arm.ln))) { execBlock(arm.body); return; } if (s.els) execBlock(s.els); return; }
        case "pass": return; case "break": throw BRK; case "continue": throw CONT; case "return": throw RET;
      }
    }
    let error = null;
    try { const prog = parseSafe(code); execBlock(prog); }
    catch (e) { if (e === BRK || e === CONT) error = { message: "break and continue only work inside a loop.", line: 0 }; else if (e === RET) error = null; else if (e instanceof RoboError) error = { message: e.message, line: e.line || 0 }; else error = { message: "Oops, something went wrong: " + (e && e.message), line: 0 }; }
    return { frames, error, world: w, atGoal: w.goal === w.x + "," + w.y, allBats: w.bat.size === 0, held: w.held, out: w.out, actions };
  }
  function countLines(code) { return code.split("\n").filter(l => l.trim() && !l.trim().startsWith("#")).length; }
  function check(level, code) { // run on every world of a level; returns per-world results + overall pass
    const worlds = level.worlds || [level.map], res = [];
    for (let i = 0; i < worlds.length; i++) {
      const r = run(code, worlds[i], { allowed: level.allowed, line: level.line });
      let ok = !r.error && (level.noGoal ? true : r.atGoal);
      if (ok && level.allBats && !r.allBats) ok = false;
      if (ok && level.out) { const want = typeof level.out === "function" ? level.out(makeWorld(worlds[i])) : level.out; if (r.out.join("\n").trim() !== String(want).trim()) ok = false; r.wantOut = String(want); }
      if (ok && level.backHome) { const w0 = makeWorld(worlds[i]); if (!(r.world.x === w0.x && r.world.y === w0.y)) ok = false; }
      r.ok = ok; res.push(r);
      if (!ok) break;
    }
    const miss = (level.require || []).filter(t => !code.includes(t));
    return { pass: res.length === worlds.length && res.every(r => r.ok) && !miss.length, res, lines: countLines(code), missing: miss };
  }
  const api = { run, check, parse: parseSafe, makeWorld, countLines, DIRS, ORDER };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.RoboEngine = api;
})(typeof window !== "undefined" ? window : globalThis);
