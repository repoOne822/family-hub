-- Abby's English (/abby/): adult learner sign-in + cloud progress. Safe to run more than once.
-- Run in Supabase → SQL editor for project iiplawparuxicjyflhzu.
alter table public.allowed_users drop constraint if exists allowed_users_role_check;
alter table public.allowed_users add constraint allowed_users_role_check check (role = any (array['parent','family','kid','learner']));

insert into public.allowed_users (email, role, display_name)
values ('abby@learners.family-hub.local', 'learner', 'Abby')
on conflict (email) do nothing;

create table if not exists public.learner_saves (
  email text primary key,
  app text not null default 'english',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.learner_saves enable row level security;

create or replace function private.is_learner() returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from public.allowed_users a where lower(a.email) = lower(coalesce(auth.jwt()->>'email','')) and a.role = 'learner');
$$;

drop policy if exists "family all" on public.learner_saves;
create policy "family all" on public.learner_saves for all using (private.is_family()) with check (private.is_family());
drop policy if exists "learner reads own" on public.learner_saves;
create policy "learner reads own" on public.learner_saves for select using (private.is_learner() and email = lower(auth.jwt()->>'email'));
drop policy if exists "learner inserts own" on public.learner_saves;
create policy "learner inserts own" on public.learner_saves for insert with check (private.is_learner() and email = lower(auth.jwt()->>'email'));
drop policy if exists "learner updates own" on public.learner_saves;
create policy "learner updates own" on public.learner_saves for update using (private.is_learner() and email = lower(auth.jwt()->>'email')) with check (private.is_learner() and email = lower(auth.jwt()->>'email'));

-- parents set a learner's PIN (creates the sign-in on first use); same pattern as set_kid_pin
create or replace function public.set_learner_pin(p_login text, p_pin text) returns text
language plpgsql security definer set search_path to 'public', 'extensions' as $function$
declare e text; uid uuid;
begin
  if not private.is_family() then raise exception 'parents only'; end if;
  if p_pin is null or length(p_pin) < 6 then raise exception 'PIN must be at least 6 characters'; end if;
  select email into e from allowed_users where role = 'learner' and lower(email) = lower(p_login || '@learners.family-hub.local');
  if e is null then raise exception 'no learner account for %', p_login; end if;
  select id into uid from auth.users where lower(email) = lower(e);
  if uid is null then
    uid := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
    values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', lower(e), crypt(p_pin, gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), uid, uid::text, jsonb_build_object('sub', uid::text, 'email', lower(e), 'email_verified', true), 'email', now(), now(), now());
    return 'created';
  end if;
  update auth.users set encrypted_password = crypt(p_pin, gen_salt('bf')), updated_at = now() where id = uid;
  return 'updated';
end; $function$;
revoke all on function public.set_learner_pin(text, text) from public, anon;
grant execute on function public.set_learner_pin(text, text) to authenticated;

-- AI coach usage log (the abby-coach edge function enforces a daily cap from it)
create table if not exists public.learner_ai_log (
  id bigserial primary key,
  email text not null,
  kind text,
  created_at timestamptz not null default now()
);
alter table public.learner_ai_log enable row level security;
drop policy if exists "family reads" on public.learner_ai_log;
create policy "family reads" on public.learner_ai_log for select using (private.is_family());
