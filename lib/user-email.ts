import { isSupabaseServiceRoleConfigured } from "@/lib/env";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function resolveUserEmail(userId: string) {
  if (isSupabaseServiceRoleConfigured()) {
    try {
      const serviceSupabase = createServiceRoleSupabaseClient();
      const { data, error } = await serviceSupabase.auth.admin.getUserById(userId);

      if (!error && data.user?.email) {
        return data.user.email;
      }
    } catch (error) {
      console.error("Could not resolve user email through service role auth lookup:", error);
    }
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .maybeSingle();

    return data?.email ?? null;
  } catch (error) {
    console.error("Could not resolve user email from profiles fallback:", error);
    return null;
  }
}
