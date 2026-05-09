import { NextResponse } from "next/server";
import { z } from "zod";

import { isSupabaseServiceRoleConfigured } from "@/lib/env";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";

const metadataValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

const clientErrorSchema = z.object({
  source: z.string().trim().min(1).max(80),
  message: z.string().trim().min(1).max(2000),
  name: z.string().trim().max(255).nullable().optional(),
  stack: z.string().trim().max(20000).nullable().optional(),
  pathname: z.string().trim().max(2048).nullable().optional(),
  userAgent: z.string().trim().max(1024).nullable().optional(),
  userId: z.string().uuid().nullable().optional(),
  metadata: z.record(z.string(), metadataValueSchema).optional().default({})
});

export async function POST(request: Request) {
  try {
    const payload = clientErrorSchema.parse(await request.json());

    if (!isSupabaseServiceRoleConfigured()) {
      console.error("Client error captured without service role logging:", payload);
      return NextResponse.json({ ok: true, stored: false });
    }

    const supabase = createServiceRoleSupabaseClient();
    const { error } = await supabase.from("app_error_logs").insert({
      user_id: payload.userId ?? null,
      source: payload.source,
      message: payload.message,
      name: payload.name ?? null,
      stack: payload.stack ?? null,
      pathname: payload.pathname ?? null,
      user_agent: payload.userAgent ?? null,
      metadata: payload.metadata
    });

    if (error) {
      console.error("Could not store client error log:", error, payload);
      return NextResponse.json({ ok: true, stored: false });
    }

    return NextResponse.json({ ok: true, stored: true });
  } catch (error) {
    console.error("Invalid client error payload:", error);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
