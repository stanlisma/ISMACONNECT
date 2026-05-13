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
  const profileContactName = viewer.profile.is_business
    ? viewer.profile.business_name ?? viewer.profile.full_name ?? undefined
    : viewer.profile.full_name ?? undefined;
  const profileContactEmail = viewer.user.email ?? undefined;
  const profileContactPhone = viewer.profile.phone ?? undefined;

  return (
    <>
      <FlashMessage message={getSingleParam(resolvedSearchParams?.error)} tone="error" />
      <FlashMessage message={getSingleParam(resolvedSearchParams?.success)} tone="success" />

      <ListingForm
        action={createListingAction}
        profileContact={{
          name: profileContactName,
          email: profileContactEmail,
          phone: profileContactPhone
        }}
        defaultContactSource="profile"
        defaults={{
          category,
          listingIntent,
          contactName: profileContactName,
          contactEmail: profileContactEmail,
          contactPhone: profileContactPhone,
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
