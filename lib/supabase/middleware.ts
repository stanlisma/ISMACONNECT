import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseCookieOptions, getSupabaseEnv, isSupabaseConfigured } from "@/lib/env";

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

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  const cookieOptions = getSupabaseCookieOptions(request.nextUrl.hostname);
  let response = NextResponse.next({
    request
  });

  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions,
    cookies: {
      getAll() {
        return dedupeCookiesByName(request.cookies.getAll());
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, {
            ...options,
            ...cookieOptions
          });
        });
      }
    }
  });

  await supabase.auth.getUser();

  return response;
}
