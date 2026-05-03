"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireViewer } from "@/lib/auth";
import {
  buildSavedSearchSignature,
  hasMeaningfulSavedSearchCriteria,
  normalizeSavedSearchFilters
} from "@/lib/saved-searches";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : null;
}

function getRevalidationPaths(path: string) {
  return Array.from(
    new Set([
      path,
      "/account",
      "/dashboard/searches",
      "/notifications"
    ])
  );
}

export async function toggleSavedSearchAction(formData: FormData) {
  const viewer = await requireViewer();
  const supabase = await createServerSupabaseClient();

  const returnTo = getFormValue(formData, "returnTo") || "/browse";
  const filters = normalizeSavedSearchFilters({
    path: getFormValue(formData, "path") || "/browse",
    search: getFormValue(formData, "search"),
    category: getFormValue(formData, "category"),
    subcategory: getFormValue(formData, "subcategory"),
    minPrice: getFormValue(formData, "minPrice"),
    maxPrice: getFormValue(formData, "maxPrice"),
    sort: getFormValue(formData, "sort")
  });

  if (!hasMeaningfulSavedSearchCriteria(filters)) {
    redirect(returnTo);
  }

  const signature = buildSavedSearchSignature(filters);

  const { data: existing } = await supabase
    .from("saved_searches")
    .select("id")
    .eq("user_id", viewer.user.id)
    .eq("signature", signature)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("saved_searches")
      .delete()
      .eq("id", existing.id)
      .eq("user_id", viewer.user.id);
  } else {
    await supabase.from("saved_searches").insert({
      user_id: viewer.user.id,
      path: filters.path,
      search_query: filters.search,
      category: filters.category,
      subcategory: filters.subcategory,
      min_price: filters.minPrice,
      max_price: filters.maxPrice,
      sort: filters.sort,
      signature,
      last_checked_at: new Date().toISOString()
    });
  }

  getRevalidationPaths(filters.path).forEach((path) => {
    revalidatePath(path);
  });

  redirect(returnTo);
}

export async function deleteSavedSearchAction(savedSearchId: string) {
  const viewer = await requireViewer();
  const supabase = await createServerSupabaseClient();

  await supabase
    .from("saved_searches")
    .delete()
    .eq("id", savedSearchId)
    .eq("user_id", viewer.user.id);

  revalidatePath("/account");
  revalidatePath("/dashboard/searches");
  revalidatePath("/notifications");

  redirect("/dashboard/searches");
}

export async function openSavedSearchAction(savedSearchId: string, href: string) {
  const viewer = await requireViewer();
  const supabase = await createServerSupabaseClient();

  await supabase
    .from("saved_searches")
    .update({ last_checked_at: new Date().toISOString() })
    .eq("id", savedSearchId)
    .eq("user_id", viewer.user.id);

  revalidatePath("/account");
  revalidatePath("/dashboard/searches");
  revalidatePath("/notifications");

  redirect(href);
}
