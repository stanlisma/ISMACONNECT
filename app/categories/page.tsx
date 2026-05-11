import type { Metadata } from "next";
import Link from "next/link";

import { SectionHeading } from "@/components/ui/section-heading";
import { CATEGORIES } from "@/lib/constants";
import { getCategoryLocalContent } from "@/lib/local-marketplace";

export const metadata: Metadata = {
  title: "Fort McMurray marketplace categories",
  description:
    "Explore rentals, ride share, jobs, services, and buy & sell categories built for Fort McMurray shoppers, workers, and local businesses."
};

export default function CategoriesPage() {
  const quickStarts = CATEGORIES.map((category) => {
    const localContent = getCategoryLocalContent(category.value);

    return {
      label: localContent.quickLinks[0]?.label ?? category.label,
      href: localContent.quickLinks[0]?.href ?? category.href
    };
  });

  return (
    <section className="section listing-feed-section">
      <div className="container listing-feed-container">
        <div className="surface category-hub-hero">
          <SectionHeading
            eyebrow="Categories"
            title="Explore the marketplace by local intent"
            description="Open the category you need most."
          />

          <div className="category-hub-actions">
            <Link href="/browse" className="button">
              Browse every listing
            </Link>
            <Link href="/dashboard/listings/new" className="button button-secondary">
              Post a listing
            </Link>
          </div>

          <div className="category-hub-mobile-rail">
            {quickStarts.map((quickStart) => (
              <Link key={quickStart.href} href={quickStart.href} className="category-hub-mobile-chip">
                {quickStart.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="category-hub-grid">
          {CATEGORIES.map((category) => {
            const localContent = getCategoryLocalContent(category.value);

            return (
              <article key={category.value} className="surface category-hub-card">
                <div className="category-hub-card-head">
                  <span className="eyebrow">{category.label}</span>
                  <h2>{category.label}</h2>
                  <p>{localContent.heroDescription}</p>
                </div>

                <div className="category-hub-link-row">
                  {localContent.quickLinks.slice(0, 3).map((link) => (
                    <Link key={link.href} href={link.href} className="category-hub-chip">
                      {link.label}
                    </Link>
                  ))}
                </div>

                <div className="category-hub-footer">
                  <Link href={category.href} className="button button-secondary">
                    Open {category.label}
                  </Link>
                  {localContent.quickLinks[0] ? (
                    <Link href={localContent.quickLinks[0].href} className="button button-ghost">
                      {localContent.quickLinks[0].label}
                    </Link>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
