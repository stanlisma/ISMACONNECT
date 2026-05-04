-- Local-only demo seed data for ISMACONNECT
-- Demo credentials:
--   admin@ismaconnect.local / Password123!
--   sarah@ismaconnect.local / Password123!
--   devin@ismaconnect.local / Password123!

create or replace function public.create_seed_user(
  seed_user_id uuid,
  seed_user_email text,
  seed_user_password text,
  seed_user_name text
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not exists (
    select 1
    from auth.users
    where id = seed_user_id
  ) then
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      invited_at,
      confirmation_token,
      confirmation_sent_at,
      recovery_token,
      recovery_sent_at,
      email_change_token_new,
      email_change,
      email_change_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      confirmed_at,
      email_change_token_current,
      email_change_confirm_status,
      banned_until,
      reauthentication_token,
      reauthentication_sent_at,
      is_sso_user,
      deleted_at
    )
    values (
      '00000000-0000-0000-0000-000000000000',
      seed_user_id,
      'authenticated',
      'authenticated',
      seed_user_email,
      crypt(seed_user_password, gen_salt('bf')),
      now(),
      now(),
      '',
      now(),
      '',
      null,
      '',
      '',
      null,
      now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', seed_user_name),
      false,
      now(),
      now(),
      now(),
      '',
      0,
      null,
      '',
      null,
      false,
      null
    );
  end if;

  if not exists (
    select 1
    from auth.identities
    where user_id = seed_user_id
      and provider = 'email'
  ) then
    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    values (
      gen_random_uuid(),
      seed_user_id,
      jsonb_build_object(
        'sub', seed_user_id::text,
        'email', seed_user_email,
        'email_verified', true
      ),
      'email',
      seed_user_id::text,
      now(),
      now(),
      now()
    );
  end if;
end;
$$;

select public.create_seed_user(
  '11111111-1111-4111-8111-111111111111',
  'admin@ismaconnect.local',
  'Password123!',
  'ISMACONNECT Admin'
);

select public.create_seed_user(
  '22222222-2222-4222-8222-222222222222',
  'sarah@ismaconnect.local',
  'Password123!',
  'Sarah Thompson'
);

select public.create_seed_user(
  '33333333-3333-4333-8333-333333333333',
  'devin@ismaconnect.local',
  'Password123!',
  'Devin Richards'
);

update public.profiles
set role = 'admin'
where id = '11111111-1111-4111-8111-111111111111';

insert into public.listings (
  owner_id,
  title,
  slug,
  category,
  description,
  price,
  location,
  contact_name,
  contact_email,
  contact_phone,
  image_url,
  is_featured,
  featured_until,
  boosted_at,
  boosted_until,
  is_urgent,
  urgent_until,
  status
)
values
  (
    '22222222-2222-4222-8222-222222222222',
    'Private room in Thickwood with parking',
    'private-room-in-thickwood-with-parking',
    'rentals',
    'Quiet furnished room in Thickwood with parking, shared kitchen access, fast Wi-Fi, and flexible move-in dates for local workers or students.',
    825,
    'Thickwood, Fort McMurray',
    'Sarah Thompson',
    'sarah@ismaconnect.local',
    '780-555-0110',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    true,
    now() + interval '30 days',
    now() - interval '12 hours',
    now() + interval '3 days',
    false,
    null,
    'active'
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'Daily morning ride from Timberlea to site gate',
    'daily-morning-ride-from-timberlea-to-site-gate',
    'ride-share',
    'Reliable weekday ride-share leaving Timberlea at 5:15 AM with room for two passengers and safety gear storage.',
    20,
    'Timberlea, Fort McMurray',
    'Devin Richards',
    'devin@ismaconnect.local',
    '780-555-0112',
    'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80',
    false,
    null,
    now() - interval '3 hours',
    now() + interval '2 days',
    true,
    now() + interval '5 days',
    'active'
  ),
  (
    '11111111-1111-4111-8111-111111111111',
    'Hiring weekend barista for downtown cafe',
    'hiring-weekend-barista-for-downtown-cafe',
    'jobs',
    'Busy downtown cafe is hiring a weekend barista with customer service experience, cash handling skills, and reliable transportation.',
    19,
    'Downtown Fort McMurray',
    'ISMACONNECT Admin',
    'admin@ismaconnect.local',
    '780-555-0100',
    'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=1200&q=80',
    false,
    null,
    null,
    null,
    true,
    now() + interval '7 days',
    'active'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'Move-out cleaning and same-day touch ups',
    'move-out-cleaning-and-same-day-touch-ups',
    'services',
    'Professional move-out cleaning for apartments, shared rooms, and townhomes with evening and weekend availability across Fort McMurray.',
    140,
    'Fort McMurray, AB',
    'Sarah Thompson',
    'sarah@ismaconnect.local',
    '780-555-0110',
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80',
    false,
    null,
    null,
    null,
    false,
    null,
    'active'
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'Like-new snow tires set with rims',
    'like-new-snow-tires-set-with-rims',
    'buy-sell',
    'Set of four winter tires with rims, lightly used for one season and stored indoors. Fits many midsize SUVs.',
    650,
    'Abasand, Fort McMurray',
    'Devin Richards',
    'devin@ismaconnect.local',
    '780-555-0112',
    'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=80',
    false,
    null,
    null,
    null,
    false,
    null,
    'active'
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'Advance cash rent deposit guarantee',
    'advance-cash-rent-deposit-guarantee',
    'services',
    'Send an upfront e-transfer today and a guaranteed rental approval letter will be delivered later tonight.',
    250,
    'Fort McMurray, AB',
    'Devin Richards',
    'devin@ismaconnect.local',
    '780-555-0112',
    null,
    false,
    null,
    null,
    null,
    false,
    null,
    'active'
  )
