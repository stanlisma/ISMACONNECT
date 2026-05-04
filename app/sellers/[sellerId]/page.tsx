import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ListingCard } from "@/components/listings/listing-card";
import { TrustBadges } from "@/components/trust/trust-badges";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { getViewer } from "@/lib/auth";
import { getPublicSellerStorefront, getSavedListingIds } from "@/lib/data";
import { getSellerTrustSummary, getSellerTrustSummaryMap } from "@/lib/trust";
import { getCategoryLabel } from "@/lib/utils";

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
    description: `Browse active local marketplace listings from ${storefront.display_name} on ISMACONNECT.`
  };
}

export default async function SellerStorefrontPage({
  params
}: {
  params: Promise<{ sellerId: string }>;
}) {
  const { sellerId } = await params;
  const storefront = await getPublicSellerStorefront(sellerId);

  if (!storefront) {
    notFound();
  }

  const viewer = await getViewer();
  const savedIds = viewer ? await getSavedListingIds(viewer.user.id) : new Set();
  const trustSummary = await getSellerTrustSummary(sellerId);
  const trustMap = await getSellerTrustSummaryMap(storefront.listings.map((listing) => listing.owner_id));

  return (
    <section className="section">
      <div className="container">
        <div className="surface seller-storefront-hero">
          <div className="seller-storefront-copy">
            <span className="eyebrow">Seller storefront</span>
            <h1 className="section-title">{storefront.display_name}</h1>
            <p className="section-copy">
              Review this seller&apos;s active listings, trust badges, and category footprint before you message.
            </p>
          </div>

          <div className="seller-storefront-summary">
            <TrustBadges summary={trustSummary} />

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
                <span>Primary area</span>
                <strong>{storefront.primary_location.split(",")[0]}</strong>
              </div>
            </div>

            <div className="badge-row">
              {storefront.active_categories.map((category) => (
                <Link className="badge badge-soft" href={`/browse?category=${category}`} key={category}>
                  {getCategoryLabel(category)}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: "1.5rem" }}>
          <SectionHeading
            eyebrow="Active Listings"
            title={`Live posts from ${storefront.display_name}`}
            description="These listings are currently visible across browse and category feeds."
          />

          {storefront.listings.length ? (
            <div className="listing-grid listing-feed-grid">
              {storefront.listings.map((listing) => (
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
              actionHref="/browse"
              actionLabel="Browse all listings"
              description="This seller does not have active public listings right now."
              title="No active listings"
            />
          )}
        </div>
      </div>
    </section>
  );
}
