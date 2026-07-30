import { NextResponse } from "next/server";

import { requireViewer } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ALLOWED_IMAGE_UPLOAD_TYPES } from "@/lib/constants";
import { sniffImageMimeType } from "@/lib/file-signatures";

export async function POST(request: Request) {
  await requireViewer();

  const supabase = await createServerSupabaseClient();
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  if (!ALLOWED_IMAGE_UPLOAD_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPG, PNG, WEBP, or GIF images are allowed." },
      { status: 400 }
    );
  }

  const maxSizeBytes = 5 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return NextResponse.json({ error: "Image must be 5MB or smaller." }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  // The declared Content-Type above is client-supplied and easily spoofed -
  // verify the actual file bytes match a known image signature before
  // trusting it as an image.
  const sniffedType = sniffImageMimeType(buffer);
  if (!sniffedType || !ALLOWED_IMAGE_UPLOAD_TYPES.has(sniffedType)) {
    return NextResponse.json(
      { error: "This file doesn't look like a valid JPG, PNG, WEBP, or GIF image." },
      { status: 400 }
    );
  }

  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = fileExt.replace(/[^a-z0-9]/g, "") || "jpg";
  const filePath = `messages/${Date.now()}-${crypto.randomUUID()}.${safeExt}`;

  const { error: uploadError } = await supabase.storage
    .from("listing-images")
    .upload(filePath, buffer, {
      contentType: sniffedType,
      upsert: false
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data } = supabase.storage.from("listing-images").getPublicUrl(filePath);

  return NextResponse.json({ url: data.publicUrl });
}