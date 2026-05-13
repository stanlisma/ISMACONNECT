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
import { geocodeMarketplaceAddress } from "@/lib/geocoding";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function generateUniqueStorefrontSlug(ownerId: string, name: string, storefrontId?: string) {
  const supabase = await createServerSupabaseClient();
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
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("business_storefronts")
    .select("*")
    .eq("id", storefrontId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  return data;
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
  const supabase = await createServerSupabaseClient();
  const isBusiness = formData.get("is_business") === "on";

  if (!isBusiness) {
    const { count, error: storefrontCountError } = await supabase
      .from("business_storefronts")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", viewer.user.id);

    if (storefrontCountError && !isAdditionalStorefrontSchemaError(storefrontCountError)) {
      redirect(`/settings?error=${encodeURIComponent(storefrontCountError.message)}`);
    }

    if ((count ?? 0) > 0) {
      redirect("/settings?error=Delete your storefronts before turning off business mode for this account.");
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

export async function createAdditionalStorefrontAction(formData: FormData) {
  const viewer = await requireViewer();
  const supabase = await createServerSupabaseClient();
  const parsed = parseAdditionalStorefrontFormData(formData);

  if (!parsed.name) {
    redirect("/settings?error=Storefront name is required.");
  }

  const slug = await generateUniqueStorefrontSlug(viewer.user.id, parsed.name);
  const geocodedAddress = parsed.address
    ? await geocodeMarketplaceAddress(parsed.address)
    : null;

  const { error } = await supabase.from("business_storefronts").insert({
    owner_id: viewer.user.id,
    slug,
    name: parsed.name,
    description: parsed.description,
    logo_url: parsed.logoUrl,
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
  });

  if (error) {
    if (isAdditionalStorefrontSchemaError(error)) {
      redirect("/settings?error=Run the additional storefront migration in Supabase before saving more storefronts.");
    }

    redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/settings");
  revalidatePath(`/sellers/${viewer.user.id}`);
  redirect("/settings?success=Storefront created");
}

export async function updateAdditionalStorefrontAction(storefrontId: string, formData: FormData) {
  const viewer = await requireViewer();
  const existingStorefront = await loadOwnedStorefront(viewer.user.id, storefrontId);

  if (!existingStorefront) {
    redirect("/settings?error=That storefront could not be found.");
  }

  const parsed = parseAdditionalStorefrontFormData(formData);

  if (!parsed.name) {
    redirect("/settings?error=Storefront name is required.");
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
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("business_storefronts")
    .update({
      slug,
      name: parsed.name,
      description: parsed.description,
      logo_url: parsed.logoUrl,
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
    .eq("id", storefrontId)
    .eq("owner_id", viewer.user.id);

  if (error) {
    if (isAdditionalStorefrontSchemaError(error)) {
      redirect("/settings?error=Run the additional storefront migration in Supabase before saving more storefronts.");
    }

    redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/settings");
  revalidatePath(`/sellers/${viewer.user.id}`);
  redirect("/settings?success=Storefront updated");
}

export async function deleteAdditionalStorefrontAction(storefrontId: string) {
  const viewer = await requireViewer();
  const existingStorefront = await loadOwnedStorefront(viewer.user.id, storefrontId);

  if (!existingStorefront) {
    redirect("/settings?error=That storefront could not be found.");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("business_storefronts")
    .delete()
    .eq("id", storefrontId)
    .eq("owner_id", viewer.user.id);

  if (error) {
    if (isAdditionalStorefrontSchemaError(error)) {
      redirect("/settings?error=Run the additional storefront migration in Supabase before deleting storefronts.");
    }

    redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/settings");
  revalidatePath(`/sellers/${viewer.user.id}`);
  redirect("/settings?success=Storefront deleted");
}
