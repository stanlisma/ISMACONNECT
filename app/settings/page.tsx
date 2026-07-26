import { unstable_noStore as noStore } from "next/cache";

import { AdditionalStorefrontsManager } from "@/components/settings/additional-storefronts-manager";
import { DeleteAccountForm } from "@/components/settings/delete-account-form";
import { BrowserNotificationSettings } from "@/components/pwa/browser-notification-settings";
import { InstallAppCard } from "@/components/pwa/install-app-card";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { FlashMessage } from "@/components/ui/flash-message";
import { FieldHelp, FieldLabelWithHelp } from "@/components/ui/field-help";
import { PhoneInput } from "@/components/ui/phone-input";
import { TrustBadges } from "@/components/trust/trust-badges";
import {
  EMPTY_BUSINESS_PROFILE,
  isBusinessProfileSchemaError,
  normalizeBusinessProfileRow
} from "@/lib/business-profile";
import {
  getIdentityVerificationPriceLabel,
  reconcileIdentityVerificationProfile,
  reconcileLatestIdentityVerificationPayment
} from "@/lib/identity-verification";
import { deactivateAccountAction } from "@/lib/actions/account";
import {
  createAdditionalStorefrontAction,
  deleteAdditionalStorefrontAction,
  updateAdditionalStorefrontAction,
  updateNotificationSettingsAction,
  updatePersonalProfileAction
} from "@/lib/actions/settings";
import { requestSellerVerificationAction } from "@/lib/actions/trust";
import { requireViewer } from "@/lib/auth";
import { getOwnedAdditionalStorefronts } from "@/lib/data";
import { isEmailConfigured, isStripeWebhookConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSellerTrustSummary } from "@/lib/trust";
import { getSingleParam } from "@/lib/utils";

