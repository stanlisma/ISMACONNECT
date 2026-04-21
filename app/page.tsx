import Link from "next/link";

import { ListingCard } from "@/components/listings/listing-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { SetupNotice } from "@/components/ui/setup-notice";
import { CATEGORIES, HOMEPAGE_FEATURES, SITE_TAGLINE } from "@/lib/constants";
import { getHomepageData } from "@/lib/data";

export default async function HomePage() {
  const { featuredListings, latestListings, isConfigured } = await getHomepageData();

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Local First</span>
            <h1 className="hero-title">Buy, sell, hire, and move around Fort McMurray faster.</h1>
            <p className="hero-lead">{SITE_TAGLINE}</p>

            <form action="/browse" className="filters-grid surface" method="get">
              <label className="field">
                <span className="field-label">Search the marketplace</span>
                <input
                  className="input"
                  name="q"
                  placeholder="Rentals, camp rides, tools, cleaning, jobs..."
                />
              </label>
              <div className="filter-actions">
                <button className="button" type="submit">
                  Explore listings
                </button>
                <Link className="button button-secondary" href="/auth/sign-up">
                  Create account
                </Link>
              </div>
            </form>

            <div className="pill-links">
              {CATEGORIES.map((category) => (
                <Link className="pill-link" href={category.href} key={category.value}>
                  {category.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="hero-card">
            <SectionHeading
              eyebrow="Built For Launch"
              title="Production-ready MVP foundations"
              description="Supabase auth, listing moderation, SEO-ready routes, and room for featured Stripe placements later."
            />
            <div className="stats-grid">
              {HOMEPAGE_FEATURES.map((feature) => (
                <div className="stat-card" key={feature}>
                  <span className="eyebrow">Included</span>
                  <strong>{feature}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Categories"
            title="Everything locals need in one marketplace"
            description="Each category has its own SEO-friendly landing page so listings can rank and stay easy to browse."
          />

          <div className="category-grid">
            {CATEGORIES.map((category) => (
              <Link className="category-card" href={category.href} key={category.value}>
                <h3>{category.label}</h3>
                <p>{category.description}</p>
                <span className="badge badge-soft">View category</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Featured"
            title="Highlighted local opportunities"
            description="A Stripe-ready featured slot is already modeled in the database, even though checkout is intentionally deferred for the MVP."
          />

          {!isConfigured ? (
            <SetupNotice />
          ) : (
            <div className="listing-grid">
              {featuredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Latest Listings"
            title="Fresh inventory from around Fort McMurray"
            description="Recent listings stay prominent on the homepage while category pages provide a more focused search experience."
          />

          {!isConfigured ? (
            <SetupNotice />
          ) : (
            <div className="listing-grid">
              {latestListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

