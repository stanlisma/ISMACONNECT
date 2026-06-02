import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseCookieOptions, getSupabaseEnv, isSupabaseConfigured } from "@/lib/env";

function dedupeCookiesByName<T extends { name: string }>(cookieList: T[]) {
  const cookiesByName = new Map<string, T>();

  cookieList.forEach((cookie) => {
    cookiesByName.set(cookie.name, cookie);
  });

  return Array.from(cookiesByName.values());
}

function appendHostOnlyCookieDeletion(response: NextResponse, name: string, secure: boolean) {
  response.headers.append(
    "Set-Cookie",
    `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${
      secure ? "; Secure" : ""
    }`
  );
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

  const isSupabaseAuthCookie = (name: string) =>
    name.startsWith("sb-") && name.includes("-auth-token");

  const responseAuthCookies = dedupeCookiesByName(
    response.cookies.getAll().filter((cookie) => isSupabaseAuthCookie(cookie.name))
  );
  const requestAuthCookies =
    responseAuthCookies.length > 0
      ? responseAuthCookies
      : dedupeCookiesByName(
          request.cookies.getAll().filter((cookie) => isSupabaseAuthCookie(cookie.name))
        );

  if (cookieOptions.domain && requestAuthCookies.length > 0) {
    requestAuthCookies.forEach(({ name, value }) => {
      appendHostOnlyCookieDeletion(response, name, cookieOptions.secure);
      response.cookies.set(name, value, cookieOptions);
    });
  }

  return response;
}
