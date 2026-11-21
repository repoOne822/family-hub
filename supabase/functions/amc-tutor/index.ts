import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// 🤖 Ask Buddy's AI layer for the AMC app.
// - Only signed-in boys (<kid>@kids.family-hub.local) or parents (am_i_family) may call it.
// - The Anthropic key lives only in the Edge Function secret ANTHROPIC_API_KEY. No key → { enabled: false }
//   and the app keeps using its built-in word helper.
// - Daily limit per boy (TUTOR_DAILY_LIMIT, default 40). Every question + answer goes to public.tutor_log for parents.
// - Kid-safe tutor prompt: explain simply, never give answers to practice/test problems, stay on learning.
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const KIDS: Record<string, { name: string; age: number; grade: string }> = {
  ellis: { name: "Ellis", age: 10, grade: "4th grade" },
  eric: { name: "Eric", age: 11, grade: "6th grade" },
  jonah: { name: "Jonah", age: 5, grade: "kindergarten" },
};
const MODELS = () => [Deno.env.get("TUTOR_MODEL"), "claude-haiku-5-5", "claude-haiku-4-5", "claude-sonnet-4-5"].filter(Boolean) as string[];

function system(kid: { name: string; age: number; grade: string }, ctx: Record<string, string>) {
  return `You are Buddy, a friendly math helper inside a family's AMC 8 practice app. You are talking with ${kid.name}, who is ${kid.age} years old and in ${kid.grade}. He is learning these topics for the first time.

How to answer:
- Explain math words, symbols and ideas in simple words a ${kid.age}-year-old understands. Short sentences. Usually under 110 words.
- Give one tiny example with small, friendly numbers.
- End with one short question to check he understood, or an offer to explain more.
- Plain text only. No LaTeX, no markdown headers. Use the symbols × ÷ − ² √ and simple fractions like 3/4.
- Be warm and encouraging. Praise effort and good questions, not "being smart".

Rules you must always follow:
- Never give the final answer to a practice, quiz, exam or contest problem, even if he asks or says it's for checking. Instead explain the idea, point out the key word, or give just the first step or a hint. If he shares his own answer, you may say whether his method makes sense and where to look again, without stating the answer.
- Stay on math, learning and study habits. For anything else, say kindly that you're his math helper and he can ask a parent.
- If he seems upset, frustrated, tired, or mentions being hurt, unsafe or sad, be kind, suggest a short break, and tell him to talk to a parent or another trusted grown-up right away.
- Never ask for or repeat personal information (full name, address, school, passwords).
- If you're not sure something is right, say so and suggest checking the lesson or asking a parent.

Where he is in the app right now: ${ctx.screen || "unknown"}${ctx.lessonTitle ? `, lesson "${ctx.lessonTitle}"` : ""}${ctx.block ? `, basics block "${ctx.block}"` : ""}.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const url = Deno.env.get("SUPABASE_URL")!, anon = Deno.env.get("SUPABASE_ANON_KEY")!, service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const auth = req.headers.get("Authorization") || "";
  const asUser = createClient(url, anon, { global: { headers: { Authorization: auth } } });
  const { data: u } = await asUser.auth.getUser();
  const email = (u?.user?.email || "").toLowerCase();
  let kidId = (email.match(/^([a-z]+)@kids\.family-hub\.local$/) || [])[1] || null;
  let isParent = false;
  if (!kidId) { const { data: fam } = await asUser.rpc("am_i_family"); isParent = fam === true; }
  if (!kidId && !isParent) return json({ error: "forbidden" }, 403);

  let body: any = {}; try { body = await req.json(); } catch (_) { /* empty */ }
  const key = Deno.env.get("ANTHROPIC_API_KEY") || Deno.env.get("CLAUDE_API_KEY") || "";
  const limit = Math.max(1, +(Deno.env.get("TUTOR_DAILY_LIMIT") || 40));
  const db = createClient(url, service);
  const who = kidId || (typeof body?.kid === "string" && KIDS[body.kid] ? body.kid : "ellis");
  const kid = KIDS[who] || KIDS.ellis;
  // today's count (Pacific time)
  const startPT = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })); startPT.setHours(0, 0, 0, 0);
  const offset = new Date().getTime() - new Date(new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })).getTime();
  const since = new Date(startPT.getTime() + offset).toISOString();
  const { count } = await db.from("tutor_log").select("id", { count: "exact", head: true }).eq("kid", who).gte("created_at", since);
  const used = count || 0, left = Math.max(0, limit - used);

  if (body?.ping) return json({ enabled: !!key, left });
  if (!key) return json({ enabled: false, error: "off", message: "Buddy's AI brain isn't switched on yet. The word helper still works!" });
  if (kidId && left <= 0) return json({ error: "limit", left: 0, message: `That's all ${limit} AI questions for today. Great curiosity! The word helper still works, and you can ask a grown-up too. 🙂` });

  const q = String(body?.q || "").trim().slice(0, 400);
  if (!q) return json({ error: "empty" }, 400);
  const ctx = typeof body?.ctx === "object" && body.ctx ? body.ctx : {};
  const hist = (Array.isArray(body?.history) ? body.history : []).slice(-6)
    .filter((m: any) => (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string")
    .map((m: any) => ({ role: m.role, content: m.content.slice(0, 800) }));
  const messages = [...hist, { role: "user", content: q }];

  let answer = "", model = "";
  for (const m of MODELS()) {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: m, max_tokens: 450, system: system(kid, ctx), messages }),
    });
    if (r.ok) { const j: any = await r.json(); answer = (j.content || []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("\n").trim(); model = m; break; }
    const t = await r.text().catch(() => "");
    if (r.status === 404 || /model/i.test(t)) { console.error("model unavailable", m, r.status); continue; }
    console.error("anthropic error", r.status, t.slice(0, 300));
    return json({ error: "ai", message: "Buddy's AI brain had a hiccup. Try again in a minute, or use the word helper. 🙂" }, 502);
  }
  if (!answer) return json({ error: "ai", message: "Buddy couldn't think of an answer this time. Try asking a different way. 🙂" }, 502);
  await db.from("tutor_log").insert({ kid: who, lesson: String(ctx.lesson || "").slice(0, 40) || null, question: q, answer: answer.slice(0, 4000), model: isParent ? model + " (parent test)" : model });
  return json({ answer, left: kidId ? Math.max(0, left - 1) : left, model });
});
