import { FlashMessage } from "@/components/ui/flash-message";
import { updateNotificationSettingsAction } from "@/lib/actions/settings";
import { requireViewer } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSingleParam } from "@/lib/utils";

export default async function SettingsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireViewer();
  const supabase = await createServerSupabaseClient();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const { data: profile } = await supabase
    .from("profiles")
    .select("email_notifications")
    .eq("id", viewer.user.id)
    .single();

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: "600px" }}>
        <FlashMessage
          message={getSingleParam(resolvedSearchParams?.success)}
          tone="success"
        />

        <FlashMessage
          message={getSingleParam(resolvedSearchParams?.error)}
          tone="error"
        />

        <div className="surface">
          <h2 style={{ marginBottom: "1rem" }}>Notification Settings</h2>

          <form action={updateNotificationSettingsAction}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                cursor: "pointer"
              }}
            >
              <input
                type="checkbox"
                name="email_notifications"
                defaultChecked={profile?.email_notifications ?? true}
              />

              <span>Receive email notifications for new messages</span>
            </label>

            <button className="button" type="submit" style={{ marginTop: "1.25rem" }}>
              Save settings
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}