export default async function SettingsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  noStore();

  const viewer = await requireViewer();
  const supabase = await createServerSupabaseClient();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const showCreateStorefrontForm = getSingleParam(resolvedSearchParams?.create) === "1";
  const focusStorefrontId = getSingleParam(resolvedSearchParams?.storefront);
  const trustSummary = await getSellerTrustSummary(viewer.user.id);
  const stripeIdentityReady = isStripeWebhookConfigured();
  const emailDeliveryReady = isEmailConfigured();
  const latestVerificationOrder = await reconcileLatestIdentityVerificationPayment(viewer.user.id);
  const verificationPriceLabel = getIdentityVerificationPriceLabel();
  const profile = await reconcileIdentityVerificationProfile(viewer.user.id);

  const businessProfileResponse = await supabase
    .from("profiles")
    .select(
      "business_name, business_description, business_logo_url, business_website, business_address, show_exact_business_location, service_areas, business_services, business_hours"
    )
    .eq("id", viewer.user.id)
    .maybeSingle();

  let businessProfile = EMPTY_BUSINESS_PROFILE;

  if (businessProfileResponse.error) {
    if (isBusinessProfileSchemaError(businessProfileResponse.error)) {
      businessProfile = EMPTY_BUSINESS_PROFILE;
    } else {
      console.error("Business profile load failed:", businessProfileResponse.error.message);
    }
  } else {
    businessProfile = normalizeBusinessProfileRow(businessProfileResponse.data);
  }

  const additionalStorefrontsResult = await getOwnedAdditionalStorefronts(viewer.user.id);

  const identityNeedsRetry = profile?.stripe_identity_session_status === "requires_input";
  const identityProcessing = profile?.stripe_identity_session_status === "processing";
  const verificationPaid = latestVerificationOrder?.status === "paid";
  const verificationPaymentPending = latestVerificationOrder?.status === "pending";
  const verificationSupportText =
    identityProcessing || profile?.verification_status === "pending"
      ? "Stripe is processing your identity verification now."
      : identityNeedsRetry
        ? profile?.stripe_identity_last_error_reason ||
          "Stripe needs more information before your seller badge can be approved."
        : !verificationPaid
          ? `A one-time ${verificationPriceLabel} Stripe Checkout payment is required before ID verification starts.`
          : "Use Stripe Identity to verify a government-issued photo ID and matching selfie.";
  const verificationStatusLabel =
    profile?.verification_status === "verified"
      ? "Verified"
      : identityProcessing || profile?.verification_status === "pending"
        ? "Processing"
        : identityNeedsRetry
          ? "Needs retry"
          : verificationPaid
            ? "Ready"
            : "Not started";
  const verificationStatusToneClass =
    profile?.verification_status === "verified"
      ? "is-success"
      : identityNeedsRetry
        ? "is-danger"
        : identityProcessing || profile?.verification_status === "pending"
          ? "is-warning"
          : "is-muted";

  return (
    <section className="section">
      <div className="container settings-shell">
        <FlashMessage
          message={getSingleParam(resolvedSearchParams?.success)}
          tone="success"
        />

        <FlashMessage
          message={getSingleParam(resolvedSearchParams?.error)}
          tone="error"
        />

        <div className="settings-page-header">
          <h1 className="section-title">Settings</h1>
          <div className="pill-row settings-jump-row">
            <a className="account-menu-pill is-active" href="#personal">
              Personal info
            </a>
            <a className="account-menu-pill" href="#notifications">
              Notifications
            </a>
            <a className="account-menu-pill" href="#storefronts">
              Storefronts
            </a>
            <a className="account-menu-pill" href="#verification">
              Verification
            </a>
            <a className="account-menu-pill" href="#danger">
              Account
            </a>
          </div>
        </div>

        <div className="surface settings-section-card" id="personal">
          <div className="settings-title-row">
            <h2>Personal Info</h2>
            <FieldHelp
              label="Personal Info"
              text="This is your own contact info, used for your account and shown to locals you message. It's separate from any business storefront details."
            />
          </div>

          <form action={updatePersonalProfileAction} className="settings-block-stack">
            <input type="hidden" name="return_path" value="/settings" />

            <label className="field">
              <FieldLabelWithHelp label="Full name" />
              <input
                className="input"
                type="text"
                name="full_name"
                defaultValue={viewer.profile.full_name ?? ""}
                placeholder="Your name"
                required
              />
            </label>

            <label className="field">
              <FieldLabelWithHelp
                label="Phone"
                helpText="Optional. Used for your own reference and any messages where you choose to share it."
              />
              <PhoneInput
                name="phone"
                defaultValue={viewer.profile.phone ?? ""}
                placeholder="1 (780) 555-0123"
              />
            </label>

            <label className="field">
              <FieldLabelWithHelp
                label="Address"
                helpText="Optional. This is your personal location and is not shown publicly."
              />
              <input
                className="input"
                type="text"
                name="address"
                defaultValue={viewer.profile.address ?? ""}
                placeholder="Thickwood, Fort McMurray"
              />
            </label>

            <label className="field">
              <FieldLabelWithHelp label="Email" />
              <input className="input" type="email" value={viewer.user.email ?? ""} disabled readOnly />
            </label>

            <div className="business-profile-actions">
              <button className="button" type="submit">
                Save personal info
              </button>
            </div>
          </form>
        </div>

        <div className="surface settings-section-card" id="notifications">
          <div className="settings-title-row">
            <h2>Notification Settings</h2>
            <FieldHelp
              label="Notification Settings"
              text="Manage message emails, browser push alerts, and install options for this device."
            />
          </div>

          <form action={updateNotificationSettingsAction}>
            <label className="settings-inline-toggle">
              <input
                type="checkbox"
                name="email_notifications"
                defaultChecked={profile?.email_notifications ?? true}
              />

              <span>Receive email notifications for new messages</span>
            </label>

            <button className="button" type="submit" style={{ marginTop: "1rem" }}>
              Save settings
            </button>
          </form>

          {!emailDeliveryReady ? (
            <div className="browser-notification-pill-row settings-inline-status">
              <span className="account-menu-pill is-warning">Email unavailable</span>
            </div>
          ) : null}

          <div className="settings-block-stack">
            <BrowserNotificationSettings />
          </div>

          <div className="settings-block-stack">
            <InstallAppCard />
          </div>
        </div>

        <div className="settings-block-stack" id="storefronts">
          <AdditionalStorefrontsManager
            storefronts={additionalStorefrontsResult.storefronts}
            schemaReady={additionalStorefrontsResult.schemaReady}
            focusStorefrontId={focusStorefrontId}
            showCreateForm={showCreateStorefrontForm}
            createAction={createAdditionalStorefrontAction}
            updateAction={updateAdditionalStorefrontAction}
            deleteAction={deleteAdditionalStorefrontAction}
            returnPath="/settings"
            suggestedDefaults={
              additionalStorefrontsResult.storefronts.length === 0 &&
              (businessProfile.business_name ||
                businessProfile.business_description ||
                businessProfile.business_website ||
                businessProfile.business_address ||
                businessProfile.service_areas.length ||
                businessProfile.business_services.length)
                ? {
                    name: businessProfile.business_name ?? "",
                    description: businessProfile.business_description ?? null,
                    logo_url: businessProfile.business_logo_url ?? null,
                    image_urls: [],
                    website: businessProfile.business_website ?? null,
                    phone: null,
                    address: businessProfile.business_address ?? null,
                    show_exact_location: businessProfile.show_exact_business_location,
                    service_areas: businessProfile.service_areas,
                    services: businessProfile.business_services,
                    hours: businessProfile.business_hours,
                    id: "",
                    owner_id: viewer.user.id,
                    slug: "",
                    geocoded_lat: null,
                    geocoded_lng: null,
                    geocoded_area: null,
                    geocoded_formatted_address: null,
                    geocoded_at: null,
                    created_at: "",
                    updated_at: ""
                  }
                : undefined
            }
          />
        </div>

        <div className="surface settings-section-card" id="verification">
          <div className="settings-title-row">
            <h2>Trust & Verification</h2>
            <FieldHelp
              label="Trust & Verification"
              text={`ID-verified sellers and strong ratings appear as trust badges across listing cards and detail pages. ${verificationSupportText}`}
            />
          </div>

          <TrustBadges summary={trustSummary} />

          {profile?.verification_status === "verified" ? (
            <p className="browser-notification-note">
              Your ID Verified badge is already live across your listings and storefronts.
            </p>
          ) : (
            <>
              <div className="browser-notification-pill-row settings-inline-status">
                <span className={`account-menu-pill ${verificationStatusToneClass}`}>
                  {verificationStatusLabel}
                </span>
                {!verificationPaid ? (
                  <span className="account-menu-pill is-muted">Fee {verificationPriceLabel}</span>
                ) : null}
                {verificationPaymentPending ? (
                  <span className="account-menu-pill is-warning">Payment pending</span>
                ) : null}
                {!stripeIdentityReady ? (
                  <span className="account-menu-pill is-danger">Stripe unavailable</span>
                ) : null}
              </div>

              {stripeIdentityReady ? (
                <form action={requestSellerVerificationAction} className="settings-block-stack">
                  <button className="button" type="submit">
                    {identityNeedsRetry
                      ? "Retry Stripe ID verification"
                      : identityProcessing || profile?.verification_status === "pending"
                        ? "Continue Stripe ID verification"
                        : !verificationPaid
                          ? `Pay ${verificationPriceLabel} to verify`
                          : "Start Stripe ID verification"}
                  </button>
                </form>
              ) : null}
            </>
          )}
        </div>

        <div className="surface settings-section-card" id="danger">
          <div className="settings-title-row">
            <h2>Deactivate Account</h2>
            <FieldHelp
              label="Deactivate Account"
              text="Temporarily hides your listings and storefronts and signs you out everywhere. Nothing is deleted — sign back in anytime to reactivate and pick up exactly where you left off."
            />
          </div>

          <p className="browser-notification-note">
            Your profile, listings, and storefronts stay hidden from other users until you reactivate. This is
            fully reversible.
          </p>

          <form action={deactivateAccountAction} className="settings-block-stack">
            <ConfirmSubmitButton
              className="button-secondary"
              confirmMessage="Deactivate your account? Your listings and storefronts will be hidden until you sign back in and reactivate."
              pendingLabel="Deactivating..."
            >
              Deactivate my account
            </ConfirmSubmitButton>
          </form>
        </div>

        <div className="surface settings-section-card" id="delete">
          <div className="settings-title-row">
            <h2>Delete Account</h2>
            <FieldHelp
              label="Delete Account"
              text="Permanently deletes your profile info and removes your listings and storefronts. Some records, like payment history and messages with other users, are retained where legally required. This cannot be undone."
            />
          </div>

          <p className="browser-notification-note">
            This removes your name, phone, address, and business details, unpublishes your listings and
            storefronts, and signs you out everywhere. Conversations, reviews, and payment records are kept where
            we have a legal or fraud-prevention reason to retain them.
          </p>

          <DeleteAccountForm />
        </div>
      </div>
    </section>
  );
}
