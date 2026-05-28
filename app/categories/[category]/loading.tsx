import { RouteLoadingShell } from "@/components/ui/route-loading-shell";

export default function CategoryLoading() {
  return (
    <RouteLoadingShell
      eyebrow="Category"
      title="Category listings"
      message="Pulling in the latest matches, shortcuts, and map-ready results for this category..."
      variant="feed"
    />
  );
}
