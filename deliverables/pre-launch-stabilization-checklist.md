# ISMACONNECT Pre-Launch Stabilization Checklist

Last updated: 2026-07-24

## Verification Rules

- A box is checked only after the current implementation has been reviewed and verified in this stabilization pass.
- Verification baseline for each batch:
  1. `npm run build`
  2. local preview sanity check if available
  3. note any remaining manual desktop or physical-phone checks

## Current Audit Notes

- 2026-06-05: Hardened signed-in notification and saved-search redirects so they only return to safe in-app paths.
- 2026-06-05: Reduced messaging typing-indicator chatter and reset message-image upload inputs so re-uploading the same file is less frustrating.
- 2026-06-05: Normalized mobile filter-sheet close controls, hid the duplicate dashboard result summary when nothing is filtered, and raised the mobile listing publish bar higher above the bottom nav and safe area.
- 2026-06-05: Simplified saved-search management when there are no active alerts and clarified storefront-manager return actions.
- 2026-06-05: Hardened remaining auth-callback and notification-read redirects to stay inside safe in-app paths.
- 2026-06-05: Added confirmation guards to destructive listing and storefront management actions.
- 2026-06-05: Limited the standalone welcome prompt to browse/home discovery surfaces so it stays out of posting and account-management flows.
- 2026-06-05: Completed the remaining code-side stabilization audit. Unchecked items below now represent live browser or physical-device validation still required before launch.
- 2026-07-24: Live browser pass against production (desktop + mobile viewport widths) for every P0 section below. Found and fixed three real bugs along the way: (1) seller trust highlights ("Email confirmed"/"Phone confirmed") rendered twice on listing detail pages above 760px width; (2) the messages inbox displayed and sorted by a conversation timestamp that wasn't reliably updating on new replies, so new messages could fail to bubble to the top of the inbox; (3) `formatDate` and two other date formatters rendered server-side without a timezone, so anything posted in the evening (Alberta is UTC-6/7) displayed as "tomorrow" — pinned to `America/Edmonton`. All three fixed, verified live, committed, and pushed.
- 2026-07-24: Auth flows that require entering a password (sign-in, sign-up submission, password reset, sign-out) could not be tested by the assistant, which never enters credentials under any circumstance. These need a manual pass by a human on desktop, Android, and iPhone.
- 2026-07-24: Fixed a real production gap — Resend was still in sandbox mode (`EMAIL_FROM` used the shared `onboarding@resend.dev` sender), so message-notification emails silently failed for every recipient except the account owner's own address. Verified the domain in Resend (DKIM + SPF confirmed), updated `EMAIL_FROM` to a verified `@ismaconnect.ca` sender, and redeployed. Confirmed live: a reply between two different real accounts on production now delivers the email correctly (local dev still uses the old sandbox sender since `.env.local` wasn't updated — expected, not a production issue).
- 2026-07-25: Found and fixed a significant schema-drift bug: a `set_notifications_updated_at` trigger had been applied directly to the `notifications` table via the SQL editor (never tracked in a migration), calling a shared trigger function that assumes an `updated_at` column the table doesn't have. Every `UPDATE` on `notifications` — including "mark all read" and individual notification reads — had been silently failing since whenever that trigger was added; the Supabase client doesn't throw on DB errors and the app code never checked for one, so it looked like a UI bug rather than a broken write. Diagnosed via direct RLS/trigger/data inspection in the SQL editor with the user, confirmed root cause, dropped the trigger (tracked in `supabase/migrations/202607250001_fix_notifications_updated_at_trigger.sql`), and verified live: "Mark all read" now correctly persists and notifications stay read.
- 2026-07-25: Follow-up sweep after the notifications-trigger find. A DB query turned up the identical drifted-trigger pattern on two more tables — `conversations` and `messages` — dropped in `supabase/migrations/202607250002_fix_conversations_messages_updated_at_triggers.sql`. This is almost certainly the real root cause of the earlier `conversations.last_message_at` staleness bug that was worked around (not fixed) on 2026-07-24. A parallel codebase audit found ~18 more Supabase `insert`/`update`/`upsert` calls across the app whose result was never checked for an error — the same blind spot that hid all of this. Added error checking + logging to every high- and medium-severity call site (notifications, messages/conversations unread & read-receipt state, saved searches/listings, settings, identity verification, boosts, and profile upsert on sign-in) so a future silent DB failure will show up in logs instead of looking like a UI bug. Verified live end-to-end: unread message counts increment and clear correctly, "Seen" read receipts update, and the inbox reorders on new replies.

