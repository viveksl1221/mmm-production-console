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

alter table post_status enable row level security;
alter table blog_counts enable row level security;

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

-- Enable realtime so teammates see each other's status changes live.
alter publication supabase_realtime add table post_status;
alter publication supabase_realtime add table blog_counts;
