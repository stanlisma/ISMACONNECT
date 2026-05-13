alter table public.listings
  add column if not exists geocoded_lat double precision,
  add column if not exists geocoded_lng double precision,
  add column if not exists geocoded_area text,
  add column if not exists geocoded_formatted_address text,
  add column if not exists geocoded_at timestamptz;

alter table public.profiles
  add column if not exists business_geocoded_lat double precision,
  add column if not exists business_geocoded_lng double precision,
  add column if not exists business_geocoded_area text,
  add column if not exists business_geocoded_formatted_address text,
  add column if not exists business_geocoded_at timestamptz;

comment on column public.listings.geocoded_lat is 'Server-side geocoded latitude for the listing address.';
comment on column public.listings.geocoded_lng is 'Server-side geocoded longitude for the listing address.';
comment on column public.listings.geocoded_area is 'Resolved Fort McMurray or nearby community used for map grouping and area filters.';
comment on column public.listings.geocoded_formatted_address is 'Canonical formatted address returned by the geocoding provider.';
comment on column public.listings.geocoded_at is 'Timestamp of the most recent successful server geocode for the listing address.';

comment on column public.profiles.business_geocoded_lat is 'Server-side geocoded latitude for the business address.';
comment on column public.profiles.business_geocoded_lng is 'Server-side geocoded longitude for the business address.';
comment on column public.profiles.business_geocoded_area is 'Resolved community for the business address used for storefront map placement.';
comment on column public.profiles.business_geocoded_formatted_address is 'Canonical formatted business address returned by the geocoding provider.';
comment on column public.profiles.business_geocoded_at is 'Timestamp of the most recent successful server geocode for the business address.';
