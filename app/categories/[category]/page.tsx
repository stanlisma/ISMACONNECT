import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BrowseFilters } from "@/components/listings/browse-filters";
import { ListingCard } from "@/components/listings/listing-card";
import { LocalMapExplorer } from "@/components/listings/local-map-explorer";
import { SaveSearchToggle } from "@/components/saved-searches/save-search-toggle";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { SetupNotice } from "@/components/ui/setup-notice";
import { getViewer } from "@/lib/auth";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/constants";
import { getPublicListings, getSavedListingIds } from "@/lib/data";
import { getStructuredFilterDefinitions } from "@/lib/listing-structured-fields";
import {
  getCategoryLocalContent,
  getCategorySeoTitle
} from "@/lib/local-marketplace";
import { buildSavedSearchHref, getSavedSearchByFilters } from "@/lib/saved-searches";
import { getSellerTrustSummaryMap } from "@/lib/trust";
import { buildPathWithQuery, getPositiveIntParam, getSingleParam, resolveCategory } from "@/lib/utils";

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
    title: getCategorySeoTitle(category),
    description: getCategoryLocalContent(category).heroDescription
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
  const page = getPositiveIntParam(resolvedSearchParams?.page, 1);

  const minPrice = minPriceParam ? Number(minPriceParam) : null;
  const maxPrice = maxPriceParam ? Number(maxPriceParam) : null;
  const sort = getSingleParam(resolvedSearchParams?.sort);
  const requestedView = getSingleParam(resolvedSearchParams?.view);
  const isMapEligibleCategory = category === "rentals" || category === "ride-share";
  const view = requestedView === "map" && isMapEligibleCategory ? "map" : "list";
  const subcategory = getSingleParam(resolvedSearchParams?.subcategory);
  const structuredFilters = Object.fromEntries(
    getStructuredFilterDefinitions(category)
      .map((field) => {
        const value = getSingleParam(resolvedSearchParams?.[field.name]);
        return value ? ([field.name, value] as const) : null;
      })
      .filter(Boolean) as Array<readonly [string, string]>
  );

  const categoryInfo = CATEGORY_MAP[category];
  const localContent = getCategoryLocalContent(category);
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
        sort,
        extraFilters: structuredFilters
      })
    : null;
  const returnTo = buildSavedSearchHref({
    path: categoryInfo.href,
    search,
    category,
    subcategory,
    minPrice,
    maxPrice,
    sort,
    extraFilters: structuredFilters
  });
  const listViewHref = buildPathWithQuery(categoryInfo.href, {
    q: search,
    subcategory,
    minPrice,
    maxPrice,
    sort,
    ...structuredFilters
  });
  const mapViewHref =
    isMapEligibleCategory
      ? buildPathWithQuery(categoryInfo.href, {
          q: search,
          subcategory,
          minPrice,
          maxPrice,
          sort,
          ...structuredFilters,
          view: "map"
        })
      : null;

  const { listings, isConfigured, hasMore, totalCount, pageSize } = await getPublicListings({
    category,
    subcategory,
    search,
    minPrice,
    maxPrice,
    sort,
    extraFilters: structuredFilters,
    limit: 24,
    page
  });
  const trustMap = await getSellerTrustSummaryMap(listings.map((listing) => listing.owner_id));
  const firstVisibleResult = listings.length ? (page - 1) * pageSize + 1 : 0;
  const lastVisibleResult = listings.length ? firstVisibleResult + listings.length - 1 : 0;
  const previousPageHref =
    page > 1
      ? buildPathWithQuery(categoryInfo.href, {
          q: search,
          subcategory,
          minPrice,
          maxPrice,
          sort,
          view: view === "map" ? "map" : undefined,
          ...structuredFilters,
          page: page - 1 > 1 ? page - 1 : undefined
        })
      : null;
  const nextPageHref = hasMore
    ? buildPathWithQuery(categoryInfo.href, {
        q: search,
        subcategory,
        minPrice,
        maxPrice,
        sort,
        view: view === "map" ? "map" : undefined,
        ...structuredFilters,
        page: page + 1
      })
    : null;
  const collectionStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: getCategorySeoTitle(category),
    description: localContent.heroDescription,
    about: categoryInfo.label,
    areaServed: "Fort McMurray, Alberta"
  };

  return (
    <section className="section listing-feed-section">
      <div className="container listing-feed-container">
        <SectionHeading
          eyebrow="Category"
          title={categoryInfo.label}
          description={localContent.heroDescription}
        />

        <div className="category-local-strip surface">
          <div className="category-local-strip-copy">
            <p>{localContent.supportingCopy}</p>
          </div>

          <div className="category-local-highlight-grid">
            {localContent.localHighlights.map((highlight) => (
              <div key={highlight} className="category-local-highlight">
                <span className="category-local-highlight-dot" aria-hidden="true" />
                <p>{highlight}</p>
              </div>
            ))}
          </div>

          <div className="category-local-links">
            {localContent.quickLinks.map((item) => (
              <Link key={item.href} href={item.href} className="category-local-link">
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {isMapEligibleCategory ? (
          <div className="listing-view-toggle" style={{ marginTop: "1rem", marginBottom: "1rem" }}>
            <Link href={listViewHref} className={`listing-view-pill${view === "list" ? " is-active" : ""}`}>
              List view
            </Link>
            {mapViewHref ? (
              <Link href={mapViewHref} className={`listing-view-pill${view === "map" ? " is-active" : ""}`}>
                Map view
              </Link>
            ) : null}
          </div>
        ) : null}

        <BrowseFilters
          actionPath={categoryInfo.href}
          search={search}
          category={category}
          subcategory={subcategory}
          minPrice={minPrice}
          maxPrice={maxPrice}
          sort={sort}
          structuredFilters={structuredFilters}
          view={view === "map" ? "map" : undefined}
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
          <>
            {view === "map" && isMapEligibleCategory ? (
              <LocalMapExplorer
                category={category}
                listings={listings}
                actionPath={categoryInfo.href}
                search={search}
                subcategory={subcategory}
                minPrice={minPrice}
                maxPrice={maxPrice}
                sort={sort}
                structuredFilters={structuredFilters}
              />
            ) : null}

            <div
              className={`listing-grid listing-feed-grid${view === "map" ? " listing-feed-grid-map-view" : ""}`}
              style={{ marginTop: "1.25rem" }}
            >
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

        <div className="category-guide-grid" style={{ marginTop: "1.5rem" }}>
          <div className="surface category-guide-card">
            <SectionHeading
              eyebrow="Local tips"
              title={`What locals usually care about in ${categoryInfo.label.toLowerCase()}`}
              description="Use the structured fields and filters to cut down the back-and-forth before you message."
            />

            <ul className="category-guide-list">
              {localContent.buyerTips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>

          <div className="surface category-guide-card">
            <SectionHeading
              eyebrow="FAQ"
              title={`${categoryInfo.label} questions people actually ask`}
              description="These quick answers help buyers and sellers use the category more effectively."
            />

            <div className="category-faq-list">
              {localContent.faqs.map((item) => (
                <article key={item.question} className="category-faq-item">
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </div>

        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionStructuredData) }}
          suppressHydrationWarning
          type="application/ld+json"
        />
      </div>
    </section>
  );
}
