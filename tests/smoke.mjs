// Smoke test: serve the site locally, open the hub and every learning app in headless Chrome,
// and fail if any page throws a JavaScript error. Run: node tests/smoke.mjs
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".wasm": "application/wasm", ".aff": "text/plain", ".dic": "text/plain", ".txt": "text/plain" };

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/__frame") { // apps only run inside the hub's frame, so test them the same way
    res.writeHead(200, { "content-type": "text/html" });
    return res.end(`<!doctype html><script>window.fhAward=()=>{};window.fhFlushTime=null;</script>
      <iframe id="f" src="${url.searchParams.get("src").replace(/[<>"]/g, "")}" style="width:1200px;height:900px;border:0"></iframe>`);
  }
  let p = path.join(ROOT, decodeURIComponent(url.pathname));
  if (!p.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, "index.html");
  if (!fs.existsSync(p)) { res.writeHead(404); return res.end("not found"); }
  res.writeHead(200, { "content-type": TYPES[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;

// which boy each app is opened as (matches how the hub opens them)
const KID = { space: "jonah", brain: "jonah", chinese: "jonah", fencing: "ellis", robot: "ellis" };
const pages = ["index.html"];
for (const d of fs.readdirSync(ROOT)) {
  if (fs.existsSync(path.join(ROOT, d, "index.html")) && !d.startsWith(".") && d !== "node_modules" && d !== "tests")
    pages.push(`__frame?src=${encodeURIComponent(`/${d}/index.html${d === "abby" ? "" : `?k=${KID[d] || "eric"}`}`)}`);
}

// Offline mode (no internet, e.g. a sandbox): CDN scripts are stubbed so only our own code is tested.
const OFFLINE = process.env.SMOKE_OFFLINE === "1";
const IGNORE = [/Failed to fetch/i, /NetworkError/i, /ERR_(INTERNET|NAME|CONNECTION|PROXY|TUNNEL)/i, /Load failed/i, /AudioContext/i, /speechSynthesis/i];

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ["--autoplay-policy=no-user-gesture-required"] });
let failed = 0;
for (const p of pages) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  if (OFFLINE) await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => {
    const u = route.request().url();
    if (u.includes("supabase-js")) return route.fulfill({ contentType: "text/javascript", body:
      "const q=()=>{const o=new Proxy(function(){},{get:(t,k)=>k==='then'?(r=>r({data:null,error:null})):o,apply:()=>o});return o};" +
      "export const createClient=()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signOut:async()=>({})},from:q,rpc:q,functions:{invoke:async()=>({data:null,error:null})}});" });
    return route.fulfill({ contentType: "text/javascript", body: "" });
  });
  const errors = [];
  await page.exposeBinding("__smokeErr", (_src, msg) => { if (!IGNORE.some(r => r.test(msg))) errors.push(msg); });
  await page.addInitScript(() => { addEventListener("error", e => { try { (window.top.__smokeErr || window.__smokeErr)(String(e.message || e.error)); } catch (x) {} });
    addEventListener("unhandledrejection", e => { try { (window.top.__smokeErr || window.__smokeErr)("unhandled: " + String(e.reason && e.reason.message || e.reason)); } catch (x) {} }); });
  page.on("pageerror", e => { if (!IGNORE.some(r => r.test(e.message))) errors.push(e.message); });
  try {
    const resp = await page.goto(`${base}/${p}`, { waitUntil: "load", timeout: 30000 });
    if (!resp || resp.status() >= 400) errors.push(`HTTP ${resp && resp.status()}`);
    await page.waitForTimeout(2500);
  } catch (e) { errors.push(String(e.message || e).split("\n")[0]); }
  const name = decodeURIComponent(p.replace("__frame?src=", ""));
  if (errors.length) { failed++; console.log(`✗ ${name}\n    ${[...new Set(errors)].slice(0, 5).join("\n    ")}`); }
  else console.log(`✓ ${name}`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(failed ? `\n${failed} of ${pages.length} pages threw errors` : `\nAll ${pages.length} pages loaded without errors`);
process.exit(failed ? 1 : 0);
