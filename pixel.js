// Original pixel-art avatars, 32x32, drawn from simple shapes with shading + outline. No external art.
// Spec string: "px:s#-h#-c#-o#-k#-x#" (person) or "px:a#-x#" (pixel pet, a>=1).
export const PX = {
  skin: ["#ffdcb5", "#f3c58f", "#e0a96d", "#c4844c", "#8d5524"],
  hairC: ["#2b2b2b", "#6b3e26", "#e0b04a", "#e04b2a", "#7a5cff", "#3dd6a0", "#ff7ac8", "#f2f2f2"],
  outC: ["#c4f53a", "#ff5ccb", "#ff6a1f", "#6f4cff", "#5cc8ff", "#e23b3b", "#3a3a3a", "#ffd23f"],
  hair: ["short", "spiky", "long", "buns", "mohawk", "cap", "curly", "ponytail"],
  outfit: ["tee", "hoodie", "armor", "gi", "jersey", "hero"],
  extra: ["none", "headband", "glasses", "crown", "mask", "cape", "headphones", "wizard"],
  animals: ["fox", "panda", "lion", "cat", "bunny", "bear", "frog", "penguin", "owl", "dino", "unicorn", "puppy"],
  petExtra: ["none", "crown", "bow", "glasses", "party"],
};
const N = 32, LINE = "#1d1b2b";
function shade(hex, f) { const n = parseInt(hex.slice(1), 16); const c = v => Math.max(0, Math.min(255, Math.round(v * f))); return "#" + [n >> 16, (n >> 8) & 255, n & 255].map(v => c(v).toString(16).padStart(2, "0")).join(""); }

function canvas() {
  const g = Array.from({ length: N }, () => Array(N).fill(null));
  const ok = (x, y) => x >= 0 && y >= 0 && x < N && y < N;
  const set = (x, y, c) => { if (ok(x, y)) g[y][x] = c; };
  const rect = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c); };
  // filled ellipse; optional shade colour for the lower-right crescent; optional clip {minY,maxY,onlyFilled}
  const ell = (cx, cy, rx, ry, c, sh, clip = {}) => {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry;
      if (dx * dx + dy * dy > 1) continue;
      if (clip.maxY != null && y > clip.maxY) continue;
      if (clip.minY != null && y < clip.minY) continue;
      if (clip.onlyFilled && !g[y][x]) continue;
      set(x, y, sh && dx * .6 + dy > .55 ? sh : c);
    }
  };
  const tri = (cx, top, h, c, dir = 0) => { for (let i = 0; i < h; i++) for (let x = -i; x <= i; x++) set(cx + x + Math.round(dir * (h - i) / 2), top + i, c); };
  const outline = () => {
    const add = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!g[y][x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => ok(x + a, y + b) && g[y + b][x + a] && g[y + b][x + a] !== LINE)) add.push([x, y]);
    add.forEach(([x, y]) => (g[y][x] = LINE));
  };
  const toSvg = size => {
    let r = "";
    g.forEach((row, y) => { let x = 0; while (x < N) { const c = row[x]; if (!c) { x++; continue; } let w = 1; while (x + w < N && row[x + w] === c) w++; r += `<rect x="${x}" y="${y}" width="${w + .02}" height="1.02" fill="${c}"/>`; x += w; } });
    return `<svg viewBox="0 0 ${N} ${N}" width="${size}" height="${size}" shape-rendering="crispEdges" role="img" aria-label="avatar">${r}</svg>`;
  };
  return { g, set, rect, ell, tri, outline, toSvg };
}
const eye = (C, x, y, big = false) => { C.rect(x, y, x + 1, y + (big ? 2 : 1), "#141414"); C.set(x, y, "#ffffff"); };

