import { NextResponse } from "next/server";

import { requireViewer } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push";

export async function POST() {
  const viewer = await requireViewer();

  await sendPushToUser(viewer.user.id, {
    title: "ISMACONNECT test alert",
    body: "Push notifications are working on this device.",
    url: "/notifications",
    tag: `push-test-${viewer.user.id}`
  });

  return NextResponse.json({ ok: true });
}
