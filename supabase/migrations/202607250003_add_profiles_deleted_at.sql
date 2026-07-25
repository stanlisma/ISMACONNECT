-- Self-service account deletion needs a way to mark a profile as
-- deactivated while still retaining the row (soft delete) — the app
-- keeps conversations, reviews, and payment/boost records tied to a
-- deleted user's id for dispute and fraud-prevention purposes, per the
-- Privacy Policy's data-retention section, while anonymizing the
-- personally-identifying fields and hiding the account's listings and
-- storefronts.

alter table public.profiles
  add column if not exists deleted_at timestamptz;
