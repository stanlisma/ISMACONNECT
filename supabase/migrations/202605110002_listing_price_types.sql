alter table public.listings
  add column if not exists price_type text not null default 'flat-rate';

update public.listings
set price_type = case
  when category = 'rentals' then 'per-month'
  when category = 'ride-share' then 'per-trip'
  when category = 'jobs' then 'hourly'
  when category = 'services' then 'flat-rate'
  else 'flat-rate'
end
where price_type is null
   or price_type = ''
   or price_type = 'flat-rate';

update public.listings
set
  price = null,
  price_type = 'contact'
where category = 'services'
  and price is not null
  and price <= 1;

alter table public.listings
  drop constraint if exists listings_price_type_check;

alter table public.listings
  add constraint listings_price_type_check check (
    price_type in (
      'flat-rate',
      'hourly',
      'per-trip',
      'per-day',
      'per-week',
      'per-month',
      'contact'
    )
  );

comment on column public.listings.price_type is 'How the listing price should be interpreted publicly, such as hourly, per trip, per month, or contact for price.';
