import Link from "next/link";
import { getViewer } from "@/lib/auth";

import { ListingCard } from "@/components/listings/listing-card";
import { MobileInstallBanner } from "@/components/pwa/mobile-install-banner";
import { CATEGORIES, HERO_CATEGORY_VALUES } from "@/lib/constants";
import { getHomepageData, getSavedListingIds } from "@/lib/data";
import { HOMEPAGE_FRESH_DAYS, isFreshListing } from "@/lib/listing-freshness";
import { getSellerTrustSummaryMap } from "@/lib/trust";

const POPULAR_QUERIES = [
  { label: "Timberlea rentals", href: "/browse?category=rentals&q=timberlea" },
  { label: "Camp rides", href: "/browse?category=ride-share&subcategory=camp-site-transport&view=map" },
  { label: "Airport rides", href: "/browse?category=ride-share&subcategory=airport-ride&view=map" },
  { label: "Local businesses", href: "/businesses" },
  { label: "Move-out cleaners", href: "/browse?category=services&q=move-out+cleaning" },
  { label: "Dump runs", href: "/browse?category=services&q=dump+run" }
];

export default async function HomePage() {
  const viewer = await getViewer();
  const { latestListings, isConfigured } = await getHomepageData();
  const savedIds = viewer ? await getSavedListingIds(viewer.user.id) : new Set();
  const freshListings = latestListings.filter((listing) =>
    isFreshListing(listing.created_at, HOMEPAGE_FRESH_DAYS)
  );
  const hasFreshListings = freshListings.length > 0;
  const visibleListings = (hasFreshListings ? freshListings : latestListings).slice(0, 8);
  const trustMap = await getSellerTrustSummaryMap(visibleListings.map((listing) => listing.owner_id));
  const priorityCategories = HERO_CATEGORY_VALUES.map(
    (value) => CATEGORIES.find((category) => category.value === value)!
  );
  const homepageListingGroups = CATEGORIES
    .map((category) => ({
      category,
      listings: visibleListings.filter((listing) => listing.category === category.value)
    }))
    .filter((group) => group.listings.length > 0);

  return (
    <main className="homepage-main" style={pageStyle}>
      <section className="home-hero-section home-unified-hero surface" style={heroCardStyle}>
        <div className="marketplace-page-utility-row home-hero-utility-row">
          <span className="eyebrow">Fort McMurray</span>
        </div>

        <h1 style={titleStyle}>
          Fort McMurray rides, rentals, services, and local work in one place.
        </h1>

        <p style={subtitleStyle}>
          Search the local worker marketplace without digging through scattered posts and group chats.
        </p>

        <form action="/browse" className="home-mobile-search-form home-unified-search-form">
          <label className="home-mobile-search-field">
            <input name="q" placeholder="Search rentals, rides, jobs..." aria-label="Search local listings" />
          </label>
          <button type="submit" className="button home-mobile-search-button">
            Search
          </button>
        </form>

        <div className="home-mobile-query-row home-unified-query-row">
          {POPULAR_QUERIES.map((query) => (
            <Link key={query.label} href={query.href} className="home-mobile-query-chip">
              {query.label}
            </Link>
          ))}
        </div>

        {!viewer ? (
          <div className="action-row home-hero-actions">
            <Link href="/auth/sign-up" className="button button-secondary">
              Create account
            </Link>
          </div>
        ) : null}

        <MobileInstallBanner context="home" />
      </section>
      <section className="section home-listings-section listing-feed-section">
        <div className="container listing-feed-container">
          {!isConfigured ? (
            <p>Setup required</p>
          ) : latestListings.length > 0 ? (
            <div className="home-category-groups">
              {homepageListingGroups.map(({ category, listings }) => (
                <section key={category.value} className="home-category-group">
                  <div className="home-category-group-head">
                    <h3>Popular listings in {category.label}</h3>
                    <Link href={category.href} className="home-secondary-link">
                      See all
                    </Link>
                  </div>

                  <div className="listing-grid listing-feed-grid">
                    {listings.map((listing) => (
                      <ListingCard
                        key={listing.id}
                        listing={listing}
                        isSaved={savedIds.has(listing.id)}
                        canSave
                        pathToRevalidate="/"
                        trustSummary={trustMap.get(listing.owner_id)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="home-launch-empty-state">
              <div className="empty-state">
                <span className="eyebrow">Early local launch</span>
                <h3>Be one of the first locals to post here</h3>
                <p>
                  ISMACONNECT is ready for rides, rentals, jobs, services, and storefronts. Start with what you need
                  or publish the first offer so the next visitor sees something real to reply to.
                </p>
                <ul className="empty-state-tip-list">
                  <li>Camp rides and airport trips usually drive the fastest replies.</li>
                  <li>Saved searches help locals return as soon as new matches land.</li>
                  <li>Storefronts let service businesses build trust before a listing is opened.</li>
                </ul>
                <div className="empty-state-actions">
                  <Link
                    href={viewer ? "/dashboard/listings/new?intent=need" : "/auth/sign-up"}
                    className="button button-secondary"
                  >
                    {viewer ? "Post a need" : "Create account"}
                  </Link>
                  <Link href="/businesses" className="button button-ghost">
                    Browse storefronts
                  </Link>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      <section style={categoriesSectionStyle}>
        <span style={badgeStyle}>LOCAL PRIORITIES</span>

        <h2 style={sectionTitleStyle}>
          Start with the categories Fort McMurray checks most
        </h2>

        <div style={cardGridStyle}>
          {priorityCategories.map((category) => (
            <article key={category.value} style={cardStyle}>
              <h3 style={cardTitleStyle}>{category.label}</h3>
              <p style={cardTextStyle}>{category.description}</p>
              <Link href={category.href} style={cardLinkStyle}>
                Explore {category.label}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

const pageStyle = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "56px 20px",
};

const heroCardStyle = {
  background: "#ffffff",
  border: "1px solid #dbe4f0",
  borderRadius: "24px",
  padding: "56px 32px",
  textAlign: "center" as const,
  boxShadow: "0 24px 70px rgba(30, 107, 255, 0.08)",
};

const badgeStyle = {
  display: "inline-block",
  background: "#dbeafe",
  color: "#1d4ed8",
  borderRadius: "999px",
  padding: "6px 14px",
  fontSize: "12px",
  fontWeight: 800,
};

const titleStyle = {
  maxWidth: "950px",
  margin: "18px auto 0",
  color: "#172554",
  fontSize: "52px",
  lineHeight: 1.05,
  fontWeight: 900,
};

const subtitleStyle = {
  marginTop: "16px",
  color: "#5b6f99",
};

const categoriesSectionStyle = {
  marginTop: "56px",
};

const sectionTitleStyle = {
  marginTop: "14px",
  color: "#172554",
  fontSize: "32px",
  fontWeight: 900,
};

const cardGridStyle = {
  marginTop: "24px",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "16px",
};

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #dbe4f0",
  borderRadius: "16px",
  padding: "22px",
};

const cardTitleStyle = {
  color: "#0a2540",
  fontSize: "18px",
  fontWeight: 800,
};

const cardTextStyle = {
  marginTop: "10px",
  color: "#5b6f99",
};

const cardLinkStyle = {
  display: "inline-flex",
  marginTop: "14px",
  color: "#1549b7",
  fontWeight: 800,
  textDecoration: "none",
};
