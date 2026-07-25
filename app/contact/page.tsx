import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/legal-page";
import { SITE_NAME, SITE_SUPPORT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact Support",
  description: `Contact ${SITE_NAME} support for account, listing, safety, and launch questions.`
};

export default function ContactPage() {
  return (
    <LegalPage
      eyebrow="Support"
      title="Contact ISMACONNECT"
      description="Use this page for account questions, listing issues, report follow-ups, payment questions, or launch feedback."
      lastUpdated="May 7, 2026"
    >
      <div className="legal-stack">
        <section className="legal-section">
          <h2>Best contact route</h2>
          <p>
            Email support at <a href={`mailto:${SITE_SUPPORT_EMAIL}`}>{SITE_SUPPORT_EMAIL}</a>. Include the listing
            title, account email, and a short description of the issue so we can respond faster.
          </p>
        </section>

        <section className="legal-section">
          <h2>Use support for</h2>
          <ul className="legal-list">
            <li>Account access or sign-in issues</li>
            <li>Listing posting or editing problems</li>
            <li>Payment, boost, or verification questions</li>
            <li>Safety reports or moderation follow-up</li>
            <li>Business storefront setup help</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Urgent safety concerns</h2>
          <p>
            If there is a direct safety risk, stop the conversation, use the in-app block or report tools, and contact
            local authorities where appropriate. Support can review platform activity, but it does not replace emergency
            services.
          </p>
        </section>
      </div>
    </LegalPage>
  );
}
