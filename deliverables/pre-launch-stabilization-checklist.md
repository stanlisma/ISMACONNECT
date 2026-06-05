# ISMACONNECT Pre-Launch Stabilization Checklist

Last updated: 2026-06-05

## Verification Rules

- A box is checked only after the current implementation has been reviewed and verified in this stabilization pass.
- Verification baseline for each batch:
  1. `npm run build`
  2. local preview sanity check if available
  3. note any remaining manual desktop or physical-phone checks

## P0 Auth

- [ ] Sign in works and stays signed in after clicking Browse, Messages, Account, and My Storefronts
- [ ] Sign up form is clean on desktop and phone
- [ ] Password reset flow works end to end
- [ ] Sign out always clears session cleanly
- [ ] No auth bounce between `www` and non-`www`
- [x] Auth validation errors are clear and inline

## P0 Homepage / Browse / Listing

- [ ] Homepage search works
- [ ] Homepage category groups open the right results
- [ ] Browse filters work consistently on desktop and phone
- [ ] Keyword search returns expected listings
- [ ] Listing opens from homepage, browse, category pages, and messages
- [ ] No duplicate dates, badges, trust, or meta
- [ ] Images never break layout
- [ ] Map view does not trap scrolling on phone
- [x] Empty states always give one clear next step
- [x] Loading states feel intentional

## P0 Messages / Notifications

- [ ] Opening any message thread always works
- [ ] Replying works
- [ ] Listing link from thread works
- [ ] Unread counts clear correctly
- [ ] Alert counters do not come back unless truly new
- [ ] Notifications open to the right place
- [ ] No thread page crash or hydration break
- [x] Inbox and notifications remain readable without unnecessary noise

## P0 Storefronts / Seller Trust

- [ ] Storefront creation, editing, and opening works
- [ ] Public storefront reads professionally
- [x] No duplicate logo, name, address, hours, or review/trust content
- [ ] Seller page links work from listings
- [x] Trust cues feel clear without clutter
- [ ] Business/storefront cards stay readable on mobile

## P0 Posting / Dashboard

- [ ] Create listing works
- [ ] Edit listing works
- [ ] Save search works
- [ ] Dashboard actions are clear and not confusing
- [ ] No broken counters or stale state
- [x] Management pages feel compact instead of noisy

## P0 PWA / Mobile Shell

- [ ] Installed PWA scroll works on key pages
- [ ] Bottom nav never blocks content
- [ ] Prompts and helpers are fully visible
- [ ] Install / open flow is clean
- [ ] No clipped cards or floating UI overlap

## Final Launch Gate

- [ ] All P0 desktop-browser checks are green
- [ ] All P0 Android-browser checks are green
- [ ] All P0 iPhone-browser checks are green
- [ ] All P0 installed-PWA checks are green
- [ ] No known auth bug remains
- [ ] No known scroll bug remains
- [ ] No known message-opening bug remains
- [ ] No broken listing or storefront creation path remains
