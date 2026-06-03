import Link from "next/link";
import { getViewer } from "@/lib/auth";

import { BrowseFilters } from "@/components/listings/browse-filters";
import { ListingCard } from "@/components/listings/listing-card";
import { MobileInstallBanner } from "@/components/pwa/mobile-install-banner";
import { CATEGORIES, HERO_CATEGORY_VALUES } from "@/lib/constants";
import { getHomepageData, getSavedListingIds } from "@/lib/data";
import { HOMEPAGE_FRESH_DAYS, isFreshListing } from "@/lib/listing-freshness";
import { getSoftLaunchSnapshot } from "@/lib/launch-metrics";
import { getSellerTrustSummaryMap } from "@/lib/trust";

const POPULAR_QUERIES = [
  { label: "Timberlea rentals", href: "/browse?category=rentals&q=timberlea" },
  { label: "Camp rides", href: "/browse?category=ride-share&subcategory=camp-site-transport&view=map" },
  { label: "Airport rides", href: "/browse?category=ride-share&subcategory=airport-ride&view=map" },
  { label: "Local businesses", href: "/businesses" },
  { label: "Move-out cleaners", href: "/browse?category=services&q=move-out+cleaning" },
  { label: "Dump runs", href: "/browse?category=services&q=dump+run" }
];

const MOBILE_POPULAR_QUERIES = POPULAR_QUERIES.slice(0, 4);

const CAMP_TRANSPORT_LINKS = [
  {
    label: "Browse camp rides",
    href: "/browse?category=ride-share&subcategory=camp-site-transport&view=map"
  },
  {
    label: "14 on / 7 off rides",
    href: "/browse?category=ride-share&schedulePattern=14-on-7-off&view=map"
  },
  {
    label: "Horizon pickups",
    href: "/browse?category=ride-share&siteCamp=cnrl-horizon&view=map"
  }
];

export default async function HomePage() {
  const viewer = await getViewer();
  const { latestListings, isConfigured } = await getHomepageData();
  const activitySnapshot = await getSoftLaunchSnapshot();
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
  const activeCategoryCounts = activitySnapshot.heroCategoryCounts.filter((item) => item.count > 0);

  return (
    <main className="homepage-main" style={pageStyle}>
      <section className="home-mobile-hero surface">
        <div className="home-mobile-hero-copy">
          <div className="marketplace-page-utility-row">
            <span className="eyebrow">Fort McMurray</span>
            {viewer ? (
              <Link href="/dashboard/storefronts" className="marketplace-page-utility-link">
                My Storefronts
              </Link>
            ) : null}
          </div>
          <h1>Find rides, rentals, services, and jobs in Fort McMurray</h1>
        </div>

        <form action="/browse" className="home-mobile-search-form">
          <label className="home-mobile-search-field">
            <input name="q" placeholder="Search rentals, rides, jobs..." aria-label="Search local listings" />
          </label>
          <button type="submit" className="button home-mobile-search-button">
            Search
          </button>
        </form>

        <div className="home-camp-focus">
          <div className="home-camp-focus-copy">
            <span className="eyebrow">Camp Transport</span>
            <h2>Find site rides by route and rotation</h2>
            <p>Filter by site, shift pattern, and pickup window instead of digging through Facebook threads.</p>
          </div>

          <div className="home-camp-link-row">
            {CAMP_TRANSPORT_LINKS.map((link) => (
              <Link key={link.label} href={link.href} className="home-camp-link">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="home-mobile-query-row">
          {MOBILE_POPULAR_QUERIES.map((query) => (
            <Link key={query.label} href={query.href} className="home-mobile-query-chip">
              {query.label}
            </Link>
          ))}
        </div>

        <MobileInstallBanner context="home" />
      </section>

      <section className="home-hero-section" style={heroCardStyle}>
        <div className="marketplace-page-utility-row home-hero-utility-row">
          <span className="eyebrow">Fort McMurray</span>
          {viewer ? (
            <Link href="/dashboard/storefronts" className="marketplace-page-utility-link">
              My Storefronts
            </Link>
          ) : null}
        </div>

        <h1 style={titleStyle}>
          Fort McMurray rides, rentals, services, and local work in one place.
        </h1>

        <p style={subtitleStyle}>
          Search the local worker marketplace without digging through scattered posts and group chats.
        </p>

        <div style={searchBoxStyle}>
          <form action="/browse" style={searchFormStyle}>
            <input
              name="q"
              placeholder="Camp rides, dump runs, rentals, cleaners, jobs..."
              style={inputStyle}
            />

            <button type="submit" style={primaryButtonStyle}>
              Search
            </button>
          </form>

          {!viewer && (
            <Link href="/auth/sign-up" style={secondaryButtonStyle}>
              Create account
            </Link>
          )}

        </div>

        <div className="home-desktop-query-row">
          {POPULAR_QUERIES.map((query) => (
            <Link key={query.label} href={query.href} className="home-desktop-query-chip">
              {query.label}
            </Link>
          ))}
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

      {isConfigured && activitySnapshot.recentListingCount > 0 ? (
        <section className="home-activity-strip surface">
          <div className="home-activity-copy">
            <span className="eyebrow">Recent local movement</span>
            <h2>Locals are already posting and replying here</h2>
          </div>

          <div className="dashboard-stats-grid home-activity-grid">
            <div className="surface dashboard-stat-card home-activity-card">
              <span>Recent posts</span>
              <strong>{activitySnapshot.recentListingCount}</strong>
              <p>Live offers and needs posted in the last 30 days.</p>
            </div>

            <div className="surface dashboard-stat-card home-activity-card">
              <span>Conversations started</span>
              <strong>{activitySnapshot.conversationCount}</strong>
              <p>{activitySnapshot.responseRate}% of recent posts received at least one reply.</p>
            </div>

            <div className="surface dashboard-stat-card home-activity-card">
              <span>Need posts</span>
              <strong>{activitySnapshot.recentNeedCount}</strong>
              <p>Urgent local asks that can turn into fast replies.</p>
            </div>

            <div className="surface dashboard-stat-card home-activity-card">
              <span>Saved-search locals</span>
              <strong>{activitySnapshot.activeSavedSearchUserCount}</strong>
              <p>People watching for new Fort McMurray matches right now.</p>
            </div>
          </div>

          {activeCategoryCounts.length ? (
            <div className="home-activity-chip-row">
              {activeCategoryCounts.map((item) => (
                <span key={item.category} className="badge badge-soft">
                  {CATEGORIES.find((category) => category.value === item.category)?.label}: {item.count}
                </span>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="section home-listings-section listing-feed-section">
        <div className="container listing-feed-container">
          <div className="home-section-head">
            <h2>{hasFreshListings ? "Fresh local activity" : "Latest local posts"}</h2>
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
