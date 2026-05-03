# ISMACONNECT MVP

Production-ready marketplace MVP for Fort McMurray built with the Next.js App Router and Supabase.

## What is included

- Next.js App Router structure with responsive blue-and-white marketplace UI
- Supabase Auth flow for sign up, sign in, sign out, and session refresh
- Supabase Postgres schema with row-level security for profiles, listings, and listing flags
- Public browse, search, category pages, and listing detail pages
- Authenticated listing CRUD for marketplace members
- Saved searches with in-app new-match alerts
- Seller ratings, verification requests, and trust badges
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
  listings/[slug]/
components/
  admin/
  auth/
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
```

The Stripe variables are placeholders for future featured listings and are not required for the MVP to run.

### 4. Apply the database schema

Run the SQL in `supabase/migrations/202604210001_init.sql`, then `supabase/migrations/202605030001_saved_searches.sql`, and then `supabase/migrations/202605030002_trust_and_ratings.sql` inside the Supabase SQL editor.

This creates:

- `profiles`
- `listings`
- `listing_flags`
- `saved_searches`
- `seller_reviews`
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
- Request seller verification from `/settings`
- Rate sellers after contacting them through ISMACONNECT
- Flag suspicious listings from listing detail pages

### Admin users

- Sign in with an account whose `profiles.role` is `admin`
- Review flagged listings at `/admin/moderation`
- Approve or decline pending seller verification requests
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

## Stripe preparation

The MVP intentionally does not process payments yet, but it is prepared for featured listings through these columns on `public.listings`:

- `is_featured`
- `featured_until`
- `stripe_checkout_session_id`

That means the future Stripe work can focus on checkout, webhook handling, and entitlement updates instead of reworking the core listing model.

## Suggested next steps

- Add image uploads with Supabase Storage
- Add pagination
- Add Stripe Checkout for featured listing upgrades
- Add email notifications for listing replies and moderation actions
- Add analytics and structured event tracking
