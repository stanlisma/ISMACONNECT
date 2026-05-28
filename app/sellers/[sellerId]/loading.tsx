import { RouteLoadingShell } from "@/components/ui/route-loading-shell";

export default function SellerStorefrontLoading() {
  return (
    <RouteLoadingShell
      eyebrow="Storefront"
      title="Local business"
      message="Loading business details, reviews, and active local offerings..."
      variant="storefront"
    />
  );
}
