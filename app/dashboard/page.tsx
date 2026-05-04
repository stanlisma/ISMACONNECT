import Link from "next/link";

import { DashboardListingControls } from "@/components/dashboard/dashboard-listing-controls";
import { DeleteListingForm } from "@/components/listings/delete-listing-form";
import { EmptyState } from "@/components/ui/empty-state";
import { FlashMessage } from "@/components/ui/flash-message";
import { getListingBoostState } from "@/lib/boost-products";
import { requireViewer } from "@/lib/auth";
import { getPromotionChips } from "@/lib/boosts";
import { LISTING_STATUS_LABELS } from "@/lib/constants";
import { getUserListings } from "@/lib/data";
import {
  formatCurrency,
  formatDate,
  getCategoryLabel,
  getSingleParam,
  resolveCategory
} from "@/lib/utils";

function matchesPromotionFilter(listing: any, promotionFilter: string) {
  const state = getListingBoostState(listing);

  switch (promotionFilter) {
    case "featured":
      return state.featuredActive;
    case "boosted":
      return state.boostedActive;
    case "urgent":
      return state.urgentActive;
    case "promoted":
      return state.featuredActive || state.boostedActive || state.urgentActive;
    default:
      return true;
  }
}

function buildDashboardHref(params: Record<string, string | null | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `/dashboard?${queryString}` : "/dashboard";
}

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const viewer = await requireViewer();
  const listings = await getUserListings(viewer.user.id);

  const searchQuery = getSingleParam(resolvedSearchParams?.q)?.trim() ?? "";
  const normalizedQuery = searchQuery.toLowerCase();
  const statusFilter = getSingleParam(resolvedSearchParams?.status) ?? "all";
  const promotionFilter = getSingleParam(resolvedSearchParams?.promotion) ?? "all";
  const categoryFilter = resolveCategory(getSingleParam(resolvedSearchParams?.category)) ?? null;

  const activeCount = listings.filter((listing) => listing.status === "active").length;
  const flaggedCount = listings.filter((listing) => listing.status === "flagged").length;
  const boostedCount = listings.filter((listing) => {
    const state = getListingBoostState(listing);
    return state.featuredActive || state.urgentActive || state.boostedActive;
  }).length;

  const filteredListings = listings.filter((listing) => {
    if (statusFilter !== "all" && listing.status !== statusFilter) {
      return false;
    }

    if (categoryFilter && listing.category !== categoryFilter) {
      return false;
    }

    if (promotionFilter !== "all" && !matchesPromotionFilter(listing, promotionFilter)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return [listing.title, listing.location, getCategoryLabel(listing.category)]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });

  return (
    <>
      <FlashMessage message={getSingleParam(resolvedSearchParams?.success)} tone="success" />
      <FlashMessage message={getSingleParam(resolvedSearchParams?.error)} tone="error" />

      <div className="stats-grid">
        <div className="stat-card">
          <span>Total listings</span>
          <strong>{listings.length}</strong>
        </div>
        <div className="stat-card">
          <span>Active listings</span>
          <strong>{activeCount}</strong>
        </div>
        <div className="stat-card">
          <span>Flagged listings</span>
          <strong>{flaggedCount}</strong>
        </div>
        <div className="stat-card">
          <span>Live promotions</span>
          <strong>{boostedCount}</strong>
        </div>
      </div>

      <div className="surface" style={{ marginTop: "1.25rem" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "1rem"
          }}
        >
          <div>
            <h2 style={{ marginBottom: "0.5rem" }}>Listing controls</h2>
            <p className="section-copy" style={{ marginBottom: 0 }}>
              Filter your inventory fast, keep an eye on promotions, and jump back into the right listing.
            </p>
          </div>
        </div>

        <DashboardListingControls
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          promotionFilter={promotionFilter}
          categoryFilter={categoryFilter}
          filteredCount={filteredListings.length}
          totalCount={listings.length}
        />

        <div className="pill-row" style={{ marginTop: "1rem" }}>
          <Link
            className={`account-menu-pill ${statusFilter === "all" ? "is-active" : ""}`}
            href={buildDashboardHref({
              q: searchQuery || null,
              category: categoryFilter,
              promotion: promotionFilter !== "all" ? promotionFilter : null
            })}
          >
            All
          </Link>
          <Link
            className={`account-menu-pill ${statusFilter === "active" ? "is-active" : ""}`}
            href={buildDashboardHref({
              q: searchQuery || null,
              status: "active",
              category: categoryFilter,
              promotion: promotionFilter !== "all" ? promotionFilter : null
            })}
          >
            Active
          </Link>
          <Link
            className={`account-menu-pill ${promotionFilter === "promoted" ? "is-active" : ""}`}
            href={buildDashboardHref({
              q: searchQuery || null,
              status: statusFilter !== "all" ? statusFilter : null,
              category: categoryFilter,
              promotion: "promoted"
            })}
          >
            Promoted
          </Link>
          <Link
            className={`account-menu-pill ${statusFilter === "flagged" ? "is-active" : ""}`}
            href={buildDashboardHref({
              q: searchQuery || null,
              status: "flagged",
              category: categoryFilter,
              promotion: promotionFilter !== "all" ? promotionFilter : null
            })}
          >
            Flagged
          </Link>
        </div>
      </div>

      {filteredListings.length === 0 ? (
        <div style={{ marginTop: "1.25rem" }}>
          {listings.length === 0 ? (
            <EmptyState
              actionHref="/dashboard/listings/new"
              actionLabel="Create your first listing"
              description="Start with a rental, ride share, job, service, or buy & sell post."
              title="You have not posted any listings yet"
            />
          ) : (
            <EmptyState
              actionHref="/dashboard"
              actionLabel="Clear filters"
              description="Try adjusting your search, status, or promotion filters to find the listing you need."
              title="No listings match those filters"
            />
          )}
        </div>
      ) : (
        <div className="dashboard-list" style={{ marginTop: "1.25rem" }}>
          {filteredListings.map((listing) => (
            <div className="dashboard-listing" key={listing.id}>
              <div className="badge-row">
                <span className="badge badge-soft">{getCategoryLabel(listing.category)}</span>
                <span
                  className={`badge ${
                    listing.status === "flagged"
                      ? "badge-danger"
                      : listing.status === "removed"
                        ? "badge-neutral"
                        : "badge-featured"
                  }`}
                >
                  {LISTING_STATUS_LABELS[listing.status]}
                </span>
              </div>

              <h3>{listing.title}</h3>
              <p>
                {formatCurrency(listing.price)} · {listing.location} · Posted {formatDate(listing.created_at)}
              </p>

              {getPromotionChips(listing).length ? (
                <div className="badge-row" style={{ marginTop: "0.75rem" }}>
                  {getPromotionChips(listing).map((chip) => (
                    <span
                      key={chip}
                      className={`badge ${
                        chip === "Featured"
                          ? "badge-featured"
                          : chip === "Urgent"
                            ? "badge-urgent"
                            : "badge-soft"
                      }`}
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="action-row">
                {listing.status === "active" ? (
                  <Link className="button button-secondary" href={`/listings/${listing.slug}`}>
                    View
                  </Link>
                ) : null}
                <Link className="button" href={`/dashboard/listings/${listing.id}/edit`}>
                  Edit
                </Link>
                {listing.status === "active" ? (
                  <Link className="button button-secondary" href={`/dashboard/listings/${listing.id}/boost`}>
                    Promote
                  </Link>
                ) : null}
                <DeleteListingForm listingId={listing.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
