"use client";

import { sendListingMessageAction } from "@/lib/actions/messages";
import { trackMarketplaceEvent } from "@/lib/analytics";
import type { ListingIntent } from "@/types/database";

export function ContactSellerForm({
  listingId,
  listingIntent = "offer"
}: {
  listingId: string;
  listingIntent?: ListingIntent;
}) {
  const action = sendListingMessageAction.bind(null, listingId);
  const isNeed = listingIntent === "need";

  return (
    <form
      action={action}
      className="form-grid contact-seller-form"
      onSubmit={() =>
        trackMarketplaceEvent("contact_seller_attempt", {
          listing_id: listingId,
          listing_intent: listingIntent
        })
      }
    >
      <label className="field contact-seller-field">
        <span className="field-label">{isNeed ? "Send your reply" : "Message seller"}</span>
        <textarea
          className="input contact-seller-textarea"
          name="body"
          rows={4}
          placeholder={
            isNeed
              ? "Hi, I can help with this. Here’s what I can offer..."
              : "Hi, is this still available?"
          }
          required
        />
      </label>

      <div className="contact-seller-actions">
        <button className="button" type="submit">
          {isNeed ? "Send reply" : "Send message"}
        </button>
      </div>
    </form>
  );
}
