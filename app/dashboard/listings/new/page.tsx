import { ListingForm } from "@/components/listings/listing-form";
import { FlashMessage } from "@/components/ui/flash-message";
import { createListingAction } from "@/lib/actions/listings";
import { requireViewer } from "@/lib/auth";
import { getSingleParam } from "@/lib/utils";

export default async function NewListingPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const viewer = await requireViewer();

  return (
    <>
      <FlashMessage message={getSingleParam(resolvedSearchParams?.error)} tone="error" />
      <FlashMessage message={getSingleParam(resolvedSearchParams?.success)} tone="success" />

      <div className="surface listing-editor-page-head">
        <div className="listing-editor-page-copy">
          <h2>Create listing</h2>
        </div>
      </div>

      <ListingForm
        action={createListingAction}
        defaults={{
          showExactAddressOnMap: viewer.profile.show_exact_business_location ?? false
        }}
        submitLabel="Publish listing"
      />
    </>
  );
}
