import { RouteLoadingShell } from "@/components/ui/route-loading-shell";

export default function SettingsLoading() {
  return (
    <RouteLoadingShell
      eyebrow="Settings"
      title="Your settings"
      message="Loading profile, notifications, trust, and install preferences..."
    />
  );
}
