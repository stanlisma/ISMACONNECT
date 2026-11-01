import { renewListingAction } from "@/lib/actions/listings";
import { SubmitButton } from "@/components/ui/submit-button";

export function ListingRenewForm({ listingId }: { listingId: string }) {
  return (
    <form action={renewListingAction.bind(null, listingId)}>
      <SubmitButton className="button-secondary" pendingLabel="Renewing...">
        Renew
      </SubmitButton>
    </form>
  );
}
