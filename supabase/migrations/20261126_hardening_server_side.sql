-- 🛡️ Production hardening (2026-11-26): fair-play rules enforced by the database, not just the app screens.
-- Parents are never limited by any of this (every guard applies only when private.my_kid() is set).

-- 1) log_app_time: a report can't claim more seconds than have actually passed since the last report (+15 s slack).
create or replace function public.log_app_time(p_app text, p_secs integer) returns void
language plpgsql security definer set search_path to '' as $$
declare k text := private.my_kid(); d date := (now() at time zone 'America/Los_Angeles')::date; s int; prev timestamptz;
begin
  if k is null or p_app is null or p_app !~ '^[a-z0-9_-]{2,20}$' then return; end if;
  s := least(greatest(coalesce(p_secs, 0), 0), 180);
  select updated_at into prev from public.app_time where kid = k and date = d and app = p_app;
  if prev is not null then s := least(s, greatest(0, floor(extract(epoch from now() - prev))::int + 15)); end if;
  if s = 0 then return; end if;
  insert into public.app_time (kid, date, app, secs, updated_at) values (k, d, p_app, s, now())
    on conflict (kid, date, app) do update set secs = least(public.app_time.secs + excluded.secs, 8 * 3600), updated_at = now();
end $$;

-- 2) award_app_points: points must be backed by active time in that app today (1 point per 3 active seconds, +30 s slack; none at all without active time).
--    Real play averages 6–30 s per point, so honest play never hits this; calling the function without using the app does.
create or replace function public.award_app_points(p_app text, p_ref text, p_points integer, p_label text, p_label_zh text default null)
returns integer language plpgsql security definer set search_path to '' as $$
declare k text := private.my_kid(); d date := (now() at time zone 'America/Los_Angeles')::date; used int; give int; rf text; cap int; act int; apps text[];
begin
  if k is null then return 0; end if;
  if p_app not in ('amc', 'space', 'physics', 'fencing', 'quest', 'brain', 'review', 'chinese', 'study', 'robot') or p_ref is null or length(p_ref) > 120 then raise exception 'bad award'; end if;
  if private.journal_frozen(k) then return 0; end if;  -- ⏸️ points pause
  cap := case when p_app in ('brain', 'chinese') then 40 when p_app = 'review' then 50 when p_app = 'study' then 80 else 120 end;
  rf := 'app:' || p_app || ':' || p_ref;
  if exists (select 1 from public.point_ledger where kid = k and ref = rf) then return 0; end if;
  select coalesce(sum(points), 0) into used from public.point_ledger where kid = k and date = d and source = 'app' and ref like 'app:' || p_app || ':%';
  apps := case p_app when 'study' then array['chem', 'bio', 'prealg', 'english', 'latin', 'history', 'study']
                     when 'quest' then array['quest', 'physics'] when 'physics' then array['physics', 'quest'] else array[p_app] end;
  select coalesce(sum(secs), 0) into act from public.app_time where kid = k and date = d and app = any(apps);
  if act = 0 then return 0; end if;  -- no active time in this app today → no app points
  give := least(greatest(coalesce(p_points, 0), 0),
                case when p_ref like 'cp:%' or p_ref like 'cp10:%' or p_ref like 'cp:wk:%' then 50 else 25 end,
                cap - used,
                (act + 30) / 3 - used);
  if give <= 0 then return 0; end if;
  insert into public.point_ledger (kid, date, points, source, ref, label, label_zh) values (k, d, give, 'app', rf, left(p_label, 120), left(coalesce(p_label_zh, p_label), 120));
  return give;
end $$;

