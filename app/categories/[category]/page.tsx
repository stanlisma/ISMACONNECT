import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BrowseFilters } from "@/components/listings/browse-filters";
import { ListingCard } from "@/components/listings/listing-card";
import { LocalMapExplorer } from "@/components/listings/local-map-explorer";
import { MobileInstallBanner } from "@/components/pwa/mobile-install-banner";
import { SaveSearchToggle } from "@/components/saved-searches/save-search-toggle";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchRecoveryPanel } from "@/components/ui/search-recovery-panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { SetupNotice } from "@/components/ui/setup-notice";
import { getViewer } from "@/lib/auth";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/constants";
import { getBusinessMapProfileMap, getPublicListings, getSavedListingIds } from "@/lib/data";
import {
  getStructuredFilterDefinitions,
  getStructuredFilterMatchHints
} from "@/lib/listing-structured-fields";
import { getSubcategories, normalizeSubcategory } from "@/lib/subcategories";
import {
  getCategoryLocalContent,
  getCategorySeoTitle,
  resolveCommunityMapArea
} from "@/lib/local-marketplace";
import { buildSavedSearchHref, getSavedSearchByFilters } from "@/lib/saved-searches";
import { getSellerTrustSummaryMap } from "@/lib/trust";
import {
  buildPathWithQuery,
  getPositiveIntParam,
  getSingleParam,
  resolveCategory,
  resolveListingIntent,
  resolveRequestWindow
} from "@/lib/utils";

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
  const intent = resolveListingIntent(getSingleParam(resolvedSearchParams?.intent));
  const requestWindow =
    intent === "need" ? resolveRequestWindow(getSingleParam(resolvedSearchParams?.requestWindow)) : undefined;
  const minPriceParam = getSingleParam(resolvedSearchParams?.minPrice);
  const maxPriceParam = getSingleParam(resolvedSearchParams?.maxPrice);
  const page = getPositiveIntParam(resolvedSearchParams?.page, 1);

  const minPrice = minPriceParam ? Number(minPriceParam) : null;
  const maxPrice = maxPriceParam ? Number(maxPriceParam) : null;
  const sort = getSingleParam(resolvedSearchParams?.sort);
  const requestedView = getSingleParam(resolvedSearchParams?.view);
  const isMapEligibleCategory = true;
  const view = requestedView === "map" && isMapEligibleCategory ? "map" : "list";
  const communityArea =
    category !== "ride-share"
      ? resolveCommunityMapArea(getSingleParam(resolvedSearchParams?.communityArea)) ?? null
      : null;
  const subcategory = normalizeSubcategory(
    category,
    getSingleParam(resolvedSearchParams?.subcategory)
  );
  const structuredFilters = Object.fromEntries(
    getStructuredFilterDefinitions(category)
      .map((field) => {
        const value = getSingleParam(resolvedSearchParams?.[field.name]);
        return value ? ([field.name, value] as const) : null;
      })
      .filter(Boolean) as Array<readonly [string, string]>
  );
  const searchExtraFilters = {
    ...structuredFilters,
    ...(communityArea ? { communityArea } : {}),
    ...(intent ? { intent } : {}),
    ...(requestWindow ? { requestWindow } : {})
  };

  const categoryInfo = CATEGORY_MAP[category];
  const pageTitle = `${categoryInfo.label} ${intent === "need" ? "Needs" : "Listings"}`;
  const localContent = getCategoryLocalContent(category);
  const todayDateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Edmonton",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const todayDateParam = `${todayDateParts.find((part) => part.type === "year")?.value ?? ""}-${todayDateParts.find((part) => part.type === "month")?.value ?? ""}-${todayDateParts.find((part) => part.type === "day")?.value ?? ""}`;
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
      extraFilters: searchExtraFilters
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
    extraFilters: searchExtraFilters
  });
  const listViewHref = buildPathWithQuery(categoryInfo.href, {
    q: search,
    intent,
    requestWindow,
    communityArea,
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
          intent,
          requestWindow,
          communityArea,
          subcategory,
          minPrice,
          maxPrice,
          sort,
          ...structuredFilters,
          view: "map"
        })
      : null;
  const shouldSplitMapAndList = view === "map" && Boolean(communityArea) && category !== "ride-share";
  const mapResultsPromise = getPublicListings({
    category,
    intent,
    requestWindow,
    communityArea: shouldSplitMapAndList ? null : communityArea,
    subcategory,
    search,
    minPrice,
    maxPrice,
    sort,
    extraFilters: structuredFilters,
    limit: shouldSplitMapAndList ? 120 : 24,
    page: shouldSplitMapAndList ? 1 : page
  });
  const listResultsPromise = shouldSplitMapAndList
    ? getPublicListings({
        category,
        intent,
        requestWindow,
        communityArea,
        subcategory,
        search,
        minPrice,
        maxPrice,
        sort,
        extraFilters: structuredFilters,
        limit: 24,
        page
      })
    : null;
  const [mapResults, listResults] = await Promise.all([mapResultsPromise, listResultsPromise]);
  const activeResults = listResults ?? mapResults;
  const listings = activeResults.listings;
  const isConfigured = activeResults.isConfigured;
  const hasMore = activeResults.hasMore;
  const totalCount = activeResults.totalCount;
  const pageSize = activeResults.pageSize;
  const mapListings = mapResults.listings;
  const businessMapProfiles = isMapEligibleCategory
    ? await getBusinessMapProfileMap(mapListings.map((listing) => listing.storefront_id ?? ""))
    : new Map();
  const trustMap = await getSellerTrustSummaryMap(listings.map((listing) => listing.owner_id));
  const mobileQuickLinks =
    category === "ride-share"
      ? [
          {
            label: "Today",
            href: `${categoryInfo.href}?tripDate=${todayDateParam}`
          },
          {
            label: "Camp map",
            href: `${categoryInfo.href}?subcategory=camp-site-transport&view=map`
          },
          {
            label: "Horizon",
            href: `${categoryInfo.href}?siteCamp=cnrl-horizon&view=map`
          },
          {
            label: "Airport",
            href: `${categoryInfo.href}?subcategory=airport-ride&view=map`
          },
          {
            label: "Night shift",
            href: `${categoryInfo.href}?pickupWindow=night&view=map`
          },
          {
            label: "14 on / 7 off",
            href: `${categoryInfo.href}?schedulePattern=14-on-7-off`
          }
        ]
      : localContent.quickLinks.slice(0, 3);
  const mobilePostNeedHref = buildPathWithQuery("/dashboard/listings/new", {
    intent: "need",
    category
  });
  const mobilePostNeedLabel = category === "ride-share" ? "Post ride need" : "Post need";
  const firstVisibleResult = listings.length ? (page - 1) * pageSize + 1 : 0;
  const lastVisibleResult = listings.length ? firstVisibleResult + listings.length - 1 : 0;
  const previousPageHref =
    page > 1
      ? buildPathWithQuery(categoryInfo.href, {
          q: search,
          intent,
          requestWindow,
          communityArea,
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
        intent,
        requestWindow,
        communityArea,
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
  const subcategoryLinks = getSubcategories(category);
  const recoveryLinks = [
    ...(view === "map" ? [{ href: listViewHref, label: "Switch to list view" }] : []),
    {
      href: buildPathWithQuery(categoryInfo.href, { intent, requestWindow }),
      label: `All ${categoryInfo.label}`
    },
    { href: buildPathWithQuery("/browse", { intent, requestWindow }), label: "Browse every category" },
    ...subcategoryLinks.slice(0, 4).map((item) => ({
      href: buildPathWithQuery(categoryInfo.href, {
        intent,
        requestWindow,
        communityArea,
        subcategory: item.value
      }),
      label: item.label
    }))
  ];
  const emptyActionHref = buildPathWithQuery("/dashboard/listings/new", {
    intent: "need",
    category
  });
  const emptyActionLabel = intent === "need" ? `Post a ${categoryInfo.label.toLowerCase()} need` : "Post a need";
  const isMapDeadEnd = view === "map";
  const emptyTitle = isMapDeadEnd
    ? category === "ride-share"
      ? "No active rides on this map yet"
      : `No ${categoryInfo.label.toLowerCase()} pins on this map yet`
    : `No ${categoryInfo.label.toLowerCase()} listings found`;
  const emptyDescription = isMapDeadEnd
    ? category === "ride-share"
      ? "No drivers or route matches fit this map view right now. Post the trip you need or switch back to the list."
      : `Nothing in this ${categoryInfo.label.toLowerCase()} map matches yet. Switch to list view, widen the area, or post what you need.`
    : intent === "need"
      ? `No ${categoryInfo.label.toLowerCase()} requests are live yet. Post yours and let locals respond.`
      : `No ${categoryInfo.label.toLowerCase()} listings are live yet. Post what you need or add the first local listing.`;
  const recoveryTitle = isMapDeadEnd
    ? `Keep this ${categoryInfo.label.toLowerCase()} search moving`
    : `Try a different ${categoryInfo.label.toLowerCase()} slice`;
  const recoveryDescription = isMapDeadEnd
    ? "Switch views, widen the route or area, or jump into a more active slice."
    : "Switch to another subcategory or broaden back out to keep moving.";
  const hasThinResults = totalCount > 0 && totalCount <= 3;
  const lowResultsLinks = [
    { href: emptyActionHref, label: emptyActionLabel },
    {
      href: buildPathWithQuery(categoryInfo.href, { intent, requestWindow }),
      label: `Broaden back to all ${categoryInfo.label.toLowerCase()}`
    },
    ...(category === "ride-share"
      ? [
          {
            href: `${categoryInfo.href}?subcategory=camp-site-transport&view=map`,
            label: "Browse camp transport"
          }
        ]
      : category === "rentals"
        ? [
            {
              href: `${categoryInfo.href}?availabilityType=rotation-friendly`,
              label: "Rotation-friendly rentals"
            }
          ]
        : [])
  ];

  return (
    <section className="section listing-feed-section">
      <div className="container listing-feed-container">
        <div className="browse-mobile-overview category-mobile-overview surface">
          <div className="browse-mobile-overview-copy">
            <span className="eyebrow">Category</span>
            <h1>{pageTitle}</h1>
            <p>
              {totalCount > 0
                ? `${firstVisibleResult}-${lastVisibleResult} of ${totalCount} results`
                : localContent.heroDescription}
            </p>
          </div>

          {isMapEligibleCategory ? (
            <div className="listing-view-toggle browse-view-toggle browse-view-toggle-mobile">
              <Link href={listViewHref} className={`listing-view-pill${view === "list" ? " is-active" : ""}`}>
                List
              </Link>
              {mapViewHref ? (
                <Link href={mapViewHref} className={`listing-view-pill${view === "map" ? " is-active" : ""}`}>
                  Map
                </Link>
              ) : null}
            </div>
          ) : null}

          <MobileInstallBanner />

          <div className="mobile-browse-quick-links">
            {mobileQuickLinks.map((link) => (
              <Link key={link.href} href={link.href} className="mobile-browse-quick-link">
                {link.label}
              </Link>
            ))}
            <Link href={mobilePostNeedHref} className="mobile-browse-quick-link is-secondary">
              {mobilePostNeedLabel}
            </Link>
            <Link href="#browse-save-search" className="mobile-browse-quick-link is-secondary">
              Save search
            </Link>
          </div>
        </div>

        <div className="category-desktop-heading">
          <SectionHeading
            eyebrow="Category"
            title={pageTitle}
            description={localContent.heroDescription}
          />
        </div>

        {isMapEligibleCategory ? (
          <div className="listing-view-toggle browse-view-toggle" style={{ marginTop: "1rem", marginBottom: "1rem" }}>
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
          intent={intent}
          requestWindow={requestWindow}
          communityArea={communityArea}
          subcategory={subcategory}
          minPrice={minPrice}
          maxPrice={maxPrice}
          sort={sort}
          structuredFilters={structuredFilters}
          view={view === "map" ? "map" : undefined}
          showCategorySelect={false}
        />

        <SaveSearchToggle
          anchorId="browse-save-search"
          viewerId={viewer?.user.id}
          actionPath={categoryInfo.href}
          returnTo={returnTo}
          search={search}
          category={category}
          subcategory={subcategory}
          minPrice={minPrice}
          maxPrice={maxPrice}
          sort={sort}
          extraFilters={searchExtraFilters}
          isSaved={Boolean(savedSearch)}
          compactOnMobile
        />

        <p className="category-results-count" style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#667085" }}>
          {totalCount > 0
            ? `Showing ${firstVisibleResult}-${lastVisibleResult} of ${totalCount} results`
            : "0 results found"}
        </p>

        {subcategoryLinks.length ? (
          <div className="subcategory-link-row">
            <Link
              className={`subcategory-link-pill${!subcategory ? " is-active" : ""}`}
              href={buildPathWithQuery(categoryInfo.href, {
                q: search,
                intent,
                requestWindow,
                communityArea,
                minPrice,
                maxPrice,
                sort,
                view: view === "map" ? "map" : undefined,
                ...structuredFilters
              })}
            >
              All {categoryInfo.label}
            </Link>

            {subcategoryLinks.map((item) => (
              <Link
                key={item.value}
                className={`subcategory-link-pill${subcategory === item.value ? " is-active" : ""}`}
                href={buildPathWithQuery(categoryInfo.href, {
                  q: search,
                  intent,
                  requestWindow,
                  communityArea,
                  subcategory: item.value,
                  minPrice,
                  maxPrice,
                  sort,
                  view: view === "map" ? "map" : undefined,
                  ...structuredFilters
                })}
              >
                {item.label}
              </Link>
            ))}
          </div>
        ) : null}

        {!isConfigured ? (
          <SetupNotice />
        ) : listings.length === 0 ? (
          <>
            <EmptyState
              actionHref={emptyActionHref}
              actionLabel={emptyActionLabel}
              description={emptyDescription}
              title={emptyTitle}
            />
            <SearchRecoveryPanel
              title={recoveryTitle}
              description={recoveryDescription}
              links={recoveryLinks}
            />
          </>
        ) : (
          <>
            {view === "map" && isMapEligibleCategory ? (
              <LocalMapExplorer
                category={category}
                listings={mapListings}
                businessMapProfiles={Object.fromEntries(businessMapProfiles)}
                actionPath={categoryInfo.href}
                search={search}
                subcategory={subcategory}
                minPrice={minPrice}
                maxPrice={maxPrice}
                sort={sort}
                structuredFilters={searchExtraFilters}
              />
            ) : null}

            {hasThinResults ? (
              <SearchRecoveryPanel
                title="Only a few matches are live right now"
                description="Broaden the category or post what you need so locals can reply when supply is thin."
                links={lowResultsLinks}
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
                  matchHints={getStructuredFilterMatchHints(category, listing.structured_data, structuredFilters)}
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

        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionStructuredData) }}
          suppressHydrationWarning
          type="application/ld+json"
        />
      </div>
    </section>
  );
}
