-- Admin-initiated suspension is distinct from self-service deactivation:
-- it locks sign-in via a Supabase auth ban (not just a profile flag), so
-- only an admin restoring the account can lift it, and it records why.

alter table public.profiles
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_reason text;
