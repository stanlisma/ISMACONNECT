import { unstable_noStore as noStore } from "next/cache";

import { AdditionalStorefrontsManager } from "@/components/settings/additional-storefronts-manager";
import { FlashMessage } from "@/components/ui/flash-message";
import {
  EMPTY_BUSINESS_PROFILE,
  isBusinessProfileSchemaError,
  normalizeBusinessProfileRow
} from "@/lib/business-profile";
import {
  createAdditionalStorefrontAction,
  deleteAdditionalStorefrontAction,
  updateAdditionalStorefrontAction
} from "@/lib/actions/settings";
import { requireViewer } from "@/lib/auth";
import { getOwnedAdditionalStorefronts } from "@/lib/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSingleParam } from "@/lib/utils";

export default async function DashboardStorefrontsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  noStore();

  const viewer = await requireViewer();
  const supabase = await createServerSupabaseClient();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const showCreateForm = getSingleParam(resolvedSearchParams?.create) === "1";
  const focusStorefrontId = getSingleParam(resolvedSearchParams?.storefront);

  const businessProfileResponse = await supabase
    .from("profiles")
    .select(
      "business_name, business_description, business_logo_url, business_website, business_address, show_exact_business_location, service_areas, business_services, business_hours"
    )
    .eq("id", viewer.user.id)
    .maybeSingle();

  let businessProfile = EMPTY_BUSINESS_PROFILE;

  if (businessProfileResponse.error) {
    if (isBusinessProfileSchemaError(businessProfileResponse.error)) {
      businessProfile = EMPTY_BUSINESS_PROFILE;
    } else {
      console.error("Business storefront page load failed:", businessProfileResponse.error.message);
    }
  } else {
    businessProfile = normalizeBusinessProfileRow(businessProfileResponse.data);
  }

  const additionalStorefrontsResult = await getOwnedAdditionalStorefronts(viewer.user.id);
  // Unclaimed placeholder businesses (created via /admin/storefronts) share the admin's
  // owner_id as a technical stand-in - keep them out of the admin's own storefront manager.
  const ownedStorefronts = additionalStorefrontsResult.storefronts.filter(
    (storefront) => storefront.claimed
  );

  return (
    <div className="stack-md">
      <FlashMessage
        message={getSingleParam(resolvedSearchParams?.success)}
        tone="success"
      />

      <FlashMessage
        message={getSingleParam(resolvedSearchParams?.error)}
        tone="error"
      />

      <AdditionalStorefrontsManager
        storefronts={ownedStorefronts}
        schemaReady={additionalStorefrontsResult.schemaReady}
        focusStorefrontId={focusStorefrontId}
        showCreateForm={showCreateForm}
        createAction={createAdditionalStorefrontAction}
        updateAction={updateAdditionalStorefrontAction}
        deleteAction={deleteAdditionalStorefrontAction}
        returnPath="/dashboard/storefronts"
        suggestedDefaults={
          ownedStorefronts.length === 0 &&
          (businessProfile.business_name ||
            businessProfile.business_description ||
            businessProfile.business_website ||
            businessProfile.business_address ||
            businessProfile.service_areas.length ||
            businessProfile.business_services.length)
            ? {
                name: businessProfile.business_name ?? "",
                description: businessProfile.business_description ?? null,
                logo_url: businessProfile.business_logo_url ?? null,
                image_urls: [],
                website: businessProfile.business_website ?? null,
                phone: null,
                address: businessProfile.business_address ?? null,
                show_exact_location: businessProfile.show_exact_business_location,
                service_areas: businessProfile.service_areas,
                services: businessProfile.business_services,
                hours: businessProfile.business_hours,
                id: "",
                owner_id: viewer.user.id,
                claimed: true,
                slug: "",
                geocoded_lat: null,
                geocoded_lng: null,
                geocoded_area: null,
                geocoded_formatted_address: null,
                geocoded_at: null,
                created_at: "",
                updated_at: ""
              }
            : undefined
        }
      />
    </div>
  );
}
