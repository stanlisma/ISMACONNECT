import { RouteLoadingShell } from "@/components/ui/route-loading-shell";

export default function ListingLoading() {
  return (
    <RouteLoadingShell
      eyebrow="Listing"
      title="Listing details"
      message="Loading photos, pricing, seller info, and the fastest way to reply..."
      detail
    />
  );
}
