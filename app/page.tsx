import Link from "next/link";
import { getViewer } from "@/lib/auth";

import { BrowseFilters } from "@/components/listings/browse-filters";
import { ListingCard } from "@/components/listings/listing-card";
import { CATEGORIES } from "@/lib/constants";
import { getHomepageData, getSavedListingIds } from "@/lib/data";
import { getSellerTrustSummaryMap } from "@/lib/trust";

export default async function HomePage() {
  const viewer = await getViewer();
  const { latestListings, isConfigured } = await getHomepageData();
  const savedIds = viewer ? await getSavedListingIds(viewer.user.id) : new Set();
  const visibleListings = latestListings.slice(0, 8);
  const trustMap = await getSellerTrustSummaryMap(visibleListings.map((listing) => listing.owner_id));

  return (
    <main className="homepage-main" style={pageStyle}>
      <section className="home-mobile-hero surface">
        <div className="home-mobile-hero-copy">
          <span className="eyebrow">Fort McMurray</span>
          <h1>Everything local in one marketplace</h1>
          <p>Find rentals, rides, jobs, services, and everyday deals fast.</p>
        </div>

        <div className="home-mobile-category-row">
          <Link href="/categories/rentals" className="home-mobile-category-pill">Rentals</Link>
          <Link href="/categories/ride-share" className="home-mobile-category-pill">Ride Share</Link>
          <Link href="/categories/jobs" className="home-mobile-category-pill">Jobs</Link>
          <Link href="/categories/services" className="home-mobile-category-pill">Services</Link>
          <Link href="/categories/buy-sell" className="home-mobile-category-pill">Buy & Sell</Link>
        </div>
      </section>

      <section className="home-hero-section" style={heroCardStyle}>
        <span style={badgeStyle}>LOCAL FIRST</span>

        <h1 style={titleStyle}>
          Buy, sell, hire, and move around Fort McMurray faster.
        </h1>

        <p style={subtitleStyle}>
          Fort McMurray&apos;s local marketplace for everyday needs.
        </p>

        <div style={searchBoxStyle}>
          <form action="/browse" style={searchFormStyle}>
            <input
              name="q"
              placeholder="Rentals, airport rides, tools, cleaning, jobs..."
              style={inputStyle}
            />

            <button type="submit" style={primaryButtonStyle}>
              Explore listings
            </button>
          </form>

          {!viewer && (
            <Link href="/auth/sign-up" style={secondaryButtonStyle}>
              Create account
            </Link>
          )}
        </div>

        <div style={pillWrapStyle}>
          <Link href="/categories/rentals" style={pillStyle}>Rentals</Link>
          <Link href="/categories/ride-share" style={pillStyle}>Ride Share</Link>
          <Link href="/categories/jobs" style={pillStyle}>Jobs</Link>
          <Link href="/categories/services" style={pillStyle}>Services</Link>
          <Link href="/categories/buy-sell" style={pillStyle}>Buy & Sell</Link>
        </div>
      </section>

      <div className="home-mobile-browse-controls">
        <BrowseFilters
          actionPath="/browse"
          category={undefined}
          subcategory={undefined}
          search={undefined}
          minPrice={undefined}
          maxPrice={undefined}
          sort={undefined}
        />
      </div>

      <section className="section home-listings-section listing-feed-section">
        <div className="container listing-feed-container">
          <div className="home-section-head">
            <h2>Latest Listings</h2>
            <Link href="/browse" className="home-section-link">
              See all
            </Link>
          </div>

          {!isConfigured ? (
            <p>Setup required</p>
          ) : latestListings.length > 0 ? (
            <div className="listing-grid listing-feed-grid">
              {visibleListings.map((listing) => (
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
          ) : (
            <p>No listings yet</p>
          )}

        </div>
      </section>

      <section style={categoriesSectionStyle}>
        <span style={badgeStyle}>CATEGORIES</span>

        <h2 style={sectionTitleStyle}>
          Everything locals need in one marketplace
        </h2>

        <p style={sectionTextStyle}>
          Each category has its own SEO-friendly landing page so listings can rank and stay easy to browse.
        </p>

        <div style={cardGridStyle}>
          {CATEGORIES.map((category) => (
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

const searchBoxStyle = {
  maxWidth: "560px",
  margin: "28px auto 0",
  border: "1px solid #c7d7f5",
  borderRadius: "20px",
  padding: "18px",
};

const searchFormStyle = {
  display: "flex",
  gap: "12px",
};

const inputStyle = {
  flex: 1,
  border: "1px solid #bcd0f7",
  borderRadius: "12px",
  padding: "12px 14px",
};

const primaryButtonStyle = {
  background: "#2557d6",
  color: "#ffffff",
  border: "none",
  borderRadius: "14px",
  padding: "12px 18px",
  fontWeight: 800,
};

const secondaryButtonStyle = {
  display: "inline-block",
  marginTop: "12px",
  border: "1px solid #bcd0f7",
  borderRadius: "14px",
  padding: "10px 18px",
  color: "#0a2540",
  textDecoration: "none",
  fontWeight: 800,
};

const pillWrapStyle = {
  marginTop: "18px",
  display: "flex",
  justifyContent: "center",
  gap: "10px",
  flexWrap: "wrap" as const,
};

const pillStyle = {
  border: "1px solid #c7d7f5",
  borderRadius: "999px",
  padding: "10px 16px",
  color: "#0a2540",
  textDecoration: "none",
  fontWeight: 700,
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

const sectionTextStyle = {
  color: "#5b6f99",
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
