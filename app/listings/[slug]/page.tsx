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
import { CATEGORY_MAP, SITE_NAME } from "@/lib/constants";
import {
  getConversationForListing,
  getPublicListingBySlug,
  getRelatedListings,
  getSavedListingIds,
} from "@/lib/data";
import {
  canViewerRateSeller,
  getSellerTrustSummary,
  getSellerTrustSummaryMap,
  getViewerSellerReview
} from "@/lib/trust";
import { excerpt, formatCurrency, formatDate, getSingleParam } from "@/lib/utils";

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

  const images =
    listing.image_urls && listing.image_urls.length > 0
      ? listing.image_urls
      : listing.image_url
        ? [listing.image_url]
        : [];

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

                  {listing.is_featured ? (
                    <span className="badge badge-featured">Featured</span>
                  ) : null}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "1rem"
                  }}
                >
                  <ListingViewTracker listingId={listing.id} />

                  <h1 className="detail-title" style={{ marginBottom: 0 }}>
                    {listing.title}
                  </h1>

                  {viewer && viewer.user.id !== listing.owner_id ? (
                    <SaveListingButton
                      listingId={listing.id}
                      isSaved={isSaved}
                      pathToRevalidate={`/listings/${listing.slug}`}
                    />
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
                <span>Location: {listing.location}</span>
                <span>Posted: {formatDate(listing.created_at)}</span>
                <span>Price: {formatCurrency(listing.price)}</span>
              </div>
            </div>

            {viewer ? (
              viewer.user.id !== listing.owner_id ? (
                existingConversation ? (
                  <div className="detail-card">
                    <SectionHeading
                      eyebrow="Conversation"
                      title="Continue your chat"
                      description="You already contacted this seller about this listing."
                    />

                    <Link href={`/messages/${existingConversation.id}`} className="button">
                      💬 Open Conversation
                    </Link>
                  </div>
                ) : (
                  <div className="detail-card">
                    <SectionHeading
                      eyebrow="Contact Seller"
                      title="Send a message"
                      description="Ask if this listing is still available or request more details."
                    />
                    <ContactSellerForm listingId={listing.id} />
                  </div>
                )
              ) : (
                <div className="detail-card">
                  <SectionHeading
                    eyebrow="Your Listing"
                    title="You own this listing"
                    description="Use My Listings to edit details, upload images, or remove the post."
                  />
                  <Link href="/dashboard" className="button button-secondary">
                    Go to My Listings
                  </Link>
                </div>
              )
            ) : (
              <div className="detail-card">
                <SectionHeading
                  eyebrow="Contact"
                  title="Unlock seller details 🔓"
                  description="Join ISMACONNECT to instantly message sellers and get faster responses."
                />

                <div className="meta-list blurred-contact-preview">
                  <span>
                    👤{" "}
                    {listing.contact_name
                      ? `${listing.contact_name.split(" ")[0]} ******`
                      : "Seller ******"}
                  </span>
                  {listing.contact_email ? <span>📧 ********@*****.com</span> : null}
                  {listing.contact_phone ? (
                    <span>📞 ***-***-{listing.contact_phone.slice(-4)}</span>
                  ) : null}
                </div>

                <div className="unlock-box">
                  <p className="unlock-text">🔥 This listing is getting attention</p>

                  <p style={{ fontSize: "0.85rem", color: "#667085" }}>
                    👀 {(listing as any).views ?? 0} people viewed this listing
                  </p>

                  <Link href="/auth/sign-in" className="button unlock-button">
                    Unlock Contact Info
                  </Link>

                  <p className="unlock-sub">Takes less than 10 seconds • No spam</p>
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
            <div className="detail-card">
              <SectionHeading
                eyebrow="Seller Trust"
                title={listing.contact_name}
                description="Verification and ratings help locals choose who to message first."
              />

              <TrustBadges summary={sellerTrustSummary} />

              <div className="meta-list" style={{ marginTop: "1rem" }}>
                <span>
                  Rating:{" "}
                  {sellerTrustSummary?.review_count
                    ? `${sellerTrustSummary.average_rating?.toFixed(1)} from ${sellerTrustSummary.review_count} reviews`
                    : "No ratings yet"}
                </span>
                <span>
                  Verification:{" "}
                  {sellerTrustSummary?.verification_status === "verified"
                    ? "Verified seller"
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
                  trustSummary={relatedTrustMap.get(relatedListing.owner_id)}
                />
              ))}
            </div>
          </div>
        ) : null}

        {!viewer ? (
          <div className="mobile-unlock-bar">
            <Link href="/auth/sign-in" className="button">
              🔓 Unlock Contact
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
