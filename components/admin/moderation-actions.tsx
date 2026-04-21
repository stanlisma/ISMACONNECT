import { reviewFlaggedListingAction } from "@/lib/actions/listings";
import { SubmitButton } from "@/components/ui/submit-button";

interface ModerationActionsProps {
  listingId: string;
}

export function ModerationActions({ listingId }: ModerationActionsProps) {
  return (
    <div className="action-row">
      <form action={reviewFlaggedListingAction.bind(null, listingId, "restore")}>
        <SubmitButton className="button button-secondary" pendingLabel="Restoring...">
          Restore
        </SubmitButton>
      </form>
      <form action={reviewFlaggedListingAction.bind(null, listingId, "remove")}>
        <SubmitButton className="button button-ghost button-danger" pendingLabel="Removing...">
          Remove
        </SubmitButton>
      </form>
    </div>
  );
}

