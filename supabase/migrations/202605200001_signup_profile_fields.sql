alter table public.profiles
  add column if not exists address text,
  add column if not exists phone_verification_method text,
  add column if not exists phone_verified_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_phone_verification_method_check;

alter table public.profiles
  add constraint profiles_phone_verification_method_check check (
    phone_verification_method is null
    or phone_verification_method in ('text', 'call')
  );

comment on column public.profiles.address is 'Local address or community saved during account setup.';
comment on column public.profiles.phone_verification_method is 'Preferred phone verification method for the account: text or voice call.';
comment on column public.profiles.phone_verified_at is 'Timestamp of the last successful phone verification.';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    phone,
    address,
    phone_verification_method
  )
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      concat_ws(' ', new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'last_name'),
      split_part(coalesce(new.email, 'member'), '@', 1)
    ),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    nullif(new.raw_user_meta_data ->> 'address', ''),
    case
      when new.raw_user_meta_data ->> 'phone_verification_method' in ('text', 'call')
        then new.raw_user_meta_data ->> 'phone_verification_method'
      else null
    end
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = case
          when public.profiles.full_name = '' then excluded.full_name
          else public.profiles.full_name
        end,
        phone = case
          when coalesce(public.profiles.phone, '') = '' then excluded.phone
          else public.profiles.phone
        end,
        address = case
          when coalesce(public.profiles.address, '') = '' then excluded.address
          else public.profiles.address
        end,
        phone_verification_method = case
          when public.profiles.phone_verification_method is null then excluded.phone_verification_method
          else public.profiles.phone_verification_method
        end;

  return new;
end;
$$;
