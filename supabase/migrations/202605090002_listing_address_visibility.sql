alter table public.listings
  add column if not exists show_exact_address_on_map boolean;

comment on column public.listings.show_exact_address_on_map is 'When true, the listing address can be shown publicly on the map. When false, only the community-level area is shown. Null preserves legacy behaviour until the listing is updated.';
