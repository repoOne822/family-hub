-- 🤖 Ask Buddy (AMC app) — log of questions sent to the AI tutor.
-- Written only by the amc-tutor edge function (service role). Parents can read. Kids can't read or write directly.
create table if not exists public.tutor_log (
  id bigserial primary key,
  kid text not null,
  lesson text,
  question text not null,
  answer text,
  model text,
  created_at timestamptz not null default now()
);
create index if not exists tutor_log_kid_time on public.tutor_log (kid, created_at desc);
alter table public.tutor_log enable row level security;
drop policy if exists tutor_log_family_read on public.tutor_log;
create policy tutor_log_family_read on public.tutor_log for select to authenticated using (public.am_i_family());
comment on table public.tutor_log is 'Questions the boys asked the AMC app''s AI helper (Buddy). Written only by the amc-tutor edge function; parents can read.';
