alter table public.profiles
  add column if not exists is_business boolean not null default false,
  add column if not exists business_name text,
  add column if not exists business_description text,
  add column if not exists business_logo_url text,
  add column if not exists business_website text,
  add column if not exists service_areas text[] not null default '{}'::text[];

comment on column public.profiles.is_business is 'Marks whether the seller uses a business storefront presentation.';
comment on column public.profiles.business_name is 'Public business or company name shown on the seller storefront.';
comment on column public.profiles.business_description is 'Public storefront description for business accounts.';
comment on column public.profiles.business_logo_url is 'Optional uploaded business logo used on storefront hero surfaces.';
comment on column public.profiles.business_website is 'Optional public website link for business storefronts.';
comment on column public.profiles.service_areas is 'Optional list of local service areas shown on business storefronts.';
