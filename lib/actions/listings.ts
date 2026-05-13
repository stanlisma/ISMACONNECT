"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminViewer, requireViewer } from "@/lib/auth";
import { geocodeMarketplaceAddress } from "@/lib/geocoding";
import { parseStructuredListingData } from "@/lib/listing-structured-fields";
import { normalizeSubcategory } from "@/lib/subcategories";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { flagListingSchema, listingSchema } from "@/lib/validation/listing";
import { firstMessage, slugify } from "@/lib/utils";
import type { ListingIntent } from "@/types/database";

function redirectWithMessage(path: string, key: "error" | "success", message: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
}

function isSubcategoryConstraintError(error: {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
}) {
  const message = `${error?.message ?? ""} ${error?.details ?? ""} ${error?.hint ?? ""}`.toLowerCase();
  return error?.code === "23514" && message.includes("valid_subcategories");
}

function getSubcategoryConstraintMessage() {
  return "Your database subcategory rules are out of date. Run the latest ISMACONNECT subcategory migration in Supabase, then try posting again.";
}

function isAddressVisibilitySchemaError(error: {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
}) {
  const message = `${error?.message ?? ""} ${error?.details ?? ""} ${error?.hint ?? ""}`.toLowerCase();
  return message.includes("show_exact_address_on_map");
}

function getAddressVisibilitySchemaMessage() {
  return "Your database address visibility rules are out of date. Run the latest ISMACONNECT address visibility migration in Supabase, then try posting again.";
}

function isListingIntentSchemaError(error: {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
}) {
  const message = `${error?.message ?? ""} ${error?.details ?? ""} ${error?.hint ?? ""}`.toLowerCase();
  return message.includes("listing_intent") || message.includes("request_window");
}

function getListingIntentSchemaMessage() {
  return "Your database listing request fields are out of date. Run the latest ISMACONNECT listing-request migration in Supabase, then try posting again.";
}

function isListingPriceTypeSchemaError(error: {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
}) {
  const message = `${error?.message ?? ""} ${error?.details ?? ""} ${error?.hint ?? ""}`.toLowerCase();
  return message.includes("price_type");
}

function getListingPriceTypeSchemaMessage() {
  return "Your database pricing fields are out of date. Run the latest ISMACONNECT listing price-type migration in Supabase, then try posting again.";
}

function isListingGeocodingSchemaError(error: {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
}) {
  const message = `${error?.message ?? ""} ${error?.details ?? ""} ${error?.hint ?? ""}`.toLowerCase();
  return message.includes("geocoded_lat") || message.includes("geocoded_lng") || message.includes("geocoded_area");
}

function getListingGeocodingSchemaMessage() {
  return "Your database geocoding fields are out of date. Run the latest ISMACONNECT geocoding migration in Supabase, then try posting again.";
}

function getListingMutationErrorMessage(error: {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
}) {
  if (isSubcategoryConstraintError(error)) {
    return getSubcategoryConstraintMessage();
  }

  if (isAddressVisibilitySchemaError(error)) {
    return getAddressVisibilitySchemaMessage();
  }

  if (isListingIntentSchemaError(error)) {
    return getListingIntentSchemaMessage();
  }

  if (isListingPriceTypeSchemaError(error)) {
    return getListingPriceTypeSchemaMessage();
  }

  if (isListingGeocodingSchemaError(error)) {
    return getListingGeocodingSchemaMessage();
  }

  return error.message ?? "Could not save the listing.";
}

function parseImageUrls(formData: FormData) {
  const raw = formData.get("imageUrls");

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(String(raw));
    if (!Array.isArray(parsed)) {
      return [];
    }

    return Array.from(
      new Set(parsed.filter((item) => typeof item === "string" && item.trim().length > 0))
    ).slice(0, 8);
  } catch {
    return [];
  }
}

async function generateUniqueSlug(title: string) {
  const supabase = await createServerSupabaseClient();
  const baseSlug = slugify(title) || "listing";
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const { data } = await supabase
      .from("listings")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!data) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

async function loadListingForMutation(listingId: string) {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("listings")
    .select(
      "id, owner_id, slug, category, status, location, geocoded_lat, geocoded_lng, geocoded_area, geocoded_formatted_address, geocoded_at"
    )
    .eq("id", listingId)
    .single();

  return data;
}

function parseListingIntent(formData: FormData): ListingIntent {
  return formData.get("listingIntent") === "need" ? "need" : "offer";
}

function getCreateListingReturnPath(intent: ListingIntent) {
  return intent === "need" ? "/dashboard/listings/new?intent=need" : "/dashboard/listings/new";
}

function getPersistedListingGeocode(
  existing:
    | {
        location?: string | null;
        geocoded_lat?: number | null;
        geocoded_lng?: number | null;
        geocoded_area?: string | null;
        geocoded_formatted_address?: string | null;
      }
    | null
) {
  if (
    existing &&
    typeof existing.geocoded_lat === "number" &&
    typeof existing.geocoded_lng === "number"
  ) {
    return {
      lat: existing.geocoded_lat,
      lng: existing.geocoded_lng,
      area: existing.geocoded_area ?? null,
      formattedAddress: existing.geocoded_formatted_address ?? null
    };
  }

  return null;
}

