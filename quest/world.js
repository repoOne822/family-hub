// Realm of Forces: the walkable world. A canvas tile engine for the town of Haven and the
// generated dungeon floors: torch lighting + fog of war, a walking pixel hero, wandering monsters,
// chests, shrines, stairs, a minimap, keyboard / tap-to-move / D-pad controls, and battle transitions.
(() => {
const T = 32;
const EF = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif';                                   // tile size on screen (16-px art × 2)
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const TOUCH = matchMedia("(pointer: coarse)").matches;
let cur = null;                                 // the live scene

// ---------- helpers ----------
const rnd = (a, b) => a + Math.random() * (b - a), ri = (a, b) => Math.floor(rnd(a, b + 1)), pick = a => a[ri(0, a.length - 1)];
const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = c => Math.max(0, Math.min(255, Math.round(c * k))); return `rgb(${f(n >> 16 & 255)},${f(n >> 8 & 255)},${f(n & 255)})`; };

// can this browser draw colour emoji on a canvas? (most can; if not, draw simple pixel stand-ins)
const EMOJI_OK = (() => { try { const c = document.createElement("canvas"); c.width = c.height = 24; const g = c.getContext("2d"); g.textBaseline = "middle"; g.font = "20px " + EF; g.fillText("🐀", 0, 12); const d = g.getImageData(0, 0, 24, 24).data; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 100 && (Math.abs(d[i] - d[i + 1]) > 18 || Math.abs(d[i + 1] - d[i + 2]) > 18)) return true; return false; } catch (e) { return true; } })();
function glyph(ctx, ch, x, y, size, kind, col) {
  if (EMOJI_OK) { ctx.font = size + "px " + EF; ctx.fillText(ch, x, y); return; }
  const s = size / 26;
  if (kind === "tree") { ctx.fillStyle = "#5a3a1a"; ctx.fillRect(x - 3 * s, y + 4 * s, 6 * s, 10 * s); ctx.fillStyle = "#2f7a3a"; [[0, 14], [-6, 10], [-12, 7]].forEach(([dy, w]) => { ctx.beginPath(); ctx.moveTo(x - w * s, y + (dy + 6) * s); ctx.lineTo(x, y + (dy - 8) * s); ctx.lineTo(x + w * s, y + (dy + 6) * s); ctx.fill(); }); return; }
  if (kind === "chest") { ctx.fillStyle = "#7a4a22"; ctx.fillRect(x - 10 * s, y - 6 * s, 20 * s, 14 * s); ctx.fillStyle = "#d9a441"; ctx.fillRect(x - 10 * s, y - 1 * s, 20 * s, 3 * s); ctx.fillRect(x - 2 * s, y - 2 * s, 4 * s, 5 * s); return; }
  if (kind === "shrine") { ctx.fillStyle = "#8a8f99"; ctx.fillRect(x - 10 * s, y + 2 * s, 20 * s, 7 * s); ctx.fillStyle = "#7fd8ff"; ctx.beginPath(); ctx.ellipse(x, y + 2 * s, 9 * s, 3 * s, 0, 0, 7); ctx.fill(); ctx.fillRect(x - 1.5 * s, y - 9 * s, 3 * s, 10 * s); return; }
  // monster blob with eyes
  ctx.fillStyle = col || "#b0413e"; ctx.beginPath(); ctx.ellipse(x, y + 2 * s, 11 * s, 10 * s, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.fillRect(x - 6 * s, y - 2 * s, 4 * s, 4 * s); ctx.fillRect(x + 2 * s, y - 2 * s, 4 * s, 4 * s); ctx.fillStyle = "#000"; ctx.fillRect(x - 5 * s, y - 1 * s, 2 * s, 2 * s); ctx.fillRect(x + 3 * s, y - 1 * s, 2 * s, 2 * s);
}
// town folk: palette swaps of the hero sprites
const NPC_SKIN = { shop: ["ranger", { V: "#6b4423", v: "#a8743f" }], skills: ["arcanist", { P: "#23874a", p: "#3ec46d" }], gear: ["vanguard", { b: "#c0612b", B: "#8e3f17" }], codex: ["arcanist", { P: "#4d5670", p: "#8a96ad" }] };
const npcCache = {};
function npcCanvas(id) {
  if (npcCache[id]) return npcCache[id]; const [cls, swap] = NPC_SKIN[id] || ["ranger", {}]; const A = window.QA && QA.art, PX = window.QA && QA.px;
  const c = document.createElement("canvas"); c.width = c.height = 16; if (A && A[cls]) { const g = c.getContext("2d"); A[cls].forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== "." && PX[ch]) { g.fillStyle = swap[ch] || PX[ch]; g.fillRect(x, y, 1, 1); } })); }
  return (npcCache[id] = c);
}
let heroCanvasCache = {};
function heroCanvas(cls) {
  if (heroCanvasCache[cls]) return heroCanvasCache[cls];
  const A = window.QA && QA.art, PX = window.QA && QA.px; const c = document.createElement("canvas"); c.width = c.height = 16;
  if (A && A[cls]) { const g = c.getContext("2d"); A[cls].forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== "." && PX[ch]) { g.fillStyle = PX[ch]; g.fillRect(x, y, 1, 1); } })); }
  return (heroCanvasCache[cls] = c);
}

// ---------- palettes per place ----------
const THEMES = {
  a1: { floor: "#3b4a35", floor2: "#33412e", wall: "#5d6b52", top: "#7e8f70", torch: "#ffcf6a", amb: .66, mote: "#cfe8a0" },
  a2: { floor: "#6b5131", floor2: "#5e472a", wall: "#8a6a40", top: "#b58d58", torch: "#ffb347", amb: .66, mote: "#f3d29a" },
  a3: { floor: "#3a3646", floor2: "#322f3d", wall: "#58546a", top: "#7d7894", torch: "#ffd27a", amb: .8, mote: "#d9d2ff" },
  a4: { floor: "#4a2219", floor2: "#401d15", wall: "#6e3022", top: "#9a4632", torch: "#ff8a3d", amb: .66, mote: "#ff9a4a" },
  a5: { floor: "#1d3a4f", floor2: "#183245", wall: "#2d5670", top: "#477a99", torch: "#8fe3ff", amb: .66, mote: "#9fe8ff" },
  m1: { floor: "#2c2c3a", floor2: "#262633", wall: "#46465c", top: "#66668a", torch: "#c9b6ff", amb: .8, mote: "#c9b6ff" }
};

