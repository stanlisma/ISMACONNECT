import { RouteLoadingShell } from "@/components/ui/route-loading-shell";

export default function Loading() {
  return (
    <RouteLoadingShell
      eyebrow="Loading"
      title="ISMACONNECT"
      message="Finding local rides, rentals, jobs, services, and businesses near Fort McMurray..."
    />
  );
}
