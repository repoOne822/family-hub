// Physics 6: small interactive simulations shown in each unit's "Big idea" section.
// Real equations, real units (SI, g = 9.8 m/s²). Each sim stops itself when its canvas leaves the page.
(() => {
const G = 9.8;
const css = `
.sim{display:grid;gap:10px}
.sim canvas{width:100%;height:230px;background:linear-gradient(#0f1b33,#16264a);border-radius:12px;display:block}
.sim .ctl{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px 16px}
.sim label{display:grid;gap:2px;font-size:13px;font-weight:700}
.sim label span{font-weight:600;opacity:.75}
.sim input[type=range]{width:100%}
.sim .rd{display:flex;flex-wrap:wrap;gap:6px}
.sim .rd b{background:#0001;border:1px solid #0002;border-radius:999px;padding:3px 10px;font:700 13px ui-monospace,Menlo,monospace}
.sim .row2{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.sim .eq{font:700 14px ui-monospace,Menlo,monospace;opacity:.85}
.sim .simbtn{border:0;border-radius:10px;padding:8px 14px;font:700 14px inherit;cursor:pointer;background:#3d9bff;color:#fff}
.sim .simbtn.alt{background:#0002;color:inherit}`;
const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

const slider = (id, label, min, max, step, val, unit) => `<label>${label} <span id="${id}v">${val} ${unit}</span><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"></label>`;
function setup(el, controls, extra = "") {
  el.innerHTML = `<div class="sim"><canvas></canvas><div class="ctl">${controls}</div>${extra}<div class="rd"></div></div>`;
  const cv = el.querySelector("canvas"), ctx = cv.getContext("2d"), rd = el.querySelector(".rd");
  const fit = () => { const r = cv.getBoundingClientRect(), d = devicePixelRatio || 1; cv.width = r.width * d; cv.height = r.height * d; ctx.setTransform(d, 0, 0, d, 0, 0); return { W: r.width, H: r.height }; };
  let size = fit(); addEventListener("resize", () => { if (cv.isConnected) size = fit(); });
  const val = id => +el.querySelector("#" + id).value;
  el.querySelectorAll("input[type=range]").forEach(r => r.addEventListener("input", () => { const u = el.querySelector("#" + r.id + "v"); u.textContent = r.value + " " + u.textContent.split(" ").slice(1).join(" "); }));
  const run = draw => { let last = 0; const f = t => { if (!cv.isConnected) return; const dt = Math.min(.05, (t - (last || t)) / 1000); last = t; draw(ctx, size.W, size.H, dt); requestAnimationFrame(f); }; requestAnimationFrame(f); };
  return { cv, ctx, rd, val, run, el };
}
function arrow(c, x, y, dx, dy, color, label) {
  const L = Math.hypot(dx, dy); if (L < 3) return; const ux = dx / L, uy = dy / L;
  c.strokeStyle = c.fillStyle = color; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x + dx - ux * 8, y + dy - uy * 8); c.stroke();
  c.beginPath(); c.moveTo(x + dx, y + dy); c.lineTo(x + dx - ux * 11 - uy * 6, y + dy - uy * 11 + ux * 6); c.lineTo(x + dx - ux * 11 + uy * 6, y + dy - uy * 11 - ux * 6); c.fill();
  if (label) { c.font = "700 12px system-ui"; c.fillText(label, x + dx + (ux >= 0 ? 6 : -6 - c.measureText(label).width), y + dy - 6); }
}
const txt = (c, s, x, y, col = "#fff", size = 13) => { c.fillStyle = col; c.font = `700 ${size}px system-ui`; c.fillText(s, x, y); };
const fmt = (n, d = 1) => (Math.abs(n) < 1e-9 ? 0 : n).toFixed(d);

/* 🏃 Kinematics: a cart with v₀ and a. Ticker-tape dots every 1 s show equal or growing gaps. */
function kinematics(el) {
  const S = setup(el, slider("v0", "Starting velocity v₀", -2, 8, .5, 2, "m/s") + slider("ac", "Acceleration a", -3, 3, .25, 1, "m/s²"),
    `<div class="row2"><button class="simbtn" data-go>▶ Go</button><button class="simbtn alt" data-reset>↺ Reset</button><span class="eq">v = v₀ + a·t &nbsp; x = v₀·t + ½·a·t²</span></div>`);
  let t = 0, going = false, marks = [];
  const reset = () => { t = 0; going = false; marks = []; };
  S.el.querySelector("[data-go]").onclick = () => { reset(); going = true; }; S.el.querySelector("[data-reset]").onclick = reset;
  S.el.querySelectorAll("input").forEach(i => i.addEventListener("input", reset));
  S.run((c, W, H, dt) => {
    const v0 = S.val("v0"), a = S.val("ac"), scale = (W - 60) / 40, x0 = 30; // 40 m track
    if (going) { t += dt; const xs = v0 * t + .5 * a * t * t; if (Math.floor(t) > marks.length - 1 && t >= marks.length) marks.push(xs); if (xs > 40 || xs < -0.5 || t > 12) going = false; }
    const x = v0 * t + .5 * a * t * t, v = v0 + a * t, px = x0 + Math.max(-.5, Math.min(40, x)) * scale, gy = H - 50;
    c.clearRect(0, 0, W, H);
    c.fillStyle = "#2b3d63"; c.fillRect(0, gy + 18, W, 6);
    for (let m = 0; m <= 40; m += 5) { const gx = x0 + m * scale; c.fillStyle = "#ffffff55"; c.fillRect(gx, gy + 24, 1, 8); txt(c, m + " m", gx - 8, gy + 44, "#ffffff88", 11); }
    marks.forEach((mx, i) => { const gx = x0 + mx * scale; c.fillStyle = "#ffd23d"; c.beginPath(); c.arc(gx, gy + 21, 4, 0, 7); c.fill(); txt(c, i + "s", gx - 6, gy + 12, "#ffd23d", 10); });
    c.fillStyle = "#e5484d"; c.fillRect(px - 22, gy - 14, 44, 26); c.fillStyle = "#ffb1a8"; c.fillRect(px - 14, gy - 22, 20, 10);
    c.fillStyle = "#111"; [[-12, 14], [12, 14]].forEach(([wx, wy]) => { c.beginPath(); c.arc(px + wx, gy + wy, 6, 0, 7); c.fill(); });
    arrow(c, px, gy - 34, v * 9, 0, "#7fe3ff", "v"); if (a) arrow(c, px, gy - 54, a * 18, 0, "#ff7eb6", "a");
    S.rd.innerHTML = `<b>t = ${fmt(t)} s</b><b>x = ${fmt(x)} m</b><b>v = ${fmt(v)} m/s</b><b>a = ${fmt(a, 2)} m/s²</b>`;
    if (!going && !t) txt(c, "Set v₀ and a, then press Go. Yellow dots = where the cart is every 1 second.", 12, 22, "#ffffffcc", 12);
  });
}

/* 🧲 Forces: push a box. Friction = μ·m·g (static holds until the push beats it). Net force → a = F/m. */
function forces(el) {
  const S = setup(el, slider("fa", "Your push F", 0, 80, 1, 30, "N") + slider("ms", "Mass m", 2, 20, 1, 5, "kg") + slider("mu", "Friction μ", 0, .6, .05, .3, ""),
    `<div class="row2"><button class="simbtn alt" data-reset>↺ Put the box back</button><span class="eq">F_net = F − f &nbsp; a = F_net / m &nbsp; f = μ·m·g</span></div>`);
  let x = 0, v = 0; S.el.querySelector("[data-reset]").onclick = () => { x = 0; v = 0; };
  S.run((c, W, H, dt) => {
    const F = S.val("fa"), m = S.val("ms"), mu = S.val("mu"), fmax = mu * m * G;
    let fr, net;
    if (Math.abs(v) < 1e-3 && F <= fmax) { fr = F; net = 0; v = 0; } // static friction balances the push
    else { fr = Math.min(fmax, Math.abs(v) > 1e-3 ? fmax : fmax) * Math.sign(v || 1); net = F - fr; }
    const a = net / m; v = Math.max(0, v + a * dt); x += v * dt; if (x > 30) { x = 0; }
    const scale = (W - 80) / 30, gy = H - 62, bw = 30 + m * 2.5, bx = 40 + x * scale;
    c.clearRect(0, 0, W, H); c.fillStyle = "#3a2f25"; c.fillRect(0, gy, W, 10);
    for (let i = 0; i < W; i += 14) { c.fillStyle = "#ffffff14"; c.fillRect(i, gy + 2, 7, 3); }
    c.fillStyle = "#c58b4f"; c.fillRect(bx, gy - bw, bw, bw); c.strokeStyle = "#7a5230"; c.lineWidth = 2; c.strokeRect(bx, gy - bw, bw, bw); txt(c, m + " kg", bx + 4, gy - bw / 2 + 4, "#2b1a0b", 12);
    const k = 1.8, cy = gy - bw / 2;
    arrow(c, bx - 4 - F * k, cy, F * k, 0, "#7fe3ff", `F = ${F} N`);
    if (fr) { arrow(c, bx + bw / 2, gy + 22, -Math.abs(fr) * k, 0, "#ff9a3d"); txt(c, `friction f = ${fmt(Math.abs(fr))} N (acts at the floor)`, bx + bw / 2 - Math.abs(fr) * k, gy + 40, "#ff9a3d", 12); }
    arrow(c, bx + bw / 2, gy - bw - 14, net * k, 0, "#3ec46d", net ? `F_net = ${fmt(net)} N` : "");
    arrow(c, bx + bw + 30, gy - bw, 0, Math.min(70, m * G * .35), "#ff7eb6", `W = ${fmt(m * G, 0)} N`);
    S.rd.innerHTML = `<b>max friction = ${fmt(fmax)} N</b><b>F_net = ${fmt(net)} N</b><b>a = ${fmt(a, 2)} m/s²</b><b>v = ${fmt(v)} m/s</b>${net === 0 && v === 0 ? "<b>⚖️ Balanced: no motion (Newton's 1st law)</b>" : ""}`;
  });
}

/* ⚡ Energy: a pendulum. PE = m·g·h, KE = ½·m·v². With friction on, some energy becomes heat. */
function energy(el) {
  const S = setup(el, slider("ang", "Release angle", 10, 80, 5, 45, "°") + `<label>Air & friction <span></span><select id="fr"><option value="0">Off (ideal)</option><option value="1">On</option></select></label>`,
    `<div class="row2"><button class="simbtn" data-go>▶ Release</button><span class="eq">PE = m·g·h &nbsp; KE = ½·m·v² &nbsp; PE + KE (+ heat) = constant</span></div>`);
  const L = 2, m = 1; let th = 45 * Math.PI / 180, w = 0, heat = 0, E0 = 0;
  const go = () => { th = S.val("ang") * Math.PI / 180; w = 0; heat = 0; E0 = m * G * L * (1 - Math.cos(th)); };
  S.el.querySelector("[data-go]").onclick = go; S.el.querySelector("#ang").addEventListener("input", go); go();
  S.run((c, W, H, dt) => {
    const damp = +S.el.querySelector("#fr").value ? .25 : 0;
    for (let i = 0; i < 4; i++) { const h = dt / 4, al = -(G / L) * Math.sin(th) - damp * w; const wOld = w; w += al * h; th += w * h; if (damp) heat += damp * wOld * wOld * m * L * L * h; }
    const hgt = L * (1 - Math.cos(th)), v = Math.abs(w) * L, PE = m * G * hgt, KE = .5 * m * v * v;
    const px = W * .36, py = 24, sc = (H - 70) / L, bx = px + Math.sin(th) * L * sc, by = py + Math.cos(th) * L * sc;
    c.clearRect(0, 0, W, H); c.strokeStyle = "#ffffff55"; c.setLineDash([4, 5]); c.beginPath(); c.moveTo(px - 90, py + L * sc); c.lineTo(px + 90, py + L * sc); c.stroke(); c.setLineDash([]);
    txt(c, "lowest point (h = 0)", px + 96, py + L * sc + 4, "#ffffff77", 11);
    c.strokeStyle = "#ddd"; c.lineWidth = 2; c.beginPath(); c.moveTo(px, py); c.lineTo(bx, by); c.stroke();
    c.fillStyle = "#ffd23d"; c.beginPath(); c.arc(bx, by, 14, 0, 7); c.fill();
    const bw = 34, base = H - 24, maxE = Math.max(E0, .01), bh = H - 70, x0 = W * .66;
    [["PE", PE, "#3d9bff"], ["KE", KE, "#3ec46d"], ["Heat", heat, "#ff9a3d"], ["Total", PE + KE + heat, "#ffffff"]].forEach(([n, e, col], i) => {
      const h2 = Math.min(bh, e / maxE * bh), x = x0 + i * (bw + 10); c.fillStyle = "#ffffff12"; c.fillRect(x, base - bh, bw, bh); c.fillStyle = col; c.fillRect(x, base - h2, bw, h2); txt(c, n, x, base + 16, "#ffffffcc", 11); });
    S.rd.innerHTML = `<b>h = ${fmt(hgt, 2)} m</b><b>v = ${fmt(v, 2)} m/s</b><b>PE = ${fmt(PE)} J</b><b>KE = ${fmt(KE)} J</b>${damp ? `<b>heat = ${fmt(heat)} J</b>` : ""}<b>m = 1 kg, L = 2 m</b>`;
  });
}

/* 🌊 Waves: frequency and wavelength set the speed (v = f·λ). Watch one particle just bob up and down. */
function waves(el) {
  const S = setup(el, slider("fq", "Frequency f", .25, 3, .25, 1, "Hz") + slider("wl", "Wavelength λ", .5, 4, .25, 2, "m") + slider("am", "Amplitude A", .2, 1, .1, .6, "m"));
  let t = 0;
  S.run((c, W, H, dt) => {
    t += dt; const f = S.val("fq"), lam = S.val("wl"), A = S.val("am"), v = f * lam, sc = (W - 40) / 8, mid = H / 2, ay = A * (H * .32);
    c.clearRect(0, 0, W, H); c.strokeStyle = "#ffffff33"; c.beginPath(); c.moveTo(20, mid); c.lineTo(W - 20, mid); c.stroke();
    c.strokeStyle = "#7fe3ff"; c.lineWidth = 3; c.beginPath();
    for (let px = 0; px <= W - 40; px += 2) { const xm = px / sc, y = mid - ay * Math.sin(2 * Math.PI * (xm / lam - f * t)); px ? c.lineTo(20 + px, y) : c.moveTo(20, y); } c.stroke();
    const pxm = 2.5, py = mid - ay * Math.sin(2 * Math.PI * (pxm / lam - f * t)); c.fillStyle = "#ffd23d"; c.beginPath(); c.arc(20 + pxm * sc, py, 8, 0, 7); c.fill();
    txt(c, "this bit only moves up & down", 20 + pxm * sc + 12, py - 10, "#ffd23d", 11);
    const crest = ((f * t * lam) % lam); // a crest's travel, to show it moving at v
    const cx = 20 + ((lam / 4 + crest) % 8) * sc; arrow(c, cx, mid - ay - 22, Math.min(80, v * 14), 0, "#ff7eb6", `v = ${fmt(v, 2)} m/s`);
    c.strokeStyle = "#ffffff88"; c.lineWidth = 1.5; const l0 = 20 + sc * .2; c.beginPath(); c.moveTo(l0, H - 22); c.lineTo(l0 + lam * sc, H - 22); c.stroke(); txt(c, `λ = ${lam} m`, l0 + 4, H - 28, "#ffffffcc", 11);
    S.rd.innerHTML = `<b>v = f·λ = ${f} × ${lam} = ${fmt(v, 2)} m/s</b><b>T = 1/f = ${fmt(1 / f, 2)} s</b><b>A = ${A} m</b>`;
  });
}


/* 🔬 Inquiry: a fair test. Change ONE variable, time 10 swings, record it. Only length changes the period (T = 2π√(L/g)). */
function inquiry(el) {
  const S = setup(el, slider("len", "Independent variable: length L", .25, 2, .25, 1, "m") + slider("mas", "Mass m (try changing it!)", .1, 2, .1, .5, "kg") + slider("amp", "Release angle (keep small)", 5, 30, 5, 10, "°"),
    `<div class="row2"><button class="simbtn" data-go>⏱️ Time 10 swings</button><button class="simbtn alt" data-clear>Clear table</button><span class="eq">Fair test: change one thing, keep the rest the same.</span></div><div class="tbl"></div>`);
  let t = 0, timing = false, tT = 0, rows = [];
  const tbl = S.el.querySelector(".tbl"), draw = () => { tbl.innerHTML = rows.length ? `<table style="width:100%;border-collapse:collapse;font-size:13px"><tr><th align=left>Trial</th><th align=left>L (m)</th><th align=left>m (kg)</th><th align=left>angle</th><th align=left>10 swings (s)</th><th align=left>period T (s)</th></tr>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${r.L}</td><td>${r.m}</td><td>${r.a}°</td><td>${r.t10}</td><td><b>${r.T}</b></td></tr>`).join("")}</table>` : ""; };
  S.el.querySelector("[data-go]").onclick = () => { timing = true; tT = 0; };
  S.el.querySelector("[data-clear]").onclick = () => { rows = []; draw(); };
  S.run((c, W, H, dt) => {
    const L = S.val("len"), m = S.val("mas"), a0 = S.val("amp") * Math.PI / 180, T = 2 * Math.PI * Math.sqrt(L / G);
    t += dt; if (timing) { tT += dt; if (tT >= 10 * T) { timing = false; rows.push({ L, m, a: S.val("amp"), t10: (10 * T + (Math.random() - .5) * .2).toFixed(2), T: (T + (Math.random() - .5) * .02).toFixed(2) }); draw(); } }
    const th = a0 * Math.cos(2 * Math.PI * t / T), px = W * .3, sc = (H - 50) / 2, bx = px + Math.sin(th) * L * sc, by = 14 + Math.cos(th) * L * sc, r = 6 + m * 7;
    c.clearRect(0, 0, W, H); c.fillStyle = "#ffffff22"; c.fillRect(px - 60, 10, 120, 4);
    c.strokeStyle = "#ddd"; c.lineWidth = 2; c.beginPath(); c.moveTo(px, 14); c.lineTo(bx, by); c.stroke(); c.fillStyle = "#ff9a3d"; c.beginPath(); c.arc(bx, by, r, 0, 7); c.fill();
    txt(c, timing ? `⏱️ ${tT.toFixed(1)} s  (swing ${Math.min(10, Math.floor(tT / T) + 1)} of 10)` : "Press the timer to measure 10 swings", W * .55, 40, "#ffd23d", 14);
    txt(c, "Why 10 swings? One swing is too fast to time well.", W * .55, 64, "#ffffffaa", 12); txt(c, "Divide by 10 to get the period.", W * .55, 82, "#ffffffaa", 12);
    S.rd.innerHTML = rows.length >= 2 ? `<b>Look at your table: which change made T different?</b>` : `<b>Independent: what you change</b><b>Dependent: the period T you measure</b><b>Controlled: everything else</b>`;
  });
}

/* 📏 Measurement: the metric staircase. Each step = ×10. Bigger unit → smaller number. */
function measure(el) {
  const U = [["km", 1e3], ["hm", 1e2], ["dam", 10], ["m", 1], ["dm", .1], ["cm", .01], ["mm", .001]];
  el.innerHTML = `<div class="sim"><canvas></canvas><div class="ctl"><label>Number <span></span><input id="mn" type="number" value="2.5" step="any"></label><label>From <span></span><select id="mf">${U.map(u => `<option ${u[0] === "m" ? "selected" : ""}>${u[0]}</option>`).join("")}</select></label><label>To <span></span><select id="mt">${U.map(u => `<option ${u[0] === "cm" ? "selected" : ""}>${u[0]}</option>`).join("")}</select></label></div><div class="rd"></div></div>`;
  const cv = el.querySelector("canvas"), c = cv.getContext("2d"), rd = el.querySelector(".rd");
  const draw = () => { if (!cv.isConnected) return; const r = cv.getBoundingClientRect(), d = devicePixelRatio || 1; cv.width = r.width * d; cv.height = r.height * d; c.setTransform(d, 0, 0, d, 0, 0); const W = r.width, H = r.height;
    const n = +el.querySelector("#mn").value || 0, fi = U.findIndex(u => u[0] === el.querySelector("#mf").value), ti = U.findIndex(u => u[0] === el.querySelector("#mt").value), steps = ti - fi, out = n * U[fi][1] / U[ti][1];
    c.clearRect(0, 0, W, H); const sw = (W - 40) / U.length, sh = (H - 60) / U.length;
    U.forEach((u, i) => { const x = 20 + i * sw, y = 20 + i * sh; c.fillStyle = i === fi ? "#3d9bff" : i === ti ? "#3ec46d" : "#ffffff22"; c.fillRect(x, y, sw - 4, H - 40 - y); txt(c, u[0], x + 6, y + 18, "#fff", 15); });
    if (steps) { const x1 = 20 + fi * sw + sw / 2, x2 = 20 + ti * sw + sw / 2, y1 = 20 + fi * sh - 6, y2 = 20 + ti * sh - 6; arrow(c, x1, y1, x2 - x1, y2 - y1, "#ffd23d", `${Math.abs(steps)} step${Math.abs(steps) > 1 ? "s" : ""} ${steps > 0 ? "down: ×" : "up: ÷"}${10 ** Math.abs(steps)}`); }
    rd.innerHTML = `<b>${n} ${U[fi][0]} = ${+out.toPrecision(10)} ${U[ti][0]}</b><b>${steps > 0 ? "Smaller unit → bigger number. Move the decimal " + steps + " right." : steps < 0 ? "Bigger unit → smaller number. Move the decimal " + -steps + " left." : "Same unit."}</b>`; };
  el.querySelectorAll("input,select").forEach(i => i.addEventListener("input", draw)); requestAnimationFrame(draw); addEventListener("resize", draw);
}

window.SIMS = { inquiry, measure, kinematics, forces, energy, waves };
})();
