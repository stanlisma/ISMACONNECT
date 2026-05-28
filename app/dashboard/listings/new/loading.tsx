import { RouteLoadingShell } from "@/components/ui/route-loading-shell";

export default function NewListingLoading() {
  return (
    <RouteLoadingShell
      eyebrow="Post"
      title="New listing"
      message="Preparing a fast posting flow for photos, details, and contact info..."
      variant="form"
    />
  );
}
