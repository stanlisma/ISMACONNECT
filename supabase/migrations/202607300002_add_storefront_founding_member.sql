-- Independent of `claimed`: founding_member marks a storefront as one of the
-- first ISMACONNECT businesses (capacity-boxed at 100, enforced in app code
-- on creation). Previously the "Founding Member" label was tied to `claimed
-- = false`, meaning a business lost the designation the moment someone
-- claimed it - the opposite of the intended incentive, which should persist
-- once granted.
alter table public.business_storefronts
  add column if not exists founding_member boolean not null default false;

-- Backfill: today's handful of existing storefronts are, by definition, the
-- earliest ones - grandfather them in as founding members.
update public.business_storefronts
set founding_member = true
where founding_member = false;
