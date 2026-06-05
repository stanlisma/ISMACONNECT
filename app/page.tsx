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

interface GuideStep {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
}

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
  const accountHref = viewer ? "/settings" : "/auth/sign-up";
  const storefrontHref = viewer ? "/dashboard/storefronts" : "/auth/sign-up";
  const listingHref = viewer ? "/dashboard/listings/new" : "/auth/sign-up";
  const promotionHref = viewer ? "/dashboard/boosts" : "/auth/sign-up";
  const verificationHref = viewer ? "/settings#verification" : "/auth/sign-up";
  const messagesHref = viewer ? "/messages" : "/auth/sign-in";
  const notificationsHref = viewer ? "/settings#notifications" : "/auth/sign-in";

  const guideSteps: GuideStep[] = [
    {
      title: "Create and finish your account",
      description:
        "Use your real name, phone, and local details so people feel comfortable replying to you.",
      href: accountHref,
      actionLabel: viewer ? "Open settings" : "Create account"
    },
    {
      title: "Search first, then save what matters",
      description:
        "Use browse filters for routes, rentals, jobs, and services, then save searches so new matches come back to you.",
      href: "/browse",
      actionLabel: "Open browse"
    },
    {
      title: "Post offers or needs clearly",
      description:
        "If you have something to offer, post it. If nothing fits your situation, post a need so locals can reply directly.",
      href: listingHref,
      actionLabel: viewer ? "Create listing" : "Sign up to post"
    },
    {
      title: "Create storefronts if you run a business",
      description:
        "Storefronts help service businesses show logos, hours, service areas, and reviews before anyone opens a post.",
      href: storefrontHref,
      actionLabel: viewer ? "Manage storefronts" : "Sign up for storefronts"
    },
    {
      title: "Request verification once your profile is ready",
      description:
        "Verification works best after your contact details and storefront basics are filled out cleanly.",
      href: verificationHref,
      actionLabel: viewer ? "Open verification" : "Sign up first"
    },
    {
      title: "Use promotions when timing matters",
      description:
        "Boosts are best for urgent routes, quick rentals, last-minute jobs, and time-sensitive service posts.",
      href: promotionHref,
      actionLabel: viewer ? "Open promotions" : "Sign up first"
    },
    {
      title: "Keep replies in Messages",
      description:
        "Use private replies instead of scattered comments so leads stay tidy and easier to follow up.",
      href: messagesHref,
      actionLabel: viewer ? "Open messages" : "Sign in to message"
    },
    {
      title: "Turn on alerts and install the app",
      description:
        "Saved searches, push alerts, and the home-screen app are the fastest way to stay close to fresh local activity.",
      href: notificationsHref,
      actionLabel: viewer ? "Manage alerts" : "Sign in for alerts"
    }
  ];

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

        <div className="home-mobile-support-row">
          <span className="home-support-label">New to ISMACONNECT?</span>
          <Link href="/#start-here-guide" className="home-secondary-link">
            Get started
          </Link>
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

        <div className="action-row home-hero-actions">
          {!viewer && (
            <Link href="/auth/sign-up" className="button button-secondary">
              Create account
            </Link>
          )}
          {viewer ? (
            <Link href="/browse" className="button">
              Browse listings
            </Link>
          ) : null}
          <Link href="/#start-here-guide" className="button button-ghost">
            Get started
          </Link>
        </div>

        <div className="home-desktop-query-row">
          {POPULAR_QUERIES.map((query) => (
            <Link key={query.label} href={query.href} className="home-desktop-query-chip">
              {query.label}
            </Link>
          ))}
        </div>

      </section>

      {isConfigured ? (
        <section className="home-get-started surface">
          <div className="home-get-started-copy">
            <span className="eyebrow">Get started</span>
            <h2>Set up ISMACONNECT the right way from day one</h2>
            <p>
              Learn how to set up your account, storefronts, saved searches, promotions, verification, and replies
              before you start posting.
            </p>
          </div>
          <div className="home-get-started-actions">
            <Link href="/#start-here-guide" className="button button-secondary">
              Open guide
            </Link>
            <Link
              href={viewer ? "/dashboard/listings/new" : "/auth/sign-up"}
              className="button button-ghost"
            >
              {viewer ? "Post your first listing" : "Create account"}
            </Link>
          </div>
        </section>
      ) : null}

      <section className="section home-listings-section listing-feed-section">
        <div className="container listing-feed-container">
          <div className="home-section-head">
            <h2>Popular listings by category</h2>
            <Link href="/browse" className="home-section-link">
              Browse all
            </Link>
          </div>

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

      <section id="start-here-guide" className="section">
        <div className="container get-started-shell">
          <div className="surface get-started-hero">
            <span className="eyebrow">Get started</span>
            <h2 className="section-title">Start using ISMACONNECT with less guesswork</h2>
            <p className="section-copy">
              This guide walks new locals through the setup flow that matters most: account basics, storefronts,
              search, saved alerts, promotions, verification, and replies.
            </p>
            <div className="action-row">
              <Link href={viewer ? "/browse" : "/auth/sign-up"} className="button">
                {viewer ? "Browse listings" : "Create account"}
              </Link>
              <Link href="/browse" className="button button-secondary">
                Open browse
              </Link>
            </div>
          </div>

          <div className="get-started-grid">
            {guideSteps.map((step) => (
              <article key={step.title} className="surface get-started-card">
                <div className="get-started-card-copy">
                  <h2>{step.title}</h2>
                  <p>{step.description}</p>
                </div>
                <Link href={step.href} className="button button-ghost get-started-card-link">
                  {step.actionLabel}
                </Link>
              </article>
            ))}
          </div>

          <div className="info-grid">
            <div className="surface get-started-panel">
              <span className="eyebrow">Quick checklist</span>
              <h2>Before you post</h2>
              <ul className="get-started-list">
                <li>Use a clear title, accurate location, and real photos when possible.</li>
                <li>Post a need when nothing already fits your route, rental, job, or service request.</li>
                <li>Save searches for anything you check more than once a day.</li>
                <li>Keep replies in Messages so you do not lose people in comments or group threads.</li>
              </ul>
            </div>

            <div className="surface get-started-panel">
              <span className="eyebrow">Local advantage</span>
              <h2>What helps most on ISMACONNECT</h2>
              <ul className="get-started-list">
                <li>Storefronts build trust fastest for cleaning, hauling, trades, and local service businesses.</li>
                <li>Verification matters more after your profile and storefront details already look complete.</li>
                <li>Promotions are best used on urgent or time-sensitive listings, not every post.</li>
                <li>Install the app and turn on alerts if you want quick replies without checking all day.</li>
              </ul>
            </div>
          </div>
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
