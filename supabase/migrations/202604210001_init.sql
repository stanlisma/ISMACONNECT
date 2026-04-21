create extension if not exists pgcrypto;
create extension if not exists citext;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('user', 'admin');
  end if;

  if not exists (select 1 from pg_type where typname = 'listing_category') then
    create type public.listing_category as enum ('rentals', 'ride-share', 'jobs', 'services', 'buy-sell');
  end if;

  if not exists (select 1 from pg_type where typname = 'listing_status') then
    create type public.listing_status as enum ('active', 'flagged', 'removed');
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.slugify(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(value, '')), '[^a-z0-9]+', '-', 'g'));
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext unique,
  full_name text not null default '',
  phone text,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 6 and 120),
  slug text not null unique,
  category public.listing_category not null,
  description text not null check (char_length(description) between 30 and 3000),
  price numeric(12,2) check (price is null or price >= 0),
  location text not null default 'Fort McMurray, AB',
  contact_name text not null check (char_length(contact_name) between 2 and 80),
  contact_email citext,
  contact_phone text,
  image_url text,
  is_featured boolean not null default false,
  featured_until timestamptz,
  stripe_checkout_session_id text,
  status public.listing_status not null default 'active',
  flag_count integer not null default 0 check (flag_count >= 0),
  search_document tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(location, '')), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listing_has_contact_method check (contact_email is not null or contact_phone is not null)
);

create table if not exists public.listing_flags (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (char_length(reason) between 10 and 280),
  created_at timestamptz not null default now(),
  unique (listing_id, reporter_id)
);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists listings_owner_id_idx on public.listings(owner_id);
create index if not exists listings_category_status_created_idx on public.listings(category, status, created_at desc);
create index if not exists listings_status_created_idx on public.listings(status, created_at desc);
create index if not exists listings_featured_idx on public.listings(is_featured, featured_until desc) where is_featured = true;
create index if not exists listings_search_document_idx on public.listings using gin(search_document);
create index if not exists listing_flags_listing_id_idx on public.listing_flags(listing_id, created_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'member'), '@', 1))
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = case
          when public.profiles.full_name = '' then excluded.full_name
          else public.profiles.full_name
        end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create or replace function public.default_listing_slug()
returns trigger
language plpgsql
as $$
begin
  if new.slug is null or btrim(new.slug) = '' then
    new.slug = public.slugify(new.title);
  else
    new.slug = public.slugify(new.slug);
  end if;

  return new;
end;
$$;

create or replace function public.protect_listing_system_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.owner_id = auth.uid();
    new.status = 'active';
    new.is_featured = false;
    new.featured_until = null;
    new.stripe_checkout_session_id = null;
    new.flag_count = 0;
  else
    new.owner_id = old.owner_id;
    new.status = old.status;
    new.is_featured = old.is_featured;
    new.featured_until = old.featured_until;
    new.stripe_checkout_session_id = old.stripe_checkout_session_id;
    new.flag_count = old.flag_count;
  end if;

  return new;
end;
$$;

create or replace function public.refresh_listing_flag_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_listing_id uuid;
  total_flags integer;
begin
  affected_listing_id := coalesce(new.listing_id, old.listing_id);

  select count(*)
  into total_flags
  from public.listing_flags
  where listing_id = affected_listing_id;

  update public.listings
  set flag_count = total_flags,
      status = case
        when status = 'removed' then status
        when total_flags > 0 then 'flagged'
        else 'active'
      end,
      updated_at = now()
  where id = affected_listing_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_listings_updated_at on public.listings;
create trigger set_listings_updated_at
before update on public.listings
for each row
execute function public.set_updated_at();

drop trigger if exists set_default_listing_slug on public.listings;
create trigger set_default_listing_slug
before insert or update on public.listings
for each row
execute function public.default_listing_slug();

drop trigger if exists protect_listing_system_fields on public.listings;
create trigger protect_listing_system_fields
before insert or update on public.listings
for each row
execute function public.protect_listing_system_fields();

drop trigger if exists refresh_listing_flag_state_after_insert on public.listing_flags;
create trigger refresh_listing_flag_state_after_insert
after insert on public.listing_flags
for each row
execute function public.refresh_listing_flag_state();

drop trigger if exists refresh_listing_flag_state_after_delete on public.listing_flags;
create trigger refresh_listing_flag_state_after_delete
after delete on public.listing_flags
for each row
execute function public.refresh_listing_flag_state();

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_flags enable row level security;

drop policy if exists "Profiles are viewable by owners and admins" on public.profiles;
create policy "Profiles are viewable by owners and admins"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "Profiles are updatable by owners and admins" on public.profiles;
create policy "Profiles are updatable by owners and admins"
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "Active listings are public" on public.listings;
create policy "Active listings are public"
on public.listings
for select
to anon, authenticated
using (status = 'active');

drop policy if exists "Owners can view their listings" on public.listings;
create policy "Owners can view their listings"
on public.listings
for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "Admins can view every listing" on public.listings;
create policy "Admins can view every listing"
on public.listings
for select
to authenticated
using (public.is_admin());

drop policy if exists "Authenticated users can create listings" on public.listings;
create policy "Authenticated users can create listings"
on public.listings
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "Owners and admins can update listings" on public.listings;
create policy "Owners and admins can update listings"
on public.listings
for update
to authenticated
using (owner_id = auth.uid() or public.is_admin())
with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists "Owners and admins can delete listings" on public.listings;
create policy "Owners and admins can delete listings"
on public.listings
for delete
to authenticated
using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "Reporters and admins can view flags" on public.listing_flags;
create policy "Reporters and admins can view flags"
on public.listing_flags
for select
to authenticated
using (reporter_id = auth.uid() or public.is_admin());

drop policy if exists "Authenticated users can create flags" on public.listing_flags;
create policy "Authenticated users can create flags"
on public.listing_flags
for insert
to authenticated
with check (
  reporter_id = auth.uid()
  and reporter_id <> (
    select owner_id
    from public.listings
    where id = listing_id
  )
);

drop policy if exists "Admins can delete flags" on public.listing_flags;
create policy "Admins can delete flags"
on public.listing_flags
for delete
to authenticated
using (public.is_admin());

comment on column public.listings.is_featured is 'Reserved for future Stripe-powered featured listing upgrades.';
comment on column public.listings.featured_until is 'Reserved for future Stripe-powered featured listing expiry.';
comment on column public.listings.stripe_checkout_session_id is 'Reserved for future Stripe checkout tracking.';

