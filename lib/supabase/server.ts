import { cookies, headers } from "next/headers";

import { createServerClient } from "@supabase/ssr";

import { getSupabaseCookieOptions, getSupabaseEnv } from "@/lib/env";

function dedupeCookiesByName<T extends { name: string }>(cookieList: T[]) {
  const cookiesByName = new Map<string, T>();

  cookieList.forEach((cookie) => {
    const existing = cookiesByName.get(cookie.name);

    if (!existing) {
      cookiesByName.set(cookie.name, cookie);
      return;
    }

    const existingLength = String((existing as T & { value?: unknown }).value ?? "").length;
    const nextLength = String((cookie as T & { value?: unknown }).value ?? "").length;

    if (nextLength >= existingLength) {
      cookiesByName.set(cookie.name, cookie);
    }
  });

  return Array.from(cookiesByName.values());
}

async function getServerSupabaseCookieConfig(mutable: boolean) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const requestHost = headerStore.get("x-forwarded-host") || headerStore.get("host");
  const cookieOptions = getSupabaseCookieOptions(requestHost);

  return {
    cookieOptions,
    cookies: {
      getAll() {
        return dedupeCookiesByName(cookieStore.getAll());
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        if (!mutable) {
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

          return;
        }

        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, {
            ...options,
            ...cookieOptions
          });
        });
      }
    }
  };
}

export async function createServerSupabaseClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  const config = await getServerSupabaseCookieConfig(false);

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: config.cookieOptions,
    cookies: config.cookies
  });
}

export async function createMutableServerSupabaseClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  const config = await getServerSupabaseCookieConfig(true);

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: config.cookieOptions,
    cookies: config.cookies
  });
}

