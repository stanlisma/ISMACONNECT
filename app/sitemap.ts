import type { MetadataRoute } from "next";

import { getHiddenCategoryValues } from "@/lib/category-visibility";
import { CATEGORIES } from "@/lib/constants";
import { getBaseUrl, isSupabaseConfigured } from "@/lib/env";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const hiddenCategories = await getHiddenCategoryValues();
  const routes: MetadataRoute.Sitemap = [
    "",
    "/browse",
    "/categories",
    "/businesses",
    "/auth/sign-in",
    "/auth/sign-up",
    "/privacy",
    "/terms",
    "/safety",
    "/contact",
    ...CATEGORIES.filter((category) => !hiddenCategories.includes(category.value)).map((category) => category.href)
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
      .select("slug, owner_id, updated_at")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(500);

    const listingRoutes: MetadataRoute.Sitemap = (data || []).map((listing) => ({
        url: `${baseUrl}/listings/${listing.slug}`,
        lastModified: listing.updated_at,
        changeFrequency: "daily",
        priority: 0.7
      }));

    const sellerRoutes: MetadataRoute.Sitemap = Array.from(
      new Map(
        (data || [])
          .filter((listing) => listing.owner_id)
          .map((listing) => [
            listing.owner_id,
            {
              url: `${baseUrl}/sellers/${listing.owner_id}`,
              lastModified: listing.updated_at,
              changeFrequency: "weekly" as const,
              priority: 0.6
            }
          ])
      ).values()
    );

    return routes.concat(listingRoutes, sellerRoutes);
  } catch {
    return routes;
  }
}
