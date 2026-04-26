import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BrowseFilters } from "@/components/listings/browse-filters";
import { ListingCard } from "@/components/listings/listing-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { SetupNotice } from "@/components/ui/setup-notice";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/constants";
import { getPublicListings } from "@/lib/data";
import { getSingleParam, resolveCategory } from "@/lib/utils";

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({
    category: category.value
  }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: categoryParam } = await params;
  const category = resolveCategory(categoryParam);

  if (!category) {
    return {
      title: "Category Not Found"
    };
  }

  return {
    title: CATEGORY_MAP[category].seoTitle,
    description: CATEGORY_MAP[category].description
  };
}

export default async function CategoryPage({
  params,
  searchParams
}: {
  params: { category: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const { category: categoryParam } = await params;
  const category = resolveCategory(categoryParam);

  if (!category) {
    notFound();
  }

  const search = getSingleParam(searchParams?.q);
  const categoryInfo = CATEGORY_MAP[category];
  const minPrice = Number(getSingleParam(searchParams?.minPrice)) || null;
  const maxPrice = Number(getSingleParam(searchParams?.maxPrice)) || null;
  const sort = getSingleParam(searchParams?.sort);
  const subcategory = getSingleParam(searchParams?.subcategory);

  const { listings, isConfigured } = await getPublicListings({
    category,
    subcategory,
    search,
    minPrice,
    maxPrice,
    sort,
    limit: 24
  });

  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Category"
          title={categoryInfo.label}
          description={categoryInfo.description}
        />

        <BrowseFilters actionPath={categoryInfo.href} search={search} showCategorySelect={false} />

        <div className="pill-links">
          <Link className="pill-link" href="/browse">
            All listings
          </Link>
          {CATEGORIES.map((item) => (
            <Link className="pill-link" href={item.href} key={item.value}>
              {item.label}
            </Link>
          ))}
        </div>

        {!isConfigured ? (
          <SetupNotice />
        ) : listings.length === 0 ? (
          <EmptyState
            actionHref="/auth/sign-up"
            actionLabel="Post in this category"
            description={`No ${categoryInfo.label.toLowerCase()} listings are live yet. Add the first one.`}
            title={`No ${categoryInfo.label.toLowerCase()} listings found`}
          />
        ) : (
          <div className="listing-grid" style={{ marginTop: "1.25rem" }}>
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

