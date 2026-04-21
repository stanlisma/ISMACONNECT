"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminViewer, requireViewer } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { flagListingSchema, listingSchema } from "@/lib/validation/listing";
import { firstMessage, slugify } from "@/lib/utils";

function redirectWithMessage(path: string, key: "error" | "success", message: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
}

async function generateUniqueSlug(title: string) {
  const supabase = await createServerSupabaseClient();
  const baseSlug = slugify(title) || "listing";
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const { data } = await supabase.from("listings").select("id").eq("slug", candidate).maybeSingle();

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
    .select("id, owner_id, slug, category, status")
    .eq("id", listingId)
    .single();

  return data;
}

export async function createListingAction(formData: FormData) {
  const viewer = await requireViewer();

  const parsed = listingSchema.safeParse({
    category: formData.get("category"),
    title: formData.get("title"),
    description: formData.get("description"),
    price: formData.get("price"),
    location: formData.get("location"),
    contactName: formData.get("contactName"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
    imageUrl: formData.get("imageUrl")
  });

  if (!parsed.success) {
    redirectWithMessage("/dashboard/listings/new", "error", firstMessage(parsed.error));
  }

  const dataInput = parsed.data;
  const supabase = await createServerSupabaseClient();
  const slug = await generateUniqueSlug(dataInput.title);

  const { data, error } = await supabase
    .from("listings")
    .insert({
      owner_id: viewer.user.id,
      slug,
      category: dataInput.category,
      title: dataInput.title,
      description: dataInput.description,
      price: dataInput.price,
      location: dataInput.location,
      contact_name: dataInput.contactName,
      contact_email: dataInput.contactEmail,
      contact_phone: dataInput.contactPhone,
      image_url: dataInput.imageUrl
    })
    .select("slug, category")
    .single();

  if (error || !data) {
    redirectWithMessage(
      "/dashboard/listings/new",
      "error",
      error?.message || "Could not create the listing."
    );
  }

  revalidatePath("/");
  revalidatePath("/browse");
  revalidatePath("/dashboard");
  revalidatePath(`/categories/${data.category}`);
  revalidatePath(`/listings/${data.slug}`);

  redirectWithMessage("/dashboard", "success", "Listing published successfully.");
}

export async function updateListingAction(listingId: string, formData: FormData) {
  const viewer = await requireViewer();
  const existing = await loadListingForMutation(listingId);

  if (!existing || (existing.owner_id !== viewer.user.id && viewer.profile.role !== "admin")) {
    redirectWithMessage("/dashboard", "error", "You do not have access to edit this listing.");
  }

  const parsed = listingSchema.safeParse({
    category: formData.get("category"),
    title: formData.get("title"),
    description: formData.get("description"),
    price: formData.get("price"),
    location: formData.get("location"),
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
  const supabase = await createServerSupabaseClient();

  const { error, data } = await supabase
    .from("listings")
    .update({
      category: dataInput.category,
      title: dataInput.title,
      description: dataInput.description,
      price: dataInput.price,
      location: dataInput.location,
      contact_name: dataInput.contactName,
      contact_email: dataInput.contactEmail,
      contact_phone: dataInput.contactPhone,
      image_url: dataInput.imageUrl
    })
    .eq("id", listingId)
    .select("slug, category")
    .single();

  if (error || !data) {
    redirectWithMessage(
      `/dashboard/listings/${listingId}/edit`,
      "error",
      error?.message || "Could not update the listing."
    );
  }

  revalidatePath("/");
  revalidatePath("/browse");
  revalidatePath("/dashboard");
  revalidatePath(`/categories/${existing.category}`);
  revalidatePath(`/categories/${data.category}`);
  revalidatePath(`/listings/${existing.slug}`);
  revalidatePath(`/listings/${data.slug}`);

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

  redirectWithMessage(
    "/admin/moderation",
    "success",
    decision === "restore" ? "Listing restored to active." : "Listing removed from public view."
  );
}
