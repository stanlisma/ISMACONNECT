import { unstable_cache } from "next/cache";

import { HIDE_WHEN_EMPTY_CATEGORIES } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import type { ListingCategory } from "@/types/database";

// Which of HIDE_WHEN_EMPTY_CATEGORIES currently have no active listing. Cached
// for five minutes: it runs in the site layout on every page, and a category
// reappearing a few minutes after its first listing is fine. Any failure
// returns [] so a database hiccup never hides a category.
export const getHiddenCategoryValues = unstable_cache(
  async (): Promise<ListingCategory[]> => {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const supabase = createPublicSupabaseClient();
    const hidden: ListingCategory[] = [];

    for (const category of HIDE_WHEN_EMPTY_CATEGORIES) {
      const { count, error } = await supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .eq("category", category);

      if (!error && (count ?? 0) === 0) {
        hidden.push(category);
      }
    }

    return hidden;
  },
  ["hidden-category-values"],
  { revalidate: 300 }
);