-- 3) kid_tapin: only today or yesterday (LA time), and app-checked habits need the app evidence at tap time.
--    Returns which habits were held back and why (the app can show it; old clients just ignore the result).
drop function if exists public.kid_tapin(date, integer, jsonb);
create function public.kid_tapin(p_date date, p_mood integer, p_counts jsonb) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare k text := private.my_kid(); td date := private.la_today(); m record; hm record; n numeric; mins numeric; ok boolean; held jsonb := '[]'::jsonb;
begin
  if k is null then raise exception 'not a kid account'; end if;
  if p_mood is not null and (p_mood < 1 or p_mood > 5) then raise exception 'bad mood'; end if;
  if p_date is null or p_date > td or p_date < td - 1 then raise exception 'date out of range'; end if;
  insert into checkins (kid, date, kid_mood, updated_at) values (k, p_date, p_mood, now())
    on conflict (kid, date) do update set kid_mood = excluded.kid_mood, updated_at = now();
  for m in select id, kid_max, per_week from metrics where kid = k and type = 'rate' loop
    if p_counts ? m.id then
      mins := null;
      n := least(greatest(coalesce((p_counts->>m.id)::numeric, 0), 0), coalesce(m.kid_max, 1));
      if n > 0 and not exists (select 1 from readings where metric = m.id and date = p_date and value >= n) then
        select * into hm from integrity_habit_map where metric_id = m.id and p_date >= since;
        if found then
          ok := true;
          if hm.kind = 'time' then
            select coalesce(sum(secs), 0) / 60.0 into mins from app_time where kid = k and date = p_date and app = any(hm.apps);
            ok := mins >= hm.min_min * 0.9;
          elsif hm.kind = 'lookback' then
            select coalesce((a.data -> (k || '_review_progress') -> 'days' -> p_date::text ->> 'done') in ('true', '1'), false) into ok
              from app_saves a where a.kid = k and a.app = 'review';
            ok := coalesce(ok, false);
          elsif hm.kind = 'weekly' then
            ok := not exists (select 1 from readings where metric = m.id and value > 0 and date <> p_date
                              and date between private.week_of(p_date) and private.week_of(p_date) + 6);
          end if;
          if not ok then
            held := held || jsonb_build_object('habit', m.id, 'kind', hm.kind, 'need_min', hm.min_min, 'have_min', round(coalesce(mins, 0)));
            continue;
          end if;
        end if;
      end if;
      if n = 0 then delete from readings where metric = m.id and date = p_date;
      else insert into readings (metric, date, kid, value, updated_at) values (m.id, p_date, k, n, now())
        on conflict (metric, date) do update set value = excluded.value, updated_at = now();
      end if;
    end if;
  end loop;
  return jsonb_build_object('held', held);
end $$;
revoke all on function public.kid_tapin(date, integer, jsonb) from public, anon;
grant execute on function public.kid_tapin(date, integer, jsonb) to authenticated;

-- 4) Journal guard (boys only): no backdating, the date can't be moved, the word count can't exceed what the server counts,
--    and the mistake count can't be edited without editing the text. A save without a mistake check is flagged for parents.
create or replace function private.journal_guard() returns trigger
language plpgsql security definer set search_path to '' as $$
declare k text := private.my_kid(); td date := private.la_today(); wc int; req boolean;
begin
  if k is null then return new; end if;
  if tg_op = 'INSERT' and (new.date is null or new.date > td or new.date < td - 1) then
    raise exception 'journal_date: only today or yesterday' using errcode = 'P0001';
  end if;
  if tg_op = 'UPDATE' then
    new.date := old.date; new.kid := old.kid; new.created_at := old.created_at;
    if new.body is not distinct from old.body then new.words := old.words; new.mistakes := old.mistakes; return new; end if;
  end if;
  wc := private.word_count(new.body);
  new.words := least(coalesce(new.words, wc), wc);
  select journal_required into req from public.kids where id = new.kid;
  if coalesce(req, false) and new.mistakes is null and wc > 0 then
    perform private.iflag(new.kid, new.date, 'journal_unchecked', coalesce(new.id::text, ''), 'low', 0, '{}',
      jsonb_build_object('words', wc, 'msg', 'Journal saved without the spelling/grammar check (checker blocked or failed to load)'));
  end if;
  return new;
