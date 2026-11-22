-- 📚 Learning model (2026-11-21). Additive only: new tables + functions; nothing existing is changed or deleted.
-- Nightly (pg_cron 03:35 UTC ≈ 7:35 PM PT) learn_refresh() reads every app save, works out per skill what each boy
-- studied, mastered and is lacking, how efficient he is, and tunes each skill's difficulty (1 easy · 2 medium · 3 hard).
-- skill_history and learn_days are append/upsert-by-day records (never deleted) so trends survive.

create table if not exists public.skill_catalog (
  app text not null, skill text not null, label text, label_zh text, area text, sort int, max_level int,
  primary key (app, skill));

create table if not exists public.skill_state (
  kid text not null, app text not null, skill text not null,
  label text, label_zh text, area text, sort int,
  attempts_total int default 0, correct_total int default 0,
  attempts_7d int default 0, correct_7d int default 0, attempts_14d int default 0,
  acc_recent numeric, mastery numeric, median_secs numeric, pace_secs numeric,
  status text,                 -- new · started · learning · lacking · slow · rushing · mastered · review
  difficulty smallint,         -- what the coach serves next: 1 easy · 2 medium · 3 hard
  difficulty_prev smallint, difficulty_changed_on date,
  app_level numeric,           -- the app's own level for self-adapting apps (Space Quest planet, Brain Park level, Realm level)
  parent_level smallint,       -- a parent's override (null = automatic)
  reason text, reason_zh text,
  first_seen date, last_practiced date, mastered_on date, computed_on date,
  updated_at timestamptz default now(),
  primary key (kid, app, skill));

create table if not exists public.skill_history (
  kid text not null, app text not null, skill text not null, date date not null,
  attempts_total int, correct_total int, attempts_day int, correct_day int,
  mastery numeric, status text, difficulty smallint, app_level numeric,
  primary key (kid, app, skill, date));

create table if not exists public.learn_days (
  kid text not null, date date not null, app text not null,
  active_secs int default 0, attempts int default 0, correct int default 0, median_secs numeric,
  updated_at timestamptz default now(),
  primary key (kid, date, app));

alter table public.skill_catalog enable row level security;
alter table public.skill_state enable row level security;
alter table public.skill_history enable row level security;
alter table public.learn_days enable row level security;
do $$ begin
  create policy "family all" on public.skill_catalog for all to authenticated using (private.is_family()) with check (private.is_family());
  create policy "family all" on public.skill_state for all to authenticated using (private.is_family()) with check (private.is_family());
  create policy "family all" on public.skill_history for all to authenticated using (private.is_family()) with check (private.is_family());
  create policy "family all" on public.learn_days for all to authenticated using (private.is_family()) with check (private.is_family());
exception when duplicate_object then null; end $$;