on conflict (slug) do update
set
  title = excluded.title,
  category = excluded.category,
  description = excluded.description,
  price = excluded.price,
  location = excluded.location,
  contact_name = excluded.contact_name,
  contact_email = excluded.contact_email,
  contact_phone = excluded.contact_phone,
  image_url = excluded.image_url,
  is_featured = excluded.is_featured,
  featured_until = excluded.featured_until,
  boosted_at = excluded.boosted_at,
  boosted_until = excluded.boosted_until,
  is_urgent = excluded.is_urgent,
  urgent_until = excluded.urgent_until,
  status = excluded.status;

insert into public.listing_boost_orders (
  listing_id,
  owner_id,
  product_key,
  product_name,
  product_description,
  amount_cents,
  currency,
  status,
  provider,
  applied_at,
  expires_at
)
select
  listings.id,
  listings.owner_id,
  seed.product_key,
  seed.product_name,
  seed.product_description,
  seed.amount_cents,
  'cad',
  'active',
  'manual',
  now() - interval '12 hours',
  seed.expires_at
from public.listings
join (
  values
    (
      'private-room-in-thickwood-with-parking',
      'featured_spotlight_7d',
      'Featured Spotlight',
      'Homepage and category priority boost for 7 days.',
      1490,
      now() + interval '30 days'
    ),
    (
      'daily-morning-ride-from-timberlea-to-site-gate',
      'top_boost_3d',
      'Top Boost',
      'Top-of-feed boost for the next few days.',
      790,
      now() + interval '2 days'
    )
) as seed(slug, product_key, product_name, product_description, amount_cents, expires_at)
  on seed.slug = listings.slug
where not exists (
  select 1
  from public.listing_boost_orders
  where listing_boost_orders.listing_id = listings.id
    and listing_boost_orders.product_key = seed.product_key
    and listing_boost_orders.status = 'active'
);

insert into public.listing_flags (listing_id, reporter_id, reason)
select
  listings.id,
  '22222222-2222-4222-8222-222222222222',
  'This listing asks for advance payment with no verification and should be reviewed.'
from public.listings
where slug = 'advance-cash-rent-deposit-guarantee'
on conflict (listing_id, reporter_id) do nothing;

insert into public.saved_searches (
  user_id,
  path,
  search_query,
  category,
  subcategory,
  min_price,
  max_price,
  sort,
  signature,
  last_checked_at
)
values
  (
    '22222222-2222-4222-8222-222222222222',
    '/categories/rentals',
    'room',
    'rentals',
    null,
    null,
    1300,
    null,
    '{"path":"/categories/rentals","search":"room","category":"rentals","subcategory":null,"minPrice":null,"maxPrice":1300,"sort":null}',
    now() - interval '2 days'
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    '/browse',
    null,
    'buy-sell',
    'tools-equipment',
    50,
    500,
    'price_asc',
    '{"path":"/browse","search":null,"category":"buy-sell","subcategory":"tools-equipment","minPrice":50,"maxPrice":500,"sort":"price_asc"}',
    now() - interval '1 day'
  )
on conflict (user_id, signature) do update
set
  path = excluded.path,
  search_query = excluded.search_query,
  category = excluded.category,
  subcategory = excluded.subcategory,
  min_price = excluded.min_price,
  max_price = excluded.max_price,
  sort = excluded.sort,
  last_checked_at = excluded.last_checked_at;

update public.profiles
set
  verification_status = 'verified',
  verification_requested_at = null,
  verified_at = now()
where email in ('admin@ismaconnect.local', 'sarah@ismaconnect.local');

update public.profiles
set
  verification_status = 'pending',
  verification_requested_at = now() - interval '3 days',
  verified_at = null
where email = 'devin@ismaconnect.local';

insert into public.seller_reviews (
  seller_id,
  reviewer_id,
  listing_id,
  rating,
  comment
)
select
  listings.owner_id,
  review_seed.reviewer_id,
  listings.id,
  review_seed.rating,
  review_seed.comment
from (
  values
    ('11111111-1111-4111-8111-111111111111'::uuid, 'private-room-in-thickwood-with-parking', 5, 'Clear details, quick replies, and exactly as described.'),
    ('11111111-1111-4111-8111-111111111111'::uuid, 'move-out-cleaning-and-same-day-touch-ups', 5, 'Professional communication and very reliable from start to finish.'),
    ('33333333-3333-4333-8333-333333333333'::uuid, 'private-room-in-thickwood-with-parking', 4, 'Smooth local deal and accurate listing information.'),
    ('22222222-2222-4222-8222-222222222222'::uuid, 'daily-morning-ride-from-timberlea-to-site-gate', 5, 'Showed up on time and made coordination easy.')
) as review_seed(reviewer_id, listing_slug, rating, comment)
join public.listings
  on listings.slug = review_seed.listing_slug
on conflict (reviewer_id, listing_id) do update
set
  seller_id = excluded.seller_id,
  rating = excluded.rating,
  comment = excluded.comment,
  updated_at = now();

drop function if exists public.create_seed_user(uuid, text, text, text);
