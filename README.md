# MMM Production Console

Shared content-production tracker for MMM's monthly client calendar.

## Project structure

```
src/
  data/campaign.js       — the editable monthly calendar (posts, targets, week dates)
  lib/constants.js        — fixed workflow rules (time estimates, batch cadence, status pipeline)
  lib/derived.js          — pure calculations built from data + constants
  lib/supabaseClient.js   — Supabase client (reads env vars)
  hooks/useAuth.js        — session state
  hooks/useProductionState.js — loads/saves post status + blog counts, realtime sync
  components/             — UI, split to match the three tabs (Overview / Weekly / Clients)
supabase/schema.sql        — tables + RLS policies for a fresh Supabase project
```

### Editing next month's calendar

Everything that changes month to month lives in `src/data/campaign.js`:
`DATA`, `POST_TARGETS`, `BLOG_TARGETS`, `WEEK_RANGES`, `FIKA_GAP`,
`ATTENTION_NOTES`, `CLIENT_NOTES`, `CAMPAIGN_YEAR`/`CAMPAIGN_MONTH_INDEX`,
and `ALL_CLIENTS`. Nothing in `src/lib` or `src/components` needs to change.

## Local setup

```
npm install
cp .env.example .env   # fill in your Supabase URL + anon key
npm run dev
```

## Supabase setup (one-time)

1. Create a project at supabase.com.
2. Open the SQL editor and run `supabase/schema.sql`. This creates the
   `post_status` and `blog_counts` tables, enables row-level security, and
   turns on realtime so teammates see each other's updates live.
3. Under **Authentication → Providers**, email/magic-link sign-in is on by
   default — that's all this app uses (no passwords).
4. Under **Authentication → Settings**, turn **off** "Allow new users to
   sign up" once your team is set up, so the app stays limited to invited
   teammates. Then invite each teammate from **Authentication → Users →
   Invite user** (3–10 people, per your team size) — they'll get an email
   to set up sign-in.
5. Copy **Project URL** and **anon public key** (Settings → API) into
   `.env`.

### Why magic-link auth instead of a shared key

The original prototype had no auth — anyone with the URL and anon key
could read/write the table. For a team of 3–10, this build adds
Supabase email magic-link sign-in: no passwords to manage, changes are
attributable to a user (`updated_by`), and row-level security rejects
anonymous requests. Signups are invite-only (step 4 above) rather than
open, so the anon key alone isn't enough to get in.

## Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel, "Add New Project" → import the repo. Framework preset
   "Vite" is auto-detected; build command `npm run build`, output
   directory `dist` (defaults, no changes needed).
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under
   Project Settings → Environment Variables.
4. Deploy.
