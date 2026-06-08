import { RouteLoadingShell } from "@/components/ui/route-loading-shell";

export default function Loading() {
  return (
    <RouteLoadingShell
      eyebrow="Loading"
      title="Loading page"
      message="Content is loading."
    />
  );
}
