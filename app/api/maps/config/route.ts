import { NextResponse } from "next/server";

import { getGoogleMapsEnv, isGoogleMapsConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isGoogleMapsConfigured()) {
    return NextResponse.json(
      {
        configured: false,
        apiKey: null,
        mapId: null
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0"
        }
      }
    );
  }

  const { googleMapsApiKey, googleMapsMapId } = getGoogleMapsEnv();

  return NextResponse.json(
    {
      configured: true,
      apiKey: googleMapsApiKey,
      mapId: googleMapsMapId
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0"
      }
    }
  );
}
