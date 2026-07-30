-- dismissAppErrorLogAction falls back to the RLS-respecting client when the
-- service-role key isn't configured, but no DELETE policy existed for this
-- table - that fallback path would silently delete 0 rows and report
-- success without actually dismissing anything.

drop policy if exists "Admins can delete app error logs" on public.app_error_logs;

create policy "Admins can delete app error logs"
on public.app_error_logs
for delete
to authenticated
using (public.is_admin());
