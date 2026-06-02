import { cookies, headers } from "next/headers";

import { createServerClient } from "@supabase/ssr";

import { getSupabaseCookieOptions, getSupabaseEnv } from "@/lib/env";

function dedupeCookiesByName<T extends { name: string }>(cookieList: T[]) {
  const cookiesByName = new Map<string, T>();

  cookieList.forEach((cookie) => {
    cookiesByName.set(cookie.name, cookie);
  });

  return Array.from(cookiesByName.values());
}

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
        return dedupeCookiesByName(cookieStore.getAll());
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

