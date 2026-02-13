-- Enable Realtime for posts and news tables
begin;
  -- Add tables to the publication (safe if already added, but usually requires dropping and re-adding or alter)
  -- The standard way to ensure a table is in the publication is:
  alter publication supabase_realtime add table posts;
  alter publication supabase_realtime add table news;
commit;
