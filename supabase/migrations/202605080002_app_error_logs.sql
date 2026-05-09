create table if not exists public.app_error_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  source text not null,
  message text not null,
  name text,
  stack text,
  pathname text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists app_error_logs_created_idx
  on public.app_error_logs(created_at desc);

create index if not exists app_error_logs_pathname_idx
  on public.app_error_logs(pathname, created_at desc);

alter table public.app_error_logs enable row level security;

drop policy if exists "Admins can view app error logs" on public.app_error_logs;
create policy "Admins can view app error logs"
on public.app_error_logs
for select
to authenticated
using (public.is_admin());

comment on table public.app_error_logs is 'Client-side application error reports captured for launch monitoring and admin review.';
