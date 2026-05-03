import Link from "next/link";

import { CATEGORIES, SITE_DESCRIPTION, SITE_NAME } from "@/lib/constants";

export function SiteFooter() {
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
            <Link href="/auth/sign-in">My Listings</Link>
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
      </div>
    </footer>
  );
}
