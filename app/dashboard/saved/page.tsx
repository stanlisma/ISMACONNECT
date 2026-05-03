import { ListingCard } from "@/components/listings/listing-card";
import { requireViewer } from "@/lib/auth";
import { getSavedListings } from "@/lib/data";
import { getSellerTrustSummaryMap } from "@/lib/trust";

export default async function SavedListingsPage() {
  const viewer = await requireViewer();
  const listings = await getSavedListings(viewer.user.id);
  const trustMap = await getSellerTrustSummaryMap(listings.map((listing) => listing.owner_id));

  return (
    <section className="section listing-feed-section dashboard-saved-feed-page">
      <div className="container listing-feed-container">
        <div className="surface" style={{ marginBottom: "1rem" }}>
          <h2>Favourites</h2>
          <p className="section-copy">
            Listings you bookmarked to revisit later.
          </p>
        </div>

        {listings.length > 0 ? (
          <div className="listing-grid listing-feed-grid">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isSaved
                canSave
                pathToRevalidate="/dashboard/saved"
                trustSummary={trustMap.get(listing.owner_id)}
              />
            ))}
          </div>
        ) : (
          <div className="surface">
            <p>You have not added any favourites yet.</p>
          </div>
        )}
      </div>
    </section>
  );
}
