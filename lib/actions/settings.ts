"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireViewer } from "@/lib/auth";
import {
  buildStorefrontSlug,
  isAdditionalStorefrontSchemaError,
  parseAdditionalStorefrontFormData
} from "@/lib/business-storefronts";
import { isBusinessProfileSchemaError } from "@/lib/business-profile";
import { isSupabaseServiceRoleConfigured } from "@/lib/env";
import { geocodeMarketplaceAddress } from "@/lib/geocoding";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";

function resolveSettingsReturnPath(formData: FormData, fallbackPath = "/settings") {
  const rawPath = formData.get("return_path");

  if (typeof rawPath !== "string" || !rawPath.startsWith("/")) {
    return fallbackPath;
  }

  if (rawPath === "/settings" || rawPath.startsWith("/settings?")) {
    return rawPath;
  }

  if (rawPath === "/dashboard/storefronts" || rawPath.startsWith("/dashboard/storefronts?")) {
    return rawPath;
  }

  return fallbackPath;
}

function buildReturnPathWithMessage(returnPath: string, key: "success" | "error", message: string) {
  const [pathname, existingQuery] = returnPath.split("?");
  const searchParams = new URLSearchParams(existingQuery ?? "");
  searchParams.delete("create");
  searchParams.delete("storefront");
  searchParams.set(key, message);
  const queryString = searchParams.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

function buildReturnPathWithMessageAndFocus(
  returnPath: string,
  key: "success" | "error",
  message: string,
  storefrontId: string
) {
  const [pathname, existingQuery] = returnPath.split("?");
  const searchParams = new URLSearchParams(existingQuery ?? "");
  searchParams.delete("create");
  searchParams.set(key, message);
  searchParams.set("storefront", storefrontId);
  const queryString = searchParams.toString();
  const nextPath = queryString ? `${pathname}?${queryString}` : pathname;
  return `${nextPath}#storefront-${storefrontId}`;
}

async function generateUniqueStorefrontSlug(ownerId: string, name: string, storefrontId?: string) {
  const supabase = isSupabaseServiceRoleConfigured()
    ? createServiceRoleSupabaseClient()
    : await createServerSupabaseClient();
  const baseSlug = buildStorefrontSlug(name);
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    let query = supabase
      .from("business_storefronts")
      .select("id")
      .eq("owner_id", ownerId)
      .eq("slug", candidate);

    if (storefrontId) {
      query = query.neq("id", storefrontId);
    }

    const { data } = await query.maybeSingle();

    if (!data) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

async function loadOwnedStorefront(ownerId: string, storefrontId: string) {
  const supabase = isSupabaseServiceRoleConfigured()
    ? createServiceRoleSupabaseClient()
    : await createServerSupabaseClient();
  const { data } = await supabase
    .from("business_storefronts")
    .select("*")
    .eq("id", storefrontId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  return data;
}

async function createSettingsMutationClient() {
  return isSupabaseServiceRoleConfigured()
    ? createServiceRoleSupabaseClient()
    : await createServerSupabaseClient();
}

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
  const supabase = await createSettingsMutationClient();
  const isBusiness =
    formData.get("is_business_value") === "true" ||
    formData.get("is_business") === "on";
  const returnPath = resolveSettingsReturnPath(formData);

  if (!isBusiness) {
    const { count, error: storefrontCountError } = await supabase
      .from("business_storefronts")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", viewer.user.id);

    if (storefrontCountError && !isAdditionalStorefrontSchemaError(storefrontCountError)) {
      redirect(buildReturnPathWithMessage(returnPath, "error", storefrontCountError.message));
    }

    if ((count ?? 0) > 0) {
      redirect(
        buildReturnPathWithMessage(
          returnPath,
          "error",
          "Delete your storefronts before turning off business mode for this account."
        )
      );
    }
  }

  const payload = {
    is_business: isBusiness,
    business_name: null,
    business_description: null,
    business_logo_url: null,
    business_website: null,
    business_address: null,
    show_exact_business_location: false,
    business_geocoded_lat: null,
    business_geocoded_lng: null,
    business_geocoded_area: null,
    business_geocoded_formatted_address: null,
    business_geocoded_at: null,
    service_areas: [],
    business_services: [],
    business_hours: {}
  };

  const { data: updatedProfile, error } = await supabase
    .from("profiles")
    .update(payload)
    .select("is_business")
    .eq("id", viewer.user.id);

  if (error) {
    if (isBusinessProfileSchemaError(error)) {
      redirect(
        buildReturnPathWithMessage(
          returnPath,
          "error",
          "Run the business profile migration in Supabase before saving business settings."
        )
      );
    }

    redirect(buildReturnPathWithMessage(returnPath, "error", error.message));
  }

  const persistedValue = Array.isArray(updatedProfile)
    ? Boolean(updatedProfile[0]?.is_business)
    : Boolean((updatedProfile as { is_business?: boolean } | null)?.is_business);

  if (persistedValue !== isBusiness) {
    redirect(
      buildReturnPathWithMessage(
        returnPath,
        "error",
        "Business storefront setting did not save. Please confirm the business storefront migration is fully applied in Supabase."
      )
    );
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard/storefronts");
  revalidatePath("/account");
  revalidatePath(`/sellers/${viewer.user.id}`);
  redirect(buildReturnPathWithMessage(returnPath, "success", "Business profile updated"));
}

export async function createAdditionalStorefrontAction(formData: FormData) {
  const viewer = await requireViewer();
  const supabase = await createSettingsMutationClient();
  const parsed = parseAdditionalStorefrontFormData(formData);
  const returnPath = resolveSettingsReturnPath(formData);

  if (!parsed.name) {
    redirect(buildReturnPathWithMessage(returnPath, "error", "Storefront name is required."));
  }

  const slug = await generateUniqueStorefrontSlug(viewer.user.id, parsed.name);
  const geocodedAddress = parsed.address
    ? await geocodeMarketplaceAddress(parsed.address)
    : null;

  await supabase
    .from("profiles")
    .update({ is_business: true })
    .eq("id", viewer.user.id);

  const { data: insertedStorefront, error } = await supabase
    .from("business_storefronts")
    .insert({
      owner_id: viewer.user.id,
      slug,
      name: parsed.name,
      description: parsed.description,
      logo_url: parsed.logoUrl,
      image_urls: parsed.imageUrls,
      website: parsed.website,
      phone: parsed.phone,
      address: parsed.address,
      show_exact_location: parsed.address ? parsed.showExactLocation : false,
      geocoded_lat: geocodedAddress?.lat ?? null,
      geocoded_lng: geocodedAddress?.lng ?? null,
      geocoded_area: geocodedAddress?.area ?? null,
      geocoded_formatted_address: geocodedAddress?.formattedAddress ?? null,
      geocoded_at: geocodedAddress ? new Date().toISOString() : null,
      service_areas: parsed.serviceAreas,
      services: parsed.services,
      hours: parsed.hours
    })
    .select("id")
    .maybeSingle();

  if (error) {
    if (isAdditionalStorefrontSchemaError(error)) {
      redirect(
        buildReturnPathWithMessage(
          returnPath,
          "error",
          "Run the additional storefront migration in Supabase before saving more storefronts."
        )
      );
    }

    redirect(buildReturnPathWithMessage(returnPath, "error", error.message));
  }

  if (!insertedStorefront?.id) {
    redirect(
      buildReturnPathWithMessage(
        returnPath,
        "error",
        "Storefront creation did not persist. Please try again after confirming the storefront migration is applied."
      )
    );
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard/storefronts");
  revalidatePath(`/sellers/${viewer.user.id}`);
  redirect(
    buildReturnPathWithMessageAndFocus(
      returnPath,
      "success",
      "Storefront created",
      insertedStorefront.id
    )
  );
}

export async function updateAdditionalStorefrontAction(storefrontId: string, formData: FormData) {
  const viewer = await requireViewer();
  const existingStorefront = await loadOwnedStorefront(viewer.user.id, storefrontId);
  const returnPath = resolveSettingsReturnPath(formData);

  if (!existingStorefront) {
    redirect(buildReturnPathWithMessage(returnPath, "error", "That storefront could not be found."));
  }

  const parsed = parseAdditionalStorefrontFormData(formData);

  if (!parsed.name) {
    redirect(buildReturnPathWithMessage(returnPath, "error", "Storefront name is required."));
  }

  const slug = await generateUniqueStorefrontSlug(viewer.user.id, parsed.name, storefrontId);
  const shouldReuseGeocode =
    existingStorefront.address === parsed.address &&
    typeof existingStorefront.geocoded_lat === "number" &&
    typeof existingStorefront.geocoded_lng === "number";
  const geocodedAddress = parsed.address
    ? shouldReuseGeocode
      ? {
          lat: existingStorefront.geocoded_lat as number,
          lng: existingStorefront.geocoded_lng as number,
          area: typeof existingStorefront.geocoded_area === "string" ? existingStorefront.geocoded_area : null,
          formattedAddress:
            typeof existingStorefront.geocoded_formatted_address === "string"
              ? existingStorefront.geocoded_formatted_address
              : null
        }
      : await geocodeMarketplaceAddress(parsed.address)
    : null;
  const supabase = await createSettingsMutationClient();

  const { data: updatedStorefront, error } = await supabase
    .from("business_storefronts")
    .update({
      slug,
      name: parsed.name,
      description: parsed.description,
      logo_url: parsed.logoUrl,
      image_urls: parsed.imageUrls,
      website: parsed.website,
      phone: parsed.phone,
      address: parsed.address,
      show_exact_location: parsed.address ? parsed.showExactLocation : false,
      geocoded_lat: geocodedAddress?.lat ?? null,
      geocoded_lng: geocodedAddress?.lng ?? null,
      geocoded_area: geocodedAddress?.area ?? null,
      geocoded_formatted_address: geocodedAddress?.formattedAddress ?? null,
      geocoded_at: geocodedAddress ? new Date().toISOString() : null,
      service_areas: parsed.serviceAreas,
      services: parsed.services,
      hours: parsed.hours,
      updated_at: new Date().toISOString()
    })
    .select("id")
    .eq("id", storefrontId)
    .eq("owner_id", viewer.user.id);

  if (error) {
    if (isAdditionalStorefrontSchemaError(error)) {
      redirect(
        buildReturnPathWithMessage(
          returnPath,
          "error",
          "Run the additional storefront migration in Supabase before saving more storefronts."
        )
      );
    }

    redirect(buildReturnPathWithMessage(returnPath, "error", error.message));
  }

  const persistedStorefrontId = Array.isArray(updatedStorefront)
    ? updatedStorefront[0]?.id
    : (updatedStorefront as { id?: string } | null)?.id;

  if (!persistedStorefrontId) {
    redirect(
      buildReturnPathWithMessage(
        returnPath,
        "error",
        "Storefront update did not persist. Please try again after confirming the storefront migration is applied."
      )
    );
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard/storefronts");
  revalidatePath(`/sellers/${viewer.user.id}`);
  redirect(
    buildReturnPathWithMessageAndFocus(
      returnPath,
      "success",
      "Storefront updated",
      persistedStorefrontId
    )
  );
}

export async function deleteAdditionalStorefrontAction(storefrontId: string, formData: FormData) {
  const viewer = await requireViewer();
  const existingStorefront = await loadOwnedStorefront(viewer.user.id, storefrontId);
  const returnPath = resolveSettingsReturnPath(formData, "/dashboard/storefronts");

  if (!existingStorefront) {
    redirect(buildReturnPathWithMessage(returnPath, "error", "That storefront could not be found."));
  }

  const supabase = await createSettingsMutationClient();
  const { data: deletedStorefront, error } = await supabase
    .from("business_storefronts")
    .delete()
    .select("id")
    .eq("id", storefrontId)
    .eq("owner_id", viewer.user.id);

  if (error) {
    if (isAdditionalStorefrontSchemaError(error)) {
      redirect(
        buildReturnPathWithMessage(
          returnPath,
          "error",
          "Run the additional storefront migration in Supabase before deleting storefronts."
        )
      );
    }

    redirect(buildReturnPathWithMessage(returnPath, "error", error.message));
  }

  const deletedStorefrontId = Array.isArray(deletedStorefront)
    ? deletedStorefront[0]?.id
    : (deletedStorefront as { id?: string } | null)?.id;

  if (!deletedStorefrontId) {
    redirect(
      buildReturnPathWithMessage(
        returnPath,
        "error",
        "Storefront delete did not persist. Please try again after confirming the storefront migration is applied."
      )
    );
  }

  const { count: remainingStorefrontCount } = await supabase
    .from("business_storefronts")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", viewer.user.id);

  if ((remainingStorefrontCount ?? 0) === 0) {
    await supabase
      .from("profiles")
      .update({ is_business: false })
      .eq("id", viewer.user.id);
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard/storefronts");
  revalidatePath(`/sellers/${viewer.user.id}`);
  redirect(buildReturnPathWithMessage(returnPath, "success", "Storefront deleted"));
}
