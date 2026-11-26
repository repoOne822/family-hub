-- 🔁 Repeated-mistake penalty (Bobby 11/25/26: "penalize the mistakes they keep missing to avoid memorizing by doing repeatedly").
-- Eric and Ellis only (Jonah is 5). A "kind" of problem = the question with every number replaced by # (AMC), or the item id (class rooms),
-- so memorizing one answer doesn't help: a fresh version with new numbers is the same kind.
-- Rule: missing the same kind on the FIRST try on a 3rd (or later) different day within 14 days costs 5 points that day,
-- once per kind per day, at most 20 points a day. Answers voided for leaving the page don't count (the away rule handles those).
-- Only misses on/after 2026-11-26 are penalized (earlier days count as history). Look Back, Physics and Robot Lab are not included.
create or replace function private.mistake_penalties(p_day date) returns int
language plpgsql security definer set search_path = public as $$
declare k text; r record; n int := 0; used int;
  start_day constant date := '2026-11-26'; per_hit constant int := 5; day_cap constant int := 20;
begin
  if p_day is null or p_day < start_day then return 0; end if;
  foreach k in array array['eric','ellis'] loop
    select coalesce(-sum(points), 0) into used from point_ledger where kid = k and date = p_day and source = 'penalty';
    for r in
      with miss as (
        select e->>'d' d, 'amc'::text app,
          left(regexp_replace(regexp_replace(lower(left(e->>'q', 90)), '-?\d+([.,/]\d+)?', '#', 'g'), '\s+', ' ', 'g'), 60) sk,
          e->>'q' q, coalesce((e->>'ts')::bigint, 0) ts
        from app_saves a, jsonb_array_elements(a.data -> (k || '_amc_progress') -> 'events') e
        where a.kid = k and a.app = 'amc' and e ? 'q' and e->>'ok' = 'false' and not (e ? 'left')
          and coalesce(e->>'m', '') not in ('read', 'scratch') and e->>'d' between (p_day - 13)::text and p_day::text
        union all
        select e->>'d', a.app, e->>'id', e->>'id', 0
        from app_saves a, jsonb_array_elements(a.data -> (k || '_study_' || a.app) -> 'log') e
        where a.kid = k and a.app in ('chem', 'bio', 'prealg', 'english', 'latin', 'history')
          and e->>'first' in ('1', 'true') and e->>'ok' in ('0', 'false') and e->>'d' between (p_day - 13)::text and p_day::text
      ), g as (
        select app, sk, count(distinct d) days, bool_or(d = p_day::text) today,
          (array_agg(q order by ts desc) filter (where d = p_day::text))[1] q
        from miss where sk is not null group by app, sk
      )
      select * from g where today and days >= 3 order by days desc, app, sk
    loop
      exit when used + per_hit > day_cap;
      insert into point_ledger (kid, date, points, source, ref, label, label_zh)
      values (k, p_day, -per_hit, 'penalty', 'penalty:' || r.app || ':' || left(md5(r.sk), 10) || ':' || p_day,
        format('🔁 Same kind of mistake on %s days (%s): %s', r.days, upper(r.app), left(r.q, 60)),
        format('🔁 同类题两周内第 %s 天又错（%s）：%s', r.days, upper(r.app), left(r.q, 60)))
      on conflict (kid, ref) do nothing;
      if found then used := used + per_hit; n := n + 1; end if;
    end loop;
  end loop;
  return n;
end $$;
revoke all on function private.mistake_penalties(date) from public;

-- Runs with the fair-play scans (5:50 PM: yesterday + today; 9:50 PM: today).
select cron.alter_job((select jobid from cron.job where jobname = 'integrity-scan-evening'), command :=
  $c$select public.integrity_scan(((now() at time zone 'America/Los_Angeles')::date - 1)); select public.integrity_scan((now() at time zone 'America/Los_Angeles')::date); select private.mistake_penalties(((now() at time zone 'America/Los_Angeles')::date - 1)); select private.mistake_penalties((now() at time zone 'America/Los_Angeles')::date);$c$);
select cron.alter_job((select jobid from cron.job where jobname = 'integrity-scan-night'), command :=
  $c$select public.integrity_scan((now() at time zone 'America/Los_Angeles')::date); select private.mistake_penalties((now() at time zone 'America/Los_Angeles')::date);$c$);
