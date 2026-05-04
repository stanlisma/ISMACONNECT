import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { requireViewer } from "@/lib/auth";
import { BOOST_PRODUCTS, getListingBoostState } from "@/lib/boost-products";
import { getBoostListingOverview, getBoostProductPriceLabel } from "@/lib/boosts";
import { formatCurrency, formatDate, getCategoryLabel } from "@/lib/utils";

export default async function DashboardBoostsPage() {
  const viewer = await requireViewer();
  const { listings, orders } = await getBoostListingOverview(viewer.user.id);
  const activeBoostedListings = listings.filter((listing) => {
    const state = getListingBoostState(listing);
    return state.featuredActive || state.urgentActive || state.boostedActive;
  }).length;

  return (
    <div className="stack-md">
      <div className="surface boost-hero-card">
        <span className="eyebrow">Boost Products</span>
        <h2>Promote the listings that matter most this week</h2>
        <p className="section-copy">
          Featured boosts help Fort McMurray rentals, jobs, tools, and urgent ride-share posts rise above standard feed traffic.
        </p>

        <div className="stats-grid boost-stats-grid">
          <div className="stat-card">
            <span>Your listings</span>
            <strong>{listings.length}</strong>
          </div>
          <div className="stat-card">
            <span>Live boosts</span>
            <strong>{activeBoostedListings}</strong>
          </div>
          <div className="stat-card">
            <span>Boost orders</span>
            <strong>{orders.length}</strong>
          </div>
        </div>
      </div>

      <section className="surface">
        <h2 style={{ marginBottom: "0.65rem" }}>Available boost products</h2>
        <p className="section-copy" style={{ marginBottom: "1rem" }}>
          Pick a listing below, then choose the product that fits its urgency and value.
        </p>

        <div className="boost-product-grid">
          {BOOST_PRODUCTS.map((product) => (
            <article key={product.key} className="boost-product-card boost-product-card-static">
              <div className="boost-product-head">
                <div>
                  <span className="boost-product-label">{product.shortLabel}</span>
                  <h3>{product.name}</h3>
                </div>

                <div className="boost-product-price">
                  <strong>{getBoostProductPriceLabel(product.key)}</strong>
                  <span>one-time</span>
                </div>
              </div>

              <p className="boost-product-description">{product.description}</p>
              <p className="boost-product-callout">{product.callout}</p>
            </article>
          ))}
        </div>
      </section>

      {listings.length === 0 ? (
        <EmptyState
          actionHref="/dashboard/listings/new"
          actionLabel="Create a listing first"
          description="You need an active post before you can buy featured placement or boost products."
          title="No listings available to promote"
        />
      ) : (
        <section className="surface">
          <h2 style={{ marginBottom: "0.65rem" }}>Choose a listing to promote</h2>
          <p className="section-copy" style={{ marginBottom: "1rem" }}>
            Open any listing below to manage featured placement, urgent badges, and top-of-feed boosts.
          </p>

          <div className="boost-listing-grid">
            {listings.map((listing) => {
              const boostState = getListingBoostState(listing);

              return (
                <article key={listing.id} className="boost-listing-card">
                  <div className="badge-row">
                    <span className="badge badge-soft">{getCategoryLabel(listing.category)}</span>
                    {boostState.featuredActive ? <span className="badge badge-featured">Featured</span> : null}
                    {boostState.urgentActive ? <span className="badge badge-urgent">Urgent</span> : null}
                    {boostState.boostedActive ? <span className="badge badge-soft">Boosted</span> : null}
                  </div>

                  <h3>{listing.title}</h3>
                  <p className="section-copy">
                    {formatCurrency(listing.price)} â€¢ Posted {formatDate(listing.created_at)}
                  </p>

                  <div className="boost-listing-meta">
                    <span>Location: {listing.location}</span>
                    {listing.featured_until ? <span>Featured until {formatDate(listing.featured_until)}</span> : null}
                    {listing.urgent_until ? <span>Urgent until {formatDate(listing.urgent_until)}</span> : null}
                  </div>

                  <Link className="button" href={`/dashboard/listings/${listing.id}/boost`}>
                    Manage boosts
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
