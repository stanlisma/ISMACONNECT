import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { getViewer } from "@/lib/auth";
import { CATEGORY_MAP } from "@/lib/constants";
import { getRemovedListingContext } from "@/lib/data";
import { getSingleParam } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Listing no longer available",
  robots: {
    index: false,
    follow: false
  }
};

export default async function ListingUnavailablePage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const slug = getSingleParam(resolvedSearchParams?.slug);

  const [viewer, context] = await Promise.all([
    getViewer(),
    slug ? getRemovedListingContext(slug) : Promise.resolve(null)
  ]);

  const category = context?.category ? CATEGORY_MAP[context.category] : null;
  const showSellerLink = Boolean(context?.ownerId && context.hasActiveListings);
  const postHref = viewer ? "/dashboard/listings/new" : "/auth/sign-up";
  const searchHref = category?.href ?? "/browse";

  return (
    <section className="section">
      <div className="container">
        <div className="empty-state">
          <span className="eyebrow">Listing unavailable</span>
          <h3>This listing is no longer available.</h3>
          <p>
            It may have been filled, removed by its owner, or taken down for not meeting our posting guidelines.
            Here&apos;s where to go next.
          </p>

          <form action={searchHref} className="home-hero-search" style={{ margin: "1.25rem 0" }}>
            <label className="home-hero-search-field">
              <Search aria-hidden="true" className="home-hero-search-icon" strokeWidth={2.2} />
              <input
                name="q"
                placeholder={category ? `Search ${category.label.toLowerCase()}` : "Search Fort McMurray listings"}
                aria-label="Search this category"
              />
            </label>
            <button type="submit" className="button home-hero-search-submit">
              Search
            </button>
          </form>

          <div className="empty-state-actions">
            <Link className="button button-secondary" href={category?.href ?? "/browse"}>
              {category ? `Browse ${category.label.toLowerCase()}` : "Browse similar listings"}
            </Link>
            <Link className="button button-ghost" href={postHref}>
              Post what you need
            </Link>
            {showSellerLink ? (
              <Link className="button button-ghost" href={`/sellers/${context!.ownerId}`}>
                See this seller&apos;s other listings
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
