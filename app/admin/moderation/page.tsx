import Link from "next/link";

import { ModerationActions } from "@/components/admin/moderation-actions";
import { VerificationRequestActions } from "@/components/admin/verification-request-actions";
import { FlashMessage } from "@/components/ui/flash-message";
import { EmptyState } from "@/components/ui/empty-state";
import { getFlaggedListings } from "@/lib/data";
import { getPendingVerificationProfiles } from "@/lib/trust";
import { excerpt, formatCurrency, formatDate, getCategoryLabel, getSingleParam } from "@/lib/utils";

export default async function ModerationPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const [flaggedListings, pendingProfiles] = await Promise.all([
    getFlaggedListings(),
    getPendingVerificationProfiles()
  ]);

  return (
    <>
      <FlashMessage message={getSingleParam(resolvedSearchParams?.success)} tone="success" />
      <FlashMessage message={getSingleParam(resolvedSearchParams?.error)} tone="error" />

      {pendingProfiles.length ? (
        <div className="dashboard-list" style={{ marginBottom: "1.25rem" }}>
          {pendingProfiles.map((profile) => (
            <div className="dashboard-listing" key={profile.id}>
              <div className="badge-row">
                <span className="badge badge-soft">Verification</span>
                <span className="badge badge-neutral">Pending</span>
              </div>

              <h3>{profile.full_name || profile.email || "Local member"}</h3>
              <p>
                Requested {profile.verification_requested_at ? formatDate(profile.verification_requested_at) : "recently"} • Member since {formatDate(profile.created_at)}
              </p>

              <div className="meta-list">
                {profile.email ? <span>Email: {profile.email}</span> : null}
                {profile.phone ? <span>Phone: {profile.phone}</span> : <span>No phone on file</span>}
              </div>

              <VerificationRequestActions profileId={profile.id} />
            </div>
          ))}
        </div>
      ) : null}

      {flaggedListings.length === 0 ? (
        <EmptyState
          actionHref="/dashboard"
          actionLabel="Back to My Listings"
          description={
            pendingProfiles.length
              ? "There are no flagged listings right now."
              : "New flags and verification requests will appear here for review."
          }
          title={pendingProfiles.length ? "No flagged listings right now" : "Nothing to review right now"}
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
