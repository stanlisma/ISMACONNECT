alter table public.listings
  add column if not exists structured_data jsonb not null default '{}'::jsonb;

create index if not exists listings_structured_data_idx
  on public.listings
  using gin (structured_data);

alter table public.saved_searches
  add column if not exists extra_filters jsonb not null default '{}'::jsonb;

comment on column public.listings.structured_data is 'Category-specific listing metadata for local marketplace filters such as shift pattern, furnished status, and ride-share routing.';
comment on column public.saved_searches.extra_filters is 'Additional structured filter values that extend generic saved-search criteria.';
