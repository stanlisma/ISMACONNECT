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
  description:
    "Browse jobs, rentals, services, ride shares, and buy & sell listings in Fort McMurray.",
};

export default async function BrowsePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const search = getSingleParam(resolvedSearchParams?.q);
  const category = resolveCategory(getSingleParam(resolvedSearchParams?.category));
  const subcategory = getSingleParam(resolvedSearchParams?.subcategory);

  const minPriceParam = getSingleParam(resolvedSearchParams?.minPrice);
  const maxPriceParam = getSingleParam(resolvedSearchParams?.maxPrice);

  const minPrice = minPriceParam ? Number(minPriceParam) : null;
  const maxPrice = maxPriceParam ? Number(maxPriceParam) : null;
  const sort = getSingleParam(resolvedSearchParams?.sort);

  const { listings, isConfigured } = await getPublicListings({
    search,
    category,
    subcategory,
    minPrice,
    maxPrice,
    sort,
    limit: 24,
  });

  const viewer = await getViewer();

  const savedIds = viewer ? await getSavedListingIds(viewer.user.id) : new Set();

  const categoryLabel = category
    ? CATEGORIES.find((item) => item.value === category)?.label
    : null;

  return (
    <section className="section listing-feed-section">
      <div className="container listing-feed-container">
        <SectionHeading
          eyebrow={category ? "Category" : "Browse"}
          title={categoryLabel ? `${categoryLabel} Listings` : "Search every local listing"}
          description="Explore the newest rentals, rides, jobs, services, and community listings across Fort McMurray."
        />

        <BrowseFilters
          actionPath="/browse"
          category={category}
          subcategory={subcategory}
          search={search}
          minPrice={minPrice}
          maxPrice={maxPrice}
          sort={sort}
        />

        <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#667085" }}>
          {listings.length} results found
        </p>

        <div className="pill-links">
          <Link className="pill-link" href="/browse">
            All listings
          </Link>

          {CATEGORIES.map((item) => (
            <Link
              className="pill-link"
              href={`/browse?category=${item.value}`}
              key={item.value}
            >
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
          <div className="listing-grid listing-feed-grid" style={{ marginTop: "1.25rem" }}>
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isSaved={savedIds.has(listing.id)}
                canSave
                pathToRevalidate="/browse"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
