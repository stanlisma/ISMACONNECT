import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getViewer } from "@/lib/auth";
import { isSupabaseServiceRoleConfigured } from "@/lib/env";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";

// Same opaque cookie the listing-view endpoint uses, so one visitor is one id
// across both. Random UUID, never derived from anything about the person.
const VISITOR_COOKIE = "ismaconnect_visitor_id";
const CRAWLER_USER_AGENT_PATTERN = /bot|crawler|spider|dataprovider|headlesschrome|lighthouse|preview|facebookexternalhit|whatsapp/i;
const IGNORED_PATH_PREFIXES = ["/admin", "/api", "/_next"];

const visitSchema = z.object({
  path: z.string().trim().min(1).max(300),
  source: z.string().trim().max(120).nullable().optional()
});

function normalizePath(rawPath: string) {
  const pathname = rawPath.split("?")[0].split("#")[0];

  if (!pathname.startsWith("/")) {
    return null;
  }

  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

function isMissingTable(error: { code?: string; message?: string }) {
  return error.code === "42P01" || error.code === "PGRST205" || /site_visits/.test(error.message ?? "");
}

export async function POST(request: Request) {
  const done = () => new NextResponse(null, { status: 204 });

  const userAgent = (await headers()).get("user-agent") ?? "";

  if (!userAgent || CRAWLER_USER_AGENT_PATTERN.test(userAgent) || !isSupabaseServiceRoleConfigured()) {
    return done();
  }

  const parsed = visitSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return done();
  }

  const path = normalizePath(parsed.data.path);

  if (!path || IGNORED_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return done();
  }

  // Your own browsing shouldn't count as traffic.
  const viewer = await getViewer();

  if (viewer?.profile.role === "admin") {
    return done();
  }

  const cookieStore = await cookies();
  let visitorKey = cookieStore.get(VISITOR_COOKIE)?.value;
  const response = done();

  if (!visitorKey) {
    visitorKey = crypto.randomUUID();
    response.cookies.set(VISITOR_COOKIE, visitorKey, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365
    });
  }

  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase.from("site_visits").insert({
    visitor_key: visitorKey,
    path,
    referrer_host: parsed.data.source?.toLowerCase() || null,
    is_signed_in: Boolean(viewer)
  });

  // 23505 = this visitor already counted for this page today.
  if (error && error.code !== "23505" && !isMissingTable(error)) {
    console.error("Site visit insert failed:", error);
  }

  return response;
}
