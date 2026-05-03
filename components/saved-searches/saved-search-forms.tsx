import { Trash2 } from "lucide-react";

import {
  deleteSavedSearchAction,
  openSavedSearchAction
} from "@/lib/actions/saved-searches";
import { SubmitButton } from "@/components/ui/submit-button";

interface OpenSavedSearchFormProps {
  href: string;
  savedSearchId: string;
  hasAlerts?: boolean;
}

export function OpenSavedSearchForm({
  href,
  savedSearchId,
  hasAlerts = false
}: OpenSavedSearchFormProps) {
  return (
    <form action={openSavedSearchAction.bind(null, savedSearchId, href)}>
      <SubmitButton className="button-secondary" pendingLabel="Opening...">
        {hasAlerts ? "Open new matches" : "View search"}
      </SubmitButton>
    </form>
  );
}

interface DeleteSavedSearchFormProps {
  savedSearchId: string;
}

export function DeleteSavedSearchForm({ savedSearchId }: DeleteSavedSearchFormProps) {
  return (
    <form action={deleteSavedSearchAction.bind(null, savedSearchId)}>
      <SubmitButton
        className="button-ghost button-danger saved-search-delete-button"
        pendingLabel="Removing..."
      >
        <Trash2 aria-hidden="true" size={16} strokeWidth={2.3} />
        <span>Remove</span>
      </SubmitButton>
    </form>
  );
}
