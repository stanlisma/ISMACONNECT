-- Unclaimed storefronts let an admin seed a business's public page before
-- the actual owner has an account. New column defaults to true so every
-- existing (real, owner-created) storefront is unaffected.

alter table public.business_storefronts
  add column if not exists claimed boolean not null default true;
