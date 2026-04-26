import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

const VISITOR_COOKIE = "ismaconnect_visitor_id";

export async function POST(request: Request) {
  const { listingId } = await request.json();

  if (!listingId) {
    return NextResponse.json({ error: "Missing listingId" }, { status: 400 });
  }

  const cookieStore = await cookies();
  let visitorId = cookieStore.get(VISITOR_COOKIE)?.value;

  const response = NextResponse.json({ ok: true });

  if (!visitorId) {
    visitorId = crypto.randomUUID();

    response.cookies.set(VISITOR_COOKIE, visitorId, {
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