alter table public.profiles
  add column if not exists stripe_identity_verification_session_id text,
  add column if not exists stripe_identity_session_status text,
  add column if not exists stripe_identity_last_error_code text,
  add column if not exists stripe_identity_last_error_reason text;

create unique index if not exists profiles_stripe_identity_session_id_idx
  on public.profiles(stripe_identity_verification_session_id)
  where stripe_identity_verification_session_id is not null;

comment on column public.profiles.stripe_identity_verification_session_id is 'Latest Stripe Identity VerificationSession ID associated with this seller.';
comment on column public.profiles.stripe_identity_session_status is 'Latest Stripe Identity session status observed by ISMACONNECT.';
comment on column public.profiles.stripe_identity_last_error_code is 'Latest Stripe Identity verification error code, if any.';
comment on column public.profiles.stripe_identity_last_error_reason is 'Latest Stripe Identity verification error reason, if any.';
