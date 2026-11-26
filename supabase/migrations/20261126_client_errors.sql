-- 🩺 Error monitoring (2026-11-26): JavaScript errors from anyone's device are saved here (signed-in users only,
-- at most 40 per person per day, identical errors counted instead of repeated). Parents read; nobody else can.
create table if not exists public.client_errors (
  id bigserial primary key,
  day date not null default (now() at time zone 'America/Los_Angeles')::date,
  who text not null,
  page text not null,
  msg text not null,
  stack text,
  ua text,
  n int not null default 1,
  first_at timestamptz not null default now(),
  last_at timestamptz not null default now(),
  unique (day, who, page, msg)
);
alter table public.client_errors enable row level security;
drop policy if exists "parents read errors" on public.client_errors;
create policy "parents read errors" on public.client_errors for select using (private.is_family() and private.my_kid() is null);

create or replace function public.log_client_error(p_page text, p_msg text, p_stack text default null, p_ua text default null)
returns void language plpgsql security definer set search_path to '' as $$
declare w text := lower(coalesce(auth.jwt() ->> 'email', '')); d date := (now() at time zone 'America/Los_Angeles')::date;
begin
  if w = '' or not exists (select 1 from public.allowed_users a where lower(a.email) = w) then return; end if;
  if (select count(*) from public.client_errors where day = d and who = w) >= 40 then return; end if;
  insert into public.client_errors (day, who, page, msg, stack, ua)
    values (d, w, left(coalesce(p_page, '?'), 120), left(coalesce(p_msg, '?'), 400), left(p_stack, 2000), left(p_ua, 200))
    on conflict (day, who, page, msg) do update set n = public.client_errors.n + 1, last_at = now();
end $$;
revoke all on function public.log_client_error(text, text, text, text) from public, anon;
grant execute on function public.log_client_error(text, text, text, text) to authenticated;

-- keep 60 days
select cron.unschedule('client-errors-trim') where exists (select 1 from cron.job where jobname = 'client-errors-trim');
select cron.schedule('client-errors-trim', '25 11 * * *', $$delete from public.client_errors where day < current_date - 60$$);
