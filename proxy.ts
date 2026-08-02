import { NextResponse, type NextRequest } from "next/server";

import { extractListingSlug, isListingSlugGone } from "@/lib/gone-listing";
import { buildContentSecurityPolicy } from "@/lib/security-headers";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const nonce = crypto.randomUUID();
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce);

  // Visible to Server Components via headers() so they can nonce their
  // own inline <script> tags with the same value used below.
  request.headers.set("x-nonce", nonce);

  const listingSlug = extractListingSlug(request.nextUrl.pathname);

  if (listingSlug && (await isListingSlugGone(listingSlug))) {
    const goneUrl = new URL("/listing-unavailable", request.url);
    goneUrl.searchParams.set("slug", listingSlug);

    const goneResponse = NextResponse.rewrite(goneUrl, { status: 404 });
    goneResponse.headers.set("Content-Security-Policy", contentSecurityPolicy);
    return goneResponse;
  }

  const response = await updateSession(request);
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
