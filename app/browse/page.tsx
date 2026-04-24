import type { Metadata } from "next";
import Link from "next/link";

import { BrowseFilters } from "@/components/listings/browse-filters";
import { ListingCard } from "@/components/listings/listing-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { SetupNotice } from "@/components/ui/setup-notice";
import { getViewer } from "@/lib/auth";
import { CATEGORIES } from "@/lib/constants";
import { getPublicListings, getSavedListingIds } from "@/lib/data";
import { getSingleParam, resolveCategory } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Browse Listings",
  description: "Browse jobs, rentals, services, ride shares, and buy & sell listings in Fort McMurray."
};

export default async function BrowsePage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const search = getSingleParam(searchParams?.q);
  const category = resolveCategory(getSingleParam(searchParams?.category));
  const subcategory = getSingleParam(searchParams?.subcategory);

  const { listings, isConfigured } = await getPublicListings({
    search,
    category,
    subcategory,
    limit: 24
  });

  const viewer = await getViewer();

  const savedIds = viewer
    ? await getSavedListingIds(viewer.user.id)
    : new Set();

  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Browse"
          title="Search every local listing"
          description="Explore the newest rentals, rides, jobs, services, and community listings across Fort McMurray."
        />

        <BrowseFilters
          actionPath="/browse"
          category={category}
          subcategory={subcategory}
          search={search}
        />

        <div className="pill-links">
          {CATEGORIES.map((item) => (
            <Link className="pill-link" href={item.href} key={item.value}>
              {item.label}
            </Link>
          ))}
        </div>

        {!isConfigured ? (
          <SetupNotice />
        ) : listings.length === 0 ? (
          <EmptyState
            actionHref="/auth/sign-up"
            actionLabel="Post the first listing"
            description="Try broadening the search or create the listing yourself."
            title="No listings match this search"
          />
        ) : (
          <div className="listing-grid" style={{ marginTop: "1.25rem" }}>
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isSaved={savedIds.has(listing.id)}
                canSave={!!viewer}
                pathToRevalidate="/browse"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}