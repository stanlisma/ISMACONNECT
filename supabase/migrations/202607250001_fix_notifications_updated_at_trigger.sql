-- The notifications table never got an `updated_at` column, but a
-- `set_notifications_updated_at` trigger calling the shared `set_updated_at()`
-- function was applied to it directly via the SQL editor (never tracked in a
-- migration). Every UPDATE on `notifications` — including "mark as read" —
-- has been silently failing ever since: the trigger throws
-- `record "new" has no field "updated_at"`, and the app's Supabase client
-- calls don't check the returned error, so it looked like nothing happened.
--
-- Nothing in the app reads or writes notifications.updated_at, so the fix is
-- to drop the errant trigger rather than add an unused column.

drop trigger if exists set_notifications_updated_at on public.notifications;
