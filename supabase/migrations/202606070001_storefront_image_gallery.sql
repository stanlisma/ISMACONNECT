alter table public.business_storefronts
  add column if not exists image_urls text[] not null default '{}'::text[];

comment on column public.business_storefronts.image_urls is
  'Optional public gallery images for this storefront. The first image is treated as the primary storefront photo.';
