import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ContactSellerForm } from "@/components/messages/contact-seller-form";
import { ListingViewTracker } from "@/components/listings/listing-view-tracker";
import { FlagListingForm } from "@/components/listings/flag-listing-form";
import { ListingCard } from "@/components/listings/listing-card";
import { ListingImageGallery } from "@/components/listings/listing-image-gallery";
import { SaveListingButton } from "@/components/listings/save-listing-button";
import { SellerReviewForm } from "@/components/trust/seller-review-form";
import { TrustBadges } from "@/components/trust/trust-badges";
import { FlashMessage } from "@/components/ui/flash-message";
import { SectionHeading } from "@/components/ui/section-heading";
import { getViewer } from "@/lib/auth";
import { buildStorefrontHref } from "@/lib/business-storefronts";
import { getListingBoostState } from "@/lib/boost-products";
import { CATEGORY_MAP, LISTING_INTENT_LABELS, REQUEST_WINDOW_LABELS, SITE_NAME } from "@/lib/constants";
import {
  getConversationForListing,
  getPublicListingBySlug,
  getRelatedListings,
  getSavedListingIds,
} from "@/lib/data";
import { getListingFreshness } from "@/lib/listing-freshness";
import { getPublicListingLocationLabel } from "@/lib/local-marketplace";
import { getPublicListingImages } from "@/lib/listing-media";
import {
  getStructuredCrossListingMatchHints,
  getStructuredDetailItems
} from "@/lib/listing-structured-fields";
import {
  canViewerRateSeller,
  getSellerTrustSummary,
  getSellerTrustSummaryMap,
  getViewerSellerReview
} from "@/lib/trust";
import { getSellerReviewSummary } from "@/lib/trust-presentation";
import {
  excerpt,
  formatDate,
  formatListingPrice,
  getListingPriceTypeLabel,
  getSingleParam
} from "@/lib/utils";

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getPublicListingBySlug(slug);

  if (!listing) {
    return {
      title: "Listing not found",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  return {
    title: listing.title,
    description: excerpt(listing.description, 155)
  };
}

export default async function ListingPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const listing = await getPublicListingBySlug(slug);

  if (!listing) {
    notFound();
  }

  const viewer = await getViewer();

  const savedIds = viewer ? await getSavedListingIds(viewer.user.id) : new Set();
  const isSaved = viewer ? savedIds.has(listing.id) : false;
  const relatedListings = await getRelatedListings(listing);
  const relatedTrustMap = await getSellerTrustSummaryMap(relatedListings.map((item) => item.owner_id));
  const sellerTrustSummary = await getSellerTrustSummary(listing.owner_id);
  const category = CATEGORY_MAP[listing.category as keyof typeof CATEGORY_MAP];

  const existingConversation =
    viewer && viewer.user.id !== listing.owner_id
      ? await getConversationForListing(listing.id, viewer.user.id)
      : null;
  const existingReview =
    viewer && viewer.user.id !== listing.owner_id
      ? await getViewerSellerReview(listing.id, viewer.user.id)
      : null;
  const canRateSeller =
    viewer && viewer.user.id !== listing.owner_id
      ? await canViewerRateSeller(listing.id, viewer.user.id, listing.owner_id)
      : false;

  const success = getSingleParam(resolvedSearchParams?.success);
  const error = getSingleParam(resolvedSearchParams?.error);

  const images = getPublicListingImages(listing);
  const { featuredActive, urgentActive, boostedActive } = getListingBoostState(listing);
  const freshness = getListingFreshness(listing.created_at);
  const structuredDetailItems = getStructuredDetailItems(listing.category, listing.structured_data);
  const publicLocation = getPublicListingLocationLabel(listing);
  const publicLocationLabel = listing.show_exact_address_on_map ? "Address" : "Community";
  const listingIntent = listing.listing_intent === "need" ? "need" : "offer";
  const isNeed = listingIntent === "need";
  const requestWindowLabel = listing.request_window ? REQUEST_WINDOW_LABELS[listing.request_window] : null;
  const isOwner = viewer?.user.id === listing.owner_id;
  const canUseMobileActions = !isOwner;
  const storefrontHref = buildStorefrontHref(listing.owner_id, listing.storefront_id);
  const mobilePrimaryHref = viewer
    ? existingConversation
      ? `/messages/${existingConversation.id}`
      : "#message-seller"
    : "/auth/sign-in";
  const mobilePrimaryLabel = viewer
    ? existingConversation
      ? "Open chat"
      : isNeed
        ? "Respond now"
        : "Message seller"
    : "Sign in to unlock";
  const contactEyebrow = isNeed ? "Respond" : "Contact Seller";
  const contactTitle = isNeed ? "Respond to this request" : "Send a message";
  const contactDescription = isNeed
    ? "Let them know if you can help, what you can offer, and when you are available."
    : "Ask if this listing is still available or request more details.";
  const ownerTitle = isNeed ? "You posted this request" : "You own this listing";
  const ownerDescription = isNeed
    ? "Use My Listings to update the request, close it once you get help, or boost it for faster replies."
    : "Use My Listings to edit details, upload images, remove the post, or run paid boosts.";
  const unlockTitle = isNeed ? "Unlock requester details" : "Unlock seller details";
  const unlockButton = isNeed ? "Unlock contact details" : "Unlock Contact Info";
  const unlockText = isNeed ? "This request is drawing local attention" : "This listing is getting attention";
  const trustDescription = isNeed
    ? "Verification and ratings help locals decide who to reply to first."
    : "Verification and ratings help locals choose who to message first.";
  const staleListingNotice = freshness.isStale
    ? listing.category === "ride-share"
      ? "This ride post is older than two weeks. Confirm the route, timing, and seat availability before heading out."
      : isNeed
        ? "This request is older than two weeks. Double-check that help is still needed before you reply."
        : "This listing is older than two weeks. Confirm availability before making plans or travelling to meet."
    : null;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ClassifiedAd",
    name: listing.title,
    description: listing.description,
    category: category.label,
    areaServed: "Fort McMurray, Alberta",
    datePosted: listing.created_at,
    provider: {
      "@type": "WebSite",
      name: SITE_NAME
    },
    offers:
      listing.price !== null
        ? {
            "@type": "Offer",
            price: listing.price,
            priceCurrency: "CAD"
          }
        : undefined
  };

  return (
    <section className="section">
      <div className="container">
        <FlashMessage message={success} tone="success" />
        <FlashMessage message={error} tone="error" />

        <div className="detail-grid">
          <div className="detail-main">
            <div className="detail-card">
              <div className="detail-header">
                <div className="badge-row">
                  <Link className="badge badge-soft" href={category.href}>
                    {category.label}
                  </Link>
                  <span className="badge badge-soft">{LISTING_INTENT_LABELS[listingIntent]}</span>
                  {requestWindowLabel ? <span className="badge badge-subcategory">{requestWindowLabel}</span> : null}

                  {featuredActive ? (
                    <span className="badge badge-featured">Featured</span>
                  ) : null}
                  {urgentActive ? <span className="badge badge-urgent">Urgent</span> : null}
                  {boostedActive ? <span className="badge badge-soft">Boosted</span> : null}
                </div>

                <div className="detail-headline">
                  <div className="detail-title-group">
                    <h1 className="detail-title">
                      {listing.title}
                    </h1>
                    <div className="detail-top-meta">
                      <span>{publicLocation}</span>
                      <span aria-hidden="true">|</span>
                      <span>{formatDate(listing.created_at)}</span>
                    </div>
                  </div>
                  {viewer && viewer.user.id !== listing.owner_id ? (
                    <SaveListingButton
                      listingId={listing.id}
                      isSaved={isSaved}
                      pathToRevalidate={`/listings/${listing.slug}`}
                    />
                  ) : null}
                </div>

                <div className="detail-summary-row">
                  <span className="detail-price">
                    {formatListingPrice(listing.price, listing.price_type, listingIntent)}
                  </span>
                  <div className="detail-summary-meta">
                    <ListingViewTracker listingId={listing.id} />
                  </div>
                </div>

                {staleListingNotice ? (
                  <div className="detail-stale-notice">
                    <strong>{freshness.detailLabel}</strong>
                    <span>{staleListingNotice}</span>
                  </div>
                ) : null}

                <div className="detail-mobile-trust-strip">
                  <div className="detail-mobile-trust-head">
                    <div className="detail-mobile-trust-owner">
                      <strong>{listing.contact_name}</strong>
                      <span>{isNeed ? "Local requester" : "Local seller"}</span>
                    </div>
                    <Link href={storefrontHref} className="detail-mobile-storefront-link">
                      Storefront
                    </Link>
                  </div>

                  <TrustBadges summary={sellerTrustSummary} compact />
                  <div className="detail-mobile-trust-meta">
                    <span>
                      {sellerTrustSummary?.verification_status === "verified"
                        ? "ID verified seller"
                        : sellerTrustSummary?.verification_status === "pending"
                          ? "Verification pending"
                          : "Check seller trust before meeting"}
                    </span>
                    <span>
                      {sellerTrustSummary?.member_since
                        ? `Member since ${formatDate(sellerTrustSummary.member_since)}`
                        : "New local seller"}
                    </span>
                  </div>
                  {listing.category === "ride-share" ? (
                    <Link href="/safety" className="detail-mobile-safety-link">
                      Ride-share safety guide
                    </Link>
                  ) : null}
                </div>

                <p className="detail-copy">{listing.description}</p>
              </div>

              <div className="listing-media" style={{ marginTop: "1.25rem" }}>
                <ListingImageGallery
                  title={listing.title}
                  categoryLabel={category.label}
                  images={images}
                />
              </div>
            </div>

            <div className="detail-card">
              <SectionHeading
                eyebrow="Listing Details"
                title="What people should know"
                description="Clear local details keep replies fast and reduce back-and-forth."
              />

                <div className="meta-list">
                  <span>Category: {category.label}</span>
                  <span>Post type: {LISTING_INTENT_LABELS[listingIntent]}</span>
                  {requestWindowLabel ? <span>Need timing: {requestWindowLabel}</span> : null}
                  <span>{publicLocationLabel}: {publicLocation}</span>
                  <span>Posted: {formatDate(listing.created_at)}</span>
                  <span>
                    {isNeed ? "Budget" : "Price"}: {formatListingPrice(listing.price, listing.price_type, listingIntent)}
                  </span>
                  <span>Pricing: {getListingPriceTypeLabel(listing.price_type)}</span>
                  {structuredDetailItems.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                  {featuredActive && listing.featured_until ? (
                    <span>Featured until: {formatDate(listing.featured_until)}</span>
                  ) : null}
                  {urgentActive && listing.urgent_until ? (
                    <span>Urgent until: {formatDate(listing.urgent_until)}</span>
                  ) : null}
                </div>
              </div>

            {viewer ? (
              viewer.user.id !== listing.owner_id ? (
                existingConversation ? (
                  <div className="detail-card detail-conversation-card">
                    <SectionHeading
                      eyebrow="Conversation"
                      title="Continue your chat"
                      description={
                        isNeed
                          ? "You already replied to this request. Jump back into the thread."
                          : "You already contacted this seller about this listing."
                      }
                    />

                    <Link href={`/messages/${existingConversation.id}`} className="button">
                      Open conversation
                    </Link>
                  </div>
                ) : (
                  <div className="detail-card detail-contact-card" id="message-seller">
                    <SectionHeading
                      eyebrow={contactEyebrow}
                      title={contactTitle}
                      description={contactDescription}
                    />
                    <ContactSellerForm listingId={listing.id} listingIntent={listingIntent} />
                  </div>
                )
              ) : (
                <div className="detail-card">
                  <SectionHeading
                    eyebrow="Your Listing"
                    title={ownerTitle}
                    description={ownerDescription}
                  />
                  <div className="action-row">
                    <Link href="/dashboard" className="button button-secondary">
                      Go to My Listings
                    </Link>
                    <Link href={`/dashboard/listings/${listing.id}/boost`} className="button">
                      Promote listing
                    </Link>
                  </div>
                </div>
              )
            ) : (
              <div className="detail-card detail-guest-unlock-card">
                <SectionHeading
                  eyebrow="Contact"
                  title={unlockTitle}
                  description="Join ISMACONNECT to instantly message sellers and get faster responses."
                />

                <div className="meta-list blurred-contact-preview">
                  <span>
                    Seller:{" "}
                    {listing.contact_name
                      ? `${listing.contact_name.split(" ")[0]} ******`
                      : "Seller ******"}
                  </span>
                  {listing.contact_email ? <span>Email: ********@*****.com</span> : null}
                  {listing.contact_phone ? (
                    <span>Phone: ***-***-{listing.contact_phone.slice(-4)}</span>
                  ) : null}
                </div>

                <div className="unlock-box">
                  <p className="unlock-text">{unlockText}</p>

                  <Link href="/auth/sign-in" className="button unlock-button">
                    {unlockButton}
                  </Link>

                  <p className="unlock-sub">Takes less than 10 seconds | No spam</p>
                </div>
              </div>
            )}

            {viewer && viewer.user.id !== listing.owner_id && (canRateSeller || existingReview) ? (
              <div className="detail-card">
                <SectionHeading
                  eyebrow="Seller Rating"
                  title="Rate this seller"
                  description="Share a quick trust signal after messaging this seller through ISMACONNECT."
                />
                <SellerReviewForm
                  listingId={listing.id}
                  listingSlug={listing.slug}
                  sellerId={listing.owner_id}
                  existingReview={existingReview}
                />
              </div>
            ) : null}
          </div>

          <aside className="detail-side">
            <div className="detail-card detail-seller-card">
              <SectionHeading
                eyebrow={isNeed ? "Poster Trust" : "Seller Trust"}
                title={listing.contact_name}
                description={trustDescription}
              />

              <div className="action-row" style={{ marginBottom: "1rem" }}>
                <Link
                  className="button button-secondary"
                  href={storefrontHref}
                >
                  View seller storefront
                </Link>
              </div>

              <TrustBadges summary={sellerTrustSummary} />

              <div className="meta-list" style={{ marginTop: "1rem" }}>
                <span>
                  Rating: {getSellerReviewSummary(sellerTrustSummary)}
                </span>
                  <span>
                    Verification:{" "}
                  {sellerTrustSummary?.verification_status === "verified"
                    ? "ID verified"
                    : sellerTrustSummary?.verification_status === "pending"
                      ? "Verification pending"
                      : "Not verified yet"}
                </span>
                <span>
                  Member since:{" "}
                  {sellerTrustSummary?.member_since
                    ? formatDate(sellerTrustSummary.member_since)
                    : "Recently joined"}
                </span>
              </div>
            </div>

            {viewer ? (
              <div className="detail-card">
                <SectionHeading
                  eyebrow="Contact"
                  title={listing.contact_name}
                  description="Reach out directly using the seller's preferred contact details."
                />

                <div className="meta-list">
                  {listing.contact_email ? <span>Email: {listing.contact_email}</span> : null}
                  {listing.contact_phone ? <span>Phone: {listing.contact_phone}</span> : null}
                  {!listing.contact_email && !listing.contact_phone ? (
                    <span>Contact details available after seller update.</span>
                  ) : null}
                </div>
              </div>
            ) : null}

            {viewer && viewer.user.id !== listing.owner_id ? (
              <div className="detail-card">
                <SectionHeading
                  eyebrow="Safety"
                  title="Flag this listing"
                  description="Signed-in users can report suspicious or misleading posts for admin review."
                />
                <FlagListingForm listingId={listing.id} />
              </div>
            ) : null}
          </aside>
        </div>

        {canUseMobileActions ? (
          <div className="detail-mobile-action-bar">
            <div className="detail-mobile-action-shell">
              <Link href={mobilePrimaryHref} className="button detail-mobile-action-main">
                {mobilePrimaryLabel}
              </Link>
              {viewer ? (
                <div className="detail-mobile-action-save">
                  <SaveListingButton
                    listingId={listing.id}
                    isSaved={isSaved}
                    pathToRevalidate={`/listings/${listing.slug}`}
                  />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {relatedListings.length > 0 ? (
          <div style={{ marginTop: "2rem" }}>
            <SectionHeading
              eyebrow="More Like This"
              title={`Other ${category.label.toLowerCase()} listings`}
              description="Keep browsing similar opportunities in the marketplace."
            />

            <div className="listing-grid listing-feed-grid">
              {relatedListings.map((relatedListing) => (
                <ListingCard
                  key={relatedListing.id}
                  listing={relatedListing}
                  isSaved={savedIds.has(relatedListing.id)}
                  canSave
                  pathToRevalidate={`/listings/${listing.slug}`}
                  matchHints={getStructuredCrossListingMatchHints(
                    listing.category,
                    listing.structured_data,
                    relatedListing.structured_data
                  )}
                  trustSummary={relatedTrustMap.get(relatedListing.owner_id)}
                />
              ))}
            </div>
          </div>
        ) : null}

        {!viewer ? (
          <div className="mobile-unlock-bar">
            <Link href="/auth/sign-in" className="button">
              Unlock contact
            </Link>
          </div>
        ) : null}

        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          suppressHydrationWarning
          type="application/ld+json"
        />
      </div>
    </section>
  );
}
