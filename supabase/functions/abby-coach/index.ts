// 🗣️ abby-coach: AI help for Abby's English page (/abby/).
// Callers must be signed in as a learner or a parent (allowed_users.role). Uses the ANTHROPIC_API_KEY secret.
// Body: { ping: true } → { ok } ; { messages: [{role, content}], json?: boolean } → { text, json? }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const out = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const LIMIT = Number(Deno.env.get("ABBY_DAILY_LIMIT") || 80);
const MODEL = Deno.env.get("ABBY_MODEL") || Deno.env.get("TUTOR_MODEL") || "claude-haiku-4-5";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return out({ ok: true });
  try {
    const url = Deno.env.get("SUPABASE_URL")!, anon = Deno.env.get("SUPABASE_ANON_KEY")!, service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const auth = req.headers.get("Authorization") || "";
    const userDb = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const { data: u } = await userDb.auth.getUser();
    const email = (u?.user?.email || "").toLowerCase();
    if (!email) return out({ error: "not_signed_in" }, 401);
    const { data: row } = await userDb.from("allowed_users").select("role").eq("email", email).maybeSingle();
    if (!row || !["learner", "parent", "family"].includes(row.role)) return out({ error: "not_allowed" }, 403);

    const key = Deno.env.get("ANTHROPIC_API_KEY");
    const body = await req.json().catch(() => ({}));
    if (body.ping) return out({ ok: !!key });
    if (!key) return out({ error: "not_configured" }, 503);

    // daily cap per person (skipped quietly if the log table isn't there yet)
    const admin = service ? createClient(url, service) : null;
    if (admin) {
      const since = new Date(); since.setUTCHours(since.getUTCHours() - 24);
      const { count, error } = await admin.from("learner_ai_log").select("id", { count: "exact", head: true }).eq("email", email).gte("created_at", since.toISOString());
      if (!error && (count || 0) >= LIMIT) return out({ error: "rate_limited" }, 429);
    }

    const msgs = (Array.isArray(body.messages) ? body.messages : [])
      .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-16).map((m: any) => ({ role: m.role, content: m.content.slice(0, 6000) }));
    if (!msgs.length || msgs[msgs.length - 1].role !== "user") return out({ error: "bad_request" }, 400);

    const system = "You help Abby, an adult beginner learning English whose first language is Mandarin Chinese, through her English practice page. Follow the instructions in the user's message exactly, including any required JSON format. Keep English simple (A1-A2). Be warm and encouraging. Only help with learning English and everyday life tasks.";
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: body.json ? 1500 : 700, system, messages: msgs }),
    });
    if (r.status === 429) return out({ error: "rate_limited" }, 429);
    if (!r.ok) return out({ error: "ai" }, 502);
    const j = await r.json();
    const text = (j.content || []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("").trim();
    if (admin) await admin.from("learner_ai_log").insert({ email, kind: body.json ? "json" : "chat" }).then(() => {}, () => {});
    let parsed: unknown = undefined;
    if (body.json) { try { parsed = JSON.parse(text.replace(/^[^{]*/, "").replace(/[^}]*$/, "")); } catch (_) { parsed = undefined; } }
    return out(parsed === undefined ? { text } : { text, json: parsed });
  } catch (_e) {
    return out({ error: "error" }, 500);
  }
});
