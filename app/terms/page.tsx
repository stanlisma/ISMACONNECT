import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/legal-page";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Terms of Use | ${SITE_NAME}`,
  description: `Review the marketplace rules, listing expectations, and account responsibilities for ${SITE_NAME}.`
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Terms of Use"
      description="These terms set the basic rules for using ISMACONNECT as a buyer, seller, rider, poster, or business account."
      lastUpdated="May 7, 2026"
    >
      <div className="legal-stack">
        <section className="legal-section">
          <h2>Marketplace use</h2>
          <p>
            You are responsible for the accuracy of the information you post, the items or services you offer, and the
            conduct of your conversations with other members. You may only use the marketplace for lawful activity.
          </p>
        </section>

        <section className="legal-section">
          <h2>Listings and seller content</h2>
          <p>
            Listings must fit the correct category, use truthful descriptions, and avoid misleading pricing, stolen
            content, spam, impersonation, or prohibited goods and services. We may remove or limit listings that do
            not meet marketplace standards.
          </p>
        </section>

        <section className="legal-section">
          <h2>Messaging and trust features</h2>
          <p>
            Messaging, ratings, saved searches, business storefronts, boosts, verification tools, and safety features
            are provided to help local members transact more confidently. Abuse of these systems may lead to listing
            removal, account restrictions, or permanent bans.
          </p>
        </section>

        <section className="legal-section">
          <h2>Paid features</h2>
          <p>
            Paid boosts, verification fees, and other optional marketplace products are handled through the payment
            providers connected to the platform. Availability, pricing, and eligibility may change over time.
          </p>
        </section>

        <section className="legal-section">
          <h2>Account enforcement</h2>
          <p>
            We may suspend, restrict, or remove access where needed to protect users, enforce policies, respond to
            legal obligations, or investigate abuse, scams, chargebacks, or safety reports.
          </p>
        </section>
      </div>
    </LegalPage>
  );
}
