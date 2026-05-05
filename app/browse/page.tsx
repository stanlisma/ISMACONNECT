import type { Metadata } from "next";
import Link from "next/link";

import { BrowseFilters } from "@/components/listings/browse-filters";
import { ListingCard } from "@/components/listings/listing-card";
import { SaveSearchToggle } from "@/components/saved-searches/save-search-toggle";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { SetupNotice } from "@/components/ui/setup-notice";
import { getViewer } from "@/lib/auth";
import { CATEGORIES } from "@/lib/constants";
import { getPublicListings, getSavedListingIds } from "@/lib/data";
import { getStructuredFilterDefinitions } from "@/lib/listing-structured-fields";
import { buildSavedSearchHref, getSavedSearchByFilters } from "@/lib/saved-searches";
import { getSellerTrustSummaryMap } from "@/lib/trust";
import { buildPathWithQuery, getPositiveIntParam, getSingleParam, resolveCategory } from "@/lib/utils";

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
  const page = getPositiveIntParam(resolvedSearchParams?.page, 1);

  const minPrice = minPriceParam ? Number(minPriceParam) : null;
  const maxPrice = maxPriceParam ? Number(maxPriceParam) : null;
  const sort = getSingleParam(resolvedSearchParams?.sort);
  const structuredFilters = Object.fromEntries(
    getStructuredFilterDefinitions(category)
      .map((field) => {
        const value = getSingleParam(resolvedSearchParams?.[field.name]);
        return value ? ([field.name, value] as const) : null;
      })
      .filter(Boolean) as Array<readonly [string, string]>
  );

  const { listings, isConfigured, hasMore, totalCount, pageSize } = await getPublicListings({
    search,
    category,
    subcategory,
    minPrice,
    maxPrice,
    sort,
    extraFilters: structuredFilters,
    limit: 24,
    page
  });

  const viewer = await getViewer();

  const savedIds = viewer ? await getSavedListingIds(viewer.user.id) : new Set();
  const trustMap = await getSellerTrustSummaryMap(listings.map((listing) => listing.owner_id));
  const savedSearch = viewer
    ? await getSavedSearchByFilters(viewer.user.id, {
        path: "/browse",
        search,
        category,
        subcategory,
        minPrice,
        maxPrice,
        sort,
        extraFilters: structuredFilters
      })
    : null;
  const returnTo = buildSavedSearchHref({
    path: "/browse",
    search,
    category,
    subcategory,
    minPrice,
    maxPrice,
    sort,
    extraFilters: structuredFilters
  });

  const categoryLabel = category
    ? CATEGORIES.find((item) => item.value === category)?.label
    : null;
  const firstVisibleResult = listings.length ? (page - 1) * pageSize + 1 : 0;
  const lastVisibleResult = listings.length ? firstVisibleResult + listings.length - 1 : 0;
  const previousPageHref =
    page > 1
      ? buildPathWithQuery("/browse", {
          q: search,
          category,
          subcategory,
          minPrice,
          maxPrice,
          sort,
          ...structuredFilters,
          page: page - 1 > 1 ? page - 1 : undefined
        })
      : null;
  const nextPageHref = hasMore
    ? buildPathWithQuery("/browse", {
        q: search,
        category,
        subcategory,
        minPrice,
        maxPrice,
        sort,
        ...structuredFilters,
        page: page + 1
      })
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
          structuredFilters={structuredFilters}
        />

        <SaveSearchToggle
          viewerId={viewer?.user.id}
          actionPath="/browse"
          returnTo={returnTo}
          search={search}
          category={category}
          subcategory={subcategory}
          minPrice={minPrice}
          maxPrice={maxPrice}
          sort={sort}
          extraFilters={structuredFilters}
          isSaved={Boolean(savedSearch)}
        />

        <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#667085" }}>
          {totalCount > 0
            ? `Showing ${firstVisibleResult}-${lastVisibleResult} of ${totalCount} results`
            : "0 results found"}
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
          <>
            <div className="listing-grid listing-feed-grid" style={{ marginTop: "1.25rem" }}>
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isSaved={savedIds.has(listing.id)}
                  canSave
                  pathToRevalidate="/browse"
                  trustSummary={trustMap.get(listing.owner_id)}
                />
              ))}
            </div>

            {previousPageHref || nextPageHref ? (
              <div className="action-row" style={{ marginTop: "1.25rem", justifyContent: "space-between" }}>
                <div>
                  {previousPageHref ? (
                    <Link className="button button-secondary" href={previousPageHref}>
                      Previous page
                    </Link>
                  ) : null}
                </div>

                <div>
                  {nextPageHref ? (
                    <Link className="button" href={nextPageHref}>
                      Load more listings
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
