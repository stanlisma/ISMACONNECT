import { NextResponse } from "next/server";

import { requireViewer } from "@/lib/auth";
import { isWebPushConfigured } from "@/lib/env";
import { sendPushToUser } from "@/lib/push";

export async function POST() {
  const viewer = await requireViewer();

  if (!isWebPushConfigured()) {
    return NextResponse.json(
      { error: "Web push is not configured on the server yet." },
      { status: 503 }
    );
  }

  const result = await sendPushToUser(viewer.user.id, {
    title: "ISMACONNECT test alert",
    body: "Push notifications are working on this device.",
    url: "/notifications",
    tag: `push-test-${viewer.user.id}`
  });

  if (result.total === 0) {
    return NextResponse.json(
      { error: "No active push subscription is connected for this account on this device yet." },
      { status: 409 }
    );
  }

  if (result.delivered === 0) {
    return NextResponse.json(
      {
        error:
          result.lastFailureReason ??
          "The push alert could not be delivered to this device."
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    delivered: result.delivered,
    failed: result.failed,
    staleRemoved: result.staleRemoved
  });
}
