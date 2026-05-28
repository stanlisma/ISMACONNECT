import { RouteLoadingShell } from "@/components/ui/route-loading-shell";

export default function AccountLoading() {
  return (
    <RouteLoadingShell
      eyebrow="Account"
      title="Your account"
      message="Loading your shortcuts, saved activity, and account status..."
    />
  );
}
