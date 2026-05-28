import { RouteLoadingShell } from "@/components/ui/route-loading-shell";

export default function StorefrontsLoading() {
  return (
    <RouteLoadingShell
      eyebrow="Storefronts"
      title="Storefronts"
      message="Loading your storefront logos, business details, and posting tools..."
      variant="storefront"
    />
  );
}
