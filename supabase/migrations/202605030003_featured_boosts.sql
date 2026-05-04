do $$
begin
  if not exists (select 1 from pg_type where typname = 'boost_order_status') then
    create type public.boost_order_status as enum ('pending', 'active', 'expired', 'canceled', 'failed');
  end if;
end
$$;

alter table public.listings
  add column if not exists boosted_at timestamptz,
  add column if not exists boosted_until timestamptz,
  add column if not exists is_urgent boolean not null default false,
  add column if not exists urgent_until timestamptz;

create table if not exists public.listing_boost_orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  product_key text not null,
  product_name text not null,
  product_description text,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'cad',
  status public.boost_order_status not null default 'pending',
  provider text not null default 'stripe' check (provider in ('stripe', 'demo', 'manual')),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  applied_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listings_boosted_until_idx
  on public.listings(boosted_until desc)
  where boosted_until is not null;

create index if not exists listings_urgent_until_idx
  on public.listings(urgent_until desc)
  where urgent_until is not null;

create index if not exists listing_boost_orders_owner_created_idx
  on public.listing_boost_orders(owner_id, created_at desc);

create index if not exists listing_boost_orders_listing_created_idx
  on public.listing_boost_orders(listing_id, created_at desc);

drop trigger if exists set_listing_boost_orders_updated_at on public.listing_boost_orders;
create trigger set_listing_boost_orders_updated_at
before update on public.listing_boost_orders
for each row
execute function public.set_updated_at();

create or replace function public.expire_listing_promotions()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.listings
  set is_featured = false,
      featured_until = null,
      updated_at = now()
  where is_featured = true
    and featured_until is not null
    and featured_until <= now();

  update public.listings
  set boosted_at = null,
      boosted_until = null,
      updated_at = now()
  where boosted_until is not null
    and boosted_until <= now();

  update public.listings
  set is_urgent = false,
      urgent_until = null,
      updated_at = now()
  where is_urgent = true
    and urgent_until is not null
    and urgent_until <= now();

  update public.listing_boost_orders
  set status = 'expired',
      updated_at = now()
  where status = 'active'
    and expires_at is not null
    and expires_at <= now();
end;
$$;

grant execute on function public.expire_listing_promotions() to anon, authenticated, service_role;

alter table public.listing_boost_orders enable row level security;

drop policy if exists "Owners and admins can view boost orders" on public.listing_boost_orders;
create policy "Owners and admins can view boost orders"
on public.listing_boost_orders
for select
to authenticated
using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "Owners can create boost orders" on public.listing_boost_orders;
create policy "Owners can create boost orders"
on public.listing_boost_orders
for insert
to authenticated
with check (
  owner_id = auth.uid()
  and exists (
    select 1
    from public.listings
    where listings.id = listing_boost_orders.listing_id
      and listings.owner_id = auth.uid()
  )
);

comment on table public.listing_boost_orders is 'Tracks paid or demo listing boosts, including Stripe checkout state and activation windows.';
comment on column public.listings.boosted_at is 'The last time the listing was pushed back toward the top of browse feeds.';
comment on column public.listings.boosted_until is 'The time until which a feed boost remains active.';
comment on column public.listings.is_urgent is 'Whether the listing currently shows an urgent badge.';
comment on column public.listings.urgent_until is 'The time until which the urgent badge remains active.';