// ---------- dungeon generation ----------
function genFloor(act, floor) {
  const W = 44, H = 32, tiles = new Array(W * H).fill(0), rooms = [];
  const carve = (x, y) => { if (x > 0 && y > 0 && x < W - 1 && y < H - 1) tiles[y * W + x] = 1; };
  if (floor === 5) { // boss lair: an entry hall + a big arena
    const entry = { x: 4, y: 13, w: 7, h: 6 }, arena = { x: 18, y: 6, w: 20, h: 20 };
    [entry, arena].forEach(r => { rooms.push(r); for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) carve(x, y); });
    for (let x = 10; x <= 18; x++) { carve(x, 15); carve(x, 16); }
  } else {
    for (let tries = 0; tries < 300 && rooms.length < 9; tries++) {
      const r = { w: ri(6, 10), h: ri(5, 8) }; r.x = ri(2, W - r.w - 2); r.y = ri(2, H - r.h - 2);
      if (rooms.some(o => r.x < o.x + o.w + 2 && r.x + r.w + 2 > o.x && r.y < o.y + o.h + 2 && r.y + r.h + 2 > o.y)) continue;
      rooms.push(r);
    }
    rooms.forEach(r => { for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) carve(x, y); });
    const cen = r => [Math.floor(r.x + r.w / 2), Math.floor(r.y + r.h / 2)];
    rooms.sort((a, b) => a.x - b.x);
    for (let i = 1; i < rooms.length; i++) {
      const [x1, y1] = cen(rooms[i - 1]), [x2, y2] = cen(rooms[i]);
      if (Math.random() < .5) { for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) carve(x, y1); for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) carve(x2, y); }
      else { for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) carve(x1, y); for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) carve(x, y2); }
    }
    // a couple of loops so it isn't a straight line
    for (let k = 0; k < 2; k++) { const a = pick(rooms), b = pick(rooms); const [x1, y1] = cen(a), [x2, y2] = cen(b); for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) carve(x, y1); for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) carve(x2, y); }
  }
  const map = { W, H, tiles, seen: new Array(W * H).fill(0), ents: [], kills: 0, decor: [] };
  const free = (x, y) => tiles[y * W + x] === 1 && !(x === map.hx && y === map.hy) && !map.ents.some(e => e.x === x && e.y === y);
  const spot = r => { for (let i = 0; i < 60; i++) { const x = ri(r.x + 1, r.x + r.w - 2), y = ri(r.y + 1, r.y + r.h - 2); if (free(x, y)) return [x, y]; } return [r.x + 1, r.y + 1]; };
  const start = rooms[0]; [map.hx, map.hy] = [Math.floor(start.x + start.w / 2), Math.floor(start.y + start.h / 2)];
  let id = 0; const add = (o, r) => { const [x, y] = spot(r); map.ents.push(Object.assign({ id: id++, x, y, alive: true }, o)); };
  if (floor === 5) {
    const ar = rooms[1]; map.ents.push({ id: id++, t: "boss", x: ar.x + Math.floor(ar.w / 2), y: ar.y + Math.floor(ar.h / 2), emoji: act.boss[0], name: act.boss[1], alive: true });
    add({ t: "shrine" }, rooms[0]);
  } else {
    const others = rooms.filter(r => r !== start);
    // stairs in the farthest room from the start
    const far = others.reduce((a, r) => (Math.hypot(r.x - start.x, r.y - start.y) > Math.hypot(a.x - start.x, a.y - start.y) ? r : a), others[0]);
    add({ t: "stairs" }, far);
    const nMon = floor <= 2 ? 4 : 5;
    for (let i = 0; i < nMon; i++) { const m = pick(act.mobs); add({ t: "mon", emoji: m[0], name: m[1], elite: false, wt: rnd(.5, 1.5) }, others[i % others.length]); }
    if (floor >= 2) { const e = pick(act.elite); add({ t: "mon", emoji: e[0], name: e[1], elite: true, wt: 1 }, pick(others)); }
    add({ t: "chest" }, pick(others)); if (Math.random() < .6) add({ t: "chest" }, pick(others));
    if (Math.random() < .7) add({ t: "shrine" }, pick(others));
  }
  // torches on walls that face a floor tile below; scattered floor decor
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    if (tiles[y * W + x] === 0 && tiles[(y + 1) * W + x] === 1 && Math.random() < .09) map.decor.push({ k: "torch", x, y });
    else if (tiles[y * W + x] === 1 && Math.random() < .035) map.decor.push({ k: pick(["bones", "crack", "moss", "pebbles"]), x, y });
  }
  map.need = floor === 5 ? 0 : 2;   // monsters to defeat before the stairs open
  return map;
}

// ---------- the town of Haven (hand-built) ----------
const TOWN_ROWS = [
  "##############################",
  "#TT..T.......TT.......T....TT#",
  "#T..HHHHH..........HHHHH....T#",
  "#...HHHHH..........HHHHH.....#",
  "#...HHMHH....,,....HHSHH...T.#",
  "#.....,......,,......,.......#",
  "#T....,,,,,,,,,,,,,,,,.....T.#",
  "#.....,.....WWWW.....,.......#",
  "#..L..,.....WWWW.....,...L...#",
  "#.....,,,,,,WWWW,,,,,,,,,,,,P#",
  "#.....,.....WWWW.....,.......#",
  "#T....,..............,.....T.#",
  "#.....,,,,,,,,,,,,,,,,.......#",
  "#..HHHHH....,,....HHHHH..L...#",
  "#..HHHHH....,,....HHHHH......#",
  "#..HHBHH....,,....HHKHH...T..#",
  "#TT.........,,..............T#",
  "#T....T.....@,....T.......TTT#",
  "##############################"
];
const NPCS = { M: { id: "shop", emoji: "🧔", name: "Merchant Orrin", line: "Potions and wares, fresh today!", sign: "⚖️" }, S: { id: "skills", emoji: "🧝", name: "Mystic Lyra", line: "Ready to grow your talents?", sign: "✨" },
  B: { id: "gear", emoji: "🧑‍🏭", name: "Smith Brann", line: "Let's look at that gear of yours.", sign: "⚒️" }, K: { id: "codex", emoji: "🧙", name: "Sage Ithel", line: "The Codex remembers everything you've learned.", sign: "📖" },
  P: { id: "portal", emoji: "🌀", name: "Waypoint", line: "Step in to travel to the dungeons.", sign: "" } };
