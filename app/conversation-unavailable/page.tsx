import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conversation unavailable",
  robots: {
    index: false,
    follow: false
  }
};

export default function ConversationUnavailablePage() {
  return (
    <section className="section">
      <div className="container">
        <div className="empty-state">
          <span className="eyebrow">Conversation unavailable</span>
          <h3>This conversation is no longer available.</h3>
          <p>
            The link may be out of date, or this conversation isn&apos;t part of your inbox.
          </p>

          <div className="empty-state-actions">
            <Link className="button button-secondary" href="/messages">
              Back to inbox
            </Link>
            <Link className="button button-ghost" href="/browse">
              Browse listings
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
