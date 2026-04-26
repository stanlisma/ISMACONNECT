import Link from "next/link";
import { getViewer } from "@/lib/auth";

import { ListingCard } from "@/components/listings/listing-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { SetupNotice } from "@/components/ui/setup-notice";
import { getHomepageData } from "@/lib/data";

export default async function HomePage() {
  const viewer = await getViewer();
  const { latestListings, featuredListings, isConfigured } = await getHomepageData();
  const homepageListings =
    featuredListings.length > 0 ? featuredListings.concat(latestListings).slice(0, 8) : latestListings;

  return (
    <main style={pageStyle}>
      <section style={heroCardStyle}>
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
              placeholder="Rentals, camp rides, tools, cleaning, jobs..."
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
          <Link href="/browse?category=rentals" style={pillStyle}>Rentals</Link>
          <Link href="/browse?category=ride-share" style={pillStyle}>Ride Share</Link>
          <Link href="/browse?category=jobs" style={pillStyle}>Jobs</Link>
          <Link href="/browse?category=services" style={pillStyle}>Services</Link>
          <Link href="/browse?category=buy-sell" style={pillStyle}>Buy & Sell</Link>
        </div>
      </section>

            <section className="section">
        <div className="container">

          <h2 style={{ marginBottom: "1rem" }}>
            Latest Listings
          </h2>

          {!isConfigured ? (
            <p>Setup required</p>
          ) : latestListings.length > 0 ? (
            <div className="listing-grid">
              {latestListings.slice(0, 8).map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
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
          {[
            ["Rentals", "Apartments, rooms, storage, and local rental opportunities across Fort McMurray."],
            ["Ride Share", "Daily commutes, camp rides, airport pickups, and local travel coordination."],
            ["Jobs", "Part-time, full-time, and contract roles for local workers and employers."],
            ["Services", "Trusted help for cleaning, moving, repairs, tutoring, and more."],
            ["Buy & Sell", "Furniture, electronics, tools, and everyday items from local sellers."],
          ].map(([title, text]) => (
            <article key={title} style={cardStyle}>
              <h3 style={cardTitleStyle}>{title}</h3>
              <p style={cardTextStyle}>{text}</p>
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