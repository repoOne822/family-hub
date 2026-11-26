-- 📬 Journal Buddy (Bobby 11/25/26): a reader that writes back to every journal entry, so writing has an audience
-- without needing a parent to reply. One note per entry (regenerated at most 3 times if the entry is edited).
-- Written only by the edge function journal-buddy (service role). Kids read their own; parents read all.
create table if not exists public.journal_replies (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid not null unique references public.journal(id) on delete cascade,
  kid text not null references public.kids(id) on delete cascade,
  reaction text not null,
  question text,
  tip text,
  flag boolean not null default false,       -- something a parent should read (wellbeing/safety); the kid sees a gentle note only
  flag_reason text,                          -- parent-only explanation (hidden from the kid by the view below)
  source text not null default 'ai',         -- 'ai' or 'basic' (no AI key configured)
  body_hash text,
  versions int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists journal_replies_kid on public.journal_replies (kid, created_at desc);
alter table public.journal_replies enable row level security;
drop policy if exists "adults read journal replies" on public.journal_replies;
create policy "adults read journal replies" on public.journal_replies for select using (private.is_family());
grant select on public.journal_replies to authenticated;

-- Kids read their own notes through a view without flag_reason.
create or replace view public.my_journal_replies with (security_invoker = false) as
  select id, journal_id, kid, reaction, question, tip, created_at, updated_at
  from public.journal_replies where kid = private.my_kid();
grant select on public.my_journal_replies to authenticated;