export async function createListingAction(formData: FormData) {
  const viewer = await requireViewer();
  const listingIntent = parseListingIntent(formData);
  const returnPath = getCreateListingReturnPath(listingIntent);

  const parsed = listingSchema.safeParse({
    listingIntent: formData.get("listingIntent"),
    requestWindow: formData.get("requestWindow"),
    category: formData.get("category"),
    subcategory: formData.get("subcategory"),
    title: formData.get("title"),
    description: formData.get("description"),
    price: formData.get("price"),
    priceType: formData.get("priceType"),
    location: formData.get("location"),
    showExactAddressOnMap: formData.get("show_exact_address_on_map"),
    contactName: formData.get("contactName"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
    imageUrl: formData.get("imageUrl")
  });

  if (!parsed.success) {
    redirectWithMessage(returnPath, "error", firstMessage(parsed.error));
  }

  const dataInput = parsed.data;
  const normalizedSubcategory = normalizeSubcategory(dataInput.category, dataInput.subcategory);
  const imageUrls = parseImageUrls(formData);
  const structuredDataResult = parseStructuredListingData(dataInput.category, formData);

  if (!structuredDataResult.success) {
    redirectWithMessage(returnPath, "error", firstMessage(structuredDataResult.error));
  }

  const supabase = await createServerSupabaseClient();
  const slug = await generateUniqueSlug(dataInput.title);
  const geocodedLocation = await geocodeMarketplaceAddress(dataInput.location, {
    category: dataInput.category
  });

  const { data, error } = await supabase
    .from("listings")
    .insert({
      owner_id: viewer.user.id,
      slug,
      category: dataInput.category,
      listing_intent: dataInput.listingIntent,
      request_window: dataInput.requestWindow,
      subcategory: normalizedSubcategory,
      title: dataInput.title,
      description: dataInput.description,
      price: dataInput.price,
      price_type: dataInput.priceType,
      location: dataInput.location,
      show_exact_address_on_map: dataInput.showExactAddressOnMap,
      geocoded_lat: geocodedLocation?.lat ?? null,
      geocoded_lng: geocodedLocation?.lng ?? null,
      geocoded_area: geocodedLocation?.area ?? null,
      geocoded_formatted_address: geocodedLocation?.formattedAddress ?? null,
      geocoded_at: geocodedLocation ? new Date().toISOString() : null,
      contact_name: dataInput.contactName,
      contact_email: dataInput.contactEmail,
      contact_phone: dataInput.contactPhone,
      image_url: imageUrls[0] || dataInput.imageUrl,
      image_urls: imageUrls,
      structured_data: structuredDataResult.data
    })
    .select("slug, category")
    .single();

  if (error || !data) {
    redirectWithMessage(
      returnPath,
      "error",
      error ? getListingMutationErrorMessage(error) : "Could not create the listing."
    );
  }

  revalidatePath("/");
  revalidatePath("/browse");
  revalidatePath("/dashboard");
  revalidatePath(`/categories/${data.category}`);
  revalidatePath(`/listings/${data.slug}`);
  revalidatePath(`/sellers/${viewer.user.id}`);

  redirectWithMessage("/dashboard", "success", "Listing published successfully.");
}

export async function updateListingAction(listingId: string, formData: FormData) {
  const viewer = await requireViewer();
  const existing = await loadListingForMutation(listingId);

  if (!existing || (existing.owner_id !== viewer.user.id && viewer.profile.role !== "admin")) {
    redirectWithMessage("/dashboard", "error", "You do not have access to edit this listing.");
  }

  const parsed = listingSchema.safeParse({
    listingIntent: formData.get("listingIntent"),
    requestWindow: formData.get("requestWindow"),
    category: formData.get("category"),
    subcategory: formData.get("subcategory"),
    title: formData.get("title"),
    description: formData.get("description"),
    price: formData.get("price"),
    priceType: formData.get("priceType"),
    location: formData.get("location"),
    showExactAddressOnMap: formData.get("show_exact_address_on_map"),
    contactName: formData.get("contactName"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
    imageUrl: formData.get("imageUrl")
  });

  if (!parsed.success) {
    redirectWithMessage(
      `/dashboard/listings/${listingId}/edit`,
      "error",
      firstMessage(parsed.error)
    );
  }

  const dataInput = parsed.data;
  const normalizedSubcategory = normalizeSubcategory(dataInput.category, dataInput.subcategory);
  const imageUrls = parseImageUrls(formData);
  const structuredDataResult = parseStructuredListingData(dataInput.category, formData);

  if (!structuredDataResult.success) {
    redirectWithMessage(
      `/dashboard/listings/${listingId}/edit`,
      "error",
      firstMessage(structuredDataResult.error)
    );
  }

  const supabase = await createServerSupabaseClient();
  const existingGeocode = getPersistedListingGeocode(existing);
  const geocodedLocation =
    existing.location === dataInput.location && existingGeocode
      ? existingGeocode
      : await geocodeMarketplaceAddress(dataInput.location, {
          category: dataInput.category
        });

  const { error, data } = await supabase
    .from("listings")
    .update({
      category: dataInput.category,
      listing_intent: dataInput.listingIntent,
      request_window: dataInput.requestWindow,
      subcategory: normalizedSubcategory,
      title: dataInput.title,
      description: dataInput.description,
      price: dataInput.price,
      price_type: dataInput.priceType,
      location: dataInput.location,
      show_exact_address_on_map: dataInput.showExactAddressOnMap,
      geocoded_lat: geocodedLocation?.lat ?? null,
      geocoded_lng: geocodedLocation?.lng ?? null,
      geocoded_area: geocodedLocation?.area ?? null,
      geocoded_formatted_address: geocodedLocation?.formattedAddress ?? null,
      geocoded_at: geocodedLocation ? new Date().toISOString() : null,
      contact_name: dataInput.contactName,
      contact_email: dataInput.contactEmail,
      contact_phone: dataInput.contactPhone,
      image_url: imageUrls[0] || dataInput.imageUrl,
      image_urls: imageUrls,
      structured_data: structuredDataResult.data
    })
    .eq("id", listingId)
    .select("slug, category")
    .single();

  if (error || !data) {
    redirectWithMessage(
      `/dashboard/listings/${listingId}/edit`,
      "error",
      error ? getListingMutationErrorMessage(error) : "Could not update the listing."
    );
  }

  revalidatePath("/");
  revalidatePath("/browse");
  revalidatePath("/dashboard");
  revalidatePath(`/categories/${existing.category}`);
  revalidatePath(`/categories/${data.category}`);
  revalidatePath(`/listings/${existing.slug}`);
  revalidatePath(`/listings/${data.slug}`);
  revalidatePath(`/sellers/${existing.owner_id}`);

  redirectWithMessage("/dashboard", "success", "Listing updated successfully.");
}

export async function deleteListingAction(listingId: string) {
  const viewer = await requireViewer();
  const existing = await loadListingForMutation(listingId);

  if (!existing || (existing.owner_id !== viewer.user.id && viewer.profile.role !== "admin")) {
    redirectWithMessage("/dashboard", "error", "You do not have access to delete this listing.");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("listings").delete().eq("id", listingId);

  if (error) {
    redirectWithMessage("/dashboard", "error", error.message);
  }

  revalidatePath("/");
  revalidatePath("/browse");
  revalidatePath("/dashboard");
  revalidatePath(`/categories/${existing.category}`);
  revalidatePath(`/listings/${existing.slug}`);
  revalidatePath(`/sellers/${existing.owner_id}`);

  redirectWithMessage("/dashboard", "success", "Listing deleted successfully.");
}

export async function flagListingAction(listingId: string, formData: FormData) {
  const viewer = await requireViewer();
  const existing = await loadListingForMutation(listingId);

  if (!existing) {
    redirectWithMessage("/browse", "error", "That listing no longer exists.");
  }

  if (existing.owner_id === viewer.user.id) {
    redirectWithMessage(`/listings/${existing.slug}`, "error", "You cannot flag your own listing.");
  }

  const parsed = flagListingSchema.safeParse({
    reason: formData.get("reason")
  });

  if (!parsed.success) {
    redirectWithMessage(`/listings/${existing.slug}`, "error", firstMessage(parsed.error));
  }

  const dataInput = parsed.data;
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from("listing_flags").insert({
    listing_id: listingId,
    reporter_id: viewer.user.id,
    reason: dataInput.reason
  });

  if (error) {
    const duplicateMessage =
      error.code === "23505"
        ? "You have already flagged this listing."
        : error.message || "Could not submit the flag.";

    redirectWithMessage(`/listings/${existing.slug}`, "error", duplicateMessage);
  }

  revalidatePath(`/listings/${existing.slug}`);
  revalidatePath("/admin/moderation");

  redirectWithMessage(
    `/listings/${existing.slug}`,
    "success",
    "Thanks. The listing has been flagged for review."
  );
}

export async function reviewFlaggedListingAction(
  listingId: string,
  decision: "restore" | "remove"
) {
  await requireAdminViewer();
  const existing = await loadListingForMutation(listingId);

  if (!existing) {
    redirectWithMessage("/admin/moderation", "error", "That listing could not be found.");
  }

  const supabase = await createServerSupabaseClient();
  const nextStatus = decision === "restore" ? "active" : "removed";

  const updates =
    decision === "restore"
      ? { status: nextStatus }
      : { status: nextStatus, is_featured: false, featured_until: null };

  const { error } = await supabase.from("listings").update(updates).eq("id", listingId);

  if (error) {
    redirectWithMessage("/admin/moderation", "error", error.message);
  }

  revalidatePath("/");
  revalidatePath("/browse");
  revalidatePath("/dashboard");
  revalidatePath("/admin/moderation");
  revalidatePath(`/categories/${existing.category}`);
  revalidatePath(`/listings/${existing.slug}`);
  revalidatePath(`/sellers/${existing.owner_id}`);

  redirectWithMessage(
    "/admin/moderation",
    "success",
    decision === "restore" ? "Listing restored to active." : "Listing removed from public view."
  );
}
