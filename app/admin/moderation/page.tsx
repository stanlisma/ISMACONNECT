import Link from "next/link";

import { ModerationActions } from "@/components/admin/moderation-actions";
import { FlashMessage } from "@/components/ui/flash-message";
import { EmptyState } from "@/components/ui/empty-state";
import { getFlaggedListings } from "@/lib/data";
import { excerpt, formatCurrency, formatDate, getCategoryLabel, getSingleParam } from "@/lib/utils";

export default async function ModerationPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const flaggedListings = await getFlaggedListings();

  return (
    <>
      <FlashMessage message={getSingleParam(resolvedSearchParams?.success)} tone="success" />
      <FlashMessage message={getSingleParam(resolvedSearchParams?.error)} tone="error" />

      {flaggedListings.length === 0 ? (
        <EmptyState
          actionHref="/dashboard"
          actionLabel="Back to My Listings"
          description="New flags will appear here for review."
          title="No flagged listings right now"
        />
      ) : (
        <div className="dashboard-list">
          {flaggedListings.map((listing) => (
            <div className="dashboard-listing" key={listing.id}>
              <div className="badge-row">
                <span className="badge badge-soft">{getCategoryLabel(listing.category)}</span>
                <span className="badge badge-danger">Flagged</span>
              </div>

              <h3>{listing.title}</h3>
              <p>
                {formatCurrency(listing.price)} • {listing.location} • Updated {formatDate(listing.updated_at)}
              </p>
              <p>{excerpt(listing.description, 180)}</p>

              <div className="meta-list">
                {listing.listing_flags.length > 0 ? (
                  listing.listing_flags.slice(0, 3).map((flag) => (
                    <span key={flag.id}>Flag reason: {flag.reason}</span>
                  ))
                ) : (
                  <span>No flag details were returned.</span>
                )}
              </div>

              <div className="action-row">
                <Link className="button button-secondary" href={`/dashboard/listings/${listing.id}/edit`}>
                  Open listing
                </Link>
                <ModerationActions listingId={listing.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
