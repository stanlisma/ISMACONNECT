import { FlashMessage } from "@/components/ui/flash-message";
import { TrustBadges } from "@/components/trust/trust-badges";
import { updateNotificationSettingsAction } from "@/lib/actions/settings";
import { requestSellerVerificationAction } from "@/lib/actions/trust";
import { requireViewer } from "@/lib/auth";
import { isStripeWebhookConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSellerTrustSummary } from "@/lib/trust";
import { getSingleParam } from "@/lib/utils";

export default async function SettingsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireViewer();
  const supabase = await createServerSupabaseClient();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const trustSummary = await getSellerTrustSummary(viewer.user.id);
  const stripeIdentityReady = isStripeWebhookConfigured();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "email_notifications, verification_status, verification_requested_at, verified_at, stripe_identity_session_status, stripe_identity_last_error_code, stripe_identity_last_error_reason"
    )
    .eq("id", viewer.user.id)
    .single();

  const identityNeedsRetry = profile?.stripe_identity_session_status === "requires_input";
  const identityProcessing = profile?.stripe_identity_session_status === "processing";

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

        <div className="surface" style={{ marginTop: "1rem" }}>
          <h2 style={{ marginBottom: "0.6rem" }}>Trust & Verification</h2>
          <p className="section-copy" style={{ marginBottom: "1rem" }}>
            Verified sellers and strong ratings appear as trust badges across listing cards and detail pages.
          </p>

          <TrustBadges summary={trustSummary} />

          <div className="meta-list" style={{ marginTop: "1rem" }}>
            <span>Status: {profile?.verification_status ?? "unverified"}</span>
            <span>
              Ratings: {trustSummary?.review_count ? `${trustSummary.average_rating?.toFixed(1)} from ${trustSummary.review_count} reviews` : "No ratings yet"}
            </span>
          </div>

          {profile?.verification_status === "verified" ? (
            <p className="section-copy" style={{ marginTop: "1rem" }}>
              Your Stripe seller verification is active and visible on your listings.
            </p>
          ) : (
            <>
              <p className="section-copy" style={{ marginTop: "1rem" }}>
                {identityProcessing || profile?.verification_status === "pending"
                  ? "Stripe is processing your identity verification now."
                  : identityNeedsRetry
                    ? profile?.stripe_identity_last_error_reason ||
                      "Stripe needs more information before your seller badge can be approved."
                    : "Use Stripe Identity to verify a government-issued photo ID and matching selfie."}
              </p>

              {!stripeIdentityReady ? (
                <p className="section-copy" style={{ marginTop: "1rem" }}>
                  Stripe Identity is not configured in this environment yet.
                </p>
              ) : (
                <form action={requestSellerVerificationAction} style={{ marginTop: "1rem" }}>
                  <button className="button" type="submit">
                    {identityNeedsRetry
                      ? "Retry Stripe ID verification"
                      : identityProcessing || profile?.verification_status === "pending"
                        ? "Continue Stripe ID verification"
                        : "Start Stripe ID verification"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
