"use client";

import { useState } from "react";

import { approveStorefrontClaimAction, rejectStorefrontClaimAction } from "@/lib/actions/storefront-claims";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { SubmitButton } from "@/components/ui/submit-button";

interface ClaimActionsProps {
  claimId: string;
  businessName: string;
}

export function ClaimActions({ claimId, businessName }: ClaimActionsProps) {
  const [showReasonField, setShowReasonField] = useState(false);

  return (
    <div className="action-row">
      <form action={approveStorefrontClaimAction.bind(null, claimId)}>
        <ConfirmSubmitButton
          className="button button-secondary"
          confirmMessage={`Approve this claim? "${businessName}" will transfer to the claimant's account, including any listings posted under it.`}
          pendingLabel="Approving..."
        >
          Approve
        </ConfirmSubmitButton>
      </form>

      {!showReasonField ? (
        <button type="button" className="button button-ghost button-danger" onClick={() => setShowReasonField(true)}>
          Reject
        </button>
      ) : (
        <form action={rejectStorefrontClaimAction.bind(null, claimId)} className="action-row">
          <input className="input" type="text" name="reason" placeholder="Reason (optional)" style={{ maxWidth: "220px" }} />
          <SubmitButton className="button button-ghost button-danger" pendingLabel="Rejecting...">
            Confirm reject
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
