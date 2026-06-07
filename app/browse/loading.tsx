import { RouteLoadingShell } from "@/components/ui/route-loading-shell";

export default function BrowseLoading() {
  return (
    <RouteLoadingShell
      eyebrow="Browse"
      title="Local listings"
      message="Loading local listings..."
      variant="feed"
    />
  );
}
