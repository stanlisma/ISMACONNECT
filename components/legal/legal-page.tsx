import Link from "next/link";
import type { ReactNode } from "react";

type LegalPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  lastUpdated?: string;
};

export function LegalPage({ eyebrow, title, description, children, lastUpdated }: LegalPageProps) {
  return (
    <section className="section legal-page">
      <div className="container legal-page-container">
        <div className="surface legal-hero">
          <div className="legal-hero-copy">
            <span className="eyebrow">{eyebrow}</span>
            <h1 className="section-title">{title}</h1>
            <p className="section-copy">{description}</p>
          </div>

          <div className="legal-hero-meta">
            {lastUpdated ? (
              <div className="legal-meta-card">
                <span>Last updated</span>
                <strong>{lastUpdated}</strong>
              </div>
            ) : null}

            <div className="legal-meta-card">
              <span>Need help?</span>
              <Link href="/contact">Contact support</Link>
            </div>
          </div>
        </div>

        <div className="surface legal-content">{children}</div>
      </div>
    </section>
  );
}
