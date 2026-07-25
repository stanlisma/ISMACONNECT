import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/legal-page";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Safety Tips",
  description: `Learn how to stay safer when buying, selling, hiring, or arranging local rides through ${SITE_NAME}.`
};

export default function SafetyPage() {
  return (
    <LegalPage
      eyebrow="Safety"
      title="Marketplace Safety Tips"
      description="ISMACONNECT is built for local trust, but every marketplace still needs good judgment. Use these rules before you meet, pay, or share private details."
      lastUpdated="May 7, 2026"
    >
      <div className="legal-stack">
        <section className="legal-section">
          <h2>Before you reply</h2>
          <p>
            Read the full listing, check the seller profile, compare price and photos, and be careful with listings
            that feel rushed, copied, or too good to be true.
          </p>
        </section>

        <section className="legal-section">
          <h2>Meeting locally</h2>
          <p>
            Meet in public, well-lit places whenever possible. Tell a friend where you are going. If the transaction
            involves an expensive item, bring another person and avoid carrying large amounts of cash.
          </p>
        </section>

        <section className="legal-section">
          <h2>Payments</h2>
          <p>
            Be careful with prepaid deposits, gift cards, wire transfers, and off-platform pressure. Confirm the item,
            ride, rental, or service details before you pay.
          </p>
        </section>

        <section className="legal-section">
          <h2>Jobs, rentals, and rides</h2>
          <p>
            For jobs, confirm the employer and work setup. For rentals, verify the unit and the poster before sending
            money. For ride share, confirm departure area, destination, timing, seats, and luggage or tool-space
            details in writing.
          </p>
        </section>

        <section className="legal-section">
          <h2>Riding with someone new</h2>
          <p>
            Before you get in a vehicle, share the driver's name, the ride details, and your expected arrival time
            with a friend or family member. Check for an ID Verified badge on the driver's profile, agree on the
            cost before the trip starts, and trust your judgment if something feels off enough to cancel.
          </p>
        </section>

        <section className="legal-section">
          <h2>Keep it on ISMACONNECT</h2>
          <p>
            Keep conversations inside ISMACONNECT messaging for as long as you can. It keeps a record you can refer
            back to and share with support if something goes wrong. Be cautious if someone pushes hard to move a
            conversation off-platform right away.
          </p>
        </section>

        <section className="legal-section">
          <h2>Use the built-in safety tools</h2>
          <p>
            If someone behaves suspiciously, use the block and report tools inside the conversation. Do not keep
            engaging with users who are threatening, manipulative, or clearly ignoring marketplace rules.
          </p>
        </section>
      </div>
    </LegalPage>
  );
}
