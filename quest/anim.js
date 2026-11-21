// Realm of Forces: character animation + physics effects.
// Heroes are pixel sprites; monsters are animated with real kinematics: gravity drops, projectile arcs,
// knockback from F = ma, bouncing debris (coefficient of restitution). Toggle 🔬 to see the vectors.
(() => {
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const PX = { k: "#15121f", K: "#15121f", s: "#f2c29b", g: "#c8cdd8", G: "#7c8597", w: "#ffffff", b: "#3d9bff", B: "#2a5bd7", y: "#ffd23d", r: "#e5484d", n: "#8b5a2b", N: "#5a3a1a", v: "#3ec46d", V: "#23874a", p: "#8a6cff", P: "#4b2fb5", c: "#7fe3ff" };
const HERO = {
  vanguard: ["......kkkk......", ".....kggwgk.....", "....kgggggGk..k.", "....kgKKKKGk.kwk", "....kgsKsKGk.kgk", ".....kGGGGk..kgk", "..kkk.kbbbbk.kgk", ".kyyykbbbbbbkkgk",
    "kyrrrykbbbbbkyyk", "kyrwrykBbbbBknk.", "kyrrrykbbbbbbkk.", ".kyryk.kBBBBk...", "..kyk..kBkkBk...", "...k...kBk.kBk..", "......kGGk.kGGk.", "......kkkk.kkkk."],
  ranger: [".....kkkkk......", "....kVvvvVk.....", "...kVvvvvvVk....", "...kVsssssVk..k.", "...kVsKsKsVk.kn.", "....kVsssVk..knk", "...kkvvvvvkk.kwn", "..kvvvnvvvvvkkwn",
    "..kvvvvnvvvvk.wn", "..ksvvvvnvvsk.wn", "...kvvvvvvvk.knk", "...kNNNNNNNk..k.", "...kNk...kNk....", "...kNk...kNk....", "..knnk...knnk...", "..kkkk...kkkk..."],
  arcanist: ["......kPk....kck", ".....kPPPk..kcck", "....kPPyPPk..kk.", "...kPPPPPPPk.kn.", "..kkkkkkkkkk.kn.", "....ksKsKsk..kn.", "....kssssskk.kn.", "...kpppppppk.kn.",
    "..kpppyppppksnk.", "..kpppppppppk.n.", "..kpPpppppPpk.n.", "..kpPpppppPpk.n.", ".kppPpppppPppkn.", ".kPPPPPPPPPPPkn.", "..kkkkkkkkkkk.n.", ".............kk."] };
const sprite = (cls, size = 64) => { const art = HERO[cls] || HERO.vanguard, H = art.length, W = 16; let r = "";
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const ch = art[y][x]; if (ch && ch !== "." && PX[ch]) r += `<rect x="${x}" y="${y}" width="1.03" height="1.03" fill="${PX[ch]}"/>`; }
  return `<svg class="qa-spr" viewBox="0 0 ${W} ${H}" width="${size}" height="${size}" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`; };
const FLYERS = new Set(["🦇", "🦅", "👻", "🐉", "🐝", "🦋", "🕊️", "🪰", "🦟", "⚡", "☄️", "🌪️", "🔥", "💨", "🧚"]);
const PHY_KEY = "rof_physview";
let physOn = (() => { try { return localStorage.getItem(PHY_KEY) === "1"; } catch (e) { return false; } })();

/* ---------- styles ---------- */
const css = `
.arena{position:relative;overflow:hidden}
.qa-cv{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3}
.qa-phys{position:absolute;right:8px;top:8px;z-index:4;font:700 12px system-ui;background:#0008;color:#fff;border:1px solid #fff4;border-radius:999px;padding:4px 10px;cursor:pointer}
.qa-phys.on{background:#ffd23d;color:#111;border-color:#ffd23d}
#foe,#me{position:relative;display:inline-block;will-change:transform}
.qa-idle{display:inline-block;transform-origin:50% 100%}
.qa-breathe{animation:qaBreathe 2.4s ease-in-out infinite}
.qa-float{animation:qaFloat 2.2s ease-in-out infinite}
.qa-sway{animation:qaSway 3s ease-in-out infinite}
.qa-bossaura{animation:qaBreathe 3.2s ease-in-out infinite, qaAura 2.4s ease-in-out infinite}
@keyframes qaBreathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.04,.95)}}
@keyframes qaFloat{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-12px) rotate(2deg)}}
@keyframes qaSway{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
@keyframes qaAura{0%,100%{filter:drop-shadow(0 0 14px #c0392b)}50%{filter:drop-shadow(0 0 34px #ff5a3a)}}
.qa-shadow{position:absolute;left:50%;bottom:-6px;width:70%;height:12px;transform:translateX(-50%);background:radial-gradient(ellipse,#0009,transparent 70%);z-index:-1;animation:qaShadow 2.4s ease-in-out infinite}
.qa-float~.qa-shadow{animation:qaShadowF 2.2s ease-in-out infinite;bottom:-14px}
@keyframes qaShadow{50%{transform:translateX(-50%) scaleX(1.06)}}
@keyframes qaShadowF{50%{transform:translateX(-50%) scaleX(.75);opacity:.5}}
.mport{display:grid;place-items:center}
.mport .qa-spr,.portrait .qa-spr,.cls .qa-spr{image-rendering:pixelated;filter:drop-shadow(0 4px 0 #0007)}
.qa-hero{display:inline-block;transform-origin:50% 100%;animation:qaHeroIdle 1.8s steps(2,end) infinite}
@keyframes qaHeroIdle{0%,100%{transform:translateY(0) scale(1,1)}50%{transform:translateY(1px) scale(1.03,.97)}}
.cls .qa-hero,.portrait .qa-hero{animation-duration:1.4s}
.cls:hover .qa-hero{animation:qaHop .5s ease-out infinite}
@keyframes qaHop{0%,100%{transform:translateY(0)}40%{transform:translateY(-10px) scale(.96,1.05)}70%{transform:translateY(0) scale(1.06,.94)}}
.qa-stars{position:absolute;left:50%;top:-6px;width:0;height:0}
.qa-stars i{position:absolute;font-style:normal;font-size:18px;animation:qaOrbit 1.2s linear infinite}
.qa-stars i:nth-child(2){animation-delay:-.4s}.qa-stars i:nth-child(3){animation-delay:-.8s}
@keyframes qaOrbit{from{transform:rotate(0) translateX(34px) rotate(0) scaleY(.6)}to{transform:rotate(360deg) translateX(34px) rotate(-360deg) scaleY(.6)}}
.qa-tag{position:absolute;left:50%;top:18%;z-index:5;transform:translateX(-50%);font:900 18px system-ui;color:#fff;text-shadow:0 2px 0 #000;pointer-events:none;animation:qaTag .9s ease-out forwards;white-space:nowrap}
@keyframes qaTag{from{opacity:0;transform:translate(-50%,6px)}20%{opacity:1}to{opacity:0;transform:translate(-50%,-26px)}}
.bossport{display:inline-block;transform-origin:50% 100%;animation:qaBossLair 3s ease-in-out infinite, qaAura 2.4s ease-in-out infinite}
@keyframes qaBossLair{0%,100%{transform:scale(1) translateY(0)}45%{transform:scale(1.06,.96) translateY(2px)}55%{transform:scale(.98,1.04) translateY(-6px)}}
.panel.center>.big,.door .big{display:inline-block;animation:qaBob 2.6s ease-in-out infinite}
.door:hover .big{animation:qaHop .5s ease-out infinite}
@keyframes qaBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
.portrait .qa-hero{animation:qaHeroIdle 1.4s steps(2,end) infinite}
@media (prefers-reduced-motion: reduce){.bossport,.panel.center>.big,.door .big{animation:none}}
@media (prefers-reduced-motion: reduce){.qa-breathe,.qa-float,.qa-sway,.qa-bossaura,.qa-hero,.qa-shadow{animation:none}}
`;
const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

/* ---------- physics canvas ---------- */
const G = 1400; // px/s² "gravity" on screen (scaled for drama)
let cv, ctx, arena, parts = [], trails = [], vecs = [], raf = 0, last = 0;
const center = el => { const a = arena.getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: r.left - a.left + r.width / 2, y: r.top - a.top + r.height / 2, w: r.width, h: r.height }; };
function fit() { if (!cv) return; const r = arena.getBoundingClientRect(), d = devicePixelRatio || 1; cv.width = r.width * d; cv.height = r.height * d; ctx.setTransform(d, 0, 0, d, 0, 0); }
function loop(t) {
  if (!cv || !cv.isConnected) { raf = 0; parts = []; trails = []; vecs = []; return; }
  const dt = Math.min(.033, (t - (last || t)) / 1000); last = t;
  const W = cv.width / (devicePixelRatio || 1), H = cv.height / (devicePixelRatio || 1); ctx.clearRect(0, 0, W, H);
  // trajectory trails (physics view)
  if (physOn) trails = trails.filter(tr => (tr.life -= dt) > 0).map(tr => { ctx.fillStyle = `rgba(255,210,61,${Math.min(1, tr.life)})`; tr.pts.forEach((p, i) => { if (i % 2 === 0) { ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, 7); ctx.fill(); } }); return tr; });
  parts = parts.filter(p => {
    p.t += dt; if (p.t > p.life) { p.done && p.done(); return false; }
    if (p.update) p.update(p, dt);
    else { p.vy += (p.g ?? G) * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.floor != null && p.y > p.floor) { p.y = p.floor; p.vy *= -(p.e ?? .45); p.vx *= .8; if (Math.abs(p.vy) < 40) p.vy = 0; } }
    if (p.trail && physOn) p.trail.push({ x: p.x, y: p.y });
    p.draw(p); return true; });
  if (physOn) vecs = vecs.filter(v => (v.life -= dt) > 0).map(v => { arrow(v.x, v.y, v.dx, v.dy, v.color, v.label); return v; });
  if (parts.length || (physOn && (trails.length || vecs.length))) raf = requestAnimationFrame(loop); else { raf = 0; ctx.clearRect(0, 0, W, H); }
}
const kick = () => { if (!raf) { last = 0; raf = requestAnimationFrame(loop); } };
const add = p => { parts.push(Object.assign({ t: 0, life: 1, vx: 0, vy: 0 }, p)); kick(); };
function arrow(x, y, dx, dy, color, label) {
  const L = Math.hypot(dx, dy); if (L < 2) return; const ux = dx / L, uy = dy / L;
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + dx, y + dy); ctx.lineTo(x + dx - ux * 9 - uy * 5, y + dy - uy * 9 + ux * 5); ctx.lineTo(x + dx - ux * 9 + uy * 5, y + dy - uy * 9 - ux * 5); ctx.fill();
  if (label) { ctx.font = "700 12px system-ui"; ctx.lineWidth = 3; ctx.strokeStyle = "#000a"; ctx.strokeText(label, x + dx + 6, y + dy + 4); ctx.fillText(label, x + dx + 6, y + dy + 4); }
}
const vec = (x, y, dx, dy, color, label, life = 1.2) => { if (!physOn) return; vecs.push({ x, y, dx, dy, color, label, life }); kick(); };
// launch a projectile from a to b in T seconds under gravity g: v0 = (Δ − ½·g·T²) / T
function launch(a, b, T, g, draw, done, extra = {}) {
  const vx = (b.x - a.x) / T, vy = (b.y - a.y - .5 * g * T * T) / T, tr = { pts: [], life: 1.6 };
  if (physOn) { trails.push(tr); vec(a.x, a.y, vx * .12, vy * .12, "#7fe3ff", "v₀", .9); vec(a.x + 26, a.y - 10, 0, Math.min(60, g * .03), "#ff7eb6", g ? "g" : "", .9); }
  add(Object.assign({ x: a.x, y: a.y, vx, vy, g, life: T, trail: tr.pts, draw, done }, extra));
}

