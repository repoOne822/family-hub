// Original pixel-art avatar builder. 16x16 grid, composed from parts. No external art.
export const PX = {
  skin: ["#ffdbac", "#f1c27d", "#e0ac69", "#c68642", "#8d5524"],
  hairC: ["#2b2b2b", "#6b3e26", "#d9a441", "#e04b2a", "#7a5cff", "#3dd6a0"],
  outC: ["#c4f53a", "#ff5ccb", "#ff6a1f", "#6f4cff", "#5cc8ff", "#e23b3b", "#3a3a3a"],
  hair: ["short", "spiky", "long", "buns", "mohawk", "cap"],
  outfit: ["tee", "hoodie", "armor", "gi"],
  extra: ["none", "headband", "glasses", "crown", "mask", "cape"],
};
const HEAD = [
  "................", "................", "................",
  "....SSSSSSSS....", "...SSSSSSSSSS...", "...SSSSSSSSSS...", "...SSWESSWESS...", "...SSSSSSSSSS...", "...SSSSMMSSSS...", "....SSSSSSSS...."];
const BODY = {
  tee:    ["...OOOOOOOOOO...", "..SOOOOOOOOOOS..", "..SOOOOOOOOOOS..", "..SDDDDBBDDDDS..", "....DDD..DDD....", "....KKK..KKK...."],
  hoodie: ["...OOOOOOOOOO...", "..OOOODDDDOOOO..", "..OOOOOOOOOOOO..", "..SOODDDDDDOOS..", "....DDD..DDD....", "....KKK..KKK...."],
  armor:  ["..DDOOOOOOOODD..", ".DDDOOOOOOOODDD.", "..SOOODDDDOOOS..", "..GOOOOBBOOOOG..", "....DDD..DDD....", "....KKK..KKK...."],
  gi:     ["...OOOOSSOOOO...", "..OOOOOSSOOOOO..", "..SOOOOOOOOOOS..", "..SOOOKKKKOOOS..", "....OOO..OOO....", "....SSS..SSS...."],
};
const HAIR = {
  short:  { 1: "................", 2: "....HHHHHHHH....", 3: "...HHHHHHHHHH...", 4: "...HH......HH..." },
  spiky:  { 0: "....H..H..H.....", 1: "...HHHHHHHHHH...", 2: "..HHHHHHHHHHHH..", 3: "...HHHHHHHHHH...", 4: "...H........H..." },
  long:   { 2: "....HHHHHHHH....", 3: "...HHHHHHHHHH...", 4: "..HH........HH..", 5: "..H..........H..", 6: "..H..........H..", 7: "..H..........H..", 8: "..H..........H..", 9: "..HH........HH.." },
  buns:   { 1: "..HH........HH..", 2: "..HHHHHHHHHHHH..", 3: "...HHHHHHHHHH...", 4: "...H........H..." },
  mohawk: { 0: ".......HH.......", 1: ".......HH.......", 2: "......HHHH......", 3: "......HHHH......" },
  cap:    { 2: "....OOOOOOOO....", 3: "...OOOOOOOOOOOO.", 4: "...H........H..." },
};
const EXTRA = {
  headband: { head: { 4: "...AAAAAAAAAA..." } },
  glasses:  { head: { 6: "...SKWEKKWEKS..." } },
  crown:    { head: { 0: "....A.A..A.A....", 1: "....AAAAAAAA...." } },
  mask:     { head: { 4: "...KLKLKLKLKL...", 5: "...LKLKLKLKLK...", 6: "...KLKLKLKLKL...", 7: "...LKLKLKLKLK...", 8: "...KLKLKLKLKL..." } },
  cape:     { body: { 0: ".A............A.", 1: "AA............AA", 2: "AA............AA", 3: "AA............AA", 4: ".A............A." } },
};
export const defaultSpec = () => ({ s: 1, h: 0, c: 0, o: 0, k: 0, x: 0 });
export function parse(av) {
  const sp = defaultSpec();
  if (!av || !av.startsWith("px:")) return null;
  av.slice(3).split("-").forEach(p => { const key = p[0], v = parseInt(p.slice(1), 10); if (key in sp && !isNaN(v)) sp[key] = v; });
  return sp;
}
export const encode = sp => `px:s${sp.s}-h${sp.h}-c${sp.c}-o${sp.o}-k${sp.k}-x${sp.x}`;
function shade(hex, f) { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; r = Math.round(r * f); g = Math.round(g * f); b = Math.round(b * f); return `rgb(${Math.min(255, r)},${Math.min(255, g)},${Math.min(255, b)})`; }
export function svg(sp, size = 96) {
  const P = PX, skin = P.skin[sp.s % P.skin.length], hairC = P.hairC[sp.c % P.hairC.length], out = P.outC[sp.o % P.outC.length];
  const hair = P.hair[sp.h % P.hair.length], outfit = P.outfit[sp.k % P.outfit.length], extra = P.extra[sp.x % P.extra.length];
  const grid = [...HEAD.map(r => r.split("")), ...BODY[outfit].map(r => r.split(""))];
  const over = (rows, off = 0) => Object.entries(rows).forEach(([r, line]) => line.split("").forEach((ch, c) => { if (ch !== ".") grid[+r + off][c] = ch; }));
  const ex = EXTRA[extra];
  if (ex?.body) Object.entries(ex.body).forEach(([r, line]) => line.split("").forEach((ch, c) => { if (ch !== "." && grid[+r + 10][c] === ".") grid[+r + 10][c] = ch; }));
  over(HAIR[hair]);
  if (ex?.head) over(ex.head);
  const col = { S: skin, H: hairC, O: out, D: shade(out, .7), B: "#1a1a1a", K: "#141414", G: "#2a2a2a", E: "#141414", W: "#ffffff", M: shade(skin, .75), A: extra === "headband" ? "#ff4d4d" : extra === "cape" ? "#e23b3b" : "#ffd23f", L: "#bdbdbd" };
  let rects = "";
  grid.forEach((row, y) => row.forEach((ch, x) => { if (ch !== "." && col[ch]) rects += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${col[ch]}"/>`; }));
  return `<svg viewBox="0 0 16 16" width="${size}" height="${size}" shape-rendering="crispEdges" role="img" aria-label="avatar">${rects}</svg>`;
}
export const random = () => ({ s: Math.floor(Math.random() * 5), h: Math.floor(Math.random() * 6), c: Math.floor(Math.random() * 6), o: Math.floor(Math.random() * 7), k: Math.floor(Math.random() * 4), x: Math.floor(Math.random() * 6) });
