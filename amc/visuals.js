// Picture explanations for each lesson (inline SVG, original drawings).
(function () {
  const INK = "#16161d", LIME = "#c4f53a", PINK = "#ff5ccb", BLUE = "#5cc8ff", YEL = "#ffe066", PUR = "#8a6bff", ORA = "#ff8a3d", GRN = "#2fbf71", RED = "#ff5a5a", PAPER = "#fffdf6";
  const svg = (w, h, body, cap) => `<figure class="vis"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${cap || "diagram"}" style="font-family:Fredoka,system-ui,sans-serif">${body}</svg>${cap ? `<figcaption>${cap}</figcaption>` : ""}</figure>`;
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.fs || 18}" font-weight="${o.fw || 600}" fill="${o.fill || INK}" text-anchor="${o.a || "middle"}" dominant-baseline="middle">${s}</text>`;
  const R = (x, y, w, h, fill, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx ?? 8}" fill="${fill}" stroke="${o.stroke || INK}" stroke-width="${o.sw ?? 3}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ""}/>`;
  const Cc = (x, y, r, fill, o = {}) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${o.stroke || INK}" stroke-width="${o.sw ?? 3}"${o.op ? ` fill-opacity="${o.op}"` : ""}/>`;
  const L = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.c || INK}" stroke-width="${o.sw ?? 3}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ""} stroke-linecap="round"/>`;
  const Pg = (pts, fill, o = {}) => `<polygon points="${pts.map(p => p.join(",")).join(" ")}" fill="${fill}" stroke="${o.stroke || INK}" stroke-width="${o.sw ?? 3}" stroke-linejoin="round"${o.op ? ` fill-opacity="${o.op}"` : ""}/>`;
  const dots = (x, y, rows, cols, gap, fill) => { let s = ""; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) s += Cc(x + c * gap, y + r * gap, gap * 0.32, fill, { sw: 2 }); return s; };
  const node = (x, y, v, prime) => (prime ? Cc(x, y, 22, LIME) : R(x - 26, y - 18, 52, 36, "#fff", { rx: 10 })) + T(x, y + 1, v, { fs: 19, fw: 700 });

  const M = {}, MV = {};

  M.factors = () => svg(640, 270,
    T(150, 22, "12 kids → equal teams", { fs: 17 }) +
    T(40, 70, "2 × 6", { fs: 15, a: "start" }) + dots(100, 60, 2, 6, 26, PINK) +
    T(40, 150, "3 × 4", { fs: 15, a: "start" }) + dots(100, 125, 3, 4, 26, BLUE) +
    T(40, 235, "1 × 12", { fs: 15, a: "start" }) + dots(100, 235, 1, 12, 17, YEL) +
    L(318, 20, 318, 255, { c: "#0002", sw: 2 }) +
    T(480, 22, "Factor tree: down to prime bricks", { fs: 17 }) +
    L(480, 70, 420, 130) + L(480, 70, 540, 130) + L(540, 130, 505, 200) + L(540, 130, 575, 200) + L(420, 130, 390, 200) + L(420, 130, 450, 200) +
    node(480, 70, "60") + node(420, 130, "6") + node(540, 130, "10") +
    node(390, 205, "2", 1) + node(450, 205, "3", 1) + node(505, 205, "2", 1) + node(575, 205, "5", 1) +
    T(480, 252, "60 = 2 × 2 × 3 × 5 = 2² × 3 × 5", { fs: 16 }),
    "Factors are the ways to make equal teams. A factor tree splits a number until every branch is a prime (green).");
  MV.factors = { 2: () => svg(560, 260,
    `<ellipse cx="215" cy="125" rx="150" ry="85" fill="${PINK}" fill-opacity=".25" stroke="${INK}" stroke-width="3"/><ellipse cx="345" cy="125" rx="150" ry="85" fill="${BLUE}" fill-opacity=".25" stroke="${INK}" stroke-width="3"/>` +
    T(130, 22, "12 = 2 × 2 × 3", { fs: 16 }) + T(430, 22, "18 = 2 × 3 × 3", { fs: 16 }) +
    Cc(140, 125, 20, LIME) + T(140, 126, "2", { fw: 700 }) + Cc(260, 107, 20, LIME) + T(260, 108, "2", { fw: 700 }) + Cc(300, 147, 20, LIME) + T(300, 148, "3", { fw: 700 }) + Cc(420, 125, 20, LIME) + T(420, 126, "3", { fw: 700 }) +
    T(280, 228, "GCF = the middle = 2 × 3 = 6", { fs: 15, fill: PUR }) + T(280, 250, "LCM = everything = 2 × 2 × 3 × 3 = 36", { fs: 15, fill: PUR }),
    "Put each number's prime bricks in its own circle. Shared bricks go in the middle.") };

  M.parity = () => { const sock = (x, y, c) => `<path d="M${x} ${y} h18 v26 q0 14 14 14 h10 v14 h-28 q-14 0 -14 -14 z" fill="${c}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;
    let even = "", odd = ""; for (let i = 0; i < 3; i++) { even += sock(40 + i * 80, 70, BLUE) + sock(66 + i * 80, 70, BLUE); odd += sock(360 + (i % 3) * 70, 70, PINK) + sock(384 + (i % 3) * 70, 70, PINK); }
    return svg(640, 250, T(150, 30, "6 socks: EVEN", { fs: 19, fill: GRN }) + even + T(150, 160, "every sock has a buddy", { fs: 15 }) +
      T(470, 30, "7 socks: ODD", { fs: 19, fill: RED }) + odd.replace(/360|384|430|454|500|524/g, m => m) + sock(570, 70, YEL) + T(588, 155, "lonely!", { fs: 15, fill: RED }) +
      R(120, 190, 400, 44, YEL, { rx: 14 }) + T(320, 212, "odd + odd: two lonely socks make a pair → EVEN", { fs: 16 }),
      "Even numbers split into pairs. Odd numbers always have one left over."); };

  M.bases = () => { let flats = ""; for (let i = 0; i < 3; i++) flats += R(30 + i * 18, 70 - i * 0, 90, 90, YEL, { rx: 3, sw: 2 }).replace(`x="${30 + i * 18}"`, `x="${30 + i * 26}"`);
    let rods = ""; for (let i = 0; i < 4; i++) rods += R(190 + i * 16, 70, 12, 90, BLUE, { rx: 3, sw: 2 });
    let cubes = ""; for (let i = 0; i < 5; i++) cubes += R(280 + (i % 3) * 16, 130 - Math.floor(i / 3) * 16, 12, 12, PINK, { rx: 2, sw: 2 });
    const bits = [[16, 1], [8, 1], [4, 0], [2, 0], [1, 1]]; let b = "";
    bits.forEach(([v, on], i) => { b += R(380 + i * 50, 80, 42, 42, on ? LIME : "#fff", { rx: 10 }) + T(401 + i * 50, 102, on, { fs: 22, fw: 700 }) + T(401 + i * 50, 140, v, { fs: 15 }); });
    return svg(640, 240, T(170, 30, "345 = 3 hundreds + 4 tens + 5 ones", { fs: 16 }) + flats + rods + cubes + T(80, 185, "300", { fs: 16 }) + T(214, 185, "40", { fs: 16 }) + T(296, 185, "5", { fs: 16 }) +
      L(355, 30, 355, 220, { c: "#0002", sw: 2 }) + T(500, 30, "Base 2 (2-finger alien)", { fs: 16 }) + b + T(500, 185, "11001₂ = 16 + 8 + 1 = 25", { fs: 17 }),
      "Each place is worth (base) times the place to its right: ×10 for us, ×2 in binary."); };

  M.sequences = () => { let s = ""; [2, 5, 8, 11, 14].forEach((v, i) => { s += R(30 + i * 56, 200 - v * 11, 44, v * 11, [LIME, BLUE, PINK, YEL, PUR][i], { rx: 6 }) + T(52 + i * 56, 190 - v * 11, v, { fs: 16, fw: 700 }); if (i) s += T(24 + i * 56, 225, "+3", { fs: 13, fill: PUR }); });
    let g = ""; for (let i = 1; i <= 10; i++) g += Cc(330 + (i - 1) * 30, 150, 13, i <= 5 ? YEL : BLUE, { sw: 2 }) + T(330 + (i - 1) * 30, 151, i, { fs: 13, fw: 700 });
    for (let i = 1; i <= 5; i++) { const x1 = 330 + (i - 1) * 30, x2 = 330 + (10 - i) * 30, h = 18 + (6 - i) * 13; g += `<path d="M${x1} 136 Q ${(x1 + x2) / 2} ${136 - h * 2} ${x2} 136" fill="none" stroke="${PINK}" stroke-width="2.5"/>`; }
    return svg(640, 240, T(150, 26, "Arithmetic: add the same step", { fs: 16 }) + s + L(310, 20, 310, 230, { c: "#0002", sw: 2 }) +
      T(470, 26, "Pair first + last: every pair = 11", { fs: 16 }) + g + T(465, 200, "1 + 2 + … + 10 = 5 pairs × 11 = 55", { fs: 16 }),
      "Stairs that go up by the same step. To add them fast, pair the ends."); };
  MV.sequences = { 1: () => { let s = ""; for (let i = 0; i < 4; i++) s += R(60 + i * 120, 60, 22, 90, ORA, { rx: 4 }) + T(71 + i * 120, 170, [3, 5, 7, 9][i], { fs: 18, fw: 700 }); for (let i = 0; i < 3; i++) s += L(82 + i * 120, 90, 180 + i * 120, 90, { sw: 4 }) + L(82 + i * 120, 120, 180 + i * 120, 120, { sw: 4 }) + T(131 + i * 120, 70, "gap", { fs: 14, fill: PUR });
    return svg(520, 200, s, "3, 5, 7, 9: (9 − 3) ÷ 2 = 3 gaps, but 4 posts. Numbers = gaps + 1."); } };

  M.ratios = () => { let s = ""; for (let i = 0; i < 3; i++) s += R(150 + i * 60, 50, 56, 44, BLUE, { rx: 6 }) + T(178 + i * 60, 72, "5", { fw: 700 });
    for (let i = 0; i < 5; i++) s += R(150 + i * 60, 120, 56, 44, PINK, { rx: 6 }) + T(178 + i * 60, 142, "5", { fw: 700 });
    return svg(640, 240, T(80, 72, "Boys", { fs: 18 }) + T(80, 142, "Girls", { fs: 18 }) + s + T(510, 72, "= 15", { fs: 20, fw: 700 }) + T(510, 142, "= 25", { fs: 20, fw: 700 }) +
      R(110, 186, 420, 40, YEL, { rx: 12 }) + T(320, 206, "3 : 5 → 8 equal boxes. 40 students ÷ 8 = 5 in each box", { fs: 15 }),
      "A ratio is equal-size boxes. Find what ONE box holds, then multiply."); };

  M.equations = () => { const box = (x, y) => R(x, y, 34, 34, PUR, { rx: 6 }) + T(x + 17, y + 18, "x", { fill: "#fff", fw: 700 }); const wt = (x, y, n) => R(x, y, 26, 26, YEL, { rx: 5, sw: 2 }) + T(x + 13, y + 14, n, { fs: 13, fw: 700 });
    return svg(640, 260, Pg([[320, 220], [290, 250], [350, 250]], "#ddd") + L(320, 220, 320, 120, { sw: 6 }) + L(90, 120, 550, 120, { sw: 6 }) + L(140, 120, 140, 140) + L(500, 120, 500, 140) +
      R(70, 140, 150, 14, "#bbb", { rx: 4 }) + R(430, 140, 150, 14, "#bbb", { rx: 4 }) +
      box(80, 102) + box(118, 102) + box(156, 102) + wt(196, 110, "7") + wt(470, 110, "22") +
      T(150, 60, "3x + 7", { fs: 22, fw: 700 }) + T(500, 60, "22", { fs: 22, fw: 700 }) +
      T(320, 30, "Take 7 off BOTH sides → 3x = 15 → split into 3 → x = 5", { fs: 16 }),
      "An equation is a balance. Whatever you do to one side, do to the other."); };

  M.venn = () => svg(640, 260,
    R(20, 20, 600, 225, PAPER, { rx: 16 }) + `<ellipse cx="250" cy="130" rx="150" ry="90" fill="${PINK}" fill-opacity=".3" stroke="${INK}" stroke-width="3"/><ellipse cx="390" cy="130" rx="150" ry="90" fill="${BLUE}" fill-opacity=".3" stroke="${INK}" stroke-width="3"/>` +
    T(200, 60, "Soccer 18", { fs: 17 }) + T(440, 60, "Basketball 15", { fs: 17 }) +
    T(180, 135, "11", { fs: 30, fw: 700 }) + T(320, 135, "7", { fs: 30, fw: 700 }) + T(460, 135, "8", { fs: 30, fw: 700 }) + T(320, 165, "both", { fs: 14 }) +
    T(565, 220, "4", { fs: 26, fw: 700 }) + T(565, 196, "neither", { fs: 13 }) + T(60, 40, "30 kids", { fs: 15, a: "start" }),
    "The middle (7) is inside BOTH hoops. 18 + 15 counts it twice, so 18 + 15 − 7 = 26 play something, and 4 play neither.");
  MV.venn = { 0: () => svg(520, 200, `<ellipse cx="200" cy="100" rx="120" ry="75" fill="${PINK}" fill-opacity=".3" stroke="${INK}" stroke-width="3"/><ellipse cx="320" cy="100" rx="120" ry="75" fill="${BLUE}" fill-opacity=".3" stroke="${INK}" stroke-width="3"/>` +
    T(260, 100, "counted", { fs: 15 }) + T(260, 120, "TWICE", { fs: 16, fill: RED, fw: 700 }) + T(150, 100, "A", { fs: 26, fw: 700 }) + T(370, 100, "B", { fs: 26, fw: 700 }),
    "A + B adds the middle twice. Subtract it once: A + B − both.") };

  M.triangles = () => svg(640, 260,
    Pg([[40, 220], [270, 220], [120, 60]], PAPER) +
    `<path d="M70 220 A30 30 0 0 0 58 196" fill="none" stroke="${PINK}" stroke-width="6"/><path d="M240 220 A30 30 0 0 1 250 200" fill="none" stroke="${BLUE}" stroke-width="6"/><path d="M107 86 A28 28 0 0 0 136 88" fill="none" stroke="${GRN}" stroke-width="6"/>` +
    T(155, 250, "Tear off the 3 corners…", { fs: 15 }) + L(300, 180, 620, 180, { sw: 3 }) +
    `<path d="M460 180 L360 180 A100 100 0 0 1 400 103 Z" fill="${PINK}" fill-opacity=".6" stroke="${INK}" stroke-width="2"/><path d="M460 180 L400 103 A100 100 0 0 1 520 103 Z" fill="${GRN}" fill-opacity=".6" stroke="${INK}" stroke-width="2"/><path d="M460 180 L520 103 A100 100 0 0 1 560 180 Z" fill="${BLUE}" fill-opacity=".6" stroke="${INK}" stroke-width="2"/>` +
    T(460, 215, "…they make a straight line: 180°", { fs: 16 }),
    "The three angles of ANY triangle add up to 180°.");
  MV.triangles = { 1: () => svg(520, 210, R(60, 40, 280, 140, PAPER, { rx: 2, dash: "8 6" }) + Pg([[60, 180], [340, 180], [200, 40]], YEL) + L(200, 40, 200, 180, { dash: "6 5", c: PUR }) + T(212, 112, "height", { fs: 14, a: "start", fill: PUR }) + T(200, 198, "base", { fs: 14 }) +
    T(430, 100, "triangle =", { fs: 16 }) + T(430, 124, "½ of the box", { fs: 16 }), "Area = ½ × base × height. The triangle fills exactly half of its box."),
    2: () => svg(560, 300, Pg([[160, 115], [260, 190], [335, 90], [235, 15]], GRN, { op: 0.45 }) + R(85, 115, 75, 75, PINK, { rx: 0, sw: 2.5 }) + R(160, 190, 100, 100, BLUE, { rx: 0, sw: 2.5 }) + Pg([[160, 190], [260, 190], [160, 115]], PAPER) +
    R(160, 176, 14, 14, "none", { rx: 0, sw: 2 }) + T(122, 153, "9", { fs: 22, fw: 700 }) + T(210, 242, "16", { fs: 22, fw: 700 }) + T(248, 102, "25", { fs: 22, fw: 700 }) +
    T(150, 153, "3", { fs: 15 }) + T(210, 180, "4", { fs: 15 }) + T(218, 145, "5", { fs: 15 }) + T(450, 130, "3² + 4² = 5²", { fs: 22, fw: 700 }) + T(450, 165, "9 + 16 = 25", { fs: 19 }),
    "In a right triangle, the squares on the two short sides add up to the square on the long side.") };

  M.polygons = () => svg(640, 260,
    Pg([[160, 30], [270, 110], [228, 235], [92, 235], [50, 110]], PAPER) + L(160, 30, 228, 235, { c: PUR }) + L(160, 30, 92, 235, { c: PUR }) +
    `<polygon points="160,30 270,110 228,235" fill="${PINK}" fill-opacity=".35"/><polygon points="160,30 228,235 92,235" fill="${YEL}" fill-opacity=".5"/><polygon points="160,30 92,235 50,110" fill="${BLUE}" fill-opacity=".35"/>` +
    T(195, 130, "1", { fs: 22, fw: 700 }) + T(160, 185, "2", { fs: 22, fw: 700 }) + T(110, 130, "3", { fs: 22, fw: 700 }) +
    T(460, 80, "5 sides → 3 triangles", { fs: 20, fw: 700 }) + T(460, 120, "3 × 180° = 540°", { fs: 20 }) + T(460, 170, "n sides → (n − 2) triangles", { fs: 17 }) + T(460, 200, "→ (n − 2) × 180°", { fs: 17 }),
    "Cut any polygon into triangles from one corner, and count the triangles.");

  M.circles = () => svg(640, 260,
    Cc(150, 130, 100, PAPER) + L(150, 130, 250, 130, { c: PINK, sw: 4 }) + T(200, 116, "radius r", { fs: 15, fill: PINK }) + L(150, 30, 150, 230, { c: BLUE, sw: 4, dash: "10 6" }) + T(110, 70, "diameter", { fs: 15, fill: BLUE }) + T(110, 88, "= 2r", { fs: 15, fill: BLUE }) + Cc(150, 130, 5, INK) +
    T(150, 250, "around = circumference = 2πr", { fs: 15 }) +
    `<path d="M460 130 L560 130 A100 100 0 0 0 460 30 Z" fill="${ORA}" stroke="${INK}" stroke-width="3"/>` + Cc(460, 130, 100, "none") + T(505, 95, "90°", { fs: 16, fw: 700 }) +
    T(460, 250, "a 90° slice = 90/360 = ¼ of the area", { fs: 15 }),
    "Radius: center to edge. Diameter: all the way across. A slice is a fraction of 360°.");

  M.volumes = () => { const cube = (x, y, s, f) => { const d = s * 0.5; return Pg([[x, y], [x + s, y], [x + s + d, y - d], [x + d, y - d]], f, { sw: 1.5 }) + Pg([[x + s, y], [x + s + d, y - d], [x + s + d, y - d + s], [x + s, y + s]], f, { sw: 1.5, op: 0.75 }) + R(x, y, s, s, f, { rx: 0, sw: 1.5 }); };
    let b = ""; const s = 28; for (let z = 3; z >= 0; z--) for (let r = 1; r >= 0; r--) for (let c = 0; c < 3; c++) b += cube(60 + c * s + r * s * 0.5, 70 + (3 - z) * s - r * s * 0.5 + 0, s, [LIME, BLUE, PINK, YEL][z]);
    return svg(640, 260, b + T(165, 245, "3 × 2 = 6 per layer × 4 layers = 24", { fs: 15 }) + L(320, 20, 320, 240, { c: "#0002", sw: 2 }) +
      `<ellipse cx="420" cy="80" rx="40" ry="12" fill="${BLUE}" stroke="${INK}" stroke-width="2.5"/>` + Pg([[380, 80], [460, 80], [420, 200]], BLUE, { op: 0.6 }) +
      R(500, 80, 90, 120, PINK, { rx: 0, op: 1 }).replace(`fill="${PINK}"`, `fill="${PINK}" fill-opacity=".45"`) + `<ellipse cx="545" cy="80" rx="45" ry="13" fill="${PINK}" stroke="${INK}" stroke-width="2.5"/><ellipse cx="545" cy="200" rx="45" ry="13" fill="none" stroke="${INK}" stroke-width="2.5"/>` +
      T(500, 235, "3 cones of water fill 1 can", { fs: 15 }) + T(472, 140, "×3", { fs: 22, fw: 700, fill: PUR }),
      "Volume = how many cubes fit: one layer × the number of layers. A cone holds ⅓ of the matching can."); };
  MV.volumes = { 3: () => { const sq = (x, y, n, s) => { let o = ""; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) o += R(x + i * s, y + j * s, s, s, YEL, { rx: 1, sw: 1.5 }); return o; };
    return svg(520, 200, sq(60, 80, 1, 40) + T(80, 150, "1 × 1 × 1", { fs: 14 }) + T(80, 172, "= 1", { fs: 16, fw: 700 }) + T(170, 100, "double →", { fs: 16 }) + sq(240, 40, 2, 40) + T(280, 150, "2 × 2 × 2", { fs: 14 }) + T(280, 172, "= 8", { fs: 16, fw: 700 }) +
      T(430, 100, "edges × 2", { fs: 16 }) + T(430, 126, "volume × 8", { fs: 18, fw: 700, fill: RED }), "Make every edge 2 times longer and the volume grows 2 × 2 × 2 = 8 times."); } };

  M.stats = () => { const h = [70, 95, 110, 130, 150], cols = [BLUE, PINK, LIME, YEL, PUR]; let s = "";
    h.forEach((v, i) => { s += R(40 + i * 52, 210 - v, 38, v, cols[i], { rx: 8 }) + T(59 + i * 52, 225, ["1st", "2nd", "3rd", "4th", "5th"][i], { fs: 12 }); }); s += T(163, 70, "⬇ median", { fs: 15, fw: 700, fill: GRN });
    const piles = [2, 6, 4]; let m = ""; piles.forEach((n, i) => { for (let k = 0; k < n; k++) m += R(360 + i * 40, 190 - k * 20, 30, 18, ORA, { rx: 4, sw: 2 }); });
    for (let i = 0; i < 3; i++) for (let k = 0; k < 4; k++) m += R(500 + i * 40, 190 - k * 20, 30, 18, GRN, { rx: 4, sw: 2 });
    return svg(640, 250, T(165, 26, "Line up by height: the middle kid", { fs: 15 }) + s + L(320, 20, 320, 235, { c: "#0002", sw: 2 }) + T(480, 26, "Mean = share fairly", { fs: 15 }) + m + T(474, 120, "→", { fs: 26, fw: 700 }) + T(400, 230, "2, 6, 4", { fs: 14 }) + T(540, 230, "4, 4, 4 → mean 4", { fs: 14 }),
      "Median: sort, then take the middle. Mean: pour everything together and share it equally."); };

  M.counting = () => { let s = Cc(60, 130, 18, "#fff") + T(60, 131, "★", { fs: 16 }); const shirts = [[RED, "red"], [BLUE, "blue"], [GRN, "green"]];
    shirts.forEach(([c, n], i) => { const y = 50 + i * 80; s += L(78, 130, 190, y) + R(190, y - 16, 70, 32, c, { rx: 8 }) + T(225, y, n, { fs: 13, fill: "#fff", fw: 700 });
      ["jeans", "shorts"].forEach((p, j) => { const y2 = y - 18 + j * 36; s += L(260, y, 340, y2) + R(340, y2 - 13, 76, 26, j ? YEL : "#bcd", { rx: 6, sw: 2 }) + T(378, y2, p, { fs: 13 }) + T(470, y2, `outfit ${i * 2 + j + 1}`, { fs: 13, a: "start" }); }); });
    return svg(640, 300, s + R(110, 262, 420, 30, YEL, { rx: 10 }) + T(320, 277, "3 shirts × 2 pants = 6 outfits", { fs: 15, fw: 700 }),
      "A tree diagram: every first choice branches into every second choice. That's why you multiply."); };
  MV.counting = { 2: () => svg(520, 200, R(30, 40, 200, 120, PAPER, { rx: 14 }) + T(130, 64, "In order (5 × 4 = 20)", { fs: 14 }) + T(85, 100, "Ann–Bo", { fs: 16 }) + T(175, 100, "Bo–Ann", { fs: 16 }) + T(130, 135, "2 orders, same pair", { fs: 13, fill: RED }) +
    T(270, 100, "÷ 2 →", { fs: 20, fw: 700 }) + R(320, 60, 170, 80, LIME, { rx: 14 }) + T(405, 90, "Ann & Bo", { fs: 17, fw: 700 }) + T(405, 118, "20 ÷ 2 = 10 pairs", { fs: 14 }),
    "When order doesn't matter, every group got counted once per order. Divide those out.") };

  M.probability = () => { let s = ""; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) { const hit = a + b === 7; s += R(80 + (b - 1) * 34, 30 + (a - 1) * 34, 32, 32, hit ? LIME : "#fff", { rx: 4, sw: 1.5 }) + T(96 + (b - 1) * 34, 47 + (a - 1) * 34, a + b, { fs: 13, fw: hit ? 700 : 500 }); }
    for (let i = 1; i <= 6; i++) s += T(96 + (i - 1) * 34, 18, i, { fs: 13, fill: PUR }) + T(66, 47 + (i - 1) * 34, i, { fs: 13, fill: PUR });
    let bag = `<path d="M440 90 q-50 0 -60 70 q-8 70 70 70 h40 q78 0 70 -70 q-10 -70 -60 -70 z" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>`;
    [[440, 160, RED], [480, 150, RED], [460, 195, RED], [500, 195, BLUE], [420, 200, BLUE]].forEach(([x, y, c]) => bag += Cc(x, y, 15, c, { sw: 2 }));
    return svg(640, 275, s + T(185, 258, "6 × 6 = 36 rolls; 6 make 7 → 6/36 = 1/6", { fs: 14 }) + bag + T(470, 60, "3 red, 2 blue", { fs: 16 }) + T(470, 258, "P(red) = 3/5", { fs: 17, fw: 700 }),
      "Probability = good outcomes ÷ all outcomes. With two dice, use the 6 × 6 table."); };


  MV.polygons = { 1: () => svg(520, 230, Pg([[120, 60], [260, 60], [300, 170], [80, 170]], PAPER) +
    L(260, 60, 330, 60, { dash: "6 5", c: PUR }) + L(300, 170, 330, 255 - 85, { dash: "6 5", c: PUR }) + L(300, 170, 340, 170 + 0, { dash: "6 5", c: PUR }) +
    `<path d="M300 60 A40 40 0 0 1 280 95" fill="none" stroke="${ORA}" stroke-width="5"/>` + T(318, 88, "turn", { fs: 13, fill: ORA }) +
    T(430, 90, "walk around:", { fs: 16 }) + T(430, 118, "all the turns", { fs: 16 }) + T(430, 146, "= 1 full spin = 360°", { fs: 16, fw: 700, fill: PUR }),
    "Walk around any shape: at each corner you turn a little. All the turns together make one full spin, 360°.") };
  MV.circles = { 3: () => svg(520, 220, Cc(130, 110, 90, PINK, { op: 0.5 }) + Cc(130, 110, 50, "#fff") + T(130, 110, "hole", { fs: 14 }) +
    T(270, 110, "=", { fs: 30, fw: 700 }) + Cc(360, 110, 60, PINK, { op: 0.5 }) + T(360, 110, "big", { fs: 14 }) + T(440, 110, "−", { fs: 30, fw: 700 }) + Cc(485, 110, 30, "#fff") + T(485, 110, "small", { fs: 11 }),
    "A ring is the big circle minus the small circle in the middle.") };
  MV.ratios = { 2: () => svg(560, 200, R(40, 60, 240, 40, BLUE, { rx: 6 }) + T(160, 80, "walk 3 mph · 2 hours = 6 mi", { fs: 14 }) + R(280, 60, 120, 40, PINK, { rx: 6 }) + T(340, 80, "run 6 mph · 1 h = 6 mi", { fs: 12 }) +
    T(220, 130, "12 miles ÷ 3 hours = 4 mph", { fs: 18, fw: 700 }) + T(220, 162, "(not (3 + 6) ÷ 2 = 4.5: you walked for longer!)", { fs: 14, fill: RED }),
    "The bar shows TIME. More time at the slow speed pulls the average toward it.") };
  MV.probability = { 3: () => { const out = ["HHH", "HHT", "HTH", "HTT", "THH", "THT", "TTH", "TTT"]; let s = ""; out.forEach((o, i) => { s += R(30 + i * 60, 70, 52, 40, o === "TTT" ? "#ffd0d0" : LIME, { rx: 8, sw: 2 }) + T(56 + i * 60, 90, o, { fs: 14, fw: 700 }); });
    return svg(520, 190, s + T(260, 40, "3 coins: 8 outcomes", { fs: 16 }) + T(260, 145, "7 have at least one H → 1 − 1/8 = 7/8", { fs: 17, fw: 700 }), "Only one outcome (TTT) has no heads. So P(at least one) = 1 − P(none)."); } };
  window.AMC_VIS = { main: M, moves: MV };
})();
