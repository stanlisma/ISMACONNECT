create table if not exists public.business_storefront_claims (
  id uuid primary key default gen_random_uuid(),
  storefront_id uuid not null references public.business_storefronts(id) on delete cascade,
  claimant_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One pending claim per (storefront, claimant) at a time - resubmitting while
-- already pending should update the existing row, not pile up duplicates.
create unique index if not exists business_storefront_claims_pending_unique
  on public.business_storefront_claims (storefront_id, claimant_id)
  where status = 'pending';

create index if not exists business_storefront_claims_storefront_idx
  on public.business_storefront_claims (storefront_id, created_at desc);

create index if not exists business_storefront_claims_status_idx
  on public.business_storefront_claims (status, created_at desc);

drop trigger if exists set_business_storefront_claims_updated_at on public.business_storefront_claims;
create trigger set_business_storefront_claims_updated_at
before update on public.business_storefront_claims
for each row
execute function public.set_updated_at();

alter table public.business_storefront_claims enable row level security;

drop policy if exists "Claimants and admins can view claims" on public.business_storefront_claims;
create policy "Claimants and admins can view claims"
on public.business_storefront_claims
for select
to authenticated
using (claimant_id = auth.uid() or public.is_admin());

drop policy if exists "Authenticated users can submit claims" on public.business_storefront_claims;
create policy "Authenticated users can submit claims"
on public.business_storefront_claims
for insert
to authenticated
with check (claimant_id = auth.uid());

drop policy if exists "Admins can review claims" on public.business_storefront_claims;
create policy "Admins can review claims"
on public.business_storefront_claims
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

comment on table public.business_storefront_claims is 'Requests from an authenticated user to take ownership of an admin-seeded unclaimed business storefront.';
