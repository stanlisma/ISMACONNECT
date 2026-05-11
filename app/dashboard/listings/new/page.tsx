import { ListingForm } from "@/components/listings/listing-form";
import { FlashMessage } from "@/components/ui/flash-message";
import { createListingAction } from "@/lib/actions/listings";
import { requireViewer } from "@/lib/auth";
import { getSingleParam, resolveCategory, resolveListingIntent } from "@/lib/utils";

export default async function NewListingPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const viewer = await requireViewer();
  const listingIntent = resolveListingIntent(getSingleParam(resolvedSearchParams?.intent)) ?? "offer";
  const category = resolveCategory(getSingleParam(resolvedSearchParams?.category));

  return (
    <>
      <FlashMessage message={getSingleParam(resolvedSearchParams?.error)} tone="error" />
      <FlashMessage message={getSingleParam(resolvedSearchParams?.success)} tone="success" />

      <div className="surface listing-editor-page-head">
        <div className="listing-editor-page-copy">
          <h2>{listingIntent === "need" ? "Post a need" : "Create listing"}</h2>
        </div>
      </div>

      <ListingForm
        action={createListingAction}
        defaults={{
          category,
          listingIntent,
          contactName:
            viewer.profile.is_business
              ? viewer.profile.business_name ?? viewer.profile.full_name ?? undefined
              : viewer.profile.full_name ?? undefined,
          contactEmail: viewer.user.email ?? undefined,
          contactPhone: viewer.profile.phone ?? undefined,
          location:
            viewer.profile.is_business && viewer.profile.business_address
              ? viewer.profile.business_address
              : undefined,
          showExactAddressOnMap: viewer.profile.show_exact_business_location ?? false
        }}
        submitLabel={listingIntent === "need" ? "Post need" : "Publish listing"}
      />
    </>
  );
}
