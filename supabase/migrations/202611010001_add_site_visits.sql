-- First-party, anonymous visit counting for the admin Traffic page.
--
-- One row per (day, visitor, page): a visitor opening the same page ten times
-- in a day is one row, which keeps the table small and makes inflating the
-- numbers by hammering the endpoint pointless. visitor_key is the opaque
-- random id from the ismaconnect_visitor_id cookie - no IP, no user agent,
-- no account id is stored. Days are bucketed in Fort McMurray time.
--
-- Only the service role reads or writes this table (the /api/track-visit
-- route and the admin report), so RLS is enabled with no policies.

create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  visited_on date not null default ((now() at time zone 'America/Edmonton')::date),
  visitor_key text not null,
  path text not null,
  referrer_host text,
  is_signed_in boolean not null default false,
  created_at timestamptz not null default now(),
  constraint site_visits_visitor_day_path_key unique (visited_on, visitor_key, path)
);

create index if not exists site_visits_visited_on_idx
  on public.site_visits (visited_on);

alter table public.site_visits enable row level security;

create or replace function public.get_daily_site_traffic(days_back int default 30)
returns table (day date, page_views bigint, visitors bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    visited_on as day,
    count(*)::bigint as page_views,
    count(distinct visitor_key)::bigint as visitors
  from public.site_visits
  where visited_on >= ((now() at time zone 'America/Edmonton')::date - greatest(days_back, 1) + 1)
  group by visited_on
  order by visited_on;
$$;

revoke all on function public.get_daily_site_traffic(int) from public, anon, authenticated;
grant execute on function public.get_daily_site_traffic(int) to service_role;
