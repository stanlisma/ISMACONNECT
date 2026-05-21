import { RouteLoadingShell } from "@/components/ui/route-loading-shell";

export default function MessageThreadLoading() {
  return <RouteLoadingShell eyebrow="Messages" title="Conversation" variant="chat" />;
}
