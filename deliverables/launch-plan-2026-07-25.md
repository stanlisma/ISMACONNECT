# ISMACONNECT Launch Plan

Drafted 2026-07-25, for review 2026-07-26. Companion to `pre-launch-stabilization-checklist.md` (technical readiness — currently all green except the GA4 item) and `soft-launch-seed-pack-2026-05-10.md` (original content-seeding plan, still valid and referenced below).

## Where things stand

Every P0 technical item is verified and live: auth, homepage/browse/search, messages/notifications, storefronts, posting/dashboard, and the PWA shell. This session also found and fixed several real bugs (duplicate trust badges, a broken messages-inbox ordering issue, wrong dates on evening posts, a sandboxed email sender, and a schema-drift bug that had silently broken notification/message read-state for an unknown period), and shipped two things not originally in scope: self-service account deactivation/deletion, and Open Graph/Twitter Card previews for shared links.

Two things are still open, neither blocking:
- GA4 measurement ID not yet set (also gates the automatic error-monitoring listeners — see checklist for detail)
- Legal review of Privacy/Terms/Safety — you've explicitly deferred this to post-launch

The rest of this plan is about the actual go-live, not more bug-fixing.

## 1. Content cleanup (your action item — I can't safely do this for you)

You flagged that most current listings are Buy & Sell, which isn't the site's primary purpose. This matches what the original seed-pack already anticipated: **Ride Share, Services, Rentals, and Jobs are the priority categories** — Buy & Sell should stay active but lightly represented, not dominant.

What to do:
- Go through `/dashboard` and remove or archive stale/test Buy & Sell listings that don't represent real current inventory. I can't do bulk deletion myself — deleting a listing requires clicking through a native browser confirm dialog I have no way to interact with — so this is a manual pass on your end. I'm glad to sit with you and go through the list together, telling you exactly what I'd cut and why, while you click.
- Anything left in Buy & Sell should be real, current, and yours (or a trusted contact's) — not filler.
- Re-check the homepage after cleanup: recall the "Popular listings" section only pulls the 8 *most recently posted* listings sitewide, then groups whatever categories happen to be represented in that set. If Buy & Sell dominates recent posting activity, it'll keep dominating that homepage section regardless of overall listing counts — so the fix here is really about what gets posted *going forward*, not just a one-time cleanup.

## 2. Before flipping the switch

- [ ] Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` in Vercel (see checklist for exact steps)
- [ ] Confirm `/admin/moderation` shows the test error log entry (quick, needs your admin login)
- [ ] Content cleanup above
- [ ] Decide on launch sequencing (next section)

## 3. Launch sequencing — recommendation

Don't flip from zero to "post it everywhere in town" in one day. A short staged rollout costs you almost nothing and catches problems while the stakes are still low:

**Stage 1 — Friends & trusted contacts (2-3 days).** Ask the 5 trusted local contacts from the seed pack to post real listings and actually use messaging/boosts. This is your first real read on: does posting feel natural, do replies arrive, does the mobile experience hold up on real devices you don't control. Watch the admin error log and your own inbox closely during this window — this is the cheapest time to catch anything.

**Stage 2 — Soft community push (rest of week 1).** Share into 1-2 Fort McMurray Facebook groups / community pages, not all of them at once. Frame it as "new local option, still growing" — this sets accurate expectations and avoids the site looking empty if inventory is still thin in a given category.

**Stage 3 — Full public push (week 2+).** Once Stage 2 shows real replies and repeat posting (the seed pack's own success signal), broaden to more groups, any local partnerships, and word of mouth without hedging language.

This is a recommendation, not a requirement — if you'd rather go straight to a full public push, the technical readiness supports that too. The staged approach mainly buys you a lower-stakes window to catch real-world surprises.

## 4. Fort McMurray-specific go-to-market ideas

- Local Facebook groups/community pages are almost certainly the highest-leverage channel for a hyperlocal marketplace like this — worth identifying the 3-4 most active ones before Stage 2.
- Storefronts feature is a natural local-business outreach angle: a handful of real local service businesses (cleaning, trades, moving) with a claimed storefront gives the site an anchor of legitimacy beyond individual listings.
- Camp/rotation-worker angle (ride share, short-term rentals) is a differentiator general classifieds sites don't serve well — worth leading with in any messaging aimed at that audience specifically.
- Personal network for the first real reviews/ratings — a few genuine completed transactions with real reviews early on does more for trust than any amount of copy.

## 5. Day-1 / Week-1 monitoring plan

Once GA4 is live, both of these become checkable in one place-ish, but specifically watch:

- `/admin/moderation` — error logs (now that the pipeline is fixed) and any user reports
- Real signups vs. real posts vs. real replies — is the funnel actually moving, not just traffic
- Which category gets replies and repeat posting fastest (seed pack's own decision rule: double down there in outreach and homepage emphasis)
- Email deliverability — spot-check that message notifications and the various account-action emails aren't sliding into spam as real send volume ramps up (the DMARC fix helps, but reputation still builds over time)
- Boost/payment activity if anyone uses it — genuinely money-touching, worth a personal eye on the first several transactions

## 6. If something breaks after launch

Tell me what happened and what page/action it was on — given how this session went, most issues are findable and fixable same-day once I can see the actual symptom. Screenshots or a description of "I did X, expected Y, got Z" are more useful to me than guessing from a vague "it's broken."

## What I need from you tomorrow

1. Which launch sequencing option you want (staged vs. straight to public)
2. Whether you want to do the listing cleanup together live, or you'll do it solo and just flag anything you're unsure about
3. Confirmation once GA4's env var is set, so I can verify it end-to-end

Everything else in this plan is ready whenever you are. Sleep well — this was a genuinely productive first day, and I'm glad it felt that way on your end too.
