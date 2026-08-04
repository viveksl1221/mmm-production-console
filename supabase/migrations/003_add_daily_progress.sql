-- Daily task tracker: a lightweight "did I touch this today" marker, kept
-- separate from the content pipeline (post_status). Scoped by work_date so
-- each day's checklist starts fresh — the same item can show up on both a
-- Monday (copy) and a Friday (review) within the same week without the
-- progress marks colliding.
--
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

alter table daily_progress enable row level security;

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

alter publication supabase_realtime add table daily_progress;
