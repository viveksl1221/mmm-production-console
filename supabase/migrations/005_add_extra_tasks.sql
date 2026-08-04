-- Ad-hoc tasks that aren't tied to the content calendar at all (e.g. "call
-- the printer", "review brand guideline doc") — not scoped to a work_date
-- like daily_progress, since these persist until done rather than resetting
-- daily. created_at/completed_at let the app tally them per campaign month.
create table if not exists extra_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'not_started',
  started_at timestamptz,
  elapsed_seconds integer not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table extra_tasks enable row level security;

create policy "can read extra_tasks"
  on extra_tasks for select
  to public
  using (true);

create policy "can insert extra_tasks"
  on extra_tasks for insert
  to public
  with check (true);

create policy "can update extra_tasks"
  on extra_tasks for update
  to public
  using (true)
  with check (true);

-- Unlike daily_progress, these are user-created one-offs — worth letting
-- people delete outright rather than only reset.
create policy "can delete extra_tasks"
  on extra_tasks for delete
  to public
  using (true);

alter publication supabase_realtime add table extra_tasks;
