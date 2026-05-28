import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseCookieOptions, getSupabaseEnv, isSupabaseConfigured } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({
    request
  });

  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: getSupabaseCookieOptions(request.nextUrl.hostname),
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        response = NextResponse.next({
          request
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  await supabase.auth.getUser();

  const cookieOptions = getSupabaseCookieOptions(request.nextUrl.hostname);
  const isSupabaseAuthCookie = (name: string) =>
    name.startsWith("sb-") && name.includes("-auth-token");

  const responseAuthCookies = response.cookies.getAll().filter((cookie) =>
    isSupabaseAuthCookie(cookie.name)
  );
  const requestAuthCookies =
    responseAuthCookies.length > 0
      ? responseAuthCookies
      : request.cookies.getAll().filter((cookie) => isSupabaseAuthCookie(cookie.name));

  if (cookieOptions.domain && requestAuthCookies.length > 0) {
    requestAuthCookies.forEach(({ name, value }) => {
      response.cookies.set(name, value, cookieOptions);
    });
  }

  return response;
}
