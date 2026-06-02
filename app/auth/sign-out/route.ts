import { NextResponse } from "next/server";

import { createMutableServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createMutableServerSupabaseClient();

  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