// ---------- people ----------
function person(sp) {
  const C = canvas(), P = PX;
  const skin = P.skin[sp.s % P.skin.length], skinD = shade(skin, .82);
  const H = P.hairC[sp.c % P.hairC.length], Hd = shade(H, .72), Hl = shade(H, 1.35);
  const O = P.outC[sp.o % P.outC.length], D = shade(O, .7);
  const hair = P.hair[sp.h % P.hair.length], outfit = P.outfit[sp.k % P.outfit.length], extra = P.extra[sp.x % P.extra.length];
  const pants = outfit === "gi" ? O : "#34405e", shoe = "#202020";

  // back layer
  if (extra === "cape") { C.rect(7, 19, 24, 30, "#e23b3b"); C.rect(19, 19, 24, 30, "#b82a2a"); }
  if (hair === "buns") { C.ell(8.5, 5.5, 3.2, 3.2, H, Hd); C.ell(23.5, 5.5, 3.2, 3.2, H, Hd); }
  if (hair === "ponytail") { C.ell(25.5, 15, 3, 5.5, H, Hd); }
  if (hair === "long") { C.rect(7, 9, 24, 22, H); C.rect(21, 9, 24, 22, Hd); }

  // legs + shoes
  C.rect(11, 27, 14, 29, pants); C.rect(17, 27, 20, 29, shade(pants, .85));
  C.rect(10, 30, 14, 30, shoe); C.rect(17, 30, 21, 30, shoe);
  // torso + arms
  C.rect(10, 19, 21, 19, O); C.rect(9, 20, 22, 26, O); C.rect(19, 20, 22, 26, D);
  const sleeve = ["tee", "jersey"].includes(outfit) ? 22 : 25;
  C.rect(6, 20, 8, sleeve, O); C.rect(23, 20, 25, sleeve, D);
  if (sleeve < 25) { C.rect(6, sleeve + 1, 8, 25, skin); C.rect(23, sleeve + 1, 25, 25, skinD); }
  C.rect(6, 26, 8, 27, skin); C.rect(23, 26, 25, 27, skinD);
  C.rect(14, 17, 17, 18, skinD);
  if (outfit === "tee") { C.rect(13, 19, 18, 19, skinD); }
  if (outfit === "hoodie") { C.rect(11, 18, 20, 19, D); C.rect(12, 24, 19, 25, D); C.set(14, 21, "#fff"); C.set(17, 21, "#fff"); C.set(14, 22, "#fff"); C.set(17, 22, "#fff"); }
  if (outfit === "armor") { C.ell(7.5, 20.5, 3, 2.5, "#c9ccd6", "#8f93a3"); C.ell(24.5, 20.5, 3, 2.5, "#c9ccd6", "#8f93a3"); C.rect(9, 22, 22, 22, D); C.rect(15, 20, 16, 26, D); C.rect(9, 25, 22, 25, "#ffd23f"); }
  if (outfit === "gi") { for (let i = 0; i < 3; i++) C.rect(14 - i + 1, 19 + i, 17 + i - 1, 19 + i, skin); C.rect(9, 24, 22, 24, "#141414"); C.rect(18, 25, 19, 26, "#141414"); }
  if (outfit === "jersey") { C.rect(9, 23, 22, 23, "#ffffff"); C.rect(6, 22, 8, 22, "#ffffff"); C.rect(23, 22, 25, 22, "#ffffff"); C.rect(15, 20, 16, 22, "#ffffff"); C.rect(14, 20, 14, 20, "#ffffff"); C.rect(14, 24, 17, 25, "#ffffff"); }
  if (outfit === "hero") { C.rect(9, 25, 22, 25, "#ffd23f"); C.set(15, 21, "#ffd23f"); C.set(16, 21, "#ffd23f"); C.rect(14, 22, 17, 22, "#ffd23f"); C.set(15, 23, "#ffd23f"); C.set(16, 23, "#ffd23f"); }

  // head
  C.rect(7, 10, 8, 13, skin); C.rect(23, 10, 24, 13, skinD);
  C.ell(16, 11, 7.6, 7.2, skin, skinD);
  eye(C, 11, 11); eye(C, 19, 11);
  C.rect(9, 14, 10, 14, "#ff9aa8"); C.rect(21, 14, 22, 14, "#ff9aa8");
  C.set(13, 14, "#7a3b2e"); C.set(18, 14, "#7a3b2e"); C.rect(14, 15, 17, 15, "#7a3b2e");

  // front hair
  const cap = (maxY) => C.ell(16, 10.5, 8.4, 7, H, Hd, { maxY });
  if (["short", "spiky", "long", "buns", "ponytail"].includes(hair)) {
    cap(8); C.rect(8, 9, 9, 12, H); C.rect(22, 9, 23, 12, Hd);
    C.rect(10, 9, 13, 9, H); C.rect(17, 9, 21, 9, H); C.rect(11, 5, 14, 5, Hl);
  }
  if (hair === "spiky") { [9, 13, 17, 21].forEach((x, i) => C.tri(x + 1, 1 + (i % 2), 4, i < 2 ? H : Hd)); C.rect(11, 5, 14, 5, Hl); }
  if (hair === "mohawk") { C.rect(14, 1, 17, 8, H); C.rect(16, 1, 17, 8, Hd); C.rect(14, 2, 14, 6, Hl); }
  if (hair === "curly") {
    [[9.5, 6.5], [13.5, 4.5], [18.5, 4.5], [22.5, 6.5], [8, 10], [24, 10], [16, 4]].forEach(([x, y]) => C.ell(x, y, 3.2, 3.2, H, Hd, { maxY: 10 }));
    C.rect(10, 9, 21, 9, H); C.set(12, 4, Hl); C.set(18, 3, Hl);
  }
  if (hair === "cap") {
    C.rect(8, 9, 9, 12, H); C.rect(22, 9, 23, 12, Hd);
    C.ell(16, 9, 8.4, 6.2, O, D, { maxY: 8 }); C.rect(15, 8, 27, 9, D); C.set(15, 5, "#fff"); C.set(16, 5, "#fff");
  }

  // extras
  if (extra === "headband") { for (let x = 7; x <= 24; x++) for (let y = 7; y <= 8; y++) if (C.g[y][x]) C.set(x, y, y === 7 ? "#ff4d4d" : "#d42f2f"); C.rect(24, 8, 26, 10, "#ff4d4d"); }
  if (extra === "glasses") { for (const ex of [10, 18]) { C.rect(ex - 1, 10, ex + 3, 10, "#141414"); C.rect(ex - 1, 13, ex + 3, 13, "#141414"); C.rect(ex - 1, 10, ex - 1, 13, "#141414"); C.rect(ex + 3, 10, ex + 3, 13, "#141414"); } C.rect(14, 11, 17, 11, "#141414"); }
  if (extra === "crown") { C.rect(10, 3, 21, 5, "#ffd23f"); [10, 13, 18, 21].forEach(x => C.rect(x, 1, x, 2, "#ffd23f")); C.rect(15, 0, 16, 2, "#ffd23f"); C.rect(15, 4, 16, 4, "#e23b3b"); C.set(12, 4, "#5cc8ff"); C.set(19, 4, "#5cc8ff"); C.rect(17, 5, 21, 5, "#d9a800"); }
  if (extra === "mask") { for (let x = 7; x <= 24; x++) for (let y = 9; y <= 13; y++) if (C.g[y][x]) C.set(x, y, "#2a2a3a"); C.rect(24, 10, 27, 11, "#2a2a3a"); C.rect(10, 11, 13, 12, "#fff"); C.rect(18, 11, 21, 12, "#fff"); C.rect(12, 11, 12, 12, "#141414"); C.rect(20, 11, 20, 12, "#141414"); }
  if (extra === "headphones") {
    for (let y = 0; y < 12; y++) for (let x = 0; x < N; x++) { const a = ((x + .5 - 16) / 9.4) ** 2 + ((y + .5 - 11) / 8.6) ** 2, b = ((x + .5 - 16) / 8.2) ** 2 + ((y + .5 - 11) / 7.5) ** 2; if (a <= 1 && b > 1) C.set(x, y, "#3a3a3a"); }
    C.rect(5, 9, 8, 14, O); C.rect(23, 9, 26, 14, D); C.rect(5, 9, 5, 14, D);
  }
  if (extra === "wizard") { for (let i = 0; i < 7; i++) C.rect(16 - i - 1 + 1, i, 16 + i, i, i < 3 ? "#6f4cff" : "#5a3ad9"); C.rect(6, 7, 25, 8, "#4a2fc0"); C.set(15, 3, "#ffd23f"); C.rect(14, 4, 16, 4, "#ffd23f"); C.set(15, 5, "#ffd23f"); }
  C.outline();
  return C;
}

