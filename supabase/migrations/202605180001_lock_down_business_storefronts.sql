create or replace function public.enforce_listing_storefront_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.storefront_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.business_storefronts
    where id = new.storefront_id
      and owner_id = new.owner_id
  ) then
    raise exception 'Selected storefront does not belong to listing owner.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_listing_storefront_owner on public.listings;
create trigger enforce_listing_storefront_owner
before insert or update on public.listings
for each row
execute function public.enforce_listing_storefront_owner();

alter table public.business_storefronts enable row level security;

drop policy if exists "Business storefronts are public" on public.business_storefronts;
create policy "Business storefronts are public"
on public.business_storefronts
for select
to anon, authenticated
using (true);

drop policy if exists "Owners can create storefronts" on public.business_storefronts;
create policy "Owners can create storefronts"
on public.business_storefronts
for insert
to authenticated
with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists "Owners and admins can update storefronts" on public.business_storefronts;
create policy "Owners and admins can update storefronts"
on public.business_storefronts
for update
to authenticated
using (owner_id = auth.uid() or public.is_admin())
with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists "Owners and admins can delete storefronts" on public.business_storefronts;
create policy "Owners and admins can delete storefronts"
on public.business_storefronts
for delete
to authenticated
using (owner_id = auth.uid() or public.is_admin());

comment on function public.enforce_listing_storefront_owner() is 'Ensures a listing can only reference a storefront owned by the same profile.';
