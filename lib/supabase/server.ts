import { cookies, headers } from "next/headers";

import { createServerClient } from "@supabase/ssr";

import { getSupabaseCookieOptions, getSupabaseEnv } from "@/lib/env";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  const requestHost = headerStore.get("x-forwarded-host") || headerStore.get("host");
  const cookieOptions = getSupabaseCookieOptions(requestHost);

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, {
              ...options,
              ...cookieOptions
            });
          });
        } catch {
          // Server components can't always mutate cookies. Middleware handles refresh.
        }
      }
    }
  });
}

