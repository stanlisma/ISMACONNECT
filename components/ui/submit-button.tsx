"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";

import { trackMarketplaceEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  pendingLabel?: string;
  analyticsEvent?: string;
  analyticsParams?: Record<string, string | number | boolean | null | undefined>;
}

export function SubmitButton({
  children,
  className,
  analyticsEvent,
  analyticsParams,
  pendingLabel = "Saving...",
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      className={cn("button", className)}
      disabled={pending || props.disabled}
      onClick={(event) => {
        if (analyticsEvent) {
          trackMarketplaceEvent(analyticsEvent, analyticsParams);
        }

        props.onClick?.(event);
      }}
      type={props.type ?? "submit"}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
