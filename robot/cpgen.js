// 🏁 Robot Lab code checks (Bobby 11/23: a light version of Eric's checkpoints for Ellis's coding).
// Fresh "read the code" questions for each chapter, generated at random and answered by RUNNING the code in the robot engine,
// so the answer is always right. Kinds grow with the chapters: commands → loops → functions → if → while → sensors → variables → batteries.
(function (root) {
  const E = root.RoboEngine; if (!E) return;
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const DIR = { ">": "Right ▶", "<": "Left ◀", "^": "Up ▲", "v": "Down ▼" };
  // open room with the robot in the middle facing right
  const open = (n = 11) => { const rows = []; for (let y = 0; y < n; y++) { let r = ""; for (let x = 0; x < n; x++) r += (x === 0 || y === 0 || x === n - 1 || y === n - 1) ? "#" : (x === n >> 1 && y === n >> 1 ? ">" : "."); rows.push(r); } return rows.join("\n"); };
  // a small room of random size, robot somewhere inside facing a random way
  const room = () => { const W = ri(4, 6), H = ri(3, 4), rx = ri(1, W), ry = ri(1, H), d = pick([">", "<", "^", "v"]); const rows = [];
    for (let y = 0; y <= H + 1; y++) { let r = ""; for (let x = 0; x <= W + 1; x++) r += (x === 0 || y === 0 || x === W + 1 || y === H + 1) ? "#" : (x === rx && y === ry ? d : "."); rows.push(r); } return rows.join("\n"); };
  // a corridor with batteries in random squares
  const corridor = (bats) => { const L = ri(5, 8); let r = ">"; let k = 0; for (let i = 0; i < L; i++) { const b = bats && Math.random() < .4; if (b) k++; r += b ? "b" : "."; } return { map: "#".repeat(L + 3) + "\n#" + r + "#\n" + "#".repeat(L + 3), bats: k, L }; };
  const run = (code, map) => { const r = E.run(code, map, {}); if (r.error) return null; return r; };
  const moves = r => { let n = 0; for (let i = 1; i < r.frames.length; i++) if (r.frames[i].x !== r.frames[i - 1].x || r.frames[i].y !== r.frames[i - 1].y) n++; return n; };
  const numCh = ans => { const c = new Set([ans]); for (const d of shuffle([1, -1, 2, -2, 3, ans || 1])) { if (c.size >= 4) break; if (ans + d >= 0) c.add(ans + d); } let x = ans + 4; while (c.size < 4) c.add(x++); return shuffle([...c]).map(String); };
  const dirCh = d => shuffle(Object.keys(DIR)).map(k => DIR[k]);
  const disp = (dx, dy) => { if (!dx && !dy) return "Back where it started"; const p = []; if (dx) p.push(`${Math.abs(dx)} ${dx > 0 ? "right" : "left"}`); if (dy) p.push(`${Math.abs(dy)} ${dy > 0 ? "down" : "up"}`); return p.join(", "); };
  const dispCh = (dx, dy) => { const c = new Set([disp(dx, dy)]); for (const [a, b] of shuffle([[-dx, dy], [dx, -dy], [dy, dx], [dx + 1, dy], [dx, dy + 1], [dx - 1, dy], [-dx, -dy], [0, 0], [dx + 2, dy]])) { if (c.size >= 4) break; c.add(disp(a, b)); } return shuffle([...c]); };
  const cmds = (n, maxMove) => { const out = []; let m = 0; for (let i = 0; i < n; i++) { const t = m < maxMove && Math.random() < .5 ? "move()" : pick(["turn_left()", "turn_right()"]); if (t === "move()") m++; out.push(t); } if (!out.includes("move()")) out[0] = "move()"; return out; };
  const ind = (lines, k = 1) => lines.map(l => "    ".repeat(k) + l);
  const ask = (kind, q, code, map, ans, c, why) => { const ci = c.indexOf(String(ans)); return ci < 0 ? null : { kind, q, code, map, c, a: ci, why }; };
  // ---- question makers; each returns a question or null (then another is tried) ----
  const G = {
    face(loop) { const body = cmds(ri(2, 4), 2), n = loop ? ri(2, 3) : 1, code = loop ? `for i in range(${n}):\n${ind(body).join("\n")}` : body.join("\n"), map = open(), r = run(code, map); if (!r) return null;
      return ask("face", "The robot starts facing Right ▶. Which way is it facing at the end?", code, map, DIR[r.world.d], dirCh(), `Follow each line: it ends facing ${DIR[r.world.d]}.`); },
    where(loop) { const body = cmds(ri(3, 5), 3), n = loop ? 2 : 1, code = loop ? `for i in range(${n}):\n${ind(body).join("\n")}` : body.join("\n"), map = open(13), w0 = E.makeWorld(map), r = run(code, map); if (!r) return null;
      const dx = r.world.x - w0.x, dy = r.world.y - w0.y; return ask("where", "Where does the robot end up, compared with where it started?", code, map, disp(dx, dy), dispCh(dx, dy), `Trace it square by square: ${disp(dx, dy).toLowerCase()}.`); },
    count(loop) { const body = cmds(ri(2, 4), 2), n = loop ? ri(2, 4) : 1, extra = Math.random() < .5 ? "\nmove()" : "", code = (loop ? `for i in range(${n}):\n${ind(body).join("\n")}` : body.join("\n")) + extra, map = open(15), r = run(code, map); if (!r) return null;
      const m = moves(r); return ask("count", "How many squares does the robot move in total?", code, map, m, numCh(m), loop ? `The loop body moves ${body.filter(x => x === "move()").length} square(s), ${n} times${extra ? ", plus 1 more at the end" : ""} = ${m}.` : `Count the move() lines: ${m}.`); },
    printLoop() { if (Math.random() < .5) { const n = ri(3, 7), code = `for i in range(${n}):\n    print(i)`; return ask("print", "What is the LAST number this prints?", code, open(5), n - 1, numCh(n - 1), `range(${n}) counts 0, 1, … ${n - 1}. It stops BEFORE ${n}.`); }
      const a = ri(1, 4), b = a + ri(2, 5), code = `for i in range(${a}, ${b}):\n    print(i)`; return ask("print", "How many numbers does this print?", code, open(5), b - a, numCh(b - a), `range(${a}, ${b}) is ${a} up to ${b - 1}: that's ${b} − ${a} = ${b - a} numbers.`); },
    func() { const name = pick(["hop", "zig", "step", "dash"]), body = cmds(ri(2, 3), 2), calls = ri(2, 3), mid = Math.random() < .5 ? "turn_left()" : "turn_right()";
      const callLines = []; for (let i = 0; i < calls; i++) { callLines.push(`${name}()`); if (i < calls - 1 && Math.random() < .5) callLines.push(mid); }
      const code = `def ${name}():\n${ind(body).join("\n")}\n\n${callLines.join("\n")}`, map = open(15), r = run(code, map); if (!r) return null;
      if (Math.random() < .5) { const m = moves(r); return ask("func", `How many squares does the robot move? (Hint: count how many times ${name}() is CALLED.)`, code, map, m, numCh(m), `${name}() moves ${body.filter(x => x === "move()").length} square(s) each time, and it is called ${calls} times = ${m}.`); }
      return ask("func", "The robot starts facing Right ▶. Which way is it facing at the end?", code, map, DIR[r.world.d], dirCh(), `The def only runs when it's called. Follow the calls in order: it ends facing ${DIR[r.world.d]}.`); },
    ifRoom(sensor) { const s = sensor || pick(["path_ahead()", "wall_ahead()"]), n = ri(4, 7), map = room();
      const code = s === "path_ahead()" ? `for i in range(${n}):\n    if path_ahead():\n        move()\n    else:\n        ${pick(["turn_left()", "turn_right()"])}` : `for i in range(${n}):\n    if wall_ahead():\n        ${pick(["turn_left()", "turn_right()"])}\n    else:\n        move()`;
      const r = run(code, map); if (!r) return null; const m = moves(r); return ask("if", "Look at the room. How many squares does the robot move?", code, map, m, numCh(m), `Each time round the loop it checks the square in front: open → move, wall → turn. It moves ${m} times.`); },
    whileWalk() { const c = corridor(false), code = Math.random() < .5 ? "while path_ahead():\n    move()" : "while not wall_ahead():\n    move()", r = run(code, c.map); if (!r) return null; const m = moves(r);
      return ask("while", "How many squares does the robot move before the loop stops?", code, c.map, m, numCh(m), `A while loop repeats as long as its test is true. There are ${m} open squares before the wall.`); },
    whileRoom() { const map = room(), t = pick(["turn_left()", "turn_right()"]), code = `while path_ahead():\n    move()\n${t}\nwhile path_ahead():\n    move()`, r = run(code, map); if (!r) return null; const m = moves(r);
      return ask("while", "Look at the room. How many squares does the robot move in total?", code, map, m, numCh(m), `Drive until the wall, turn, then drive until the next wall: ${m} squares.`); },
    sensors() { return G.ifRoom(pick(["path_ahead()", "wall_ahead()"])); },
    vars() { const a = ri(0, 5), b = ri(2, 4), n = ri(2, 4);
      if (Math.random() < .5) { const code = `x = ${a}\nfor i in range(${n}):\n    x += ${b}\nprint(x)`; const ans = a + n * b; return ask("vars", "What does this print?", code, open(5), ans, numCh(ans), `x starts at ${a} and goes up by ${b}, ${n} times: ${a} + ${n} × ${b} = ${ans}.`); }
      const m = ri(2, 3), code = `score = ${a}\nscore = score * ${m}\nscore -= ${b}\nprint(score)`, ans = a * m - b; if (ans < 0) return null; return ask("vars", "What does this print?", code, open(5), ans, numCh(ans), `${a} × ${m} = ${a * m}, then minus ${b} = ${ans}.`); },
    batteries() { const c = corridor(true); if (!c.bats) return null; const code = "count = 0\nwhile path_ahead():\n    move()\n    if on_battery():\n        pick_up()\n        count += 1\nprint(count)", r = run(code, c.map); if (!r) return null; const ans = +r.out[r.out.length - 1];
      return ask("batteries", "Look at the corridor. What number does this print?", code, c.map, ans, numCh(ans), `count goes up by 1 on every battery square: ${ans} batteries.`); } };
  const KINDS = {
    c1: [() => G.face(false), () => G.where(false), () => G.count(false)],
    c2: [() => G.face(true), () => G.where(true), () => G.count(true), G.printLoop],
    c3: [G.func, G.func, () => G.count(true), G.printLoop],
    c4: [G.ifRoom, G.ifRoom, G.func, () => G.count(true)],
    c5: [G.whileWalk, G.whileRoom, G.ifRoom, G.printLoop],
    c6: [G.sensors, G.whileRoom, G.whileWalk, G.ifRoom],
    c7: [G.vars, G.vars, G.whileRoom, G.func],
    c8: [G.batteries, G.batteries, G.vars, G.whileWalk],
    c9: [G.batteries, G.vars, G.whileRoom, G.ifRoom, G.func, () => G.where(true)] };
  const keyQ = q => (q.q + "|" + q.code + "|" + q.map).replace(/\s+/g, " ");
  // n questions for a chapter, all different, none in `asked` (keys of earlier checkpoints); mixes the chapter's kinds
  function make(ch, n, asked) {
    const kinds = KINDS[ch] || KINDS.c9, out = [], used = new Set();
    for (let t = 0; out.length < n && t < 400; t++) { const k = kinds[(out.length + (t > 40 ? t : 0)) % kinds.length]; let q = null; try { q = k(); } catch (e) { q = null; }
      if (!q || new Set(q.c).size !== 4) continue; const key = keyQ(q); if (used.has(key) || (asked && asked.has(key))) continue; used.add(key); q.key = key; out.push(q); }
    return shuffle(out);
  }
  root.ROBO_CP = { make, keyQ };
})(typeof window !== "undefined" ? window : globalThis);
