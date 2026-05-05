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
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const viewer = await requireViewer();
  const listing = await getEditableListing(id);

  if (!listing || (listing.owner_id !== viewer.user.id && viewer.profile.role !== "admin")) {
    notFound();
  }

  return (
    <>
      <FlashMessage message={getSingleParam(resolvedSearchParams?.error)} tone="error" />

      <div className="surface listing-editor-page-head">
        <div className="action-row listing-editor-page-actions">
          <div className="listing-editor-page-copy">
            <span className="eyebrow">Edit Listing</span>
            <h2>Edit listing</h2>
            <p className="section-copy">
              Update details, pricing, contact info, or imagery for this listing.
            </p>
          </div>
          <DeleteListingForm listingId={listing.id} />
        </div>
      </div>

      <ListingForm
        action={updateListingAction.bind(null, listing.id)}
        defaults={{
          category: listing.category ?? undefined,
          subcategory: listing.subcategory ?? undefined,
          contactEmail: listing.contact_email ?? undefined,
          contactName: listing.contact_name ?? undefined,
          contactPhone: listing.contact_phone ?? undefined,
          description: listing.description ?? undefined,
          imageUrl: listing.image_url ?? undefined,
          imageUrls: listing.image_urls ?? undefined,
          location: listing.location ?? undefined,
          price: listing.price != null ? String(listing.price) : undefined,
          structuredData: listing.structured_data ?? undefined,
          title: listing.title ?? undefined
        }}
        submitLabel="Save changes"
      />
    </>
  );
}
