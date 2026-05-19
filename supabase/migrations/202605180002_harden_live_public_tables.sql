create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.role = 'user';
    new.verification_status = 'unverified';
    new.verification_requested_at = null;
    new.verified_at = null;
    new.stripe_identity_verification_session_id = null;
    new.stripe_identity_session_status = null;
    new.stripe_identity_last_error_code = null;
    new.stripe_identity_last_error_reason = null;
  else
    new.id = old.id;
    new.role = old.role;
    new.created_at = old.created_at;
    new.verification_status = old.verification_status;
    new.verification_requested_at = old.verification_requested_at;
    new.verified_at = old.verified_at;
    new.stripe_identity_verification_session_id = old.stripe_identity_verification_session_id;
    new.stripe_identity_session_status = old.stripe_identity_session_status;
    new.stripe_identity_last_error_code = old.stripe_identity_last_error_code;
    new.stripe_identity_last_error_reason = old.stripe_identity_last_error_reason;
  end if;

  return new;
end;
$$;

create or replace function public.protect_conversation_core_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    new.id = old.id;
    new.listing_id = old.listing_id;
    new.buyer_id = old.buyer_id;
    new.seller_id = old.seller_id;
    new.created_at = old.created_at;
  end if;

  return new;
end;
$$;

create or replace function public.protect_message_mutable_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    new.id = old.id;
    new.conversation_id = old.conversation_id;
    new.sender_id = old.sender_id;
    new.body = old.body;
    new.image_url = old.image_url;
    new.created_at = old.created_at;
  end if;

  return new;
end;
$$;

create or replace function public.protect_notification_mutable_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    new.id = old.id;
    new.user_id = old.user_id;
    new.type = old.type;
    new.title = old.title;
    new.body = old.body;
    new.link = old.link;
    new.created_at = old.created_at;
  end if;

  return new;
end;
$$;

