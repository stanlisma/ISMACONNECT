import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/legal-page";
import { SITE_NAME, SITE_SUPPORT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `Review the marketplace rules, listing expectations, and account responsibilities for ${SITE_NAME}.`
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Terms of Use"
      description="These terms set the basic rules for using ISMACONNECT as a buyer, seller, rider, poster, or business account. By creating an account or using the marketplace, you agree to these terms."
      lastUpdated="July 24, 2026"
    >
      <div className="legal-stack">
        <section className="legal-section">
          <h2>Eligibility</h2>
          <p>
            You must be at least 18 years old and able to form a binding contract to create an account or use
            ISMACONNECT. By using the marketplace, you confirm that the information you provide is accurate and that
            you meet this requirement.
          </p>
        </section>

        <section className="legal-section">
          <h2>Marketplace use</h2>
          <p>
            You are responsible for the accuracy of the information you post, the items or services you offer, and
            the conduct of your conversations with other members. You may only use the marketplace for lawful
            activity.
          </p>
        </section>

        <section className="legal-section">
          <h2>Listings and seller content</h2>
          <p>
            Listings must fit the correct category, use truthful descriptions, and avoid misleading pricing, stolen
            content, spam, impersonation, or prohibited goods and services. We may remove or limit listings that do
            not meet marketplace standards. You retain ownership of the content and photos you post, but you grant
            ISMACONNECT a license to host, display, and distribute that content as part of operating the
            marketplace.
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
          <h2>Payments and paid features</h2>
          <p>
            Paid boosts, seller verification fees, and other optional marketplace products are processed securely
            through Stripe. Prices, availability, and eligibility may change over time. Boost and verification fees
            are generally non-refundable once the paid feature has been activated or verification has started;
            contact <a href={`mailto:${SITE_SUPPORT_EMAIL}`}>{SITE_SUPPORT_EMAIL}</a> if a payment was made in error
            or a paid feature failed to activate correctly, and we will review it on a case-by-case basis.
          </p>
        </section>

        <section className="legal-section">
          <h2>ISMACONNECT's role in your transactions</h2>
          <p>
            ISMACONNECT is a platform that helps local members find and contact each other for rides, rentals, jobs,
            services, and goods. We are not a party to the agreements, payments, or exchanges that happen between
            members, and we do not own, inspect, or guarantee the goods, services, rides, rentals, or job
            opportunities listed. An ID Verified badge confirms Stripe processed a successful identity check; it is
            not a guarantee of a member's trustworthiness, reliability, or the outcome of any transaction. You are
            responsible for using your own judgment, and the safety practices on our{" "}
            <a href="/safety">Safety Tips</a> page, when dealing with other members.
          </p>
        </section>

        <section className="legal-section">
          <h2>Disclaimer of warranties</h2>
          <p>
            ISMACONNECT is provided "as is" and "as available" without warranties of any kind, express or implied,
            including warranties of merchantability, fitness for a particular purpose, or non-infringement. We do
            not guarantee that the marketplace will be uninterrupted, error-free, or free of harmful content posted
            by other users.
          </p>
        </section>

        <section className="legal-section">
          <h2>Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, ISMACONNECT and its operators are not liable for indirect,
            incidental, special, or consequential damages, or for any loss arising from interactions, transactions,
            rides, rentals, or agreements between members, including personal injury, property loss, or financial
            loss. Our total liability for any claim relating to the marketplace is limited to the amount, if any,
            you paid to ISMACONNECT in the twelve months before the claim arose.
          </p>
        </section>

        <section className="legal-section">
          <h2>Indemnification</h2>
          <p>
            You agree to indemnify and hold ISMACONNECT harmless from claims, damages, or expenses arising from your
            use of the marketplace, your listings, your conduct toward other members, or your violation of these
            terms.
          </p>
        </section>

        <section className="legal-section">
          <h2>Account enforcement and termination</h2>
          <p>
            We may suspend, restrict, or remove access where needed to protect users, enforce policies, respond to
            legal obligations, or investigate abuse, scams, chargebacks, or safety reports. You may stop using
            ISMACONNECT and request account closure at any time by contacting{" "}
            <a href={`mailto:${SITE_SUPPORT_EMAIL}`}>{SITE_SUPPORT_EMAIL}</a>.
          </p>
        </section>

        <section className="legal-section">
          <h2>Governing law</h2>
          <p>
            These terms are governed by the laws of the Province of Alberta and the applicable federal laws of
            Canada, without regard to conflict-of-law principles. Any dispute arising from these terms or your use
            of ISMACONNECT will be subject to the courts of Alberta.
          </p>
        </section>

        <section className="legal-section">
          <h2>Changes to these terms</h2>
          <p>
            We may update these terms as the marketplace evolves. Material changes will be reflected by updating the
            "Last updated" date above. Continued use of ISMACONNECT after changes take effect means you accept the
            revised terms.
          </p>
        </section>

        <section className="legal-section">
          <h2>Contact us</h2>
          <p>
            Questions about these terms can be sent to <a href={`mailto:${SITE_SUPPORT_EMAIL}`}>{SITE_SUPPORT_EMAIL}</a>{" "}
            or through our <a href="/contact">contact page</a>.
          </p>
        </section>
      </div>
    </LegalPage>
  );
}
