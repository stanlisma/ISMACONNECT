-- Same schema-drift bug as 202607250001, found on two more tables via a
-- follow-up audit: set_conversations_updated_at and set_messages_updated_at
-- were applied directly via the SQL editor, calling the shared
-- set_updated_at() function against tables that never had an updated_at
-- column. Every UPDATE on conversations (unread counts, last_message_at,
-- typing indicators) and messages (seen_at read receipts) has been silently
-- failing. This is almost certainly the root cause of an earlier bug this
-- project worked around rather than fixed: conversations.last_message_at
-- never updating on new replies, causing the inbox to sort/display stale
-- timestamps.
--
-- Nothing in the app reads or writes an updated_at column on either table,
-- so the fix is to drop the errant triggers, same as notifications.

drop trigger if exists set_conversations_updated_at on public.conversations;
drop trigger if exists set_messages_updated_at on public.messages;
