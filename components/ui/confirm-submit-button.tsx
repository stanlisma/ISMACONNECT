"use client";

import type { ButtonHTMLAttributes } from "react";

import { SubmitButton } from "@/components/ui/submit-button";

type ConfirmSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  confirmMessage: string;
  pendingLabel?: string;
};

export function ConfirmSubmitButton({
  confirmMessage,
  onClick,
  pendingLabel,
  ...props
}: ConfirmSubmitButtonProps) {
  return (
    <SubmitButton
      {...props}
      pendingLabel={pendingLabel}
      onClick={(event) => {
        if (typeof window !== "undefined" && !window.confirm(confirmMessage)) {
          event.preventDefault();
          return;
        }

        onClick?.(event);
      }}
    />
  );
}
