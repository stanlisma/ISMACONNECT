import Link from "next/link";

import { AdditionalStorefrontsManager } from "@/components/settings/additional-storefronts-manager";
import { BusinessProfileForm } from "@/components/settings/business-profile-form";
import { FlashMessage } from "@/components/ui/flash-message";
import {
  EMPTY_BUSINESS_PROFILE,
  isBusinessProfileSchemaError,
  normalizeBusinessProfileRow
} from "@/lib/business-profile";
import {
  createAdditionalStorefrontAction,
  deleteAdditionalStorefrontAction,
  updateAdditionalStorefrontAction,
  updateBusinessProfileAction
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
  const viewer = await requireViewer();
  const supabase = await createServerSupabaseClient();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const businessProfileResponse = await supabase
    .from("profiles")
    .select(
      "full_name, phone, is_business, business_name, business_description, business_logo_url, business_website, business_address, show_exact_business_location, service_areas, business_services, business_hours"
    )
    .eq("id", viewer.user.id)
    .maybeSingle();

  let businessSchemaReady = true;
  let businessProfile = EMPTY_BUSINESS_PROFILE;

  if (businessProfileResponse.error) {
    if (isBusinessProfileSchemaError(businessProfileResponse.error)) {
      businessSchemaReady = false;

      const fallbackProfile = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", viewer.user.id)
        .maybeSingle();

      businessProfile = {
        ...EMPTY_BUSINESS_PROFILE,
        full_name: fallbackProfile.data?.full_name ?? null,
        phone: fallbackProfile.data?.phone ?? null
      };
    } else {
      console.error("Business storefront page load failed:", businessProfileResponse.error.message);
    }
  } else {
    businessProfile = normalizeBusinessProfileRow(businessProfileResponse.data);
  }

  const additionalStorefrontsResult = await getOwnedAdditionalStorefronts(viewer.user.id);

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

      <div className="surface storefront-manager-summary">
        <div>
          <h2>My Storefronts</h2>
          <p className="section-copy">
            Create and update separate storefronts for different businesses,
            brands, locations, or service lines under your account.
          </p>
        </div>

        <div className="action-row">
          <a
            className={`button${businessProfile.is_business ? "" : " button-secondary"}`}
            href={businessProfile.is_business ? "#create-storefront-form" : "#business-storefront-toggle"}
          >
            Create storefront
          </a>
        </div>
      </div>

      <BusinessProfileForm
        action={updateBusinessProfileAction}
        schemaReady={businessSchemaReady}
        returnPath="/dashboard/storefronts"
        defaults={{
          isBusiness: businessProfile.is_business,
          profilePhone: businessProfile.phone ?? viewer.profile.phone ?? ""
        }}
      />

      <AdditionalStorefrontsManager
        storefronts={additionalStorefrontsResult.storefronts}
        schemaReady={additionalStorefrontsResult.schemaReady}
        accountEnabled={businessProfile.is_business}
        createAction={createAdditionalStorefrontAction}
        updateAction={updateAdditionalStorefrontAction}
        deleteAction={deleteAdditionalStorefrontAction}
        fallbackPhone={businessProfile.phone ?? viewer.profile.phone ?? ""}
        returnPath="/dashboard/storefronts"
        suggestedDefaults={
          additionalStorefrontsResult.storefronts.length === 0 &&
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
                website: businessProfile.business_website ?? null,
                phone: businessProfile.phone ?? viewer.profile.phone ?? null,
                address: businessProfile.business_address ?? null,
                show_exact_location: businessProfile.show_exact_business_location,
                service_areas: businessProfile.service_areas,
                services: businessProfile.business_services,
                hours: businessProfile.business_hours,
                id: "",
                owner_id: viewer.user.id,
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
