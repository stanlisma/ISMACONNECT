import { SubmitButton } from "@/components/ui/submit-button";
import { submitSellerReviewAction } from "@/lib/actions/trust";
import type { SellerReview } from "@/types/database";

interface SellerReviewFormProps {
  listingId: string;
  listingSlug: string;
  sellerId: string;
  existingReview?: SellerReview | null;
}

export function SellerReviewForm({
  listingId,
  listingSlug,
  sellerId,
  existingReview
}: SellerReviewFormProps) {
  if (existingReview) {
    return (
      <div className="seller-review-note">
        <strong>You rated this seller {existingReview.rating}/5</strong>
        {existingReview.comment ? <p>{existingReview.comment}</p> : null}
      </div>
    );
  }

  return (
    <form
      action={submitSellerReviewAction.bind(null, listingId, listingSlug, sellerId)}
      className="seller-review-form"
    >
      <label className="field">
        <span className="field-label">Rating</span>
        <select className="select" name="rating" defaultValue="5">
          <option value="5">5 - Excellent</option>
          <option value="4">4 - Good</option>
          <option value="3">3 - Okay</option>
          <option value="2">2 - Poor</option>
          <option value="1">1 - Very poor</option>
        </select>
      </label>

      <label className="field">
        <span className="field-label">Comment</span>
        <textarea
          className="textarea"
          name="comment"
          rows={4}
          placeholder="Share a short note about responsiveness, accuracy, or professionalism."
        />
      </label>

      <SubmitButton pendingLabel="Submitting...">
        Submit rating
      </SubmitButton>
    </form>
  );
}
