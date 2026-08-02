alter table public.listings
  add column if not exists expires_at timestamptz;

create index if not exists listings_expires_at_idx
  on public.listings (expires_at)
  where status = 'active' and expires_at is not null;

create or replace function public.expire_listings()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.listings
  set status = 'paused',
      updated_at = now()
  where status = 'active'
    and expires_at is not null
    and expires_at <= now();
end;
$$;

grant execute on function public.expire_listings() to anon, authenticated, service_role;
