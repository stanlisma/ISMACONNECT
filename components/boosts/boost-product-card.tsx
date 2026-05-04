import { SubmitButton } from "@/components/ui/submit-button";
import { startBoostCheckoutAction } from "@/lib/actions/boosts";
import type { BoostProduct } from "@/lib/boost-products";
import { getBoostProductPriceLabel } from "@/lib/boosts";

interface BoostProductCardProps {
  listingId: string;
  product: BoostProduct;
  stripeConfigured: boolean;
  demoModeEnabled: boolean;
}

export function BoostProductCard({
  listingId,
  product,
  stripeConfigured,
  demoModeEnabled
}: BoostProductCardProps) {
  const priceLabel = getBoostProductPriceLabel(product.key);
  const action = startBoostCheckoutAction.bind(null, listingId, product.key);
  const buttonLabel = stripeConfigured ? `Buy for ${priceLabel}` : demoModeEnabled ? "Activate demo boost" : "Stripe setup required";

  return (
    <article className="boost-product-card">
      <div className="boost-product-head">
        <div>
          <span className="boost-product-label">{product.shortLabel}</span>
          <h3>{product.name}</h3>
        </div>

        <div className="boost-product-price">
          <strong>{priceLabel}</strong>
          <span>one-time</span>
        </div>
      </div>

      <p className="boost-product-description">{product.description}</p>
      <p className="boost-product-callout">{product.callout}</p>

      <ul className="boost-product-highlights">
        {product.highlights.map((highlight) => (
          <li key={highlight}>{highlight}</li>
        ))}
      </ul>

      <form action={action}>
        <SubmitButton
          className={stripeConfigured || demoModeEnabled ? "" : "button-secondary"}
          disabled={!stripeConfigured && !demoModeEnabled}
          pendingLabel="Starting checkout..."
        >
          {buttonLabel}
        </SubmitButton>
      </form>
    </article>
  );
}
