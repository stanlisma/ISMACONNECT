-- Deactivate/reactivate is a reversible alternative to account deletion:
-- nothing is anonymized or destroyed, sign-in is just blocked and the
-- account's listings/storefronts are hidden from public view until the
-- user reactivates, at which point everything reappears exactly as it was.

alter table public.profiles
  add column if not exists deactivated_at timestamptz;

alter table public.business_storefronts
  add column if not exists is_active boolean not null default true;

-- listings.status is a plain text column (not a real enum, despite the
-- name suggesting otherwise) with no check constraint, so a new 'paused'
-- value used only for listings hidden by the owner deactivating their
-- account (distinct from 'removed', reserved for moderation action) needs
-- no schema change here. Existing status filters (`eq status active`)
-- already exclude 'paused' listings without any query changes.
