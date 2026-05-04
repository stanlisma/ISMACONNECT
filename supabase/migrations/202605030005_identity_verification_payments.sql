do $$
begin
  if not exists (select 1 from pg_type where typname = 'identity_verification_order_status') then
    create type public.identity_verification_order_status as enum ('pending', 'paid', 'canceled', 'failed');
  end if;
end
$$;

create table if not exists public.identity_verification_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'cad',
  status public.identity_verification_order_status not null default 'pending',
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists identity_verification_orders_user_created_idx
  on public.identity_verification_orders(user_id, created_at desc);

drop trigger if exists set_identity_verification_orders_updated_at on public.identity_verification_orders;
create trigger set_identity_verification_orders_updated_at
before update on public.identity_verification_orders
for each row
execute function public.set_updated_at();

alter table public.identity_verification_orders enable row level security;

drop policy if exists "Owners and admins can view identity verification orders" on public.identity_verification_orders;
create policy "Owners and admins can view identity verification orders"
on public.identity_verification_orders
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

comment on table public.identity_verification_orders is 'Tracks Stripe Checkout payments required before a seller can start Stripe Identity verification.';
