import { ListingCard } from "@/components/listings/listing-card";
import { requireViewer } from "@/lib/auth";
import { getSavedListings } from "@/lib/data";

export default async function SavedListingsPage() {
  const viewer = await requireViewer();
  const listings = await getSavedListings(viewer.user.id);

  return (
    <section className="section">
      <div className="container">
        <div className="surface" style={{ marginBottom: "1rem" }}>
          <h2>Saved listings</h2>
          <p className="section-copy">
            Listings you bookmarked to revisit later.
          </p>
        </div>

        {listings.length > 0 ? (
          <div className="listing-grid">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isSaved
                canSave
                pathToRevalidate="/dashboard/saved"
              />
            ))}
          </div>
        ) : (
          <div className="surface">
            <p>You have not saved any listings yet.</p>
          </div>
        )}
      </div>
    </section>
  );
}