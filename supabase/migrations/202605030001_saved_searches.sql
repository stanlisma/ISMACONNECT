create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  path text not null default '/browse',
  search_query text,
  category public.listing_category,
  subcategory text,
  min_price numeric(12,2),
  max_price numeric(12,2),
  sort text,
  signature text not null,
  last_checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint saved_searches_unique unique (user_id, signature),
  constraint saved_searches_price_bounds check (
    (min_price is null or min_price >= 0)
    and (max_price is null or max_price >= 0)
    and (min_price is null or max_price is null or min_price <= max_price)
  ),
  constraint saved_searches_path_check check (path like '/%'),
  constraint saved_searches_sort_check check (
    sort is null or sort in ('price_asc', 'price_desc')
  )
);

create index if not exists saved_searches_user_updated_idx
  on public.saved_searches(user_id, updated_at desc);

create index if not exists saved_searches_user_checked_idx
  on public.saved_searches(user_id, last_checked_at desc);

drop trigger if exists set_saved_searches_updated_at on public.saved_searches;
create trigger set_saved_searches_updated_at
before update on public.saved_searches
for each row
execute function public.set_updated_at();

alter table public.saved_searches enable row level security;

drop policy if exists "Users can view their saved searches" on public.saved_searches;
create policy "Users can view their saved searches"
on public.saved_searches
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can create their saved searches" on public.saved_searches;
create policy "Users can create their saved searches"
on public.saved_searches
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update their saved searches" on public.saved_searches;
create policy "Users can update their saved searches"
on public.saved_searches
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete their saved searches" on public.saved_searches;
create policy "Users can delete their saved searches"
on public.saved_searches
for delete
to authenticated
using (user_id = auth.uid());

comment on table public.saved_searches is 'User-owned saved listing searches with in-app new-match alerts.';
