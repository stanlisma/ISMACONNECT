alter table public.profiles
  add column if not exists business_address text,
  add column if not exists show_exact_business_location boolean not null default false;

comment on column public.profiles.business_address is 'Optional storefront or business address used for exact map display when the business opts in.';
comment on column public.profiles.show_exact_business_location is 'When true, the business storefront may show an exact map pin instead of only a community-level location.';
