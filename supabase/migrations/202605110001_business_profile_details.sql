alter table public.profiles
  add column if not exists business_services text[] not null default '{}'::text[];

alter table public.profiles
  add column if not exists business_hours jsonb not null default '{}'::jsonb;

comment on column public.profiles.business_services is 'Business specialties or service types shown on the public storefront.';
comment on column public.profiles.business_hours is 'Structured weekly business hours shown on the public storefront.';
