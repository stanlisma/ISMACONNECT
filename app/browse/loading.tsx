import { RouteLoadingShell } from "@/components/ui/route-loading-shell";

export default function BrowseLoading() {
  return (
    <RouteLoadingShell
      eyebrow="Browse"
      title="Local listings"
      message="Finding local rides, rentals, jobs, services, and storefronts near Fort McMurray..."
      variant="feed"
    />
  );
}
