import Link from "next/link";
import { notFound } from "next/navigation";

import { BoostProductCard } from "@/components/boosts/boost-product-card";
import { FlashMessage } from "@/components/ui/flash-message";
import { requireViewer } from "@/lib/auth";
import { BOOST_PRODUCTS, getListingBoostState } from "@/lib/boost-products";
import { getListingBoostOrders } from "@/lib/boosts";
import { isStripeConfigured, canUseDemoPayments } from "@/lib/env";
import { getEditableListing } from "@/lib/data";
import { formatCurrency, formatDate, getCategoryLabel, getSingleParam } from "@/lib/utils";

export default async function ListingBoostPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const viewer = await requireViewer();
  const listing = await getEditableListing(id);

  if (!listing || listing.owner_id !== viewer.user.id) {
    notFound();
  }

  const orders = await getListingBoostOrders(listing.id, viewer.user.id);
  const boostState = getListingBoostState(listing);
  const stripeReady = isStripeConfigured();
  const demoModeEnabled = !stripeReady && canUseDemoPayments();

  return (
    <div className="stack-md">
      <FlashMessage message={getSingleParam(resolvedSearchParams?.success)} tone="success" />
      <FlashMessage message={getSingleParam(resolvedSearchParams?.error)} tone="error" />

      <div className="surface boost-hero-card">
        <div className="badge-row">
          <span className="badge badge-soft">{getCategoryLabel(listing.category)}</span>
          {boostState.featuredActive ? <span className="badge badge-featured">Featured</span> : null}
          {boostState.urgentActive ? <span className="badge badge-urgent">Urgent</span> : null}
          {boostState.boostedActive ? <span className="badge badge-soft">Boosted</span> : null}
        </div>

        <h2>{listing.title}</h2>
        <p className="section-copy">
          {formatCurrency(listing.price)} â€¢ {listing.location} â€¢ Posted {formatDate(listing.created_at)}
        </p>

        <div className="boost-status-grid">
          <div className="boost-status-card">
            <span>Featured</span>
            <strong>{boostState.featuredActive ? "Live" : "Off"}</strong>
            <small>{listing.featured_until ? `Until ${formatDate(listing.featured_until)}` : "Not active"}</small>
          </div>
          <div className="boost-status-card">
            <span>Top Boost</span>
            <strong>{boostState.boostedActive ? "Live" : "Off"}</strong>
            <small>{listing.boosted_until ? `Until ${formatDate(listing.boosted_until)}` : "Not active"}</small>
          </div>
          <div className="boost-status-card">
            <span>Urgent</span>
            <strong>{boostState.urgentActive ? "Live" : "Off"}</strong>
            <small>{listing.urgent_until ? `Until ${formatDate(listing.urgent_until)}` : "Not active"}</small>
          </div>
        </div>

        <div className="action-row">
          <Link href={`/listings/${listing.slug}`} className="button button-secondary">
            View public listing
          </Link>
          <Link href="/dashboard/boosts" className="button button-secondary">
            All boost products
          </Link>
        </div>
      </div>

      {!stripeReady ? (
        <div className="surface boost-runtime-note">
          <h3 style={{ marginTop: 0 }}>Checkout mode</h3>
          <p className="section-copy" style={{ marginBottom: 0 }}>
            {demoModeEnabled
              ? "Stripe keys are not configured, so boost purchases run in local demo mode and activate instantly."
              : "Stripe keys are not configured in this environment yet. Add your Stripe keys to accept live payments."}
          </p>
        </div>
      ) : null}

      <section className="surface">
        <h2 style={{ marginBottom: "0.65rem" }}>Choose a product</h2>
        <p className="section-copy" style={{ marginBottom: "1rem" }}>
          Each purchase is one-time and can stack on top of an already active boost window.
        </p>

        <div className="boost-product-grid">
          {BOOST_PRODUCTS.map((product) => (
            <BoostProductCard
              key={product.key}
              listingId={listing.id}
              product={product}
              stripeConfigured={stripeReady}
              demoModeEnabled={demoModeEnabled}
            />
          ))}
        </div>
      </section>

      <section className="surface">
        <h2 style={{ marginBottom: "0.65rem" }}>Recent boost activity</h2>
        {orders.length ? (
          <div className="boost-orders-list">
            {orders.map((order) => (
              <article key={order.id} className="boost-order-row">
                <div>
                  <h3>{order.product_name}</h3>
                  <p className="section-copy">
                    {formatDate(order.created_at)} â€¢ {order.provider.toUpperCase()} â€¢ {order.currency.toUpperCase()}{" "}
                    {(order.amount_cents / 100).toFixed(2)}
                  </p>
                </div>

                <div className="boost-order-meta">
                  <span className={`badge ${order.status === "active" ? "badge-featured" : "badge-soft"}`}>
                    {order.status}
                  </span>
                  {order.expires_at ? <span>Expires {formatDate(order.expires_at)}</span> : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="section-copy" style={{ marginBottom: 0 }}>
            No boost orders yet for this listing.
          </p>
        )}
      </section>
    </div>
  );
}
