create table if not exists public.business_storefronts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  logo_url text,
  website text,
  phone text,
  address text,
  show_exact_location boolean not null default false,
  geocoded_lat double precision,
  geocoded_lng double precision,
  geocoded_area text,
  geocoded_formatted_address text,
  geocoded_at timestamptz,
  service_areas text[] not null default '{}'::text[],
  services text[] not null default '{}'::text[],
  hours jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_storefronts_owner_slug_key unique (owner_id, slug)
);

create unique index if not exists business_storefronts_id_idx
  on public.business_storefronts (id);

create index if not exists business_storefronts_owner_id_idx
  on public.business_storefronts (owner_id);

alter table public.listings
  add column if not exists storefront_id uuid references public.business_storefronts(id) on delete set null;

create index if not exists listings_storefront_id_idx
  on public.listings (storefront_id);

comment on table public.business_storefronts is 'Additional business storefront profiles owned by one user account.';
comment on column public.business_storefronts.slug is 'Owner-scoped storefront slug used for stable storefront routing.';
comment on column public.business_storefronts.show_exact_location is 'When true, this storefront may use its exact address for storefront and listing map defaults.';
comment on column public.listings.storefront_id is 'Optional additional storefront associated with this listing when a business owner manages more than one storefront.';
