import { dismissAppErrorLogAction } from "@/lib/actions/monitoring";
import { SubmitButton } from "@/components/ui/submit-button";

interface AppErrorLogActionsProps {
  logId: string;
}

export function AppErrorLogActions({ logId }: AppErrorLogActionsProps) {
  return (
    <form action={dismissAppErrorLogAction.bind(null, logId)}>
      <SubmitButton className="button button-ghost" pendingLabel="Dismissing...">
        Dismiss
      </SubmitButton>
    </form>
  );
}
