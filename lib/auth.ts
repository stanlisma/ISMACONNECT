import { notFound, redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import type { Profile, Viewer } from "@/types/database";

function buildFallbackFullName(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}) {
  const metadata = user.user_metadata ?? {};
  const fullName =
    typeof metadata.full_name === "string" && metadata.full_name.trim()
      ? metadata.full_name.trim()
      : [metadata.first_name, metadata.last_name]
          .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
          .join(" ")
          .trim();

  if (fullName) {
    return fullName;
  }

  return (user.email ?? "member").split("@")[0] || "member";
}

async function ensureProfileRow(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}) {
  try {
    const serviceRole = createServiceRoleSupabaseClient();
    const metadata = user.user_metadata ?? {};

    await serviceRole.from("profiles").upsert(
      {
        id: user.id,
        email: user.email ?? null,
        full_name: buildFallbackFullName(user),
        phone:
          typeof metadata.phone === "string" && metadata.phone.trim()
            ? metadata.phone.trim()
            : null,
        address:
          typeof metadata.address === "string" && metadata.address.trim()
            ? metadata.address.trim()
            : null,
        phone_verification_method:
          metadata.phone_verification_method === "text" || metadata.phone_verification_method === "call"
            ? metadata.phone_verification_method
            : null
      },
      {
        onConflict: "id",
        ignoreDuplicates: false
      }
    );
  } catch (error) {
    console.error("Failed to ensure viewer profile row:", error);
  }
}

function buildFallbackProfile(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): Profile {
  const metadata = user.user_metadata ?? {};
  const now = new Date().toISOString();

  return {
    id: user.id,
    email: user.email ?? null,
    full_name: buildFallbackFullName(user),
    phone:
      typeof metadata.phone === "string" && metadata.phone.trim()
        ? metadata.phone.trim()
        : null,
    address:
      typeof metadata.address === "string" && metadata.address.trim()
        ? metadata.address.trim()
        : null,
    phone_verification_method:
      metadata.phone_verification_method === "text" || metadata.phone_verification_method === "call"
        ? metadata.phone_verification_method
        : null,
    phone_verified_at: null,
    role: "user",
    is_business: false,
    created_at: now,
    updated_at: now
  };
}

export async function getViewer(): Promise<Viewer | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    await ensureProfileRow(user);

    const { data: recoveredProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!recoveredProfile) {
      return { user, profile: buildFallbackProfile(user) };
    }

    return { user, profile: recoveredProfile };
  }

  return { user, profile };
}

export async function requireViewer() {
  const viewer = await getViewer();

  if (!viewer) {
    redirect("/auth/sign-in");
  }

  return viewer;
}

export async function requireAdminViewer() {
  const viewer = await requireViewer();

  if (viewer.profile.role !== "admin") {
    notFound();
  }

  return viewer;
}
