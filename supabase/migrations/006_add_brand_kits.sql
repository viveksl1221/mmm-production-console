-- Per-client brand reference — colors, fonts, and freeform notes — so brand
-- details are a click away while designing instead of buried in a Drive
-- folder. One row per client; colors/fonts are small enough to store as
-- jsonb arrays rather than their own tables.
create table if not exists brand_kits (
  client text primary key,
  colors jsonb not null default '[]'::jsonb,
  fonts jsonb not null default '[]'::jsonb,
  notes text not null default '',
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table brand_kits enable row level security;

create policy "can read brand_kits"
  on brand_kits for select
  to public
  using (true);

create policy "can upsert brand_kits"
  on brand_kits for insert
  to public
  with check (true);

create policy "can update brand_kits"
  on brand_kits for update
  to public
  using (true)
  with check (true);

alter publication supabase_realtime add table brand_kits;
