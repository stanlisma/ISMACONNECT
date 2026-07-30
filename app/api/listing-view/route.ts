import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

const VISITOR_COOKIE = "ismaconnect_visitor_id";

// A visitor with no cookie previously got a fresh random UUID every request,
// which sails past the (listing_id, visitor_key) unique constraint below -
// clearing cookies (or just not sending one) let anyone inflate a listing's
// view count with unlimited "new" visits. Deriving the dedup key from the
// request IP instead when no cookie is present means repeated cookie-less
// requests from the same origin collide on the same key and get deduped,
// same as a real returning visitor would. This is only ever used as an
// opaque dedup key, never stored or exposed as a raw IP.
async function getFallbackVisitorKey() {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || headerList.get("x-real-ip");

  if (!ip) {
    // No IP available (e.g. local dev off Vercel) - fall back to an
    // unlinkable random id, same as before.
    return crypto.randomUUID();
  }

  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`listing-view-ip:${ip}`));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request: Request) {
  const { listingId } = await request.json();

  if (!listingId) {
    return NextResponse.json({ error: "Missing listingId" }, { status: 400 });
  }

  const cookieStore = await cookies();
  let visitorId = cookieStore.get(VISITOR_COOKIE)?.value;

  const response = NextResponse.json({ ok: true });

  if (!visitorId) {
    visitorId = await getFallbackVisitorKey();

    response.cookies.set(VISITOR_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365
    });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("listing_views").insert({
    listing_id: listingId,
    viewer_id: user?.id ?? null,
    visitor_key: user ? null : visitorId
  });

  if (error) {
    if (error.code === "23505") {
      return response; // already counted
    }

    console.error("Listing view insert failed:", error);
    return NextResponse.json({ error: "View tracking failed" }, { status: 500 });
  }

  await supabase.rpc("increment_listing_views", {
    listing_id_input: listingId
  });

  return response;
}