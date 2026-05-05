import { SubmitButton } from "@/components/ui/submit-button";
import { reviewUserReportAction } from "@/lib/actions/message-safety";

interface UserReportActionsProps {
  reportId: string;
}

export function UserReportActions({ reportId }: UserReportActionsProps) {
  return (
    <div className="action-row">
      <form action={reviewUserReportAction.bind(null, reportId, "resolved")}>
        <SubmitButton className="button button-secondary" pendingLabel="Resolving...">
          Resolve
        </SubmitButton>
      </form>

      <form action={reviewUserReportAction.bind(null, reportId, "dismissed")}>
        <SubmitButton className="button button-ghost button-danger" pendingLabel="Dismissing...">
          Dismiss
        </SubmitButton>
      </form>
    </div>
  );
}
