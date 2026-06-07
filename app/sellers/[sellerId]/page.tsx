import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Clock3, ExternalLink, MapPin, Phone } from "lucide-react";

import { getBusinessHoursRows, getBusinessHoursStatus } from "@/lib/business-profile";
import { buildStorefrontHref } from "@/lib/business-storefronts";
import { ListingCard } from "@/components/listings/listing-card";
import { SellerTrustHighlights } from "@/components/trust/seller-trust-highlights";
import { SellerRatingInline } from "@/components/trust/seller-rating-inline";
import { SellerReviewForm } from "@/components/trust/seller-review-form";
import { StorefrontImageGallery } from "@/components/storefronts/storefront-image-gallery";
import { TrustBadges } from "@/components/trust/trust-badges";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { getViewer } from "@/lib/auth";
import { CATEGORY_MAP } from "@/lib/constants";
import {
  getPublicSellerReviews,
  getPublicSellerStorefront,
  getPublicSellerStorefrontLinks,
  getSavedListingIds
} from "@/lib/data";
import {
  canViewerRateSeller,
  getPublicSellerSignals,
  getSellerTrustSummary,
  getSellerTrustSummaryMap,
  getViewerSellerReview
} from "@/lib/trust";
import { buildPathWithQuery, formatDate, getCategoryLabel, getSingleParam, resolveCategory } from "@/lib/utils";

