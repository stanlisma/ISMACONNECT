import { NextResponse } from "next/server";

import { requireViewer } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function extractKeys(subscription: any) {
  return {
    p256dh: subscription?.keys?.p256dh,
    auth: subscription?.keys?.auth
  };
}

export async function GET() {
  const viewer = await requireViewer();
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", viewer.user.id);

  return NextResponse.json({
    subscriptions: data ?? []
  });
}

export async function POST(request: Request) {
  const viewer = await requireViewer();
  const supabase = await createServerSupabaseClient();
  const body = await request.json();
  const subscription = body?.subscription;
  const { p256dh, auth } = extractKeys(subscription);

  if (!subscription?.endpoint || !p256dh || !auth) {
    return NextResponse.json(
      { error: "Invalid push subscription payload." },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: viewer.user.id,
      endpoint: subscription.endpoint,
      p256dh,
      auth,
      user_agent: request.headers.get("user-agent")
    },
    {
      onConflict: "endpoint"
    }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const viewer = await requireViewer();
  const supabase = await createServerSupabaseClient();
  const body = await request.json();
  const endpoint = body?.endpoint;

  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint." }, { status: 400 });
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", viewer.user.id)
    .eq("endpoint", endpoint);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
