import { pauseListingAction, resumeListingAction } from "@/lib/actions/listings";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { SubmitButton } from "@/components/ui/submit-button";

interface ListingStatusToggleFormProps {
  listingId: string;
  status: "active" | "paused";
}

export function ListingStatusToggleForm({ listingId, status }: ListingStatusToggleFormProps) {
  if (status === "paused") {
    return (
      <form action={resumeListingAction.bind(null, listingId)}>
        <SubmitButton className="button-secondary" pendingLabel="Resuming...">
          Resume
        </SubmitButton>
      </form>
    );
  }

  return (
    <form action={pauseListingAction.bind(null, listingId)}>
      <ConfirmSubmitButton
        className="button button-secondary"
        confirmMessage="Pause this listing? It will be hidden from other users until you resume it."
        pendingLabel="Pausing..."
      >
        Pause
      </ConfirmSubmitButton>
    </form>
  );
}