function genTown() {
  const H = TOWN_ROWS.length, W = TOWN_ROWS[0].length, tiles = new Array(W * H).fill(1), map = { W, H, tiles, seen: new Array(W * H).fill(1), ents: [], decor: [], town: true, kills: 0, need: 0 };
  let id = 0;
  TOWN_ROWS.forEach((row, y) => [...row].forEach((ch, x) => {
    const i = y * W + x;
    if (ch === "#") tiles[i] = 0; else if (ch === "H") tiles[i] = 3; else if (ch === "W") tiles[i] = 4; else if (ch === "T") { tiles[i] = 5; } else if (ch === ",") tiles[i] = 2;
    if (NPCS[ch]) { tiles[i] = ch === "P" ? 2 : 3; map.ents.push(Object.assign({ id: id++, t: "npc", x, y: ch === "P" ? y : y + 1, alive: true }, NPCS[ch])); if (ch !== "P") tiles[(y + 1) * W + x] = 2; map.decor.push({ k: "door", x, y }); }
    if (ch === "L") { tiles[i] = 6; map.decor.push({ k: "lamp", x, y }); }
    if (ch === "@") { map.hx = x; map.hy = y; tiles[i] = 2; }
  }));
  return map;
}
const walkable = (map, x, y) => { if (x < 0 || y < 0 || x >= map.W || y >= map.H) return false; const t = map.tiles[y * map.W + x]; return t === 1 || t === 2; };

// ---------- prerender the static map ----------
function bake(map, th) {
  const c = document.createElement("canvas"); c.width = map.W * T; c.height = map.H * T; const g = c.getContext("2d");
  const noise = (x, y, k) => { const s = Math.sin(x * 12.9898 + y * 78.233 + k) * 43758.5453; return s - Math.floor(s); };
  for (let y = 0; y < map.H; y++) for (let x = 0; x < map.W; x++) {
    const t = map.tiles[y * map.W + x], px = x * T, py = y * T;
    if (map.town) {
      // grass / cobble / water / trees / houses
      g.fillStyle = (x + y) % 2 ? "#3f6b34" : "#3a6430"; g.fillRect(px, py, T, T);
      for (let k = 0; k < 4; k++) { g.fillStyle = noise(x, y, k) > .5 ? "#4f8240" : "#335a2b"; g.fillRect(px + noise(x, y, k + 9) * 28, py + noise(x, y, k + 3) * 28, 3, 3); }
      if (t === 2) { g.fillStyle = "#8d7b62"; g.fillRect(px, py, T, T); g.fillStyle = "#a08d71"; for (let k = 0; k < 4; k++) g.fillRect(px + (k % 2) * 16 + 2, py + Math.floor(k / 2) * 16 + 2, 12, 12); }
      if (t === 4) { g.fillStyle = "#6c6c74"; g.fillRect(px, py, T, T); g.fillStyle = "#2f6fb0"; g.fillRect(px + 3, py + 3, T - 6, T - 6); }
      if (t === 0) { g.fillStyle = "#2a2a2a"; g.fillRect(px, py, T, T); g.fillStyle = "#3a3a3a"; g.fillRect(px + 2, py + 2, 12, 12); g.fillRect(px + 17, py + 17, 12, 12); }
      continue;
    }
    if (t === 1) {
      g.fillStyle = noise(x, y, 1) > .5 ? th.floor : th.floor2; g.fillRect(px, py, T, T);
      g.strokeStyle = "rgba(0,0,0,.18)"; g.lineWidth = 1; g.strokeRect(px + .5, py + .5, T - 1, T - 1);
      for (let k = 0; k < 3; k++) { g.fillStyle = "rgba(255,255,255,.04)"; g.fillRect(px + noise(x, y, k) * 26, py + noise(x, y, k + 5) * 26, 4, 2); }
    } else {
      const below = y + 1 < map.H && map.tiles[(y + 1) * map.W + x] === 1;
      const nearFloor = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]].some(([dx, dy]) => map.tiles[(y + dy) * map.W + x + dx] === 1);
      if (!nearFloor) { g.fillStyle = "#050404"; g.fillRect(px, py, T, T); continue; }
      g.fillStyle = th.top; g.fillRect(px, py, T, T);
      g.fillStyle = shade(th.top, 1.15); g.fillRect(px, py, T, 4);
      if (below) { g.fillStyle = th.wall; g.fillRect(px, py + 12, T, T - 12); g.fillStyle = "rgba(0,0,0,.25)"; for (let k = 0; k < 2; k++) g.fillRect(px, py + 20 + k * 6, T, 1); g.fillRect(px + (x % 2 ? 10 : 22), py + 12, 1, 20); }
    }
  }
  if (map.town) { // houses with roofs, trees on top layer is drawn live
    const seenH = new Set();
    for (let y = 0; y < map.H; y++) for (let x = 0; x < map.W; x++) if (map.tiles[y * map.W + x] === 3 && !seenH.has(y * map.W + x)) {
      let w = 0, h = 0; while (x + w < map.W && map.tiles[y * map.W + x + w] === 3) w++; while (y + h < map.H && map.tiles[(y + h) * map.W + x] === 3) h++;
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) seenH.add(yy * map.W + xx);
      const px = x * T, py = y * T, pw = w * T, ph = h * T;
      g.fillStyle = "#c9b28a"; g.fillRect(px + 2, py + ph * .45, pw - 4, ph * .55);
      g.fillStyle = "#8e3b2c"; g.beginPath(); g.moveTo(px - 4, py + ph * .5); g.lineTo(px + pw / 2, py - 6); g.lineTo(px + pw + 4, py + ph * .5); g.closePath(); g.fill();
      g.fillStyle = "#6e2b20"; for (let k = 0; k < 4; k++) g.fillRect(px + 6 + k * (pw - 12) / 4, py + ph * .2 + k % 2 * 4, (pw - 12) / 5, 3);
      g.fillStyle = "#ffd98a"; g.fillRect(px + 10, py + ph * .62, 10, 9); g.fillRect(px + pw - 20, py + ph * .62, 10, 9);
    }
  }
  return c;
}

