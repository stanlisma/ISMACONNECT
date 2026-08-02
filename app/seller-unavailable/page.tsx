import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Seller page unavailable",
  robots: {
    index: false,
    follow: false
  }
};

export default function SellerUnavailablePage() {
  return (
    <section className="section">
      <div className="container">
        <div className="empty-state">
          <span className="eyebrow">Seller unavailable</span>
          <h3>This seller&apos;s page isn&apos;t available right now.</h3>
          <p>
            They may not have any active listings at the moment, or their storefront has been removed.
          </p>

          <div className="empty-state-actions">
            <Link className="button button-secondary" href="/browse">
              Browse listings
            </Link>
            <Link className="button button-ghost" href="/businesses">
              Browse storefronts
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
