do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if exists (
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_name = 'notifications'
    ) and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'notifications'
    ) then
      alter publication supabase_realtime add table public.notifications;
    end if;
  end if;
end
$$;

comment on schema public is 'Notification realtime migration adds public.notifications to Supabase Realtime publication when available.';