export async function generateMetadata({
  params,
  searchParams
}: {
  params: Promise<{ sellerId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { sellerId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const storefrontId = getSingleParam(resolvedSearchParams?.storefront);
  const storefront = await getPublicSellerStorefront(sellerId, 6, storefrontId);

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
  const storefrontId = getSingleParam(resolvedSearchParams?.storefront);
  const isStorefrontView = Boolean(storefrontId);
  const reviewListingId = getSingleParam(resolvedSearchParams?.fromListing);
  const reviewListingSlug = getSingleParam(resolvedSearchParams?.listingSlug);
  const storefront = await getPublicSellerStorefront(sellerId, 12, storefrontId);

  if (!storefront) {
    notFound();
  }

  const categoryFilter = resolveCategory(getSingleParam(resolvedSearchParams?.category));
  const viewer = await getViewer();
  const savedIds = viewer ? await getSavedListingIds(viewer.user.id) : new Set();
  const storefrontLinks = await getPublicSellerStorefrontLinks(sellerId);
  const publicReviews = await getPublicSellerReviews(sellerId, 6);
  const trustSummary = await getSellerTrustSummary(sellerId);
  const sellerSignals = await getPublicSellerSignals(sellerId);
  const trustMap = await getSellerTrustSummaryMap(storefront.listings.map((listing) => listing.owner_id));
  const existingReview =
    viewer && reviewListingId && viewer.user.id !== sellerId
      ? await getViewerSellerReview(reviewListingId, viewer.user.id)
      : null;
  const canRateSellerFromListing =
    viewer && reviewListingId && viewer.user.id !== sellerId
      ? await canViewerRateSeller(reviewListingId, viewer.user.id, sellerId)
      : false;
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
  const storefrontDescription = storefront.is_business
    ? storefront.business_description ||
      "Browse this business storefront, review trust signals, and explore active local listings."
    : "Review this seller's live listings, local category footprint, and trust signals before you message.";
  const businessHoursStatus = storefront.is_business
    ? getBusinessHoursStatus(storefront.business_hours)
    : null;
  const businessHoursRows = storefront.is_business && businessHoursStatus
    ? getBusinessHoursRows(storefront.business_hours)
    : [];
  const preservedSellerQuery = {
    fromListing: reviewListingId ?? undefined,
    listingSlug: reviewListingSlug ?? undefined
  };
  const profileHref = buildPathWithQuery(`/sellers/${sellerId}`, preservedSellerQuery);
  const showReviewComposer = Boolean(
    reviewListingId &&
      reviewListingSlug &&
      viewer &&
      viewer.user.id !== sellerId &&
      (canRateSellerFromListing || existingReview)
  );

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
                  <span>Member since {memberSinceLabel}</span>
                  {storefront.is_business ? <span>Business account</span> : null}
                  {!isStorefrontView && businessHoursStatus ? (
                    <span className={`seller-storefront-status-pill ${businessHoursStatus.isOpen ? "is-open" : ""}`}>
                      {businessHoursStatus.label}
                    </span>
                  ) : null}
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
                    <span>ID-verified business storefront</span>
                  </div>
                ) : null}

                {storefront.business_services.length ? (
                  <div className="seller-storefront-specialties">
                    {storefront.business_services.map((service) => (
                      <span key={service} className="seller-storefront-specialty-chip">
                        {service}
                      </span>
                    ))}
                  </div>
                ) : null}

                <SellerRatingInline summary={trustSummary} />
                <TrustBadges summary={trustSummary} showReviewBadge={false} />
                <SellerTrustHighlights signals={sellerSignals} />
              </div>
            </div>

            <div className="seller-storefront-rail">
              {storefront.is_business ? (
                <div className="seller-storefront-detail-grid" id="seller-details">
                  <div className="seller-storefront-detail-card">
                    <h3>Business details</h3>
                    <ul className="seller-storefront-detail-list">
                      {storefront.phone ? (
                        <li>
                          <Phone aria-hidden="true" size={15} strokeWidth={2.1} />
                          <a href={`tel:${storefront.phone}`}>{storefront.phone}</a>
                        </li>
                      ) : null}
                      {storefront.business_website ? (
                        <li>
                          <ExternalLink aria-hidden="true" size={15} strokeWidth={2.1} />
                          <a href={storefront.business_website} target="_blank" rel="noreferrer">
                            {storefront.business_website.replace(/^https?:\/\//i, "")}
                          </a>
                        </li>
                      ) : null}
                      <li>
                        <MapPin aria-hidden="true" size={15} strokeWidth={2.1} />
                        <span>{storefront.business_address || storefront.primary_location}</span>
                      </li>
                    </ul>
                  </div>

                  {businessHoursRows.length ? (
                    <div className="seller-storefront-detail-card">
                      <h3>
                        <Clock3 aria-hidden="true" size={15} strokeWidth={2.1} />
                        <span>Hours</span>
                      </h3>
                      <ul className="seller-storefront-hours-list">
                        {businessHoursRows.map((row) => (
                          <li key={row.dayKey}>
                            <span>{row.label}</span>
                            <strong className={row.closed ? "is-closed" : ""}>{row.range}</strong>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {storefrontLinks.length ? (
            <div className="seller-storefront-switcher" id="seller-storefronts">
              <Link
                className={`seller-storefront-switch-pill${!storefrontId ? " is-active" : ""}`}
                href={profileHref}
              >
                <span>Profile</span>
              </Link>
              {storefrontLinks.map((item) => (
                <Link
                  key={item.storefront_id}
                  className={`seller-storefront-switch-pill${storefrontId === item.storefront_id ? " is-active" : ""}`}
                  href={buildPathWithQuery(buildStorefrontHref(sellerId, item.storefront_id), preservedSellerQuery)}
                >
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          ) : null}

          <div className="seller-storefront-quick-nav">
            {!isStorefrontView ? (
              <a className="seller-storefront-quick-link" href="#seller-listings">
                <span>Listings</span>
                <strong>{filteredListings.length}</strong>
              </a>
            ) : null}
            {storefrontLinks.length ? (
              <a className="seller-storefront-quick-link" href="#seller-storefronts">
                <span>Storefronts</span>
                <strong>{storefrontLinks.length}</strong>
              </a>
            ) : null}
            <a className="seller-storefront-quick-link" href="#seller-reviews">
              <span>Reviews</span>
              <strong>{trustSummary?.review_count ?? 0}</strong>
            </a>
            {showReviewComposer ? (
              <a className="seller-storefront-quick-link" href="#seller-review">
                <span>Add review</span>
              </a>
            ) : null}
          </div>

          {storefront.business_image_urls.length ? (
            <StorefrontImageGallery
              images={storefront.business_image_urls}
              title={storefront.display_name}
            />
          ) : null}

          {!isStorefrontView ? (
            <div className="seller-storefront-category-row">
              {categoryCounts.map(({ category, count }) => {
                const isActive = categoryFilter === category;
                const href = buildPathWithQuery(`/sellers/${sellerId}`, {
                  storefront: storefrontId ?? undefined,
                  category: isActive ? undefined : category,
                  ...preservedSellerQuery
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
                <Link
                  className="seller-storefront-category-clear"
                  href={buildPathWithQuery(`/sellers/${sellerId}`, {
                    storefront: storefrontId ?? undefined,
                    ...preservedSellerQuery
                  })}
                >
                  Clear filter
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="seller-storefront-reviews-shell" id="seller-reviews">
          <div className="seller-storefront-reviews-head">
            <SectionHeading
              eyebrow="Reviews"
              title={`Reviews for ${storefront.display_name}`}
              description="Ratings and comments from locals who connected with this seller through ISMACONNECT."
            />
            {showReviewComposer ? (
              <Link href="#seller-review" className="button button-secondary">
                Add review
              </Link>
            ) : null}
          </div>

          {showReviewComposer ? (
            <div className="surface seller-storefront-review-form-card" id="seller-review">
              <SectionHeading
                title="Add review"
                description="Leave a quick rating based on your experience with this seller."
              />
              <SellerReviewForm
                listingId={reviewListingId!}
                listingSlug={reviewListingSlug!}
                sellerId={sellerId}
                existingReview={existingReview}
              />
            </div>
          ) : null}

          {publicReviews.length ? (
            <div className="seller-storefront-review-list">
              {publicReviews.map((review) => (
                <article key={review.id} className="seller-storefront-review-card">
                  <div className="seller-storefront-review-head">
                    <SellerRatingInline rating={review.rating} showCount={false} />
                    <span>{formatDate(review.created_at)}</span>
                  </div>
                  {review.comment ? (
                    <p className="seller-storefront-review-comment">{review.comment}</p>
                  ) : (
                    <p className="seller-storefront-review-comment is-empty">No written comment was added.</p>
                  )}
                  {review.listing_slug && review.listing_title ? (
                    <Link href={`/listings/${review.listing_slug}`} className="seller-storefront-review-link">
                      From: {review.listing_title}
                    </Link>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="surface seller-storefront-review-empty">
              <p className="section-copy">
                No reviews yet. Ratings from local conversations will start showing here as people leave feedback.
              </p>
            </div>
          )}
        </div>

        {!isStorefrontView ? (
          <div id="seller-listings" style={{ marginTop: "1.5rem" }}>
            <SectionHeading
              eyebrow="Listings"
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
        ) : null}
      </div>
    </section>
  );
}
