import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getCategoriesWithSubcategories() {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("listings")
    .select("category, subcategory")
    .eq("status", "active")
    .not("subcategory", "is", null);

  const map: Record<string, Set<string>> = {};

  data?.forEach((item) => {
    if (!item.category || !item.subcategory) return;

    if (!map[item.category]) {
      map[item.category] = new Set();
    }

    map[item.category].add(item.subcategory);
  });

  const result: Record<string, string[]> = {};

  Object.keys(map).forEach((key) => {
    result[key] = Array.from(map[key]).sort();
  });

  return result;
}