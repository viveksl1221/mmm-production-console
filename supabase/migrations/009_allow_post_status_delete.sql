-- The "Replace all" import mode deletes posts that aren't in the new file,
-- and needs to clean up their post_status rows too — but post_status only
-- had select/insert/update policies (status rows were never deleted before
-- this). Without this, the delete silently affects zero rows under RLS.
create policy "can delete post_status"
  on post_status for delete
  to public
  using (true);
