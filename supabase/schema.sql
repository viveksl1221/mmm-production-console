-- MMM Production Console — schema + RLS
-- Run this in the Supabase SQL editor for a fresh project.
--
-- Access model: currently open to anyone with the anon key (`to public`
-- below), matching VITE_REQUIRE_AUTH=false in the app for now, while the
-- project is getting stood up. Switch both back on together when ready to
-- invite the team:
--   1. In each policy below, change `to public` to `to authenticated`.
--   2. Set VITE_REQUIRE_AUTH=true (or remove it) in .env / Vercel.
--   3. Turn off public sign-up and invite teammates (see README).

create table if not exists post_status (
  client text not null,
  post_num integer not null,
  status text not null default 'Planned',
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  primary key (client, post_num)
);

create table if not exists blog_counts (
  client text primary key,
  count integer not null default 0,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

-- Post content (topic/hook/etc.) — editable from the Clients pages and the
-- Import calendar flow. Deliberately no `status` column here: a post's
-- status lives in post_status, keyed by (client, num), not here.
create table if not exists posts (
  client text not null,
  num integer not null,
  week integer not null default 1,
  platform text not null default '',
  format text not null default '',
  audience text not null default '',
  funnel text not null default '',
  pillar text not null default '',
  topic text not null default '',
  hook text not null default '',
  breakdown text not null default '',
  visual_direction text not null default '',
  cta text not null default '',
  assignee text not null default '',
  date text not null default '',
  notes text not null default '',
  reference_links jsonb not null default '[]'::jsonb,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  primary key (client, num)
);

-- Daily task tracker: a lightweight "did I touch this today" marker for the
-- /today checklist, kept separate from the post_status content pipeline.
-- Scoped by work_date so each day's checklist starts fresh.
-- started_at is set while a timer is actively running and cleared on
-- pause/complete/reset, with the running duration folded into
-- elapsed_seconds at that point — this lets elapsed time be reconstructed
-- without a background job (elapsed_seconds, plus now() - started_at if
-- a timer is currently running).
create table if not exists daily_progress (
  client text not null,
  num integer not null,
  work_date date not null,
  status text not null default 'not_started',
  started_at timestamptz,
  elapsed_seconds integer not null default 0,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  primary key (client, num, work_date)
);

-- Open comment board — external faculty/reviewers leave feedback here.
-- No client/post scoping; just a flat, newest-first feed.
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  message text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table post_status enable row level security;
alter table blog_counts enable row level security;
alter table posts enable row level security;
alter table daily_progress enable row level security;
alter table comments enable row level security;

-- Anyone with the anon key can read everything. (Rename policies aren't
-- required when you tighten this — see the header note — just swap the
-- `to public` role below to `to authenticated`.)
create policy "can read post_status"
  on post_status for select
  to public
  using (true);

create policy "can read blog_counts"
  on blog_counts for select
  to public
  using (true);

-- Anyone with the anon key can insert/update rows (upsert from the app).
-- No delete policy — the app never deletes rows, only upserts.
create policy "can upsert post_status"
  on post_status for insert
  to public
  with check (true);

create policy "can update post_status"
  on post_status for update
  to public
  using (true)
  with check (true);

create policy "can upsert blog_counts"
  on blog_counts for insert
  to public
  with check (true);

create policy "can update blog_counts"
  on blog_counts for update
  to public
  using (true)
  with check (true);

create policy "can read posts"
  on posts for select
  to public
  using (true);

create policy "can upsert posts"
  on posts for insert
  to public
  with check (true);

create policy "can update posts"
  on posts for update
  to public
  using (true)
  with check (true);

-- Unlike post_status/blog_counts, posts CAN be deleted — the "remove post"
-- button in the client editor needs it.
create policy "can delete posts"
  on posts for delete
  to public
  using (true);

create policy "can read daily_progress"
  on daily_progress for select
  to public
  using (true);

create policy "can upsert daily_progress"
  on daily_progress for insert
  to public
  with check (true);

create policy "can update daily_progress"
  on daily_progress for update
  to public
  using (true)
  with check (true);

create policy "can read comments"
  on comments for select
  to public
  using (true);

create policy "can post comments"
  on comments for insert
  to public
  with check (true);

-- Anyone can remove a comment (no per-author restriction yet, matching the
-- rest of the app's open-editing model — see header note).
create policy "can delete comments"
  on comments for delete
  to public
  using (true);

-- Enable realtime so teammates see each other's changes live.
alter publication supabase_realtime add table post_status;
alter publication supabase_realtime add table blog_counts;
alter publication supabase_realtime add table posts;
alter publication supabase_realtime add table daily_progress;
alter publication supabase_realtime add table comments;