/* ---------- drawing helpers ---------- */
const dot = (color, r) => p => { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = color; ctx.beginPath(); ctx.arc(p.x, p.y, r * (p.s || 1), 0, 7); ctx.fill(); ctx.globalAlpha = 1; };
const sq = color => p => { ctx.globalAlpha = Math.max(0, 1 - Math.max(0, p.t - p.life * .6) / (p.life * .4)); ctx.fillStyle = color; ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); ctx.globalAlpha = 1; };
const arrowSprite = p => { const a = Math.atan2(p.vy, p.vx); ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a); ctx.fillStyle = "#8b5a2b"; ctx.fillRect(-18, -1.5, 26, 3); ctx.fillStyle = "#e9eef5"; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(6, -5); ctx.lineTo(6, 5); ctx.fill(); ctx.fillStyle = "#3ec46d"; ctx.fillRect(-20, -4, 6, 3); ctx.fillRect(-20, 1, 6, 3); ctx.restore(); };
const orb = p => { const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 16); g.addColorStop(0, "#fff"); g.addColorStop(.35, "#7fe3ff"); g.addColorStop(1, "rgba(122,92,255,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 16, 0, 7); ctx.fill();
  if (Math.random() < .7) add({ x: p.x, y: p.y, vx: (Math.random() - .5) * 60, vy: (Math.random() - .5) * 60, g: 0, life: .35, s: 1, draw: dot("#b9a6ff", 3) }); };
