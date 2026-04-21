import { flagListingAction } from "@/lib/actions/listings";
import { SubmitButton } from "@/components/ui/submit-button";

interface FlagListingFormProps {
  listingId: string;
}

export function FlagListingForm({ listingId }: FlagListingFormProps) {
  return (
    <form action={flagListingAction.bind(null, listingId)} className="form-grid">
      <label className="field">
        <span className="field-label">Flag this listing</span>
        <textarea
          className="textarea"
          maxLength={280}
          name="reason"
          placeholder="Briefly explain why this listing should be reviewed."
          required
          rows={4}
        />
      </label>

      <SubmitButton className="button button-secondary" pendingLabel="Sending...">
        Submit flag
      </SubmitButton>
    </form>
  );
}

