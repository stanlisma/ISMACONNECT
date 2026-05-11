import Link from "next/link";

import {
  DeleteSavedSearchForm,
  OpenSavedSearchForm
} from "@/components/saved-searches/saved-search-forms";
import { EmptyState } from "@/components/ui/empty-state";
import { requireViewer } from "@/lib/auth";
import { countSavedSearchAlerts, getSavedSearchesWithStats } from "@/lib/saved-searches";
import { buildPathWithQuery, formatCurrency, formatDate, getSingleParam } from "@/lib/utils";

export default async function DashboardSavedSearchesPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const viewer = await requireViewer();
  const savedSearches = await getSavedSearchesWithStats(viewer.user.id);
  const filter = getSingleParam(resolvedSearchParams?.filter) === "alerts" ? "alerts" : "all";
  const sortedSearches = [...savedSearches].sort((left, right) => {
    if (right.newMatchesCount !== left.newMatchesCount) {
      return right.newMatchesCount - left.newMatchesCount;
    }

    return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
  });
  const searchAlertsCount = countSavedSearchAlerts(savedSearches);
  const visibleSearches =
    filter === "alerts"
      ? sortedSearches.filter((savedSearch) => savedSearch.newMatchesCount > 0)
      : sortedSearches;

  return (
    <div className="stack-md">
      <div className="saved-searches-summary surface">
        <div>
          <h2 style={{ marginBottom: "0.35rem" }}>Saved searches</h2>
        </div>

        <div className="saved-search-summary-stats">
          <div className="saved-search-summary-pill">
            <strong>{savedSearches.length}</strong>
            <span>Saved</span>
          </div>
          <div className="saved-search-summary-pill">
            <strong>{searchAlertsCount}</strong>
            <span>With alerts</span>
          </div>
        </div>

        <div className="pill-row saved-search-filter-row">
          <Link
            className={`account-menu-pill ${filter === "all" ? "is-active" : ""}`}
            href="/dashboard/searches"
          >
            All searches
          </Link>
          <Link
            className={`account-menu-pill ${filter === "alerts" ? "is-active" : ""}`}
            href={buildPathWithQuery("/dashboard/searches", { filter: "alerts" })}
          >
            New matches
          </Link>
        </div>
      </div>

      {!savedSearches.length ? (
        <EmptyState
          actionHref="/browse"
          actionLabel="Browse listings"
          title="No saved searches yet"
          description="Save a search from browse or category pages to keep that filter set and track new matching listings."
        />
      ) : (
        <div className="saved-searches-grid">
          {visibleSearches.length ? (
            visibleSearches.map((savedSearch) => (
            <article key={savedSearch.id} className="surface saved-search-card">
              <div className="saved-search-card-head">
                <div>
                  <h3>{savedSearch.label}</h3>
                  <p className="saved-search-description">{savedSearch.description}</p>
                </div>

                {savedSearch.newMatchesCount > 0 ? (
                  <span className="saved-search-alert-badge">
                    {savedSearch.newMatchesCount} new
                  </span>
                ) : (
                  <span className="saved-search-muted-badge">Up to date</span>
                )}
              </div>

              <p className="saved-search-meta">
                Last checked {formatDate(savedSearch.last_checked_at)} | Created {formatDate(savedSearch.created_at)}
              </p>

              {savedSearch.latestMatches.length ? (
                <div className="saved-search-match-list">
                  {savedSearch.latestMatches.map((listing) => (
                    <Link key={listing.id} href={`/listings/${listing.slug}`} className="saved-search-match-link">
                      <span>{listing.title}</span>
                      <strong>{formatCurrency(listing.price)}</strong>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="saved-search-meta">No active listings match this search right now.</p>
              )}

              <div className="action-row saved-search-actions">
                <OpenSavedSearchForm
                  href={savedSearch.href}
                  savedSearchId={savedSearch.id}
                  hasAlerts={savedSearch.newMatchesCount > 0}
                />
                <DeleteSavedSearchForm savedSearchId={savedSearch.id} />
              </div>
            </article>
            ))
          ) : (
            <EmptyState
              actionHref="/dashboard/searches"
              actionLabel="Show all saved searches"
              title="No active alerts right now"
              description="Your saved searches are still active, but none have new matching listings at the moment."
            />
          )}
        </div>
      )}
    </div>
  );
}
