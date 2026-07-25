"use server";

import { revalidatePath } from "next/cache";

import { requireViewer } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function toggleSavedListingAction(listingId: string, pathToRevalidate?: string) {
  const viewer = await requireViewer();
  const supabase = await createServerSupabaseClient();

  const { data: existing } = await supabase
    .from("saved_listings")
    .select("id")
    .eq("user_id", viewer.user.id)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("saved_listings")
      .delete()
      .eq("id", existing.id);

    if (error) {
      console.error("Failed to remove saved listing:", error);
    }
  } else {
    const { error } = await supabase.from("saved_listings").insert({
      user_id: viewer.user.id,
      listing_id: listingId
    });

    if (error) {
      console.error("Failed to create saved listing:", error);
    }
  }

  if (pathToRevalidate) {
    revalidatePath(pathToRevalidate);
  }

  revalidatePath("/dashboard/saved");
  revalidatePath("/browse");
}