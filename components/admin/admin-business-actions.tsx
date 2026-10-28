"use client";

import { adminDeleteBusinessAction, adminSetBusinessActiveAction } from "@/lib/actions/admin-businesses";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { SubmitButton } from "@/components/ui/submit-button";

interface AdminBusinessActionsProps {
  storefrontId: string;
  name: string;
  isActive: boolean;
  activeListingCount: number;
  returnPath: string;
}

export function AdminBusinessActions({
  storefrontId,
  name,
  isActive,
  activeListingCount,
  returnPath
}: AdminBusinessActionsProps) {
  const listingNote =
    activeListingCount > 0
      ? ` Its ${activeListingCount} active listing${activeListingCount === 1 ? "" : "s"} will stay live but no longer be linked to a business profile.`
      : "";

  return (
    <div className="action-row">
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
