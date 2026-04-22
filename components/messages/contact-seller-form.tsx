import { sendListingMessageAction } from "@/lib/actions/messages";

export function ContactSellerForm({ listingId }: { listingId: string }) {
  const action = sendListingMessageAction.bind(null, listingId);

  return (
    <form action={action} className="form-grid">
      <label className="field" style={{ gridColumn: "1 / -1" }}>
        <span className="field-label">Message seller</span>
        <textarea
          className="input"
          name="body"
          rows={5}
          placeholder="Hi, is this still available?"
          required
        />
      </label>

      <div>
        <button className="button" type="submit">
          Send message
        </button>
      </div>
    </form>
  );
}