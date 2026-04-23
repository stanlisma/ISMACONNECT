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
    await supabase
      .from("saved_listings")
      .delete()
      .eq("id", existing.id);
  } else {
    await supabase.from("saved_listings").insert({
      user_id: viewer.user.id,
      listing_id: listingId
    });
  }

  if (pathToRevalidate) {
    revalidatePath(pathToRevalidate);
  }

  revalidatePath("/dashboard/saved");
  revalidatePath("/browse");
}