const textP = (txt, color, size) => p => { ctx.globalAlpha = Math.max(0, 1 - Math.max(0, p.t - p.life * .55) / (p.life * .45)); ctx.font = `900 ${size}px system-ui`; ctx.textAlign = "center"; ctx.lineWidth = 5; ctx.strokeStyle = "#000"; ctx.strokeText(txt, p.x, p.y); ctx.fillStyle = color; ctx.fillText(txt, p.x, p.y); ctx.globalAlpha = 1; ctx.textAlign = "start"; };
function burst(at, colors, n = 16, floor) { for (let i = 0; i < n; i++) { const a = -Math.PI * Math.random(), sp = 220 + Math.random() * 380; add({ x: at.x, y: at.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.1 + Math.random() * .5, s: 4 + Math.random() * 5, floor, e: .45, draw: sq(colors[i % colors.length]) }); } }
function dmgNum(at, n, color, big) { add({ x: at.x, y: at.y - at.h * .3, vx: (Math.random() - .5) * 120, vy: -520, life: 1.25, draw: textP(String(n), color, big ? 40 : 28) }); }
function ring(at, color) { add({ x: at.x, y: at.y + at.h * .35, life: .55, g: 0, draw: p => { const k = p.t / p.life; ctx.globalAlpha = 1 - k; ctx.strokeStyle = color; ctx.lineWidth = 6 * (1 - k) + 1; ctx.beginPath(); ctx.ellipse(p.x, p.y, 20 + k * 140, 6 + k * 34, 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; } }); }
function slash(at, color = "#fff") { add({ x: at.x, y: at.y, life: .28, g: 0, draw: p => { const k = p.t / p.life; ctx.globalAlpha = 1 - k; ctx.strokeStyle = color; ctx.lineWidth = 7 * (1 - k) + 2; ctx.lineCap = "round"; ctx.beginPath(); ctx.arc(p.x - 10, p.y + 8, 52, -2.4 + k * .6, -.5 + k * 1.2); ctx.stroke(); ctx.globalAlpha = 1; } }); }
function bolt(from, to) { const segs = []; for (let i = 0; i <= 10; i++) { const k = i / 10; segs.push({ x: from.x + (to.x - from.x) * k + (i && i < 10 ? (Math.random() - .5) * 46 : 0), y: from.y + (to.y - from.y) * k }); }
  add({ life: .38, g: 0, x: 0, y: 0, draw: p => { ctx.globalAlpha = 1 - p.t / p.life; ctx.strokeStyle = "#e8f6ff"; ctx.lineWidth = 5; ctx.shadowColor = "#7fe3ff"; ctx.shadowBlur = 18; ctx.beginPath(); segs.forEach((s, i) => i ? ctx.lineTo(s.x, s.y) : ctx.moveTo(s.x, s.y)); ctx.stroke(); ctx.shadowBlur = 0; ctx.globalAlpha = 1; } }); }
const tag = (el, txt, color = "#fff") => { const t = document.createElement("div"); t.className = "qa-tag"; t.style.color = color; t.textContent = txt; el.appendChild(t); setTimeout(() => t.remove(), 950); };
const anim = (el, frames, opts) => el && !RM ? el.animate(frames, Object.assign({ easing: "cubic-bezier(.2,.8,.2,1)" }, typeof opts === "number" ? { duration: opts } : opts)) : { finished: Promise.resolve() };
const flash = (el, color) => anim(el, [{ filter: `brightness(1) drop-shadow(0 0 0 ${color})` }, { filter: `brightness(2.6) drop-shadow(0 0 14px ${color})` }, { filter: "brightness(1)" }], 300);

/* ---------- mount on each combat render ---------- */
const seen = new WeakSet();
let cur = { F: null, cls: "vanguard" }, queue = [];
function mount(F, cls) {
  arena = document.querySelector(".arena"); if (!arena) return;
  cur = { F, cls };
  cv = document.createElement("canvas"); cv.className = "qa-cv"; arena.appendChild(cv); ctx = cv.getContext("2d"); fit();
  const pb = document.createElement("button"); pb.className = "qa-phys" + (physOn ? " on" : ""); pb.title = "Show the physics: trajectories, velocity, gravity, F = ma"; pb.textContent = "🔬 " + (physOn ? "Physics on" : "Physics");
  pb.onclick = () => { physOn = !physOn; try { localStorage.setItem(PHY_KEY, physOn ? "1" : "0"); } catch (e) {} pb.classList.toggle("on", physOn); pb.textContent = "🔬 " + (physOn ? "Physics on" : "Physics"); };
  arena.appendChild(pb);
  const me = document.getElementById("me"); if (me) me.innerHTML = `<span class="qa-hero">${sprite(cls, 78)}</span>`;
  const foe = document.getElementById("foe");
  if (foe) {
    const icon = foe.textContent.trim(), fly = FLYERS.has(icon), boss = F.kind === "boss";
    foe.innerHTML = `<span class="qa-idle ${boss ? "qa-bossaura" : fly ? "qa-float" : F.kind === "elite" ? "qa-sway" : "qa-breathe"}" style="animation-delay:-${(Math.random() * 2).toFixed(2)}s">${icon}</span><span class="qa-shadow"></span>${F.stun ? `<span class="qa-stars"><i>💫</i><i>⭐</i><i>💫</i></span>` : ""}`;
    if (!seen.has(F)) { seen.add(F); entrance(foe, boss); }
  }
  const q = queue; queue = []; q.forEach(fn => fn());
}
// monster drops in under gravity and bounces: h = ½gt², bounce keeps e² of its energy
function entrance(foe, boss) {
  if (RM) return; const h = boss ? 260 : 170, frames = [], e = .38; let y = -h, v = 0, t = 0; const dt = 1 / 60;
  while (t < 1.6) { v += 2200 * dt; y += v * dt; if (y > 0) { y = 0; v = -v * e; if (Math.abs(v) < 60) { frames.push({ transform: "translateY(0) scale(1,1)" }); break; } frames.push({ transform: "translateY(0) scale(1.18,.8)" }); } else frames.push({ transform: `translateY(${y.toFixed(1)}px)` }); t += dt; }
  foe.animate(frames, { duration: frames.length * 1000 / 60, easing: "linear" });
  if (boss) { setTimeout(() => { const a = document.querySelector(".arena"); a && a.animate([{ transform: "translate(0,0)" }, { transform: "translate(-6px,4px)" }, { transform: "translate(5px,-3px)" }, { transform: "translate(-3px,2px)" }, { transform: "none" }], 420); }, frames.length * 1000 / 60 * .55); }
  setTimeout(() => { const c = document.getElementById("foe"); if (c && cv) { const p = center(c); burst({ x: p.x, y: p.y + p.h * .4 }, ["#8a7a66", "#5c5145", "#b9a88f"], boss ? 18 : 10, p.y + p.h * .45); vec(p.x - 60, p.y - p.h * .2, 0, 50, "#ff7eb6", "g ↓ 9.8 m/s²", 1.4); } }, frames.length * 1000 / 60 * .5);
}

/* ---------- hero attacks ---------- */
function heroHit({ cls, skill, crit, dmg, kill }) {
  const me = document.getElementById("me"), foe = document.getElementById("foe"); if (!me || !foe || !cv) return;
  const a = center(me), b = center(foe), dir = { x: b.x - a.x, y: b.y - a.y };
  const impact = () => {
    const mass = cur.F && cur.F.kind === "boss" ? 3 : cur.F && cur.F.kind === "elite" ? 2 : 1, push = Math.min(70, 10 + dmg * 1.4 / mass) * (crit ? 1.4 : 1);
    anim(foe, [{ transform: "none" }, { transform: `translate(${(dir.x / Math.hypot(dir.x, dir.y)) * push}px, ${-push * .55}px) rotate(${push * .25}deg) scale(1.08,.9)` }, { transform: "none" }], { duration: kill ? 260 : 420, easing: "cubic-bezier(.15,.9,.3,1)" });
    flash(foe, crit ? "#ffd23d" : "#fff");
    dmgNum(b, dmg, crit ? "#ffd23d" : "#ffffff", crit);
    burst({ x: b.x, y: b.y }, crit ? ["#ffd23d", "#fff", "#ff9a3d"] : ["#fff", "#c8cdd8"], crit ? 14 : 7);
    vec(b.x + b.w * .25, b.y + 6, Math.sign(dir.x || 1) * Math.max(40, push * 1.6), -push * .3, "#ffd23d", `F = m·a  (a = F/m, m=${mass})`, 1.6);
    if (crit) { const ar = document.querySelector(".arena"); anim(ar, [{ transform: "none" }, { transform: "translate(-5px,3px)" }, { transform: "translate(4px,-2px)" }, { transform: "none" }], 260); tag(foe, "CRITICAL!", "#ffd23d"); }
    if (cls === "vanguard" && skill) { ring(b, "#ffd23d"); tag(foe, "STUNNED", "#ffe066"); }
    if (kill) setTimeout(() => die(foe), 240);
  };
  // the hero's body: a lunge (or a leap for Shield Slam, a parabola of its own)
  if (cls === "vanguard") {
    if (skill) { const T = .6, frames = []; for (let i = 0; i <= 30; i++) { const k = i / 30, arc = Math.sin(k * Math.PI); frames.push({ transform: `translate(${dir.x * .55 * arc}px, ${dir.y * .55 * arc - 110 * arc}px) rotate(${k * 360}deg)` }); }
      anim(me, frames, { duration: T * 1000, easing: "linear" }); setTimeout(impact, T * 520); }
    else { anim(me, [{ transform: "none" }, { transform: "translate(-8px,6px) scale(1.1,.9)", offset: .25 }, { transform: `translate(${dir.x * .6}px, ${dir.y * .6}px) scale(.95,1.05)`, offset: .55 }, { transform: "none" }], 520); setTimeout(() => { slash(b); impact(); }, 290); }
  } else if (cls === "ranger") {
    anim(me, [{ transform: "none" }, { transform: "translateX(-6px) scale(1.06,.94)", offset: .4 }, { transform: "translateX(3px)" }, { transform: "none" }], 360);
    const shots = skill ? 5 : 1;
    for (let i = 0; i < shots; i++) setTimeout(() => launch({ x: a.x + 18, y: a.y - 10 }, { x: b.x + (i - 2) * (skill ? 10 : 0), y: b.y }, .62, G * .9, arrowSprite, i === shots - 1 ? impact : () => burst(b, ["#fff"], 3)), 150 + i * 110);
  } else {
    anim(me, [{ transform: "none" }, { transform: "translateY(-10px) scale(1.05)", offset: .5 }, { transform: "none" }], 520);
    flash(me, "#7fe3ff");
    for (let i = 0; i < 10; i++) add({ x: a.x + (Math.random() - .5) * 50, y: a.y + 20, vx: (Math.random() - .5) * 40, vy: -120 - Math.random() * 120, g: -80, life: .9, draw: dot("#b9a6ff", 3) });
    if (skill) setTimeout(() => { bolt({ x: b.x + 30, y: -10 }, b); setTimeout(() => bolt({ x: b.x - 40, y: -10 }, b), 90); impact();
      for (let i = 0; i < 12; i++) add({ x: a.x + (Math.random() - .5) * 40, y: a.y + 10, vx: 0, vy: -140 - Math.random() * 80, g: 0, life: 1, draw: textP("+", "#3ec46d", 18) }); }, 330);
    else setTimeout(() => launch({ x: a.x + 16, y: a.y - 18 }, b, .45, G * .25, orb, impact), 230);
  }
}
function heroMiss(cls) {
  const me = document.getElementById("me"), foe = document.getElementById("foe"); if (!me || !foe || !cv) return;
  const a = center(me), b = center(foe), side = Math.random() < .5 ? -1 : 1;
  anim(foe, [{ transform: "none" }, { transform: `translateX(${side * 46}px) rotate(${side * 8}deg)`, offset: .45 }, { transform: "none" }], 560);
  setTimeout(() => tag(foe, "MISS", "#c8cdd8"), 200);
  if (cls === "ranger") launch({ x: a.x + 18, y: a.y - 10 }, { x: b.x - side * 30, y: b.y - 10 }, .5, G * .9, arrowSprite, () => {});
  else if (cls === "arcanist") launch({ x: a.x + 16, y: a.y - 18 }, { x: b.x - side * 40, y: b.y - 30 }, .45, G * .25, orb, () => {});
  else anim(me, [{ transform: "none" }, { transform: `translate(${(b.x - a.x) * .4}px, ${(b.y - a.y) * .4}px)`, offset: .5 }, { transform: "rotate(-8deg)", offset: .75 }, { transform: "none" }], 620);
}
function die(foe) {
  if (!foe || !foe.isConnected || !cv) return; const p = center(foe), boss = cur.F && cur.F.kind === "boss";
  const colors = boss ? ["#ff5a3a", "#ffd23d", "#c0392b", "#fff"] : ["#e9e9e4", "#b8b8c8", "#ffd23d", "#8a7a66"];
  burst(p, colors, boss ? 46 : 26, p.y + p.h * .45);
  anim(foe, [{ transform: "none", opacity: 1, filter: "brightness(1)" }, { transform: "translateY(-14px) scale(1.15,.85)", filter: "brightness(3)", offset: .3 }, { transform: "translateY(30px) scale(.2,.05) rotate(25deg)", opacity: 0, filter: "brightness(3)" }], { duration: boss ? 1100 : 700, fill: "forwards" });
  tag(foe, boss ? "BOSS DEFEATED!" : "DEFEATED!", "#ffd23d");
}

/* ---------- monster attacks the hero ---------- */
function foeHit(dmg, fatal, onHit) {
  const me = document.getElementById("me"), foe = document.getElementById("foe");
  if (!me || !foe || !cv) { onHit && onHit(); return; }
  const a = center(foe), b = center(me), dx = (b.x - a.x) * .55, dy = (b.y - a.y) * .55;
  anim(foe, [{ transform: "none" }, { transform: "translateY(-12px) scale(1.15,.88) rotate(-6deg)", offset: .35 }, { transform: `translate(${dx}px, ${dy}px) scale(1.05)`, offset: .62 }, { transform: "none" }], 640);
  setTimeout(() => {
    onHit && onHit();
    const push = Math.min(50, 10 + dmg * 1.2);
    anim(me, [{ transform: "none", opacity: 1 }, { transform: `translate(${-push * .6}px, ${push * .4}px) rotate(-10deg)`, opacity: .5, offset: .3 }, { opacity: 1, offset: .5 }, { opacity: .5, offset: .7 }, { transform: "none", opacity: 1 }], 560);
    flash(me, "#ff5a4a"); dmgNum(b, "-" + dmg, "#ff6a5a", false); burst(b, ["#ff5a4a", "#fff"], 6);
    vec(b.x, b.y - b.h * .4, -push * 1.4, push * .5, "#ff6a5a", "F (impact)", 1.2);
    if (fatal) setTimeout(() => anim(me, [{ transform: "none", opacity: 1 }, { transform: "translateY(10px) rotate(-90deg)", opacity: .35 }], { duration: 600, fill: "forwards" }), 480);
  }, 400);
}
function heal() { const me = document.getElementById("me"); if (!me || !cv) return; const a = center(me); flash(me, "#3ec46d");
  for (let i = 0; i < 16; i++) add({ x: a.x + (Math.random() - .5) * 60, y: a.y + 20, vx: 0, vy: -90 - Math.random() * 90, g: 0, life: 1.1, draw: textP("+", "#3ec46d", 16 + Math.random() * 8) }); tag(me, "HEALED", "#3ec46d"); }
function dodge() { const me = document.getElementById("me"); if (me) { anim(me, [{ transform: "none" }, { transform: "translateX(-34px) rotate(-8deg)", offset: .4 }, { transform: "none" }], 480); tag(me, "DODGE!", "#7fe3ff"); } }

window.QA = { art: HERO, px: PX, sprite: (cls, size) => `<span class="qa-hero">${sprite(cls, size)}</span>`, mount, heroHit, heroMiss, foeHit, heal, dodge, later: fn => queue.push(fn) };
addEventListener("resize", fit);
})();
