import type { Metadata } from "next";
import Link from "next/link";

import { BrowseFilters } from "@/components/listings/browse-filters";
import { LazyLocalMapExplorer } from "@/components/listings/lazy-local-map-explorer";
import { ListingCard } from "@/components/listings/listing-card";
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
import { getCategoryLocalContent, resolveCommunityMapArea } from "@/lib/local-marketplace";
import { getSubcategories, normalizeSubcategory } from "@/lib/subcategories";
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

export const metadata: Metadata = {
  title: "Browse Listings",
  description:
    "Browse jobs, rentals, services, ride shares, and buy & sell listings in Fort McMurray.",
};

const MOBILE_BROWSE_QUICK_LINKS = [
  {
    label: "Camp rides",
    href: "/browse?category=ride-share&subcategory=camp-site-transport&view=map"
  },
  {
    label: "Airport rides",
    href: "/browse?category=ride-share&subcategory=airport-ride&view=map"
  },
  {
    label: "Available rentals",
    href: "/browse?category=rentals&availabilityType=immediate"
  }
];

function getEdmontonDateParam() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Edmonton",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const search = getSingleParam(resolvedSearchParams?.q);
  const category = resolveCategory(getSingleParam(resolvedSearchParams?.category));
  const intent = resolveListingIntent(getSingleParam(resolvedSearchParams?.intent));
  const requestWindow =
    intent === "need" ? resolveRequestWindow(getSingleParam(resolvedSearchParams?.requestWindow)) : undefined;
  const subcategory = normalizeSubcategory(
    category,
    getSingleParam(resolvedSearchParams?.subcategory)
  );

  const minPriceParam = getSingleParam(resolvedSearchParams?.minPrice);
  const maxPriceParam = getSingleParam(resolvedSearchParams?.maxPrice);
  const page = getPositiveIntParam(resolvedSearchParams?.page, 1);

  const minPrice = minPriceParam ? Number(minPriceParam) : null;
  const maxPrice = maxPriceParam ? Number(maxPriceParam) : null;
  const sort = getSingleParam(resolvedSearchParams?.sort);
  const requestedView = getSingleParam(resolvedSearchParams?.view);
  const isMapEligibleCategory = Boolean(category);
  const view = requestedView === "map" && isMapEligibleCategory ? "map" : "list";
  const communityArea =
    category && category !== "ride-share"
      ? resolveCommunityMapArea(getSingleParam(resolvedSearchParams?.communityArea)) ?? null
      : null;
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
  const shouldSplitMapAndList = view === "map" && Boolean(communityArea) && category && category !== "ride-share";
  const mapResultsPromise = getPublicListings({
    search,
    category,
    intent,
    requestWindow,
    communityArea: shouldSplitMapAndList ? null : communityArea,
    subcategory,
    minPrice,
    maxPrice,
    sort,
    extraFilters: structuredFilters,
    limit: shouldSplitMapAndList ? 120 : 24,
    page: shouldSplitMapAndList ? 1 : page
  });
  const listResultsPromise = shouldSplitMapAndList
    ? getPublicListings({
        search,
        category,
        intent,
        requestWindow,
        communityArea,
        subcategory,
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

  const viewer = await getViewer();
  const businessMapProfiles = isMapEligibleCategory
    ? await getBusinessMapProfileMap(mapListings.map((listing) => listing.storefront_id ?? ""))
    : new Map();

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
        extraFilters: searchExtraFilters
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
    extraFilters: searchExtraFilters
  });

  const categoryLabel = category
    ? CATEGORIES.find((item) => item.value === category)?.label
    : null;
  const todayDateParam = getEdmontonDateParam();
  const mobileQuickLinks =
    category === "ride-share"
      ? [
          {
            label: "Today",
            href: `/browse?category=ride-share&tripDate=${todayDateParam}`
          },
          {
            label: "Camp map",
            href: "/browse?category=ride-share&subcategory=camp-site-transport&view=map"
          },
          {
            label: "Horizon",
            href: "/browse?category=ride-share&siteCamp=cnrl-horizon&view=map"
          },
          {
            label: "Airport",
            href: "/browse?category=ride-share&subcategory=airport-ride&view=map"
          },
          {
            label: "Night shift",
            href: "/browse?category=ride-share&pickupWindow=night&view=map"
          },
          {
            label: "14 on / 7 off",
            href: "/browse?category=ride-share&schedulePattern=14-on-7-off"
          }
        ]
      : category
        ? getCategoryLocalContent(category).quickLinks.slice(0, 3)
        : MOBILE_BROWSE_QUICK_LINKS;
  const mobilePostNeedHref = buildPathWithQuery("/dashboard/listings/new", {
    intent: "need",
    category
  });
  const mobilePostNeedLabel = category === "ride-share" ? "Post ride need" : "Post need";
  const browseTitle = categoryLabel
    ? `${categoryLabel} ${intent === "need" ? "Needs" : "Listings"}`
    : intent === "need"
      ? "Search local needs"
      : "Search local listings";
  const listViewHref = buildPathWithQuery("/browse", {
    q: search,
    category,
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
      ? buildPathWithQuery("/browse", {
          q: search,
          category,
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
  const firstVisibleResult = listings.length ? (page - 1) * pageSize + 1 : 0;
  const lastVisibleResult = listings.length ? firstVisibleResult + listings.length - 1 : 0;
  const previousPageHref =
    page > 1
      ? buildPathWithQuery("/browse", {
          q: search,
          category,
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
    ? buildPathWithQuery("/browse", {
        q: search,
        category,
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
  const subcategoryLinks = category ? getSubcategories(category) : [];
  const recoveryLinks = category
    ? [
        ...(view === "map" ? [{ href: listViewHref, label: "Switch to list view" }] : []),
        { href: "/browse", label: "Browse all listings" },
        { href: CATEGORY_MAP[category].href, label: `Open ${CATEGORY_MAP[category].label}` },
        ...subcategoryLinks.slice(0, 3).map((item) => ({
          href: buildPathWithQuery("/browse", {
            category,
            intent,
            requestWindow,
            communityArea,
            subcategory: item.value
          }),
          label: item.label
        }))
      ]
    : CATEGORIES.map((item) => ({
        href: buildPathWithQuery(item.href, { intent, requestWindow }),
        label: item.label
      }));
  const emptyActionHref = buildPathWithQuery("/dashboard/listings/new", {
    intent: "need",
    category
  });
  const emptyActionLabel = intent === "need" ? "Post this need" : "Post a need";
  const isMapDeadEnd = view === "map";
  const emptyTitle = isMapDeadEnd
    ? category === "ride-share"
      ? "No active rides on this map yet"
      : category
        ? `No ${CATEGORY_MAP[category].label.toLowerCase()} pins on this map yet`
        : "No listings on this map yet"
    : "No listings match this search";
  const emptyDescription = isMapDeadEnd
    ? category === "ride-share"
      ? "No drivers or route matches fit this map view right now. Post the route you need or switch back to the list."
      : "Nothing in this map view matches yet. Try list view, broaden the area, or post what you need so locals can reply."
    : intent === "need"
      ? "No matching needs are live yet. Post yours and let local providers or riders respond."
      : "Try broadening the search or post what you need so the right locals can reply.";
  const recoveryTitle = isMapDeadEnd ? "Keep this search moving" : "Try a faster recovery path";
  const recoveryDescription = isMapDeadEnd
    ? "Switch views, widen the route or area, or jump into a more active slice."
    : "Broaden the search or jump into a different active section.";
  const hasThinResults = totalCount > 0 && totalCount <= 3;
  const lowResultsLinks = [
    { href: emptyActionHref, label: emptyActionLabel },
    {
      href: buildPathWithQuery("/browse", {
        category,
        intent,
        requestWindow
      }),
      label: category ? `Broaden back to ${CATEGORY_MAP[category].label}` : "Clear extra filters"
    },
    ...(category === "ride-share"
      ? [
          {
            href: "/browse?category=ride-share&subcategory=camp-site-transport&view=map",
            label: "Browse camp transport"
          }
        ]
      : category === "rentals"
        ? [
            {
              href: "/browse?category=rentals&availabilityType=rotation-friendly",
              label: "Rotation-friendly rentals"
            }
          ]
        : [])
  ];

  return (
    <section className="section listing-feed-section">
      <div className="container listing-feed-container">
        <div className="browse-mobile-overview surface">
          <div className="browse-mobile-overview-copy">
            <div className="marketplace-page-utility-row">
              <span className="eyebrow">Fort McMurray</span>
              {viewer ? (
                <Link href="/dashboard/storefronts" className="marketplace-page-utility-link">
                  My Storefronts
                </Link>
              ) : null}
            </div>
            <h1>{browseTitle}</h1>
            <p>
              {totalCount > 0
                ? `${firstVisibleResult}-${lastVisibleResult} of ${totalCount} results`
                : "Browse local listings and needs"}
            </p>
          </div>

          {isMapEligibleCategory ? (
            <div className="listing-view-toggle browse-view-toggle browse-view-toggle-mobile">
              <Link href={listViewHref} scroll={false} className={`listing-view-pill${view === "list" ? " is-active" : ""}`}>
                List
              </Link>
              {mapViewHref ? (
                <Link
                  href={mapViewHref}
                  scroll={false}
                  className={`listing-view-pill${view === "map" ? " is-active" : ""}`}
                >
                  Map
                </Link>
              ) : null}
            </div>
          ) : null}

          <MobileInstallBanner context={category === "ride-share" ? "ride-share" : "browse"} />

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

        <div className="browse-desktop-heading">
          <div className="marketplace-page-utility-row">
            <span className="eyebrow">Fort McMurray</span>
            {viewer ? (
              <Link href="/dashboard/storefronts" className="marketplace-page-utility-link">
                My Storefronts
              </Link>
            ) : null}
          </div>
          <SectionHeading title={browseTitle} />
        </div>

        {isMapEligibleCategory ? (
          <div className="listing-view-toggle browse-view-toggle" style={{ marginBottom: "1rem" }}>
            <Link href={listViewHref} scroll={false} className={`listing-view-pill${view === "list" ? " is-active" : ""}`}>
              List view
            </Link>
            {mapViewHref ? (
              <Link
                href={mapViewHref}
                scroll={false}
                className={`listing-view-pill${view === "map" ? " is-active" : ""}`}
              >
                Map view
              </Link>
            ) : null}
          </div>
        ) : null}

        <BrowseFilters
          actionPath="/browse"
          category={category}
          intent={intent}
          requestWindow={requestWindow}
          communityArea={communityArea}
          subcategory={subcategory}
          search={search}
          minPrice={minPrice}
          maxPrice={maxPrice}
          sort={sort}
          structuredFilters={structuredFilters}
          view={view === "map" ? "map" : undefined}
        />

        <SaveSearchToggle
          anchorId="browse-save-search"
          viewerId={viewer?.user.id}
          actionPath="/browse"
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

        <div className="browse-results-toolbar">
          <p className="browse-results-count">
            {totalCount > 0
              ? `Showing ${firstVisibleResult}-${lastVisibleResult} of ${totalCount} results`
              : "0 results found"}
          </p>
        </div>

        {category && subcategoryLinks.length ? (
          <div className="subcategory-link-row">
            <Link
              className={`subcategory-link-pill${!subcategory ? " is-active" : ""}`}
              scroll={false}
              href={buildPathWithQuery("/browse", {
                q: search,
                category,
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
              All {categoryLabel}
            </Link>

            {subcategoryLinks.map((item) => (
              <Link
                key={item.value}
                scroll={false}
                className={`subcategory-link-pill${subcategory === item.value ? " is-active" : ""}`}
                href={buildPathWithQuery("/browse", {
                  q: search,
                  category,
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
              <LazyLocalMapExplorer
                category={category!}
                listings={mapListings}
                businessMapProfiles={Object.fromEntries(businessMapProfiles)}
                actionPath="/browse"
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
                description="Widen the search or post what you need so locals can reply when inventory is thin."
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
                  pathToRevalidate="/browse"
                  matchHints={category ? getStructuredFilterMatchHints(category, listing.structured_data, structuredFilters) : []}
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
