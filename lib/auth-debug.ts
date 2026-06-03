import { cookies, headers } from "next/headers";

import { getBaseUrl, getCanonicalAppHostname, getSupabaseCookieOptions, isSupabaseConfigured } from "@/lib/env";
import { getViewer } from "@/lib/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type AuthCookieSummary = {
  name: string;
  valueLength: number;
};

type AuthUserSummary = {
  id: string;
  email: string | null;
};

type AuthProfileSummary = {
  id: string;
  email: string | null;
  fullName: string | null;
  role: string;
};

export type ServerAuthDiagnostics = {
  timestamp: string;
  request: {
    host: string | null;
    forwardedHost: string | null;
    forwardedProto: string | null;
    canonicalAppHost: string | null;
    baseUrl: string;
  };
  expectedCookieOptions: ReturnType<typeof getSupabaseCookieOptions>;
  cookies: {
    totalCount: number;
    names: string[];
    authCookies: AuthCookieSummary[];
  };
  supabaseConfigured: boolean;
  auth: {
    user: AuthUserSummary | null;
    userError: string | null;
    sessionUserId: string | null;
    sessionExpiresAt: number | null;
    sessionError: string | null;
  } | null;
  profile: {
    visibleToSession: AuthProfileSummary | null;
    sessionProfileError: string | null;
    visibleToServiceRole: boolean | null;
    serviceRoleProfileError: string | null;
  } | null;
  viewer: {
    userId: string;
    profileId: string;
    profileRole: string;
  } | null;
};

function summarizeUser(user?: {
  id: string;
  email?: string | null;
} | null): AuthUserSummary | null {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null
  };
}

export async function getServerAuthDiagnostics(): Promise<ServerAuthDiagnostics> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const host = headerStore.get("host");
  const forwardedHost = headerStore.get("x-forwarded-host");
  const forwardedProto = headerStore.get("x-forwarded-proto");
  const requestHost = forwardedHost || host;
  const cookieOptions = getSupabaseCookieOptions(requestHost);
  const allCookies = cookieStore.getAll();
  const authCookies = allCookies
    .filter((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token"))
    .map((cookie) => ({
      name: cookie.name,
      valueLength: cookie.value.length
    }));

  const diagnostics: ServerAuthDiagnostics = {
    timestamp: new Date().toISOString(),
    request: {
      host,
      forwardedHost,
      forwardedProto,
      canonicalAppHost: getCanonicalAppHostname(),
      baseUrl: getBaseUrl()
    },
    expectedCookieOptions: cookieOptions,
    cookies: {
      totalCount: allCookies.length,
      names: allCookies.map((cookie) => cookie.name),
      authCookies
    },
    supabaseConfigured: isSupabaseConfigured(),
    auth: null,
    profile: null,
    viewer: null
  };

  if (!isSupabaseConfigured()) {
    return diagnostics;
  }

  const supabase = await createServerSupabaseClient();
  const [
    { data: userData, error: userError },
    { data: sessionData, error: sessionError }
  ] = await Promise.all([supabase.auth.getUser(), supabase.auth.getSession()]);

  diagnostics.auth = {
    user: summarizeUser(userData.user),
    userError: userError?.message ?? null,
    sessionUserId: sessionData.session?.user?.id ?? null,
    sessionExpiresAt: sessionData.session?.expires_at ?? null,
    sessionError: sessionError?.message ?? null
  };

  if (!userData.user) {
    return diagnostics;
  }

  const { data: sessionProfile, error: sessionProfileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", userData.user.id)
    .maybeSingle();

  let serviceRoleProfileExists: boolean | null = null;
  let serviceRoleProfileError: string | null = null;

  try {
    const serviceRole = createServiceRoleSupabaseClient();
    const { data: serviceRoleProfile, error } = await serviceRole
      .from("profiles")
      .select("id")
      .eq("id", userData.user.id)
      .maybeSingle();

    serviceRoleProfileExists = Boolean(serviceRoleProfile);
    serviceRoleProfileError = error?.message ?? null;
  } catch (error) {
    serviceRoleProfileError = error instanceof Error ? error.message : "Unknown service-role error";
  }

  diagnostics.profile = {
    visibleToSession: sessionProfile
      ? {
          id: sessionProfile.id,
          email: sessionProfile.email,
          fullName: sessionProfile.full_name,
          role: sessionProfile.role
        }
      : null,
    sessionProfileError: sessionProfileError?.message ?? null,
    visibleToServiceRole: serviceRoleProfileExists,
    serviceRoleProfileError
  };

  const viewer = await getViewer();

  diagnostics.viewer = viewer
    ? {
        userId: viewer.user.id,
        profileId: viewer.profile.id,
        profileRole: viewer.profile.role
      }
    : null;

  return diagnostics;
}
