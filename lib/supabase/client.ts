import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseCookieOptions } from "@/lib/env";

export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: getSupabaseCookieOptions(
        typeof window !== "undefined" ? window.location.hostname : null
      )
    }
  );
}
