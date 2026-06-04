import type { Metadata } from "next";
import Link from "next/link";

import { StorefrontDirectoryCard } from "@/components/storefronts/storefront-directory-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { SetupNotice } from "@/components/ui/setup-notice";
import { CATEGORIES, HERO_CATEGORY_VALUES } from "@/lib/constants";
import { getPublicBusinessStorefrontDirectory } from "@/lib/data";
import { getSellerTrustSummaryMap } from "@/lib/trust";
import { buildPathWithQuery, getCategoryLabel, getSingleParam, resolveCategory } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Browse Local Businesses",
  description:
    "Explore Fort McMurray business storefronts for local services, rentals, rides, and jobs on ISMACONNECT."
};

export default async function BusinessesPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const category = resolveCategory(getSingleParam(resolvedSearchParams?.category));
  const { isConfigured, schemaReady, storefronts } = await getPublicBusinessStorefrontDirectory({
    category,
    limit: 48
  });
  const trustMap = await getSellerTrustSummaryMap(storefronts.map((item) => item.owner_id));
  const availableCategories = HERO_CATEGORY_VALUES;

  return (
    <section className="section">
      <div className="container">
        <div className="storefront-directory-page-header">
          <SectionHeading
            eyebrow="Local businesses"
            title={category ? `${getCategoryLabel(category)} storefronts` : "Browse local business storefronts"}
            description="Discover local operators, open a storefront, and message with more confidence."
          />

          <div className="storefront-directory-filter-row">
            <Link
              href="/businesses"
              className={`seller-storefront-category-pill${!category ? " is-active" : ""}`}
            >
              <span>All businesses</span>
            </Link>
            {availableCategories.map((value) => (
              <Link
                key={value}
                href={buildPathWithQuery("/businesses", { category: value })}
                className={`seller-storefront-category-pill${category === value ? " is-active" : ""}`}
              >
                <span>{CATEGORIES.find((item) => item.value === value)?.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {!isConfigured ? (
          <SetupNotice />
        ) : !schemaReady ? (
          <EmptyState
            title="Business storefronts need one more setup step"
            description="Run the storefront migration in Supabase, then refresh to open the public business directory."
          />
        ) : storefronts.length ? (
          <div className="storefront-directory-grid">
            {storefronts.map((storefront) => (
              <StorefrontDirectoryCard
                key={storefront.storefront_id}
                storefront={storefront}
                trustSummary={trustMap.get(storefront.owner_id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            eyebrow="Open a storefront"
            title={category ? `No ${getCategoryLabel(category).toLowerCase()} storefronts yet` : "No business storefronts yet"}
            description={
              category
                ? "No storefronts in this category are live yet. Be the first local operator to show services, hours, and contact details here."
                : "No public storefronts are live yet. Open one so locals can trust who they are messaging before the first listing even goes live."
            }
            actionHref="/dashboard/storefronts"
            actionLabel="Create storefront"
            secondaryActionHref={category ? `/browse?category=${category}` : "/browse?category=services"}
            secondaryActionLabel={category ? `Browse ${getCategoryLabel(category)}` : "Browse local services"}
            tips={[
              "Add service areas and business hours so people can judge fit quickly.",
              "A storefront can earn trust before you publish your first listing."
            ]}
          />
        )}
      </div>
    </section>
  );
}