// ---------- the scene ----------
function mount(opts) {
  stop();
  const host = opts.host, map = opts.map, th = map.town ? { amb: .3, torch: "#ffd27a", mote: "#fff3c4" } : THEMES[opts.act.id] || THEMES.a1;
  host.innerHTML = `<div class="qw"><canvas class="qw-cv"></canvas><div class="qw-hud">${opts.hud()}</div>
    <canvas class="qw-mini"></canvas><div class="qw-toast"></div><div class="qw-pop"></div>
    ${TOUCH ? `<div class="qw-pad"><button data-d="0,-1">▲</button><button data-d="-1,0">◀</button><button data-d="1,0">▶</button><button data-d="0,1">▼</button></div>` : ""}
    <div class="qw-help">${TOUCH ? "Tap a spot to walk there, or use the arrows." : "Move: arrow keys / WASD, or click a spot to walk there."}</div></div>`;
  const wrap = host.querySelector(".qw"), cv = wrap.querySelector(".qw-cv"), ctx = cv.getContext("2d"), mini = wrap.querySelector(".qw-mini"), mg = mini.getContext("2d");
  const baked = bake(map, th); if (map.town) mini.style.display = "none";
  const S = cur = { opts, map, th, cv, ctx, wrap, hero: { x: map.hx, y: map.hy, px: map.hx * T, py: map.hy * T, dir: 1, moving: 0, step: 0, face: 1 }, cam: { x: map.town ? map.W * T / 2 : map.hx * T, y: map.town ? map.H * T / 2 : map.hy * T }, keys: new Set(), path: [], parts: [], t: 0, paused: false, dead: false, trans: null, ripple: [] };
  const fit = () => { const w = wrap.clientWidth, h = Math.min(Math.round(w * .62), innerHeight - 120), d = devicePixelRatio || 1; cv.width = w * d; cv.height = Math.max(320, h) * d; cv.style.height = Math.max(320, h) + "px"; ctx.setTransform(d, 0, 0, d, 0, 0); ctx.imageSmoothingEnabled = false; mini.width = map.W * 3; mini.height = map.H * 3; };
  fit(); S.fit = fit; addEventListener("resize", fit);
  reveal(S);
  // input
  S.onKey = e => { const k = e.key.toLowerCase(); const m = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] }[k];
    if (!m || S.paused || document.activeElement && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return; e.preventDefault(); if (e.type === "keydown") { S.keys.add(m.join()); S.path = []; } else S.keys.delete(m.join()); };
  addEventListener("keydown", S.onKey); addEventListener("keyup", S.onKey);
  cv.addEventListener("pointerdown", e => {
    if (S.paused) return; const r = cv.getBoundingClientRect(), vw = r.width, vh = r.height;
    const wx = e.clientX - r.left - vw / 2 + S.cam.x + T / 2, wy = e.clientY - r.top - vh / 2 + S.cam.y + T / 2, tx = Math.floor(wx / T), ty = Math.floor(wy / T);
    S.path = findPath(S, tx, ty); S.ripple.push({ x: tx * T + T / 2, y: ty * T + T / 2, t: 0 });
  });
  wrap.querySelectorAll(".qw-pad button").forEach(b => { const d = b.dataset.d; const on = e => { e.preventDefault(); S.keys.clear(); S.keys.add(d); S.path = []; }, off = () => S.keys.delete(d);
    b.addEventListener("pointerdown", on); b.addEventListener("pointerup", off); b.addEventListener("pointerleave", off); b.addEventListener("pointercancel", off); });
  // ambient motes
  for (let i = 0; i < 26; i++) S.parts.push(mote(S));
  let last = performance.now();
  const loop = now => {
    if (!cv.isConnected || S !== cur) { cleanup(S); return; }
    const dt = Math.min(.05, (now - last) / 1000); last = now; S.t += dt;
    update(S, dt); draw(S, ctx, baked, mg);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  return S;
}
function cleanup(S) { removeEventListener("keydown", S.onKey); removeEventListener("keyup", S.onKey); removeEventListener("resize", S.fit); }
function stop() { if (cur) { cleanup(cur); cur = null; } }
const mote = S => ({ k: "mote", x: rnd(-400, 400), y: rnd(-300, 300), vx: rnd(-6, 6), vy: rnd(-14, -4), life: rnd(3, 8), t: 0, s: rnd(1, 2.4) });

function reveal(S) {
  const { map, hero } = S; if (map.town) return; const R = 6;
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
    const x = hero.x + dx, y = hero.y + dy; if (x < 0 || y < 0 || x >= map.W || y >= map.H || dx * dx + dy * dy > R * R) continue;
    // line of sight
    let ok = true; const n = Math.max(Math.abs(dx), Math.abs(dy));
    for (let i = 1; i < n; i++) { const cx = Math.round(hero.x + dx * i / n), cy = Math.round(hero.y + dy * i / n); if (map.tiles[cy * map.W + cx] !== 1) { ok = false; break; } }
    if (ok) map.seen[y * map.W + x] = 1;
  }
}
function findPath(S, tx, ty) {
  const { map, hero } = S; if (tx < 0 || ty < 0 || tx >= map.W || ty >= map.H) return [];
  const target = map.ents.find(e => e.alive && e.x === tx && e.y === ty);
  const goalOk = (x, y) => target ? Math.abs(x - tx) + Math.abs(y - ty) === 1 : x === tx && y === ty;
  if (!target && !walkable(map, tx, ty)) return [];
  const key = (x, y) => y * map.W + x, prev = new Map([[key(hero.x, hero.y), null]]), q = [[hero.x, hero.y]];
  while (q.length) {
    const [x, y] = q.shift();
    if (goalOk(x, y)) { const p = []; let k = key(x, y); while (k !== key(hero.x, hero.y)) { p.unshift([k % map.W, Math.floor(k / map.W)]); k = prev.get(k); } if (target) p.push([tx, ty]); return p; }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = key(nx, ny); if (prev.has(k) || !walkable(map, nx, ny)) continue; if (!map.town && !map.seen[k]) continue; if (map.ents.some(e => e.alive && e.x === nx && e.y === ny)) continue; prev.set(k, key(x, y)); q.push([nx, ny]); }
  }
  return [];
}

