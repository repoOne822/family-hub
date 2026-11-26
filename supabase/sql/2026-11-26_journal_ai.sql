-- Applied 2026-11-26 as migration journal_ai_check (additive only).
-- 🤖 AI-writing check: typing stats from the device + Buddy's parent-only AI likelihood.
alter table public.journal add column if not exists process jsonb;
alter table public.journal_replies add column if not exists ai_score integer, add column if not exists ai_reason text;
-- Kids read replies through public.my_journal_replies, which does not include ai_score / ai_reason.
