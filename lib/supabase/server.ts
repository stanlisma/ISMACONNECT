import { cookies, headers } from "next/headers";

import { createServerClient } from "@supabase/ssr";

import { getSupabaseCookieOptions, getSupabaseEnv } from "@/lib/env";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  const requestHost = headerStore.get("x-forwarded-host") || headerStore.get("host");

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: getSupabaseCookieOptions(requestHost),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server components can't always mutate cookies. Middleware handles refresh.
        }
      }
    }
  });
}

