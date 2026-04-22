import { notFound } from "next/navigation";

import { DeleteListingForm } from "@/components/listings/delete-listing-form";
import { ListingForm } from "@/components/listings/listing-form";
import { FlashMessage } from "@/components/ui/flash-message";
import { updateListingAction } from "@/lib/actions/listings";
import { requireViewer } from "@/lib/auth";
import { getEditableListing } from "@/lib/data";
import { getSingleParam } from "@/lib/utils";

export default async function EditListingPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const viewer = await requireViewer();
  const listing = await getEditableListing(params.id);

  if (!listing || (listing.owner_id !== viewer.user.id && viewer.profile.role !== "admin")) {
    notFound();
  }

  return (
    <>
      <FlashMessage message={getSingleParam(searchParams?.error)} tone="error" />

      <div className="surface" style={{ marginBottom: "1rem" }}>
        <div className="action-row" style={{ justifyContent: "space-between" }}>
          <div>
            <h2>Edit listing</h2>
            <p className="section-copy">Update details, pricing, contact info, or imagery for this listing.</p>
          </div>
          <DeleteListingForm listingId={listing.id} />
        </div>
      </div>

      <ListingForm
        action={updateListingAction.bind(null, listing.id)}
        cancelHref="/dashboard"
        defaults={{
          category: listing.category ?? undefined,
          contactEmail: listing.contact_email ?? undefined,
          contactName: listing.contact_name ?? undefined,
          contactPhone: listing.contact_phone ?? undefined,
          description: listing.description ?? undefined,
          imageUrl: listing.image_url ?? undefined,
          location: listing.location ?? undefined,
          price: listing.price ?? undefined,
          title: listing.title ?? undefined
        }}
        pendingLabel="Saving changes..."
        submitLabel="Save changes"
      />
    </>
  );
}

