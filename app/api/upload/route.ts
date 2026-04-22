import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/auth";

export async function POST(request: Request) {
  await requireViewer();

  const supabase = await createServerSupabaseClient();
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
  }

  const maxSizeBytes = 5 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return NextResponse.json({ error: "Image must be 5MB or smaller." }, { status: 400 });
  }

  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = fileExt.replace(/[^a-z0-9]/g, "") || "jpg";
  const filePath = `listings/${Date.now()}-${crypto.randomUUID()}.${safeExt}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from("listing-images")
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data } = supabase.storage.from("listing-images").getPublicUrl(filePath);

  return NextResponse.json({ url: data.publicUrl });
}