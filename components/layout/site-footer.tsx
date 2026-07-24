import Link from "next/link";

import { CATEGORIES, SITE_DESCRIPTION, SITE_NAME, SITE_SUPPORT_EMAIL } from "@/lib/constants";

interface SiteFooterProps {
  viewer?: boolean;
}

export function SiteFooter({ viewer = false }: SiteFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <h3>{SITE_NAME}</h3>
          <p>{SITE_DESCRIPTION}</p>
        </div>

        <div>
          <h4>Marketplace</h4>
          <div className="footer-links">
            <Link href="/browse">Browse listings</Link>
            <Link href="/auth/sign-up">Create an account</Link>
            <Link href={viewer ? "/dashboard" : "/auth/sign-in"}>My Listings</Link>
          </div>
        </div>

        <div>
          <h4>Categories</h4>
          <div className="footer-links">
            {CATEGORIES.map((category) => (
              <Link href={category.href} key={category.value}>
                {category.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h4>Trust & Support</h4>
          <div className="footer-links">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Use</Link>
            <Link href="/safety">Safety Tips</Link>
            <Link href="/contact">Contact Support</Link>
            <a href={`mailto:${SITE_SUPPORT_EMAIL}`}>{SITE_SUPPORT_EMAIL}</a>
          </div>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>
          © {currentYear} {SITE_NAME}. All rights reserved. Fort McMurray, AB.
        </p>
      </div>
    </footer>
  );
}
