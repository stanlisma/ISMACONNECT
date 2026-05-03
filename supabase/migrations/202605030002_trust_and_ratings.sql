do $$
begin
  if not exists (select 1 from pg_type where typname = 'profile_verification_status') then
    create type public.profile_verification_status as enum ('unverified', 'pending', 'verified');
  end if;
end
$$;

alter table public.profiles
  add column if not exists verification_status public.profile_verification_status not null default 'unverified',
  add column if not exists verification_requested_at timestamptz,
  add column if not exists verified_at timestamptz;

create table if not exists public.seller_reviews (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) between 10 and 280),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seller_reviews_unique_listing_reviewer unique (reviewer_id, listing_id),
  constraint seller_reviews_distinct_users check (seller_id <> reviewer_id)
);

create index if not exists profiles_verification_status_idx
  on public.profiles(verification_status, verification_requested_at desc);

create index if not exists seller_reviews_seller_created_idx
  on public.seller_reviews(seller_id, created_at desc);

create index if not exists seller_reviews_listing_idx
  on public.seller_reviews(listing_id, created_at desc);

create or replace function public.enforce_seller_review_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  listing_owner_id uuid;
begin
  select owner_id
  into listing_owner_id
  from public.listings
  where id = new.listing_id;

  if listing_owner_id is null then
    raise exception 'Listing not found for review.';
  end if;

  if listing_owner_id = new.reviewer_id then
    raise exception 'You cannot rate your own listing.';
  end if;

  new.seller_id = listing_owner_id;
  return new;
end;
$$;

drop trigger if exists set_seller_reviews_updated_at on public.seller_reviews;
create trigger set_seller_reviews_updated_at
before update on public.seller_reviews
for each row
execute function public.set_updated_at();

drop trigger if exists enforce_seller_review_owner on public.seller_reviews;
create trigger enforce_seller_review_owner
before insert or update on public.seller_reviews
for each row
execute function public.enforce_seller_review_owner();

create or replace function public.get_seller_trust_summaries(seller_ids uuid[])
returns table (
  seller_id uuid,
  verification_status public.profile_verification_status,
  verified_at timestamptz,
  average_rating numeric,
  review_count integer,
  top_rated boolean,
  member_since timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    profiles.id as seller_id,
    profiles.verification_status,
    profiles.verified_at,
    round(avg(seller_reviews.rating)::numeric, 2) as average_rating,
    count(seller_reviews.id)::int as review_count,
    (
      count(seller_reviews.id) >= 3
      and avg(seller_reviews.rating) >= 4.5
    ) as top_rated,
    profiles.created_at as member_since
  from public.profiles
  left join public.seller_reviews
    on seller_reviews.seller_id = profiles.id
  where profiles.id = any(seller_ids)
  group by profiles.id, profiles.verification_status, profiles.verified_at, profiles.created_at;
$$;

alter table public.seller_reviews enable row level security;

drop policy if exists "Sellers, reviewers, and admins can view reviews" on public.seller_reviews;
create policy "Sellers, reviewers, and admins can view reviews"
on public.seller_reviews
for select
to authenticated
using (
  reviewer_id = auth.uid()
  or seller_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "Authenticated users can create seller reviews" on public.seller_reviews;
create policy "Authenticated users can create seller reviews"
on public.seller_reviews
for insert
to authenticated
with check (reviewer_id = auth.uid());

drop policy if exists "Admins can delete seller reviews" on public.seller_reviews;
create policy "Admins can delete seller reviews"
on public.seller_reviews
for delete
to authenticated
using (public.is_admin());

comment on column public.profiles.verification_status is 'Public seller verification status used for trust badges.';
comment on table public.seller_reviews is 'Per-listing seller ratings submitted by buyers or interested members after contact.';
