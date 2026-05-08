import Link from "next/link";

import { ListingCard } from "@/components/listings/listing-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getViewer } from "@/lib/auth";
import { CATEGORY_MAP } from "@/lib/constants";
import { getSavedListings } from "@/lib/data";
import { getSellerTrustSummaryMap } from "@/lib/trust";
import { buildPathWithQuery, getSingleParam, resolveCategory } from "@/lib/utils";

export default async function SavedPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const viewer = await getViewer();

  if (!viewer) {
    return (
      <section className="section listing-feed-section">
        <div className="container listing-feed-container">
          <div className="surface saved-page-overview">
            <div className="saved-page-copy">
              <span className="eyebrow">Favourites</span>
              <h1>Saved listings</h1>
              <p className="section-copy">
                Keep the best rentals, rides, jobs, services, and deals in one place so you can come back fast on
                your phone.
              </p>
            </div>

            <div className="saved-page-actions">
              <Link href="/auth/sign-in" className="button">
                Sign in to view favourites
              </Link>
              <Link href="/browse" className="button button-secondary">
                Browse listings
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const listings = await getSavedListings(viewer.user.id);
  const categoryFilter = resolveCategory(getSingleParam(resolvedSearchParams?.category)) ?? null;
  const filteredListings = categoryFilter
    ? listings.filter((listing) => listing.category === categoryFilter)
    : listings;
  const trustMap = await getSellerTrustSummaryMap(filteredListings.map((listing) => listing.owner_id));
  const categoryCounts = Array.from(
    listings.reduce((accumulator, listing) => {
      accumulator.set(listing.category, (accumulator.get(listing.category) ?? 0) + 1);
      return accumulator;
    }, new Map<string, number>())
  ).sort((left, right) => right[1] - left[1]);

  return (
    <section className="section listing-feed-section saved-page-shell">
      <div className="container listing-feed-container">
        <div className="surface saved-page-overview">
          <div className="saved-page-copy">
            <span className="eyebrow">Favourites</span>
            <h1>Saved listings</h1>
            <p className="section-copy">
              Everything you bookmarked, ready to revisit without digging through search again.
            </p>
          </div>

          <div className="saved-page-stats">
            <div className="saved-page-stat">
              <span>Saved</span>
              <strong>{filteredListings.length}</strong>
            </div>
            <div className="saved-page-stat">
              <span>Categories</span>
              <strong>{categoryCounts.length}</strong>
            </div>
            <div className="saved-page-stat">
              <span>Filter</span>
              <strong>{categoryFilter ? CATEGORY_MAP[categoryFilter].label : "All"}</strong>
            </div>
          </div>
        </div>

        {categoryCounts.length ? (
          <div className="pill-links saved-page-pills">
            <Link href="/saved" className={`pill-link${!categoryFilter ? " saved-pill-active" : ""}`}>
              All {listings.length}
            </Link>

            {categoryCounts.map(([category, count]) => (
              <Link
                key={category}
                href={buildPathWithQuery("/saved", {
                  category: categoryFilter === category ? undefined : category
                })}
                className={`pill-link${categoryFilter === category ? " saved-pill-active" : ""}`}
              >
                {CATEGORY_MAP[category as keyof typeof CATEGORY_MAP].label} {count}
              </Link>
            ))}
          </div>
        ) : null}

        {filteredListings.length ? (
          <div className="listing-grid listing-feed-grid">
            {filteredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isSaved
                canSave
                pathToRevalidate="/saved"
                trustSummary={trustMap.get(listing.owner_id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            actionHref={categoryFilter ? "/saved" : "/browse"}
            actionLabel={categoryFilter ? "Clear category filter" : "Browse listings"}
            title={categoryFilter ? "No saved listings in this category" : "No favourites yet"}
            description={
              categoryFilter
                ? "Try another category or go back to all saved listings."
                : "Tap the heart on any listing to keep it here for later."
            }
          />
        )}
      </div>
    </section>
  );
}
