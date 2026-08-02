import { createClient } from "@supabase/supabase-js";

import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/env";

const LISTING_SLUG_PATTERN = /^\/listings\/([^/]+)\/?$/;

export function extractListingSlug(pathname: string): string | null {
  const match = LISTING_SLUG_PATTERN.exec(pathname);
  return match ? decodeURIComponent(match[1]) : null;
}

// Next.js App Router streams dynamic routes, so by the time a page component
// calls notFound() the 200 status header has already been flushed - this is
// a long-standing framework limitation (vercel/next.js#76474), not something
// fixable from inside the page. Checking existence here in the proxy, before
// any rendering starts, is the only reliable way to send a real 404/410 for
// listing URLs that no longer resolve to an active listing.
export async function isListingSlugGone(slug: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });

    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from("listings")
      .select("id")
      .eq("slug", slug)
      .eq("status", "active")
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .maybeSingle();

    if (error) {
      // Fail open: let the page render normally and decide for itself
      // rather than risk 404ing real listings on a transient query error.
      return false;
    }

    return !data;
  } catch {
    return false;
  }
}
