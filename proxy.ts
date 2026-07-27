import type { NextRequest } from "next/server";

import { buildContentSecurityPolicy } from "@/lib/security-headers";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const nonce = crypto.randomUUID();
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce);

  // Visible to Server Components via headers() so they can nonce their
  // own inline <script> tags with the same value used below.
  request.headers.set("x-nonce", nonce);

  const response = await updateSession(request);
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
