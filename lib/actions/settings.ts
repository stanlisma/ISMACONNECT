"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireViewer } from "@/lib/auth";
import {
  isBusinessProfileSchemaError,
  normalizeBusinessWebsite,
  parseServiceAreasInput
} from "@/lib/business-profile";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function updateNotificationSettingsAction(formData: FormData) {
  const viewer = await requireViewer();
  const supabase = await createServerSupabaseClient();

  const emailNotifications =
    formData.get("email_notifications") === "on";

  await supabase
    .from("profiles")
    .update({
      email_notifications: emailNotifications
    })
    .eq("id", viewer.user.id);

  redirect("/settings?success=Settings updated");
}

export async function updateBusinessProfileAction(formData: FormData) {
  const viewer = await requireViewer();
  const supabase = await createServerSupabaseClient();

  const isBusiness = formData.get("is_business") === "on";
  const businessName = String(formData.get("business_name") ?? "").trim() || null;
  const businessDescription = String(formData.get("business_description") ?? "").trim() || null;
  const businessLogoUrl = String(formData.get("business_logo_url") ?? "").trim() || null;
  const businessWebsite = normalizeBusinessWebsite(String(formData.get("business_website") ?? ""));
  const serviceAreas = parseServiceAreasInput(String(formData.get("service_areas") ?? ""));

  const payload = {
    is_business: isBusiness,
    business_name: isBusiness ? businessName : null,
    business_description: isBusiness ? businessDescription : null,
    business_logo_url: isBusiness ? businessLogoUrl : null,
    business_website: isBusiness ? businessWebsite : null,
    service_areas: isBusiness ? serviceAreas : []
  };

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", viewer.user.id);

  if (error) {
    if (isBusinessProfileSchemaError(error)) {
      redirect("/settings?error=Run the business profile migration in Supabase before saving business settings.");
    }

    redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/settings");
  revalidatePath("/account");
  revalidatePath(`/sellers/${viewer.user.id}`);
  redirect("/settings?success=Business profile updated");
}
