# Family Hub — Operations runbook

How the hub is kept safe, tested and recoverable. Written 2026-11-26.

## Architecture in one paragraph
Static site (this repo) served by GitHub Pages → talks to one private Supabase project (`family-hub`, id `iiplawparuxicjyflhzu`, us-west-1).
All rules that matter (points, fair play, journal gate, exams, nightly coach) run **inside the database** as functions, triggers and
pg_cron jobs. Three edge functions (`amc-tutor`, `journal-buddy`, `abby-coach`) call AI models with server-side keys.

## What protects what

| Layer | What it does |
|---|---|
| Sign-in | Only emails in `allowed_users` can sign up (`block_unlisted_signup` trigger). Kids sign in with a PIN a parent sets. |
| Row-level security | Every table has RLS. Kids read their own rows; parent-only data (ratings, concerns, idle log, flags, errors) is unreadable to kids. |
| Parent functions | `parent_*`, `set_kid_pin`, `integrity_scan` check the caller is a parent. Kids' accounts are never "family". |
| **Server-side fair play (new)** | `log_app_time` can't claim more time than has passed. `award_app_points` pays only when backed by active time in that app (≤1 pt / 3 s, none without time). `kid_tapin` accepts today/yesterday only and holds back app-checked habits (AMC minutes, Look Back, once-a-week) until the evidence exists. Journal: no backdating, the date can't be moved, the word count is capped at the server's count, the mistake count can't change without the text changing. |
| **Tamper evidence (new)** | Every app save keeps the first version of each day for 21 days (`private.app_saves_history`). If wrong answers disappear from an app's history, a 🧽 high-severity fair-play flag is raised and the older copy is kept. |
| Nightly scans | `integrity_scan` (6:50 PM and 9:50 PM PT), `learn_refresh` (7:35 PM), `brain_refresh` (7:45 PM). |

## Tests and deploys
- `npm install && npx playwright install chromium` once, then `npm test`:
  - `tests/check.mjs`: every JS file and inline script parses; no secret keys committed.
  - `tests/smoke.mjs`: opens the hub and all 16 apps (inside a frame, like the hub does) in headless Chrome; fails on any JavaScript error.
  - Offline sandbox: `SMOKE_OFFLINE=1 CHROME_PATH=/usr/bin/google-chrome node tests/smoke.mjs`.
- GitHub Actions **CI** runs both on every push.
- **Gate deploys on tests (one-time switch, recommended):** Settings → Pages → Source → *GitHub Actions*, then Settings → Variables → `PAGES_VIA_ACTIONS` = `true`. After that a push only goes live if the tests pass. Until then, Pages publishes every push directly.
- **Cache-busting:** when `app.js` changes, bump `?v=` in `index.html` so tablets don't keep the old copy.

## Monitoring
- **Health check** (GitHub Actions, every 30 min): site and database must answer 200. On failure an issue labelled `outage` opens (GitHub emails you); it closes itself on recovery.
- **App errors:** any JavaScript error on a family device is saved to `client_errors` (signed-in users only, ≤40/person/day, kept 60 days). Parents see them on **Family → 🩺 System health**.
- **Fair-play flags:** Dashboard → each boy's 🛡️ panel. New rules: 🧽 *history_rewritten* (high), 🔤 *journal_unchecked* (low).
- Supabase advisors: run `get_advisors` (security + performance) after every schema change. Remaining known items are intentional; see "Accepted findings".

## Backups and restore
- **Supabase Free plan has no automatic backups you can restore yourself.** Options, cheapest first:
  1. *App progress:* `private.app_saves_history` keeps 21 days of daily copies. To restore a boy's app (ask Claude or run in SQL):
     `update app_saves s set data = h.data from private.app_saves_history h where h.id = <id> and s.kid = h.kid and s.app = h.app;`
     Find the id with `select id, day, kind, saved_at from private.app_saves_history where kid='eric' and app='amc' order by saved_at desc;`
  2. *Weekly schema snapshot:* `.github/workflows/schema-snapshot.yml` writes `supabase/schema.sql`. Needs the repo secret `SUPABASE_DB_URL`
     (Supabase → Project Settings → Database → connection string, session pooler) and **only runs while the repo is private**.
  3. *Full daily backups + point-in-time restore:* Supabase Pro ($25/mo) — recommended before other families' data lives here.
- Code: GitHub is the source of truth. `supabase/migrations/` holds the migrations written from 2026-11-26 on; earlier ones live in the
  database's migration history (51 entries) and will be captured by the schema snapshot.

## Site or database down
1. Check https://status.supabase.com and https://www.githubstatus.com.
2. Supabase project paused? Free projects pause after 7 days with no activity: Dashboard → Restore. (Daily use prevents this.)
3. Site loads but shows an error: Family → 🩺 System health, or the browser console. Roll back with `git revert <commit>` and push.

## Accepted findings (reviewed 2026-11-26)
- `my_journal_replies` is a SECURITY DEFINER view on purpose: it shows a boy only his own replies and hides internal columns.
- `SECURITY DEFINER` RPCs callable by signed-in users: each checks the caller's role inside the function.
- Leaked-password protection is off (needs Supabase Pro). Kids use PINs set by parents; parents use magic links.

## Known limits (client-trusted, by design for now)
- The apps compute right/wrong in the browser; a determined, technical child could forge answers. The server caps how much that can be worth
  (time-backed points, daily caps, nightly flags) and keeps history so it's detectable. Moving answer-checking to the server is on the roadmap.
- Ellis's "fencing game" and "fencing journal" habit checks are still app-screen only.

## Intellectual property
- Code is proprietary: see `LICENSE`. **The GitHub repo is currently public**, which exposes the source and weakens trade-secret protection.
  Options: make the repo private and host on Netlify/Cloudflare Pages (free with private repos), or GitHub Pro ($4/mo) to keep Pages.
