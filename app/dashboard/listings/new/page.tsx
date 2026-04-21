import { FlashMessage } from "@/components/ui/flash-message";
import { ListingForm } from "@/components/listings/listing-form";
import { createListingAction } from "@/lib/actions/listings";
import { requireViewer } from "@/lib/auth";
import { getSingleParam } from "@/lib/utils";

export default async function NewListingPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const viewer = await requireViewer();

  return (
    <>
      <FlashMessage message={getSingleParam(searchParams?.error)} tone="error" />
      <div className="surface" style={{ marginBottom: "1rem" }}>
        <h2>Create a new listing</h2>
        <p className="section-copy">
          Publish a clear local listing with contact information so buyers, renters, and applicants can reach
          you quickly.
        </p>
      </div>
      <ListingForm
        action={createListingAction}
        cancelHref="/dashboard"
        defaults={{
          contactEmail: viewer.profile.email,
          contactName: viewer.profile.full_name,
          contactPhone: viewer.profile.phone
        }}
        pendingLabel="Publishing..."
        submitLabel="Publish listing"
      />
    </>
  );
}

