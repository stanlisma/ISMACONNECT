import { deleteListingAction } from "@/lib/actions/listings";
import { SubmitButton } from "@/components/ui/submit-button";

interface DeleteListingFormProps {
  listingId: string;
}

export function DeleteListingForm({ listingId }: DeleteListingFormProps) {
  return (
    <form action={deleteListingAction.bind(null, listingId)}>
      <SubmitButton className="button button-ghost button-danger" pendingLabel="Deleting...">
        Delete
      </SubmitButton>
    </form>
  );
}

