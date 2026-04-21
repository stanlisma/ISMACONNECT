import type { MetadataRoute } from "next";

import { CATEGORIES } from "@/lib/constants";
import { getBaseUrl, isSupabaseConfigured } from "@/lib/env";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const routes: MetadataRoute.Sitemap = [
    "",
    "/browse",
    "/auth/sign-in",
    "/auth/sign-up",
    ...CATEGORIES.map((category) => category.href)
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    changeFrequency: "daily",
    priority: path === "" ? 1 : 0.8
  }));

  if (!isSupabaseConfigured()) {
    return routes;
  }

  try {
    const supabase = createPublicSupabaseClient();
    const { data } = await supabase
      .from("listings")
      .select("slug, updated_at")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(500);

    return routes.concat(
      (data || []).map((listing) => ({
        url: `${baseUrl}/listings/${listing.slug}`,
        lastModified: listing.updated_at,
        changeFrequency: "daily",
        priority: 0.7
      }))
    );
  } catch {
    return routes;
  }
}
