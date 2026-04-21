import { cn } from "@/lib/utils";

interface FlashMessageProps {
  tone: "error" | "success";
  message?: string;
}

export function FlashMessage({ tone, message }: FlashMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <div className={cn("flash-message", tone === "error" ? "flash-error" : "flash-success")}>
      {message}
    </div>
  );
}