function update(S, dt) {
  const { map, hero } = S;
  // hero movement (grid steps, tweened)
  if (hero.moving > 0) {
    hero.moving -= dt / .13; const k = 1 - Math.max(0, hero.moving);
    hero.px = (hero.fx + (hero.x - hero.fx) * k) * T; hero.py = (hero.fy + (hero.y - hero.fy) * k) * T; hero.step += dt * 9;
    if (hero.moving <= 0) { hero.px = hero.x * T; hero.py = hero.y * T; reveal(S); arrive(S); }
  } else if (!S.paused) {
    let d = null;
    if (S.keys.size) d = [...S.keys][S.keys.size - 1].split(",").map(Number);
    else if (S.path.length) { const [nx, ny] = S.path.shift(); d = [nx - hero.x, ny - hero.y]; if (Math.abs(d[0]) + Math.abs(d[1]) !== 1) { S.path = []; d = null; } }
    if (d) tryStep(S, d[0], d[1]);
  }
  // camera
  const vw = S.cv.clientWidth, vh = S.cv.clientHeight, mw = map.W * T, mh = map.H * T;
  const clampC = (v, view, size) => size <= view ? size / 2 - T / 2 : Math.max(view / 2 - T / 2, Math.min(size - view / 2 - T / 2, v));
  const tx = clampC(hero.px, vw, mw), ty = clampC(hero.py, vh, mh);
  S.cam.x += (tx - S.cam.x) * Math.min(1, dt * 8); S.cam.y += (ty - S.cam.y) * Math.min(1, dt * 8);
  // monsters wander, and chase when they see you
  if (!S.paused && !map.town) map.ents.forEach(e => {
    if (!e.alive || e.t !== "mon") return;
    e.ox = (e.ox || 0) * .8; e.oy = (e.oy || 0) * .8;
    if ((e.wt -= dt) > 0) return;
    const dist = Math.abs(e.x - hero.x) + Math.abs(e.y - hero.y), sees = dist <= 5 && map.seen[e.y * map.W + e.x];
    e.wt = sees ? (e.elite ? .55 : .7) : rnd(.8, 1.8); if (sees && !e.alert) { e.alert = 1.2; }
    let dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    if (sees) dirs.sort((a, b) => (Math.abs(e.x + a[0] - hero.x) + Math.abs(e.y + a[1] - hero.y)) - (Math.abs(e.x + b[0] - hero.x) + Math.abs(e.y + b[1] - hero.y)));
    else if (Math.random() < .4) return; else dirs = [pick(dirs)];
    for (const [dx, dy] of dirs) {
      const nx = e.x + dx, ny = e.y + dy;
      if (nx === hero.x && ny === hero.y && hero.moving <= 0) { encounter(S, e); return; }
      if (!walkable(map, nx, ny) || map.ents.some(o => o !== e && o.alive && o.x === nx && o.y === ny) || (nx === hero.x && ny === hero.y)) continue;
      e.ox = -dx * T; e.oy = -dy * T; e.x = nx; e.y = ny; break;
    }
  });
  map.ents.forEach(e => { if (e.alert) e.alert = Math.max(0, e.alert - dt); });
  // particles
  S.parts.forEach(p => { p.t += dt; p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt; if (p.g) p.vy += p.g * dt; });
  S.parts = S.parts.filter(p => p.t < p.life || (p.k === "mote" && (Object.assign(p, mote(S)), true)));
  S.ripple.forEach(r => r.t += dt); S.ripple = S.ripple.filter(r => r.t < .5);
  if (S.trans) { S.trans.t += dt; if (S.trans.t >= S.trans.dur && !S.trans.fired) { S.trans.fired = true; S.trans.done(); } }
}
function tryStep(S, dx, dy) {
  const { map, hero } = S, nx = hero.x + dx, ny = hero.y + dy;
  if (dx) hero.face = dx;
  const ent = map.ents.find(e => e.alive && e.x === nx && e.y === ny);
  if (ent) { S.keys.clear(); S.path = []; return interact(S, ent); }
  if (!walkable(map, nx, ny)) { if (map.town && map.tiles[ny * map.W + nx] === 3) toast(S, "🏠 That's a house. Walk up to a doorway or a person."); return; }
  hero.fx = hero.x; hero.fy = hero.y; hero.x = nx; hero.y = ny; hero.moving = 1;
  if (Math.random() < .5) S.parts.push({ k: "dust", x: hero.fx * T + T / 2 + rnd(-6, 6), y: hero.fy * T + T - 4, vx: rnd(-10, 10), vy: rnd(-20, -6), life: .45, t: 0, s: rnd(2, 3.5) });
}
function arrive(S) { const { map, hero } = S; map.hx = hero.x; map.hy = hero.y; }
function interact(S, e) {
  const o = S.opts;
  if (e.t === "mon" || e.t === "boss") return encounter(S, e);
  if (e.t === "npc") { bubble(S, e); S.paused = true; setTimeout(() => { S.paused = false; o.onNPC && o.onNPC(e.id); }, RM ? 50 : 450); return; }
  if (e.t === "chest") { if (e.opened) return toast(S, "Empty."); e.opened = true; e.alive = false; burstAt(S, e.x, e.y, ["#ffd84a", "#fff3a0", "#c9962e"], 26); o.onChest && o.onChest(e); return; }
  if (e.t === "shrine") { if (e.used) return toast(S, "The shrine's light has faded."); burstAt(S, e.x, e.y, ["#9fe8ff", "#ffffff"], 18); o.onShrine && o.onShrine(e); return; }
  if (e.t === "stairs") { const left = S.map.need - S.map.kills; if (left > 0) { shakeCam(S); return toast(S, `🔒 Dark magic seals the stairs. Defeat ${left} more monster${left > 1 ? "s" : ""}.`); } o.onStairs && o.onStairs(); }
}
function encounter(S, e) {
  if (S.trans) return; S.paused = true; S.keys.clear(); S.path = [];
  e.alert = 1;
  S.trans = { t: 0, dur: RM ? .05 : .7, e, fired: false, done: () => S.opts.onEncounter(e) };
}
function burstAt(S, x, y, cols, n) { for (let i = 0; i < n; i++) { const a = rnd(0, Math.PI * 2), sp = rnd(40, 160); S.parts.push({ k: "spark", x: x * T + T / 2, y: y * T + T / 2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, g: 220, life: rnd(.5, 1), t: 0, s: rnd(2, 4), c: pick(cols) }); } }
function shakeCam(S) { S.shake = .3; }
function toast(S, msg) { const el = S.wrap.querySelector(".qw-toast"); el.textContent = msg; el.classList.add("on"); clearTimeout(S.tt); S.tt = setTimeout(() => el.classList.remove("on"), 2200); }
function bubble(S, e) { S.bub = { e, t: S.t, text: e.line }; }

