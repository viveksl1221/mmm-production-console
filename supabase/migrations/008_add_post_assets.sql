-- Attaches a creative asset (the finished Static/Carousel image, or a
-- Reel's cover thumbnail) to a post — the prerequisite for the Instagram
-- grid preview, which needs an actual image per post to arrange. Files
-- live in Supabase Storage; only the resulting public URL is stored here.
alter table posts add column if not exists asset_url text;

-- Public bucket for creative assets — open read/write to match the rest of
-- this app's `to public` access model (see schema.sql header note).
insert into storage.buckets (id, name, public)
values ('post-assets', 'post-assets', true)
on conflict (id) do nothing;

create policy "public can read post-assets"
  on storage.objects for select
  to public
  using (bucket_id = 'post-assets');

create policy "public can upload post-assets"
  on storage.objects for insert
  to public
  with check (bucket_id = 'post-assets');

create policy "public can update post-assets"
  on storage.objects for update
  to public
  using (bucket_id = 'post-assets')
  with check (bucket_id = 'post-assets');

create policy "public can delete post-assets"
  on storage.objects for delete
  to public
  using (bucket_id = 'post-assets');
