import { SubmitButton } from "@/components/ui/submit-button";
import { reviewVerificationRequestAction } from "@/lib/actions/trust";

interface VerificationRequestActionsProps {
  profileId: string;
}

export function VerificationRequestActions({ profileId }: VerificationRequestActionsProps) {
  return (
    <div className="action-row">
      <form action={reviewVerificationRequestAction.bind(null, profileId, "approve")}>
        <SubmitButton className="button button-secondary" pendingLabel="Approving...">
          Approve
        </SubmitButton>
      </form>

      <form action={reviewVerificationRequestAction.bind(null, profileId, "reject")}>
        <SubmitButton className="button button-ghost button-danger" pendingLabel="Declining...">
          Decline
        </SubmitButton>
      </form>
    </div>
  );
}
