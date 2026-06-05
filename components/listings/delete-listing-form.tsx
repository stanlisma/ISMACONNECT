import { deleteListingAction } from "@/lib/actions/listings";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";

interface DeleteListingFormProps {
  listingId: string;
}

export function DeleteListingForm({ listingId }: DeleteListingFormProps) {
  return (
    <form action={deleteListingAction.bind(null, listingId)}>
      <ConfirmSubmitButton
        className="button button-ghost button-danger"
        confirmMessage="Delete this listing? This cannot be undone."
        pendingLabel="Deleting..."
      >
        Delete
      </ConfirmSubmitButton>
    </form>
  );
}
