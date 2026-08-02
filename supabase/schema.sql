-- MMM Production Console — schema + RLS
-- Run this in the Supabase SQL editor for a fresh project.
--
-- Access model: any authenticated user (magic-link sign-in) can read and
-- write both tables. There is no per-row ownership — this is a small,
-- trusted team (3-10 people) sharing one production tracker, so the goal
-- is "no public/anonymous access" and "changes are attributable to a
-- user", not per-client permission boundaries.

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

-- Authenticated users (any signed-in teammate) can read everything.
create policy "authenticated can read post_status"
  on post_status for select
  to authenticated
  using (true);

create policy "authenticated can read blog_counts"
  on blog_counts for select
  to authenticated
  using (true);

-- Authenticated users can insert/update rows (upsert from the app).
-- No delete policy — the app never deletes rows, only upserts.
create policy "authenticated can upsert post_status"
  on post_status for insert
  to authenticated
  with check (true);

create policy "authenticated can update post_status"
  on post_status for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated can upsert blog_counts"
  on blog_counts for insert
  to authenticated
  with check (true);

create policy "authenticated can update blog_counts"
  on blog_counts for update
  to authenticated
  using (true)
  with check (true);

-- Enable realtime so teammates see each other's status changes live.
alter publication supabase_realtime add table post_status;
alter publication supabase_realtime add table blog_counts;
