import { createClient } from "@supabase/supabase-js";

import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/env";

const SELLER_ID_PATTERN = /^\/sellers\/([^/]+)\/?$/;

export function extractSellerId(pathname: string): string | null {
  const match = SELLER_ID_PATTERN.exec(pathname);
  return match ? decodeURIComponent(match[1]) : null;
}

// Mirrors getPublicSellerStorefront's own "nothing to show" rule so the
// proxy's pre-render check and the page's own render agree on what counts
// as gone. Same streaming-status limitation as lib/gone-listing.ts.
export async function isSellerPageGone(sellerId: string, storefrontId: string | null): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });

    if (storefrontId) {
      const { data, error } = await supabase
        .from("business_storefronts")
        .select("id")
        .eq("id", storefrontId)
        .eq("owner_id", sellerId)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        return false;
      }

      return !data;
    }

    const { count, error } = await supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", sellerId)
      .eq("status", "active");

    if (error) {
      return false;
    }

    return !count;
  } catch {
    return false;
  }
}