end $$;
drop trigger if exists a_journal_guard on public.journal;
create trigger a_journal_guard before insert or update on public.journal for each row execute function private.journal_guard();

-- 5) App saves: keep the first version of each day (21-day history, also a restore point), and flag erased wrong answers.
create table if not exists private.app_saves_history (
  id bigserial primary key, kid text not null, app text not null, day date not null,
  kind text not null check (kind in ('daily', 'rewrite')), data jsonb not null, saved_at timestamptz not null default now());
create unique index if not exists app_saves_history_daily on private.app_saves_history (kid, app, day) where kind = 'daily';
create index if not exists app_saves_history_lookup on private.app_saves_history (kid, app, saved_at desc);

create or replace function private.miss_counts(p jsonb) returns table (path text, day text, n int)
language sql immutable set search_path to '' as $$
  select k.key || '.' || a.p, e ->> 'd', count(*)::int
  from jsonb_each(case when jsonb_typeof(p) = 'object' then p else '{}'::jsonb end) k
  cross join unnest(array['events', 'log']) a(p)
  cross join lateral jsonb_array_elements(case when jsonb_typeof(k.value) = 'object' and jsonb_typeof(k.value -> a.p) = 'array' then k.value -> a.p else '[]'::jsonb end) e
  where e ->> 'ok' in ('false', '0') and e ? 'd'
  group by 1, 2 $$;

create or replace function private.app_saves_guard() returns trigger
language plpgsql security definer set search_path to '' as $$
declare k text := private.my_kid(); td date := private.la_today(); gone int; det jsonb;
begin
  if k is null or tg_op <> 'UPDATE' then return new; end if;
  insert into private.app_saves_history (kid, app, day, kind, data) values (old.kid, old.app, td, 'daily', old.data)
    on conflict (kid, app, day) where kind = 'daily' do nothing;
  with o as (select * from private.miss_counts(old.data)),
       first_day as (select path, min(day) d0 from o group by path),
       nw as (select * from private.miss_counts(new.data))
  select coalesce(sum(o.n - coalesce(nw.n, 0)), 0), jsonb_agg(jsonb_build_object('where', o.path, 'day', o.day, 'was', o.n, 'now', coalesce(nw.n, 0)))
    into gone, det
  from o join first_day f on f.path = o.path
  left join nw on nw.path = o.path and nw.day = o.day
  where o.day >= (td - 13)::text and o.day > f.d0 and coalesce(nw.n, 0) < o.n;
  if gone > 0 then
    insert into private.app_saves_history (kid, app, day, kind, data) values (old.kid, old.app, td, 'rewrite', old.data);
    perform private.iflag(old.kid, td, 'history_rewritten', old.app, 'high', 0, '{}',
      jsonb_build_object('app', old.app, 'wrong_answers_removed', gone, 'detail', det,
        'msg', format('%s wrong answer(s) disappeared from the %s history (older copy kept)', gone, upper(old.app))));
  end if;
  return new;
end $$;
drop trigger if exists app_saves_guard on public.app_saves;
create trigger app_saves_guard before update on public.app_saves for each row execute function private.app_saves_guard();

-- 6) Advisor fixes: pin search_path on helper functions.
alter function private.points_start() set search_path to '';
alter function private.diff_mult(text) set search_path to '';
alter function private.la_today() set search_path to '';
alter function private.week_of(date) set search_path to '';
alter function private.week_stars(text, date) set search_path to '';
alter function private.exam_num(text) set search_path to '';

-- 7) History retention: keep 21 days.
select cron.unschedule('app-saves-history-trim') where exists (select 1 from cron.job where jobname = 'app-saves-history-trim');
select cron.schedule('app-saves-history-trim', '20 11 * * *', $$delete from private.app_saves_history where saved_at < now() - interval '21 days'$$);
