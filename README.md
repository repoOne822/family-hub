# Family Hub

A private family dashboard: daily check-ins for kids and parents, goals and a rules-based goal coach, plans, and reports, in English and 中文.

- **This repo contains code only.** No personal data is stored here.
- All data lives in a private Supabase database behind email sign-in and row-level security. Only emails on the family allowlist can sign in or read anything.
- The Supabase publishable key in `app.js` is designed to be public; it can't read data without an allowlisted, signed-in user.

Static site: `index.html`, `app.js`, `i18n.js`, `style.css`. Served by GitHub Pages.
