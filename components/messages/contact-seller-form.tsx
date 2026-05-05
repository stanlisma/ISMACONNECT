import { sendListingMessageAction } from "@/lib/actions/messages";

export function ContactSellerForm({ listingId }: { listingId: string }) {
  const action = sendListingMessageAction.bind(null, listingId);

  return (
    <form action={action} className="form-grid contact-seller-form">
      <label className="field contact-seller-field">
        <span className="field-label">Message seller</span>
        <textarea
          className="input contact-seller-textarea"
          name="body"
          rows={4}
          placeholder="Hi, is this still available?"
          required
        />
      </label>

      <div className="contact-seller-actions">
        <button className="button" type="submit">
          Send message
        </button>
      </div>
    </form>
  );
}
