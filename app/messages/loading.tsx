import { RouteLoadingShell } from "@/components/ui/route-loading-shell";

export default function MessagesLoading() {
  return (
    <RouteLoadingShell
      eyebrow="Messages"
      title="Messages"
      message="Loading your latest conversations, unread replies, and active chats..."
    />
  );
}
