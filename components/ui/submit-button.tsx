"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";

import { trackMarketplaceEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  pendingLabel?: string;
  analyticsEvent?: string;
  analyticsParams?: Record<string, string | number | boolean | null | undefined>;
  forcePending?: boolean;
}

export function SubmitButton({
  children,
  className,
  analyticsEvent,
  analyticsParams,
  forcePending = false,
  pendingLabel = "Saving...",
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const isPending = forcePending || pending;

  return (
    <button
      {...props}
      className={cn("button", className)}
      disabled={isPending || props.disabled}
      onClick={(event) => {
        if (analyticsEvent) {
          trackMarketplaceEvent(analyticsEvent, analyticsParams);
        }

        props.onClick?.(event);
      }}
      type={props.type ?? "submit"}
    >
      {isPending ? pendingLabel : children}
    </button>
  );
}
