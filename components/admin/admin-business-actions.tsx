"use client";

import {
  adminDeleteBusinessAction,
  adminKeepOneBusinessAction,
  adminSetBusinessActiveAction
} from "@/lib/actions/admin-businesses";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { SubmitButton } from "@/components/ui/submit-button";

interface AdminBusinessActionsProps {
  storefrontId: string;
  name: string;
  isActive: boolean;
  activeListingCount: number;
  duplicateCount: number;
  returnPath: string;
}

export function AdminBusinessActions({
  storefrontId,
  name,
  isActive,
  activeListingCount,
  duplicateCount,
  returnPath
}: AdminBusinessActionsProps) {
  const listingNote =
    activeListingCount > 0
      ? ` Its ${activeListingCount} active listing${activeListingCount === 1 ? "" : "s"} will stay live but no longer be linked to a business profile.`
      : "";

  return (
    <div className="action-row">
      {duplicateCount > 0 ? (
        <form action={adminKeepOneBusinessAction.bind(null, storefrontId)}>
          <input type="hidden" name="returnPath" value={returnPath} />
          <ConfirmSubmitButton
            className="button-secondary"
            confirmMessage={`Keep "${name}" and permanently delete the other ${duplicateCount} profile${duplicateCount === 1 ? "" : "s"} with the same name on this account? Any listings on the deleted copies move onto this one. This cannot be undone.`}
            pendingLabel="Cleaning up..."
          >
            Keep this one, delete {duplicateCount} duplicate{duplicateCount === 1 ? "" : "s"}
          </ConfirmSubmitButton>
        </form>
      ) : null}

      {isActive ? (
        <form action={adminSetBusinessActiveAction.bind(null, storefrontId, false)}>
          <input type="hidden" name="returnPath" value={returnPath} />
          <ConfirmSubmitButton
            className="button button-ghost button-danger"
            confirmMessage={`Suspend "${name}"? Its profile page will be hidden from the site until you restore it. Its listings and the owner's account are not affected.`}
            pendingLabel="Suspending..."
          >
            Suspend
          </ConfirmSubmitButton>
        </form>
      ) : (
        <form action={adminSetBusinessActiveAction.bind(null, storefrontId, true)}>
          <input type="hidden" name="returnPath" value={returnPath} />
          <SubmitButton className="button-secondary" pendingLabel="Restoring...">
            Restore
          </SubmitButton>
        </form>
      )}

      <form action={adminDeleteBusinessAction.bind(null, storefrontId)}>
        <input type="hidden" name="returnPath" value={returnPath} />
        <ConfirmSubmitButton
          className="button button-ghost button-danger"
          confirmMessage={`Permanently delete "${name}"? This cannot be undone.${listingNote}`}
          pendingLabel="Deleting..."
        >
          Delete
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
