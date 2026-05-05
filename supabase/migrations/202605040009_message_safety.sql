create table if not exists public.blocked_users (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  reason text,
  created_at timestamptz not null default now(),
  constraint blocked_users_distinct_users check (blocker_id <> blocked_id),
  constraint blocked_users_unique_pair unique (blocker_id, blocked_id)
);

create index if not exists blocked_users_blocker_created_idx
  on public.blocked_users(blocker_id, created_at desc);

create index if not exists blocked_users_blocked_created_idx
  on public.blocked_users(blocked_id, created_at desc);

alter table public.blocked_users enable row level security;

drop policy if exists "Users and admins can view relevant blocks" on public.blocked_users;
create policy "Users and admins can view relevant blocks"
on public.blocked_users
for select
to authenticated
using (
  blocker_id = auth.uid()
  or blocked_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "Users can create their own blocks" on public.blocked_users;
create policy "Users can create their own blocks"
on public.blocked_users
for insert
to authenticated
with check (blocker_id = auth.uid());

drop policy if exists "Users and admins can delete blocks" on public.blocked_users;
create policy "Users and admins can delete blocks"
on public.blocked_users
for delete
to authenticated
using (blocker_id = auth.uid() or public.is_admin());

create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  listing_id uuid references public.listings(id) on delete set null,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_reports_distinct_users check (reporter_id <> reported_user_id),
  constraint user_reports_status_check check (status in ('open', 'resolved', 'dismissed'))
);

create unique index if not exists user_reports_unique_conversation_reporter_idx
  on public.user_reports(reporter_id, reported_user_id, conversation_id)
  where conversation_id is not null;

create index if not exists user_reports_status_created_idx
  on public.user_reports(status, created_at desc);

create index if not exists user_reports_reported_user_status_idx
  on public.user_reports(reported_user_id, status, created_at desc);

drop trigger if exists set_user_reports_updated_at on public.user_reports;
create trigger set_user_reports_updated_at
before update on public.user_reports
for each row
execute function public.set_updated_at();

alter table public.user_reports enable row level security;

drop policy if exists "Reporters and admins can view reports" on public.user_reports;
create policy "Reporters and admins can view reports"
on public.user_reports
for select
to authenticated
using (reporter_id = auth.uid() or public.is_admin());

drop policy if exists "Users can create reports" on public.user_reports;
create policy "Users can create reports"
on public.user_reports
for insert
to authenticated
with check (reporter_id = auth.uid());

drop policy if exists "Admins can update reports" on public.user_reports;
create policy "Admins can update reports"
on public.user_reports
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Reporters can update their own reports" on public.user_reports;
create policy "Reporters can update their own reports"
on public.user_reports
for update
to authenticated
using (reporter_id = auth.uid())
with check (reporter_id = auth.uid());

comment on table public.blocked_users is 'User-level messaging blocks between marketplace members.';
comment on table public.user_reports is 'Conversation-level reports for trust and safety review.';
