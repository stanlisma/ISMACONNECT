import { notFound } from "next/navigation";

import { DeleteListingForm } from "@/components/listings/delete-listing-form";
import { ListingForm } from "@/components/listings/listing-form";
import { FlashMessage } from "@/components/ui/flash-message";
import { updateListingAction } from "@/lib/actions/listings";
import { requireViewer } from "@/lib/auth";
import { getEditableListing, getOwnedAdditionalStorefronts } from "@/lib/data";
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

  const listingIntent = listing.listing_intent === "need" ? "need" : "offer";
  const profileContactName = viewer.profile.is_business
    ? viewer.profile.business_name ?? viewer.profile.full_name ?? undefined
    : viewer.profile.full_name ?? undefined;
  const profileContactEmail = viewer.user.email ?? undefined;
  const profileContactPhone = viewer.profile.phone ?? undefined;
  const storefrontsResult = viewer.profile.is_business
    ? await getOwnedAdditionalStorefronts(viewer.user.id)
    : { storefronts: [], schemaReady: true };
  const normalizedListingContact = {
    name: listing.contact_name?.trim() ?? "",
    email: listing.contact_email?.trim() ?? "",
    phone: listing.contact_phone?.trim() ?? ""
  };
  const normalizedProfileContact = {
    name: profileContactName?.trim() ?? "",
    email: profileContactEmail?.trim() ?? "",
    phone: profileContactPhone?.trim() ?? ""
  };
  const usesProfileContactByDefault =
    Boolean(normalizedProfileContact.name && normalizedProfileContact.email) &&
    normalizedListingContact.name === normalizedProfileContact.name &&
    normalizedListingContact.email === normalizedProfileContact.email &&
    normalizedListingContact.phone === normalizedProfileContact.phone;

  return (
    <>
      <FlashMessage message={getSingleParam(resolvedSearchParams?.error)} tone="error" />

        <div className="surface listing-editor-page-head">
          <div className="action-row listing-editor-page-actions">
            <div className="listing-editor-page-copy">
              <h2>{listingIntent === "need" ? "Edit need" : "Edit listing"}</h2>
            </div>
            <DeleteListingForm listingId={listing.id} />
          </div>
        </div>

      <ListingForm
        action={updateListingAction.bind(null, listing.id)}
        profileContact={{
          name: profileContactName,
          email: profileContactEmail,
          phone: profileContactPhone
        }}
        storefronts={storefrontsResult.storefronts}
        primaryStorefrontLabel={
          viewer.profile.is_business ? viewer.profile.business_name ?? viewer.profile.full_name ?? undefined : undefined
        }
        defaultContactSource={usesProfileContactByDefault ? "profile" : "custom"}
        defaults={{
          category: listing.category ?? undefined,
          subcategory: listing.subcategory ?? undefined,
          listingIntent,
          requestWindow: listing.request_window ?? undefined,
          storefrontId: listing.storefront_id ?? null,
          contactEmail: listing.contact_email ?? profileContactEmail,
          contactName: listing.contact_name ?? profileContactName,
          contactPhone: listing.contact_phone ?? profileContactPhone,
          description: listing.description ?? undefined,
          imageUrl: listing.image_url ?? undefined,
          imageUrls: listing.image_urls ?? undefined,
          location: listing.location ?? undefined,
          showExactAddressOnMap:
            listing.show_exact_address_on_map ?? viewer.profile.show_exact_business_location ?? false,
          price: listing.price != null ? String(listing.price) : undefined,
          priceType: listing.price_type ?? undefined,
          structuredData: listing.structured_data ?? undefined,
          title: listing.title ?? undefined
        }}
        submitLabel={listingIntent === "need" ? "Save need" : "Save changes"}
      />
    </>
  );
}