// ---------- drawing ----------
function draw(S, ctx, baked, mg) {
  const { map, hero, cam, th } = S, vw = S.cv.clientWidth, vh = S.cv.clientHeight;
  if (!vw || !vh) return;
  let sx = 0, sy = 0; if (S.shake > 0) { S.shake -= 1 / 60; sx = rnd(-4, 4); sy = rnd(-4, 4); }
  const ox = Math.round(vw / 2 - cam.x - T / 2 + sx), oy = Math.round(vh / 2 - cam.y - T / 2 + sy);
  ctx.fillStyle = "#050404"; ctx.fillRect(0, 0, vw, vh);
  ctx.drawImage(baked, ox, oy);
  // fog: hide unseen tiles
  if (!map.town) {
    ctx.fillStyle = "#050404";
    const x0 = Math.max(0, Math.floor(-ox / T)), y0 = Math.max(0, Math.floor(-oy / T)), x1 = Math.min(map.W, Math.ceil((vw - ox) / T)), y1 = Math.min(map.H, Math.ceil((vh - oy) / T));
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (!map.seen[y * map.W + x]) ctx.fillRect(ox + x * T, oy + y * T, T, T);
  }
  // decor
  map.decor.forEach(d => {
    if (!map.town && !map.seen[d.y * map.W + d.x] && !(d.k === "torch" && map.seen[(d.y + 1) * map.W + d.x])) return;
    const px = ox + d.x * T, py = oy + d.y * T;
    if (d.k === "torch" || d.k === "lamp") { const f = Math.sin(S.t * 12 + d.x) * 1.5; if (d.k === "lamp") { ctx.fillStyle = "#3a2b1a"; ctx.fillRect(px + 14, py + 10, 4, 22); } else { ctx.fillStyle = "#4a3320"; ctx.fillRect(px + 13, py + 18, 6, 10); }
      ctx.fillStyle = d.k === "lamp" ? "#ffcf6a" : th.torch; ctx.beginPath(); ctx.ellipse(px + 16, py + (d.k === "lamp" ? 8 : 14), 4 + f * .3, 7 + f, 0, 0, 7); ctx.fill(); ctx.fillStyle = "#fff6c9"; ctx.beginPath(); ctx.ellipse(px + 16, py + (d.k === "lamp" ? 10 : 16), 2, 3.5, 0, 0, 7); ctx.fill(); }
    else if (d.k === "bones") { ctx.fillStyle = "rgba(230,220,200,.55)"; ctx.fillRect(px + 8, py + 18, 14, 3); ctx.fillRect(px + 6, py + 16, 4, 7); ctx.fillRect(px + 20, py + 16, 4, 7); }
    else if (d.k === "crack") { ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px + 6, py + 8); ctx.lineTo(px + 14, py + 16); ctx.lineTo(px + 11, py + 24); ctx.lineTo(px + 22, py + 28); ctx.stroke(); }
    else if (d.k === "moss") { ctx.fillStyle = "rgba(90,140,60,.35)"; ctx.beginPath(); ctx.ellipse(px + 16, py + 20, 10, 5, 0, 0, 7); ctx.fill(); }
    else if (d.k === "pebbles") { ctx.fillStyle = "rgba(0,0,0,.25)"; [[8, 10], [20, 22], [12, 24]].forEach(([a, b]) => ctx.fillRect(px + a, py + b, 3, 3)); }
    else if (d.k === "door") { ctx.fillStyle = "#4b2e1a"; ctx.fillRect(px + 9, py + 10, 14, 22); ctx.fillStyle = "#ffcf6a"; ctx.fillRect(px + 19, py + 21, 2, 2); }
  });
  // town water + trees
  if (map.town) {
    for (let y = 0; y < map.H; y++) for (let x = 0; x < map.W; x++) { const t = map.tiles[y * map.W + x];
      if (t === 4) { ctx.fillStyle = `rgba(160,220,255,${.25 + .15 * Math.sin(S.t * 3 + x + y)})`; ctx.fillRect(ox + x * T + 6, oy + y * T + 8 + Math.sin(S.t * 2 + x) * 3, 14, 2); }
    }
    // fountain spray
    if (Math.random() < .5) S.parts.push({ k: "spark", x: 13.5 * T + T / 2 + rnd(-4, 4), y: 8 * T + T / 2, vx: rnd(-30, 30), vy: rnd(-120, -70), g: 260, life: .7, t: 0, s: 2.2, c: "#cfefff" });
  }
  // click ripples
  S.ripple.forEach(r => { ctx.strokeStyle = `rgba(255,230,150,${1 - r.t * 2})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(ox + r.x, oy + r.y + 8, 6 + r.t * 30, 3 + r.t * 12, 0, 0, 7); ctx.stroke(); });
  // entities + hero, sorted by y
  const list = map.ents.filter(e => e.alive && (map.town || map.seen[e.y * map.W + e.x])).map(e => ({ e, y: e.y }));
  list.push({ hero: true, y: hero.py / T + .01 });
  if (map.town) for (let y = 0; y < map.H; y++) for (let x = 0; x < map.W; x++) if (map.tiles[y * map.W + x] === 5) list.push({ tree: [x, y], y });
  list.sort((a, b) => a.y - b.y);
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  list.forEach(o => {
    if (o.tree) { const [x, y] = o.tree, px = ox + x * T + T / 2, py = oy + y * T + T / 2; ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.ellipse(px, py + 12, 12, 5, 0, 0, 7); ctx.fill(); ctx.save(); ctx.translate(px, py + 12); ctx.rotate(Math.sin(S.t * 1.3 + x) * .03); glyph(ctx, "🌲", 0, -16, 34, "tree"); ctx.restore(); return; }
    if (o.hero) return drawHero(S, ctx, ox, oy);
    const e = o.e, px = ox + e.x * T + T / 2 + (e.ox || 0), py = oy + e.y * T + T / 2 + (e.oy || 0);
    const seed = typeof e.id === "number" ? e.id : e.x * 7 + e.y, bob = Math.sin(S.t * 4 + seed) * 2;
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.ellipse(px, py + 12, e.t === "boss" ? 26 : 11, e.t === "boss" ? 8 : 4, 0, 0, 7); ctx.fill();
    if (e.t === "mon") {
      if (e.elite) { ctx.fillStyle = `rgba(123,155,255,${.25 + .15 * Math.sin(S.t * 5)})`; ctx.beginPath(); ctx.arc(px, py, 18, 0, 7); ctx.fill(); }
      ctx.save(); ctx.translate(px, py + bob); ctx.scale(1 + Math.sin(S.t * 6 + e.id) * .04, 1 - Math.sin(S.t * 6 + e.id) * .04); glyph(ctx, e.emoji, 0, 0, e.elite ? 30 : 26, "mon", e.elite ? "#4f6bd8" : th.torch === "#8fe3ff" ? "#2f8fb0" : "#a8433a"); ctx.restore();
      if (e.alert > 0) { ctx.font = "bold 18px Inter,sans-serif"; ctx.fillStyle = "#ff5a4a"; ctx.fillText("!", px, py - 24 - e.alert * 4); }
    } else if (e.t === "boss") {
      const pulse = .5 + .5 * Math.sin(S.t * 3); ctx.fillStyle = `rgba(192,57,43,${.18 + .2 * pulse})`; ctx.beginPath(); ctx.arc(px, py - 6, 40 + pulse * 6, 0, 7); ctx.fill();
      glyph(ctx, e.emoji, px, py - 10 + bob * 1.5, 58, "mon", "#8e1f1f");
    } else if (e.t === "chest") { glyph(ctx, "🧰", px, py + 2, 24, "chest"); if (Math.random() < .06) S.parts.push({ k: "spark", x: e.x * T + T / 2 + rnd(-10, 10), y: e.y * T + rnd(4, 14), vx: 0, vy: -20, life: .6, t: 0, s: 2, c: "#ffe08a" }); }
    else if (e.t === "shrine") { ctx.fillStyle = `rgba(143,227,255,${.2 + .15 * Math.sin(S.t * 3)})`; ctx.beginPath(); ctx.arc(px, py, 20, 0, 7); ctx.fill(); glyph(ctx, "⛲", px, py + bob * .5, 26, "shrine"); }
    else if (e.t === "stairs") { const sealed = map.kills < map.need; ctx.fillStyle = "#120d0a"; ctx.fillRect(px - 14, py - 12, 28, 26); for (let k = 0; k < 4; k++) { ctx.fillStyle = shade("#8a7a66", 1 - k * .18); ctx.fillRect(px - 14 + k * 3, py - 12 + k * 6, 28 - k * 6, 5); } ctx.font = "13px " + EF; if (sealed) { ctx.fillStyle = `rgba(140,60,255,${.35 + .2 * Math.sin(S.t * 4)})`; ctx.fillRect(px - 15, py - 13, 30, 28); ctx.fillText("🔒", px, py); } }
    else if (e.t === "npc") {
      if (e.id === "portal") { ctx.save(); ctx.translate(px, py); for (let k = 0; k < 3; k++) { ctx.rotate(S.t * 2 + k * 2.1); ctx.strokeStyle = ["#7fb8ff", "#b48cff", "#e6f3ff"][k]; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 8 + k * 4, 0, 4); ctx.stroke(); } ctx.restore(); ctx.fillStyle = `rgba(120,180,255,${.25 + .15 * Math.sin(S.t * 4)})`; ctx.beginPath(); ctx.arc(px, py, 22, 0, 7); ctx.fill(); }
      else { const im = npcCanvas(e.id); ctx.save(); ctx.translate(px, py + 14 + bob * .4); ctx.scale(2.1, 2.1); ctx.drawImage(im, -8, -16, 16, 16); ctx.restore(); if (EMOJI_OK) { ctx.font = "14px " + EF; ctx.fillText(e.sign, px + 15, py - 18); } }
      ctx.font = "bold 10px Inter,sans-serif"; ctx.fillStyle = "#fff"; ctx.strokeStyle = "#000"; ctx.lineWidth = 3; ctx.lineJoin = "round"; ctx.strokeText(e.name, px, py + 22); ctx.fillText(e.name, px, py + 22);
    }
  });
  // particles
  S.parts.forEach(p => {
    const a = p.k === "mote" ? Math.min(1, p.t, p.life - p.t) * .6 : 1 - p.t / p.life;
    if (p.k === "mote") { ctx.fillStyle = hexA(th.mote, Math.max(0, a)); ctx.fillRect(ox + hero.px + p.x, oy + hero.py + p.y, p.s, p.s); return; }
    ctx.fillStyle = p.k === "dust" ? `rgba(200,190,170,${a * .6})` : (p.c || "#fff"); ctx.globalAlpha = p.k === "dust" ? 1 : Math.max(0, a); ctx.fillRect(ox + p.x, oy + p.y, p.s, p.s); ctx.globalAlpha = 1;
  });
  // lighting
  drawLight(S, ctx, ox, oy, vw, vh);
  // speech bubble
  if (S.bub && S.t - S.bub.t < 2.2) { const e = S.bub.e, px = ox + e.x * T + T / 2, py = oy + e.y * T - 30; ctx.font = "600 13px Inter,sans-serif"; const w = ctx.measureText(S.bub.text).width + 18; ctx.fillStyle = "#f3ead6"; ctx.strokeStyle = "#8a6a2e"; ctx.lineWidth = 2; roundRect(ctx, px - w / 2, py - 16, w, 26, 8); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#2a1d12"; ctx.fillText(S.bub.text, px, py - 3); }
  // encounter transition: flash + shattering bars
  if (S.trans) { const k = Math.min(1, S.trans.t / S.trans.dur); ctx.fillStyle = `rgba(255,255,255,${k < .25 ? k * 3 : Math.max(0, .75 - (k - .25) * 3)})`; ctx.fillRect(0, 0, vw, vh); if (k > .3) { const n = 12; ctx.fillStyle = "#0a0605"; for (let i = 0; i < n; i++) { const w = vw / n, h = vh * Math.min(1, (k - .3) * 1.8) * (i % 2 ? 1 : .9); ctx.fillRect(i * w, i % 2 ? 0 : vh - h, w + 1, h); } } }
  // minimap
  if (!map.town) { mg.clearRect(0, 0, map.W * 3, map.H * 3); for (let y = 0; y < map.H; y++) for (let x = 0; x < map.W; x++) if (map.seen[y * map.W + x] && map.tiles[y * map.W + x] === 1) { mg.fillStyle = "#8a7a66"; mg.fillRect(x * 3, y * 3, 3, 3); }
    map.ents.forEach(e => { if (!e.alive || !map.seen[e.y * map.W + e.x]) return; mg.fillStyle = { mon: e.elite ? "#7b9bff" : "#ff5a4a", boss: "#ff2a2a", chest: "#ffd84a", shrine: "#8fe3ff", stairs: "#ffffff" }[e.t] || "#fff"; mg.fillRect(e.x * 3 - 1, e.y * 3 - 1, 5, 5); });
    mg.fillStyle = "#3cff7a"; mg.fillRect(hero.x * 3 - 1, hero.y * 3 - 1, 5, 5); }
}
function drawHero(S, ctx, ox, oy) {
  const { hero } = S, img = heroCanvas(S.opts.cls), px = ox + hero.px + T / 2, py = oy + hero.py + T / 2;
  const walking = hero.moving > 0, bob = walking ? -Math.abs(Math.sin(hero.step * Math.PI)) * 4 : Math.sin(S.t * 2.4) * 1.2, tilt = walking ? Math.sin(hero.step * Math.PI) * .07 : 0;
  ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.beginPath(); ctx.ellipse(px, py + 14, 11 - bob * .5, 4, 0, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(px, py + 14 + bob); ctx.rotate(tilt); ctx.scale(hero.face < 0 ? -2.2 : 2.2, 2.2 * (walking ? 1 : 1 + Math.sin(S.t * 2.4) * .02)); ctx.drawImage(img, -8, -16, 16, 16); ctx.restore();
}
function drawLight(S, ctx, ox, oy, vw, vh) {
  const { map, hero, th } = S;
  const L = S.lc || (S.lc = document.createElement("canvas")); if (L.width !== vw || L.height !== vh) { L.width = vw; L.height = vh; }
  const g = L.getContext("2d"); g.globalCompositeOperation = "source-over"; g.clearRect(0, 0, vw, vh);
  g.fillStyle = map.town ? `rgba(20,16,40,${th.amb})` : `rgba(4,3,2,${th.amb})`; g.fillRect(0, 0, vw, vh);
  g.globalCompositeOperation = "destination-out";
  const hole = (x, y, r, a = 1) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(.55, `rgba(0,0,0,${a * .75})`); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
  const flick = Math.sin(S.t * 9) * 4 + Math.sin(S.t * 23) * 2;
  hole(ox + hero.px + T / 2, oy + hero.py + T / 2, (map.town ? 190 : 185) + flick);
  map.decor.forEach(d => { if ((d.k === "torch" || d.k === "lamp") && (map.town || map.seen[(d.y + 1) * map.W + d.x])) hole(ox + d.x * T + T / 2, oy + d.y * T + 14, 110 + Math.sin(S.t * 11 + d.x) * 5, .9); });
  map.ents.forEach(e => { if (!e.alive) return; if (!map.town && !map.seen[e.y * map.W + e.x]) return; if (e.t === "shrine" || e.t === "boss" || e.t === "npc" || e.t === "stairs") hole(ox + e.x * T + T / 2, oy + e.y * T + T / 2, e.t === "boss" ? 120 : 64, .8); });
  ctx.drawImage(L, 0, 0);
  // warm colour glow on top of the lights
  ctx.globalCompositeOperation = "lighter";
  const glow = (x, y, r, col, a) => { const gr = ctx.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, hexA(col, a)); gr.addColorStop(1, hexA(col, 0)); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };
  map.decor.forEach(d => { if ((d.k === "torch" || d.k === "lamp") && (map.town || map.seen[(d.y + 1) * map.W + d.x])) glow(ox + d.x * T + T / 2, oy + d.y * T + 14, 70, th.torch, .16 + Math.sin(S.t * 13 + d.x) * .03); });
  glow(ox + hero.px + T / 2, oy + hero.py + T / 2, 110, "#ffb35a", .09);
  ctx.globalCompositeOperation = "source-over";
}
function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

// ---------- popups over the world (chests, shrines, stairs) ----------
function popup(html, wireFn) {
  const S = cur; if (!S) return; const el = S.wrap.querySelector(".qw-pop"); S.paused = true; S.keys.clear();
  el.innerHTML = `<div class="qw-card">${html}</div>`; el.classList.add("on");
  const close = () => { el.classList.remove("on"); el.innerHTML = ""; S.paused = false; };
  wireFn(el, close);
}
function hud(html) { if (cur) cur.wrap.querySelector(".qw-hud").innerHTML = html; }

// ---------- animated battle backdrop (per act) ----------
function arenaFX(el, actId) {
  if (!el || RM) return; const c = document.createElement("canvas"); c.className = "qw-afx"; el.prepend(c); const g = c.getContext("2d");
  const kind = { a1: "motes", a2: "sand", a3: "sparks", a4: "embers", a5: "bubbles", m1: "glyphs" }[actId] || "motes";
  const P = []; let last = performance.now();
  const fit = () => { const r = el.getBoundingClientRect(); c.width = r.width; c.height = r.height; }; fit();
  const spawn = () => { const w = c.width, h = c.height; const base = { x: Math.random() * w, y: h + 10, t: 0, life: rnd(3, 7), s: rnd(1.5, 3.5) };
    if (kind === "sand") Object.assign(base, { x: -10, y: Math.random() * h, vx: rnd(60, 140), vy: rnd(-8, 8), c: "#e8c98a" });
    else if (kind === "embers") Object.assign(base, { vx: rnd(-15, 15), vy: rnd(-70, -30), c: pick(["#ff8a3d", "#ffcf6a", "#ff5a2a"]) });
    else if (kind === "bubbles") Object.assign(base, { vx: rnd(-6, 6), vy: rnd(-40, -18), c: "#9fe8ff", ring: true, s: rnd(2, 6) });
    else if (kind === "sparks") Object.assign(base, { y: Math.random() * h, vx: rnd(-20, 20), vy: rnd(-20, 20), c: "#d9d2ff", life: rnd(.6, 1.6) });
    else if (kind === "glyphs") Object.assign(base, { vx: 0, vy: rnd(-16, -8), c: "#c9b6ff", ch: pick(["x", "÷", "π", "√", "=", "%", "∠", "½"]), s: rnd(10, 16) });
    else Object.assign(base, { vx: rnd(-8, 8), vy: rnd(-20, -8), c: "#e6f2c0" });
    P.push(base); };
  const loop = now => { if (!c.isConnected) return; const dt = Math.min(.05, (now - last) / 1000); last = now; if (P.length < 46 && Math.random() < .5) spawn();
    g.clearRect(0, 0, c.width, c.height);
    P.forEach(p => { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; const a = Math.min(1, p.t * 2, (p.life - p.t)) * .7; if (a <= 0) return; g.globalAlpha = a;
      if (p.ring) { g.strokeStyle = p.c; g.lineWidth = 1; g.beginPath(); g.arc(p.x + Math.sin(p.t * 3) * 4, p.y, p.s, 0, 7); g.stroke(); }
      else if (p.ch) { g.fillStyle = p.c; g.font = `${p.s}px Cinzel,serif`; g.fillText(p.ch, p.x, p.y); }
      else { g.fillStyle = p.c; g.fillRect(p.x, p.y, p.s, p.s); } });
    g.globalAlpha = 1; for (let i = P.length - 1; i >= 0; i--) if (P[i].t > P[i].life) P.splice(i, 1);
    requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}

window.QW = { genFloor, genTown, mount, stop, popup, hud, arenaFX, toast: msg => cur && toast(cur, msg), get scene() { return cur; } };
})();
