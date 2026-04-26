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

  const minPrice = Number(getSingleParam(resolvedSearchParams?.minPrice)) || null;
  const maxPrice = Number(getSingleParam(resolvedSearchParams?.maxPrice)) || null;
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
    <section className="section">
      <div className="container">
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