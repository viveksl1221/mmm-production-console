-- Open comment board — external faculty/reviewers leave feedback here.
-- No client/post scoping; just a flat, newest-first feed.

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  message text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table comments enable row level security;

create policy "can read comments"
  on comments for select
  to public
  using (true);

create policy "can post comments"
  on comments for insert
  to public
  with check (true);

-- Anyone can remove a comment (no per-author restriction yet, matching the
-- rest of the app's open-editing model).
create policy "can delete comments"
  on comments for delete
  to public
  using (true);

alter publication supabase_realtime add table comments;
