import Link from "next/link";

import { SubmitButton } from "@/components/ui/submit-button";
import { submitStorefrontClaimAction } from "@/lib/actions/storefront-claims";
import type { StorefrontClaim } from "@/types/database";

interface ClaimStorefrontCardProps {
  storefrontId: string;
  isSignedIn: boolean;
  existingClaim: StorefrontClaim | null;
}

export function ClaimStorefrontCard({ storefrontId, isSignedIn, existingClaim }: ClaimStorefrontCardProps) {
  if (existingClaim?.status === "pending") {
    return (
      <div className="seller-storefront-detail-card">
        <h3>Claim submitted</h3>
        <p className="section-copy">
          Your claim on this business is pending review. We&apos;ll email you once an admin has reviewed it.
        </p>
      </div>
    );
  }

  return (
    <div className="seller-storefront-detail-card">
      <h3>Is this your business?</h3>
      <p className="section-copy">
        ISMACONNECT added this listing as a Founding Member. Claim it to manage your info, reply to
        messages, and add photos.
      </p>

      {existingClaim?.status === "rejected" ? (
        <p className="section-copy">
          Your previous claim wasn&apos;t approved
          {existingClaim.rejection_reason ? `: ${existingClaim.rejection_reason}` : "."} You can submit again
          with more details below.
        </p>
      ) : null}

      {isSignedIn ? (
        <form action={submitStorefrontClaimAction.bind(null, storefrontId)} className="stack-md">
          <label className="field">
            <span>How can we verify you own this business? (optional)</span>
            <textarea
              className="textarea business-profile-textarea"
              name="message"
              rows={3}
              maxLength={500}
              placeholder="e.g. your phone number, website, or how you're connected to this business"
            />
          </label>
          <SubmitButton className="button button-secondary" pendingLabel="Submitting...">
            Claim this business
          </SubmitButton>
        </form>
      ) : (
        <div className="action-row">
          <Link className="button button-secondary" href="/auth/sign-in">
            Sign in to claim
          </Link>
          <Link className="button button-ghost" href="/auth/sign-up">
            Create an account
          </Link>
        </div>
      )}
    </div>
  );
}
