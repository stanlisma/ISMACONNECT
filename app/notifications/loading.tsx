import { RouteLoadingShell } from "@/components/ui/route-loading-shell";

export default function NotificationsLoading() {
  return (
    <RouteLoadingShell
      eyebrow="Notifications"
      title="Activity"
      message="Gathering replies, saved-search matches, and account updates..."
    />
  );
}
