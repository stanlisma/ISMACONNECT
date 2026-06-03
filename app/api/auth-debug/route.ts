import { NextResponse } from "next/server";

import { getServerAuthDiagnostics } from "@/lib/auth-debug";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const diagnostics = await getServerAuthDiagnostics();

  return NextResponse.json(diagnostics, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate"
    }
  });
}
