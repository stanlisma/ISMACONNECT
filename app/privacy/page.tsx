import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/legal-page";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Privacy Policy | ${SITE_NAME}`,
  description: `Read how ${SITE_NAME} handles account details, listings, messages, and marketplace data.`
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Privacy Policy"
      description="This page explains what information ISMACONNECT collects, why it is used, and how we handle marketplace communication, seller tools, and support requests."
      lastUpdated="May 7, 2026"
    >
      <div className="legal-stack">
        <section className="legal-section">
          <h2>What we collect</h2>
          <p>
            We collect the details you provide when you create an account, publish listings, message other members,
            save searches, or contact support. That may include your name, email address, phone number, listing
            details, uploaded photos, and message history inside the marketplace.
          </p>
        </section>

        <section className="legal-section">
          <h2>How we use it</h2>
          <p>
            We use your information to operate the marketplace, show your listings, deliver messages and
            notifications, prevent abuse, process payments for paid features, and improve search and trust features.
          </p>
        </section>

        <section className="legal-section">
          <h2>Sharing</h2>
          <p>
            Your public listing details and selected seller information are visible to other marketplace users. We may
            also rely on service providers for infrastructure, payments, maps, email delivery, and notifications. We do
            not sell your personal information.
          </p>
        </section>

        <section className="legal-section">
          <h2>Safety and moderation</h2>
          <p>
            Messages, reports, and account activity may be reviewed when needed to investigate fraud, harassment,
            policy violations, payment disputes, or other trust and safety issues.
          </p>
        </section>

        <section className="legal-section">
          <h2>Your choices</h2>
          <p>
            You can update your profile, edit or remove listings, manage favourites and saved searches, and adjust
            notification settings from your account. If you need account-level help or data questions, contact support.
          </p>
        </section>
      </div>
    </LegalPage>
  );
}
