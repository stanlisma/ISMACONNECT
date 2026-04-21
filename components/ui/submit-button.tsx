"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  pendingLabel?: string;
}

export function SubmitButton({
  children,
  className,
  pendingLabel = "Saving...",
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      className={cn("button", className)}
      disabled={pending || props.disabled}
      type={props.type ?? "submit"}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
