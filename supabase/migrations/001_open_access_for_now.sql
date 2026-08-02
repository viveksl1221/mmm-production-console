-- One-time migration for a project where schema.sql's original
-- `to authenticated` policies were already applied. Run this once in the
-- SQL editor to match the app's current VITE_REQUIRE_AUTH=false state.
-- (Safe to skip on a brand-new project — just run the current schema.sql instead.)

alter policy "authenticated can read post_status" on post_status to public;
alter policy "authenticated can read blog_counts" on blog_counts to public;
alter policy "authenticated can upsert post_status" on post_status to public;
alter policy "authenticated can update post_status" on post_status to public;
alter policy "authenticated can upsert blog_counts" on blog_counts to public;
alter policy "authenticated can update blog_counts" on blog_counts to public;
