alter table public.listings
  add column if not exists listing_intent text not null default 'offer',
  add column if not exists request_window text;

update public.listings
set listing_intent = 'offer'
where listing_intent is null;

alter table public.listings
  drop constraint if exists listings_listing_intent_check;

alter table public.listings
  add constraint listings_listing_intent_check
  check (listing_intent in ('offer', 'need'));

alter table public.listings
  drop constraint if exists listings_request_window_check;

alter table public.listings
  add constraint listings_request_window_check
  check (
    request_window is null
    or request_window in ('today', 'this-week', 'flexible')
  );

create index if not exists listings_listing_intent_idx
  on public.listings(listing_intent, created_at desc);

comment on column public.listings.listing_intent is 'Whether the post is an offer already available or a need/request looking for help.';
comment on column public.listings.request_window is 'Optional urgency/timing window for need posts, such as today or this week.';
