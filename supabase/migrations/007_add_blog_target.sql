-- Lets a client's blog-creative target be raised (or lowered) from the
-- Clients page instead of being frozen at whatever campaign.js shipped
-- with. Null means "no override — use the campaign.js default"; the app
-- merges this on top of that static default everywhere a target is shown
-- or used for scheduling math.
alter table blog_counts add column if not exists target integer;
