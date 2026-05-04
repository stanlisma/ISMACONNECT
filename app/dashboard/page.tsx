import Link from "next/link";

import { DeleteListingForm } from "@/components/listings/delete-listing-form";
import { FlashMessage } from "@/components/ui/flash-message";
import { EmptyState } from "@/components/ui/empty-state";
import { requireViewer } from "@/lib/auth";
import { getListingBoostState } from "@/lib/boost-products";
import { getPromotionChips } from "@/lib/boosts";
import { LISTING_STATUS_LABELS } from "@/lib/constants";
import { getUserListings } from "@/lib/data";
import { formatCurrency, formatDate, getCategoryLabel, getSingleParam } from "@/lib/utils";

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const viewer = await requireViewer();
  const listings = await getUserListings(viewer.user.id);

  const activeCount = listings.filter((listing) => listing.status === "active").length;
  const flaggedCount = listings.filter((listing) => listing.status === "flagged").length;
  const featuredCount = listings.filter((listing) => listing.is_featured).length;
  const boostedCount = listings.filter((listing) => {
    const state = getListingBoostState(listing);
    return state.featuredActive || state.urgentActive || state.boostedActive;
  }).length;

  return (
    <>
      <FlashMessage message={getSingleParam(resolvedSearchParams?.success)} tone="success" />
      <FlashMessage message={getSingleParam(resolvedSearchParams?.error)} tone="error" />

      <div className="stats-grid">
        <div className="stat-card">
          <span>Active listings</span>
          <strong>{activeCount}</strong>
        </div>
        <div className="stat-card">
          <span>Flagged listings</span>
          <strong>{flaggedCount}</strong>
        </div>
        <div className="stat-card">
          <span>Featured slots</span>
          <strong>{featuredCount}</strong>
        </div>
        <div className="stat-card">
          <span>Live boosts</span>
          <strong>{boostedCount}</strong>
        </div>
      </div>

      {listings.length === 0 ? (
        <div style={{ marginTop: "1.25rem" }}>
          <EmptyState
            actionHref="/dashboard/listings/new"
            actionLabel="Create your first listing"
            description="Start with a rental, ride share, job, service, or buy & sell post."
            title="You have not posted any listings yet"
          />
        </div>
      ) : (
        <div className="dashboard-list" style={{ marginTop: "1.25rem" }}>
          {listings.map((listing) => (
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
                {formatCurrency(listing.price)} • {listing.location} • Posted {formatDate(listing.created_at)}
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
