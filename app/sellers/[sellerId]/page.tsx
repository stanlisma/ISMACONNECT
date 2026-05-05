import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, ExternalLink } from "lucide-react";

import { ListingCard } from "@/components/listings/listing-card";
import { TrustBadges } from "@/components/trust/trust-badges";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { getViewer } from "@/lib/auth";
import { CATEGORY_MAP } from "@/lib/constants";
import { getPublicSellerStorefront, getSavedListingIds } from "@/lib/data";
import { getSellerTrustSummary, getSellerTrustSummaryMap } from "@/lib/trust";
import { buildPathWithQuery, formatDate, getCategoryLabel, getSingleParam, resolveCategory } from "@/lib/utils";

export async function generateMetadata({
  params
}: {
  params: Promise<{ sellerId: string }>;
}): Promise<Metadata> {
  const { sellerId } = await params;
  const storefront = await getPublicSellerStorefront(sellerId, 6);

  if (!storefront) {
    return {
      title: "Seller not found",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  return {
    title: `${storefront.display_name} on ISMACONNECT`,
    description:
      storefront.is_business && storefront.business_description
        ? storefront.business_description
        : `Browse active local marketplace listings from ${storefront.display_name} on ISMACONNECT.`
  };
}

export default async function SellerStorefrontPage({
  params,
  searchParams
}: {
  params: Promise<{ sellerId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { sellerId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const storefront = await getPublicSellerStorefront(sellerId);

  if (!storefront) {
    notFound();
  }

  const categoryFilter = resolveCategory(getSingleParam(resolvedSearchParams?.category));
  const viewer = await getViewer();
  const savedIds = viewer ? await getSavedListingIds(viewer.user.id) : new Set();
  const trustSummary = await getSellerTrustSummary(sellerId);
  const trustMap = await getSellerTrustSummaryMap(storefront.listings.map((listing) => listing.owner_id));
  const filteredListings = categoryFilter
    ? storefront.listings.filter((listing) => listing.category === categoryFilter)
    : storefront.listings;
  const categoryCounts = storefront.active_categories
    .map((category) => ({
      category,
      count: storefront.listings.filter((listing) => listing.category === category).length
    }))
    .sort((left, right) => right.count - left.count);
  const storefrontInitial = storefront.display_name.trim().charAt(0).toUpperCase() || "S";
  const memberSinceLabel = trustSummary?.member_since
    ? formatDate(trustSummary.member_since)
    : "Recently joined";
  const ratingLabel =
    trustSummary?.review_count && trustSummary.average_rating !== null
      ? `${trustSummary.average_rating.toFixed(1)} / 5`
      : "No ratings yet";
  const storefrontDescription = storefront.is_business
    ? storefront.business_description ||
      "Browse this business storefront, review trust signals, and explore active local listings."
    : "Review this seller's live listings, local category footprint, and trust signals before you message.";

  return (
    <section className="section">
      <div className="container">
        <div className="surface seller-storefront-hero">
          <div className="seller-storefront-header">
            <div className="seller-storefront-profile">
              <div className="seller-storefront-avatar" aria-hidden="true">
                {storefront.business_logo_url ? (
                  <img src={storefront.business_logo_url} alt="" className="seller-storefront-avatar-image" />
                ) : (
                  storefrontInitial
                )}
              </div>

              <div className="seller-storefront-copy">
                <span className="eyebrow">{storefront.is_business ? "Business storefront" : "Seller storefront"}</span>
                <h1 className="section-title">{storefront.display_name}</h1>
                <p className="section-copy">{storefrontDescription}</p>

                <div className="seller-storefront-meta">
                  <span>{storefront.primary_location.split(",")[0]}</span>
                  <span>Member since {memberSinceLabel}</span>
                  <span>{ratingLabel}</span>
                  {storefront.is_business ? <span>Business account</span> : null}
                </div>

                {storefront.service_areas.length ? (
                  <div className="seller-storefront-service-areas">
                    {storefront.service_areas.map((area) => (
                      <span key={area} className="seller-storefront-service-chip">
                        {area}
                      </span>
                    ))}
                  </div>
                ) : null}

                {storefront.is_business && trustSummary?.verification_status === "verified" ? (
                  <div className="seller-storefront-business-badge">
                    <Building2 aria-hidden="true" size={16} strokeWidth={2.1} />
                    <span>Verified business storefront</span>
                  </div>
                ) : null}

                <TrustBadges summary={trustSummary} />
              </div>
            </div>

            <div className="seller-storefront-rail">
              <div className="seller-storefront-stats">
                <div className="seller-storefront-stat">
                  <span>Active listings</span>
                  <strong>{storefront.total_active_listings}</strong>
                </div>
                <div className="seller-storefront-stat">
                  <span>Categories</span>
                  <strong>{storefront.active_categories.length}</strong>
                </div>
                <div className="seller-storefront-stat">
                  <span>Reviews</span>
                  <strong>{trustSummary?.review_count ?? 0}</strong>
                </div>
              </div>

              <div className="seller-storefront-actions">
                {storefront.business_website ? (
                  <a
                    className="button"
                    href={storefront.business_website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>Visit website</span>
                    <ExternalLink aria-hidden="true" size={15} strokeWidth={2.2} />
                  </a>
                ) : (
                  <Link className="button" href="/browse">
                    Browse all listings
                  </Link>
                )}
                <Link className="button button-secondary" href={`/categories/${storefront.active_categories[0] ?? "buy-sell"}`}>
                  Explore similar listings
                </Link>
              </div>
            </div>
          </div>

          <div className="seller-storefront-category-row">
            {categoryCounts.map(({ category, count }) => {
              const isActive = categoryFilter === category;
              const href = buildPathWithQuery(`/sellers/${sellerId}`, {
                category: isActive ? undefined : category
              });

              return (
                <Link
                  key={category}
                  className={`seller-storefront-category-pill ${isActive ? "is-active" : ""}`}
                  href={href}
                >
                  <span>{getCategoryLabel(category)}</span>
                  <strong>{count}</strong>
                </Link>
              );
            })}

            {categoryFilter ? (
              <Link className="seller-storefront-category-clear" href={`/sellers/${sellerId}`}>
                Clear filter
              </Link>
            ) : null}
          </div>
        </div>

        <div style={{ marginTop: "1.5rem" }}>
          <SectionHeading
            eyebrow="Active Listings"
            title={
              categoryFilter
                ? `${CATEGORY_MAP[categoryFilter].label} from ${storefront.display_name}`
                : `Live posts from ${storefront.display_name}`
            }
            description="These listings are currently visible across browse and category feeds."
          />

          {filteredListings.length ? (
            <div className="listing-grid listing-feed-grid">
              {filteredListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isSaved={savedIds.has(listing.id)}
                  canSave
                  pathToRevalidate={`/sellers/${sellerId}`}
                  trustSummary={trustMap.get(listing.owner_id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              actionHref={`/sellers/${sellerId}`}
              actionLabel="See all seller listings"
              description="This seller has active listings, but not in the category you filtered to."
              title="No listings in this category"
            />
          )}
        </div>
      </div>
    </section>
  );
}
