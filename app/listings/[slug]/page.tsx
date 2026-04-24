import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ContactSellerForm } from "@/components/messages/contact-seller-form";
import { FlagListingForm } from "@/components/listings/flag-listing-form";
import { ListingCard } from "@/components/listings/listing-card";
import { FlashMessage } from "@/components/ui/flash-message";
import { SectionHeading } from "@/components/ui/section-heading";
import { getViewer } from "@/lib/auth";
import { CATEGORY_MAP, SITE_NAME } from "@/lib/constants";
import { excerpt, formatCurrency, formatDate, getSingleParam } from "@/lib/utils";
import { SaveListingButton } from "@/components/listings/save-listing-button";
import { getPublicListingBySlug, getRelatedListings, getSavedListingIds } from "@/lib/data";

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
  const category = CATEGORY_MAP[listing.category];
  const success = getSingleParam(resolvedSearchParams?.success);
  const error = getSingleParam(resolvedSearchParams?.error);

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
                  {listing.is_featured ? <span className="badge badge-featured">Featured</span> : null}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
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
              {listing.image_urls && listing.image_urls.length > 0 ? (
                <div>
                  {/* MAIN IMAGE */}
                  <img
                    src={listing.image_urls[0]}
                    alt={listing.title}
                    style={{
                      width: "100%",
                      borderRadius: "16px",
                      objectFit: "cover"
                    }}
                  />

                  {/* THUMBNAILS */}
                  {listing.image_urls.length > 1 ? (
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        marginTop: "0.5rem",
                        overflowX: "auto"
                      }}
                    >
                      {listing.image_urls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt="Thumbnail"
                          style={{
                            width: "80px",
                            height: "80px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            border: "1px solid #d0d5dd"
                          }}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : listing.image_url ? (
                <img src={listing.image_url} alt={listing.title} />
              ) : (
                <div className="listing-placeholder">
                  <span>{category.label}</span>
                </div>
              )}
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
                <div className="detail-card">
                  <SectionHeading
                    eyebrow="Contact Seller"
                    title="Send a message"
                    description="Ask if this listing is still available or request more details."
                  />
                  <ContactSellerForm listingId={listing.id} />
                </div>
              ) : (
                <div className="detail-card">
                  <SectionHeading
                    eyebrow="Your Listing"
                    title="You own this listing"
                    description="Use your dashboard to edit details, upload images, or remove the post."
                  />
                  <Link href="/dashboard" className="button button-secondary">
                    Go to dashboard
                  </Link>
                </div>
              )
            ) : (
              <div className="detail-card">
                <SectionHeading
                  eyebrow="Contact Seller"
                  title="Sign in to message"
                  description="Create an account or sign in to contact the seller directly."
                />
                <Link href="/auth/sign-in" className="button">
                  Sign in to message
                </Link>
              </div>
            )}
          </div>

          <aside className="detail-side">
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
            <div className="listing-grid">
              {relatedListings.map((relatedListing) => (
                <ListingCard key={relatedListing.id} listing={relatedListing} />
              ))}
            </div>
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