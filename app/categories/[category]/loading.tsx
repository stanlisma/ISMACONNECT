import { RouteLoadingShell } from "@/components/ui/route-loading-shell";

export default function CategoryLoading() {
  return (
    <RouteLoadingShell
      eyebrow="Loading"
      title="Loading listings"
      message="Listings are loading."
      variant="feed"
    />
  );
}
