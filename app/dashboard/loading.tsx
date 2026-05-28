import { RouteLoadingShell } from "@/components/ui/route-loading-shell";

export default function DashboardLoading() {
  return (
    <RouteLoadingShell
      eyebrow="My Listings"
      title="Your listings"
      message="Loading your active posts, boosts, and seller activity..."
      variant="feed"
    />
  );
}
