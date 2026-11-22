-- NOTE: applied first as learn_refresh(); then renamed to learn_core() and wrapped by learn_refresh() in 2026-11-21_learn_rules.sql.
-- learn_refresh(): nightly learning model. Reads app_saves, writes skill_state (current picture),
-- skill_history (one row per skill per day, kept forever) and learn_days (per app per day).
-- Difficulty rule (per skill, 1 easy · 2 medium · 3 hard), with hysteresis so it never flip-flops:
--   only reconsidered after ≥5 new attempts since the last change;
--   up one step when recent mastery ≥ 85% and he isn't slow or rushing; down one step when mastery < 55%;
--   a parent override (parent_level) always wins. Ellis's AMC is capped at medium (light, no-pressure plan).
create or replace function public.learn_refresh(p_today date default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  d0 date := coalesce(p_today, (now() at time zone 'America/Los_Angeles')::date);
  r record; n_skills int := 0; n_up int := 0; n_down int := 0;
begin
  if auth.uid() is not null and not private.is_family() then raise exception 'family only'; end if;

  create temp table if not exists _ev (kid text, app text, skill text, d date, ts bigint, ok boolean, secs numeric, lv smallint) on commit drop;
  truncate _ev;

  -- AMC (Eric, Ellis): every timed problem; reading/asking rows are not attempts. ok = first-try correct.
  insert into _ev
  select a.kid, 'amc', e->>'t', (e->>'d')::date, coalesce((e->>'ts')::bigint, 0), (e->>'ok')::boolean,
         nullif((e->>'s')::numeric, 0),
         case when e->>'m' = 'scratch' then 1
              when jsonb_typeof(e->'lv') = 'number' then least(3, greatest(1, (e->>'lv')::int))
              when e->>'lv' = 'hard' or e->>'lv' = 'challenge' or e->>'m' = 'challenge' then 3
              when e->>'lv' = 'medium' then 2 else 1 end
  from app_saves a, jsonb_array_elements(coalesce(a.data -> (a.kid || '_amc_progress') -> 'events', '[]')) e
  where a.app = 'amc' and e->>'t' is not null and e ? 'ok' and coalesce(e->>'m', '') not in ('read', 'ask') and e->>'d' ~ '^\d{4}-\d\d-\d\d$';

  -- Physics 6 app (Eric)
  insert into _ev
  select a.kid, 'physics', e->>'t', (e->>'d')::date, coalesce((e->>'ts')::bigint, 0), (e->>'ok')::boolean, null,
         case e->>'m' when 'challenge' then 3 when 'test' then 3 when 'practice' then 1 else 2 end
  from app_saves a, jsonb_array_elements(coalesce(a.data -> (a.kid || '_physics_progress') -> 'events', '[]')) e
  where a.app = 'physics' and e->>'t' is not null and e ? 'ok' and coalesce((e->>'blank')::boolean, false) = false and e->>'d' ~ '^\d{4}-\d\d-\d\d$';

  -- Realm of Forces (Eric): every battle question
  insert into _ev
  select a.kid, 'quest', e->>'k', (e->>'d')::date, coalesce((e->>'ts')::bigint, 0), (e->>'ok')::boolean, nullif((e->>'secs')::numeric, 0),
         coalesce((a.data -> (a.kid || '_quest_save') -> 'lvl' ->> (e->>'k'))::smallint, 1)
  from app_saves a, jsonb_array_elements(coalesce(a.data -> (a.kid || '_quest_save') -> 'log', '[]')) e
  where a.app = 'quest' and e->>'k' is not null and e ? 'ok' and e->>'d' ~ '^\d{4}-\d\d-\d\d$';

  -- Robot Lab (Ellis): every program run, grouped by chapter (c1a → c1)
  insert into _ev
  select a.kid, 'robot', substring(e->>'id' from '^(c\d+)'), (e->>'d')::date, coalesce((e->>'ts')::bigint, 0), (e->>'ok')::boolean, nullif((e->>'secs')::numeric, 0), 1
  from app_saves a, jsonb_array_elements(coalesce(a.data -> (a.kid || '_robot_state') -> 'log', '[]')) e
  where a.app = 'robot' and e->>'id' ~ '^c\d+' and e ? 'ok' and e->>'d' ~ '^\d{4}-\d\d-\d\d$';

  -- Fencing (Ellis): Piste Duel bouts by opponent tier, boss bouts
  insert into _ev
  select a.kid, 'fencing', case when e->>'type' = 'duel' then 'duel:' || coalesce(e->>'tier', '?') else 'boss' end,
         (e->>'date')::date, coalesce((e->>'ts')::bigint, 0), (e->>'won')::boolean, null, 1
  from app_saves a, jsonb_array_elements(coalesce(a.data -> (a.kid || '_perfLog'), '[]')) e
  where a.app = 'fencing' and e->>'type' in ('duel', 'boss') and e ? 'won' and e->>'date' ~ '^\d{4}-\d\d-\d\d$';

  -- ---------- per-skill numbers from events ----------
  create temp table if not exists _sk (kid text, app text, skill text, n_all int, c_all int, n7 int, c7 int, n14 int,
    mastery numeric, acc10 numeric, n_recent int, med numeric, first_seen date, last_d date, lv_mode smallint, n_today int, c_today int) on commit drop;
  truncate _sk;
  insert into _sk
  select kid, app, skill,
    count(*), count(*) filter (where ok),
    count(*) filter (where d > d0 - 7), count(*) filter (where d > d0 - 7 and ok), count(*) filter (where d > d0 - 14),
    -- recency-weighted mastery over the last 20 attempts (newest weight 1, then ×0.9 each), with a 50% prior worth one attempt
    (sum(case when rk <= 20 and ok then power(0.9, rk - 1) else 0 end) + 0.5) / (sum(case when rk <= 20 then power(0.9, rk - 1) else 0 end) + 1),
    avg(case when ok then 1.0 else 0 end) filter (where rk <= 10),
    count(*) filter (where rk <= 20),
    percentile_cont(0.5) within group (order by secs) filter (where rk <= 20 and secs is not null and d > d0 - 14),
    min(d), max(d),
    mode() within group (order by lv) filter (where rk <= 10),
    count(*) filter (where d = d0), count(*) filter (where d = d0 and ok)
  from (select *, row_number() over (partition by kid, app, skill order by d desc, ts desc) rk from _ev where d <= d0) x
  group by kid, app, skill;

  -- Space Quest (Jonah) has no per-question log: use its per-skill totals, and day-over-day history for the 7-day numbers.
  insert into _sk
  select a.kid, 'space', s.key, (s.value->>'q')::int, (s.value->>'c')::int,
    greatest(0, (s.value->>'q')::int - coalesce(h7.attempts_total, 0)), greatest(0, (s.value->>'c')::int - coalesce(h7.correct_total, 0)),
    greatest(0, (s.value->>'q')::int - coalesce(h14.attempts_total, 0)),
    case when coalesce(h14.attempts_total, 0) > 0 and (s.value->>'q')::int - h14.attempts_total >= 8
         then ((s.value->>'c')::int - h14.correct_total + 0.5) / ((s.value->>'q')::int - h14.attempts_total + 1)
         else ((s.value->>'c')::numeric + 0.5) / ((s.value->>'q')::numeric + 1) end,
    null, least(20, (s.value->>'q')::int), null,
    coalesce(fs.first_seen, d0), coalesce(lp.last_d, d0), null,
    greatest(0, (s.value->>'q')::int - coalesce(hy.attempts_total, 0)), greatest(0, (s.value->>'c')::int - coalesce(hy.correct_total, 0))
  from app_saves a
  cross join lateral jsonb_each(coalesce(a.data -> (a.kid || '_space_state') -> 'skills', '{}')) s
  left join lateral (select attempts_total, correct_total from skill_history h where h.kid = a.kid and h.app = 'space' and h.skill = s.key and h.date <= d0 - 7 order by date desc limit 1) h7 on true
  left join lateral (select attempts_total, correct_total from skill_history h where h.kid = a.kid and h.app = 'space' and h.skill = s.key and h.date <= d0 - 14 order by date desc limit 1) h14 on true
  left join lateral (select attempts_total, correct_total from skill_history h where h.kid = a.kid and h.app = 'space' and h.skill = s.key and h.date < d0 order by date desc limit 1) hy on true
  left join lateral (select min(date) first_seen from skill_history h where h.kid = a.kid and h.app = 'space' and h.skill = s.key) fs on true
  left join lateral (select max(date) last_d from skill_history h where h.kid = a.kid and h.app = 'space' and h.skill = s.key and h.attempts_day > 0) lp on true
  where a.app = 'space' and jsonb_typeof(s.value) = 'object' and (s.value->>'q') is not null;

  -- ---------- which skills each boy has (catalog ∩ his apps; Ellis's AMC = his 9 chapters) ----------
  create temp table if not exists _mine (kid text, app text, skill text) on commit drop;
  truncate _mine;
  insert into _mine
  select distinct a.kid, c.app, c.skill from app_saves a join skill_catalog c on c.app = a.app
  where not (a.kid = 'ellis' and c.app = 'amc' and c.sort not in (1, 2, 4, 5, 7, 9, 12, 13, 14))
    and not (a.app = 'fencing' and a.kid <> 'ellis')
  union select kid, app, skill from _sk;

  -- ---------- write skill_state ----------
  for r in
    select m.kid, m.app, m.skill, c.label, c.label_zh, c.area, c.sort, c.max_level,
      s.n_all, s.c_all, s.n7, s.c7, s.n14, s.mastery, s.acc10, s.n_recent, s.med, s.first_seen, s.last_d, s.lv_mode, s.n_today, s.c_today,
      st.difficulty old_diff, st.difficulty_changed_on, st.parent_level, st.mastered_on old_mastered, st.status old_status,
      case when m.app = 'amc' then case when m.kid = 'ellis' then 90 else 96 end when m.app = 'quest' then 45 end pace,
      case when m.app = 'amc' and m.kid = 'ellis' then 2 else 3 end cap,
      case
        when m.app = 'quest' then (a.data -> (m.kid || '_quest_save') -> 'lvl' ->> m.skill)::numeric
        when m.app = 'brain' then (a.data -> (m.kid || '_brain_state') -> 'lv' ->> m.skill)::numeric
        when m.app = 'space' then (case when (a.data -> (m.kid || '_space_state') -> 'lv' ->> split_part(regexp_replace(m.skill, '^words', 'words_'), '_', 1)) is null then null
              else ((a.data -> (m.kid || '_space_state') -> 'lv' ->> split_part(regexp_replace(m.skill, '^words', 'words_'), '_', 1))::int
                    - split_part(regexp_replace(m.skill, '^words', 'words_'), '_', 2)::int) end)::numeric
      end app_level,
      (select count(*) from _ev e where e.kid = m.kid and e.app = m.app and e.skill = m.skill and (st.difficulty_changed_on is null or e.d > st.difficulty_changed_on)) since_change
    from _mine m
    left join skill_catalog c on c.app = m.app and c.skill = m.skill
    left join _sk s on s.kid = m.kid and s.app = m.app and s.skill = m.skill
    left join skill_state st on st.kid = m.kid and st.app = m.app and st.skill = m.skill
    left join app_saves a on a.kid = m.kid and a.app = m.app
  loop
    declare
      v_status text; v_diff smallint; v_reason text; v_reason_zh text; v_changed date := r.difficulty_changed_on;
      v_label text := coalesce(r.label, r.skill); v_mastered date := r.old_mastered; v_since int := r.since_change;
      v_slow boolean := r.pace is not null and r.med is not null and r.med > r.pace * 1.25;
      v_rush boolean := r.pace is not null and r.med is not null and r.med < r.pace * 0.3;
    begin
      if r.app = 'space' then v_since := coalesce(r.n14, 0); end if; -- no per-question log: use 2-week volume
      -- status
      if r.app = 'brain' then
        v_status := case when r.app_level is null then 'new' when r.max_level is not null and r.app_level >= r.max_level then 'mastered' when r.app_level <= 1 then 'started' else 'learning' end;
      elsif coalesce(r.n_all, 0) = 0 then v_status := 'new';
      elsif r.n_recent < 3 then v_status := 'started';
      elsif r.mastery >= 0.85 and r.n_recent >= 8 and not v_slow then
        v_status := case when r.last_d < d0 - 21 then 'review' else 'mastered' end;
      elsif r.mastery >= 0.75 and v_slow then v_status := 'slow';
      elsif r.acc10 < 0.6 and v_rush and r.n_recent >= 4 then v_status := 'rushing';
      elsif r.mastery < 0.6 and r.n_recent >= 4 then v_status := 'lacking';
      else v_status := 'learning'; end if;
      if v_status in ('mastered', 'review') and v_mastered is null then v_mastered := d0; end if;

      -- difficulty
      v_diff := coalesce(r.old_diff, case when r.app in ('quest', 'brain') and r.app_level is not null then least(3, greatest(1, r.app_level::int)) end, r.lv_mode, 1);
      v_diff := least(v_diff, r.cap);
      if r.parent_level is not null then
        v_diff := r.parent_level; v_reason := 'Set by a parent'; v_reason_zh := '家长设定';
      elsif coalesce(r.n_all, 0) = 0 then
        v_reason := 'Not started yet'; v_reason_zh := '还没开始';
      elsif v_since >= 5 and r.mastery >= 0.85 and not v_slow and not (r.acc10 < 0.6 and v_rush) and v_diff < r.cap then
        v_diff := v_diff + 1; v_changed := d0; n_up := n_up + 1;
        v_reason := format('Up: %s%% recent mastery over %s tries', round(r.mastery * 100), r.n_recent);
        v_reason_zh := format('升级：最近掌握度 %s%%（%s 题）', round(r.mastery * 100), r.n_recent);
      elsif v_since >= 5 and r.mastery < 0.55 and v_diff > 1 then
        v_diff := v_diff - 1; v_changed := d0; n_down := n_down + 1;
        v_reason := format('Down: %s%% recent mastery, rebuild confidence first', round(r.mastery * 100));
        v_reason_zh := format('降级：最近掌握度 %s%%，先找回信心', round(r.mastery * 100));
      elsif v_slow then v_reason := 'Holding: right but slow, practise speed at this level'; v_reason_zh := '保持：会做但偏慢，在这一级练速度';
      elsif r.acc10 < 0.6 and v_rush then v_reason := 'Holding: rushing, slow down first'; v_reason_zh := '保持：太急，先放慢';
      elsif v_since < 5 then v_reason := format('Holding: %s new tries since last change (needs 5)', v_since); v_reason_zh := format('保持：上次调整后新做 %s 题（需要 5 题）', v_since);
      else v_reason := 'Holding: still building at this level'; v_reason_zh := '保持：在这一级继续巩固'; end if;

      insert into skill_state as t (kid, app, skill, label, label_zh, area, sort, attempts_total, correct_total, attempts_7d, correct_7d, attempts_14d,
        acc_recent, mastery, median_secs, pace_secs, status, difficulty, difficulty_prev, difficulty_changed_on, app_level, reason, reason_zh,
        first_seen, last_practiced, mastered_on, computed_on, updated_at)
      values (r.kid, r.app, r.skill, v_label, r.label_zh, r.area, r.sort, coalesce(r.n_all, 0), coalesce(r.c_all, 0), coalesce(r.n7, 0), coalesce(r.c7, 0), coalesce(r.n14, 0),
        round(r.acc10, 3), round(r.mastery, 3), round(r.med::numeric, 1), r.pace, v_status, v_diff, r.old_diff, v_changed, r.app_level, v_reason, v_reason_zh,
        r.first_seen, r.last_d, v_mastered, d0, now())
      on conflict (kid, app, skill) do update set label = excluded.label, label_zh = excluded.label_zh, area = excluded.area, sort = excluded.sort,
        attempts_total = excluded.attempts_total, correct_total = excluded.correct_total, attempts_7d = excluded.attempts_7d, correct_7d = excluded.correct_7d,
        attempts_14d = excluded.attempts_14d, acc_recent = excluded.acc_recent, mastery = excluded.mastery, median_secs = excluded.median_secs,
        pace_secs = excluded.pace_secs, status = excluded.status, difficulty = excluded.difficulty,
        difficulty_prev = case when excluded.difficulty is distinct from t.difficulty then t.difficulty else t.difficulty_prev end,
        difficulty_changed_on = excluded.difficulty_changed_on, app_level = excluded.app_level, reason = excluded.reason, reason_zh = excluded.reason_zh,
        first_seen = coalesce(t.first_seen, excluded.first_seen), last_practiced = coalesce(excluded.last_practiced, t.last_practiced),
        mastered_on = coalesce(t.mastered_on, excluded.mastered_on), computed_on = excluded.computed_on, updated_at = now();

      insert into skill_history as h (kid, app, skill, date, attempts_total, correct_total, attempts_day, correct_day, mastery, status, difficulty, app_level)
      values (r.kid, r.app, r.skill, d0, coalesce(r.n_all, 0), coalesce(r.c_all, 0), coalesce(r.n_today, 0), coalesce(r.c_today, 0), round(r.mastery, 3), v_status, v_diff, r.app_level)
      on conflict (kid, app, skill, date) do update set attempts_total = excluded.attempts_total, correct_total = excluded.correct_total,
        attempts_day = excluded.attempts_day, correct_day = excluded.correct_day, mastery = excluded.mastery, status = excluded.status,
        difficulty = excluded.difficulty, app_level = excluded.app_level;
      n_skills := n_skills + 1;
    end;
  end loop;

  -- ---------- learn_days: active time + attempts per app per day (recomputed for every day the apps know about) ----------
  insert into learn_days as l (kid, date, app, active_secs, attempts, correct, median_secs, updated_at)
  select kid, date, app, sum(secs)::int, sum(n)::int, sum(c)::int, max(med), now() from (
    -- active seconds from the apps' session logs
    select a.kid, (x->>'date')::date date, a.app, sum((x->>'active')::numeric) secs, 0 n, 0 c, null::numeric med
      from app_saves a, jsonb_array_elements(coalesce(a.data -> (a.kid || '_' || a.app || '_progress') -> 'sessions', '[]')) x
      where a.app in ('amc', 'physics') and x->>'date' ~ '^\d{4}-\d\d-\d\d$' group by 1, 2, 3
    union all
    select a.kid, d.key::date, 'space', coalesce((d.value->>'sec')::numeric, 0), coalesce((d.value->>'q')::int, 0), coalesce((d.value->>'c')::int, 0), null
      from app_saves a, jsonb_each(coalesce(a.data -> (a.kid || '_space_state') -> 'days', '{}')) d where a.app = 'space' and d.key ~ '^\d{4}-\d\d-\d\d$'
    union all
    select a.kid, d.key::date, 'brain', coalesce((d.value->>'sec')::numeric, 0), coalesce((d.value->>'r')::int, (d.value->>'rounds')::int, 0), 0, null
      from app_saves a, jsonb_each(coalesce(a.data -> (a.kid || '_brain_state') -> 'days', '{}')) d where a.app = 'brain' and d.key ~ '^\d{4}-\d\d-\d\d$' and jsonb_typeof(d.value) = 'object'
    union all
    -- attempts, first-try correct and median time from the per-question logs; quest/robot/fencing time = sum of question time
    select kid, d, app, case when app in ('quest', 'robot') then coalesce(sum(secs), 0) else 0 end, count(*), count(*) filter (where ok),
      percentile_cont(0.5) within group (order by secs) filter (where secs is not null)
      from _ev group by kid, d, app
  ) u group by kid, date, app
  on conflict (kid, date, app) do update set active_secs = excluded.active_secs, attempts = excluded.attempts, correct = excluded.correct,
    median_secs = excluded.median_secs, updated_at = now();

  return jsonb_build_object('date', d0, 'skills', n_skills, 'up', n_up, 'down', n_down);
end $$;

revoke all on function public.learn_refresh(date) from public, anon;
grant execute on function public.learn_refresh(date) to authenticated;

-- What a kid app may read: only his own per-skill difficulty for one app (no mastery, no notes).
create or replace function public.my_tuning(p_app text, p_kid text default null)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_object_agg(skill, jsonb_build_object('d', difficulty, 's', status)), '{}'::jsonb)
  from skill_state
  where app = p_app and kid = case when private.is_family() then coalesce(p_kid, private.my_kid()) else private.my_kid() end;
$$;
revoke all on function public.my_tuning(text, text) from public, anon;
grant execute on function public.my_tuning(text, text) to authenticated;
