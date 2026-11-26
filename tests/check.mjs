// Static checks: every JS file parses, every inline <script> in every page parses, and no secret keys are committed.
// Run: node tests/check.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import vm from "node:vm";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SKIP_DIRS = new Set(["node_modules", ".git"]);
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
  if (SKIP_DIRS.has(e.name)) continue; const p = path.join(d, e.name);
  if (e.isDirectory()) walk(p); else files.push(p);
} })(ROOT);
const rel = p => path.relative(ROOT, p);
let bad = 0;
const fail = (f, msg) => { bad++; console.log(`✗ ${rel(f)}: ${msg}`); };

// 1) JavaScript files parse (Node detects module syntax on its own). Edge functions (TypeScript) are skipped.
for (const f of files.filter(f => /\.(m?js)$/.test(f) && !f.includes(`${path.sep}supabase${path.sep}`))) {
  try { execFileSync(process.execPath, ["--check", f], { stdio: "pipe" }); }
  catch (e) { fail(f, String(e.stderr || e.message).split("\n").find(l => /Error/.test(l)) || "syntax error"); }
}

// 2) Inline scripts in HTML pages parse.
for (const f of files.filter(f => f.endsWith(".html"))) {
  const html = fs.readFileSync(f, "utf8");
  const re = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi; let m, i = 0;
  while ((m = re.exec(html))) {
    const attrs = m[1] || "", code = m[2]; i++;
    if (/\ssrc=/.test(attrs) || !code.trim() || /type=["'](?!module|text\/javascript)/.test(attrs)) continue;
    try {
      if (/type=["']module/.test(attrs)) continue; // inline modules are covered by the smoke test
      new vm.Script(code, { filename: `${rel(f)}#script${i}` });
    } catch (e) { fail(f, `inline script ${i}: ${e.message}`); }
  }
}

// 3) No secrets. The publishable key is designed to be public; secret/service keys must never be committed.
const SECRET = [/sb_secret_[A-Za-z0-9_-]{10,}/, /service_role/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/, /sk-ant-[A-Za-z0-9_-]{20,}/, /\bsk-[A-Za-z0-9]{32,}/, /ghp_[A-Za-z0-9]{30,}/];
for (const f of files.filter(f => /\.(js|mjs|ts|html|json|md|sql|yml|yaml|txt)$/.test(f) && !f.includes(`${path.sep}tests${path.sep}`))) {
  const t = fs.readFileSync(f, "utf8");
  for (const r of SECRET) if (r.test(t)) {
    // service_role is fine as a word in SQL/TS (roles, comments); only flag it when it sits inside a JWT-looking string
    if (r.source === "service_role" && !/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]*c2VydmljZV9yb2xl/.test(t)) continue;
    fail(f, `possible secret (${r.source})`);
  }
}

console.log(bad ? `\n${bad} problem(s) found` : `✓ ${files.filter(f => /\.(m?js)$/.test(f)).length} JS files and all inline scripts parse; no secrets found`);
process.exit(bad ? 1 : 0);