// ---------- pixel pets ----------
function pet(sp) {
  const C = canvas(), name = PX.animals[(sp.a - 1) % PX.animals.length], x = PX.petExtra[sp.x % PX.petExtra.length];
  const W = "#ffffff", K = "#141414", PINK = "#ff9aa8";
  const base = (fur, belly, opts = {}) => {
    const fd = shade(fur, .8);
    C.ell(16, 25.5, 7.5, 5.5, fur, fd);
    if (belly) C.ell(16, 26, 4.2, 3.8, belly);
    C.rect(10, 30, 13, 30, opts.feet || fd); C.rect(19, 30, 22, 30, opts.feet || fd);
    C.ell(16, 14, opts.hw || 10.5, opts.hh || 8.8, fur, fd);
  };
  const face = (y = 14, muzzle, noseC = K) => {
    if (muzzle) C.ell(16, y + 4, 4.6, 3.2, muzzle);
    eye(C, 11, y - 1, true); eye(C, 19, y - 1, true);
    C.rect(8, y + 2, 9, y + 2, PINK); C.rect(22, y + 2, 23, y + 2, PINK);
    C.rect(15, y + 2, 16, y + 2, noseC); C.set(14, y + 4, "#6b2d2d"); C.set(17, y + 4, "#6b2d2d"); C.rect(15, y + 5, 16, y + 5, "#6b2d2d");
  };
  const ears = (c, inner, h = 5, spread = 0) => { C.tri(9 - spread, 2, h, c); C.tri(23 + spread, 2, h, c); if (inner) { C.tri(9 - spread, 4, h - 2, inner); C.tri(23 + spread, 4, h - 2, inner); } };
  const roundEars = (c, inner, r = 3.4, y = 6.5) => { C.ell(8.5, y, r, r, c, shade(c, .8)); C.ell(23.5, y, r, r, c, shade(c, .8)); if (inner) { C.ell(8.5, y + .5, r - 1.6, r - 1.6, inner); C.ell(23.5, y + .5, r - 1.6, r - 1.6, inner); } };

  switch (name) {
    case "fox": C.ell(26, 24, 4.5, 3.5, "#f08a24", "#c96c14"); C.ell(29, 23, 2, 2, W); ears("#f08a24", "#3a2418", 6, 1); base("#f08a24", W); C.ell(10, 18, 4, 3.5, W, null, { onlyFilled: true }); C.ell(22, 18, 4, 3.5, W, null, { onlyFilled: true }); face(14); break;
    case "panda": roundEars(K); base("#f7f7f7", null, { feet: K }); C.rect(8, 22, 10, 28, K); C.rect(22, 22, 24, 28, K); C.ell(12, 13.5, 3.2, 3.6, K); C.ell(20, 13.5, 3.2, 3.6, K); C.rect(11, 13, 12, 14, W); C.set(12, 14, K); C.rect(19, 13, 20, 14, W); C.set(20, 14, K); C.rect(15, 16, 16, 16, K); C.set(14, 18, "#6b2d2d"); C.set(17, 18, "#6b2d2d"); C.rect(15, 19, 16, 19, "#6b2d2d"); C.rect(7, 17, 8, 17, PINK); C.rect(23, 17, 24, 17, PINK); break;
    case "lion": C.ell(16, 14, 14, 12.5, "#c4621c", "#9c4a12"); [[4, 8], [27, 8], [4, 19], [27, 19], [16, 2]].forEach(([a, b]) => C.ell(a, b, 3, 3, "#c4621c")); roundEars("#f4c04e", "#e0973a", 2.6, 6); base("#f4c04e", "#ffe7a8", { hw: 9.5, hh: 8.4 }); C.ell(30, 26, 1.8, 1.8, "#c4621c"); C.rect(24, 27, 29, 27, "#f4c04e"); face(14, "#ffe7a8"); break;
    case "cat": ears("#9aa0b4", PINK, 6, 0); C.rect(23, 20, 25, 28, "#9aa0b4"); C.rect(25, 18, 26, 22, "#9aa0b4"); base("#9aa0b4", "#e8e8f0"); C.rect(15, 6, 16, 8, "#6f7488"); C.rect(12, 7, 12, 8, "#6f7488"); C.rect(19, 7, 19, 8, "#6f7488"); face(14, "#e8e8f0", PINK); C.rect(4, 16, 8, 16, "#6f7488"); C.rect(4, 18, 8, 18, "#6f7488"); C.rect(23, 16, 27, 16, "#6f7488"); C.rect(23, 18, 27, 18, "#6f7488"); break;
    case "bunny": C.rect(9, 0, 12, 8, W); C.rect(10, 1, 11, 7, PINK); C.rect(19, 0, 22, 8, "#e9e9ee"); C.rect(20, 1, 21, 7, PINK); base(W, "#fff0f3"); C.ell(26, 27, 2.4, 2.4, W); face(14, null, PINK); C.rect(15, 19, 16, 20, W); break;
    case "bear": roundEars("#9a6236", "#d9a77a"); base("#9a6236", "#d9a77a"); face(14, "#d9a77a"); break;
    case "frog": base("#6cc24a", "#d8f2a6", { hw: 11.5, hh: 7.6 }); C.ell(10.5, 7.5, 4, 4, "#6cc24a", "#4d9a32"); C.ell(21.5, 7.5, 4, 4, "#6cc24a", "#4d9a32"); C.ell(10.5, 7.5, 2.6, 2.6, W); C.ell(21.5, 7.5, 2.6, 2.6, W); C.rect(10, 7, 11, 8, K); C.rect(21, 7, 22, 8, K); C.rect(10, 17, 21, 17, "#2f6b1e"); C.set(9, 16, "#2f6b1e"); C.set(22, 16, "#2f6b1e"); C.rect(7, 14, 8, 14, PINK); C.rect(23, 14, 24, 14, PINK); C.set(14, 13, "#2f6b1e"); C.set(17, 13, "#2f6b1e"); break;
    case "penguin": C.ell(7.5, 24, 2.5, 5, "#24263a"); C.ell(24.5, 24, 2.5, 5, "#24263a"); base("#24263a", W, { feet: "#ff9f1c" }); C.ell(16, 16, 7.5, 6.5, W); eye(C, 12, 14, true); eye(C, 19, 14, true); C.rect(14, 17, 17, 17, "#ff9f1c"); C.rect(15, 18, 16, 18, "#e07d00"); C.rect(9, 18, 10, 18, PINK); C.rect(21, 18, 22, 18, PINK); break;
    case "owl": C.tri(8, 2, 5, "#8a5a3c", 1); C.tri(24, 2, 5, "#8a5a3c", -1); base("#8a5a3c", "#e8c9a0"); for (let i = 0; i < 3; i++) { C.set(14 + i * 2, 25 + (i % 2), "#c9a072"); } C.ell(11.5, 13, 4, 4, W); C.ell(20.5, 13, 4, 4, W); C.ell(11.5, 13, 2.2, 2.2, "#ffc93c"); C.ell(20.5, 13, 2.2, 2.2, "#ffc93c"); C.rect(11, 12, 12, 13, K); C.rect(20, 12, 21, 13, K); C.set(11, 12, W); C.set(20, 12, W); C.rect(15, 16, 16, 16, "#ff9f1c"); C.rect(15, 17, 16, 17, "#e07d00"); break;
    case "dino": C.ell(26, 26, 5, 3, "#3fbf8f", "#2e9670"); C.tri(30, 23, 3, "#3fbf8f"); [10, 14, 18, 22].forEach(a => C.tri(a, 3, 3, "#ffb340")); base("#3fbf8f", "#c6f2dc"); face(14, "#c6f2dc"); C.set(14, 15, "#2e9670"); C.set(17, 15, "#2e9670"); C.set(9, 9, "#2e9670"); C.set(22, 10, "#2e9670"); C.set(12, 7, "#2e9670"); break;
    case "unicorn": ears(W, PINK, 5, 1); C.ell(16, 7.5, 9, 5.5, "#c79bff", null, { maxY: 7 }); C.rect(23, 7, 26, 16, "#7ad3ff"); C.rect(23, 10, 26, 12, "#ff9ad5"); base(W, "#fff4fb"); C.rect(15, 0, 16, 1, "#ffd23f"); C.rect(14, 2, 17, 3, "#ffd23f"); C.rect(15, 4, 16, 5, "#f2b800"); C.rect(9, 6, 15, 7, "#ff9ad5"); C.rect(17, 6, 22, 7, "#7ad3ff"); face(14, null, PINK); break;
    case "puppy": C.ell(26, 24, 3, 2, "#e0b06a"); base("#f0d2a2", "#fff6e6"); C.ell(6.5, 12, 3, 6, "#9a6236", "#7a4a26"); C.ell(25.5, 12, 3, 6, "#9a6236", "#7a4a26"); C.ell(20, 12, 3.2, 3, "#c98f4f", null, { onlyFilled: true }); face(14, "#fff6e6"); C.rect(15, 20, 16, 21, "#ff6b8a"); break;
  }
  if (x === "crown") { C.rect(11, 2, 20, 4, "#ffd23f"); [11, 14, 17, 20].forEach(a => C.set(a, 1, "#ffd23f")); C.set(15, 3, "#e23b3b"); C.set(16, 3, "#e23b3b"); }
  if (x === "bow") { C.ell(20, 5, 2.5, 2.2, "#ff5ccb"); C.ell(25, 5, 2.5, 2.2, "#ff5ccb"); C.rect(22, 4, 23, 6, "#d43c9f"); }
  if (x === "glasses") { for (const ex of [10, 18]) { C.rect(ex - 1, 11, ex + 3, 11, K); C.rect(ex - 1, 15, ex + 3, 15, K); C.rect(ex - 1, 11, ex - 1, 15, K); C.rect(ex + 3, 11, ex + 3, 15, K); } C.rect(14, 12, 17, 12, K); }
  if (x === "party") { for (let i = 0; i < 6; i++) C.rect(16 - Math.floor(i / 2), i, 16 + Math.ceil(i / 2), i, i % 2 ? "#5cc8ff" : "#ff6a1f"); C.ell(16.5, 0.5, 1.4, 1.4, "#ffd23f"); }
  C.outline();
  return C;
}

export const defaultSpec = () => ({ s: 1, h: 0, c: 0, o: 0, k: 0, x: 0, a: 0 });
export function parse(av) {
  if (!av || !av.startsWith("px:")) return null;
  const sp = defaultSpec();
  av.slice(3).split("-").forEach(p => { const key = p[0], v = parseInt(p.slice(1), 10); if (key in sp && !isNaN(v)) sp[key] = v; });
  return sp;
}
export const encode = sp => sp.a > 0 ? `px:a${sp.a}-x${sp.x}` : `px:s${sp.s}-h${sp.h}-c${sp.c}-o${sp.o}-k${sp.k}-x${sp.x}`;
export const svg = (sp, size = 96) => (sp.a > 0 ? pet(sp) : person(sp)).toSvg(size);
const rnd = n => Math.floor(Math.random() * n);
export const random = () => ({ s: rnd(PX.skin.length), h: rnd(PX.hair.length), c: rnd(PX.hairC.length), o: rnd(PX.outC.length), k: rnd(PX.outfit.length), x: rnd(PX.extra.length), a: 0 });
export const randomPet = () => ({ ...defaultSpec(), a: 1 + rnd(PX.animals.length), x: rnd(PX.petExtra.length) });
