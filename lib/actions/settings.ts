"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireViewer } from "@/lib/auth";
import {
  isBusinessProfileSchemaError,
  normalizeBusinessAddress,
  normalizeBusinessWebsite,
  parseBusinessHoursFormData,
  parseBusinessServicesInput,
  parseServiceAreasInput
} from "@/lib/business-profile";
import { geocodeMarketplaceAddress } from "@/lib/geocoding";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function updateNotificationSettingsAction(formData: FormData) {
  const viewer = await requireViewer();
  const supabase = await createServerSupabaseClient();

  const emailNotifications =
    formData.get("email_notifications") === "on";

  await supabase
    .from("profiles")
    .update({
      email_notifications: emailNotifications
    })
    .eq("id", viewer.user.id);

  redirect("/settings?success=Settings updated");
}

export async function updateBusinessProfileAction(formData: FormData) {
  const viewer = await requireViewer();
  const supabase = await createServerSupabaseClient();
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select(
      "business_address, business_geocoded_lat, business_geocoded_lng, business_geocoded_area, business_geocoded_formatted_address, business_geocoded_at"
    )
    .eq("id", viewer.user.id)
    .maybeSingle();

  const isBusiness = formData.get("is_business") === "on";
  const businessName = String(formData.get("business_name") ?? "").trim() || null;
  const businessDescription = String(formData.get("business_description") ?? "").trim() || null;
  const businessLogoUrl = String(formData.get("business_logo_url") ?? "").trim() || null;
  const businessWebsite = normalizeBusinessWebsite(String(formData.get("business_website") ?? ""));
  const businessAddress = normalizeBusinessAddress(String(formData.get("business_address") ?? ""));
  const showExactBusinessLocation = formData.get("show_exact_business_location") === "on";
  const serviceAreas = parseServiceAreasInput(String(formData.get("service_areas") ?? ""));
  const businessServices = parseBusinessServicesInput(String(formData.get("business_services") ?? ""));
  const businessHours = parseBusinessHoursFormData(formData);
  const shouldReuseExistingGeocode =
    isBusiness &&
    businessAddress &&
    existingProfile?.business_address === businessAddress &&
    typeof existingProfile.business_geocoded_lat === "number" &&
    typeof existingProfile.business_geocoded_lng === "number";
  const geocodedBusinessAddress =
    isBusiness && businessAddress
      ? shouldReuseExistingGeocode
        ? {
            lat: existingProfile.business_geocoded_lat as number,
            lng: existingProfile.business_geocoded_lng as number,
            area:
              typeof existingProfile.business_geocoded_area === "string"
                ? existingProfile.business_geocoded_area
                : null,
            formattedAddress:
              typeof existingProfile.business_geocoded_formatted_address === "string"
                ? existingProfile.business_geocoded_formatted_address
                : null
          }
        : await geocodeMarketplaceAddress(businessAddress)
      : null;

  const payload = {
    is_business: isBusiness,
    business_name: isBusiness ? businessName : null,
    business_description: isBusiness ? businessDescription : null,
    business_logo_url: isBusiness ? businessLogoUrl : null,
    business_website: isBusiness ? businessWebsite : null,
    business_address: isBusiness ? businessAddress : null,
    show_exact_business_location: isBusiness && businessAddress ? showExactBusinessLocation : false,
    business_geocoded_lat: isBusiness ? geocodedBusinessAddress?.lat ?? null : null,
    business_geocoded_lng: isBusiness ? geocodedBusinessAddress?.lng ?? null : null,
    business_geocoded_area: isBusiness ? geocodedBusinessAddress?.area ?? null : null,
    business_geocoded_formatted_address: isBusiness ? geocodedBusinessAddress?.formattedAddress ?? null : null,
    business_geocoded_at:
      isBusiness && geocodedBusinessAddress ? new Date().toISOString() : null,
    service_areas: isBusiness ? serviceAreas : [],
    business_services: isBusiness ? businessServices : [],
    business_hours: isBusiness ? businessHours : {}
  };

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", viewer.user.id);

  if (error) {
    if (isBusinessProfileSchemaError(error)) {
      redirect("/settings?error=Run the business profile migration in Supabase before saving business settings.");
    }

    redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/settings");
  revalidatePath("/account");
  revalidatePath(`/sellers/${viewer.user.id}`);
  redirect("/settings?success=Business profile updated");
}
