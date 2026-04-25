import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getCategoriesWithSubcategories() {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("listings")
    .select("category, subcategory")
    .not("subcategory", "is", null);

  const map: Record<string, Set<string>> = {};

  data?.forEach((item) => {
    if (!map[item.category]) {
      map[item.category] = new Set();
    }

    if (item.subcategory) {
      map[item.category].add(item.subcategory);
    }
  });

  // convert Set → Array
  const result: Record<string, string[]> = {};

  Object.keys(map).forEach((key) => {
    result[key] = Array.from(map[key]);
  });

  return result;
}