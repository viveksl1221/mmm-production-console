-- Adds the `posts` table (post content: topic/hook/etc.) for a project that
-- already has post_status/blog_counts applied. Run once in the SQL editor.

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

alter table posts enable row level security;

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

create policy "can delete posts"
  on posts for delete
  to public
  using (true);

alter publication supabase_realtime add table posts;
