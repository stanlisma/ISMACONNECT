# ISMACONNECT MVP

Production-ready marketplace MVP for Fort McMurray built with the Next.js App Router and Supabase.

## What is included

- Next.js App Router structure with responsive blue-and-white marketplace UI
- Supabase Auth flow for sign up, sign in, sign out, and session refresh
- Supabase Postgres schema with row-level security for profiles, listings, and listing flags
- Public browse, search, category pages, and listing detail pages
- Authenticated listing CRUD for marketplace members
- Saved searches with in-app new-match alerts
- Seller ratings, Stripe Identity verification, and trust badges
- Featured listings, urgent badges, and boost products with Stripe-ready checkout
- Admin moderation flow for flagged listings
- Seed data for local demo users and listings
- SEO basics: metadata, `robots.ts`, `sitemap.ts`, category routes, listing slugs
- Stripe-ready database fields for future featured listing upgrades

## Tech stack

- Next.js 14
- React 18
- TypeScript
- Supabase Auth
- Supabase Postgres
- Plain CSS with a mobile-first component system

## Project structure

```text
app/
  admin/
  auth/
  browse/
  categories/[category]/
  dashboard/
    boosts/
    listings/[id]/boost/
  listings/[slug]/
components/
  admin/
  auth/
  boosts/
  layout/
  listings/
  ui/
lib/
  actions/
  supabase/
  validation/
supabase/
  migrations/202604210001_init.sql
  migrations/202605030001_saved_searches.sql
  migrations/202605030002_trust_and_ratings.sql
  migrations/202605030003_featured_boosts.sql
  migrations/202605030004_stripe_identity_verification.sql
  seed.sql
types/
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

Create a new Supabase project and collect:

- Project URL
- Anon key
- Service role key

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

If Stripe is not configured, local development can still test the boost flow in demo mode. Production boost checkout requires all three Stripe values.

### 4. Apply the database schema

Run the SQL in `supabase/migrations/202604210001_init.sql`, then `supabase/migrations/202605030001_saved_searches.sql`, then `supabase/migrations/202605030002_trust_and_ratings.sql`, then `supabase/migrations/202605030003_featured_boosts.sql`, and finally `supabase/migrations/202605030004_stripe_identity_verification.sql` inside the Supabase SQL editor.

This creates:

- `profiles`
- `listings`
- `listing_flags`
- `saved_searches`
- `seller_reviews`
- `listing_boost_orders`
- Stripe Identity profile tracking fields
- RLS policies for public browsing, owner CRUD, and admin moderation
- search and moderation triggers

### 5. Seed local demo data

Run `supabase/seed.sql` in the SQL editor.

It creates three local demo users:

- `admin@ismaconnect.local` / `Password123!`
- `sarah@ismaconnect.local` / `Password123!`
- `devin@ismaconnect.local` / `Password123!`

The seed includes live listings across all five categories plus one flagged listing for the admin moderation queue.
It also seeds a couple of saved-search examples, verified sellers, a pending verification request, and seller ratings so trust badges can be tested right away.

### 6. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Marketplace flows

### Public users

- Browse `/browse`
- Visit SEO-friendly category pages like `/categories/rentals`
- Open detail pages at `/listings/[slug]`
- Search listings by keyword

### Authenticated users

- Create an account at `/auth/sign-up`
- Publish new listings from `/dashboard/listings/new`
- Edit or delete their own listings from `/dashboard`
- Save searches from `/browse` and category pages
- Review saved-search alerts from `/dashboard/searches`
- Start Stripe ID verification from `/settings`
- Rate sellers after contacting them through ISMACONNECT
- Buy featured, urgent, and top-boost upgrades from `/dashboard/boosts`
- Flag suspicious listings from listing detail pages

### Admin users

- Sign in with an account whose `profiles.role` is `admin`
- Review flagged listings at `/admin/moderation`
- Approve or decline manual seller verification requests
- Restore valid posts or remove them from public view

If you want to promote an existing real user to admin instead of using the seed account, run:

```sql
update public.profiles
set role = 'admin'
where email = 'your-admin-email@example.com';
```

## Database notes

### `profiles`

Stores application roles and seller information linked to `auth.users`.

### `listings`

Stores the marketplace content and includes:

- category slug
- public slug
- featured listing placeholders
- moderation status
- full-text search vector

### `listing_flags`

Tracks user-submitted reports and automatically updates listing moderation state through triggers.

### `saved_searches`

Stores saved browse or category filters for signed-in users and powers in-app alerts when new matching listings appear.

### `seller_reviews`

Stores per-listing seller ratings submitted after contact, which power trust badges and rating summaries on listing cards and detail pages.

### `listing_boost_orders`

Stores paid or demo boost purchases, checkout state, activation windows, and Stripe session references for featured products.

### `profiles` Stripe Identity fields

Stores the latest Stripe Identity verification session ID, status, and failure details for seller badge automation.

## Stripe boost checkout

ISMACONNECT now supports seller-facing boost products with a Stripe-hosted Checkout flow when these variables are set:

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Set your Stripe webhook endpoint to:

```text
https://your-domain.com/api/stripe/webhook
```

Listen for these events:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`
- `identity.verification_session.verified`
- `identity.verification_session.requires_input`

## Stripe Identity seller verification

ISMACONNECT uses Stripe Identity's hosted redirect flow to verify seller IDs from `/settings`.

The same Stripe webhook endpoint can handle both payments and identity events:

```text
https://your-domain.com/api/stripe/webhook
```

When a seller starts verification, the app creates a Stripe `VerificationSession`, redirects the seller to Stripe, and updates `profiles.verification_status` automatically from webhook results.

The listing model uses these promotion columns:

- `is_featured`
- `featured_until`
- `boosted_at`
- `boosted_until`
- `is_urgent`
- `urgent_until`
- `stripe_checkout_session_id`

## Suggested next steps

- Add image uploads with Supabase Storage
- Add pagination
- Add email notifications for listing replies and moderation actions
- Add analytics and structured event tracking