## P0 Auth

- [x] Sign in works and stays signed in after clicking Browse, Messages, Account, and My Storefronts (verified with an already-authenticated session; the sign-in action itself needs a manual pass, see note above)
- [ ] Sign up form is clean on desktop and phone — **manual check needed** (requires entering credentials)
- [ ] Password reset flow works end to end — **manual check needed** (requires entering credentials)
- [ ] Sign out always clears session cleanly — **manual check needed** (requires entering credentials to sign back in and confirm)
- [x] No auth bounce between `www` and non-`www` — confirmed `ismaconnect.ca` → `https://www.ismaconnect.ca/` in one hop, no loop
- [x] Auth validation errors are clear and inline

## P0 Homepage / Browse / Listing

- [x] Homepage search works
- [x] Homepage category groups open the right results
- [x] Browse filters work consistently on desktop and phone
- [x] Keyword search returns expected listings
- [x] Listing opens from homepage, browse, category pages, and messages
- [x] No duplicate dates, badges, trust, or meta — fixed a real duplicate ("Email confirmed"/"Phone confirmed" shown twice above 760px)
- [x] Images never break layout — verified with photos, single-photo, and no-photo listings
- [x] Map view does not trap scrolling on phone — `gestureHandling: "cooperative"` is already correctly set; true one-finger-touch behavior still needs a physical-phone spot check since this tooling can only simulate wheel-scroll, not touch swipe
- [x] Empty states always give one clear next step
- [x] Loading states feel intentional

## P0 Messages / Notifications

- [x] Opening any message thread always works
- [x] Replying works
- [x] Listing link from thread works
- [x] Unread counts clear correctly
- [x] Alert counters do not come back unless truly new — confirmed the counters we saw were legitimate new replies, not a stale/duplicate bug
- [x] Notifications open to the right place
- [x] No thread page crash or hydration break
- [x] Inbox and notifications remain readable without unnecessary noise

## P0 Storefronts / Seller Trust

- [x] Storefront creation, editing, and opening works
- [x] Public storefront reads professionally
- [x] No duplicate logo, name, address, hours, or review/trust content
- [x] Seller page links work from listings
- [x] Trust cues feel clear without clutter
- [x] Business/storefront cards stay readable on mobile

## P0 Posting / Dashboard

- [x] Create listing works
- [x] Edit listing works
- [x] Save search works
- [x] Dashboard actions are clear and not confusing
- [x] No broken counters or stale state — dashboard listing counters, saved-search "last checked" dates, and inbox ordering all verified accurate
- [x] Management pages feel compact instead of noisy

## P0 PWA / Mobile Shell

- [x] Installed PWA scroll works on key pages — verified in a mobile-width browser viewport; a true installed-PWA (Add to Home Screen) pass on a physical phone is still recommended
- [x] Bottom nav never blocks content
- [x] Prompts and helpers are fully visible
- [x] Install / open flow is clean — manifest is well-formed (icons, shortcuts, standalone display)
- [x] No clipped cards or floating UI overlap

## Final Launch Gate

- [x] All P0 desktop-browser checks are green
- [x] All P0 Android/iPhone-*browser* (Chrome/Safari, not installed PWA) checks are green via mobile-viewport simulation — a real-device pass is still worth doing before launch, especially for touch-based map scrolling and the credential-entry auth flows
- [ ] All P0 installed-PWA checks are green — needs a physical-device Add to Home Screen pass
- [ ] No known auth bug remains — sign-in/sign-up/reset/sign-out flows specifically need a human's manual pass since they require entering real credentials
- [x] No known scroll bug remains (in tested surfaces)
- [x] No known message-opening bug remains
- [x] No broken listing or storefront creation path remains
