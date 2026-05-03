import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BrowseFilters } from "@/components/listings/browse-filters";
import { ListingCard } from "@/components/listings/listing-card";
import { SaveSearchToggle } from "@/components/saved-searches/save-search-toggle";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { SetupNotice } from "@/components/ui/setup-notice";
import { getViewer } from "@/lib/auth";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/constants";
import { getPublicListings, getSavedListingIds } from "@/lib/data";
import { buildSavedSearchHref, getSavedSearchByFilters } from "@/lib/saved-searches";
import { getSellerTrustSummaryMap } from "@/lib/trust";
import { getSingleParam, resolveCategory } from "@/lib/utils";

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({
    category: category.value
  }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: categoryParam } = await params;
  const category = resolveCategory(categoryParam);

  if (!category) {
    return {
      title: "Category Not Found"
    };
  }

  return {
    title: CATEGORY_MAP[category].seoTitle,
    description: CATEGORY_MAP[category].description
  };
}

export default async function CategoryPage({
  params,
  searchParams
}: {
  params: Promise<{ category: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { category: categoryParam } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const category = resolveCategory(categoryParam);

  if (!category) {
    notFound();
  }

  const search = getSingleParam(resolvedSearchParams?.q);
  const minPriceParam = getSingleParam(resolvedSearchParams?.minPrice);
  const maxPriceParam = getSingleParam(resolvedSearchParams?.maxPrice);

  const minPrice = minPriceParam ? Number(minPriceParam) : null;
  const maxPrice = maxPriceParam ? Number(maxPriceParam) : null;
  
  const sort = getSingleParam(resolvedSearchParams?.sort);
  const subcategory = getSingleParam(resolvedSearchParams?.subcategory);

  const categoryInfo = CATEGORY_MAP[category];
  const viewer = await getViewer();
  const savedIds = viewer ? await getSavedListingIds(viewer.user.id) : new Set();
  const savedSearch = viewer
    ? await getSavedSearchByFilters(viewer.user.id, {
        path: categoryInfo.href,
        search,
        category,
        subcategory,
        minPrice,
        maxPrice,
        sort
      })
    : null;
  const returnTo = buildSavedSearchHref({
    path: categoryInfo.href,
    search,
    category,
    subcategory,
    minPrice,
    maxPrice,
    sort
  });

  const { listings, isConfigured } = await getPublicListings({
    category,
    subcategory,
    search,
    minPrice,
    maxPrice,
    sort,
    limit: 24
  });
  const trustMap = await getSellerTrustSummaryMap(listings.map((listing) => listing.owner_id));

  return (
    <section className="section listing-feed-section">
      <div className="container listing-feed-container">
        <SectionHeading
          eyebrow="Category"
          title={categoryInfo.label}
          description={categoryInfo.description}
        />

        <BrowseFilters
          actionPath={categoryInfo.href}
          search={search}
          category={category}
          subcategory={subcategory}
          minPrice={minPrice}
          maxPrice={maxPrice}
          sort={sort}
          showCategorySelect={false}
        />

        <SaveSearchToggle
          viewerId={viewer?.user.id}
          actionPath={categoryInfo.href}
          returnTo={returnTo}
          search={search}
          category={category}
          subcategory={subcategory}
          minPrice={minPrice}
          maxPrice={maxPrice}
          sort={sort}
          isSaved={Boolean(savedSearch)}
        />

        <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#667085" }}>
          {listings.length} results found
        </p>

        <div className="pill-links">
          <Link className="pill-link" href="/browse">
            All listings
          </Link>

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
            actionLabel="Post in this category"
            description={`No ${categoryInfo.label.toLowerCase()} listings are live yet. Add the first one.`}
            title={`No ${categoryInfo.label.toLowerCase()} listings found`}
          />
        ) : (
          <div className="listing-grid listing-feed-grid" style={{ marginTop: "1.25rem" }}>
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isSaved={savedIds.has(listing.id)}
                canSave
                pathToRevalidate={categoryInfo.href}
                trustSummary={trustMap.get(listing.owner_id)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