do $$
begin
  if exists (
    select 1
    from pg_tables
    where schemaname = 'public'
      and tablename = 'profiles'
  ) then
    execute 'alter table public.profiles enable row level security';
    execute 'drop trigger if exists protect_profile_privileged_fields on public.profiles';
    execute 'create trigger protect_profile_privileged_fields before insert or update on public.profiles for each row execute function public.protect_profile_privileged_fields()';
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from pg_tables
    where schemaname = 'public'
      and tablename = 'listings'
  ) then
    execute 'alter table public.listings enable row level security';
    execute 'drop policy if exists "Allow public view updates" on public.listings';
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from pg_tables
    where schemaname = 'public'
      and tablename = 'listing_views'
  ) then
    execute 'alter table public.listing_views enable row level security';
    execute 'drop policy if exists "Allow insert listing views" on public.listing_views';
    execute 'drop policy if exists "Allow read listing views" on public.listing_views';
    execute 'drop policy if exists "Anyone can create listing views" on public.listing_views';
    execute 'drop policy if exists "Owners and admins can view listing views" on public.listing_views';

    execute $policy$
      create policy "Visitors can create listing views"
      on public.listing_views
      for insert
      to anon, authenticated
      with check (
        (
          auth.uid() is not null
          and viewer_id = auth.uid()
          and visitor_key is null
        )
        or (
          auth.uid() is null
          and viewer_id is null
          and visitor_key is not null
        )
      )
    $policy$;

    execute $policy$
      create policy "Owners and admins can view listing views"
      on public.listing_views
      for select
      to authenticated
      using (
        public.is_admin()
        or exists (
          select 1
          from public.listings
          where listings.id = listing_views.listing_id
            and listings.owner_id = auth.uid()
        )
      )
    $policy$;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from pg_tables
    where schemaname = 'public'
      and tablename = 'conversations'
  ) then
    execute 'alter table public.conversations enable row level security';
    execute 'drop trigger if exists protect_conversation_core_fields on public.conversations';
    execute 'create trigger protect_conversation_core_fields before update on public.conversations for each row execute function public.protect_conversation_core_fields()';

    execute 'drop policy if exists "Authenticated users can create conversations" on public.conversations';
    execute 'drop policy if exists "Authenticated users can create conversations they are part of" on public.conversations';
    execute 'drop policy if exists "Conversation participants can update conversations" on public.conversations';
    execute 'drop policy if exists "Conversation participants can view conversations" on public.conversations';
    execute 'drop policy if exists "Participants can update their conversations" on public.conversations';
    execute 'drop policy if exists "Participants can view their conversations" on public.conversations';

    execute $policy$
      create policy "Buyers can create conversations for real listings"
      on public.conversations
      for insert
      to authenticated
      with check (
        auth.uid() = buyer_id
        and buyer_id <> seller_id
        and exists (
          select 1
          from public.listings
          where listings.id = conversations.listing_id
            and listings.owner_id = conversations.seller_id
            and listings.status = 'active'
        )
      )
    $policy$;

    execute $policy$
      create policy "Participants and admins can view conversations"
      on public.conversations
      for select
      to authenticated
      using (
        buyer_id = auth.uid()
        or seller_id = auth.uid()
        or public.is_admin()
      )
    $policy$;

    execute $policy$
      create policy "Participants and admins can update conversations"
      on public.conversations
      for update
      to authenticated
      using (
        buyer_id = auth.uid()
        or seller_id = auth.uid()
        or public.is_admin()
      )
      with check (
        buyer_id = auth.uid()
        or seller_id = auth.uid()
        or public.is_admin()
      )
    $policy$;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from pg_tables
    where schemaname = 'public'
      and tablename = 'messages'
  ) then
    execute 'alter table public.messages enable row level security';
    execute 'drop trigger if exists protect_message_mutable_fields on public.messages';
    execute 'create trigger protect_message_mutable_fields before update on public.messages for each row execute function public.protect_message_mutable_fields()';

    execute 'drop policy if exists "Conversation participants can create messages" on public.messages';
    execute 'drop policy if exists "Conversation participants can update messages" on public.messages';
    execute 'drop policy if exists "Conversation participants can view messages" on public.messages';
    execute 'drop policy if exists "Participants can send messages in their conversations" on public.messages';
    execute 'drop policy if exists "Participants can view messages in their conversations" on public.messages';

    execute $policy$
      create policy "Participants can send messages in their conversations"
      on public.messages
      for insert
      to authenticated
      with check (
        auth.uid() = sender_id
        and exists (
          select 1
          from public.conversations
          where conversations.id = messages.conversation_id
            and (
              conversations.buyer_id = auth.uid()
              or conversations.seller_id = auth.uid()
            )
        )
      )
    $policy$;

    execute $policy$
      create policy "Participants and admins can view messages"
      on public.messages
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.conversations
          where conversations.id = messages.conversation_id
            and (
              conversations.buyer_id = auth.uid()
              or conversations.seller_id = auth.uid()
              or public.is_admin()
            )
        )
      )
    $policy$;

    execute $policy$
      create policy "Participants and admins can update messages"
      on public.messages
      for update
      to authenticated
      using (
        exists (
          select 1
          from public.conversations
          where conversations.id = messages.conversation_id
            and (
              conversations.buyer_id = auth.uid()
              or conversations.seller_id = auth.uid()
              or public.is_admin()
            )
        )
      )
      with check (
        exists (
          select 1
          from public.conversations
          where conversations.id = messages.conversation_id
            and (
              conversations.buyer_id = auth.uid()
              or conversations.seller_id = auth.uid()
              or public.is_admin()
            )
        )
      )
    $policy$;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from pg_tables
    where schemaname = 'public'
      and tablename = 'notifications'
  ) then
    execute 'alter table public.notifications enable row level security';
    execute 'drop trigger if exists protect_notification_mutable_fields on public.notifications';
    execute 'create trigger protect_notification_mutable_fields before update on public.notifications for each row execute function public.protect_notification_mutable_fields()';

    execute 'drop policy if exists "Authenticated users can create notifications" on public.notifications';
    execute 'drop policy if exists "System can insert notifications" on public.notifications';
    execute 'drop policy if exists "Users can update own notifications" on public.notifications';
    execute 'drop policy if exists "Users can update their notifications" on public.notifications';
    execute 'drop policy if exists "Users can view own notifications" on public.notifications';
    execute 'drop policy if exists "Users can view their notifications" on public.notifications';
    execute 'drop policy if exists "Users can delete their notifications" on public.notifications';

    execute $policy$
      create policy "Users and admins can view notifications"
      on public.notifications
      for select
      to authenticated
      using (
        user_id = auth.uid()
        or public.is_admin()
      )
    $policy$;

    execute $policy$
      create policy "Users and admins can update notifications"
      on public.notifications
      for update
      to authenticated
      using (
        user_id = auth.uid()
        or public.is_admin()
      )
      with check (
        user_id = auth.uid()
        or public.is_admin()
      )
    $policy$;

    execute $policy$
      create policy "Users and admins can delete notifications"
      on public.notifications
      for delete
      to authenticated
      using (
        user_id = auth.uid()
        or public.is_admin()
      )
    $policy$;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from pg_tables
    where schemaname = 'public'
      and tablename = 'saved_listings'
  ) then
    execute 'alter table public.saved_listings enable row level security';
    execute 'drop policy if exists "Users can create their saved listings" on public.saved_listings';
    execute 'drop policy if exists "Users can delete their saved listings" on public.saved_listings';
    execute 'drop policy if exists "Users can save listings" on public.saved_listings';
    execute 'drop policy if exists "Users can unsave listings" on public.saved_listings';
    execute 'drop policy if exists "Users can view own saved listings" on public.saved_listings';
    execute 'drop policy if exists "Users can view their saved listings" on public.saved_listings';

    execute $policy$
      create policy "Users can view their saved listings"
      on public.saved_listings
      for select
      to authenticated
      using (user_id = auth.uid())
    $policy$;

    execute $policy$
      create policy "Users can save listings"
      on public.saved_listings
      for insert
      to authenticated
      with check (user_id = auth.uid())
    $policy$;

    execute $policy$
      create policy "Users can unsave listings"
      on public.saved_listings
      for delete
      to authenticated
      using (user_id = auth.uid())
    $policy$;
  end if;
end
$$;
