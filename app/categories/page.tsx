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
  return (
    <section className="section listing-feed-section">
      <div className="container listing-feed-container">
        <div className="surface category-hub-hero">
          <SectionHeading
            eyebrow="Categories"
            title="Explore the marketplace by local intent"
            description="ISMACONNECT is organized around the categories Fort McMurray residents actually use every week: rentals, rides, jobs, services, and local buy & sell."
          />

          <div className="category-hub-actions">
            <Link href="/browse" className="button">
              Browse every listing
            </Link>
            <Link href="/dashboard/listings/new" className="button button-secondary">
              Post a listing
            </Link>
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

                <ul className="category-hub-highlight-list">
                  {localContent.localHighlights.slice(0, 2).map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>

                <div className="category-hub-link-row">
                  {localContent.quickLinks.slice(0, 2).map((link) => (
                    <Link key={link.href} href={link.href} className="category-hub-chip">
                      {link.label}
                    </Link>
                  ))}
                </div>

                <div className="category-hub-footer">
                  <Link href={category.href} className="button button-secondary">
                    Open {category.label}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        <div className="category-guide-grid" style={{ marginTop: "1.5rem" }}>
          <div className="surface category-guide-card">
            <SectionHeading
              eyebrow="Why it feels local"
              title="Built around Fort McMurray behavior"
              description="The category experience is designed around how people here actually search, compare, and message."
            />

            <ul className="category-guide-list">
              <li>Rentals focus on furnished setups, short-term stays, and parking realities.</li>
              <li>Ride share supports camp routes, airport travel, delivery runs, and intercity trips to Edmonton or Calgary.</li>
              <li>Jobs surface shift pattern, work setup, pay band, and ticket expectations earlier.</li>
            </ul>
          </div>

          <div className="surface category-guide-card">
            <SectionHeading
              eyebrow="Quick starts"
              title="Popular ways locals jump in"
              description="If you are just arriving, these entry points usually get people to the right listings faster."
            />

            <div className="category-hub-link-stack">
              <Link href="/categories/rentals?shortTerm=true" className="category-local-link">
                Short-term rentals
              </Link>
              <Link href="/categories/ride-share?subcategory=airport-ride&view=map" className="category-local-link">
                Airport ride map
              </Link>
              <Link href="/categories/jobs?shiftPattern=7-on-7-off" className="category-local-link">
                7 on / 7 off jobs
              </Link>
              <Link href="/categories/services?subcategory=cleaning" className="category-local-link">
                Local cleaning services
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
