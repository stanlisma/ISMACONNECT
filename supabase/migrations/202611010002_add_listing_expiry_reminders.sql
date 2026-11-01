-- Remembers which expires_at value an owner has already been reminded about,
-- so the daily reminder job sends one reminder per expiry, not one per day.
-- Renewing a listing changes expires_at, which naturally makes it eligible for
-- a fresh reminder next time round.

alter table public.listings
  add column if not exists expiry_reminded_for timestamptz;
