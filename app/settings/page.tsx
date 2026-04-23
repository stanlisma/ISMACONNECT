import { requireViewer } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateNotificationSettingsAction } from "@/lib/actions/settings";

export default async function SettingsPage() {
  const viewer = await requireViewer();
  const supabase = await createServerSupabaseClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("email_notifications")
    .eq("id", viewer.user.id)
    .single();

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: "600px" }}>
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

            <button
              className="button"
              type="submit"
              style={{ marginTop: "1.25rem" }}
            >
              Save settings
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}