import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/legal-page";
import { SITE_NAME, SITE_SUPPORT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Read how ${SITE_NAME} handles account details, listings, messages, identity verification, and marketplace data.`
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Privacy Policy"
      description="This page explains what information ISMACONNECT collects, why it is used, who we share it with, and the choices you have as a Fort McMurray marketplace member."
      lastUpdated="July 24, 2026"
    >
      <div className="legal-stack">
        <section className="legal-section">
          <h2>What we collect</h2>
          <p>
            We collect the details you provide directly, including your name, email address, phone number, address,
            listing content, uploaded photos, messages sent through the marketplace, saved searches, and support
            requests. When you create or browse a listing that involves a specific location, such as a ride pickup
            point, a rental address, or a business storefront, we may also collect and geocode that location. We
            automatically collect basic technical data such as device and browser type, pages visited, and
            approximate usage patterns to keep the marketplace working and secure.
          </p>
        </section>

        <section className="legal-section">
          <h2>Identity verification data</h2>
          <p>
            Seller ID verification is optional and handled through Stripe Identity. If you choose to verify your
            account, Stripe collects a government-issued photo ID and a live selfie directly, and shares only your
            verification result (verified, failed, or needs input) with ISMACONNECT. We do not store copies of your
            ID document or biometric data ourselves; that information is held and processed by Stripe under its own
            privacy practices. You can review Stripe's privacy policy at{" "}
            <a href="https://stripe.com/privacy" target="_blank" rel="noreferrer">
              stripe.com/privacy
            </a>{" "}
            before starting verification.
          </p>
        </section>

        <section className="legal-section">
          <h2>Cookies and analytics</h2>
          <p>
            ISMACONNECT uses essential cookies to keep you signed in and to remember basic preferences. Where
            enabled, we also use Google Analytics to understand aggregate usage of the marketplace, such as which
            pages and categories are most used. Analytics data is not used to sell you anything to third parties. You
            can control cookies through your browser settings, though disabling essential cookies may prevent you
            from signing in.
          </p>
        </section>

        <section className="legal-section">
          <h2>How we use it</h2>
          <p>
            We use your information to operate the marketplace, show your listings to other local members, deliver
            messages and notifications, process payments for paid features, verify seller identity when requested,
            prevent fraud and abuse, respond to support requests, and improve search, trust, and safety features.
          </p>
        </section>

        <section className="legal-section">
          <h2>Service providers we use</h2>
          <p>
            We rely on trusted service providers to run ISMACONNECT: Supabase for account and database
            infrastructure, Stripe for payments and identity verification, Google Maps for address search and map
            display, Resend for transactional email, and Google Analytics for aggregate usage insight. These
            providers only receive the data needed to perform their function and may process it on servers located
            outside Canada. We do not sell your personal information to anyone.
          </p>
        </section>

        <section className="legal-section">
          <h2>Sharing with other members</h2>
          <p>
            Your public listing details, storefront information, and selected trust signals (such as an ID Verified
            badge, member-since date, and rating summary) are visible to other marketplace users. Your exact address
            or phone number is only shown publicly if you choose to include it in a listing, storefront, or message.
          </p>
        </section>

        <section className="legal-section">
          <h2>Data retention</h2>
          <p>
            We keep account and listing data for as long as your account is active. If you delete a listing or close
            your account, we remove or de-identify the associated data within a reasonable period, except where we
            need to retain records for fraud prevention, dispute resolution, payment records, or legal obligations.
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
          <h2>Your rights and choices</h2>
          <p>
            You can update your profile, edit or remove listings, manage favourites and saved searches, and adjust
            notification settings from your account at any time. Under Canadian privacy law, you have the right to
            access the personal information we hold about you, request a correction, and withdraw consent for
            optional processing such as marketing email or push notifications. To make a request, email{" "}
            <a href={`mailto:${SITE_SUPPORT_EMAIL}`}>{SITE_SUPPORT_EMAIL}</a>. If you are not satisfied with our
            response, you may contact the Office of the Privacy Commissioner of Canada.
          </p>
        </section>

        <section className="legal-section">
          <h2>Children's privacy</h2>
          <p>
            ISMACONNECT is intended for users who are at least 18 years old. We do not knowingly collect personal
            information from children. If you believe a child has created an account, contact support so we can
            remove it.
          </p>
        </section>

        <section className="legal-section">
          <h2>Security</h2>
          <p>
            We use industry-standard safeguards, including encrypted connections and access controls, to help protect
            your information. No online service can guarantee perfect security, so please use a strong, unique
            password and contact us immediately if you suspect unauthorized access to your account.
          </p>
        </section>

        <section className="legal-section">
          <h2>Changes to this policy</h2>
          <p>
            We may update this policy as the marketplace evolves. Material changes will be reflected by updating the
            "Last updated" date above. Continued use of ISMACONNECT after changes take effect means you accept the
            revised policy.
          </p>
        </section>

        <section className="legal-section">
          <h2>Contact us</h2>
          <p>
            Questions about this policy or your personal information can be sent to{" "}
            <a href={`mailto:${SITE_SUPPORT_EMAIL}`}>{SITE_SUPPORT_EMAIL}</a> or through our{" "}
            <a href="/contact">contact page</a>.
          </p>
        </section>
      </div>
    </LegalPage>
  );
}
